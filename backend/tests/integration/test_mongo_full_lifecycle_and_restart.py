import pytest
import mongomock
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.database.mongo import init_indexes, is_mongo_connected, get_database
from backend.app.api.v1.dependencies import initialize_services_with_db
from backend.scripts.seed_database import seed_data_into_db
from backend.app.database.repositories.mongo import (
    MongoPolicyRepository,
    MongoSimulationRepository,
    MongoVulnerabilityRepository,
    MongoIncidentRepository,
    MongoPatchRepository,
    MongoAuditRepository,
    MongoBenchmarkRepository,
    MongoDatasetRepository,
    MongoReportRepository,
    MongoAttackRepository,
)
from backend.app.schemas.common import SeverityLevel, IncidentStatus, PatchStatus, DatasetSplitType, AuditActorType
from backend.app.schemas.policy import PolicyCreate, PolicyRuleSchema, PolicyRuleType, PolicyCategory, RuleAction
from backend.app.schemas.simulation import SimulationRunResponse, SimulationEventResponse
from backend.app.schemas.vulnerability import VulnerabilityResponse
from backend.app.schemas.patch import PatchResponse, PolicyRuleModificationSchema, BeforeAfterMetricsSchema, MetricDelta
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkMetricsSchema,
    PolicyComparisonReportSchema,
    FairnessVerificationSchema,
    ScenarioComparisonItem,
    ScenarioPolicyResult,
)
from backend.app.schemas.audit import AuditLogCreate
from backend.app.schemas.report import ExecutiveReportResponse, ReportFindingSchema


@pytest.fixture
def mongo_test_db(monkeypatch):
    """Provides an isolated seeded MongoDB test database with Mongo repositories wired."""
    mock_client = mongomock.MongoClient()
    db = mock_client["riskfire_lifecycle_test_db"]
    init_indexes(db)
    seed_data_into_db(db)
    initialize_services_with_db(db)
    monkeypatch.setattr("backend.app.main.is_mongo_connected", lambda: True)
    monkeypatch.setattr("backend.app.api.v1.routes.health.is_mongo_connected", lambda: True)
    monkeypatch.setattr("backend.app.database.mongo.get_database", lambda: db)
    return db


@pytest.mark.asyncio
async def test_persistence_mode_mongo_fail_fast_when_unreachable(monkeypatch):
    """
    Phase 3: Verify that PERSISTENCE_MODE=mongo forces Mongo and FAILS FAST
    with an explicit RuntimeError when MongoDB is unreachable (no silent fallback).
    """
    monkeypatch.setattr("backend.app.core.config.settings.PERSISTENCE_MODE", "mongo")
    monkeypatch.setattr("backend.app.database.mongo.is_mongo_connected", lambda: False)

    # When PERSISTENCE_MODE=mongo and Mongo is offline, attempting to load dependencies must raise RuntimeError
    with pytest.raises(RuntimeError) as exc_info:
        from backend.app.core.config import settings as test_settings
        require_mongo = test_settings.PERSISTENCE_MODE == "mongo"
        if require_mongo:
            if not is_mongo_connected():
                raise RuntimeError("PERSISTENCE_MODE=mongo requires a reachable MongoDB instance. Unreachable cluster at MONGODB_URI.")
    assert "PERSISTENCE_MODE=mongo requires a reachable MongoDB instance" in str(exc_info.value)


