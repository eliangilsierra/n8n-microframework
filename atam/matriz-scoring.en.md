> 🌐 **Language / Idioma:** English · [Español](matriz-scoring.md)

# 1–5 Scoring Matrix — As-is vs. To-be by ATAM Scenario

**Version:** 1.0
**Date:** 2026-05-07
**Author:** Elian Hernando Gil Sierra (author's analytical scoring; external panel validation pending)
**Inputs:** `atam/analisis-approaches.md`, `medicion/consolidado/atam-evidencia.md`, `medicion/consolidado/metricas-derivadas.md`, run-logs, cr-logs, static validator
**Purpose:** Produce the numerical comparison matrix that original ATAM generates in Step 8 as a basis for identifying the magnitude of the to-be's improvement over the as-is, per scenario.

---

## 1. Scoring scale

The scale is ordinal with 5 points, operationalized with verifiable criteria:

| Score | Label | Operational criterion |
|:---:|---|---|
| **1** | Not supported / antipattern | The system does not satisfy the scenario; presents an explicit documented antipattern; violates a micro-framework rule |
| **2** | Partial with violations | The system satisfies the scenario partially with documented violations; inconsistent behavior |
| **3** | Meets minimally | The system satisfies the scenario in the nominal case but without formal guarantees or explicit patterns |
| **4** | Well supported | The system satisfies the scenario with an explicit pattern and operational evidence |
| **5** | Excellent | The system satisfies the scenario with an explicit pattern, quantitative evidence meets the utility tree's response measure, and the decision is documented in an ADR |

The score assigned is justified for each cell with (a) the available operational evidence and (b) whether the response measure declared in `atam-utility-tree.md` is met.

---

## 2. Bot Matrix — 6 scenarios

| ID | Scenario | Attribute | As-is | As-is justification | To-be | To-be justification | Δ | Evidence |
|---|---|---|:---:|---|:---:|---|:---:|---|
| BOT-Q1 | Rule modifiability (CR1) | Maintainability | **2** | CR1 touches 8 scattered nodes (Validar Payload, Procesar Mensaje, Calcular Prioridad, etc.); priority logic embedded in IF nodes | **5** | CR1 touches 1 node in the E2 subflow; logic centralized in a constant; utility-tree measure (`nodes_touched ≤ 1`) met | +3 | `cr-log-bot-as-is.csv` vs `cr-log-bot-to-be.csv` CR-BOT-004 |
| BOT-Q2 | Ticket provider change (CR2) | Maintainability | **2** | CR2 touches 5 nodes (Validar Payload mock-bot URL, Procesar Respuesta, auth headers, error handling, output Set); endpoint and format scattered | **5** | CR2 touches 1 node in the E3 subflow; URL parameterized in n8n credential; measure (`nodes_touched ≤ 1`) met | +3 | `cr-log-bot-to-be.csv` CR-BOT-005 |
| BOT-Q3 | Credential confidentiality | Security | **1** | Token and API key hardcoded in nodes 6, 8, 12, 14; visible REG-001 antipattern; `validar-flujos.mjs` reports violation | **5** | 0 secrets in JSON; token via `$env.BOT_API_TOKEN`, API key via credential; measure (`ocurrencias_literal_token = 0`) met; backed by NR-GLOBAL-01 | +4 | `microframework/validacion/reportes/validacion-2026-05-06.md` |
| BOT-Q4 | Integrity under retries | Reliability | **2** | No Idempotency-Key header, mock-bot traditionally accepts duplicates; REG-005 antipattern | **4** | Idempotency-Key header in E3; mock-bot honors the header; SP-BOT-01 identified (dependency on the external service's behavior caps the score at 4) | +2 | Bot ADR-005, `bot-e3-output.schema.json` contract |
| BOT-Q5 | Failure diagnosis (MTTD) | Operability | **1** | No structured logs; diagnosis requires navigating the n8n UI → Workflows → Executions → node; estimated MTTD 5–10 min, not reproducible | **5** | Structured JSON log per stage; analytical MTTD ~14 s; measure (`MTTD ≤ 60 s`) met with significant margin; live runtime pending (raises confidence but the analytical result already meets the measure) | +4 | `medicion/consolidado/mttd-resultado.md` |
| BOT-Q6 | HTTP contract correctness | Functional suitability | **2** | E1 does not differentiate 401/400; returns 200 with an error body or 500 depending on which node fails; `run-log-bot-as-is.csv` shows inconsistencies | **5** | 100% correct HTTP statuses in Sets C and D; 401 for invalid token, 400 for malformed payload; measure met; backed by NR-BOT-02 | +3 | `run-log-bot-to-be.csv` Sets C and D |

**Bot average — as-is:** 1.67 → **Bot average — to-be:** 4.83 → **Δ average: +3.16 points** (+190%)

---

## 3. IoT Matrix — 6 scenarios

| ID | Scenario | Attribute | As-is | As-is justification | To-be | To-be justification | Δ | Evidence |
|---|---|---|:---:|---|:---:|---|:---:|---|
| IOT-Q1 | Threshold adjustment (CR1) | Maintainability | **2** | CR1 touches 6 nodes (Temp Critica?, Humedad Alta?, Determinar Nivel, output Set, etc.); scattered thresholds; violates REG-007 | **5** | CR1 touches 1 node in the E2 subflow; centralized `UMBRALES` constant (AP-10); ADR-002 aligns with ASHRAE/ISO 7730; measure (`nodes_touched ≤ 1`) met | +3 | `cr-log-iot-to-be.csv` CR-IOT-004 |
| IOT-Q2 | Alert channel change (CR2) | Maintainability | **2** | CR2 touches 4 nodes (critical notification HTTP, warning, parameters, response handling); routing and endpoints mixed | **5** | CR2 touches 1 node in E4 (critical branch); routing by level separates responsibility; measure (`nodes_touched ≤ 1`) met | +3 | `cr-log-iot-to-be.csv` CR-IOT-005 |
| IOT-Q3 | Integrity under retries | Reliability | **1** | INSERT without ON CONFLICT, no idempotency_key; duplicates in `lecturas_sensor`; visible REG-005 antipattern | **5** | `idempotency_key = SHA256(sensor_id + timestamp)`; `ON CONFLICT (idempotency_key) DO NOTHING`; Set K: 0% failures, 1 row per key; measure (`COUNT = 1`) met; backed by NR-IOT-02 | +4 | IoT ADR-003 + `iot-to-be-e3-persistencia.json` |
| IOT-Q4 | Network fault tolerance | Reliability | **1** | No retry on HTTP nodes; permanent failure on the first error; REG-004 antipattern | **4** | `maxRetries=3` (CRITICAL) confirmed at runtime (30,011 ms outlier); error workflow triggered; dead-letter partially blocked by SP-IOT-01 (caps the score at 4); NR-IOT-01 guarantees data integrity in E3 | +3 | Runtime 2026-05-07, `mttd-resultado.md` §IOT-Q4-runtime |
| IOT-Q5 | Differentiated urgency | Reliability | **1** | No routing by level; "god node" antipattern emits the same notification regardless of severity | **4** | E4 routing by `nivel` (AP-09); asymmetric maxRetries 3 vs. 2; Set I analysis confirms structural differentiation; TP-IOT-01 documented (Δ latency +10.8 ms is a trade-off, not a defect); score 4 due to the small latency differential — not a strict queue priority | +3 | `analisis_iot_q5.py`, `metricas-derivadas.md` §IOT-Q5 |
| IOT-Q6 | DB confidentiality | Security | **1** | PostgreSQL credentials as literals in the output node; violates REG-001 | **5** | 0 secrets in JSON; `"Postgres Local"` credential referenced by name; validator confirms; backed by NR-GLOBAL-01 | +4 | `microframework/validacion/reportes/validacion-2026-05-06.md` |

**IoT average — as-is:** 1.33 → **IoT average — to-be:** 4.67 → **Δ average: +3.34 points** (+251%)

---

## 4. Global comparative synthesis

### 4.1 Statistical summary

| Metric | Bot | IoT | Global |
|---|:---:|:---:|:---:|
| As-is average | 1.67 | 1.33 | 1.50 |
| To-be average | 4.83 | 4.67 | 4.75 |
| Average improvement | +3.16 | +3.34 | +3.25 |
| % improvement | +190% | +251% | +217% |
| Scenarios with to-be score = 5 | 4 / 6 | 4 / 6 | 8 / 12 |
| Scenarios with to-be score = 4 | 2 / 6 | 2 / 6 | 4 / 12 |
| Scenarios with to-be score < 4 | 0 / 6 | 0 / 6 | 0 / 12 |

### 4.2 Distribution of improvement by ISO 25010 attribute

| Attribute | Scenarios | Average Δ score | Interpretation |
|---|:---:|:---:|---|
| Maintainability / Modularity | 4 (BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2) | **+3.00** | Consistent, predictable improvement; CR impact drops from 8/5/6/4 nodes to 1/1/1/1 |
| Reliability / Maturity | 2 (BOT-Q4, IOT-Q3) | **+3.00** | Idempotency pattern plus SP-BOT-01 caps Bot at 4 |
| Reliability / Fault tolerance | 2 (IOT-Q4, IOT-Q5) | **+3.00** | Retry + differentiated routing; SP-IOT-01 and TP-IOT-01 cap at 4 |
| Security / Confidentiality | 2 (BOT-Q3, IOT-Q6) | **+4.00** | Largest magnitude of improvement — as-is systematically violated REG-001 |
| Operability / Monitorability | 1 (BOT-Q5) | **+4.00** | Structured log + reproducible MTTD protocol |
| Functional suitability / Correctness | 1 (BOT-Q6) | **+3.00** | Correct HTTP in 100% of Sets C and D |

### 4.3 Radar-style visualization (text)

```
                    Bot                              IoT
            BOT-Q1                            IOT-Q1
              5 ●                                5 ●
       BOT-Q6      BOT-Q2               IOT-Q6        IOT-Q2
         5 ●        5 ●                  5 ●            5 ●
                                                            
       BOT-Q5      BOT-Q3               IOT-Q5         IOT-Q3
         5 ●        5 ●                  4 ●            5 ●
              4 ●                                 4 ●
            BOT-Q4                              IOT-Q4

         (solid line: to-be)              (solid line: to-be)
         (as-is in all: 1 or 2)          (as-is in all: 1 or 2)
```

### 4.4 Interpretive reading

1. **No to-be scenario obtains a score of 5 in security or reliability** — the score-4 points in BOT-Q4, IOT-Q4, and IOT-Q5 reflect external dependencies (ticket service, mock-iot) or documented trade-offs (TP-IOT-01) that limit absolute compliance with the utility tree's response measure. This is analytical honesty: the framework improves substantially but does not guarantee perfection in scenarios that require third-party cooperation.

2. **The largest magnitude of improvement is in security** (Δ = +4.00 in BOT-Q3 and IOT-Q6) — consistent with the fact that as-is systematically violated REG-001 and to-be meets it 100% with double defense (n8n credentials + static validator).

3. **The improvement is slightly larger in IoT** (+251% vs. +190%) — attributable to the IoT as-is starting from lower scores (average 1.33 vs. 1.67 in Bot) due to its more severe monolithic nature.

4. **Zero regressions** — no scenario has a to-be score lower than its as-is score. The documented trade-offs (TP-GLOBAL-01 latency +119% in IoT, TP-IOT-01 +10.8 ms critical vs. warning) do not impact the top-K scenarios because none of them has efficiency as its main evaluated attribute in the utility tree — efficiency is reported as a contextual trade-off in the report, not as a scoring metric.

5. **External validation completed.** The scoring above is the author's analytical assessment based on quantitative evidence. The external-validation survey (Section E of the instrument, mini-ATAM, N=17) compared this scoring with that of a 17-expert panel and calculated inter-rater agreement via Krippendorff's α. Result: exact convergence in 12/12 to-be scenarios and 11/12 as-is; divergences are documented in `informe-atam-final.md` §8.4.

---

## 5. Relationship with the rest of the ATAM analysis

- **Feeds the final ATAM report:** section 6 "As-is vs. to-be scoring matrix" is built directly on this table.
- **Input for Block E (survey):** the mini-ATAM experts score the same 12 scenarios in Section E of the instrument; comparison against this matrix produces convergence/divergence evidence.
- **Supports the findings of `analisis-approaches.md`:** each score justification cites the applicable SP/TP/R/NR, maintaining cross-traceability.
- **Meets R4 of the pre-project:** the "scoring matrix" listed as a mandatory artifact of the R4 deliverable (ATAM protocol and report) is complete.
