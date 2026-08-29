import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.database.mongo import init_mongo, get_database, close_mongo
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.common import (
    DatasetSplitType,
    IncidentStatus,
    PatchStatus,
    RiskDecisionOutcome,
    SeverityLevel,
    SimulationStatus,
    AuditActorType,
)
from backend.app.schemas.attack import AttackAgentType, AttackDifficulty
from backend.app.schemas.policy import (
    PolicyResponse,
    PolicyStatus,
    PolicyVersionSchema,
    PolicyRuleSchema,
    PolicyRuleType,
    PolicyCategory,
    RuleAction,
)
from backend.app.schemas.simulation import (
    SimulationRunResponse,
    SimulationEventResponse,
)
from backend.app.schemas.attack import AttackAgentSchema, AttackScenarioSchema
from backend.app.schemas.vulnerability import VulnerabilityResponse, VulnerabilityEvidenceSchema
from backend.app.schemas.patch import (
    PatchResponse,
    PolicyRuleModificationSchema,
    BeforeAfterMetricsSchema,
    MetricDelta,
)
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkComparisonResponse,
    BenchmarkMetricsSchema,
)
from backend.app.schemas.dataset import SyntheticDatasetResponse, DatasetSplitStatsSchema
from backend.app.schemas.incident import IncidentResponse, IncidentTimelineEventSchema
from backend.app.schemas.audit import AuditLogResponse
from backend.app.schemas.report import ExecutiveReportResponse, ReportFindingSchema


DETERMINISTIC_SEED = 49201


