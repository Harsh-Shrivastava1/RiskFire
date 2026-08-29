# RiskFire — AI Architecture

> Reference: [riskfire-product-spec.md](../product/riskfire-product-spec.md)
> Reference: [riskfire-system-architecture.md](./riskfire-system-architecture.md)

---

## 1. AI Architecture Philosophy

RiskFire uses AI in **exactly four places** — where LLM reasoning genuinely adds value that deterministic code cannot provide:

1. **Attack planning** — generating intelligent, contextual adversarial strategies
2. **Vulnerability explanation** — converting structured evidence into clear human-readable analysis
3. **Policy patch generation** — reasoning about trade-offs in policy changes
4. **Executive report generation** — synthesizing results into narrative form

In every other part of the system — evaluation, simulation, financial calculations, benchmark metrics — deterministic engines are the sole source of truth.

The core rule is absolute:

> **"AI proposes. The simulator proves."**

---

## 2. Provider Stack

### MVP Configuration

```
AIProvider (abstract base interface)
    |
    v
GroqProvider
    |
    v
Groq API
    |
    v
Model: openai/gpt-oss-120b
```

### Provider Abstraction

The `AIProvider` abstract class defines the interface that all providers must implement. Business logic interacts only with `AIProvider` — never with a specific provider implementation.

```python
# backend/app/ai/base.py

from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    """
    Abstract AI provider interface.
    All provider implementations must inherit from this class.
    Business logic must never import a concrete provider directly.
    """

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system_prompt: str,
        response_schema: type,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> Any:
        """
        Generate a structured completion.
        response_schema is a Pydantic model class.
        The provider must return a validated instance of response_schema.
        """
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Returns True if the provider is reachable and functioning."""
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the provider identifier (e.g., 'groq')."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Returns the model identifier (e.g., 'openai/gpt-oss-120b')."""
        ...
```

### Adding a Future Provider

To add a new provider (e.g., OpenAI, Anthropic, Google):
1. Create `backend/app/ai/providers/{provider}.py`
2. Implement `AIProvider`
3. Update `backend/app/core/config.py` to select the provider via environment variable
4. No business logic changes required

---

## 3. Structured Output Contract

**All AI outputs must be structured JSON, validated against a Pydantic schema.**

AI is never given a "write anything" prompt. Every prompt specifies:
- Exact JSON structure required
- Field descriptions and constraints
- What to include and what to omit

If the AI output fails Pydantic validation:
- The output is rejected
- An error is returned to the caller
- The failed generation is logged in `ai_generations` with `validation_status = FAILED`
- No downstream action is taken

---

## 4. AI Module 1: Attack Planner

### Purpose
Generate an intelligent, contextual attack plan given the merchant's current policies and simulation constraints.

### Location
`backend/app/ai/attack_planner.py`

### Input Schema
```python
class AttackPlannerInput(BaseModel):
    merchant_id: UUID
    simulation_id: UUID
    active_policies: list[PolicySummary]
    simulation_constraints: SimulationConstraints
    available_entity_counts: EntityCounts
    attacker_objective: AttackerObjective
    difficulty: AttackDifficulty  # LOW | MEDIUM | HIGH
    previous_results: list[AttackResultSummary] | None = None
```

### Output Schema
```python
class AttackPlan(BaseModel):
    attack_type: AttackType
    objective: str
    target_policy_id: str
    actors: int = Field(ge=1, le=100)
    shared_device: bool
    shared_address: bool
    shared_ip: bool
    transaction_count: int = Field(ge=1, le=10000)
    duration_minutes: int = Field(ge=1, le=1440)
    attack_steps: list[AttackStep]
    reasoning: str  # AI explanation of the strategy (for audit only)
```

### Prompt Strategy
- System prompt: Defines the AI as an adversarial red-team strategist
- User prompt: Provides structured policy data + constraints
- Temperature: 0.5 (some creativity for attack diversity)
- The prompt explicitly forbids the AI from inventing entity counts or policy data

### Post-AI Processing
1. `AttackPlan` Pydantic validation
2. `AttackValidator.validate(plan, simulation_constraints)` — deterministic constraint check
3. If either fails → reject plan; log failure; return error

---

## 5. AI Module 2: Vulnerability Explainer

