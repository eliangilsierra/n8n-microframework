> 🌐 **Language / Idioma:** English · [Español](metricas-derivadas.md)

# Derived metrics — Phases 5 and 6

**Date:** 2026-05-05
**Sources:** run-logs, cr-logs, flow JSONs, validar-flujos.mjs
**Reference:** `docs/context/proyecto-overview.md` §Evaluation metrics

---

## Delivery dimension — Change Request impact

### Nodes touched per CR (main metric)

| CR | Type | Bot as-is | Bot to-be | Bot delta | IoT as-is | IoT to-be | IoT delta |
|----|------|-----------|-----------|-----------|-----------|-----------|-----------|
| CR1 | Business rule | 8 | 1 | −87.5% | 6 | 1 | −83.3% |
| CR2 | Integration | 5 | 1 | −80.0% | 4 | 1 | −75.0% |
| CR3 | Validation/error | 3 | 1 | −66.7% | 3 | 0 | −100.0% |
| **Average** | | **5.3** | **1.0** | **−81.4%** | **4.3** | **0.7** | **−84.4%** |

**Indicative goal:** ≥ 20% reduction in to-be vs as-is ✅ Substantially exceeded (Bot −81%, IoT −84%)

### Time per CR (minutes)

| CR | Bot as-is | Bot to-be | Bot Δ time | IoT as-is | IoT to-be | IoT Δ time |
|----|-----------|-----------|-------------|-----------|-----------|-------------|
| CR1 | 37 min | 8 min | −78% | 35 min | 9 min | −74% |
| CR2 | 33 min | 7 min | −79% | 27 min | 6 min | −78% |
| CR3 | 28 min | 5 min | −82% | 22 min | 0.5 min | −98% |
| **Average** | **32.7 min** | **6.7 min** | **−79%** | **28.0 min** | **5.2 min** | **−81%** |

### Attempts until successful verification

| CR | Bot as-is | Bot to-be | IoT as-is | IoT to-be |
|----|-----------|-----------|-----------|-----------|
| CR1 | 3 | 1 | 3 | 1 |
| CR2 | 2 | 1 | 2 | 1 |
| CR3 | 2 | 1 | 2 | 1 |
| **Total** | **7** | **3** | **7** | **3** |

### External dependencies touched

| CR | Bot as-is | Bot to-be | IoT as-is | IoT to-be |
|----|-----------|-----------|-----------|-----------|
| CR1 | 0 | 0 | 0 | 0 |
| CR2 | 1 | 1 | 1 | 1 |
| CR3 | 0 | 0 | 0 | 0 |
| **Total** | **1** | **1** | **1** | **1** |

*External dependencies don't decrease because CR2 requires an endpoint change by design —
independent of the architecture.*

---

## Operation dimension — Run-logs

### Failed executions

| Case | N as-is | Failures as-is | % as-is | N to-be | Failures to-be | % to-be | Δ%fail |
|------|---------|-------------|---------|---------|-------------|---------|--------|
| Bot | 2000 | 175 | 8.75% | 2000 | 111 | 5.55% | −36.6% ✅ |
| IoT | 2000 | 4 | 0.20% | 2000 | 11 | 0.55% | +175% ⚠️ |

**Bot:** ≥ 30% failure reduction ✅ (−36.6%). Indicative goal met.
**IoT:** expected increase — the to-be correctly validates (E1 rejects invalid inputs the
as-is accepted). The 11 to-be failures are correct rejections of invalid sets (D, E), not
regressions.

### p50 latency (canonical sets A and B)

| Case | Set | p50 as-is | p50 to-be | Δp50 | Interpretation |
|------|-----|-----------|-----------|------|----------------|
| Bot | A | 120 ms | 131 ms | +9% | Acceptable subflow overhead — eliminated the REG-002 rate limiter |
| Bot | B | 118 ms | 120 ms | +2% | Minimal overhead |
| Bot | C | 66 ms | 39 ms | −42% | To-be rejects in E1 with no E2/E3 invocation — faster |
| IoT | A | 78 ms | 171 ms | +119% | More stages in the E1→E2→E3→E4 pipeline vs the monolith |
| IoT | B | 78 ms | 182 ms | +134% | Same reason — n8n subflow overhead |
| IoT | C | 42 ms | 65 ms | +55% | E1 rejection in to-be vs a full pass (antipattern) in as-is |

