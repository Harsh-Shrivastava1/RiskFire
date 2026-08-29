from typing import List, Optional
from datetime import datetime, timezone
from pymongo.database import Database
from backend.app.database.repositories.interfaces.policy_repository import PolicyRepository
from backend.app.schemas.policy import (
    PolicyResponse,
    PolicyCreate,
    PolicyUpdate,
    PolicyStatus,
    PolicyVersionSchema,
    PolicyRuleSchema,
)


class MongoPolicyRepository(PolicyRepository):
    def __init__(self, db: Database):
        self.collection = db.policies

    async def list_policies(self, merchant_id: str) -> List[PolicyResponse]:
        query = {"merchant_id": merchant_id}
        cursor = self.collection.find(query, {"_id": 0})
        docs = list(cursor)
        return [PolicyResponse.model_validate(doc) for doc in docs]

    async def get_policy_by_id(self, policy_id: str) -> Optional[PolicyResponse]:
        query = {
            "$or": [
                {"id": policy_id},
                {"current_version_id": policy_id},
                {"versions.id": policy_id},
            ]
        }
        doc = self.collection.find_one(query, {"_id": 0})
        if not doc:
            return None
        return PolicyResponse.model_validate(doc)

    async def get_active_policy(self, merchant_id: str) -> Optional[PolicyResponse]:
        query = {"merchant_id": merchant_id, "is_active": True}
        doc = self.collection.find_one(query, {"_id": 0})
        if not doc:
            doc = self.collection.find_one({"is_active": True}, {"_id": 0})
        if not doc:
            return None
        return PolicyResponse.model_validate(doc)

    async def create_policy(self, merchant_id: str, data: PolicyCreate) -> PolicyResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        count = self.collection.count_documents({})
        new_id = f"pol-{count + 1:03d}"
        v_id = f"pv-{count + 1:03d}-1"

        rules = [
            PolicyRuleSchema(
                id=f"rule-{new_id}-{i+1}",
                policy_version_id=v_id,
                name=r.name,
                rule_type=r.rule_type,
                category=r.category,
                parameters=r.parameters,
                action=r.action,
                is_enabled=r.is_enabled,
                sequence_order=i + 1,
                description=r.description,
            )
            for i, r in enumerate(data.rules)
        ]

        v1 = PolicyVersionSchema(
            id=v_id,
            policy_id=new_id,
            version_number="v1.0.0",
            status=PolicyStatus.ACTIVE,
            rules=rules,
            created_at=now_iso,
            created_by="Arjun Mehta",
            notes=data.notes,
        )

        pol = PolicyResponse(
            id=new_id,
            merchant_id=merchant_id,
            name=data.name,
            description=data.description,
            category=data.category,
            current_version_id=v_id,
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=len(rules),
            coverage_rate=85.0,
            effectiveness_rate=88.0,
            created_at=now_iso,
            updated_at=now_iso,
            versions=[v1],
        )

        self.collection.insert_one(pol.model_dump())
        return pol

    async def update_policy(self, policy_id: str, data: PolicyUpdate) -> Optional[PolicyResponse]:
        doc = self.collection.find_one({"id": policy_id}, {"_id": 0})
        if not doc:
            return None

        update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if data.name is not None:
            update_fields["name"] = data.name
        if data.description is not None:
            update_fields["description"] = data.description
        if data.is_active is not None:
            update_fields["is_active"] = data.is_active

        self.collection.update_one({"id": policy_id}, {"$set": update_fields})
        updated_doc = self.collection.find_one({"id": policy_id}, {"_id": 0})
        return PolicyResponse.model_validate(updated_doc)

    async def create_policy_version(self, policy_id: str, version: PolicyVersionSchema) -> PolicyResponse:
        doc = self.collection.find_one({"id": policy_id}, {"_id": 0})
        if not doc:
            raise ValueError(f"Policy {policy_id} not found")

        pol = PolicyResponse.model_validate(doc)
        new_versions = list(pol.versions)
        for i, v in enumerate(new_versions):
            if v.status == PolicyStatus.ACTIVE:
                new_versions[i] = v.model_copy(update={"status": PolicyStatus.SUPERSEDED})
        new_versions.append(version)

        update_fields = {
            "current_version_id": version.id,
            "current_version_number": version.version_number,
            "rule_count": len(version.rules),
            "versions": [v.model_dump() for v in new_versions],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        self.collection.update_one({"id": policy_id}, {"$set": update_fields})
        updated_doc = self.collection.find_one({"id": policy_id}, {"_id": 0})
        return PolicyResponse.model_validate(updated_doc)

    async def delete_policy(self, policy_id: str) -> bool:
        result = self.collection.delete_one({"id": policy_id})
        return result.deleted_count > 0
