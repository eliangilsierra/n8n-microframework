> 🌐 **Language / Idioma:** English · [Español](ADR-004-diseno-experimental-input-sets.md)

# ADR-004: Expansion of the experimental design to 10 Input Sets (A–E static + F, G, I, J, K dynamic)

**Status:** Accepted
**Date:** 2026-04-21
**Case:** bot (also applicable to iot — see scope note)
**Affected quality attribute:** Methodological internal validity, Functional suitability

---

## Context

The thesis proposal (`../../../medicion/proyecto-overview.en.md` §Input Sets) defined three Input
Sets per case:

- **A:** normal flow (happy path)
- **B:** high load (sustained volume)
- **C:** invalid data (missing token / invalid fields)

These three sets cover the minimum scenarios to validate the as-is vs to-be difference in
general operation, load, and input validation. During PHASE 2 it was identified that
experimental coverage was insufficient to **precisely attribute** the observed differences
to specific antipatterns:

1. **REG-005 (idempotency)** is not observable with A, B, C because none of the three sets
   produce intentional duplicates or allow verifying `ON CONFLICT` in the DB.
2. **REG-009 (error codes)** is only partially tested with C (binary validation); coverage
   of boundary values and partial fields is missing.
3. **Traffic realism:** static sets A–C use a single payload repeated N times, which
   doesn't reflect production variability and exaggerates per-node cache effectiveness.
4. **Extreme percentiles and degradation:** cannot be observed with uniform load.

The decision to expand the experimental matrix was made before running PHASE 2's main
measurement and must be formally documented so the ATAM evaluation (PHASE 7) and the
advisor's academic audit can verify that the expansion introduces no bias relative to the
thesis proposal.

---

## Decision

We expand the experimental matrix from 3 to **10 Input Sets per case**, split into two
groups:

### Static sets (single payload repeated N times)

| Set | Name | Purpose | REG-* it stresses |
|-----|--------|-----------|-------------------|
| A | Normal | Happy-path baseline | Baseline |
| B | High load | Sustained volume | Baseline with volume |
| C | Invalid data | Missing token/field → expected 4xx | REG-009 |
| D | Boundary values | Exact threshold (`message` length 0) | REG-009 (boundary) |
| E | Partial fields | Missing `user_id`, missing `session_id` | REG-009, REG-007 |

### Dynamic sets (200 unique payloads generated with a deterministic seed)

| Set | Name | Purpose | REG-* it stresses |
|-----|--------|-----------|-------------------|
| F | Normal realism | 200 varied valid messages | REG-007 (domain) |
| G | Valid/invalid mix | 150 valid + 50 invalid mixed | REG-009, REG-008 |
| I | Degradation | Decreasing delay 300→50 ms (increasing load) | p95/p99 latency |
| J | Extreme percentiles | Payloads at domain limits (max length, special chars) | REG-007, REG-009 |
| K | Idempotency duplicates | Every `idempotency_key` appears exactly twice | REG-005 |

**Deterministic generator:** `medicion/datasets/generar_datasets.py` with
`master_seed = 20260421` defined in `medicion/datasets/seeds.yaml`. Reproducibility
verified with SHA-256 of the generated files.

### Resulting total run count

- Sets × cases × versions × N = 10 × 2 × 2 × 200 = **8,000 runs** for a complete as-is →
  to-be cycle
- PHASE 2 closed with 4,000 runs (as-is only); the remaining 4,000 run in PHASE 5–6

### Scope note

This ADR applies to both the **bot and iot** cases simultaneously. It is filed under the
bot directory by primogeniture convention (it was the first case that motivated the
expansion) and is referenced from the iot traceability matrix.

---

## Alternatives considered

- **Keep only A–C as defined in the thesis proposal:** 100% respects the original design
  but leaves REG-005 (idempotency), boundary values, and percentile variability without
  quantitative evidence. Discarded: it weakens the ATAM evaluation of the "Reliability" and
  "Functional suitability" attributes.

- **Add 20 sets (A–T):** exhaustive coverage but dilutes the study's narrative and
  multiplies execution time with no specific hypotheses per set. Discarded: the parsimony
  principle demands every additional set answer a concrete micro-framework question.

- **Expand only with static sets (D, E), no dynamic ones:** solves boundary and missing
  fields but doesn't solve realism or extreme percentiles. Discarded: REG-005 remains
  uncovered by any static set.

- **Replace A–C with dynamic sets:** breaks continuity with the thesis proposal and hinders
  traceability to original RFs. Discarded.

---

## Consequences

**Positive:**
- Broad experimental coverage for 8 of the 10 mandatory rules REG-001..010 (the other two,
  REG-003 and REG-010, are architectural and verified by static inspection — they don't
  need an Input Set).
- REG-005 (idempotency) becomes measurable for the first time with set K.
- p95/p99 percentiles and latency under degradation measurable with set I.
- Seed-reproducible dynamic datasets → complete evidence traceability.
- Maintains compatibility with the thesis proposal's A–C: the 3 original sets are still
  present and produce the same results as the original design.

**Negative / trade-offs:**
- Execution time per complete cycle goes from 3×200×2×2 = 2,400 runs to 10×200×2×2 = 8,000
  runs (~3.3× more). Mitigation: automated execution with `run_corridas.py`, ~15 minutes
  per case-version with a per-set `DELAY_STRATEGY`.
- The expansion requires maintaining a deterministic generator and versioning the seeds.
  Cost already assumed: `generar_datasets.py` and `seeds.yaml` exist and are audited
  (SHA-256 verified).
- The thesis proposal must be cited with the addendum "expanded experimental design per
  ADR-004" in the thesis's methodological chapter, to prevent a reviewer from interpreting
  the difference as an undocumented deviation.

---

## Relationship to the micro-framework

- **REG-005 (idempotency):** set K is the only set specifically designed to measure this
  rule; without it there is no quantitative evidence of the as-is's
  INSERT-without-ON-CONFLICT antipattern.
- **REG-009 (HTTP error codes):** sets C, D, E, G cover different validation and
  boundary-value scenarios.
- **REG-007 / REG-008 (domain/integration separation):** sets F, G, J stress domain
  variability without touching integration.
- **Idempotency pattern** (`microframework/patrones/patron-idempotencia.md`): set K
  executes the same key twice → validates the pattern's implementation in E3.
- **`EXPECTED_HTTP`** in `automatizacion/run_corridas.py` encodes the expected behavior per
  (case, version, set) — verifiable at run time.
- Cross-references:
  - `medicion/datasets/generar_datasets.py` (deterministic generator)
  - `medicion/datasets/seeds.yaml` (versioned seeds, master_seed=20260421)
  - `../../../medicion/proyecto-overview.en.md` §Input Sets (must be updated with this addendum)
