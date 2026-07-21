> 🌐 **Language / Idioma:** English · [Español](arquitectura-flujos.md)

# Flow architecture: as-is and to-be

## Central architectural principle

The micro-framework translates Clean Architecture into n8n's visual context. Instead of classes and code layers, the boundaries are subflows orchestrated through the `Execute Workflow` node. Each subflow has a single responsibility, an input/output contract defined in JSON, and no knowledge of the implementation details of the others.

---

## As-is architecture (current state — ad-hoc pattern)

### Pattern description

The as-is state represents how flows are typically built in n8n without architectural guidelines. The defining characteristics are:

- A single monolithic flow that mixes validation, business logic, integration, and output formatting
- Credentials and tokens hardcoded directly in the nodes (visible in the JSON export)
- No standardized error handling: a failure in any node stops the flow with no recovery
- No structured logging: only n8n's execution history, not programmatically queryable
- No idempotency control: retries can create duplicate records
- Threshold logic (IoT) or classification rules (Bot) embedded in the same node that performs the integration

### As-is conceptual diagram

```
Trigger or event
(webhook, cron, input)
        │
        ▼
Logic and decisions ──────► External integrations
mixed into the flow          coupled directly
        │                            │
        ▼                            ▼
Non-standardized            Secrets and configuration
error handling               scattered across nodes
        │
        ▼
Limited observability
(basic n8n logs)
```

### Typical as-is nodes

| Node | Role in as-is | Architectural problem |
|------|-------------|------------------------|
| Webhook | Entry trigger | Accepts any payload with no prior validation |
| IF | Token validation | Token hardcoded in the node condition |
| Code | Everything mixed | Validation + business logic + formatting in a single block |
| HTTP Request | External integration | API key hardcoded in the node header |
| Postgres | Persistence | No idempotency key, possible duplicates on retry |
| Respond to Webhook | Output | Response with no defined contract structure |

---

## To-be architecture (micro-framework applied)

### Principles applied

**Separation of responsibilities:** Each stage has a single reason to change. If the external API changes, only the Adapter (E3) is modified. If a business rule changes, only the Domain (E2) is modified.

**Centralized orchestration:** The orchestrator flow invokes subflows through `Execute Workflow` and controls the complete flow. The state of the entire operation is traceable from a single point.

**Input/output contracts:** Each subflow declares which fields it receives and which fields it returns. The contracts are documented in `microframework/plantillas/contratos-entrada-salida.md`.

**Centralized secrets management:** No secret, API key, or token appears in the flow's exported JSON. All access to external services uses n8n credentials.

**Idempotency:** Persistence operations include an idempotency key (`run_id-operacion` or `sensor_id-timestamp`) with `ON CONFLICT DO NOTHING` in PostgreSQL.

**Structured log per run:** Each stage emits a `console.log` with a JSON object that includes at minimum: `run_id`, `etapa`, `status`, `start_ts` / `end_ts`, and fields relevant to the context.

### To-be conceptual diagram

```
Trigger or event
(webhook, cron, input)
        │
        ▼
    Stage 1                    Structured log
   Input validation ◄────────────────── per run
                                  (cross-cutting)
        │
        ▼ (only if valid)
    Stage 2
   Domain                 ◄── Secrets managed
    logic                      centrally
        │
        ▼
    Stage 3
   Integration            ◄── Standardized error
   adapters                    handling
   (with retry)                 (retry + fallback)
        │
        ▼
    Stage 4
   Controlled output
   (response / notification)
```

---

## Bot case — Technical detail

### To-be flows

The Bot case consists of 4 JSON files importable into n8n:

**1. bot-to-be-orquestador.json** — Main flow
- Node: `Webhook` on path `/bot-support-to-be`
- Node: `Code` (E1 — Validation: required fields, type, length)
- Node: `IF` (is the input valid?)
- Node: `Execute Workflow` → E2 subflow
- Node: `Execute Workflow` → E3 subflow
- Node: `IF` (pipeline error?)
- Node: `Respond to Webhook` — 200 OK / 400 Bad Request / 401 Unauthorized / 500 Internal Server Error
- Settings: `errorWorkflow: "bot-error-handler"`, `saveDataSuccessExecution: "all"`

**2. bot-to-be-e2-dominio.json** — Business logic subflow
- Trigger: `Execute Workflow Trigger`
- Node: `Code` with classification rule catalog (R001–R004)
- Expected input: `{ run_id, start_ts, payload }`
- Output: `{ run_id, start_ts, categoria, prioridad, respuesta, requiereEscalacion, payload }`

**3. bot-to-be-e3-adaptador.json** — Persistence subflow
- Trigger: `Execute Workflow Trigger`
- Node: `Code` (prepare payload + generate idempotency_key)
- Node: `HTTP Request` with n8n credential + retry enabled (3 attempts, 2000ms)
- Node: `Code` (structured output log)
- Expected input: `{ run_id, start_ts, categoria, prioridad, respuesta, payload }`
- Output: `{ run_id, categoria, prioridad, respuesta, ticket_id, payload }`

### Input contract — Bot

```json
{
  "token": "string (required)",
  "user_id": "string (required)",
  "session_id": "string (optional)",
  "message": "string (required, max 1000 chars)"
}
```

### Output contract — Bot (200 OK)

```json
{
  "ok": true,
  "run_id": "string",
  "respuesta": "string",
  "categoria": "string",
  "prioridad": "string"
}
```

### Bot classification rules (E2)

