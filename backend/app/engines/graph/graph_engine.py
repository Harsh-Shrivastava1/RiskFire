from typing import Any, Dict, List, Set
from backend.app.schemas.graph import (
    AttackGraphDataResponse,
    GraphNodeSchema,
    GraphEdgeSchema,
    GraphNodeDataSchema,
    GraphEntityType,
    PositionSchema,
)


class AttackGraphEngine:
    """
    Synthesizes entity relationship graphs from simulation event data,
    mapping cross-account device, IP, and address collusion.
    """

    def build_attack_graph(self, transactions: List[Dict[str, Any]]) -> AttackGraphDataResponse:
        nodes_map: Dict[str, GraphNodeSchema] = {}
        edges_map: Dict[str, GraphEdgeSchema] = {}
        connections_count: Dict[str, int] = {}

        # 1. First pass: count linkages
        for txn in transactions:
            acc_id = txn.get("account_id", "")
            dev_id = txn.get("device_id", "")
            ip_id = txn.get("ip_id", "")
            addr_id = txn.get("address_id", "")
            inst_id = txn.get("payment_instrument_id", "")

            for entity in [acc_id, dev_id, ip_id, addr_id, inst_id]:
                if entity:
                    connections_count[entity] = connections_count.get(entity, 0) + 1

        # 2. Second pass: build nodes and edges with deterministic layout positions
        col_x = {
            GraphEntityType.ACCOUNT: 80.0,
            GraphEntityType.DEVICE: 320.0,
            GraphEntityType.IP: 560.0,
            GraphEntityType.ADDRESS: 800.0,
            GraphEntityType.PAYMENT_INSTRUMENT: 1040.0,
        }
        y_cursor = {k: 50.0 for k in col_x}

        for txn in transactions:
            is_adv = bool(txn.get("is_adversarial", False))
            acc_id = txn.get("account_id", "")
            dev_id = txn.get("device_id", "")
            ip_id = txn.get("ip_id", "")
            addr_id = txn.get("address_id", "")
            inst_id = txn.get("payment_instrument_id", "")

            # Create Account Node
            if acc_id and acc_id not in nodes_map:
                nodes_map[acc_id] = GraphNodeSchema(
                    id=acc_id,
                    type="account",
                    position=PositionSchema(x=col_x[GraphEntityType.ACCOUNT], y=y_cursor[GraphEntityType.ACCOUNT]),
                    data=GraphNodeDataSchema(
                        id=acc_id,
                        label=f"Account {acc_id[-6:]}",
                        entityType=GraphEntityType.ACCOUNT,
                        identifier=acc_id,
                        isAdversarial=is_adv,
                        isShared=connections_count.get(acc_id, 0) > 1,
                        connectionCount=connections_count.get(acc_id, 1),
                        riskLevel="CRITICAL" if is_adv else "LOW",
                        metadata={"account_id": acc_id}
                    )
                )
                y_cursor[GraphEntityType.ACCOUNT] += 85.0

            # Create Device Node
            if dev_id and dev_id not in nodes_map:
                nodes_map[dev_id] = GraphNodeSchema(
                    id=dev_id,
                    type="device",
                    position=PositionSchema(x=col_x[GraphEntityType.DEVICE], y=y_cursor[GraphEntityType.DEVICE]),
                    data=GraphNodeDataSchema(
                        id=dev_id,
                        label=f"Device {dev_id}",
                        entityType=GraphEntityType.DEVICE,
                        identifier=dev_id,
                        isAdversarial=is_adv,
                        isShared=connections_count.get(dev_id, 0) > 1,
                        connectionCount=connections_count.get(dev_id, 1),
                        riskLevel="CRITICAL" if is_adv else "LOW",
                        metadata={"device_fingerprint": dev_id}
                    )
                )
                y_cursor[GraphEntityType.DEVICE] += 85.0

            # Create Edge: Account -> Device
            if acc_id and dev_id:
                edge_id = f"e-{acc_id}-{dev_id}"
                if edge_id not in edges_map:
                    edges_map[edge_id] = GraphEdgeSchema(
                        id=edge_id,
                        source=acc_id,
                        target=dev_id,
                        label="USED_DEVICE",
                        animated=is_adv,
                        style={"stroke": "#dc2626" if is_adv else "#94a3b8"}
                    )

            # Create IP Node & Edge
            if ip_id and ip_id not in nodes_map:
                nodes_map[ip_id] = GraphNodeSchema(
                    id=ip_id,
                    type="ip",
                    position=PositionSchema(x=col_x[GraphEntityType.IP], y=y_cursor[GraphEntityType.IP]),
                    data=GraphNodeDataSchema(
                        id=ip_id,
                        label=f"IP {ip_id}",
                        entityType=GraphEntityType.IP,
                        identifier=ip_id,
                        isAdversarial=is_adv,
                        isShared=connections_count.get(ip_id, 0) > 1,
                        connectionCount=connections_count.get(ip_id, 1),
                        riskLevel="HIGH" if is_adv else "LOW",
                        metadata={"ip": ip_id}
                    )
                )
                y_cursor[GraphEntityType.IP] += 85.0

            if dev_id and ip_id:
                edge_id = f"e-{dev_id}-{ip_id}"
                if edge_id not in edges_map:
                    edges_map[edge_id] = GraphEdgeSchema(
                        id=edge_id,
                        source=dev_id,
                        target=ip_id,
                        label="CONNECTED_FROM",
                        animated=is_adv,
                        style={"stroke": "#dc2626" if is_adv else "#94a3b8"}
                    )

        return AttackGraphDataResponse(
            nodes=list(nodes_map.values()),
            edges=list(edges_map.values())
        )
