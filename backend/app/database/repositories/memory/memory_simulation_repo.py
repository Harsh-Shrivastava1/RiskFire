import asyncio
from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.simulation_repository import SimulationRepository
from backend.app.schemas.simulation import SimulationRunResponse, SimulationEventResponse, SimulationStatus
from backend.app.schemas.attack import AttackAgentType


class InMemorySimulationRepository(SimulationRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._simulations: Dict[str, SimulationRunResponse] = {}
        self._events: Dict[str, List[SimulationEventResponse]] = {}
        self._seed_default_simulations()

    def _seed_default_simulations(self):
        sim1 = SimulationRunResponse(
            id="sim-run-8921",
            merchant_id="m-dev-01",
            policy_version_id="pv-101",
            policy_name="Core Merchant Velocity & High-Value Guard",
            policy_version_number="v1.0.0",
            seed=49201,
            status=SimulationStatus.COMPLETED,
            run_type="FIRE_DRILL",
            started_at="2026-08-20T10:15:00Z",
            completed_at="2026-08-20T10:15:45Z",
            duration_seconds=45.2,
            total_transactions=3200,
            legitimate_transactions_count=2400,
            attack_transactions_count=800,
            attacks_attempted=800,
            bypasses_found=184,
            simulated_exposure=1180000.0,
            detection_recall=94.2,
            false_positive_rate=1.8,
            events_processed=3200,
            active_agents=[
                AttackAgentType.VELOCITY_ATTACKER,
                AttackAgentType.IDENTITY_FRAGMENTER,
                AttackAgentType.PAYMENT_ROTATOR,
            ]
        )
        self._simulations[sim1.id] = sim1

    async def list_simulations(self, merchant_id: str, limit: int = 50, offset: int = 0) -> List[SimulationRunResponse]:
        async with self._lock:
            all_sims = list(self._simulations.values())
            # Return most recent first
            all_sims.sort(key=lambda s: s.started_at, reverse=True)
            return all_sims[offset : offset + limit]

    async def get_simulation_by_id(self, simulation_id: str) -> Optional[SimulationRunResponse]:
        async with self._lock:
            return self._simulations.get(simulation_id)

    async def save_simulation(self, simulation: SimulationRunResponse) -> SimulationRunResponse:
        async with self._lock:
            self._simulations[simulation.id] = simulation
            return simulation

    async def save_events(self, simulation_id: str, events: List[SimulationEventResponse]) -> None:
        async with self._lock:
            if simulation_id not in self._events:
                self._events[simulation_id] = []
            self._events[simulation_id].extend(events)

    async def get_events(self, simulation_id: str, limit: int = 200) -> List[SimulationEventResponse]:
        async with self._lock:
            events = self._events.get(simulation_id, [])
            return events[:limit]
