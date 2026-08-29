import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timezone
from backend.app.database.repositories.interfaces.policy_repository import PolicyRepository
from backend.app.schemas.policy import (
    PolicyResponse,
    PolicyCreate,
    PolicyUpdate,
    PolicyCategory,
    PolicyStatus,
    PolicyVersionSchema,
    PolicyRuleSchema,
    PolicyRuleType,
    RuleAction,
)


class InMemoryPolicyRepository(PolicyRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._policies: Dict[str, PolicyResponse] = {}
        self._seed_default_policies()

    def _seed_default_policies(self):
        rule_1 = PolicyRuleSchema(
            id="rule-pol-01-1",
            policy_version_id="pv-101",
            name="Account Velocity Window",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns": 3, "window_minutes": 10},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
            description="Blocks more than 3 transactions per account in 10 minutes."
        )
        rule_2 = PolicyRuleSchema(
            id="rule-pol-01-2",
            policy_version_id="pv-101",
            name="Single Transaction Amount Ceiling",
            rule_type=PolicyRuleType.AMOUNT_MAX,
            category=PolicyCategory.AMOUNT,
            parameters={"max_amount": 50000.0},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
            description="Flags any single transaction exceeding ₹50,000."
        )
        rule_3 = PolicyRuleSchema(
            id="rule-pol-01-3",
            policy_version_id="pv-101",
            name="Device Fingerprint Rate Limiter",
            rule_type=PolicyRuleType.VELOCITY_DEVICE,
            category=PolicyCategory.IDENTITY,
            parameters={"max_txns_per_device": 5, "window_minutes": 60},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=3,
            description="Blocks transactions from hardware devices exceeding 5 attempts/hour across all accounts."
        )
        
        v1 = PolicyVersionSchema(
            id="pv-101",
            policy_id="pol-vel-01",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[rule_1, rule_2, rule_3],
            created_at="2026-08-18T10:00:00Z",
            created_by="Harsh Shrivastava",
            notes="Baseline merchant policy protecting against brute velocity spikes."
        )
        
        pol1 = PolicyResponse(
            id="pol-vel-01",
            merchant_id="m-dev-01",
            name="Core Merchant Velocity & High-Value Guard",
            description="Multi-layered rate limiting across accounts, amounts, and hardware devices.",
            category=PolicyCategory.VELOCITY,
            current_version_id="pv-101",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=3,
            coverage_rate=88.4,
            effectiveness_rate=91.2,
            created_at="2026-08-18T10:00:00Z",
            updated_at="2026-08-20T08:30:00Z",
            versions=[v1]
        )
        
        self._policies[pol1.id] = pol1

        # ── pol-hvt-03: High-Value Transaction Sentinel ──────────────────────
        # Focus: AMOUNT_MAX only. Very loose velocity so amount rule is the
        # differentiator. Attacks (₹2.5K–₹8K) stay below ₹25K threshold →
        # high bypass rate; deliberately "weak" policy for demonstration.
        _r_hvt1 = PolicyRuleSchema(
            id="rule-hvt-03-1",
            policy_version_id="pv-hvt-03-v10",
            name="Single Transaction Ceiling ₹25,000",
            rule_type=PolicyRuleType.AMOUNT_MAX,
            category=PolicyCategory.AMOUNT,
            parameters={"max_amount": 25000.0},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=1,
            description="Flags any single payment exceeding ₹25,000 for senior analyst review."
        )
        _r_hvt2 = PolicyRuleSchema(
            id="rule-hvt-03-2",
            policy_version_id="pv-hvt-03-v10",
            name="Sustained High-Velocity Account Guard",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns": 10, "window_minutes": 60},
            action=RuleAction.MONITOR,
            is_enabled=True,
            sequence_order=2,
            description="Monitors accounts exceeding 10 transactions in a 60-minute window."
        )
        _pv_hvt = PolicyVersionSchema(
            id="pv-hvt-03-v10",
            policy_id="pol-hvt-03",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[_r_hvt1, _r_hvt2],
            created_at="2026-08-19T09:00:00Z",
            created_by="Priya Sharma",
            notes="Initial high-value transaction screening policy. Optimised for low false positives."
        )
        _pol_hvt = PolicyResponse(
            id="pol-hvt-03",
            merchant_id="m-dev-01",
            name="High-Value Transaction Sentinel",
            description="Flags payments above configurable amount ceiling and monitors accounts with sustained high transaction counts. Low friction for typical orders.",
            category=PolicyCategory.AMOUNT,
            current_version_id="pv-hvt-03-v10",
            current_version_number="v1.0.0",
            is_active=False,
            rule_count=2,
            coverage_rate=31.2,
            effectiveness_rate=62.5,
            created_at="2026-08-19T09:00:00Z",
            updated_at="2026-08-19T09:00:00Z",
            versions=[_pv_hvt]
        )
        self._policies[_pol_hvt.id] = _pol_hvt

        # ── pol-dev-04: Device Fingerprint Integrity Policy ──────────────────
        # Focus: Tight VELOCITY_DEVICE. IDENTITY_FRAGMENTER (8 accts/1 device)
        # triggers after 2 txns on same device in 30 min → very high recall.
        _r_dev1 = PolicyRuleSchema(
            id="rule-dev-04-1",
            policy_version_id="pv-dev-04-v10",
            name="Hardware Device Strict Velocity Block",
            rule_type=PolicyRuleType.VELOCITY_DEVICE,
            category=PolicyCategory.IDENTITY,
            parameters={"max_txns_per_device": 2, "window_minutes": 30},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
            description="Hard-blocks any hardware fingerprint that executes more than 2 transactions across all merchant accounts in a 30-minute window."
        )
        _r_dev2 = PolicyRuleSchema(
            id="rule-dev-04-2",
            policy_version_id="pv-dev-04-v10",
            name="Cross-Account Amount Ceiling",
            rule_type=PolicyRuleType.AMOUNT_MAX,
            category=PolicyCategory.AMOUNT,
            parameters={"max_amount": 150000.0},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
            description="Flags extreme outlier transactions exceeding ₹1,50,000."
        )
        _pv_dev = PolicyVersionSchema(
            id="pv-dev-04-v10",
            policy_id="pol-dev-04",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[_r_dev1, _r_dev2],
            created_at="2026-08-19T10:30:00Z",
            created_by="Harsh Shrivastava",
            notes="Device-centric policy targeting multi-account hardware fingerprint collusion."
        )
        _pol_dev = PolicyResponse(
            id="pol-dev-04",
            merchant_id="m-dev-01",
            name="Device Fingerprint Integrity Policy",
            description="Detects and blocks suspicious device reuse across multiple accounts. Primary defence against identity-fragmenter multi-account collusion attacks.",
            category=PolicyCategory.IDENTITY,
            current_version_id="pv-dev-04-v10",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=2,
            coverage_rate=91.8,
            effectiveness_rate=88.3,
            created_at="2026-08-19T10:30:00Z",
            updated_at="2026-08-19T10:30:00Z",
            versions=[_pv_dev]
        )
        self._policies[_pol_dev.id] = _pol_dev

        # ── pol-geo-05: Geographic Anomaly & IP Velocity Guard ───────────────
        # Focus: Tight VELOCITY_IP. VELOCITY_ATTACKER reuses ips[0] in bursts →
        # 3 txns on same IP in < 1 min → triggers at max_txns_per_ip=5/30min.
        # IDENTITY_FRAGMENTER rotates random IPs → partial detection.
        _r_geo1 = PolicyRuleSchema(
            id="rule-geo-05-1",
            policy_version_id="pv-geo-05-v10",
            name="High-Velocity IP Block",
            rule_type=PolicyRuleType.VELOCITY_IP,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns_per_ip": 5, "window_minutes": 30},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
            description="Blocks IP addresses that originate more than 5 transactions in any 30-minute window across the merchant estate."
        )
        _r_geo2 = PolicyRuleSchema(
            id="rule-geo-05-2",
            policy_version_id="pv-geo-05-v10",
            name="Moderate Account Velocity Gate",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns": 6, "window_minutes": 20},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
            description="Flags accounts with more than 6 transactions in any 20-minute rolling window."
        )
        _pv_geo = PolicyVersionSchema(
            id="pv-geo-05-v10",
            policy_id="pol-geo-05",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[_r_geo1, _r_geo2],
            created_at="2026-08-19T11:00:00Z",
            created_by="Priya Sharma",
            notes="Network-layer anomaly policy focusing on IP-origin velocity and account frequency."
        )
        _pol_geo = PolicyResponse(
            id="pol-geo-05",
            merchant_id="m-dev-01",
            name="Geographic Anomaly & IP Velocity Guard",
            description="Detects suspicious IP-origin velocity patterns indicative of coordinated attacks from rotating proxy pools. Secondary account-frequency gate limits repeated attempts.",
            category=PolicyCategory.VELOCITY,
            current_version_id="pv-geo-05-v10",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=2,
            coverage_rate=74.6,
            effectiveness_rate=79.1,
            created_at="2026-08-19T11:00:00Z",
            updated_at="2026-08-19T11:00:00Z",
            versions=[_pv_geo]
        )
        self._policies[_pol_geo.id] = _pol_geo

        # ── pol-ref-06: Refund Abuse Prevention Sentinel ─────────────────────
        # Focus: Moderate VELOCITY_ACCOUNT + moderate VELOCITY_DEVICE.
        # Note: REFUND_RATIO is schema-valid but not evaluated by the engine —
        # deliberately omitted to keep all rules engine-effective.
        _r_ref1 = PolicyRuleSchema(
            id="rule-ref-06-1",
            policy_version_id="pv-ref-06-v10",
            name="Account Transaction Frequency Gate",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.REFUNDS,
            parameters={"max_txns": 4, "window_minutes": 15},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=1,
            description="Flags accounts exceeding 4 transactions in 15 minutes — a common signal preceding refund-loop abuse."
        )
        _r_ref2 = PolicyRuleSchema(
            id="rule-ref-06-2",
            policy_version_id="pv-ref-06-v10",
            name="Device Multi-Transaction Surveillance",
            rule_type=PolicyRuleType.VELOCITY_DEVICE,
            category=PolicyCategory.IDENTITY,
            parameters={"max_txns_per_device": 3, "window_minutes": 60},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
            description="Flags devices accumulating more than 3 transactions per hour — indicative of refund-farming device reuse."
        )
        _pv_ref = PolicyVersionSchema(
            id="pv-ref-06-v10",
            policy_id="pol-ref-06",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[_r_ref1, _r_ref2],
            created_at="2026-08-19T12:00:00Z",
            created_by="Harsh Shrivastava",
            notes="Refund abuse detection policy. Flags suspicious frequency patterns without blocking legitimate users."
        )
        _pol_ref = PolicyResponse(
            id="pol-ref-06",
            merchant_id="m-dev-01",
            name="Refund Abuse Prevention Sentinel",
            description="Detects excessive transaction frequency and device reuse patterns that are precursors to refund-loop and purchase-refund cycling abuse.",
            category=PolicyCategory.REFUNDS,
            current_version_id="pv-ref-06-v10",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=2,
            coverage_rate=58.4,
            effectiveness_rate=71.9,
            created_at="2026-08-19T12:00:00Z",
            updated_at="2026-08-19T12:00:00Z",
            versions=[_pv_ref]
        )
        self._policies[_pol_ref.id] = _pol_ref

        # ── pol-ins-07: Payment Instrument Risk Guard ─────────────────────────
        # Focus: Moderate VELOCITY_ACCOUNT + loose VELOCITY_IP.
        # INSTRUMENT_CARDS_PER_ACCOUNT is not engine-evaluated → omitted.
        _r_ins1 = PolicyRuleSchema(
            id="rule-ins-07-1",
            policy_version_id="pv-ins-07-v10",
            name="Account Transaction Rate Limiter",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns": 5, "window_minutes": 10},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=1,
            description="Flags accounts attempting more than 5 payments in any 10-minute window — typical of automated card-testing scripts."
        )
        _r_ins2 = PolicyRuleSchema(
            id="rule-ins-07-2",
            policy_version_id="pv-ins-07-v10",
            name="IP Origin Moderate Velocity Check",
            rule_type=PolicyRuleType.VELOCITY_IP,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns_per_ip": 12, "window_minutes": 60},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
            description="Flags IP addresses sustaining more than 12 payment attempts per hour — allows shared network IPs while catching concentrated abuse."
        )
        _pv_ins = PolicyVersionSchema(
            id="pv-ins-07-v10",
            policy_id="pol-ins-07",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[_r_ins1, _r_ins2],
            created_at="2026-08-19T13:00:00Z",
            created_by="Priya Sharma",
            notes="Payment instrument risk policy. Balances friction with detection across account and network dimensions."
        )
        _pol_ins = PolicyResponse(
            id="pol-ins-07",
            merchant_id="m-dev-01",
            name="Payment Instrument Risk Guard",
            description="Detects abnormal payment frequency at the account and IP level, catching card-testing patterns and multi-instrument cycling without blocking shared network users.",
            category=PolicyCategory.PAYMENT_INSTRUMENT,
            current_version_id="pv-ins-07-v10",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=2,
            coverage_rate=66.3,
            effectiveness_rate=76.4,
            created_at="2026-08-19T13:00:00Z",
            updated_at="2026-08-19T13:00:00Z",
            versions=[_pv_ins]
        )
        self._policies[_pol_ins.id] = _pol_ins

        # ── pol-ato-08: Account Takeover Protection Policy ────────────────────
        # Focus: Very tight VELOCITY_ACCOUNT + moderate VELOCITY_DEVICE.
        # VELOCITY_ATTACKER (1 acct, 3-txn bursts/15s) hits max_txns=2/5min
        # on its 3rd txn in each burst → very high BLOCK rate on that agent.
        # IDENTITY_FRAGMENTER (shared device) hits max_txns_per_device=3/30m.
        _r_ato1 = PolicyRuleSchema(
            id="rule-ato-08-1",
            policy_version_id="pv-ato-08-v10",
            name="Ultra-Tight Account Burst Block",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.BEHAVIORAL,
            parameters={"max_txns": 2, "window_minutes": 5},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
            description="Blocks accounts executing more than 2 transactions in any 5-minute window — aggressive defence against credential-stuffing and ATO bursts."
        )
        _r_ato2 = PolicyRuleSchema(
            id="rule-ato-08-2",
            policy_version_id="pv-ato-08-v10",
            name="Device Collusion Blocker",
            rule_type=PolicyRuleType.VELOCITY_DEVICE,
            category=PolicyCategory.IDENTITY,
            parameters={"max_txns_per_device": 3, "window_minutes": 30},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=2,
            description="Blocks hardware devices accumulating more than 3 transactions across accounts in a 30-minute window — catches shared device multi-account fraud."
        )
        _pv_ato = PolicyVersionSchema(
            id="pv-ato-08-v10",
            policy_id="pol-ato-08",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[_r_ato1, _r_ato2],
            created_at="2026-08-19T14:00:00Z",
            created_by="Harsh Shrivastava",
            notes="Account Takeover Protection — aggressive thresholds. Higher false positive rate acceptable for high-risk scenarios."
        )
        _pol_ato = PolicyResponse(
            id="pol-ato-08",
            merchant_id="m-dev-01",
            name="Account Takeover Protection Policy",
            description="Aggressive velocity constraints at account and device level designed to stop credential-stuffing, ATO bursts, and shared-device multi-account fraud. Highest detection recall at cost of elevated friction.",
            category=PolicyCategory.BEHAVIORAL,
            current_version_id="pv-ato-08-v10",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=2,
            coverage_rate=93.7,
            effectiveness_rate=86.2,
            created_at="2026-08-19T14:00:00Z",
            updated_at="2026-08-19T14:00:00Z",
            versions=[_pv_ato]
        )
        self._policies[_pol_ato.id] = _pol_ato

        # ── pol-crd-09: Coordinated Fraud Ring Detector ───────────────────────
        # Focus: Balanced three-dimensional coverage — account + device + IP.
        # Catches VELOCITY_ATTACKER (account + IP), IDENTITY_FRAGMENTER (device),
        # and PAYMENT_ROTATOR (account + IP) with moderate thresholds.
        _r_crd1 = PolicyRuleSchema(
            id="rule-crd-09-1",
            policy_version_id="pv-crd-09-v10",
            name="Account Sliding Window Velocity Block",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns": 3, "window_minutes": 10},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
            description="Blocks accounts exceeding 3 transactions in a 10-minute window — tuned to catch syndicate-level account burst patterns."
        )
        _r_crd2 = PolicyRuleSchema(
            id="rule-crd-09-2",
            policy_version_id="pv-crd-09-v10",
            name="Shared Device Ring Detection",
            rule_type=PolicyRuleType.VELOCITY_DEVICE,
            category=PolicyCategory.IDENTITY,
            parameters={"max_txns_per_device": 3, "window_minutes": 60},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=2,
            description="Blocks hardware devices shared across more than 3 transactions per hour — signals device pooling used by fraud rings."
        )
        _r_crd3 = PolicyRuleSchema(
            id="rule-crd-09-3",
            policy_version_id="pv-crd-09-v10",
            name="Network Origin Velocity Block",
            rule_type=PolicyRuleType.VELOCITY_IP,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns_per_ip": 6, "window_minutes": 30},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=3,
            description="Blocks IP addresses generating more than 6 transactions in 30 minutes — catches coordinated proxy-pool rotation."
        )
        _pv_crd = PolicyVersionSchema(
            id="pv-crd-09-v10",
            policy_id="pol-crd-09",
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=[_r_crd1, _r_crd2, _r_crd3],
            created_at="2026-08-19T15:00:00Z",
            created_by="Harsh Shrivastava",
            notes="Three-dimensional coordinated fraud detection — balanced recall and precision across all three attack vectors."
        )
        _pol_crd = PolicyResponse(
            id="pol-crd-09",
            merchant_id="m-dev-01",
            name="Coordinated Fraud Ring Detector",
            description="Identifies relationships between accounts, devices, and IP addresses to detect organised fraud syndicate activity. Provides broad coverage across velocity, device collusion, and network-origin dimensions.",
            category=PolicyCategory.VELOCITY,
            current_version_id="pv-crd-09-v10",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=3,
            coverage_rate=84.9,
            effectiveness_rate=83.6,
            created_at="2026-08-19T15:00:00Z",
            updated_at="2026-08-19T15:00:00Z",
            versions=[_pv_crd]
        )
        self._policies[_pol_crd.id] = _pol_crd

    async def list_policies(self, merchant_id: str) -> List[PolicyResponse]:
        async with self._lock:
            return list(self._policies.values())

    async def get_policy_by_id(self, policy_id: str) -> Optional[PolicyResponse]:
        async with self._lock:
            # 1. Direct match by policy ID
            if policy_id in self._policies:
                return self._policies[policy_id]
            # 2. Match by current_version_id or versions.id
            for pol in self._policies.values():
                if pol.current_version_id == policy_id:
                    return pol
                for v in pol.versions:
                    if v.id == policy_id:
                        return pol
            return None

    async def get_active_policy(self, merchant_id: str) -> Optional[PolicyResponse]:
        async with self._lock:
            for pol in self._policies.values():
                if pol.merchant_id == merchant_id and pol.is_active:
                    return pol
            # Fallback to any active policy
            for pol in self._policies.values():
                if pol.is_active:
                    return pol
            return None

    async def create_policy(self, merchant_id: str, data: PolicyCreate) -> PolicyResponse:
        async with self._lock:
            now_iso = datetime.now(timezone.utc).isoformat()
            new_id = f"pol-{len(self._policies) + 1:03d}"
            v_id = f"pv-{len(self._policies) + 1:03d}-1"
            
            rules = [
                PolicyRuleSchema(
                    id=f"rule-{new_id}-{i+1}",
                    policy_version_id=v_id,
                    name=r.name,
                    rule_type=r.rule_type,
                    category=r.category,
                    parameters=r.parameters,
                    action=r.action,
                    is_enabled=r.is_enabled,
                    sequence_order=i+1,
                    description=r.description
                )
                for i, r in enumerate(data.rules)
            ]
            
            v1 = PolicyVersionSchema(
                id=v_id,
                policy_id=new_id,
                version_number="v1.0.0",
                status=PolicyStatus.ACTIVE,
                rules=rules,
                created_at=now_iso,
                created_by="Harsh Shrivastava",
                notes=data.notes
            )
            
            pol = PolicyResponse(
                id=new_id,
                merchant_id=merchant_id,
                name=data.name,
                description=data.description,
                category=data.category,
                current_version_id=v_id,
                current_version_number="v1.0.0",
                is_active=True,
                rule_count=len(rules),
                coverage_rate=85.0,
                effectiveness_rate=88.0,
                created_at=now_iso,
                updated_at=now_iso,
                versions=[v1]
            )
            self._policies[new_id] = pol
            return pol

    async def update_policy(self, policy_id: str, data: PolicyUpdate) -> Optional[PolicyResponse]:
        async with self._lock:
            pol = self._policies.get(policy_id)
            if not pol:
                return None
            
            updated_name = data.name if data.name is not None else pol.name
            updated_desc = data.description if data.description is not None else pol.description
            updated_active = data.is_active if data.is_active is not None else pol.is_active
            
            updated_pol = pol.model_copy(update={
                "name": updated_name,
                "description": updated_desc,
                "is_active": updated_active,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            self._policies[policy_id] = updated_pol
            return updated_pol

    async def create_policy_version(self, policy_id: str, version: PolicyVersionSchema) -> PolicyResponse:
        async with self._lock:
            pol = self._policies.get(policy_id)
            if not pol:
                raise ValueError(f"Policy {policy_id} not found")
            
            new_versions = list(pol.versions)
            # Supersede old versions
            for i, v in enumerate(new_versions):
                if v.status == PolicyStatus.ACTIVE:
                    new_versions[i] = v.model_copy(update={"status": PolicyStatus.SUPERSEDED})
            
            new_versions.append(version)
            
            updated_pol = pol.model_copy(update={
                "current_version_id": version.id,
                "current_version_number": version.version_number,
                "rule_count": len(version.rules),
                "versions": new_versions,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            self._policies[policy_id] = updated_pol
            return updated_pol

    async def delete_policy(self, policy_id: str) -> bool:
        async with self._lock:
            if policy_id in self._policies:
                del self._policies[policy_id]
                return True
            return False
