# Notas técnicas — IoT as-is

Pipeline ad-hoc de sensor IoT. Diseñado intencionalmente para exhibir los
antipatrones del microframework (REG-001 a REG-010) en un escenario realista de
14 nodos que replica lo encontrado en implementaciones IoT sin arquitectura definida.

> Para el registro cronológico de cambios al as-is y su evidencia (commits, rationale,
> vinculación a REG-*), ver [`cambios-y-evidencia.md`](cambios-y-evidencia.md).

---

## Estructura del flujo (14 nodos)

| # | Nodo | Tipo | Antipatrón visible |
|---|------|------|--------------------|
| 1 | Webhook Sensor | webhook | — |
| 2 | Verificar Campos Basicos | code | Validación incompleta: co2 nunca verificado |
| 3 | Datos Presentes? | if | co2 ausente del check (solo sensor_id/temp/humidity) |
| 4 | Error Datos Invalidos | respondToWebhook 200 | REG-009 (200 en vez de 422) |
| 5 | Normalizar Lecturas | code | REG-001 (db_url/db_token en output del nodo) |
| 6 | Temperatura Critica? | if | Umbral 35°C hardcodeado |
| 7 | Humedad Alta? | if | Umbral 85% hardcodeado (inconsistente con to-be: 80%) |
| 8 | Determinar Nivel Final | code | REG-007/008 (dominio mezclado); co2 sin validar |
| 9 | Guardar en InfluxDB | httpRequest POST | REG-001 (token en header desde payload), REG-004 |
| 10 | Persistir en PostgreSQL | postgres | REG-005 (INSERT sin ON CONFLICT) |
| 11 | Requiere Notificacion? | if | — |
| 12 | Enviar Notificacion | httpRequest POST | Endpoint único sin routing por severidad |
| 13 | Log Resultado | code | REG-006 (console.log no estructurado, sin run_id) |
| 14 | Respuesta OK | respondToWebhook 200 | REG-002 (sin run_id), REG-009 (no anomalias[]) |

---

## Antipatrones REG-* verificables

### REG-001 — Credenciales expuestas
- **Nodo 5 (Normalizar Lecturas):** `db_url` y `db_token` se incluyen en el JSON de
  salida del nodo. Quedan visibles en el historial de ejecución de n8n (pestaña "Output"
  de cada ejecución). En el to-be las credenciales se referencian como n8n Credentials,
  nunca aparecen en los datos del pipeline.
- **Nodo 9 (Guardar en InfluxDB):** el header `Authorization: Token {{ $json.db_token }}`
  expone el token en los logs de request del nodo httpRequest.

### REG-002 — Ausencia de run_id
- Ningún nodo genera, propaga ni incluye un `run_id`. La respuesta final (nodo 14)
  no contiene identificador de traza para correlación con logs externos.

### REG-003 — Sin manejo de errores declarativo
- `settings.errorWorkflow` ausente. Un fallo en InfluxDB (nodo 9) o PostgreSQL (nodo 10)
  detiene la ejecución sin notificación al operador.

### REG-004 — HTTP calls sin retry
- **Nodo 9 (Guardar en InfluxDB)** y **Nodo 12 (Enviar Notificacion)**: sin `retryOnFail`.
  Un error transitorio de red aborta toda la ejecución y pierde la lectura.

### REG-005 — Sin idempotencia en escritura
- **Nodo 10 (Persistir en PostgreSQL):** `INSERT INTO lecturas_sensor (...) VALUES (...)`
  sin cláusula `ON CONFLICT DO NOTHING`. Si el webhook recibe el mismo payload dos veces
  (retry del cliente), se insertan filas duplicadas en la BD.

### REG-006 — Logging no estructurado
- **Nodo 13 (Log Resultado):** `console.log(JSON.stringify({...}))` sin nivel de log,
  sin etapa del pipeline, sin run_id. En el to-be el log incluye `stage`, `run_id`,
  `nivel` y `latencia_ms`.

