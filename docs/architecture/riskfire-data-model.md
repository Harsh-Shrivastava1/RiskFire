# RiskFire — Data Model

> Reference: [riskfire-product-spec.md](../product/riskfire-product-spec.md)
> Reference: [riskfire-simulation-architecture.md](./riskfire-simulation-architecture.md)

---

## 1. Design Principles

- **PostgreSQL only** — strongly relational entities with foreign keys and indexes
- **UUIDs** as primary keys for all entities
- **Timestamps** (`created_at`, `updated_at`) on every table
- **Soft deletes** — no hard DELETE on audit-sensitive tables
- **Policy versioning** — policies are never mutated; new versions are created
- **Alembic migrations** — all schema changes must go through versioned migrations
- **No fake data in production** — seed data is for development only

---

## 2. Entity Relationship Overview

```
users
  |
  +-- merchants (one user -> one merchant in MVP)
        |
        +-- risk_policies -> policy_versions -> policy_rules
        |
        +-- simulation_runs
              |
              +-- attack_scenarios -> attack_steps -> attack_agents
              |
              +-- customers -> accounts
              |                   |
              +-- devices <-------+
              |                   |
              +-- ips <-----------+
              |                   |
              +-- addresses <-----+
              |                   |
              +-- payment_instruments
              |
              +-- orders -> transactions -> refunds
              |                |
              +-- promotions   +-- risk_decisions
              |
              +-- simulation_events
              |
              +-- vulnerabilities -> vulnerability_evidence
              |
              +-- policy_patches -> patch_simulations
              |
              +-- benchmark_runs -> benchmark_results
              |
              +-- ai_generations
              |
              +-- audit_logs
```

---

## 3. Entity Definitions

### 3.1 users

Application users (merchants, analysts, admins).

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    role            VARCHAR(50) NOT NULL DEFAULT 'merchant_admin',
                    -- ENUM: merchant_admin | risk_analyst | read_only
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### 3.2 merchants

Merchant configuration. One merchant per user account in MVP.

```sql
CREATE TABLE merchants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100),
    risk_profile    VARCHAR(50) DEFAULT 'MEDIUM',
                    -- ENUM: LOW | MEDIUM | HIGH
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchants_user_id ON merchants(user_id);
```

### 3.3 risk_policies

Named policy definitions. Policies are versioned; the policy record is the container.

```sql
CREATE TABLE risk_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id     UUID NOT NULL REFERENCES merchants(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_policies_merchant_id ON risk_policies(merchant_id);
```

### 3.4 policy_versions

Immutable snapshot of a policy at a point in time. Creating a new version never modifies the old one.

```sql
CREATE TABLE policy_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id       UUID NOT NULL REFERENCES risk_policies(id),
    version_number  VARCHAR(20) NOT NULL,    -- e.g., "1.0", "1.1", "2.0"
    status          VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
                    -- ENUM: DRAFT | ACTIVE | SUPERSEDED | ARCHIVED
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes           TEXT,
    UNIQUE (policy_id, version_number)
);

CREATE INDEX idx_policy_versions_policy_id ON policy_versions(policy_id);
CREATE INDEX idx_policy_versions_status ON policy_versions(status);
```

### 3.5 policy_rules

Individual rules within a policy version. Each rule is typed.

