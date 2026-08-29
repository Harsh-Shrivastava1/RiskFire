from typing import Optional
from backend.app.engines.graph.graph_engine import AttackGraphEngine
from backend.app.schemas.graph import AttackGraphDataResponse
from backend.app.services.simulation_service import SimulationService


class GraphService:
    def __init__(self, simulation_service: SimulationService):
        self.simulation_service = simulation_service
        self.graph_engine = AttackGraphEngine()

    async def get_attack_graph(self, simulation_id: Optional[str] = None) -> AttackGraphDataResponse:
        # Load transactions from simulation if available, otherwise generate dynamic sample topology
        transactions = []
        if simulation_id:
            transactions = self.simulation_service.get_simulation_transactions(simulation_id)
        
        if not transactions:
            # Generate representative dynamic topology
            transactions = [
                {"account_id": "acc-syn-449", "device_id": "DEV-9102-FP89", "ip_id": "10.244.18.91", "address_id": "ADDR-0819", "payment_instrument_id": "CARD-4242", "amount": 4800.0, "is_adversarial": True},
                {"account_id": "acc-syn-450", "device_id": "DEV-9102-FP89", "ip_id": "10.244.18.91", "address_id": "ADDR-0819", "payment_instrument_id": "CARD-4242", "amount": 5200.0, "is_adversarial": True},
                {"account_id": "acc-syn-451", "device_id": "DEV-9102-FP89", "ip_id": "10.244.18.95", "address_id": "ADDR-0819", "payment_instrument_id": "UPI-8819", "amount": 6100.0, "is_adversarial": True},
                {"account_id": "acc-syn-452", "device_id": "DEV-9102-FP89", "ip_id": "10.244.18.95", "address_id": "ADDR-0820", "payment_instrument_id": "UPI-8819", "amount": 3900.0, "is_adversarial": True},
                {"account_id": "acc-org-101", "device_id": "DEV-3301-FP12", "ip_id": "10.244.55.12", "address_id": "ADDR-1100", "payment_instrument_id": "CARD-1199", "amount": 1200.0, "is_adversarial": False},
                {"account_id": "acc-org-102", "device_id": "DEV-3302-FP15", "ip_id": "10.244.55.18", "address_id": "ADDR-1105", "payment_instrument_id": "CARD-2288", "amount": 2500.0, "is_adversarial": False},
            ]

        return self.graph_engine.build_attack_graph(transactions)
