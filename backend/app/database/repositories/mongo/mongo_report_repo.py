from typing import List, Optional
from pymongo.database import Database
from backend.app.database.repositories.interfaces.report_repository import ReportRepository
from backend.app.schemas.report import ExecutiveReportResponse


class MongoReportRepository(ReportRepository):
    def __init__(self, db: Database):
        self.collection = db.reports

    async def list_reports(self) -> List[ExecutiveReportResponse]:
        docs = list(self.collection.find({}, {"_id": 0}))
        return [ExecutiveReportResponse.model_validate(doc) for doc in docs]

    async def get_report_by_id(self, report_id: str) -> Optional[ExecutiveReportResponse]:
        doc = self.collection.find_one({"id": report_id}, {"_id": 0})
        if not doc:
            return None
        return ExecutiveReportResponse.model_validate(doc)

    async def save_report(self, report: ExecutiveReportResponse) -> ExecutiveReportResponse:
        self.collection.update_one(
            {"id": report.id},
            {"$set": report.model_dump()},
            upsert=True
        )
        return report
