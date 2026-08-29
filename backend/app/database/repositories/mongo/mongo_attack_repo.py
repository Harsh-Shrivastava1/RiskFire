from typing import List, Optional
from pymongo.database import Database
from backend.app.database.repositories.interfaces.attack_repository import AttackRepository
from backend.app.schemas.attack import (
    AttackAgentSchema,
    AttackScenarioSchema,
    AttackAgentType,
    SeverityLevel,
)

DEFAULT_ATTACK_AGENTS = [
    AttackAgentSchema(
        id="agent-vel-01",
        type=AttackAgentType.VELOCITY_ATTACKER,
        name="Velocity Attacker",
        description="Rapidly pulses transaction attempts right at and below time-window thresholds to exploit batch evaluation gaps.",
        target_policies=["pol-vel-01"],
        evasion_tactics=["Threshold skimming", "Micro-delays across sliding windows", "Sub-ceiling transaction amounts"],
        severity_potential=SeverityLevel.HIGH,
        icon_name="Zap",
    ),
    AttackAgentSchema(
        id="agent-idf-02",
        type=AttackAgentType.IDENTITY_FRAGMENTER,
        name="Identity Fragmenter",
        description="Generates dozens of synthetic accounts sharing hardware fingerprints and fuzzy addresses to evade single-account velocity limits.",
        target_policies=["pol-vel-01"],
        evasion_tactics=["Distributed customer IDs", "Shared hardware device reuse", "Pincode permutation"],
        severity_potential=SeverityLevel.CRITICAL,
        icon_name="Users",
    ),
    AttackAgentSchema(
        id="agent-ref-03",
        type=AttackAgentType.REFUND_ABUSER,
        name="Refund Abuser",
        description="Executes high-velocity small purchases followed by instantaneous simulated refunds to drain merchant promotional balance.",
        target_policies=["pol-vel-01"],
        evasion_tactics=["Rapid purchase-refund cycle", "Micro-amount draining", "Multi-instrument refund requests"],
        severity_potential=SeverityLevel.MEDIUM,
        icon_name="RotateCcw",
    ),
    AttackAgentSchema(
        id="agent-prm-04",
        type=AttackAgentType.PROMOTION_ABUSER,
        name="Promotion Abuser",
        description="Exploits new-user referral coupons and promo codes across rotating synthetic identities.",
        target_policies=["pol-vel-01"],
        evasion_tactics=["Single-use coupon farming", "Multi-identity promo redemption", "Referral cycle collusion"],
        severity_potential=SeverityLevel.MEDIUM,
        icon_name="Gift",
    ),
    AttackAgentSchema(
        id="agent-rot-05",
        type=AttackAgentType.PAYMENT_ROTATOR,
        name="Payment Rotator",
        description="Cycles synthetic credit cards, UPI handles, and virtual cards through single sessions to evade card-level rate limits.",
        target_policies=["pol-vel-01"],
        evasion_tactics=["Card BIN cycling", "UPI VPA rotation", "Virtual instrument exhaustion"],
        severity_potential=SeverityLevel.HIGH,
        icon_name="CreditCard",
    ),
    AttackAgentSchema(
        id="agent-cls-06",
        type=AttackAgentType.COORDINATED_CLUSTER,
        name="Coordinated Cluster",
        description="Orchestrates distributed, multi-account syndicates operating through shared proxy networks and synchronized timing.",
        target_policies=["pol-vel-01"],
        evasion_tactics=["Distributed timing orchestration", "Shared proxy pool rotation", "Mesh collusion topology"],
        severity_potential=SeverityLevel.CRITICAL,
        icon_name="Network",
    ),
]


class MongoAttackRepository(AttackRepository):
    def __init__(self, db: Database):
        self.agents_col = db.attack_agents
        self.scenarios_col = db.attack_scenarios

    def ensure_default_agents(self) -> None:
        for agent in DEFAULT_ATTACK_AGENTS:
            self.agents_col.update_one(
                {"type": agent.type.value if hasattr(agent.type, "value") else str(agent.type)},
                {"$set": agent.model_dump()},
                upsert=True,
            )

    async def list_attack_agents(self) -> List[AttackAgentSchema]:
        docs = list(self.agents_col.find({}, {"_id": 0}))
        if not docs:
            self.ensure_default_agents()
            docs = list(self.agents_col.find({}, {"_id": 0}))
        return [AttackAgentSchema.model_validate(doc) for doc in docs]

    async def get_attack_agent_by_type(self, agent_type: AttackAgentType) -> Optional[AttackAgentSchema]:
        val = agent_type.value if hasattr(agent_type, "value") else str(agent_type)
        doc = self.agents_col.find_one({"type": val}, {"_id": 0})
        if not doc:
            self.ensure_default_agents()
            doc = self.agents_col.find_one({"type": val}, {"_id": 0})
        if not doc:
            return None
        return AttackAgentSchema.model_validate(doc)

    async def save_scenario(self, scenario: AttackScenarioSchema) -> AttackScenarioSchema:
        self.scenarios_col.update_one(
            {"id": scenario.id},
            {"$set": scenario.model_dump()},
            upsert=True,
        )
        return scenario

    async def get_scenarios_by_simulation(self, simulation_id: str) -> List[AttackScenarioSchema]:
        docs = list(self.scenarios_col.find({"simulation_id": simulation_id}, {"_id": 0}))
        return [AttackScenarioSchema.model_validate(doc) for doc in docs]
