> 🌐 **Language / Idioma:** English · [Español](ADR-003-ratelimit-medicion.md)

# ADR-003: Separation between statistical measurement and REG-002 antipattern demonstration

**Status:** Accepted
**Date:** 2026-04-21
**Case:** bot
**Affected quality attribute:** Maintainability, Traceability (methodological internal validity)

---

## Context

The `bot-as-is.json` flow implements in-memory rate-limiting with
`$getWorkflowStaticData('global')` per `user_id` (node 3 "Verificar Rate Limit"). The
initial design used `LIMITE = 10` to quickly make the REG-002 antipattern visible
(non-distributed rate-limit, no reset on container restart, fixed 60-second window).

With N=200 runs per set and Input Sets that reuse the same `user_id` (A, B, D, E use
`user-001` in every payload), threshold 10 produces a symmetric 10✓/190✗ pattern across
every set using valid tokens. This signal saturates the run-logs and **masks** the
violations of REG-001, REG-003, REG-004, REG-005, REG-006, REG-007, REG-008, REG-009, and
REG-010, preventing the comparative statistical analysis (PHASE 6) from correctly
attributing observed differences in latency, error rate, and behavior to the
micro-framework vs. the rate-limiter. The methodological decision must be made before
starting PHASE 4 because it defines the to-be measurement's experimental design.

---

## Decision

We keep **two parallel versions of the bot as-is flow**:

| File | Threshold | Purpose |
|---------|--------|-----------|
| `bot-as-is.json` | `LIMITE = 150` | Main statistical measurement (N=200 per set < 150 = rate-limit not triggered) |
| `bot-as-is-ratelimit-demo.json` | `LIMITE = 10` | Qualitative demonstration of the REG-002 antipattern (not part of the statistical pool) |

Threshold 150 **preserves every pathological property** of the REG-002 antipattern: still
in-memory, non-distributed, fixed 60-second window, no clean reset between sessions. Only
the trigger is raised so it doesn't activate during the main measurement.

The demo file is run once in PHASE 5 (pilot) to produce qualitative evidence of REG-002 and
is referenced in the thesis as an "in-memory case study" separate from the statistical
series.

---

## Alternatives considered

- **Keep a single flow with LIMITE=10 and reduce N to 10 per set:** Preserves the visible
  antipattern but reduces the effective N from 200 to 10 per set. With 10 sets × 10 runs =
  100 measurements per case × version, the statistical power to detect p95 latency
  differences drops below 0.6 (G*Power, α=0.05, expected medium effect 15%). Discarded: it
  compromises PHASE 6's statistical validity.

- **Exclude post-rate-limit runs from the statistical pool (filtered by `status='fail'`
  with `error_type='rate_limit'`):** Possible in post-processing but introduces selection
  bias because rate-limiter failures are correlated with the set's temporal order.
  Discarded: it violates the independence assumption required by Mann-Whitney U and t-test.

- **Use a different `user_id` per run to evade the rate-limit:** Requires modifying the
  datasets (set A is designed by intent to use a single `user_id` to test idempotency at
  that level). Discarded: it alters the Input Sets design documented in the technical
  datasheets.

- **Two parallel versions (chosen):** Explicitly separates measurement from
  demonstration. Minimal maintenance overhead since only one constant differs.

---

## Consequences

**Positive:**
- N=200 runs per set viable with no rate-limit activation in the main flow, preserving
  statistical power for t-test and Mann-Whitney U in PHASE 6.
- The REG-002 antipattern is formally documented in `notas-tecnicas.md` and empirically
  demonstrated with a dedicated run of the demo flow — qualitative evidence available with
  no contamination of the statistical pool.
- Clean main statistical series of 8,000 runs (N=200 × 10 sets × 2 cases × 2 versions)
  with no rate-limiter interference.
- The static validator still flags REG-002 as violated in both versions (the violation is
  in the architecture, not the numeric value).

**Negative / trade-offs:**
- Dual maintenance: both files must stay synchronized in every other aspect (hardcoded
  token, INSERT without ON CONFLICT, etc.). Mitigation: documented convention that they
  only differ on the `const LIMITE = …;` line.
- An external reviewer might interpret threshold 150 as "the bot no longer has the
  antipattern". Mitigation: this ADR is explicitly referenced in the thesis's methodology
  section and in the as-is's technical notes.
- The qualitative demonstration of REG-002 requires an additional manual run in PHASE 5
  not covered by the automated pipeline.

---

## Relationship to the micro-framework

- **REG-002 (idempotency / state traceability):** the as-is flow violates the rule by
  keeping rate-limit state in `$getWorkflowStaticData('global')` — non-distributed state,
  not persisted across restarts. The violation exists in both versions regardless of
  `LIMITE`'s value.
- **Experimental methodology (outside the REG-* catalog):** this ADR documents a
  study-internal-validity decision, not an architectural micro-framework decision. It is
  recorded as an ADR because it affects the reproducibility and interpretation of results.
- **Cross-references:**
  - `casos-de-estudio/bot/as-is/notas-tecnicas.md` §REG-002
  - `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` (change-log CR-ASIS-03)
  - `docs/protocolo-evidencias.md` §5 (run-logs)
