# RiskFire — Canonical Product Specification

> **STATUS**: This document is the single source of truth for the RiskFire product.
> All future implementation decisions must reference this document.
> If a future request conflicts with this specification, the conflict must be identified **before** implementation begins.
> Do not silently change the product concept.

---

## 1. Identity

| Field | Value |
|---|---|
| **Project Name** | RiskFire |
| **Hackathon Track** | Razorpay Hackathon — Track 02: AI Risk Manager |
| **Category** | AI Payment Risk Red-Team / Adversarial Risk Testing |
| **Core Slogan** | "Don't wait for fraudsters to find the weakness. Attack your own risk controls first." |
| **Core System Principle** | "AI proposes. The simulator proves." |

---

## 2. One-Line Description

RiskFire is an AI-powered red-team platform that attacks a merchant's payment-risk policies inside a controlled synthetic environment, discovers policy bypasses, estimates simulated financial exposure, explains why the controls failed, proposes defensive policy patches, and replays the same attacks to prove whether the fixes actually improve protection.

---

## 3. The Problem

Traditional payment-risk systems primarily answer:

> "Is this transaction risky?"

RiskFire asks a fundamentally different question:

> "Can our risk controls actually survive an intelligent adversary?"

A risk rule may look correct in isolation but still be vulnerable when an attacker combines:

- multiple accounts
- multiple devices
- payment-instrument rotation
- shared addresses
- timing manipulation
- refund behavior
- promotion abuse
- coordinated transaction patterns

### Illustrative Example

**Merchant rule:**
```
3 transactions per account within 10 minutes
```

**Attacker strategy:**
```
Account A -> 3 transactions
Account B -> 3 transactions
Account C -> 3 transactions

All three accounts share:
- the same device fingerprint
- the same delivery address
- similar behavioral timing
```

Each account individually stays **below** the threshold. The merchant's account-level velocity rule misses the coordinated behavior entirely.

RiskFire exists to discover this class of weakness **before a real attacker does**.

---

## 4. What RiskFire Is and Is Not

### RiskFire IS NOT:

- A generic fraud detector
- A chatbot that says whether transactions are risky
- A payment gateway
- A real fraud execution platform
- A production payment-processing system
- A simple dashboard
- An LLM wrapper
- A static rule checker

### RiskFire IS:

An **adversarial simulation and risk-policy testing platform**.

It operates as a **red-team system** — it takes on the role of an intelligent adversary, attacks the merchant's own policies inside a synthetic environment, and then measures how well those policies held up.

---

## 5. Core Product Loop

```
ATTACK
  |
  v
DISCOVER
  |
  v
EXPLAIN
  |
  v
PATCH
  |
  v
REPLAY
  |
  v
PROVE
```

Every feature in RiskFire exists to serve this loop. Any feature that does not contribute to this loop is out of scope for the MVP.

---

## 6. Complete Product Flow

The full end-to-end flow of a RiskFire session:

1. **Merchant configures risk policies.**
2. **RiskFire creates a synthetic payment environment** — customers, accounts, devices, addresses, payment instruments, orders, transactions.
3. **AI adversarial agents analyze** the available policies and simulation constraints.
4. **AI generates structured attack scenarios** (structured JSON; not free text).
5. **Backend validates** the AI-generated scenarios against simulation constraints.
6. **Deterministic simulation engine executes** the scenarios.
7. **Deterministic risk engine evaluates** each synthetic transaction against the merchant's current policies.
8. **RiskFire identifies** attacks that bypass, partially bypass, or expose weaknesses in the policies.
9. **RiskFire builds an evidence trail and attack graph** — relationships between accounts, devices, addresses, and payment instruments.
10. **Financial exposure is calculated** using deterministic formulas (not AI).
11. **AI analyzes the structured evidence** and explains the vulnerability in human-readable language.
12. **AI proposes one or more policy patches.**
13. **Patches are NOT automatically accepted.** They are proposals that require validation.
14. **Each patch is validated and simulated** — the same attacks are replayed against the proposed new policy.
15. **RiskFire compares BEFORE vs AFTER** results across all key metrics.
16. **A held-out benchmark set evaluates** whether the improvement generalizes beyond the development set.
17. **RiskFire produces an executive risk report.**

