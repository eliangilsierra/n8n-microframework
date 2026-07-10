> 🌐 **Language / Idioma:** English · [Español](informe-atam-final.md)

# Consolidated ATAM Evaluation Report
## LC/NC Architectural Micro-framework for n8n

**Thesis chapter corresponding to R4 — ATAM Protocol and Report**

**Version:** 1.1 (section 8 complete with external validation survey results)
**Date:** 2026-05-07 (section 8 updated 2026-07-08)
**Author:** Elian Hernando Gil Sierra
**Advisor:** Sebastian Roa Prada, PhD
**Program:** Master's in Software Management, Application, and Development (MGADS)
**Institution:** Universidad Autónoma de Bucaramanga

---

## Table of contents

1. [Introduction and objective](#1-introducción-y-objetivo)
2. [Business drivers and quality attributes](#2-drivers-de-negocio-y-atributos-de-calidad)
3. [Presentation of the evaluated architecture](#3-presentación-de-la-arquitectura-evaluada)
4. [Utility tree and top-K scenarios](#4-utility-tree-y-escenarios-top-k)
5. [Analysis of architectural approaches](#5-análisis-de-approaches-arquitectónicos)
6. [As-is vs. to-be scoring matrix](#6-matriz-de-scoring-as-is-vs-to-be)
7. [Quantitative evaluation of evidence](#7-evaluación-cuantitativa-de-evidencia)
8. [External validation by expert panel](#8-external-validation-by-expert-panel)
9. [Synthesis of findings](#9-síntesis-de-hallazgos)
10. [Conclusions of the ATAM evaluation](#10-conclusiones-de-la-evaluación-atam)
11. [Study limitations](#11-limitaciones-del-estudio)
12. [Future work](#12-trabajo-futuro)
13. [Appendices](#13-anexos)
14. [References](#14-referencias)

---

## 1. Introduction and objective

This chapter presents the results of the architectural evaluation of the micro-framework proposed in the thesis, applied to the to-be architectures of two case studies (a support Bot and an IoT Pipeline) using the ATAM (Architecture Tradeoff Analysis Method) of Bass, Clements & Kazman (2012). The evaluation produces the deliverables required by specific objective OE3 of the thesis proposal and result R4 of the work plan.

### 1.1 Context

The micro-framework proposed in this thesis (documented in `docs/microframework-v1.0.md` and `docs/context/microframework-spec.md`) structures any n8n flow into four functional stages (E1 Validation, E2 Domain, E3 Adapters, E4 Output) and prescribes 10 mandatory rules with a verifiable binary criterion, 6 recommended rules, 5 design patterns, and an automated static validation process. The framework is grounded in Clean Architecture principles (Martin, 2017) and DevSecOps practices (Feio et al., 2024).

The architectural evaluation is an essential component of the thesis because it allows answering questions such as: does the framework actually improve the quality attributes it aims to improve? What trade-offs does it introduce? What architectural risks remain open in the proposal?

### 1.2 Methodological adaptation

ATAM in its canonical form (Kazman et al., 2000) is an in-person collaborative process that requires heterogeneous stakeholders. This individual thesis project does not have a multi-stakeholder team, so a **documented adaptation** was adopted, named "Asynchronous Modified ATAM with External Validation by Expert Panel," formally justified in ADR-MF-004 (`microframework/adr/ADR-MF-004-atam-adaptado-individual.md`) and developed in detail in `docs/atam/metodologia-atam-adaptada.md`.

The adaptation preserves all of ATAM's core analytical products (utility tree, top-K scenarios, sensitivity/tradeoff points, risks/non-risks, scoring) and compensates for the absence of the multi-stakeholder component through **methodological triangulation** (Denzin, 1978) among three sources of evidence: (i) documentary, (ii) empirical quantitative over 8,000 real runs, and (iii) external validation by an expert panel (see section 8).

### 1.3 Objectives of the report

This chapter fulfills four functions:

1. Document the utility tree and the prioritized quality scenarios.
2. Identify and analyze the to-be architectural approaches, classifying findings into Sensitivity Points, Tradeoff Points, Risks, and Non-Risks.
3. Present the 1-5 as-is vs. to-be scoring matrix supported by empirical quantitative evidence.
4. Integrate the external validation from the expert panel (section 8) and produce the conclusions of the evaluation.

### 1.4 Scope

The scope of the evaluation is:

- **Systems evaluated:** the to-be architectures of the Bot and IoT cases, compared against their respective as-is baselines.
- **Attributes evaluated:** the five ISO/IEC 25010 attributes prioritized in the thesis proposal: Maintainability, Reliability, Security, Operability, Functional suitability. Efficiency is reported as an attribute associated with trade-offs, not as a top-K attribute.
- **Scenarios:** 12 top-K scenarios (6 per case) defined in `docs/atam/atam-utility-tree.md`.
- **Evidence:** documentary, quantitative (8,000 runs + 12 CRs + IOT-Q4 and IOT-Q5 runtime + MTTD analysis + static validator), and expert opinion (section 8).

Out of scope: evaluation of the production AWS architecture (subject of R3), evaluation of LC/NC platforms other than n8n, actual production deployment.

---

## 2. Business drivers and quality attributes

### 2.1 Main drivers

The business drivers motivating the micro-framework, extracted from the thesis proposal and consolidated in `docs/context/proyecto-overview.md`, are:

| ID | Driver | Architectural implication |
|---|---|---|
| D1 | Reduce the cost of change in LC/NC flows adopted without structure | Strong modularity (E1–E4 separated) |
| D2 | Eliminate recurring security antipatterns (secrets in JSON, no auth) | Native credential management + static validator |
| D3 | Guarantee fault tolerance in external integrations | Retry, idempotency, error workflow with dead-letter |
| D4 | Enable operational observability without additional tools | Structured JSON log on stdout, queryable with grep |
| D5 | Make architectural compliance automatically verifiable | Static validator executable in CI |

### 2.2 Prioritized quality attributes (ISO/IEC 25010)

| ISO 25010 characteristic | Sub-characteristic | Associated drivers | Metric/response measure |
|---|---|---|---|
| Maintainability | Modularity | D1 | Reduction of nodes modified per CR ≥ 20% |
| Maintainability | Reusability | D1 | Ability to invoke subflows from multiple orchestrators |
| Reliability | Maturity | D3 | 0 duplicate records under retries (idempotency) |
| Reliability | Fault tolerance | D3 | Automatic recovery from transient network failures |
| Security | Confidentiality | D2 | 0 literal secrets in exported JSON |
| Operability | Monitorability | D4 | Failure diagnosis MTTD ≤ 60 seconds |
| Functional suitability | Correctness | — | HTTP contractual compliance (401/400/422 depending on case) |

Full traceability from driver → ADR → attribute → scenario is in the per-case traceability matrices: `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md` and `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` (version 1.3).

### 2.3 Implicit stakeholders

In the absence of real stakeholders, the following roles were implicitly considered when defining scenarios and priorities:

| Implicit role | Attributes of greatest interest | Decisions represented |
|---|---|---|
| Developer / flow maintainer | Maintainability, Operability | Modularization, structured log, static validator |
| LC/NC product owner | Reliability, Functional suitability | Idempotency, retry, correct contracts |
| Security team | Security | Credential management, REG-001 static validator |
| Operations team | Operability, Reliability | Structured log, error workflow, dead-letter |
| Academic advisor / jury | Traceability, methodological rigor | ADRs, traceability matrices, quantitative evidence |

---

## 3. Presentation of the evaluated architecture

### 3.1 Micro-framework metamodel

The metamodel establishes that **any n8n flow is decomposed into four functional stages** with single responsibility, communicated through explicit JSON Schema contracts:

```
┌────────────────────────────────────────────────────────────────┐
│                 n8n Orchestrator + Error Workflow               │
│                                                                │
│   ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐                     │
│   │ E1  │───▶│ E2  │───▶│ E3  │───▶│ E4  │                     │
│   │Vali-│    │Doma-│    │Adap-│    │Out- │                     │
│   │date │    │in   │    │ters │    │put/ │                     │
│   │     │    │     │    │     │    │noti-│                     │
│   │     │    │     │    │     │    │fy   │                     │
│   └─────┘    └─────┘    └─────┘    └─────┘                     │
│                                                                │
│   E1: schema + auth     E2: logic only     E3: integrations    │
│                          (no HTTP)          E4: single output  │
└────────────────────────────────────────────────────────────────┘
```

Full technical detail in `docs/context/arquitectura-flujos.md`.

### 3.2 As-is architecture (baseline)

The as-is architectures were **intentionally redesigned as representative antipatterns** of the typical state of LC/NC flows adopted without structure. This methodological decision is justified in `docs/context/justificacion-rediseno-asis.md`, drawing on internal validity in quasi-experimental studies (Wohlin et al., 2012).

| Case | # as-is nodes | REGs violated | Visible antipatterns |
|---|:---:|:---:|---|
| Bot | 16 | 9/10 | Hardcoded token, in-memory rate limiter, no retry, no idempotency, business logic mixed with integrations, silent 500 error |
| IoT | 14 | 9/10 | No E1 schema, thresholds scattered across IF nodes, literal credentials, INSERT without ON CONFLICT, HTTP 200 even on errors |

Detailed diagrams with per-node annotations in `casos-de-estudio/{bot,iot}/as-is/diagrama-as-is.md`.

### 3.3 To-be architecture (with the framework applied)

| Case | To-be components | REGs met |
|---|---|:---:|
| Bot | Orchestrator + 2 subflows (E2 domain, E3 adapter) + error workflow | 10/10 |
| IoT | Orchestrator + 4 subflows (E1 validation, E2 domain, E3 persistence, E4 notification) + error handler with dead-letter | 10/10 |

The to-be flows are imported into n8n in a specific order (subflows before orchestrator) documented in `docs/context/convenios-y-reglas.md`. The JSON files are in `casos-de-estudio/{bot,iot}/to-be/`.

### 3.4 Applied architectural approaches

Twelve architectural approaches are inventoried and characterized in `docs/atam/analisis-approaches.md` §1. Summary:

| # | Approach | Main attribute affected |
|---|---|---|
| AP-01 | E1–E4 separation | Maintainability / Modularity |
| AP-02 | Execute Workflow subflows | Maintainability / Reusability |
| AP-03 | Native n8n credentials | Security / Confidentiality |
| AP-04 | Retry with backoff | Reliability / Fault tolerance |
| AP-05 | Idempotency with unique key | Reliability / Maturity |
| AP-06 | Error workflow with dead-letter | Operability + Reliability |
| AP-07 | Structured JSON log | Operability / Monitorability |
| AP-08 | E1 JSON Schema validation | Functional suitability / Correctness |
| AP-09 | Differentiated routing E4 IoT | Reliability |
| AP-10 | Constants in E2 | Maintainability / Modifiability |
| AP-11 | Static validator `validar-flujos.mjs` | Functional suitability / Governance |
| AP-12 | Timestamp authority | Functional suitability / Traceability |

---

## 4. Utility tree and top-K scenarios

The full utility tree, prioritized by importance × difficulty (H/M/L scale), is in `docs/atam/atam-utility-tree.md`. Summary of the 12 top-K scenarios evaluated:

### 4.1 Bot scenarios

| ID | Attribute | Stimulus | Response measure | Priority (I × D) |
|---|---|---|---|:---:|
| BOT-Q1 | Maintainability / Modularity | CR1 — change message priority | `nodes_touched ≤ 1` | (H, M) |
| BOT-Q2 | Maintainability / Modularity | CR2 — change ticket endpoint | `nodes_touched ≤ 1` | (H, L) |
| BOT-Q3 | Security / Confidentiality | Export the flow's JSON | `ocurrencias_literal_token = 0` | (H, L) |
| BOT-Q4 | Reliability / Maturity | Send the same ticket 2× | `COUNT(duplicados) = 0` | (H, M) |
| BOT-Q5 | Operability / Monitorability | Authentication failure | `MTTD ≤ 60 s` | (H, H) |
| BOT-Q6 | Functional suitability / Correctness | Invalid token / malformed payload | Correct HTTP 401/400 | (H, L) |

### 4.2 IoT scenarios

| ID | Attribute | Stimulus | Response measure | Priority (I × D) |
|---|---|---|---|:---:|
| IOT-Q1 | Maintainability / Modularity | CR1 — adjust critical threshold | `nodes_touched ≤ 1` | (H, L) |
| IOT-Q2 | Maintainability / Modularity | CR2 — change alert channel | `nodes_touched ≤ 1` | (H, L) |
| IOT-Q3 | Reliability / Maturity | Send the same reading 2× | `COUNT(*) = 1` per idempotency_key | (H, M) |
| IOT-Q4 | Reliability / Fault tolerance | Network failure in E4 | `fallos_integration = 0` post-recovery | (H, H) |
| IOT-Q5 | Reliability / Fault tolerance | Mix of critical and warning readings | `duracion_ms_critico` vs. `_advertencia` | (M, H) |
| IOT-Q6 | Security / Confidentiality | Export the flow's JSON | `ocurrencias_literal_pg_password = 0` | (H, L) |

### 4.3 ISO/IEC 25010 coverage achieved

The 12 scenarios cover the 5 ISO 25010 sub-characteristics the framework promises to improve (Maintainability, Reliability, Security, Operability, Functional suitability). The distribution is:

- Maintainability: 4 scenarios (BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2)
- Reliability: 4 scenarios (BOT-Q4, IOT-Q3, IOT-Q4, IOT-Q5)
- Security: 2 scenarios (BOT-Q3, IOT-Q6)
- Operability: 1 scenario (BOT-Q5)
- Functional suitability: 1 scenario (BOT-Q6)

---

## 5. Analysis of architectural approaches

The full formal analysis is in `docs/atam/analisis-approaches.md` §2. Consolidated summary of the 15 architectural findings identified:

### 5.1 Sensitivity Points (3)

| ID | Description | Scenario | Severity |
|---|---|---|:---:|
| SP-BOT-01 | Idempotency depends on the `Idempotency-Key` header and on it being honored by the external service | BOT-Q4 | Low |
| SP-BOT-02 | MTTD depends on the structure of E1's JSON log | BOT-Q5 | Low |
| SP-IOT-01 | The IoT error handler channel coincides with the E4 channel | IOT-Q4 | **Medium** |

### 5.2 Tradeoff Points (3)

| ID | Attributes in tension | Magnitude | Decision |
|---|---|---|---|
| TP-GLOBAL-01 | Maintainability ↑↑ vs. Efficiency ↓ (subflows) | Bot +9%; IoT +119–192% p50 | Accepted (ADR-001) |
| TP-GLOBAL-02 | Functional suitability ↑↑ vs. evolutionary Maintainability ↓ | Qualitative | Accepted |
| TP-IOT-01 | Critical resilience ↑ vs. Latency ↓ | +10.8 ms p50 critical vs. warning | Accepted (IoT ADR-004) |

### 5.3 Risks (4)

| ID | Risk | Attribute | Severity | Status |
|---|---|---|:---:|---|
| R-BOT-01 | Manual token rotation, no auto-rotation | Security | Medium | Open (out of scope for v1.0) |
| R-IOT-01 | Dead-letter not inserted if E4 is fully down | Traceability | Medium | Open (short-term mitigation feasible) |
| R-GLOBAL-01 | Loss of stdout logs if the container restarts without a volume | Operability | Medium | Open (mitigation inherent to R3 deployment) |
| R-GLOBAL-02 | Dependence on external services honoring the contract | Reliability | Low-High | Open (mitigable with contract testing) |

### 5.4 Non-Risks (5)

| ID | Description | Scenario |
|---|---|---|
| NR-BOT-01 | E1 validation prevents unauthorized side effects | BOT-Q3, BOT-Q6 |
| NR-BOT-02 | Correct HTTP contracts in 100% of Sets C and D | BOT-Q6 |
| NR-IOT-01 | E3 PostgreSQL is independent of E4 | IOT-Q4 |
| NR-IOT-02 | Idempotency prevents duplication under external retries | IOT-Q3 |
| NR-GLOBAL-01 | The static validator protects against REG-001 regressions | BOT-Q3, IOT-Q6 |

### 5.5 Findings discovered at runtime

Two relevant findings emerged from the runtime execution of scenarios IOT-Q4 and IOT-Q5 (2026-05-07):

**SP-IOT-01.** When mock-iot was stopped and a critical reading was sent, it was confirmed that the retry in E4 (maxRetries=3) executed correctly and the error workflow was triggered. However, the error handler's HTTP node also failed with ECONNREFUSED when attempting to notify the same downed service. The `neverError: true` option does not protect against connection errors at the network level, only against non-2xx HTTP responses. This blocked execution of the next node (insert into `lecturas_sensor_dead_letters`). The sensor data remained safe in `lecturas_sensor` (NR-IOT-01 confirmed), but the failure context was not formally persisted. This is a high-value methodological finding: it is exactly the kind of discovery ATAM seeks, and it only emerges at runtime execution, not in static analysis.

**TP-IOT-01.** The analysis of Set I (gradual degradation of readings) confirmed that the differentiated routing in E4 (CRITICAL with maxRetries=3, WARNING with maxRetries=2) introduces a nominal latency overhead of +10.8 ms p50 on the critical branch vs. the warning branch. The 30,011 ms (≈ 30 s) outlier on the critical branch is direct evidence that the retry mechanism activated in at least one real run — operational confirmation of REG-004.

Full details in `medicion/consolidado/mttd-resultado.md` §IOT-Q4-runtime and `medicion/consolidado/metricas-derivadas.md` §IOT-Q5.

---

## 6. As-is vs. to-be scoring matrix

The full matrix with cell-by-cell justification is in `docs/atam/matriz-scoring.md`. Executive summary:

### 6.1 Bot scoring

| ID | As-is | To-be | Δ | Observation |
|---|:---:|:---:|:---:|---|
| BOT-Q1 | 2 | 5 | +3 | CR1 from 8 nodes to 1 |
| BOT-Q2 | 2 | 5 | +3 | CR2 from 5 nodes to 1 |
| BOT-Q3 | 1 | 5 | +4 | 4 secrets to 0; double defense (credentials + validator) |
| BOT-Q4 | 2 | 4 | +2 | Idempotency implemented; SP-BOT-01 caps it at 4 |
| BOT-Q5 | 1 | 5 | +4 | MTTD ~14 s < 60 s target |
| BOT-Q6 | 2 | 5 | +3 | 100% correct HTTP statuses |
| **Average** | **1.67** | **4.83** | **+3.16** | **+190%** |

### 6.2 IoT scoring

| ID | As-is | To-be | Δ | Observation |
|---|:---:|:---:|:---:|---|
| IOT-Q1 | 2 | 5 | +3 | CR1 from 6 nodes to 1; centralized UMBRALES |
| IOT-Q2 | 2 | 5 | +3 | CR2 from 4 nodes to 1 |
| IOT-Q3 | 1 | 5 | +4 | Idempotency + ON CONFLICT; 0 duplicates Set K |
| IOT-Q4 | 1 | 4 | +3 | Runtime-confirmed retry; SP-IOT-01 caps it at 4 |
| IOT-Q5 | 1 | 4 | +3 | Differentiated routing; TP-IOT-01 documented |
| IOT-Q6 | 1 | 5 | +4 | 0 literal credentials |
| **Average** | **1.33** | **4.67** | **+3.34** | **+251%** |

### 6.3 Overall interpretation

- **Overall as-is average:** 1.50 → **Overall to-be average:** 4.75 (Δ = +3.25, +217%)
- **Zero regressions:** no scenario has a to-be score lower than as-is
- **8 of 12 scenarios** reach score 5 (excellent) in to-be
- **4 of 12** reach score 4 — all due to documented limitations (SP-BOT-01, SP-IOT-01, TP-IOT-01)
- **Maximum improvement** in security (Δ = +4.00 in BOT-Q3 and IOT-Q6) — consistent with the as-is systematically violating REG-001

---

## 7. Quantitative evaluation of evidence

This section synthesizes the operational metrics measured over the 8,000 runs and the 12 Change Requests. Full detail in `medicion/consolidado/metricas-derivadas.md` and `medicion/consolidado/comparacion-2026-05-05.md`.

### 7.1 Maintainability metrics (Change Requests)

| Metric | Case | As-is | To-be | Δ | Target |
|---|---|:---:|:---:|:---:|:---:|
| Nodes modified per CR (average) | Bot | 5.3 | 1.0 | **−81%** | ≥ 20% ✅ |
| | IoT | 4.3 | 0.7 | **−84%** | ≥ 20% ✅ |
| Time per CR (minutes, average) | Bot | 32.7 | 6.7 | −79% | — |
| | IoT | 28.0 | 5.2 | −81% | — |
| Attempts to successful verification (sum of 3 CRs) | Bot | 7 | 3 | −57% | — |
| | IoT | 7 | 3 | −57% | — |

### 7.2 Reliability metrics (Run-logs)

| Metric | Case | As-is | To-be | Δ | Target |
|---|---|:---:|:---:|:---:|:---:|
| Failure rate (over 2,000 runs each) | Bot | 9% | 6% | −36.6% | ≥ 30% ✅ |
| | IoT | 0%* | 1%† | n/a* | * antipattern / † correct validation |
| Duplicates under retries Set K | Bot | n/a | 0 | — | 0 ✅ |
| | IoT | n/a | 0 | — | 0 ✅ |

\* The IoT as-is shows an artificially 0% failure rate because it lacks validation (it processes everything). The IoT to-be shows 1% "failures" that are actually correct rejections (HTTP 422) of invalid Sets D and E.

### 7.3 Security metrics

| Metric | Case | As-is | To-be | Result |
|---|---|:---:|:---:|---|
| Literal secrets detected by `validar-flujos.mjs` REG-001 | Bot | 4 | **0** | −100% ✅ |
| | IoT | several | **0** | −100% ✅ |
| Least privilege in credentials (binary check) | Bot | 0 | 1 | Met |
| | IoT | 0 | 1 | Met |

### 7.4 Operability metrics

| Metric | Case | As-is | To-be | Target |
|---|---|:---:|:---:|:---:|
| Authentication failure diagnosis MTTD (analytical) | Bot | ~5–10 min | **~14 s** | ≤ 60 s ✅ |
| Runtime evidence of active retry | IoT | n/a | ✅ 30,011 ms outlier in Set I | — |
| Runtime evidence of error workflow triggered | IoT | n/a | ✅ test 2026-05-07 | — |

### 7.5 Traceability metrics

| Metric | Value |
|---|:---:|
| ADR coverage (documented decisions / expected decisions) | 19/19 = 100% ✅ |
| ATAM coverage (scenarios with traceable evidence) | 12/12 = 100% ✅ |
| Bot to-be architecture checklist coverage | 10/10 = 100% ✅ |
| IoT to-be architecture checklist coverage | 10/10 = 100% ✅ |
| Bot to-be DevSecOps checklist coverage | 8/8 = 100% ✅ |
| IoT to-be DevSecOps checklist coverage | 7/7 applicable = 100% ✅ |

### 7.6 Quantified trade-off: latency

Latency is the framework's main trade-off (TP-GLOBAL-01):

| Case | Set | p50 as-is | p50 to-be | Δ | Interpretation |
|---|:---:|:---:|:---:|:---:|---|
| Bot | A | 120 ms | 131 ms | **+9%** | Acceptable overhead |
| Bot | B | 118 ms | 120 ms | +2% | Minimal overhead |
| Bot | C | 66 ms | 39 ms | **−42%** | Early rejection at E1 — faster |
| IoT | A | 78 ms | 171 ms | **+119%** | Significant overhead |
| IoT | B | 78 ms | 182 ms | **+134%** | Idem |
| IoT | C | 42 ms | 65 ms | +55% | E1 validation vs. the antipattern's full pass-through |

The trade-off is asymmetric: marginal in Bot, significant in IoT. It is accepted and documented in IoT ADR-001 — the project prioritizes maintainability over latency, consistent with the thesis proposal's drivers. In production contexts with strict SLAs, clustered n8n would be recommended, or this trade-off would need to be explicitly evaluated.

---

## 8. External validation by expert panel

> **Status:** Data collection closed (June 17–24, 2026) and analysis completed over the
> anonymized dataset. Data source: [`medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv`](../../medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv).
> Reproducible analysis in [`medicion/encuesta-validacion/analisis-encuesta.py`](../../medicion/encuesta-validacion/analisis-encuesta.py)
> and [`analisis-encuesta.ipynb`](../../medicion/encuesta-validacion/analisis-encuesta.ipynb) (executed,
> with outputs embedded), following the plan pre-registered in `plan-analisis-encuesta.md`.
> Consolidated outputs in `medicion/encuesta-validacion/outputs/`.

### 8.1 Respondent profile

- Total N collected (Sections A–D): **19**
- N excluded (< 3 years of experience, pre-registered post-hoc filter): **2**
- Valid N: **17**, above the minimum threshold of 15
- N Section E (mini-ATAM): **17** (all valid respondents completed the optional section)
- Higher-experience subgroup (≥ 5 years): **n = 7**

| Role (A1) | n |
|---|:---:|
| Developer / Software Engineer | 10 |
| Software Architect | 4 |
| Tech Lead | 1 |
| Systems Analyst / Software Analyst | 1 |
| Scrum Master / Agile Coach | 1 |

**Role heterogeneity:** 5 distinct roles represented — meets the ≥ 3 criterion.

| Experience (A2) | n |
|---|:---:|
| 3 to 5 years | 10 |
| 5 to 10 years | 4 |
| More than 10 years | 3 |

| Familiarity | Mean | σ |
|---|:---:|:---:|
| A3 — LC/NC platforms | 3.29 | 1.05 |
| A4 — Clean Architecture | 4.00 | 1.06 |
| A5 — Architectural evaluation (ATAM, ISO 25010) | 3.29 | 0.99 |

### 8.2 Quantitative results — Section B Likert

| Item | Mean | Median | σ | % ≥ 4 | Reading |
|---|:---:|:---:|:---:|:---:|---|
| B1 — The 4 stages improve modularity | 4.71 | 5 | 0.47 | 100 % | Strong validation |
| B2 — From ~5 to 1 node per change is a verifiable improvement | 4.53 | 5 | 0.62 | 94 % | Strong validation |
| B3 — Retry + idempotency prevent loss/duplication | 4.53 | 5 | 0.51 | 100 % | Strong validation |
| B4 — Dead-letter handling is correct for IoT | 4.35 | 4 | 0.49 | 100 % | Strong validation |
| B5 — Secrets via native credentials is acceptable | 4.24 | 4 | 0.44 | 100 % | Strong validation |
| B6 — JSON logging enables diagnosis without opening n8n | 4.53 | 5 | 0.62 | 94 % | Strong validation |
| B7 — The 10 rules are applicable in real projects | 4.18 | 4 | 0.53 | 94 % | Strong validation (lowest of the set) |
| B8 — Adds value without excessive complexity | 4.29 | 4 | 0.59 | 94 % | Strong validation |

All medians ≥ 4 with % ≥ 4 between 94 % and 100 % — strong validation under the a priori
interpretive criterion, with no below-midpoint rejection on any item.

**Internal consistency (Cronbach's α per thematic pair):**

| Group | α |
|---|:---:|
| Maintainability (B1+B2) | 0.505 |
| Reliability (B3+B4) | −0.816 |
| Applicability (B7+B8) | 0.365 |

All three coefficients are low or non-interpretable (one negative), consistent with what was
anticipated in the analysis plan: the near-unanimous concentration of responses at levels 4–5
(ceiling effect) depresses correlation-based coefficients even when substantive agreement is
high. The descriptive reading (means, medians, % agreement) is therefore prioritized over these
coefficients, as pre-registered.

The lowest-mean items (B7 = 4.18, B5 = 4.24) foreshadow the themes developed in the Section C
qualitative analysis: applicability of the rules in real projects and secret management without
automatic rotation.

### 8.3 Qualitative analysis — Sections C and E4

The version of the instrument actually published consolidated the planned C1–C3 questions into a
single open question (see `instrumento-encuesta.md` §Section C). Thematic coding was applied to
that consolidated question (C1) and to the free-text mini-ATAM comment in Section E (E4),
following Strauss & Corbin (1990). Full coding available in
[`outputs/categorias-emergentes-seccion-c.md`](../../medicion/encuesta-validacion/outputs/categorias-emergentes-seccion-c.md).

| Category | # respondents | Convergence with the author's record |
|---|:---:|---|
| Absence of a load, scalability, and concurrency scenario | 7/17 | Emergent — the panel's most frequent theme, not in the author's prior record |
| Cumulative latency from sequential subflows in IoT | 4/17 | ✅ Converges with TP-GLOBAL-01 |
| Dead-letter / error handler coupled to the E4 channel | 2/17 (clear) + 5/17 (related) | ✅ Converges with SP-IOT-01 / R-IOT-01 |
| Secret management without rotation, audit, or revocation | 2/17 | ✅ Converges with R-BOT-01 |
| Testability and learning curve not evaluated | 2/17 | Emergent |
| Single point of failure of the orchestrator (REG-002) not evaluated | 1/17 explicit | Emergent |
| Uniform rules without classification by flow criticality | 1/17 | Emergent |

3/17 C1 responses and 5/17 E4 responses had no thematic content ("None"/"no").

**Emergent findings not anticipated by the author** (beyond the seven categories above):
- Organizational/cultural resistance to the E2 restriction in teams without prior architectural culture.
- The API consumer's perspective on incorrect HTTP contracts (enriches NR-BOT-02 with the downstream client's angle).
- Suggestion to extend retry with backoff to internal calls between subflows, not only outbound HTTP.
- Methodological comment on the value of validating the ATAM scoring with additional independent evaluators.

**Discrepancies with the author's analysis:** no panel classification directly contradicts a
closed non-risk or risk from the author; the divergences observed are of emphasis (the absence of
load/concurrency scenarios dominates the panel's attention more than in the original analysis) and
are discussed in section 9.

### 8.4 Triangulation with the author's scoring — Section E

| Scenario | Author as-is | Panel as-is (median, range) | Δ | Author to-be | Panel to-be (median, range) | Δ | Author class | Panel modal class | Match |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| BOT-Q1 | 2 | 2 (2–5) | 0 | 5 | 5 (4–5) | 0 | TP | TP (12) | ✅ |
| BOT-Q2 | 2 | 2 (1–4) | 0 | 5 | 5 (4–5) | 0 | TP | NR (13) | ❌ |
| BOT-Q3 | 1 | 1 (1–5) | 0 | 5 | 5 (4–5) | 0 | NR | Tie TP/SP (6/6) | ❌ |
| BOT-Q4 | 2 | 2 (1–5) | 0 | 4 | 4 (4–5) | 0 | SP | NR (9) | ❌ |
| BOT-Q5 | 1 | 1 (1–5) | 0 | 5 | 5 (3–5) | 0 | SP | NR (10) | ❌ |
| BOT-Q6 | 2 | 2 (1–4) | 0 | 5 | 5 (4–5) | 0 | NR | NR (15) | ✅ |
| IOT-Q1 | 2 | 2 (1–4) | 0 | 5 | 5 (3–5) | 0 | TP | NR (12) | ❌ |
| IOT-Q2 | 2 | 2 (1–4) | 0 | 5 | 5 (4–5) | 0 | TP | TP (9) | ✅ |
| IOT-Q3 | 1 | 1 (1–5) | 0 | 5 | 5 (4–5) | 0 | NR | NR (12) | ✅ |
| IOT-Q4 | 1 | 1 (1–5) | 0 | 4 | 4 (3–5) | 0 | SP (+R-IOT-01) | R (7) | ✅ (via R-IOT-01) |
| IOT-Q5 | 1 | 2 (1–4) | 1 | 4 | 4 (4–5) | 0 | TP | TP (11) | ✅ |
| IOT-Q6 | 1 | 1 (1–4) | 0 | 5 | 5 (4–5) | 0 | NR | NR (12) | ✅ |

**Scoring convergence:** to-be matches exactly in **12/12** scenarios; as-is matches in **11/12**,
with the sole difference in IOT-Q5 (Δ = 1, within the |Δ| ≤ 1 convergence criterion). Panel global
mean: as-is = **1.92**, to-be = **4.65**, Δ = **+2.73** (versus 1.50 → 4.75 in the author's
analysis — the panel is more conservative on the to-be score but confirms the same direction and
magnitude of change). **95.1 %** of respondent-scenario pairs perceived improvement (to-be > as-is;
194/204).

**Architectural classification:** the panel's mode matches the author's primary classification in
**6/12** scenarios — lower than the scoring figure (12/12 to-be) but interpretable, not random: the
Table 8 equivalence imposes an ordinal reading (R < SP < TP < NR) on categories that in ATAM are
qualitative, so a well-supported decision can simultaneously be a sensitivity point and be perceived
by the panel as non-risk (a "construct effect"). BOT-Q3 had no clear mode (TP/SP tie, 6 and 6). The
panel cleanly reproduced the non-risks (BOT-Q1, BOT-Q6, IOT-Q2, IOT-Q3, IOT-Q5, IOT-Q6) and, notably,
elevated IOT-Q4 to **Risk** (mode 7/17) — more severe than the author's sensitivity point, but
convergent with the already-documented risk R-IOT-01 and the most critical finding in the risk register.

**Robustness — higher-experience subgroup (≥ 5 years, n = 7):** retains full convergence,
**12/12** on the to-be, ruling out that convergence depends on less senior respondents.

**Inter-rater agreement (Krippendorff's α, n = 17):**

| Measure | α |
|---|:---:|
| As-is scoring (ordinal) | 0.086 |
| To-be scoring (ordinal) | 0.145 |
| Classification (nominal) | 0.140 |

**Interpretation:** all three coefficients are low per Krippendorff's (2018) thresholds
(< 0.667 unacceptable). This is **not** interpreted as low substantive inter-rater reliability,
but as a manifestation of the ceiling effect — analogous to the kappa paradox: when responses
concentrate in the high categories (or, for classification, spread across few plausible labels for
scenarios already consensually rated positive), the chance-corrected coefficient is depressed even
when raw agreement is high. Convergence evidence therefore rests on modal and median agreement
(12/12 to-be, 11/12 as-is, 6/12 classification), not on α, consistent with what was declared a
priori in the analysis plan. The same ceiling effect explains the Cronbach's α values in Section B (§8.2).

### 8.5 Synthesis of external validation

**Author's findings CONFIRMED by the panel:**
- The substantial improvement in maintainability, security, and operability (RQ1): 94–100 % approval on B1–B8, D1 = 8.71/10.
- The author's to-be ATAM scoring: exact convergence in 12/12 scenarios.
- The author's as-is ATAM scoring: convergence in 11/12 (Δ = 1 on IOT-Q5).
- TP-GLOBAL-01 (modularization vs. latency): spontaneously mentioned by 4/17 respondents.
- SP-IOT-01 / R-IOT-01 (error channel coupled to E4): mentioned by 2/17 clearly and reflected in IOT-Q4's modal classification (Risk, 7/17) — the panel elevated this scenario beyond the severity assigned by the author.
- R-BOT-01 (secret rotation): spontaneously mentioned by 2/17.
- Adoption intent is favorable (D2: 15/17 = 88 %, no rejection responses).

**Author's findings NOT confirmed in the modal classification (although numeric scoring does converge):**
- BOT-Q2, BOT-Q4, BOT-Q5, IOT-Q1: the panel modally classified these as Non-risk where the author identified a Tradeoff Point or Sensitivity Point. This does not contradict the *scoring* (which converges exactly in all four), only the *categorization*: it is a construct effect — a well-supported decision (BOT-Q4, BOT-Q5) can still technically be a sensitivity point, yet the panel perceives it as non-risk precisely because it judges it to be well supported.
- BOT-Q3: no classification mode (TP/SP tie), reflecting genuine divergence of judgment on secret management.

**Emergent panel findings to incorporate in future work:**
- Absence of load, scalability, and concurrency scenarios (7/17 — the panel's most frequent emergent finding; not in the author's risk register).
- Single point of failure of the orchestrator upon main-process crash (REG-002).
- Testability and learning curve of the E1–E4 model for teams without prior experience.
- Uniform rules without differentiation by flow criticality.
- Extending the retry pattern to internal calls between subflows.

These emergent findings, particularly the absence of load/concurrency scenarios, are incorporated
as a future work line in section 12.

---

## 9. Synthesis of findings

### 9.1 Top 5 architectural risks identified

Ordered by relevance for production adoption (combination of severity × probability):

| Rank | ID | Risk | Recommended mitigation |
|:---:|---|---|---|
| 1 | **SP-IOT-01 / R-IOT-01** | Duplicated channel in the IoT error handler blocks dead-letter upon total channel outage | Reorder error handler nodes or use an independent channel |
| 2 | **R-GLOBAL-01** | Ephemeral stdout logs with no persistent volume | Persistent volume + aggregator (CloudWatch in R3) |
| 3 | **R-BOT-01** | Manual token rotation with no auto-rotation | Secrets Manager / Vault with auto-rotation |
| 4 | **R-GLOBAL-02** | Dependence on external services honoring the contract | Contract testing in CI/CD |
| 5 | **SP-BOT-02** | MTTD depends on the structure of the JSON log | Versioned schema + contractual test in CI |

### 9.2 Top 3 main trade-offs

| Rank | ID | Trade-off | Magnitude |
|:---:|---|---|---|
| 1 | **TP-GLOBAL-01** | Subflow modularization vs. latency | +119–192% p50 in IoT |
| 2 | **TP-IOT-01** | Critical channel resilience vs. nominal latency | +10.8 ms p50 |
| 3 | **TP-GLOBAL-02** | Strict E1 validation vs. evolutionary flexibility | Qualitative |

### 9.3 Validation of the thesis proposal's goals

| Thesis proposal goal | Result | Compliance |
|---|---|:---:|
| Change impact: reduction ≥ 20% in nodes | Bot −81%, IoT −84% | ✅ Significantly exceeded |
| Reliability: reduction ≥ 30% in failures | Bot −36.6% | ✅ Met |
| Checklist compliance ≥ 90% in to-be | Bot 100%, IoT 100% | ✅ Met |
| ATAM coverage ≥ 80% per case | Bot 100%, IoT 100% | ✅ Met |
| Improvement in ATAM ordinal rating | Bot +190%, IoT +251% | ✅ Met |

### 9.4 Honesty about the to-be's limitations

Despite the positive results, the analysis is honest about what the framework **does not** guarantee:

- It does not guarantee latency comparable to the as-is in IoT (+119–192% p50 documented)
- It does not guarantee automatic credential rotation (R-BOT-01 open)
- It does not guarantee a successful dead-letter if the notification channel is completely down (R-IOT-01 open)
- It does not guarantee log persistence without an external volume or aggregator (R-GLOBAL-01 open)
- It assumes external services cooperate according to the contract (R-GLOBAL-02 open)

These limitations are intentionally reported as evidence of analytical rigor and as a lead for R3 (AWS design) and R5 (best practices guide), which must address the open risks.

---

## 10. Conclusions of the ATAM evaluation

### 10.1 Does the micro-framework improve the prioritized attributes?

**Yes, substantially and verifiably.** The quantitative evaluation over 8,000 controlled runs and 12 measured Change Requests confirms:

- Average scoring improvement of +3.25 points on a 5-point scale (+217%), with no regressions in any scenario
- 4 of 5 guideline goals from the thesis proposal met with significant margin
- 100% ATAM coverage with traceable evidence in both cases

### 10.2 What explicit trade-offs are assumed?

Three documented trade-offs with quantification:

- **TP-GLOBAL-01:** additional latency due to modularization (significant in IoT: +119–192%)
- **TP-GLOBAL-02:** evolutionary rigidity due to strict E1 validation
- **TP-IOT-01:** latency overhead due to greater resilience in the critical channel (+10.8 ms)

All are justified in ADRs with explicit prioritization consistent with the thesis proposal's drivers.

### 10.3 What architectural risks remain open?

Four open risks with recommended mitigations:

- **R-BOT-01:** manual token rotation (scalable with Secrets Manager — R3)
- **R-IOT-01:** dead-letter blockable by SP-IOT-01 (mitigable in ~1 h)
- **R-GLOBAL-01:** ephemeral logs without a volume (covered in R3)
- **R-GLOBAL-02:** dependence on external contracts (mitigable with contract testing in CI/CD)

None is blocking for the framework's viability.

### 10.4 Recommendations for adoption

For an organization considering adopting the framework:

1. **Apply the static validator** from the first commit as a hard gate in CI/CD
2. **Consciously accept the latency trade-off** — the framework is optimal for scenarios where maintainability and traceability are prioritized over minimal latency
3. **Implement the mitigations for the 4 open risks** from day 1 of production (Secrets Manager, log aggregator, independent error channel, contract testing)
4. **Adapt the utility tree and scenarios** to the organization's specific context — the 12 scenarios in this study are representative but not exhaustive for every LC/NC domain
5. **Pilot with a simple case** (1–2 flows) before scaling to a broad portfolio

### 10.5 Methodological conclusion

The evaluation demonstrates that **it is possible to apply ATAM in the context of an individual thesis project without losing analytical rigor**, through methodological triangulation among documentary evidence, empirical quantitative evidence, and external validation by an expert panel. The adaptation is justified in established literature (Bass et al., 2012; Wohlin et al., 2012) and produces the deliverables required by the thesis proposal without claiming to have performed a canonical ATAM, which would be methodologically incorrect in this context.

---

## 11. Study limitations

The limitations of the evaluation, reported honestly for the jury:

1. **Simulated case studies.** Bot and IoT are academic representations; they are not production systems with real stakeholders. Generalization to other LC/NC domains requires replication.

2. **Intentionally unstructured as-is.** The as-is does not represent "the average of n8n flows in production" but rather "the worst-case antipatterned scenario" as a baseline. An organization with intermediate practices would see less dramatic improvements.

3. **Evaluation by a single author.** Although mitigated by external validation (section 8), the single-evaluator bias persists in the finding-generation phase (analysis prior to the survey).

4. **ATAM adaptation.** The asynchronous adaptation without a conversational component loses ATAM-original's capacity to generate trade-offs not anticipated through real-time group friction (a limitation inherent to the adaptation declared in ADR-MF-004).

5. **Sample size of the external validation.** With N=17 valid respondents (within the 15–30 range estimated in the protocol), the statistical analyses are descriptive and exploratory, not inferential with broad power.

6. **Non-probabilistic sampling.** Convenience + snowball; the survey results are not generalizable to the global population of software professionals.

7. **n8n-specific.** The framework was designed and evaluated on n8n; direct applicability to Zapier, Make, or Power Automate requires adapting the mechanisms (Execute Workflow, credentials, error workflow) to each platform's primitives.

8. **Unverifiable response duration.** The pre-registered analysis plan included a quality check based on the median response time (≥ 7 min, as a proxy for reflexivity); Google Forms only records the submission timestamp, not the start time, so that check could not be run against the collected data. It is documented here as an open limitation rather than silently omitted.

---

## 12. Future work

The following lines extend the study and are candidates for further research or practical application:

1. **Replication in a real production case** with genuine stakeholders and production traffic data over ≥ 3 months.
2. **Quantitative comparison against other LC/NC platforms** (Zapier, Make, Power Automate) applying an equivalent framework.
3. **Validation of the recommended mitigations** — especially SP-IOT-01 (independent error channel) and R-BOT-01 (token auto-rotation).
4. **Longitudinal study of framework adoption** in a team of 5–10 developers over 6 months, measuring learning curve, adherence, and metric improvement.
5. **Extension of the utility tree** with additional scenarios emerging from the expert panel (section 8.3).
6. **Integration with DORA metrics** (DevOps Research and Assessment): lead time, deployment frequency, MTTR, change failure rate.
7. **Application of the framework to an AI/LLM case in n8n** — AI flows introduce token cost and variable latency considerations not contemplated in this study.

---

## 13. Appendices

### Appendix A — Complete utility tree
See `docs/atam/atam-utility-tree.md`.

### Appendix B — Detailed scoring matrix
See `docs/atam/matriz-scoring.md`.

### Appendix C — Risk and trade-off registry
See `docs/atam/registro-riesgos-tradeoffs.md`.

### Appendix D — Analysis of architectural approaches
See `docs/atam/analisis-approaches.md`.

### Appendix E — Adapted ATAM methodology
See `docs/atam/metodologia-atam-adaptada.md` and `microframework/adr/ADR-MF-004-atam-adaptado-individual.md`.

### Appendix F — Survey instrument and protocol
See `docs/atam/instrumento-encuesta.md`, `docs/atam/protocolo-encuesta.md`.

### Appendix G — Statistical analysis plan
See `docs/atam/plan-analisis-encuesta.md`.

### Appendix H — Survey supporting material
See `docs/atam/material-apoyo/`.

### Appendix I — Anonymized raw survey data
Path: `medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv`

### Appendix J — Statistical analysis notebook
Path: `medicion/encuesta-validacion/analisis-encuesta.ipynb` (executed, with outputs embedded).
Equivalent command-line script: `medicion/encuesta-validacion/analisis-encuesta.py`.

---

## 14. References

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley. Chapter 21 — ATAM.
- Binzer, B., Reichel, A. & Winkler, T. J. (2024). Low-code platforms: a literature review. *Journal of Systems and Software*, 215.
- Cohen, J. (1960). A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 20(1), 37-46.
- Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. *Psychometrika*, 16(3), 297-334.
- Denzin, N. K. (1978). *The Research Act: A Theoretical Introduction to Sociological Methods*. McGraw-Hill.
- Feio, F., Pereira, L. & Pinto, L. (2024). DevSecOps practices: a systematic mapping study. *Information and Software Technology*, 167.
- Gartner (2022). *Low-Code Development Technologies Forecast 2023–2027*.
- ISO/IEC 25010:2011. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*.
- Kazman, R., Klein, M. & Clements, P. (2000). *ATAM: Method for Architecture Evaluation*. Technical Report CMU/SEI-2000-TR-004. Software Engineering Institute, Carnegie Mellon University.
- Kitchenham, B. & Pfleeger, S. L. (2008). Personal Opinion Surveys. In *Guide to Advanced Empirical Software Engineering* (pp. 63–92). Springer.
- Krippendorff, K. (2018). *Content Analysis: An Introduction to Its Methodology* (4th ed.). Sage.
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Viljoen, J., Schmidt, A. & van Greuning, J. (2024). Governance of low-code platforms in enterprise contexts. *International Journal of Information Management*, 76.
- Wohlin, C., Runeson, P., Höst, M., Ohlsson, M. C., Regnell, B. & Wesslén, A. (2012). *Experimentation in Software Engineering*. Springer.
- Yin, R. K. (2018). *Case Study Research and Applications: Design and Methods* (6th ed.). Sage.

---

*Document generated on 2026-05-07 · Version 1.0 with section 8 in preliminary status*
*Next update after the close of the external validation survey*
