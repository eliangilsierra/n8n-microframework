> 🌐 **Language / Idioma:** English · [Español](guia-buenas-practicas.md)

# Best Practices Guide — LC/NC Micro-framework for n8n

**Version:** 1.0
**Date:** 2026-05-18
**Deliverable:** R5 of the MGADS thesis proposal — "Practical n8n best-practices guide oriented to quality, operation, and gradual adoption of the micro-framework"
**Author:** Elian Hernando Gil Sierra
**Status:** Accepted

---

## Audience

This guide is aimed at four profiles:

- **Absolute beginner** — has never used n8n; wants to understand what structured Low-Code/No-Code is and how to start without mistakes.
- **LC/NC developer** — already builds flows in n8n; wants to adopt a framework that reduces technical debt.
- **Architect / technical lead** — needs to justify decisions (ADR), apply Clean Architecture, and map to ISO/IEC 25010.
- **Operator / SRE** — designs observability, incident management, and the path to production on AWS.

The entire guide is backed by real quantitative evidence measured across two case studies (Bot and IoT) — 8,000 runs, 12 ATAM scenarios, validated micro-framework v1.0.

---

## How to read this guide

Three paths depending on your time and role:

| Path | Chapters | What for |
|---|---|---|
| **Complete** | 1 → 12 + Appendices | Adopt the micro-framework end to end |
| **Essential (recommended)** | 1, 3, 5, 6, 7, 8, 10 | The thesis proposal's 5 mandatory sections + Quick Start |
| **Gradual adoption** | 1 → 4, then Ch. 12 → review your current level and advance | Teams with legacy flows who want to improve incrementally |

---

## Table of contents