---

## 7. What AI Does — and Does Not Do

### 7.1 AI Responsibilities (Where Reasoning Provides Real Value)

#### AI Responsibility 1: Attack Planning

AI receives:
- merchant policies (structured)
- policy types
- simulation constraints
- available synthetic entities
- attacker objective
- previous attack results

AI produces a **structured attack plan** (JSON), for example:

```json
{
  "attack_type": "distributed_velocity",
  "objective": "bypass_account_velocity",
  "actors": 4,
  "shared_device": true,
  "shared_address": true,
  "transaction_count": 12,
  "duration_minutes": 15,
  "target_policy": "POL-VELOCITY-001"
}
```

The backend **validates** this output before execution. The AI never directly executes anything.

#### AI Responsibility 2: Vulnerability Explanation

The simulator produces the actual evidence. AI receives only the relevant structured evidence (not raw transaction data) and explains, in human language, why the policy failed.

**The AI must NOT invent evidence.** All evidence presented in an explanation must be traceable to simulator output.

#### AI Responsibility 3: Policy Patch Generation

AI receives:
- current policy (structured)
- attack path
- vulnerability evidence
- simulation results
- legitimate transaction impact
- false-positive information

It proposes a **candidate** policy change, for example:

```
Current:  3 transactions/account/10 minutes
Proposed: 3 transactions/account/10 minutes
          + 8 transactions/device/10 minutes
```

The patch must contain:
- identified weakness
- proposed change
- reasoning
- expected benefit
- expected false-positive impact
- potential customer-friction impact

The patch is a **proposal only**. The deterministic simulator must test it.

#### AI Responsibility 4: Executive Report Generation

AI converts actual benchmark and simulation results into a human-readable risk report. The AI **must never invent metrics**. All numerical values in reports must originate from backend calculations.

---

### 7.2 What AI Must Not Do

AI must **not** be the source of truth for:

| Concern | Owner |
|---|---|
| Fraud labels | Deterministic risk engine |
| Transaction execution | Deterministic simulation engine |
| Risk decisions | Deterministic policy engine |
| Financial calculations | Financial exposure engine |
| Benchmark metrics | Benchmark engine |
| Precision / Recall / FPR | Benchmark engine |
| Exposure calculations | Financial exposure engine |
| Policy activation | Merchant approval workflow |
| Final patch approval | Merchant |

---

## 8. AI Architecture

### 8.1 AI Provider

**Primary provider (MVP):** Groq API  
**Primary model:** openai/gpt-oss-120b

The application must use an **AI provider abstraction** so business logic is not tightly coupled to any specific provider or model.

### 8.2 Provider Abstraction

```
AIProvider (abstract base)
   |
   v
GroqProvider
   |
   v
Groq API
   |
   v
openai/gpt-oss-120b
```

Future providers (OpenAI, Anthropic, Google) must be addable without rewriting business logic.

### 8.3 AI Module Responsibilities

| Module | Input | Output |
|---|---|---|
| Attack Planner | Structured policy + constraints | Structured attack plan JSON |
| Vulnerability Explainer | Structured evidence from simulator | Human-readable explanation |
| Patch Generator | Structured policy + vulnerability evidence | Structured patch proposal JSON |
| Report Generator | Structured benchmark results | Human-readable executive report |

---

## 9. Synthetic Environment — Core Constraint

**RiskFire must operate exclusively using synthetic data.**

Never use or transmit:
- Real card numbers
- CVV
- UPI PIN
- Real bank credentials
- Real customer credentials or PII
- Real fraudulent transactions
- Real payment execution of any kind

### Synthetic Entities

Every entity in the simulation environment receives a synthetic ID and synthetic attributes:

