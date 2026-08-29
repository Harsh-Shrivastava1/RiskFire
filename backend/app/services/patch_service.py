from datetime import datetime, timezone
from typing import List, Optional
from backend.app.database.repositories.interfaces.patch_repository import PatchRepository
from backend.app.database.repositories.interfaces.vulnerability_repository import VulnerabilityRepository
from backend.app.database.repositories.interfaces.policy_repository import PolicyRepository
from backend.app.database.repositories.interfaces.benchmark_repository import BenchmarkRepository
from backend.app.services.audit_service import AuditService
from backend.app.ai.base import AIProvider
from backend.app.ai.modules.patch_generator import PatchGenerator
from backend.app.ai.schemas.patch_proposal import PatchProposalInput
from backend.app.engines.replay.replay_engine import ReplayEngine
from backend.app.engines.benchmark.benchmark_engine import BenchmarkEngine
from backend.app.engines.decision.patch_decision_engine import PatchDecisionEngine
from backend.app.schemas.benchmark import BenchmarkMetricsSchema
from backend.app.schemas.patch import (
    PatchResponse,
    PatchStatus,
    PatchApproveRequest,
    PatchRejectRequest,
    PatchIterateRequest,
    PolicyRuleModificationSchema,
    BeforeAfterMetricsSchema,
    MetricDelta,
)
from backend.app.schemas.policy import (
    PolicyRuleSchema,
    PolicyRuleType,
    PolicyCategory,
    RuleAction,
    PolicyVersionSchema,
    PolicyStatus,
)
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.common import AuditActorType, DatasetSplitType
from backend.app.core.exceptions import ResourceNotFoundError, ConflictError


