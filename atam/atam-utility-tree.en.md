> 🌐 **Language / Idioma:** English · [Español](atam-utility-tree.md)

# ATAM Utility Tree — Top-K scenarios per case study

**Version:** 1.0
**Date:** 2026-05-01
**Author:** Elian Hernando Gil Sierra
**Purpose:** Define the priority quality scenarios (top-K) for the PHASE 7 ATAM evaluation,
with verifiable response measures and complete traceability to ADRs and Input Sets.

---

## Reference framework

Bass, Clements & Kazman (2012), in *Software Architecture in Practice* (3rd ed.), define
the ATAM Utility Tree as a four-level structure:

```
System utility
└── Quality attribute (Maintainability, Reliability, Security…)
    └── Refinement (ISO 25010 sub-characteristic)
        └── Concrete scenario with stimulus, response, and response measure
```

Scenarios are prioritized with pairs (business importance, implementation difficulty):
H=high, M=medium, L=low.

---

## Bot case — 6 top-K scenarios

| ID | Business driver | ISO 25010 attribute | Sub-characteristic | Stimulus | Expected response | Response measure | Priority |
|----|----------------|-------------------|-------------------|----------|-------------------|---------------------|-----------|
| BOT-Q1 | Rule modifiability | Maintainability | Modularity | CR1: change R002's priority from "medium" to "high" | Only the E2 subflow modified | `nodes_touched ≤ 1` in cr-log-bot-to-be.csv | (H, M) |
| BOT-Q2 | Ticket provider change | Maintainability | Modularity | CR2: change the ticket service endpoint to `/api/v2/tickets` | Only the E3 subflow modified | `nodes_touched ≤ 1` in cr-log-bot-to-be.csv | (H, L) |
| BOT-Q3 | Credential confidentiality | Security | Confidentiality | Export the to-be flow's JSON to disk | The authentication token does not appear as a literal value | `ocurrencias_literal_token = 0` verified by `validar-flujos.mjs` | (H, L) |
| BOT-Q4 | Data integrity under retries | Reliability | Maturity | Send the same ticket (Input Set K) twice in a row | 0 duplicate records in the external service | `COUNT(tickets_duplicados) = 0` via mock-bot `/api/tickets` | (H, M) |
| BOT-Q5 | Production failure diagnosis | Operability | Monitorability | Authentication failure in production (invalid token) | The operator identifies the stage and cause from logs without opening the n8n UI | `MTTD ≤ 60 seconds` using `docker compose logs n8n \| grep '"status":"fail"'` | (H, H) |
| BOT-Q6 | HTTP contract correctness | Functional suitability | Correctness | Invalid token (Set C) / missing message (Set D) | 401 Unauthorized / 400 Bad Request respectively | `HTTP_status_correcto = 100%` in run-log-bot-to-be.csv for Sets C and D | (H, L) |

---

## IoT case — 6 top-K scenarios

| ID | Business driver | ISO 25010 attribute | Sub-characteristic | Stimulus | Expected response | Response measure | Priority |
|----|----------------|-------------------|-------------------|----------|-------------------|---------------------|-----------|
| IOT-Q1 | Alert threshold adjustment | Maintainability | Modularity | CR1: reduce the critical temperature threshold from 35°C to 30°C | Only the `UMBRALES` constant in E2 modified | `nodes_touched ≤ 1` in cr-log-iot-to-be.csv | (H, L) |
| IOT-Q2 | Alert channel change | Maintainability | Modularity | CR2: change the urgent notification endpoint to `/api/v2/notify/urgent` | Only the HTTP node on E4's critical branch modified | `nodes_touched ≤ 1` in cr-log-iot-to-be.csv | (H, L) |
| IOT-Q3 | Reading integrity under retries | Reliability | Maturity | Send the same sensor reading (Input Set K) twice | 0 duplicate records in PostgreSQL | `SELECT COUNT(*) FROM lecturas_sensor WHERE idempotency_key='...' = 1` | (H, M) |
| IOT-Q4 | Network fault tolerance | Reliability | Fault tolerance | Transient network failure in E3 (mock-iot unavailable during 1 retry) | The flow retries and completes with no reading loss | `fallos_tipo_integration = 0` in the run-log after the mock recovers | (H, H) |
| IOT-Q5 | Differentiated alert urgency | Reliability | Fault tolerance | Mix of critical and warning readings (Input Set I) | Critical ones are processed and notified before warning ones | `duracion_ms_critico < duracion_ms_advertencia` for equivalent readings | (M, H) |
| IOT-Q6 | DB credential confidentiality | Security | Confidentiality | Export the to-be flow's JSON to disk | PostgreSQL credentials do not appear as literal values | `ocurrencias_literal_pg_password = 0` verified by `validar-flujos.mjs` | (H, L) |

