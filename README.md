# RiskFire

An adversarial payment-risk validation system that lets teams attack their own risk policies with deterministic synthetic transaction scenarios, identify policy weaknesses, quantify exposure, and move from detection to remediation.

Traditional fraud management systems operate reactively, asking: *"Is this incoming transaction risky?"*

RiskFire approaches risk management from the adversary's perspective, asking: *"Can an intelligent sequence of transactions bypass our current risk policies, where are the coverage blind spots, and how much financial exposure exists before attackers find them?"*

RiskFire executes controlled adversarial simulations against merchant risk policies inside a synthetic sandbox. It generates synthetic transaction traffic, evaluates rules deterministically, isolates policy bypasses, computes simulated exposure in Indian Rupees (INR), visualizes cross-entity collusion networks, generates defensive patch recommendations, and validates candidate policies against sealed held-out benchmark splits.

---

## Why RiskFire?

- **Proactive Defensibility:** Uncovers policy gaps, threshold evasion vectors, and cross-entity collusion before malicious actors exploit them in production.
- **Strict Separation of Concerns:** AI proposes attack vectors and policy patches, while deterministic mathematical engines evaluate transactions, calculate metrics, and enforce approval gates. AI is never the source of truth for financial numbers, confusion matrices, or policy deployment.
- **Full-Loop Governance:** Connects vulnerability discovery, root-cause explanation, candidate freezing with SHA-256 checksums, held-out regression testing, human-in-the-loop approval, and immutable audit logging.
- **Fair Policy Comparison:** Benchmarks baseline and candidate policies on identical transaction workloads with identical seeds and identical scenarios to ensure statistically rigorous before/after evaluation.

---

## Problem

Risk and fraud engineering teams face fundamental structural challenges when designing and deploying payment risk policies:

1. **Velocity and Threshold Evasion:** Attackers manipulate timing (e.g., pulsing transactions just outside a 10-minute sliding window) or amount ceilings (e.g., pricing orders just beneath a single-transaction flag threshold).
2. **Distributed Identity Fragmentation:** Coordinated syndicates distribute transaction volume across multiple synthetic accounts while sharing underlying hardware fingerprints, IP subnets, or delivery addresses.
3. **High Operational Friction from False Positives:** Aggressive risk rules often block legitimate customers, causing checkout abandonment, merchant friction, and revenue loss.
4. **Lack of Pre-Production Adversarial Testing:** Risk rules are typically tested against historical organic logs or deployed directly to production, making it difficult to measure how rules withstand active, adaptive evasion strategies.
5. **Slow, Opaque Remediation Loops:** When a rule failure occurs, triaging the failure mode, authoring defensive rules, and verifying that the update will not cause operational regressions takes days of manual analysis.

---

## Solution

RiskFire provides an automated red-team simulation lab and decision platform that enables risk engineers and merchant operations teams to:

1. **Select and Scope Policies:** Target specific merchant policies and policy versions for security evaluation without global metric leakage.
2. **Execute Red-Team Simulations:** Generate synthetic workloads combining legitimate customer traffic with structured adversarial attack patterns (velocity micro-pulsing, identity fragmentation, payment instrument rotation, coordinated syndicates).
3. **Detect Vulnerabilities with Empirical Evidence:** Isolate transactions that bypassed active rules, capturing affected accounts, devices, IP addresses, and missed signals.
4. **Quantify Financial Exposure:** Calculate empirical financial exposure in INR based solely on bypassed transaction amounts.
5. **Inspect Collusion Networks:** Render interactive entity-relationship graphs linking accounts, devices, IP addresses, physical delivery hubs, and masked payment instruments.
6. **Generate and Freeze Defensive Patches:** Propose concrete rule adjustments, freeze candidate configurations with immutable SHA-256 checksums, and evaluate candidate rules on sealed held-out benchmark datasets.
7. **Enforce Deterministic Approval Gates:** Evaluate candidate policies through a mathematical decision engine that weighs recall gains against false-positive rate (FPR) increases before human sign-off.
8. **Maintain an Immutable Audit Trail:** Record all actions, actor identities, timestamps, and configuration diffs across the entire remediation lifecycle.

