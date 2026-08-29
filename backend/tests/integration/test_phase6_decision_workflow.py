import pytest
from backend.app.database.repositories.memory.memory_policy_repo import InMemoryPolicyRepository
from backend.app.database.repositories.memory.memory_vulnerability_repo import InMemoryVulnerabilityRepository
from backend.app.database.repositories.memory.memory_patch_repo import InMemoryPatchRepository
from backend.app.database.repositories.memory.memory_benchmark_repo import InMemoryBenchmarkRepository
from backend.app.database.repositories.memory.memory_audit_repo import InMemoryAuditRepository
from backend.app.database.repositories.memory.memory_simulation_repo import InMemorySimulationRepository
from backend.app.database.repositories.memory.memory_report_repo import InMemoryReportRepository
from backend.app.services.audit_service import AuditService
from backend.app.services.patch_service import PatchService
from backend.app.services.vulnerability_service import VulnerabilityService
from backend.app.services.report_service import ReportService
from backend.app.ai.providers.mock import MockAIProvider
from backend.app.schemas.patch import PatchApproveRequest, PatchRejectRequest, PatchStatus
from backend.app.schemas.report import ReportGenerateRequest
from backend.app.schemas.common import DatasetSplitType


@pytest.mark.asyncio
async def test_phase6_full_decision_workflow():
    # 1. Initialize Repositories and Services
    policy_repo = InMemoryPolicyRepository()
    vuln_repo = InMemoryVulnerabilityRepository()
    patch_repo = InMemoryPatchRepository()
    benchmark_repo = InMemoryBenchmarkRepository()
    audit_repo = InMemoryAuditRepository()
    sim_repo = InMemorySimulationRepository()
    report_repo = InMemoryReportRepository()
    ai_provider = MockAIProvider()

    audit_service = AuditService(audit_repo)
    vuln_service = VulnerabilityService(vuln_repo, audit_service, ai_provider)
    patch_service = PatchService(
        patch_repo=patch_repo,
        vulnerability_repo=vuln_repo,
        policy_repo=policy_repo,
        audit_service=audit_service,
        ai_provider=ai_provider,
        benchmark_repo=benchmark_repo,
    )
    report_service = ReportService(
        report_repo=report_repo,
        simulation_repo=sim_repo,
        vulnerability_repo=vuln_repo,
        audit_service=audit_service,
        ai_provider=ai_provider
    )

    # 2. Verify Vulnerability & Explanation
    vulns = await vuln_service.list_vulnerabilities()
    assert len(vulns) > 0
    target_vuln = vulns[0]

    explanation = await vuln_service.explain_vulnerability(target_vuln.id, actor_name="Risk Auditor")
    assert explanation.summary is not None
    assert len(explanation.contributing_factors) > 0

    # 3. Generate Patch Candidate
    patch = await patch_service.generate_patch_for_vulnerability(target_vuln.id, actor_name="Risk Auditor")
    assert patch.id is not None
    assert patch.status == PatchStatus.PENDING_SIMULATION
    assert patch.iteration_index == 1

    # 4. Evaluate Patch Candidate on Held-Out Split
    evaluated_patch = await patch_service.evaluate_patch_candidate(
        patch_id=patch.id,
        split=DatasetSplitType.HELD_OUT,
        seed=49201,
        actor_name="Risk Auditor"
    )

    assert evaluated_patch.status == PatchStatus.SIMULATED
    assert evaluated_patch.candidate_checksum is not None
    assert evaluated_patch.decision_evaluation is not None
    assert evaluated_patch.decision_evaluation.is_held_out_evaluated is True
    assert evaluated_patch.metrics_comparison is not None
    assert len(evaluated_patch.scenario_results) == 10

    # 5. Test Candidate Iteration (Immutability Preservation)
    iterated_patch = await patch_service.iterate_patch_candidate(
        patch_id=evaluated_patch.id,
        feedback_notes="Tighten velocity threshold to eliminate remaining edge case bypasses",
        target_split=DatasetSplitType.HELD_OUT,
        actor_name="Risk Auditor"
    )

    assert iterated_patch.iteration_index == 2
    assert iterated_patch.parent_patch_id == evaluated_patch.id
    assert iterated_patch.status == PatchStatus.PENDING_SIMULATION

    # Verify original patch remains untouched
    original = await patch_service.get_patch(evaluated_patch.id)
    assert original.iteration_index == 1
    assert original.status == PatchStatus.SIMULATED

    # 6. Test Human Approval on Candidate
    approval_req = PatchApproveRequest(notes="Approved following deterministic held-out trade-off review.")
    approved = await patch_service.approve_patch(
        patch_id=evaluated_patch.id,
        request=approval_req,
        actor_name="Arjun Mehta"
    )
    assert approved.status == PatchStatus.APPROVED
    assert approved.reviewed_by == "Arjun Mehta"

    # Verify Policy Version was promoted
    policy = await policy_repo.get_policy_by_id(approved.source_policy_id)
    assert len(policy.versions) >= 2

    # Verify Vulnerability status updated
    updated_vuln = await vuln_repo.get_vulnerability_by_id(target_vuln.id)
    assert updated_vuln.status == "RESOLVED"

    # 7. Generate Executive Risk Report
    sims = await sim_repo.list_simulations(merchant_id="merch-001")
    report_req = ReportGenerateRequest(
        simulation_id=sims[0].id if sims else None,
        title="Executive Security Decision & Patch Audit Report"
    )
    report = await report_service.generate_report(merchant_id="merch-001", request=report_req, actor_name="Arjun Mehta")
    assert report.id is not None
    assert report.report_number.startswith("RF-AUDIT-2026-")
    assert len(report.key_findings) > 0
    assert report.methodology_disclaimer is not None
    assert "synthetic" in report.methodology_disclaimer.lower() or "simulated" in report.methodology_disclaimer.lower()

    # 8. Verify Audit Log Trail
    audit_logs = await audit_service.list_audit_logs(limit=50)
    actions_recorded = [a.action for a in audit_logs]

    assert "AI_VULNERABILITY_EXPLAINED" in actions_recorded
    assert "AI_PATCH_GENERATED" in actions_recorded
    assert "CANDIDATE_FROZEN" in actions_recorded
    assert "HELD_OUT_EVALUATION_COMPLETED" in actions_recorded
    assert "AI_PATCH_ITERATION_GENERATED" in actions_recorded
    assert "POLICY_PATCH_APPROVED" in actions_recorded
    assert "EXECUTIVE_REPORT_GENERATED" in actions_recorded
