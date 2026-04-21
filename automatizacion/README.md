# Automatización de medición — n8n microframework

Scripts Python para levantar el entorno, ajustar flujos, ejecutar corridas y
generar reportes comparativos as-is vs to-be. Diseñados para minimizar la
intervención humana y garantizar reproducibilidad total del experimento.

---

## Requisitos

- Python 3.9 o superior
- Docker Desktop instalado y en ejecución
- Git (para capturar el commit hash en el run-log)
- JMeter 5.6+ (opcional, solo para pruebas de carga complementarias)

---

## Instalación de dependencias Python

Desde la raíz del repositorio:

```bash
pip install -r automatizacion/requirements.txt
```

Dependencias: `requests`, `python-dotenv`. El resto usa stdlib.

---

## Flujo completo de uso

### 1. Bootstrap del entorno

Levanta n8n, PostgreSQL, mock-bot (puerto 3001) y mock-iot (puerto 3002):

```bash
python automatizacion/setup_env.py
```

Genera `infraestructura/.env` con credenciales seguras, ejecuta
`docker compose up -d` y espera a que todos los servicios estén healthy.
Al terminar imprime las instrucciones para el único paso manual.

### 2. PASO MANUAL — Import de flujos en n8n UI (~15-20 min)

Este es el único paso que no se puede automatizar. Ver instrucciones
completas impresas por `setup_env.py` o en `docs/protocolo-evidencias.md`.

Orden de import:
1. Subflujos to-be Bot: E2 → E3 → orquestador
2. Subflujos to-be IoT: E1 → E2 → E3 → E4 → orquestador
3. As-is: `casos-de-estudio/bot/as-is/bot-as-is.json` y `casos-de-estudio/iot/as-is/iot-as-is.json`
4. En cada orquestador to-be: actualizar referencias Execute Workflow
5. Activar todos los flujos

### 3. Verificar webhooks

```bash
curl -X POST http://localhost:5678/webhook/bot-soporte \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/bot/input-set-A.json
# Espera HTTP 200

curl -X POST http://localhost:5678/webhook/iot-sensor \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-A.json
# Espera HTTP 200
```

### 4. Ejecutar corridas de medición

```bash
# Todas las combinaciones (as-is + to-be, bot + iot, 10 corridas por set)
python automatizacion/run_corridas.py --caso all --estado all --n 10

# Solo as-is del bot
`python automatizacion/run_corridas.py --caso bot --estado as-is --n 10
`
# Vista previa sin ejecutar
python automatizacion/run_corridas.py --caso all --estado all --n 10 --dry-run
```

Escribe automáticamente en `medicion/run-logs/`.

### 5. Extraer métricas desde n8n API

Genera API Key en n8n (Settings → n8n API → Create an API key), luego:

```bash
export N8N_API_KEY="tu-api-key"
python automatizacion/extract_metrics.py
```

Genera `medicion/consolidado/metrics-YYYY-MM-DD.md` con p50/p95/p99 y
tasa de fallos por workflow.

### 6. Generar tabla comparativa as-is vs to-be

```bash
python automatizacion/compare_results.py
```

Genera `medicion/consolidado/comparacion-YYYY-MM-DD.md` con deltas de
latencia y tasa de fallos entre as-is y to-be para ambos casos.

### 7. Prueba de carga con JMeter (complementario)

```bash
# As-is Bot
jmeter -n -t medicion/jmeter/bot-load-test.jmx \
       -l medicion/jmeter/resultados/bot-summary.jtl

# As-is IoT
jmeter -n -t medicion/jmeter/iot-load-test.jmx \
       -l medicion/jmeter/resultados/iot-summary.jtl
```

Para activar el Thread Group to-be en los .jmx: cambiar `enabled="false"`
a `enabled="true"` en el segundo Thread Group de cada archivo.

---

## Referencia de scripts

| Script | Propósito | Produce |
|--------|-----------|---------|
| `setup_env.py` | Bootstrap completo del entorno Docker | `.env`, 4 servicios healthy |
| `run_corridas.py` | Corridas automatizadas contra webhooks n8n | Filas en `medicion/run-logs/` |
| `extract_metrics.py` | Estadísticas desde API REST de n8n | `medicion/consolidado/metrics-*.md` |
| `compare_results.py` | Tabla comparativa as-is vs to-be | `medicion/consolidado/comparacion-*.md` |

---

## Lo que sigue siendo manual y por qué

| Paso | Razón técnica |
|------|---------------|
| Import de flujos en n8n UI | La API REST genera IDs nuevos por instalación; `Execute Workflow` necesita IDs reales que solo se conocen post-import |
| Actualizar referencias Execute Workflow | Requiere seleccionar subflujo en dropdown de la UI de n8n |
| Activar flujos (toggle Active) | Sin equivalente conveniente en API pública post-import |
| Generar N8N_API_KEY | Requiere UI de n8n → Settings → n8n API |

---

## Arquitectura de mocks

Los mocks corren como contenedores Docker dentro del compose:

```
n8n (5678) → host.docker.internal:3001 → mock-bot
                                          ├── POST /mock/notificar → 200 {ticket_id}
                                          └── POST /api/v2/write   → 204 (InfluxDB mock)

n8n (5678) → host.docker.internal:3002 → mock-iot
                                          └── POST /mock/notificar → 200 {notificacion_enviada}
```

El mock-bot también responde 204 al nodo "Guardar en InfluxDB" del as-is IoT,
permitiendo que el flujo complete end-to-end para medir latencia total.
El antipatrón (tecnología incorrecta, token hardcodeado) sigue documentado en
las notas técnicas y visible en el JSON.

---

## Comandos de verificación del entorno

```bash
# Estado de contenedores
docker compose -f infraestructura/docker-compose.yml ps

# Logs de los mocks
docker logs mock_bot
docker logs mock_iot

# Health directo
curl http://localhost:3001/health   # {"ok":true}
curl http://localhost:3002/health   # {"ok":true}

# Detener entorno
docker compose -f infraestructura/docker-compose.yml stop

# Detener y borrar todo (datos incluidos — destructivo)
docker compose -f infraestructura/docker-compose.yml down -v
```
