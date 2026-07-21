> 🌐 **Language / Idioma:** English · [Español](protocolo-mttd.md)

# MTTD (Mean Time To Detect) measurement protocol

**Version:** 1.0
**Date:** 2026-05-01
**Author:** Elian Hernando Gil Sierra
**Purpose:** Define a reproducible procedure to measure MTTD as an indicator of the
improvement in Operability / Monitorability (REG-006, ATAM scenario BOT-Q5).

---

## Operational definition

**MTTD = time in seconds** from the timestamp of the first log with `status:"fail"` in the
n8n container's stdout, until the operator can state:

> "The failure occurred in stage **{etapa}** of flow **{caso}**, run_id **{run_id}**,
> caused by **{causa}**."

Diagnosis is performed using **only** the n8n container's structured logs — without
opening the n8n UI, without reviewing the execution history, without running PostgreSQL
queries.

---

## As-is vs to-be comparison

| Version | Diagnostic mechanism | Estimated MTTD | Observable |
|---------|--------------------------|---------------|-----------|
| As-is | Open n8n UI → Workflows → execution history → inspect the failed node | >5 minutes | No (requires interactive UI) |
| To-be | `docker compose logs n8n \| grep '"status":"fail"'` | < 60 seconds | Yes (stdout, programmatically queryable) |

The as-is MTTD is an estimate based on the average manual navigation time in the n8n UI. It
cannot be measured reproducibly because it depends on the operator's experience and the
UI's state.

---

## Standard procedure (reproducible)

### Prerequisites
- Docker environment up (`docker compose up -d`)
- To-be flows imported and active
- A terminal available for `docker compose logs`

### Step 1 — Select the failure scenario

Use the corresponding ATAM scenario (BOT-Q5 for Bot, IOT-Q4 for IoT).

**Example with BOT-Q5 (authentication failure):**
```bash
# Prepare: send a request with an invalid token
curl -X POST http://localhost:5678/webhook/bot-soporte-to-be \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "user_id": "U001", "token": "token-invalido"}'
```

**Example with IOT-Q4 (E3 failure — stop mock-iot):**
```bash
docker compose stop mock-iot
# Wait 5 seconds for the container to stop
curl -X POST http://localhost:5678/webhook/iot-sensor-to-be \
  -H "Content-Type: application/json" \
  -d '{"sensor_id":"S001","temperature":25.0,"humidity":60.0,"co2":400,"timestamp":"2026-05-01T10:00:00Z"}'
```

### Step 2 — Start the stopwatch

The stopwatch starts **the moment** the HTTP request reaches the webhook (visible as a
new record in `n8n UI → Executions` — but without opening it; use the `curl` submission
timestamp).

```bash
# Record the start timestamp
START_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "Stopwatch started: $START_TS"
```

### Step 3 — Diagnose using only logs (without opening the n8n UI)

**On Linux/Mac:**
```bash
docker compose logs n8n --since 5m | grep '"status":"fail"'
```

**On Windows PowerShell:**
```powershell
docker compose logs n8n --since 5m | Select-String '"status":"fail"'
```

**Expected output (to-be):**
```json
{"run_id":"RUN-BOT-20260501T100001Z-A3X9K2","etapa":"E1_validacion","status":"fail","errores":["Token de autenticación inválido o ausente"],"n_errores":1,"start_ts":"2026-05-01T10:00:01Z"}
```

### Step 4 — Identify root cause

The operator reads from the first log with `"status":"fail"`:
- `etapa` → where it failed (E1, E2, E3, E4)
- `run_id` → which specific execution
- `errores[0]` or `error_message` → the cause

The stopwatch stops when the operator can complete the diagnostic statement.

### Step 5 — Record the result

```bash
END_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Compute the difference in seconds manually or with:
MTTD_S=$(( $(date -d "$END_TS" +%s) - $(date -d "$START_TS" +%s) ))
echo "MTTD: ${MTTD_S}s"
```

Record in the corresponding run-log:
```
notes: MTTD=XXs, escenario=BOT-Q5, diagnostico="E1 validacion, token invalido"
```

---

## Acceptance goal

**MTTD < 60 seconds** for any failure in stages E1–E4 in the to-be flow.

This goal is verifiable because:
1. The structured log with `"status":"fail"` always includes `etapa`, `run_id`, and
   `errores`.
2. The `docker compose logs n8n | grep '"status":"fail"'` query takes <1 second.
3. The operator can read the log and complete the diagnosis in <60 total seconds.

---

## Covered failure scenarios

| Scenario | ATAM ID | Failure type | Injection command |
|-----------|---------|---------------|---------------------|
| Invalid authentication token | BOT-Q5 | E1 Validation | `token: "invalido"` in payload |
| Missing message in payload | BOT-Q6 | E1 Validation | `{}` with no `message` field |
| mock-bot unavailable | BOT-Q5 | E3 Integration | `docker compose stop mock-bot` |
| Sensor reading with missing fields | IOT-Q3 | E1 Validation | `{}` with no required fields |
| PostgreSQL unavailable | IOT-Q4 | E3 Integration | `docker compose stop postgres` |
| mock-iot unavailable | IOT-Q4 | E4 Integration | `docker compose stop mock-iot` |

---

## Methodological difference for the as-is

In the as-is, diagnosis requires:
1. Opening the n8n UI in the browser.
2. Navigating to Workflows → selecting the flow → Executions.
3. Finding the failed execution in the list (there is no `run_id` to filter by).
4. Clicking the execution → expanding the failed node → reading the error.

This process cannot be timed reproducibly because:
- It depends on n8n UI speed (browser load, history size).
- There is no `run_id` to correlate with the specific failure.
- n8n's error message for Code nodes can be generic ("Error in item 0").

**Conservative as-is MTTD estimate: 5–10 minutes** for an operator experienced with the
n8n UI.

---

## References

- ATAM scenario BOT-Q5: `atam/atam-utility-tree.md`
- REG-006 (structured log): `microframework/reglas/reglas-obligatorias.md`
- ADR-MF-003 (JSON log decision): `microframework/adr/ADR-MF-003-log-estructurado-reg006.md`
- Observability guide: `microframework/guia-observabilidad.md`
