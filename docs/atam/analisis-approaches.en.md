> 🌐 **Language / Idioma:** English · [Español](analisis-approaches.md)

# Analysis of Architectural Approaches — ATAM Steps 4 and 6

**Version:** 1.0
**Date:** 2026-05-07
**Author:** Elian Hernando Gil Sierra
**Methodological framework:** [`metodologia-atam-adaptada.en.md`](metodologia-atam-adaptada.en.md)
**Purpose:** Produce the analytical deliverables corresponding to Steps 4 (Identify architectural approaches) and 6 (Analyze approaches, identifying SP/TP/R/NR) of the ATAM method, applied to the to-be architectures of the two case studies.

---

## 1. Identification of architectural approaches (ATAM Step 4)

### 1.1 Operational definition

An **architectural approach** in the ATAM sense is a decision, pattern, tactic, or explicit strategy that the architect adopts to satisfy one or more quality attributes. In this project, the approaches are materialized in the mandatory rules (REG-001…010), the five documented patterns, the ADR decisions (19 total), and the structural components of the E1–E4 metamodel.

The inventory below lists twelve architectural approaches identified in the to-be design, each with its origin, the ISO/IEC 25010 attributes it aims to satisfy, and its known trade-offs.

### 1.2 Approach inventory

#### AP-01 — Separation into four stages (E1–E4)

**Description.** The to-be design decomposes each flow into four functional stages with a single responsibility: E1 validates input, E2 applies domain rules, E3 executes integrations with external systems, E4 produces output or notification. Each stage is an n8n subflow invocable via `Execute Workflow` and communicates with the others through explicit JSON Schema contracts.

**Origin.** Bot ADR-001 (flow responsibility separation) + IoT ADR-001 (4-stage pipeline). Inspired by Clean Architecture (Martin, 2017), which separates frameworks/drivers (E1), entities/use cases (E2), interface adapters (E3), and external interfaces (E4).

**Attributes affected.**
- Maintainability / Modularity ↑↑ — each stage changes independently
- Maintainability / Reusability ↑ — subflows invocable from multiple orchestrators
- Efficiency / Time behavior ↓ — Execute Workflow overhead in n8n (+119–192% in IoT)

**Associated rules.** REG-007 (isolated domain), REG-008 (integrations in E3/E4), REG-010 (centralized orchestration).

**Related ATAM scenarios.** BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2, IOT-Q5.

**Known trade-offs.** The latency overhead introduced by modularization is significant in IoT (+119–192%) and minimal in Bot (+2–9%). It is documented as an accepted trade-off in IoT ADR-001, prioritizing maintainability over latency, in line with the pre-project's drivers.

---

#### AP-02 — Subflows as deployment units (Execute Workflow)

**Description.** Each E1–E4 stage is implemented as an independent n8n subflow with its own lifecycle, importable and exportable as isolated JSON. The orchestrator invokes them by ID via the `Execute Workflow` node. Subflows can be updated without touching the orchestrator as long as the contract is preserved.

**Origin.** Bot and IoT ADR-001. Pattern equivalent to the "Microflow" or "Sub-workflow" recommended by n8n's own documentation for medium-to-high complexity systems.

**Attributes affected.**
- Maintainability / Modularity ↑↑ — localized changes
- Reusability ↑ — a subflow can be invoked from multiple orchestrators (unrealized potential in this scope, but architecturally available)
- Efficiency / Time behavior ↓ — each `Execute Workflow` costs ~30–50 ms in self-hosted n8n

**Associated rules.** REG-010 (centralized orchestration).

**Related ATAM scenarios.** BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2.

**Known trade-offs.** Same trade-off as AP-01: the cost of invocation between subflows is the main contributor to the latency overhead.

---

#### AP-03 — Secrets management via native n8n credentials

**Description.** No token, password, API key, or connection string appears as a literal in the flows' JSON. Every credential is referenced by the name of a credential configured in n8n, which internally encrypts them on disk and injects them at runtime without exposing them in exports.

**Origin.** ADR-MF-001 (secrets management), REG-001.

**Attributes affected.**
- Security / Confidentiality ↑↑ — auditable exports without risk
- Maintainability / Operability ↑ — centralized credential rotation

**Associated rules.** REG-001 (no secrets in exported JSON).

