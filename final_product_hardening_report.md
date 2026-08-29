# RISKFIRE — PRE-PHASE 7 FINAL PRODUCT HARDENING & SYSTEM VERIFICATION REPORT

**Phase Status:** Pre-Phase 7 Stabilization & Hardening COMPLETED (Phase 7 is NOT started)  
**System Architecture:** Deterministic Sandbox Lab for Payment Risk & Fraud Intelligence  
**Test Suite Status:** 61 PASSED, 6 SKIPPED (MongoDB integration tests skip when local daemon is offline), 0 FAILED  
**Frontend Build:** `tsc && vite build` — 100% CLEAN (0 TypeScript / Rollup errors)  
**Browser Visual Verification:** Verified via autonomous subagent with zero console exceptions  

---

## 1. Executive Summary & Architectural Compliance

RiskFire is a **synthetic payment risk and fraud security lab**. All entities, cards, devices, merchant transactions, and attacks evaluated within the system are 100% synthetic. The core system architecture adheres strictly to the foundational system principle:

> **AI proposes. Deterministic engines prove. Held-out data evaluates. Deterministic decision engine decides. Human approves. MongoDB persists.**

In this pre-Phase 7 hardening phase, we completed a repository-wide stabilization, dynamic policy scoping pass, fair multi-policy comparison engine implementation, runtime error resolution, and Level 1 (plain English) / Level 2 (technical proof) UX alignment.

---

## 2. Policy Scoping & Lineage Architecture

### Dynamic Context Scoping
The Dashboard and Vulnerability views are now strictly scoped to an individual policy (`policy_id` / `policy_version_id`), eliminating all ambiguous global aggregations:
- **`GET /api/v1/dashboard/summary?policy_id={id}`**: Dynamically extracts the target policy, filters red-team simulations matching that policy's ID and version, filters active vulnerabilities for that policy, and computes the canonical risk posture score.
- **Policy Scoping Header**: Displays Policy Name, Policy ID, Version Number, Evaluation ID, Dataset ID (`ds-synthetic-v1`), Seed (`49201`), and Last Tested timestamp.
- **Interactive Policy Selector**: Allows seamless switching between merchant policies from any dashboard or policy view.

---

## 3. Unevaluated Policy States (No Fake Numbers)

When a newly authored or draft policy has not yet been subjected to adversarial testing:
- **`is_evaluated: false`** is explicitly returned by the backend.
- The UI renders an **"NOT EVALUATED YET"** card stating: *"This policy has not been tested against the adversary lab."*
- Untested metrics are displayed with neutral dashes (`—`), never showing artificial zeros masquerading as 100% defense or fake fallback numbers (`?? 87`, `?? 406000`).
- Provides a direct one-click **`[Run Security Test]`** CTA that opens the Attack Lab pre-configured for that policy.

---

## 4. Fair Deterministic Multi-Policy Comparison Engine

### Strict Fairness Discipline
To compare two policies (e.g. Policy A vs Policy B), RiskFire enforces the **Fair Comparison Invariant**:
1. **Identical Workload:** Both policies evaluate the exact same synthetic transaction instances.
2. **Identical Seed:** Seed `49201` is strictly preserved across both runs.
3. **Identical Dataset & Split:** Evaluated strictly on the sealed 15% `held_out` split of `ds-synthetic-v1`.
4. **Identical Scenarios:** Evaluated against all 10 canonical benchmark scenarios (`SCN-01` to `SCN-10`).
5. **Zero AI Authority:** The winner is computed mathematically by the deterministic regression delta engine. AI has zero influence on the recommendation.

### Deterministic Recommendation Formula
$$\Delta \text{Recall} = \text{Recall}_B - \text{Recall}_A$$
$$\Delta \text{FPR} = \text{FPR}_B - \text{FPR}_A$$
$$\Delta \text{Exposure} = \text{Exposure}_A - \text{Exposure}_B$$

- **`RECOMMEND_POLICY_B`**: $\Delta \text{Recall} \ge +5.0\%$ AND $\Delta \text{FPR} \le +1.0\%$ AND $\Delta \text{Exposure} \ge 0$.
- **`RECOMMEND_POLICY_A`**: $\Delta \text{Recall} \le -5.0\%$ AND $\Delta \text{FPR} \ge -1.0\%$ AND $\Delta \text{Exposure} \le 0$.
- **`NO_CLEAR_WINNER`**: $|\Delta \text{Recall}| < 2.0\%$ AND $|\Delta \text{FPR}| < 0.5\%$.
- **`MANUAL_REVIEW_REQUIRED`**: When security gain triggers an unacceptable increase in customer friction.

---

## 5. Grounded Risk Posture Score

