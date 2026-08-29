from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import PolicyStatus, SeverityLevel


class PolicyCategory(str, Enum):
    VELOCITY = "VELOCITY"
    AMOUNT = "AMOUNT"
    IDENTITY = "IDENTITY"
    PAYMENT_INSTRUMENT = "PAYMENT_INSTRUMENT"
    REFUNDS = "REFUNDS"
    PROMOTIONS = "PROMOTIONS"
    BEHAVIORAL = "BEHAVIORAL"


class PolicyRuleType(str, Enum):
    VELOCITY_ACCOUNT = "VELOCITY_ACCOUNT"
    VELOCITY_DEVICE = "VELOCITY_DEVICE"
    VELOCITY_INSTRUMENT = "VELOCITY_INSTRUMENT"
    VELOCITY_ADDRESS = "VELOCITY_ADDRESS"
    VELOCITY_IP = "VELOCITY_IP"
    AMOUNT_MAX = "AMOUNT_MAX"
    AMOUNT_DAILY = "AMOUNT_DAILY"
    IDENTITY_ACCOUNT_AGE = "IDENTITY_ACCOUNT_AGE"
    IDENTITY_DEVICE_COUNT = "IDENTITY_DEVICE_COUNT"
    INSTRUMENT_CARDS_PER_ACCOUNT = "INSTRUMENT_CARDS_PER_ACCOUNT"
    REFUND_RATIO = "REFUND_RATIO"
    PROMOTION_COUPON = "PROMOTION_COUPON"
    BEHAVIOR_RAPID_SWITCH = "BEHAVIOR_RAPID_SWITCH"


class RuleAction(str, Enum):
    BLOCK = "BLOCK"
    FLAG = "FLAG"
    MONITOR = "MONITOR"


class PolicyRuleSchema(BaseModel):
    id: Optional[str] = None
    policy_version_id: Optional[str] = None
    name: str
    rule_type: PolicyRuleType
    category: PolicyCategory
    parameters: Dict[str, Any] = Field(default_factory=dict)
    action: RuleAction
    is_enabled: bool = True
    sequence_order: int = 1
    description: Optional[str] = None


class PolicyVersionSchema(BaseModel):
    id: str
    policy_id: str
    version_number: str
    status: PolicyStatus
    rules: List[PolicyRuleSchema] = Field(default_factory=list)
    created_at: str
    created_by: str
    notes: Optional[str] = None


class PolicyCreate(BaseModel):
    name: str
    description: str
    category: PolicyCategory
    rules: List[PolicyRuleSchema]
    notes: Optional[str] = "Initial version"


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class PolicyResponse(BaseModel):
    id: str
    merchant_id: str
    name: str
    description: str
    category: PolicyCategory
    current_version_id: str
    current_version_number: str
    is_active: bool
    rule_count: int
    coverage_rate: float
    effectiveness_rate: float
    created_at: str
    updated_at: str
    versions: List[PolicyVersionSchema] = Field(default_factory=list)
