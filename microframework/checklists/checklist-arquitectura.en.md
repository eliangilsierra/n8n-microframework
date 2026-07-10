> 🌐 **Language / Idioma:** English · [Español](checklist-arquitectura.md)

# Architecture checklist — To-be flows

Apply before versioning any to-be flow (exporting the JSON and committing). All items must
be checked as passed. If any fails, fix it before versioning.

**Case:** _______________
**Flow version:** _______________
**Verification date:** _______________
**Responsible:** _______________

---

## Mandatory rules (REG-001..010)

```
[ ] REG-001: exported JSON without hardcoded credentials
             → Search the JSON for: token, api_key, password, Bearer, secret
             → None should have a literal value

[ ] REG-002: run_id present in the output of all subflows
             → Verify in every subflow that the run_id field is in the output JSON

[ ] REG-003: errorWorkflow configured in the orchestrator's settings
             → settings.errorWorkflow in the JSON is not empty or null

[ ] REG-004: retry enabled on all HTTP Request nodes
             → options.retry.enabled: true on every HTTP Request node in E3/E4

[ ] REG-005: writes with idempotency control
             → SQL query includes ON CONFLICT (idempotency_key) DO NOTHING

[ ] REG-006: structured JSON log at every stage
             → Every Code node includes console.log(JSON.stringify({run_id, etapa, status, ...}))

[ ] REG-007: E2 without HTTP or database nodes
             → The E2 subflow only contains Code and Execute Workflow Trigger nodes

[ ] REG-008: integrations only in E3 and E4
             → HTTP Request and Postgres nodes only in E3 and E4 subflows

[ ] REG-009: appropriate HTTP status codes in responses
             → 200 success, 400/422 invalid input, 401 no authentication

[ ] REG-010: at least one ADR documented in the adr/ folder
             → casos-de-estudio/{case}/adr/ contains at least ADR-001-*.md
```

---

## Result

| Items passed | Items failed | Decision |
|-----------------|----------------|----------|
| /10 | /10 | Approve / Reject |

**Notes:**

---

*See rule detail in `microframework/reglas/reglas-obligatorias.md`*