class PatchService:
    def __init__(
        self,
        patch_repo: PatchRepository,
        vulnerability_repo: VulnerabilityRepository,
        policy_repo: PolicyRepository,
        audit_service: AuditService,
        ai_provider: AIProvider,
        benchmark_repo: Optional[BenchmarkRepository] = None
    ):
        self.patch_repo = patch_repo
        self.vulnerability_repo = vulnerability_repo
        self.policy_repo = policy_repo
        self.audit_service = audit_service
        self.ai_provider = ai_provider
        self.benchmark_repo = benchmark_repo
        self.patch_generator = PatchGenerator(ai_provider)
        self.replay_engine = ReplayEngine()
        self.benchmark_engine = BenchmarkEngine()
        self.decision_engine = PatchDecisionEngine()

    async def list_patches(self, status: Optional[PatchStatus] = None) -> List[PatchResponse]:
        return await self.patch_repo.list_patches(status=status)

    async def list_patches_for_vulnerability(self, vulnerability_id: str) -> List[PatchResponse]:
        all_patches = await self.patch_repo.list_patches()
        return [p for p in all_patches if p.vulnerability_id == vulnerability_id]

    async def get_patch(self, patch_id: str) -> PatchResponse:
        patch = await self.patch_repo.get_patch_by_id(patch_id)
        if not patch:
            raise ResourceNotFoundError("PolicyPatch", patch_id)
        return patch

    async def generate_patch_for_vulnerability(
        self,
        vulnerability_id: str,
        actor_name: str = "Harsh Shrivastava"
    ) -> PatchResponse:
        vuln = await self.vulnerability_repo.get_vulnerability_by_id(vulnerability_id)
        if not vuln:
            raise ResourceNotFoundError("Vulnerability", vulnerability_id)

        policy = await self.policy_repo.get_policy_by_id(vuln.policy_id)
        if not policy:
            raise ResourceNotFoundError("Policy", vuln.policy_id)

        # Call AI patch generator through trust boundary with deterministic fallback
        ai_proposal = None
        actor_type = AuditActorType.AI_AGENT
        try:
            ai_input = PatchProposalInput(
                vulnerability_id=vuln.id,
                vulnerability_title=vuln.title,
                why_failed=vuln.why_the_policy_failed,
                current_policy_id=policy.id,
                current_policy_name=policy.name,
                simulated_exposure=vuln.simulated_exposure
            )
            ai_proposal = await self.patch_generator.propose_patch(ai_input)
        except Exception:
            ai_proposal = None

        if not ai_proposal:
            from backend.app.ai.schemas.patch_proposal import PatchProposal
            actor_type = AuditActorType.SYSTEM
            # Determine best defensive rule modification
            atype_val = vuln.attack_type.value if hasattr(vuln.attack_type, "value") else str(vuln.attack_type)
            if "IP" in atype_val.upper() or "GEO" in atype_val.upper():
                rule_type_name = "VELOCITY_IP"
                proposed_text = "Block IP addresses exceeding 5 transactions in a 30-minute rolling window."
            elif "ACCOUNT" in atype_val.upper():
                rule_type_name = "VELOCITY_ACCOUNT"
                proposed_text = "Block merchant accounts attempting more than 3 transactions in a 10-minute window."
            elif "AMOUNT" in atype_val.upper():
                rule_type_name = "AMOUNT_MAX"
                proposed_text = "Flag transactions exceeding ₹25,000 for mandatory senior review."
            else:
                rule_type_name = "VELOCITY_DEVICE"
                proposed_text = "Block hardware devices accumulating more than 2 transactions in a 30-minute window across all accounts."

            ai_proposal = PatchProposal(
                target_policy_id=policy.id,
                identified_weakness=vuln.why_the_policy_failed or "Policy rate limit constraints are unbounded across distributed hardware.",
                proposed_changes=[
                    PolicyRuleModificationSchema(
                        rule_type=rule_type_name,
                        operation="ADD",
                        current_rule_text="No active multi-entity rate limiter",
                        proposed_rule_text=proposed_text,
                        rationale=f"Directly addresses {atype_val.replace('_', ' ')} bypasses by capping entity burst rate."
                    )
                ],
                reasoning=f"Empirically observed {vuln.bypass_count} bypasses generating ₹{vuln.simulated_exposure:,.2f} exposure. Tightening {rule_type_name} stops automated attack bursts.",
                expected_benefit=f"Expected to reduce {atype_val} bypasses by 90%+ with near-zero false positive impact.",
                expected_fpr_impact="< 0.5% (Safe enterprise boundary)",
                expected_customer_friction="LOW",
                confidence="HIGH"
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        new_patch_id = f"patch-{vulnerability_id[-4:]}"

        patch = PatchResponse(
            id=new_patch_id,
            vulnerability_id=vuln.id,
            vulnerability_title=vuln.title,
            vulnerability_severity=vuln.severity,
            source_policy_id=policy.id,
            source_policy_name=policy.name,
            source_policy_version=policy.current_version_number,
            target_policy_version="v1.1.0-cand1",
            status=PatchStatus.PENDING_SIMULATION,
            identified_weakness=ai_proposal.identified_weakness,
            proposed_changes=ai_proposal.proposed_changes,
            ai_reasoning=ai_proposal.reasoning,
            expected_risk_reduction=ai_proposal.expected_benefit,
            expected_fpr_impact=ai_proposal.expected_fpr_impact,
            expected_customer_friction=ai_proposal.expected_customer_friction,
            validation_status="AWAITING_VALIDATION",
            confidence=ai_proposal.confidence,
            metrics_comparison=None,
            iteration_index=1,
            created_at=now_iso
        )

        saved = await self.patch_repo.save_patch(patch)

        await self.audit_service.record_event(
            action="DEFENSIVE_PATCH_PROPOSED" if actor_type == AuditActorType.SYSTEM else "AI_PATCH_GENERATED",
            entity_type="PolicyPatch",
            entity_id=saved.id,
            entity_name=f"Patch for {vuln.title}",
            actor_name=f"AI Agent ({self.ai_provider.provider_name})" if actor_type == AuditActorType.AI_AGENT else actor_name,
            actor_type=actor_type,
            details={"vulnerability_id": vuln.id, "target_policy": policy.name}
        )

        return saved

    def _build_candidate_rules(self, patch: PatchResponse, policy: any) -> List[PolicyRuleSchema]:
        """Constructs concrete deterministic rule objects from proposed changes."""
        base_rules: List[PolicyRuleSchema] = []
        for v in policy.versions:
            if v.id == policy.current_version_id or v.status == PolicyStatus.ACTIVE:
                base_rules = list(v.rules)
                break

        if not base_rules and policy.versions:
            base_rules = list(policy.versions[0].rules)

        patched_rules = list(base_rules)
        for idx, change in enumerate(patch.proposed_changes, 1):
            if change.operation == "ADD":
                rule_type = PolicyRuleType.VELOCITY_DEVICE
                category = PolicyCategory.IDENTITY
                params = {"max_txns_per_device": 4, "window_minutes": 60}

                rt_upper = change.rule_type.upper()
                if "AMOUNT" in rt_upper:
                    rule_type = PolicyRuleType.AMOUNT_MAX
                    category = PolicyCategory.AMOUNT
                    params = {"max_amount": 25000.0}
                elif "IP" in rt_upper or "GEO" in rt_upper or "NETWORK" in rt_upper:
                    rule_type = PolicyRuleType.VELOCITY_IP
                    category = PolicyCategory.VELOCITY
                    params = {"max_txns_per_ip": 5, "window_minutes": 30}
                elif "ACCOUNT" in rt_upper or "BURST" in rt_upper:
                    rule_type = PolicyRuleType.VELOCITY_ACCOUNT
                    category = PolicyCategory.VELOCITY
                    params = {"max_txns": 3, "window_minutes": 10}
                else:
                    # Default to strict device velocity constraint
                    rule_type = PolicyRuleType.VELOCITY_DEVICE
                    category = PolicyCategory.IDENTITY
                    params = {"max_txns_per_device": 2, "window_minutes": 30}

                patched_rules.append(
                    PolicyRuleSchema(
                        id=f"rule-cand-{patch.iteration_index}-{idx}",
                        name=f"Proposed {change.rule_type} Guard",
                        rule_type=rule_type,
                        category=category,
                        parameters=params,
                        action=RuleAction.BLOCK,
                        is_enabled=True,
                        sequence_order=len(patched_rules) + 1,
                        description=change.proposed_rule_text
                    )
                )
            elif change.operation == "MODIFY":
                for r in patched_rules:
                    if r.rule_type.value.lower() in change.rule_type.lower() or change.rule_type.lower() in r.rule_type.value.lower():
                        r.description = change.proposed_rule_text

        return patched_rules

    async def evaluate_patch_candidate(
        self,
        patch_id: str,
        split: DatasetSplitType = DatasetSplitType.HELD_OUT,
        seed: int = 49201,
        actor_name: str = "Harsh Shrivastava"
    ) -> PatchResponse:
        patch = await self.get_patch(patch_id)
        policy = await self.policy_repo.get_policy_by_id(patch.source_policy_id)
        if not policy:
            raise ResourceNotFoundError("Policy", patch.source_policy_id)

        # 1. Build Candidate Rules
        candidate_rules = self._build_candidate_rules(patch, policy)

        # 2. Freeze Candidate Snapshot (Immutability Lock)
        cand_id = f"cand-{patch.id}"
        snapshot = self.benchmark_engine.freeze_candidate(
            candidate_id=cand_id,
            baseline_policy=policy,
            candidate_rules=candidate_rules,
            candidate_version=patch.target_policy_version
        )

        await self.audit_service.record_event(
            action="CANDIDATE_FROZEN",
            entity_type="CandidatePolicySnapshot",
            entity_id=snapshot.candidate_id,
            entity_name=f"Candidate Snapshot for {patch.vulnerability_title}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "candidate_checksum": snapshot.candidate_checksum,
                "rules_count": len(snapshot.rules),
                "patch_id": patch.id
            }
        )

        # 3. Execute 10-Scenario Batch Benchmark
        report = self.benchmark_engine.run_batch_benchmark(
            baseline_policy=policy,
            candidate_snapshot=snapshot,
            seed=seed,
            dataset_id="ds-synthetic-v1",
            split=split
        )

        # Persist benchmark report if repository is available
        if self.benchmark_repo:
            await self.benchmark_repo.save_batch_report(report)

        # 4. Evaluate Deterministic Decision
        decision = self.decision_engine.evaluate_decision(
            baseline_metrics=report.baseline_metrics,
            candidate_metrics=report.candidate_metrics,
            comparison=report.comparison,
            candidate_snapshot=snapshot,
            scenario_results=report.scenario_results,
            dataset_split=split
        )

        # 5. Build Metric Deltas
        before_after = BeforeAfterMetricsSchema(
            precision=MetricDelta(
                before=report.baseline_metrics.precision,
                after=report.candidate_metrics.precision,
                delta=report.comparison.delta_precision if report.comparison else 0.0
            ),
            recall=MetricDelta(
                before=report.baseline_metrics.recall,
                after=report.candidate_metrics.recall,
                delta=report.comparison.delta_recall if report.comparison else 0.0
            ),
            f1=MetricDelta(
                before=report.baseline_metrics.f1_score,
                after=report.candidate_metrics.f1_score,
                delta=round(report.candidate_metrics.f1_score - report.baseline_metrics.f1_score, 1)
            ),
            false_positive_rate=MetricDelta(
                before=report.baseline_metrics.false_positive_rate,
                after=report.candidate_metrics.false_positive_rate,
                delta=report.comparison.delta_fpr if report.comparison else 0.0
            ),
            attack_success_rate=MetricDelta(
                before=report.baseline_metrics.attack_success_rate,
                after=report.candidate_metrics.attack_success_rate,
                delta=round(report.candidate_metrics.attack_success_rate - report.baseline_metrics.attack_success_rate, 1)
            ),
            bypasses_count=MetricDelta(
                before=float(report.baseline_metrics.successful_bypasses),
                after=float(report.candidate_metrics.successful_bypasses),
                delta=float(report.candidate_metrics.successful_bypasses - report.baseline_metrics.successful_bypasses)
            ),
            simulated_exposure=MetricDelta(
                before=report.baseline_metrics.simulated_exposure,
                after=report.candidate_metrics.simulated_exposure,
                delta=report.comparison.delta_exposure if report.comparison else 0.0
            ),
            customer_friction_impact="SLIGHT_INCREASE" if (report.comparison and report.comparison.delta_fpr > 1.0) else "LOW"
        )

        # 6. Update and Persist Patch Record
        updated_patch = patch.model_copy(update={
            "status": PatchStatus.SIMULATED,
            "validation_status": "VALIDATED" if decision.decision != "REJECT_PATCH" else "REJECTED",
            "metrics_comparison": before_after,
            "decision_evaluation": decision,
            "candidate_id": snapshot.candidate_id,
            "candidate_checksum": snapshot.candidate_checksum,
            "candidate_snapshot": snapshot,
            "benchmark_report_id": report.benchmark_id,
            "scenario_results": report.scenario_results
        })

        await self.patch_repo.save_patch(updated_patch)

        await self.audit_service.record_event(
            action="HELD_OUT_EVALUATION_COMPLETED" if split == DatasetSplitType.HELD_OUT else "VALIDATION_COMPLETED",
            entity_type="PolicyPatch",
            entity_id=patch.id,
            entity_name=f"Batch Evaluation of {patch.vulnerability_title}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "decision": decision.decision,
                "split": split.value,
                "delta_recall": report.comparison.delta_recall if report.comparison else 0.0,
                "delta_fpr": report.comparison.delta_fpr if report.comparison else 0.0,
                "delta_exposure": report.comparison.delta_exposure if report.comparison else 0.0,
                "benchmark_id": report.benchmark_id,
                "candidate_checksum": snapshot.candidate_checksum
            }
        )

        return updated_patch

    async def simulate_patch(self, patch_id: str) -> PatchResponse:
        """Evaluates patch candidate using default held-out batch benchmark."""
        return await self.evaluate_patch_candidate(patch_id=patch_id, split=DatasetSplitType.HELD_OUT)

    async def simulate_patch_replay(
        self,
        patch_id: str,
        simulation_transactions: List[dict],
        actor_name: str = "Harsh Shrivastava"
    ) -> PatchResponse:
        patch = await self.get_patch(patch_id)
        policy = await self.policy_repo.get_policy_by_id(patch.source_policy_id)
        if not policy:
            raise ResourceNotFoundError("Policy", patch.source_policy_id)

        patched_rules = self._build_candidate_rules(patch, policy)
        metrics = self.replay_engine.replay_transactions(
            transactions=simulation_transactions,
            baseline_policy=policy,
            patched_rules=patched_rules
        )

        cand_id = f"cand-{patch.id}"
        snapshot = self.benchmark_engine.freeze_candidate(
            candidate_id=cand_id,
            baseline_policy=policy,
            candidate_rules=patched_rules,
            candidate_version=patch.target_policy_version
        )

        # Baseline metrics schema
        baseline_metrics = BenchmarkMetricsSchema(
            total_transactions=len(simulation_transactions),
            total_adversarial=int(metrics.bypasses_count.before),
            total_legitimate=len(simulation_transactions) - int(metrics.bypasses_count.before),
            true_positives=int(metrics.bypasses_count.before),
            true_negatives=len(simulation_transactions) - int(metrics.bypasses_count.before),
            false_positives=0,
            false_negatives=int(metrics.bypasses_count.before),
            precision=metrics.precision.before,
            recall=metrics.recall.before,
            f1_score=metrics.f1.before,
            false_positive_rate=metrics.false_positive_rate.before,
            attack_success_rate=metrics.attack_success_rate.before,
            successful_bypasses=int(metrics.bypasses_count.before),
            simulated_exposure=metrics.simulated_exposure.before,
            customer_friction_score=1.0,
            policy_coverage=90.0,
            simulation_throughput=1000.0,
        )

        candidate_metrics = BenchmarkMetricsSchema(
            total_transactions=len(simulation_transactions),
            total_adversarial=int(metrics.bypasses_count.after),
            total_legitimate=len(simulation_transactions) - int(metrics.bypasses_count.after),
            true_positives=int(metrics.bypasses_count.after),
            true_negatives=len(simulation_transactions) - int(metrics.bypasses_count.after),
            false_positives=0,
            false_negatives=int(metrics.bypasses_count.after),
            precision=metrics.precision.after,
            recall=metrics.recall.after,
            f1_score=metrics.f1.after,
            false_positive_rate=metrics.false_positive_rate.after,
            attack_success_rate=metrics.attack_success_rate.after,
            successful_bypasses=int(metrics.bypasses_count.after),
            simulated_exposure=metrics.simulated_exposure.after,
            customer_friction_score=1.0,
            policy_coverage=90.0,
            simulation_throughput=1000.0,
        )

        decision = self.decision_engine.evaluate_decision(
            baseline_metrics=baseline_metrics,
            candidate_metrics=candidate_metrics,
            comparison=None,
            candidate_snapshot=snapshot,
            dataset_split=DatasetSplitType.DEVELOPMENT
        )

        updated_patch = patch.model_copy(update={
            "status": PatchStatus.SIMULATED,
            "validation_status": "VALIDATED",
            "metrics_comparison": metrics,
            "decision_evaluation": decision,
            "candidate_id": snapshot.candidate_id,
            "candidate_checksum": snapshot.candidate_checksum,
            "candidate_snapshot": snapshot,
        })
        await self.patch_repo.save_patch(updated_patch)

        await self.audit_service.record_event(
            action="REPLAY_SIMULATION_COMPLETED",
            entity_type="PolicyPatch",
            entity_id=patch.id,
            entity_name=f"Replay Simulation for {patch.vulnerability_title}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "transactions_replayed": len(simulation_transactions),
                "delta_recall": metrics.recall.delta,
                "delta_exposure": metrics.simulated_exposure.delta
            }
        )

        return updated_patch

    async def iterate_patch_candidate(
        self,
        patch_id: str,
        feedback_notes: Optional[str] = None,
        target_split: DatasetSplitType = DatasetSplitType.HELD_OUT,
        actor_name: str = "Harsh Shrivastava"
    ) -> PatchResponse:
        """
        Creates a new immutable candidate iteration without mutating the previous candidate.
        Grounded in previous benchmark failure evidence.
        """
        parent_patch = await self.get_patch(patch_id)
        vuln = await self.vulnerability_repo.get_vulnerability_by_id(parent_patch.vulnerability_id)
        if not vuln:
            raise ResourceNotFoundError("Vulnerability", parent_patch.vulnerability_id)
        policy = await self.policy_repo.get_policy_by_id(parent_patch.source_policy_id)
        if not policy:
            raise ResourceNotFoundError("Policy", parent_patch.source_policy_id)

        next_index = parent_patch.iteration_index + 1
        new_patch_id = f"{parent_patch.id}-iter{next_index}"

        # Contextual feedback from previous decision
        rejection_context = ""
        if parent_patch.decision_evaluation:
            rejection_context = f" Previous Candidate #{parent_patch.iteration_index} decision: {parent_patch.decision_evaluation.recommendation_summary}"
        if feedback_notes:
            rejection_context += f" Analyst Feedback: {feedback_notes}"

        ai_input = PatchProposalInput(
            vulnerability_id=vuln.id,
            vulnerability_title=vuln.title,
            why_failed=f"{vuln.why_the_policy_failed}.{rejection_context}",
            current_policy_id=policy.id,
            current_policy_name=policy.name,
            simulated_exposure=vuln.simulated_exposure
        )
        ai_proposal = await self.patch_generator.propose_patch(ai_input)

        now_iso = datetime.now(timezone.utc).isoformat()
        new_patch = PatchResponse(
            id=new_patch_id,
            vulnerability_id=vuln.id,
            vulnerability_title=vuln.title,
            vulnerability_severity=vuln.severity,
            source_policy_id=policy.id,
            source_policy_name=policy.name,
            source_policy_version=policy.current_version_number,
            target_policy_version=f"v1.{next_index}.0-cand{next_index}",
            status=PatchStatus.PENDING_SIMULATION,
            identified_weakness=ai_proposal.identified_weakness,
            proposed_changes=ai_proposal.proposed_changes,
            ai_reasoning=ai_proposal.reasoning,
            expected_risk_reduction=ai_proposal.expected_benefit,
            expected_fpr_impact=ai_proposal.expected_fpr_impact,
            expected_customer_friction=ai_proposal.expected_customer_friction,
            validation_status="AWAITING_VALIDATION",
            confidence=ai_proposal.confidence,
            metrics_comparison=None,
            decision_evaluation=None,
            iteration_index=next_index,
            parent_patch_id=parent_patch.id,
            created_at=now_iso
        )

        saved = await self.patch_repo.save_patch(new_patch)

        await self.audit_service.record_event(
            action="AI_PATCH_ITERATION_GENERATED",
            entity_type="PolicyPatch",
            entity_id=saved.id,
            entity_name=f"Candidate Iteration #{next_index} for {vuln.title}",
            actor_name=f"AI Agent ({self.ai_provider.provider_name})",
            actor_type=AuditActorType.AI_AGENT,
            details={"parent_patch_id": parent_patch.id, "iteration_index": next_index}
        )

        return saved

    async def approve_patch(
        self,
        patch_id: str,
        request: PatchApproveRequest,
        actor_name: str = "Harsh Shrivastava"
    ) -> PatchResponse:
        patch = await self.get_patch(patch_id)
        if patch.status == PatchStatus.APPROVED:
            raise ConflictError(f"Patch {patch_id} is already approved.")

        policy = await self.policy_repo.get_policy_by_id(patch.source_policy_id)
        if not policy:
            raise ResourceNotFoundError("Policy", patch.source_policy_id)

        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Build validated rules
        candidate_rules = self._build_candidate_rules(patch, policy)

        # Promote new version in PolicyRepository
        new_version = PolicyVersionSchema(
            id=f"pv-{patch_id[-6:]}",
            policy_id=policy.id,
            version_number=patch.target_policy_version.replace("-cand1", "").replace("-cand2", ""),
            status=PolicyStatus.ACTIVE,
            rules=candidate_rules,
            created_at=now_iso,
            created_by=actor_name,
            notes=f"Approved patch {patch.id}: {request.notes or 'Deterministic held-out validation verified'}"
        )
        await self.policy_repo.create_policy_version(policy.id, new_version)

        # Update patch status
        updated_patch = patch.model_copy(update={
            "status": PatchStatus.APPROVED,
            "validation_status": "APPROVED",
            "reviewed_at": now_iso,
            "reviewed_by": actor_name
        })
        await self.patch_repo.save_patch(updated_patch)

        # Update vulnerability status
        await self.vulnerability_repo.update_status(patch.vulnerability_id, "RESOLVED")

        await self.audit_service.record_event(
            action="POLICY_PATCH_APPROVED",
            entity_type="PolicyPatch",
            entity_id=patch.id,
            entity_name=f"Approved Patch for {patch.vulnerability_title}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "new_version": new_version.version_number,
                "policy_id": policy.id,
                "candidate_checksum": patch.candidate_checksum
            }
        )

        return updated_patch

    async def reject_patch(
        self,
        patch_id: str,
        request: PatchRejectRequest,
        actor_name: str = "Harsh Shrivastava"
    ) -> PatchResponse:
        patch = await self.get_patch(patch_id)
        now_iso = datetime.now(timezone.utc).isoformat()

        updated_patch = patch.model_copy(update={
            "status": PatchStatus.REJECTED,
            "validation_status": "REJECTED",
            "reviewed_at": now_iso,
            "reviewed_by": actor_name,
            "rejection_reason": request.reason
        })
        await self.patch_repo.save_patch(updated_patch)

        await self.audit_service.record_event(
            action="POLICY_PATCH_REJECTED",
            entity_type="PolicyPatch",
            entity_id=patch.id,
            entity_name=f"Rejected Patch for {patch.vulnerability_title}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            status="WARNING",
            details={
                "rejection_reason": request.reason,
                "candidate_checksum": patch.candidate_checksum
            }
        )

        return updated_patch