**Related ATAM scenarios.** BOT-Q3, IOT-Q6.

**Known trade-offs.** Creates an operational dependency: the flows do not run on a new n8n instance without reconfiguring the credentials. Mitigable with a provisioning script, out of scope.

---

#### AP-04 — Retry pattern with configurable backoff

**Description.** The HTTP nodes in E3 (integrations) and E4 (notifications) declare `options.retry.enabled = true` with `maxRetries` and `waitBetweenTries` configured according to the criticality of the channel: IoT uses `maxRetries=3` for CRITICAL and `maxRetries=2` for WARNING; Bot uses `maxRetries=2` for the ticket service integration.

**Origin.** ADR-MF-002 (error workflow + retry), `patron-retry.md` pattern, REG-004.

**Attributes affected.**
- Reliability / Fault tolerance ↑↑ — transient network failures recovered automatically
- Efficiency / Time behavior ↓ — additional latency when retries occur (evidence: 30,011 ms outlier in IoT critical run-log)

**Associated rules.** REG-004 (retry on HTTP nodes).

**Related ATAM scenarios.** IOT-Q4, IOT-Q5, BOT-Q4 (partial).

**Known trade-offs.** Retries mask persistent (non-transient) failures: a service down for minutes consumes retry time with no recovery. Partially mitigated by the `maxRetries` limit and by the error workflow (AP-06).

---

#### AP-05 — Idempotency pattern with unique key

**Description.** Write operations use an idempotency key to prevent duplication. IoT computes `idempotency_key = SHA256(sensor_id + timestamp_normalizado)` in E2 and E3 inserts with `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING`. Bot sends an `Idempotency-Key` header derived from `mensaje_id` to the external ticket service.

**Origin.** IoT ADR-003 (sensor+timestamp idempotency), IoT ADR-007 (timestamp authority), `patron-idempotencia.md` pattern, REG-005.

**Attributes affected.**
- Reliability / Maturity ↑↑ — safe retries without duplicating data
- Functional suitability / Correctness ↑ — the system produces the same result given the same input

**Associated rules.** REG-005 (idempotency in write operations).

**Related ATAM scenarios.** BOT-Q4, IOT-Q3.

**Known trade-offs.** Requires availability of a unique field in the problem domain. In IoT it is solved with `sensor_id + timestamp`; in Bot it is assumed that the external service honors the `Idempotency-Key` header, which not all providers guarantee.

---

#### AP-06 — Error workflow with dead-letter

**Description.** Every to-be orchestrator declares in `settings.errorWorkflow` an error-handling flow that fires automatically on any uncaught exception. The error workflow extracts the context (failed node, error message, original payload), emits a structured JSON log, and, in IoT, inserts the payload into a `lecturas_sensor_dead_letters` table for later manual replay.

**Origin.** ADR-MF-002, IoT ADR-005 (error workflow with payload preservation), Bot ADR-006, `patron-error-boundary.md` pattern, REG-003.

**Attributes affected.**
- Reliability / Fault tolerance ↑ — failures do not propagate to the client as a silent 500
- Operability / Monitorability ↑↑ — operator has full context of the failure
- Functional suitability / Traceability ↑ — no critical sensor data is lost

**Associated rules.** REG-003 (configured error workflow).

**Related ATAM scenarios.** IOT-Q4, BOT-Q5.

**Known trade-offs.** The IoT error workflow shares a notification channel with E4 (mock-iot). Identified at runtime as **SP-IOT-01** (section 2). The PostgreSQL dead-letter is resilient to an E3 failure but assumes the DB is available, which is not true if E3 failed because the DB went down.

---

#### AP-07 — Structured JSON log per stage

**Description.** Each stage (E1, E2, E3, E4) and the error workflow emit exactly one `console.log(JSON.stringify({...}))` with minimum fields defined in `microframework/guia-observabilidad.md`: `run_id`, `etapa`, `status`, `start_ts`, stage-specific fields, and, when applicable, `errores` and `error_type`. The output goes to the n8n container's stdout and is queryable with `docker compose logs n8n | grep '"status":"fail"'`.

**Origin.** ADR-MF-003 (structured JSON log), REG-006, REC-004.