### Purpose
Convert structured vulnerability evidence (produced by the deterministic vulnerability engine) into a clear, human-readable explanation of why the policy failed.

### Location
`backend/app/ai/vulnerability_explainer.py`

### Input Schema
```python
class VulnerabilityExplainerInput(BaseModel):
    vulnerability_id: UUID
    attack_type: AttackType
    target_policy: PolicySummary
    evidence: VulnerabilityEvidence  # From VulnerabilityEngine — not invented
    attack_path: list[AttackStep]
    bypass_count: int
    total_attack_count: int
    simulated_exposure: Decimal
```

### Output Schema
```python
class VulnerabilityExplanation(BaseModel):
    summary: str                      # 1-2 sentence summary
    why_the_policy_failed: str        # Detailed explanation
    attack_mechanism: str             # How the bypass worked
    key_signal_missed: str            # What data the policy didn't use
    contributing_factors: list[str]   # Specific contributing factors
    confidence: ExplanationConfidence # HIGH | MEDIUM | LOW
```

### Critical Constraint
The prompt explicitly instructs the AI:
- Use ONLY the structured evidence provided
- Do NOT invent transaction counts, account counts, or exposure figures
- Do NOT speculate beyond the provided evidence

Violation of this in the output would still be caught by Pydantic schema validation, which prevents free-form data from entering the evidence trail.

---

## 6. AI Module 3: Patch Generator

### Purpose
Propose a candidate policy change that addresses the identified vulnerability, while reasoning about trade-offs.

### Location
`backend/app/ai/patch_generator.py`

### Input Schema
```python
class PatchGeneratorInput(BaseModel):
    vulnerability_id: UUID
    current_policy: PolicyDetail
    vulnerability_explanation: VulnerabilityExplanation
    attack_evidence: VulnerabilityEvidence
    legitimate_transaction_sample: LegitimateTransactionStats
    current_false_positive_rate: float
    simulation_constraints: SimulationConstraints
```

### Output Schema
```python
class PatchProposal(BaseModel):
    target_policy_id: UUID
    identified_weakness: str
    proposed_changes: list[PolicyRuleChange]
    reasoning: str
    expected_benefit: str
    expected_fpr_impact: str           # Text description; actual FPR calculated by BenchmarkEngine
    expected_customer_friction: str    # Text description; not a number
    confidence: PatchConfidence        # HIGH | MEDIUM | LOW
    alternative_approaches: list[str]  # Other approaches considered
```

### Policy Rule Change Schema
```python
class PolicyRuleChange(BaseModel):
    rule_type: PolicyRuleType
    operation: RuleOperation          # ADD | MODIFY | REMOVE
    current_value: dict | None
    proposed_value: dict
    rationale: str
```

### Post-AI Processing
1. `PatchProposal` Pydantic validation
2. Store as `policy_patches` record with `status = PENDING_SIMULATION`
3. No policy change occurs until merchant explicitly triggers simulation AND approves

---

## 7. AI Module 4: Report Generator

### Purpose
Convert actual benchmark and simulation results into an executive risk report narrative.

### Location
`backend/app/ai/report_generator.py`

### Input Schema
```python
class ReportGeneratorInput(BaseModel):
    simulation_run_id: UUID
    merchant_name: str
    policy_version: str
    benchmark_results: BenchmarkResults       # From BenchmarkEngine
    top_vulnerabilities: list[VulnerabilitySummary]
    patch_comparison: PatchComparison | None  # BEFORE vs AFTER from ReplayEngine
    simulation_summary: SimulationSummary
    report_period: ReportPeriod
```

### Output Schema
```python
class ExecutiveReport(BaseModel):
    executive_summary: str
    risk_posture_assessment: str
    key_findings: list[ReportFinding]
    vulnerability_narratives: list[str]
    patch_assessment: str | None
    recommended_actions: list[str]
    methodology_note: str               # Must describe synthetic nature of data
    disclaimer: str                     # Must state figures are simulated estimates
```

### Critical Constraint
Every numerical value in the report must trace to `ReportGeneratorInput`. The AI must not add numbers that were not in the input.

The `disclaimer` field is mandatory and must include language clearly stating that all financial figures are simulated estimates based on synthetic data.

