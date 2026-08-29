from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.common import SeverityLevel


class GraphEntityType(str, Enum):
    ACCOUNT = "ACCOUNT"
    DEVICE = "DEVICE"
    IP = "IP"
    ADDRESS = "ADDRESS"
    PAYMENT_INSTRUMENT = "PAYMENT_INSTRUMENT"
    ORDER = "ORDER"
    TRANSACTION = "TRANSACTION"


class PositionSchema(BaseModel):
    x: float
    y: float


class GraphNodeDataSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    label: str
    entity_type: GraphEntityType = Field(serialization_alias="entityType", alias="entityType")
    identifier: str
    is_adversarial: bool = Field(serialization_alias="isAdversarial", alias="isAdversarial")
    is_shared: bool = Field(serialization_alias="isShared", alias="isShared")
    connection_count: int = Field(serialization_alias="connectionCount", alias="connectionCount")
    risk_level: Optional[str] = Field(default=None, serialization_alias="riskLevel", alias="riskLevel")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphNodeSchema(BaseModel):
    id: str
    type: str
    position: PositionSchema
    data: GraphNodeDataSchema


class GraphEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = False
    style: Dict[str, Any] = Field(default_factory=dict)


class AttackGraphDataResponse(BaseModel):
    nodes: List[GraphNodeSchema] = Field(default_factory=list)
    edges: List[GraphEdgeSchema] = Field(default_factory=list)