1. [Introduction and motivation](#1-introduction-and-motivation)
2. [Prerequisites and environment](#2-prerequisites-and-environment)
3. [30-minute Quick Start](#3-30-minute-quick-start)
4. [Fundamentals: the E1–E4 metamodel](#4-fundamentals-the-e1e4-metamodel)
5. [I/O validation](#5-io-validation)
6. [Error handling: retries and idempotency](#6-error-handling-retries-and-idempotency)
7. [Security: secrets management](#7-security-secrets-management)
8. [Observability: structured logs](#8-observability-structured-logs)
9. [Antipattern catalog](#9-antipattern-catalog)
10. [Applicable final checklist](#10-applicable-final-checklist)
11. [Scaling from the lab to AWS production](#11-scaling-from-the-lab-to-aws-production)
12. [Traceability and maturity](#12-traceability-and-maturity)
13. [Appendices](#appendices)

---

## 1. Introduction and motivation

### 1.1 The problem

Low-Code/No-Code (LC/NC) platforms like n8n have democratized automation: anyone can build
a flow by dragging nodes. But that power has a silent cost. Without structure, flows grow
into a monolithic node mixing: request reception, validation, business rules, persistence,
notifications, and error handling. When something fails, everything fails. When a rule
needs to change, everything must be touched. When there's an incident, there are no useful
logs.

This is what we call **ad-hoc architecture**: it works day one and becomes unmaintainable
by month three.

### 1.2 The solution: a micro-framework

The **LC/NC micro-framework for n8n** proposes:

- A **4-stage metamodel (E1–E4)** inspired by Clean Architecture (Martin, 2017):
  validation, domain, adapters, output.
- **10 mandatory rules (REG-001…010)** with a binary compliance criterion.
- **6 recommended rules (REC-001…006)** for traceability and operability.
- **5 proven patterns** (retry, idempotency, circuit-breaker, error-boundary, saga).
- **11 cataloged antipatterns** with their corrective rule.
- **Executable checklists** (architecture + DevSecOps) verified by an automatic script.

### 1.3 The evidence

The micro-framework was validated across two real case studies: a support Bot and an IoT
pipeline. Comparative as-is (no micro-framework) vs to-be (with micro-framework)
measurements:

| Metric | as-is | to-be | Improvement |
|---|---|---|---|
| Nodes affected per Change Request (Bot) | 8.7 average | 1.0 | **−81%** |
| Nodes affected per Change Request (IoT) | 6.3 average | 0.67 | **−84%** |
| Bot failure rate | 9% | 6% | **−36.6%** |
| Architecture checklist compliance (Bot/IoT) | 1/10 | 10/10 | **100%** |
| ATAM coverage | — | 11/12 scenarios | **92%** |
| MTTD (Mean Time To Detect) Bot | n/a | ~14 seconds | **Goal < 60 s ✅** |

*Source: `medicion/consolidado/comparacion-2026-05-05.md`, `metricas-derivadas.md`, `atam-evidencia.md`.*

What we promise: if you apply this guide's rules, your flow will be modifiable, secure,
observable, and diagnosable.

### 1.4 What you'll get by the end

- A working n8n environment locally in 30 minutes (Ch. 3).
- The ability to read any n8n flow and diagnose which REG it violates (Chs. 4–9).
- A printable checklist to review your own flows before a merge (Ch. 10).
- A clear path to scale from the lab to AWS production (Ch. 11).
- A map to self-assess your maturity level (Ch. 12).

### 1.5 Quick glossary

Before starting, fix these 25 terms:

| Term | Brief meaning |
|---|---|
| **n8n** | LC/NC automation platform; "Node-mation" with visual nodes and embedded code |
| **Workflow** | An n8n automation flow; a graph of connected nodes |
| **Subflow** | A workflow invoked from another via the `Execute Workflow` node |
| **Webhook** | An HTTP endpoint that triggers a workflow's execution |
| **LC/NC** | Low-Code / No-Code — visual development paradigm with little code |
| **Clean Architecture** | Architectural style (Martin 2017) separating domain, use cases, and infrastructure |
| **DevSecOps** | Integration of security and operations within the development lifecycle |
| **E1 / E2 / E3 / E4** | The 4 metamodel stages: Validation / Domain / Adapter / Output |
| **REG-001…010** | The micro-framework's 10 mandatory rules |
| **REC-001…006** | The 6 recommended rules |
| **ADR** | Architecture Decision Record — a versioned record of an architectural decision |
| **ATAM** | Architecture Tradeoff Analysis Method (Bass & Kazman) — an architectural evaluation method |
| **MTTD** | Mean Time To Detect — the average time to detect an incident |
| **Idempotency** | Property: executing the operation N times produces the same effect as executing it once |
| **Retry with backoff** | Retrying with an increasing wait between attempts (typically exponential) |
| **Circuit Breaker** | A pattern that stops retries when an external service is down |
| **Error Boundary** | The point in the flow where the error is captured and isolated |
| **Saga / Compensation** | A distributed-transaction pattern with explicit rollback |
| **Antipattern** | A common solution that appears to solve a problem but creates worse ones |
| **CR — Change Request** | A change request on a flow (CR1, CR2, CR3 in this project) |
| **run_id** | A unique execution identifier (format `RUN-{CASE}-{ts}-{rnd}`) |
| **Idempotency-Key** | An HTTP header / DB key that allows detecting duplicates |
| **ON CONFLICT DO NOTHING** | PostgreSQL SQL clause to avoid duplicate inserts |
| **CloudWatch Logs** | AWS service that persists container stdout logs |
| **Queue Mode** | n8n mode that separates main (UI/webhooks) from workers (execution) via Redis |

---

## 2. Prerequisites and environment

### 2.1 Hardware and software

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 5 GB free | 20 GB free |
| System | Windows 10/11 · macOS 12+ · modern Linux | Windows 11 Pro · macOS 14 |
| Base software | Docker Desktop · Git · editor (VS Code) | + Node.js 20 LTS (for `validar-flujos.mjs`) |

### 2.2 Repository structure

For this guide you only need to know the key folders:

```
n8n-microframework/
├── infraestructura/            # docker-compose.yml + .env.example (local environment)
│   └── aws/                    # Phase 8 AWS architecture design (Chapter 11 references it)
├── microframework/             # Rules, patterns, checklists, templates — the core
│   ├── reglas/                 # REG-001…010 + REC-001…006
│   ├── patrones/               # 5 patterns (retry, idempotency, ...)
│   ├── antipatrones.md         # 11 antipatterns
│   ├── checklists/             # architecture + devsecops
│   ├── plantillas/             # importable to-be JSONs for n8n
│   ├── contratos/              # 9 I/O JSON Schemas
│   ├── guia-observabilidad.md  # JSON log contract per stage
│   ├── validacion/             # validar-flujos.mjs (validation script)
│   ├── adr/                    # framework-level ADRs (MF-001..007)
│   ├── microframework-v1.0.md  # R1 — consolidated micro-framework document
│   └── guia-buenas-practicas.md # ← this document (R5)
├── casos-de-estudio/           # Bot and IoT (as-is + to-be) — complete examples
├── atam/                       # Phase 7 ATAM evaluation
├── medicion/                   # Datasets, run-logs, and comparative metrics
└── estado-actual.md            # Project progress source of truth
```

### 2.3 Critical conventions (summary)

Three rules that always apply:

1. **Credentials never in Git.** They go in `.env` (ignored) and are referenced by name
   from n8n's Credentials.
2. **The flow's exported JSON is the source of truth.** If you modify in the n8n UI,
   re-export and version it in Git.
3. **Every relevant architectural decision is documented as an ADR.** Template at
   `microframework/plantillas/ADR-plantilla.md`.

The full conventions specification is in `convenciones/convenios-y-reglas.en.md`.

---

## 3. 30-minute Quick Start

This chapter takes you from zero to a running micro-framework n8n flow emitting JSON logs.
Assumes you have Docker Desktop installed.

### 3.1 Clone the repository (2 min)

```bash
git clone https://github.com/<your-org>/n8n-microframework.git
cd n8n-microframework
```

### 3.2 Configure environment variables (2 min)

```powershell
# PowerShell
Copy-Item infraestructura\.env.example infraestructura\.env
```

```bash
# Bash / macOS / Linux
cp infraestructura/.env.example infraestructura/.env
```

Edit `infraestructura/.env` and adjust at minimum:

```
POSTGRES_USER=n8n
POSTGRES_PASSWORD=cambia-esto-en-local
POSTGRES_DB=n8n_db
N8N_ENCRYPTION_KEY=genera-32-bytes-aleatorios
```

> ⚠️ `N8N_ENCRYPTION_KEY` must not change after the environment is created: credentials
> stored in n8n are encrypted with this key and would become unrecoverable.

### 3.3 Bring up the environment (5 min)

```bash
docker compose -f infraestructura/docker-compose.yml up -d
```

This brings up four containers: `n8n` (port 5678), `postgres` (5432), `mock-bot` (3001),
and `mock-iot` (3002).

Verify:

```bash
docker compose -f infraestructura/docker-compose.yml ps
```

All four containers should show `Up` / `healthy` status.

### 3.4 Access the n8n UI and create a local account (3 min)

Open [http://localhost:5678](http://localhost:5678). On first load, n8n will ask you to
create a local owner account — use any email and password; no external services are
involved.

### 3.5 Configure the PostgreSQL credential (3 min)

In the UI:

1. **Settings → Credentials → New Credential** → type `Postgres`.
2. Assign the name **`Postgres Local`** (this name is referenced in the flows).
3. Configure:
   - Host: `postgres`
   - Database: `n8n_db`
   - User: `n8n`
   - Password: the `POSTGRES_PASSWORD` value in `.env`
   - Port: `5432`
4. Save and test the connection.

### 3.6 Import the IoT to-be flow (5 min)

From the UI, import in this order (subflows first):

1. `microframework/plantillas/iot-to-be-e1-validacion.json`
2. `microframework/plantillas/iot-to-be-e2-dominio.json`
3. `microframework/plantillas/iot-to-be-e3-persistencia.json`
4. `microframework/plantillas/iot-to-be-e4-notificacion.json`
5. `microframework/plantillas/iot-to-be-orquestador.json`

For every subflow, note the **ID** n8n assigns it (visible in the URL: `/workflow/{ID}`).

Open the orchestrator and, for each `Execute Workflow` node, select the corresponding
subflow from the dropdown (the IDs hardcoded in the JSON may not match your instance —
this is the "hardcoded ID coupling" antipattern, documented in Ch. 9).

Activate the orchestrator (toggle in the top-right corner).

### 3.7 Run a first request (3 min)

```powershell
# PowerShell
$body = Get-Content "medicion\datasets\iot\input-set-B.json" -Raw
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:5678/webhook/iot-sensor-to-be" `
  -ContentType "application/json" `
  -Body $body
```

```bash
# Bash
curl -X POST http://localhost:5678/webhook/iot-sensor-to-be \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-B.json
```

You should receive HTTP `200 OK` and a JSON response with `run_id` and `nivel_alerta`.

### 3.8 View the structured JSON logs (3 min)

```bash
docker compose -f infraestructura/docker-compose.yml logs n8n | grep '"etapa"'
```

You'll see lines like:

```json
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E1_validacion","status":"ok","caso":"iot","duracion_ms":5,...}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E2_dominio","status":"ok","resultado_clave":"critico","duracion_ms":12,...}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E3_adaptador","status":"ok","idempotency_key":"sensor-S42-...","duracion_ms":45,...}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E4_salida","status":"ok","notificacion_enviada":true,"duracion_total_ms":215}
```

Every stage is traceable, measurable, and diagnosable. This is **Observability by design**
(REG-006).

### 3.9 Run the static validator (4 min)

```bash
node microframework/validacion/validar-flujos.mjs
```

The script analyzes every flow JSON in the repository and produces a report indicating
which REGs each one passes/fails. To-be flows should score **100%** compliance.

### 3.10 Common errors and solutions

| Error | Likely cause | Solution |
|---|---|---|
| `address already in use :5678` | Another process is using the port | Change the port in `docker-compose.yml` or stop the other process |
| `connection refused postgres` | Postgres still starting | Wait 15 s and retry `docker compose ps` |
| `Could not find workflow` in n8n | Subflow not imported or outdated ID | Import subflows first; update references in the orchestrator |
| `webhook not found` | Workflow not activated | Toggle "Active" in the top-right corner |
| `HTTP 401` with valid payload | Missing authentication header | Review the payload in `medicion/datasets/iot/` |

---

## 4. Fundamentals: the E1–E4 metamodel

### 4.1 From Clean Architecture to n8n

Robert C. Martin proposes in *Clean Architecture* (2017) that a sustainable system
separates four concentric layers: domain entities, use cases, interface adapters, and
external infrastructure. The dependency rule is strict: inner layers do not know about
outer ones.

n8n imposes no structure: any flow can touch HTTP, a database, domain logic, and the client
response in a single node. That's why we need a **metamodel** that translates Clean
Architecture into the LC/NC world.

### 4.2 The four stages

```mermaid
flowchart LR
  WH[Webhook<br/>HTTP Input]:::io
  E1[E1 — Validation<br/>Structure, types,<br/>JSON contracts]:::e1
  E2[E2 — Domain<br/>Business rules<br/>NO integrations]:::e2
  E3[E3 — Adapter<br/>DB + external APIs<br/>Idempotency]:::e3
  E4[E4 — Output<br/>Notifications +<br/>HTTP Response]:::e4
  RESP[Respond to<br/>Webhook]:::io
  ERR[Mandatory<br/>Error Workflow]:::err

  WH --> E1
  E1 -->|✓ valid| E2
  E1 -.->|✗ HTTP 400/422| RESP
  E2 --> E3
  E3 --> E4
  E4 --> RESP
  E1 -.->|exception| ERR
  E2 -.->|exception| ERR
  E3 -.->|exception| ERR
  E4 -.->|exception| ERR

  classDef e1 fill:#FFE5B4,stroke:#B8860B,color:#000
  classDef e2 fill:#C7F0C7,stroke:#2D6A2D,color:#000
  classDef e3 fill:#C0D8F0,stroke:#1A4F7A,color:#000
  classDef e4 fill:#E8D5FF,stroke:#6A2D9A,color:#000
  classDef io fill:#F0F0F0,stroke:#333,color:#000
  classDef err fill:#FFCCCC,stroke:#A00,color:#000
```

### 4.3 Responsibilities per stage

| Stage | Responsible for | Forbidden | Applicable REGs |
|---|---|---|---|
| **E1 — Validation** | Generating `run_id`, checking structure, types, JSON contracts, authentication. Deciding whether the request passes to E2 or is rejected with HTTP 400/422/401. | Business logic. Calls to DB or APIs. | REG-002, REG-009 |
| **E2 — Domain** | Applying pure business rules. Classification, decision, data transformation per rules (R001, R002…). | HTTP calls. DB access. Touching credentials. | REG-007 |
| **E3 — Adapter** | Persistence (PostgreSQL with `ON CONFLICT`), external API calls with retry, idempotency, transient error handling. | Business rules (they arrive already decided from E2). | REG-004, REG-005, REG-008 |
| **E4 — Output** | Differentiated notifications (channel per level), HTTP response to the client, closing log with `duracion_total_ms`. | Domain decisions. Access to the primary DB. | REG-008 |

Transversal to all stages: **REG-001** (no hardcoded credentials), **REG-003**
(errorWorkflow configured), **REG-006** (JSON log per stage), **REG-010** (at least one
documented ADR).

### 4.4 ISO/IEC 25010 mapping

| Stage | Main quality attribute | Sub-characteristic |
|---|---|---|
| E1 | Functional suitability | Correctness (correctly rejecting invalid input) |
| E2 | Maintainability | Modularity (changing a rule = touching only E2) |
| E3 | Reliability | Maturity, recoverability, fault tolerance |
| E4 | Operability | Monitorability |
| Transversal | Security · Maintainability · Reliability · Operability | Confidentiality, analyzability, modifiability |

To go deeper into the formal metamodel, see `microframework/microframework-spec.md`.

### 4.5 Why this metamodel works

Three practical consequences measured in this project:

1. **Changing a business rule touches 1 subflow** (E2), not the whole flow. Measured:
   −81% nodes per CR in Bot, −84% in IoT.
2. **Replacing an external provider touches 1 subflow** (E3 or E4), with no risk to the
   domain. Demonstrated in CR-BOT-005 (ticket provider change): 1 node modified vs 5 in
   as-is.
3. **Diagnosing a failure takes seconds**, not minutes: the JSON log identifies the exact
   stage. Measured: MTTD ~14 s in Bot Q5.

---

## 5. I/O validation

> **Rules at play:** REG-007 (E2 with no integrations), REG-008 (integrations only in
> E3/E4), REG-009 (appropriate HTTP status codes).
> **Mandatory thesis proposal section:** ✅ "I/O Validation".

### 5.1 Why it matters

The **"missing validation"** antipattern is the most common in ad-hoc LC/NC flows. In our
project, the IoT as-is flow shows **0% failures** because it simply doesn't validate —
everything gets in, everything gets persisted, even when critical fields like `co2` are
missing. This isn't robustness: it's blindness.

The IoT to-be flow, with E1 validating against the contract, correctly rejects invalid
inputs with HTTP 422 and only persists what's valid. This translates to reliable data
downstream.

### 5.2 Validation in E1: the pattern

E1 has three responsibilities:

1. **Generate `run_id`** (format `RUN-{CASE}-{timestamp}-{random6}`) — REG-002.
2. **Validate structure and types** of the payload against a JSON Schema contract.
3. **Decide the destination**: pass to E2 (valid) or respond with HTTP 4xx (invalid).

#### Minimal implementation in n8n

A `Code` node at the start of the flow:

```javascript
// E1 — Validation
const start_ts = new Date().toISOString();
const input = $input.first().json;
const run_id = `RUN-IOT-${Date.now()}-${Math.random().toString(36).substring(2,8)}`;

const errores = [];
if (!input.sensor_id) errores.push('sensor_id requerido');
if (typeof input.temperatura !== 'number') errores.push('temperatura debe ser número');
if (typeof input.humedad !== 'number') errores.push('humedad debe ser número');
if (typeof input.co2 !== 'number') errores.push('co2 debe ser número');

const status = errores.length === 0 ? 'ok' : 'fail';
const end_ts = new Date().toISOString();

console.log(JSON.stringify({
  run_id, etapa: 'E1_validacion', status, caso: 'iot',
  errores, campos_validados: ['sensor_id','temperatura','humedad','co2'],
  start_ts, end_ts, duracion_ms: new Date(end_ts) - new Date(start_ts)
}));

return [{ json: { run_id, status, errores, ...input, start_ts } }];
```

A downstream `IF` node routes:
- `status === 'ok'` → E2 (next subflow).
- `status === 'fail'` → `Respond to Webhook` with HTTP **422** and the `errores` array.

### 5.3 Formal contracts with JSON Schema

The repository includes 9 ready-to-use JSON Schemas in `microframework/contratos/`:

| Schema | Purpose |
|---|---|
| `bot-webhook-input.schema.json` | Validate Bot's input payload |
| `bot-e1-output.schema.json` | Validate Bot's E1 output |
| `bot-e2-output.schema.json` | Validate E2's output (classification) |
| `bot-e3-output.schema.json` | Validate E3's output (ticket created) |
| `iot-webhook-input.schema.json` | Validate IoT's input payload |
| `iot-e1-output.schema.json` | Validate IoT's E1 output |
| `iot-e2-output.schema.json` | Validate E2's output (level classification) |
| `iot-e3-output.schema.json` | Validate E3's output (PostgreSQL insert) |
| `iot-e4-output.schema.json` | Validate E4's output (notification sent) |

These contracts serve at three points:
- **Design:** they are the source of truth for what each stage expects.
- **Runtime:** they can be dynamically loaded in E1 with `ajv` (via a Code node) for formal
  validation.
- **Static validation:** `validar-flujos.mjs` uses them to check consistency.

### 5.4 HTTP status codes (REG-009)

| Situation | Status | When to use |
|---|---|---|
| Success | **200** | Operation completed correctly |
| Invalid syntax | **400** | Malformed JSON, wrong field type, missing fields |
| Invalid semantics | **422** | Well-formed JSON but ranges outside the contract (e.g. co2 < 0) |
| Failed authentication | **401** | Missing or incorrect token |
| Uncontrolled internal error | **500** | Uncaught exception — the error workflow must catch it |

> Critical antipattern: responding **HTTP 200** on a validation error. This breaks the
> HTTP contract with the client. The IoT as-is flow does this; the to-be fixes it.

### 5.5 Measured examples in this project

**Bot — Set C (invalid token)**

- as-is: responded HTTP 200 with a generic message → 0% visible failure.
- to-be: responds HTTP 401 with `{"error":"token inválido"}` → 100% failure correctly
  reported.
- ATAM scenario: **BOT-Q3** (Credential confidentiality).

**IoT — Set C (missing co2 field)**

- as-is: persisted the reading with `co2: undefined` → corrupted data in the DB.
- to-be: responds HTTP 422 with `{"errores":["co2 debe ser número"]}` → DB intact.
- ATAM scenario: **IOT-Q3** (Reading integrity).

### 5.6 Mini validation checklist

```
[ ] E1 generates a unique run_id before any processing
[ ] E1 validates structure, types, and authentication
[ ] Invalid inputs are answered with HTTP 400/422/401 (not 200)
[ ] E1 emits a JSON log with an `errores` field (array, empty if OK)
```

---

## 6. Error handling: retries and idempotency

> **Rules at play:** REG-003 (errorWorkflow), REG-004 (retry), REG-005 (idempotency).
> **Patterns:** retry, idempotency, error-boundary, circuit-breaker, saga-compensation.
> **Mandatory thesis proposal section:** ✅ "Error handling (retries and idempotency)".

### 6.1 The reality of external integrations

APIs fail. PostgreSQL disconnects. The network hiccups. If your flow isn't prepared for
this, two things will happen:

1. Lost data: the sensor sent the reading, the external API failed, the data never reached
   the DB.
2. Duplicate data: the retry sends the same operation twice and the ticket gets created
   twice.

The micro-framework solves this with three elements: **retry with backoff**,
**idempotency**, and **error workflow**.

### 6.2 Retry pattern with exponential backoff (REG-004)

#### Minimal configuration in n8n's HTTP Request node

```json
"options": {
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenTries": 2000
  }
}
```

**Retries differentiated by urgency** (IoT case):

- **Critical:** `maxRetries: 3`, initial wait 2 s → maximum resilience.
- **Warning:** `maxRetries: 2`, initial wait 1 s → moderate resilience.
- **Normal:** no retry → minimizes nominal latency.

#### Trade-off identified in ATAM (TP-IOT-01)

More retries = more resilience, but **+10.8 ms** of nominal overhead. When the external
service is down and maxRetries=3 kicks in, latency can reach 30 s. Measured and accepted in
this project because losing a critical alert is worse than the delay.

For more depth, see `microframework/patrones/patron-retry.md`.

### 6.3 Idempotency pattern (REG-005)

An operation is **idempotent** if executing it N times produces the same result as
executing it once. This is critical when combining retry with writes.

#### Implementation in PostgreSQL

```sql
INSERT INTO lecturas_sensor (idempotency_key, sensor_id, temperatura, humedad, co2, nivel_alerta, ts)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
```

- **`idempotency_key`** must be deterministic for the same logical operation. Good
  formula: `${sensor_id}-${ts_epoch}` or `${user_id}-${request_hash}`.
- **`ON CONFLICT DO NOTHING`** ensures a second insert with the same key produces no error
  and no duplicate.

#### Implementation in external APIs

When the external service supports it (REC-003):

```
HTTP POST /api/tickets
Headers:
  Idempotency-Key: bot-user42-20260518T143025
```

If the server implements it, it will return the same response for the same key even on
retries.

#### Evidence in this project

- **BOT-Q4:** Set K (forced retries, 200 runs) → 0% duplicate tickets ✅.
- **IOT-Q3:** Set K (forced retries, 200 runs) → 0% duplicate DB readings ✅.

For more depth, see `microframework/patrones/patron-idempotencia.md`.

### 6.4 Mandatory error workflow (REG-003)

Every uncontrolled exception in any orchestrator node must trigger a dedicated **error
workflow**. Without it, failures are invisible.

#### How to configure it in n8n

1. Create a new workflow with an `Error Trigger` node. This node receives the error's
   context (the failed node, message, stack, original payload).
2. In the error workflow:
   - Emit a JSON log with `etapa: "ERROR_HANDLER"`, `status: "fail"`, `error_node`,
     `error_message`.
   - Insert the event into a `dead_letter_iot` or `dead_letter_bot` table for later
     analysis.
   - Notify via an alternate channel (Slack, email, SNS on AWS).
3. In the orchestrator: `Settings → Error Workflow → select the error workflow`.

#### Sensitivity Point identified in ATAM (SP-IOT-01)

The IoT flow's error handler initially notified using the **same HTTP channel** E4 uses for
alerts. If the channel goes down, neither the original alert nor the error notice arrives.
Mitigation: use an independent channel for the error handler (in AWS: CloudWatch Alarm →
SNS, see Ch. 11).

For more depth, see `microframework/patrones/patron-error-boundary.md` and
`ADR-MF-002-error-workflow-reg003.md`.

### 6.5 Advanced patterns — when to apply them

**Circuit Breaker** (`patron-circuit-breaker.md`)
- When: an external API fails repeatedly (e.g. > 50% in the last 60 s).
- What it does: stops trying during a "cooldown window" (typically 30–60 s) and returns
  fast-fail.
- Why: prevents saturating a downed service and consuming connections that won't get a
  response.

**Saga / Compensation** (`patron-saga-compensacion.md`)
- When: a business operation touches multiple external systems and partial success is
  worse than a rollback.
- What it does: defines, for every `forward` step, a `compensate` operation that reverts
  its effects.
- Example: if E3 inserts into the DB and E4 fails, a saga would revert the insert.
- In this project: documented as an available pattern but not applied (the Bot and IoT
  cases don't require distributed transactions).

### 6.6 Mini error-handling checklist

```
[ ] The orchestrator has errorWorkflow configured in settings
[ ] Every HTTP Request node has retry enabled with maxRetries ≥ 2
[ ] Every DB INSERT includes ON CONFLICT (idempotency_key) DO NOTHING
[ ] The error handler uses a channel alternate to the normal notifications' channel
```

---

## 7. Security: secrets management

> **Rule at play:** REG-001 (no hardcoded credentials).
> **Checklist:** DevSecOps (8 items).
> **ADR:** `ADR-MF-001-gestion-secretos-reg001.md`.
> **Mandatory thesis proposal section:** ✅ "Security (secrets management)".

### 7.1 Rule zero

> **No repository flow may contain credentials as a literal value.**

When you export an n8n workflow, the JSON is versioned in Git. If an API key, password, or
token is hardcoded in a node, it is exposed forever in the repository's history — even if
you delete it later. This is the easiest thing to avoid and the most common thing to find.

### 7.2 How to manage secrets in local n8n

n8n has a built-in **Credentials manager**. Credentials are stored encrypted in n8n's
database (encrypted with `N8N_ENCRYPTION_KEY`). The exported JSON only contains a
**reference by name**, not the real value.

#### Correct pattern

1. In the n8n UI: **Settings → Credentials → New** → appropriate type (PostgreSQL, HTTP
   Header Auth, etc.).
2. Assign a descriptive, stable name: `Postgres Local`, `Bot API Token`, `IoT Webhook
   Auth`.
3. Configure the real values.
4. In the flow's nodes: select the credential by name from the dropdown.

#### What you'll see in the exported JSON (correct)

```json
"credentials": {
  "postgres": {
    "id": "abc123",
    "name": "Postgres Local"
  }
}
```

#### What you should NEVER see in the JSON

```json
"parameters": {
  "headers": {
    "Authorization": "Bearer sk_live_REAL_TOKEN_AQUI"   // ⛔ HARDCODED
  }
}
```

### 7.3 Sensitive environment variables

Environment variables are managed at two levels:

| File | Tracked in Git | Purpose |
|---|---|---|
| `infraestructura/.env.example` | ✅ Yes | Template with variable names, no real values |
| `infraestructura/.env` | ❌ Never | Real local values — in `.gitignore` |

**Critical variables:**

| Variable | Notes |
|---|---|
| `POSTGRES_PASSWORD` | Change per environment |
| `N8N_ENCRYPTION_KEY` | 32 random bytes; NEVER change after the environment is created |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | If you enable n8n's basic auth |

### 7.4 Automatic validation (DevSecOps Pillar 2)

The repository includes the static validator in **two coexisting editions** (see
[`ADR-MF-008`](adr/ADR-MF-008-validador-dos-ediciones.md)):

- **Lite** — `microframework/validacion/validar-flujos.mjs` (a single file, zero
  dependencies, self-contained offline HTML). **Recommended edition for the academic
  defense and external evaluators.**
- **Pro** — `microframework/validacion-pro/` (module with a YAML DSL, `--fix` codemods,
  SARIF output for GitHub Code Scanning, vitest suite). For external teams adopting the
  micro-framework.

Both evaluate the same 17 rules (11 mandatory REG-* + 6 graph antipatterns AP-*) and
produce the same canonical JSON (`report.schema.json`). Every finding carries severity,
confidence, ISO 25010 mapping, ATAM scenarios, and relevant ADRs.

**Essential commands — Lite (academic defense):**

```bash
# Full report (md + json + offline html)
node microframework/validacion/validar-flujos.mjs --format html

# Quick check only (exit code 0/1)
node microframework/validacion/validar-flujos.mjs

# Diff against a previous report
node microframework/validacion/validar-flujos.mjs --baseline reportes/anterior.json

# The validator's own tests
node microframework/validacion/tests/run-tests.mjs
```

**Essential commands — Pro (external teams):**

```bash
cd microframework/validacion-pro && npm install
node bin/n8nmf.mjs analyze                                # table summary
node bin/n8nmf.mjs report --format html --out ./reportes  # CDN HTML
node bin/n8nmf.mjs report --format sarif --out ./reportes # SARIF for GitHub
node bin/n8nmf.mjs fix --rule REG-004 --dry-run           # preview codemod
node bin/n8nmf.mjs analyze --rules-dir ./rules-custom     # include DSL rules
npm test                                                   # vitest
```

**When to run it:** before every commit touching flows, and as a gate in CI/CD (example
workflow in
[`microframework/validacion-pro/docs/sarif-github.md`](validacion-pro/docs/sarif-github.md)).

### 7.5 Open risk: token rotation (R-BOT-01)

Micro-framework v1.0 does not structurally mitigate the **periodic rotation** of API
tokens. In the local environment, rotation is manual: update the value in the n8n
credential and restart the flow if active.

**In AWS production (Phase 8):** AWS Secrets Manager automatically rotates RDS passwords
every 30 days. For external API tokens: rotation via Lambda + integration with External
Secrets in n8n.

See Ch. 11 for the AWS design detail.

### 7.6 DevSecOps checklist — the 8 items explained

| # | Item | How to verify it |
|---|---|---|
| 1 | No API keys, tokens, or passwords in the flow's JSON | Manual search in the JSON + `validar-flujos.mjs` |
| 2 | No sensitive data in log fields | Inspection of `console.log(JSON.stringify({...}))` — only field names, not values |
| 3 | Credentials are created in n8n Credentials | Every HTTP / DB node references a credential by name |
| 4 | The real `.env` file is not tracked in Git | `git status` should not show `.env`; `.gitignore` includes it |
| 5 | `.env.example` is up to date with all variables | Every variable used in `docker-compose.yml` has an entry in `.env.example` |
| 6 | The webhook validates authentication before processing | E1 checks the token before passing to E2 |
| 7 | Endpoints use HTTPS in production | `https://` URLs (not `http://`) in production credentials; `localhost` acceptable in dev |
| 8 | The error handler exposes no internal details to the client | `Respond to Webhook` on error returns a generic message, NOT the stack trace |

### 7.7 Security antipatterns to avoid

- **Hardcoded token** in an HTTP node.
- **API key visible in the node's output** and therefore in the logs (n8n persists
  outputs if `saveDataSuccessExecution` isn't `none`).
- **Password in the workflow's `notes`** or `description` field.
- **Stack trace returned to the client** in error responses.

---

## 8. Observability: structured logs

> **Rule at play:** REG-006 (JSON log per stage).
> **Recommended:** REC-004 (per-stage timestamps), REC-005 (context in logs).
> **Reference document:** `microframework/guia-observabilidad.md` (DevSecOps Pillar 3).
> **ADR:** `ADR-MF-003-log-estructurado-reg006.md`.
> **Mandatory thesis proposal section:** ✅ "Observability (structured logs)".

### 8.1 Why JSON logs are non-negotiable

n8n's execution history is useful for visual debugging, but it is not an observability
system: it can't be queried programmatically, MTTD can't be computed, and events can't be
correlated across executions.

Structured JSON logs:
- Are emitted with `console.log` from a Code node → reach the container's stdout.
- Are queryable with `grep`, `jq`, CloudWatch Insights, with no additional parsing.
- Allow computing metrics (latency, failures, MTTD) in any analysis tool.

**Measured evidence:** MTTD ≈ 14 seconds in the BOT-Q5 scenario (Operability) — thesis
proposal goal < 60 s comfortably met.

### 8.2 Log contract per stage

#### Common fields (all stages)

| Field | Type | Meaning |
|---|---|---|
| `run_id` | string | The execution's unique identifier (REG-002) |
| `etapa` | string | `E1_validacion` · `E2_dominio` · `E3_adaptador` · `E4_salida` |
| `status` | string | `ok` · `fail` · `skip` |
| `caso` | string | `bot` · `iot` |
| `start_ts` | ISO 8601 | Stage start |
| `end_ts` | ISO 8601 | Stage end |
| `duracion_ms` | number | `end_ts - start_ts` |

#### Additional fields per stage

| Stage | Extra fields | Rationale |
|---|---|---|
| E1 | `errores: string[]`, `campos_validados: string[]` | Validation failure diagnosis with no exposure of sensitive values |
| E2 | `resultado_clave: string`, `regla_aplicada: string` (R001, R002...) | Traceability of which rule decided the result |
| E3 | `idempotency_key: string`, `registro_id: string`, `reintentos: number` | Idempotency verification and retry efficiency |
| E4 | `notificacion_enviada: bool`, `canal: string`, `duracion_total_ms: number` | End-to-end metric for the complete flow |

### 8.3 Example JSON log per stage (critical IoT case)

```json
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E1_validacion","status":"ok","caso":"iot","errores":[],"campos_validados":["sensor_id","temperatura","humedad","co2"],"start_ts":"2026-05-18T14:30:25.123Z","end_ts":"2026-05-18T14:30:25.128Z","duracion_ms":5}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E2_dominio","status":"ok","caso":"iot","resultado_clave":"critico","regla_aplicada":"R003","start_ts":"2026-05-18T14:30:25.200Z","end_ts":"2026-05-18T14:30:25.212Z","duracion_ms":12}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E3_adaptador","status":"ok","caso":"iot","idempotency_key":"S42-20260518T143025","registro_id":"9287","reintentos":0,"start_ts":"2026-05-18T14:30:25.250Z","end_ts":"2026-05-18T14:30:25.295Z","duracion_ms":45}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E4_salida","status":"ok","caso":"iot","notificacion_enviada":true,"canal":"critico","duracion_total_ms":215,"duracion_ms":30}
```

### 8.4 Implementation template (Code node)

```javascript
const start_ts = new Date().toISOString();
const input = $input.first().json;
const run_id = input.run_id;

// --- stage logic ---
const resultado = clasificarNivel(input.temperatura, input.humedad, input.co2);
// ----------------------------

const end_ts = new Date().toISOString();
const logEvent = {
  run_id,
  etapa: 'E2_dominio',
  status: 'ok',
  caso: 'iot',
  resultado_clave: resultado.nivel,
  regla_aplicada: resultado.regla_id,   // R001, R002...
  start_ts, end_ts,
  duracion_ms: new Date(end_ts) - new Date(start_ts)
};
console.log(JSON.stringify(logEvent));

return [{ json: { ...input, ...resultado, logEvent } }];
```

### 8.5 Querying logs locally

```powershell
# PowerShell — search for failures in recent logs
docker compose -f infraestructura/docker-compose.yml logs n8n | Select-String '"status":"fail"' | Select-Object -Last 20

# Filter by specific stage
docker compose -f infraestructura/docker-compose.yml logs n8n | Select-String '"etapa":"E3_adaptador"'

# Search for a specific execution by run_id
docker compose -f infraestructura/docker-compose.yml logs n8n | Select-String 'RUN-IOT-20260518T143025-a1b2c3'
```

```bash
# Bash — extract only JSON lines and compute E2 latency p95
docker compose -f infraestructura/docker-compose.yml logs n8n \
  | grep '"etapa":"E2_dominio"' \
  | jq -r '.duracion_ms' \
  | sort -n \
  | awk 'BEGIN{c=0} {a[c++]=$1} END{print a[int(c*0.95)]}'
```

### 8.6 Critical prohibitions

- **Do not log** `token`, `password`, `api_key` values. Only field names.
- **Do not log** full payloads if they contain PII. Log `campos_validados:
  ["nombre","email"]`, not their values.
- **Do not use** `console.error` or `console.warn`. The single format is `console.log`
  with JSON.

### 8.7 Open risk: local persistence (R-GLOBAL-01)

In Docker Compose, stdout logs are kept according to the log driver's policy (by default,
rotating files from the Docker daemon). If the container is recreated, previous logs are
lost unless:

- `/var/lib/docker/containers/<id>/<id>-json.log` is mapped to a persistent volume, or
- An external driver is used (`fluentd`, `gelf`, `awslogs`).

**Structural solution:** deploy on AWS with the `awslogs` log driver → CloudWatch Logs
persists for 30 days (Ch. 11).

### 8.8 Mini MTTD protocol

To validate that your observability works:

1. Force a failure: send an invalid payload to the webhook.
2. Time from the HTTP 422 response until the `"status":"fail"` log appears in
   `docker logs`.
3. Time from that log until an operator can identify the failed node (must be < 60 s).

Full protocol in `medicion/protocolo-mttd.md`.

### 8.9 Metrics derivable from the JSON log

| Metric | Formula |
|---|---|
| Per-segment latency | `duracion_ms` per stage |
| End-to-end latency | `duracion_total_ms` from the E4 log |
| Failure rate | `count(status=fail) / count(total)` |
| Retry efficiency | `sum(reintentos) / count(E3)` |
| run_id coverage | `count(events with run_id) / count(total)` — must be 100% (REG-002) |

---

## 9. Antipattern catalog

These 11 antipatterns are intentionally present in the project's as-is flows as a
baseline. The micro-framework exists to eliminate them.

### 9.1 Complete table

| Antipattern | Quick symptom | Rule that fixes it |
|---|---|---|
| Monolithic flow | No `Execute Workflow` nodes; all logic in a single workflow | E1–E4 metamodel |
| Credentials in nodes | API keys or tokens as a literal value in `parameters` | REG-001 |
| Missing validation | Processing the payload without checking required fields or types | Mandatory E1 |
| Logic in adapters | Business rules inside HTTP or Postgres nodes | REG-007, REG-008 |
| No idempotency | INSERT without `ON CONFLICT`; retries duplicate records | REG-005 |
| No structured log | Only n8n's history as diagnosis | REG-006 |
| No error flow | Empty `settings.errorWorkflow`; invisible failures | REG-003 |
| Hardcoded ID coupling | `Execute Workflow` references a numeric ID that changes on re-import | Document IDs post-import; update in the UI |
| Chatty integration | > 2 HTTP calls to the same endpoint per execution | REG-004 + batch API |
| Exception swallowing | `try/catch` with no re-throw or log; the error is invisible | REG-003 + REG-006 |
| God node | A Code node > 100 lines mixing validation, domain, and format | Split into per-stage nodes |

### 9.2 How to spot them in a peer review — 5 quick signals

1. **Is there `Execute Workflow` in the orchestrator?** If not, it's probably monolithic.
2. **Search the JSON for:** `Bearer`, `api_key`, `password`, `token`. If any has a literal
   value, REG-001 is violated.
3. **Is `settings.errorWorkflow` empty?** REG-003 violated.
4. **Do Code nodes have `console.log(JSON.stringify(...))`?** If not, REG-006 violated.
5. **Do SQL queries have `ON CONFLICT`?** If not, REG-005 violated.

For depth on each antipattern with examples from the project's real as-is, see
`microframework/antipatrones.md`.

---

## 10. Applicable final checklist

This section consolidates the checklists so you can print or copy them as a template
before versioning a to-be flow.

### 10.1 Architecture Checklist (10 REGs)

```
Case: _______________  Version: _______________  Date: __________  Responsible: __________

[ ] REG-001: exported JSON without hardcoded credentials
             → Search: token, api_key, password, Bearer, secret — none with a literal value

[ ] REG-002: run_id present in the output of all subflows
             → Verify the run_id field in each subflow's output JSON

[ ] REG-003: errorWorkflow configured in the orchestrator's settings
             → settings.errorWorkflow in the JSON is not empty or null

[ ] REG-004: retry enabled on all HTTP Request nodes
             → options.retry.enabled: true on every HTTP node in E3/E4

[ ] REG-005: writes with idempotency control
             → SQL query includes ON CONFLICT (idempotency_key) DO NOTHING

[ ] REG-006: structured JSON log at every stage
             → Every Code node includes console.log(JSON.stringify({run_id, etapa, status, ...}))

[ ] REG-007: E2 without HTTP or database nodes
             → The E2 subflow only contains Code and Execute Workflow Trigger nodes

[ ] REG-008: integrations only in E3 and E4
             → HTTP Request and Postgres nodes only in E3 and E4 subflows

[ ] REG-009: appropriate HTTP status codes in responses
             → 200 success, 400/422 invalid input, 401 no authentication

[ ] REG-010: at least one ADR documented in the adr/ folder
             → casos-de-estudio/{case}/adr/ contains at least ADR-001-*.md
```

### 10.2 DevSecOps Checklist (8 items)

```
[ ] No API keys, tokens, or passwords in the flow's JSON
[ ] No sensitive data in log fields
[ ] External integration credentials are created in n8n Credentials
[ ] The real .env file is not tracked in Git
[ ] .env.example is up to date with all necessary variables
[ ] The webhook validates authentication before processing data
[ ] Integration endpoints use HTTPS in production environments
[ ] The error flow does not expose internal details to the client
```

### 10.3 Quick Quality Check (5 pre-merge items)

Express version for quick review on pull requests:

```
[ ] The flow's name follows {case}-{state}.json
[ ] The exported JSON was updated (timestamps consistent with the commit)
[ ] The static validator passes: node microframework/validacion/validar-flujos.mjs
[ ] There is at least one new entry in the run-log or cr-log if the run is relevant
[ ] The commit references an issue/ADR (e.g. "[FASE-N] feat: ... (#issue)")
```

### 10.4 Single validation command

```bash
node microframework/validacion/validar-flujos.mjs
```

The script verifies REG-001…010 across every flow JSON in the repository and produces a
report at `microframework/validacion/reportes/validacion-YYYY-MM-DD.md`.

### 10.5 How to interpret the report

Example output:

```
=== Reporte de Validación ===
Fecha: 2026-05-06
Archivos analizados: 22

✅ iot-to-be-orquestador.json — 10/10 REGs cumplidas
✅ iot-to-be-e1-validacion.json — 10/10
✅ bot-to-be-orquestador.json — 10/10
❌ bot-as-is.json — 1/10 (esperado: as-is es la línea base con antipatrones)
   ✗ REG-001: credencial hardcodeada en nodo "HTTP Request" línea 142
   ✗ REG-003: settings.errorWorkflow vacío
   ✗ REG-004: nodo HTTP Request sin retry
   ✗ REG-005: INSERT sin ON CONFLICT
   ... (5 more)
```

**Approval criterion:** every `to-be` flow must score 10/10. `as-is` flows must fail (they
are the baseline).

---

## 11. Scaling from the lab to AWS production

> **Reference document:** `infraestructura/aws/INDEX.md` and the 6 complete Phase 8 documents.
> This chapter is a **conceptual bridge**: it shows how each local-environment element
> translates to AWS without duplicating the detailed content.

### 11.1 When you need to scale

| Symptom | AWS solution |
|---|---|
| A heavy workflow blocks webhook reception | Queue Mode (separate main from workers) |
| You need database high availability | RDS Multi-AZ with failover < 60 s |
| Logs are lost when the container restarts | CloudWatch Logs with 30-day retention |
| You need automatic credential rotation | Secrets Manager with rotation Lambda |
| Compliance requirements (PCI, SOC 2, ISO 27001) | WAF, KMS, CloudTrail, IAM least-privilege |
| Variable traffic justifying auto-scaling | ECS Fargate with 2–8 worker auto-scaling |

### 11.2 Local → AWS mapping

| Local component | AWS service | Notes |
|---|---|---|
| n8n (Docker `:5678`) | **ECS Fargate** + **ALB** (HTTPS via ACM) | `n8nio/n8n` image unchanged |
| PostgreSQL (Docker `:5432`) | **RDS PostgreSQL Multi-AZ** | Same schema (`lecturas_sensor`, `interacciones_bot`) |
| mock-bot / mock-iot | ECS Fargate (Dev/Staging) · Lambda (Prod) | Replaceable by real APIs |
| No local Redis | **ElastiCache Redis** (BullMQ queue) | Enables Queue Mode (separate workers) |
| `.env` with credentials | **AWS Secrets Manager** + ECS Secrets injection | Automatic 30-day rotation |
| stdout JSON logs | **CloudWatch Logs** + Log Insights | Same JSON format, now persistent |
| In-memory rate limiter | ElastiCache Redis (distributed key) | Resolves the non-distributed rate-limit antipattern |
| No certificate | **ACM** (automatic renewal) | DNS validation via Route 53 |

### 11.3 How each REG is preserved on AWS

| REG | Local implementation | AWS implementation |
|---|---|---|
| REG-001 (secrets) | `.env` + n8n Credentials | Secrets Manager + IAM Task Role |
| REG-002 (run_id) | Generated in E1 (unchanged) | Unchanged — travels in the BullMQ payload |
| REG-003 (errorWorkflow) | Configured in n8n settings | Independent CloudWatch Alarm → SNS (mitigates SP-IOT-01) |
| REG-004 (retry) | `options.retry` on the HTTP node | Same + BullMQ stalled-job retry |
| REG-005 (idempotency) | `ON CONFLICT` in local PostgreSQL | RDS Multi-AZ preserves the schema; failover doesn't lose idempotency |
| REG-006 (JSON logs) | Ephemeral stdout | Persistent CloudWatch Logs (resolves R-GLOBAL-01) |
| REG-007/008 (separation) | Unchanged | Unchanged — the E1–E4 structure belongs to the flow, not the environment |
| REG-009 (HTTP codes) | Unchanged | Unchanged |
| REG-010 (ADRs) | Unchanged | Unchanged — 3 additional AWS ADRs (MF-005, 006, 007) |

### 11.4 Central architectural pattern

**ECS Fargate + n8n Queue Mode + RDS Multi-AZ.** The main components:

- **n8n-main** (1–2 instances): UI, REST API, webhook reception, Redis queuing.
- **n8n-workers** (2–8 auto-scaling instances): consume jobs from Redis and execute E1–E4.
- **ElastiCache Redis**: BullMQ queue — the sole enabler of n8n's horizontal scaling.
- **RDS PostgreSQL Multi-AZ**: automatic failover < 60 s, 99.95% SLA.

See the C4 container diagram in `infraestructura/aws/arquitectura-aws.md §2` and the Queue Mode flow
sequence diagram in `infraestructura/aws/escalabilidad.md §1`.

### 11.5 Reference costs per tier

| Tier | Typical use | Estimated cost/month (us-east-1) |
|---|---|---|
| **Dev** | Individual development, 8 h/day | ~$33 |
| **Staging** | 24/7 QA, no Multi-AZ | ~$208 |
| **Production** | Multi-AZ HA, 2–8 auto-scaling workers, WAF | ~$458 (optimizable to ~$346 with Fargate Spot + Reserved RDS) |

Full detail in `infraestructura/aws/estimacion-costos.md`.

### 11.6 ATAM risks resolved by the AWS design

| Phase 7 risk | AWS resolution |
|---|---|
| R-GLOBAL-01 — Ephemeral logs | ✅ CloudWatch Logs (30-day retention) |
| R-BOT-01 — Manual token rotation | ✅ Secrets Manager rotation Lambda |
| R-IOT-01 — Blocked dead-letter if the channel is down | ✅ CloudWatch Alarm → SNS (alternate channel) |
| SP-IOT-01 — Error handler uses the same channel as E4 | ✅ Independent SNS Alarm from the E4 channel |

### 11.7 Documented decisions

Three framework-level ADRs justify the AWS design:

- **`ADR-MF-005-ecs-fargate-vs-ec2.md`** — Why Fargate and not EC2 or EKS.
- **`ADR-MF-006-n8n-queue-mode.md`** — Why Queue Mode with Redis.
- **`ADR-MF-007-rds-multi-az.md`** — Why Multi-AZ in Production.

For the full design (VPC, IAM, observability, scalability, costs), see the index at
`infraestructura/aws/INDEX.md`.

---

## 12. Traceability and maturity

### 12.1 How everything connects

The project traced an explicit chain from requirements to evaluation:

```
Functional Requirement (RF)
       │
       ▼
ADR (Architectural decision)
       │
       ▼
REG-001…010  (Rule with a binary criterion)
       │
       ▼
ISO/IEC 25010 attribute
       │
       ▼
ATAM scenario (measurable)
       │
       ▼
Evidence (run-log / cr-log / analysis)
```

This matrix lives in `casos-de-estudio/{bot,iot}/trazabilidad/matriz-trazabilidad.md`
(v1.3). Every RF has an ADR that decides it, a REG that verifies it, an ISO 25010 attribute
that classifies it, an ATAM scenario that tests it, and quantitative evidence that backs it
up.

### 12.2 Adoption maturity model

Adopting the micro-framework all at once is discouraging. This 5-level model allows
incremental progress. Each level is a concrete, verifiable goal.

| Level | Name | REGs met | Typical effort |
|---|---|---|---|
| **0** | Ad-hoc | 0–2 | Initial state (typical as-is) |
| **1** | Minimum hygiene | REG-001 + REG-006 | 1–2 sprints |
| **2** | Basic resilience | + REG-003 + E1 validation | 1 sprint |
| **3** | Full resilience | + REG-004 + REG-005 + REG-007 | 2 sprints |
| **4** | Automated verification | + REG-002 + REG-008 + REG-009 + REG-010 + validator in CI | 1 sprint |
| **5** | AWS production | Everything above + centralized observability + auto-scaling | Complete Phase 8 |

#### Detail per level

- **Level 0 — Ad-hoc:** monolithic flow, credentials in nodes, no useful logs. This is
  where most of the world's LC/NC flows are.
- **Level 1 — Minimum hygiene:** the two highest-ROI changes: (1) move credentials to n8n
  Credentials and (2) emit structured JSON logs. With just this you regain observability
  and eliminate the risk of secret exposure.
- **Level 2 — Basic resilience:** add E1 with formal validation and configure
  errorWorkflow. Turns "fails silently" into "fails with diagnosis".
- **Level 3 — Full resilience:** retry and idempotency in E3, domain isolation in E2. Your
  flow survives retries and external-provider changes without touching business rules.
- **Level 4 — Automated verification:** REG-010 (ADRs), validator in CI, checklist on pull
  requests. Quality stops depending on individual discipline.
- **Level 5 — AWS production:** deployment with Queue Mode + RDS Multi-AZ + CloudWatch +
  Secrets Manager. Moves from "works on my machine" to "supports real production".

### 12.3 Self-assessment

To find out your current level, answer these questions about one of your representative
flows:

1. Does the exported JSON have any credential as a literal value? → If yes, you're Level 0.
2. Do Code nodes emit `console.log(JSON.stringify({...}))` with `run_id` and `etapa`? → If
   not, you don't clear Level 0.
3. Is `settings.errorWorkflow` configured? → If not, you're Level 1.
4. Is there a node or subflow dedicated to input validation (E1) with HTTP 4xx on
   rejections? → If not, you're Level 1.
5. Do HTTP Requests have retry enabled and do INSERTs have `ON CONFLICT`? → If not, you're
   Level 2.
6. Is business logic isolated in a subflow with no HTTP/DB nodes? → If not, you're Level 2.
7. Is there at least one documented ADR and does the static validator run in CI? → If not,
   you're Level 3.
8. Are you on AWS with CloudWatch Logs and Secrets Manager? → If not, you're Level 4.

If you answered "yes" to all, you're Level 5.

### 12.4 Recommended advancement plan

| Current level | Next step | Effort |
|---|---|---|
| 0 → 1 | Move credentials to n8n Credentials + add JSON logs | 1 sprint |
| 1 → 2 | Implement E1 with validation + errorWorkflow | 1 sprint |
| 2 → 3 | Retry on HTTP + DB idempotency + isolate E2 | 2 sprints |
| 3 → 4 | Document 3 ADRs + integrate `validar-flujos.mjs` in CI | 1 sprint |
| 4 → 5 | Implement the Phase 8 design (see `infraestructura/aws/INDEX.md`) | 4 days |

---

## Appendices

### A. Quick reference REG-001…010 + REC-001…006

#### Mandatory rules

| ID | Rule | ISO 25010 |
|---|---|---|
| REG-001 | No hardcoded credentials | Security / Confidentiality |
| REG-002 | `run_id` propagated to all subflows | Maintainability / Analyzability |
| REG-003 | `errorWorkflow` configured | Reliability / Fault tolerance |
| REG-004 | Retry enabled on HTTP Request | Reliability / Recoverability |
| REG-005 | Idempotency on writes (`ON CONFLICT`) | Reliability / Maturity |
| REG-006 | Structured JSON log per stage | Operability / Monitorability |
| REG-007 | E2 without HTTP/DB nodes | Maintainability / Modularity |
| REG-008 | Integrations only in E3/E4 | Maintainability / Modularity |
| REG-009 | Appropriate HTTP status codes | Functional suitability / Correctness |
| REG-010 | At least one documented ADR | Maintainability / Analyzability |

#### Recommended rules

| ID | Rule | Benefit |
|---|---|---|
| REC-001 | Normalize data in E1 | Reduces inconsistencies |
| REC-002 | R001/R002 identifiers in E2 rules | ATAM traceability |
| REC-003 | `Idempotency-Key` header on HTTP | End-to-end support |
| REC-004 | `start_ts` / `end_ts` per stage | Per-segment latency |
| REC-005 | Context (sensor_id, location) in logs | Diagnosis with no UI |
| REC-006 | `saveDataSuccessExecution: "all"` during evaluation | Complete history |

### B. Framework-level ADRs (summary)

| ID | Decision | Attribute |
|---|---|---|
| ADR-MF-001 | Credentials in n8n Credentials, not in JSON | Security |
| ADR-MF-002 | Mandatory errorWorkflow on every orchestrator | Reliability |
| ADR-MF-003 | Structured JSON log per stage | Operability |
| ADR-MF-004 | Asynchronous adapted individual ATAM | Methodological |
| ADR-MF-005 | ECS Fargate over EC2/EKS for AWS | Operability / Cost |
| ADR-MF-006 | n8n Queue Mode with Redis BullMQ | Scalability |
| ADR-MF-007 | RDS PostgreSQL Multi-AZ in Production | Reliability |

### C. Quantitative evidence (summary)

| Metric | Bot as-is | Bot to-be | IoT as-is | IoT to-be |
|---|:---:|:---:|:---:|:---:|
| Nodes affected per CR | 8.7 | 1.0 (−81%) | 6.3 | 0.67 (−84%) |
| Failure rate | 9% | 6% (−36.6%) | 0%* | 1% |
| Architecture checklist | 1/10 | 10/10 | 1/10 | 10/10 |
| DevSecOps checklist | 0/8 | 8/8 | 0/7 | 7/7 |
| ATAM coverage | n/a | 5/6 (83%) | n/a | 6/6 (100%) |
| MTTD | n/a | ~14 s ✅ | n/a | structural ✅ |

*IoT as-is 0% failures = does not validate ("missing validation" antipattern). The to-be
correctly rejects with HTTP 422.*

Sources: `medicion/consolidado/comparacion-2026-05-05.md`, `metricas-derivadas.md`,
`atam-evidencia.md`.

### D. External resources

- **n8n:** Official documentation — https://docs.n8n.io
- **n8n Queue Mode:** https://docs.n8n.io/hosting/scaling/queue-mode/
- **Clean Architecture:** Robert C. Martin (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Pearson.
- **ATAM:** Len Bass, Paul Clements & Rick Kazman (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley.
- **ISO/IEC 25010:2011:** Systems and software Quality Requirements and Evaluation (SQuaRE).
- **NIST SSDF:** Secure Software Development Framework (SP 800-218).
- **OWASP:** Top 10 Web Application Security Risks — https://owasp.org/Top10/
- **C4 Model:** Simon Brown (2018) — https://c4model.com
- **AWS Well-Architected Framework:** https://docs.aws.amazon.com/wellarchitected/

### E. Repository file map — what to read when

| You need... | Read |
|---|---|
| Project overview | `../medicion/proyecto-overview.en.md` |
| As-is and to-be flow architecture | `casos-de-estudio/arquitectura-flujos.md` |
| Formal specification of the E1–E4 metamodel | `microframework/microframework-spec.md` |
| Consolidated micro-framework R1 document | `microframework/microframework-v1.0.md` |
| Detail of every rule | `microframework/reglas/reglas-obligatorias.md` |
| Depth on every pattern | `microframework/patrones/patron-*.md` |
| The per-stage JSON log contract | `microframework/guia-observabilidad.md` |
| Reproducible MTTD protocol | `medicion/protocolo-mttd.md` |
| Complete AWS design (R3) | `infraestructura/aws/INDEX.md` |
| Final ATAM report (R4) | `atam/informe-atam-final.md` |
| This guide (R5) | `microframework/guia-buenas-practicas.md` |
| Current project status | `estado-actual.md` |
| File and commit conventions | `convenciones/convenios-y-reglas.en.md` |

---

## Closing

The micro-framework is not dogma: it is a proposal validated with quantitative evidence.
If a rule doesn't add value in your context, document why (ADR) and move on. What is
non-negotiable are the three principles underpinning every REG:

1. **Isolate responsibilities** (Clean Architecture in LC/NC).
2. **Make failures visible** (structured logs + error workflow).
3. **Treat secrets as secrets** (Credentials, not literals).

If you only take three rules from this guide, take REG-001, REG-003, and REG-006. With
them you reach Maturity Level 1 and eliminate half of the typical operational risks of an
ad-hoc n8n flow.

The rest of the path — up to Level 5 and AWS production — is documented step by step in
this repository.

---

**End of the Best Practices Guide v1.0**
