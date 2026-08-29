# ADR-002: AI Provider Abstraction

**Status:** Accepted  
**Date:** 2026-08-20

---

## Context

RiskFire requires AI for four functions: attack planning, vulnerability explanation, patch generation, and report generation. The MVP uses Groq API with model `openai/gpt-oss-120b`.

The question is whether to couple the application directly to Groq or implement an abstraction.

---

## Decision

Implement an `AIProvider` abstract base class. All AI business logic interacts only with the abstract interface. `GroqProvider` is the concrete implementation for the MVP.

```
AIProvider (abstract)
    |
    +-- GroqProvider (MVP)
    +-- OpenAIProvider (future)
    +-- AnthropicProvider (future)
```

Provider selection is controlled by `AI_PROVIDER` environment variable.

---

## Rationale

1. **Provider risk:** Groq may have API limits, outages, or model availability changes during the hackathon. Abstraction allows a quick switch to OpenAI/Anthropic if needed.
2. **Model evolution:** `openai/gpt-oss-120b` may be updated or replaced. The abstraction isolates this change.
3. **Low cost:** The abstraction adds ~50 lines of code but prevents significant rewriting later.
4. **Testability:** `AIProvider` can be mocked in unit tests without making real API calls.

---

## Consequences

- Each new provider requires implementing the `AIProvider` interface
- All AI modules must accept an `AIProvider` instance (dependency injection) rather than instantiating a specific provider
- Configuration must specify which provider to use (`AI_PROVIDER=groq`)

---

*ADR Status: Accepted*
