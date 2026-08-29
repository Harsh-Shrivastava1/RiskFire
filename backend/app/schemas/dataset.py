from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.common import DatasetSplitType


class DatasetSplitStatsSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    split: DatasetSplitType
    percentage: int
    total_records: int = Field(serialization_alias="totalRecords", alias="totalRecords")
    legitimate_count: int = Field(serialization_alias="legitimateCount", alias="legitimateCount")
    adversarial_count: int = Field(serialization_alias="adversarialCount", alias="adversarialCount")
    accounts_count: int = Field(serialization_alias="accountsCount", alias="accountsCount")
    devices_count: int = Field(serialization_alias="devicesCount", alias="devicesCount")
    is_isolated: bool = Field(serialization_alias="isIsolated", alias="isIsolated")
    last_updated: str = Field(serialization_alias="lastUpdated", alias="lastUpdated")


class SyntheticDatasetResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    version: str
    total_records: int = Field(serialization_alias="totalRecords", alias="totalRecords")
    generation_seed: int = Field(serialization_alias="generationSeed", alias="generationSeed")
    created_at: str = Field(serialization_alias="createdAt", alias="createdAt")
    status: str
    splits: List[DatasetSplitStatsSchema] = Field(default_factory=list)
    description: str
