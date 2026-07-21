> 🌐 **Language / Idioma:** English · [Español](justificacion-rediseno-asis.md)

# Justification for the as-is flow redesign

**Version:** 1.0
**Date:** 2026-05-01
**Author:** Elian Hernando Gil Sierra
**Purpose:** Document the methodological validity of the intentional redesign of the as-is
flows to guarantee a representative, auditable baseline.

---

## 1. Problem: original flows insufficient as a baseline

The original flows had minimal complexity (Bot: ~10 nodes, IoT: ~6 nodes) that did not make
the REG-001 to REG-009 antipatterns visible. For example:

- **REG-001 (hardcoded credentials)** requires authentication and external-service
  integration nodes. The original 6-node IoT flow had none.
- **REG-004 (HTTP retry)** requires external HTTP calls. The original Bot flow had no calls
  to an external ticketing service.
- **REG-007 (logic in E2)** requires identifiable scattered business logic. The original
  flows had, at best, one Code node with 5 lines of trivial logic.

A baseline that does not exhibit the antipattern cannot be used to measure the impact of
fixing it. The redesign was necessary to guarantee that the as-is vs to-be comparison had
quantitative meaning.

---

## 2. Methodological validity framework

Wohlin et al. (2012), in *Experimentation in Software Engineering*, establish that a
controlled experiment's baseline must be **representative of the real state** of the study
object, not of the minimum possible state. A 6-node flow does not represent a real
production IoT pipeline implementation; it represents a minimal prototype lacking the
characteristics that make the antipatterns relevant.

The same criterion applies to case studies (Yin, 2018): if the as-is case does not exhibit
the problems the analysis framework predicts, the case is not valid as a comparison point
for evaluating the framework.

---

## 3. Redesign criteria

The redesign meets three internal-validity criteria:

### (a) Equivalent functionality
Same inputs and outputs as the original flows. The webhook contract (required fields,
response format) did not change. The redesigned flows process the same Input Sets as the
originals.

### (b) Verifiable antipatterns
Every antipattern documented in `microframework/antipatrones.md` (REG-001 to REG-009) is
verifiable in the redesigned flows via:
- Visual inspection of the flow in n8n
- Running the `microframework/validacion/validar-flujos.mjs` script
- Results are documented in `checklist-arquitectura-resultado.md` per case

### (c) Complete traceability
Every added node has a Change Request documented in `cambios-y-evidencia.md`:
- **Bot:** 4 CR-ASIS (CR-ASIS-001 through 004) with rationale, date, and commit hash
- **IoT:** 3 CR-ASIS (CR-ASIS-001 through 003) with rationale, date, and commit hash

No change to the as-is was introduced without an explicit record.

---

## 4. Change log

Changes to the as-is are completely documented:

| Case | File | CR-ASIS | Description |
|------|---------|---------|-------------|
| Bot | `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` | 001 | Structural redesign from 10 to 16 nodes |
| Bot | — | 002 | Rate-limit adjustment from LIMITE=10 to LIMITE=150 for statistical measurement |
| Bot | — | 003 | Input Sets expanded from 5 to 10 sets (A–K) |
| Bot | — | 004 | Added `/api/user/:userId/tickets` endpoint to mock-bot |
| IoT | `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` | 001 | Structural redesign from 6 to 14 nodes |
| IoT | — | 002 | Removed PG credentials from the node (REG-001 in real version; mock credentials in the measurement version) |
| IoT | — | 003 | Input Sets expanded from 5 to 10 sets (A–K) |

---

## 5. Internal validity statement

The static validation script (`validar-flujos.mjs`) confirms that the redesigned flows
violate exactly the rules that antipattern literature predicts for ad-hoc monolithic flows:

- Flows without separation of responsibilities → REG-007, REG-008 fail
- Flows without secrets management → REG-001 fails
- Flows without idempotency control → REG-005 fails
- Flows without retry → REG-004 fails
- Flows without structured log → REG-006 fails
- Flows without an error flow → REG-003 fails
- Flows without run_id → REG-002 fails

This correspondence between the literature's predictions and the as-is flows' verified
state confirms that the redesigned flows are a **representative, auditable baseline**,
suitable for evaluating the micro-framework's impact in PHASE 6's quantitative comparison.

---

## 6. Limits of the redesign

- The redesign does not introduce the micro-framework into the as-is. The as-is flows
  remain ad-hoc monolithic implementations — the difference is only in complexity and
  antipattern coverage, not in architecture.
- The redesign did not alter historical measurement data already recorded before the
  redesign. Run-logs prior to the redesign commit are identified with
  `commit_hash="unknown"` (see `medicion/protocolo-evidencias.md` §9).
- The redesign cannot guarantee it represents every possible antipattern in real n8n flows.
  The redesigned flows are representative of the antipattern literature documented in
  `microframework/antipatrones.md`, not of every antipattern existing in the n8n ecosystem.

---

## 7. References

- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer.
- Yin, R.K. (2018). *Case Study Research and Applications* (6th ed.). SAGE Publications.
- `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` — Bot as-is change log
- `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` — IoT as-is change log
- `microframework/validacion/validar-flujos.mjs` — static verification script
- `medicion/protocolo-evidencias.md` §9 — commit_hash anomaly
