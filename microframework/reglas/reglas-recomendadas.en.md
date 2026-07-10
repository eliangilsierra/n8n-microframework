> 🌐 **Language / Idioma:** English · [Español](reglas-recomendadas.md)

# Micro-framework recommended rules

These rules are not mandatory but improve operational quality and traceability. Compliance
is evaluated in the DevSecOps checklist and contributes to the ATAM score.

---

| ID | Rule | Benefit |
|----|-------|-----------|
| REC-001 | Normalize input data in E1 (rounding, string format) | Reduces inconsistencies in E2 and E3; avoids duplicates from format variants |
| REC-002 | Document business rules with identifiers in E2 (R001, R002...) | Facilitates traceability in ATAM and ADRs; allows citing specific rules as evidence |
| REC-003 | Include the `Idempotency-Key` header in HTTP Request when the service supports it | Native end-to-end support if the external service implements idempotency |
| REC-004 | Capture `start_ts` and `end_ts` per stage to measure segment latency | Allows computing per-segment latency without external tools |
| REC-005 | Include `location` or sensor/user context in logs | Facilitates diagnosis without opening n8n's execution history |
| REC-006 | Use `saveDataSuccessExecution: "all"` in orchestrator settings during evaluation | Allows reviewing complete historical executions during the measurement phase |

---

## Rule detail

### REC-001 — Normalize in E1

Before passing data to E2, normalize:
- Numbers: `Math.round(value * 10) / 10` for temperature and humidity
- Strings: `.trim().toLowerCase()` where applicable
- Timestamps: convert to ISO 8601 if received in another format

**Bot example:** If `message` arrives with leading/trailing spaces, `.trim()` it in E1
before sending to E2 so classification rules don't fail.

---

### REC-002 — Rule identifiers in E2

Define rules as objects with an `id`:

```javascript
const REGLAS = [
  { id: 'R001', condicion: (m) => m.includes('urgente'), categoria: 'incidente', prioridad: 'alta' },
  { id: 'R002', condicion: (m) => m.includes('factura'), categoria: 'facturacion', prioridad: 'media' },
  // ...
  { id: 'DEFAULT', condicion: () => true, categoria: 'general', prioridad: 'baja' }
];
```

Include `regla_aplicada: regla.id` in the output and in the E2 log.

---

### REC-003 — Idempotency-Key header on HTTP

In the E3 HTTP Request node, add the header:

```
Idempotency-Key: {{ $json.idempotency_key }}
```

Only has an effect if the external service implements it. No cost if it doesn't.

---

### REC-004 — Per-segment latency

Capture timestamps at the start and end of every stage:

```javascript
const e2_start = new Date().toISOString();
// ... logic ...
const e2_end = new Date().toISOString();
const duracion_ms = new Date(e2_end) - new Date(e2_start);
```

Propagate `e2_start`, `e2_end`, `duracion_ms` in the output to feed the run-log.

---

### REC-005 — Context in logs

Add context fields to the structured log:

```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E2_dominio_iot',
  status: 'ok',
  sensor_id: lectura.sensor_id,    // ← context
  location: lectura.location,       // ← context
  nivel,
  duracion_ms
}));
```

---

### REC-006 — saveDataSuccessExecution during measurement

In the orchestrator flow's JSON, configure:

```json
"settings": {
  "saveDataSuccessExecution": "all",
  "saveManualExecutions": true
}
```

Revert to `"none"` in production environments to avoid saturating n8n's database.