**Attributes affected.**
- Operability / Monitorability ↑↑ — failure diagnosis without opening the n8n UI
- Operability / Recoverability ↑ — MTTD measured at ~14 seconds vs ~5–10 minutes for as-is

**Associated rules.** REG-006 (structured log per stage).

**Related ATAM scenarios.** BOT-Q5, IOT-Q4 (partial — error-handler observability).

**Known trade-offs.** Logs on stdout are lost if the container restarts without a persistent volume. Documented mitigation: PostgreSQL dead-letter for critical data. In production this would be complemented with an aggregator (CloudWatch, ELK, Loki) — out of the project's scope.

---

#### AP-08 — Input validation with JSON Schema in E1

**Description.** E1 validates every incoming request against a JSON Schema (`microframework/contratos/{caso}-webhook-input.schema.json`) before passing it to E2. If the payload does not comply with the schema, E1 responds with HTTP 400/422 without invoking the subsequent stages. The validation covers types, required fields, numeric ranges, and string patterns.

**Origin.** IoT ADR-006 (schema validation in E1), Bot ADR-005 (authentication + validation), REG-009.

**Attributes affected.**
- Functional suitability / Correctness ↑↑ — the system does not accept malformed inputs
- Security / Integrity ↑ — prevents side effects from malicious inputs
- Efficiency / Time behavior ↑ — early rejections consume fewer resources (evidence: Bot Set C −42% p50)

**Associated rules.** REG-009 (input validation in E1).

**Related ATAM scenarios.** BOT-Q6, IOT-Q5 (partial).

**Known trade-offs.** Schema changes require version coordination with the clients calling the webhook. Acceptable because the contract is public and versioning is documented in ADRs.

---

#### AP-09 — Differentiated routing by alert level in IoT E4

**Description.** E4 of the IoT flow contains an IF node that routes the payload to one of two branches based on the `nivel` field (computed in E2): the CRITICAL branch executes HTTP notification with `maxRetries=3, waitBetweenTries=2000 ms`; the WARNING branch executes HTTP notification with `maxRetries=2`. Readings with `nivel=normal` do not notify.

**Origin.** IoT ADR-004 (E4 routing by severity).

**Attributes affected.**
- Reliability / Fault tolerance ↑ (asymmetric) — critical readings more resilient than warnings
- Efficiency / Time behavior ↓ (on critical) — additional overhead documented in TP-IOT-01 (section 2)

**Associated rules.** REG-008 (routing in E4).

**Related ATAM scenarios.** IOT-Q5 (differentiated urgency).

**Known trade-offs.** Explicitly documented trade-off: the greater resilience of the critical channel introduces +10.8 ms of nominal client-latency overhead vs. warning (measured in Set I — `analisis_iot_q5.py`).

---

#### AP-10 — Centralized domain constants in E2

**Description.** The numeric thresholds (critical temperature, CO2 warning/critical, high humidity) are defined as a single `UMBRALES` constant at the start of the IoT E2 Code node, instead of being scattered across IF nodes. Any threshold adjustment is made in a single location.

**Origin.** IoT ADR-002 (thresholds and vocabulary), pattern equivalent to "Named Constants", REG-007, REC-001.

**Attributes affected.**
- Maintainability / Modifiability ↑↑ — IoT CR1 touches 1 node vs. 6 in as-is (evidence: cr-log-iot-to-be)
- Traceability / Functional suitability ↑ — aligned with ASHRAE 62.1 and ISO 7730 (justified in ADR-002)

**Associated rules.** REG-007 (isolated domain logic).

**Related ATAM scenarios.** IOT-Q1.

**Known trade-offs.** Changing the simulated domain (environmental warehouse) requires reviewing the constant and producing a new ADR. Acceptable.

---

#### AP-11 — Automated static validation (validar-flujos.mjs)

**Description.** An executable Node.js script that walks through every flow JSON in the repository and verifies conformance with the 10 mandatory rules (REG-001…010). It detects hardcoded secrets (REG-001), absence of an error workflow (REG-003), absence of retry (REG-004), use of unstructured `console.log` (REG-006), etc. It generates a Markdown report in `microframework/validacion/reportes/`.

**Origin.** DevSecOps Pillar 2 of the micro-framework.

