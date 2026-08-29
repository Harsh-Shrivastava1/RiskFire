# RiskFire — Benchmarking Architecture

> Reference: [riskfire-product-spec.md](../product/riskfire-product-spec.md)
> Reference: [riskfire-simulation-architecture.md](./riskfire-simulation-architecture.md)
> Reference: [riskfire-data-model.md](./riskfire-data-model.md)

---

## 1. Benchmarking Philosophy

RiskFire's benchmark system exists to answer one core question:

> **"Did the policy patch actually make things better — and will that improvement hold on unseen attack scenarios?"**

This requires a proper train/validation/test split discipline, identical to ML model evaluation:
- The development split is used to generate and refine attacks and patches
- The validation split is used for intermediate evaluation during patch iteration
- The held-out test split evaluates final generalization — it must never be seen during patch generation

**No benchmark metric may be hard-coded or estimated.** Every metric is computed from actual simulation data at runtime.

---

## 2. Dataset Split Architecture

### 2.1 Split Ratios

| Split | Ratio | Purpose |
|---|---|---|
| Development | 70% | Attack generation, initial policy evaluation, patch development |
| Validation | 15% | Intermediate evaluation during patch iteration |
| Held-out Test | 15% | Final generalization evaluation — sealed until final benchmark |

### 2.2 Split Assignment

Each transaction in the simulation is assigned a `dataset_split` at generation time:

```python
def assign_dataset_split(rng: random.Random) -> str:
    """
    Assigns dataset split deterministically based on seeded RNG.
    Must be called with the simulation's seeded RNG.
    """
    roll = rng.random()
    if roll < 0.70:
        return "development"
    elif roll < 0.85:
        return "validation"
    else:
        return "held_out"
```

Split assignment is:
- **Deterministic** — same seed produces same split assignments
- **Independent per transaction** — not by scenario, not by agent
- **Stored** — `transactions.dataset_split` records the assignment permanently

### 2.3 Held-out Set Isolation Enforcement

The `BenchmarkEngine` enforces held-out isolation in code, not by convention:

```python
class BenchmarkEngine:
    def compute_final_benchmark(
        self,
        simulation_id: UUID,
        policy_version_id: UUID,
        split: DatasetSplit,
    ) -> BenchmarkResults:
        if split == DatasetSplit.HELD_OUT:
            # Verify that no patch was generated using held-out data
            self._assert_no_patch_trained_on_held_out(simulation_id)
        
        transactions = self._load_transactions(
            simulation_id=simulation_id,
            dataset_split=split,
        )
        # ... compute metrics from transactions only
```

The `_assert_no_patch_trained_on_held_out` method checks that no `ai_generations` record with `module = 'patch_generator'` used held-out data as input context for this simulation.

---

## 3. Metrics Definitions

All metrics are computed deterministically by `BenchmarkEngine`. They are never estimated, rounded up, or set by AI.

### 3.1 Classification Metrics

These metrics treat the risk decision as a binary classifier:
- **True Positive (TP):** Adversarial transaction correctly identified (BLOCKED or FLAGGED)
- **True Negative (TN):** Legitimate transaction correctly allowed (ALLOWED)
- **False Positive (FP):** Legitimate transaction incorrectly blocked (BLOCKED or FLAGGED)
- **False Negative (FN):** Adversarial transaction missed (ALLOWED)

```
Precision = TP / (TP + FP)
```
Of all transactions the policy blocked/flagged, what fraction were actually adversarial?
High precision = few false alarms.

```
Recall = TP / (TP + FN)
```
Of all adversarial transactions, what fraction did the policy catch?
High recall = few bypasses.

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```
Harmonic mean — penalizes extreme imbalances between precision and recall.

```
False Positive Rate (FPR) = FP / (FP + TN)
```
Of all legitimate transactions, what fraction were incorrectly blocked?
Low FPR = low customer friction.

### 3.2 Adversarial Metrics

```
Attack Success Rate = Successful Bypasses / Total Attack Attempts
```
What fraction of adversarial transactions bypassed all policies?

```
Successful Bypasses = Count of adversarial transactions with outcome = ALLOWED
```
Absolute count — relevant for exposure calculation.

### 3.3 Financial Metrics

```
Simulated Exposure = Successful Bypasses × Average Attack Transaction Amount
```
Gross synthetic exposure. **Always labeled as simulated estimate in the UI.**

```
Exposure Reduction = Simulated Exposure (BEFORE) - Simulated Exposure (AFTER)
```
Computed only when BEFORE and AFTER results are both available.

### 3.4 Operational Metrics

```
Customer Friction Score = FPR
```
Used as a proxy for customer friction caused by false blocks. May be refined with weighted scoring in future.

```
Policy Coverage = 1 - Attack Success Rate
```
What fraction of attack attempts are detected.

```
Policy Improvement = Delta(Recall) - Delta(FPR)
```
Net improvement after patch: gain in recall minus increase in false positive rate. A positive value indicates genuine improvement.

```
Simulation Throughput = Total Transactions / Simulation Duration (seconds)
```
Engine performance metric. Not a risk metric.

---

## 4. Benchmark Engine Architecture

### 4.1 Engine Location

`backend/app/engines/benchmark/`

```
benchmark/
+-- engine.py           # BenchmarkEngine class
+-- metrics.py          # All metric calculation functions (pure functions)
+-- comparator.py       # BEFORE vs AFTER comparison logic
+-- schemas.py          # BenchmarkResults, PatchComparison Pydantic schemas
+-- isolation.py        # Held-out set isolation enforcement
```

### 4.2 BenchmarkResults Schema

```python
class BenchmarkResults(BaseModel):
    benchmark_run_id: UUID
    simulation_id: UUID
    policy_version_id: str
    dataset_split: str
    
    # Raw counts
    total_transactions: int
    total_adversarial: int
    total_legitimate: int
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int
    
    # Classification metrics
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    
    # Adversarial metrics
    attack_success_rate: float
    successful_bypasses: int
    
    # Financial metrics
    simulated_exposure: Decimal
    exposure_reduction: Decimal | None  # None if no baseline to compare against
    
    # Operational metrics
    customer_friction_score: float
    policy_coverage: float
    policy_improvement: float | None    # None if no baseline
    simulation_throughput: float
    
    computed_at: datetime
