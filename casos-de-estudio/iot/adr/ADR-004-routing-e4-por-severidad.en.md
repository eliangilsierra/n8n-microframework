> 🌐 **Language / Idioma:** English · [Español](ADR-004-routing-e4-por-severidad.md)

# ADR-004: Differentiated E4 routing by event severity

**Status:** Accepted — Implemented 2026-05-02
**Date:** 2026-04-21
**Case:** iot
**Affected quality attribute:** Functional suitability, Reliability, Maintainability

---

## Context

The `iot-as-is.json` flow sends every event notification (warning and critical) through
the same HTTP channel (`/api/notify`, node 11 "Notificar Evento"), with a single timeout
and no differentiated retry policy. Observable consequences in the as-is:

1. **Critical events share a queue with warnings:** a spike in warnings delays the
   delivery of critical events, increasing the Time-to-Detect (TTD) of risk conditions.
2. **Insufficient uniform retry:** the as-is has no retry (REG-004 violated); when we add
   retry to the to-be, using the same parameters for critical and warning events wastes
   attempts on non-urgent warnings or underestimates the importance of critical ones.
3. **Orchestrator-integration coupling:** the notification-decision IF node is inline in
   the main orchestrator, mixing domain logic (is it critical?) with integration logic
   (which endpoint?) — violates REG-008.

The to-be must define how notifications from the E4 subflow (`iot-to-be-e4-integracion`)
will be routed so that CR2 (notification endpoint change) is local and critical events'
TTD is decoupled from warning traffic.

The IoT traceability matrix references this ADR as "(pending)" — its creation is a
formal PHASE 3 closure requirement.

---

## Decision

We implement E4 as an **independent subflow with an IF branch by `nivel`** and two
distinct HTTP integrations:

```
E4 (iot-to-be-e4-integracion)
├── Validate input against iot-e4-input.schema.json
├── IF nivel == "critico"
│   └── POST /api/notify/urgent
│       · timeout: 2000 ms
│       · retry: 5 attempts, exponential backoff base 200ms
│       · header X-Priority: high
│       · operational alert if it fails permanently
└── ELSE (nivel == "advertencia")
    └── POST /api/notify
        · timeout: 5000 ms
        · retry: 3 attempts, exponential backoff base 500ms
        · header X-Priority: normal
        · structured log if it fails permanently
```

**Vocabulary normalization:** the `nivel` field arrives at the subflow with the official
enum defined by IoT ADR-002 (`normal` | `advertencia` | `critico`). E4 is not invoked for
`nivel == "normal"` (orchestrator decision).

**Contract:** `microframework/contratos/iot-e4-output.schema.json` declares the response
schema with `{ notified: bool, channel: "urgent"|"normal", attempts: int, duration_ms }`
so the orchestrator can log per-channel differentiated metrics.

---

## Alternatives considered

- **Inline E4 in the orchestrator (like Bot):** functional for flows with a single
  integration. Discarded: IoT has 2 channels + validation + per-channel structured log =
  >5 integration-logic nodes, which inline would violate REG-008 (domain/integration
  separation) and hinder CR2 (endpoint change would touch the orchestrator).

- **Single channel with priority in the payload (`priority: "high"|"normal"`):**
  simplifies the architecture to a single endpoint. Discarded: urgent notification
  operations require a different SLA (timeouts, retries, alert on failure), which cannot
  be expressed with just a header — the route decision must be architectural, not
  applicative. Additionally, critical events' TTD would still be coupled to warning
  traffic.

- **Asynchronous queue (Redis Streams / SQS / RabbitMQ) with priority lanes:** the
  standard pattern to decouple producers from critical consumers. Discarded: introduces
  an external dependency (broker) outside the project's LC/NC scope and contradicts the
  micro-framework's principle that architectural decisions be implemented with native n8n
  primitives when possible.

- **Separate sub-subflows (one per channel):** maximum granularity with E4-urgent and
  E4-normal as independent subflows. Discarded per YAGNI: duplicates input validation and
  the structured log with no architectural benefit over the internal IF. If >3 channels
  appear in the future, this is reconsidered.

- **Routing by a dynamically computed endpoint from `UMBRALES`:** a single HTTP call with
  a URL built from the level (`/api/notify/${nivel}`). Discarded: couples the URL to the
  enum's values, hinders channel evolution, and breaks the flow's readability on the n8n
  canvas.

