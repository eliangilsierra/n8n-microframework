> 🌐 **Language / Idioma:** English · [Español](patron-circuit-breaker.md)

# Pattern: Circuit Breaker for external integrations

**Category:** Operational resilience
**Applicable stage:** E3, E4
**Maturity level:** Recommended (not mandatory in micro-framework v1.0)

---

## Problem

After N consecutive failures against an external service (timeout, 503, 500), the retry
pattern (REG-004) keeps attempting the call. This has two negative effects:

1. **Saturating the downed service:** every retry is an additional request to a service
   that is already overloaded or under maintenance.
2. **Accumulated total latency:** if the service takes 30 seconds to time out and there are
   3 retries, the flow's total latency is 90+ seconds, which can also cause the client's
   webhook to time out.

The retry pattern (REG-004) is necessary for transient failures (unstable network,
momentary load spike). The circuit breaker complements retry for **structural** failures
(service down, planned maintenance).

---

## Solution

Keep a consecutive-failure counter in `$getWorkflowStaticData('global')`. If
`fallos_consecutivos > UMBRAL_CB`, the circuit "opens" and calls to the service are
skipped immediately (no retries), returning a "circuit open" response to the client.

### Circuit states

```
Closed (CLOSED)      → normal operation, errors are counted
      ↓ threshold exceeded
Open (OPEN)          → calls skipped, immediate failure response
      ↓ after RESET_MS
Half-open (HALF)     → allows one trial call
      ↓ trial succeeds → CLOSED
      ↓ trial fails → OPEN
```

### Implementation in n8n (Code node before the HTTP Request)

```javascript
const CB_UMBRAL = 5;        // consecutive failures to open
const CB_RESET_MS = 60000;  // 60 seconds in open state before half-opening

const state = $getWorkflowStaticData('global');
if (!state.cb) state.cb = { estado: 'CLOSED', fallos: 0, abierto_desde: null };

const ahora = Date.now();

// Check whether it should move from OPEN to HALF
if (state.cb.estado === 'OPEN') {
  if (ahora - state.cb.abierto_desde > CB_RESET_MS) {
    state.cb.estado = 'HALF';
  } else {
    // Circuit open — skip the call
    return [{ json: {
      cb_estado: 'OPEN',
      mensaje: 'Servicio temporalmente no disponible (circuit breaker)',
      run_id: $json.run_id
    }}];
  }
}

// CLOSED or HALF state — proceed with the normal call
return [{ json: { ...($json), _cb_intentar: true } }];
```

### Callback Code node (after the HTTP Request, on the error branch)

```javascript
const state = $getWorkflowStaticData('global');
state.cb.fallos = (state.cb.fallos || 0) + 1;

if (state.cb.fallos >= CB_UMBRAL || state.cb.estado === 'HALF') {
  state.cb.estado = 'OPEN';
  state.cb.abierto_desde = Date.now();
  console.log(JSON.stringify({
    run_id: $json.run_id,
    etapa: 'E3_circuit_breaker',
    status: 'circuit_opened',
    fallos: state.cb.fallos
  }));
}
```

### Callback Code node on the success branch

```javascript
const state = $getWorkflowStaticData('global');
state.cb.fallos = 0;
state.cb.estado = 'CLOSED';
state.cb.abierto_desde = null;
```

---

## Trade-offs

| Aspect | Benefit | Cost |
|---------|-----------|-------|
| Latency | Eliminates retry latency when the service is down | Introduces minimal latency (~1ms) from checking state on every call |
| Resilience | Protects the external service from being saturated during recovery | False positives: the circuit can open due to a momentary spike that has already passed |
| State | Reduces network load during structural failures | Uses `$getWorkflowStaticData` — volatile in-memory state (lost on n8n restart) |

**Note on `$getWorkflowStaticData`:** This pattern uses the same mechanism as the REG-002
antipattern (in-memory rate limiter). The semantic difference matters: the circuit
breaker is **infrastructure** state (is the external service available?) — not domain or
business state. Losing it on n8n restart is acceptable because the circuit simply returns
to the "closed" state (normal operation), with no data loss.

---

## When to use

- Integrations with external services that have an SLA < 99.9% or maintenance windows.
- When the HTTP Request timeout is > 10 seconds and the flow has a tight response SLA.
- In production environments with sustained traffic (does not apply to the project's lab
  environment).

---

## References

- Fowler, M. (2014). *CircuitBreaker*. martinfowler.com.
- Newman, S. (2015). *Building Microservices*. O'Reilly. Ch. 11.
- ADR-MF-002 (REG-003 errorWorkflow) — complements the circuit breaker for failure
  notification.