```sql
CREATE TABLE policy_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_version_id   UUID NOT NULL REFERENCES policy_versions(id),
    rule_type           VARCHAR(100) NOT NULL,
                        -- ENUM: VELOCITY_ACCOUNT | VELOCITY_DEVICE | VELOCITY_INSTRUMENT
                        --       VELOCITY_ADDRESS | VELOCITY_IP
                        --       AMOUNT_MAX | AMOUNT_DAILY | AMOUNT_WEEKLY
                        --       IDENTITY_ACCOUNT_AGE | IDENTITY_DEVICE_COUNT
                        --       INSTRUMENT_CARDS_PER_ACCOUNT | INSTRUMENT_ACCOUNTS_PER_CARD
                        --       REFUND_FREQUENCY | REFUND_RATIO | REFUND_THRESHOLD
                        --       PROMOTION_COUPON | PROMOTION_REFERRAL | PROMOTION_NEW_USER
                        --       BEHAVIOR_RAPID_SWITCH | BEHAVIOR_CHECKOUT_FAILURES | BEHAVIOR_BURST
    parameters          JSONB NOT NULL,     -- Rule-type-specific parameters
    action              VARCHAR(50) NOT NULL DEFAULT 'BLOCK',
                        -- ENUM: BLOCK | FLAG | MONITOR
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    sequence_order      INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_rules_version_id ON policy_rules(policy_version_id);
CREATE INDEX idx_policy_rules_type ON policy_rules(rule_type);
```

**Example `parameters` JSON for velocity rule:**
```json
{
  "entity": "account",
  "max_count": 3,
  "window_minutes": 10
}
```

---

### 3.6 simulation_runs

Each red-team simulation run. References the policy version tested.

```sql
CREATE TABLE simulation_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id         UUID NOT NULL REFERENCES merchants(id),
    policy_version_id   UUID NOT NULL REFERENCES policy_versions(id),
    seed                BIGINT NOT NULL,
    config              JSONB NOT NULL,          -- Full SimulationConfig snapshot
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                        -- ENUM: PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
    run_type            VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
                        -- ENUM: MANUAL | FIRE_DRILL | REPLAY | BENCHMARK
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    error_message       TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_simulation_runs_merchant_id ON simulation_runs(merchant_id);
CREATE INDEX idx_simulation_runs_policy_version_id ON simulation_runs(policy_version_id);
CREATE INDEX idx_simulation_runs_status ON simulation_runs(status);
```

### 3.7 simulation_events

Individual events emitted during simulation execution (also used for WebSocket streaming).

```sql
CREATE TABLE simulation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    event_type      VARCHAR(100) NOT NULL,
    sequence_num    INTEGER NOT NULL,
    payload         JSONB NOT NULL,
    sim_timestamp   TIMESTAMPTZ,            -- Simulated time of event
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_simulation_events_simulation_id ON simulation_events(simulation_id);
CREATE INDEX idx_simulation_events_type ON simulation_events(event_type);
```

---

### 3.8 customers

Synthetic customer profiles.

```sql
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    profile_type    VARCHAR(50) NOT NULL,   -- LEGITIMATE | ATTACKER | MIXED
    age_days        INTEGER NOT NULL,
    location_region VARCHAR(100),
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_simulation_id ON customers(simulation_id);
CREATE INDEX idx_customers_profile_type ON customers(profile_type);
```

### 3.9 accounts

Synthetic merchant accounts belonging to customers.

```sql
CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at_sim  TIMESTAMPTZ NOT NULL,   -- Simulated creation time
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_simulation_id ON accounts(simulation_id);
CREATE INDEX idx_accounts_customer_id ON accounts(customer_id);
```

### 3.10 devices

Synthetic device fingerprints.

```sql
CREATE TABLE devices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id       UUID NOT NULL REFERENCES simulation_runs(id),
    fingerprint_hash    VARCHAR(255) NOT NULL,
    device_type         VARCHAR(50),
    os                  VARCHAR(100),
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_simulation_id ON devices(simulation_id);
```

### 3.11 ips

Synthetic IP addresses.

```sql
CREATE TABLE ips (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    ip_address      VARCHAR(45) NOT NULL,   -- Non-routable synthetic range
    is_proxy        BOOLEAN NOT NULL DEFAULT FALSE,
    is_vpn          BOOLEAN NOT NULL DEFAULT FALSE,
    country         VARCHAR(10),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ips_simulation_id ON ips(simulation_id);
```

### 3.12 addresses

Synthetic physical addresses.

