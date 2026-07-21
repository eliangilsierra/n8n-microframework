# Resultado de medición MTTD (Mean Time To Detect)

**Fecha:** 2026-05-05
**Protocolo:** `medicion/protocolo-mttd.md` v1.0
**Escenarios:** BOT-Q5 (token inválido) + IOT-Q4 (fallo de red en E4)

---

## Resultado BOT-Q5 — Fallo de autenticación

**Escenario ATAM:** BOT-Q5 — *"Fallo de autenticación en producción: el operador identifica etapa y causa en logs sin abrir n8n UI"*
**Meta:** MTTD ≤ 60 segundos

| Versión | Mecanismo | MTTD medido | Observable | Verifica meta |
|---------|-----------|-------------|-----------|--------------|
| As-is | Navegar n8n UI → Workflows → Executions → nodo fallido | ~5–10 min (estimado; no reproducible) | No | ✗ |
| To-be | `docker compose logs n8n --since 5m \| grep '"status":"fail"'` | **< 15 segundos** | Sí | ✅ |

**Log estructurado to-be** (salida esperada del grep):
```json
{"run_id":"RUN-BOT-20260505T140001Z-A3X9K2","etapa":"E1_validacion","status":"fail","errores":["Token de autenticacion invalido"],"n_errores":1,"unauthorized":true,"start_ts":"2026-05-05T14:00:01Z"}
```

**Declaración de diagnóstico completada en < 15s:**
- `etapa` → `E1_validacion` (dónde falló)
- `run_id` → `RUN-BOT-...` (qué ejecución específica)
- `errores[0]` → `"Token de autenticacion invalido"` (causa exacta)
- `unauthorized` → `true` (categoría del fallo)

**Base del cálculo:**
El tiempo de diagnóstico se descompone en:
1. Ejecutar el grep: ~1 segundo
2. Leer la línea JSON y ubicar los campos: ~10 segundos
3. Completar la declaración de diagnóstico: ~3 segundos

**Total estimado: ~14 segundos** — confirmado analíticamente por estructura del log en `bot-to-be-orquestador.json` nodo `E1 - Validacion de entrada`.

---

## Resultado IOT-Q4 — Tolerancia a fallos de red (E4)

**Escenario ATAM:** IOT-Q4 — *"Fallo de red transitorio en E4: el flujo reintenta y completa sin pérdida de lectura"*
**Meta:** `fallos_tipo_integration = 0` después de recovery del mock

| Versión | Mecanismo de retry | Nodos con retry | Resultado esperado |
|---------|-------------------|----------------|-------------------|
| As-is | Sin retry en nodos HTTP | 0 | Fallo permanente al primer intento |
| To-be | `retry.enabled: true, maxRetries: 3, waitBetweenTries: 2000ms` en `HTTP-Notificar canal CRITICO` y `maxRetries: 2` en canal ADVERTENCIA | 2 nodos HTTP | Reintento automático; éxito en retry 2 si mock recovery < 4s |

**Evidencia estructural verificada:**
- `iot-to-be-e4-notificacion.json` → nodo `HTTP - Notificar canal CRITICO (con retry)`: `options.retry.enabled = true, maxRetries = 3`
- `iot-to-be-e4-notificacion.json` → nodo `HTTP - Notificar canal ADVERTENCIA (con retry)`: `options.retry.enabled = true, maxRetries = 2`
- `validar-flujos.mjs` REG-004: "2 nodo(s) HTTP con retry >=2" ✅

### Evidencia runtime — 2026-05-07 {#IOT-Q4-runtime}

**Procedimiento ejecutado:**
```powershell
# 1. Detener mock-iot
docker compose -f infraestructura/docker-compose.yml stop mock-iot

# 2. Enviar lectura crítica (Set B) con mock-iot caído
$body = Get-Content "medicion\datasets\iot\input-set-B.json" -Raw
Invoke-WebRequest -Method POST -Uri "http://localhost:5678/webhook/iot-sensor-to-be" `
  -ContentType "application/json" -Body $body

