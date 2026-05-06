# Resultado de aplicación del checklist-devsecops — IoT as-is

**Fecha:** 2026-04-21
**Archivo auditado:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Commit:** 152fd2d
**Referencia:** `microframework/checklists/checklist-devsecops.md`

---

## Resumen de los 3 pilares

| Pilar | Cumple | Evidencia |
|-------|--------|-----------|
| Gestión de secretos | ❌ parcial | Credenciales PG removidas del nodo (CR-ASIS-02), pero persisten 3 API keys literales en HTTP |
| Validación automatizada | ❌ parcial | Validador existe; as-is lo viola en 6/7 reglas |
| Resiliencia operacional | ❌ | Sin retry, sin errorWorkflow, sin idempotencia, sin log estructurado |

---

## Detalle

### Pilar 1 — Gestión de secretos

| Control | Estado | Evidencia |
|---------|--------|-----------|
| Credenciales PostgreSQL fuera del JSON | ✓ | CR-ASIS-02 IoT — nodo 10 usa credential-reference |
| API keys HTTP fuera del JSON | ❌ | Nodos 9, 11, 13 usan header literal |
| `.env` excluido de git | ✓ | `.gitignore` configurado |
| Rotación documentada | N/A | — |

### Pilar 2 — Validación automatizada

| Control | Estado | Evidencia |
|---------|--------|-----------|
| Validador estático existe | ✓ | `microframework/validacion/validar-flujos.mjs` |
| Patrones de secretos actualizados | ✓ | Bloque 3 cierre FASE 3 |
| Schemas JSON validables | ✓ | `iot-*.schema.json` |
| Aplicado al as-is | ✓ | Este documento |
| Validador en CI | ❌ | FASE 5 |

### Pilar 3 — Resiliencia operacional

| Control | Estado | Evidencia (nodo) |
|---------|--------|------------------|
| Retry en integraciones HTTP | ❌ | Nodos 9, 11, 13 sin retry |
| errorWorkflow | ❌ | Ausente |
| Idempotencia en escrituras | ❌ | Nodos 10, 13 INSERT sin ON CONFLICT |
| Log estructurado JSON | ❌ | Sin logs con run_id |
| Circuit breaker / rate-limit en integraciones | ❌ | No aplicable; no hay; el as-is no lo implementa |
| Response codes HTTP diferenciados | ❌ | Respond único 200/500 |

---

## Conclusión

El as-is del IoT viola los 3 pilares DevSecOps. Violación intencional documentada en
ADR-001 IoT y `cambios-y-evidencia.md`. Corrección en to-be vía ADRs 002, 003, 004.

## Referencia

- `notas-tecnicas.md`, `cambios-y-evidencia.md`
- `microframework/checklists/checklist-devsecops.md`
