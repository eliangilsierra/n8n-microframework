> 🌐 **Language / Idioma:** English · [Español](notas-tecnicas.md)

# Technical notes — IoT as-is

Ad-hoc IoT sensor pipeline. Intentionally designed to exhibit the micro-framework's
antipatterns (REG-001 through REG-010) in a realistic 14-node scenario replicating what is
found in IoT implementations with no defined architecture.

> For the chronological record of changes to the as-is and their evidence (commits,
> rationale, links to REG-*), see [`cambios-y-evidencia.md`](cambios-y-evidencia.md).

---

## Flow structure (14 nodes)

| # | Node | Type | Visible antipattern |
|---|------|------|--------------------|
| 1 | Webhook Sensor | webhook | — |
| 2 | Verificar Campos Basicos | code | Incomplete validation: co2 never checked |
| 3 | Datos Presentes? | if | co2 missing from the check (only sensor_id/temp/humidity) |
| 4 | Error Datos Invalidos | respondToWebhook 200 | REG-009 (200 instead of 422) |
| 5 | Normalizar Lecturas | code | REG-001 (db_url/db_token in the node's output) |
| 6 | Temperatura Critica? | if | Hardcoded 35°C threshold |
| 7 | Humedad Alta? | if | Hardcoded 85% threshold (inconsistent with to-be: 80%) |
| 8 | Determinar Nivel Final | code | REG-007/008 (mixed domain); co2 unvalidated |
| 9 | Guardar en InfluxDB | httpRequest POST | REG-001 (token in a header from the payload), REG-004 |
| 10 | Persistir en PostgreSQL | postgres | REG-005 (INSERT with no ON CONFLICT) |
| 11 | Requiere Notificacion? | if | — |
| 12 | Enviar Notificacion | httpRequest POST | Single endpoint with no severity routing |
| 13 | Log Resultado | code | REG-006 (unstructured console.log, no run_id) |
| 14 | Respuesta OK | respondToWebhook 200 | REG-002 (no run_id), REG-009 (no anomalias[]) |

---

## Verifiable REG-* antipatterns

### REG-001 — Exposed credentials
- **Node 5 (Normalizar Lecturas):** `db_url` and `db_token` are included in the node's
  output JSON. They remain visible in n8n's execution history (the "Output" tab of every
  execution). In the to-be, credentials are referenced as n8n Credentials and never
  appear in the pipeline's data.
- **Node 9 (Guardar en InfluxDB):** the `Authorization: Token {{ $json.db_token }}` header
  exposes the token in the httpRequest node's request logs.

### REG-002 — Absence of run_id
- No node generates, propagates, or includes a `run_id`. The final response (node 14)
  contains no trace identifier for correlation with external logs.

### REG-003 — No declarative error handling
- `settings.errorWorkflow` absent. A failure in InfluxDB (node 9) or PostgreSQL (node 10)
  stops execution with no notification to the operator.

### REG-004 — HTTP calls with no retry
- **Node 9 (Guardar en InfluxDB)** and **Node 12 (Enviar Notificacion)**: no
  `retryOnFail`. A transient network error aborts the entire execution and loses the
  reading.

### REG-005 — No write idempotency
- **Node 10 (Persistir en PostgreSQL):** `INSERT INTO lecturas_sensor (...) VALUES (...)`
  with no `ON CONFLICT DO NOTHING` clause. If the webhook receives the same payload twice
  (a client retry), duplicate rows are inserted into the DB.

### REG-006 — Unstructured logging
- **Node 13 (Log Resultado):** `console.log(JSON.stringify({...}))` with no log level, no
  pipeline stage, no run_id. In the to-be, the log includes `stage`, `run_id`, `nivel`,
  and `latencia_ms`.

### REG-007/008 — Mixed domain logic
- **Node 8 (Determinar Nivel Final):** combines threshold-classification logic (domain:
  temp, humidity, co2 → level) with pipeline data access. It also applies a CO2 threshold
  (`> 1500 → critical`, `> 1000 → warning`) that was never documented or centralized,
  different from any constant visible in the flow.

### REG-009 — Semantically incorrect HTTP code
- **Node 4 (Error Datos Invalidos):** returns `HTTP 200` with the body
  `{"error":"datos_invalidos"}`. The correct code would be `422 Unprocessable Entity`. The
  client cannot distinguish success from error by status code; it must inspect the body.

### REG-010 — Absence of observability
- No per-stage metrics, no correlated traces, no operational alerts.

---

## Incomplete co2 validation (extended antipattern)

Node 2 checks `sensor_id`, `temperature`, and `humidity`, but omits `co2`. The co2 field is
read as `co2_raw = body.co2` and propagated unvalidated.

In node 8, co2 is consumed with `parseFloat(d.co2_raw) || 0`, which silently silences a
`NaN` (when co2 is missing) with the value `0`. This "solution" makes the system appear to
work correctly with incomplete data, hiding the problem instead of rejecting it.

Input Set E exposes exactly this antipattern: the as-is returns 200 with
`nivel: 'normal'` even when co2 is missing, while the to-be returns 422.

---

## Inconsistent thresholds between nodes

| Node | Variable | as-is threshold | to-be threshold (E2) |
|------|----------|-------------|------------------|
| 6 (Temperatura Critica?) | temperature | > 35°C | > 35°C |
| 7 (Humedad Alta?) | humidity | > 85% | > 80% |
| 8 (Determinar Nivel Final) | co2 | > 1000 / > 1500 | > 800 / > 1200 |

The humidity-threshold inconsistency (85 vs 80) means the as-is classifies as `normal`
readings that the to-be would classify as `advertencia`, producing measurable
differences in the rate of notifications sent.

---

## Execution flow

```
Webhook Sensor
  └─▶ Verificar Campos Basicos
        └─▶ Datos Presentes?
              ├─▶ [true/invalid]  Error Datos Invalidos (200) ──── end
              └─▶ [false/valid]   Normalizar Lecturas
                                     └─▶ Temperatura Critica?
                                           ├─▶ [true]  Determinar Nivel Final
                                           └─▶ [false] Humedad Alta?
                                                         ├─▶ [true]  Determinar Nivel Final
                                                         └─▶ [false] Determinar Nivel Final
                                                                        └─▶ Guardar en InfluxDB
                                                                              └─▶ Persistir en PostgreSQL
                                                                                    └─▶ Requiere Notificacion?
                                                                                          ├─▶ [true]  Enviar Notificacion
                                                                                          │             └─▶ Log Resultado
                                                                                          └─▶ [false] Log Resultado
                                                                                                        └─▶ Respuesta OK (200)
```

---

## Input sets and expected behavior

| Set | Scenario | HTTP as-is | Reason |
|-----|-----------|------------|-------|
| A | Normal temperature, normal level | 200 | Complete flow, no alert |
| B | High temperature (38°C), active alert | 200 | Notification sent |
| C | Invalid data (temperature NaN) | 200 | REG-009: should be 422 |
| D | Values exactly at the threshold (35°C, 85%) | 200 | Boundary: warning level |
| E | co2 missing | 200 | co2 silenced as 0; should be 422 |
