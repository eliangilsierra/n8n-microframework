# ADR-006 — Diseño del errorWorkflow del Bot (bot-error-handler)

**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Fiabilidad / Tolerancia a fallos + Operabilidad / Monitoreabilidad (ISO/IEC 25010)
**Reglas relacionadas:** REG-003, REG-006
**ADR de framework:** ADR-MF-002

---

## Contexto

REG-003 exige que el orquestador tenga configurado `settings.errorWorkflow`, pero la
regla no especifica qué debe hacer ese flujo. Sin una definición concreta, es posible
crear un flujo de error vacío que cumpla la regla formalmente sin aportar valor operativo.

El caso Bot tiene una característica específica que el errorWorkflow debe considerar:
el orquestador responde al webhook con `Respond to Webhook`, pero si un nodo falla
antes de llegar a ese nodo, el cliente HTTP recibe un timeout o error de n8n genérico
sin `run_id`. El errorWorkflow debe:

1. Registrar el fallo con suficiente contexto para correlacionar con los logs de E1
   (donde se generó el `run_id`).
2. Notificar al sistema de monitoreo (mock-bot) para que el fallo sea visible sin
   abrir n8n UI.
3. Garantizar que el cliente reciba una respuesta 500 clara, no un timeout.

---

## Decisión

El flujo `bot-error-handler` implementa tres nodos en secuencia:

### Nodo 1 — Code: Extraer contexto del error

```javascript
const errorContext = {
  run_id: $json.run_id || $json.execution?.variables?.run_id || 'UNKNOWN',
  node_name: $json.execution?.lastNodeExecuted || 'UNKNOWN',
  error_message: $json.error?.message || 'Error sin mensaje',
  error_type: $json.error?.name || 'UnknownError',
  workflow_name: $json.workflow?.name || 'bot-to-be-orquestador',
  etapa: 'BOT_ERROR_HANDLER',
  status: 'error',
  ts: new Date().toISOString()
};

console.log(JSON.stringify(errorContext));
return [{ json: errorContext }];
```

### Nodo 2 — HTTP Request: Notificar a mock-bot

```
POST http://mock-bot:3001/api/errors
Content-Type: application/json
Retry: habilitado (2 reintentos, 1000ms espera)
Body: { run_id, node_name, error_message, error_type, ts }
```

### Nodo 3 — Respond to Webhook: Respuesta 500 al cliente

```json
HTTP 500 Internal Server Error
{ "error": "Internal server error", "run_id": "{{run_id}}" }
```

**Nombre del flujo en n8n:** `bot-error-handler`
**Referencia en orquestador:** `settings.errorWorkflow = "ID_DE_BOT_ERROR_HANDLER"`

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Flujo de error vacío (solo cumple REG-003 formalmente) | Sin valor operativo — el fallo sigue siendo invisible en producción |
| errorWorkflow compartido entre Bot e IoT | Los contextos son distintos: Bot necesita incluir session_id/user en el log, IoT necesita incluir sensor_id. Un flujo compartido perdería ese contexto |
| Solo log sin notificación HTTP al mock | En un entorno real el log en stdout puede no ser monitoreado activamente; la notificación activa garantiza visibilidad inmediata |

---

## Consecuencias

**Positivas:**
- Todos los fallos del orquestador Bot generan un log JSON en stdout (consultable con
  `docker compose logs n8n | grep "BOT_ERROR_HANDLER"`) y una entrada en mock-bot.
- El `run_id` en el log permite correlacionar el error con los logs de E1–E4 que
  precedieron al fallo.
- El cliente recibe siempre una respuesta 500 estructurada en lugar de un timeout.

**Negativas:**
- Si mock-bot no está disponible cuando ocurre el error, el Nodo 2 fallará. La
  mitigación es que el Nodo 1 (log) siempre se ejecuta antes — el log persiste
  incluso si la notificación falla. El retry del Nodo 2 (2 reintentos) absorbe
  fallos transitorios del mock.

---

## Criterio de verificación

1. `settings.errorWorkflow` en el JSON del orquestador → no vacío (REG-003)
2. Detener mock-bot + enviar solicitud válida → log en stdout con `"status":"error"` + `"etapa":"BOT_ERROR_HANDLER"` (REG-006)
3. El cliente recibe HTTP 500 con `run_id` en body