**Note on IoT:** the +119% to +134% overhead is a consequence of adding 4 subflows
(E1–E4) where the as-is was monolithic. It's a documented maintainability vs latency
trade-off (IoT ADR-001). In production, the impact would be mitigated with clustered n8n
mode.

### JMeter micro-benchmark

**Status:** ⚠️ Pending — JMeter is not installed in the evaluation environment.

**Action:** install JMeter 5.6+ and run:
```bash
jmeter -n -t medicion/datasets/jmeter/bot-load-test.jmx -l medicion/datasets/jmeter/resultados/bot-jmeter-result.jtl
jmeter -n -t medicion/datasets/jmeter/iot-load-test.jmx -l medicion/datasets/jmeter/resultados/iot-jmeter-result.jtl
```

---

## Security dimension

### Secret exposure (0 = none, 1 = some)

| Case | Version | Secrets in the JSON | Result |
|------|---------|-----------------|-----------|
| Bot | As-is | Hardcoded token in node 6 (`rightValue`), api_key in node 8's header, const in node 9's jsCode, api-key in nodes 12/14 | **1 (violation)** |
| Bot | To-be | 0 literal secrets — token via `$env.BOT_API_TOKEN`, api-key via n8n credential | **0 ✅** |
| IoT | As-is | PostgreSQL credentials in the node's output (validar-flujos.mjs detects REG-001 in the iot-as-is template) | **1 (violation)** |
| IoT | To-be | 0 literal secrets — Postgres via the `"Postgres Local"` credential, API key via the `"Notificacion API Key"` credential | **0 ✅** |

**Source:** `validar-flujos.mjs` REG-001. Bot as-is: 0/4 (100% violation). Bot to-be: 100%
compliance.

### Code surface (Code nodes per version)

| Case | As-is Code nodes | To-be Code nodes | Δ |
|------|-----------------|-----------------|---|
| Bot | 2 (Validar Payload, Procesar Mensaje) | 5 (E1 orq., E2 dominio, E3 preparar, E3 log, error handler) | +3 |
| IoT | 1 (Calcular Nivel jsCode) | 8 (E1, E2, E3 preparar, E3 log, E4 inicio, E4 log-ok, E4 log-skip, error handler) | +7 |

*The increase in Code nodes is expected: the to-be centralizes logic in single-responsibility
Code nodes instead of distributing it across IF and Set nodes. Every Code node has a clear
responsibility (E1, E2, E3, E4) and a structured log.*

### Least privilege

| Verification | Status |
|-------------|--------|
| The Postgres credential uses the `n8n_user` user (not superuser) | ✅ Confirmed in docker-compose.yml |
| The ticket API Key credential is used only in E3 (not E1 or E2) | ✅ Verified in the Bot to-be JSON |
| The notification API Key credential is used only in E4 | ✅ Verified in the IoT to-be JSON |
| Error handlers have no access to business DB | ✅ The IoT error handler notifies the mock, doesn't access PostgreSQL directly |

---

## Traceability dimension

### ADR coverage

| Case | Documented ADRs | Identified decisions | Coverage |
|------|------------------|------------------------|-----------|
| Bot | ADR-001…008 (8) | 8 (separation, E4 omission, rate-limit, experimental, authentication, error workflow, E2 classification, to-be rate-limit) | 100% |
| IoT | ADR-001…008 (8) | 8 (pipeline, thresholds, idempotency, E4 routing, error workflow, E1 validation, timestamp authority, normalization) | 100% |
| Framework | ADR-MF-001…003 (3) | 3 (REG-001, REG-003, REG-006) | 100% |
| **Total** | **19** | **19** | **100%** ✅ |

### ATAM coverage

See `medicion/consolidado/atam-evidencia.md`:
- Bot: 5/6 = 83% ✅ (BOT-Q5 analytical ~14s)
- IoT: 6/6 = 100% ✅ (IOT-Q4 runtime 2026-05-07; IOT-Q5 analysis 2026-05-07)
- Total: 11/12 = 92% ✅

### To-be checklist coverage

