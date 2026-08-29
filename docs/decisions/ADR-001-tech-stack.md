# ADR-001: Technology Stack Selection

**Status:** Accepted  
**Date:** 2026-08-20  
**Context:** RiskFire Hackathon — Track 02: AI Risk Manager

---

## Context

RiskFire requires a full-stack application with:
- Complex relational data (policies, simulation runs, entities, benchmarks)
- Real-time simulation streaming
- Interactive graph visualization
- AI integration with structured output validation
- Reproducible deterministic simulation

A technology stack must be selected for the hackathon prototype.

---

## Decision

### Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui

**Rationale:**
- React + TypeScript: Strong typing essential for complex simulation state, event streams, and metrics data
- Vite: Fastest HMR in the ecosystem — critical for hackathon iteration speed
- Tailwind CSS: Utility-first enables rapid consistent UI without CSS overhead
- shadcn/ui: Accessible, composable, Tailwind-native components that don't impose rigid design constraints
- React Flow: Purpose-built for interactive node-edge graphs (attack graph requirement)
- Recharts: React-native, composable charting library
- Zustand: Lightweight state management — sufficient for this domain without Redux complexity

### Backend: Python + FastAPI + Pydantic

**Rationale:**
- FastAPI: Async-native, Pydantic-first, excellent WebSocket support, automatic OpenAPI docs
- Pydantic: Critical for AI output schema validation — first-class validation at the boundary
- Python: Best ecosystem for data simulation, numpy/scipy if needed for statistical simulation

### Database: PostgreSQL + SQLAlchemy + Alembic

**Rationale:**
- PostgreSQL is the correct choice for RiskFire's strongly relational schema:
  - Foreign key constraints enforce data integrity across simulation entities
  - Window functions enable efficient velocity rule evaluation over time windows
  - JSONB columns support flexible policy rule parameters without schema explosion
  - Full ACID compliance required for audit log immutability
- MongoDB was explicitly rejected: RiskFire's entities (transactions -> risk_decisions -> vulnerabilities -> patches -> benchmark_results) are deeply relational and require join semantics
- SQLAlchemy: Mature, type-safe ORM with excellent relationship support
- Alembic: Required for versioned schema evolution — schema will evolve as features are added

### AI: Groq API + openai/gpt-oss-120b with Provider Abstraction

**Rationale:**
- Groq: Fast inference — important for a demo where waiting 30 seconds for an AI response would kill the demo flow
- Provider abstraction: Business logic must not be coupled to Groq specifically; the abstraction allows future provider changes (OpenAI, Anthropic, Google) without rewriting AI modules
- Structured output enforcement: All AI calls use Pydantic schema validation; raw LLM text never flows into business logic

### Optional: Redis

**Rationale:**
- For MVP, FastAPI `BackgroundTasks` may be sufficient for simulation jobs
- Redis + Celery is the recommended path if simulation jobs exceed 30 seconds
- Decision to use Redis is deferred until simulation performance is measured

---

## Rejected Alternatives

| Alternative | Reason for Rejection |
|---|---|
| MongoDB | Schema is strongly relational; FK constraints and joins are not optional |
| Django | FastAPI is faster to iterate and more natural with async/Pydantic |
| GraphQL | REST is sufficient; GraphQL adds complexity without clear benefit for this use case |
| Next.js | Vite + React Router is lighter; SSR is not needed for this SPA |
| Hardcoded AI provider | Provider lock-in is a technical risk; abstraction costs very little |

---

## Consequences

- SQLAlchemy models and Alembic migrations must be maintained for all schema changes
- All AI outputs must pass Pydantic validation — this is a constraint, not a convenience
- Provider abstraction means AI modules are slightly more verbose but are future-proof
- Redis is optional for MVP but should be planned into the architecture from the start

---

*ADR Status: Accepted*
*Reference: riskfire-product-spec.md*
