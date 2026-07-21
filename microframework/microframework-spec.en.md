> 🌐 **Language / Idioma:** English · [Español](microframework-spec.md)

# Micro-framework v1.0 Specification

## What the micro-framework is

A lightweight set of principles, rules, patterns, and templates that guide the design and
organization of LC/NC solutions in n8n, without imposing a rigid architecture or specific
tools. Its purpose is to translate Clean Architecture and DevSecOps principles into n8n's
visual and operational context.

It is not a code framework. It requires no libraries to install and no modification of n8n
itself. It is a set of design decisions and conventions applied when building flows.

---

## Stage metamodel

Every flow that implements the micro-framework is organized into four logical stages. Each
stage corresponds to a subflow invoked via `Execute Workflow`.

### E1 — Input validation

**Responsibility:** Verify that the input payload complies with the defined contract before
passing data to the business logic.

**Mandatory rules:**
- Validate the presence of all required fields
- Validate data types
- Validate ranges where applicable (numeric values, string length)
- Generate a unique `run_id` at the start of each execution
- Capture `start_ts` at the start
- Emit a structured log with the validation result
- Return `{ valido: boolean, errores: string[], run_id, start_ts, payload/reading }`
- If `valido === false`, the orchestrator must respond with 400 or 422 without continuing

**Recommended rules:**
- Normalize input data at this stage (rounding, lowercasing, trimming)
- Include the number of errors found in the log, not just the boolean

**Antipattern:** Mixing validation with business logic in the same node.

### E2 — Domain logic

**Responsibility:** Apply pure business rules. It knows nothing about databases, external
APIs, or notification channels.

**Mandatory rules:**
- Centralize all business rules in constants defined at the top of the Code node (not
  hardcoded in scattered IF conditions)
- Make no HTTP calls or database operations at this stage
- Emit a structured log with the analysis result and the rule applied
- Return the result enriched with domain decisions

**Recommended rules:**
- Document each rule with an identifier (R001, R002, etc.)
- Include the applied rule's identifier in the output for traceability

**Antipattern:** Making an HTTP call to an external service inside E2 to "enrich" data
before making the business decision.

### E3 — Integration adapters

**Responsibility:** Translate the domain result into the format required by the external
system and execute the integration.

**Mandatory rules:**
- Generate an idempotency key before every write: `{run_id}-{operation}` or
  `{business_id}-{timestamp}`
- Use n8n credentials, never hardcoded values in the node
- Enable native retry on HTTP Request nodes (minimum 2 retries, 1000ms wait)
- Emit a structured log with the segment duration, idempotency key, and result
- Contain no business logic: only format transformation and the call to the external system

**Recommended rules:**
- Include the `Idempotency-Key` header in HTTP calls when the external service supports it
- Capture the ID of the created record and propagate it in the output

**Antipattern:** Calculating thresholds or making classification decisions inside the
adapter.

### E4 — Controlled output

**Responsibility:** Produce the final response or notification, routing by channel when
applicable.

**Mandatory rules:**
- Structure the response according to the documented output contract
- Include `run_id` in every output response
- Use routing based on the level or result determined in E2, not recalculated in E4
- Enable retry on external notifications

**Recommended rules:**
- Emit a closing log with the total execution duration (`end_ts - start_ts`)
- For notifications, log whether it was sent or skipped (normal level)

---

## Micro-framework mandatory rules

The following rules apply to every flow that adopts the micro-framework. Each has a binary
verification criterion (pass / fail).

| ID | Rule | Verification criterion |
|----|-------|--------------------------|
| REG-001 | No flow has hardcoded credentials in nodes | The flow's exported JSON contains no tokens, API keys, or passwords as literal values |
| REG-002 | Every flow has a `run_id` from E1 that propagates to all subflows | The `run_id` field appears in every subflow's output and in every log entry |
| REG-003 | Every orchestrator flow has `errorWorkflow` configured in its settings | The JSON's `settings.errorWorkflow` field is not empty |
| REG-004 | External integrations have retry enabled | The HTTP Request node has `options.retry.enabled: true` |
| REG-005 | Database writes include idempotency control | The insert query includes `ON CONFLICT ... DO NOTHING` or equivalent |
| REG-006 | Every stage emits a structured JSON log | The Code node of every stage includes `console.log(JSON.stringify({...}))` with the minimum fields |
| REG-007 | Business logic is isolated in E2 | The E2 subflow contains no HTTP Request nodes or database nodes |
| REG-008 | External integrations live in E3 | HTTP Request and database nodes are exclusively in E3 and E4 |
| REG-009 | The orchestrator flow responds with appropriate HTTP status codes | 200 for success, 400/422 for invalid input, 401 for failed authentication |
| REG-010 | Every flow has at least one documented ADR | The case's `adr/` folder contains at least one versioned ADR file |

