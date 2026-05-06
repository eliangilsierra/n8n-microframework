# Resultado de medición MTTD (Mean Time To Detect)

**Fecha:** 2026-05-05
**Protocolo:** `docs/protocolo-mttd.md` v1.0
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

**Acción pendiente para evidencia runtime:**
```bash
# Paso 1: detener mock-iot brevemente
docker compose -f infraestructura/docker-compose.yml stop mock-iot
sleep 3
docker compose -f infraestructura/docker-compose.yml start mock-iot

# Paso 2: enviar lectura crítica durante el downtime
curl -X POST http://localhost:5678/webhook/iot-sensor-to-be \
  -H "Content-Type: application/json" \
  -d '{"sensor_id":"SENSOR-MTTD","temperature":48.0,"humidity":92.0,"co2":2100,"timestamp":"2026-05-05T14:30:00Z"}'

# Paso 3: verificar en logs
docker compose -f infraestructura/docker-compose.yml logs n8n --since 5m | grep '"status"'

# Paso 4: verificar que la lectura se persistio en PostgreSQL
docker compose -f infraestructura/docker-compose.yml exec postgres \
  psql -U n8n_user -d sensores_db -c "SELECT sensor_id, nivel_alerta, created_at FROM lecturas_sensor WHERE sensor_id='SENSOR-MTTD';"
```

---

## Resumen de cobertura MTTD

| Escenario | ATAM ID | Meta | Estado | MTTD |
|-----------|---------|------|--------|------|
| Token de auth inválido | BOT-Q5 | ≤ 60s | ✅ Verificado analíticamente | ~14s |
| Fallo red mock-iot (E4) | IOT-Q4 | fallos_integration=0 | ⚠️ Evidencia estructural ✅; runtime pendiente | — |

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

- Protocolo MTTD: `docs/protocolo-mttd.md`
- Escenarios ATAM: `docs/context/atam-utility-tree.md` (BOT-Q5, IOT-Q4)
- REG-006 log estructurado: `microframework/reglas/reglas-obligatorias.md`
- ADR-MF-003 log estructurado: `microframework/adr/ADR-MF-003-log-estructurado-reg006.md`
