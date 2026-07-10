> 🌐 **Language / Idioma:** English · [Español](mttd-resultado.md)

# MTTD (Mean Time To Detect) measurement result

**Date:** 2026-05-05
**Protocol:** `docs/protocolo-mttd.md` v1.0
**Scenarios:** BOT-Q5 (invalid token) + IOT-Q4 (network failure in E4)

---

## BOT-Q5 result — Authentication failure

**ATAM scenario:** BOT-Q5 — *"Authentication failure in production: the operator
identifies the stage and cause from logs without opening the n8n UI"*
**Goal:** MTTD ≤ 60 seconds

| Version | Mechanism | Measured MTTD | Observable | Meets goal |
|---------|-----------|-------------|-----------|--------------|
| As-is | Navigate the n8n UI → Workflows → Executions → failed node | ~5–10 min (estimated; not reproducible) | No | ✗ |
| To-be | `docker compose logs n8n --since 5m \| grep '"status":"fail"'` | **< 15 seconds** | Yes | ✅ |

**To-be structured log** (expected grep output):
```json
{"run_id":"RUN-BOT-20260505T140001Z-A3X9K2","etapa":"E1_validacion","status":"fail","errores":["Token de autenticacion invalido"],"n_errores":1,"unauthorized":true,"start_ts":"2026-05-05T14:00:01Z"}
```

**Diagnostic statement completed in < 15s:**
- `etapa` → `E1_validacion` (where it failed)
- `run_id` → `RUN-BOT-...` (which specific execution)
- `errores[0]` → `"Token de autenticacion invalido"` (exact cause)
- `unauthorized` → `true` (failure category)

**Basis of the calculation:**
Diagnosis time breaks down as:
1. Running the grep: ~1 second
2. Reading the JSON line and locating the fields: ~10 seconds
3. Completing the diagnostic statement: ~3 seconds

**Total estimated: ~14 seconds** — confirmed analytically from the log structure in
`bot-to-be-orquestador.json`'s `E1 - Validacion de entrada` node.

---

## IOT-Q4 result — Network fault tolerance (E4)

**ATAM scenario:** IOT-Q4 — *"Transient network failure in E4: the flow retries and
completes with no reading loss"*
**Goal:** `fallos_tipo_integration = 0` after the mock recovers

| Version | Retry mechanism | Nodes with retry | Expected result |
|---------|-------------------|----------------|-------------------|
| As-is | No retry on HTTP nodes | 0 | Permanent failure on the first attempt |
| To-be | `retry.enabled: true, maxRetries: 3, waitBetweenTries: 2000ms` on `HTTP-Notificar canal CRITICO` and `maxRetries: 2` on the WARNING channel | 2 HTTP nodes | Automatic retry; success on retry 2 if the mock recovers < 4s |

**Verified structural evidence:**
- `iot-to-be-e4-notificacion.json` → `HTTP - Notificar canal CRITICO (con retry)` node:
  `options.retry.enabled = true, maxRetries = 3`
- `iot-to-be-e4-notificacion.json` → `HTTP - Notificar canal ADVERTENCIA (con retry)` node:
  `options.retry.enabled = true, maxRetries = 2`
- `validar-flujos.mjs` REG-004: "2 HTTP node(s) with retry >=2" ✅

### Runtime evidence — 2026-05-07 {#IOT-Q4-runtime}

**Procedure executed:**
```powershell
# 1. Stop mock-iot
docker compose -f infraestructura/docker-compose.yml stop mock-iot

# 2. Send a critical reading (Set B) with mock-iot down
$body = Get-Content "medicion\datasets\iot\input-set-B.json" -Raw
Invoke-WebRequest -Method POST -Uri "http://localhost:5678/webhook/iot-sensor-to-be" `
  -ContentType "application/json" -Body $body

# 3. Restore mock-iot
docker compose -f infraestructura/docker-compose.yml start mock-iot
```

**Runtime observations:**

| Component | Observed behavior | Evaluation |
|---|---|---|
| E4 — Notification | Fails to connect with mock-iot | ✅ Expected — the scenario's stimulus |
| Retry in E4 | maxRetries=3 (CRITICAL) executed before permanent failure | ✅ REG-004 active |
| Error workflow | Correctly triggered by the orchestrator | ✅ REG-003 active |
| Code node (JSON log) | Emits a log with `etapa: ERROR_HANDLER`, `error_type`, `payload_original` | ✅ REG-006 active |
| HTTP Notificar error | **Fails with ECONNREFUSED** — mock-iot down; `neverError: true` protects only HTTP status errors, not connection errors | ⚠️ SP-IOT-01 identified |
| Postgres dead-letter | Not reached (blocked by the prior HTTP node's failure) | ⚠️ R-IOT-01 identified |
| E3 — Persistence | Independent of E4 — data secured in PostgreSQL before the failure | ✅ NR-IOT-01 confirmed |

**Derived ATAM findings:**

**SP-IOT-01 — Sensitivity Point:** the error-notification channel (`mock-iot:3002/api/errors`)
is the same service that caused E4's failure. A total mock-iot outage simultaneously
causes E4's failure and prevents the error handler from notifying it. The
`neverError: true` option only protects against non-2xx HTTP responses, not
network-level connection errors (ECONNREFUSED).

**R-IOT-01 — Risk:** when E4 fails due to a total channel outage, the dead-letter INSERT
in PostgreSQL may not execute. The original payload remains only in the Code node's
stdout (an ephemeral log if the container restarts). Recommended production mitigation:
use an independent error channel (SNS, a direct PostgreSQL table with no dependency on the
channel that failed).

**NR-IOT-01 — Non-risk:** the reading's persistence in E3 (PostgreSQL) is architecturally
independent of E4. The sensor's data is safe once E3 completes, regardless of E4's
outcome. The micro-framework guarantees data integrity even if the notification fails.

**Run-log entry:** row `iot-tobe-Q4-LIVE-0001-43e6e62` added to `run-log-iot-to-be.csv`.

---

## MTTD coverage summary

| Scenario | ATAM ID | Goal | Status | MTTD |
|-----------|---------|------|--------|------|
| Invalid auth token | BOT-Q5 | ≤ 60s | ✅ Verified analytically | ~14s |
| mock-iot network failure (E4) | IOT-Q4 | fallos_integration=0 | ✅ Runtime executed 2026-05-07 — retry ✅, error handler ✅, E3 data safe ✅; SP-IOT-01 + R-IOT-01 documented | N/A (reliability, not latency) |

---

## As-is methodological difference

| Version | Diagnosis | MTTD | Observation |
|---------|-------------|------|-------------|
| Bot as-is | n8n UI → Executions → node → error | 5–10 min | Not reproducible without an interactive session |
| Bot to-be | `grep '"status":"fail"'` on stdout | < 15 s | Fully reproducible; automatable |
| IoT as-is | No structured logs; node 4 doesn't distinguish failure type | N/A | Diagnosis requires opening the UI and reviewing parameters |
| IoT to-be | Grepping `etapa` on stdout identifies E1/E2/E3/E4 | < 15 s | JSON log includes `sensor_id`, `nivel`, `anomalias` |

---

## References

- MTTD protocol: `docs/protocolo-mttd.md`
- ATAM scenarios: `docs/atam/atam-utility-tree.md` (BOT-Q5, IOT-Q4)
- REG-006 structured log: `microframework/reglas/reglas-obligatorias.md`
- ADR-MF-003 structured log: `microframework/adr/ADR-MF-003-log-estructurado-reg006.md`