---

## Consequences

**Positive:**
- **Decoupled critical TTD:** warning spikes don't affect the urgent channel's latency.
  Measurable in PHASE 6 comparing `duration_ms` per channel in the to-be's set I
  (degradation).
- **CR2 (notification endpoint change) touches only E4:** meets the thesis proposal's
  `cr_nodes_touched_tobe ≤ 3` metric (modifying a single HTTP Request node).
- **Differentiated retry backs REG-004:** the urgent channel has a more aggressive policy
  (5 attempts vs 3), justified by the domain.
- **Per-channel structured log** allows differentiated alerting in observability (a
  failure in `/api/notify/urgent` is a P1 incident; a failure in `/api/notify` is P3).
- **Architectural evidence for ATAM:** the "local subflow complexity vs. critical TTD
  isolation" trade-off is defensible in the "Reliability" attribute evaluation.

**Negative / trade-offs:**
- The E4 subflow has 2 parallel branches → more nodes than a simple inline E4 (approx. 8
  nodes vs 4). Mitigation: each branch is self-contained, input validation is shared
  before the IF.
- Maintaining two different retry policies requires documenting which applies to each
  branch; a policy change for critical events doesn't automatically reflect on warnings.
  Mitigation: the policies live as named constants at the start of E4 (`RETRY_URGENT`,
  `RETRY_NORMAL`) following REC-001.
- **Platform limitation (documented 2026-05-02):** n8n does not support native exponential
  backoff in HTTP Request nodes — the `waitBetweenTries` field is a flat interval in
  milliseconds. The "exponential backoff base 200ms/500ms" specification is not
  implementable with native n8n v2.x primitives. The implementation uses flat intervals of
  2000ms (critical) and 1000ms (warning), which in the lab environment are adequate given
  the mock server responds in <50ms. In production, implementing backoff via a Code node +
  explicit loop, or delegating retry to an API Gateway, would be recommended.
- **Value deviation (documented 2026-05-02):** the values implemented in
  `iot-to-be-e4-notificacion.json` are `maxRetries: 3 / waitBetweenTries: 2000ms`
  (critical) and `maxRetries: 2 / waitBetweenTries: 1000ms` (warning), instead of the
  original 5/200ms and 3/500ms from the ADR. Reason: native n8n does not support
  exponential backoff; values were adjusted for the lab environment, minimizing total wait
  time on transient errors. The original ADR's values are the design reference for
  production.
- The test mock-server (`mock-iot-notify`) must expose the two differentiated endpoints
  (`/notificaciones/critico` and `/notificaciones/advertencia`). Mitigation: one-time cost
  in test infrastructure, already absorbed.
- The orchestrator must decide whether to invoke E4 (`nivel` ≠ normal) before delegating —
  this is a small domain decision that stays in E2, not E4. Documented in IoT ADR-001.

---

## Relationship to the micro-framework

- **REG-004 (retry on integrations):** every branch defines its retry policy; the static
  validator verifies retry presence per HTTP node.
- **REG-008 (integrations isolated in E3/E4):** the routing separation in E4 respects the
  rule; the orchestrator doesn't know concrete endpoints.
- **REG-007 (isolated domain):** the "is it critical?" decision happens in E2 (domain); E4
  only executes the technical routing. The boundary stays clean.
- **REC-001 (named constants):** `RETRY_URGENT` and `RETRY_NORMAL` materialize the
  recommendation.
- **Retry pattern** (`microframework/patrones/patron-retry.md`): this ADR applies the
  pattern with per-channel specific parameters; the pattern documents the general form.
- **IoT ADR-002 (thresholds and vocabulary):** defines the `nivel` enum the routing IF
  uses; this ADR is a direct consumer of that decision.
- **IoT ADR-001 (E1–E4 separation):** this ADR specializes the E4 stage described at a
  conceptual level in ADR-001.
- **Cross-references:**
  - `microframework/contratos/iot-e4-output.schema.json`
  - `microframework/plantillas/iot-to-be-e4-integracion.json`
  - `microframework/patrones/patron-retry.md`
  - `medicion/datasets/iot/input-set-I.json` (degradation set that validates the decoupling)
  - `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` (CR2 references this ADR)
