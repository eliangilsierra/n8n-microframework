> 🌐 **Language / Idioma:** English · [Español](patron-retry.md)

# Pattern: Retry with backoff in integrations

**Category:** Resilience
**Applies to:** E3 — Integration adapters, E4 — Controlled output
**Related rule:** REG-004

---

## Problem

External services fail transiently due to timeouts, rate limits, or network instability.
Without retry, a single failure results in lost tickets or sensor readings with no
possibility of automatic recovery.

---

## Solution

Enable n8n's native HTTP Request node retry with a wait between attempts:

```json
"options": {
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenTries": 2000
  }
}
```

**Recommended configuration by operation type:**

| Operation | maxRetries | waitBetweenTries |
|-----------|-----------|-----------------|
| Ticket write (critical) | 3 | 2000 ms |
| Warning notification | 2 | 1000 ms |
| Critical notification | 3 | 500 ms |

---

## Implementation in n8n

1. Select the HTTP Request node in the E3 or E4 subflow
2. Go to the **Options** tab
3. Enable the **Retry On Fail** toggle
4. Configure **Max Tries** and **Wait Between Tries**

Retry is only triggered when the service responds with an error status (4xx, 5xx) or when
the connection is lost. It is not triggered on data validation errors.

---

## Trade-off

**Benefit:** Transient errors do not result in data loss. The operation is automatically
retried without manual intervention.

**Cost:** Total execution latency increases in the event of failure. With 3 retries and
2000 ms waits, the worst case is +6 seconds.

**Limit:** Retry does not resolve permanent failures. If the external service is down, all
3 attempts will fail and the flow will move to the `errorWorkflow`.

---

## Combination with idempotency

Retry can create duplicate records if the external service processes the first request but
fails to send the response. To prevent this, combine it with the idempotency pattern:

1. Generate `idempotency_key` before the first attempt (in a Code node prior to the HTTP
   Request)
2. Include the key in the request body or header
3. The external service uses the key to ignore duplicates

See `patron-idempotencia.md` for the complete detail.
