import pytest
from backend.app.database.repositories.memory.memory_policy_repo import InMemoryPolicyRepository
from backend.app.database.repositories.memory.memory_simulation_repo import InMemorySimulationRepository
from backend.app.database.repositories.memory.memory_vulnerability_repo import InMemoryVulnerabilityRepository
from backend.app.database.repositories.memory.memory_patch_repo import InMemoryPatchRepository
from backend.app.database.repositories.memory.memory_benchmark_repo import InMemoryBenchmarkRepository
from backend.app.database.repositories.memory.memory_audit_repo import InMemoryAuditRepository
from backend.app.ai.providers.mock import MockAIProvider
from backend.app.services.audit_service import AuditService
from backend.app.services.policy_service import PolicyService
from backend.app.services.simulation_service import SimulationService
from backend.app.services.patch_service import PatchService
from backend.app.services.benchmark_service import BenchmarkService
from backend.app.schemas.policy import PolicyCreate, PolicyCategory, PolicyRuleSchema, PolicyRuleType, RuleAction
from backend.app.schemas.simulation import SimulationCreateRequest
from backend.app.schemas.patch import PatchApproveRequest
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.common import DatasetSplitType


@pytest.mark.asyncio
async def test_complete_end_to_end_simulation_pipeline():
    """
    FULL END-TO-END SIMULATION PIPELINE TEST:
    1. Setup isolated memory repositories and domain services
    2. Create a merchant baseline policy
    3. Execute deterministic adversarial simulation (Seed 49201)
    4. Verify vulnerability discovery & simulated exposure calculation
    5. Generate AI defensive patch proposal via trust boundary
    6. Replay exact attack scenario against patched policy rules
    7. Execute final evaluation on the 15% Sealed Held-Out Test Set
    8. Approve patch and promote new policy version
    9. Verify end-to-end audit log trail
    """
    # 1. Setup isolated repository layer
    audit_repo = InMemoryAuditRepository()
    policy_repo = InMemoryPolicyRepository()
    sim_repo = InMemorySimulationRepository()
    vuln_repo = InMemoryVulnerabilityRepository()
    patch_repo = InMemoryPatchRepository()
    bm_repo = InMemoryBenchmarkRepository()
    ai_provider = MockAIProvider()

    audit_service = AuditService(audit_repo)
    policy_service = PolicyService(policy_repo, audit_service)
    sim_service = SimulationService(sim_repo, policy_repo, vuln_repo, audit_service)
    patch_service = PatchService(patch_repo, vuln_repo, policy_repo, audit_service, ai_provider)
    bm_service = BenchmarkService(bm_repo, audit_service)

    # 2. Create Baseline Policy
    rule_vel = PolicyRuleSchema(
        id="r-base-1",
        name="Account Rate Limit",
        rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
        category=PolicyCategory.VELOCITY,
        parameters={"max_txns": 3, "window_minutes": 10},
        action=RuleAction.BLOCK,
        is_enabled=True,
        sequence_order=1
    )
    policy = await policy_service.create_policy(
        merchant_id="m-e2e-01",
        data=PolicyCreate(
            name="E2E Merchant Policy",
            description="Baseline policy for end-to-end stress testing",
            category=PolicyCategory.VELOCITY,
            rules=[rule_vel]
        ),
        actor_name="Arjun Mehta"
    )
    assert policy.id is not None

    # 3. Execute Simulation Run (Seed 49201)
    sim_req = SimulationCreateRequest(
        policy_id=policy.id,
        seed=49201,
        attack_types=[AttackAgentType.IDENTITY_FRAGMENTER],
        legitimate_transaction_count=100,
        attack_transaction_count=40,
        sim_duration_hours=6
    )
    sim_run = await sim_service.run_simulation("m-e2e-01", sim_req, actor_name="Arjun Mehta")

    assert sim_run.total_transactions == 140
    assert sim_run.seed == 49201
    assert sim_run.status.value == "COMPLETED"
    assert sim_run.bypasses_found > 0
    assert sim_run.simulated_exposure > 0.0

    # 4. Verify Vulnerabilities Discovered
    vulns = await vuln_repo.list_vulnerabilities()
    assert len(vulns) >= 1
    target_vuln = [v for v in vulns if v.simulation_id == sim_run.id][0]
    assert target_vuln.bypass_count > 0
    assert target_vuln.simulated_exposure > 0.0

    # 5. Generate AI Defensive Patch Proposal
    patch = await patch_service.generate_patch_for_vulnerability(target_vuln.id, actor_name="Arjun Mehta")
    assert patch.status.value == "PENDING_SIMULATION"
    assert len(patch.proposed_changes) >= 1

    # 6. Replay Historical Transactions on Patched Rules
    transactions = sim_service.get_simulation_transactions(sim_run.id)
    simulated_patch = await patch_service.simulate_patch_replay(patch.id, transactions)
    assert simulated_patch.status.value == "SIMULATED"
    assert simulated_patch.metrics_comparison is not None
    assert simulated_patch.metrics_comparison.recall.after >= simulated_patch.metrics_comparison.recall.before

    # 7. Execute Generalization Benchmark on Sealed Held-Out Test Set
    held_out_run = await bm_service.execute_held_out_benchmark(
        simulation_id=sim_run.id,
        policy_id=policy.id,
        policy_name=policy.name,
        policy_version_number="v1.1.0",
        transactions=transactions,
        split=DatasetSplitType.HELD_OUT,
        actor_name="Arjun Mehta"
    )
    assert held_out_run.dataset_split == DatasetSplitType.HELD_OUT
    assert held_out_run.is_held_out_isolated is True
    assert held_out_run.metrics.total_transactions > 0

    # 8. Approve Patch and Promote Policy Version
    approved_patch = await patch_service.approve_patch(
        patch.id,
        PatchApproveRequest(notes="Empirically verified in E2E pipeline test"),
        actor_name="Arjun Mehta"
    )
    assert approved_patch.status.value == "APPROVED"

    # Verify policy was updated to new version
    updated_policy = await policy_service.get_policy(policy.id)
    assert updated_policy.current_version_number == "v1.1.0"
    assert len(updated_policy.versions) >= 2

    # 9. Verify Immutable Audit Trail
    audit_logs = await audit_service.list_audit_logs(limit=20)
    audit_actions = [log.action for log in audit_logs]
    assert "POLICY_CREATED" in audit_actions
    assert "SIMULATION_EXECUTION_COMPLETED" in audit_actions
    assert "AI_PATCH_GENERATED" in audit_actions
    assert "BENCHMARK_EVALUATION_COMPLETED" in audit_actions
    assert "POLICY_PATCH_APPROVED" in audit_actions
