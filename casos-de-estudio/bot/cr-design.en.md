> 🌐 **Language / Idioma:** English · [Español](cr-design.md)

# Change Request design — Bot

## Purpose

Formal specification of the Bot case's 3 Change Requests (CR1 business rule, CR2
integration, CR3 validation), to be measured on as-is (pre-measurement completed in PHASE
3) and on to-be (PHASE 6) to quantify the micro-framework's architectural impact.

The CR-log records, for every change: how many nodes were touched (`nodes_touched`), how
many external dependencies (`deps_touched`), and how many attempts were needed until the
change worked (`attempts`). The project's central hypothesis is that the to-be requires
**fewer nodes touched per CR** thanks to the E1–E4 separation.

---

## CR1 — Business rule: priority change for a routing rule

**Exact change:** change the priority assigned by business rule `R002` (urgency keyword
detection in the message) from `"media"` to `"alta"`.

**As-is file:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Node(s) to modify in as-is:**
- Node 9 `Procesar Mensaje` (jsCode) — `prioridad` assignment line
- Node 10 `Prioridad Alta?` (IF) — decision branch depending on the value
- Node 11 `Crear Ticket Urgente` (set) — ticket branding
- Node 12 `Crear Ticket` (httpRequest) — payload body with the `priority` field
- Node 13 `Guardar Interaccion` (postgres) — `prioridad` column in the INSERT
- Node 14 `Notificar Sistema Externo` — `X-Priority` header
- Node 15 `Preparar Respuesta` (set) — client response
- Node 16 `Responder al Cliente` — response code

**Expected nodes touched as-is:** **8**
**Expected nodes touched to-be:** **1** (only the rule in `iot-to-be-e2-dominio` →
`REGLAS_PRIORIDAD` constant)
**Expected delta:** 7 fewer nodes in to-be.

**External dependencies touched:** 0 (pure logic change, no endpoints).

**Input Sets that test the change:** A (normal flow), B (sustained load).

**Verification method:**
1. Edit the 8 nodes in `bot-as-is.json`.
2. Re-import into n8n.
3. Run 20 rounds of sets A and B.
4. Confirm that `prioridad` in `interacciones_bot` shows as `alta` for messages matching
   R002.

**REG-* involved:** REG-007 (isolated domain) — as-is violation evidenced.

**Measurable hypothesis:** `nodes_touched_asis - nodes_touched_tobe ≥ 5`.

---

## CR2 — Integration: ticket endpoint change

**Exact change:** migrate the ticket-creation endpoint from
`http://mock-bot:3001/api/tickets` to `http://mock-bot:3001/api/v2/tickets` (new version
with a slightly different contract: add the `X-Api-Version: 2` header).

**As-is file:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Node(s) to modify in as-is:**
- Node 9 `Procesar Mensaje` (jsCode) — ticket body construction
- Node 11 `Crear Ticket Urgente` (set) — headers
- Node 12 `Crear Ticket` (httpRequest) — URL + headers + retry (missing)
- Node 15 `Preparar Respuesta` — handling the new ticket_id
- Node 16 `Responder al Cliente` — schema change

**Expected nodes touched as-is:** **5**
**Expected nodes touched to-be:** **1** (only the HTTP node in
`bot-to-be-e3-integracion`)
**Expected delta:** 4 fewer nodes in to-be.

**External dependencies touched:** 1 (ticket endpoint).

**Input Sets:** A, B.

**Verification method:** same as CR1 with the new mock endpoint.

**REG-* involved:** REG-008 (integrations outside E3/E4 in as-is), REG-004 (retry).

**Measurable hypothesis:** `nodes_touched_asis - nodes_touched_tobe ≥ 3`.

---

## CR3 — Validation and error: validate `message`'s minimum length

**Exact change:** add a "message.length ≥ 3" validation with an HTTP 422 response and the
`MESSAGE_TOO_SHORT` error code.

**As-is file:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Node(s) to modify in as-is:**
- Node 2 `Validar Payload` (jsCode) — add a length check
- Node 5 `Error Rate Limit` / create a new `Error Message Too Short` node (respondToWebhook
  422)
- Node 15 `Preparar Respuesta` — differentiate the code

**Expected nodes touched as-is:** **3**
**Expected nodes touched to-be:** **1** (only the `bot-webhook-input.schema.json` schema)
**Expected delta:** 2 fewer nodes in to-be.

**External dependencies touched:** 0.

**Input Sets:** C (invalid), D (boundary, empty `message`).

**Verification method:** run set D and verify every row with `message.length < 3` receives
HTTP 422 with the exact code.

**REG-* involved:** REG-009 (differentiated HTTP codes).

**Measurable hypothesis:** `nodes_touched_asis - nodes_touched_tobe ≥ 2`.

---

## Pre-measurement procedure against as-is (executed in PHASE 3)

1. `git checkout -b cr-measurement-asis` (temporary branch).
2. For every CR:
   a. Modify `bot-as-is.json` touching the nodes listed above.
   b. Record `start_ts` before editing.
   c. Re-import into n8n and run the sets that verify the change (20 runs).
   d. Count `attempts` (how many editing iterations until verification passes).
   e. Record `end_ts` and the temporary branch's `commit_hash`.
   f. Add a row to `cr-log-bot-as-is.csv`.
   g. `git checkout -- casos-de-estudio/bot/as-is/bot-as-is.json` (revert).
3. `git checkout main; git branch -D cr-measurement-asis` (discard the branch).
4. Commit the populated `cr-log-bot-as-is.csv`.

## Measurement against to-be (PHASE 6 — pending)

The same procedure will run against `bot-to-be-*.json` once the to-be is built, recording
the equivalent rows in `cr-log-bot-to-be.csv`. The statistical comparison is documented in
PHASE 6.

---

## Extended CR-log schema

```
cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes
```

Where:
- `cr_id` — unique identifier per row (`CR-BOT-001`, ...).
- `cr_type` — functional type (`CR1`, `CR2`, `CR3`).
- `nodes_touched` — manual count of JSON nodes touched to implement the CR.
- `deps_touched` — number of external endpoints/tables whose contract changed.
- `attempts` — attempts until successful verification.
- `notes` — free text for rationale/incidents.

---

## References

- `medicion/cr-logs/bot/cr-log-bot-as-is.csv` — log with the 3 pre-measured rows.
- `medicion/cr-logs/bot/cr-log-bot-to-be.csv` — reserved for PHASE 6.
- `docs/protocolo-evidencias.md` §6 — general CR-log protocol.
- Bot ADR-001, Bot ADR-002 — architectural decisions that condition the CRs.