**Attributes affected.**
- Functional suitability / Governance ↑↑ — automatically verifiable conformance
- Maintainability / Modifiability ↑ — protects against regressions when editing flows
- Security / Confidentiality ↑↑ — automatic detection of literal secrets

**Associated rules.** All (REG-001 through REG-010 evaluable).

**Related ATAM scenarios.** BOT-Q3, IOT-Q6 (automated REG-001 verification).

**Known trade-offs.** False positives are possible if the detection regex is too strict. Acceptable for the traceability it provides.

---

#### AP-12 — Timestamp authority in IoT E1

**Description.** IoT E1 generates or normalizes the reading's `timestamp` using a centralized "time authority" (UTC, ISO 8601) instead of accepting the timestamp the sensor reports. If the sensor does not send a timestamp, E1 generates one with `new Date().toISOString()`. If it does send one, E1 validates it against a reasonable window (not in the future, not older than 24h).

**Origin.** IoT ADR-007 (timestamp authority).

**Attributes affected.**
- Functional suitability / Correctness ↑↑ — consistent timestamps
- Reliability / Maturity ↑ — foundation for idempotency (AP-05), which depends on a normalized timestamp
- Traceability ↑ — chronologically orderable events

**Associated rules.** None specific (case decision).

**Related ATAM scenarios.** IOT-Q3 (component for idempotency).

**Known trade-offs.** Overwriting a sensor's timestamp discards information about the device's clock drift. Acceptable in the simulated domain.

---

### 1.3 Approach × attribute map

| # | Approach | Maintainability | Reliability | Security | Operability | Functional Suitability | Efficiency |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| AP-01 | E1–E4 separation | ↑↑ |  |  |  |  | ↓ |
| AP-02 | Execute Workflow subflows | ↑↑ |  |  |  |  | ↓ |
| AP-03 | n8n credentials |  |  | ↑↑ | ↑ |  |  |
| AP-04 | Retry with backoff |  | ↑↑ |  |  |  | ↓ |
| AP-05 | Idempotency |  | ↑↑ |  |  | ↑ |  |
| AP-06 | Error workflow + dead-letter |  | ↑ |  | ↑↑ | ↑ |  |
| AP-07 | Structured JSON log |  |  |  | ↑↑ |  |  |
| AP-08 | JSON Schema validation E1 |  |  | ↑ |  | ↑↑ | ↑ |
| AP-09 | Differentiated routing IoT E4 |  | ↑ |  |  |  | ↓ |
| AP-10 | Constants in E2 | ↑↑ |  |  |  | ↑ |  |
| AP-11 | Static validation |  |  | ↑↑ |  | ↑↑ |  |
| AP-12 | Timestamp authority |  | ↑ |  |  | ↑↑ |  |

*Convention: ↑↑ = main positive effect · ↑ = secondary positive effect · ↓ = documented trade-off*

---

## 2. Analysis of approaches: SP / TP / R / NR classification (ATAM Step 6)

This section classifies the architectural findings derived from analyzing the 12 utility-tree scenarios against the 12 inventoried approaches. Each finding is identified with a unique code and documented with impacted scenario, related approaches, evidence, and, where applicable, recommended mitigation.

### 2.1 Sensitivity Points (decisions that mainly affect one attribute)

#### SP-BOT-01 — Idempotency-Key header as the sole defense against duplication in BOT-Q4

**Description.** Data integrity under ticket-service retries (BOT-Q4) depends exclusively on the `Idempotency-Key` header sent by E3 to the `/api/tickets` endpoint. If the external service does not honor or does not correctly process this header, BOT-Q4 fails at runtime even though the architecture itself is correct.

**Related approaches.** AP-05 (idempotency).
**Scenario.** BOT-Q4.
**Attribute mainly affected.** Reliability / Maturity.
**Evidence.** Bot ADR-005, `bot-e3-output.schema.json` contract (`idempotency_key` field mandatory).
**Severity.** Low (within the scope of the study, mock-bot honors the header).
**Recommended production mitigation.** Contractually agree with the service provider on the `Idempotency-Key` header's behavior and validate it with integration tests.

---

#### SP-IOT-01 — Error-handler channel coincides with the E4 channel

**Description.** The IoT error workflow's HTTP node (`iot-error-handler.json`) sends the error notification to the same service (`mock-iot:3002`) that caused the E4 failure. When mock-iot is completely down (ECONNREFUSED, not an HTTP error), the error handler's HTTP node also fails, blocking execution of the next node (insertion into `lecturas_sensor_dead_letters`).

