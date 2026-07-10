> 🌐 **Language / Idioma:** English · [Español](patron-saga-compensacion.md)

# Pattern: Saga / Compensation for E3–E4 consistency

**Category:** Operational resilience / Eventual consistency
**Applicable stage:** E3 → E4
**Maturity level:** Recommended for systems requiring guaranteed notification delivery

---

## Problem

E3 (persistence) succeeds, but E4 (notification) fails after exhausting all retries. The
resulting state is **partially inconsistent**:

- The reading was persisted in PostgreSQL ✓
- The alert notification was never sent ✗

This state is not detectable by the client (the sensor received HTTP 200 when E3
completed). The infrastructure operator doesn't detect it either, since there is no alert.
A sensor with a critical temperature reading went unnotified — silently.

The saga/compensation pattern allows detecting and recovering from this inconsistent state
without losing the notification.

---

## Solution

### Step 1 — Mark the reading as "notification pending" if E4 fails permanently

**E4 — Code node on the error branch (after exhausting retries):**

```javascript
const updatePayload = {
  run_id: $json.run_id,
  notificacion_pendiente: true,
  error_notificacion: $json.error?.message || 'E4 falló definitivamente',
  ts_fallo_notificacion: new Date().toISOString()
};

console.log(JSON.stringify({
  run_id: updatePayload.run_id,
  etapa: 'E4_saga_compensacion',
  status: 'notificacion_pendiente',
  nivel: $json.nivel
}));

return [{ json: updatePayload }];
```

**E4 — Postgres node: update the reading already persisted by E3:**

```sql
UPDATE lecturas_sensor
SET notificacion_pendiente = true,
    error_notificacion = $2,
    ts_fallo_notificacion = $3
WHERE run_id = $1;
```

This UPDATE is idempotent: running it multiple times with the same values has no
additional effect.

### Step 2 — Scheduled notification-retry workflow

A cron flow (every 5 minutes) queries and retries pending notifications:

```sql
SELECT * FROM lecturas_sensor
WHERE notificacion_pendiente = true
AND nivel IN ('critico', 'advertencia')
ORDER BY created_at ASC
LIMIT 20;
```

For each reading, it resends the notification to the corresponding endpoint. On success:

```sql
UPDATE lecturas_sensor
SET notificacion_pendiente = false,
    ts_notificacion_replay = NOW()
WHERE run_id = $1;
```

### Table schema modification

```sql
ALTER TABLE lecturas_sensor
ADD COLUMN notificacion_pendiente BOOLEAN DEFAULT FALSE,
ADD COLUMN error_notificacion TEXT,
ADD COLUMN ts_fallo_notificacion TIMESTAMPTZ,
ADD COLUMN ts_notificacion_replay TIMESTAMPTZ;
```

---

## Trade-offs

| Aspect | Benefit | Cost |
|---------|-----------|-------|
| Consistency | Guaranteed eventual delivery of critical notifications | Inconsistency window: up to 5 minutes without notification |
| Operability | `SELECT WHERE notificacion_pendiente=true` gives backlog visibility | Requires additional table columns and a scheduled workflow |
| Complexity | The compensation logic is simple (a single UPDATE) | Introduces a dependency on the cron — if the cron fails, notifications remain pending |
| Atomicity | E3 and E4 are independent — E3 is never rolled back due to an E4 failure | For some domains (trading, financial transactions) this may not be acceptable |

**When NOT to use this pattern:**
- When notification and persistence must be atomic (use a transactional message queue
  instead).
- When notification latency is a strict SLA (< 1 minute in all cases).

---

## Relationship to IoT ADR-004 (E4 routing by severity)

The saga pattern complements E4 routing: if the "critical" notification branch fails
permanently, the saga marks the reading as `notificacion_pendiente`. The scheduled replay
workflow retries the notification along the same severity route originally determined in
E2 (stored in the `nivel_alerta` column).

---

## References

- Garcia-Molina, H. & Salem, K. (1987). *Sagas*. ACM SIGMOD Record.
- Richardson, C. (2018). *Microservices Patterns*. Manning. Ch. 4 (Sagas).
