> 🌐 **Language / Idioma:** English · [Español](README.md)

# Measurement automation — n8n microframework

Python scripts to bring up the environment, adjust flows, run measurement rounds, and
generate as-is vs to-be comparison reports. Designed to minimize human intervention and
guarantee full experiment reproducibility.

---

## Requirements

- Python 3.9 or higher
- Docker Desktop installed and running
- Git (to capture the commit hash in the run-log)
- JMeter 5.6+ (optional, only for supplementary load tests)

---

## Installing Python dependencies

From the repository root:

```bash
pip install -r automatizacion/requirements.txt
```

Dependencies: `requests`, `python-dotenv`. Everything else uses the stdlib.

---

## Full usage flow

### 1. Environment bootstrap

Brings up n8n, PostgreSQL, mock-bot (port 3001), and mock-iot (port 3002):

```bash
python automatizacion/setup_env.py
```

Generates `infraestructura/.env` with secure credentials, runs `docker compose up -d`, and
waits until every service is healthy. When done, it prints the instructions for the only
manual step.

### 2. MANUAL STEP — Importing flows in the n8n UI (~15-20 min)

This is the only step that cannot be automated. See the full instructions printed by
`setup_env.py` or in `medicion/protocolo-evidencias.md`.

Import order:
1. Bot to-be subflows: E2 → E3 → orchestrator
2. IoT to-be subflows: E1 → E2 → E3 → E4 → orchestrator
3. As-is: `casos-de-estudio/bot/as-is/bot-as-is.json` and `casos-de-estudio/iot/as-is/iot-as-is.json`
4. In every to-be orchestrator: update the Execute Workflow references
5. Activate all flows

### 3. Verify webhooks

```bash
curl -X POST http://localhost:5678/webhook/bot-soporte \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/bot/input-set-A.json
# Expect HTTP 200

curl -X POST http://localhost:5678/webhook/iot-sensor \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-A.json
# Expect HTTP 200
```

### 4. Run measurement rounds

```bash
# All combinations (as-is + to-be, bot + iot, 10 runs per set)
python automatizacion/run_corridas.py --caso all --estado all --n 10

# Bot as-is only
python automatizacion/run_corridas.py --caso bot --estado as-is --n 10

# Dry-run preview
python automatizacion/run_corridas.py --caso all --estado all --n 10 --dry-run
```

Writes automatically to `medicion/run-logs/`.

### 5. Extract metrics from the n8n API

Generate an API Key in n8n (Settings → n8n API → Create an API key), then:

```bash
export N8N_API_KEY="your-api-key"
python automatizacion/extract_metrics.py
```

Generates `medicion/consolidado/metrics-YYYY-MM-DD.md` with p50/p95/p99 and failure rate
per workflow.

### 6. Generate the as-is vs to-be comparison table

```bash
python automatizacion/compare_results.py
```

Generates `medicion/consolidado/comparacion-YYYY-MM-DD.md` with latency and failure-rate
deltas between as-is and to-be for both cases.

### 7. Load test with JMeter (supplementary)

```bash
# As-is Bot
jmeter -n -t medicion/jmeter/bot-load-test.jmx \
       -l medicion/jmeter/resultados/bot-summary.jtl

# As-is IoT
jmeter -n -t medicion/jmeter/iot-load-test.jmx \
       -l medicion/jmeter/resultados/iot-summary.jtl
```

To enable the to-be Thread Group in the .jmx files: change `enabled="false"` to
`enabled="true"` on the second Thread Group of each file.

---

## Script reference

| Script | Purpose | Produces |
|--------|-----------|---------|
| `setup_env.py` | Full Docker environment bootstrap | `.env`, 4 healthy services |
| `run_corridas.py` | Automated runs against n8n webhooks | Rows in `medicion/run-logs/` |
| `extract_metrics.py` | Statistics from n8n's REST API | `medicion/consolidado/metrics-*.md` |
| `compare_results.py` | As-is vs to-be comparison table | `medicion/consolidado/comparacion-*.md` |

---

## What remains manual and why

| Step | Technical reason |
|------|---------------|
| Importing flows in the n8n UI | The REST API generates new IDs per installation; `Execute Workflow` needs real IDs only known post-import |
| Updating Execute Workflow references | Requires selecting the subflow from a dropdown in the n8n UI |
| Activating flows (Active toggle) | No convenient public-API equivalent post-import |
| Generating N8N_API_KEY | Requires the n8n UI → Settings → n8n API |

---

## Mock architecture

The mocks run as Docker containers within the compose stack:

```
n8n (5678) → host.docker.internal:3001 → mock-bot
                                          ├── POST /mock/notificar → 200 {ticket_id}
                                          └── POST /api/v2/write   → 204 (InfluxDB mock)

n8n (5678) → host.docker.internal:3002 → mock-iot
                                          └── POST /mock/notificar → 200 {notificacion_enviada}
```

mock-bot also responds 204 to the IoT as-is flow's "Save to InfluxDB" node, allowing the
flow to complete end-to-end for total-latency measurement. The antipattern (wrong
technology, hardcoded token) remains documented in the technical notes and visible in the
JSON.

---

## Environment verification commands

```bash
# Container status
docker compose -f infraestructura/docker-compose.yml ps

# Mock logs
docker logs mock_bot
docker logs mock_iot

# Direct health check
curl http://localhost:3001/health   # {"ok":true}
curl http://localhost:3002/health   # {"ok":true}

# Stop the environment
docker compose -f infraestructura/docker-compose.yml stop

# Stop and remove everything (data included — destructive)
docker compose -f infraestructura/docker-compose.yml down -v
```
