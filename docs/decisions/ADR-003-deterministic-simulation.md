# ADR-003: Deterministic Simulation Engine

**Status:** Accepted  
**Date:** 2026-08-20

---

## Context

RiskFire needs reproducible attack simulations for:
- Debugging specific vulnerability patterns
- BEFORE/AFTER comparison (replay must use identical scenarios)
- Benchmark validity (same scenarios, different policy versions)
- CI regression testing

---

## Decision

All simulation RNGs are seeded from a single `simulation_seed` integer. If no seed is provided by the user, one is generated randomly and stored. The same seed + same configuration always produces identical results.

The `SimulationContext` object holds the seeded `random.Random` instance. All entity generators and event sequencers receive the context object — never a bare `random` call.

```python
class SimulationContext:
    def __init__(self, seed: int, config: SimulationConfig):
        self.seed = seed
        self.config = config
        self.rng = random.Random(seed)  # All randomness flows through this
```

---

## Consequences

1. Simulations are reproducible — same seed = same result
2. All generators must accept and use `SimulationContext.rng` — no direct `random` module calls anywhere in the simulation layer
3. The seed must be stored before the simulation starts — it cannot be changed after the fact
4. Numpy's `np.random` must also be seeded if used: `np.random.seed(seed)`
5. UUID generation for synthetic entities must use the seeded RNG (via `uuid.UUID(int=rng.getrandbits(128))`), not `uuid4()` directly

---

*ADR Status: Accepted*