---

## 8. Prompt Engineering Standards

### 8.1 Prompt Versioning

All prompts are versioned. Prompt templates live in `backend/app/ai/prompts/`.

```
prompts/
+-- attack_planner_v1.txt
+-- vulnerability_explainer_v1.txt
+-- patch_generator_v1.txt
+-- report_generator_v1.txt
```

Every AI generation records the prompt version used (`ai_generations.prompt_version`).

### 8.2 System Prompt Requirements

Every system prompt must:
1. Define the AI's role precisely
2. State what the AI is NOT allowed to do (invent data, calculate numbers)
3. Specify the exact output format required
4. State that all numerical data comes from the provided input

### 8.3 Temperature Guidelines

| Module | Temperature | Rationale |
|---|---|---|
| Attack Planner | 0.5 | Needs creative diversity in attack strategies |
| Vulnerability Explainer | 0.2 | Needs accurate, grounded analysis |
| Patch Generator | 0.3 | Needs creativity constrained by evidence |
| Report Generator | 0.3 | Needs fluent prose, grounded in data |

---

## 9. AI Auditability

Every AI generation is recorded in the `ai_generations` database table.

### Fields Recorded

| Field | Description |
|---|---|
| `id` | UUID |
| `provider` | "groq" |
| `model` | "openai/gpt-oss-120b" |
| `module` | "attack_planner" / "vulnerability_explainer" / "patch_generator" / "report_generator" |
| `prompt_version` | e.g., "attack_planner_v1" |
| `input_reference_id` | FK to the input record (e.g., simulation_id) |
| `input_hash` | SHA-256 of the structured input (for verification) |
| `raw_output` | Full raw AI response text |
| `parsed_output` | Structured JSON after parsing |
| `validation_status` | PASSED / FAILED |
| `validation_errors` | Pydantic validation errors if FAILED |
| `created_at` | Timestamp |
| `simulation_run_id` | FK |
| `policy_version_id` | FK |

### What Is Never Stored

- GROQ_API_KEY or any secret
- Real payment credentials (these are never sent to AI in the first place)
- Customer PII (synthetic data only)

---

## 10. AI Security Rules

1. **AI never receives real payment credentials.** Synthetic data only.
2. **AI outputs never directly trigger backend actions.** Every output passes through Pydantic validation and an additional domain validator before any state change.
3. **AI is never given the ability to call tools or APIs.** Structured output completion only.
4. **Prompt injection is mitigated** by using structured input schemas (not raw user text) as AI input.
5. **AI output that fails validation is rejected completely** — never partially accepted.

---

## 11. AI Layer File Structure

```
backend/app/ai/
+-- base.py                    # AIProvider abstract class
+-- factory.py                 # Creates provider instance from config
+-- attack_planner.py          # AttackPlanner class
+-- vulnerability_explainer.py # VulnerabilityExplainer class
+-- patch_generator.py         # PatchGenerator class
+-- report_generator.py        # ReportGenerator class
+-- schemas/
|   +-- attack_plan.py         # AttackPlan + AttackPlannerInput schemas
|   +-- explanation.py         # VulnerabilityExplanation schemas
|   +-- patch.py               # PatchProposal schemas
|   +-- report.py              # ExecutiveReport schemas
+-- providers/
|   +-- groq.py                # GroqProvider implementation
+-- prompts/
    +-- attack_planner_v1.txt
    +-- vulnerability_explainer_v1.txt
    +-- patch_generator_v1.txt
    +-- report_generator_v1.txt
```

---

## 12. Open Questions / Future Considerations

| Question | Status |
|---|---|
| Should the AI see previous failed attack plans to improve? | Partially addressed — `previous_results` field in `AttackPlannerInput`. Full feedback loop is a post-MVP enhancement. |
| Multi-turn AI conversation for patch refinement? | Out of scope for MVP. Single-turn structured completion only. |
| Fine-tuning on RiskFire-specific data? | Future consideration. Not applicable to hackathon prototype. |
| Streaming AI responses for report generation? | Possible enhancement — FastAPI supports streaming; not planned for MVP. |

---

*Document Version: 1.0.0*
*Created: 2026-08-20*
*Reference: riskfire-product-spec.md*