---

## Core Idea

Instead of relying solely on reactive monitoring, RiskFire operates on a simple principle:

```
ATTACK -> DISCOVER -> EXPLAIN -> PATCH -> BENCHMARK -> DECIDE -> APPROVE -> AUDIT
```

### The RiskFire Authority Law

> **"AI proposes. Deterministic engines prove. Held-out data evaluates. Deterministic decision engine decides. Human approves. MongoDB persists."**

- **AI Layer:** Formulates structured attack plans, generates plain-English weakness explanations, proposes candidate policy rule modifications, and drafts narrative summaries.
- **Deterministic Core:** Executes rule evaluation, counts confusion matrix metrics (TP, FP, TN, FN), calculates precision, recall, F1, FPR, ASR, and simulated exposure, freezes candidate configurations with SHA-256 hashes, and renders deterministic decision recommendations.

---

## System Architecture

```
                                  USER / BROWSER
                                        |
                                        v
                            RiskFire Frontend (React SPA)
                [Dashboard | Policies | Attack Lab | Live Sim | Patches | Graph | Benchmarks]
                                        |
                                HTTP / REST API
                                        |
                                        v
                            FastAPI Backend Application
                     (/api/v1 - Auth, Dependency Injection, Routing)
                                        |
      +---------------------------------+---------------------------------+
      |                                 |                                 |
      v                                 v                                 v
[ AI Service Layer ]          [ Service Layer ]                 [ Repository Layer ]
  - Attack Planner              - PolicyService                   - Mongo Repositories
  - Explainer                   - SimulationService               - In-Memory Repositories
  - Patch Generator             - VulnerabilityService            - Dual-Mode Fallback
  - Report Generator            - PatchService
  - Groq / Mock Provider        - BenchmarkService
                                - GraphService
                                - AuditService
                                        |
                                        v
                         [ Deterministic Core Engines ]
  +-------------------------------------------------------------------------------+
  |  - Simulation Engine: Synthetic traffic generation & orchestration           |
  |  - Attack Engine: Velocity, Fragmentation, Rotation, Syndicate streams       |
  |  - Policy Engine: Rule evaluation, window counting, action precedence        |
  |  - Vulnerability Engine: Bypass detection, empirical metric calculation      |
  |  - Exposure Engine: Financial exposure quantification (INR)                  |
  |  - Graph Engine: Entity linkage & collusion topology synthesis               |
  |  - Replay Engine: Historical transaction stream re-evaluation                |
  |  - Benchmark Engine: 10 canonical scenarios, split isolation (70/15/15)      |
  |  - Candidate Freezer: SHA-256 checksumming & snapshot immutability           |
  |  - Patch Decision Engine: Mathematical delta evaluation (Delta Recall vs FPR) |
  |  - Risk Engine: Grounded composite risk posture scoring                      |
  +-------------------------------------------------------------------------------+
                                        |
                                        v
                         [ Data & Persistence Layer ]
                   MongoDB (Collections) / In-Memory Store
         (policies, simulations, events, vulnerabilities, patches,
          benchmarks, comparisons, datasets, incidents, audit_logs, reports)
```

---

## End-to-End Workflow