| Entity | Description |
|---|---|
| Merchant | The policy owner. One per simulation context. |
| Customer | A synthetic person with a profile. |
| Account | A merchant-side account belonging to a customer. |
| Device | A synthetic device fingerprint. |
| IP | A synthetic IP address. |
| Address | A synthetic physical/delivery address. |
| Payment Instrument | A synthetic card, UPI ID, wallet, or bank account. |
| Order | A synthetic purchase order. |
| Transaction | A synthetic payment transaction. |
| Refund | A synthetic refund event. |
| Promotion | A synthetic coupon/referral/discount entity. |
| Risk Decision | The output of the risk engine for a given transaction. |

### Deterministic Seeds

The simulator must support deterministic seeds:

```
simulation_seed = 12345
```

The same seed + same configuration must reproduce identical simulation results. This is required for debugging, benchmarking, and reproducibility.

---

## 10. Attack Agent Types

### Initial Adversarial Agents (MVP)

| Agent | Objective |
|---|---|
| **Velocity Attacker** | Maximize transaction activity while staying below account-level velocity thresholds |
| **Identity Fragmentation Attacker** | Split activity across multiple accounts while maintaining shared device/address/behavioral signals |
| **Refund Abuse Attacker** | Exploit refund frequency, amount, or order-cycle rules |
| **Promotion Abuse Attacker** | Exploit new-user, referral, or coupon policies |
| **Payment Instrument Rotation Attacker** | Rotate payment instruments to bypass instrument-level controls |
| **Coordinated Cluster Attacker** | Simulate coordinated activity across multiple identities, devices, addresses, and payment instruments |

All attack behavior is **always synthetic**. No real fraud is performed or simulated against real systems.

---

## 11. Policy System

The policy engine must support an **extensible** rule framework.

### Policy Categories

#### AMOUNT
- Maximum transaction amount
- Daily amount limit
- Weekly amount limit

#### VELOCITY
- Transactions per account per time window
- Transactions per device per time window
- Transactions per payment instrument per time window
- Transactions per address per time window
- Transactions per IP per time window

#### IDENTITY
- Account age threshold
- Maximum device count per account
- IP change frequency
- Address reuse detection

#### PAYMENT INSTRUMENT
- Maximum cards per account
- Maximum accounts per card
- Payment instrument reuse detection

#### REFUNDS
- Maximum refund frequency
- Refund-to-order ratio
- Refund amount thresholds

#### PROMOTIONS
- Coupon usage limits
- Referral program abuse detection
- New-user promotion limits

#### BEHAVIORAL
- Rapid account switching
- Repeated checkout failures
- Transaction burst patterns
- Unusual transaction sequences

### Policy Versioning

Policies must be versioned. Every simulation run must reference the exact policy version used. This is required for reproducible benchmarks and BEFORE/AFTER comparison.

---

## 12. Vulnerability System

After simulation, RiskFire compares **attack intent** against **policy response**.

### Possible Outcomes

| Outcome | Meaning |
|---|---|
| `BLOCKED` | The policy successfully blocked the attack |
| `FLAGGED` | The policy flagged the transaction but did not block it |
| `ALLOWED` | The attack succeeded without triggering any policy |
| `PARTIALLY_DETECTED` | Some elements of the attack were detected but the full attack succeeded |
| `UNKNOWN` | The simulation produced an indeterminate result |

A successful adversarial path (`ALLOWED` or `PARTIALLY_DETECTED`) becomes a **vulnerability candidate**.

### Severity Calculation

Vulnerability severity is calculated deterministically from actual simulation data:

- Attack success frequency
- Transaction value
- Simulated financial exposure
- Repeatability of the attack
- Number of affected entities
- Policy coverage gaps
- Confidence score

**Severity must never be a hard-coded value or AI estimate.**

---

## 13. Financial Exposure

Financial exposure is calculated deterministically from simulation results.

**Formula (example):**
```
Gross Synthetic Exposure = Successful Attack Count x Attack Transaction Value
```

Any expected-loss or discount factor must be:
1. Explicitly configurable (not hard-coded)
2. Clearly labeled as an assumption in the UI
3. Not presented as a real-world loss figure

