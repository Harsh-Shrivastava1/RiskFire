from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_patch_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.patch_service import PatchService
from backend.app.schemas.common import DatasetSplitType
from backend.app.schemas.patch import (
    PatchResponse,
    PatchStatus,
    PatchApproveRequest,
    PatchRejectRequest,
    PatchIterateRequest,
    PatchDecisionEvaluation,
)

router = APIRouter(prefix="/patches", tags=["Patches"])


@router.get("", response_model=List[PatchResponse], status_code=status.HTTP_200_OK)
async def list_patches(
    status_filter: Optional[PatchStatus] = Query(None, alias="status"),
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> List[PatchResponse]:
    return await patch_service.list_patches(status=status_filter)


@router.get("/vulnerability/{vulnerability_id}", response_model=List[PatchResponse], status_code=status.HTTP_200_OK)
async def list_patches_for_vulnerability(
    vulnerability_id: str,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> List[PatchResponse]:
    return await patch_service.list_patches_for_vulnerability(vulnerability_id)


@router.get("/{patch_id}", response_model=PatchResponse, status_code=status.HTTP_200_OK)
async def get_patch(
    patch_id: str,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> PatchResponse:
    return await patch_service.get_patch(patch_id)


@router.get("/{patch_id}/decision", response_model=Optional[PatchDecisionEvaluation], status_code=status.HTTP_200_OK)
async def get_patch_decision(
    patch_id: str,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> Optional[PatchDecisionEvaluation]:
    patch = await patch_service.get_patch(patch_id)
    return patch.decision_evaluation


@router.post("/generate/{vulnerability_id}", response_model=PatchResponse, status_code=status.HTTP_201_CREATED)
async def generate_patch_for_vulnerability(
    vulnerability_id: str,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> PatchResponse:
    return await patch_service.generate_patch_for_vulnerability(vulnerability_id, actor_name=user.name)


@router.post("/{patch_id}/simulate", response_model=PatchResponse, status_code=status.HTTP_200_OK)
async def simulate_patch(
    patch_id: str,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> PatchResponse:
    return await patch_service.simulate_patch(patch_id)


@router.post("/{patch_id}/evaluate", response_model=PatchResponse, status_code=status.HTTP_200_OK)
async def evaluate_patch_candidate(
    patch_id: str,
    split: DatasetSplitType = Query(DatasetSplitType.HELD_OUT, description="Target dataset split"),
    seed: int = Query(49201, description="Evaluation seed"),
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> PatchResponse:
    return await patch_service.evaluate_patch_candidate(
        patch_id=patch_id,
        split=split,
        seed=seed,
        actor_name=user.name
    )


@router.post("/{patch_id}/iterate", response_model=PatchResponse, status_code=status.HTTP_201_CREATED)
async def iterate_patch_candidate(
    patch_id: str,
    request: PatchIterateRequest,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> PatchResponse:
    return await patch_service.iterate_patch_candidate(
        patch_id=patch_id,
        feedback_notes=request.feedback_notes,
        target_split=request.target_split,
        actor_name=user.name
    )


@router.post("/{patch_id}/approve", response_model=PatchResponse, status_code=status.HTTP_200_OK)
async def approve_patch(
    patch_id: str,
    request: PatchApproveRequest,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> PatchResponse:
    return await patch_service.approve_patch(patch_id, request, actor_name=user.name)


@router.post("/{patch_id}/reject", response_model=PatchResponse, status_code=status.HTTP_200_OK)
async def reject_patch(
    patch_id: str,
    request: PatchRejectRequest,
    user: UserContext = Depends(get_current_user),
    patch_service: PatchService = Depends(get_patch_service)
) -> PatchResponse:
    return await patch_service.reject_patch(patch_id, request, actor_name=user.name)
