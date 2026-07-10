> 🌐 **Language / Idioma:** English · [Español](antipatrones.md)

# Documented antipatterns

These antipatterns are intentionally present in the case studies' as-is flows as a
baseline. The micro-framework exists to eliminate them in the to-be flows.

---

| Antipattern | Description | Consequence | Rule that fixes it |
|-------------|-------------|-------------|----------------------|
| Monolithic flow | All logic in a single flow with no subflows | High change impact: any modification can affect the whole flow | E1-E4 metamodel |
| Credentials in nodes | API keys or tokens as literal values in node configuration | Secret exposure in the flow's exported JSON | REG-001 |
| Missing validation | Processing the input payload without checking required fields or types | Failures in later stages with ambiguous error messages | Mandatory E1 |
| Logic in adapters | Business rules or calculations inside the integration adapter | Logic duplication, makes it harder to modify rules without touching integrations | REG-007, REG-008 |
| No idempotency | Writes without duplicate control on retries | Retries silently create duplicate records | REG-005 |
| No structured log | Only n8n's execution history as a diagnostic source | Impossible to compute per-segment latency or correlate events | REG-006 |
| No error flow | Not configuring `errorWorkflow` in the orchestrator | Failures are neither recorded nor notified — operationally invisible | REG-003 |
| Hardcoded ID coupling | The Execute Workflow node references subflows by a hardcoded numeric ID in the JSON | Re-importing the subflow generates a new ID; the orchestrator silently fails with no descriptive message | Document IDs in `notas-tecnicas.md` post-import; update references from the n8n UI |
| Chatty integration | Multiple HTTP calls to the same external service per execution when a single batch call would suffice | Total latency = N × unit latency; increases the surface for transient failures | REG-004, REG-008 — centralize in E3 and evaluate the external service's batch API |
| Exception swallowing | `try/catch` in a Code node with no re-throw or log; the exception is silenced and the node returns `status: 'ok'` | The flow continues with `undefined` or empty data; the error is completely invisible | REG-003, REG-006 — always re-throw or emit `console.log` with `status: 'fail'` before returning |
| God node | A single Code node with >100 lines mixing validation, domain, and format transformation | Violates the E1–E4 metamodel at the individual-node level; any change requires understanding the whole node | E1–E4 metamodel — if a node exceeds 50 lines of logic, split it into separate nodes or subflows |

---

## Examples in the project's as-is

### Bot as-is (`bot-as-is.json`)

- **Monolithic flow:** Validation, classification, persistence, and response all in a
  single flow
- **No idempotency:** The HTTP Request node to the ticketing system has no duplicate
  control
- **No structured log:** There is no `console.log` with JSON; only n8n's execution history
- **No error flow:** There is no `errorWorkflow` configured in settings

### IoT as-is (`iot-as-is.json`)

- **Credentials in nodes:** `db_token: 'token-influxdb-hardcodeado-789'` visible in the code
- **Logic in adapters:** Alert thresholds (`temperatura > 35`) are hardcoded, mixed with
  data transformation and the database call
- **Missing validation:** If a sensor field is missing, it remains `undefined` with no
  explicit error
- **No idempotency:** There is no `ON CONFLICT` on the database writes

---

## How to identify an antipattern in an existing flow

1. **Monolithic flow:** Open the flow in n8n. If there are no `Execute Workflow` nodes, it
   is monolithic.

2. **Credentials in nodes:** Export the JSON and search for: `token`, `api_key`, `password`,
   `Bearer`, `secret`. If any has a literal value (not a credential reference), it is
   hardcoded.

3. **Missing validation:** Review the first Code node. If there is no check for the
   presence of required fields with error messages, validation is missing.

4. **Logic in adapters:** Review the integration nodes (HTTP Request, Postgres). If they
   contain business conditions or calculations that are not format transformations, logic
   is mixed in.

5. **No idempotency:** Search for the INSERT SQL query. If it has no `ON CONFLICT`, there is
   no idempotency.

6. **No structured log:** Search for `console.log` in Code nodes. If they don't exist or
   don't produce JSON with `run_id` and `etapa`, the log is insufficient.

7. **No error flow:** Check the orchestrator's settings. If `settings.errorWorkflow` is
   empty or absent, errors are invisible.

8. **Hardcoded ID coupling:** Search for `Execute Workflow` nodes in the exported JSON. If
   the `workflowId` field is a number (e.g. `"workflowId": "42"`), it is hardcoded. IDs vary
   between n8n instances — they must be updated after every import.

9. **Chatty integration:** Count HTTP calls in E3 to the same host. If there are more than
   2 calls to the same endpoint per execution, investigate whether the service has a batch
   API.

10. **Exception swallowing:** Search for `try/catch` in Code nodes. If the `catch` has no
    `throw` or `console.log`, the exception is being silenced.

11. **God node:** Count the lines of `jsCode` in every Code node in the exported JSON. If
    a node exceeds 100 lines, evaluate whether it mixes responsibilities from multiple
    stages.
