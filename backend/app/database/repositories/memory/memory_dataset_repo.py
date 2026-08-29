import asyncio
from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.dataset_repository import DatasetRepository
from backend.app.schemas.dataset import SyntheticDatasetResponse, DatasetSplitStatsSchema
from backend.app.schemas.common import DatasetSplitType


class InMemoryDatasetRepository(DatasetRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._datasets: Dict[str, SyntheticDatasetResponse] = {}
        self._seed_default_datasets()

    def _seed_default_datasets(self):
        split_dev = DatasetSplitStatsSchema(
            split=DatasetSplitType.DEVELOPMENT,
            percentage=70,
            totalRecords=2240,
            legitimateCount=1680,
            adversarialCount=560,
            accountsCount=180,
            devicesCount=140,
            isIsolated=False,
            lastUpdated="2026-08-20T10:00:00Z"
        )
        split_val = DatasetSplitStatsSchema(
            split=DatasetSplitType.VALIDATION,
            percentage=15,
            totalRecords=480,
            legitimateCount=360,
            adversarialCount=120,
            accountsCount=45,
            devicesCount=38,
            isIsolated=False,
            lastUpdated="2026-08-20T10:00:00Z"
        )
        split_test = DatasetSplitStatsSchema(
            split=DatasetSplitType.HELD_OUT,
            percentage=15,
            totalRecords=480,
            legitimateCount=360,
            adversarialCount=120,
            accountsCount=45,
            devicesCount=35,
            isIsolated=True,
            lastUpdated="2026-08-20T10:00:00Z"
        )

        dataset1 = SyntheticDatasetResponse(
            id="ds-syn-01",
            name="E-Commerce Red-Team Master Partition",
            version="v2.4.0",
            totalRecords=3200,
            generationSeed=49201,
            createdAt="2026-08-15T09:00:00Z",
            status="ACTIVE",
            splits=[split_dev, split_val, split_test],
            description="Synthetic high-entropy benchmark dataset consisting of legitimate organic shoppers and mixed adversarial attack strategies."
        )
        self._datasets[dataset1.id] = dataset1

    async def list_datasets(self) -> List[SyntheticDatasetResponse]:
        async with self._lock:
            return list(self._datasets.values())

    async def get_dataset_by_id(self, dataset_id: str) -> Optional[SyntheticDatasetResponse]:
        async with self._lock:
            return self._datasets.get(dataset_id)

    async def save_dataset(self, dataset: SyntheticDatasetResponse) -> SyntheticDatasetResponse:
        async with self._lock:
            self._datasets[dataset.id] = dataset
            return dataset