1. **Policy Selection:** The user selects an active merchant policy (e.g., `Core Merchant Velocity & High-Value Guard (pol-vel-01)`) containing active rules such as account velocity windows and transaction amount ceilings.
2. **Adversarial Scenario Planning:** An attack profile is selected (manual configuration or automated Fire Drill). Attack vectors include Identity Fragmentation, Velocity Micro-Pulsing, Payment Instrument Rotation, and Coordinated Syndicate Rings.
3. **Synthetic Workload Generation:** The simulation engine generates synthetic entities (accounts, device fingerprints, IP addresses, shipping addresses, payment cards) and produces mixed chronological traffic consisting of legitimate orders and adversarial sequences.
4. **Deterministic Policy Evaluation:** The policy engine processes transactions sequentially, tracking state over sliding time windows (e.g., 10-minute lookback) and applying rule precedence (`BLOCK` > `FLAG` > `ALLOW`).
5. **Vulnerability Discovery & Metric Computation:** Adversarial transactions evaluated as `ALLOWED` are flagged as policy bypasses. The vulnerability engine groups bypasses by attack vector, computes bypass rates, and isolates concrete transaction evidence.
6. **Exposure Calculation:** The exposure engine sums the total value of bypassed adversarial transactions to establish the simulated financial exposure in INR.
7. **Attack Graph Synthesis:** The graph engine correlates shared entities (e.g., 8 synthetic accounts sharing 1 device fingerprint and 1 physical delivery address) into an interactive node-edge graph.
8. **Defensive Patch Proposal:** The system generates candidate policy rules (e.g., adding a device velocity cap and an IP burst limiter).
9. **Candidate Freezing (SHA-256):** The candidate rule definition is hashed alongside the baseline policy metadata into an immutable SHA-256 checksum to ensure candidate lineage integrity.
10. **Sealed Held-Out Generalization Benchmarking:** The candidate policy is evaluated across the 10 canonical benchmark scenarios (`SCN-01` to `SCN-10`) on the sealed 15% `held_out` split of `ds-synthetic-v1`.
11. **Deterministic Decision Recommendation:** The patch decision engine calculates $\Delta\text{Recall}$, $\Delta\text{FPR}$, and $\Delta\text{Exposure}$, issuing a verifiable recommendation (`APPROVE_PATCH`, `REJECT_PATCH`, or `MANUAL_REVIEW_REQUIRED`).
12. **Human Approval & Version Promotion:** A risk officer reviews the trade-offs and clicks Approve. A new immutable policy version is created and activated.
13. **Audit Trail & Executive Reporting:** All evaluation metrics, candidate checksums, and approval notes are permanently logged to the audit repository and compiled into an executive risk report.

---

## Fire Drill

The **Fire Drill** is RiskFire's one-click automated stress test. It exercises the entire red-team simulation and remediation pipeline without manual configuration.

```
Target Policy Selection -> Deterministic Seed (49201) -> Attack Generation ->
Synthetic Traffic -> Policy Evaluation -> Bypass Detection -> Simulated Exposure ->
Live Waterfall Animation -> Results Navigation
```

### Fire Drill Execution Flow

1. **Trigger:** The user opens the Fire Drill modal from the Topbar or Dashboard and selects the target policy and difficulty level (`LOW`, `MEDIUM`, `HIGH`).
2. **API Request:** The frontend issues `POST /api/v1/simulations/fire-drill` with the target `policy_id`, seed `49201`, and difficulty setting.
3. **Simulation Execution:** The backend runs 3,200 synthetic transactions (2,400 legitimate, 800 adversarial across velocity, identity, and payment rotation agents) across a simulated 24-hour duration.
4. **Execution Animation:** The UI displays a multi-phase progress animation covering target policy loading, adversary agent initialization, synthetic transaction stream processing, rule evaluation, and vulnerability discovery.
5. **Live Simulation Monitor:** On completion, the UI automatically navigates to `/simulations/live?id={simulation_id}`, rendering live waterfall event feeds, bypass metrics, and direct links to Vulnerabilities, Attack Graphs, and Benchmark comparisons.

### Example Fire Drill Request

```http
POST /api/v1/simulations/fire-drill HTTP/1.1
Host: localhost:8000
Content-Type: application/json
X-Merchant-Id: m-dev-01

{
  "policy_id": "pol-vel-01",
  "seed": 49201,
  "difficulty": "HIGH"
}
```

---

## Phase 7 Intelligence and Governance

RiskFire includes end-to-end intelligence and governance features designed for enterprise risk operations:

