> 🌐 **Language / Idioma:** English · [Español](proyecto-overview.md)

# Project: complete overview

## Title

Analysis and design of an LC/NC micro-framework for n8n with Clean Architecture and
DevSecOps: ATAM evaluation and AWS architecture design.

## General objective

Develop a micro-framework for Low-Code/No-Code solutions in n8n, grounded in Clean
Architecture principles and DevSecOps practices, that allows structuring and evaluating
software architectures by comparing as-is and to-be designs using ATAM, analyzing their
impact on quality attributes such as maintainability, traceability, security, and
reliability, and guiding the design of cost-efficient, scalable architectures in AWS.

## Specific objectives

**SO1:** Define an architectural framework for Low-Code/No-Code flows in n8n, based on
Clean Architecture principles, that relates quality attributes to design decisions,
organization rules, patterns, and best-practice criteria.

**SO2:** Systematize the use of the architectural framework across two representative case
studies, documenting as-is and to-be architectures with clear diagrams, decision records
(ADRs), and a traceability matrix between requirements, decisions, and quality attributes.

**SO3:** Implement an ATAM-based architectural evaluation protocol to analyze and compare
impacts, risks, and design trade-offs between the case studies' as-is and to-be
architectures.

**SO4:** Propose a cost-efficient, scalable AWS architecture design, aligned with the
micro-framework, describing deployment options, scaling points, security controls,
observability, and operation to support adoption and evolution in production environments.

## Methodology

The study adopts a **mixed-methods research approach with an explanatory sequence**: first
operational quantitative evidence (comparable indicators between as-is and to-be), then
qualitative explanation based on architecture and documentation (ATAM, ADRs, traceability
matrix, and checklists).

The research design is **quasi-experimental under an as-is vs to-be comparison scheme**
applied to two case studies. Execution conditions are kept controlled and replicable (same
n8n version, same configuration, same synthetic inputs).

### Project phases

| Phase | Name | Period |
|------|--------|---------|
| 0 | Environment setup | Mar 2026 |
| 1 | Case specification and synthetic data | Mar 2026 |
| 2 | As-is state construction | Mar–Apr 2026 |
| 3 | Micro-framework v1.0 design | Apr 2026 |
| 4 | To-be state construction | May 2026 |
| 5 | Instrument pilot test | Jun 2026 |
| 6 | Comparative measurement | Jun–Jul 2026 |
| 7 | ATAM evaluation | Jul 2026 |
| 8 | AWS architecture design | Jul 2026 |
| 9 | Best practices guide and closure | Aug 2026 |

## Case studies

The sample consists of two intentionally defined representative case studies:

### Bot case — Support chatbot

**Pattern it represents:** Conversational-interaction automation with authentication
validation, business-rule message classification, and ticket persistence.

**Minimum functionality:**
- Receives a message via HTTP POST webhook
- Validates the authentication token
- Classifies the message into categories: incident, billing, technical support, greeting,
  general
- Determines priority: high, medium, low
- Persists the ticket in an external service
- Responds to the client with the classified message

**Reference templates from the official n8n repository:**
- ID 2923: Bitrix24 chatbot application workflow example with webhook integration
- ID 8062: Multi-LLM customer support chatbot for WordPress & webhook integrations
- ID 10040: Create a complete user authentication system with PostgreSQL & webhooks
- ID 4704: Json string validator via webhook
- ID 3144: Auto-retry engine: error recovery workflow

### IoT case — Sensor pipeline

**Pattern it represents:** Ingestion, validation, transformation, persistence, and
notification of sensor data with threshold-based anomaly detection.

**Minimum functionality:**
- Receives a sensor reading via HTTP POST webhook (temperature, humidity, CO2, sensor_id,
  timestamp)
- Validates required fields and physically possible ranges
- Normalizes the data (rounding, timestamp format)
- Analyzes the reading against thresholds to detect anomalies
- Classifies the alert level: normal, warning, critical
- Persists to local PostgreSQL with idempotency control (ON CONFLICT DO NOTHING)
- Notifies via a channel differentiated by level (critical vs warning)

