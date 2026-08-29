from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.simulation import SimulationRunResponse, SimulationEventResponse


class SimulationRepository(ABC):
    @abstractmethod
    async def list_simulations(self, merchant_id: str, limit: int = 50, offset: int = 0) -> List[SimulationRunResponse]:
        pass

    @abstractmethod
    async def get_simulation_by_id(self, simulation_id: str) -> Optional[SimulationRunResponse]:
        pass

    @abstractmethod
    async def save_simulation(self, simulation: SimulationRunResponse) -> SimulationRunResponse:
        pass

    @abstractmethod
    async def save_events(self, simulation_id: str, events: List[SimulationEventResponse]) -> None:
        pass

    @abstractmethod
    async def get_events(self, simulation_id: str, limit: int = 200) -> List[SimulationEventResponse]:
        pass