```

### 4.3 PatchComparison Schema

```python
class PatchComparison(BaseModel):
    patch_id: UUID
    original_simulation_id: UUID
    replay_simulation_id: UUID
    
    before: BenchmarkResults
    after: BenchmarkResults
    
    # Computed deltas
    delta_precision: float
    delta_recall: float
    delta_f1: float
    delta_fpr: float
    delta_attack_success_rate: float
    delta_bypasses: int
    delta_exposure: Decimal
    
    # Summary assessment
    net_improvement: float          # policy_improvement score
    is_regression: bool             # True if FPR increased more than recall improved
    recommendation: str             # Text: "Approve" / "Review" / "Reject"
    computed_at: datetime
```

---

## 5. BEFORE vs AFTER Comparison Flow

```
[1] Original simulation run completes
    -> BenchmarkEngine.compute(simulation_id, policy_v1, split=DEVELOPMENT)
    -> Store as before_metrics in patch_simulations

[2] AI proposes patch
    -> patch_simulations record created with status = PENDING_SIMULATION

[3] User triggers patch simulation
    -> ReplayEngine.replay(original_simulation_id, patch_policy_v2)
    -> New simulation_run created with run_type = REPLAY

[4] Replay simulation completes
    -> BenchmarkEngine.compute(replay_simulation_id, policy_v2, split=DEVELOPMENT)
    -> Store as after_metrics in patch_simulations

[5] BenchmarkEngine.compare(before_metrics, after_metrics)
    -> PatchComparison computed

[6] Merchant views BEFORE vs AFTER table

[7] User requests final benchmark (held-out set)
    -> BenchmarkEngine.compute(replay_simulation_id, policy_v2, split=HELD_OUT)
    -> Isolation check passes (no patch trained on held-out data)
    -> Final benchmark_results stored

[8] Merchant approves or rejects patch
```

---

## 6. Benchmark Run States

| Status | Meaning |
|---|---|
| `PENDING` | Benchmark queued but not started |
| `RUNNING` | Actively computing metrics |
| `COMPLETED` | Results available |
| `FAILED` | Error during computation |

---

## 7. Anti-Gaming Constraints

To prevent benchmark inflation:

1. **Held-out data isolation** is enforced in code (not convention)
2. **Simulation seed is fixed** before attack generation — the seed cannot be changed after the fact to improve results
3. **All metric computation is server-side** — the frontend receives computed numbers, never computes them
4. **AI generation inputs** are stored with a SHA-256 hash to verify what data was seen by the AI
5. **Benchmark results are immutable** — once stored, `benchmark_results` records are not updated; a new benchmark run must be created

---

## 8. Reporting Metrics to the UI

The frontend receives `BenchmarkResults` and `PatchComparison` via API. It must:
- Display all metrics as provided by the backend
- Never calculate or transform metrics client-side
- Label all financial figures as "simulated estimates"
- Show `dataset_split` so the user knows which split the metrics apply to
- Display `computed_at` timestamp with every metrics view

---

## 9. Scripts

```
scripts/
+-- generate_dataset.py     # Generate a full simulation dataset for benchmarking
+-- run_benchmark.py        # Run benchmark against a specific simulation and policy version
```

**`run_benchmark.py` usage:**
```bash
python scripts/run_benchmark.py \
  --simulation-id <uuid> \
  --policy-version-id <uuid> \
  --split development

python scripts/run_benchmark.py \
  --simulation-id <uuid> \
  --policy-version-id <uuid> \
  --split held_out
```

---

*Document Version: 1.0.0*
*Created: 2026-08-20*
*Reference: riskfire-product-spec.md*
