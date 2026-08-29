import pytest
from backend.app.schemas.common import RiskDecisionOutcome, SeverityLevel, AuditActorType
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.policy import PolicyResponse, PolicyCategory, PolicyStatus, PolicyRuleSchema, PolicyRuleType, RuleAction
from backend.app.schemas.patch import PatchApproveRequest
from backend.app.schemas.report import ReportGenerateRequest
from backend.app.schemas.benchmark import DatasetSplitType
from backend.app.database.repositories.memory.memory_policy_repo import InMemoryPolicyRepository
from backend.app.database.repositories.memory.memory_simulation_repo import InMemorySimulationRepository
from backend.app.database.repositories.memory.memory_vulnerability_repo import InMemoryVulnerabilityRepository
from backend.app.database.repositories.memory.memory_patch_repo import InMemoryPatchRepository
from backend.app.database.repositories.memory.memory_benchmark_repo import InMemoryBenchmarkRepository
from backend.app.database.repositories.memory.memory_report_repo import InMemoryReportRepository
from backend.app.database.repositories.memory.memory_audit_repo import InMemoryAuditRepository
from backend.app.services.audit_service import AuditService
from backend.app.services.policy_service import PolicyService
from backend.app.services.vulnerability_service import VulnerabilityService
from backend.app.services.patch_service import PatchService
from backend.app.services.benchmark_service import BenchmarkService
from backend.app.services.report_service import ReportService
from backend.app.ai.base import AIProvider
from backend.app.schemas.simulation import SimulationRunResponse


class MockAIProvider(AIProvider):
    @property
    def provider_name(self) -> str:
        return "Mock Deterministic AI Provider"

    @property
    def model_name(self) -> str:
        return "mock-safety-model-v1"

    async def complete(self, prompt: str, system_prompt: str, response_schema: any, temperature: float = 0.3, max_tokens: int = 2048):
        raise RuntimeError("AI offline simulation - triggers deterministic safety fallback.")

    async def health_check(self) -> bool:
        return True


