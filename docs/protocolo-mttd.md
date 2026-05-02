# Protocolo de medición MTTD (Mean Time To Detect)

**Versión:** 1.0
**Fecha:** 2026-05-01
**Autor:** Elian Hernando Gil Sierra
**Propósito:** Definir un procedimiento reproducible para medir el MTTD como indicador
de la mejora en Operabilidad / Monitoreabilidad (REG-006, escenario ATAM BOT-Q5).

---

## Definición operacional

**MTTD = tiempo en segundos** desde el timestamp del primer log con `status:"fail"` en
stdout del contenedor n8n, hasta que el operador puede declarar:

> "El fallo ocurrió en la etapa **{etapa}** del flujo **{caso}**, run_id **{run_id}**,
> causado por **{causa}**."

El diagnóstico se realiza usando **únicamente** los logs estructurados del contenedor
n8n — sin abrir la UI de n8n, sin revisar el historial de ejecuciones, sin ejecutar
queries en PostgreSQL.

---

## Comparación as-is vs. to-be

| Versión | Mecanismo de diagnóstico | MTTD estimado | Observable |
|---------|--------------------------|---------------|-----------|
| As-is | Abrir n8n UI → Workflows → historial de ejecución → inspeccionar nodo fallido | >5 minutos | No (requiere UI interactiva) |
| To-be | `docker compose logs n8n \| grep '"status":"fail"'` | < 60 segundos | Sí (stdout, consultable programáticamente) |

El MTTD del as-is es una estimación basada en el tiempo promedio de navegación manual
en la UI de n8n. No puede medirse de forma reproducible porque depende de la experiencia
del operador y del estado de la UI.

---

## Procedimiento estándar (reproducible)

### Requisitos previos
- Entorno Docker levantado (`docker compose up -d`)
- Flujos to-be importados y activos
- Una terminal disponible para `docker compose logs`

### Paso 1 — Seleccionar el escenario de fallo

Usar el escenario ATAM correspondiente (BOT-Q5 para Bot, IOT-Q4 para IoT).

**Ejemplo con BOT-Q5 (fallo de autenticación):**
```bash
# Preparar: enviar solicitud con token inválido
curl -X POST http://localhost:5678/webhook/bot-soporte-to-be \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "user_id": "U001", "token": "token-invalido"}'
```

**Ejemplo con IOT-Q4 (fallo de E3 — detener mock-iot):**
```bash
docker compose stop mock-iot
# Esperar 5 segundos para que el contenedor pare
curl -X POST http://localhost:5678/webhook/iot-sensor-to-be \
  -H "Content-Type: application/json" \
  -d '{"sensor_id":"S001","temperature":25.0,"humidity":60.0,"co2":400,"timestamp":"2026-05-01T10:00:00Z"}'
```

### Paso 2 — Iniciar cronómetro

El cronómetro inicia **en el momento** en que la solicitud HTTP llega al webhook
(visible como nuevo registro en `n8n UI → Executions` — pero sin abrirla; usar
el timestamp del envío del `curl`).

```bash
# Registrar el timestamp de inicio
START_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "Cronómetro iniciado: $START_TS"
```

### Paso 3 — Diagnosticar usando solo logs (sin abrir n8n UI)

**En Linux/Mac:**
```bash
docker compose logs n8n --since 5m | grep '"status":"fail"'
```

**En Windows PowerShell:**
```powershell
docker compose logs n8n --since 5m | Select-String '"status":"fail"'
```

**Salida esperada (to-be):**
```json
{"run_id":"RUN-BOT-20260501T100001Z-A3X9K2","etapa":"E1_validacion","status":"fail","errores":["Token de autenticación inválido o ausente"],"n_errores":1,"start_ts":"2026-05-01T10:00:01Z"}
```

### Paso 4 — Identificar causa raíz

El operador lee del primer log con `"status":"fail"`:
- `etapa` → dónde falló (E1, E2, E3, E4)
- `run_id` → qué ejecución específica
- `errores[0]` o `error_message` → la causa

El cronómetro se detiene cuando el operador puede completar la declaración de diagnóstico.

### Paso 5 — Registrar resultado

```bash
END_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Calcular diferencia en segundos manualmente o con:
MTTD_S=$(( $(date -d "$END_TS" +%s) - $(date -d "$START_TS" +%s) ))
echo "MTTD: ${MTTD_S}s"
```

Registrar en el run-log correspondiente:
```
notes: MTTD=XXs, escenario=BOT-Q5, diagnostico="E1 validacion, token invalido"
```

---

## Meta de aceptación

**MTTD < 60 segundos** para cualquier fallo en las etapas E1–E4 en el flujo to-be.

Esta meta es verificable porque:
1. El log estructurado con `"status":"fail"` siempre incluye `etapa`, `run_id` y `errores`.
2. La consulta `docker compose logs n8n | grep '"status":"fail"'` tarda <1 segundo.
3. El operador puede leer el log y completar el diagnóstico en <60 segundos totales.

---

## Escenarios de fallo cubiertos

| Escenario | ATAM ID | Tipo de fallo | Comando de inyección |
|-----------|---------|---------------|---------------------|
| Token de autenticación inválido | BOT-Q5 | Validación E1 | `token: "invalido"` en payload |
| Mensaje ausente en payload | BOT-Q6 | Validación E1 | `{}` sin campo `message` |
| Mock-bot no disponible | BOT-Q5 | Integración E3 | `docker compose stop mock-bot` |
| Lectura de sensor con campos faltantes | IOT-Q3 | Validación E1 | `{}` sin campos requeridos |
| PostgreSQL no disponible | IOT-Q4 | Integración E3 | `docker compose stop postgres` |
| Mock-iot no disponible | IOT-Q4 | Integración E4 | `docker compose stop mock-iot` |

---

## Diferencia metodológica as-is

En el as-is, el diagnóstico requiere:
1. Abrir la UI de n8n en el navegador.
2. Navegar a Workflows → seleccionar el flujo → Executions.
3. Encontrar la ejecución fallida en la lista (no hay `run_id` para filtrar).
4. Hacer clic en la ejecución → expandir el nodo fallido → leer el error.

Este proceso no puede cronometrarse de forma reproducible porque:
- Depende de la velocidad de la UI de n8n (carga del navegador, tamaño del historial).
- No hay `run_id` para correlacionar con el fallo específico.
- El mensaje de error de n8n para nodos Code puede ser genérico ("Error in item 0").

**Estimación conservadora del MTTD as-is: 5–10 minutos** para un operador con
experiencia en la UI de n8n.

---

## Referencias

- Escenario ATAM BOT-Q5: `docs/context/atam-utility-tree.md`
- REG-006 (log estructurado): `microframework/reglas/reglas-obligatorias.md`
- ADR-MF-003 (decisión de log JSON): `microframework/adr/ADR-MF-003-log-estructurado-reg006.md`
- Guía de observabilidad: `microframework/guia-observabilidad.md`
