> 🌐 **Language / Idioma:** English · [Español](cambios-y-evidencia.md)

# As-is changes and evidence — Bot

## Purpose

This document chronologically records every architectural change made to the Bot case's
as-is during PHASE 2, with rationale, evidence commit, and links to micro-framework rules.
It is the backing document for the ATAM audit and the academic defense.

It complements `notas-tecnicas.md` (which documents the as-is's *final state* and its
antipatterns) by providing the chronological **trajectory** and the reasoning behind each
decision.

---

## Initial baseline

The Bot's as-is started as a **10-node** n8n flow modeling a conversational chatbot with
PostgreSQL persistence. It covered the minimum flow:

`Webhook → Validar Token → Procesar Mensaje → Guardar Interacción → Responder`

Architectural limitations identified in the first run (2026-04-19):

- A single external endpoint (insufficient to stress REG-004 retry).
- No rate-limiting logic (did not exhibit REG-002).
- No secondary integrations (did not exhibit REG-008).
- No variable error fields (REG-009 not measurable).

Decision: the initial as-is **was not pathological enough** to serve as a comparative
baseline against the to-be. A structural redesign was planned.

---

## Chronological change log

### CR-ASIS-01 (2026-04-19) — Structural redesign of the Bot flow (10 → 16 nodes)

**Description:** Expansion of the as-is flow to deliberately exhibit the 9 rules the
static validator is able to detect (REG-001, REG-002, REG-004, REG-005, REG-006, REG-007,
REG-008, REG-009 + REG-010 due to the absence of a specific ADR).

**Rationale:** The initial as-is did not produce enough quantitative evidence of the
antipatterns the micro-framework seeks to correct. Without these violations visible in the
as-is, the PHASE 6 comparison lacks contrast: the thesis needs the as-is to be "bad on
purpose" so the delta vs. to-be is attributable to the micro-framework, not experimental
noise.

**Nodes added/modified:**

| Node | Change | Violated REG-* |
|------|--------|----------------|
| 3 `Verificar Rate Limit` | NEW — `$getWorkflowStaticData('global')` in-memory, fixed 60s window | REG-002 |
| 6 `Validar Token` | `rightValue: "mi-token-secreto-hardcodeado-123"` | REG-001 |
| 8 `Consultar Historial Usuario` | NEW — GET `/api/user/:id/tickets` with a hardcoded literal `x-api-key` header, no retry | REG-001, REG-004 |
| 9 `Procesar Mensaje` | `const api_source_token = "..."` inside jsCode | REG-001 |
| 12 `Crear Ticket` | NEW — POST `/api/tickets` with a literal `x-api-key`, no retry | REG-001, REG-004 |
| 13 `Guardar Interacción` | INSERT with no `ON CONFLICT`, no `idempotency_key` column | REG-005 |
| 14 `Notificar Sistema Externo` | NEW — POST `/api/notify` with a literal header, no retry | REG-001, REG-004 |
| orchestrator | All HTTP nodes inline, no E3/E4 subflows | REG-008 |
| all | No `console.log(JSON.stringify({run_id, etapa, status}))` | REG-006 |
| settings | No `errorWorkflow` configured | REG-003 |
| Respond to Webhook | Single `responseCode` 200, no 4xx/5xx differentiation | REG-009 |

**Commit:** `cff317a` — *feat(casos-de-estudio): bot and iot as-is flows with ADRs and technical notes*

**Evidence:**
- `notas-tecnicas.md` §Node table and §Detailed REG-001…010 mapping
- Static validator: `node microframework/validacion/validar-flujos.mjs --caso bot --estado
  as-is` reports 7 applicable rules → 6 violated (REG-001 through REG-008 minus REG-003) +
  REG-009 initially N/A.
- First measurement in `medicion/run-logs/bot/run-log-bot-as-is.csv` rows 1..600 (sets A,
  B, C).

**REG-* involved:** REG-001, REG-002, REG-004, REG-005, REG-006, REG-007, REG-008,
REG-009.

**Formalization:** Bot ADR-001 (flow responsibility separation).

---

### CR-ASIS-02 (2026-04-19) — Added `/api/user/:userId/tickets` mock endpoint

**Description:** The new node 8 (`Consultar Historial Usuario`) required a read-only GET
mock endpoint for the Bot. `mock-bot-server` only exposed write POSTs.

**Rationale:** Without a read GET endpoint, node 8 failed 100% of runs and contaminated
the run-log with a uniform error_type. The node needs to respond 200 with simulated
history so the antipattern being measured is "missing retry", not "nonexistent endpoint".

**Files touched:**
- `infraestructura/mock-bot-server/server.js` — GET route added
- `infraestructura/mock-bot-server/package.json` — unchanged

**Commit:** `cff317a`

**Evidence:** `curl -s http://localhost:3001/api/user/user-001/tickets` returns
`{"tickets":[...]}` → node 8 no longer fails with 404.

**REG-* involved:** none (test infrastructure change, not the flow).

