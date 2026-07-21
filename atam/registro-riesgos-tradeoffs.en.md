> 🌐 **Language / Idioma:** English · [Español](registro-riesgos-tradeoffs.md)

# Consolidated Register of Architectural Risks and Trade-offs

**Version:** 1.0
**Date:** 2026-05-07
**Inputs:** `atam/analisis-approaches.md` §2, ADRs, quantitative evidence
**Purpose:** Consolidate into a single auditable register all the Sensitivity Points, Tradeoff Points, and Risks identified in the to-be ATAM evaluation, with their recommended mitigations and potential owners for production adoption. Non-Risks are omitted here since they are positive (they are discussed in the main report).

---

## 1. Register structure

Each register entry includes the following normalized fields:

- **ID** — unique identifier `[SP|TP|R]-[CASE|GLOBAL]-NN`
- **Type** — Sensitivity Point | Tradeoff Point | Risk
- **Title** — short description of the finding
- **Impacted scenarios** — utility-tree IDs
- **Related approaches** — AP-NN from the approach inventory
- **Attribute(s) affected** — ISO 25010
- **Extended description**
- **Magnitude / Severity / Probability** — qualitative or quantitative depending on availability
- **Evidence** — path to a repository artifact
- **Recommended mitigation** — actionable, with a time horizon
- **Suggested owner** — for production adoption
- **Status** — Open (unmitigated in this scope) | Mitigated | Accepted (explicit trade-off)

---

## 2. Sensitivity Points

### SP-BOT-01 — `Idempotency-Key` header as the sole defense against ticket duplication

- **Scenarios:** BOT-Q4
- **Approaches:** AP-05
- **Attribute:** Reliability / Maturity
- **Description.** The no-duplication guarantee on the external ticket service rests exclusively on that service correctly implementing the `Idempotency-Key` header. If the provider changes the header's behavior or deprecates it, BOT-Q4 ceases to be met even though the flow's architecture remains correct.
- **Severity:** Low in this project (controlled mock-bot); Medium in production.
- **Probability:** Low-Medium.
- **Evidence:** Bot ADR-005; `microframework/contratos/bot-e3-output.schema.json` declares `idempotency_key` as a mandatory field.
- **Recommended mitigation (short term):** CI integration test that sends the same ticket twice and verifies the service responds with 200 OK + the same ID (idempotency confirmed on the wire).
- **Recommended mitigation (medium term):** contractual agreement with the service provider + a local table of issued tickets with an N-day response cache for additional defense.
- **Suggested owner:** Tech Lead of the Bot flow.
- **Status:** Accepted (explicit trade-off with a documented external dependency).

---

### SP-BOT-02 — E1 log structure determines the MTTD of BOT-Q5