**Related approaches.** AP-06 (error workflow), AP-04 (retry — `neverError: true` does not protect against connection errors).
**Scenario.** IOT-Q4.
**Attribute mainly affected.** Operability / Monitorability.
**Evidence.** Runtime test 2026-05-07 documented in `medicion/consolidado/mttd-resultado.md` §IOT-Q4-runtime; IoT ADR-005's negative consequences anticipate this case.
**Severity.** Medium — affects only the notification, not the persistence of the data (which is guaranteed by NR-IOT-01).
**Recommended production mitigation.** Error-notification channel independent from the business channel (e.g., AWS SNS, transactional email, direct PostgreSQL table with a separate digest service).

---

#### SP-BOT-02 — E1 log structure determines the MTTD of BOT-Q5

**Description.** The diagnosis time for authentication failures (BOT-Q5) directly depends on the fields included in the JSON log emitted by E1. If E1 does not include `etapa`, `errores[]`, and `unauthorized: true`, the operator cannot diagnose without opening the n8n UI, reverting to as-is behavior. Changes to the log structure directly impact the MTTD.

**Related approaches.** AP-07 (structured log), AP-08 (E1 validation).
**Scenario.** BOT-Q5.
**Attribute mainly affected.** Operability / Monitorability.
**Evidence.** `docs/protocolo-mttd.md`, `medicion/consolidado/mttd-resultado.md`.
**Severity.** Low — protected by REG-006 and by the static validator that checks the log structure.
**Recommended mitigation.** Contract test for the structured log schema, executable in CI.

---

### 2.2 Tradeoff Points (decisions that affect multiple attributes in opposite directions)

#### TP-GLOBAL-01 — Modularization with subflows vs. latency

**Description.** Decomposing the flow into E1–E4 subflows substantially improves modularity (CR impact Bot −81%, IoT −84%) but introduces measurable invocation overhead: Bot +2–9% p50, IoT +119–192% p50. The trade-off is asymmetric: in Bot the overhead is marginal, in IoT it is significant.

**Related approaches.** AP-01 (E1–E4 separation), AP-02 (Execute Workflow).
**Scenarios.** All maintainability scenarios (BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2) are positively affected; it negatively affects the perception of efficiency (not prioritized as a top-K attribute in this project).
**Attributes in tension.** Maintainability ↑↑ vs. Efficiency ↓.
**Quantified magnitude.**
- Bot: −81% nodes per CR at the cost of +9% p50 in Set A. Favorable trade-off.
- IoT: −84% nodes per CR at the cost of +119% p50 in Set A. Debatable trade-off — for systems with a strict latency SLA it might not be worth it.
**Evidence.** `medicion/consolidado/comparacion-2026-05-05.md`, `medicion/consolidado/metricas-derivadas.md`.
**Justified decision.** IoT ADR-001 explicitly documents that the project prioritizes maintainability over latency, in line with the pre-project's drivers.
**Recommended production mitigation.** n8n in clustered mode with parallel workers to reduce inter-subflow invocation overhead.

---

#### TP-IOT-01 — Critical channel resilience vs. nominal latency

**Description.** The differentiated routing in IoT E4 assigns `maxRetries=3` to the CRITICAL channel and `maxRetries=2` to the WARNING channel. The higher retry configuration improves the resilience of critical alerts (higher chance of delivery under transient failures) at the cost of higher average overhead: p50 critical = 183.2 ms vs. p50 warning = 172.4 ms (Δ = +10.8 ms, +6.3%).

