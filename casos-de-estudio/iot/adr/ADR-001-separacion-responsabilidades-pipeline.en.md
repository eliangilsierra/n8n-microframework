> 🌐 **Language / Idioma:** English · [Español](ADR-001-separacion-responsabilidades-pipeline.md)

# ADR-001: Separation of responsibilities via orchestrated subflows

**Status:** Accepted
**Date:** 2026-04-07
**Case:** iot
**Affected quality attribute:** Maintainability, Reliability, Security

---

## Context

The IoT pipeline's as-is flow implements, in a single Code node
(`Procesar y Detectar Alerta`), three mixed responsibilities: field parsing, threshold-based
anomaly detection, and payload preparation for InfluxDB (including the URL and
authentication token).

Static analysis of the JSON identified 8 violations of the micro-framework's 10 mandatory
rules, with three special aggravating factors for the IoT case:

1. The database token (`db_token`) is not only hardcoded but is exposed in the node's
   output, visible in n8n's execution history.
2. The `co2` field from the input contract is not processed in any node — incomplete
   reading.
3. There is no idempotency control: two readings from the same sensor in the same second
   generate duplicate database entries with no way to detect them.

A change to the temperature thresholds (CR1 from the protocol) requires modifying the same
node that builds the database payload, making it impossible to decouple domain evolution
from integration evolution.

---

## Decision

We apply the micro-framework's 4-stage metamodel to the IoT pipeline, with 4 subflows
invoked from an orchestrator via `Execute Workflow`:

- **E1 (Validation):** Subflow `iot-to-be-e1-validacion` — validates the presence of
  required fields and physical ranges, normalizes data (rounding), generates `run_id`.
- **E2 (Domain):** Subflow `iot-to-be-e2-dominio` — centralizes thresholds in the
  `UMBRALES` constant, analyzes temperature, humidity, and CO2, determines the alert
  level.
- **E3 (Persistence):** Subflow `iot-to-be-e3-persistencia` — writes to local PostgreSQL
  with an idempotency key `{sensor_id}-{timestamp}` and `ON CONFLICT DO NOTHING`.
- **E4 (Notification):** Subflow `iot-to-be-e4-notificacion` — routing by level (critical
  vs warning), HTTP Request with retry, skip log if the level is normal.

This separation establishes that:
1. Modifying a threshold (CR1) only requires touching E2.
2. Changing the notification provider (CR2) only requires touching E4.
3. Adding validation for a new field (CR3) only requires touching E1.

---

## Alternatives considered

- **Split into 2 subflows (E1+E2 together, E3+E4 together):** Reduces Execute Workflow
  overhead but mixes validation with domain, and persistence with notification. Discarded
  because CR1 (threshold) and CR2 (integration) would be in the same subflow, removing the
  benefit of the separation.

- **Keep it monolithic with PostgreSQL and n8n credentials:** Minimal fix with no
  architectural separation. Discarded because it doesn't allow measuring per-stage change
  impact, which is the goal of the PHASE 6 CR-log.

- **5 subflows (E1, E2, E3 write, E3 idempotency, E4):** Excessive separation. Discarded
  due to Execute Workflow overhead with no additional measurable benefit.

---

## Consequences

**Positive:**
- Changing the critical temperature threshold (CR1) touches only E2 — `nodes_touched = 1`
  in the cr-log vs. the as-is flow where it touches the monolithic node (impact across all
  the logic).
- Changing the notification endpoint (CR2) touches only E4 — total independence from E2.
- PostgreSQL credential in n8n Credentials — `db_token` removed from the exported JSON and
  from the execution history (REG-001 met).
- Idempotency with `ON CONFLICT DO NOTHING` — safe retries with no duplicates.
- CO2 monitored in E2 alongside temperature and humidity — complete contract implemented.
- Differentiated notifications (critical vs warning) — correct channel by severity.

**Negative / trade-offs:**
- 4 Execute Workflow invocations per successful execution generate ~5–15ms overhead each.
  Estimated total latency of 20–60ms additional compared to the as-is. This trade-off is
  acceptable for the study's maintainability goal.
- Orchestrators must be updated with the subflows' real IDs post-import. See the procedure
  in `docs/protocolo-evidencias.md`.
- Changing the destination database requires modifying E3 and potentially E1 if the
  idempotency schema changes. This is intentional: the provider change is an architectural
  decision deserving its own ADR.

---

## Relationship to the micro-framework

This decision implements the E1-E4 metamodel described in
`microframework/reglas/reglas-obligatorias.md`. It directly satisfies: REG-001
(credentials), REG-002 (run_id), REG-005 (idempotency), REG-007 (E2 with no
integrations), REG-008 (integrations in E3/E4). The specific idempotency pattern is
documented in `microframework/patrones/patron-idempotencia.md`.
