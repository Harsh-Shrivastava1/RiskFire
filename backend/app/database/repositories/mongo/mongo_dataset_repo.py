from typing import List, Optional
from pymongo.database import Database
from backend.app.database.repositories.interfaces.dataset_repository import DatasetRepository
from backend.app.schemas.dataset import SyntheticDatasetResponse


class MongoDatasetRepository(DatasetRepository):
    def __init__(self, db: Database):
        self.collection = db.datasets

    async def list_datasets(self) -> List[SyntheticDatasetResponse]:
        docs = list(self.collection.find({}, {"_id": 0}))
        return [SyntheticDatasetResponse.model_validate(doc) for doc in docs]

    async def get_dataset_by_id(self, dataset_id: str) -> Optional[SyntheticDatasetResponse]:
        doc = self.collection.find_one({"id": dataset_id}, {"_id": 0})
        if not doc:
            return None
        return SyntheticDatasetResponse.model_validate(doc)

    async def save_dataset(self, dataset: SyntheticDatasetResponse) -> SyntheticDatasetResponse:
        self.collection.update_one(
            {"id": dataset.id},
            {"$set": dataset.model_dump(by_alias=True)},
            upsert=True
        )
        return dataset
