from datetime import datetime, timezone
from typing import List, Optional
from backend.app.database.repositories.interfaces.report_repository import ReportRepository
from backend.app.database.repositories.interfaces.simulation_repository import SimulationRepository
from backend.app.database.repositories.interfaces.vulnerability_repository import VulnerabilityRepository
from backend.app.services.audit_service import AuditService
from backend.app.ai.base import AIProvider
from backend.app.ai.modules.report_generator import ReportGenerator
from backend.app.ai.schemas.report_narrative import ReportNarrativeInput
from backend.app.schemas.report import ExecutiveReportResponse, ReportGenerateRequest, ReportFindingSchema
from backend.app.schemas.common import AuditActorType
from backend.app.core.exceptions import ResourceNotFoundError


class ReportService:
    def __init__(
        self,
        report_repo: ReportRepository,
        simulation_repo: SimulationRepository,
        vulnerability_repo: VulnerabilityRepository,
        audit_service: AuditService,
        ai_provider: AIProvider
    ):
        self.report_repo = report_repo
        self.simulation_repo = simulation_repo
        self.vulnerability_repo = vulnerability_repo
        self.audit_service = audit_service
        self.ai_provider = ai_provider
        self.report_generator = ReportGenerator(ai_provider)

    async def list_reports(self) -> List[ExecutiveReportResponse]:
        return await self.report_repo.list_reports()

    async def get_report(self, report_id: str) -> ExecutiveReportResponse:
        rep = await self.report_repo.get_report_by_id(report_id)
        if not rep:
            raise ResourceNotFoundError("ExecutiveReport", report_id)
        return rep

    async def generate_report(
        self,
        merchant_id: str,
        request: ReportGenerateRequest,
        actor_name: str = "Arjun Mehta"
    ) -> ExecutiveReportResponse:
        # Load latest simulation
        if request.simulation_id:
            sim = await self.simulation_repo.get_simulation_by_id(request.simulation_id)
        else:
            sims = await self.simulation_repo.list_simulations(merchant_id=merchant_id, limit=1)
            sim = sims[0] if sims else None

        if not sim:
            raise ResourceNotFoundError("SimulationRun", request.simulation_id or "LATEST")

        # Load vulnerabilities
        vulns = await self.vulnerability_repo.list_vulnerabilities()
        findings = [
            ReportFindingSchema(
                id=f"fnd-{i+1:02d}",
                title=v.title,
                severity=v.severity.value,
                affected_policy=v.policy_name,
                exposure_estimate=v.simulated_exposure,
                description=v.executive_summary,
                remediation_status=v.status
            )
            for i, v in enumerate(vulns[:5])
        ]

        # Call AI Report Generator through trust boundary
        ai_input = ReportNarrativeInput(
            simulation_id=sim.id,
            merchant_name="Acme Payments India Pvt Ltd",
            policy_name=sim.policy_name,
            total_transactions=sim.total_transactions,
            bypasses_found=sim.bypasses_found,
            simulated_exposure=sim.simulated_exposure,
            detection_recall=sim.detection_recall,
            false_positive_rate=sim.false_positive_rate,
            vulnerabilities_summary=[v.title for v in vulns[:3]]
        )
        ai_narrative = await self.report_generator.generate_narrative(ai_input)

        now_iso = datetime.now(timezone.utc).isoformat()
        new_id = f"rep-2026-{len(await self.report_repo.list_reports()) + 1:03d}"

        report = ExecutiveReportResponse(
            id=new_id,
            report_number=f"RF-AUDIT-2026-{new_id[-3:]}",
            title=request.title or f"Adversarial Stress Test & Risk Audit ({sim.policy_name})",
            created_at=now_iso,
            simulation_id=sim.id,
            policy_version_tested=sim.policy_version_number,
            author="RiskFire Automated Audit Engine",
            status="FINAL",
            risk_posture_score=74,
            executive_summary=ai_narrative.executive_summary,
            key_findings=findings,
            top_vulnerabilities_count=len(findings),
            total_simulated_exposure=sim.simulated_exposure,
            overall_policy_recall=sim.detection_recall,
            overall_fpr=sim.false_positive_rate,
            recommended_actions=ai_narrative.recommended_actions,
            methodology_disclaimer=ai_narrative.disclaimer
        )

        saved = await self.report_repo.save_report(report)

        await self.audit_service.record_event(
            action="EXECUTIVE_REPORT_GENERATED",
            entity_type="ExecutiveReport",
            entity_id=saved.id,
            entity_name=saved.title,
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={"report_number": saved.report_number, "simulation_id": sim.id}
        )

        return saved