- **Two-Tier Explanation Architecture:**
  - **Level 1 (Plain English):** High-level operational summaries designed for risk operators (e.g., *"Your policy caught 4 attacks, but this Identity Fragmenter pattern spreads activity across 8 accounts sharing 1 device. 6 attack attempts passed undetected, creating INR 270,000.00 in financial exposure."*).
  - **Level 2 (Technical Proof):** Expandable technical audit views detailing active rule triggers, un-triggered rules, exact transaction IDs, device fingerprints, and confusion matrix breakdowns.
- **Rule Trigger Coverage:** Identifies exactly which active rules fired during an attack and which rules were bypassed.
- **Entity Linkage Analysis:** Graph synthesis detects shared infrastructure across accounts, devices, IP subnets, physical addresses, and payment tokens.
- **Candidate Freezing Lineage:** Generates a 64-character SHA-256 checksum of candidate rules to ensure policy configurations cannot be tampered with between benchmarking and approval.
- **Deterministic Patch Decision Logic:** Evaluates candidate policies strictly against mathematical safety thresholds:
  - `APPROVE_PATCH`: $\Delta\text{Recall} \ge +10.0\%$ and $\Delta\text{FPR} \le +1.0\%$.
  - `REJECT_PATCH`: $\Delta\text{FPR} > +1.0\%$ (excessive customer friction), $\Delta\text{Recall} < -1.0\%$ (security regression), or net score $< 0$.
  - `MANUAL_REVIEW_REQUIRED`: Marginal changes within acceptable bounds requiring operator review.
- **AI Provider Abstraction with Deterministic Fallbacks:** The AI service uses Groq (`openai/gpt-oss-120b`) when configured. If the AI provider is offline or unreachable, the system executes deterministic rule-based generators so that core simulations, vulnerability discoveries, and benchmark comparisons continue to operate without disruption.

---

## 10 Canonical Benchmark Scenarios

RiskFire includes 10 standardized, deterministic benchmark attack scenarios:

| Scenario ID | Name | Attack Vector | Target Category | Description |
|---|---|---|---|---|
| `SCN-01` | Multi-Account Identity Fragmentation | `IDENTITY_FRAGMENTER` | Velocity | 8 synthetic accounts cycling below account velocity thresholds while sharing 1 device and 1 address. |
| `SCN-02` | Account Velocity Micro-Pulsing | `VELOCITY_ATTACKER` | Velocity | Transaction bursts spaced at 610s (10.1 min) to evade 10-minute sliding lookback windows. |
| `SCN-03` | Device Spoofing Velocity Burst | `IDENTITY_FRAGMENTER` | Identity | Rapid checkout sequence cycling synthetic device fingerprints to bypass device velocity caps. |
| `SCN-04` | Coordinated Syndicate Ring | `COORDINATED_CLUSTER` | Behavioral | Distributed syndicate sharing payment instruments across multiple distinct user profiles. |
| `SCN-05` | High-Value Amount Ceiling Bypass | `VELOCITY_ATTACKER` | Amount | Targeted transaction amounts positioned right below maximum single transaction thresholds. |
| `SCN-06` | Payment Instrument Rotation | `PAYMENT_ROTATOR` | Payment Instrument | Cycling synthetic card tokens across rapid checkout sessions to evade instrument-level limits. |
| `SCN-07` | Refund-to-Order Ratio Abuse | `REFUND_ABUSER` | Refunds | Order placement followed by high-frequency partial refund requests to exploit refund windows. |
| `SCN-08` | Promotion & Coupon Stacking | `PROMOTION_ABUSER` | Promotions | Exploiting new-user welcome discounts and first-order vouchers across synthetic identities. |
| `SCN-09` | Rapid Account-Switching Bursts | `IDENTITY_FRAGMENTER` | Behavioral | Sub-minute account login and transaction sequences originating from identical IP subnets. |
| `SCN-10` | Address Cluster Re-use | `COORDINATED_CLUSTER` | Identity | Distributed orders from disparate synthetic customer accounts delivering to a single physical hub address. |

---

## Key Features

