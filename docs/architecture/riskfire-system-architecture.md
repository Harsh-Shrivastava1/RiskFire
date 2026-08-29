# RiskFire — System Architecture

> Reference: [riskfire-product-spec.md](../product/riskfire-product-spec.md)

---

## 1. Architecture Philosophy

RiskFire is built on a single foundational principle:

> **"AI proposes. The simulator proves."**

This means:
- AI generates **proposals** (attack plans, patch suggestions, explanations)
- Deterministic engines **validate, execute, and measure** everything
- Metrics and financial figures are **never sourced from AI**
- The merchant is always the **final approver** for policy changes

---

## 2. High-Level System Overview

```
+-----------------------------------------------------+
|                   FRONTEND (React)                  |
|  Risk Command Center | Attack Lab | Attack Graph     |
|  Policies | Patches | Replay | Benchmark | Audit    |
+-----------------------------------------------------+
              |          |          |
          HTTP/REST    WebSocket  HTTP/REST
              |          |          |
+-----------------------------------------------------+
|                  BACKEND (FastAPI)                   |
|                                                     |
|  +------------------+   +------------------------+ |
|  |    AI LAYER      |   |    API ROUTES          | |
|  |                  |   |                        | |
|  |  AIProvider      |   |  /policies             | |
|  |  GroqProvider    |   |  /simulations          | |
|  |                  |   |  /attacks              | |
|  |  AttackPlanner   |   |  /vulnerabilities      | |
|  |  VulnExplainer   |   |  /patches              | |
|  |  PatchGenerator  |   |  /benchmarks           | |
|  |  ReportGenerator |   |  /audit                | |
|  +------------------+   +------------------------+ |
|           |                         |              |
|           v                         v              |
|  +--------------------------------------------------+|
|  |            DETERMINISTIC CORE ENGINES            ||
|  |                                                  ||
|  |  PolicyEngine      SimulationEngine              ||
|  |  AttackValidator   RiskEvaluationEngine          ||
|  |  VulnerabilityEngine  ExposureEngine             ||
|  |  AttackGraphEngine    PatchSimulator             ||
|  |  ReplayEngine      BenchmarkEngine               ||
|  +--------------------------------------------------+|
|           |                                         |
|           v                                         |
|  +------------------+                               |
|  |    DATABASE      |                               |
|  |  PostgreSQL      |                               |
|  +------------------+                               |
|           |                                         |
|  +------------------+                               |
|  |    REDIS         |  (Optional: background jobs,  |
|  |                  |   WebSocket state)             |
|  +------------------+                               |
+-----------------------------------------------------+
              |
         Groq API (external)
         openai/gpt-oss-120b
```

---

## 3. Component Layers

### 3.1 Frontend Layer (React + TypeScript + Vite)

**Responsibilities:**
- User interface rendering
- Real-time simulation progress display (WebSocket)
- React Flow attack graph visualization
- BEFORE/AFTER comparison rendering
- Recharts metrics visualization
- Zustand state management
- API communication via Axios

**Does NOT contain:**
- Risk evaluation logic
- Financial calculation logic
- Benchmark calculation logic
- AI prompt management
- Any hard-coded metrics or simulation results

### 3.2 API Layer (FastAPI)

**Responsibilities:**
- HTTP REST API for all frontend operations
- WebSocket endpoint for simulation streaming
- Request validation (Pydantic)
- Authentication and authorization (JWT)
- Routing requests to appropriate service/engine
- Audit logging

**API versioning:** `/api/v1/`

### 3.3 AI Layer

**Responsibilities:**
- Provide an abstract `AIProvider` interface
- Implement `GroqProvider` using Groq API
- Run structured prompts with validated structured outputs
- Feed structured data from deterministic engines to AI
- Return structured JSON (never free-form to engines)

**Does NOT:**
- Evaluate transactions
- Calculate financial exposure
- Approve or apply patches
- Set benchmark metrics

See [riskfire-ai-architecture.md](./riskfire-ai-architecture.md) for full detail.

### 3.4 Deterministic Core Engines

These are the real foundation of RiskFire. All risk logic, simulation logic, financial calculations, and benchmark logic lives here.

| Engine | Responsibility |
|---|---|
| PolicyEngine | Parse, validate, version, and evaluate risk policies against transactions |
| SimulationEngine | Generate and execute synthetic payment environments deterministically |
| AttackValidator | Validate AI-generated attack plans against simulation constraints |
| RiskEvaluationEngine | Apply policy rules to synthetic transactions; produce BLOCKED/FLAGGED/ALLOWED |
| VulnerabilityEngine | Compare attack intent vs. policy response; identify and score vulnerabilities |
| ExposureEngine | Calculate simulated financial exposure deterministically |
| AttackGraphEngine | Build entity relationship graphs from simulation event data |
| PatchSimulator | Run patched policies against existing attack scenarios |
| ReplayEngine | Replay identical attack scenarios against new policy versions |
| BenchmarkEngine | Calculate precision, recall, F1, FPR, and all other metrics |