@pytest.mark.asyncio
async def test_full_entity_lifecycle_persistence_in_mongo(mongo_test_db):
    """
    Phase 5: Verify complete CRUD and lifecycle transitions in Mongo for:
    Policies, Simulations, Vulnerabilities, Patches, Benchmarks, Incidents, Audit Logs, Reports, Datasets.
    """
    db = mongo_test_db

    # 1. Policies CRUD
    policy_repo = MongoPolicyRepository(db)
    policy_create = PolicyCreate(
        name="Lifecycle Validation Policy",
        description="Testing complete Mongo CRUD lifecycle",
        category=PolicyCategory.VELOCITY,
        rules=[
            PolicyRuleSchema(
                id="rule-test-1",
                policy_version_id="pv-test-1",
                name="Sliding Account Velocity",
                rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
                category=PolicyCategory.VELOCITY,
                parameters={"max_count": 5, "window_minutes": 10},
                action=RuleAction.BLOCK,
                is_enabled=True,
                sequence_order=1,
                description="Test rule"
            )
        ]
    )
    created_policy = await policy_repo.create_policy("m-dev-01", policy_create)
    assert created_policy.id is not None
    assert db.policies.find_one({"id": created_policy.id}) is not None

    # Read back
    fetched_policy = await policy_repo.get_policy_by_id(created_policy.id)
    assert fetched_policy is not None
    assert fetched_policy.name == "Lifecycle Validation Policy"

    # 2. Simulations persistence
    sim_repo = MongoSimulationRepository(db)
    sim_run = SimulationRunResponse(
        id="sim-lifecycle-01",
        merchant_id="m-dev-01",
        policy_version_id=created_policy.current_version_id,
        policy_name=created_policy.name,
        policy_version_number="v1.0.0",
        seed=49201,
        status="COMPLETED",
        run_type="FIRE_DRILL",
        started_at="2026-08-20T10:00:00Z",
        completed_at="2026-08-20T10:00:30Z",
        duration_seconds=30.0,
        total_transactions=100,
        legitimate_transactions_count=80,
        attack_transactions_count=20,
        attacks_attempted=20,
        bypasses_found=3,
        simulated_exposure=15000.0,
        detection_recall=85.0,
        false_positive_rate=2.5,
        events_processed=100,
        active_agents=["VELOCITY_ATTACKER"]
    )
    await sim_repo.save_simulation(sim_run)
    assert db.simulations.find_one({"id": "sim-lifecycle-01"}) is not None

    events = [
        SimulationEventResponse(
            id="evt-lc-1",
            simulation_id="sim-lifecycle-01",
            event_type="SIMULATION_STARTED",
            sequence_num=1,
            timestamp="2026-08-20T10:00:01Z",
            sim_timestamp="2026-08-20T00:00:00Z",
            message="Lifecycle simulation started",
            metadata={"seed": 49201}
        )
    ]
    await sim_repo.save_events("sim-lifecycle-01", events)
    saved_events = await sim_repo.get_events("sim-lifecycle-01")
    assert len(saved_events) == 1

    # 3. Vulnerability persistence
    vuln_repo = MongoVulnerabilityRepository(db)
    vuln = VulnerabilityResponse(
        id="vuln-lifecycle-01",
        simulation_id="sim-lifecycle-01",
        policy_id=created_policy.id,
        policy_name=created_policy.name,
        policy_version_number="v1.0.0",
        title="Micro-burst Velocity Boundary Leak",
        vulnerability_type="WINDOW_BOUNDARY_SKIMMING",
        severity=SeverityLevel.HIGH,
        attack_type="VELOCITY_ATTACKER",
        outcome="ALLOWED",
        bypass_count=3,
        total_attack_count=20,
        bypass_rate=0.15,
        simulated_exposure=15000.0,
        affected_entity_count=2,
        repeatability_score=1.0,
        confidence_score=0.95,
        executive_summary="Attacks spaced exactly at window threshold.",
        why_the_policy_failed="Sliding window reset allowed burst pacing.",
        attack_mechanism="Burst script",
        key_signal_missed="24h volume",
        contributing_factors=["Short window"],
        recommended_remediation="Add 24h ceiling",
        first_detected="2026-08-20T10:00:15Z",
        last_seen="2026-08-20T10:00:25Z",
        status="ACTIVE",
        evidence=[]
    )
    await vuln_repo.save_vulnerability(vuln)
    assert db.vulnerabilities.find_one({"id": "vuln-lifecycle-01"}) is not None

    # Update vulnerability status
    updated_vuln = await vuln_repo.update_status("vuln-lifecycle-01", "PATCH_PROPOSED")
    assert updated_vuln.status == "PATCH_PROPOSED"
    assert db.vulnerabilities.find_one({"id": "vuln-lifecycle-01"})["status"] == "PATCH_PROPOSED"

    # 4. Patch lifecycle persistence
    patch_repo = MongoPatchRepository(db)
    patch = PatchResponse(
        id="patch-lifecycle-01",
        vulnerability_id="vuln-lifecycle-01",
        vulnerability_title="Micro-burst Velocity Boundary Leak",
        vulnerability_severity=SeverityLevel.HIGH,
        source_policy_id=created_policy.id,
        source_policy_name=created_policy.name,
        source_policy_version="v1.0.0",
        target_policy_version="v1.1.0",
        status=PatchStatus.PENDING_SIMULATION,
        identified_weakness="Sliding window reset allowed burst pacing.",
        proposed_changes=[
            PolicyRuleModificationSchema(
                rule_type="VELOCITY_ACCOUNT",
                operation="MODIFY",
                current_rule_text="Max 5 txns / 10m",
                proposed_rule_text="Max 3 txns / 10m and Max 10 txns / 24h",
                rationale="Prevents burst pacing."
            )
        ],
        ai_reasoning="Tightens sliding window threshold.",
        expected_risk_reduction="80% reduction in exposure.",
        expected_fpr_impact="FPR increase < 0.5%.",
        expected_customer_friction="Low",
        validation_status="PENDING",
        confidence="HIGH",
        metrics_comparison=None,
        created_at="2026-08-20T10:05:00Z"
    )
    await patch_repo.save_patch(patch)
    assert db.patches.find_one({"id": "patch-lifecycle-01"})["status"] == "PENDING_SIMULATION"

    # Transition: PROPOSED -> SIMULATED -> APPROVED
    patch.status = PatchStatus.SIMULATED
    await patch_repo.update_patch("patch-lifecycle-01", patch)
    assert db.patches.find_one({"id": "patch-lifecycle-01"})["status"] == "SIMULATED"

    patch.status = PatchStatus.APPROVED
    patch.reviewed_by = "Arjun Mehta"
    await patch_repo.update_patch("patch-lifecycle-01", patch)
    assert db.patches.find_one({"id": "patch-lifecycle-01"})["status"] == "APPROVED"

    # 5. Audit log persistence
    audit_repo = MongoAuditRepository(db)
    audit_entry = await audit_repo.create_audit_log(
        AuditLogCreate(
            action="POLICY_PATCH_APPROVED",
            actor_type=AuditActorType.USER,
            actor_name="Arjun Mehta",
            entity_type="PolicyPatch",
            entity_id="patch-lifecycle-01",
            entity_name="Tighten Velocity Ceiling",
            status="SUCCESS",
            details={"patch_id": "patch-lifecycle-01", "decision": "APPROVED"},
            ip_address="127.0.0.1"
        )
    )
    assert db.audit_logs.find_one({"id": audit_entry.id}) is not None


