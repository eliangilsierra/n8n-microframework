> 🌐 **Language / Idioma:** English · [Español](convenios-y-reglas.md)

# Conventions and working rules

This file defines the conventions and rules that apply when working in this repository.
Read it in full before making any modification.

---

## Naming conventions

### n8n flow files (JSON)

```
{case}-{state}.json                    # main flow
{case}-{state}-{stage}.json            # subflow

Examples:
bot-as-is.json
bot-to-be-orquestador.json
bot-to-be-e2-dominio.json
iot-as-is.json
iot-to-be-orquestador.json
iot-to-be-e1-validacion.json
iot-to-be-e3-persistencia.json
```

Note: file names keep their original Spanish tokens (`as-is`, `to-be`, `orquestador`,
`dominio`, `validacion`, `persistencia`, etc.) exactly as they exist in the repository —
these are literal file names, not prose, and must not be translated or renamed.

### Nodes inside n8n flows

Nodes follow the pattern: `{Stage} - {Action description}`

```
E1 - Validacion de entrada
E2 - Reglas de negocio
E3 - Preparar payload adaptador
E3 - Log salida adaptador
E4 - Notificar canal CRITICO
IF - Entrada valida?
IF - Nivel critico?
Webhook - Entrada
Respond - OK (200)
Respond - Entrada invalida (400)
```

(Node display names inside the actual n8n flows remain in Spanish, matching the exported
JSON — this is a literal naming convention, not narrative text.)

### Subflows (IDs in n8n)

```
bot-e2-dominio
bot-e3-adaptador
iot-e1-validacion
iot-e2-dominio
iot-e3-persistencia
iot-e4-notificacion
```

### ADR (Architecture Decision Records)

```
ADR-{NNN}-{kebab-case-description}.md

Examples:
ADR-001-orquestacion-centralizada.md
ADR-002-gestion-secretos.md
ADR-003-idempotencia-ingesta.md
```

### Run Logs (CSV)

```
run-log-{case}-{state}.csv

Examples:
run-log-bot-as-is.csv
run-log-bot-to-be.csv
run-log-iot-as-is.csv
run-log-iot-to-be.csv
```

### CR Logs (CSV)

```
cr-log-{case}-{state}.csv

Examples:
cr-log-bot-as-is.csv
cr-log-bot-to-be.csv
```

### Synthetic datasets

```
input-set-{letter}.json

Examples:
medicion/datasets/bot/input-set-A.json
medicion/datasets/iot/input-set-B.json
```

### Commits

The commit format is:

```
[FASE-N] tipo: descripcion breve en minúsculas

Valid types:
feat     → new artifact or functionality
fix      → fix to a flow or document
docs     → documentation change
measure  → measurement or log entry
adr      → new ADR or modification
refactor → restructuring with no functional change
chore    → configuration or maintenance tasks

Examples:
[FASE-2] feat: agregar flujo as-is bot con nodo de validación token
[FASE-3] docs: documentar reglas obligatorias micro-framework v1.0
[FASE-4] adr: registrar decisión de orquestación centralizada bot
[FASE-6] measure: run-log bot as-is input-set-A 10 corridas
```

Note: the commit message body itself stays in Spanish per the project's actual convention
(`FASE`, not `PHASE`) — this is the literal format used in the repository's git history and
must be reproduced exactly, not translated.

---

## File structure — Detail per folder

### `casos-de-estudio/{case}/as-is/`

```
flujo-{case}-as-is.json       ← n8n export, versioned (never compress)
diagrama-as-is.drawio         ← editable diagram
diagrama-as-is.png            ← exported diagram image
notas-tecnicas.md             ← flow structure, nodes, critical points, findings
```

### `casos-de-estudio/{case}/to-be/`

```
flujo-{case}-to-be-orquestador.json
flujo-{case}-to-be-e1-{name}.json    ← one file per subflow
flujo-{case}-to-be-e2-{name}.json
flujo-{case}-to-be-e3-{name}.json
flujo-{case}-to-be-e4-{name}.json    ← only if applicable (IoT)
diagrama-to-be.drawio
diagrama-to-be.png
notas-tecnicas.md
```

### `casos-de-estudio/{case}/adr/`

```
ADR-001-{name}.md
ADR-002-{name}.md
...
```

Every ADR follows this template:

```markdown
# ADR-{NNN}: {Decision title}

**Status:** Proposed | Accepted | Superseded by ADR-XXX  
**Date:** YYYY-MM-DD  
**Case:** bot | iot  
**Affected quality attribute:** Maintainability | Security | Reliability | Traceability

## Context

{Description of the problem or situation that requires the decision}

## Decision

{Description of the decision made}

## Alternatives considered

- {Alternative 1}: {why it was discarded}
- {Alternative 2}: {why it was discarded}

## Consequences

**Positive:**
- {positive consequence}

**Negative / trade-offs:**
- {negative consequence or trade-off}

## Relationship to the micro-framework

{Which micro-framework rule or pattern supports this decision}
```

### `medicion/run-logs/{case}/`

Run Logs are CSVs with these exact columns:

