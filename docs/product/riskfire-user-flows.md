# RiskFire — User Flows

> Reference: [riskfire-product-spec.md](./riskfire-product-spec.md)

This document describes the major user journeys in RiskFire. Each flow maps to the core product loop: **ATTACK → DISCOVER → EXPLAIN → PATCH → REPLAY → PROVE**.

---

## 1. User Roles

| Role | Description |
|---|---|
| **Merchant Admin** | Full access — can configure policies, run simulations, approve patches |
| **Risk Analyst** | Read/write on simulations and vulnerabilities; cannot approve policy changes |
| **Read-Only Viewer** | Read-only access to all reports and dashboards |

---

## 2. Flow 1: First-Time Setup

**Goal:** A merchant signs up and configures their first risk policy.

```
[1] User registers / logs in
    |
    v
[2] Onboarding: Creates merchant profile
    |
    v
[3] Navigates to Risk Policies
    |
    v
[4] Opens Policy Builder
    |
    v
[5] Selects policy category (e.g., VELOCITY)
    |
    v
[6] Configures rule parameters
    (e.g., 3 transactions / account / 10 minutes)
    |
    v
[7] Saves and activates policy (version 1.0)
    |
    v
[8] Returns to Risk Command Center
    (Dashboard shows: 0 simulations, 0 bypasses, 0 exposure)
```

**Entry point:** `/login` or `/onboarding`  
**Exit point:** Risk Command Center dashboard

---

## 3. Flow 2: Running a Red-Team Simulation (Attack Lab)

**Goal:** Merchant runs their first adversarial simulation against their policy.

```
[1] User navigates to Attack Lab
    |
    v
[2] Selects active policy to target
    |
    v
[3] Selects attack agent types
    (e.g., Velocity Attacker, Identity Fragmenter)
    |
    v
[4] Configures simulation parameters
    - Simulation size (e.g., 500 synthetic transactions)
    - Attacker difficulty (Low / Medium / High)
    - Simulation seed (optional; random if blank)
    |
    v
[5] Clicks "Start Red-Team Run"
    |
    v
[6] Backend: AI Attack Planner generates structured attack plan
    |
    v
[7] Backend: Attack Validator validates the plan
    |
    v
[8] Backend: Simulation Engine begins execution
    |
    v
[9] Frontend: Live Simulation view streams progress (WebSocket)
    - Synthetic entities being created
    - Attack steps being executed
    - Transactions being evaluated
    - Bypasses being detected in real time
    |
    v
[10] Simulation completes
    |
    v
[11] User is redirected to Simulation Results
```

**Entry point:** Attack Lab (`/attack-lab`)  
**Exit point:** Simulation results view

---

## 4. Flow 3: Reviewing Simulation Results and Vulnerabilities

**Goal:** Merchant reviews what the red-team discovered.

```
[1] User arrives at Simulation Results page
    |
    v
[2] Summary panel shows:
    - Total attacks executed
    - Total bypasses detected
    - Simulated exposure (labeled as synthetic)
    - Affected policy rules
    |
    v
[3] User views Vulnerabilities list
    - Each vulnerability shows: type, severity, affected policy, evidence count
    |
    v
[4] User clicks into a specific vulnerability
    |
    v
[5] Vulnerability Detail view shows:
    - Attack type and objective
    - Number of successful bypass transactions
    - Evidence trail (specific synthetic transactions, accounts, devices, addresses)
    - AI explanation (why the policy failed)
    |
    v
[6] User clicks "View Attack Graph"
    |
    v
[7] Attack Graph view (React Flow):
    - Shows entity relationships: Account <-> Device <-> Address <-> Card
    - Highlights the shared infrastructure used in the attack
```

**Entry point:** Simulation results (`/simulations/{id}`)  
**Exit point:** Vulnerability detail or Attack Graph

---

## 5. Flow 4: Reviewing the Attack Graph