**Related approaches.** AP-09 (differentiated routing), AP-04 (retry).
**Scenario.** IOT-Q5.
**Attributes in tension.** Reliability (critical) ↑ vs. Efficiency ↓.
**Quantified magnitude.** +10.8 ms nominal p50 · a 30,011 ms outlier on the critical branch confirms the retry activates at runtime (direct evidence of the mechanism's activation).
**Evidence.** `medicion/analisis_iot_q5.py`, `medicion/consolidado/metricas-derivadas.md` §IOT-Q5.
**Justified decision.** IoT ADR-004 — prioritizing reliability over latency on the critical channel is consistent with the nature of the domain (environmental sensor alerts with operational consequences).
**Recommended mitigation.** In systems with a strict SLA, consider an asynchronous architecture with a dedicated queue for critical alerts (e.g., AWS SQS FIFO).

---

#### TP-GLOBAL-02 — Strict E1 validation vs. integration flexibility

**Description.** JSON Schema validation in E1 (AP-08) rejects with HTTP 400/422 any payload that does not comply with the contract. This improves functional correctness and reduces side effects (NR-BOT-01) but introduces rigidity: changes in the event producers (sensors, clients) require schema-versioning coordination.

**Related approaches.** AP-08 (schema validation), AP-12 (timestamp authority).
**Scenarios.** BOT-Q6 (positive), applies to any contract evolution.
**Attributes in tension.** Functional suitability / Correctness ↑↑ vs. Maintainability / Compatibility ↓.
**Quantified magnitude.** No direct metric; qualitative.
**Evidence.** Versioned `microframework/contratos/*.schema.json` contracts, IoT ADR-008 (E1 normalization).
**Justified decision.** The project explicitly prioritizes correctness — a sensor with an invalid timestamp or a bot client without a token must not be processed.
**Recommended mitigation.** Semantic schema versioning + `/v1`, `/v2`, etc. endpoints, with an explicit deprecation period.

---

### 2.3 Risks (decisions or absences that could compromise an attribute)

#### R-IOT-01 — Dead-letter not inserted if E4 is completely down

**Description.** When E4 fails with ECONNREFUSED (not an HTTP error), the error handler's HTTP node also fails for the same reason (SP-IOT-01), blocking execution of the next node that inserts into `lecturas_sensor_dead_letters`. The original payload remains only in the stdout JSON log, which is ephemeral if the container restarts.

**Related approaches.** AP-06 (error workflow + dead-letter), AP-04 (retry with `neverError: true`).
**Impacted scenarios.** IOT-Q4 (partially — the reading does persist in E3, but the dead-letter does not capture the failure context).
**Attributes at risk.** Traceability ↓ — failure context not auditable post-incident.
**Severity.** Medium — the sensor data is safe (NR-IOT-01) but the operator loses information about the failure.
**Probability.** Low in production if the notification channel has a high SLA; high in this test environment because mock-iot is deliberately stopped.
**Evidence.** Runtime test 2026-05-07 — row `iot-tobe-Q4-LIVE-0001-43e6e62` in `run-log-iot-to-be.csv`; IoT ADR-005's negative consequences anticipate this case.
**Recommended mitigation.**
1. Reorder the error handler so the PostgreSQL dead-letter occurs **before** the notification HTTP, not after.
2. Notification channel independent from the business channel.
3. Configure `continueOnFail: true` on the error handler's HTTP node so the Postgres node runs even if the HTTP fails.

---

#### R-BOT-01 — Token rotation out of the flow's scope

**Description.** The authentication token E1 validates (`api_source_token`) is stored as an environment variable or n8n credential, and rotating it requires manual intervention on the n8n instance. The flow has no auto-rotation mechanism nor detection of soon-to-expire tokens.

**Related approaches.** AP-03 (n8n credentials), AP-08 (E1 validation).
**Impacted scenarios.** BOT-Q3 (partially), general operational risk.
**Attributes at risk.** Security / Confidentiality — a compromised token remains valid until manual rotation.
**Severity.** Medium.
**Probability.** Low in the academic-project context; high in real production.
**Evidence.** Bot ADR-005, ADR-MF-001.
**Recommended mitigation.** Integration with AWS Secrets Manager or HashiCorp Vault with automatic rotation. Out of scope for micro-framework v1.0.

---

#### R-GLOBAL-01 — Log loss if the n8n container restarts without a persistent volume

**Description.** The structured logs emitted by the stages via `console.log` go to the container's stdout. If the container restarts without a persistent volume or an external collector (CloudWatch, ELK, Loki), the logs are lost. The MTTD protocol assumes `docker compose logs n8n --since 5m` is available.

**Related approaches.** AP-07 (structured log).
**Impacted scenarios.** BOT-Q5, IOT-Q4 (observability component).
**Attributes at risk.** Operability / Monitorability — diagnosis impossible if logs were lost.
**Severity.** Medium.
**Probability.** High in environments without operational discipline; low with a persistent volume.
**Evidence.** `docs/protocolo-mttd.md` §environment requirements.
**Recommended mitigation.** Integrate a log aggregator (CloudWatch on AWS — designed in R3). Document as a production deployment requirement.

---

#### R-GLOBAL-02 — Dependence on contract compliance by external services

**Description.** Idempotency (AP-05), routing (AP-09), and validation (AP-08) all assume that external services (mock-bot, mock-iot, PostgreSQL) honor their contracts. An unannounced change in the behavior of a mock or a real production service invalidates architectural guarantees.

**Related approaches.** AP-05, AP-09, AP-08.
**Impacted scenarios.** BOT-Q4, IOT-Q3.
**Attributes at risk.** Reliability — silent failures possible.
**Severity.** Low in this project (controlled mocks), high in production.
**Probability.** Medium.
**Evidence.** Architectural inference; not directly measurable without contract testing.
**Recommended mitigation.** Contract testing (Pact, Spring Cloud Contract) in a production CI/CD pipeline. Out of scope.

---

### 2.4 Non-Risks (decisions that clearly preserve the attribute)

#### NR-IOT-01 — E3 PostgreSQL is independent from E4

**Description.** Persisting the sensor reading in PostgreSQL (E3) happens **before** and **independently** of the notification to mock-iot (E4). Any failure or outage of mock-iot does not affect the integrity of the sensor data, which is already confirmed in the `lecturas_sensor` table with a unique `idempotency_key`.

**Related approaches.** AP-01 (E3/E4 separation), AP-05 (idempotency with ON CONFLICT).
**Scenarios covered.** IOT-Q4.
**Attribute preserved.** Reliability / Maturity — data integrity guaranteed.
**Evidence.** Runtime test 2026-05-07; the IoT orchestrator's structure confirms the E3 → E4 order; a PostgreSQL query post-failure will confirm persistence (verification pending in Plan Block A.1).

---

#### NR-BOT-01 — E1 validation prevents unauthorized side effects

**Description.** Authentication and schema validation in E1 rejects invalid requests with HTTP 401/400/422 **before** invoking E2/E3/E4. This prevents an invalid token or a malformed payload from triggering calls to the external ticket service, avoiding unauthorized side effects.

**Related approaches.** AP-08 (E1 validation), AP-01 (stage separation).
**Scenarios covered.** BOT-Q3 (partially), BOT-Q6.
**Attribute preserved.** Security / Integrity + Functional suitability.
**Evidence.** `run-log-bot-to-be.csv` Set C: 0% integration failures with the external service; latency Set C −42% (early rejection vs. full processing in as-is).

---

#### NR-IOT-02 — Idempotency prevents duplication even with client retries

**Description.** The `idempotency_key = SHA256(sensor_id + timestamp_normalizado)` key plus the `ON CONFLICT DO NOTHING` clause in E3 guarantees that sending the same reading twice (Input Set K) produces exactly one row in `lecturas_sensor`. Idempotency does not depend on internal retries but is also resilient to external duplicates.

**Related approaches.** AP-05 (idempotency), AP-12 (timestamp authority).
**Scenarios covered.** IOT-Q3.
**Attribute preserved.** Reliability / Maturity + Functional suitability / Correctness.
**Evidence.** `run-log-iot-to-be.csv` Set K: 0% failures · SQL query in PostgreSQL confirms 1 row per idempotency_key.

---

#### NR-GLOBAL-01 — Static validation protects against security regressions

**Description.** The `validar-flujos.mjs` script (AP-11) automatically detects the introduction of hardcoded secrets in any edited flow. An accidental modification that breaks REG-001 is blocked by the static validator before reaching production.

**Related approaches.** AP-11 (static validator), AP-03 (n8n credentials).
**Scenarios covered.** BOT-Q3, IOT-Q6.
**Attribute preserved.** Security / Confidentiality — defense in depth on top of AP-03.
**Evidence.** `microframework/validacion/reportes/validacion-2026-05-06.md` confirms 0 secrets detected in to-be.

---

#### NR-BOT-02 — Correct HTTP contract for authentication errors

**Description.** Bot E1 responds with the correct HTTP codes according to the error type: 401 for an invalid token, 400 for a malformed payload, 422 for invalid semantics. This complies with REST conventions and allows consuming clients to react appropriately without parsing the error body.

**Related approaches.** AP-08 (E1 validation).
**Scenarios covered.** BOT-Q6.
**Attribute preserved.** Functional suitability / Correctness.
**Evidence.** `run-log-bot-to-be.csv` Sets C and D: 100% of expected HTTP statuses.

---

### 2.5 Consolidated findings matrix

| ID | Type | Scenarios | Approaches | Attribute | Severity |
|---|---|---|---|---|---|
| SP-BOT-01 | Sensitivity | BOT-Q4 | AP-05 | Reliability | Low |
| SP-BOT-02 | Sensitivity | BOT-Q5 | AP-07, AP-08 | Operability | Low |
| SP-IOT-01 | Sensitivity | IOT-Q4 | AP-06, AP-04 | Operability | Medium |
| TP-GLOBAL-01 | Tradeoff | BOT-Q1/Q2, IOT-Q1/Q2 | AP-01, AP-02 | Maintainability ↑ vs. Efficiency ↓ | — |
| TP-GLOBAL-02 | Tradeoff | BOT-Q6 + evolutionary | AP-08, AP-12 | Functional suitability ↑ vs. Maintainability ↓ | — |
| TP-IOT-01 | Tradeoff | IOT-Q5 | AP-09, AP-04 | Reliability ↑ vs. Efficiency ↓ | — |
| R-BOT-01 | Risk | BOT-Q3 + general | AP-03 | Security | Medium |
| R-IOT-01 | Risk | IOT-Q4 | AP-06, AP-04 | Traceability | Medium |
| R-GLOBAL-01 | Risk | BOT-Q5, IOT-Q4 | AP-07 | Operability | Medium |
| R-GLOBAL-02 | Risk | BOT-Q4, IOT-Q3 | AP-05, AP-08, AP-09 | Reliability | Low-Medium |
| NR-BOT-01 | Non-risk | BOT-Q3, BOT-Q6 | AP-08, AP-01 | Security + Functional suitability | — |
| NR-BOT-02 | Non-risk | BOT-Q6 | AP-08 | Functional suitability | — |
| NR-IOT-01 | Non-risk | IOT-Q4 | AP-01, AP-05 | Reliability | — |
| NR-IOT-02 | Non-risk | IOT-Q3 | AP-05, AP-12 | Reliability | — |
| NR-GLOBAL-01 | Non-risk | BOT-Q3, IOT-Q6 | AP-11, AP-03 | Security | — |

**Totals:** 3 Sensitivity Points · 3 Tradeoff Points · 4 Risks · 5 Non-Risks.

---

## 3. Interpretive synthesis

The analysis of the 12 architectural approaches against the 12 top-K scenarios produces 15 formal findings. The distribution is healthy for a to-be design: **5 Non-Risks** confirm that the key decisions preserve the prioritized attributes, **3 Tradeoff Points** explicitly documented (especially TP-GLOBAL-01 on subflows vs. latency) show that the architectural team (in this case, the author) made informed decisions about the trade-offs, and the **4 Risks** identified are all of low-medium severity with clear mitigations — none blocking for the framework's viability.

The most relevant finding to discuss with the expert panel in Phase V is **TP-GLOBAL-01** (subflows vs. latency in IoT with +119–192%): it is the trade-off of greatest quantitative magnitude and the most questionable from a production SLA perspective. External validation can bring additional perspectives on whether the author's prioritization (maintainability over latency) is defensible across different framework-adoption contexts.

The **3 Sensitivity Points** are concentrated in fault-tolerance mechanisms (BOT-Q4 external idempotency, IOT-Q4 error handler, BOT-Q5 log structure), which is consistent with the distributed nature of n8n flows: the framework's strongest guarantees depend on contracts with external systems or on log structures that must remain stable.

This classification feeds directly into:
- The 1–5 as-is vs. to-be scoring matrix (`matriz-scoring.md`)
- The consolidated register of risks and trade-offs (`registro-riesgos-tradeoffs.md`)
- Chapters 5 and 6 of the final ATAM report (`informe-atam-final.md`)
- The preliminary-findings section of the survey's support material (`material-apoyo/resumen-proyecto.md`)
