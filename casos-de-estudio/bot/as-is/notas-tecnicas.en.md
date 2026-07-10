> 🌐 **Language / Idioma:** English · [Español](notas-tecnicas.md)

# Technical notes — Bot as-is

Ad-hoc support-via-webhook flow. Intentionally designed to exhibit the micro-framework's
antipatterns (REG-001 through REG-010) in a realistic 16-node scenario resembling what is
found in teams with no defined architecture.

> For the chronological record of changes to the as-is and their evidence (commits,
> rationale, links to REG-*), see [`cambios-y-evidencia.md`](cambios-y-evidencia.md).

---

## Flow structure (16 nodes)

| # | Node | Type | Visible antipattern |
|---|------|------|--------------------|
| 1 | Webhook Entrada | webhook | — |
| 2 | Sanitizar Input | code | REG-002 (no run_id), REG-006 (unstructured log) |
| 3 | Verificar Rate Limit | code | REG-002; non-distributed in-memory rate limit |
| 4 | Limite Excedido? | if | Hardcoded `> 10` threshold |
| 5 | Error Rate Limit | respondToWebhook 429 | — |
| 6 | Token Valido? | if | REG-001 (hardcoded token in the expression) |
| 7 | Error Token | respondToWebhook 401 | — |
| 8 | Consultar Historial Usuario | httpRequest GET | REG-004 (no retry), hardcoded URL |
| 9 | Clasificar y Preparar Ticket | code | REG-007/008 (R001-R004 + HTTP preparation mixed) |
| 10 | Detectar Urgencia | if | Duplication of R001 (`urgente`) already evaluated in node 9 |
| 11 | Marcar Escalacion | set | `escalacion:true` field ignored by the API (dead field) |
| 12 | Crear Ticket | httpRequest POST | REG-004 (no retry), REG-005 (no Idempotency-Key) |
| 13 | Guardar Interaccion | postgres | REG-005 (INSERT with no ON CONFLICT) |
| 14 | Notificar Sistema Externo | httpRequest POST | REG-001 (hardcoded api-key), REG-004 (no retry) |
| 15 | Preparar Respuesta | set | Coupling to upstream node names in expressions |
| 16 | Responder al Cliente | respondToWebhook 200 | REG-002 (no run_id in the response) |

---

## Verifiable REG-* antipatterns

### REG-001 — Hardcoded credentials
- **Node 6 (Token Valido?):** `token === "mi-token-secreto-hardcodeado-123"` in the IF
  expression (literal rightValue).
- **Node 8 (Consultar Historial Usuario):** `x-api-key: clave-historial-hardcodeada-789`
  header in the GET httpRequest.
- **Node 9 (Procesar Mensaje):** literal assignment
  `const api_source_token = "token-jscode-interno-0123456789"` inside the Code node's code.
- **Node 12 (Crear Ticket):** `x-api-key: clave-tickets-hardcodeada-abc` header in the POST
  httpRequest.
- **Node 14 (Notificar):** `x-api-key: clave-api-externa-hardcodeada-456` header in the
  httpRequest.

> Total: **5 literal secrets** distributed across IF expressions, HTTP headers, and jsCode
> assignments. The static validator (`microframework/validacion/validar-flujos.mjs`)
> detects all of them with the patterns updated by Bot ADR-003 / Block 3 fix from the
> PHASE 3 closure.

### REG-002 — Absence of run_id
- No node generates or propagates a `run_id`. n8n's logs are the only correlation
  mechanism, with no trace identifier in the response or the DB.

### REG-003 — No declarative error handling
- `settings.errorWorkflow` absent. Any failure in nodes 8, 12, 13, or 14 stops execution
  with no notification or compensation.

### REG-004 — HTTP calls with no retry or explicit timeout
- Three `httpRequest` nodes with no `retryOnFail`: node 8 (History), node 12 (Create
  Ticket), node 14 (Notify). A transient mock-bot error aborts the entire execution.

### REG-005 — No idempotency
- **Node 12:** absence of `Idempotency-Key` in the ticket-creation POST. An external retry
  creates duplicates in the destination system.
- **Node 13:** `INSERT INTO interacciones_bot ... VALUES (...)` with no
  `ON CONFLICT DO NOTHING`. Re-running the run duplicates rows in PostgreSQL.

### REG-006 — Unstructured logging
- **Node 2:** `console.log('Solicitud recibida: ' + JSON.stringify({...}))` — mixes plain
  text with partial JSON; no level, no stage, no run_id.

### REG-007/008 — Domain logic mixed with the adapter
- **Node 9 (Clasificar y Preparar Ticket):** simultaneously contains rules R001-R004
  (domain: keyword classification), building the HTTP payload toward mock-bot (outbound
  adapter), and the response text to the user (inbound adapter). In the to-be, these three
  responsibilities are distributed across E2 (domain), E3 (adapter), and the orchestrator.

### REG-009 — Semantically incorrect HTTP code
- Doesn't apply directly to the bot (the as-is does correctly return 401/429/200), but the
  error fields (`rate_exceeded`, `token_invalido`) don't follow a standard error-response
  schema.

### REG-010 — Absence of observability
- No per-stage latency metrics, no trace correlation, no alerts on Postgres node failure.

---

## In-memory rate limiting (extended antipattern)

Node 3 uses `$getWorkflowStaticData('global')` to keep per-`user_id` counters. This
implementation fails in three real scenarios:

1. **n8n restart:** counters are lost — the limit resets with no warning.
2. **Horizontal scaling:** two n8n instances keep independent states; a user can make 10
   requests per instance (effectively 20).
3. **False sliding window:** the window is fixed from the first request, not sliding,
   allowing bursts at the start of every window.

---

## Required PostgreSQL table

```sql
CREATE TABLE IF NOT EXISTS interacciones_bot (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(100),
  session_id  VARCHAR(100),
  categoria   VARCHAR(50),
  prioridad   VARCHAR(20),
  ticket_id   VARCHAR(100),
  ts          TIMESTAMPTZ DEFAULT NOW()
);
```

Created automatically by `automatizacion/setup_env.py`.

---

## Execution flow

```
Webhook Entrada
  └─▶ Sanitizar Input
        └─▶ Verificar Rate Limit
              └─▶ Limite Excedido?
                    ├─▶ [true]  Error Rate Limit (429) ──── end
                    └─▶ [false] Token Valido?
                                  ├─▶ [false] Error Token (401) ── end
                                  └─▶ [true]  Consultar Historial Usuario
                                                └─▶ Clasificar y Preparar Ticket
                                                      └─▶ Detectar Urgencia
                                                            ├─▶ [true]  Marcar Escalacion
                                                            │             └─▶ Crear Ticket
                                                            └─▶ [false] Crear Ticket
                                                                          └─▶ Guardar Interaccion
                                                                                └─▶ Notificar Sistema Externo
                                                                                      └─▶ Preparar Respuesta
                                                                                            └─▶ Responder al Cliente (200)
```

---

## Input sets and expected behavior

| Set | Scenario | HTTP as-is | Reason |
|-----|-----------|------------|-------|
| A | Normal message, valid token | 200 | Complete successful flow |
| B | Urgent message, valid token | 200 | Node 10 triggers Marcar Escalacion |
| C | Invalid token | 401 | Node 6 rejects |
| D | Valid token, empty message | 200 | No required-field validation |
| E | Valid token, missing user_id | 200 | No required-field validation |

Sets D and E document the antipattern: the as-is accepts incomplete inputs that the to-be
would reject in E1 (schema validation).