**Reference templates from the official n8n repository:**
- ID 7248: Clean and log IoT sensor data to InfluxDB
- ID 4004: Remote IoT sensor monitoring via MQTT and InfluxDB
- ID 11909: IoT sensor monitoring with GPT-4o anomaly detection, MQTT & multi-channel alerts
- ID 4407: n8n Workflow Error Alerts with Google Sheets, Telegram, and Gmail
- ID 2556: Exponential backoff for Google APIs

## Evaluation metrics

### Dimension: Delivery

| Metric | Definition | Source | Unit |
|---------|-----------|--------|--------|
| Change time | Minutes from CR start to passing tests + checklist + commit | CR Log + commit hash | Minutes per CR |
| Change impact | Number of nodes/subflows modified per CR | Diff export + manual review | Count |
| Practical coupling | Number of external dependencies affected per CR | Technical CR checklist | Count |
| Rework | Number of attempts until passing tests and checklist | Log + commits | Count |

### Dimension: Operation

| Metric | Definition | Source | Unit |
|---------|-----------|--------|--------|
| Failed executions | Failures / N runs per Input Set | Run Log (status + error_type) | % failures |
| Key-segment latency | Time between start-end timestamps per segment | Structured logs | ms / median / p95 |
| Micro benchmark | Response time under controlled load | JMeter + logs | ms + error rate |

### Dimension: Security

| Metric | Definition | Source | Unit |
|---------|-----------|--------|--------|
| Secret exposure | Presence of secrets in nodes/export/log | Checklist + export review | 0 / 1 |
| Least privilege | Integrations with strictly necessary permissions | Checklist + simulated config | 0 / 1 |
| Code surface | Number of nodes with code execution | Flow inventory | Count |

### Dimension: Traceability

| Metric | Definition | Source | Unit |
|---------|-----------|--------|--------|
| ADR coverage | ADRs created / expected decisions × 100 | Decision list vs ADR | % |
| ATAM coverage | Scenarios with traceable evidence / prioritized scenarios × 100 | Scenario-evidence matrix | % |
| Checklist coverage | Items passed / total × 100 | Binary checklist | % |
| MTTD (diagnosis) | Time from the failure timestamp to identifying the root cause using the structured log | Structured log + diagnostic log | Seconds / minutes |
| Subflow reuse ratio | Subflows invoked by more than one orchestrator / total subflows of the case | Flow inventory + `Execute Workflow` references | % |

The last two metrics (MTTD and Reuse ratio) correspond to Table 1 of the thesis proposal
(§4.4, Operability and Reusability per ISO/IEC 25010) and are captured from the same
artifacts as the other metrics, with no additional instruments.

---

## ISO/IEC 25010 mapping

The thesis proposal grounds the quality evaluation in ISO/IEC 25010 (§4.4, Table 1). The
project's operational dimensions (Delivery, Operation, Security, Traceability) relate to
the ISO characteristics as follows:

| ISO/IEC 25010 characteristic | Sub-characteristic | Project operational dimension | Metrics evidencing it |
|---|---|---|---|
| Maintainability | Modularity | Delivery | Change time, Change impact, Practical coupling, Rework |
| Maintainability | Reusability | Delivery / Operation | Subflow reuse ratio |
| Maintainability | Analyzability | Traceability | ADR coverage, ATAM coverage, Checklist coverage |
| Reliability | Fault tolerance | Operation | Failed executions, retry/idempotency pattern outcomes |
| Reliability | Recoverability | Operation | Failed executions + `error_type` in the run-log |
| Security | Confidentiality | Security | Secret exposure |
| Security | Integrity | Security | Least privilege, Code surface |
| Performance efficiency | Time behavior | Operation | Key-segment latency, Micro benchmark |
| Operability | Monitorability | Traceability / Operation | MTTD (diagnosis), per-stage structured logs |

This mapping allows each micro-framework rule (REG-001…REG-010) and each Top-K ATAM
scenario to connect explicitly with a measurable ISO characteristic.