**Goal:** Merchant understands how apparently unrelated accounts are connected.

```
[1] User opens Attack Graph
    |
    v
[2] Graph renders: accounts, devices, IPs, addresses, payment instruments as nodes
    |
    v
[3] Edges show shared relationships
    (e.g., Account A and Account B both connected to Device X)
    |
    v
[4] User can filter graph by:
    - Entity type
    - Attack scenario
    - Vulnerability
    |
    v
[5] User can click any node to see entity details
    |
    v
[6] User understands the coordinated structure of the attack
```

**Entry point:** Attack Graph (`/attack-graph`)  
**Exit point:** Vulnerability detail or Policy Patches

---

## 6. Flow 5: Reviewing and Approving an AI Policy Patch

**Goal:** Merchant reviews an AI-proposed patch and decides whether to accept it for simulation.

```
[1] User navigates to Policy Patches
    |
    v
[2] Sees list of AI-proposed patches (status: PENDING)
    |
    v
[3] Opens a specific patch proposal
    |
    v
[4] Patch detail view shows:
    - Current policy (exact rule text)
    - Identified weakness (from vulnerability evidence)
    - Proposed change (exact new rule text)
    - AI reasoning
    - Expected benefit (text)
    - Expected false-positive impact (text)
    - Expected customer-friction impact (text)
    - Simulation status: NOT YET SIMULATED
    |
    v
[5] User clicks "Simulate This Patch"
    |
    v
[6] Backend runs patch simulation:
    - Replays same attack scenarios
    - Applies proposed policy version
    - Calculates new metrics
    |
    v
[7] Patch detail view updates with BEFORE vs AFTER table:
    - Precision
    - Recall
    - F1
    - False Positive Rate
    - Attack Success Rate
    - Successful Bypasses
    - Simulated Exposure
    |
    v
[8] User reviews the benchmark (held-out set results)
    |
    v
[9] Decision point:

    [APPROVE]                      [REJECT]
        |                              |
        v                              v
    Policy updated              Patch discarded
    to new version              (reason logged)
    (audit logged)
```

**Entry point:** Policy Patches (`/patches`)  
**Exit point:** Policy list (if approved) or Patch list (if rejected)

---

## 7. Flow 6: BEFORE vs AFTER Comparison

**Goal:** Merchant sees the measurable impact of the approved patch.

```
[1] User navigates to Replay & Benchmark
    |
    v
[2] Selects a completed patch simulation
    |
    v
[3] Comparison view renders:

    BEFORE (Original Policy)          AFTER (Patched Policy)
    Precision: (calculated)           Precision: (calculated)
    Recall: (calculated)              Recall: (calculated)
    FPR: (calculated)                 FPR: (calculated)
    Bypasses: (calculated)            Bypasses: (calculated)
    Exposure: INR (calculated)        Exposure: INR (calculated)
    |
    v
[4] Benchmark section shows held-out test results
    |
    v
[5] User can export or share results
```

**Entry point:** Replay & Benchmark (`/replay`)  
**Exit point:** Report generation or Settings

---

## 8. Flow 7: Fire Drill Mode (One-Click Full Loop)

**Goal:** One-click automated run of the complete RiskFire loop — the primary demo flow.

```
[1] User clicks "Run Full Fire Drill" (from dashboard or Attack Lab)
    |
    v
[2] System confirms:
    - Active policy version selected
    - Simulation parameters (or uses defaults)
    |
    v
[3] User confirms and clicks "Start Fire Drill"
    |
    v
[4] Automated pipeline runs:

    Step 1: Load current policy
    Step 2: AI generates attack scenarios
    Step 3: Validate scenarios
    Step 4: Run simulation
    Step 5: Identify vulnerabilities
    Step 6: Calculate financial exposure
    Step 7: AI generates vulnerability explanations
    Step 8: AI generates policy patch proposals
    Step 9: Simulate patches
    Step 10: Run benchmark (held-out set)
    Step 11: Generate executive risk report
    |
    v
[5] Progress is streamed in real time (WebSocket)
    |
    v
[6] Fire Drill complete — user lands on Executive Risk Report
    |
    v
[7] Report shows:
    - Risk posture summary
    - Top vulnerabilities discovered
    - Proposed patches
    - BEFORE vs AFTER comparison
    - Benchmark metrics
    - Recommended next steps
```

