> 🌐 **Language / Idioma:** English · [Español](ADR-008-rate-limiting-tobe.md)

# ADR-008 — Removing the rate-limiter in the to-be: stateless by design

**Date:** 2026-05-01
**Status:** Accepted
**Quality attribute:** Maintainability / Modularity + Reliability / Maturity (ISO/IEC 25010)
**Related rules:** REG-002
**ATAM scenario:** BOT-Q1 (indirect impact — removes state that complicates CR1)

---

## Context

The as-is flow implements in-memory rate-limiting using
`$getWorkflowStaticData('global')`:

```javascript
// As-is — REG-002 ANTIPATTERN
const staticData = $getWorkflowStaticData('global');
const LIMITE = 150; // adjusted for statistical measurement
if (!staticData.contador) staticData.contador = {};
staticData.contador[userId] = (staticData.contador[userId] || 0) + 1;
if (staticData.contador[userId] > LIMITE) {
  return [{ json: { error: "Rate limit exceeded" } }];
}
```

This mechanism has three documented problems (Bot ADR-003):

1. **Non-deterministic for measurement:** the counter persists across measurement runs,
   making results depend on execution order.
2. **Lost on n8n restart:** `$getWorkflowStaticData` is volatile — a container restart
   resets every counter.
3. **Violates REG-002:** `run_id` cannot correlate with the rate-limiter's state because
   that state is not in the structured log.

The to-be must fix this. The question is: should rate-limiting be implemented differently
in the to-be, or removed altogether?

---

## Decision

The to-be **removes** the rate-limiter from the flow. The to-be flow is completely
**stateless** between executions.

**Justification:**

Rate-limiting is an **infrastructure** concern, not an **application logic** one. The
correct responsibilities per layer are:

| Layer | Responsibility | Mechanism |
|------|----------------|-----------|
| API Gateway / Load Balancer | Rate limiting by IP or token | NGINX `limit_req`, AWS API Gateway throttling |
| n8n webhook | Authentication (who can call?) | E1 validates token (ADR-005) |
| E1 — Validation | Payload validity (is the message valid?) | Fields, types, ranges |
| E2 — Domain | Pure business rules | Classification, priority |

An n8n flow is not the right place to implement distributed rate-limiting. The as-is's
in-memory rate-limiter is an antipattern because it introduces state that contaminates the
semantics of individual executions.

The to-be flow delegates rate-limiting to the infrastructure operator (in a real
environment: an API Gateway or NGINX in front of n8n's webhook). In the project's lab
environment, there is no rate limit because the goal is to measure the flow's behavior
without interference from accumulated state.

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| Redis-backed distributed rate-limiter | External dependency outside the project's scope; introduces state that violates REG-002 in a more sophisticated but equally problematic way |
| In-memory rate-limiter with a longer window (LIMITE=10000) | Still accumulated state across executions — the REG-002 antipattern persists |
| Timestamp-based rate-limiter (sliding window) | More correct than the simple counter, but still non-distributed local state |
| Keep the rate-limiter as is | The to-be's goal is to demonstrate REG-002's correction, not preserve the antipattern |

---

## Consequences

**Positive:**
- The to-be flow is completely deterministic: an execution's result does not depend on
  the state of previous executions.
- REG-002 is satisfied by removing the state, not by moving it to another mechanism.
- Input Set K (idempotency) and every other set produce reproducible results regardless of
  execution order.
- PHASE 6's comparative measurement is valid: no interference from accumulated state.

**Negative:**
- In a real production environment, the to-be flow has no protection against volume abuse.
  This must be documented as a project scope limitation: the micro-framework does not
  include network infrastructure.

---

## Note on the as-is

The as-is keeps the rate-limiter with `LIMITE=150` (configured in Bot ADR-003) to
guarantee that the 200+ statistical measurement runs are not truncated by the limit. This
is the only modification to the as-is antipattern justified for measurement — the REG-002
antipattern is still present in the design (in-memory, volatile), only the limit's numeric
value changes.

---

## Verification criterion

1. The to-be flow's JSON contains no `$getWorkflowStaticData` in any node
2. `validar-flujos.mjs --caso bot --estado to-be` → REG-002: ✓ CUMPLE
3. Input Set A executed 200 consecutive times → `success_rate = 100%` (no rate-limit)