- **Scenarios:** BOT-Q5
- **Approaches:** AP-07, AP-08
- **Attribute:** Operability / Monitorability
- **Description.** The ~14-second MTTD depends on the JSON log emitted by E1 including the `etapa`, `errores[]`, and `unauthorized: true` fields. A careless refactor that changes the log structure directly impacts the MTTD and returns BOT-Q5 to as-is behavior.
- **Severity:** Low.
- **Probability:** Low (protected by the static validator + REG-006).
- **Evidence:** `medicion/protocolo-mttd.md`, `medicion/consolidado/mttd-resultado.md`.
- **Recommended mitigation (short term):** contract test of the structured log schema, executable in the CI pipeline before merge.
- **Recommended mitigation (medium term):** define the log schema as versioned JSON Schema in `microframework/contratos/log-estructurado-e1.schema.json` and validate it at runtime on every deploy.
- **Suggested owner:** Micro-framework maintainer + observability team.
- **Status:** Partially mitigated (the static validator covers the rule but not the log's internal structure).

---

### SP-IOT-01 — Error-handler channel coincides with the E4 channel

- **Scenarios:** IOT-Q4
- **Approaches:** AP-06, AP-04
- **Attribute:** Operability / Monitorability + Traceability
- **Description.** The IoT error workflow's HTTP node (`iot-error-handler.json`) notifies `mock-iot:3002/api/errors`, the same service that caused the E4 failure. When mock-iot is completely down (ECONNREFUSED, not an HTTP error), the error handler's HTTP also fails — the `neverError: true` option only covers non-2xx responses, not connection errors. The next node (insert into `lecturas_sensor_dead_letters`) is left blocked.
- **Severity:** Medium — affects post-incident audit capability; **does not affect the integrity of the sensor data** (guaranteed by NR-IOT-01: E3 PostgreSQL is independent).
- **Probability:** Low in production with a high-SLA notification channel; High in testing where mock-iot is deliberately stopped.
- **Evidence:** Runtime test 2026-05-07 — row `iot-tobe-Q4-LIVE-0001-43e6e62` in `run-log-iot-to-be.csv`; `mttd-resultado.md` §IOT-Q4-runtime; IoT ADR-005's negative consequences anticipate this case.
- **Recommended mitigation (short term):** reorder the error handler so the Postgres dead-letter node runs **before** the notification HTTP; add `continueOnFail: true` to the error handler's HTTP so the dead-letter occurs even if the notification fails.
- **Recommended mitigation (medium term):** notification channel independent from the business channel — AWS SNS, transactional email via SES, or a PostgreSQL table with a separate digest service consuming from it.
- **Suggested owner:** Tech Lead of the IoT flow.
- **Status:** Open — short-term mitigation feasible in the next iteration of the flow, not included in this scope.

---

## 3. Tradeoff Points

### TP-GLOBAL-01 — Modularization with subflows vs. client latency

- **Scenarios:** BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2 (positively affected); affects the perception of efficiency (not prioritized as top-K in this project).
- **Approaches:** AP-01, AP-02
- **Attributes in tension:** Maintainability / Modularity **↑↑** vs. Efficiency / Time behavior **↓**
- **Description.** Decomposing the flow into E1–E4 subflows invoked via `Execute Workflow` improves modularity in a quantifiable way (CR impact Bot −81%, IoT −84%) but introduces inter-subflow invocation overhead. The magnitude of the trade-off is asymmetric between the two cases.

**Data:**

| Case | Δ nodes per CR | Δ p50 Set A | Δ p50 Set B | Δ p50 Set C |
|---|:---:|:---:|:---:|:---:|
| Bot | −81% | +9% (+11 ms) | +2% (+2 ms) | −42% (−27 ms) |
| IoT | −84% | **+119%** (+93 ms) | **+134%** (+104 ms) | +53% (+23 ms) |

- **Acceptability:** Bot — favorable trade-off; the overhead is marginal and is offset by the improved modularity. IoT — debatable trade-off for systems with a strict latency SLA; accepted in this project due to the explicit prioritization declared in IoT ADR-001.
- **Evidence:** `medicion/consolidado/comparacion-2026-05-05.md`, `medicion/consolidado/metricas-derivadas.md`.
- **Recommended mitigation (short term):** explicitly document the trade-off in the framework's adoption guide (R5) so adopters with a strict SLA can make a conscious evaluation.
- **Recommended mitigation (medium term):** n8n in clustered mode with parallel workers; impact study of removing 1 intermediate subflow in scenarios where the E2/E3 separation adds no value.
- **Recommended mitigation (long term):** evaluation of alternative LC/NC platforms with lower inter-subflow invocation overhead.
- **Suggested owner:** Micro-framework maintainer + architect in the adoption context.
- **Status:** Accepted (documented and quantified trade-off).

---

### TP-GLOBAL-02 — Strict E1 validation vs. contract evolution flexibility

- **Scenarios:** BOT-Q6 (positive); applies to any contract-evolution scenario not listed in the utility tree.
- **Approaches:** AP-08, AP-12
- **Attributes in tension:** Functional suitability / Correctness **↑↑** vs. Maintainability / Compatibility **↓**
- **Description.** Strict rejection in E1 with HTTP 400/422 against JSON Schema improves functional correctness and reduces unauthorized side effects (NR-BOT-01), but introduces evolutionary rigidity: any schema change requires coordination with the event producers (sensors, Bot clients) and a transition period.
- **Acceptability:** Accepted — the project prioritizes correctness over flexibility because the cost of processing a malformed payload (an invalid reading entered into the DB; a ticket created with garbage data) is greater than the cost of coordinating versioning.
- **Evidence:** `microframework/contratos/*.schema.json` contracts, IoT ADR-008, IoT ADR-006.
- **Recommended mitigation (short term):** semantic schema versioning with an `X-API-Version` header and `/v1`, `/v2` endpoints.
- **Recommended mitigation (medium term):** explicit deprecation period (e.g., 90 days) with dual validation (accepting v1 and v2) before retiring v1.
- **Suggested owner:** Owner of the webhook contract (typically the flow's Tech Lead).
- **Status:** Accepted.

---

### TP-IOT-01 — Critical channel resilience vs. nominal latency

- **Scenarios:** IOT-Q5
- **Approaches:** AP-09, AP-04
- **Attributes in tension:** Reliability / Fault tolerance **↑** (on critical) vs. Efficiency / Time behavior **↓**
- **Description.** The differentiated routing in E4 assigns `maxRetries=3, waitBetweenTries=2000 ms` to the CRITICAL branch and `maxRetries=2` to WARNING. The higher retry configuration improves the delivery probability of critical alerts under transient failures, at the cost of higher nominal latency overhead.

**Data:**

| Level | p50 ms | p95 ms | max ms | Notes |
|---|:---:|:---:|:---:|---|
| normal | 157.6 | 174.4 | 179.5 | no notification |
| warning | 172.4 | 202.9 | 215.4 | 1 HTTP with retry=2 |
| **critical** | **183.2** | **222.0** | **30,011** | 1 HTTP with retry=3; outlier evidences active retry |

Δ(critical − warning) = +10.8 ms p50 (+6.3%).

- **Acceptability:** Accepted — prioritizing reliability over latency on the critical channel is consistent with the domain (environmental alerts with operational consequences).
- **Evidence:** `medicion/analisis_iot_q5.py`, `medicion/consolidado/metricas-derivadas.md` §IOT-Q5.
- **Recommended mitigation (short term):** none — the trade-off is desirable.
- **Recommended mitigation (medium term):** in systems with a strict latency SLA for critical alerts, consider an asynchronous architecture with AWS SQS FIFO or equivalent that decouples client latency from alert delivery.
- **Suggested owner:** Tech Lead of the IoT flow.
- **Status:** Accepted.

---

## 4. Risks

### R-BOT-01 — Token rotation out of the flow's scope

- **Scenarios:** BOT-Q3 (partially), general operational risk.
- **Approaches:** AP-03, AP-08
- **Attribute at risk:** Security / Confidentiality
- **Description.** The `api_source_token` token is stored as an environment variable or n8n credential and rotated manually. If the token is compromised (accidental leak, log exposure), it remains valid until human intervention. The flow does not detect tokens nearing expiration nor supports rotation without downtime.
- **Severity:** Medium.
- **Probability:** Low in the academic project; High in production with long-lived tokens.
- **Evidence:** Bot ADR-005, ADR-MF-001.
- **Recommended mitigation (short term):** operational policy of periodic rotation documented in a runbook (e.g., quarterly).
- **Recommended mitigation (medium term):** integration with AWS Secrets Manager or HashiCorp Vault with automatic rotation and support for "two simultaneously valid tokens" during the rotation window.
- **Recommended mitigation (long term):** migration to OAuth 2.0 client credentials with short-lived tokens (15 min) auto-refreshed.
- **Suggested owner:** Security team + Bot Tech Lead.
- **Status:** Open — out of scope for micro-framework v1.0; referenced for R3 (AWS design) and R5 (best-practices guide).

---

### R-IOT-01 — Dead-letter not inserted if E4 is completely down

- **Scenarios:** IOT-Q4 (partially — the reading does persist in E3 via NR-IOT-01, but the dead-letter does not capture the failure context).
- **Approaches:** AP-06, AP-04
- **Attribute at risk:** Traceability — failure context not auditable post-incident.
- **Description.** When E4 fails with ECONNREFUSED, the error handler's HTTP node also fails due to SP-IOT-01, blocking the insertion into `lecturas_sensor_dead_letters`. The original payload remains only in the stdout JSON log, which is ephemeral.
- **Severity:** Medium — the sensor data is safe (NR-IOT-01); the operator loses information about the failure context.
- **Probability:** Low in production with a high-SLA notification channel; High in this test environment.
- **Evidence:** Runtime test 2026-05-07.
- **Recommended mitigation (short term):** reorder the error handler (Postgres before HTTP) or add `continueOnFail: true` to the error handler's HTTP.
- **Recommended mitigation (medium term):** independent notification channel (see SP-IOT-01 mitigation).
- **Suggested owner:** IoT Tech Lead.
- **Status:** Open — short-term mitigation planned for the next iteration.

---

### R-GLOBAL-01 — Log loss if the n8n container restarts without a persistent volume

- **Scenarios:** BOT-Q5, IOT-Q4 (observability components).
- **Approaches:** AP-07
- **Attribute at risk:** Operability / Monitorability — diagnosis impossible if logs were lost.
- **Description.** The structured logs emitted by the stages via `console.log` are written to the container's stdout. If the container restarts without a persistent volume or an external collector (CloudWatch, ELK, Loki), the logs are lost. The MTTD protocol assumes availability of `docker compose logs n8n --since 5m`.
- **Severity:** Medium.
- **Probability:** High in environments without operational discipline; Low with a persistent volume or aggregator.
- **Evidence:** `medicion/protocolo-mttd.md` §environment requirements.
- **Recommended mitigation (short term):** document as a production deployment requirement in the best-practices guide (R5).
- **Recommended mitigation (medium term):** integrate a log aggregator (CloudWatch on AWS — designed in R3, AWS Architecture).
- **Suggested owner:** Operations team + micro-framework maintainer.
- **Status:** Open — mitigation inherent to the production design (R3).

---

### R-GLOBAL-02 — Dependence on contract compliance by external services

- **Scenarios:** BOT-Q4, IOT-Q3.
- **Approaches:** AP-05, AP-09, AP-08
- **Attribute at risk:** Reliability — silent failures possible if an external service changes behavior without notice.
- **Description.** The architectural guarantees of idempotency (AP-05), routing (AP-09), and validation (AP-08) assume that external services (mock-bot, mock-iot, PostgreSQL in production) honor their contracts. A silent deviation invalidates the guarantees without the flow detecting it.
- **Severity:** Low in the project (controlled mocks), High in production.
- **Probability:** Medium.
- **Evidence:** Architectural inference; not measurable without contract testing.
- **Recommended mitigation (short term):** post-deploy smoke tests that verify the external service's behavior (e.g., send the same idempotency_key twice and confirm expected behavior).
- **Recommended mitigation (medium term):** contract testing with Pact or Spring Cloud Contract in the CI/CD pipeline.
- **Suggested owner:** Tech Lead of each flow + the external service's team.
- **Status:** Open — out of scope for micro-framework v1.0.

---

## 5. Consolidated register matrix

| ID | Type | Severity | Probability | Status | Suggested owner |
|---|---|:---:|:---:|---|---|
| SP-BOT-01 | Sensitivity | Low-Medium | Low-Medium | Accepted | Bot Tech Lead |
| SP-BOT-02 | Sensitivity | Low | Low | Partially mitigated | Framework maintainer |
| SP-IOT-01 | Sensitivity | Medium | Variable | Open | IoT Tech Lead |
| TP-GLOBAL-01 | Tradeoff | — | — | Accepted | Framework maintainer + adopting architect |
| TP-GLOBAL-02 | Tradeoff | — | — | Accepted | Contract owner |
| TP-IOT-01 | Tradeoff | — | — | Accepted | IoT Tech Lead |
| R-BOT-01 | Risk | Medium | Low-High | Open | Security + Bot Tech Lead |
| R-IOT-01 | Risk | Medium | Low-High | Open | IoT Tech Lead |
| R-GLOBAL-01 | Risk | Medium | Variable | Open | Operations + maintainer |
| R-GLOBAL-02 | Risk | Low-High | Medium | Open | Flow Tech Leads |

### 5.1 Summary by status

- **Accepted (explicit trade-offs):** 5 (SP-BOT-01, the 3 TPs, conceptually)
- **Partially mitigated:** 1 (SP-BOT-02)
- **Open for the next iteration or production adoption:** 5 (SP-IOT-01, R-BOT-01, R-IOT-01, R-GLOBAL-01, R-GLOBAL-02)

### 5.2 Top 3 short-term mitigation priorities

| Priority | ID | Action | Effort |
|:---:|---|---|:---:|
| **1** | SP-IOT-01 / R-IOT-01 | Reorder the IoT error handler (Postgres before HTTP) or add `continueOnFail: true` | 1 h |
| **2** | SP-BOT-02 | Define log-estructurado-e1.schema.json and add it to the static validator | 4 h |
| **3** | R-GLOBAL-02 | Post-deploy contract smoke tests for mock-bot and mock-iot | 4 h |

These 3 mitigations total ~9 hours and can be executed before the academic project closes if it is desired to raise the to-be score in BOT-Q4, BOT-Q5, and IOT-Q4 up to 5. If executed, they are reported in the final ATAM report as "post-evaluation improvements."

---

## 6. Integration with the ATAM report

This register directly feeds sections 5 and 9 of `informe-atam-final.md`:

- Section 5 — Approach analysis: each finding appears with technical detail
- Section 9 — Synthesis: the top 5 risks and top 3 trade-offs are drawn from this register

Likewise, the mini-ATAM experts (Section E of the instrument) have the opportunity to identify additional findings not present in this register. Such emergent findings are incorporated post-survey as an appendix "Findings identified by the panel" in the report.