- **Adversarial Payment Simulation:** Simulates sophisticated fraud evasion patterns across configurable difficulty tiers.
- **Deterministic Reproducibility:** Every simulation run stores its random seed (default `49201`), ensuring that identical configurations yield identical transaction sequences, metrics, and vulnerability discoveries.
- **Dynamic Policy Scoping:** Dashboard and vulnerability views are strictly scoped to individual policies, with explicit "NOT EVALUATED YET" states for un-tested policies.
- **Fair Policy Comparison:** Multi-policy comparison engine evaluates competing policies on identical transaction instances from the sealed held-out dataset split.
- **Interactive Collusion Graph:** Visualizes multi-entity fraud rings using React Flow with color-coded risk levels and animated adversarial edges.
- **Financial Exposure Quantification:** Converts policy bypasses into simulated monetary loss figures in INR with clear simulation disclaimers.
- **Candidate Snapshot Immutability:** Uses SHA-256 hashing to freeze candidate rule sets prior to generalization benchmarking.
- **Sealed Dataset Split Discipline:** Enforces a 70% Development / 15% Validation / 15% Held-Out data split to prevent policy overfitting.
- **Immutable Audit Trail:** Comprehensive logging of simulation runs, vulnerability discoveries, patch proposals, benchmark evaluations, and policy promotions.
- **Dual-Mode Persistence:** Operates with persistent MongoDB collections when available, or seamlessly in in-memory mode for zero-dependency local testing.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript | Type-safe single-page application |
| **Build & Tooling** | Vite 6 | Rapid hot-module replacement and production bundling |
| **Styling & Components** | Tailwind CSS + Radix UI / shadcn/ui | Clean, accessible, responsive user interface |
| **Data Visualization** | Recharts | Severity distribution, risk trends, and policy comparison charts |
| **Graph Visualization** | React Flow (`@xyflow/react`) | Interactive entity relationship and attack collusion topology |
| **State Management** | Zustand | Lightweight client-side UI and notification state |
| **Backend Framework** | FastAPI (Python 3.10+) | Asynchronous REST API with automatic OpenAPI documentation |
| **Data Validation** | Pydantic v2 | Strict schema validation at API boundaries and AI outputs |
| **Database & ODM** | MongoDB + PyMongo / Motor | Persistent document storage for 12 domain collections |
| **In-Memory Store** | Python In-Memory Repositories | Zero-dependency local development and fast unit testing |
| **AI Integration** | Groq API (`openai/gpt-oss-120b`) | High-speed LLM inference for planning, explanation, and patches |
| **Testing** | pytest + pytest-asyncio | Unit, integration, contract, and end-to-end workflow validation |

---

## Repository Structure

