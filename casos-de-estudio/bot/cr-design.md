# Diseño de Change Requests — Bot

## Propósito

Especificación formal de los 3 Change Requests (CR1 regla de negocio, CR2 integración,
CR3 validación) del caso Bot, que serán medidos en as-is (pre-medición completada en
FASE 3) y en to-be (FASE 6) para cuantificar el impacto arquitectónico del
micro-framework.

El CR-log registra para cada cambio: cuántos nodos se tocaron (`nodes_touched`),
cuántas dependencias externas (`deps_touched`) y cuántos intentos fue necesarios hasta
tener el cambio funcionando (`attempts`). La hipótesis central del proyecto es que el
to-be requiere **menos nodos tocados por CR** gracias a la separación E1–E4.

---

## CR1 — Regla de negocio: cambio de prioridad para una regla de enrutamiento

**Cambio exacto:** cambiar la prioridad asignada por la regla de negocio `R002` (detección
de palabras clave de urgencia en el mensaje) de `"media"` a `"alta"`.

**Archivo as-is:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Nodo(s) a modificar en as-is:**
- Nodo 9 `Procesar Mensaje` (jsCode) — línea de asignación de `prioridad`
- Nodo 10 `Prioridad Alta?` (IF) — rama de decisión que depende del valor
- Nodo 11 `Crear Ticket Urgente` (set) — branding del ticket
- Nodo 12 `Crear Ticket` (httpRequest) — payload body con campo `priority`
- Nodo 13 `Guardar Interaccion` (postgres) — columna `prioridad` en el INSERT
- Nodo 14 `Notificar Sistema Externo` — header `X-Priority`
- Nodo 15 `Preparar Respuesta` (set) — respuesta al cliente
- Nodo 16 `Responder al Cliente` — código de respuesta

**Nodos tocados esperado as-is:** **8**
**Nodos tocados esperado to-be:** **1** (solo regla en `iot-to-be-e2-dominio` → constante
`REGLAS_PRIORIDAD`)
**Delta esperado:** 7 nodos menos en to-be.

**Dependencias externas tocadas:** 0 (cambio de lógica pura, no de endpoints).

**Input Sets que prueban el cambio:** A (flujo normal), B (carga sostenida).

**Método de verificación:**
1. Editar los 8 nodos en `bot-as-is.json`.
2. Re-importar en n8n.
3. Ejecutar 20 corridas de sets A y B.
4. Confirmar que `prioridad` en `interacciones_bot` aparece como `alta` para mensajes
   matcheando R002.

**REG-* involucradas:** REG-007 (dominio aislado) — violación del as-is evidenciada.

**Hipótesis medible:** `nodes_touched_asis - nodes_touched_tobe ≥ 5`.

---

## CR2 — Integración: cambio de endpoint de tickets

**Cambio exacto:** migrar el endpoint de creación de tickets de
`http://mock-bot:3001/api/tickets` a `http://mock-bot:3001/api/v2/tickets` (nueva versión
con contrato ligeramente distinto: agregar header `X-Api-Version: 2`).

**Archivo as-is:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Nodo(s) a modificar en as-is:**
- Nodo 9 `Procesar Mensaje` (jsCode) — construcción del body del ticket
- Nodo 11 `Crear Ticket Urgente` (set) — headers
- Nodo 12 `Crear Ticket` (httpRequest) — URL + headers + retry (ausente)
- Nodo 15 `Preparar Respuesta` — manejo del ticket_id nuevo
- Nodo 16 `Responder al Cliente` — cambio de schema

**Nodos tocados esperado as-is:** **5**
**Nodos tocados esperado to-be:** **1** (solo el nodo HTTP de `bot-to-be-e3-integracion`)
**Delta esperado:** 4 nodos menos en to-be.

**Dependencias externas tocadas:** 1 (endpoint de tickets).

**Input Sets:** A, B.

**Método de verificación:** idem CR1 con el nuevo endpoint mock.

**REG-* involucradas:** REG-008 (integraciones fuera de E3/E4 en as-is), REG-004 (retry).

**Hipótesis medible:** `nodes_touched_asis - nodes_touched_tobe ≥ 3`.

---

## CR3 — Validación y error: validar longitud mínima de `message`

**Cambio exacto:** agregar validación "message.length ≥ 3" con respuesta HTTP 422
y código de error `MESSAGE_TOO_SHORT`.

**Archivo as-is:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Nodo(s) a modificar en as-is:**
- Nodo 2 `Validar Payload` (jsCode) — agregar chequeo de longitud
- Nodo 5 `Error Rate Limit` / crear nuevo nodo `Error Message Too Short` (respondToWebhook 422)
- Nodo 15 `Preparar Respuesta` — diferenciar código

**Nodos tocados esperado as-is:** **3**
**Nodos tocados esperado to-be:** **1** (solo schema `bot-webhook-input.schema.json`)
**Delta esperado:** 2 nodos menos en to-be.

**Dependencias externas tocadas:** 0.

**Input Sets:** C (inválidos), D (boundary, `message` vacío).

**Método de verificación:** ejecutar set D y verificar que todas las filas con
`message.length < 3` reciben HTTP 422 con código exacto.

**REG-* involucradas:** REG-009 (códigos HTTP diferenciados).

**Hipótesis medible:** `nodes_touched_asis - nodes_touched_tobe ≥ 2`.

---

## Procedimiento de pre-medición contra as-is (ejecutado FASE 3)

1. `git checkout -b cr-measurement-asis` (branch temporal).
2. Para cada CR:
   a. Modificar `bot-as-is.json` tocando los nodos listados arriba.
   b. Registrar `start_ts` antes de editar.
   c. Re-importar en n8n y ejecutar sets que verifican el cambio (20 corridas).
   d. Contar `attempts` (cuántas iteraciones de edición hasta que pasa la verificación).
   e. Registrar `end_ts` y `commit_hash` del branch temporal.
   f. Añadir fila al `cr-log-bot-as-is.csv`.
   g. `git checkout -- casos-de-estudio/bot/as-is/bot-as-is.json` (revertir).
3. `git checkout main; git branch -D cr-measurement-asis` (descartar branch).
4. Commit del `cr-log-bot-as-is.csv` poblado.

## Medición contra to-be (FASE 6 — pendiente)

Se ejecutará el mismo procedimiento sobre `bot-to-be-*.json` una vez construido el to-be,
registrando las filas equivalentes en `cr-log-bot-to-be.csv`. La comparación estadística
se documenta en FASE 6.

---

## Schema extendido del CR-log

```
cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes
```

Donde:
- `cr_id` — identificador único por fila (`CR-BOT-001`, ...).
- `cr_type` — tipo funcional (`CR1`, `CR2`, `CR3`).
- `nodes_touched` — conteo manual de nodos del JSON tocados para implementar el CR.
- `deps_touched` — cantidad de endpoints/tablas externas cuyo contrato cambió.
- `attempts` — intentos hasta lograr la verificación exitosa.
- `notes` — texto libre para rationale/incidentes.

---

## Referencias

- `medicion/cr-logs/bot/cr-log-bot-as-is.csv` — log con las 3 filas pre-medidas.
- `medicion/cr-logs/bot/cr-log-bot-to-be.csv` — reservado para FASE 6.
- `docs/protocolo-evidencias.md` §6 — protocolo general de CR-logs.
- ADR-001 Bot, ADR-002 Bot — decisiones arquitectónicas que condicionan los CRs.
