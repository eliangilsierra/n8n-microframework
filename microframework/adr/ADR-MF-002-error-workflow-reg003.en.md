> 🌐 **Language / Idioma:** English · [Español](ADR-MF-002-error-workflow-reg003.md)

# ADR-MF-002 — Design of the mandatory errorWorkflow (REG-003)

**Level:** Micro-framework (applies to all orchestrator flows)
**Date:** 2026-05-01
**Status:** Accepted
**Quality attribute:** Reliability / Fault tolerance (ISO/IEC 25010)
**Related rule:** REG-003

---

## Context

Without `errorWorkflow` configured in the orchestrator flow's `settings`, n8n marks the
execution as failed without running any additional action. The failure is recorded only in
n8n's internal history, which:

1. Is not programmatically queryable (exposes no history API).
2. Emits no alerts or notifications.
3. Is not persistent if n8n's volume is lost.

The practical result is that production failures are **operationally invisible**: the
external system that sent the request receives a timeout or a 5xx error, but the team
doesn't know it happened until someone manually reviews the n8n UI.

The micro-framework must define what the errorWorkflow should do for REG-003 to have real
operational value, not just formal rule compliance.

---

## Decision

Every orchestrator flow must configure a dedicated errorWorkflow implementing the
following three actions in order:

### Action 1 — Extract error context

```javascript
const errorData = {
  run_id: $json.run_id || 'UNKNOWN',
  node_name: $json.execution?.lastNodeExecuted || 'UNKNOWN',
  error_message: $json.error?.message || 'No message',
  error_type: $json.error?.name || 'UnknownError',
  workflow_id: $json.workflow?.id,
  etapa: 'ERROR_HANDLER',
  status: 'error',
  ts: new Date().toISOString()
};
```

### Action 2 — Emit a structured JSON log

```javascript
console.log(JSON.stringify(errorData));
```

This log appears in the n8n container's stdout and is queryable with:
```bash
docker compose logs n8n | grep '"status":"error"'
```

### Action 3 — Notify the mock's error endpoint

```
POST /api/errors
Content-Type: application/json
Body: { run_id, node_name, error_message, error_type, ts }
```

The error flow always responds with status 500 to the original client so as not to mask
the failure.

### Mandatory configuration

In the orchestrator's JSON:
```json
"settings": {
  "errorWorkflow": "ID_DEL_ERROR_WORKFLOW"
}
```

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| Try/Catch in the orchestrator's Code nodes | Doesn't capture errors in non-Code nodes (HTTP Request, Postgres) that fail due to timeout or network error |
| No errorWorkflow — rely on n8n's history | Failures are operationally invisible; doesn't satisfy REG-003 with real value |
| Empty errorWorkflow (formal rule compliance only) | Formal compliance with no operational value — considered an antipattern in this micro-framework |
| External APM (Datadog, New Relic) | Dependency outside the project's declared scope |

---

## Consequences

**Positive:**
- Every orchestrator failure generates a record in the mock + a JSON log.
- The MTTD (Mean Time To Detect) for orchestrator failures drops to seconds (time to read
  the log with `docker compose logs n8n | grep "status:error"`).
- The `run_id` in the error log allows correlating with the successful stage logs that
  preceded the failure.

**Negative:**
- Requires creating and maintaining an error flow per orchestrator (2 additional flows:
  `bot-error-handler` and `iot-error-handler`).
- If the errorWorkflow itself fails (e.g., mock unavailable), the failure goes unnotified.
  Mitigation: the JSON log is always emitted before the HTTP call to the mock.

---

## Verification criterion (REG-003)

```bash
# In the orchestrator's exported JSON:
cat casos-de-estudio/bot/to-be/bot-to-be-orquestador.json | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
           console.log(d.settings?.errorWorkflow ? 'REG-003: CUMPLE' : 'REG-003: FALLA')"
```

The `settings.errorWorkflow` field must be a non-empty string.