## Micro-framework recommended rules

| ID | Rule | Benefit |
|----|-------|-----------|
| REC-001 | Normalize input data in E1 (rounding, format) | Reduces inconsistencies in E2 and E3 |
| REC-002 | Document business rules with identifiers in E2 | Facilitates traceability in ATAM and ADRs |
| REC-003 | Include the `Idempotency-Key` header in HTTP Request | Native support if the external service implements it |
| REC-004 | Capture `start_ts` and `end_ts` per stage to measure latency | Allows computing per-segment latency without external tools |
| REC-005 | Include `location` or sensor/user context in logs | Facilitates diagnosis without opening the n8n execution history |
| REC-006 | Use `saveDataSuccessExecution: "all"` in evaluation environments | Allows reviewing historical executions during measurement |

---

## Architecture checklist (binary items)

Apply before versioning any to-be flow:

```
[ ] REG-001: exported JSON without hardcoded credentials
[ ] REG-002: run_id present in the output of all subflows
[ ] REG-003: errorWorkflow configured in the orchestrator's settings
[ ] REG-004: retry enabled on all HTTP Request nodes
[ ] REG-005: writes with idempotency control
[ ] REG-006: structured JSON log at every stage
[ ] REG-007: E2 without HTTP or database nodes
[ ] REG-008: integrations only in E3 and E4
[ ] REG-009: appropriate HTTP status codes in responses
[ ] REG-010: at least one ADR documented in the adr/ folder
```

## DevSecOps checklist (binary items)

```
[ ] No API keys, tokens, or passwords in the flow's JSON
[ ] No sensitive data in log fields (no logging user tokens)
[ ] External integration credentials are created in n8n Credentials
[ ] The real .env file is not tracked in Git (.gitignore includes .env)
[ ] .env.example is up to date with all necessary variables
[ ] The input webhook validates authentication before processing data
[ ] Integration endpoints use HTTPS in production environments
[ ] The error flow does not expose internal system details in its response to the client
```

---

## Documented patterns

### Pattern: Retry with backoff in integrations

**Problem:** External services fail transiently due to timeouts, rate limits, or network
instability.

**Solution:** Enable n8n's native HTTP Request node retry with a wait between attempts:

```json
"options": {
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenTries": 2000
  }
}
```

**Trade-off:** Increases total latency in the event of failure, but guarantees that
transient errors don't result in lost tickets or readings.

> **Platform limitation (n8n v1.x):** The `waitBetweenTries` field implements a **flat**
> interval in ms, not exponential. The micro-framework documentation specifies
> "exponential backoff" as a design goal; in n8n it is approximated with a conservative
> flat value (≥1000ms). True backoff requires a Code node with an explicit loop or
> delegating to an external API Gateway.

### Pattern: Idempotency with composite key

**Problem:** Automatic retries can create duplicate records in the database.

**Solution:** Generate an idempotency key before each write and use
`ON CONFLICT DO NOTHING`:

```javascript
const idempotency_key = `${run_id}-ticket`;
// or for IoT:
const idempotency_key = `${sensor_id}-${timestamp}`;
```

```sql
INSERT INTO tabla (idempotency_key, ...) 
VALUES ('...', ...) 
ON CONFLICT (idempotency_key) DO NOTHING 
RETURNING id;
```

**Trade-off:** Requires a UNIQUE index on the `idempotency_key` column, which adds write
overhead.

### Pattern: Structured log per stage

**Problem:** n8n's execution history is not programmatically queryable and doesn't allow
computing per-segment latency.

**Solution:** Emit a `console.log` with JSON in every Code node of every stage:

```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E2_dominio_iot',
  status: 'ok',
  nivel,
  e2_start,
  e2_end,
  duracion_ms: new Date(e2_end) - new Date(e2_start)
}));
```

**Trade-off:** Slightly increases execution time due to serialization overhead.
Completely negligible compared to the diagnostic benefit.

### Pattern: Routing by level in E4

**Problem:** Notifications must be differentiated by severity (critical vs. warning) with
different channels and urgency.

**Solution:** Use the level determined in E2 for routing in E4 with chained IF nodes:

```
IF analisis.requiereNotificacion === true
  │
  ├── true → IF analisis.nivel === 'critico'
  │               │
  │               ├── true  → HTTP POST /notificaciones/critico (retry 3)
  │               └── false → HTTP POST /notificaciones/warning (retry 2)
  │
  └── false → Log skip (normal level)
```

**Trade-off:** Adds latency from the extra IF nodes. Negligible compared to the benefit of
differentiated channels.

---

### Pattern: Timestamp authority in time-series flows

**Applicable to:** E1 flows that receive timestamps from external sources (IoT sensors,
event webhooks).

**Problem:** Using the server clock as the timestamp breaks idempotency: two submissions of
the same physical reading generate different keys if they arrive at different instants.

**Solution:** E1 uses the client's (sensor/producer) timestamp as the authority.
Additionally validates the maximum acceptable drift:

```javascript
// Use the client's timestamp, not the server's
const sensorTime = new Date(body.timestamp);
const diffMs = sensorTime - new Date();
if (diffMs > 5 * 60 * 1000) {
  errores.push(`timestamp in the future by ${Math.round(diffMs/1000)}s (max 300s)`);
}
```

**Mandatory normalization (ADR-008):** Convert to ISO 8601 before propagating:
```javascript
timestamp: new Date(body.timestamp).toISOString()
```

**Trade-off:** Sensors with a misconfigured clock are rejected in E1. Historical data
(past timestamp with no limit) is accepted — restricting backfill is out of the
micro-framework's scope.

---

## Known platform limitations (n8n v1.x)

Identified during the implementation of the IoT case (PHASE 4, 2026-05-02):

| Limitation | Impact | Alternative |
|------------|---------|-------------|
| `waitBetweenTries` is a flat interval, not exponential | The Retry with backoff pattern is only approximable | Code node with loop + sleep, or API Gateway |
| Error handlers (`errorWorkflow`) cannot do Respond to Webhook | The client already received a timeout before the handler finishes | Design the 500 response in the orchestrator before the failure if possible |
| Code nodes reference other nodes by display name (`$('Node name').item.json`) | Renaming a node silently breaks references | Pass all needed context in each node's output; avoid cross-references between nodes in the same subflow |
| Output contracts (JSON Schema) are not validated at runtime | A subflow can violate its contract without n8n detecting it | The static validator (`validar-flujos.mjs`) can be extended to verify output structure |
| Execute Workflow assigns dynamic IDs on each installation | Orchestrators need manual ID updates after import | Import protocol documented in `medicion/protocolo-evidencias.md` §3 |

---

## Documented antipatterns

| Antipattern | Description | Consequence |
|-------------|-------------|-------------|
| Monolithic flow | All logic in a single flow with no subflows | High change impact: any modification can affect the whole flow |
| Credentials in nodes | API keys or tokens as literal values in node configuration | Secret exposure in the flow's exported JSON |
| Missing validation | Processing the input payload without checking required fields | Failures in later stages with ambiguous error messages |
| Logic in adapters | Business rules or calculations inside the integration adapter | Logic duplication, makes it harder to modify rules without touching integrations |
| No idempotency | Writes without duplicate control | Retries silently create duplicate records |
| No structured log | Only n8n's execution history as a diagnostic source | Impossible to compute per-segment latency or correlate events |
| No error flow | Not configuring `errorWorkflow` in the orchestrator | Failures are neither recorded nor notified — they are operationally invisible |

---

## Minimum observability guide

Every micro-framework flow must log at least the following events:

### Execution start (E1)
```json
{ "run_id": "...", "etapa": "E1_validacion", "status": "ok|fail", "errores": [], "start_ts": "..." }
```

### Domain result (E2)
```json
{ "run_id": "...", "etapa": "E2_dominio", "status": "ok", "resultado_clave": "...", "regla_aplicada": "R001", "e2_start": "...", "e2_end": "...", "duracion_ms": 12 }
```

### Persistence result (E3)
```json
{ "run_id": "...", "etapa": "E3_adaptador", "status": "ok", "idempotency_key": "...", "registro_id": "...", "e3_start": "...", "e3_end": "...", "duracion_ms": 45 }
```

### Notification result (E4)
```json
{ "run_id": "...", "etapa": "E4_notificacion", "status": "ok|skip", "notificacion_enviada": true, "nivel": "critico", "e4_start": "...", "e4_end": "...", "duracion_ms": 38 }
```

> **REC-005:** Include `sensor_id` (IoT) or `user_id` (Bot) in E1 and E2 logs to be able to
> filter by entity without parsing the `run_id` or `idempotency_key`.
