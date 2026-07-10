> 🌐 **Language / Idioma:** English · [Español](protocolo-evidencias.md)

# Evidence protocol v1.0

Operational procedures for bringing up the environment, importing flows, and logging
measurements. This document is the reference for reproducing the evaluation environment
from scratch.

**Date:** 2026-04-07

---

## 1. Bringing up the local environment

### Prerequisites
- Docker Desktop installed and running
- Git with the repository cloned

### Steps

```bash
cd infraestructura
cp .env.example .env
```

Edit `.env` and replace every `changeme` value:
- `POSTGRES_PASSWORD` — PostgreSQL password
- `N8N_BASIC_AUTH_PASSWORD` — n8n access password
- `N8N_ENCRYPTION_KEY` — 32+ character key (generate with `openssl rand -hex 32`)

```bash
docker compose up -d
```

Verify that both services are `healthy`:

```bash
docker compose ps
```

Wait until `n8n_postgres`'s status is `healthy` (may take 10-30 seconds).

### Verification
- PostgreSQL: `docker compose exec postgres pg_isready -U n8n_user -d sensores_db`
- n8n: Open `http://localhost:5678` in the browser → should prompt for username and
  password

---

## 2. Creating the PostgreSQL table

Run once after bringing up the environment:

```bash
docker compose exec postgres psql -U n8n_user -d sensores_db -c "
CREATE TABLE IF NOT EXISTS lecturas_sensor (
  id               SERIAL PRIMARY KEY,
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,
  sensor_id        VARCHAR(100) NOT NULL,
  temperature      DECIMAL(5,1),
  humidity         DECIMAL(5,1),
  co2              INTEGER,
  timestamp        TIMESTAMPTZ NOT NULL,
  nivel_alerta     VARCHAR(20) DEFAULT 'normal',
  anomalias        JSONB,
  run_id           VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);"
```

Verify the table was created:

```bash
docker compose exec postgres psql -U n8n_user -d sensores_db -c "\d lecturas_sensor"
```

**Note:** The `automatizacion/setup_env.py` script creates both tables automatically.
If running manually, also create the IoT error handler's dead-letter table (ADR-005):

```bash
docker compose exec postgres psql -U n8n_user -d sensores_db -c "
CREATE TABLE IF NOT EXISTS lecturas_sensor_dead_letters (
  id               SERIAL PRIMARY KEY,
  run_id           VARCHAR(100),
  payload_original JSONB,
  error_message    TEXT,
  node_name        VARCHAR(200),
  ts               TIMESTAMPTZ DEFAULT NOW()
);"
```

---

## 3. Importing flows into n8n

### Mandatory order

Always import subflows **before** the orchestrator. The orchestrator needs the
subflows' IDs to configure the Execute Workflow nodes.

**Bot case (import order):**
1. `microframework/plantillas/bot-to-be-e2-dominio.json`
2. `microframework/plantillas/bot-to-be-e3-adaptador.json`
3. `microframework/plantillas/bot-to-be-orquestador.json`
4. `microframework/plantillas/bot-as-is.json`

**IoT case (import order):**
1. `casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json`
2. `casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json`
3. `casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json`
4. `casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json`
5. `casos-de-estudio/iot/to-be/iot-error-handler.json`  ← **new: ADR-005**
6. `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json`
7. `casos-de-estudio/iot/as-is/iot-as-is.json`

### Import procedure in the n8n UI

1. Open `http://localhost:5678`
2. Go to **Workflows** → **Import from file**
3. Select the JSON file in the order indicated above
4. Confirm the import and record the **numeric ID** assigned by n8n

### Capturing IDs post-import

After importing each subflow, record the ID assigned by n8n:

