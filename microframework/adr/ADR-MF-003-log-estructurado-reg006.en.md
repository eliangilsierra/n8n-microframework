> 🌐 **Language / Idioma:** English · [Español](ADR-MF-003-log-estructurado-reg006.md)

# ADR-MF-003 — Structured JSON log per stage (REG-006)

**Level:** Micro-framework (applies to all E1–E4 stages)
**Date:** 2026-05-01
**Status:** Accepted
**Quality attribute:** Operability / Monitorability (ISO/IEC 25010)
**Related rules:** REG-006, REC-004

---

## Context

n8n's execution history has three critical limitations for observability:

1. **Not programmatically queryable:** there is no API to list executions or filter by
   field. The query requires manually opening the n8n UI.
2. **Does not allow computing per-segment latency:** the history shows total duration, but
   not each node's duration with millisecond resolution correlated by `run_id`.
3. **Not guaranteed persistent:** n8n's volume can be lost on an environment restart.
   Measurement data must not depend on the history.

The only observability mechanism external to n8n's history and available with no
additional dependencies is the **container's stdout**, accessible with
`docker compose logs n8n`.

The micro-framework must define what to emit, when, and with which minimum fields so that
stdout logs are sufficient to diagnose failures and compute latency metrics with no
external tools.

---

## Decision

Every stage (E1, E2, E3, E4) emits exactly one `console.log(JSON.stringify({...}))` at the
start or end of its execution, with the minimum fields defined in
`microframework/guia-observabilidad.md`.

### Format per stage

**E1 — Validation:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E1_validacion',
  status: valido ? 'ok' : 'fail',
  errores: errores,
  n_errores: errores.length,
  start_ts
}));
```

**E2 — Domain:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E2_dominio',
  status: 'ok',
  resultado_clave: analisis.nivel || analisis.categoria,
  regla_aplicada: analisis.regla_id,
  e2_start,
  e2_end,
  duracion_ms: new Date(e2_end) - new Date(e2_start)
}));
```

**E3 — Adapters:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E3_adaptador',
  status: 'ok',
  idempotency_key,
  registro_id: resultado.id,
  e3_start,
  e3_end,
  duracion_ms: new Date(e3_end) - new Date(e3_start)
}));
```

**E4 — Output:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E4_notificacion',
  status: notificacion_enviada ? 'ok' : 'skip',
  notificacion_enviada,
  nivel: analisis.nivel,
  e4_end,
  duracion_total_ms: new Date(e4_end) - new Date(start_ts)
}));
```

### Operational query

```bash
# All logs for a specific execution:
docker compose logs n8n | grep '"run_id":"RUN-BOT-..."'

# All failures in E1:
docker compose logs n8n | grep '"etapa":"E1_validacion"' | grep '"status":"fail"'

# E3 latency over the last 100 logs:
docker compose logs n8n --tail=200 | grep '"etapa":"E3_adaptador"' | \
  node -e "const lines=require('fs').readFileSync('/dev/stdin','utf8').split('\n').filter(Boolean); \
           lines.forEach(l => { try { const d=JSON.parse(l.split('INFO')[1]||l); \
           if(d.duracion_ms) console.log(d.duracion_ms); } catch(e){} })"
```

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| External APM (OpenTelemetry, Datadog) | Infrastructure dependency outside the project's scope |
| n8n built-in execution data | Proprietary, not programmatically exportable, not persistent |
| `console.error()` for failures | Would mix the stream with n8n's internal Node.js errors; `console.log` unifies everything on stdout and eases grepping |
| Logging to a database (`logs` table) | Requires an additional Postgres node per stage — structural overhead; stdout is sufficient for the project's scope |

---

## Consequences

**Positive:**
- Per-segment latencies computable with `grep` + `jq` or the `analizar_runlogs.py` script.
- MTTD (Mean Time To Detect) computable: the protocol in `medicion/protocolo-mttd.md` uses only
  `docker compose logs n8n` to diagnose failures.
- The `run_id` field in every log allows correlating all stages of an execution without
  opening n8n's history.
- No external dependencies: works with standard Docker + n8n.

**Negative:**
- JSON serialization overhead per execution (~0.5–1ms per `JSON.stringify`). Completely
  negligible compared to the diagnostic benefit.
- stdout logs are not persistent if the container stops without log persistence. For the
  project's scope (local lab), this is acceptable.
- Log volume can grow quickly in high-throughput environments. Mitigation: rotate logs with
  `docker compose logs --since 1h` or configure a log driver.

---

## Verification criterion (REG-006)

```bash
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be
# REG-006: ✓ CUMPLE — if every subflow has console.log(JSON.stringify(...)) with minimum fields
```

The script verifies that every Code node's `jsCode` in every subflow contains at least one
`console.log(JSON.stringify(` with the `run_id` and `etapa` fields.
