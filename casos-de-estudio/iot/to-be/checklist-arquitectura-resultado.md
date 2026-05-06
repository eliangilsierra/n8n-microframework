# Resultado de aplicación del checklist-arquitectura — IoT to-be

**Fecha:** 2026-05-05
**Archivos auditados:**
- `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` (v1.1.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-error-handler.json` (v1.0.0)

**Aplicado por:** Elian Gil (FASE 4 — cierre)
**Referencia del checklist:** `microframework/checklists/checklist-arquitectura.md`
**Validación automatizada:** `microframework/validacion/reportes/validacion-2026-05-06.md`

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
| REG-001 | ✅ | Sin patrones de secretos literales en ningún JSON. E3 usa credencial n8n `"Postgres Local"`. E4 usa credencial `"Notificacion API Key"` | Verificado por `validar-flujos.mjs` — 0 ocurrencias en 6 archivos to-be |
| REG-002 | ✅ | `run_id` generado en E1 (`RUN-IOT-<ts>-<random>`), propagado como campo JSON a E2, E3 y E4. Presente en `console.log(JSON.stringify({run_id,...}))` en todos los subflujos con nodos Code | Trazabilidad end-to-end garantizada |
| REG-003 | ✅ | `settings.errorWorkflow = "iot-error-handler"` en orquestador. `iot-error-handler.json` implementa: Error Trigger → Code (log estructurado) → HTTP Request (mock notify con retry=3) | Workflow de error funcional |
| REG-004 | ✅ | Nodo `HTTP - Notificar canal CRITICO (con retry)`: `retry.enabled: true, maxRetries: 3, waitBetweenTries: 2000ms`. Nodo `HTTP - Notificar canal ADVERTENCIA (con retry)`: `retry.enabled: true, maxRetries: 2, waitBetweenTries: 1000ms`. Error handler: `retry.enabled: true, maxRetries: 3` | Diferenciación de reintentos según criticidad |
| REG-005 | ✅ | E3: `INSERT INTO lecturas_sensor (...) ON CONFLICT (idempotency_key) DO NOTHING`. `idempotency_key = {sensor_id}-{timestamp}` — clave natural única por lectura | Sin duplicados en Set K (prueba idempotencia) |
| REG-006 | ✅ | Log JSON estructurado con `{run_id, etapa, status}` en: E1 (E1_validacion_iot), E2 (E2_dominio_iot), E3 preparación (E3_persistencia_iot preparando), E3 log salida (E3_persistencia_iot), E4 log ok (E4_notificacion_iot ok), E4 log skip (E4_notificacion_iot skip), error-handler | Todos los `etapa` en español, sin typos |
| REG-007 | ✅ | E2 (`iot-to-be-e2-dominio.json`): solo contiene `Execute Workflow Trigger` + 1 nodo Code de análisis de umbrales. Sin nodos `httpRequest` ni `postgres` | `validar-flujos.mjs`: "E2 sin IO externo" |
| REG-008 | ✅ | Nodos HTTP únicamente en E4 (`iot-to-be-e4-notificacion.json`). Nodo Postgres únicamente en E3 (`iot-to-be-e3-persistencia.json`). E1 y E2 sin IO externo | `validar-flujos.mjs`: "IO ubicado correctamente" en E3 y E4 |
| REG-009 | ✅ | Orquestador: `Respond - OK (200)` → responseCode 200. `Respond - Datos invalidos (422)` → responseCode 422. Clientes pueden diferenciar éxito vs entrada inválida | Verificado en `run-log-iot-to-be.csv`: Set C retorna 422 ✅ |
| REG-010 | ✅ | 8 ADRs en `casos-de-estudio/iot/adr/`: ADR-001 a ADR-008. Cada decisión arquitectónica con justificación, alternativas y consecuencias | Verificado por `validar-flujos.mjs` REG-010: "8 ADR(s) presentes" |

---

## Análisis por subflujo

| Subflujo | Responsabilidad | REGs aplicables | Resultado |
|----------|----------------|----------------|-----------|
| E1 Validación | Campos obligatorios + rangos físicos + normalización + timestamp drift | REG-001, REG-002, REG-006, REG-010, REG-VOC | 5/5 ✅ |
| E2 Dominio | Análisis de umbrales ASHRAE 62.1 / ISO 7730 | REG-001, REG-002, REG-006, REG-007, REG-010, REG-VOC | 6/6 ✅ |
| E3 Persistencia | INSERT con idempotencia + log de resultado | REG-001, REG-002, REG-005, REG-006, REG-008, REG-010, REG-VOC | 7/7 ✅ |
| E4 Notificación | Routing por nivel (critico/advertencia) + retry diferenciado | REG-001, REG-002, REG-004, REG-006, REG-008, REG-010, REG-VOC | 7/7 ✅ |
| Orquestador | Pipeline E1→E2→E3→E4 + error workflow + status codes | REG-001, REG-003, REG-009, REG-010 | 4/4 ✅ |
| Error Handler | Captura errores + log + notificación de operador | REG-001, REG-002, REG-004, REG-006, REG-008, REG-010, REG-VOC | 7/7 ✅ |

---

## Evidencia del validador estático

```bash
node microframework/validacion/validar-flujos.mjs --caso iot --estado to-be --format md
```

Resultado: **todos los flujos to-be IoT 100%** (aplicables). Ver `microframework/validacion/reportes/validacion-2026-05-06.md`.

---

## Nota sobre iot-to-be-orquestador.json

El archivo versionado en `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` puede contener
placeholders `REEMPLAZAR_CON_ID_E*` en los nodos `executeWorkflow` si no se realizó la exportación
final desde la instancia n8n con IDs reales. Esta condición no afecta las REGs evaluadas
(REG-003, REG-009, REG-010) porque el validador no verifica los valores de `workflowId`.
**Acción requerida:** reemplazar el archivo con el export desde n8n que tiene los IDs reales.

---

## Referencias

- Notas técnicas as-is: `casos-de-estudio/iot/as-is/notas-tecnicas.md`
- Checklist as-is: `casos-de-estudio/iot/as-is/checklist-arquitectura-resultado.md`
- ADRs IoT: `casos-de-estudio/iot/adr/ADR-001` … `ADR-008`
- Matriz de trazabilidad: `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` (v1.3)
