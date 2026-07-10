> 🌐 **Language / Idioma:** English · [Español](ADR-006-validacion-schema-e1.md)

# ADR-006 — Schema validation in E1: inline JavaScript with per-field errors

**Date:** 2026-05-01
**Status:** Implemented 2026-05-02
**Quality attribute:** Functional suitability / Correctness + Maintainability / Modularity (ISO/IEC 25010)
**Related rules:** REG-009, E1 metamodel
**ATAM scenario:** related IOT-Q2 (validation as a precondition for correct HTTP codes)

---

## Context

E1 must validate the sensor payload before passing data to E2. The as-is flow has
validation fragmented across two nodes (`Validar Campos` and `Validar Tipos`) that:

1. Only check field presence, not physically possible ranges.
2. Always respond 200 OK even when validation fails (REG-009 violated).
3. Don't produce a structured per-field error list.

The micro-framework requires E1 to return `{ valido: boolean, errores: string[] }` and
for the orchestrator to use that result to respond with 400/422 if `valido === false`.

The question is: which validation mechanism should E1's Code node use?

---

## Decision

E1 uses **inline JavaScript in a Code node** to validate the payload, with the following
logic organized into three levels:

### Level 1 — Required fields

```javascript
const CAMPOS_REQUERIDOS = ['sensor_id', 'temperature', 'humidity', 'co2', 'timestamp'];
const errores = [];

for (const campo of CAMPOS_REQUERIDOS) {
  if (payload[campo] === undefined || payload[campo] === null || payload[campo] === '') {
    errores.push(`Campo requerido ausente: ${campo}`);
  }
}
```

### Level 2 — Data types

```javascript
if (typeof payload.sensor_id !== 'string') errores.push('sensor_id debe ser string');
if (typeof payload.temperature !== 'number') errores.push('temperature debe ser número');
if (typeof payload.humidity !== 'number') errores.push('humidity debe ser número');
if (!Number.isInteger(payload.co2)) errores.push('co2 debe ser entero');
```

### Level 3 — Physically possible ranges

Canonical ranges (inconsistency resolution detected 2026-05-02):
- `temperature`: `-50` to `125°C` (min. widened to -50 to cover cold-storage
  applications; max. 125°C per IEC 60068 for solid-state sensors)
- `humidity`: `0–100%`
- `co2`: `0–5000 ppm`

The original ADR specified -40/125°C. E1's implementation used -50/100°C. The
`iot-webhook-input.schema.json` schema used -50/150°C. Canonical value adopted:
**-50/125°C**, aligning E1, the webhook schema, and this ADR. The 125°C value is the
operational limit for NTC/PT100-type temperature sensors (IEC 60068-2-2).

```javascript
const RANGOS = {
  temperature: { min: -50, max: 125, unidad: '°C' },
  humidity:    { min: 0,   max: 100, unidad: '%'  },
  co2:         { min: 0,   max: 5000, unidad: 'ppm' }
};

for (const [campo, rango] of Object.entries(RANGOS)) {
  if (payload[campo] < rango.min || payload[campo] > rango.max) {
    errores.push(`${campo} fuera de rango físico: ${payload[campo]} (válido: ${rango.min}–${rango.max} ${rango.unidad})`);
  }
}
```

### E1 output (satisfies the `iot-e1-output.schema.json` contract)

```javascript
return [{ json: {
  valido: errores.length === 0,
  errores,
  run_id,
  start_ts,
  lectura: errores.length === 0 ? {
    sensor_id: payload.sensor_id.trim(),
    temperature: Math.round(payload.temperature * 10) / 10,
    humidity: Math.round(payload.humidity * 10) / 10,
    co2: Math.round(payload.co2),
    timestamp: new Date(payload.timestamp).toISOString(),
    location: (payload.location || '').trim().toLowerCase()
  } : null
}}];
```

Normalization (round, trim, toISOString) happens only if validation passes, satisfying
REC-001.

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| n8n's native JSON Schema node | Doesn't produce a structured per-field error list with descriptive messages; doesn't support range validation (only types); the output doesn't follow the `{valido, errores}` contract |
| Ajv (npm library) | Unavailable in standard n8n Code nodes without installing npm packages — outside LC/NC scope |
| Presence-only validation (no ranges) | A sensor with temperature=999°C would pass validation and contaminate E2 with physically impossible data |
| Split into multiple Code nodes (as in the as-is) | Fragments validation across separate nodes that share no state — harder to maintain and audit |

---

## Consequences

**Positive:**
- Specific per-field error messages: the client (sensor) knows exactly what to fix without
  inspecting logs.
- Physical ranges are centralized in `RANGOS` — CR3 (adding `co2 ≥ 0` validation) touches
  only this constant (0 additional nodes, as measured by the as-is's cr-log).
- The output contract is exactly what `iot-e1-output.schema.json` defines.

**Negative:**
- JavaScript's type validation has edge cases: `typeof NaN === 'number'` is `true`.
  Mitigation: add an `isNaN` check for numeric fields within the ranges.
- If more complex validation is needed (JSON Schema with $ref), this approach doesn't
  scale. Declared as an acceptable limitation for the case study's scope.

---

## Verification criterion

1. Input Set C (missing fields) → HTTP 422, `errores` with a non-empty list (REG-009)
2. Input Set D (invalid types) → HTTP 422, descriptive per-field message
3. Input Set with temperature=999 → HTTP 422, message "temperature fuera de rango físico"
4. `validar-flujos.mjs --caso iot --estado to-be` → E1 contains required-field validation