### 3.5 Database Layer (MongoDB)

**Responsibilities:**
- Persist all simulation state
- Store policy versions
- Store all AI-generated artifacts (for auditability)
- Store benchmark results
- Store audit events

See [riskfire-data-model.md](./riskfire-data-model.md) for entity definitions.

### 3.6 Background Workers (Optional — Redis/Celery)

**Used for:**
- Long-running simulation jobs
- Real-time WebSocket state management
- Deferred report generation

**MVP:** May run simulation jobs synchronously or via FastAPI background tasks. Full async workers are a scalability enhancement.

---

## 4. Data Flow

### 4.1 Attack Planning Data Flow

```
Frontend: User configures attack in Attack Lab
    |
    v
API: POST /api/v1/simulations/
    |
    v
Service: SimulationService.create()
    |
    v
AI Layer: AttackPlanner.generate_plan(policies, constraints)
    |
    v
    Groq API -> structured JSON response
    |
    v
AttackValidator.validate(plan, simulation_constraints)
    |
    v
    [VALID] ---> SimulationEngine.execute(plan, seed)
    [INVALID] -> Error returned to frontend
    |
    v
SimulationEngine: Create synthetic entities + execute attack steps
    |
    v
RiskEvaluationEngine: Evaluate each transaction against active policy
    |
    v
VulnerabilityEngine: Identify bypasses, build vulnerability candidates
    |
    v
ExposureEngine: Calculate simulated financial exposure
    |
    v
AttackGraphEngine: Build entity relationship graph
    |
    v
Database: Persist all simulation events, results, vulnerabilities
    |
    v
WebSocket: Stream progress events to frontend
    |
    v
Frontend: Display live results
```

### 4.2 Vulnerability Explanation Data Flow

```
Frontend: User opens vulnerability detail
    |
    v
API: GET /api/v1/vulnerabilities/{id}
    |
    v
Service: VulnerabilityService.get_with_explanation()
    |
    v
[If explanation not yet generated]
    |
    v
AI Layer: VulnerabilityExplainer.explain(structured_evidence)
    |
    v
    Groq API -> human-readable explanation text
    |
    v
Database: Store explanation with audit record (ai_generations table)
    |
    v
Frontend: Display explanation + evidence trail
```

### 4.3 Patch Proposal and Simulation Data Flow

```
Frontend: User requests patch for vulnerability
    |
    v
API: POST /api/v1/patches/generate
    |
    v
AI Layer: PatchGenerator.generate(policy, vulnerability_evidence)
    |
    v
    Groq API -> structured patch proposal JSON
    |
    v
Pydantic validation of patch structure
    |
    v
Database: Store patch proposal (status: PENDING)
    |
    v
Frontend: Display patch proposal + "Simulate" button
    |
    v
[User clicks Simulate]
    |
    v
API: POST /api/v1/patches/{id}/simulate
    |
    v
PatchSimulator.simulate(patch, original_simulation_id)
    |
    v
ReplayEngine.replay(original_attack_scenarios, new_policy_version)
    |
    v
BenchmarkEngine.compare(before_metrics, after_metrics)
    |
    v
Database: Store patch simulation results
    |
    v
Frontend: Display BEFORE vs AFTER comparison
    |
    v
[Merchant approves or rejects]
    |
    v
Database: Update policy version + audit log entry
```

---

## 5. WebSocket Architecture

WebSockets are used exclusively for real-time simulation progress streaming.

```
Client                              Server
  |                                    |
  |---WS Connect /ws/simulation/{id}-->|
  |                                    |
  |<-- event: simulation_started ------|
  |<-- event: entity_created ----------|
  |<-- event: attack_step_executed ----|
  |<-- event: transaction_evaluated ---|
  |<-- event: bypass_detected ---------|
  |<-- event: simulation_completed ----|
  |                                    |
  |---WS Close ----------------------->|
```

WebSocket event structure:
```json
{
  "event": "bypass_detected",
  "simulation_id": "sim_abc123",
  "timestamp": "2026-08-20T11:30:00Z",
  "data": {
    "attack_step_id": "step_xyz",
    "transaction_count": 12,
    "accounts_involved": 4,
    "policy_id": "POL-VELOCITY-001"
  }
}
```