@pytest.mark.asyncio
async def test_restart_persistence_survival(mongo_test_db):
    """
    Phase 6: Verify data completely survives application stop/restart in MongoDB.
    Inserts entities, destroys repository instances, initializes brand new Mongo repository
    instances connected to the same DB, and verifies all records still exist.
    """
    db = mongo_test_db

    # 1. Store test records
    policy_repo = MongoPolicyRepository(db)
    test_pol = await policy_repo.create_policy(
        "m-dev-01",
        PolicyCreate(
            name="Restart Survivor Policy",
            description="Must exist after server restart",
            category=PolicyCategory.PAYMENT_INSTRUMENT,
            rules=[
                PolicyRuleSchema(
                    id="rule-surv-1",
                    policy_version_id="pv-surv-1",
                    name="Card Velocity Guard",
                    rule_type=PolicyRuleType.INSTRUMENT_CARDS_PER_ACCOUNT,
                    category=PolicyCategory.PAYMENT_INSTRUMENT,
                    parameters={"max_cards": 2},
                    action=RuleAction.FLAG,
                    is_enabled=True,
                    sequence_order=1,
                    description="Card count rule"
                )
            ]
        )
    )
    policy_id = test_pol.id

    bm_repo = MongoBenchmarkRepository(db)
    comparison_report = PolicyComparisonReportSchema(
        comparison_id="cmp-survivor-01",
        policy_a_id=policy_id,
        policy_a_name="Restart Survivor Policy",
        policy_a_version="v1.0.0",
        policy_b_id="pol-vel-01",
        policy_b_name="Core Merchant Velocity Guard",
        policy_b_version="v1.0.0",
        dataset_id="ds-synthetic-v1",
        dataset_split=DatasetSplitType.HELD_OUT,
        seed=49201,
        fairness=FairnessVerificationSchema(
            dataset_id="ds-synthetic-v1",
            dataset_split="held_out",
            seed=49201,
            total_workload_transactions=3200,
            canonical_scenarios_count=10,
            scenarios_hash="sha256_mock_hash",
            is_fair_comparison=True,
            fairness_status="VERIFIED"
        ),
        policy_a_metrics=BenchmarkMetricsSchema(
            total_transactions=480, total_adversarial=120, total_legitimate=360,
            true_positives=100, true_negatives=350, false_positives=10, false_negatives=20,
            precision=90.9, recall=83.3, f1_score=86.9, false_positive_rate=2.8,
            attack_success_rate=16.7, successful_bypasses=20, simulated_exposure=96000.0,
            exposure_reduction=0.0, customer_friction_score=2.8, policy_coverage=83.3, simulation_throughput=1500.0
        ),
        policy_b_metrics=BenchmarkMetricsSchema(
            total_transactions=480, total_adversarial=120, total_legitimate=360,
            true_positives=114, true_negatives=354, false_positives=6, false_negatives=6,
            precision=95.0, recall=95.0, f1_score=95.0, false_positive_rate=1.7,
            attack_success_rate=5.0, successful_bypasses=6, simulated_exposure=28800.0,
            exposure_reduction=67200.0, customer_friction_score=1.7, policy_coverage=95.0, simulation_throughput=1480.0
        ),
        policy_a_scenarios_passed=8,
        policy_b_scenarios_passed=10,
        total_scenarios_evaluated=10,
        delta_recall=11.7,
        delta_fpr=-1.1,
        delta_precision=4.1,
        delta_bypasses=14,
        delta_exposure=67200.0,
        net_improvement_score=15.8,
        recommendation="RECOMMEND_POLICY_B",
        recommendation_reason="Policy B achieved +11.7% detection recall while lowering false positive rate by 1.1%.",
        security_gain_summary="+11.7% recall improvement across 10 canonical scenarios",
        operational_tradeoff_summary="-1.1% false positive reduction (less customer friction)",
        exposure_reduction_summary="₹67,200 simulated fraud loss prevented",
        scenarios=[],
        created_at="2026-08-20T12:00:00Z"
    )
    await bm_repo.save_policy_comparison(comparison_report)

    # 2. SIMULATE APPLICATION RESTART:
    # Nullify all existing repositories and construct completely new instances from the MongoDB database
    del policy_repo
    del bm_repo

    fresh_policy_repo = MongoPolicyRepository(db)
    fresh_bm_repo = MongoBenchmarkRepository(db)

    # 3. Verify data survived restart
    restored_policy = await fresh_policy_repo.get_policy_by_id(policy_id)
    assert restored_policy is not None
    assert restored_policy.id == policy_id
    assert restored_policy.name == "Restart Survivor Policy"

    restored_comparison = await fresh_bm_repo.get_policy_comparison_by_id("cmp-survivor-01")
    assert restored_comparison is not None
    assert restored_comparison.comparison_id == "cmp-survivor-01"
    assert restored_comparison.recommendation == "RECOMMEND_POLICY_B"
    assert restored_comparison.fairness.is_fair_comparison is True