---

## Scenario → ADR → Input Set mapping

| Scenario | Main ADR | Verification Input Set | Measurement artifact |
|-----------|---------------|--------------------------|----------------------|
| BOT-Q1 | [Bot ADR-007](../casos-de-estudio/bot/adr/ADR-007-clasificacion-mensajes-e2.md) | CR1 | `cr-log-bot-to-be.csv` |
| BOT-Q2 | [Bot ADR-001](../casos-de-estudio/bot/adr/ADR-001-separacion-responsabilidades-flujo.md) | CR2 | `cr-log-bot-to-be.csv` |
| BOT-Q3 | [Bot ADR-005](../casos-de-estudio/bot/adr/ADR-005-estrategia-autenticacion.md) + [ADR-MF-001](../microframework/adr/ADR-MF-001-gestion-secretos-reg001.md) | — | `validar-flujos.mjs` (REG-001) |
| BOT-Q4 | [Bot ADR-001](../casos-de-estudio/bot/adr/ADR-001-separacion-responsabilidades-flujo.md) | Set K | `run-log-bot-to-be.csv` + mock-bot DB |
| BOT-Q5 | [ADR-MF-003](../microframework/adr/ADR-MF-003-log-estructurado-reg006.md) + [Bot ADR-006](../casos-de-estudio/bot/adr/ADR-006-diseno-error-workflow.md) | Set C | `medicion/protocolo-mttd.md` |
| BOT-Q6 | [Bot ADR-005](../casos-de-estudio/bot/adr/ADR-005-estrategia-autenticacion.md) | Set C, Set D | `run-log-bot-to-be.csv` |
| IOT-Q1 | [IoT ADR-002](../casos-de-estudio/iot/adr/ADR-002-umbrales-y-vocabulario.md) + [IoT ADR-008](../casos-de-estudio/iot/adr/ADR-008-normalizacion-e1.md) | CR1 | `cr-log-iot-to-be.csv` |
| IOT-Q2 | [IoT ADR-004](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md) | CR2 | `cr-log-iot-to-be.csv` |
| IOT-Q3 | [IoT ADR-003](../casos-de-estudio/iot/adr/ADR-003-idempotencia-sensor-timestamp.md) + [IoT ADR-007](../casos-de-estudio/iot/adr/ADR-007-timestamp-authority.md) | Set K | `SELECT COUNT(*)` in PostgreSQL |
| IOT-Q4 | [IoT ADR-004](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md) (E4 retry) | Set I | `run-log-iot-to-be.csv` |
| IOT-Q5 | [IoT ADR-004](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md) | Set I | `run-log-iot-to-be.csv` (duracion_ms) |
| IOT-Q6 | [ADR-MF-001](../microframework/adr/ADR-MF-001-gestion-secretos-reg001.md) + [IoT ADR-001](../casos-de-estudio/iot/adr/ADR-001-separacion-responsabilidades-pipeline.md) | — | `validar-flujos.mjs` (REG-001) |

---

## ISO 25010 attribute coverage

| ISO 25010 attribute | Sub-characteristic | Scenarios | Related REGs |
|-------------------|-------------------|------------|-----------------|
| Maintainability | Modularity | BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2 | REG-007, REG-008 |
| Security | Confidentiality | BOT-Q3, IOT-Q6 | REG-001 |
| Reliability | Maturity | BOT-Q4, IOT-Q3 | REG-005 |
| Reliability | Fault tolerance | IOT-Q4, IOT-Q5 | REG-003, REG-004 |
| Operability | Monitorability | BOT-Q5 | REG-006 |
| Functional suitability | Correctness | BOT-Q6 | REG-009 |

The 6 scenarios of each case cover the 5 ISO 25010 characteristics the micro-framework
promises to improve (Maintainability, Reliability, Security, Operability, Functional
suitability), confirming the utility tree's coverage.

---

## References

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley.
- Kazman, R. et al. (2000). ATAM: Method for Architecture Evaluation. CMU/SEI-2000-TR-004.
- ISO/IEC 25010:2011. Systems and software quality models.
- `medicion/protocolo-mttd.md` — MTTD measurement protocol (BOT-Q5 scenario)
- `microframework/reglas/reglas-obligatorias.md` — REG-* → ISO 25010 mapping