@pytest.mark.asyncio
async def test_full_phase7_closed_loop_workflow():
    """
    Tests the complete Phase 7 governance workflow:
    1. DISCOVER WEAKNESS ->
    2. UNDERSTAND WHY IT FAILED ->
    3. GENERATE DEFENSIVE IMPROVEMENT ->
    4. FREEZE CANDIDATE ->
    5. HELD-OUT BATCH BENCHMARK ->
    6. DETERMINISTIC DECISION ->
    7. HUMAN APPROVAL ->
    8. PROMOTE NEW POLICY VERSION ->
    9. RECORD COMPLETE AUDIT TRAIL ->
    10. GENERATE EXPLAINABLE REPORT
    """
    # 1. Initialize Repositories and Services
    audit_repo = InMemoryAuditRepository()
    audit_service = AuditService(audit_repo)

    policy_repo = InMemoryPolicyRepository()
    policy_service = PolicyService(policy_repo, audit_service)

    sim_repo = InMemorySimulationRepository()
    vuln_repo = InMemoryVulnerabilityRepository()
    patch_repo = InMemoryPatchRepository()
    benchmark_repo = InMemoryBenchmarkRepository()
    report_repo = InMemoryReportRepository()

    ai_provider = MockAIProvider()

    vuln_service = VulnerabilityService(vuln_repo, audit_service, ai_provider=None)
    patch_service = PatchService(
        patch_repo=patch_repo,
        policy_repo=policy_repo,
        vulnerability_repo=vuln_repo,
        audit_service=audit_service,
        ai_provider=ai_provider
    )
    benchmark_service = BenchmarkService(
        benchmark_repo=benchmark_repo,
        audit_service=audit_service,
        policy_repo=policy_repo
    )
    report_service = ReportService(
        report_repo=report_repo,
        simulation_repo=sim_repo,
        vulnerability_repo=vuln_repo,
        audit_service=audit_service,
        ai_provider=ai_provider
    )

    # 2. Setup baseline policy in repository
    policies = await policy_repo.list_policies("merchant-001")
    assert len(policies) > 0
    baseline_policy = policies[0]
    initial_version_count = len(baseline_policy.versions)

    # 3. Simulate a Weakness Discovery
    vulns = await vuln_service.list_vulnerabilities()
    assert len(vulns) > 0
    target_vuln = vulns[0]
    assert target_vuln.status == "ACTIVE"

    # 4. Explain Vulnerability (Grounded plain English + Root Cause)
    explanation = await vuln_service.explain_vulnerability(target_vuln.id)
    assert explanation is not None
    assert explanation.summary != ""
    assert explanation.confidence in ["HIGH", "MEDIUM"]

    # 5. Propose Defensive Patch
    patch = await patch_service.generate_patch_for_vulnerability(target_vuln.id)
    assert patch is not None
    assert patch.vulnerability_id == target_vuln.id
    assert len(patch.proposed_changes) > 0
    assert patch.status.value == "PENDING_SIMULATION"

    # 6. Evaluate Candidate Patch (Freezes candidate SHA-256 + Held-out benchmark)
    evaluated_patch = await patch_service.evaluate_patch_candidate(
        patch_id=patch.id,
        split=DatasetSplitType.HELD_OUT,
        seed=49201
    )
    assert evaluated_patch.metrics_comparison is not None
    assert evaluated_patch.candidate_checksum is not None
    assert len(evaluated_patch.candidate_checksum) == 64
    assert evaluated_patch.decision_evaluation is not None
    assert evaluated_patch.decision_evaluation.decision in ["APPROVE_PATCH", "REJECT_PATCH", "MANUAL_REVIEW_REQUIRED"]

    # 7. Approve Patch & Promote New Policy Version
    approved_patch = await patch_service.approve_patch(
        patch_id=patch.id,
        request=PatchApproveRequest(
            approved_by="Arjun Mehta",
            notes="Held-out evaluation passed with verified improvement and zero false-alarm regression."
        )
    )
    assert approved_patch.status.value == "APPROVED"

    # Verify that Policy Repository now has the new version while preserving historical version
    updated_policy = await policy_service.get_policy(baseline_policy.id)
    assert len(updated_policy.versions) == initial_version_count + 1
    assert updated_policy.current_version_number != baseline_policy.current_version_number

    # 8. Create Simulation record and Generate Executive Report
    sim_rec = SimulationRunResponse(
        id="sim-audit-test",
        merchant_id="merchant-001",
        policy_id=updated_policy.id,
        policy_version_id=updated_policy.current_version_id or "pv-1",
        policy_name=updated_policy.name,
        policy_version_number=updated_policy.current_version_number,
        seed=49201,
        status="COMPLETED",
        run_type="FIRE_DRILL",
        started_at="2026-08-29T10:00:00Z",
        total_transactions=1500,
        legitimate_transactions_count=1200,
        attack_transactions_count=300,
        attacks_attempted=300,
        bypasses_found=12,
        simulated_exposure=150000.0,
        detection_recall=96.0,
        false_positive_rate=0.25,
        events_processed=1500,
        active_agents=[AttackAgentType.VELOCITY_ATTACKER]
    )
    await sim_repo.save_simulation(sim_rec)

    report = await report_service.generate_report(
        merchant_id="merchant-001",
        request=ReportGenerateRequest(
            simulation_id=sim_rec.id,
            title="Adversarial Audit & Optimization Report"
        )
    )
    assert report is not None
    assert report.simulation_id == sim_rec.id
    assert report.executive_summary != ""

    # 9. Verify Comprehensive Audit Trail
    audit_logs = await audit_service.list_audit_logs(limit=50)
    assert len(audit_logs) >= 5

    actions_recorded = set(log.action for log in audit_logs)
    assert "DEFENSIVE_PATCH_PROPOSED" in actions_recorded or "AI_PATCH_GENERATED" in actions_recorded
    assert "CANDIDATE_FROZEN" in actions_recorded
    assert "POLICY_PATCH_APPROVED" in actions_recorded or "POLICY_VERSION_PROMOTED" in actions_recorded
    assert "EXECUTIVE_REPORT_GENERATED" in actions_recorded
