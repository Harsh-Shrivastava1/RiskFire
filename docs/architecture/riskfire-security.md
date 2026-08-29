# RiskFire — Security Architecture

> Reference: [riskfire-product-spec.md](../product/riskfire-product-spec.md)
> Reference: [riskfire-ai-architecture.md](./riskfire-ai-architecture.md)

---

## 1. Security Philosophy

RiskFire is a **synthetic adversarial testing platform** — not a real fraud system. However, it must be built with production-grade security hygiene because:

1. It handles merchant configuration data and business logic
2. It generates and stores AI outputs that inform real policy decisions
3. It holds audit records that must be tamper-evident
4. It may store API keys for external services (Groq)
5. It operates in a hackathon context where the code will be publicly demonstrated

The security model is organized around four concerns:
1. **Synthetic data boundary** — preventing real credentials from entering the system
2. **API key handling** — secrets management
3. **AI output validation** — preventing AI from directly executing actions
4. **Authorization and auditability** — access control and audit trail

---

## 2. Synthetic Data Boundary

### 2.1 Principle

All data flowing through RiskFire's simulation, AI, and storage layers must be **synthetic**. Real payment credentials, real customer PII, and real transaction data must never enter the system.

### 2.2 Enforcement Points

| Layer | Enforcement |
|---|---|
| Frontend | UI contains no real payment form fields. Merchant configures policies (rules, thresholds), not real transactions. |
| API | Input schemas explicitly reject fields that could contain real payment data |
| Simulation Engine | All entity generators produce synthetic data from seeded RNG |
| AI Layer | Prompts receive only structured synthetic IDs and aggregate statistics |
| Database | Schema contains `masked_identifier` (synthetic, e.g., XXXX-XXXX-XXXX-4242) — never real card numbers |

### 2.3 Schema-Level Protection

The `payment_instruments` table stores only:
- `masked_identifier` (synthetic, e.g., `SYNTH-4242`)
- `instrument_type` (CARD / UPI / WALLET)
- Metadata (device associations, timing)

There is **no column** for CVV, PIN, full card number, UPI PIN, or bank credentials. These cannot be stored because the schema does not support them.

### 2.4 UI Disclaimer

The UI must display a persistent disclaimer on all financial metrics:

> **All financial exposure figures are simulated estimates based on synthetic data. They do not represent actual merchant losses or real transaction values.**

---

## 3. API Key and Secret Handling

### 3.1 Environment Variables Only

All secrets must be environment variables. Never committed to source control.

Required environment variables:
```
GROQ_API_KEY=
DATABASE_URL=
JWT_SECRET=
REDIS_URL=
ALLOWED_ORIGINS=
```

### 3.2 `.env.example`

The repository includes `.env.example` with placeholder values and comments, but never `.env` with real values.

`.gitignore` must include:
```
.env
*.env
*.key
*.pem
*.secret
```

### 3.3 Secret Rotation

In production deployment:
- API keys should be rotated periodically
- JWT secrets should have an expiry policy
- Database credentials should use role-based access (not superuser credentials in the application)

### 3.4 Secrets in Audit Logs

The `ai_generations` audit table stores AI inputs and outputs. It must **never** store:
- `GROQ_API_KEY` or any other secret
- Full HTTP request headers containing authorization tokens
- Raw JWT tokens

Only structured input hashes and parsed outputs are stored.

---

## 4. AI Output Validation

### 4.1 The Trust Boundary

AI outputs are **untrusted** until validated. The trust boundary is:

```
Groq API Response (raw text)
    |
    v
[UNTRUSTED ZONE]
    |
    v
JSON parsing (try/except)
    |
    v
Pydantic schema validation
    |
    v
Domain validator (AttackValidator, etc.)
    |
    v
[TRUSTED ZONE — structured, validated data]
    |
    v
Deterministic engines / database
```

**No AI output ever crosses from untrusted to trusted without passing both validation layers.**

### 4.2 Validation Failures

If AI output fails validation:
1. The raw output is logged to `ai_generations` with `validation_status = FAILED`
2. Validation errors are stored in `ai_generations.validation_errors`
3. An error is returned to the caller
4. No downstream action is taken — no simulation, no policy change, no database write

### 4.3 Prompt Injection Mitigation

RiskFire never passes raw user input directly into AI prompts. All AI inputs are:
- Structured Pydantic objects serialized to JSON
- Loaded from database records (not from HTTP request bodies)
- Stripped of any free-form text from the merchant

This means a malicious merchant cannot inject prompt instructions into the attack planner by entering them in a text field.

### 4.4 AI Cannot Execute Actions

