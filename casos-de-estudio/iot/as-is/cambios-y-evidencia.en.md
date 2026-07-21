> 🌐 **Language / Idioma:** English · [Español](cambios-y-evidencia.md)

# As-is changes and evidence — IoT

## Purpose

Chronological record of every architectural change made to the IoT case's as-is during
PHASE 2, with rationale, commit, and links to micro-framework rules. Serves as backing for
the ATAM audit and the academic defense.

Complements `notas-tecnicas.md` (the as-is's final state) by providing the chronological
trajectory and the reasoning behind each decision.

---

## Initial baseline

The IoT's as-is started as a **6-node** n8n flow modeling the ingestion of environmental
readings from industrial sensors with PostgreSQL persistence:

`Webhook → Validar payload → Evaluar umbral → Insertar BD → Notificar si crítico → Responder`

Architectural limitations identified in the first run (2026-04-19):

- Thresholds scattered in a single Code node with no named constant.
- No idempotency handling (REG-005 not measurable).
- No retry on HTTP integrations (REG-004 N/A but conceptually absent).
- PostgreSQL credentials embedded in the node (REG-001, a direct example).
- A single notification channel (didn't exhibit the severity-routing trade-off).

Decision: structural redesign of the as-is so it simultaneously exhibited the REG-001,
REG-004, REG-005, REG-006, REG-007, REG-008, and REG-009 antipatterns, analogous to the
Bot's redesign (Bot CR-ASIS-01).

---

## Chronological change log

### CR-ASIS-01 (2026-04-19) — Structural redesign of the IoT flow (6 → 14 nodes)

**Description:** Expansion of the as-is flow to deliberately exhibit the REG-*
antipatterns detectable by the static validator and producible in the run-log.

**Rationale:** The original as-is was "too clean" to serve as a comparative baseline.
Without visible violations, the delta vs. to-be would be marginal and not attributable to
the micro-framework with statistical clarity.

**Nodes added/modified:**

| Node | Change | Violated REG-* |
|------|--------|----------------|
| 3 `Validar Lectura` | Binary validation with no error-type differentiation (422 vs 400) | REG-009 |
| 5 `Calcular Nivel` | Hardcoded thresholds `if (temp > 35)`, `if (co2 > 1500)` with no constant | REG-007 |
| 7 `Enriquecer Metadatos` | NEW — computing `location`, `shift_id`, inline merge (domain logic in the orchestrator) | REG-007 |
| 9 `Consultar Histórico Sensor` | NEW — GET `/api/sensor/:id/history` with no retry, literal `x-api-key` header | REG-001, REG-004 |
| 10 `Persistir PostgreSQL` | INSERT with no `ON CONFLICT`, hardcoded credentials in the node | REG-001, REG-005 |
| 11 `Notificar Evento` | POST `/api/notify`, single channel, no retry, `Authorization: Bearer <literal>` | REG-001, REG-004 |
| 13 `Registrar Auditoría` | NEW — second INSERT with no ON CONFLICT | REG-005 |
| orchestrator | All HTTP/DB inline, no E3/E4 subflows | REG-008 |
| all Code nodes | No `console.log(JSON.stringify({run_id, etapa, status}))` | REG-006 |
| settings | No `errorWorkflow` | REG-003 |
| Respond to Webhook | Single `responseCode` 200 | REG-009 |

**Commit:** `cff317a`

**Evidence:**
- `notas-tecnicas.md` §REG-001..010 mapping
- Validator: `node microframework/validacion/validar-flujos.mjs --caso iot --estado as-is`
  → 7 applicable rules, 6 violated.
- Run-log rows 1..600 (initial sets A, B, C).

**REG-* involved:** REG-001, REG-004, REG-005, REG-006, REG-007, REG-008, REG-009.

**Formalization:** IoT ADR-001 (pipeline responsibility separation).

---

### CR-ASIS-02 (2026-04-19) — Removal of hardcoded PostgreSQL credentials from the node

**Description:** PostgreSQL credentials were hardcoded in node 10
(`Persistir PostgreSQL`) as `parameters.host`, `parameters.user`, `parameters.password`.
The literals were removed and a `postgres-iot-credential` credential configured on the
local n8n instance is referenced instead.

**Rationale:** Although the project documents that "the as-is intentionally violates
REG-001", real credentials must NEVER be in the repository (a critical rule defined in the
project's conventions). REG-001's violation is represented by the hardcoded HTTP tokens
(nodes 9, 11, 13), which are indeed fictitious values with no operational risk. The real
DB's credentials go in `.env` (ignored by git) and are injected via an n8n credential.

**Files touched:**
- `casos-de-estudio/iot/as-is/iot-as-is.json` — node 10 credential-reference
- `microframework/plantillas/iot-as-is.json` — analogous adjustment

**Commit:** `cff317a` (same commit as CR-ASIS-01, as the redesign's closure)

**Evidence:**
- `grep -i "password" casos-de-estudio/iot/as-is/iot-as-is.json` → 0 lines
- The validator still flags REG-001 as violated due to the literal HTTP headers, not the
  DB.

**REG-* involved:** REG-001 (preserved in the flow via HTTP; removed from the Postgres
node).

---

### CR-ASIS-03 (2026-04-21) — Expansion of Input Sets A–C to A–K (10 sets)

**Description:** Same expansion as the Bot's (Bot ADR-004 applies to both cases). For
IoT, set K (idempotency duplicates) is the only one able to measure REG-005 with
quantitative evidence.

**Rationale:** Without set K, the as-is's INSERT-without-ON-CONFLICT antipattern has no
measurable counterpart; the delta vs to-be would be zero and the thesis couldn't defend
REG-005 with empirical evidence.

**Set K design for IoT:**
- 100 unique `idempotency_key`, each sent twice → 200 total payloads.
- Every pair of payloads with the same `{sensor_id, timestamp}` (the composite key from
  IoT ADR-003).
- Expected result: as-is → 200 DB rows with 100 duplicates; to-be → 100 rows with 0
  duplicates.

**Files created:**
- `medicion/datasets/iot/input-set-{A..K}.json` (10 files)

**Commit:** `a126311`

**Evidence:**
- Set K verification: `python -c "import json, collections; d=json.load(open('medicion/datasets/iot/input-set-K.json')); keys=[p['idempotency_key'] for p in d['payloads']]; c=collections.Counter(keys); print(f'Unique:{len(c)} Pairs:{sum(1 for v in c.values() if v==2)}')`
- SHA-256 in `manifest.json`.

**REG-* involved:** REG-005 (measurable for the first time).

**Formalization:** Bot ADR-004 (shared experimental design).

---

## Change → commit → evidence traceability table

| CR-ASIS | Date | Commit | Files touched | REG-* | Quantitative evidence |
|---------|-------|--------|------------------|-------|------------------------|
| 01 | 2026-04-19 | cff317a | `iot-as-is.json` (6→14 nodes), `notas-tecnicas.md`, `setup_env.py` (lecturas_sensor table) | 001,004,005,006,007,008,009 | Validator: 6/7 violations; run-log 600 rows |
| 02 | 2026-04-19 | cff317a | `iot-as-is.json` node 10 (credential) | 001 partial | `grep password` = 0 |
| 03 | 2026-04-21 | a126311 | `datasets/iot/input-set-{A..K}.json`, `seeds.yaml` | — (methodology) | SHA-256 manifest + 2000 as-is runs |

---

## Relationship to the ADRs

| Change | ADR that formalizes it |
|--------|----------------------|
| CR-ASIS-01 | `ADR-001-separacion-responsabilidades-pipeline.md` |
| CR-ASIS-01 (to-be thresholds and vocabulary) | `ADR-002-umbrales-y-vocabulario.md` |
| CR-ASIS-01 (to-be idempotency strategy) | `ADR-003-idempotencia-sensor-timestamp.md` |
| CR-ASIS-01 (to-be E4 routing) | `ADR-004-routing-e4-por-severidad.md` |
| CR-ASIS-03 | `../bot/adr/ADR-004-diseno-experimental-input-sets.md` (shared) |

---

## Cross-references

- `casos-de-estudio/iot/as-is/notas-tecnicas.md`
- `casos-de-estudio/iot/adr/` — ADRs 001..004
- `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md`
- `medicion/run-logs/iot/run-log-iot-as-is.csv` — 2000 as-is runs
- `medicion/protocolo-evidencias.md` §5