---

## 6. Repository Structure

```
riskfire/
|
+-- README.md                      # Developer onboarding + architecture summary
+-- .gitignore
+-- .env.example                   # All required environment variables
+-- docker-compose.yml             # PostgreSQL + Redis + backend + frontend
+-- Makefile                       # Common developer commands
|
+-- docs/
|   +-- product/
|   |   +-- riskfire-product-spec.md      # CANONICAL SPEC (single source of truth)
|   |   +-- riskfire-user-flows.md
|   |
|   +-- architecture/
|   |   +-- riskfire-system-architecture.md   # This document
|   |   +-- riskfire-ai-architecture.md
|   |   +-- riskfire-simulation-architecture.md
|   |   +-- riskfire-data-model.md
|   |   +-- riskfire-benchmarking.md
|   |   +-- riskfire-security.md
|   |
|   +-- decisions/
|       +-- ADR-001-tech-stack.md
|       +-- ADR-002-ai-provider-abstraction.md
|       +-- ADR-003-deterministic-simulation.md
|
+-- frontend/
|   +-- package.json
|   +-- vite.config.ts
|   +-- tsconfig.json
|   +-- tailwind.config.ts
|   +-- src/
|       +-- app/
|       |   +-- router/             # React Router configuration
|       |   +-- providers/          # Context providers (Zustand, WebSocket)
|       |   +-- config/             # App-level constants and config
|       |
|       +-- components/
|       |   +-- ui/                 # shadcn/ui base components
|       |   +-- layout/             # Shell, sidebar, header
|       |   +-- charts/             # Recharts wrappers
|       |   +-- graphs/             # React Flow wrappers
|       |   +-- policies/           # Policy-specific components
|       |   +-- simulations/        # Simulation-specific components
|       |   +-- vulnerabilities/    # Vulnerability components
|       |   +-- patches/            # Patch comparison components
|       |   +-- benchmarks/         # Benchmark metrics components
|       |
|       +-- pages/
|       |   +-- Dashboard/
|       |   +-- Policies/
|       |   +-- PolicyBuilder/
|       |   +-- AttackLab/
|       |   +-- LiveSimulation/
|       |   +-- Vulnerabilities/
|       |   +-- AttackGraph/
|       |   +-- Patches/
|       |   +-- Replay/
|       |   +-- Evaluation/
|       |   +-- Incidents/
|       |   +-- Datasets/
|       |   +-- AuditLog/
|       |   +-- Settings/
|       |   +-- Reports/
|       |
|       +-- hooks/                  # Custom React hooks
|       +-- services/
|       |   +-- api/                # Axios API clients per domain
|       |   +-- websocket/          # WebSocket connection manager
|       |
|       +-- store/                  # Zustand stores
|       +-- types/                  # TypeScript type definitions
|       +-- utils/                  # Utility functions
|
+-- backend/
|   +-- requirements.txt
|   +-- alembic.ini
|   +-- app/
|       +-- main.py                 # FastAPI app entry point
|       |
|       +-- core/
|       |   +-- config.py           # Settings (Pydantic BaseSettings)
|       |   +-- security.py         # JWT + auth utilities
|       |   +-- logging.py          # Structured logging setup
|       |   +-- exceptions.py       # Custom exception classes
|       |
|       +-- api/
|       |   +-- v1/
|       |   |   +-- routes/
|       |   |   |   +-- auth.py
|       |   |   |   +-- merchants.py
|       |   |   |   +-- policies.py
|       |   |   |   +-- simulations.py
|       |   |   |   +-- attacks.py
|       |   |   |   +-- vulnerabilities.py
|       |   |   |   +-- patches.py
|       |   |   |   +-- benchmarks.py
|       |   |   |   +-- incidents.py
|       |   |   |   +-- audit.py
|       |   |   |   +-- reports.py
|       |   |   +-- router.py
|       |   +-- websocket.py        # WebSocket endpoint
|       |
|       +-- models/                 # SQLAlchemy ORM models
|       |   (see riskfire-data-model.md)
|       |
|       +-- schemas/                # Pydantic schemas (request/response)
|       |
|       +-- services/               # Business logic orchestration
|       |   +-- simulation_service.py
|       |   +-- policy_service.py
|       |   +-- vulnerability_service.py
|       |   +-- patch_service.py
|       |   +-- benchmark_service.py
|       |   +-- audit_service.py
|       |   +-- report_service.py
|       |
|       +-- engines/                # Deterministic core engines
|       |   +-- policy/
|       |   +-- simulation/
|       |   +-- attacks/
|       |   +-- risk/
|       |   +-- vulnerability/
|       |   +-- exposure/
|       |   +-- graph/
|       |   +-- benchmark/
|       |
|       +-- ai/                     # AI abstraction layer
|       |   +-- base.py             # AIProvider abstract class
|       |   +-- providers/
|       |   |   +-- groq.py
|       |   +-- prompts/            # Versioned prompt templates
|       |   +-- attack_planner.py
|       |   +-- vulnerability_explainer.py
|       |   +-- patch_generator.py
|       |   +-- report_generator.py
|       |
|       +-- workers/                # Background job handlers
|       +-- database/
|           +-- session.py          # SQLAlchemy session management
|           +-- seed.py             # Development seed data
|   |
|   +-- alembic/
|   |   +-- versions/
|   |
|   +-- tests/
|       +-- unit/
|       +-- integration/
|       +-- benchmark/
|
+-- simulation/
|   +-- generators/                 # Synthetic entity generators
|   +-- scenarios/                  # Pre-defined scenario templates
|   +-- seeds/                      # Seed configuration files
|   +-- configs/                    # Simulation configuration schemas
|
+-- datasets/
|   +-- development/
|   +-- validation/
|   +-- held_out/
|
+-- benchmarks/
|   +-- scenarios/
|   +-- expected/
|   +-- reports/
|
+-- scripts/
    +-- setup.sh
    +-- seed_database.py
    +-- generate_dataset.py
    +-- run_benchmark.py
```

