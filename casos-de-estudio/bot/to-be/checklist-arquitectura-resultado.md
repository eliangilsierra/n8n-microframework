# Resultado de aplicación del checklist-arquitectura — Bot to-be

**Fecha:** 2026-05-02
**Archivos auditados:**
- `microframework/plantillas/bot-to-be-orquestador.json` (v1.2.0)
- `microframework/plantillas/bot-to-be-e2-dominio.json` (v1.0.0)
- `microframework/plantillas/bot-to-be-e3-adaptador.json` (v1.0.0)
- `microframework/plantillas/bot-error-handler.json` (v1.0.0)

**Aplicado por:** Elian Gil (FASE 4 — fixes post-análisis arquitectónico)
**Referencia del checklist:** `microframework/checklists/checklist-arquitectura.md`

---

## Resumen

- **Items aplicables:** 10 / 10
- **Items cumplidos:** 10 / 10
- **Items violados:** 0 / 10
- **Severidad global:** Sin violaciones — micro-framework aplicado correctamente.

---

## Detalle por REG

| REG-* | Cumple | Evidencia (nodo / archivo) | Notas |
|-------|--------|----------------------------|-------|
| REG-001 | ✅ | Token leído con `$env.BOT_API_TOKEN` (try/catch) en E1. API key de tickets referenciada como credencial n8n `"Ticket API Key"` en E3 — no aparece valor literal en ningún JSON exportado | Verificado por `validar-flujos.mjs` |
| REG-002 | ✅ | `run_id` generado en E1 (`RUN-BOT-<ts>-<random>`), propagado como campo del json a E2 y E3. Presente en `console.log(JSON.stringify({run_id,...}))` en los tres nodos Code | Trazabilidad end-to-end garantizada |
| REG-003 | ✅ | `settings.errorWorkflow = "bot-error-handler"` en orquestador. `bot-error-handler.json` implementa: Error Trigger → Code (log estructurado) → HTTP Request (mock notify) | Workflow de error funcional, no solo nominal |
| REG-004 | ✅ | Nodo `HTTP - POST ticket (con retry)` en E3: `retry.enabled: true`, `maxRetries: 3`, `waitBetweenTries: 2000ms` | 3 intentos con backoff de 2 s |
| REG-005 | ✅ | `idempotency_key = ${run_id}-ticket` generado en E3 Code y enviado como header `Idempotency-Key` en el HTTP Request — el mock-bot deduplica por esta clave | Sin duplicados en reintento (Set K) |
| REG-006 | ✅ | Log JSON estructurado con `{run_id, etapa, status}` en: E1 (orquestador), E2 (code-dominio), E3 (code-log-e3), bot-error-handler (code-log-error) | Todos los `etapa` son string válido sin typos (fix F1 aplicado) |
| REG-007 | ✅ | Lógica de negocio centralizada en E2: array `REGLAS` con R001–R004 + DEFAULT. Modificar prioridad de R002 toca únicamente `bot-to-be-e2-dominio.json` | CR1 verificable: `nodes_touched = 1` |
| REG-008 | ✅ | Integración HTTP con sistema de tickets encapsulada en E3 (`bot-to-be-e3-adaptador.json`). El orquestador no contiene nodos `httpRequest` | CR2 verificable: `nodes_touched = 1` |
| REG-009 | ✅ | Respuestas HTTP tipadas: `200 OK` (pipeline ok), `400 Bad Request` (campo ausente), `401 Unauthorized` (token inválido), `500 Internal Server Error` (fallo en E2/E3 con `continueOnFail`) | Clientes pueden reaccionar a cada código |
| REG-010 | ✅ | ADRs 001–008 documentados en `casos-de-estudio/bot/adr/`. Cada decisión arquitectónica tiene justificación, alternativas y consecuencias | Documentación al día tras FASE 4 |

---

## Cambios aplicados en FASE 4 (post-análisis)

Los siguientes fixes fueron aplicados antes de cerrar esta auditoría:

| Fix | Descripción |
|-----|-------------|
| F1 | Typo `etaga` → `etapa` en log E1 del orquestador |
| F2 | Null guard `(payload?.message \|\| '').toLowerCase()` en E2 |
| F3 | Nodo `Respond-500` + `IF - Error en pipeline?` + `continueOnFail: true` en exec-e2/e3 |
| F4 | Refactor validación de token con flag `tokenPresente` en lugar de `filter(e.includes('token'))` |
| F5 | Creación del workflow `bot-error-handler.json` (antes referenciado pero inexistente) |
| F6 | Comentario explicativo en E3 sobre acoplamiento por nombre de nodo (`$node["..."].json`) |

---

## Evidencia del validador estático

```bash
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be --format md
```

Resultado esperado: **10/10 reglas cumplidas** (100 %).

---

## Referencias

- Notas técnicas del as-is: `casos-de-estudio/bot/as-is/notas-tecnicas.md`
- Checklist as-is: `casos-de-estudio/bot/as-is/checklist-arquitectura-resultado.md`
- ADRs: `casos-de-estudio/bot/adr/ADR-001` … `ADR-008`
- Matriz de trazabilidad: `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md` (v1.3+)