```sql
CREATE TABLE addresses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    address_hash    VARCHAR(255) NOT NULL,  -- Hash of synthetic address
    city            VARCHAR(100),
    region          VARCHAR(100),
    pincode         VARCHAR(20),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_simulation_id ON addresses(simulation_id);
```

### 3.13 payment_instruments

Synthetic payment methods.

```sql
CREATE TABLE payment_instruments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id       UUID NOT NULL REFERENCES simulation_runs(id),
    instrument_type     VARCHAR(50) NOT NULL,   -- CARD | UPI | WALLET | NETBANKING
    masked_identifier   VARCHAR(50) NOT NULL,   -- e.g., XXXX-XXXX-XXXX-4242
    first_seen_sim      TIMESTAMPTZ NOT NULL,
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_instruments_simulation_id ON payment_instruments(simulation_id);
```

### 3.14 orders

Synthetic purchase orders.

```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    amount          NUMERIC(12, 2) NOT NULL,
    product_category VARCHAR(100),
    created_at_sim  TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_simulation_id ON orders(simulation_id);
CREATE INDEX idx_orders_account_id ON orders(account_id);
```

### 3.15 transactions

The core synthetic transaction record.

```sql
CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id           UUID NOT NULL REFERENCES simulation_runs(id),
    order_id                UUID NOT NULL REFERENCES orders(id),
    account_id              UUID NOT NULL REFERENCES accounts(id),
    device_id               UUID NOT NULL REFERENCES devices(id),
    ip_id                   UUID NOT NULL REFERENCES ips(id),
    address_id              UUID NOT NULL REFERENCES addresses(id),
    payment_instrument_id   UUID NOT NULL REFERENCES payment_instruments(id),
    amount                  NUMERIC(12, 2) NOT NULL,
    created_at_sim          TIMESTAMPTZ NOT NULL,
    is_adversarial          BOOLEAN NOT NULL DEFAULT FALSE,
    attack_scenario_id      UUID REFERENCES attack_scenarios(id),
    attack_step_id          UUID REFERENCES attack_steps(id),
    dataset_split           VARCHAR(20),    -- development | validation | held_out
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_simulation_id ON transactions(simulation_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_device_id ON transactions(device_id);
CREATE INDEX idx_transactions_payment_instrument_id ON transactions(payment_instrument_id);
CREATE INDEX idx_transactions_is_adversarial ON transactions(is_adversarial);
CREATE INDEX idx_transactions_dataset_split ON transactions(dataset_split);
CREATE INDEX idx_transactions_created_at_sim ON transactions(created_at_sim);
```

### 3.16 refunds

Synthetic refund events.

```sql
CREATE TABLE refunds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    amount          NUMERIC(12, 2) NOT NULL,
    reason          VARCHAR(255),
    created_at_sim  TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_simulation_id ON refunds(simulation_id);
CREATE INDEX idx_refunds_transaction_id ON refunds(transaction_id);
```

### 3.17 promotions

Synthetic promotion applications.

```sql
CREATE TABLE promotions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    promotion_type  VARCHAR(50) NOT NULL,   -- COUPON | REFERRAL | NEW_USER
    discount_amount NUMERIC(12, 2) NOT NULL,
    applied_at_sim  TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promotions_simulation_id ON promotions(simulation_id);
CREATE INDEX idx_promotions_account_id ON promotions(account_id);
```

---

### 3.18 attack_agents

Records of which adversarial agents were active in a simulation run.

```sql
CREATE TABLE attack_agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulation_runs(id),
    agent_type      VARCHAR(100) NOT NULL,
    difficulty      VARCHAR(20) NOT NULL,
    config          JSONB NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attack_agents_simulation_id ON attack_agents(simulation_id);
```

### 3.19 attack_scenarios

AI-generated attack plans (after validation).