```
RiskFire/
|-- backend/
|   |-- app/
|   |   |-- ai/                           # AI provider abstraction, prompts, and modules
|   |   |   |-- modules/                  # attack_planner, explainer, patch_generator, report_generator
|   |   |   |-- providers/                # groq.py, mock.py
|   |   |   `-- factory.py                # AI provider factory with fail-fast validation
|   |   |-- api/v1/                       # REST API route handlers
|   |   |   |-- routes/                   # dashboard, policies, simulations, vulnerabilities, patches, etc.
|   |   |   |-- dependencies.py           # Dependency injection & service initialization
|   |   |   `-- router.py                 # Central API v1 router
|   |   |-- core/                         # Configuration, logging, security, exceptions
|   |   |-- database/                     # MongoDB connection & repository layer
|   |   |   `-- repositories/             # interfaces/, memory/, mongo/
|   |   |-- engines/                      # Core deterministic simulation & evaluation engines
|   |   |   |-- attacks/                  # Adversarial transaction stream generators
|   |   |   |-- benchmark/                # Batch runner, candidate freezer, scenarios
|   |   |   |-- decision/                 # Mathematical patch decision engine
|   |   |   |-- exposure/                 # Financial exposure calculator (INR)
|   |   |   |-- graph/                    # Entity relationship & collusion graph engine
|   |   |   |-- policy/                   # Deterministic sequential rule evaluator
|   |   |   |-- replay/                   # Historical stream replay engine
|   |   |   |-- risk/                     # Composite risk posture scoring
|   |   |   |-- simulation/               # Orchestrator for synthetic entity pool & traffic
|   |   |   `-- vulnerability/            # Policy bypass & weakness detection
|   |   |-- schemas/                      # Pydantic domain models & request/response schemas
|   |   |-- services/                     # Business logic coordinators
|   |   `-- main.py                       # FastAPI application entry point & CORS configuration
|   |-- scripts/                          # Seeding and dataset export utilities
|   `-- tests/                            # Comprehensive unit, integration, and contract tests
|-- frontend/
|   |-- src/
|   |   |-- app/                          # Application shell, router, and context providers
|   |   |-- components/                   # UI components (charts, graphs, layout, simulations)
|   |   |-- pages/                        # Dashboard, Policies, AttackLab, LiveSimulation, Patches, etc.
|   |   |-- services/                     # API repositories and HTTP client
|   |   |-- store/                        # Zustand stores (UI, notifications, policy builder)
|   |   `-- types/                        # TypeScript domain interfaces
|   |-- package.json                      # Frontend dependencies and scripts
|   `-- vite.config.ts                    # Vite build configuration
|-- datasets/                             # Seeded datasets (development, validation, held-out splits)
|-- benchmarks/                           # Benchmark report artifacts and canonical configs
|-- docs/                                 # Product specifications, system architecture, and ADRs
|-- scripts/                              # Top-level helper scripts
|-- .env.example                          # Environment variable configuration template
|-- Makefile                              # Common developer targets
`-- README.md                             # Canonical project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python:** v3.10, v3.11, v3.12, or v3.14
- **MongoDB (Optional):** A local or remote MongoDB instance. If no MongoDB instance is reachable, RiskFire automatically runs in in-memory repository mode for zero-configuration startup.

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/Harsh-Shrivastava1/RiskFire.git
cd RiskFire
```

---

### Step 2: Environment Configuration

Copy the example environment file to `.env` in the backend directory (or root):

```bash
cp backend/.env.example backend/.env
```

Key environment variables in `backend/.env`:

```ini
APP_ENV=development
DEBUG=true
API_V1_STR=/api/v1

# AI Configuration (groq | mock)
AI_ENABLED=true
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Persistence Mode (auto | mongo | memory)
# 'auto' connects to MongoDB if reachable; falls back to in-memory mode if offline
PERSISTENCE_MODE=auto
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=riskfire_db

# Simulation & Deterministic Defaults
DEFAULT_SIMULATION_SEED=49201
DEFAULT_SYNTHETIC_TRANSACTIONS=3200
```

*Note: If you do not have a Groq API key, set `AI_PROVIDER=mock` to run with deterministic offline AI responses.*

---

### Step 3: Start the Backend

Open a terminal and start the FastAPI server:

```bash
# Set PYTHONPATH to the repository root
# On Windows (PowerShell):
$env:PYTHONPATH="."
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# On Linux / macOS:
PYTHONPATH=. python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify backend health:
- Health endpoint: `http://localhost:8000/health`
- Interactive API Docs: `http://localhost:8000/docs`

---

### Step 4: Seed the Database (Optional)

To populate the database with default merchant policies, historical simulations, vulnerabilities, and benchmark runs:

```bash
# On Windows (PowerShell):
$env:PYTHONPATH="."
python -m scripts.seed_database

# On Linux / macOS:
PYTHONPATH=. python -m scripts.seed_database
```

---

### Step 5: Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will be available at: `http://localhost:5173`

---

## Running Tests and Validation

### Backend Automated Test Suite

Run the full pytest suite (78 tests covering unit engines, integration flows, API contracts, and persistence):

```bash
# On Windows (PowerShell):
$env:PYTHONPATH="."
pytest backend/tests/ -v

# On Linux / macOS:
PYTHONPATH=. pytest backend/tests/ -v
```