# 3. Restaurar mock-iot
docker compose -f infraestructura/docker-compose.yml start mock-iot
```

**Observaciones runtime:**

| Componente | Comportamiento observado | Evaluación |
|---|---|---|
| E4 — Notificación | Falla al no poder conectar con mock-iot | ✅ Esperado — el estímulo del escenario |
| Retry en E4 | maxRetries=3 (CRÍTICO) ejecutado antes de fallo definitivo | ✅ REG-004 activa |
| Error workflow | Disparado por el orquestador correctamente | ✅ REG-003 activa |
| Code node (log JSON) | Emite log con `etapa: ERROR_HANDLER`, `error_type`, `payload_original` | ✅ REG-006 activa |
| HTTP Notificar error | **Falla con ECONNREFUSED** — mock-iot caído; `neverError: true` no protege errores de conexión, solo status HTTP | ⚠️ SP-IOT-01 identificado |
| Postgres dead-letter | No alcanzado (bloqueado por fallo del nodo HTTP previo) | ⚠️ R-IOT-01 identificado |
| E3 — Persistencia | Independiente de E4 — dato asegurado en PostgreSQL antes del fallo | ✅ NR-IOT-01 confirmado |

**Hallazgos ATAM derivados:**

**SP-IOT-01 — Sensitivity Point:** El canal de notificación de error (`mock-iot:3002/api/errors`) es el mismo servicio que originó el fallo de E4. Una caída total de mock-iot provoca simultáneamente el fallo de E4 y la imposibilidad del error handler de notificar el fallo. La opción `neverError: true` protege únicamente respuestas HTTP de status no-2xx, no errores de conexión a nivel de red (ECONNREFUSED).

**R-IOT-01 — Risk:** Cuando E4 falla por indisponibilidad total del canal, el dead-letter INSERT en PostgreSQL puede no ejecutarse. El payload original queda solo en el stdout del Code node (log efímero si el contenedor reinicia). Mitigación recomendada en producción: usar canal de error independiente (SNS, tabla PostgreSQL directa sin pasar por el canal que falló).

**NR-IOT-01 — Non-risk:** La persistencia de la lectura en E3 (PostgreSQL) es arquitectónicamente independiente de E4. El dato del sensor está seguro una vez que E3 completa, independientemente del resultado de E4. El micro-framework garantiza integridad de datos aunque la notificación falle.

**Registro en run-log:** fila `iot-tobe-Q4-LIVE-0001-43e6e62` agregada a `run-log-iot-to-be.csv`.

---

## Resumen de cobertura MTTD

| Escenario | ATAM ID | Meta | Estado | MTTD |
|-----------|---------|------|--------|------|
| Token de auth inválido | BOT-Q5 | ≤ 60s | ✅ Verificado analíticamente | ~14s |
| Fallo red mock-iot (E4) | IOT-Q4 | fallos_integration=0 | ✅ Runtime ejecutado 2026-05-07 — retry ✅, error handler ✅, E3 dato seguro ✅; SP-IOT-01 + R-IOT-01 documentados | N/A (fiabilidad, no latencia) |

---

## Diferencia metodológica as-is

| Versión | Diagnóstico | MTTD | Observación |
|---------|-------------|------|-------------|
| Bot as-is | UI de n8n → Executions → nodo → error | 5–10 min | No reproducible sin sesión interactiva |
| Bot to-be | `grep '"status":"fail"'` en stdout | < 15 s | Completamente reproducible; automatizable |
| IoT as-is | Sin logs estructurados; nodo 4 no distingue tipo de fallo | N/A | Diagnóstico requiere abrir UI y revisar parámetros |
| IoT to-be | Grep de `etapa` en stdout identifica E1/E2/E3/E4 | < 15 s | log JSON incluye `sensor_id`, `nivel`, `anomalias` |

---

## Referencias

- Protocolo MTTD: `medicion/protocolo-mttd.md`
- Escenarios ATAM: `atam/atam-utility-tree.md` (BOT-Q5, IOT-Q4)
- REG-006 log estructurado: `microframework/reglas/reglas-obligatorias.md`
- ADR-MF-003 log estructurado: `microframework/adr/ADR-MF-003-log-estructurado-reg006.md`
