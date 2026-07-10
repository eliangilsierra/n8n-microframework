> 🌐 **Language / Idioma:** English · [Español](matriz-trazabilidad.md)

# Traceability matrix — Bot case

**Version:** 1.3
**Date:** 2026-05-01
**Status:** Updated with ADR-005..008 and ATAM scenarios BOT-Q1..Q6 — PHASE 6 evidence for
to-be pending.

---

## Functional requirements

| ID | Requirement | Priority | ISO 25010 attribute |
|----|---------------|-----------|-------------------|
| RF-BOT-01 | The system validates token presence before processing | High | Security / Confidentiality |
| RF-BOT-02 | The system classifies the message into one of 5 categories | High | Maintainability / Modularity |
| RF-BOT-03 | The system determines priority: high, medium, or low | High | Maintainability / Modularity |
| RF-BOT-04 | The system persists a ticket in the external service | High | Reliability / Maturity + Recoverability |
| RF-BOT-05 | The system responds with category, priority, and message to the user | High | Functional suitability / Correctness |
| RF-BOT-06 | The system returns 401 if the token is invalid and 400 if the token field is missing | High | Security / Authenticity + Functional suitability / Correctness |
| RF-BOT-07 | The system rejects with 400 if the message exceeds 1000 characters | Medium | Functional suitability / Correctness |
| RF-BOT-08 | The system returns 500 with a structured body when E2 or E3 fail during processing | High | Reliability / Fault tolerance + Operability / Monitorability |

---

## Traceability: Requirement → Architectural decision → Evidence

| Requirement | Related ADR | Micro-framework rule | Node/Stage | Input Set | Evidence (PHASE 6) |
|---------------|-----------------|----------------------|------------|-----------|-------------------|
| RF-BOT-01 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | REG-001, E1 | E1 - Validacion | C, D, E | run-log-bot-*.csv (PHASE 6) |
| RF-BOT-02 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | REG-007, E2 | E2 - Reglas | A, B, F | run-log-bot-*.csv (PHASE 6) |
| RF-BOT-03 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md), [ADR-002](../adr/ADR-002-omision-e4.md) | REG-007, E2 | E2 - Reglas | A, B, F | run-log-bot-*.csv (PHASE 6) |
| RF-BOT-04 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | REG-004, REG-005, E3 | E3 - Adaptador | A, B, K | run-log-bot-*.csv (PHASE 6) |
| RF-BOT-05 | [ADR-002](../adr/ADR-002-omision-e4.md) | REG-009, E4 | Respond - OK | A, B | run-log-bot-*.csv (PHASE 6) |
| RF-BOT-06 | [ADR-005](../adr/ADR-005-estrategia-autenticacion.md) | REG-001, REG-009, E1 | Respond - 401 / Respond - 400 | C | run-log-bot-*.csv (PHASE 6) |
| RF-BOT-07 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md), [ADR-004](../adr/ADR-004-diseno-experimental-input-sets.md) | REG-009, E1 | E1 - Validacion | D, E, G, J | run-log-bot-*.csv (PHASE 6) |
| RF-BOT-08 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md), [ADR-006](../adr/ADR-006-diseno-error-workflow.md) | REG-003, REG-006 | Orchestrator (IF-error + Respond-500) | — | run-log-bot-*.csv (PHASE 6) |

---

## Traceability: Quality attribute → ATAM scenario → Decision

