> 🌐 **Language / Idioma:** English · [Español](guia-observabilidad.md)

# Minimum observability guide

DevSecOps Pillar 3 of the micro-framework (thesis proposal §4.3: "Operational Resilience —
instrumentation of structured logs, retry, and idempotency"). This guide defines the
minimum event contract that every micro-framework flow must emit to enable measurement,
diagnosis, and ATAM evaluation.

Associated mandatory rule: **REG-006** (structured JSON log per stage).

---

## Principle

Each stage (E1, E2, E3, E4) emits a `console.log(JSON.stringify({...}))` when it closes out
its responsibility. The format is single-line JSON so it can be queried with `grep`, `jq`,
or CloudWatch Insights without additional parsing.

n8n's execution history is **not** the observability source: it is a visual complement, not
a measurement system.

---

## Fields common to every stage

| Field | Type | Description |
|---|---|---|
| `run_id` | string | Unique identifier generated in E1 (REG-002). Format: `RUN-{CASE}-{timestamp}-{random6}` |
| `etapa` | string | `E1_validacion`, `E2_dominio`, `E3_adaptador`, `E4_salida` |
| `status` | string | `ok`, `fail`, `skip` |
| `caso` | string | `bot` or `iot` |
| `start_ts` | ISO 8601 | Stage start timestamp |
| `end_ts` | ISO 8601 | Stage end timestamp |
| `duracion_ms` | number | `end_ts - start_ts` in milliseconds |

(Field names themselves — `run_id`, `etapa`, `status`, `caso`, `start_ts`, `end_ts`,
`duracion_ms` — are literal JSON keys used throughout the actual flows and logs, and must
not be translated: doing so would break consistency with the exported n8n JSON and the CSV
evidence files.)

---

## Events per stage

### E1 — Validation

```json
{
  "run_id": "RUN-BOT-20260417T143025-a1b2c3",
  "etapa": "E1_validacion",
  "status": "ok",
  "caso": "bot",
  "errores": [],
  "campos_validados": ["message", "user_id", "token"],
  "start_ts": "2026-04-17T14:30:25.123Z",
  "end_ts": "2026-04-17T14:30:25.128Z",
  "duracion_ms": 5
}
```

Additional mandatory field: `errores: string[]` (empty if `status === "ok"`).

### E2 — Domain

```json
{
  "run_id": "RUN-IOT-20260417T143030-d4e5f6",
  "etapa": "E2_dominio",
  "status": "ok",
  "caso": "iot",
  "resultado_clave": "critico",
  "regla_aplicada": "R003",
  "start_ts": "2026-04-17T14:30:30.200Z",
  "end_ts": "2026-04-17T14:30:30.212Z",
  "duracion_ms": 12
}
```

Additional mandatory fields: `resultado_clave` (domain decision, e.g. `nivel`, `accion`) and
`regla_aplicada` (rule ID per REC-002).

### E3 — Adapter

```json
{
  "run_id": "RUN-IOT-20260417T143030-d4e5f6",
  "etapa": "E3_adaptador",
  "status": "ok",
  "caso": "iot",
  "idempotency_key": "sensor-42-20260417T143030",
  "registro_id": "9287",
  "reintentos": 0,
  "start_ts": "2026-04-17T14:30:30.250Z",
  "end_ts": "2026-04-17T14:30:30.295Z",
  "duracion_ms": 45
}
```

Additional mandatory fields: `idempotency_key` (REG-005), `registro_id` (ID returned by the
external system), and `reintentos` (number of retries actually used).

### E4 — Output

```json
{
  "run_id": "RUN-IOT-20260417T143030-d4e5f6",
  "etapa": "E4_salida",
  "status": "ok",
  "caso": "iot",
  "notificacion_enviada": true,
  "canal": "critico",
  "nivel": "critico",
  "start_ts": "2026-04-17T14:30:30.310Z",
  "end_ts": "2026-04-17T14:30:30.340Z",
  "duracion_ms": 30,
  "duracion_total_ms": 215
}
```

Additional mandatory fields: `notificacion_enviada` (bool) and `duracion_total_ms`
(difference between E4's `end_ts` and E1's `start_ts`).

For E4 inline in the orchestrator (see the Bot case's ADR-002), the log is emitted from a
Code node right before `Respond to Webhook`.

---

## Derivable metrics

The following evidence-protocol metrics are computed from the fields above:

| Thesis proposal metric | Derivation |
|---|---|
| Per-segment latency | `duracion_ms` per stage |
| End-to-end latency | `duracion_total_ms` from the E4 log |
| Failure rate | count(`status=fail`) / count(total) |
| MTTD (Mean Time To Detect) | delta between the first `status=fail` and the dashboard report |
| Retry efficiency | sum(`reintentos`) / count(E3) |
| `run_id` coverage | count(events with `run_id`) / count(total) — must be 100% (REG-002) |

See `../medicion/proyecto-overview.en.md`, section "Measurement dimensions", for the
thresholds and goals from the thesis proposal.

---

## Implementation pattern (Code node)

```javascript
const start = new Date().toISOString();
// ... stage logic ...
const end = new Date().toISOString();

const logEvent = {
  run_id: $input.first().json.run_id,
  etapa: 'E2_dominio',
  status: 'ok',
  caso: 'iot',
  resultado_clave: nivel,
  regla_aplicada: 'R003',
  start_ts: start,
  end_ts: end,
  duracion_ms: new Date(end) - new Date(start)
};
console.log(JSON.stringify(logEvent));

return [{ json: { ...$input.first().json, ...resultadoDominio, logEvent } }];
```

---

## Prohibitions

- **Do not log** `token`, `password`, `api_key` values, or any field marked as sensitive.
  The DevSecOps checklist verifies this (item 2).
- **Do not log** the full input payload if it contains PII. Log only the names of
  validated fields (`campos_validados: string[]`), not their values.
- **Do not use** `console.error` or `console.warn`: the single format is `console.log` with
  JSON for ingestion uniformity.

---

## Relationship to AWS (PHASE 8)

Logs emitted via `console.log` in n8n are captured from the container's stdout and shipped
to CloudWatch Logs. The query is structured as:

```
fields @timestamp, run_id, etapa, status, duracion_ms
| filter caso = "iot" and status = "fail"
| stats count() by etapa
```

The PHASE 8 AWS design includes this pipeline as part of the Operability/Monitorability
attributes of the ISO/IEC 25010 model.
