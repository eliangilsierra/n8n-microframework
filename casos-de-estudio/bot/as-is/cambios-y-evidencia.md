# Cambios y evidencia del as-is — Bot

## Propósito

Este documento registra cronológicamente cada cambio arquitectónico hecho al as-is del
caso Bot durante FASE 2, con rationale, commit de evidencia y vinculación a reglas del
micro-framework. Es el documento de respaldo para la auditoría ATAM y la defensa académica.

Complementa a `notas-tecnicas.md` (que documenta el *estado final* del as-is y sus
antipatrones) aportando la **trayectoria** cronológica y el razonamiento de cada decisión.

---

## Línea base inicial

El as-is del Bot inició como un flujo n8n de **10 nodos** modelando un chatbot
conversacional con persistencia PostgreSQL. Cubría el flujo mínimo:

`Webhook → Validar Token → Procesar Mensaje → Guardar Interacción → Responder`

Limitaciones arquitectónicas identificadas en la primera ejecución (19/04/2026):

- Un único endpoint externo (insuficiente para estresar REG-004 retry).
- Sin lógica de rate-limiting (no exhibía REG-002).
- Sin integraciones secundarias (no exhibía REG-008).
- Sin campos de error variables (REG-009 no medible).

Decisión: el as-is inicial **no era suficientemente patológico** para servir como línea
base comparativa frente al to-be. Se planificó un rediseño estructural.

---

## Change-log cronológico

### CR-ASIS-01 (2026-04-19) — Rediseño estructural del flujo Bot (10 → 16 nodos)

**Descripción:** Expansión del flujo as-is para exhibir deliberadamente las 9 reglas
que el validador estático es capaz de detectar (REG-001, REG-002, REG-004, REG-005,
REG-006, REG-007, REG-008, REG-009 + REG-010 por ausencia de ADR específico).

**Rationale:** El as-is inicial no producía evidencia cuantitativa suficiente de los
antipatrones que el micro-framework busca corregir. Sin estas violaciones visibles
en el as-is, la comparación FASE 6 carece de contraste: la tesis necesita que el
as-is sea "malo a propósito" para que el delta vs. to-be sea atribuible al
micro-framework y no a ruido experimental.

**Nodos agregados/modificados:**

| Nodo | Cambio | REG-* violada |
|------|--------|----------------|
| 3 `Verificar Rate Limit` | NUEVO — `$getWorkflowStaticData('global')` in-memory, ventana fija 60s | REG-002 |
| 6 `Validar Token` | `rightValue: "mi-token-secreto-hardcodeado-123"` | REG-001 |
| 8 `Consultar Historial Usuario` | NUEVO — GET `/api/user/:id/tickets` con header `x-api-key: literal` hardcodeado, sin retry | REG-001, REG-004 |
| 9 `Procesar Mensaje` | `const api_source_token = "..."` dentro de jsCode | REG-001 |
| 12 `Crear Ticket` | NUEVO — POST `/api/tickets` con `x-api-key: literal`, sin retry | REG-001, REG-004 |
| 13 `Guardar Interacción` | INSERT sin `ON CONFLICT`, sin `idempotency_key` en columna | REG-005 |
| 14 `Notificar Sistema Externo` | NUEVO — POST `/api/notify` con header literal, sin retry | REG-001, REG-004 |
| orquestador | Todos los nodos HTTP inline, sin subflujos E3/E4 | REG-008 |
| todos | Sin `console.log(JSON.stringify({run_id, etapa, status}))` | REG-006 |
| settings | Sin `errorWorkflow` configurado | REG-003 |
| Respond to Webhook | `responseCode` único 200, sin diferenciar 4xx/5xx | REG-009 |

**Commit:** `cff317a` — *feat(casos-de-estudio): bot and iot as-is flows with ADRs and technical notes*

**Evidencia:**
- `notas-tecnicas.md` §Tabla de nodos y §Mapeo detallado REG-001…010
- Validador estático: `node microframework/validacion/validar-flujos.mjs --caso bot --estado as-is` reporta 7 reglas aplicables → 6 violadas (REG-001 a REG-008 menos REG-003) + REG-009 N/A inicial.
- Primera medición en `medicion/run-logs/bot/run-log-bot-as-is.csv` filas 1..600 (sets A, B, C).

**REG-* involucradas:** REG-001, REG-002, REG-004, REG-005, REG-006, REG-007, REG-008, REG-009.

**Formalización:** ADR-001 Bot (separación de responsabilidades de flujo).

---

### CR-ASIS-02 (2026-04-19) — Endpoint mock `/api/user/:userId/tickets` agregado

**Descripción:** El nuevo nodo 8 (`Consultar Historial Usuario`) requería un endpoint
mock GET de lectura para el Bot. El `mock-bot-server` solo exponía POST de escritura.

**Rationale:** Sin un endpoint GET de lectura, el nodo 8 fallaba 100% de las corridas
y contaminaba el run-log con error_type uniforme. Se necesita que el nodo responda
200 con historial simulado para que el antipatrón a medir sea "falta de retry" y no
"endpoint inexistente".

**Archivos tocados:**
- `infraestructura/mock-bot-server/server.js` — ruta GET agregada
- `infraestructura/mock-bot-server/package.json` — sin cambios

**Commit:** `cff317a`

**Evidencia:** `curl -s http://localhost:3001/api/user/user-001/tickets` retorna
`{"tickets":[...]}` → nodo 8 ya no falla por 404.