### Standard Change Requests

**CR1 — Business rule:** Modification of a decision condition or rule (threshold,
prioritization, state mapping).

**CR2 — Integration:** Change of endpoint, provider, or integration parameters; includes
changing a simulated credential.

**CR3 — Validation and error handling:** Adding or adjusting input/output validation and
failure behavior.

A change is considered done when:
- It passes the test set defined for the case
- The flow is exported and versioned in the repository
- It meets the applicable minimum checklist
- The commit hash and result evidence are recorded

### Indicative evaluation goals

- Change impact: ≥ 20% reduction in to-be vs as-is (nodes touched per CR)
- Reliability: ≥ 30% reduction in failures across N controlled executions
- Checklist compliance: ≥ 90% in to-be
- ATAM coverage: ≥ 80% of the 6 top-K scenarios per case with traceable evidence

## Synthetic Input Sets

Each case has three Input Sets (A, B, C) used across all runs to guarantee comparability.

> **PHASE 2 Addendum — Experimental matrix expansion (Bot ADR-004):** the Input Set matrix
> was expanded from 3 (A, B, C) to 10 (A–E static + F, G, I, J, K dynamic) to cover
> antipatterns that the original 3 sets did not make measurable (idempotency, boundary
> values, extreme percentiles, degradation). The original 3 A–C sets remain identical. The
> formal justification is in
> `casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.md` (applies to both
> cases).

### Bot — Input Sets

**Input Set A — Normal case:**
```json
{ "token": "mi-token-secreto-hardcodeado-123", "user_id": "user-001", "session_id": "sess-a01", "message": "Hola, necesito ayuda con mi factura del mes pasado" }
```

**Input Set B — Urgent case:**
```json
{ "token": "mi-token-secreto-hardcodeado-123", "user_id": "user-002", "session_id": "sess-b01", "message": "Tengo un error critico en el sistema de pagos, es urgente" }
```

**Input Set C — Invalid case (missing token):**
```json
{ "user_id": "user-003", "session_id": "sess-c01", "message": "Consulta sin token" }
```

### IoT — Input Sets

**Input Set A — Normal reading:**
```json
{ "sensor_id": "SENSOR-001", "temperature": 22.5, "humidity": 55.0, "co2": 450, "timestamp": "2026-03-15T10:00:00Z", "location": "sala-principal" }
```

**Input Set B — Critical reading:**
```json
{ "sensor_id": "SENSOR-002", "temperature": 48.3, "humidity": 92.0, "co2": 2100, "timestamp": "2026-03-15T10:01:00Z", "location": "cuarto-servidores" }
```

**Input Set C — Invalid reading (missing field):**
```json
{ "temperature": 25.0, "humidity": 60.0, "timestamp": "2026-03-15T10:02:00Z" }
```

(Payload field values remain as originally captured in Spanish, since these are literal
JSON fixtures used as-is by the actual test harness — translating the string content would
break byte-for-byte reproducibility with the versioned dataset files.)

## Expected results

**R1:** LC/NC architectural framework for n8n (micro-framework v1.0) with rules, metamodel,
and review guide.

**R2:** Comparative designs of two cases (as-is and to-be) with complete decision
documentation (ADRs, traceability matrices, logs, metrics).

**R3:** Cost-efficient, scalable AWS architecture design aligned with the micro-framework.

**R4:** ATAM protocol and report to evaluate LC/NC architecture comparing as-is vs to-be.

**R5:** Practical n8n best-practices guide oriented to quality, operation, and gradual
adoption of the micro-framework.

**R6:** Final thesis document.

## Declared study limitations

- Only two case studies: does not allow statistical generalization.
- A single researcher implements both as-is and to-be: implementation bias controlled with
  predefined CRs and binary checklists.
- ATAM with no real stakeholder panel: run analytically with the advisor as a second
  evaluator in key sessions.
- AWS design with no production deployment: it is a reference design with cost estimation,
  not an actual deployment.
- Local lab environment: latency results are not directly extrapolable to production
  environments.
