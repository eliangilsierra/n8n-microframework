> 🌐 **Language / Idioma:** English · [Español](patron-error-boundary.md)

# Pattern: Error Boundary (Dead Letter) for permanent failures in E3

**Category:** Operational resilience
**Applicable stage:** E3
**Maturity level:** Recommended for systems with no-data-loss requirements

---

## Problem

When all of E3's retries are exhausted (REG-004 configured with maxRetries=3), the data was
not persisted and the flow fails. Without additional handling:

1. The client receives a 500 error (or a timeout if the errorWorkflow also fails).
2. The data is permanently lost — there is no trace of what was attempted to be persisted.
3. There is no recovery mechanism without manual intervention.

The retry pattern (REG-004) resolves **transient** failures. The error boundary resolves
the case where the external service fails **persistently** during the retry window.

---

## Solution

In E3's final error branch (after exhausting all retries), instead of propagating the
error, implement a dead-letter: record the unpersisted data with `status: 'dead-letter'`
for later replay.

### Implementation in n8n

**Code node: prepare dead-letter entry**

```javascript
const deadLetter = {
  run_id: $json.run_id,
  payload_original: $json.lectura || $json.payload,
  error_message: $json.error?.message || 'E3 falló definitivamente',
  intentos: 3,         // maxRetries configured under REG-004
  created_at: new Date().toISOString(),
  status: 'pending'    // pending → processed once the service is back
};

console.log(JSON.stringify({
  run_id: deadLetter.run_id,
  etapa: 'E3_dead_letter',
  status: 'dead-letter',
  payload_guardado: true
}));

return [{ json: deadLetter }];
```

**Postgres node: insert into the dead_letters table**

```sql
INSERT INTO dead_letters (run_id, payload_json, error_message, created_at, status)
VALUES ($1, $2::jsonb, $3, $4, 'pending')
ON CONFLICT (run_id) DO NOTHING;
```

**Respond to Webhook node: 202 Accepted to the client**

```json
HTTP 202 Accepted
{
  "status": "accepted_pending",
  "message": "El dato fue recibido pero la persistencia está pendiente. run_id: {{run_id}}",
  "run_id": "{{run_id}}"
}
```

### Scheduled replay workflow

A separate flow (cron every 5 minutes) queries and retries:

```sql
SELECT * FROM dead_letters WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10;
```

For each row, it retries the original operation. On success:
`UPDATE dead_letters SET status = 'procesado'`.

---

## Trade-offs

| Aspect | Benefit | Cost |
|---------|-----------|-------|
| Data loss | The data is never lost — it always remains in dead_letters | The client receives a 202 "pending" instead of a 200 confirmation |
| Consistency | Eventual: the data will be persisted once the service recovers | Inconsistency window between receipt and persistence |
| Operability | `SELECT FROM dead_letters WHERE status='pending'` gives immediate backlog visibility | Requires an additional table and a scheduled replay workflow |
| HTTP contract | 202 tells the client the data was received and is queued | Clients expecting immediate confirmation may misinterpret it |

**When NOT to use this pattern:**
- When the client's HTTP contract requires immediate persistence confirmation (200 OK).
- When data latency is more valuable than the no-loss guarantee.

---

## Relationship to REG-003 and IoT ADR-005

The errorWorkflow (IoT ADR-005) and the error boundary are complementary:
- **errorWorkflow:** captures failures that are not recoverable from within the flow
  itself.
- **Error boundary:** captures E3-specific failures and converts them into a recoverable
  state (dead-letter) without propagating the error to the client.
