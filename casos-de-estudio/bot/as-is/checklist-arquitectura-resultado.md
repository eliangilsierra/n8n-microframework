# Resultado de aplicación del checklist-arquitectura — Bot as-is

**Fecha:** 2026-04-21
**Archivo auditado:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Commit:** 152fd2d
**Aplicado por:** Elian Gil (FASE 3 — cierre)
**Referencia del checklist:** `microframework/checklists/checklist-arquitectura.md`

---

## Resumen

- **Items aplicables:** 7 / 10 (REG-003 y REG-010 son arquitectónicos globales; REG-007 N/A al orquestador as-is porque no hay subflujo E2 — se verifica conceptualmente).
- **Items cumplidos:** 1 / 7 (solo REG-010 por presencia de ADRs en `casos-de-estudio/bot/adr/`).
- **Items violados:** 6 / 7.
- **Severidad global:** Alta (el as-is es intencionalmente patológico).

---

## Detalle por REG

| REG-* | Cumple | Evidencia (nodo / línea) | Severidad | Notas |
|-------|--------|---------------------------|-----------|-------|
| REG-001 | ❌ | Nodo 6 `rightValue: "mi-token-secreto-hardcodeado-123"`; nodo 8 header `x-api-key: clave-historial-hardcodeada-789`; nodo 9 jsCode `const api_source_token = "..."`; nodo 12 header `x-api-key`; nodo 14 header `x-api-key` | Alta | 5 secretos literales |
| REG-002 | ❌ | Ningún nodo Code genera ni propaga `run_id`. No hay `console.log(JSON.stringify(...))` con run_id | Alta | Trazabilidad imposible sin run_id |
| REG-003 | ❌ | `settings.errorWorkflow` ausente en el orquestador | Alta | Fallos abortan silenciosamente |
| REG-004 | ❌ | Nodos 8, 12, 14 son `httpRequest` sin `options.retry.enabled` | Alta | 3 integraciones sin retry |
| REG-005 | ❌ | Nodo 13 `INSERT INTO interacciones_bot` sin `ON CONFLICT` ni columna `idempotency_key` | Alta | Duplicados en reintento |
| REG-006 | ❌ | Ningún nodo Code emite log JSON estructurado con `{run_id, etapa, status}` | Media | Observabilidad imposible |
| REG-007 | — | N/A estructural: el as-is no tiene subflujo E2. Conceptualmente violada (umbrales y lógica de dominio dispersos en nodos 9, 10) | Alta | Contribuye a violación de CR1 |
| REG-008 | ❌ | Integraciones HTTP (nodos 8, 12, 14) + Postgres (13) inline en el orquestador, no en subflujos E3/E4 | Alta | CR2 toca múltiples nodos |
| REG-009 | ❌ | Todos los `respondToWebhook` retornan 200 u otro código fijo; sin diferenciación 4xx específica (422, 409, etc.) | Media | Clientes no pueden reaccionar |
| REG-010 | ✓ | `casos-de-estudio/bot/adr/` contiene ADRs 001, 002, 003, 004 | — | Cumplido en FASE 3 |

---

## Evidencia complementaria

- **Salida del validador estático:**
  `node microframework/validacion/validar-flujos.mjs --caso bot --estado as-is --format json`
  reporta 6/7 reglas aplicables violadas (REG-001, REG-002, REG-003, REG-004, REG-005,
  REG-006, REG-008) y REG-010 cumplida.
- **Run-log:** `medicion/run-logs/bot/run-log-bot-as-is.csv` — 2000 corridas muestran
  que 100% de las corridas carecen de `run_id` propagado al cliente.

---

## Referencia

- Notas técnicas: `notas-tecnicas.md`
- Change-log: `cambios-y-evidencia.md`
- ADRs de corrección (to-be): `../adr/ADR-001`, `ADR-002`
- Reporte del validador: `microframework/validacion/reportes/validacion-2026-04-21.md`