def build_seed_data():
    now_iso = "2026-08-20T10:00:00Z"
    
    # 1. Policies
    rules_pol1 = [
        PolicyRuleSchema(
            id="rule-vel-001",
            policy_version_id="pv-vel-01-v10",
            name="Account Sliding Window Max 5 Txns / 10 Mins",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"time_window_minutes": 10, "max_transaction_count": 5},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
            description="Blocks transactions when single account attempts >5 transactions in a 10-minute sliding window."
        ),
        PolicyRuleSchema(
            id="rule-vel-002",
            policy_version_id="pv-vel-01-v10",
            name="Single Transaction Amount Ceiling ₹50,000",
            rule_type=PolicyRuleType.AMOUNT_MAX,
            category=PolicyCategory.AMOUNT,
            parameters={"max_amount": 50000.0, "currency": "INR"},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
            description="Flags single transactions exceeding ₹50,000 for mandatory manual review."
        ),
        PolicyRuleSchema(
            id="rule-vel-003",
            policy_version_id="pv-vel-01-v10",
            name="Restricted High-Velocity IP Address Block",
            rule_type=PolicyRuleType.VELOCITY_IP,
            category=PolicyCategory.VELOCITY,
            parameters={"max_ip_velocity": 15, "window_minutes": 60},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=3,
            description="Hard blocks card and bank transactions originating from high-velocity rotating IP pools."
        )
    ]

    pv1 = PolicyVersionSchema(
        id="pv-vel-01-v10",
        policy_id="pol-vel-01",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol1,
        created_at="2026-08-15T09:00:00Z",
        created_by="Harsh Shrivastava",
        notes="Baseline production velocity and high-value transaction risk policy."
    )

    policy1 = PolicyResponse(
        id="pol-vel-01",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Core Merchant Velocity & High-Value Guard",
        description="Authoritative rate limiting and high-risk threshold controls for Indian e-commerce checkout.",
        category=PolicyCategory.VELOCITY,
        current_version_id="pv-vel-01-v10",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules_pol1),
        coverage_rate=88.5,
        effectiveness_rate=71.4,
        created_at="2026-08-15T09:00:00Z",
        updated_at="2026-08-20T10:00:00Z",
        versions=[pv1]
    )

    rules_pol2 = [
        PolicyRuleSchema(
            id="rule-geo-001",
            policy_version_id="pv-geo-02-v10",
            name="Instrument Multi-Card Rotation Guard",
            rule_type=PolicyRuleType.INSTRUMENT_CARDS_PER_ACCOUNT,
            category=PolicyCategory.PAYMENT_INSTRUMENT,
            parameters={"max_cards_per_24h": 3},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=1,
            description="Challenges transactions where more than 3 distinct payment cards are used on one account."
        )
    ]

    pv2 = PolicyVersionSchema(
        id="pv-geo-02-v10",
        policy_id="pol-geo-02",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol2,
        created_at="2026-08-16T11:00:00Z",
        created_by="Priya Sharma",
        notes="Card rotation and instrument exhaustion guardrail."
    )

    policy2 = PolicyResponse(
        id="pol-geo-02",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Payment Instrument & Multi-Card Velocity Guard",
        description="Mandatory review and step-up authentication when multiple cards or VPAs are cycled through a single account.",
        category=PolicyCategory.PAYMENT_INSTRUMENT,
        current_version_id="pv-geo-02-v10",
        current_version_number="v1.0.0",
        is_active=False,
        rule_count=len(rules_pol2),
        coverage_rate=65.0,
        effectiveness_rate=80.0,
        created_at="2026-08-16T11:00:00Z",
        updated_at="2026-08-18T14:30:00Z",
        versions=[pv2]
    )

    # ── Additional Realistic Policies ────────────────────────────────────────
    # All rules use only engine-evaluated rule types (VELOCITY_ACCOUNT,
    # VELOCITY_DEVICE, VELOCITY_IP, AMOUNT_MAX) with the exact parameter keys
    # read by PolicyEngine. No non-evaluated rule types are used.

    # pol-hvt-03: High-Value Transaction Sentinel
    # AMOUNT_MAX threshold at ₹25K: attack amounts (₹2.5K–₹8K) stay below it
    # → deliberately low recall policy showing why amount-only guards are weak.
    rules_pol3 = [
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
    ]
    pv3 = PolicyVersionSchema(
        id="pv-hvt-03-v10",
        policy_id="pol-hvt-03",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol3,
        created_at="2026-08-19T09:00:00Z",
        created_by="Priya Sharma",
        notes="Initial high-value transaction screening policy. Optimised for low false positives."
    )
    policy3 = PolicyResponse(
        id="pol-hvt-03",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="High-Value Transaction Sentinel",
        description="Flags payments above configurable amount ceiling and monitors accounts with sustained high transaction counts. Low friction for typical orders.",
        category=PolicyCategory.AMOUNT,
        current_version_id="pv-hvt-03-v10",
        current_version_number="v1.0.0",
        is_active=False,
        rule_count=len(rules_pol3),
        coverage_rate=31.2,
        effectiveness_rate=62.5,
        created_at="2026-08-19T09:00:00Z",
        updated_at="2026-08-19T09:00:00Z",
        versions=[pv3]
    )

    # pol-dev-04: Device Fingerprint Integrity Policy
    # max_txns_per_device=2/30m: IDENTITY_FRAGMENTER (8 accts, 1 shared device,
    # 20s spacing) triggers on the 3rd txn → near-100% detection for that agent.
    rules_pol4 = [
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
    ]
    pv4 = PolicyVersionSchema(
        id="pv-dev-04-v10",
        policy_id="pol-dev-04",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol4,
        created_at="2026-08-19T10:30:00Z",
        created_by="Harsh Shrivastava",
        notes="Device-centric policy targeting multi-account hardware fingerprint collusion."
    )
    policy4 = PolicyResponse(
        id="pol-dev-04",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Device Fingerprint Integrity Policy",
        description="Detects and blocks suspicious device reuse across multiple accounts. Primary defence against identity-fragmenter multi-account collusion attacks.",
        category=PolicyCategory.IDENTITY,
        current_version_id="pv-dev-04-v10",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules_pol4),
        coverage_rate=91.8,
        effectiveness_rate=88.3,
        created_at="2026-08-19T10:30:00Z",
        updated_at="2026-08-19T10:30:00Z",
        versions=[pv4]
    )

    # pol-geo-05: Geographic Anomaly & IP Velocity Guard
    # max_txns_per_ip=5/30m: VELOCITY_ATTACKER uses a single fixed IP in 3-txn
    # bursts → 5th txn on that IP triggers; random-IP agents get less detection.
    rules_pol5 = [
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
    ]
    pv5 = PolicyVersionSchema(
        id="pv-geo-05-v10",
        policy_id="pol-geo-05",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol5,
        created_at="2026-08-19T11:00:00Z",
        created_by="Priya Sharma",
        notes="Network-layer anomaly policy focusing on IP-origin velocity and account frequency."
    )
    policy5 = PolicyResponse(
        id="pol-geo-05",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Geographic Anomaly & IP Velocity Guard",
        description="Detects suspicious IP-origin velocity patterns indicative of coordinated attacks from rotating proxy pools. Secondary account-frequency gate limits repeated attempts.",
        category=PolicyCategory.VELOCITY,
        current_version_id="pv-geo-05-v10",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules_pol5),
        coverage_rate=74.6,
        effectiveness_rate=79.1,
        created_at="2026-08-19T11:00:00Z",
        updated_at="2026-08-19T11:00:00Z",
        versions=[pv5]
    )

    # pol-ref-06: Refund Abuse Prevention Sentinel
    # Moderate velocity on both account and device dimensions — FLAG only.
    # REFUND_RATIO is not engine-evaluated → deliberately omitted.
    rules_pol6 = [
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
    ]
    pv6 = PolicyVersionSchema(
        id="pv-ref-06-v10",
        policy_id="pol-ref-06",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol6,
        created_at="2026-08-19T12:00:00Z",
        created_by="Harsh Shrivastava",
        notes="Refund abuse detection policy. Flags suspicious frequency patterns without blocking legitimate users."
    )
    policy6 = PolicyResponse(
        id="pol-ref-06",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Refund Abuse Prevention Sentinel",
        description="Detects excessive transaction frequency and device reuse patterns that are precursors to refund-loop and purchase-refund cycling abuse.",
        category=PolicyCategory.REFUNDS,
        current_version_id="pv-ref-06-v10",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules_pol6),
        coverage_rate=58.4,
        effectiveness_rate=71.9,
        created_at="2026-08-19T12:00:00Z",
        updated_at="2026-08-19T12:00:00Z",
        versions=[pv6]
    )

    # pol-ins-07: Payment Instrument Risk Guard
    # Moderate VELOCITY_ACCOUNT + loose VELOCITY_IP — FLAG only.
    # INSTRUMENT_CARDS_PER_ACCOUNT is not engine-evaluated → omitted.
    rules_pol7 = [
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
    ]
    pv7 = PolicyVersionSchema(
        id="pv-ins-07-v10",
        policy_id="pol-ins-07",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol7,
        created_at="2026-08-19T13:00:00Z",
        created_by="Priya Sharma",
        notes="Payment instrument risk policy. Balances friction with detection across account and network dimensions."
    )
    policy7 = PolicyResponse(
        id="pol-ins-07",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Payment Instrument Risk Guard",
        description="Detects abnormal payment frequency at the account and IP level, catching card-testing patterns and multi-instrument cycling without blocking shared network users.",
        category=PolicyCategory.PAYMENT_INSTRUMENT,
        current_version_id="pv-ins-07-v10",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules_pol7),
        coverage_rate=66.3,
        effectiveness_rate=76.4,
        created_at="2026-08-19T13:00:00Z",
        updated_at="2026-08-19T13:00:00Z",
        versions=[pv7]
    )

    # pol-ato-08: Account Takeover Protection Policy
    # max_txns=2/5m + max_txns_per_device=3/30m both BLOCK.
    # VELOCITY_ATTACKER 3-txn bursts in 15s → 3rd txn in each burst triggers
    # account rule → highest recall of all policies.
    rules_pol8 = [
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
    ]
    pv8 = PolicyVersionSchema(
        id="pv-ato-08-v10",
        policy_id="pol-ato-08",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol8,
        created_at="2026-08-19T14:00:00Z",
        created_by="Harsh Shrivastava",
        notes="Account Takeover Protection — aggressive thresholds. Higher false positive rate acceptable for high-risk scenarios."
    )
    policy8 = PolicyResponse(
        id="pol-ato-08",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Account Takeover Protection Policy",
        description="Aggressive velocity constraints at account and device level designed to stop credential-stuffing, ATO bursts, and shared-device multi-account fraud. Highest detection recall at cost of elevated friction.",
        category=PolicyCategory.BEHAVIORAL,
        current_version_id="pv-ato-08-v10",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules_pol8),
        coverage_rate=93.7,
        effectiveness_rate=86.2,
        created_at="2026-08-19T14:00:00Z",
        updated_at="2026-08-19T14:00:00Z",
        versions=[pv8]
    )

    # pol-crd-09: Coordinated Fraud Ring Detector
    # Three-dimensional: VELOCITY_ACCOUNT + VELOCITY_DEVICE + VELOCITY_IP, all
    # BLOCK with moderate thresholds → broad balanced coverage.
    rules_pol9 = [
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
        PolicyRuleSchema(
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
        ),
    ]
    pv9 = PolicyVersionSchema(
        id="pv-crd-09-v10",
        policy_id="pol-crd-09",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules_pol9,
        created_at="2026-08-19T15:00:00Z",
        created_by="Harsh Shrivastava",
        notes="Three-dimensional coordinated fraud detection — balanced recall and precision across all three attack vectors."
    )
    policy9 = PolicyResponse(
        id="pol-crd-09",
        merchant_id=settings.DEV_MERCHANT_ID,
        name="Coordinated Fraud Ring Detector",
        description="Identifies relationships between accounts, devices, and IP addresses to detect organised fraud syndicate activity. Provides broad coverage across velocity, device collusion, and network-origin dimensions.",
        category=PolicyCategory.VELOCITY,
        current_version_id="pv-crd-09-v10",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules_pol9),
        coverage_rate=84.9,
        effectiveness_rate=83.6,
        created_at="2026-08-19T15:00:00Z",
        updated_at="2026-08-19T15:00:00Z",
        versions=[pv9]
    )

    # 2. Datasets
    split_dev = DatasetSplitStatsSchema(
        split=DatasetSplitType.DEVELOPMENT,
        percentage=70,
        totalRecords=2240,
        legitimateCount=1680,
        adversarialCount=560,
        accountsCount=180,
        devicesCount=140,
        isIsolated=False,
        lastUpdated=now_iso
    )
    split_val = DatasetSplitStatsSchema(
        split=DatasetSplitType.VALIDATION,
        percentage=15,
        totalRecords=480,
        legitimateCount=360,
        adversarialCount=120,
        accountsCount=45,
        devicesCount=38,
        isIsolated=False,
        lastUpdated=now_iso
    )
    split_test = DatasetSplitStatsSchema(
        split=DatasetSplitType.HELD_OUT,
        percentage=15,
        totalRecords=480,
        legitimateCount=360,
        adversarialCount=120,
        accountsCount=45,
        devicesCount=35,
        isIsolated=True,
        lastUpdated=now_iso
    )

    dataset1 = SyntheticDatasetResponse(
        id="ds-syn-01",
        name="E-Commerce Red-Team Master Partition",
        version="v2.4.0",
        totalRecords=3200,
        generationSeed=DETERMINISTIC_SEED,
        createdAt="2026-08-15T09:00:00Z",
        status="ACTIVE",
        splits=[split_dev, split_val, split_test],
        description="Synthetic high-entropy benchmark dataset consisting of legitimate organic shoppers and mixed adversarial attack strategies."
    )

    # 3. Attack Agents
    agents = [
        AttackAgentSchema(
            id="agent-vel-01",
            type=AttackAgentType.VELOCITY_ATTACKER,
            name="Velocity Attacker",
            description="Rapidly pulses transaction attempts right at and below time-window thresholds to exploit batch evaluation gaps.",
            target_policies=["pol-vel-01"],
            evasion_tactics=["Threshold skimming", "Micro-delays across sliding windows", "Sub-ceiling transaction amounts"],
            severity_potential=SeverityLevel.HIGH,
            icon_name="Zap"
        ),
        AttackAgentSchema(
            id="agent-idf-02",
            type=AttackAgentType.IDENTITY_FRAGMENTER,
            name="Identity Fragmenter",
            description="Generates dozens of synthetic accounts sharing hardware fingerprints and fuzzy addresses to evade single-account velocity limits.",
            target_policies=["pol-vel-01"],
            evasion_tactics=["Distributed customer IDs", "Shared hardware device reuse", "Pincode permutation"],
            severity_potential=SeverityLevel.CRITICAL,
            icon_name="Users"
        ),
        AttackAgentSchema(
            id="agent-ref-03",
            type=AttackAgentType.REFUND_ABUSER,
            name="Refund Abuser",
            description="Executes high-velocity small purchases followed by instantaneous simulated refunds to drain merchant promotional balance.",
            target_policies=["pol-vel-01"],
            evasion_tactics=["Rapid purchase-refund cycle", "Micro-amount draining", "Multi-instrument refund requests"],
            severity_potential=SeverityLevel.MEDIUM,
            icon_name="RotateCcw"
        ),
        AttackAgentSchema(
            id="agent-prm-04",
            type=AttackAgentType.PROMOTION_ABUSER,
            name="Promotion Abuser",
            description="Exploits new-user referral coupons and promo codes across rotating synthetic identities.",
            target_policies=["pol-vel-01"],
            evasion_tactics=["Single-use coupon farming", "Multi-identity promo redemption", "Referral cycle collusion"],
            severity_potential=SeverityLevel.MEDIUM,
            icon_name="Gift"
        ),
        AttackAgentSchema(
            id="agent-rot-05",
            type=AttackAgentType.PAYMENT_ROTATOR,
            name="Payment Rotator",
            description="Cycles synthetic credit cards, UPI handles, and virtual cards through single sessions to evade card-level rate limits.",
            target_policies=["pol-vel-01"],
            evasion_tactics=["Card BIN cycling", "UPI VPA rotation", "Virtual instrument exhaustion"],
            severity_potential=SeverityLevel.HIGH,
            icon_name="CreditCard"
        ),
        AttackAgentSchema(
            id="agent-cls-06",
            type=AttackAgentType.COORDINATED_CLUSTER,
            name="Coordinated Cluster",
            description="Orchestrates distributed, multi-account syndicates operating through shared proxy networks and synchronized timing.",
            target_policies=["pol-vel-01"],
            evasion_tactics=["Distributed timing orchestration", "Shared proxy pool rotation", "Mesh collusion topology"],
            severity_potential=SeverityLevel.CRITICAL,
            icon_name="Network"
        ),
    ]

    # 4. Simulation Run & Events
    sim1 = SimulationRunResponse(
        id="sim-run-8921",
        merchant_id=settings.DEV_MERCHANT_ID,
        policy_version_id="pv-vel-01-v10",
        policy_name="Core Merchant Velocity & High-Value Guard",
        policy_version_number="v1.0.0",
        seed=DETERMINISTIC_SEED,
        status=SimulationStatus.COMPLETED,
        run_type="FIRE_DRILL",
        started_at="2026-08-20T10:15:00Z",
        completed_at="2026-08-20T10:15:45Z",
        duration_seconds=45.2,
        total_transactions=3200,
        legitimate_transactions_count=2400,
        attack_transactions_count=800,
        attacks_attempted=800,
        bypasses_found=84,
        simulated_exposure=403200.0,
        detection_recall=71.4,
        false_positive_rate=5.4,
        events_processed=3200,
        active_agents=[
            AttackAgentType.VELOCITY_ATTACKER,
            AttackAgentType.IDENTITY_FRAGMENTER,
            AttackAgentType.PAYMENT_ROTATOR
        ]
    )

    events_sim1 = [
        SimulationEventResponse(
            id="evt-sim-01",
            simulation_id="sim-run-8921",
            event_type="SIMULATION_STARTED",
            sequence_num=1,
            timestamp="2026-08-20T10:15:01Z",
            sim_timestamp="2026-08-20T00:00:00Z",
            message="Deterministic simulation engine started with Seed 49201.",
            metadata={"seed": DETERMINISTIC_SEED, "total_txns": 3200}
        ),
        SimulationEventResponse(
            id="evt-sim-02",
            simulation_id="sim-run-8921",
            event_type="ENTITY_POOL_CREATED",
            sequence_num=2,
            timestamp="2026-08-20T10:15:05Z",
            sim_timestamp="2026-08-20T00:00:05Z",
            message="Synthesized entity pool: 240 legitimate accounts, 80 adversarial identity nodes.",
            metadata={"accounts": 320, "devices": 220}
        ),
        SimulationEventResponse(
            id="evt-sim-03",
            simulation_id="sim-run-8921",
            event_type="BYPASS_DETECTED",
            sequence_num=142,
            timestamp="2026-08-20T10:15:22Z",
            sim_timestamp="2026-08-20T03:14:10Z",
            message="Identity Fragmenter bypassed account velocity ceiling by rotating 8 accounts on shared hardware device.",
            metadata={"amount": 4800.0, "device_id": "dev-hw-9941", "decision": "ALLOW"}
        ),
        SimulationEventResponse(
            id="evt-sim-04",
            simulation_id="sim-run-8921",
            event_type="VULNERABILITY_IDENTIFIED",
            sequence_num=800,
            timestamp="2026-08-20T10:15:40Z",
            sim_timestamp="2026-08-20T12:00:00Z",
            message="Vulnerability identified: Multi-Account Device Fingerprint Collusion Bypass (84 bypasses, ₹4.03L exposure).",
            metadata={"severity": "CRITICAL", "bypass_rate": 0.286}
        ),
        SimulationEventResponse(
            id="evt-sim-05",
            simulation_id="sim-run-8921",
            event_type="SIMULATION_COMPLETED",
            sequence_num=3200,
            timestamp="2026-08-20T10:15:45Z",
            sim_timestamp="2026-08-20T23:59:59Z",
            message="Simulation completed. 3,200 transactions processed. Recall: 71.4%, FPR: 5.4%.",
            metadata={"recall": 71.4, "exposure": 403200.0}
        )
    ]

    # 5. Vulnerabilities
    evidence1 = VulnerabilityEvidenceSchema(
        id="evd-001",
        transaction_id="txn-adv-1049",
        account_id="acc-syn-8841",
        device_id="dev-hw-9941",
        ip_address="103.21.14.88",
        address_hash="addr_hash_blr_560001",
        payment_instrument="upi://synth_vpa_8841@okhdfcbank",
        amount=4800.0,
        sim_timestamp="2026-08-20T03:14:10Z",
        policy_rule_triggered=None,
        decision=RiskDecisionOutcome.ALLOWED,
        reason_missed="Policy only counted transactions per account_id; hardware device fingerprint was unconstrained."
    )

    vuln1 = VulnerabilityResponse(
        id="vuln-001",
        simulation_id="sim-run-8921",
        policy_id="pol-vel-01",
        policy_name="Core Merchant Velocity & High-Value Guard",
        policy_version_number="v1.0.0",
        title="Multi-Account Device Fingerprint Collusion Bypass",
        vulnerability_type="UNBOUNDED_HARDWARE_FINGERPRINT",
        severity=SeverityLevel.CRITICAL,
        attack_type=AttackAgentType.IDENTITY_FRAGMENTER,
        outcome="ALLOWED",
        bypass_count=84,
        total_attack_count=294,
        bypass_rate=0.286,
        simulated_exposure=403200.0,
        affected_entity_count=18,
        repeatability_score=1.0,
        confidence_score=0.98,
        executive_summary="Adversaries cycled 8 synthetic customer accounts across a single hardware fingerprint, executing 84 transactions totaling ₹4.03L with zero friction.",
        why_the_policy_failed="The active rule VELOCITY_ACCOUNT (rule-vel-001) evaluates sliding-window frequency strictly on account_id. Because each synthetic identity executed only 2 transactions per 10 minutes, the 5-txn/10m threshold was never breached.",
        attack_mechanism="Distributed customer accounts sharing device hardware fingerprint dev-hw-9941 pulsing sub-threshold UPI payments.",
        key_signal_missed="device_id frequency across distinct merchant accounts in a 60-minute window.",
        contributing_factors=[
            "No device-level velocity counter rule in active policy",
            "Fuzzy address normalization missing in rule condition",
            "UPI VPAs rotated across accounts without device correlation"
        ],
        recommended_remediation="Add policy rule: Block if device transaction count > 4 in 60-minute sliding window across all merchant accounts.",
        first_detected="2026-08-20T10:15:22Z",
        last_seen="2026-08-20T10:15:45Z",
        status="PATCH_PROPOSED",
        evidence=[evidence1]
    )

    vuln2 = VulnerabilityResponse(
        id="vuln-002",
        simulation_id="sim-run-8921",
        policy_id="pol-vel-01",
        policy_name="Core Merchant Velocity & High-Value Guard",
        policy_version_number="v1.0.0",
        title="Sliding Window Boundary Skimming",
        vulnerability_type="WINDOW_BOUNDARY_SKIMMING",
        severity=SeverityLevel.HIGH,
        attack_type=AttackAgentType.VELOCITY_ATTACKER,
        outcome="ALLOWED",
        bypass_count=52,
        total_attack_count=300,
        bypass_rate=0.173,
        simulated_exposure=312000.0,
        affected_entity_count=12,
        repeatability_score=0.95,
        confidence_score=0.92,
        executive_summary="Attacker timed transaction bursts to land exactly 10.1 minutes apart, resetting the 10-minute sliding window counter.",
        why_the_policy_failed="Fixed 10-minute evaluation window without cumulative 24-hour volume caps allowed predictable burst pacing.",
        attack_mechanism="Automated timing script executing 4 transactions within 8 minutes, sleeping 2.5 minutes, then repeating.",
        key_signal_missed="24-hour aggregate transaction volume and frequency decay curves.",
        contributing_factors=[
            "Short evaluation window (10 mins) without macro window ceiling",
            "Fixed amount per transaction just below review ceiling (₹6,000)"
        ],
        recommended_remediation="Add secondary 24-hour velocity ceiling: Flag review if 24h count > 12.",
        first_detected="2026-08-20T10:15:10Z",
        last_seen="2026-08-20T10:15:35Z",
        status="ACTIVE",
        evidence=[]
    )

    # 6. Patches
    rule_mod = PolicyRuleModificationSchema(
        rule_type="VELOCITY_DEVICE",
        operation="ADD",
        current_rule_text="None (Device velocity was unbounded)",
        proposed_rule_text="BLOCK if device transaction count > 4 in 60-minute sliding window across all merchant accounts.",
        rationale="Eliminates multi-account device collusion by binding rate limits directly to hardware device fingerprints."
    )

    patch_metrics = BeforeAfterMetricsSchema(
        precision=MetricDelta(before=82.5, after=95.8, delta=13.3),
        recall=MetricDelta(before=71.4, after=94.2, delta=22.8),
        f1=MetricDelta(before=76.5, after=95.0, delta=18.5),
        false_positive_rate=MetricDelta(before=5.4, after=1.8, delta=-3.6),
        attack_success_rate=MetricDelta(before=28.6, after=5.8, delta=-22.8),
        bypasses_count=MetricDelta(before=184.0, after=28.0, delta=-156.0),
        simulated_exposure=MetricDelta(before=1180000.0, after=340000.0, delta=-840000.0),
        customer_friction_impact="LOW (-3.6% false positive rate reduction)"
    )

    patch1 = PatchResponse(
        id="patch-991",
        vulnerability_id="vuln-001",
        vulnerability_title="Multi-Account Device Fingerprint Collusion Bypass",
        vulnerability_severity=SeverityLevel.CRITICAL,
        source_policy_id="pol-vel-01",
        source_policy_name="Core Merchant Velocity & High-Value Guard",
        source_policy_version="v1.0.0",
        target_policy_version="v1.1.0",
        status=PatchStatus.SIMULATED,
        identified_weakness="Cross-account device fingerprint linkage was missing from policy evaluation rules.",
        proposed_changes=[rule_mod],
        ai_reasoning="Synthesized defensive rule adding a 4-txn/60m device constraint. Deterministic simulation replay confirms +22.8% detection recall improvement and 71.2% simulated exposure reduction with zero legitimate customer disruption.",
        expected_risk_reduction="71.2% reduction in simulated financial exposure (₹8.4L saved).",
        expected_fpr_impact="FPR reduced from 5.4% to 1.8%.",
        expected_customer_friction="Negligible impact on legitimate one-device buyers.",
        validation_status="VALIDATED",
        confidence="HIGH",
        metrics_comparison=patch_metrics,
        created_at="2026-08-20T10:16:00Z"
    )

    # 7. Benchmarks
    m_before = BenchmarkMetricsSchema(
        total_transactions=480,
        total_adversarial=120,
        total_legitimate=360,
        true_positives=86,
        true_negatives=340,
        false_positives=20,
        false_negatives=34,
        precision=81.1,
        recall=71.7,
        f1_score=76.1,
        false_positive_rate=5.6,
        attack_success_rate=28.3,
        successful_bypasses=34,
        simulated_exposure=163200.0,
        exposure_reduction=0.0,
        customer_friction_score=5.6,
        policy_coverage=71.7,
        simulation_throughput=1420.0
    )

    m_after = BenchmarkMetricsSchema(
        total_transactions=480,
        total_adversarial=120,
        total_legitimate=360,
        true_positives=114,
        true_negatives=354,
        false_positives=6,
        false_negatives=6,
        precision=95.0,
        recall=95.0,
        f1_score=95.0,
        false_positive_rate=1.7,
        attack_success_rate=5.0,
        successful_bypasses=6,
        simulated_exposure=28800.0,
        exposure_reduction=134400.0,
        customer_friction_score=1.7,
        policy_coverage=95.0,
        simulation_throughput=1480.0
    )

    bm_run1 = BenchmarkRunResponse(
        id="bm-run-001",
        simulation_id="sim-run-8921",
        policy_id="pol-vel-01",
        policy_name="Core Merchant Velocity & High-Value Guard",
        policy_version_number="v1.0.0",
        dataset_split=DatasetSplitType.HELD_OUT,
        status="COMPLETED",
        metrics=m_before,
        is_held_out_isolated=True,
        executed_at="2026-08-20T10:15:50Z"
    )

    bm_run2 = BenchmarkRunResponse(
        id="bm-run-002",
        simulation_id="sim-run-8921",
        policy_id="pol-vel-01",
        policy_name="Core Merchant Velocity & High-Value Guard",
        policy_version_number="v1.1.0",
        dataset_split=DatasetSplitType.HELD_OUT,
        status="COMPLETED",
        metrics=m_after,
        is_held_out_isolated=True,
        executed_at="2026-08-20T10:16:30Z"
    )

    bm_comp1 = BenchmarkComparisonResponse(
        id="cmp-991",
        patch_id="patch-991",
        baseline_version="v1.0.0",
        patched_version="v1.1.0",
        dataset_split=DatasetSplitType.HELD_OUT,
        before=m_before,
        after=m_after,
        delta_recall=23.3,
        delta_precision=13.9,
        delta_fpr=-3.9,
        delta_exposure=134400.0,
        net_improvement_score=27.2,
        is_regression=False,
        recommendation="APPROVE_PATCH"
    )

    # 8. Incidents
    t_inc1 = IncidentTimelineEventSchema(
        id="evt-inc-01",
        timestamp="2026-08-20T10:15:22Z",
        title="Adversarial Bypass Detected",
        description="Autonomous Red-Team Agent executed 84 unflagged transactions across 8 synthetic accounts.",
        actor="Simulation Engine",
        type="DETECTION"
    )
    t_inc2 = IncidentTimelineEventSchema(
        id="evt-inc-02",
        timestamp="2026-08-20T10:15:45Z",
        title="Vulnerability Logged",
        description="Weakness logged as 'Multi-Account Device Fingerprint Collusion Bypass' with ₹4.03L simulated exposure.",
        actor="Vulnerability Engine",
        type="SIMULATION"
    )
    t_inc3 = IncidentTimelineEventSchema(
        id="evt-inc-03",
        timestamp="2026-08-20T10:16:00Z",
        title="AI Defensive Patch Generated",
        description="PatchProposal patch-991 generated proposing device velocity ceiling rule.",
        actor="AI Agent (Patch Generator)",
        type="PATCH"
    )

    inc1 = IncidentResponse(
        id="inc-2026-089",
        incident_number="INC-2026-089",
        title="Cross-Account Hardware Rate Limit Evasion",
        severity=SeverityLevel.CRITICAL,
        status=IncidentStatus.OPEN,
        affected_policy_id="pol-vel-01",
        affected_policy_name="Core Merchant Velocity & High-Value Guard",
        vulnerability_id="vuln-001",
        vulnerability_title="Multi-Account Device Fingerprint Collusion Bypass",
        simulation_id="sim-run-8921",
        simulated_exposure=403200.0,
        bypasses_count=84,
        detected_at="2026-08-20T10:15:22Z",
        owner="Harsh Shrivastava",
        summary="Red-team simulation identified critical weakness in account-scoped rate limits. An attacker cycling 8 synthetic accounts through a single hardware fingerprint bypassed all merchant velocity constraints.",
        timeline=[t_inc1, t_inc2, t_inc3]
    )

    inc2 = IncidentResponse(
        id="inc-2026-088",
        incident_number="INC-2026-088",
        title="Sub-Ceiling Micro-Payment Burst",
        severity=SeverityLevel.HIGH,
        status=IncidentStatus.INVESTIGATING,
        affected_policy_id="pol-vel-01",
        affected_policy_name="Core Merchant Velocity & High-Value Guard",
        vulnerability_id="vuln-002",
        vulnerability_title="Sliding Window Boundary Skimming",
        simulation_id="sim-run-8921",
        simulated_exposure=312000.0,
        bypasses_count=52,
        detected_at="2026-08-20T10:15:10Z",
        owner="Priya Sharma",
        summary="Timed micro-bursts of ₹6,000 transactions spaced 610 seconds apart evaded 10-minute sliding window controls.",
        timeline=[]
    )

    # 9. Audit Logs
    audit1 = AuditLogResponse(
        id="aud-001",
        timestamp="2026-08-20T10:15:00Z",
        action="SIMULATION_EXECUTION_TRIGGERED",
        actor_type=AuditActorType.USER,
        actor_name="Harsh Shrivastava",
        entity_type="SimulationRun",
        entity_id="sim-run-8921",
        entity_name="Fire Drill: Velocity & Hardware Stress Test",
        status="SUCCESS",
        details={"seed": DETERMINISTIC_SEED, "txns": 3200, "policy": "pol-vel-01"},
        ip_address="192.168.1.45"
    )
    audit2 = AuditLogResponse(
        id="aud-002",
        timestamp="2026-08-20T10:15:45Z",
        action="VULNERABILITY_DISCOVERED",
        actor_type=AuditActorType.SYSTEM,
        actor_name="VulnerabilityEngine",
        entity_type="Vulnerability",
        entity_id="vuln-001",
        entity_name="Multi-Account Device Fingerprint Collusion Bypass",
        status="WARNING",
        details={"bypass_count": 84, "exposure": 403200.0, "severity": "CRITICAL"},
        ip_address="127.0.0.1"
    )
    audit3 = AuditLogResponse(
        id="aud-003",
        timestamp="2026-08-20T10:16:00Z",
        action="AI_DEFENSIVE_PATCH_PROPOSED",
        actor_type=AuditActorType.AI_AGENT,
        actor_name="MockAIProvider (openai/gpt-oss-120b)",
        entity_type="PolicyPatch",
        entity_id="patch-991",
        entity_name="Device Rate Limiter (4 txns/60m)",
        status="SUCCESS",
        details={"target_policy": "pol-vel-01", "rule_type": "VELOCITY_DEVICE"},
        ip_address="127.0.0.1"
    )
    audit4 = AuditLogResponse(
        id="aud-004",
        timestamp="2026-08-20T10:16:30Z",
        action="HELD_OUT_BENCHMARK_EVALUATED",
        actor_type=AuditActorType.SYSTEM,
        actor_name="BenchmarkEngine",
        entity_type="BenchmarkRun",
        entity_id="bm-run-002",
        entity_name="15% Sealed Held-Out Test Evaluation",
        status="SUCCESS",
        details={"split": "held_out", "delta_recall": 23.3, "delta_exposure": -134400.0},
        ip_address="127.0.0.1"
    )

    # 10. Reports
    fnd1 = ReportFindingSchema(
        id="fnd-01",
        title="Multi-Account Device Fingerprint Collusion",
        severity="CRITICAL",
        affected_policy="Core Merchant Velocity & High-Value Guard",
        exposure_estimate=403200.0,
        description="Autonomous Red-Team simulation proved that cycling multiple accounts on a single hardware device bypassed single-account rate limit controls.",
        remediation_status="PATCH_VALIDATED"
    )
    fnd2 = ReportFindingSchema(
        id="fnd-02",
        title="Sliding Window Boundary Skimming",
        severity="HIGH",
        affected_policy="Core Merchant Velocity & High-Value Guard",
        exposure_estimate=312000.0,
        description="Micro-bursts placed precisely 10.1 minutes apart evaded the 10-minute rate limit window.",
        remediation_status="ACTIVE_INVESTIGATION"
    )

    rep1 = ExecutiveReportResponse(
        id="rep-2026-001",
        report_number="RF-AUDIT-2026-08",
        title="Q3 Adversarial Red-Team Stress Test & Generalization Audit",
        created_at="2026-08-20T10:17:00Z",
        simulation_id="sim-run-8921",
        policy_version_tested="v1.0.0",
        author="RiskFire Automated Audit Engine",
        status="FINAL",
        risk_posture_score=74,
        executive_summary="RiskFire performed a comprehensive red-team simulation across 3,200 synthetic transactions (Seed 49201). The simulation identified 2 high-severity policy vulnerabilities causing ₹11.8L in gross synthetic exposure. An AI-proposed patch was evaluated on the sealed 15% Held-Out Test Set, demonstrating +22.8% detection recall gain and 71.2% simulated exposure reduction.",
        key_findings=[fnd1, fnd2],
        top_vulnerabilities_count=2,
        total_simulated_exposure=1180000.0,
        overall_policy_recall=94.2,
        overall_fpr=1.8,
        recommended_actions=[
            "Deploy validated device velocity patch (patch-991) to production risk rules.",
            "Introduce 24-hour cumulative account volume ceilings.",
            "Enable automated weekly red-team fire drills in CI/CD pipeline."
        ],
        methodology_disclaimer="All metrics and evaluations in this report were generated inside a strictly controlled synthetic sandbox environment. Financial figures represent simulated exposure."
    )

    return {
        "policies": [policy1, policy2, policy3, policy4, policy5, policy6, policy7, policy8, policy9],
        "datasets": [dataset1],
        "attack_agents": agents,
        "simulations": [sim1],
        "simulation_events": events_sim1,
        "vulnerabilities": [vuln1, vuln2],
        "patches": [patch1],
        "benchmarks": [bm_run1, bm_run2],
        "benchmark_comparisons": [bm_comp1],
        "incidents": [inc1, inc2],
        "audit_logs": [audit1, audit2, audit3, audit4],
        "reports": [rep1],
    }


