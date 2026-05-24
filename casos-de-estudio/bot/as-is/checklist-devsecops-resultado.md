# Resultado de aplicación del checklist-devsecops — Bot as-is

**Fecha:** 2026-04-21
**Archivo auditado:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Commit:** 152fd2d
**Referencia:** `microframework/checklists/checklist-devsecops.md`

---

## Resumen de los 3 pilares

| Pilar | Cumple | Evidencia |
|-------|--------|-----------|
| Gestión de secretos | ❌ | 5 secretos literales detectados por validador estático |
| Validación automatizada | ❌ parcial | El validador existe pero el as-is lo viola en 6/7 reglas (evidencia de ciclo CI incompleto) |
| Resiliencia operacional | ❌ | Sin retry, sin errorWorkflow, sin idempotencia, sin log estructurado |

---

## Detalle

### Pilar 1 — Gestión de secretos (falla total)

| Control | Estado | Evidencia |
|---------|--------|-----------|
| Secretos fuera del JSON exportado | ❌ | Ver checklist-arquitectura §REG-001 — 5 literales presentes |
| Uso de credential-reference de n8n para servicios externos | ❌ | Nodos 8, 12, 14 usan header literal en vez de credential |
| `.env` excluido de git (`.gitignore`) | ✓ | `.gitignore` incluye `.env`, `n8n_data/`, `*.env` (convención del repositorio) |
| Rotación documentada | N/A | No aplica en as-is ad-hoc |

### Pilar 2 — Validación automatizada (parcial)

| Control | Estado | Evidencia |
|---------|--------|-----------|
| Validador estático existe | ✓ | `microframework/validacion/validar-flujos.mjs` |
| Validador detecta secretos literales | ✓ | Patrones actualizados en Bloque 3 del cierre de FASE 3 |
| Validador en CI del proyecto | ❌ | Aún no integrado a pipeline CI (fuera de alcance FASE 3, planificado para FASE 5) |
| Schemas JSON validables | ✓ | `microframework/contratos/bot-*.schema.json` actualizados |
| Aplicado al as-is | ✓ | Este documento es el resultado |

### Pilar 3 — Resiliencia operacional (falla total)

| Control | Estado | Evidencia (nodo) |
|---------|--------|------------------|
| Retry en integraciones HTTP | ❌ | Nodos 8, 12, 14 sin retry |
| errorWorkflow configurado | ❌ | `settings.errorWorkflow` ausente |
| Idempotencia en escrituras | ❌ | Nodo 13 INSERT sin ON CONFLICT |
| Log estructurado JSON | ❌ | Sin `console.log(JSON.stringify(...))` con run_id |
| Rate-limit con backend distribuido | ❌ | Nodo 3 usa `$getWorkflowStaticData('global')` (in-memory, no distribuido) |
| Response codes HTTP diferenciados | ❌ | Un solo `responseCode: 200` en el éxito |

---

## Conclusión

El as-is del Bot viola los 3 pilares DevSecOps simultáneamente. Este resultado es
**intencional** (antipatrón deliberado documentado en ADR-001 Bot y en
`cambios-y-evidencia.md` §CR-ASIS-01). La corrección se implementa en el to-be
(FASE 4–5) aplicando el micro-framework.

## Referencia

- `notas-tecnicas.md`, `cambios-y-evidencia.md`
- `microframework/checklists/checklist-devsecops.md`
- ADRs del caso
