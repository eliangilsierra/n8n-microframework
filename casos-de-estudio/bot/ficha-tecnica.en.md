> 🌐 **Language / Idioma:** English · [Español](ficha-tecnica.md)

# Technical datasheet — Bot case: Support chatbot

## Description

A customer support system implemented as an n8n webhook. Receives messages from users,
classifies them by category and priority, creates a ticket in the support system, records
the interaction in PostgreSQL, and notifies an external system.

---

## Endpoints

| State | Method | URL | Description |
|--------|--------|-----|-------------|
| as-is | POST | `/webhook/bot-soporte` | Ad-hoc monolithic input |
| to-be | POST | `/webhook/bot-support-to-be` | Micro-framework orchestrator |

---

## Implemented business rules

| ID | Description | as-is implementation | to-be implementation |
|----|-------------|---------------------|---------------------|
| R001 | Urgency detection by keyword | `message.includes('urgente')` in node 9 AND duplicated in node 10 | E2: `urgente` field computed once |
| R002 | Classification by category | `if/else` over keywords in node 9 | E2: pure `clasificar()` function |
| R003 | Priority by category | Hardcoded table in node 9 | E2: `PRIORIDADES` constant |
| R004 | Response per category | Response text in node 9 mixed with logic | E3: response template in the adapter |

---

## Input Sets

| Set | Scenario | Key data | HTTP as-is | HTTP to-be |
|-----|-----------|-------------|------------|------------|
| A | Normal message, valid token | `message: "tengo un problema con mi factura"` | 200 | 200 |
| B | Urgent message, valid token | `message: "problema urgente con mi cuenta"` | 200 | 200 |
| C | Invalid token | `token: "token-incorrecto"` | 401 | 400 |
| D | Valid token, empty message | `message: ""` | 200 | 400 |
| E | Valid token, missing user_id | no `user_id` field | 200 | 400 |

**Sets D and E** document the validation REG antipattern: the as-is accepts incomplete
inputs (no message or no user_id) that the to-be rejects in E1 with HTTP 400 and a
structured error message.

---

## Case files

| File | Description |
|---------|-------------|
| `as-is/bot-as-is.json` | As-is flow (16 nodes) — import into n8n |
| `as-is/notas-tecnicas.md` | Detail of antipatterns and design decisions |
| `to-be/` | E2, E3 subflows and orchestrator (see microframework/plantillas/) |

---

## Infrastructure dependencies

- **mock-bot** (port 3001): simulates the ticketing system and the notification endpoint
  - `POST /api/tickets` → creates a ticket, returns `{ticket_id}`
  - `GET /api/user/:userId/tickets` → user history
  - `POST /mock/notificar` → external notification, returns `{status:'ok'}`
  - `POST /api/v2/write` → InfluxDB mock (204)
- **PostgreSQL** (`sensores_db`): `interacciones_bot` table for persistence

---

## ATAM metrics of interest

| ISO 25010 attribute | Metric | Expected as-is vs to-be difference |
|--------------------|---------|-------------------------------------|
| Maintainability | Nodes per flow | 16 (monolith) vs 3+4+orq (modular) |
| Reliability | Failure rate in sets D/E | as-is 0% failures (accepts everything), to-be 100% correct rejection |
| Security | Credentials in code | 2 hardcoded (REG-001) vs 0 |
| Efficiency | p95 latency | Comparable (same business logic) |