### Frontend Type Check and Build Verification

Validate TypeScript compilation and the production Vite bundle:

```bash
cd frontend
npm run build
```

Expected result: 0 TypeScript errors, clean bundle output in `frontend/dist/`.

### Deterministic Benchmark CLI

Execute headless batch benchmarks and verify seed reproducibility:

```bash
# On Windows (PowerShell):
$env:PYTHONPATH="."
python -m scripts.run_benchmark --seed 49201 --check-reproducibility

# On Linux / macOS:
PYTHONPATH=. python -m scripts.run_benchmark --seed 49201 --check-reproducibility
```

### Synthetic Dataset Export CLI

Export deterministic synthetic datasets with cryptographic SHA-256 manifests:

```bash
# On Windows (PowerShell):
$env:PYTHONPATH="."
python -m scripts.export_dataset --seed 49201 --legit 2400 --adv 800

# On Linux / macOS:
PYTHONPATH=. python -m scripts.export_dataset --seed 49201 --legit 2400 --adv 800
```

---

## Evaluator Walkthrough / Demo Flow

Follow this 5-minute walkthrough to experience the complete RiskFire workflow:

1. **Launch the Application:** Open `http://localhost:5173` in your browser.
2. **Review the Dashboard (`/dashboard`):** Notice the policy-scoping header displaying `Core Merchant Velocity & High-Value Guard (pol-vel-01)`, Seed `49201`, Dataset `ds-synthetic-v1`, and the dynamically computed Risk Posture Score. Expand the Level 2 accordion to inspect dataset split proportions and confusion matrix figures.
3. **Execute a Fire Drill:** Click the **Fire Drill** button in the Topbar. Keep the default target policy and difficulty, and click **Launch Fire Drill**. Observe the multi-stage execution animation.
4. **Inspect the Live Simulation (`/simulations/live`):** Review the transaction waterfall feed showing real-time `ALLOWED`, `FLAGGED`, and `BLOCKED` outcomes, detection recall percentage, and bypass counts.
5. **Analyze Weaknesses (`/vulnerabilities`):** Open the Vulnerabilities page. Read the Level 1 plain-English summary explaining how adversarial traffic evaded active rules. Expand Level 2 to inspect specific transaction evidence, affected device IDs, and untriggered rules.
6. **Examine the Attack Graph (`/attack-graph`):** Navigate to the Attack Graph to explore the interactive visual topology showing shared devices, IP clusters, delivery hubs, and adversarial transaction paths in red.
7. **Evaluate and Approve a Patch (`/patches`):** Click **Generate Patch** on an active vulnerability. Review the proposed rule modification diff. Observe the frozen candidate SHA-256 checksum and the before-vs-after metrics on the sealed held-out benchmark split. Review the deterministic decision recommendation (`APPROVE_PATCH`). Click **Approve & Promote Policy**.
8. **Verify Side-by-Side Policy Comparison (`/policies/compare`):** Select Baseline Policy (v1.0.0) on the left and Patched Policy (v1.1.0) on the right. Observe the `Fair Comparison: VERIFIED` badge and the scenario-by-scenario breakdown across all 10 canonical benchmark tests.
9. **Review the Audit Log (`/audit-log`):** Verify that every action (`FIRE_DRILL_COMPLETED`, `AI_VULNERABILITY_EXPLAINED`, `CANDIDATE_FROZEN`, `HELD_OUT_BENCHMARK_EVALUATED`, `POLICY_PATCH_APPROVED`) is recorded with timestamps, actor IDs, and immutable metadata.

---

## Security, Safety, and Trust Principles