No AI module has access to:
- Database write functions
- Simulation execution functions
- File system
- Network requests (other than the AI provider itself)
- Policy activation functions

All AI modules receive structured input and return structured output. Downstream execution is handled by separate service classes.

---

## 5. Authentication and Authorization

### 5.1 Authentication

All protected API routes require a valid JWT token:
- JWT issued on successful login
- JWT contains: `user_id`, `merchant_id`, `role`, `exp`
- JWT signed with `JWT_SECRET` (HS256 minimum; RS256 recommended for production)
- JWT expiry: 24 hours for access tokens; 30 days for refresh tokens (MVP: access token only)

### 5.2 Authorization (Role-Based Access)

| Role | Permissions |
|---|---|
| `merchant_admin` | Full access — configure policies, run simulations, approve patches, view all data |
| `risk_analyst` | Run simulations, view vulnerabilities and patches, cannot approve policy changes |
| `read_only` | View all reports, dashboards, and audit logs — no write access |

### 5.3 API Authorization Checks

FastAPI dependency injection enforces role checks:

```python
from fastapi import Depends, HTTPException, status

async def require_merchant_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.MERCHANT_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires merchant admin role",
        )
    return current_user
```

### 5.4 Merchant Data Isolation

Every database query for simulation data, vulnerability data, and policy data must filter by `merchant_id`. No cross-merchant data access is possible:

```python
# Every query pattern includes merchant_id filter
SELECT * FROM simulation_runs 
WHERE merchant_id = :merchant_id  -- Always scoped to current merchant
AND id = :simulation_id;
```

---

## 6. API Security

### 6.1 CORS

`ALLOWED_ORIGINS` environment variable controls CORS. In development: `http://localhost:5173`. In production: only the deployed frontend domain.

### 6.2 Rate Limiting

Recommended rate limits (MVP: implement if time permits):
- Login endpoint: 10 requests/minute per IP
- Simulation start: 5 requests/minute per merchant
- AI generation endpoints: internally rate-limited by Groq API quotas

### 6.3 Input Validation

All API inputs are validated with Pydantic. No raw SQL string construction from user input. SQLAlchemy ORM with parameterized queries only.

### 6.4 HTTPS

In production deployment, all communication must be over HTTPS. The application itself does not terminate TLS — this is handled by a reverse proxy (nginx, Caddy, or cloud load balancer).

---

## 7. Auditability

### 7.1 What Is Audited

Every state-changing action is logged to `audit_logs`:

| Action | Actor Type | Sensitive? |
|---|---|---|
| User login / logout | USER | No |
| Simulation started | USER | No |
| Attack plan generated | SYSTEM (AI) | No |
| Attack plan validation failed | SYSTEM | No |
| Bypass detected | SYSTEM | No |
| Vulnerability created | SYSTEM | No |
| AI explanation generated | SYSTEM (AI) | No |
| Patch generated | SYSTEM (AI) | No |
| Patch simulation started | USER | No |
| Benchmark executed | SYSTEM | No |
| Policy patch approved | USER | **Yes** — records approver |
| Policy patch rejected | USER | **Yes** — records rejector + reason |

### 7.2 Audit Log Immutability

Audit log records must never be modified or deleted. The `audit_logs` table has no `UPDATE` or `DELETE` permissions in the application database role. Read and INSERT only.

### 7.3 AI Generation Traceability

Every AI output is linked to:
- The specific simulation run and policy version in context
- The SHA-256 hash of the structured input (so the input can be verified)
- The prompt version used
- The validation outcome

This allows any AI-influenced decision (e.g., an approved policy patch) to be traced back to the exact AI input, model, and output that produced it.

---

## 8. Data Retention (Future Consideration)

For the hackathon prototype, all data is retained indefinitely. In production:
- Simulation data: 90-day retention policy
- Audit logs: 2-year minimum retention
- AI generation logs: aligned with simulation data retention

---

## 9. What RiskFire Must Never Do

| Action | Reason |
|---|---|
| Execute real payments | Not a payment gateway; synthetic only |
| Connect to real card networks | No Razorpay production API access |
| Store real CVV / PIN / card numbers | Schema-level prevention |
| Allow AI to approve policy changes | Merchant must approve all changes |
| Hard-code API keys | Environment variables only |
| Log secrets in audit records | Audit contains hashes, not secrets |
| Allow cross-merchant data access | merchant_id filter on all queries |
| Present simulated figures as real losses | UI disclaimer required |

---

*Document Version: 1.0.0*
*Created: 2026-08-20*
*Reference: riskfire-product-spec.md*