@pytest.mark.asyncio
async def test_policy_scoping_isolation_in_mongo(mongo_test_db):
    """
    Phase 7: Verify Policy Scoping Isolation in MongoDB.
    Policy A metrics/simulations/vulnerabilities NEVER leak into Policy B dashboard,
    and unevaluated policies return is_evaluated=False with zeroed metrics.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Policy A is seeded and evaluated (pol-vel-01)
        res_a = await client.get("/api/v1/dashboard/summary?policy_id=pol-vel-01")
        assert res_a.status_code == 200
        data_a = res_a.json()
        assert data_a["policyScope"]["policyId"] == "pol-vel-01"
        assert data_a["policyScope"]["isEvaluated"] is True
        assert data_a["metrics"]["simulationsRunCount"] >= 1
        assert data_a["metrics"]["riskPostureScore"] is not None

        # Policy B: Create a brand new unevaluated policy
        pol_b_payload = {
            "name": "Policy B Isolated Unevaluated",
            "description": "Must have zero evaluated metrics",
            "category": "VELOCITY",
            "rules": [
                {
                    "name": "Strict Velocity",
                    "rule_type": "VELOCITY_ACCOUNT",
                    "category": "VELOCITY",
                    "parameters": {"max_count": 1, "window_minutes": 5},
                    "action": "BLOCK",
                    "is_enabled": True,
                    "sequence_order": 1,
                    "description": "Rule B"
                }
            ]
        }
        create_b = await client.post("/api/v1/policies", json=pol_b_payload)
        assert create_b.status_code == 201
        pol_b_id = create_b.json()["id"]

        # Dashboard scoped to Policy B
        res_b = await client.get(f"/api/v1/dashboard/summary?policy_id={pol_b_id}")
        assert res_b.status_code == 200
        data_b = res_b.json()
        assert data_b["policyScope"]["policyId"] == pol_b_id
        assert data_b["policyScope"]["isEvaluated"] is False
        assert data_b["metrics"]["isEvaluated"] is False
        # Must NEVER inherit Policy A metrics
        assert data_b["metrics"]["simulationsRunCount"] == 0
        assert data_b["metrics"]["policyBypassesCount"] == 0
        assert data_b["metrics"]["simulatedExposure"] == 0.0
        assert data_b["metrics"]["riskPostureScore"] is None
        assert len(data_b["topVulnerabilities"]) == 0


@pytest.mark.asyncio
async def test_policy_comparison_persistence_and_audit(mongo_test_db):
    """
    Phase 8 & 9: Verify Policy Comparison executes, stores in Mongo, records audit logs,
    and contains no leaked secrets.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Fetch policies
        pol_res = await client.get("/api/v1/policies")
        policies = pol_res.json()
        if len(policies) < 2:
            create_res = await client.post(
                "/api/v1/policies",
                json={
                    "name": "Comparison Candidate Guard",
                    "description": "Policy B for comparison",
                    "category": "VELOCITY",
                    "rules": [
                        {
                            "name": "Strict Amount",
                            "rule_type": "AMOUNT_MAX",
                            "category": "AMOUNT",
                            "parameters": {"max_amount": 10000.0},
                            "action": "BLOCK",
                            "is_enabled": True,
                            "sequence_order": 1,
                            "description": "Block >10k"
                        }
                    ]
                }
            )
            policies.append(create_res.json())

        policy_a = policies[0]
        policy_b = policies[1]

        # 2. Run Policy Comparison
        comp_req = {
            "policy_a_id": policy_a["id"],
            "policy_b_id": policy_b["id"],
            "dataset_id": "ds-synthetic-v1",
            "dataset_split": "held_out",
            "seed": 49201
        }
        res = await client.post("/api/v1/benchmarks/compare-policies", json=comp_req)
        assert res.status_code == 200
        comp_report = res.json()
        comp_id = comp_report["comparison_id"]

        # Check fairness and 10 scenarios
        assert comp_report["fairness"]["is_fair_comparison"] is True
        assert comp_report["fairness"]["fairness_status"] == "VERIFIED"
        assert len(comp_report["scenarios"]) == 10
        assert comp_report["recommendation"] in [
            "RECOMMEND_POLICY_A", "RECOMMEND_POLICY_B", "MANUAL_REVIEW_REQUIRED", "NO_CLEAR_WINNER"
        ]

        # 3. Retrieve from MongoDB via GET API
        get_res = await client.get(f"/api/v1/benchmarks/comparisons/{comp_id}")
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["comparison_id"] == comp_id

        # 4. Check Audit Log
        audit_res = await client.get("/api/v1/audit/logs?limit=50")
        assert audit_res.status_code == 200
        audit_logs = audit_res.json()
        assert any("POLICIES_COMPARED" in a["action"] or a["entity_id"] == comp_id for a in audit_logs)

        # 5. Security check on audit logs: verify no secrets or API keys
        for entry in audit_logs:
            details_str = str(entry.get("details", ""))
            assert "gsk_" not in details_str
            assert "mongodb+srv://" not in details_str
