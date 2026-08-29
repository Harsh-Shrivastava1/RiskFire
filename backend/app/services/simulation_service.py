from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.simulation_repository import SimulationRepository
from backend.app.database.repositories.interfaces.policy_repository import PolicyRepository
from backend.app.database.repositories.interfaces.vulnerability_repository import VulnerabilityRepository
from backend.app.services.audit_service import AuditService
from backend.app.engines.simulation.simulation_engine import SimulationEngine, SimulationExecutionResult
from backend.app.schemas.simulation import (
    SimulationCreateRequest,
    SimulationRunResponse,
    SimulationEventResponse,
    FireDrillRequest,
)
from backend.app.schemas.attack import AttackAgentType, AttackDifficulty
from backend.app.schemas.common import AuditActorType
from backend.app.core.exceptions import ResourceNotFoundError, SimulationExecutionError


class SimulationService:
    def __init__(
        self,
        simulation_repo: SimulationRepository,
        policy_repo: PolicyRepository,
        vulnerability_repo: VulnerabilityRepository,
        audit_service: AuditService
    ):
        self.simulation_repo = simulation_repo
        self.policy_repo = policy_repo
        self.vulnerability_repo = vulnerability_repo
        self.audit_service = audit_service
        self.simulation_engine = SimulationEngine()
        self._last_transactions: Dict[str, List[dict]] = {}

    async def list_simulations(self, merchant_id: str, limit: int = 50, offset: int = 0) -> List[SimulationRunResponse]:
        return await self.simulation_repo.list_simulations(merchant_id=merchant_id, limit=limit, offset=offset)

    async def get_simulation(self, simulation_id: str) -> SimulationRunResponse:
        sim = await self.simulation_repo.get_simulation_by_id(simulation_id)
        if not sim:
            raise ResourceNotFoundError("SimulationRun", simulation_id)
        return sim

    async def get_simulation_events(self, simulation_id: str, limit: int = 200) -> List[SimulationEventResponse]:
        return await self.simulation_repo.get_events(simulation_id, limit=limit)

    def get_simulation_transactions(self, simulation_id: str) -> List[dict]:
        return self._last_transactions.get(simulation_id, [])

    async def run_simulation(
        self,
        merchant_id: str,
        request: SimulationCreateRequest,
        actor_name: str = "Arjun Mehta"
    ) -> SimulationRunResponse:
        # Load policy
        policy = None
        if request.policy_id:
            policy = await self.policy_repo.get_policy_by_id(request.policy_id)
        if not policy:
            policy = await self.policy_repo.get_active_policy(merchant_id)

        if not policy:
            raise ResourceNotFoundError("Policy", request.policy_id or "ACTIVE")

        # Execute deterministic simulation engine
        try:
            exec_result = self.simulation_engine.run_simulation(
                request=request,
                policy=policy,
                seed=request.seed,
                run_type="MANUAL"
            )
        except Exception as e:
            raise SimulationExecutionError(f"Simulation execution failed: {str(e)}")

        # Persist simulation, events, and vulnerabilities in repositories
        await self.simulation_repo.save_simulation(exec_result.simulation)
        await self.simulation_repo.save_events(exec_result.simulation.id, exec_result.events)
        self._last_transactions[exec_result.simulation.id] = exec_result.transactions

        for vuln in exec_result.vulnerabilities:
            await self.vulnerability_repo.save_vulnerability(vuln)

        # Record audit log
        await self.audit_service.record_event(
            action="SIMULATION_EXECUTION_COMPLETED",
            entity_type="SimulationRun",
            entity_id=exec_result.simulation.id,
            entity_name=f"Simulation Run {exec_result.simulation.id}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "seed": exec_result.simulation.seed,
                "txns": exec_result.simulation.total_transactions,
                "bypasses": exec_result.simulation.bypasses_found,
                "exposure": exec_result.simulation.simulated_exposure,
                "recall": exec_result.simulation.detection_recall
            }
        )

        return exec_result.simulation

    async def trigger_fire_drill(
        self,
        merchant_id: str,
        request: FireDrillRequest,
        actor_name: str = "Arjun Mehta"
    ) -> SimulationRunResponse:
        create_req = SimulationCreateRequest(
            policy_id=request.policy_id,
            seed=request.seed or 49201,
            attack_types=[
                AttackAgentType.VELOCITY_ATTACKER,
                AttackAgentType.IDENTITY_FRAGMENTER,
                AttackAgentType.PAYMENT_ROTATOR,
            ],
            difficulty=request.difficulty,
            legitimate_transaction_count=2400,
            attack_transaction_count=800,
            sim_duration_hours=24
        )

        policy = None
        if request.policy_id:
            policy = await self.policy_repo.get_policy_by_id(request.policy_id)
        if not policy:
            policy = await self.policy_repo.get_active_policy(merchant_id)

        if not policy:
            raise ResourceNotFoundError("Policy", request.policy_id or "ACTIVE")

        exec_result = self.simulation_engine.run_simulation(
            request=create_req,
            policy=policy,
            seed=create_req.seed,
            run_type="FIRE_DRILL"
        )

        await self.simulation_repo.save_simulation(exec_result.simulation)
        await self.simulation_repo.save_events(exec_result.simulation.id, exec_result.events)
        self._last_transactions[exec_result.simulation.id] = exec_result.transactions

        for vuln in exec_result.vulnerabilities:
            await self.vulnerability_repo.save_vulnerability(vuln)

        await self.audit_service.record_event(
            action="FIRE_DRILL_COMPLETED",
            entity_type="SimulationRun",
            entity_id=exec_result.simulation.id,
            entity_name=f"Fire Drill {exec_result.simulation.id}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "seed": exec_result.simulation.seed,
                "txns": exec_result.simulation.total_transactions,
                "bypasses": exec_result.simulation.bypasses_found,
                "exposure": exec_result.simulation.simulated_exposure,
            }
        )

        return exec_result.simulation