---

## 7. Technology Stack Rationale

| Technology | Role | Rationale |
|---|---|---|
| React + TypeScript | Frontend | Strong typing essential for complex state (simulation events, metrics, graph data) |
| Vite | Build tool | Fast HMR essential for rapid hackathon iteration |
| Tailwind CSS | Styling | Utility-first; enables fast, consistent UI without custom CSS overhead |
| shadcn/ui | UI components | Accessible, composable, Tailwind-native components |
| Zustand | State management | Lightweight vs. Redux; sufficient for this domain |
| React Flow | Attack graph | Purpose-built for interactive node-edge graphs |
| Recharts | Metrics charts | Composable, React-native charting |
| FastAPI | Backend | Async-native, Pydantic-first, excellent for WebSocket + REST |
| Pydantic | Validation | Critical for AI output validation before any action |
| SQLAlchemy | ORM | Mature, type-safe ORM for complex relational schema |
| Alembic | Migrations | Required for versioned schema evolution |
| PostgreSQL | Database | Relational schema with foreign keys is non-negotiable for this domain |
| Groq API | AI provider | Fast inference for hackathon demo; abstracted for future provider swap |
| Redis | Job queue | Optional for MVP; required for production-scale simulation jobs |

---

## 8. Architectural Principles

### 8.1 Separation of Concerns
Frontend must never contain risk logic. Backend owns all evaluation, simulation, financial calculations, and benchmarks.

### 8.2 AI Is Not the Source of Truth
AI generates proposals. Deterministic engines validate and measure them. No AI output is trusted without schema validation.

### 8.3 Reproducibility
Simulations must support deterministic seeds. Same seed + same config = same result, always.

### 8.4 Version Everything
Policies are versioned. Simulation runs reference a specific policy version. Benchmarks reference dataset version, policy version, and simulation run ID.

### 8.5 Auditability
Every AI-generated action is traceable. See [riskfire-security.md](./riskfire-security.md).

### 8.6 No Fake Data in Final Metrics
Development seed data is acceptable. Production metrics must be computed, never hard-coded.

### 8.7 Extensibility
Attack agents, policy rule types, and AI providers must be pluggable without rewriting core logic.

### 8.8 Testability
Core engines must be testable without frontend or AI API. All engines accept structured inputs and produce structured outputs.

### 8.9 Safety Boundary
All attack behavior must remain inside the synthetic simulation. No real payment credentials, no real payment execution.

---

## 9. Known Architectural Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI hallucination in attack plans | Pydantic schema validation + AttackValidator before any execution |
| AI inventing financial metrics | All financial data sourced from ExposureEngine, never AI |
| Simulation non-determinism | Mandatory seed parameter; all random generators seeded |
| Benchmark data leakage | Held-out set is isolated and never passed to AI patch generator |
| Large simulation performance | Pagination + WebSocket streaming; async workers for scale |
| Schema drift between policy versions | Alembic migrations with explicit version tracking |
| Provider lock-in | AIProvider abstraction isolates all provider-specific code |

---

*Document Version: 1.0.0*
*Created: 2026-08-20*
*Reference: riskfire-product-spec.md*