```sql
CREATE TABLE attack_scenarios (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id       UUID NOT NULL REFERENCES simulation_runs(id),
    attack_agent_id     UUID NOT NULL REFERENCES attack_agents(id),
    attack_type         VARCHAR(100) NOT NULL,
    objective           VARCHAR(255) NOT NULL,
    target_policy_id    VARCHAR(100),
    config              JSONB NOT NULL,     -- Full AttackPlan snapshot
    ai_generation_id    UUID REFERENCES ai_generations(id),
    validation_status   VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                        -- ENUM: PENDING | VALID | INVALID
    validation_errors   JSONB,
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                        -- ENUM: PENDING | RUNNING | COMPLETED | FAILED
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attack_scenarios_simulation_id ON attack_scenarios(simulation_id);
```

### 3.20 attack_steps

Individual steps within an attack scenario.

```sql
CREATE TABLE attack_steps (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id             UUID NOT NULL REFERENCES attack_scenarios(id),
    sequence_number         INTEGER NOT NULL,
    actor_account_id        UUID REFERENCES accounts(id),
    device_id               UUID REFERENCES devices(id),
    payment_instrument_id   UUID REFERENCES payment_instruments(id),
    action_type             VARCHAR(50) NOT NULL,
    amount                  NUMERIC(12, 2),
    sim_timestamp           TIMESTAMPTZ NOT NULL,
    status                  VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attack_steps_scenario_id ON attack_steps(scenario_id);
```

---

### 3.21 risk_decisions

The deterministic risk engine output for each transaction.

```sql
CREATE TABLE risk_decisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id       UUID NOT NULL REFERENCES simulation_runs(id),
    transaction_id      UUID NOT NULL REFERENCES transactions(id),
    policy_version_id   UUID NOT NULL REFERENCES policy_versions(id),
    outcome             VARCHAR(50) NOT NULL,   -- BLOCKED | FLAGGED | ALLOWED
    triggered_rules     JSONB NOT NULL,         -- Array of rule_ids that triggered
    decision_at_sim     TIMESTAMPTZ NOT NULL,
    processing_time_ms  INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_decisions_simulation_id ON risk_decisions(simulation_id);
CREATE INDEX idx_risk_decisions_transaction_id ON risk_decisions(transaction_id);
CREATE INDEX idx_risk_decisions_outcome ON risk_decisions(outcome);
```

---

### 3.22 vulnerabilities

Identified policy vulnerabilities.

```sql
CREATE TABLE vulnerabilities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id       UUID NOT NULL REFERENCES simulation_runs(id),
    attack_scenario_id  UUID NOT NULL REFERENCES attack_scenarios(id),
    policy_version_id   UUID NOT NULL REFERENCES policy_versions(id),
    vulnerability_type  VARCHAR(100) NOT NULL,
    severity            VARCHAR(20) NOT NULL,   -- CRITICAL | HIGH | MEDIUM | LOW
    outcome             VARCHAR(50) NOT NULL,   -- ALLOWED | PARTIALLY_DETECTED
    bypass_count        INTEGER NOT NULL,
    total_attack_count  INTEGER NOT NULL,
    bypass_rate         NUMERIC(5, 4) NOT NULL, -- 0.0 to 1.0
    simulated_exposure  NUMERIC(15, 2) NOT NULL,
    affected_entity_count INTEGER NOT NULL,
    repeatability_score NUMERIC(5, 4),          -- 0.0 to 1.0
    confidence_score    NUMERIC(5, 4),          -- 0.0 to 1.0
    ai_explanation_id   UUID REFERENCES ai_generations(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vulnerabilities_simulation_id ON vulnerabilities(simulation_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_policy_version_id ON vulnerabilities(policy_version_id);
```

### 3.23 vulnerability_evidence

Specific evidence records supporting a vulnerability.

```sql
CREATE TABLE vulnerability_evidence (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vulnerability_id    UUID NOT NULL REFERENCES vulnerabilities(id),
    transaction_id      UUID NOT NULL REFERENCES transactions(id),
    risk_decision_id    UUID NOT NULL REFERENCES risk_decisions(id),
    evidence_type       VARCHAR(100) NOT NULL,
    details             JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vulnerability_evidence_vulnerability_id ON vulnerability_evidence(vulnerability_id);
```

