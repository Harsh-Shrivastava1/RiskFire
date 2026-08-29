import pytest
from datetime import datetime, timezone
from backend.app.schemas.common import (
    DatasetSplitType,
    IncidentStatus,
    PatchStatus,
    PolicyStatus,
    SeverityLevel,
    SimulationStatus,
    AuditActorType,
)
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.policy import (
    PolicyCreate,
    PolicyUpdate,
    PolicyRuleSchema,
    PolicyVersionSchema,
    PolicyRuleType,
    PolicyCategory,
    RuleAction,
)
from backend.app.schemas.simulation import (
    SimulationRunResponse,
    SimulationEventResponse,
)
from backend.app.schemas.vulnerability import VulnerabilityResponse
from backend.app.schemas.patch import PatchResponse
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkComparisonResponse,
    BenchmarkMetricsSchema,
)
from backend.app.schemas.dataset import SyntheticDatasetResponse, DatasetSplitStatsSchema
from backend.app.schemas.incident import IncidentCreate, IncidentUpdate
from backend.app.schemas.audit import AuditLogCreate
from backend.app.schemas.report import ExecutiveReportResponse

from backend.app.database.repositories.memory.memory_policy_repo import InMemoryPolicyRepository
from backend.app.database.repositories.memory.memory_simulation_repo import InMemorySimulationRepository
from backend.app.database.repositories.memory.memory_vulnerability_repo import InMemoryVulnerabilityRepository
from backend.app.database.repositories.memory.memory_patch_repo import InMemoryPatchRepository
from backend.app.database.repositories.memory.memory_benchmark_repo import InMemoryBenchmarkRepository
from backend.app.database.repositories.memory.memory_dataset_repo import InMemoryDatasetRepository
from backend.app.database.repositories.memory.memory_incident_repo import InMemoryIncidentRepository
from backend.app.database.repositories.memory.memory_audit_repo import InMemoryAuditRepository
from backend.app.database.repositories.memory.memory_report_repo import InMemoryReportRepository

from backend.app.database.mongo import get_database, is_mongo_connected
from backend.app.database.repositories.mongo import (
    MongoPolicyRepository,
    MongoSimulationRepository,
    MongoVulnerabilityRepository,
    MongoPatchRepository,
    MongoBenchmarkRepository,
    MongoDatasetRepository,
    MongoIncidentRepository,
    MongoAuditRepository,
    MongoReportRepository,
)


@pytest.fixture(scope="module")
def mongo_db():
    if is_mongo_connected():
        try:
            return get_database()
        except Exception:
            return None
    return None


def get_repos(mem_repo, mongo_repo_cls, db):
    if db is not None:
        return [mem_repo, mongo_repo_cls(db)]
    return [mem_repo]



@pytest.mark.anyio
async def test_policy_repository_contract(mongo_db):
    mem_repo = InMemoryPolicyRepository()

    rule = PolicyRuleSchema(
        id="test-rule-1",
        name="Test Velocity Rule",
        rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
        category=PolicyCategory.VELOCITY,
        parameters={"max_txns": 5},
        action=RuleAction.BLOCK,
        is_enabled=True,
    )
    pol_create = PolicyCreate(
        name="Contract Test Policy",
        description="Testing Policy Repository Contract",
        category=PolicyCategory.VELOCITY,
        rules=[rule],
        notes="Contract test",
    )

    for repo in get_repos(mem_repo, MongoPolicyRepository, mongo_db):
        created = await repo.create_policy("m-contract-01", pol_create)
        assert created.id is not None
        assert created.name == "Contract Test Policy"
        assert created.is_active is True

        fetched = await repo.get_policy_by_id(created.id)
        assert fetched is not None
        assert fetched.id == created.id
        assert len(fetched.versions) >= 1

        active = await repo.get_active_policy("m-contract-01")
        assert active is not None
        assert active.id == created.id

        updated = await repo.update_policy(created.id, PolicyUpdate(name="Updated Contract Policy"))
        assert updated is not None
        assert updated.name == "Updated Contract Policy"

        # Not found handling
        missing = await repo.get_policy_by_id("pol-nonexistent-999")
        assert missing is None

        # Clean up
        deleted = await repo.delete_policy(created.id)
        assert deleted is True


@pytest.mark.anyio
async def test_simulation_repository_contract(mongo_db):
    mem_repo = InMemorySimulationRepository()

    sim = SimulationRunResponse(
        id="sim-contract-test-01",
        merchant_id="m-contract-01",
        policy_version_id="pv-001",
        policy_name="Test Policy",
        policy_version_number="v1.0.0",
        seed=12345,
        status=SimulationStatus.COMPLETED,
        run_type="MANUAL",
        started_at="2026-08-20T10:00:00Z",
        total_transactions=100,
        legitimate_transactions_count=80,
        attack_transactions_count=20,
        attacks_attempted=20,
        bypasses_found=2,
        simulated_exposure=10000.0,
        detection_recall=90.0,
        false_positive_rate=1.0,
        events_processed=100,
    )

    events = [
        SimulationEventResponse(
            id="evt-contract-01",
            simulation_id="sim-contract-test-01",
            event_type="SIMULATION_STARTED",
            sequence_num=1,
            timestamp="2026-08-20T10:00:01Z",
            sim_timestamp="2026-08-20T00:00:00Z",
            message="Test start",
        )
    ]

    for repo in get_repos(mem_repo, MongoSimulationRepository, mongo_db):
        saved_sim = await repo.save_simulation(sim)
        assert saved_sim.id == "sim-contract-test-01"

        fetched = await repo.get_simulation_by_id("sim-contract-test-01")
        assert fetched is not None
        assert fetched.seed == 12345

        await repo.save_events("sim-contract-test-01", events)
        fetched_events = await repo.get_events("sim-contract-test-01", limit=10)
        assert len(fetched_events) >= 1
        assert fetched_events[0].simulation_id == "sim-contract-test-01"

        listed = await repo.list_simulations("m-contract-01", limit=10, offset=0)
        assert len(listed) >= 1