```csv
run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash
RUN-BOT-001,bot,as-is,A,2026-06-08T10:00:00Z,2026-06-08T10:00:02Z,success,,Corrida normal,a1b2c3d
RUN-BOT-002,bot,as-is,C,2026-06-08T10:01:00Z,2026-06-08T10:01:01Z,fail,validation,Token ausente en input-set-C,a1b2c3d
```

Valid values for `error_type`: `validation`, `integration`, `logic`, `timeout`, `unknown`,
empty if status=success. Note: the `notes` field content itself is written in Spanish in
the actual CSV evidence files, since it is raw research data, not documentation prose.

### `medicion/cr-logs/{case}/`

CR Logs are CSVs with these exact columns:

```csv
cr_id,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash
CR1,bot,as-is,2026-06-22T09:00:00Z,2026-06-22T09:45:00Z,8,2,3,b2c3d4e
CR1,bot,to-be,2026-06-29T09:00:00Z,2026-06-29T09:20:00Z,2,0,1,c3d4e5f
```

---

## Critical security rules

### What must NEVER be in the repository

- The `.env` file with real values
- Real API tokens for any service
- Real database passwords
- Any personal or sensitive data of real users
- AWS, GitHub, or any other service credentials

### The `.env.example` file

`.env.example` in `infraestructura/` documents every needed variable with example or
placeholder values:

```env
# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme
N8N_ENCRYPTION_KEY=changeme-32-chars-minimum

# PostgreSQL
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=changeme
POSTGRES_DB=sensores_db

# Mock services
MOCK_TICKETS_API_PORT=3001
MOCK_NOTIFICACIONES_API_PORT=3002
```

### `.gitignore` must include

```gitignore
infraestructura/.env
.env
*.env
n8n_data/
__pycache__/
node_modules/
*.log
```

---

## Rules for modifying n8n flows

1. **Before modifying:** Export the current flow from the n8n UI and save it to the
   corresponding folder with the correct name.

2. **After modifying:** Export the updated flow, replace the file in the repository, and
   commit using the correct format.

3. **Verify before committing:** Apply the architecture checklist (if to-be) or confirm
   that the as-is intentionally preserves its documented antipatterns.

4. **Never:** Modify the flow's JSON directly with a text editor without first testing that
   it works in n8n.

5. **Always:** When a new node is added to the to-be, verify that REG-001 (no hardcoded
   credentials) still holds.

---

## Rules for synthetic datasets

Files under `medicion/datasets/` are immutable during the measurement phase. Any
modification invalidates the comparability of the metrics.

If a dataset must be modified:
1. Create a new file with a version suffix: `input-set-A-v2.json`
2. Document the change in `medicion/protocolo-evidencias.md`
3. Indicate from which run onward the new dataset is used

---

## Rules for measurement logs

CSV files under run-logs and cr-logs are study evidence. Once a run is recorded, it is
never deleted or modified. If there is a recording error:
1. Add a new row with the correct data
2. Mark the incorrect row with `status: invalid` and a note in the `notes` field

---

## Local infrastructure — Docker services

The `infraestructura/docker-compose.yml` file brings up all necessary services. To start
the environment:

```bash
cd infraestructura
cp .env.example .env
# Edit .env with the correct values
docker compose up -d
```

After bringing up the services, create the table in PostgreSQL:

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

### Flow import order in n8n

Always import subflows before the orchestrator. After importing, update the ID references
in the orchestrator using the Execute Workflow node's workflow selector.

**Bot case:**
1. `bot-to-be-e2-dominio.json`
2. `bot-to-be-e3-adaptador.json`
3. `bot-to-be-orquestador.json`
4. `bot-as-is.json`

**IoT case:**
1. `iot-to-be-e1-validacion.json`
2. `iot-to-be-e2-dominio.json`
3. `iot-to-be-e3-persistencia.json`
4. `iot-to-be-e4-notificacion.json`
5. `iot-to-be-orquestador.json`
6. `iot-as-is.json`

---

## `run_id` format (v2)

```
{case}-{version-no-dash}-{set}-{index:04d}-{seed_hash[:7]}
```

Examples:
- `bot-asis-F-0042-2026042` (run 42 of set F, as-is)
- `iot-tobe-K-0199-2026042` (run 199 of set K, to-be)

---

## Input set taxonomy (A–K)

| Sets | Type | Description |
|------|------|-------------|
| A–E | Static | Canonical technical conformity (one payload repeated N times) |
| F | Dynamic | Normal variable traffic within industrial ranges |
| G | Dynamic | 70/15/10/5 industrial mix |
| H | Reserved | Concurrency spike (covered by JMeter) |
| I | Dynamic | Gradual degradation: normal → critical values |
| J | Dynamic | Extreme percentiles p1/p99 |
| K | Dynamic | Duplicates with the same idempotency_key (measures REG-005) |

---

## GitHub Issues and phases

The project uses GitHub Issues with one Issue per phase. Each Issue has a task checklist.
When a task is completed:
1. Check the item off in the Issue
2. Reference the commit in the Issue comment: `Completado en {commit-hash}`

Available labels: `fase`, `en-progreso`, `bloqueado`.

The GitHub Projects board has a Board (Kanban) view and a Table view. Use the Board for
overall status and the Table for dates and priorities.
