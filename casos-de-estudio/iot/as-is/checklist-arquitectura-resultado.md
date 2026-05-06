# Resultado de aplicación del checklist-arquitectura — IoT as-is

**Fecha:** 2026-04-21
**Archivo auditado:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Commit:** 152fd2d
**Aplicado por:** Elian Gil (FASE 3 — cierre)
**Referencia del checklist:** `microframework/checklists/checklist-arquitectura.md`

---

## Resumen

- **Items aplicables:** 7 / 10.
- **Items cumplidos:** 1 / 7 (REG-010).
- **Items violados:** 6 / 7.
- **Severidad global:** Alta.

---

## Detalle por REG

| REG-* | Cumple | Evidencia (nodo) | Severidad | Notas |
|-------|--------|------------------|-----------|-------|
| REG-001 | ❌ | Nodo 9 header `x-api-key: literal`; nodo 11 `Authorization: Bearer <literal>`; nodo 13 header `x-api-key` | Alta | Credenciales PG removidas (CR-ASIS-02 IoT) |
| REG-002 | ❌ | Ningún nodo genera/propaga `run_id` | Alta | |
| REG-003 | ❌ | `settings.errorWorkflow` ausente | Alta | |
| REG-004 | ❌ | Nodos 9, 11, 13 httpRequest sin retry | Alta | |
| REG-005 | ❌ | Nodo 10 INSERT `lecturas_sensor` sin ON CONFLICT; nodo 13 INSERT auditoría sin ON CONFLICT | Alta | 2 escrituras afectadas |
| REG-006 | ❌ | Sin log JSON estructurado | Media | |
| REG-007 | ❌ | Umbrales hardcodeados `if (temp > 35)` en nodo 5; enriquecimiento de dominio mezclado con IO en nodo 7 | Alta | CR1 toca 6 nodos |
| REG-008 | ❌ | HTTP/Postgres inline en orquestador (nodos 9, 10, 11, 13) — sin subflujos E3/E4 | Alta | |
| REG-009 | ❌ | Respond único 200; sin distinguir 422 (validación) vs 400 (formato) vs 409 (duplicado) | Media | |
| REG-010 | ✓ | `casos-de-estudio/iot/adr/` contiene ADRs 001, 002, 003, 004 | — | |

---

## Evidencia complementaria

- **Validador estático:** `node microframework/validacion/validar-flujos.mjs --caso iot --estado as-is`
  reporta 6/7 aplicables violadas.
- **Query verificación REG-005:**
  `SELECT sensor_id, timestamp, COUNT(*) FROM lecturas_sensor GROUP BY 1,2 HAVING COUNT(*) > 1;`
  en la BD post-corridas as-is retorna N filas duplicadas (evidencia cuantitativa del
  antipatrón; set K hace visible esta patología por diseño).

---

## Referencia

- `notas-tecnicas.md`, `cambios-y-evidencia.md`
- ADRs de corrección: `../adr/ADR-001`, `ADR-002`, `ADR-003`, `ADR-004`
