from typing import List, Optional
from pymongo import DESCENDING
from pymongo.database import Database
from backend.app.database.repositories.interfaces.simulation_repository import SimulationRepository
from backend.app.schemas.simulation import SimulationRunResponse, SimulationEventResponse


class MongoSimulationRepository(SimulationRepository):
    def __init__(self, db: Database):
        self.simulations_col = db.simulations
        self.events_col = db.simulation_events

    async def list_simulations(self, merchant_id: str, limit: int = 50, offset: int = 0) -> List[SimulationRunResponse]:
        query = {"merchant_id": merchant_id}
        cursor = (
            self.simulations_col.find(query, {"_id": 0})
            .sort("started_at", DESCENDING)
            .skip(offset)
            .limit(limit)
        )
        docs = list(cursor)
        return [SimulationRunResponse.model_validate(doc) for doc in docs]

    async def get_simulation_by_id(self, simulation_id: str) -> Optional[SimulationRunResponse]:
        doc = self.simulations_col.find_one({"id": simulation_id}, {"_id": 0})
        if not doc:
            return None
        return SimulationRunResponse.model_validate(doc)

    async def save_simulation(self, simulation: SimulationRunResponse) -> SimulationRunResponse:
        self.simulations_col.update_one(
            {"id": simulation.id},
            {"$set": simulation.model_dump()},
            upsert=True
        )
        return simulation

    async def save_events(self, simulation_id: str, events: List[SimulationEventResponse]) -> None:
        if not events:
            return
        event_docs = [e.model_dump() for e in events]
        self.events_col.insert_many(event_docs)

    async def get_events(self, simulation_id: str, limit: int = 200) -> List[SimulationEventResponse]:
        cursor = (
            self.events_col.find({"simulation_id": simulation_id}, {"_id": 0})
            .sort("sequence_num", 1)
            .limit(limit)
        )
        docs = list(cursor)
        return [SimulationEventResponse.model_validate(doc) for doc in docs]