- **100% Synthetic Sandbox Data:** All customer names, bank accounts, card numbers, device fingerprints, IP addresses, and transaction amounts are entirely synthetic. RiskFire never accesses, stores, or processes real consumer PII or live payment credentials.
- **Simulated Financial Exposure Disclaimers:** All monetary loss figures represent simulated synthetic calculations within a bounded test environment and are clearly labeled as simulated estimates.
- **AI Trust Boundary Validation:** All AI completions must strictly conform to Pydantic domain schemas. AI outputs that fail validation or propose out-of-bounds parameters are rejected.
- **Deterministic Authority:** AI cannot compute financial exposure, alter confusion matrix counts, or deploy policies autonomously. All calculations and decision gates are executed by deterministic code.
- **Immutable Policy Lineage:** Policy versions are immutable. Approving a patch creates a new version while preserving the full historical audit trail.

---

## Engineering Design Decisions

- **Deterministic Seeds over Stochastic Execution:** Using a deterministic pseudo-random number generator with explicit seeds ensures that simulations are 100% bit-for-bit reproducible, allowing engineers to reliably verify that a patch resolved a specific bypass.
- **Dual-Mode Repository Architecture:** The data layer supports both persistent MongoDB storage and zero-dependency in-memory repositories, enabling instant local development and CI test execution without requiring an active database server.
- **Fair Multi-Policy Comparison Discipline:** When comparing two policies, RiskFire enforces that both policies run against the exact same synthetic transaction instances, identical seeds, and identical scenario definitions on the sealed held-out split.
- **Decoupled AI Engine:** AI is treated as an advisory subsystem. If the LLM provider experiences timeouts or outages, fallback deterministic engines ensure that simulations, benchmarks, and vulnerability discovery continue to operate seamlessly.

---

## Limitations

- **Synthetic Environment:** RiskFire is designed as a red-team simulation lab and policy testing workbench. It is not an in-line payment gateway or real-time transaction processing switch.
- **Rule Engine Primitives:** The built-in policy engine supports sliding-window velocity (account, device, IP), amount ceilings, device linkage constraints, and rule action precedence. Complex custom scripting languages are not currently evaluated.
- **Development Authentication:** The prototype uses simulated user contexts via HTTP request headers (`X-Merchant-Id`, `X-User-Role`) suitable for sandbox evaluation.

---

## Future Roadmap

- **Production Gateway Connectors:** Ingest sanitized, anonymized payment traffic logs from gateways (such as Razorpay webhooks) to generate realistic baseline transaction distributions.
- **Automated Hyperparameter Policy Tuning:** Multi-objective genetic optimization to automatically discover optimal rule thresholds that maximize recall while keeping FPR beneath a target merchant ceiling.
- **Distributed Simulation Workers:** Celery / Redis queue integration for scaling simulations to millions of concurrent synthetic transactions.

---

## Razorpay Buildathon — AI Risk Manager Track

### What We Built
RiskFire is an automated adversarial simulation platform and risk governance system designed specifically for the AI Risk Manager track. It enables merchants to proactively stress-test payment risk policies against sophisticated adversarial evasion strategies before deploying rules to production.

### Relevance to Payment Risk
Payment risk engineering involves a continuous cat-and-mouse dynamic between merchants and fraudsters. Static rules frequently suffer from threshold evasion, distributed identity fragmentation, or excessive false alarms that damage checkout conversion. RiskFire gives risk teams an automated red-team environment to discover rule blind spots, quantify financial exposure, and mathematically verify defensive fixes on held-out data.

### Demonstrable Depth
- Working full-stack application (FastAPI backend + React/Vite frontend).
- 10 canonical benchmark scenarios covering velocity evasion, identity fragmentation, card rotation, and syndicate rings.
- Dynamic policy scoping and side-by-side fair policy comparison engine.
- 78 automated backend tests covering persistence, AI boundaries, deterministic engines, and full-loop decision workflows.
- Zero fake metrics or hardcoded UI fallbacks.

---

## Developer

- **Name:** Harsh Shrivastava
- **Track:** Track 02 — AI Risk Manager
- **Hackathon:** Razorpay Buildathon / AI Builder Evaluation

---

## License

This project is developed as part of the Razorpay Buildathon. All synthetic datasets, scenario definitions, and simulation engines are provided for evaluation and research purposes.