Every financial metric shown in the UI must be traceable to simulation data. The UI must display a disclaimer that all financial exposure figures are **simulated estimates** based on synthetic data.

---

## 14. Attack Graph

RiskFire must visualize the relationships between synthetic entities to explain coordinated attack patterns.

**Entity relationships to model:**

```
Account <-> Device <-> IP <-> Address <-> Payment Instrument <-> Order <-> Transaction
```

**Example graph:**
```
Account A ---- Device X ---- Address Y
               |
Account B ---- Device X ---- Card Z
```

The graph helps the user understand how apparently separate identities are actually connected through shared infrastructure.

**Frontend:** React Flow  
**Backend:** Graph analysis and relationship calculations (not outsourced to AI)

---

## 15. Patch System

The policy patch workflow must enforce **merchant control at every step**:

```
AI PROPOSES
    |
    v
VALIDATE (Pydantic schema + attack validator)
    |
    v
SIMULATE (against existing attack scenarios)
    |
    v
COMPARE (BEFORE vs AFTER metrics)
    |
    v
BENCHMARK (held-out test set)
    |
    v
MERCHANT APPROVAL (required -- no auto-apply)
```

**Forbidden pattern:**
```
AI -> Automatically change policy
```

The merchant must explicitly approve every policy change before it is applied even within the simulation context.

---

## 16. Replay System

RiskFire must be able to replay the **identical attack scenarios** against a patched policy version.

The replay system must:
- Use the same simulation seed
- Use the same attack scenario definitions
- Use the same synthetic entity set
- Apply the new policy version
- Produce independently calculated metrics

All BEFORE/AFTER numbers must be dynamically calculated. Never hard-code comparison numbers.

---

## 17. Benchmark System

### Dataset Split

| Split | Percentage | Purpose |
|---|---|---|
| Development | 70% | Attack scenario generation and initial patch development |
| Validation | 15% | Intermediate evaluation during patch iteration |
| Held-out Test | 15% | Final generalization evaluation |

**The held-out test set must never be used when generating or iterating on patches.**

### Metrics

| Metric | Type |
|---|---|
| Precision | Classification |
| Recall | Classification |
| F1 | Classification |
| False Positive Rate | Classification |
| Attack Success Rate | Adversarial |
| Successful Bypasses | Adversarial |
| Simulated Exposure | Financial |
| Exposure Reduction | Financial |
| Policy Improvement | Composite |
| Customer Friction | Operational |
| Simulation Throughput | Operational |

**No benchmark metric may be hard-coded.** All metrics must be computed from actual simulation data at runtime.

---

## 18. Fire Drill Mode

Fire Drill is a one-click automated flow that runs the complete RiskFire loop:

1. Load current policy version
2. Generate attack scenarios (AI-assisted)
3. Validate scenarios (deterministic)
4. Run simulation (deterministic)
5. Identify vulnerabilities (deterministic)
6. Calculate financial exposure (deterministic)
7. Generate AI explanation of vulnerabilities
8. Generate AI policy patch proposals
9. Simulate patches (deterministic)
10. Run benchmark against held-out set
11. Generate executive risk report (AI-assisted, data-grounded)

This is the **primary high-impact demo flow** for the hackathon.

---

## 19. Core UI Modules

| # | Module | Description |
|---|---|---|
| 1 | Risk Command Center | Primary dashboard — simulation KPIs, top vulnerabilities, risk posture |
| 2 | Risk Policies | Policy inventory — all active and historical policies |
| 3 | Policy Builder | UI for defining and editing risk policies |
| 4 | Attack Lab | Primary product experience — configure and run red-team simulations |
| 5 | Attack Scenarios | Browse and inspect generated attack scenarios |
| 6 | Live Simulation | Real-time simulation progress via WebSocket |
| 7 | Vulnerabilities | List and detail view of discovered vulnerabilities |
| 8 | Attack Graph | React Flow visualization of entity relationships |
| 9 | Policy Patches | AI-proposed patches with BEFORE/AFTER comparison |
| 10 | Replay & Benchmark | Replay attacks against patched policy; benchmark results |
| 11 | Evaluation | Full metrics dashboard |
| 12 | Incidents | Historical log of simulation findings |
| 13 | Datasets | Manage simulation dataset splits |
| 14 | Audit Log | Full auditability trail |
| 15 | Settings | Merchant configuration, API keys, simulation parameters |

