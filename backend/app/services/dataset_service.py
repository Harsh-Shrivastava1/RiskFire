from typing import List
from backend.app.database.repositories.interfaces.dataset_repository import DatasetRepository
from backend.app.schemas.dataset import SyntheticDatasetResponse
from backend.app.core.exceptions import ResourceNotFoundError


class DatasetService:
    def __init__(self, dataset_repo: DatasetRepository):
        self.dataset_repo = dataset_repo

    async def list_datasets(self) -> List[SyntheticDatasetResponse]:
        return await self.dataset_repo.list_datasets()

    async def get_dataset(self, dataset_id: str) -> SyntheticDatasetResponse:
        ds = await self.dataset_repo.get_dataset_by_id(dataset_id)
        if not ds:
            raise ResourceNotFoundError("SyntheticDataset", dataset_id)
        return ds
