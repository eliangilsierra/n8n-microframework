> 🌐 **Language / Idioma:** English · [Español](ADR-008-normalizacion-e1.md)

# ADR-008 — Field normalization in E1 before passing to the domain

**Date:** 2026-05-01
**Status:** Implemented 2026-05-02
**Quality attribute:** Reliability / Maturity + Maintainability / Modularity (ISO/IEC 25010)
**Related rules:** REC-001, REG-005
**Related ADR:** IoT ADR-007 (timestamp authority)

---

## Context

The micro-framework's REC-001 recommends normalizing input data in E1 before passing it to
E2. For the IoT case, normalization has a direct implication for **idempotency
correctness** (REG-005): if two sends of the same physical data differ in format (22.5 vs
22.50 vs 22.500), the idempotency key could differ even though they represent the same
measurement.

The question is: which fields to normalize, with what precision, and at what point within
E1?

---

## Decision

Normalization happens in E1, **after** validation and **before** building the output. If
validation fails, no normalization occurs (returns `{ valido: false, lectura: null }`).

### Fields and normalization rules

| Field | Rule | Justification |
|-------|-------|---------------|
| `temperature` | `Math.round(x * 10) / 10` (1 decimal) | Standard sensor precision; avoids format differences in the idempotency key |
| `humidity` | `Math.round(x * 10) / 10` (1 decimal) | Same justification as temperature |
| `co2` | `Math.round(x)` (integer) | CO2 sensors report integer values; decimals are conversion artifacts |
| `timestamp` | `new Date(x).toISOString()` (ISO 8601 UTC) | Normalizes formats "2026-05-01 10:00" → "2026-05-01T10:00:00.000Z" |
| `location` | `.trim().toLowerCase()` | Prevents "Sala A" and "sala a" from being treated as different sensors |
| `sensor_id` | `.trim()` | Accidental spaces in the ID could generate incorrect idempotency keys |

### Implementation in E1

```javascript
// Only runs if errores.length === 0
const lectura = {
  sensor_id:   payload.sensor_id.trim(),
  temperature: Math.round(payload.temperature * 10) / 10,
  humidity:    Math.round(payload.humidity * 10) / 10,
  co2:         Math.round(payload.co2),
  timestamp:   new Date(payload.timestamp).toISOString(),
  location:    (payload.location || '').trim().toLowerCase()
};
```

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| Normalize in E2 | E2 is the domain stage — it must not transform data, only apply rules. Normalization is E1's responsibility (clean input to the system) |
| Don't normalize (pass the value as received) | `22.5` and `22.50` in `temperature` would generate different idempotency_keys for the same physical measurement |
| Normalize with higher precision (2 decimals) | Would increase noise: variations in the last decimal of low-precision sensors would create "different" readings that are actually the same |
| Normalize only if the type is correct | Type validation already guarantees the field is a number before normalizing |

---

## Consequences

**Positive:**
- The `{sensor_id}_{timestamp}` idempotency key is stable against format variations in
  numeric fields.
- E2 receives typed data with uniform precision — threshold comparisons have no
  floating-point artifacts.
- Lowercase `location` allows grouping readings with no case distinction.

**Negative:**
- Rounding to 1 decimal can introduce a maximum error of 0.05°C in temperature. For the
  case's thresholds (35°C critical, 28°C warning), this error is irrelevant.
- JavaScript's `Math.round` uses "round half to even" in some edge cases. For the
  ambient-temperature value range, there are no known problematic cases.

---

## Relationship to REG-005 (idempotency)

Normalization is a **necessary precondition** for idempotency to work correctly. Without
normalization:

```
Send 1:   temperature=22.50 → key="sensor1_..._22.5"   (truncated float)
Send 2:   temperature=22.5  → key="sensor1_..._22.5"   (identical ✓)
Send 3:   temperature=22.500 → key="sensor1_..._22.5"  (identical ✓)
```

With normalization before building the key, all three sends generate the same key.

---

## Verification criterion

1. Send a reading with `temperature=22.50` and then `temperature=22.5` (same timestamp) →
   1 record in the DB (REG-005)
2. `location="Sala A"` in the DB record → `"sala a"` (lowercase)
3. `timestamp="2026-05-01 10:00:00"` in the DB record → `"2026-05-01T10:00:00.000Z"`
   (ISO 8601)