| Quality attribute | ATAM scenario | Architectural decision | ADR |
|--------------------|----------------|------------------------|-----|
| Maintainability | Modifying rule R002 (priority) touches only E2 | Domain/adapter separation | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Maintainability | Ticket endpoint change touches only E3 | Isolated adapter | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Security | Token and API keys don't appear in the exported JSON | Credentials in n8n, not in nodes | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Reliability | Ticket retry doesn't create duplicates | Idempotency in E3 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Internal validity | N=200 viable with no rate-limit saturation | Two parallel versions (LIMITE=150 / LIMITE=10) | [ADR-003](../adr/ADR-003-ratelimit-medicion.md) |
| Functional suitability | Quantitative evidence per specific antipattern | Experimental matrix expanded to 10 sets | [ADR-004](../adr/ADR-004-diseno-experimental-input-sets.md) |
| Traceability | Every execution has a traceable run_id | run_id propagated from E1 | REG-002 |
| Maintainability | BOT-Q1: CR1 touches ≤1 node in to-be | Classification centralized in the REGLAS array | [ADR-007](../adr/ADR-007-clasificacion-mensajes-e2.md) |
| Maintainability | BOT-Q2: CR2 touches ≤1 node in to-be | Isolated E3 adapter | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Security | BOT-Q3: token not in the exported JSON | n8n credential by name | [ADR-005](../adr/ADR-005-estrategia-autenticacion.md) |
| Reliability | BOT-Q4: 0 duplicate tickets in Set K | Idempotency in E3 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Operability | BOT-Q5: MTTD < 60 seconds | Structured JSON log + errorWorkflow | [ADR-006](../adr/ADR-006-diseno-error-workflow.md) |
| Functional suitability | BOT-Q6: 401 for invalid token, 400 for missing fields | REG-009 in E1 | [ADR-005](../adr/ADR-005-estrategia-autenticacion.md) |

---

## Change Requests and coverage

| CR | Description | Affected RF | Impacted stage (as-is) | Impacted stage (to-be) | Measured as-is | Measured to-be |
|----|-------------|-------------|------------------------|------------------------|--------------|--------------|
| CR1 | Change R002's priority to "high" | RF-BOT-03 | 8 nodes (monolithic flow) | Only E2 (≤1 node expected) | CR-BOT-001 @ 152fd2d (2026-04-21) | PHASE 6 |
| CR2 | Change the ticket endpoint to /api/v2 | RF-BOT-04 | 5 nodes (monolithic flow) | Only E3 (≤1 node expected) | CR-BOT-002 @ 152fd2d (2026-04-21) | PHASE 6 |
| CR3 | Validate `message`'s minimum length | RF-BOT-07 | 3 nodes | Only E1's schema (0 nodes) | CR-BOT-003 @ 152fd2d (2026-04-21) | PHASE 6 |

See detail in `casos-de-estudio/bot/cr-design.md` and raw data in
`medicion/cr-logs/bot/cr-log-bot-as-is.csv`.

---

## Changes to the as-is (PHASE 2)

See `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` for the complete chronological
change log of the 4 CR-ASIS applied (structural redesign, rate-limit adjustment, Input
Sets expansion, mock endpoint).

---

## Bot case ADRs

| ADR | Title | Status |
|-----|--------|--------|
| [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | Flow responsibility separation (logical E1–E4) | Accepted |
| [ADR-002](../adr/ADR-002-omision-e4.md) | Omission of E4 as a separate subflow in Bot | Accepted |
| [ADR-003](../adr/ADR-003-ratelimit-medicion.md) | Separation of statistical measurement vs REG-002 demo | Accepted |
| [ADR-004](../adr/ADR-004-diseno-experimental-input-sets.md) | Experimental matrix expanded to 10 Input Sets (also applies to IoT) | Accepted |
| [ADR-005](../adr/ADR-005-estrategia-autenticacion.md) | Authentication strategy with no hardcoded token (REG-001) | Accepted |
| [ADR-006](../adr/ADR-006-diseno-error-workflow.md) | Design of the bot-error-handler errorWorkflow (REG-003, REG-006) | Accepted |
| [ADR-007](../adr/ADR-007-clasificacion-mensajes-e2.md) | Message classification in E2 with a REGLAS array (REG-007, REC-002) | Accepted |
| [ADR-008](../adr/ADR-008-rate-limiting-tobe.md) | Removal of the rate-limiter in to-be — stateless by design (REG-002) | Accepted |

---

*The "Evidence (PHASE 6)" and "Measured to-be" cells are filled in once the to-be's
comparative measurement runs (PHASE 6) are executed.*
