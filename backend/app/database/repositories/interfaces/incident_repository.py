from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.incident import IncidentResponse, IncidentCreate, IncidentUpdate, IncidentStatus


class IncidentRepository(ABC):
    @abstractmethod
    async def list_incidents(self, status: Optional[str] = None) -> List[IncidentResponse]:
        pass

    @abstractmethod
    async def get_incident_by_id(self, incident_id: str) -> Optional[IncidentResponse]:
        pass

    @abstractmethod
    async def create_incident(self, data: IncidentCreate) -> IncidentResponse:
        pass

    @abstractmethod
    async def update_incident(self, incident_id: str, data: IncidentUpdate) -> Optional[IncidentResponse]:
        pass
