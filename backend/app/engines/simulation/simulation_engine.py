import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from backend.app.schemas.simulation import (
    SimulationCreateRequest,
    SimulationRunResponse,
    SimulationEventResponse,
    SimulationStatus,
)
from backend.app.schemas.policy import PolicyResponse, PolicyRuleSchema
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.common import RiskDecisionOutcome, DatasetSplitType
from backend.app.engines.policy.policy_engine import PolicyEngine
from backend.app.engines.attacks.attack_engine import AttackEngine
from backend.app.engines.vulnerability.vulnerability_engine import VulnerabilityEngine
from backend.app.engines.exposure.exposure_engine import ExposureEngine
from backend.app.engines.risk.risk_engine import RiskEvaluationEngine


class SimulationContext:
    def __init__(self, seed: int):
        self.seed = seed
        self.rng = random.Random(seed)


class SimulationExecutionResult:
    def __init__(
        self,
        simulation: SimulationRunResponse,
        transactions: List[Dict[str, Any]],
        events: List[SimulationEventResponse],
        vulnerabilities: List[Any],
        exposure: Any,
        risk_posture: Any
    ):
        self.simulation = simulation
        self.transactions = transactions
        self.events = events
        self.vulnerabilities = vulnerabilities
        self.exposure = exposure
        self.risk_posture = risk_posture