| ID | Condition | Category | Priority | Escalation |
|----|-----------|-----------|-----------|------------|
| R001 | message contains: urgente, critico, emergencia | incidente | alta | yes |
| R002 | message contains: factura, pago, cobro | facturación | media | no |
| R003 | message contains: error, falla, no funciona | soporte_tecnico | media | no |
| R004 | message contains: hola, buenos, buenas | saludo | baja | no |
| DEFAULT | any other case | general | baja | no |

### E1 validations — Bot

- `token`: required (presence)
- `message`: required, string type
- `user_id`: required, string type
- `message.length`: maximum 1000 characters

---

## IoT case — Technical detail

### To-be flows

The IoT case consists of 6 JSON files importable into n8n:

**1. iot-to-be-orquestador.json** — Main flow
- Node: `Webhook` on path `/iot-sensor-to-be`
- Node: `Execute Workflow` → E1 validation
- Node: `IF` (is the reading valid?)
- Node: `Execute Workflow` → E2 domain
- Node: `Execute Workflow` → E3 persistence
- Node: `Execute Workflow` → E4 notification
- Node: `Respond to Webhook` (200 OK or 422 Unprocessable)
- Settings: `errorWorkflow: "iot-error-handler"`, `saveDataSuccessExecution: "all"`

**2. iot-to-be-e1-validacion.json** — Validation and normalization
- Generates a unique `run_id`: `RUN-IOT-{timestamp}-{random}`
- Validates required fields: sensor_id, temperature, humidity, co2
- Validates physical ranges: temp (-50 to 100), hum (0 to 100), co2 (0 to 5000)
- Normalizes: `Math.round(temp * 10) / 10`, `Math.round(hum * 10) / 10`, `Math.round(co2)`
- Output: `{ run_id, start_ts, valido, errores, lectura }`

**3. iot-to-be-e2-dominio.json** — Threshold analysis
- Thresholds centralized in the `UMBRALES` constant at the start of the Code node
- Analyzes temperature, humidity, and CO2 against normal and critical thresholds
- Determines level: `normal`, `warning`, `critico`
- Determines `requiereNotificacion: boolean`
- Output: `{ run_id, start_ts, lectura, analisis: { nivel, anomalias[], requiereNotificacion } }`

**4. iot-to-be-e3-persistencia.json** — Persistence with idempotency
- Generates `idempotency_key`: `{sensor_id}-{timestamp}`
- PostgreSQL query with `ON CONFLICT (idempotency_key) DO NOTHING`
- PostgreSQL credential managed by n8n (not in the flow's JSON)
- Structured output log with segment duration

**5. iot-to-be-e4-notificacion.json** — Notification by severity
- IF: requiereNotificacion?
  - Yes → IF: critical level?
    - Yes → HTTP POST to `/notificaciones/critico` endpoint (3 retry attempts)
    - No → HTTP POST to `/notificaciones/warning` endpoint (2 retry attempts)
  - No → Skip log (normal level)

### Input contract — IoT

```json
{
  "sensor_id": "string (required)",
  "temperature": "number (required, physical range: -50 to 100)",
  "humidity": "number (required, physical range: 0 to 100)",
  "co2": "number (required, physical range: 0 to 5000)",
  "timestamp": "string ISO 8601 (optional, default: now)",
  "location": "string (optional)"
}
```

### IoT domain thresholds (E2)

| Variable | Normal min | Normal max | Critical max |
|----------|-----------|-----------|------------|
| temperature | 10°C | 35°C | 45°C |
| humidity | 20% | 80% | 95% |
| co2 | — | 1000 ppm | 2000 ppm |

### Required PostgreSQL table schema

```sql
CREATE TABLE lecturas_sensor (
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
);
```

---

## Structured log — Standard format

All subflows emit logs with `console.log(JSON.stringify({...}))`. The minimum required fields are:

```json
{
  "run_id": "RUN-IOT-1710000000000-AB1C2D",
  "etapa": "E2_dominio_iot",
  "status": "ok | fail | skip",
  "start_ts": "2026-03-15T10:00:00.000Z",
  "end_ts": "2026-03-15T10:00:00.045Z",
  "duracion_ms": 45
}
```

Additional fields vary by stage and are documented in `microframework/guia-observabilidad.md`.

---

## External services in the local environment

The local environment uses mock services spun up with Docker:

| Service | Local URL | Port | Purpose |
|---------|----------|--------|-----------|
| n8n | http://localhost:5678 | 5678 | Flow engine |
| PostgreSQL | host.docker.internal:5432 | 5432 | IoT persistence |
| Mock tickets API | http://host.docker.internal:3001 | 3001 | External Bot service |
| Mock notifications API | http://host.docker.internal:3002 | 3002 | IoT notification channel |

The mock services on ports 3001 and 3002 can be simulated with `webhook.site` during initial testing, or spun up with a minimal dockerized express server.

---

## Key differences: as-is vs to-be

| Aspect | As-is | To-be |
|---------|-------|-------|
| Structure | A single monolithic flow | Orchestrator + subflows per stage |
| Credentials | Hardcoded in nodes (visible in JSON) | Managed by n8n credentials |
| Input validation | Minimal or none | Dedicated stage (E1) with a defined contract |
| Business logic | Mixed with integration | Isolated in the domain subflow (E2) |
| Error handling | None (the entire flow fails) | Error workflow + retry on integrations |
| Idempotency | Absent | Idempotency key on every write |
| Log | Basic n8n history | Structured JSON log per stage and run |
| Traceability | Impossible to query programmatically | `run_id` in all logs and records |
| Modifiability | Changing one rule affects the whole flow | Changing one rule only touches E2 |
