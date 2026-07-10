> 🌐 **Language / Idioma:** English · [Español](checklist-arquitectura-resultado.md)

# Architecture checklist application result — Bot as-is

**Date:** 2026-04-21
**Audited file:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Commit:** 152fd2d
**Applied by:** Elian Gil (PHASE 3 — closure)
**Checklist reference:** `microframework/checklists/checklist-arquitectura.md`

---

## Summary

- **Applicable items:** 7 / 10 (REG-003 and REG-010 are global architectural items;
  REG-007 N/A for the as-is orchestrator because there is no E2 subflow — verified
  conceptually).
- **Items passed:** 1 / 7 (only REG-010, due to the presence of ADRs in
  `casos-de-estudio/bot/adr/`).
- **Items violated:** 6 / 7.
- **Overall severity:** High (the as-is is intentionally pathological).

---

## Detail per REG

| REG-* | Passes | Evidence (node / line) | Severity | Notes |
|-------|--------|---------------------------|-----------|-------|
| REG-001 | ❌ | Node 6 `rightValue: "mi-token-secreto-hardcodeado-123"`; node 8 header `x-api-key: clave-historial-hardcodeada-789`; node 9 jsCode `const api_source_token = "..."`; node 12 header `x-api-key`; node 14 header `x-api-key` | High | 5 literal secrets |
| REG-002 | ❌ | No Code node generates or propagates a `run_id`. No `console.log(JSON.stringify(...))` with run_id | High | Traceability impossible without run_id |
| REG-003 | ❌ | `settings.errorWorkflow` absent from the orchestrator | High | Failures abort silently |
| REG-004 | ❌ | Nodes 8, 12, 14 are `httpRequest` with no `options.retry.enabled` | High | 3 integrations with no retry |
| REG-005 | ❌ | Node 13 `INSERT INTO interacciones_bot` with no `ON CONFLICT` or `idempotency_key` column | High | Duplicates on retry |
| REG-006 | ❌ | No Code node emits a structured JSON log with `{run_id, etapa, status}` | Medium | Observability impossible |
| REG-007 | — | Structural N/A: the as-is has no E2 subflow. Conceptually violated (thresholds and domain logic scattered in nodes 9, 10) | High | Contributes to the CR1 violation |
| REG-008 | ❌ | HTTP integrations (nodes 8, 12, 14) + Postgres (13) inline in the orchestrator, not in E3/E4 subflows | High | CR2 touches multiple nodes |
| REG-009 | ❌ | All `respondToWebhook` return 200 or another fixed code; no specific 4xx differentiation (422, 409, etc.) | Medium | Clients cannot react |
| REG-010 | ✓ | `casos-de-estudio/bot/adr/` contains ADRs 001, 002, 003, 004 | — | Met in PHASE 3 |

---

## Complementary evidence

- **Static validator output:**
  `node microframework/validacion/validar-flujos.mjs --caso bot --estado as-is --format json`
  reports 6/7 applicable rules violated (REG-001, REG-002, REG-003, REG-004, REG-005,
  REG-006, REG-008) and REG-010 passed.
- **Run-log:** `medicion/run-logs/bot/run-log-bot-as-is.csv` — 2000 runs show that 100% of
  runs lack a `run_id` propagated to the client.

---

## Reference

- Technical notes: `notas-tecnicas.md`
- Change log: `cambios-y-evidencia.md`
- Fix ADRs (to-be): `../adr/ADR-001`, `ADR-002`
- Validator report: `microframework/validacion/reportes/validacion-2026-04-21.md`