@pytest.mark.anyio
async def test_incident_repository_contract(mongo_db):
    mem_repo = InMemoryIncidentRepository()

    inc_data = IncidentCreate(
        title="Contract Test Incident",
        severity=SeverityLevel.HIGH,
        affected_policy_id="pol-001",
        affected_policy_name="Test Policy",
        summary="Testing incident contract",
        owner="Arjun Mehta",
        simulated_exposure=50000.0,
        bypasses_count=10,
    )

    for repo in get_repos(mem_repo, MongoIncidentRepository, mongo_db):
        created = await repo.create_incident(inc_data)
        assert created.id is not None
        assert created.status == IncidentStatus.OPEN
        assert len(created.timeline) >= 1

        fetched = await repo.get_incident_by_id(created.id)
        assert fetched is not None
        assert fetched.title == "Contract Test Incident"

        updated = await repo.update_incident(
            created.id,
            IncidentUpdate(status=IncidentStatus.INVESTIGATING)
        )
        assert updated is not None
        assert updated.status == IncidentStatus.INVESTIGATING
        assert len(updated.timeline) == len(created.timeline) + 1


@pytest.mark.anyio
async def test_vulnerability_and_patch_repositories_contract(mongo_db):
    mem_vuln = InMemoryVulnerabilityRepository()
    mem_patch = InMemoryPatchRepository()

    vuln = VulnerabilityResponse(
        id="vuln-contract-01",
        simulation_id="sim-001",
        policy_id="pol-001",
        policy_name="Test Policy",
        policy_version_number="v1.0.0",
        title="Contract Test Vuln",
        vulnerability_type="UNBOUNDED_RATE",
        severity=SeverityLevel.HIGH,
        attack_type=AttackAgentType.VELOCITY_ATTACKER,
        outcome="ALLOWED",
        bypass_count=10,
        total_attack_count=100,
        bypass_rate=0.1,
        simulated_exposure=50000.0,
        affected_entity_count=5,
        repeatability_score=1.0,
        confidence_score=0.9,
        executive_summary="Summary",
        why_the_policy_failed="Failed because of X",
        attack_mechanism="Mech",
        key_signal_missed="Signal",
        contributing_factors=["F1"],
        recommended_remediation="Fix it",
        first_detected="2026-08-20T10:00:00Z",
        last_seen="2026-08-20T10:00:00Z",
        status="ACTIVE",
    )

    for r_v in get_repos(mem_vuln, MongoVulnerabilityRepository, mongo_db):
        saved = await r_v.save_vulnerability(vuln)
        assert saved.id == "vuln-contract-01"
        fetched = await r_v.get_vulnerability_by_id("vuln-contract-01")
        assert fetched is not None
        assert fetched.title == "Contract Test Vuln"
        updated = await r_v.update_status("vuln-contract-01", "RESOLVED")
        assert updated is not None
        assert updated.status == "RESOLVED"

    patch = PatchResponse(
        id="patch-contract-01",
        vulnerability_id="vuln-contract-01",
        vulnerability_title="Contract Test Vuln",
        vulnerability_severity=SeverityLevel.HIGH,
        source_policy_id="pol-001",
        source_policy_name="Test Policy",
        source_policy_version="v1.0.0",
        target_policy_version="v1.1.0",
        status=PatchStatus.SIMULATED,
        identified_weakness="Weakness",
        proposed_changes=[],
        ai_reasoning="Reasoning",
        expected_risk_reduction="70%",
        expected_fpr_impact="0%",
        expected_customer_friction="LOW",
        validation_status="VALIDATED",
        confidence="HIGH",
        created_at="2026-08-20T10:00:00Z",
    )

    for r_p in get_repos(mem_patch, MongoPatchRepository, mongo_db):
        saved_p = await r_p.save_patch(patch)
        assert saved_p.id == "patch-contract-01"
        fetched_p = await r_p.get_patch_by_id("patch-contract-01")
        assert fetched_p is not None
        assert fetched_p.status == PatchStatus.SIMULATED


@pytest.mark.anyio
async def test_benchmark_and_dataset_and_audit_repositories_contract(mongo_db):
    mem_bm = InMemoryBenchmarkRepository()
    mem_ds = InMemoryDatasetRepository()
    mem_aud = InMemoryAuditRepository()

    # Dataset contract
    for r_ds in get_repos(mem_ds, MongoDatasetRepository, mongo_db):
        ds_list = await r_ds.list_datasets()
        assert len(ds_list) >= 1
        fetched = await r_ds.get_dataset_by_id(ds_list[0].id)
        assert fetched is not None

    # Benchmark contract
    for r_bm in get_repos(mem_bm, MongoBenchmarkRepository, mongo_db):
        bm_list = await r_bm.list_benchmark_runs()
        assert len(bm_list) >= 1
        latest_cmp = await r_bm.get_latest_comparison()
        assert latest_cmp is not None

    # Audit contract
    aud_create = AuditLogCreate(
        action="TEST_ACTION",
        actor_type=AuditActorType.USER,
        actor_name="Tester",
        entity_type="Test",
        entity_id="test-01",
        entity_name="Test Entity",
    )
    for r_aud in get_repos(mem_aud, MongoAuditRepository, mongo_db):
        created_aud = await r_aud.create_audit_log(aud_create)
        assert created_aud.id is not None
        logs = await r_aud.list_audit_logs(limit=10)
        assert len(logs) >= 1

