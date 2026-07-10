> 🌐 **Language / Idioma:** English · [Español](matriz-trazabilidad.md)

# Traceability matrix — IoT case

**Version:** 1.4
**Date:** 2026-05-03
**Status:** Updated post PHASE 4 architectural validation — ADR-005/007/008 implemented,
flows fixed.

---

## Functional requirements

| ID | Requirement | Priority | ISO 25010 attribute |
|----|---------------|-----------|-------------------|
| RF-IOT-01 | The system validates the presence of sensor_id, temperature, humidity, co2, **timestamp** | High | Reliability / Maturity + Functional suitability / Correctness |
| RF-IOT-02 | The system validates physically possible ranges for each variable | High | Functional suitability / Correctness |
| RF-IOT-03 | The system normalizes input data (rounding) | Medium | Maintainability / Modularity |
| RF-IOT-04 | The system classifies the alert level: normal, warning, critical | High | Maintainability / Modularity + Functional suitability / Correctness |
| RF-IOT-05 | The system persists the reading in PostgreSQL with idempotency | High | Reliability / Maturity |
| RF-IOT-06 | The system notifies via a channel differentiated by alert level | High | Reliability / Fault tolerance + Reliability |
| RF-IOT-07 | The system responds 422 if the reading is invalid, with no persistence | High | Functional suitability / Correctness |
| RF-IOT-08 | The system does not send a notification if the level is normal | Medium | Performance efficiency / Time behavior |

---

## Traceability: Requirement → Architectural decision → Evidence

| Requirement | Related ADR | Micro-framework rule | Node/Stage | Input Set | Evidence (PHASE 6) |
|---------------|-----------------|----------------------|------------|-----------|-------------------|
| RF-IOT-01 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | E1, REG-009 | E1 - Validacion | C, D, E | run-log-iot-*.csv (PHASE 6) |
| RF-IOT-02 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | E1, REG-009 | E1 - Validacion | C, D, J | run-log-iot-*.csv (PHASE 6) |
| RF-IOT-03 | — | REC-001 | E1 - Normalizacion | A, B, F | run-log-iot-*.csv (PHASE 6) |
| RF-IOT-04 | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) | REG-007, E2 | E2 - Dominio | A, B, F, J | run-log-iot-*.csv (PHASE 6) |
| RF-IOT-05 | [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) | REG-005, E3 | E3 - Persistencia | A, B, K | SELECT + COUNT(DISTINCT) |
| RF-IOT-06 | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) | REG-004, REG-008, E4 | E4 - Notificacion | B, I, J | run-log-iot-*.csv (PHASE 6) |
| RF-IOT-07 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | REG-009 | Respond - 422 | C, D | run-log-iot-*.csv (PHASE 6) |
| RF-IOT-08 | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) | E2, E4 | IF - requiereNotificacion | A, F | run-log-iot-*.csv (PHASE 6) |

---

## Traceability: Quality attribute → ATAM scenario → Decision

