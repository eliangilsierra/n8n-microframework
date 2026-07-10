> 🌐 **Language / Idioma:** English · [Español](ADR-005-diseno-error-workflow.md)

# ADR-005 — Design of the IoT errorWorkflow with a replay payload (iot-error-handler)

**Date:** 2026-05-01
**Status:** Implemented 2026-05-02
**Quality attribute:** Reliability / Fault tolerance + Operability / Monitorability (ISO/IEC 25010)
**Related rules:** REG-003, REG-006
**Framework ADR:** ADR-MF-002

---

## Context

The IoT case has a critical characteristic that distinguishes it from the Bot: sensor
readings are **unrecoverable measurement data** if lost. If the flow fails after E1
validated the reading but before E3 persisted it, the reading is permanently lost — the
sensor won't retry sending it unless explicitly configured to.

The IoT's errorWorkflow must, besides notifying the failure (like the Bot), **preserve the
original payload** of the reading to allow manual replay in case of E3's permanent
failure.

---

## Decision

The `iot-error-handler` flow implements four nodes:

### Node 1 — Code: Extract error context with the original payload

```javascript
const errorContext = {
  run_id: $json.run_id || 'UNKNOWN',
  sensor_id: $json.payload_original?.sensor_id || 'UNKNOWN',
  node_name: $json.execution?.lastNodeExecuted || 'UNKNOWN',
  error_message: $json.error?.message || 'Error sin mensaje',
  error_type: $json.error?.name || 'UnknownError',
  payload_original: $json.payload_original || null,  // DIFFERENCE vs Bot
  etapa: 'IOT_ERROR_HANDLER',
  status: 'error',
  ts: new Date().toISOString()
};

console.log(JSON.stringify(errorContext));
return [{ json: errorContext }];
```

The `payload_original` field contains the sensor's complete reading (sensor_id,
temperature, humidity, co2, timestamp, location) to allow manual replay.

### Node 2 — HTTP Request: Notify mock-iot with the payload

```
POST http://mock-iot:3002/api/errors
Content-Type: application/json
Retry: enabled (2 retries, 1000ms wait)
Body: { run_id, sensor_id, node_name, error_message, error_type, payload_original, ts }
```

### Node 3 — Postgres: Record the reading as a dead-letter (if E3 didn't persist)

```sql
INSERT INTO lecturas_sensor_dead_letters
  (run_id, sensor_id, payload_json, error_message, created_at)
VALUES ($1, $2, $3::jsonb, $4, NOW())
ON CONFLICT (run_id) DO NOTHING;
```

This node only runs if the failure occurred in E3 (detected via `node_name`).

### Node 4 — Respond to Webhook: 500 response to the client

```json
HTTP 500 Internal Server Error
{ "error": "Internal server error", "run_id": "{{run_id}}", "sensor_id": "{{sensor_id}}" }
```

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| errorWorkflow identical to the Bot's (no payload_original) | The sensor reading is lost with no possibility of replay |
| Only log the payload without persisting it (no dead-letter) | The stdout log can be lost if the container restarts; the dead-letters table is persistent |
| Automatically retry from the errorWorkflow | The error could be structural (wrong table schema, changed credentials) — the automatic retry would fail again and mask the real problem |

---

## Consequences

**Positive:**
- Every reading that fails in E3 ends up in the `dead_letters` table with the complete
  payload for manual replay.
- The log includes `sensor_id` to correlate which sensor produced the lost reading.
- The operator can review `SELECT * FROM lecturas_sensor_dead_letters` to identify
  readings pending replay.

**Negative:**
- Requires creating the `lecturas_sensor_dead_letters` table in PostgreSQL (additional
  setup step — documented in `docs/protocolo-evidencias.md` §2).
- Node 3 (dead-letter) fails if the DB is unavailable, which is precisely the most likely
  case when E3 failed due to DB issues. Mitigation: Node 1 (stdout log) preserves the
  payload independently.

---

## Verification criterion

1. The IoT orchestrator's `settings.errorWorkflow` → not empty (REG-003)
2. Simulate an E3 failure (stop Postgres) + send a valid reading → log with
   `"status":"error"` + `"payload_original":{...}` (REG-006)
3. Valid Input Set with Postgres stopped → reading in `dead_letters` after reactivating
   Postgres

---

## Implementation (2026-05-02)

- **File:** `casos-de-estudio/iot/to-be/iot-error-handler.json`
- **Implemented structure:** Error Trigger → Code (log + payload_original) → HTTP POST
  mock-iot (retry 2×) → Postgres dead-letter INSERT
- **Dead-letter table:** `lecturas_sensor_dead_letters` created in
  `automatizacion/setup_env.py` → `create_table()`
- **Table schema:**
  ```sql
  CREATE TABLE IF NOT EXISTS lecturas_sensor_dead_letters (
    id               SERIAL PRIMARY KEY,
    run_id           VARCHAR(100),
    payload_original JSONB,
    error_message    TEXT,
    node_name        VARCHAR(200),
    ts               TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **Note:** the implementation does not include a Respond 500 node (n8n's error workflows
  cannot respond to the original client — the webhook has already ended). The 500 response
  is documented in the spec but n8n doesn't support it natively from the error handler.