---

## 20. Risk Command Center Dashboard

The dashboard must show metrics computed from backend data. **Never hard-code dashboard numbers.**

Required KPIs:
- Simulations Run (count)
- Attacks Detected (count)
- Policy Bypasses (count)
- Simulated Exposure (INR — labeled as simulated)
- Precision (%)
- Recall (%)
- False Positive Rate (%)
- Policy Coverage (%)
- Top Vulnerabilities (list)
- Risk Posture (derived score)

---

## 21. Attack Lab — Primary Product Experience

The user must be able to:
- Select active policies to target
- Choose attack agent types
- Configure simulation size
- Choose attack difficulty
- Start a red-team simulation run
- Watch real-time simulation progress (WebSocket)
- Inspect individual attack agents and their strategies
- Inspect discovered bypasses
- Inspect identified vulnerabilities

---

## 22. Demo Scenario (Canonical)

The primary hackathon demonstration scenario:

**Merchant policy:**
```
3 transactions / account / 10 minutes
```

**RiskFire red-team discovers:**
- 3+ synthetic accounts, each staying under the 3-transaction threshold
- All accounts share the same synthetic device
- All accounts share the same synthetic address
- Behavioral timing is coordinated

**RiskFire identifies:**
```
Vulnerability: Distributed Velocity Bypass
Severity: HIGH
Policy: POL-VELOCITY-001
```

**AI explains:** Why the account-level rule fails to detect coordinated multi-account behavior when device and address signals are ignored.

**AI proposes:**
```
Current:  3 transactions/account/10 minutes
Proposed: 3 transactions/account/10 minutes
          + 8 transactions/device/10 minutes
          + address-cluster signal
```

**RiskFire simulates the patch, replays the attack, and shows BEFORE vs AFTER with dynamically calculated metrics.**

---

## 23. UI/UX Design Principles

The interface should feel like:
- Fintech infrastructure
- Security operations center
- Enterprise risk platform
- AI operations center

The interface must prioritize:
- Clarity over decoration
- Evidence and traceability
- Data and graphs
- BEFORE/AFTER comparison
- Risk context

The interface must NOT feel like:
- A generic chatbot
- A toy fraud app
- A flashy AI landing page
- A random cyberpunk dashboard

---

## 24. Auditability Requirements

Every important action must be auditable. AI generation audit fields:
- Provider name
- Model name
- Prompt version identifier
- Structured input reference
- Raw AI output
- Timestamp
- Simulation context reference
- Policy version reference
- Validation status and result

**Secrets must never be stored in audit records.**

---

## 25. Security Requirements

- All API keys must be environment variables — never committed to source control
- The AI provider must never receive real payment credentials
- AI outputs must never directly execute backend actions
- All AI outputs must pass Pydantic schema validation before any downstream action
- Financial exposure figures must always be labeled as synthetic/simulated
- All attack behavior must remain inside the synthetic simulation boundary
- JWT authentication for all protected API routes

---

## 26. Hackathon Positioning

**Core positioning:**
> "We don't wait for fraudsters to discover weaknesses in payment-risk controls. We attack our own defenses first."

RiskFire demonstrates:
- AI reasoning (attack planning, explanation, patch generation)
- Deterministic simulation (reproducible, auditable)
- Adversarial testing (red-team methodology)
- Financial impact (simulated exposure calculations)
- Policy optimization (structured patch proposal and replay)
- Measurable evaluation (before/after benchmarks with real metrics)

**RiskFire must not claim:**
- Real fraud prevention accuracy
- Real merchant financial savings
- Access to proprietary Razorpay systems
- Production fraud detection capability

---

*Document Version: 1.0.0*
*Created: 2026-08-20*
*Status: Canonical — Single Source of Truth*
