from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.dataset import SyntheticDatasetResponse


class DatasetRepository(ABC):
    @abstractmethod
    async def list_datasets(self) -> List[SyntheticDatasetResponse]:
        pass

    @abstractmethod
    async def get_dataset_by_id(self, dataset_id: str) -> Optional[SyntheticDatasetResponse]:
        pass

    @abstractmethod
    async def save_dataset(self, dataset: SyntheticDatasetResponse) -> SyntheticDatasetResponse:
        pass