---

### 3.24 policy_patches

AI-proposed policy patch proposals.

```sql
CREATE TABLE policy_patches (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vulnerability_id        UUID NOT NULL REFERENCES vulnerabilities(id),
    source_policy_version_id UUID NOT NULL REFERENCES policy_versions(id),
    ai_generation_id        UUID REFERENCES ai_generations(id),
    proposed_changes        JSONB NOT NULL,     -- Array of PolicyRuleChange
    identified_weakness     TEXT NOT NULL,
    reasoning               TEXT NOT NULL,
    expected_benefit        TEXT NOT NULL,
    expected_fpr_impact     TEXT NOT NULL,
    expected_customer_friction TEXT,
    confidence              VARCHAR(20) NOT NULL, -- HIGH | MEDIUM | LOW
    status                  VARCHAR(50) NOT NULL DEFAULT 'PENDING_SIMULATION',
                            -- ENUM: PENDING_SIMULATION | SIMULATED | APPROVED | REJECTED
    approved_by             UUID REFERENCES users(id),
    approved_at             TIMESTAMPTZ,
    rejection_reason        TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_patches_vulnerability_id ON policy_patches(vulnerability_id);
CREATE INDEX idx_policy_patches_status ON policy_patches(status);
```

### 3.25 patch_simulations

Results of simulating a policy patch.

```sql
CREATE TABLE patch_simulations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patch_id                UUID NOT NULL REFERENCES policy_patches(id),
    original_simulation_id  UUID NOT NULL REFERENCES simulation_runs(id),
    replay_simulation_id    UUID REFERENCES simulation_runs(id),
    status                  VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    before_metrics          JSONB,              -- BenchmarkResults snapshot
    after_metrics           JSONB,              -- BenchmarkResults snapshot
    improvement_summary     JSONB,              -- Computed comparison
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMPTZ
);

CREATE INDEX idx_patch_simulations_patch_id ON patch_simulations(patch_id);
```

---

### 3.26 benchmark_runs

A benchmark evaluation run (70/15/15 split).

```sql
CREATE TABLE benchmark_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id       UUID NOT NULL REFERENCES simulation_runs(id),
    policy_version_id   UUID NOT NULL REFERENCES policy_versions(id),
    dataset_split       VARCHAR(20) NOT NULL,   -- development | validation | held_out
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_benchmark_runs_simulation_id ON benchmark_runs(simulation_id);
CREATE INDEX idx_benchmark_runs_dataset_split ON benchmark_runs(dataset_split);
```

### 3.27 benchmark_results

Computed metric values for a benchmark run.

```sql
CREATE TABLE benchmark_results (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_run_id        UUID NOT NULL REFERENCES benchmark_runs(id),
    precision               NUMERIC(6, 5),      -- 0.00000 to 1.00000
    recall                  NUMERIC(6, 5),
    f1_score                NUMERIC(6, 5),
    false_positive_rate     NUMERIC(6, 5),
    attack_success_rate     NUMERIC(6, 5),
    successful_bypasses     INTEGER,
    total_attacks           INTEGER,
    total_legitimate        INTEGER,
    simulated_exposure      NUMERIC(15, 2),
    exposure_reduction      NUMERIC(15, 2),     -- vs. baseline (null if baseline)
    customer_friction_score NUMERIC(6, 5),
    simulation_throughput   NUMERIC(10, 2),     -- transactions/second
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_benchmark_results_run_id ON benchmark_results(benchmark_run_id);
```

---

### 3.28 ai_generations

Full audit trail for every AI-generated output.