**Entry point:** Dashboard or Attack Lab  
**Exit point:** Executive Risk Report

---

## 9. Flow 8: Viewing the Executive Risk Report

**Goal:** Merchant understands the overall risk posture and key findings.

```
[1] User opens a completed report
    |
    v
[2] Report header:
    - Simulation date
    - Policy version tested
    - Overall risk posture score
    |
    v
[3] Sections:
    - Executive Summary (AI-written, data-grounded)
    - Top Vulnerabilities
    - Financial Exposure Overview (labeled as simulated)
    - Recommended Policy Patches
    - BEFORE vs AFTER Comparison (if patches simulated)
    - Benchmark Results
    |
    v
[4] User can:
    - Export report as PDF
    - Share link with team
    - Navigate directly to individual vulnerabilities or patches
```

**Entry point:** Incidents or direct report link  
**Exit point:** Policy Patches or settings

---

## 10. Flow 9: Audit Log Review

**Goal:** A merchant admin reviews the complete audit trail for a simulation session.

```
[1] User navigates to Audit Log
    |
    v
[2] Filters by:
    - Date range
    - Action type (simulation, AI generation, patch, approval)
    - Actor (user or system)
    |
    v
[3] Each audit entry shows:
    - Timestamp
    - Action type
    - Actor (user ID or system component)
    - Context (simulation ID, policy version ID, etc.)
    - Result (success / failure / validation status)
    |
    v
[4] User clicks an AI generation entry:
    - Shows: provider, model, prompt version, validation status
    - Does NOT show: raw API key or PII
```

**Entry point:** Audit Log (`/audit`)  
**Exit point:** Related simulation or policy view

---

## 11. Flow 10: Policy Version History

**Goal:** Analyst compares the evolution of a policy across versions.

```
[1] User navigates to Risk Policies
    |
    v
[2] Clicks on a specific policy
    |
    v
[3] Policy detail shows version history:
    - v1.0 (original)
    - v1.1 (patch applied on date X)
    - v1.2 (patch applied on date Y)
    |
    v
[4] User can compare any two versions:
    - Side-by-side rule diff
    - Benchmark results for each version
    |
    v
[5] User can roll back to a previous version
    (requires Merchant Admin role)
```

**Entry point:** Risk Policies (`/policies`)  
**Exit point:** Policy detail or Policy Builder

---

## 12. Navigation Map

```
/                           -> Risk Command Center (Dashboard)
/policies                   -> Risk Policies list
/policies/new               -> Policy Builder
/policies/:id               -> Policy detail + version history
/attack-lab                 -> Attack Lab
/attack-lab/run/:id         -> Live Simulation (WebSocket view)
/simulations                -> All simulation runs
/simulations/:id            -> Simulation results + vulnerabilities
/vulnerabilities            -> All vulnerabilities
/vulnerabilities/:id        -> Vulnerability detail + evidence + AI explanation
/attack-graph               -> Attack Graph (React Flow)
/patches                    -> Policy Patches list
/patches/:id                -> Patch detail + BEFORE/AFTER + benchmark
/replay                     -> Replay & Benchmark
/evaluation                 -> Evaluation metrics
/incidents                  -> Incident history
/datasets                   -> Dataset manager
/audit                      -> Audit Log
/settings                   -> Settings
/reports/:id                -> Executive Risk Report
```

---

*Document Version: 1.0.0*
*Created: 2026-08-20*
*Reference: riskfire-product-spec.md*
