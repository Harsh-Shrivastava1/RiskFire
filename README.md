# RiskFire

> **"Don't wait for fraudsters to find the weakness. Attack your own risk controls first."**

**RiskFire** is an AI-powered payment-risk red-team and adversarial simulation platform built for the Razorpay Hackathon — Track 02: AI Risk Manager.

---

## What Is RiskFire?

Traditional payment-risk systems ask: *"Is this transaction risky?"*

RiskFire asks: *"Can our risk controls actually survive an intelligent adversary?"*

RiskFire attacks a merchant's own payment-risk policies inside a **controlled synthetic environment**, discovers policy bypasses, estimates simulated financial exposure, explains why controls failed, proposes defensive patches, and replays the same attacks to prove whether the fixes work.

### Core Loop

```
ATTACK → DISCOVER → EXPLAIN → PATCH → REPLAY → PROVE
```

### Core Principle

> **"AI proposes. The simulator proves."**

AI generates intelligent attack strategies and policy suggestions. A deterministic simulation engine validates, executes, and measures everything. Metrics and financial figures are never sourced from AI.

---

## Quick Navigation

| Document | Purpose |
|---|---|
| [**Product Spec**](docs/product/riskfire-product-spec.md) | **Canonical source of truth** — what RiskFire is |
| [User Flows](docs/product/riskfire-user-flows.md) | All major user journeys |
| [System Architecture](docs/architecture/riskfire-system-architecture.md) | Full technical architecture |
| [AI Architecture](docs/architecture/riskfire-ai-architecture.md) | Groq, provider abstraction, AI modules |
| [Simulation Architecture](docs/architecture/riskfire-simulation-architecture.md) | Synthetic entities, engine, replay |
| [Data Model](docs/architecture/riskfire-data-model.md) | All database entities and relationships |
| [Benchmarking](docs/architecture/riskfire-benchmarking.md) | Dataset splits, metrics, BEFORE/AFTER |
| [Security](docs/architecture/riskfire-security.md) | Secrets, AI validation, authorization |
| [ADR-001: Tech Stack](docs/decisions/ADR-001-tech-stack.md) | Why this stack |
| [ADR-002: AI Abstraction](docs/decisions/ADR-002-ai-provider-abstraction.md) | Why provider abstraction |
| [ADR-003: Deterministic Sim](docs/decisions/ADR-003-deterministic-simulation.md) | Why deterministic seeds |

---

## What RiskFire Is and Is Not

### RiskFire IS:

- An **adversarial simulation and risk-policy testing platform**
- A **red-team system** that attacks the merchant's own policies
- A platform for discovering policy weaknesses **before** real attackers do
- A system where AI **proposes** and the simulator **proves**

### RiskFire IS NOT:

- A generic fraud detector
- A payment gateway
- A production payment-processing system
- A real fraud execution platform
- An LLM wrapper
- A system that presents simulated data as real fraud prevention

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, React Flow, Recharts |
| **Backend** | Python, FastAPI, Pydantic, SQLAlchemy, Alembic |
| **Database** | PostgreSQL |
| **AI Provider** | Groq API — model: `openai/gpt-oss-120b` (provider abstraction for future swap) |
| **Real-time** | WebSockets (FastAPI) |
| **Optional** | Redis (background simulation jobs) |

---

## Repository Structure

```
riskfire/
|
+-- README.md                          # This file
+-- .env.example                       # Required environment variables
+-- docker-compose.yml                 # Local development environment
+-- Makefile                           # Developer commands
|
+-- docs/
|   +-- product/
|   |   +-- riskfire-product-spec.md  # CANONICAL SOURCE OF TRUTH
|   |   +-- riskfire-user-flows.md
|   +-- architecture/
|   |   +-- riskfire-system-architecture.md
|   |   +-- riskfire-ai-architecture.md
|   |   +-- riskfire-simulation-architecture.md
|   |   +-- riskfire-data-model.md
|   |   +-- riskfire-benchmarking.md
|   |   +-- riskfire-security.md
|   +-- decisions/
|       +-- ADR-001-tech-stack.md
|       +-- ADR-002-ai-provider-abstraction.md
|       +-- ADR-003-deterministic-simulation.md
|
+-- frontend/                         # React + TypeScript + Vite app
+-- backend/                          # FastAPI Python app
+-- simulation/                       # Simulation generators, scenario configs
+-- datasets/                         # development / validation / held_out
+-- benchmarks/                       # Benchmark scenarios and reports
+-- scripts/                          # Setup, seeding, benchmark utilities
```

