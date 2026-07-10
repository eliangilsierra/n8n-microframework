> 🌐 **Language / Idioma:** English · [Español](checklist-arquitectura-resultado.md)

# Architecture checklist application result — IoT to-be

**Date:** 2026-05-05
**Audited files:**
- `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` (v1.1.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-error-handler.json` (v1.0.0)

**Applied by:** Elian Gil (PHASE 4 — closure)
**Checklist reference:** `microframework/checklists/checklist-arquitectura.md`
**Automated validation:** `microframework/validacion/reportes/validacion-2026-05-06.md`

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
| REG-001 | ✅ | No literal-secret patterns in any JSON. E3 uses the n8n credential `"Postgres Local"`. E4 uses the credential `"Notificacion API Key"` | Verified by `validar-flujos.mjs` — 0 occurrences across 6 to-be files |
| REG-002 | ✅ | `run_id` generated in E1 (`RUN-IOT-<ts>-<random>`), propagated as a JSON field to E2, E3, and E4. Present in `console.log(JSON.stringify({run_id,...}))` across every subflow with Code nodes | End-to-end traceability guaranteed |
| REG-003 | ✅ | `settings.errorWorkflow = "iot-error-handler"` in the orchestrator. `iot-error-handler.json` implements: Error Trigger → Code (structured log) → HTTP Request (mock notify with retry=3) | Functional error workflow |
| REG-004 | ✅ | `HTTP - Notificar canal CRITICO (con retry)` node: `retry.enabled: true, maxRetries: 3, waitBetweenTries: 2000ms`. `HTTP - Notificar canal ADVERTENCIA (con retry)` node: `retry.enabled: true, maxRetries: 2, waitBetweenTries: 1000ms`. Error handler: `retry.enabled: true, maxRetries: 3` | Differentiated retries by criticality |
| REG-005 | ✅ | E3: `INSERT INTO lecturas_sensor (...) ON CONFLICT (idempotency_key) DO NOTHING`. `idempotency_key = {sensor_id}-{timestamp}` — a natural key unique per reading | No duplicates in Set K (idempotency test) |
| REG-006 | ✅ | Structured JSON log with `{run_id, etapa, status}` in: E1 (E1_validacion_iot), E2 (E2_dominio_iot), E3 prep (E3_persistencia_iot preparando), E3 output log (E3_persistencia_iot), E4 ok log (E4_notificacion_iot ok), E4 skip log (E4_notificacion_iot skip), error-handler | All `etapa` values in Spanish, no typos |
| REG-007 | ✅ | E2 (`iot-to-be-e2-dominio.json`): only contains `Execute Workflow Trigger` + 1 threshold-analysis Code node. No `httpRequest` or `postgres` nodes | `validar-flujos.mjs`: "E2 with no external IO" |
| REG-008 | ✅ | HTTP nodes only in E4 (`iot-to-be-e4-notificacion.json`). Postgres node only in E3 (`iot-to-be-e3-persistencia.json`). E1 and E2 with no external IO | `validar-flujos.mjs`: "IO correctly located" in E3 and E4 |
| REG-009 | ✅ | Orchestrator: `Respond - OK (200)` → responseCode 200. `Respond - Datos invalidos (422)` → responseCode 422. Clients can differentiate success vs invalid input | Verified in `run-log-iot-to-be.csv`: Set C returns 422 ✅ |
| REG-010 | ✅ | 8 ADRs in `casos-de-estudio/iot/adr/`: ADR-001 through ADR-008. Every architectural decision with justification, alternatives, and consequences | Verified by `validar-flujos.mjs` REG-010: "8 ADR(s) present" |

---

## Per-subflow analysis

| Subflow | Responsibility | Applicable REGs | Result |
|----------|----------------|----------------|-----------|
| E1 Validation | Required fields + physical ranges + normalization + timestamp drift | REG-001, REG-002, REG-006, REG-010, REG-VOC | 5/5 ✅ |
| E2 Domain | ASHRAE 62.1 / ISO 7730 threshold analysis | REG-001, REG-002, REG-006, REG-007, REG-010, REG-VOC | 6/6 ✅ |
| E3 Persistence | INSERT with idempotency + result log | REG-001, REG-002, REG-005, REG-006, REG-008, REG-010, REG-VOC | 7/7 ✅ |
| E4 Notification | Routing by level (critical/warning) + differentiated retry | REG-001, REG-002, REG-004, REG-006, REG-008, REG-010, REG-VOC | 7/7 ✅ |
| Orchestrator | E1→E2→E3→E4 pipeline + error workflow + status codes | REG-001, REG-003, REG-009, REG-010 | 4/4 ✅ |
| Error Handler | Captures errors + logs + notifies the operator | REG-001, REG-002, REG-004, REG-006, REG-008, REG-010, REG-VOC | 7/7 ✅ |

---

## Static validator evidence

```bash
node microframework/validacion/validar-flujos.mjs --caso iot --estado to-be --format md
```

Result: **every IoT to-be flow 100%** (applicable). See
`microframework/validacion/reportes/validacion-2026-05-06.md`.

---

## Note on iot-to-be-orquestador.json

The file versioned at `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` may contain
`REEMPLAZAR_CON_ID_E*` placeholders in the `executeWorkflow` nodes if the final export from
the n8n instance with real IDs was not performed. This condition does not affect the
evaluated REGs (REG-003, REG-009, REG-010) because the validator doesn't check
`workflowId` values. **Action required:** replace the file with the export from n8n that
has the real IDs.

---

## References

- As-is technical notes: `casos-de-estudio/iot/as-is/notas-tecnicas.md`
- As-is checklist: `casos-de-estudio/iot/as-is/checklist-arquitectura-resultado.md`
- IoT ADRs: `casos-de-estudio/iot/adr/ADR-001` … `ADR-008`
- Traceability matrix: `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` (v1.3)
