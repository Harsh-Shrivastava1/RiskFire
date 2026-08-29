from typing import List, Optional
from pymongo.database import Database
from backend.app.database.repositories.interfaces.patch_repository import PatchRepository
from backend.app.schemas.patch import PatchResponse, PatchStatus


class MongoPatchRepository(PatchRepository):
    def __init__(self, db: Database):
        self.collection = db.patches

    async def list_patches(self, status: Optional[PatchStatus] = None) -> List[PatchResponse]:
        query = {}
        if status:
            val = status.value if hasattr(status, "value") else str(status)
            query["status"] = val
        cursor = self.collection.find(query, {"_id": 0})
        docs = list(cursor)
        return [PatchResponse.model_validate(doc) for doc in docs]

    async def get_patch_by_id(self, patch_id: str) -> Optional[PatchResponse]:
        doc = self.collection.find_one({"id": patch_id}, {"_id": 0})
        if not doc:
            return None
        return PatchResponse.model_validate(doc)

    async def save_patch(self, patch: PatchResponse) -> PatchResponse:
        self.collection.update_one(
            {"id": patch.id},
            {"$set": patch.model_dump()},
            upsert=True
        )
        return patch

    async def update_patch(self, patch_id: str, patch: PatchResponse) -> Optional[PatchResponse]:
        result = self.collection.update_one(
            {"id": patch_id},
            {"$set": patch.model_dump()}
        )
        if result.matched_count == 0:
            return None
        return patch
