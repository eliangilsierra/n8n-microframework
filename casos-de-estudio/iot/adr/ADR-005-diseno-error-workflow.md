# ADR-005 — Diseño del errorWorkflow del IoT con payload para replay (iot-error-handler)

**Fecha:** 2026-05-01
**Estado:** Implementado 2026-05-02
**Atributo de calidad:** Fiabilidad / Tolerancia a fallos + Operabilidad / Monitoreabilidad (ISO/IEC 25010)
**Reglas relacionadas:** REG-003, REG-006
**ADR de framework:** ADR-MF-002

---

## Contexto

El caso IoT tiene una característica crítica que lo diferencia del Bot: las lecturas
de sensores son **datos de medición irrecuperables** si se pierden. Si el flujo falla
después de que E1 validó la lectura pero antes de que E3 la persistiera, la lectura
se pierde definitivamente — el sensor no reintentará el envío a menos que se configure
explícitamente.

El errorWorkflow del IoT debe, además de notificar el fallo (como el Bot), **preservar
el payload original** de la lectura para permitir un replay manual en caso de fallo
definitivo de E3.

---

## Decisión

El flujo `iot-error-handler` implementa cuatro nodos:

### Nodo 1 — Code: Extraer contexto del error con payload original

```javascript
const errorContext = {
  run_id: $json.run_id || 'UNKNOWN',
  sensor_id: $json.payload_original?.sensor_id || 'UNKNOWN',
  node_name: $json.execution?.lastNodeExecuted || 'UNKNOWN',
  error_message: $json.error?.message || 'Error sin mensaje',
  error_type: $json.error?.name || 'UnknownError',
  payload_original: $json.payload_original || null,  // DIFERENCIA vs Bot
  etapa: 'IOT_ERROR_HANDLER',
  status: 'error',
  ts: new Date().toISOString()
};

console.log(JSON.stringify(errorContext));
return [{ json: errorContext }];
```

El campo `payload_original` contiene la lectura completa del sensor (sensor_id,
temperature, humidity, co2, timestamp, location) para permitir replay manual.

### Nodo 2 — HTTP Request: Notificar a mock-iot con payload

```
POST http://mock-iot:3002/api/errors
Content-Type: application/json
Retry: habilitado (2 reintentos, 1000ms espera)
Body: { run_id, sensor_id, node_name, error_message, error_type, payload_original, ts }
```

### Nodo 3 — Postgres: Registrar lectura como dead-letter (si E3 no persistió)

```sql
INSERT INTO lecturas_sensor_dead_letters
  (run_id, sensor_id, payload_json, error_message, created_at)
VALUES ($1, $2, $3::jsonb, $4, NOW())
ON CONFLICT (run_id) DO NOTHING;
```

Este nodo solo se ejecuta si el fallo ocurrió en E3 (detectado por `node_name`).

### Nodo 4 — Respond to Webhook: Respuesta 500 al cliente

```json
HTTP 500 Internal Server Error
{ "error": "Internal server error", "run_id": "{{run_id}}", "sensor_id": "{{sensor_id}}" }
```

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| errorWorkflow idéntico al Bot (sin payload_original) | La lectura del sensor se pierde sin posibilidad de replay |
| Solo loguear el payload sin persistirlo (sin dead-letter) | El log en stdout puede perderse si el contenedor se reinicia; la tabla dead-letters es persistente |
| Reintentar automáticamente desde el errorWorkflow | El error puede ser estructural (schema de tabla incorrecto, credenciales cambiadas) — el reintento automático fallaría de nuevo y enmascararía el problema real |

---

## Consecuencias

**Positivas:**
- Todas las lecturas que fallan en E3 quedan en la tabla `dead_letters` con el
  payload completo para replay manual.
- El log incluye `sensor_id` para correlacionar qué sensor produjo la lectura perdida.
- El operador puede revisar `SELECT * FROM lecturas_sensor_dead_letters` para
  identificar lecturas pendientes de replay.

**Negativas:**
- Requiere crear la tabla `lecturas_sensor_dead_letters` en PostgreSQL (paso adicional
  en el protocolo de setup — documentado en `docs/protocolo-evidencias.md` §2).
- El Nodo 3 (dead-letter) falla si la BD no está disponible, que es precisamente el
  caso más probable cuando E3 falló por problemas de BD. Mitigación: el Nodo 1 (log
  en stdout) preserva el payload de forma independiente.

---

## Criterio de verificación

1. `settings.errorWorkflow` del orquestador IoT → no vacío (REG-003)
2. Simular fallo de E3 (detener Postgres) + enviar lectura válida → log con `"status":"error"` + `"payload_original":{...}` (REG-006)
3. Input Set válido con Postgres detenido → lectura en `dead_letters` después de reactivar Postgres

---

## Implementación (2026-05-02)

- **Archivo:** `casos-de-estudio/iot/to-be/iot-error-handler.json`
- **Estructura implementada:** Error Trigger → Code (log + payload_original) → HTTP POST mock-iot (retry 2×) → Postgres dead-letter INSERT
- **Tabla dead-letter:** `lecturas_sensor_dead_letters` creada en `automatizacion/setup_env.py` → `create_table()`
- **Schema tabla:**
  ```sql
  CREATE TABLE IF NOT EXISTS lecturas_sensor_dead_letters (
    id               SERIAL PRIMARY KEY,
    run_id           VARCHAR(100),
    payload_original JSONB,
    error_message    TEXT,
    node_name        VARCHAR(200),
    ts               TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **Nota:** La implementación no incluye nodo Respond 500 (los errorWorkflows de n8n no
  pueden responder al cliente original — el webhook ya terminó). El respond 500 está
  documentado en la spec pero n8n no lo soporta nativamente desde el error handler.