---

## Architecture Overview

```
                   FRONTEND (React)
                        |
                   HTTP / WebSocket
                        |
                   BACKEND (FastAPI)
                   /           \
            AI LAYER         API ROUTES
          (Groq/GPT)
                |
         Validated Structures
                |
         DETERMINISTIC CORE
    (Policy, Simulation, Risk, Benchmark)
                |
          PostgreSQL
```

### AI Responsibilities

AI is used in **exactly four places**:

1. **Attack Planning** — generates structured attack plans (JSON) from policy + constraints
2. **Vulnerability Explanation** — converts structured evidence into human-readable analysis
3. **Policy Patch Generation** — proposes candidate policy changes with trade-off reasoning
4. **Executive Report Generation** — synthesizes benchmark results into narrative reports

AI is **never** the source of truth for fraud labels, financial calculations, risk decisions, benchmark metrics, or policy approvals.

---

## Demo Scenario

**Merchant policy:**
```
3 transactions / account / 10 minutes
```

**RiskFire discovers:**
- 3+ synthetic accounts, each staying under the threshold
- All sharing the same synthetic device and address
- Coordinated timing

**Vulnerability:** Distributed Velocity Bypass

**AI proposes:**
```
Original:  3 transactions/account/10 minutes
Patched:   3 transactions/account/10 minutes
           + 8 transactions/device/10 minutes
           + address-cluster signal
```

**RiskFire simulates the patch, replays the attack, and shows BEFORE vs AFTER with dynamically calculated metrics.**

---

## Development Setup

> **Prerequisites:** Docker Desktop, Node.js 20+, Python 3.11+

### 1. Environment Variables

```bash
cp .env.example .env
# Fill in GROQ_API_KEY, JWT_SECRET, etc.
```

### 2. Start Database

```bash
docker-compose up -d postgres redis
```

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Full Stack (Docker)

```bash
docker-compose up
```

**Services:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## Important Rules for All Developers

1. **Read the product spec first.** [`docs/product/riskfire-product-spec.md`](docs/product/riskfire-product-spec.md) is the canonical source of truth. Any implementation that contradicts it must be flagged before coding.

2. **AI is not the source of truth.** No metric, financial figure, or risk decision comes from AI. These come from deterministic engines only.

3. **All simulations are synthetic.** No real payment credentials, no real customer PII, no real transactions. Ever.

4. **Metrics are never hard-coded.** The frontend displays what the backend computes. If you find a hard-coded metric in the frontend, it is a bug.

5. **Policies are versioned.** Never mutate a policy version record. Create a new version.

6. **Simulations are deterministic.** Every simulation stores its seed. The same seed + same config = same result.

7. **AI outputs are validated.** Every AI response passes Pydantic schema validation before any action is taken. A failed validation rejects the output completely.

8. **Secrets live in environment variables.** No secrets in source code, comments, or logs.

9. **Financial figures are labeled as simulated.** The UI must display a disclaimer on all exposure figures.

10. **The merchant approves all patches.** No AI output auto-applies to policy.

---

## What Is Not Implemented Yet

This repository currently contains only the **documentation and canonical specification layer**.

The following are intentionally **not yet implemented**:

- Frontend application (React/Vite)
- Backend application (FastAPI)
- Database models and migrations (SQLAlchemy/Alembic)
- Simulation engine
- Policy engine
- Risk evaluation engine
- Vulnerability engine
- Financial exposure engine
- Attack graph engine
- Benchmark engine
- AI modules (attack planner, explainer, patch generator, report generator)
- Docker Compose configuration
- WebSocket implementation

Implementation begins in the next phase, using these documents as the specification.

---

## Hackathon Context

**Track:** Razorpay Hackathon — Track 02: AI Risk Manager  
**Prototype scope:** Controlled synthetic environment — not a production fraud system  
**Transparency:** All financial figures are simulated estimates. RiskFire does not claim real fraud prevention accuracy or access to Razorpay production systems.

---

*RiskFire — "AI proposes. The simulator proves."*