The **Risk Posture Score** ($0 \le S \le 100$) is computed dynamically by `backend/app/engines/risk/risk_engine.py`:
$$S = \text{round}\left(0.40 \cdot \text{Recall} + 0.20 \cdot \max(0, 100 - 10 \cdot \text{FPR}) + 0.25 \cdot \max(0, 100 - \text{ASR}) + 0.15 \cdot \text{Coverage}\right)$$
- If no simulation history exists for a policy, $S = \text{null}$ (`None`), cleanly signalling an unevaluated state.

---

## 6. Resolved Runtime Errors & Contract Repairs

| Component / Route | Error Observed | Root Cause | Resolution |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/simulations/fire-drill` | `404 Not Found` | Route was mapped to `POST /run` with a query flag. | Added direct dedicated route `POST /simulations/fire-drill` accepting `FireDrillRequest`. |
| `POST /api/v1/simulations/run` | `405 Method Not Allowed` | Frontend repository used `POST /simulations` while backend expected `POST /simulations/run`. | Standardized routes to support both `POST /simulations` and `POST /simulations/run`. |
| `ApiDashboardRepository` | Static Fallbacks | Hardcoded numbers (`?? 87`, `?? 406000`) masked missing data. | Removed all static fallbacks; wired to live policy-scoped API responses. |
| `BatchBenchmarkRunner` | Missing Attribute | `_generate_scenario_transactions` not implemented on class. | Implemented `_generate_scenario_transactions` with deterministic split hashing. |
| `PolicyResponse` Rules Access | `AttributeError` | `PolicyResponse` stores rules inside `versions` list. | Implemented version lookup to extract active rules safely. |
| `PERSISTENCE_MODE` | Inconsistent Downgrades | MongoDB failure silently downgraded without fail-fast configuration. | Added `PERSISTENCE_MODE: str = "auto"` ("mongo" \| "memory" \| "auto") with strict validation. |

---

## 7. Two-Tier UX: Plain English (Level 1) & Advanced Proof (Level 2)

All primary screens in RiskFire now feature intuitive, plain-English terminology backed by expandable technical details:

| Technical Concept | Level 1 (Plain English) | Level 2 (Advanced Proof) |
| :--- | :--- | :--- |
| **Recall / Coverage** | "Attack detection rate" | Held-out recall %, True Positives / Total Adversarial |
| **Successful Bypasses** | "Attacks that got through" | False Negatives count, Evasion vectors |
| **False Positive Rate** | "False alarms" | Customer friction rate %, Innocent transactions blocked |
| **Simulated Exposure** | "Potential loss exposed" | Gross synthetic INR value bypassed |
| **Candidate Policy** | "Candidate Rules" | Checksum hash, Immutability freeze status |

---

## 8. Verification Results

### 1. Automated Integration & Unit Tests
```
======================= 61 passed, 6 skipped in 39.69s ========================
```
- Integration test suite `backend/tests/integration/test_policy_scoping_and_comparison.py`: **100% PASSED**.
- Contract validation test suite `backend/tests/integration/test_api_contracts.py`: **100% PASSED**.
- Route integration test suite `backend/tests/integration/test_api_routes.py`: **100% PASSED**.
- End-to-end decision workflow `backend/tests/integration/test_phase6_decision_workflow.py`: **100% PASSED**.

### 2. Frontend Build
```
> riskfire-frontend@0.1.0 build
> tsc && vite build

✓ 2508 modules transformed.
dist/index.html                   1.11 kB
dist/assets/index-zqo0V2_l.css   69.82 kB
dist/assets/index-DS7fsM21.js 1,248.23 kB
✓ built in 20.68s
```

### 3. Live Browser Verification
The autonomous browser subagent verified:
- **Dashboard (`/dashboard`)**: Policy scoping banner displaying `Core Merchant Velocity & High-Value Guard (pol-vel-01)`, `ds-synthetic-v1`, seed `49201`, status `TESTED`.
- **Level 2 Accordion**: Expands seamlessly with candidate freeze state, split details, and deterministic seed.
- **Policies Page (`/policies`)**: Policy cards displaying rich evaluation metadata, `[View Results]`, `[Compare]`, `[Test Policy]`.
- **Policy Comparison (`/policies/compare`)**: Side-by-side policy selectors, `Fair Comparison: VERIFIED` badge, deterministic recommendation card, and interactive 10-Scenario breakdown table.

---

## 9. Conclusion

The Pre-Phase 7 Stabilization & Hardening phase is **100% complete and fully verified**.  
All API contracts, policy scoping rules, deterministic comparison mechanics, fail-fast persistence checks, and plain-English UI layers operate with zero runtime errors.  
**Phase 7 has not been started**, preserving repository boundaries and leaving the system in a pristine, hardened state ready for subsequent phases.
