from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.report import ExecutiveReportResponse


class ReportRepository(ABC):
    @abstractmethod
    async def list_reports(self) -> List[ExecutiveReportResponse]:
        pass

    @abstractmethod
    async def get_report_by_id(self, report_id: str) -> Optional[ExecutiveReportResponse]:
        pass

    @abstractmethod
    async def save_report(self, report: ExecutiveReportResponse) -> ExecutiveReportResponse:
        pass