**REG-* involucradas:** ninguna (cambio en infraestructura de pruebas, no en el flujo).

---

### CR-ASIS-03 (2026-04-21) — Ajuste LIMITE rate-limit de 10 a 150

**Descripción:** Aumento del umbral de rate-limit en `bot-as-is.json` para permitir
N=200 corridas por set sin activación del rate-limiter. Creación de
`bot-as-is-ratelimit-demo.json` con LIMITE=10 para la demostración cualitativa del
antipatrón REG-002.

**Rationale:** Con LIMITE=10 y sets que reutilizan `user-001`, el patrón
10✓/190✗ saturaba los run-logs y enmascaraba la señal de REG-001, REG-004 a REG-009.
La solución dual preserva el antipatrón estructural (rate-limit in-memory no
distribuido) sin interferir con la medición estadística.

**Archivos tocados:**
- `casos-de-estudio/bot/as-is/bot-as-is.json` — `const LIMITE = 10` → `const LIMITE = 150`
- `casos-de-estudio/bot/as-is/bot-as-is-ratelimit-demo.json` — NUEVO (copia con LIMITE=10)
- `microframework/plantillas/bot-as-is.json` — ajuste análogo

**Commit:** `a126311` — *feat(medicion): input sets A-K, deterministic generator, seeds, and analysis*

**Evidencia:**
- `medicion/run-logs/bot/run-log-bot-as-is.csv` post-cambio: N=200 corridas completas
  por set sin activación del rate-limit.
- Validador estático sigue marcando REG-002 violada en ambas versiones (la violación
  es arquitectónica, no numérica).

**REG-* involucradas:** REG-002 (se preserva la violación; solo cambia el trigger).

**Formalización:** ADR-003 Bot (separación de medición estadística y demostración
del antipatrón REG-002).

---

### CR-ASIS-04 (2026-04-21) — Ampliación de Input Sets A–C a A–K (10 sets)

**Descripción:** Expansión de la matriz experimental de 3 sets (A normal, B carga,
C inválido) a 10 sets (A–E estáticos + F, G, I, J, K dinámicos) con generador
determinístico.

**Rationale:** Los 3 sets originales no permitían medir REG-005 (idempotencia), ni
boundary values, ni percentiles extremos, ni degradación. La ampliación cubre 8 de
las 10 reglas obligatorias con evidencia cuantitativa (las otras 2 son arquitectónicas
y se verifican por inspección estática).

**Archivos creados/tocados:**
- `medicion/datasets/generar_datasets.py` — NUEVO (generador determinístico)
- `medicion/datasets/seeds.yaml` — NUEVO (`master_seed: 20260421`)
- `medicion/datasets/bot/input-set-{A..K}.json` — 10 archivos generados
- `automatizacion/run_corridas.py` — `EXPECTED_HTTP` extendido por (caso, versión, set)

**Commit:** `a126311`

**Evidencia:**
- SHA-256 de cada `input-set-*.json` verificado en `medicion/datasets/manifest.json`.
- Reproducibilidad: `python medicion/datasets/generar_datasets.py --verify-only` retorna OK.
- FASE 2 ejecutó las 10×200 = 2000 corridas as-is por caso → 4000 totales en
  `run-log-bot-as-is.csv` + `run-log-iot-as-is.csv`.

**REG-* involucradas:** no directas (decisión metodológica).

**Formalización:** ADR-004 Bot (diseño experimental — aplica también a IoT).

---

## Tabla de trazabilidad cambio → commit → evidencia

| CR-ASIS | Fecha | Commit | Archivos tocados | REG-* | Evidencia cuantitativa |
|---------|-------|--------|------------------|-------|------------------------|
| 01 | 2026-04-19 | cff317a | `bot-as-is.json` (10→16 nodos), `notas-tecnicas.md` | 001,002,004,005,006,007,008,009 | Validador: 6/7 violaciones; run-log 600 filas |
| 02 | 2026-04-19 | cff317a | `mock-bot-server/server.js` | — | `curl /api/user/.../tickets` 200 OK |
| 03 | 2026-04-21 | a126311 | `bot-as-is.json` (LIMITE 10→150), `bot-as-is-ratelimit-demo.json` | 002 | run-log 200 filas completas por set |
| 04 | 2026-04-21 | a126311 | `datasets/generar_datasets.py`, `seeds.yaml`, `input-set-{A..K}.json` | — (metodología) | Manifest SHA-256 + 2000 corridas as-is |

---

## Relación con los ADRs

| Cambio | ADR que lo formaliza |
|--------|----------------------|
| CR-ASIS-01 | `ADR-001-separacion-responsabilidades-flujo.md` |
| CR-ASIS-01 (decisión de omitir E4 como subflujo en Bot) | `ADR-002-omision-e4.md` |
| CR-ASIS-03 | `ADR-003-ratelimit-medicion.md` |
| CR-ASIS-04 | `ADR-004-diseno-experimental-input-sets.md` |

---

## Referencias cruzadas

- `casos-de-estudio/bot/as-is/notas-tecnicas.md` — estado final y mapeo REG-*
- `casos-de-estudio/bot/adr/` — ADRs 001..004
- `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md`
- `medicion/run-logs/bot/run-log-bot-as-is.csv` — 2000 corridas as-is
- `medicion/protocolo-evidencias.md` §5 — schema de run-logs