| Subflow | Name in n8n | Assigned ID |
|---------|---------------|-------------|
| bot-to-be-e2-dominio | BOT-TO-BE - E2 Logica de dominio | _____________ |
| bot-to-be-e3-adaptador | BOT-TO-BE - E3 Adaptador de persistencia | _____________ |
| iot-to-be-e1-validacion | IOT-TO-BE - E1 Validacion de entrada | _____________ |
| iot-to-be-e2-dominio | IOT-TO-BE - E2 Dominio y analisis de umbrales | _____________ |
| iot-to-be-e3-persistencia | IOT-TO-BE - E3 Adaptador de persistencia | _____________ |
| iot-to-be-e4-notificacion | IOT-TO-BE - E4 Adaptador de notificacion | _____________ |

### Updating references in the orchestrators

After importing the subflows:

1. Open the orchestrator flow (bot-to-be or iot-to-be) in n8n
2. Click on every **Execute Workflow** node
3. In the **Workflow** field, select the correct subflow using the workflow selector
4. Save the flow
5. Export the updated flow (with real IDs) and copy it to `casos-de-estudio/{case}/to-be/`

---

## 4. Running an Input Set

### Prerequisite
- Flows imported with updated references
- Webhook activated ("Active" state in n8n)

### Request format

**Bot:**
```bash
curl -X POST http://localhost:5678/webhook/bot-soporte-to-be \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/bot/input-set-A.json
```

**IoT:**
```bash
curl -X POST http://localhost:5678/webhook/iot-sensor-to-be \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-A.json
```

### For as-is:
```bash
curl -X POST http://localhost:5678/webhook/bot-soporte \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/bot/input-set-A.json

curl -X POST http://localhost:5678/webhook/iot-sensor \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-A.json
```

---

## 5. Logging a run-log entry

Add a row to the corresponding CSV after every run:

**File:** `medicion/run-logs/{case}/run-log-{case}-{state}.csv`

```
run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash

RUN-BOT-001,bot,as-is,A,2026-06-08T10:00:00Z,2026-06-08T10:00:02Z,success,,Corrida normal,a1b2c3d
RUN-BOT-002,bot,as-is,C,2026-06-08T10:01:00Z,2026-06-08T10:01:01Z,fail,validation,Token ausente,a1b2c3d
```

**Integrity rules:**
- Once recorded, a row is NEVER deleted or modified
- If there is a recording error: add a new correct row and mark the incorrect one with
  `status: invalid`
- `commit_hash`: the first 7 characters of the active commit at the time of the run

