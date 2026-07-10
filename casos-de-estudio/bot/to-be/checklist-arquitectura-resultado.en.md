> 🌐 **Language / Idioma:** English · [Español](checklist-arquitectura-resultado.md)

# Architecture checklist application result — Bot to-be

**Date:** 2026-05-02
**Audited files:**
- `microframework/plantillas/bot-to-be-orquestador.json` (v1.2.0)
- `microframework/plantillas/bot-to-be-e2-dominio.json` (v1.0.0)
- `microframework/plantillas/bot-to-be-e3-adaptador.json` (v1.0.0)
- `microframework/plantillas/bot-error-handler.json` (v1.0.0)

**Applied by:** Elian Gil (PHASE 4 — post-architectural-analysis fixes)
**Checklist reference:** `microframework/checklists/checklist-arquitectura.md`

---

## Summary

- **Applicable items:** 10 / 10
- **Items passed:** 10 / 10
- **Items violated:** 0 / 10
- **Overall severity:** No violations — micro-framework correctly applied.

---

## Detail per REG

| REG-* | Passes | Evidence (node / file) | Notes |
|-------|--------|----------------------------|-------|
| REG-001 | ✅ | Token read with `$env.BOT_API_TOKEN` (try/catch) in E1. Ticket API key referenced as the n8n credential `"Ticket API Key"` in E3 — no literal value appears in any exported JSON | Verified by `validar-flujos.mjs` |
| REG-002 | ✅ | `run_id` generated in E1 (`RUN-BOT-<ts>-<random>`), propagated as a json field to E2 and E3. Present in `console.log(JSON.stringify({run_id,...}))` in all three Code nodes | End-to-end traceability guaranteed |
| REG-003 | ✅ | `settings.errorWorkflow = "bot-error-handler"` in the orchestrator. `bot-error-handler.json` implements: Error Trigger → Code (structured log) → HTTP Request (mock notify) | Functional error workflow, not just nominal |
| REG-004 | ✅ | `HTTP - POST ticket (con retry)` node in E3: `retry.enabled: true`, `maxRetries: 3`, `waitBetweenTries: 2000ms` | 3 attempts with a 2 s backoff |
| REG-005 | ✅ | `idempotency_key = ${run_id}-ticket` generated in E3's Code node and sent as the `Idempotency-Key` header in the HTTP Request — mock-bot deduplicates by this key | No duplicates on retry (Set K) |
| REG-006 | ✅ | Structured JSON log with `{run_id, etapa, status}` in: E1 (orchestrator), E2 (code-dominio), E3 (code-log-e3), bot-error-handler (code-log-error) | Every `etapa` is a valid string with no typos (fix F1 applied) |
| REG-007 | ✅ | Business logic centralized in E2: `REGLAS` array with R001–R004 + DEFAULT. Modifying R002's priority touches only `bot-to-be-e2-dominio.json` | CR1 verifiable: `nodes_touched = 1` |
| REG-008 | ✅ | HTTP integration with the ticketing system encapsulated in E3 (`bot-to-be-e3-adaptador.json`). The orchestrator contains no `httpRequest` nodes | CR2 verifiable: `nodes_touched = 1` |
| REG-009 | ✅ | Typed HTTP responses: `200 OK` (pipeline ok), `400 Bad Request` (missing field), `401 Unauthorized` (invalid token), `500 Internal Server Error` (failure in E2/E3 with `continueOnFail`) | Clients can react to every code |
| REG-010 | ✅ | ADRs 001–008 documented in `casos-de-estudio/bot/adr/`. Every architectural decision has justification, alternatives, and consequences | Documentation up to date after PHASE 4 |

---

## Changes applied in PHASE 4 (post-analysis)

The following fixes were applied before closing this audit:

| Fix | Description |
|-----|-------------|
| F1 | Typo `etaga` → `etapa` in the orchestrator's E1 log |
| F2 | Null guard `(payload?.message \|\| '').toLowerCase()` in E2 |
| F3 | `Respond-500` node + `IF - Error en pipeline?` + `continueOnFail: true` in exec-e2/e3 |
| F4 | Token validation refactor with a `tokenPresente` flag instead of `filter(e.includes('token'))` |
| F5 | Creation of the `bot-error-handler.json` workflow (previously referenced but nonexistent) |
| F6 | Explanatory comment in E3 about coupling via node name (`$node["..."].json`) |

---

## Static validator evidence

```bash
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be --format md
```

Expected result: **10/10 rules passed** (100%).

---

## References

- As-is technical notes: `casos-de-estudio/bot/as-is/notas-tecnicas.md`
- As-is checklist: `casos-de-estudio/bot/as-is/checklist-arquitectura-resultado.md`
- ADRs: `casos-de-estudio/bot/adr/ADR-001` … `ADR-008`
- Traceability matrix: `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md` (v1.3+)