class SimulationEngine:
    """
    Core deterministic simulation orchestrator.
    Generates synthetic entities, executes attack scenarios, and evaluates policies.
    """

    def __init__(self):
        self.policy_engine = PolicyEngine()
        self.attack_engine = AttackEngine()
        self.vulnerability_engine = VulnerabilityEngine()
        self.exposure_engine = ExposureEngine()
        self.risk_engine = RiskEvaluationEngine()

    def run_simulation(
        self,
        request: SimulationCreateRequest,
        policy: PolicyResponse,
        seed: Optional[int] = None,
        run_type: str = "MANUAL",
        simulation_id_override: Optional[str] = None
    ) -> SimulationExecutionResult:
        sim_seed = seed if seed is not None else (request.seed if request.seed is not None else 49201)
        ctx = SimulationContext(sim_seed)

        sim_id = simulation_id_override or f"sim-run-{sim_seed % 10000:04d}"
        
        # Deterministic base simulation timestamp for timeline generation
        base_sim_time_iso = "2026-08-20T10:00:00Z"
        exec_start_time = datetime.now(timezone.utc)

        # 1. Generate Deterministic Synthetic Entity Pool
        entity_pool = self._generate_entity_pool(ctx.rng)

        # 2. Generate Legitimate Traffic
        legit_txns = self._generate_legitimate_transactions(
            sim_id=sim_id,
            count=request.legitimate_transaction_count,
            start_time_iso=base_sim_time_iso,
            rng=ctx.rng,
            entity_pool=entity_pool
        )

        # 3. Generate Adversarial Attack Traffic
        attack_txns: List[Dict[str, Any]] = []
        per_agent_count = max(1, request.attack_transaction_count // max(1, len(request.attack_types)))
        for agent_type in request.attack_types:
            agent_attacks = self.attack_engine.generate_attack_stream(
                simulation_id=sim_id,
                agent_type=agent_type,
                attack_count=per_agent_count,
                start_time_iso=base_sim_time_iso,
                rng=ctx.rng,
                entity_pool=entity_pool
            )
            attack_txns.extend(agent_attacks)

        # 4. Merge and Chronologically Sort All Transactions
        all_txns = legit_txns + attack_txns
        all_txns.sort(key=lambda t: t["created_at_sim"])

        # 5. Evaluate Transactions sequentially against active Policy Rules
        active_version = None
        for v in policy.versions:
            if v.id == policy.current_version_id or v.status.value == "ACTIVE":
                active_version = v
                break
        if not active_version and policy.versions:
            active_version = policy.versions[-1]

        rules: List[PolicyRuleSchema] = active_version.rules if active_version else []

        evaluated_txns: List[Dict[str, Any]] = []
        events: List[SimulationEventResponse] = []
        history: List[Dict[str, Any]] = []

        tp = 0  # Adversarial blocked/flagged
        fn = 0  # Adversarial allowed (bypasses)
        fp = 0  # Legitimate blocked/flagged
        tn = 0  # Legitimate allowed

        for i, txn in enumerate(all_txns):
            # Assign deterministic dataset split
            split_roll = ctx.rng.random()
            if split_roll < 0.70:
                txn["dataset_split"] = DatasetSplitType.DEVELOPMENT.value
            elif split_roll < 0.85:
                txn["dataset_split"] = DatasetSplitType.VALIDATION.value
            else:
                txn["dataset_split"] = DatasetSplitType.HELD_OUT.value

            eval_res = self.policy_engine.evaluate_transaction(txn, rules, history)
            txn["outcome"] = eval_res.outcome
            txn["triggered_rules"] = eval_res.triggered_rules
            txn["decision_reason"] = eval_res.reason

            history.append(txn)
            evaluated_txns.append(txn)

            is_adv = txn.get("is_adversarial", False)
            if is_adv:
                if eval_res.outcome in [RiskDecisionOutcome.BLOCKED, RiskDecisionOutcome.FLAGGED]:
                    tp += 1
                else:
                    fn += 1
            else:
                if eval_res.outcome in [RiskDecisionOutcome.BLOCKED, RiskDecisionOutcome.FLAGGED]:
                    fp += 1
                else:
                    tn += 1

            # Emit milestone events for live/audit streaming
            if is_adv or (i % 200 == 0) or eval_res.outcome == RiskDecisionOutcome.BLOCKED:
                events.append(
                    SimulationEventResponse(
                        id=f"evt-sim-{sim_id}-{len(events)+1}",
                        simulation_id=sim_id,
                        event_type="TRANSACTION_EVALUATED",
                        sequence_num=len(events) + 1,
                        timestamp=exec_start_time.isoformat(),
                        sim_timestamp=txn["created_at_sim"],
                        message=f"Txn {txn['id'][:12]} ({'ADVERSARIAL' if is_adv else 'ORGANIC'} ₹{txn['amount']:.2f}) -> {eval_res.outcome.value}",
                        metadata={
                            "amount": txn["amount"],
                            "is_adversarial": is_adv,
                            "outcome": eval_res.outcome.value,
                            "triggered_rules": eval_res.triggered_rules
                        }
                    )
                )

        # 6. Analyze Vulnerabilities and Exposure
        vulnerabilities = self.vulnerability_engine.analyze_simulation_results(
            simulation_id=sim_id,
            policy_id=policy.id,
            policy_name=policy.name,
            policy_version_number=policy.current_version_number,
            evaluated_transactions=evaluated_txns,
            active_rules=rules,
            dataset_split="HELD_OUT",
            seed=seed
        )

        exposure_res = self.exposure_engine.calculate_exposure(evaluated_txns)

        # Metrics calculation
        total_adv = tp + fn
        total_legit = fp + tn
        recall = (tp / total_adv * 100.0) if total_adv > 0 else 0.0
        fpr = (fp / total_legit * 100.0) if total_legit > 0 else 0.0
        asr = (fn / total_adv * 100.0) if total_adv > 0 else 0.0

        risk_res = self.risk_engine.compute_risk_posture(
            detection_recall=round(recall, 1),
            false_positive_rate=round(fpr, 1),
            attack_success_rate=round(asr, 1),
            simulated_exposure=exposure_res.total_exposure
        )

        exec_end_time = datetime.now(timezone.utc)
        duration_sec = round((exec_end_time - exec_start_time).total_seconds() + 0.1, 2)

        sim_response = SimulationRunResponse(
            id=sim_id,
            merchant_id=policy.merchant_id,
            policy_id=policy.id,
            policy_version_id=policy.current_version_id,
            policy_name=policy.name,
            policy_version_number=policy.current_version_number,
            seed=sim_seed,
            status=SimulationStatus.COMPLETED,
            run_type=run_type,
            started_at=base_sim_time_iso,
            completed_at=exec_end_time.isoformat(),
            duration_seconds=duration_sec,
            total_transactions=len(evaluated_txns),
            legitimate_transactions_count=len(legit_txns),
            attack_transactions_count=len(attack_txns),
            attacks_attempted=len(attack_txns),
            bypasses_found=fn,
            simulated_exposure=exposure_res.total_exposure,
            detection_recall=round(recall, 1),
            false_positive_rate=round(fpr, 1),
            events_processed=len(evaluated_txns),
            active_agents=request.attack_types
        )

        return SimulationExecutionResult(
            simulation=sim_response,
            transactions=evaluated_txns,
            events=events,
            vulnerabilities=vulnerabilities,
            exposure=exposure_res,
            risk_posture=risk_res
        )

    def _generate_entity_pool(self, rng: random.Random) -> Dict[str, List[Dict[str, Any]]]:
        # Generate 20 Accounts, 10 Devices, 15 IPs, 10 Addresses, 12 Instruments
        accounts = [{"id": f"acc-syn-{uuid.UUID(int=rng.getrandbits(128))}"} for _ in range(20)]
        devices = [{"id": f"DEV-{rng.randint(1000, 9999)}-FP{rng.randint(10, 99)}"} for _ in range(10)]
        ips = [{"id": f"10.244.{rng.randint(1, 254)}.{rng.randint(1, 254)}"} for _ in range(15)]
        addresses = [{"id": f"addr-hash-{rng.randint(1000, 9999)}"} for _ in range(10)]
        instruments = [{"id": f"XXXX-XXXX-XXXX-{rng.randint(1000, 9999)}"} for _ in range(12)]

        return {
            "accounts": accounts,
            "devices": devices,
            "ips": ips,
            "addresses": addresses,
            "payment_instruments": instruments,
        }

    def _generate_legitimate_transactions(
        self,
        sim_id: str,
        count: int,
        start_time_iso: str,
        rng: random.Random,
        entity_pool: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        legit: List[Dict[str, Any]] = []
        base_time = datetime.fromisoformat(start_time_iso.replace("Z", "+00:00"))

        accounts = entity_pool["accounts"]
        devices = entity_pool["devices"]
        ips = entity_pool["ips"]
        addresses = entity_pool["addresses"]
        instruments = entity_pool["payment_instruments"]

        for i in range(count):
            acc = accounts[rng.randint(0, len(accounts) - 1)]["id"]
            dev = devices[rng.randint(0, len(devices) - 1)]["id"]
            ip = ips[rng.randint(0, len(ips) - 1)]["id"]
            addr = addresses[rng.randint(0, len(addresses) - 1)]["id"]
            inst = instruments[rng.randint(0, len(instruments) - 1)]["id"]

            offset_seconds = i * 25 + rng.randint(0, 10)
            sim_dt = base_time + timedelta(seconds=offset_seconds)
            amount = float(rng.randint(200, 18000))

            txn_id = f"txn-leg-{uuid.UUID(int=rng.getrandbits(128))}"
            legit.append({
                "id": txn_id,
                "simulation_id": sim_id,
                "account_id": acc,
                "device_id": dev,
                "ip_id": ip,
                "address_id": addr,
                "payment_instrument_id": inst,
                "amount": amount,
                "created_at_sim": sim_dt.isoformat(),
                "is_adversarial": False,
                "attack_type": None,
            })

        return legit