| Quality attribute | ATAM scenario | Architectural decision | ADR |
|--------------------|----------------|------------------------|-----|
| Maintainability | Modifying the critical temperature threshold touches only E2 | Thresholds centralized in E2 (`UMBRALES`) | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) |
| Functional suitability | Consistent `nivel` vocabulary between as-is and to-be | Enum `{normal, advertencia, critico}` | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) |
| Security | PostgreSQL credentials don't appear in the exported JSON | Credentials in n8n (credential-reference) | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) |
| Reliability | Insert retry doesn't create duplicate readings | Composite key + ON CONFLICT DO NOTHING | [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) |
| Reliability | Critical events' TTD decoupled from warning traffic | Routing by `nivel` in E4 with differentiated retry | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Reliability | A notification failure doesn't lose the persisted reading | E3 and E4 separated | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) |
| Internal validity | REG-005 measurable with quantitative evidence | Set K (idempotency duplicates) | [Bot ADR-004](../../bot/adr/ADR-004-diseno-experimental-input-sets.md) |
| Traceability | Every reading has run_id and sensor_id in logs and DB | run_id propagated from E1 | REG-002 |
| Maintainability | IOT-Q1: CR1 (threshold 35→30°C) touches ≤1 node in to-be | UMBRALES constant centralized in E2 | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) |
| Maintainability | IOT-Q2: CR2 (urgent endpoint) touches ≤1 node in to-be | Isolated E4 routing | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Reliability | IOT-Q3: 0 duplicate readings in Set K | Idempotency via {sensor_id, timestamp} key | [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) + [ADR-007](../adr/ADR-007-timestamp-authority.md) |
| Reliability | IOT-Q4: readings not lost on E3 transient failure | REG-004 retry + error boundary | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Reliability | IOT-Q5: critical events notified before warnings | Differentiated E4 routing | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Security | IOT-Q6: PG credentials not in the exported JSON | n8n credentials by name | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) |
| Reliability | An E3 failure doesn't lose the sensor reading | Dead-letter in `lecturas_sensor_dead_letters` | [ADR-005](../adr/ADR-005-diseno-error-workflow.md) |
| Traceability | Timestamp in the idempotency key = the sensor's timestamp | Drift ≤5 min validated in E1 | [ADR-007](../adr/ADR-007-timestamp-authority.md) |

---

## Change Requests and coverage

| CR | Description | Affected RF | Impacted stage (as-is) | Impacted stage (to-be) | Measured as-is | Measured to-be |
|----|-------------|-------------|------------------------|------------------------|--------------|--------------|
| CR1 | Reduce critical temp threshold 35°C → 30°C | RF-IOT-04 | 6 nodes | Only the `UMBRALES` constant in E2 (1 node) | CR-IOT-001 @ 152fd2d (2026-04-21) | PHASE 6 |
| CR2 | Change urgent notification endpoint → /api/v2/notify/urgent | RF-IOT-06 | 4 nodes | Only the critical branch's HTTP in E4 (1 node) | CR-IOT-002 @ 152fd2d (2026-04-21) | PHASE 6 |
| CR3 | Add co2 ≥ 0 validation (reject negatives) | RF-IOT-02 | 3 nodes | Only E1's schema (0 nodes) | CR-IOT-003 @ 152fd2d (2026-04-21) | PHASE 6 |

See detail in `casos-de-estudio/iot/cr-design.md` and raw data in
`medicion/cr-logs/iot/cr-log-iot-as-is.csv`.

---

## Changes to the as-is (PHASE 2)

See `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` for the chronological change log
(structural redesign 6→14 nodes, removal of PG credentials from the node, Input Sets
expansion).

---

## IoT case ADRs

| ADR | Title | Status |
|-----|--------|--------|
| [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | Pipeline responsibility separation (E1–E4) | Accepted |
| [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) | To-be thresholds and `nivel` vocabulary | Implemented 2026-05-02 |
| [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) | Idempotency with the `{sensor_id, timestamp}` key | Accepted |
| [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) | Differentiated E4 routing by severity | Implemented 2026-05-02 |
| [Bot ADR-004](../../bot/adr/ADR-004-diseno-experimental-input-sets.md) | Experimental design (shared) | Accepted |
| [ADR-005](../adr/ADR-005-diseno-error-workflow.md) | errorWorkflow with a replay payload for lost readings (REG-003, REG-006) | Implemented 2026-05-02 |
| [ADR-006](../adr/ADR-006-validacion-schema-e1.md) | E1 schema validation with inline JavaScript and per-field errors | Implemented 2026-05-02 |
| [ADR-007](../adr/ADR-007-timestamp-authority.md) | Timestamp authority: use the sensor's timestamp (REG-005) | Implemented 2026-05-02 |
| [ADR-008](../adr/ADR-008-normalizacion-e1.md) | Field normalization in E1 before passing to the domain (REC-001, REG-005) | Implemented 2026-05-02 |

---

*The "Evidence (PHASE 6)" and "Measured to-be" cells are filled in once the to-be's
comparative measurement runs (PHASE 6) are executed.*