| Case | Architecture | DevSecOps |
|------|-------------|-----------|
| Bot | 10/10 = 100% ✅ | 8/8 = 100% ✅ |
| IoT | 10/10 = 100% ✅ | 7/7 applicable = 100% ✅ (1 item N/A by design) |

**≥ 90% goal met** across every checklist.

### MTTD

See `medicion/consolidado/mttd-resultado.md`:
- Bot to-be: ~14 seconds (goal < 60s ✅)
- IoT to-be: structural evidence ✅; runtime pending

### Subflow reuse ratio

| Case | Total subflows | Invoked by >1 orchestrator | Ratio |
|------|----------------|------------------------------|-------|
| Bot | 2 (E2, E3) | 0 | 0% |
| IoT | 4 (E1, E2, E3, E4) | 0 | 0% |

**Observation:** the ratio is 0% because each case has a single orchestrator at this
project stage. The micro-framework is designed so that in future evolutions (e.g., a
bot-v2 reusing the same ticket-persistence E3) the ratio would increase. The architecture
allows this via the `Execute Workflow` ID mechanism. The 0% ratio is expected and doesn't
represent a violation of the project's goals (the thesis proposal sets no numeric goal
for this metric in Phase 6).

---

## Summary of indicative goals

| Goal | Value | Result |
|------|-------|-----------|
| Change impact: ≥ 20% reduction in nodes touched | Bot −81%, IoT −84% | ✅ Exceeded |
| Reliability: ≥ 30% reduction in failures | Bot −36.6% | ✅ Met |
| IoT reliability | +175% (intentional correction — as-is accepted everything) | N/A — antipattern resolved |
| ≥ 90% checklist compliance in to-be | Bot 100%, IoT 100% | ✅ Met |
| ATAM coverage ≥ 80% per case | Bot 83%, IoT 100% | ✅ Both met |

---

## IOT-Q5 — Differentiated urgency by alert level (2026-05-07)

**Script:** `medicion/analisis_iot_q5.py`
**Input:** `medicion/run-logs/iot/run-log-iot-to-be.csv` Set I (N=200)
**Levels computed with ADR-002 thresholds** (temp>35°C or co2>1200 → critical; hum>80% or
co2>800 → warning)

### Set I distribution

| Level | N | % |
|---|---|---|
| normal | 47 | 24% |
| warning | 60 | 30% |
| critical | 93 | 46% |

*Set I is "gradual_degradation" — temperature/CO2 values escalate progressively, which is
why critical dominates the second half of the set.*

### Latency by level (Python client)

| Level | N | p50 ms | p95 ms | min ms | max ms |
|---|---|---|---|---|---|
| normal | 47 | 157.6 | 174.4 | 139.6 | 179.5 |
| warning | 60 | 172.4 | 202.9 | 154.4 | 215.4 |
| **critical** | **93** | **183.2** | **222.0** | **158.6** | **30011.0** |

### Findings

**Structural differentiation confirmed:**
E4 implements two distinct HTTP branches based on `nivel` (IoT ADR-004): a CRITICAL
branch with `maxRetries=3` and a WARNING branch with `maxRetries=2`. Differentiated
routing exists and works.

**TP-IOT-01 — Tradeoff Point:** the CRITICAL branch has +10.8ms nominal latency overhead
compared to WARNING (183.2 vs 172.4 ms p50). The higher retry configuration (3 vs 2)
introduces minimal overhead when mock-iot responds with no errors. The 30011ms outlier
in critical confirms the retry mechanism **was triggered at runtime** for at least one
critical reading — direct evidence of REG-004 in action.

**Methodological interpretation:** IOT-Q5 evaluates level-differentiated routing, not
message-queue priority. In n8n, every webhook is synchronous and independent — there is
no process-level priority scheduler. "Differentiated urgency" is architectural: the
CRITICAL branch has greater resilience (more retries) at the cost of +10.8ms nominal
latency. This is consistent with the scenario's objective.

---

## References

- Run-logs: `medicion/run-logs/`
- CR-logs: `medicion/cr-logs/`
- Comparison: `medicion/consolidado/comparacion-2026-05-05.md`
- ATAM: `medicion/consolidado/atam-evidencia.md`
- MTTD: `medicion/consolidado/mttd-resultado.md`
- Static validation: `microframework/validacion/reportes/validacion-2026-05-06.md`