### REG-007/008 — Lógica de dominio mezclada
- **Nodo 8 (Determinar Nivel Final):** combina la lógica de clasificación por umbrales
  (dominio: temp, humidity, co2 → nivel) con el acceso a datos del pipeline. Además,
  aplica un umbral de co2 (`> 1500 → critico`, `> 1000 → advertencia`) que nunca fue
  documentado ni centralizado, diferente de cualquier constante visible en el flujo.

### REG-009 — Código HTTP semánticamente incorrecto
- **Nodo 4 (Error Datos Invalidos):** retorna `HTTP 200` con body `{"error":"datos_invalidos"}`.
  El código correcto sería `422 Unprocessable Entity`. El cliente no puede distinguir
  éxito de error por el status code; debe inspeccionar el body.

### REG-010 — Ausencia de observabilidad
- Sin métricas por etapa, sin trazas correlacionadas, sin alertas operacionales.

---

## Validación incompleta de co2 (antipatrón extendido)

El nodo 2 verifica `sensor_id`, `temperature` y `humidity`, pero omite `co2`.
El campo co2 es leído como `co2_raw = body.co2` y propagado sin validar.

En el nodo 8, el co2 se consume con `parseFloat(d.co2_raw) || 0`, lo que silencia
silenciosamente un `NaN` (cuando co2 está ausente) con el valor `0`. Esta "solución"
hace que el sistema aparente funcionar correctamente con datos incompletos, ocultando
el problema en lugar de rechazarlo.

El Input Set E expone exactamente este antipatrón: el as-is retorna 200 con
`nivel: 'normal'` aunque co2 esté ausente, mientras el to-be retorna 422.

---

## Umbrales inconsistentes entre nodos

| Nodo | Variable | Umbral as-is | Umbral to-be (E2) |
|------|----------|-------------|------------------|
| 6 (Temperatura Critica?) | temperatura | > 35°C | > 35°C |
| 7 (Humedad Alta?) | humedad | > 85% | > 80% |
| 8 (Determinar Nivel Final) | co2 | > 1000 / > 1500 | > 800 / > 1200 |

La inconsistencia en el umbral de humedad (85 vs 80) significa que el as-is clasifica
como `normal` lecturas que el to-be clasificaría como `advertencia`, produciendo
diferencias medibles en la tasa de notificaciones enviadas.

---

## Flujo de ejecución

```
Webhook Sensor
  └─▶ Verificar Campos Basicos
        └─▶ Datos Presentes?
              ├─▶ [true/inválido]  Error Datos Invalidos (200) ──── fin
              └─▶ [false/válido]   Normalizar Lecturas
                                     └─▶ Temperatura Critica?
                                           ├─▶ [true]  Determinar Nivel Final
                                           └─▶ [false] Humedad Alta?
                                                         ├─▶ [true]  Determinar Nivel Final
                                                         └─▶ [false] Determinar Nivel Final
                                                                        └─▶ Guardar en InfluxDB
                                                                              └─▶ Persistir en PostgreSQL
                                                                                    └─▶ Requiere Notificacion?
                                                                                          ├─▶ [true]  Enviar Notificacion
                                                                                          │             └─▶ Log Resultado
                                                                                          └─▶ [false] Log Resultado
                                                                                                        └─▶ Respuesta OK (200)
```

---

## Input sets y comportamiento esperado

| Set | Escenario | HTTP as-is | Razón |
|-----|-----------|------------|-------|
| A | Temperatura normal, nivel normal | 200 | Flujo completo sin alerta |
| B | Temperatura alta (38°C), alerta activa | 200 | Notificacion enviada |
| C | Datos inválidos (temperatura NaN) | 200 | REG-009: debería ser 422 |
| D | Valores exactamente en umbral (35°C, 85%) | 200 | Boundary: nivel advertencia |
| E | co2 ausente | 200 | co2 silenciado como 0; REG: debería ser 422 |
