from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.patch import PatchResponse, PatchStatus


class PatchRepository(ABC):
    @abstractmethod
    async def list_patches(self, status: Optional[PatchStatus] = None) -> List[PatchResponse]:
        pass

    @abstractmethod
    async def get_patch_by_id(self, patch_id: str) -> Optional[PatchResponse]:
        pass

    @abstractmethod
    async def save_patch(self, patch: PatchResponse) -> PatchResponse:
        pass

    @abstractmethod
    async def update_patch(self, patch_id: str, patch: PatchResponse) -> Optional[PatchResponse]:
        pass
