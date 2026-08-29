import asyncio
from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.attack_repository import AttackRepository
from backend.app.schemas.attack import (
    AttackAgentSchema,
    AttackScenarioSchema,
    AttackAgentType,
    SeverityLevel,
)


class InMemoryAttackRepository(AttackRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._agents: Dict[AttackAgentType, AttackAgentSchema] = {}
        self._scenarios: Dict[str, AttackScenarioSchema] = {}
        self._seed_default_agents()

    def _seed_default_agents(self):
        agents = [
            AttackAgentSchema(
                id="agent-vel-01",
                type=AttackAgentType.VELOCITY_ATTACKER,
                name="Velocity Attacker",
                description="Rapidly pulses transaction attempts right at and below time-window thresholds to exploit batch evaluation gaps.",
                target_policies=["pol-vel-01"],
                evasion_tactics=["Threshold skimming", "Micro-delays across sliding windows", "Sub-ceiling transaction amounts"],
                severity_potential=SeverityLevel.HIGH,
                icon_name="Zap"
            ),
            AttackAgentSchema(
                id="agent-idf-02",
                type=AttackAgentType.IDENTITY_FRAGMENTER,
                name="Identity Fragmenter",
                description="Generates dozens of synthetic accounts sharing hardware fingerprints and fuzzy addresses to evade single-account velocity limits.",
                target_policies=["pol-vel-01"],
                evasion_tactics=["Distributed customer IDs", "Shared hardware device reuse", "Pincode permutation"],
                severity_potential=SeverityLevel.CRITICAL,
                icon_name="Users"
            ),
            AttackAgentSchema(
                id="agent-ref-03",
                type=AttackAgentType.REFUND_ABUSER,
                name="Refund Abuser",
                description="Executes high-velocity small purchases followed by instantaneous simulated refunds to drain merchant promotional balance.",
                target_policies=["pol-vel-01"],
                evasion_tactics=["Rapid purchase-refund cycle", "Micro-amount draining", "Multi-instrument refund requests"],
                severity_potential=SeverityLevel.MEDIUM,
                icon_name="RotateCcw"
            ),
            AttackAgentSchema(
                id="agent-prm-04",
                type=AttackAgentType.PROMOTION_ABUSER,
                name="Promotion Abuser",
                description="Exploits new-user referral coupons and promo codes across rotating synthetic identities.",
                target_policies=["pol-vel-01"],
                evasion_tactics=["Single-use coupon farming", "Multi-identity promo redemption", "Referral cycle collusion"],
                severity_potential=SeverityLevel.MEDIUM,
                icon_name="Gift"
            ),
            AttackAgentSchema(
                id="agent-rot-05",
                type=AttackAgentType.PAYMENT_ROTATOR,
                name="Payment Rotator",
                description="Cycles synthetic credit cards, UPI handles, and virtual cards through single sessions to evade card-level rate limits.",
                target_policies=["pol-vel-01"],
                evasion_tactics=["Card BIN cycling", "UPI VPA rotation", "Virtual instrument exhaustion"],
                severity_potential=SeverityLevel.HIGH,
                icon_name="CreditCard"
            ),
            AttackAgentSchema(
                id="agent-cls-06",
                type=AttackAgentType.COORDINATED_CLUSTER,
                name="Coordinated Cluster",
                description="Orchestrates distributed, multi-account syndicates operating through shared proxy networks and synchronized timing.",
                target_policies=["pol-vel-01"],
                evasion_tactics=["Distributed timing orchestration", "Shared proxy pool rotation", "Mesh collusion topology"],
                severity_potential=SeverityLevel.CRITICAL,
                icon_name="Network"
            ),
        ]
        for a in agents:
            self._agents[a.type] = a

    async def list_attack_agents(self) -> List[AttackAgentSchema]:
        async with self._lock:
            return list(self._agents.values())

    async def get_attack_agent_by_type(self, agent_type: AttackAgentType) -> Optional[AttackAgentSchema]:
        async with self._lock:
            return self._agents.get(agent_type)

    async def save_scenario(self, scenario: AttackScenarioSchema) -> AttackScenarioSchema:
        async with self._lock:
            self._scenarios[scenario.id] = scenario
            return scenario

    async def get_scenarios_by_simulation(self, simulation_id: str) -> List[AttackScenarioSchema]:
        async with self._lock:
            return [s for s in self._scenarios.values() if s.simulation_id == simulation_id]