**Note on `run_id` in as-is vs to-be:**
The as-is generates `run_id` in the measurement harness (`automatizacion/run_corridas.py`)
using a simplified format `{case}-{version}-{set}-{index}-{hash}` because the as-is flows
violate REG-002 (they don't propagate run_id internally). In the to-be, `run_id` is
generated in E1 following the REG-002 format
(`RUN-{CASE}-{ISO8601}-{SUFFIX}`) and propagates through every stage up to the response
and the DB. The PHASE 6 comparative analysis recognizes both formats.

---

## 6. Logging a cr-log entry

Used when running the Change Request (CR) protocol during PHASE 6.

**File:** `medicion/cr-logs/{case}/cr-log-{case}-{state}.csv`

```
cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes

CR-BOT-001,CR1,bot,as-is,2026-04-21T10:15:00-05:00,2026-04-21T10:52:00-05:00,8,0,3,152fd2d,prioridad R002 media->alta
CR-BOT-001,CR1,bot,to-be,2026-06-29T09:00:00Z,2026-06-29T09:20:00Z,1,0,1,c3d4e5f,cambio en constante E2
```

**Fields:**
- `cr_id`: unique identifier per row (`CR-{CASE}-{NNN}`)
- `cr_type`: functional type — `CR1` (business), `CR2` (integration), `CR3` (validation)
- `nodes_touched`: number of nodes modified to implement the change
- `deps_touched`: number of external endpoints or tables with a modified contract
- `attempts`: number of edit+run iterations until successful verification
- `notes`: free text — brief rationale, incidents during editing, etc.

As-is values were pre-measured in PHASE 3 (see `cr-design.md` per case); to-be values are
populated in PHASE 6.

---

## 7. Stopping and restarting the environment

```bash
# Stop without deleting data
docker compose stop

# Restart
docker compose start

# Stop and remove containers (volumes are preserved)
docker compose down

# Remove everything including data (destructive!)
docker compose down -v
```

**Note:** `docker compose down -v` deletes PostgreSQL's data and n8n's state. Only use if
you want to restart the environment from scratch.

---

## 8. Run-log analysis and visualization

### Purpose

`medicion/analizar_runlogs.py` generates an interactive HTML report from the run-log CSVs.
It automatically detects which files exist (as-is and/or to-be) and produces a complete
statistical analysis with Plotly charts, conformity tables, and a prioritized anomaly list.

### Dependencies

```bash
pip install pandas plotly scipy
```

### Execution

```bash
# From the repository root
python medicion/analizar_runlogs.py

# Specify output folder
python medicion/analizar_runlogs.py --output medicion/consolidado/
```

The report is saved to `medicion/consolidado/reporte-runlogs.html`.
Open in any browser — no server or local connection required.

### Report sections

| # | Section | Content |
|---|---------|-----------|
| 1 | Executive summary | KPI cards: overall success rate, median latency, conformity traffic light |
| 2 | Result distribution | Stacked success/fail bars by input_set × version; pie charts per case |
| 3 | Latency analysis | Box plot and histogram of duration_ms; p50/p95/p99 table per set |
| 4 | As-is vs to-be comparison | Δ success rate and Δ p95 latency; p50/p95 lines per set; Mann-Whitney U test |
| 5 | Error types | Stacked error_type bars for failed rows only |
| 6 | Timeline | start_ts vs duration_ms scatter colored by status — detects outliers and pauses |
| 7 | Data quality | Integrity table (commit_hash, notes, uniform N); anomaly list with severity |

Section 4 only appears when data from both versions (as-is **and** to-be) exist.

### When to run it

- **At the end of every measurement session** to validate the integrity of new data.
- **Before the formal comparison** (Phase 6) to confirm the data is comparable.
- **After adding to-be data** to verify the improvement and compute the deltas.

### Conformity logic

The script compares the observed `success_rate` against the expected behavior defined in
`automatizacion/run_corridas.py`. The reference table is:

| Case | Version | Set | Expected | Justification |
|------|---------|-----|----------|---------------|
| bot | as-is | A, B, D, E | 100% success | No validation (REG-003 antipattern) |
| bot | as-is | C | 100% failure | Missing token → HTTP 401 |
| bot | to-be | A, B | 100% success | E1 validation passes |
| bot | to-be | C, D, E | 100% failure | E1 rejects → HTTP 400 |
| iot | as-is | A, B, C, D, E | 100% success | No validation (REG-003/004 antipattern) |
| iot | to-be | A, B, D | 100% success | E1 validation passes |
| iot | to-be | C, E | 100% failure | Missing fields → HTTP 422 |

---

## 9. commit_hash="unknown" anomaly — Methodological documentation

### Root cause

`automatizacion/run_corridas.py` obtains the hash with:

```python
subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True)
```

The process was run from the Python interpreter's working directory, which in some
sessions was not the repository root but a subdirectory. `git rev-parse HEAD` fails
silently outside a repo and returns an empty string, which the harness captures as
`"unknown"`.

### Impact on data validity

Run-logs with `commit_hash="unknown"` correspond to as-is runs executed on 2026-04-20/21.
Data validity **is not affected**: the `commit_hash` field is an audit field for
traceability, not a measurement-data integrity field. The `run_id`, `status`,
`error_type`, `start_ts`, `end_ts` fields are generated by the harness itself from the
webhook's HTTP response and are correct.

### Historical association

For PHASE 6's comparative analysis, as-is data with `commit_hash="unknown"` is treated as
belonging to commit **`152fd2d`**, the last documented commit before the as-is runs
(2026-04-20). This association is recorded in this protocol as the source of truth and
requires no retroactive correction of the CSVs.

### Resolution for PHASE 6

To-be runs will be executed with the fix applied in `run_corridas.py`:

1. Pass `cwd=REPO_ROOT` to `subprocess.run` so git runs from the root.
2. Verify `git status --porcelain` before every measurement session to confirm a clean
   state.
3. Document the active commit hash in `estado-actual.md` before starting runs.

**Code fix:**

```python
import os
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_commit_hash():
    result = subprocess.run(
        ['git', 'rev-parse', '--short', 'HEAD'],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    return result.stdout.strip() if result.returncode == 0 else 'unknown'
```

---

## §9 Dynamic datasets and seeds

### Purpose
Sets F, G, I, J, K are generated pseudo-randomly with a fixed seed to guarantee
bit-for-bit reproducibility across runs and as-is/to-be fairness (same input, same
order).

### Files
- `medicion/datasets/seeds.yaml` — versioned seeds (do not modify without an ADR)
- `medicion/datasets/generar_datasets.py` — deterministic generator
- `medicion/datasets/{bot,iot}/input-set-{F,G,I,J,K}.json` — generated datasets (committed)

### Generation command
```bash
cd D:\Git\n8n-microframework
pip install numpy
python medicion/datasets/generar_datasets.py
```

### Regeneration
Only allowed via an ADR. Changing a seed invalidates as-is/to-be comparability for that
set. The generator includes SHA-256 hash verification to detect drift.

### Set taxonomy
| Set | Type | N | Purpose |
|-----|------|---|-----------|
| A–E | Static | 200 (repeated) | Canonical technical conformity |
| F | Dynamic | 200 unique | Normal variable traffic |
| G | Dynamic | 200 unique | 70/15/10/5 industrial mix |
| I | Dynamic | 200 unique | Gradual degradation (normal→critical) |
| J | Dynamic | 200 unique | Extreme percentiles p1/p99 |
| K | Dynamic | 200 unique | Duplicates with repeated idempotency_key |

---

## §10 Semantic conformity

Conformity is measured at two levels:

| Level | What it measures | Source |
|-------|----------|--------|
| Technical | Actual HTTP status = expected HTTP status | Run-log CSV, `status` column |
| Semantic | Observed quality attribute (idempotency, correct level, run_id present) | Post-processing + SQL query |

### Set K — idempotency verification in PostgreSQL
After running set K, execute:
```sql
-- Bot
SELECT idempotency_key, COUNT(*) AS n FROM interacciones_bot
GROUP BY idempotency_key HAVING COUNT(*) > 1;

-- IoT
SELECT idempotency_key, COUNT(*) AS n FROM lecturas_sensor
GROUP BY idempotency_key HAVING COUNT(*) > 1;
```
- Expected as-is: 100 keys with n=2 (duplicates everything)
- Expected to-be: 0 rows (ON CONFLICT DO NOTHING works)

---

## §11 Inter-request arrival pattern

The delay is configured per set in `DELAY_STRATEGY` (see `automatizacion/run_corridas.py`):

| Sets | Pattern | Value |
|------|--------|-------|
| A, B, C, D, E, F, G, J, K | Fixed | 100 ms |
| I (degradation) | Linear decreasing | 300 ms → 50 ms |

Set I formula: `delay_i = 0.300 - (0.250 × i / 199)`

See ADR-004 for the full justification.

---

## §12 Canonical physical validation ranges (IoT)

Resolution of an inconsistency detected in PHASE 4 (2026-05-03). Normative source: IoT
ADR-006.

| Variable | Minimum | Maximum | Unit | Reference standard |
|----------|--------|--------|--------|-------------------|
| temperature | -50 | 125 | °C | IEC 60068-2-2 (NTC/PT100 sensors) |
| humidity | 0 | 100 | % | — |
| co2 | 0 | 5000 | ppm | — |

These values apply to E1's **physical range validation** (rejecting the impossible). They
are distinct from the **alert thresholds** defined in ADR-002 / E2's `UMBRALES` constant.

| Variable | Warning threshold | Critical threshold | Standard |
|----------|--------------------|----------------|-------|
| temperature | > 35°C | > 45°C | ISO 7730 |
| humidity | > 80% | > 95% | ISO 7730 |
| co2 | > 800 ppm | > 1200 ppm | ASHRAE 62.1 |