def seed_data_into_db(db, seed_data=None):
    """
    Populates any compliant MongoDB database instance with deterministic seed entities.
    """
    if seed_data is None:
        seed_data = build_seed_data()
    
    # Insert or Upsert Seed Entities
    logger.info("Seeding deterministic policies...")
    for item in seed_data["policies"]:
        db.policies.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding synthetic datasets...")
    for item in seed_data["datasets"]:
        db.datasets.update_one({"id": item.id}, {"$set": item.model_dump(by_alias=True)}, upsert=True)

    logger.info("Seeding attack agents...")
    for item in seed_data["attack_agents"]:
        db.attack_agents.update_one(
            {"type": item.type.value if hasattr(item.type, "value") else str(item.type)},
            {"$set": item.model_dump()},
            upsert=True
        )

    logger.info("Seeding simulations...")
    for item in seed_data["simulations"]:
        db.simulations.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding simulation events...")
    for item in seed_data["simulation_events"]:
        db.simulation_events.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding vulnerabilities...")
    for item in seed_data["vulnerabilities"]:
        db.vulnerabilities.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding patches...")
    for item in seed_data["patches"]:
        db.patches.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding benchmark runs and comparisons...")
    for item in seed_data["benchmarks"]:
        db.benchmarks.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)
    for item in seed_data["benchmark_comparisons"]:
        db.benchmark_comparisons.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding incidents...")
    for item in seed_data["incidents"]:
        db.incidents.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding audit logs...")
    for item in seed_data["audit_logs"]:
        db.audit_logs.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)

    logger.info("Seeding executive reports...")
    for item in seed_data["reports"]:
        db.reports.update_one({"id": item.id}, {"$set": item.model_dump()}, upsert=True)


def seed_database(reset: bool = False):
    logger.info(f"Connecting to MongoDB database: '{settings.MONGODB_DB_NAME}'...")
    db = init_mongo()
    
    if reset:
        logger.warning("Reset mode specified: Clearing existing domain collections...")
        collections_to_clear = [
            "policies",
            "datasets",
            "attack_agents",
            "attack_scenarios",
            "simulations",
            "simulation_events",
            "vulnerabilities",
            "patches",
            "benchmarks",
            "benchmark_comparisons",
            "incidents",
            "audit_logs",
            "reports"
        ]
        for col_name in collections_to_clear:
            db[col_name].delete_many({})
        try:
            db.attack_agents.drop_indexes()
        except Exception:
            pass
        logger.info("Cleared collections successfully.")

    seed_data_into_db(db)

    logger.info(
        f"Deterministic RiskFire seeding (Seed {DETERMINISTIC_SEED}) completed successfully! "
        f"Database '{settings.MONGODB_DB_NAME}' is populated and relationally consistent."
    )
    close_mongo()



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deterministic MongoDB Seeding for RiskFire")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Wipe existing collections before seeding (DESTRUCTIVE). Use with intention."
    )
    args = parser.parse_args()
    seed_database(reset=args.reset)
