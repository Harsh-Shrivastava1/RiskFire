import asyncio
from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.report_repository import ReportRepository
from backend.app.schemas.report import ExecutiveReportResponse, ReportFindingSchema


class InMemoryReportRepository(ReportRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._reports: Dict[str, ExecutiveReportResponse] = {}
        self._seed_default_reports()

    def _seed_default_reports(self):
        f1 = ReportFindingSchema(
            id="fnd-01",
            title="Multi-Account Device Fingerprint Collusion",
            severity="CRITICAL",
            affected_policy="Core Merchant Velocity & High-Value Guard",
            exposure_estimate=403200.0,
            description="Autonomous Red-Team simulation proved that cycling multiple accounts on a single hardware device bypassed single-account rate limit controls.",
            remediation_status="PATCH_VALIDATED"
        )
        f2 = ReportFindingSchema(
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
            key_findings=[f1, f2],
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
        self._reports[rep1.id] = rep1

    async def list_reports(self) -> List[ExecutiveReportResponse]:
        async with self._lock:
            return list(self._reports.values())

    async def get_report_by_id(self, report_id: str) -> Optional[ExecutiveReportResponse]:
        async with self._lock:
            return self._reports.get(report_id)

    async def save_report(self, report: ExecutiveReportResponse) -> ExecutiveReportResponse:
        async with self._lock:
            self._reports[report.id] = report
            return report
