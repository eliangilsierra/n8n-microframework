> 🌐 **Language / Idioma:** English · [Español](cr-design.md)

# Change Request design — IoT

## Purpose

Formal specification of the IoT case's 3 CRs (CR1 business rule, CR2 integration, CR3
validation), pre-measured on as-is during PHASE 3 and to be measured on to-be during
PHASE 6.

---

## CR1 — Business rule: critical temperature threshold change

**Exact change:** reduce the critical temperature threshold from `> 35 °C` to `> 30 °C`
(increased sensitivity for early overheating detection).

**As-is file:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Node(s) to modify in as-is:**
- Node 5 `Calcular Nivel` (jsCode) — hardcoded `if (temp > 35)` condition
- Node 6 `Nivel Critico?` (IF) — threshold referenced in the expression
- Node 7 `Enriquecer Metadatos` (set) — derived `severidad` label
- Node 11 `Notificar Evento` — event payload with the exceeded threshold
- Node 12 `Determinar Canal` (IF) — routing logic
- Node 14 `Responder` — message with the threshold

**Expected nodes touched as-is:** **6**
**Expected nodes touched to-be:** **1** (only the `UMBRALES.TEMP_CRITICA` constant in
`iot-to-be-e2-dominio`)
**Expected delta:** 5 fewer nodes in to-be.

**External dependencies:** 0.

**Input Sets:** A, B, F (normal realism with temperature distribution).

**Verification method:** run set F (200 varied readings) and verify that the rate of rows
with `nivel='critico'` changes from X% (as-is with 35°C) to Y% (as-is with 30°C); the
expected delta is approximately +15 percentage points.

**REG-* involved:** REG-007 (isolated domain).

**Measurable hypothesis:** `nodes_touched_asis - nodes_touched_tobe ≥ 4`.

**Relationship to IoT ADR-002:** ADR-002 documents the to-be thresholds (35°C preserved);
CR1 tests the cost of changing a threshold in response to a new requirement — independent
of ADR-002's values (which belong to the initial domain).

---

## CR2 — Integration: urgent notification endpoint change

**Exact change:** migrate the critical channel from `http://mock-iot:3002/api/notify` to
`http://mock-iot:3002/api/v2/notify/urgent` with a new contract (add the `incident_class`
field).

**As-is file:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Node(s) to modify in as-is:**
- Node 11 `Notificar Evento` (httpRequest) — URL + headers + body
- Node 12 `Determinar Canal` (IF) — routing condition
- Node 13 `Registrar Auditoría` (postgres) — `notif_channel` column
- Node 14 `Responder` — response to the client

**Expected nodes touched as-is:** **4**
**Expected nodes touched to-be:** **1** (only the critical branch's HTTP node in
`iot-to-be-e4-integracion`)
**Expected delta:** 3 fewer nodes in to-be.

**External dependencies touched:** 1 (urgent endpoint).

**Input Sets:** J (extreme percentiles, mostly critical).

**Verification method:** run set J and verify all critical events reach the new endpoint;
DB audit records `notif_channel='urgent'`.

**REG-* involved:** REG-008 (integrations in E3/E4), REG-004 (retry).

**Measurable hypothesis:** `nodes_touched_asis - nodes_touched_tobe ≥ 2`.

**Relationship to IoT ADR-004:** ADR-004 defines the differentiated routing that makes
CR2 local to the to-be.

---

## CR3 — Validation: validate `co2 >= 0`

**Exact change:** add explicit `co2 >= 0` validation with an HTTP 422 response and the
`CO2_NEGATIVE` code.

**As-is file:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Node(s) to modify in as-is:**
- Node 3 `Validar Lectura` (jsCode) — add the check
- Node 4 `Error Validación` (respondToWebhook) — differentiate code 422 vs 400
- Node 14 `Responder` — response schema

**Expected nodes touched as-is:** **3**
**Expected nodes touched to-be:** **1** (only the `iot-webhook-input.schema.json` schema
where `co2.minimum: 0` already exists — declarative verification)
**Expected delta:** 2 fewer nodes in to-be.

**External dependencies:** 0.

**Input Sets:** C (invalid), D (boundary with co2=-1).

**Verification method:** set D includes payloads with `co2=-1`; all must receive HTTP 422
with the `CO2_NEGATIVE` code.

**REG-* involved:** REG-009 (differentiated HTTP codes).

**Measurable hypothesis:** `nodes_touched_asis - nodes_touched_tobe ≥ 2`.

---

## Pre-measurement procedure against as-is (executed in PHASE 3)

Identical to the Bot's (`bot/cr-design.md` §Procedure). The temporary
`cr-measurement-asis` branch is reused (same branch, different commits per case).

## Measurement against to-be (PHASE 6 — pending)

Will run against `iot-to-be-*.json` once the to-be is built, populating
`cr-log-iot-to-be.csv`.

---

## Extended CR-log schema

See `bot/cr-design.md` §Schema — same format for both cases.

---

## References

- `medicion/cr-logs/iot/cr-log-iot-as-is.csv` — log with the 3 pre-measured rows.
- `medicion/cr-logs/iot/cr-log-iot-to-be.csv` — reserved for PHASE 6.
- IoT ADR-001, IoT ADR-002, IoT ADR-003, IoT ADR-004.
- `docs/protocolo-evidencias.md` §6.
