> 🌐 **Language / Idioma:** English · [Español](ADR-006-diseno-error-workflow.md)

# ADR-006 — Design of the Bot's errorWorkflow (bot-error-handler)

**Date:** 2026-05-01
**Status:** Accepted
**Quality attribute:** Reliability / Fault tolerance + Operability / Monitorability (ISO/IEC 25010)
**Related rules:** REG-003, REG-006
**Framework ADR:** ADR-MF-002

---

## Context

REG-003 requires the orchestrator to have `settings.errorWorkflow` configured, but the
rule doesn't specify what that flow must do. Without a concrete definition, it's possible
to create an empty error flow that formally satisfies the rule with no operational value.

The Bot case has a specific characteristic the errorWorkflow must consider: the
orchestrator responds to the webhook with `Respond to Webhook`, but if a node fails before
reaching that node, the HTTP client receives a timeout or a generic n8n error with no
`run_id`. The errorWorkflow must:

1. Record the failure with enough context to correlate with E1's logs (where `run_id` was
   generated).
2. Notify the monitoring system (mock-bot) so the failure is visible without opening the
   n8n UI.
3. Guarantee the client receives a clear 500 response, not a timeout.

---

## Decision

The `bot-error-handler` flow implements three nodes in sequence:

### Node 1 — Code: Extract error context

```javascript
const errorContext = {
  run_id: $json.run_id || $json.execution?.variables?.run_id || 'UNKNOWN',
  node_name: $json.execution?.lastNodeExecuted || 'UNKNOWN',
  error_message: $json.error?.message || 'Error sin mensaje',
  error_type: $json.error?.name || 'UnknownError',
  workflow_name: $json.workflow?.name || 'bot-to-be-orquestador',
  etapa: 'BOT_ERROR_HANDLER',
  status: 'error',
  ts: new Date().toISOString()
};

console.log(JSON.stringify(errorContext));
return [{ json: errorContext }];
```

### Node 2 — HTTP Request: Notify mock-bot

```
POST http://mock-bot:3001/api/errors
Content-Type: application/json
Retry: enabled (2 retries, 1000ms wait)
Body: { run_id, node_name, error_message, error_type, ts }
```

### Node 3 — Respond to Webhook: 500 response to the client

```json
HTTP 500 Internal Server Error
{ "error": "Internal server error", "run_id": "{{run_id}}" }
```

**Flow name in n8n:** `bot-error-handler`
**Orchestrator reference:** `settings.errorWorkflow = "ID_DE_BOT_ERROR_HANDLER"`

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| Empty error flow (only formally satisfies REG-003) | No operational value — the failure remains invisible in production |
| errorWorkflow shared between Bot and IoT | Contexts differ: Bot needs to include session_id/user in the log, IoT needs sensor_id. A shared flow would lose that context |
| Log only, no HTTP notification to the mock | In a real environment, stdout logging may not be actively monitored; active notification guarantees immediate visibility |

---

## Consequences

**Positive:**
- Every Bot orchestrator failure generates a JSON log on stdout (queryable with
  `docker compose logs n8n | grep "BOT_ERROR_HANDLER"`) and an entry in mock-bot.
- The `run_id` in the log allows correlating the error with the E1–E4 logs that preceded
  the failure.
- The client always receives a structured 500 response instead of a timeout.

**Negative:**
- If mock-bot is unavailable when the error occurs, Node 2 will fail. The mitigation is
  that Node 1 (log) always runs first — the log persists even if the notification fails.
  Node 2's retry (2 retries) absorbs transient mock failures.

---

## Verification criterion

1. `settings.errorWorkflow` in the orchestrator's JSON → not empty (REG-003)
2. Stop mock-bot + send a valid request → stdout log with `"status":"error"` +
   `"etapa":"BOT_ERROR_HANDLER"` (REG-006)
3. The client receives HTTP 500 with `run_id` in the body
