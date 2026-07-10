> 🌐 **Language / Idioma:** English · [Español](ADR-002-umbrales-y-vocabulario.md)

# ADR-002: To-be domain thresholds and official vocabulary for the `nivel` field

**Status:** Accepted — Implemented 2026-05-02
**Date:** 2026-04-21
**Case:** iot
**Affected quality attribute:** Functional suitability, Maintainability, Traceability

---

## Context

The `iot-as-is.json` flow implements alert thresholds hardcoded and scattered across
several nodes, with the following values:

| Variable | as-is node | as-is threshold |
|----------|-----------|--------------|
| Critical temperature | 6 (`Temp Critica?`) | `> 35 °C` |
| High humidity | 7 (`Humedad Alta?`) | `> 85 %` |
| CO₂ warning | 8 (`Determinar Nivel`) | `> 1000 ppm` |
| CO₂ critical | 8 (`Determinar Nivel`) | `> 1500 ppm` |

Additionally, the as-is flow produces the value `nivel: 'advertencia'` (Spanish string)
when it detects an intermediate condition, while the `iot-e2-output.schema.json` and
`iot-e4-output.schema.json` contracts declare the enum as `["normal", "warning", "critico"]`
— an unintentional mix of English and Spanish.

Building the to-be and running the statistical comparison against the as-is requires:

1. **Fixing the to-be's final thresholds**, consistent with standard indoor air-quality
   recommendations (ASHRAE 62.1, ISO 7730) and thermal comfort standards.
2. **Choosing a single vocabulary** for the `nivel` field and aligning schemas, flows, and
   run-logs.

The decision directly affects the interpretation of PHASE 6's results (comparative
measurement) because a difference in alert rate between as-is and to-be could be
attributed to the micro-framework when it's actually due to a threshold change.

---

## Decision

### Official vocabulary for the `nivel` field

We adopt **`advertencia`** (Spanish) as the standard value for the intermediate level.
The official enum is:

```
nivel ∈ { "normal", "advertencia", "critico" }
```

All three values remain in Spanish to maintain consistency with the rest of the project
(documentation, code comments, technical notes — all in Spanish).

### To-be final thresholds

| Variable | as-is threshold | to-be threshold | Justification |
|----------|--------------|--------------|---------------|
| Critical temperature | `> 35 °C` | `> 35 °C` | Unchanged — an adequate operational value for a cold warehouse |
| Humidity warning | `> 85 %` | `> 80 %` | ISO 7730 recommends 30–70% for comfort; 80% is the lower warning threshold for condensation risk |
| CO₂ warning | `> 1000 ppm` | `> 800 ppm` | ASHRAE 62.1 recommends < 1000 ppm in occupied spaces; 800 ppm is the warning threshold with a safety margin |
| CO₂ critical | `> 1500 ppm` | `> 1200 ppm` | >1000 ppm indicates inadequate ventilation; 1200 ppm marks the critical limit before the cognitive-impairment level documented in the literature |

The thresholds are centralized in a **`UMBRALES` constant** in the E2 subflow
(`iot-to-be-e2-dominio`), satisfying REG-007 (isolated domain) and REC-001 (named
constants).

### Application scope

- **Contracts to update (decision triggered by this ADR):**
  - `microframework/contratos/iot-e2-output.schema.json` → `nivel` enum
  - `microframework/contratos/iot-e4-output.schema.json` → `nivel` enum
- **As-is flows:** not touched. `iot-as-is.json` continues to produce `'advertencia'`
  (which already matches the new enum), and the old as-is thresholds are preserved as
  part of the REG-007 antipattern (scattered values, different from the to-be's).
- **To-be flows:** built directly with the new vocabulary and thresholds (see IoT ADR-001
  for the E1–E4 structure).

---

## Alternatives considered

- **`warning` (English) vocabulary:** international standard in industrial IoT (MQTT, AWS
  IoT, Azure). Discarded: requires modifying the existing as-is to align it with the enum,
  introducing a change unrelated to the micro-framework; and breaks the rest of the
  project's language consistency (all documentation is in Spanish).

- **Keep the as-is thresholds in the to-be:** avoids any alert difference between versions
  attributable to thresholds, isolating the micro-framework's pure effect. Discarded: no
  measurable ATAM improvement in the "Functional suitability" attribute, and the as-is
  thresholds aren't aligned with standards (ASHRAE/ISO), which is additional evidence of
  the antipattern.

- **Mixed values `"normal" / "warning" / "critical"` (full English):** internal English
  consistency but incoherent with the rest of the project. Discarded.

- **Expanded enum with 4 levels (add `"info"`):** captures more granularity but doesn't
  correspond to any differentiated action in E4. Discarded per YAGNI.

---

## Consequences

**Positive:**
- Statistical comparability: in PHASE 6 the alert-rate difference between as-is and to-be
  is correctly attributed to the combination of (architecture + adjusted thresholds), both
  documented in this ADR + IoT ADR-001.
- To-be thresholds backed by standards (ASHRAE 62.1, ISO 7730) — solid academic defense
  before the advisor and evaluation committee.
- The `advertencia` vocabulary is already present in the as-is → change only in the
  schemas (2 files), not in the flows (0 files).
- REG-007 and REC-001 satisfied simultaneously by the "`UMBRALES` constant" pattern in the
  E2 subflow.
- **Fix applied (2026-05-02):** the initial implementation of `iot-to-be-e2-dominio.json`
  incorrectly used `'warning'` (English) instead of `'advertencia'` for the intermediate
  level, and CO2 values 1000/2000 instead of the ADR's 800/1200. Both discrepancies were
  fixed, aligning the implementation with this ADR. The static validator did not detect
  the vocabulary deviation; a specific lint was added to `validar-flujos.mjs` (see commit
  `[FASE-4] feat: validar-flujos — lint vocabulario`).

**Negative / trade-offs:**
- Comparing the `nivel` field between versions requires normalization in the analysis
  script (`medicion/analizar_runlogs.py`) because the as-is produces `'advertencia'` with
  the old thresholds and the to-be with new thresholds → different counts for the same
  payload. Mitigation: the ADR documents that the count difference is intentional.
- An external reviewer might question why `warning` was not adopted given its
  international use. Mitigation: this ADR explicitly documents the project's language
  decision.
- The threshold decision is specific to the simulated domain (a warehouse with
  environmental sensors). Changing the domain requires reviewing the thresholds with its
  own ADR.

---

## Relationship to the micro-framework

- **REG-007 (isolated domain):** satisfied by centralizing `UMBRALES` in the to-be's E2
  subflow. The as-is violates REG-007 by scattering thresholds across nodes 6, 7, and 8.
- **REC-001 (named constants):** the `UMBRALES` constant follows the recommended pattern
  `const UMBRALES = { TEMP_CRITICA: 35, HUMEDAD: 80, CO2_ADVERTENCIA: 800,
  CO2_CRITICO: 1200 }`.
- **REG-008 (integrations in E3/E4):** not directly affected, but E4's routing depends on
  the `nivel` value → coupling documented in IoT ADR-004 (E4 routing).
- **IoT ADR-001 (E1–E4 separation):** this ADR extends ADR-001 by fixing concrete values
  that were previously described only at a conceptual level.
- **Cross-references:**
  - `microframework/contratos/iot-e2-output.schema.json`
  - `microframework/contratos/iot-e4-output.schema.json`
  - `microframework/plantillas/iot-to-be-e2-dominio.json` (implements the constant)
  - `casos-de-estudio/iot/as-is/notas-tecnicas.md` §threshold inconsistency