---

### CR-ASIS-03 (2026-04-21) — LIMITE rate-limit adjustment from 10 to 150

**Description:** Increasing the rate-limit threshold in `bot-as-is.json` to allow N=200
runs per set without triggering the rate-limiter. Creation of
`bot-as-is-ratelimit-demo.json` with LIMITE=10 for the qualitative demonstration of the
REG-002 antipattern.

**Rationale:** With LIMITE=10 and sets reusing `user-001`, the 10✓/190✗ pattern saturated
the run-logs and masked the signal from REG-001, REG-004 through REG-009. The dual
solution preserves the structural antipattern (non-distributed in-memory rate-limit)
without interfering with the statistical measurement.

**Files touched:**
- `casos-de-estudio/bot/as-is/bot-as-is.json` — `const LIMITE = 10` → `const LIMITE = 150`
- `casos-de-estudio/bot/as-is/bot-as-is-ratelimit-demo.json` — NEW (copy with LIMITE=10)
- `microframework/plantillas/bot-as-is.json` — analogous adjustment

**Commit:** `a126311` — *feat(medicion): input sets A-K, deterministic generator, seeds, and analysis*

**Evidence:**
- `medicion/run-logs/bot/run-log-bot-as-is.csv` post-change: N=200 complete runs per set
  with no rate-limit activation.
- The static validator still flags REG-002 as violated in both versions (the violation is
  architectural, not numeric).

**REG-* involved:** REG-002 (the violation is preserved; only the trigger changes).

**Formalization:** Bot ADR-003 (separation of statistical measurement and REG-002
antipattern demonstration).

---

### CR-ASIS-04 (2026-04-21) — Expansion of Input Sets A–C to A–K (10 sets)

**Description:** Expansion of the experimental matrix from 3 sets (A normal, B load, C
invalid) to 10 sets (A–E static + F, G, I, J, K dynamic) with a deterministic generator.

**Rationale:** The 3 original sets did not allow measuring REG-005 (idempotency), boundary
values, extreme percentiles, or degradation. The expansion covers 8 of the 10 mandatory
rules with quantitative evidence (the other 2 are architectural and verified by static
inspection).

**Files created/touched:**
- `medicion/datasets/generar_datasets.py` — NEW (deterministic generator)
- `medicion/datasets/seeds.yaml` — NEW (`master_seed: 20260421`)
- `medicion/datasets/bot/input-set-{A..K}.json` — 10 generated files
- `automatizacion/run_corridas.py` — `EXPECTED_HTTP` extended per (case, version, set)

**Commit:** `a126311`

**Evidence:**
- SHA-256 of every `input-set-*.json` verified in `medicion/datasets/manifest.json`.
- Reproducibility: `python medicion/datasets/generar_datasets.py --verify-only` returns OK.
- PHASE 2 ran 10×200 = 2000 as-is runs per case → 4000 total in `run-log-bot-as-is.csv` +
  `run-log-iot-as-is.csv`.

**REG-* involved:** none directly (methodological decision).

**Formalization:** Bot ADR-004 (experimental design — also applies to IoT).

---

## Change → commit → evidence traceability table

| CR-ASIS | Date | Commit | Files touched | REG-* | Quantitative evidence |
|---------|-------|--------|------------------|-------|------------------------|
| 01 | 2026-04-19 | cff317a | `bot-as-is.json` (10→16 nodes), `notas-tecnicas.md` | 001,002,004,005,006,007,008,009 | Validator: 6/7 violations; run-log 600 rows |
| 02 | 2026-04-19 | cff317a | `mock-bot-server/server.js` | — | `curl /api/user/.../tickets` 200 OK |
| 03 | 2026-04-21 | a126311 | `bot-as-is.json` (LIMITE 10→150), `bot-as-is-ratelimit-demo.json` | 002 | run-log 200 complete rows per set |
| 04 | 2026-04-21 | a126311 | `datasets/generar_datasets.py`, `seeds.yaml`, `input-set-{A..K}.json` | — (methodology) | SHA-256 manifest + 2000 as-is runs |

---

## Relationship to the ADRs

| Change | ADR that formalizes it |
|--------|----------------------|
| CR-ASIS-01 | `ADR-001-separacion-responsabilidades-flujo.md` |
| CR-ASIS-01 (decision to omit E4 as a subflow in Bot) | `ADR-002-omision-e4.md` |
| CR-ASIS-03 | `ADR-003-ratelimit-medicion.md` |
| CR-ASIS-04 | `ADR-004-diseno-experimental-input-sets.md` |

---

## Cross-references

- `casos-de-estudio/bot/as-is/notas-tecnicas.md` — final state and REG-* mapping
- `casos-de-estudio/bot/adr/` — ADRs 001..004
- `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md`
- `medicion/run-logs/bot/run-log-bot-as-is.csv` — 2000 as-is runs
- `medicion/protocolo-evidencias.md` §5 — run-log schema
