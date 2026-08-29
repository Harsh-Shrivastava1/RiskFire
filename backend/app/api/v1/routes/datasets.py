from typing import List
from fastapi import APIRouter, Depends, status
from backend.app.api.v1.dependencies import get_dataset_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.dataset_service import DatasetService
from backend.app.schemas.dataset import SyntheticDatasetResponse

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("", response_model=List[SyntheticDatasetResponse], status_code=status.HTTP_200_OK)
async def list_datasets(
    user: UserContext = Depends(get_current_user),
    dataset_service: DatasetService = Depends(get_dataset_service)
) -> List[SyntheticDatasetResponse]:
    return await dataset_service.list_datasets()


@router.get("/{dataset_id}", response_model=SyntheticDatasetResponse, status_code=status.HTTP_200_OK)
async def get_dataset(
    dataset_id: str,
    user: UserContext = Depends(get_current_user),
    dataset_service: DatasetService = Depends(get_dataset_service)
) -> SyntheticDatasetResponse:
    return await dataset_service.get_dataset(dataset_id)