```sql
CREATE TABLE ai_generations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider                VARCHAR(50) NOT NULL,           -- e.g., "groq"
    model                   VARCHAR(100) NOT NULL,          -- e.g., "openai/gpt-oss-120b"
    module                  VARCHAR(100) NOT NULL,
                            -- ENUM: attack_planner | vulnerability_explainer
                            --       patch_generator | report_generator
    prompt_version          VARCHAR(100) NOT NULL,
    input_reference_id      UUID,                           -- FK to relevant input record
    input_reference_type    VARCHAR(100),                   -- Table name
    input_hash              VARCHAR(64) NOT NULL,           -- SHA-256 of structured input
    raw_output              TEXT NOT NULL,
    parsed_output           JSONB,
    validation_status       VARCHAR(50) NOT NULL,           -- PASSED | FAILED
    validation_errors       JSONB,
    simulation_run_id       UUID REFERENCES simulation_runs(id),
    policy_version_id       UUID REFERENCES policy_versions(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_simulation_run_id ON ai_generations(simulation_run_id);
CREATE INDEX idx_ai_generations_module ON ai_generations(module);
CREATE INDEX idx_ai_generations_validation_status ON ai_generations(validation_status);
```

---

### 3.29 audit_logs

Full application audit trail.

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id     UUID REFERENCES merchants(id),
    actor_user_id   UUID REFERENCES users(id),
    actor_type      VARCHAR(50) NOT NULL DEFAULT 'USER',
                    -- ENUM: USER | SYSTEM
    action          VARCHAR(100) NOT NULL,
                    -- ENUM: simulation_started | attack_plan_generated | attack_executed
                    --       bypass_detected | vulnerability_created | explanation_generated
                    --       patch_generated | patch_validated | patch_simulated
                    --       benchmark_executed | policy_approved | policy_rejected
                    --       user_login | user_logout | etc.
    entity_type     VARCHAR(100),   -- Table name of affected entity
    entity_id       UUID,           -- ID of affected entity
    details         JSONB,          -- Action-specific metadata
    ip_address      VARCHAR(45),    -- Client IP (real; for auth events)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_merchant_id ON audit_logs(merchant_id);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 4. Key Relationships Summary

| Relationship | Cardinality | Notes |
|---|---|---|
| user -> merchant | 1:1 (MVP) | One user owns one merchant |
| merchant -> risk_policies | 1:N | Merchant may have multiple named policies |
| risk_policy -> policy_versions | 1:N | Each policy has immutable version snapshots |
| policy_version -> policy_rules | 1:N | Each version contains its full rule set |
| merchant -> simulation_runs | 1:N | Multiple simulation runs per merchant |
| simulation_run -> customers | 1:N | Customers are scoped to a simulation |
| customer -> accounts | 1:N | Each customer may have multiple accounts |
| simulation_run -> transactions | 1:N | All transactions scoped to a simulation |
| transaction -> risk_decision | 1:1 | Each transaction has exactly one risk decision |
| attack_scenario -> vulnerabilities | 1:N | A scenario may produce multiple vulnerabilities |
| vulnerability -> policy_patches | 1:N | Each vulnerability may have multiple patch proposals |
| policy_patch -> patch_simulations | 1:N | A patch may be simulated multiple times |
| simulation_run -> benchmark_runs | 1:N | Multiple benchmark splits per simulation |
| benchmark_run -> benchmark_results | 1:1 | One result record per benchmark run |

---

## 5. Indexes Summary

Critical indexes for query performance:

- `transactions(simulation_id)` — most simulation queries filter by simulation
- `transactions(account_id)` — velocity rule evaluation
- `transactions(device_id)` — device velocity + graph queries
- `transactions(payment_instrument_id)` — instrument velocity
- `transactions(created_at_sim)` — time-window lookups for velocity rules
- `transactions(is_adversarial)` — split legitimate vs adversarial
- `transactions(dataset_split)` — benchmark queries
- `risk_decisions(outcome)` — bypass detection
- `vulnerabilities(severity)` — dashboard queries
- `audit_logs(created_at)` — time-based audit queries

---

*Document Version: 1.0.0*
*Created: 2026-08-20*
*Reference: riskfire-product-spec.md*
