> 🌐 **Language / Idioma:** English · [Español](resumen-proyecto.md)

<!--
Markdown source of the 4-page executive summary PDF that respondents will see.
Designed to fit 4 A4 pages when exported to PDF.
Style: sober, technical, no decorative emojis, maximum information density.
-->

# LC/NC Architectural Micro-framework for n8n
## Executive summary for external validation by expert panel

**Master's thesis · Master's in Software Management, Application, and Development (MGADS)**
**Universidad Autónoma de Bucaramanga (UNAB) · 2026**
**Author:** Elian Hernando Gil Sierra · **Advisor:** Sebastian Roa Prada, PhD

---

## Page 1 · Problem and proposal

### The problem

Low-Code/No-Code (LC/NC) platforms such as n8n, Zapier, Make, or Power Automate have gained massive adoption: Gartner projects that by 2025, 70% of new enterprise applications will incorporate LC/NC, with an estimated market of USD 26.9 B in 2023. However, adoption of these platforms tends to produce "improvised" flows with no architectural structure, which generates accelerated technical debt, lack of governance, security risks (secrets in JSON, no retry, no idempotency), and operational difficulty. The literature (Binzer et al., 2024; Viljoen et al., 2024) documents these antipatterns as a systemic problem of LC/NC adoption.

### The proposal

An architectural micro-framework for n8n grounded in Clean Architecture (Martin, 2017) and DevSecOps practices, which structures any flow into four functional stages and prescribes verifiable good-practice rules.

```
┌────────────────────────────────────────────────────────────────────┐
│                       n8n Orchestrator                             │
│                                                                    │
│   ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐                         │
│   │ E1  │───▶│ E2  │───▶│ E3  │───▶│ E4  │                         │
│   │     │    │     │    │     │    │     │                         │
│   │Vali-│    │Domain    │Adap-│    │Out- │                         │
│   │date │    │(busi-│   │ters │    │put/ │                         │
│   │input│    │ness  │   │(DB, │    │noti-│                         │
│   │     │    │logic)│   │APIs)│    │fica-│                         │
│   │     │    │      │   │     │    │tion)│                         │
│   └─────┘    └─────┘    └─────┘    └─────┘                         │
│                                                                    │
│                  Error workflow (REG-003)                          │
└────────────────────────────────────────────────────────────────────┘
```

**What the framework defines:**
- **10 mandatory rules** (REG-001 to REG-010) with a verifiable binary criterion: secrets management, error workflow, retry, idempotency, structured logging, input validation, isolated domain, separation of integrations, correct HTTP contracts, centralized orchestration.
- **6 recommended rules** (REC-001 to REC-006) for optimization.
- **5 patterns** documented with trade-offs: retry with backoff, idempotency, circuit breaker, error boundary, saga/compensation.
- **11 antipatterns** identified with code examples.
- **Architecture checklist** (10 items) and **DevSecOps checklist** (8 items).
- **9 JSON Schemas** for I/O contracts.
- **Executable static validator** (`validar-flujos.mjs`) that automatically verifies REG-001…010 on any exported JSON.
- **Minimum observability guide** with a structured JSON log contract per stage.

---

## Page 2 · Comparative case studies

The framework was evaluated on two representative, orthogonal cases: a **support Bot** (synchronous, business rules, integration with an external ticketing service) and an **IoT Pipeline** (ingestion, validation, persistence, and notification of environmental sensor readings).

### Bot case — As-is (antipattern) vs To-be (with framework)

```
AS-IS (16 nodes, 9/10 REGs violated):
  webhook → [validate payload] → [in-memory rate limit] → [hardcoded token]
           → [process message] → [calculate priority] → [HTTP tickets hardcoded api-key]
           → [parse response] → ... → respond

TO-BE (orchestrator + 2 subflows, 10/10 REGs met):
  webhook → E1 (validation + auth) → E2 (domain subflow) → E3 (adapter subflow)
          → respond

  • Token via $env.BOT_API_TOKEN (REG-001 ✅)
  • Idempotency-Key header in E3 (REG-005 ✅)
  • Error workflow with dead-letter (REG-003 ✅)
  • Structured JSON logging per stage (REG-006 ✅)
  • Retry on HTTP (REG-004 ✅)
```

### IoT case — As-is vs To-be

```
AS-IS (14 nodes, 9/10 REGs violated):
  webhook → [partial validation] → [calculate level via jsCode]
           → [HTTP notification] → [INSERT without ON CONFLICT] → respond

TO-BE (orchestrator + 4 subflows + error handler, 10/10 REGs met):
  webhook → E1 (validation + timestamp authority)
          → E2 (domain subflow: centralized THRESHOLDS)
          → E3 (persistence subflow: idempotency_key + ON CONFLICT)
          → E4 (notification subflow: level-based routing + differentiated retry)
          → respond

  IoT error workflow → preserves original payload in PostgreSQL dead-letter
```

### Evaluation statistics

- **8,000 controlled runs** (4,000 as-is + 4,000 to-be), synthetic datasets with deterministic seed (Sets A–K, N=200 each).
- **12 measured Change Requests** (3 CR × 2 cases × 2 versions).
- **12 top-K ATAM scenarios** evaluated (6 Bot + 6 IoT).
- **19 ADRs** documenting all architectural decisions.

---

## Page 3 · Quantitative results

### Measured improvements as-is vs to-be

| Metric | Case | As-is | To-be | Δ | Study goal |
|---|---|:---:|:---:|:---:|:---:|
| **CR impact** (nodes modified/CR, average) | Bot | 5.3 | 1.0 | **−81 %** | ≥ 20 % ✅ |
| | IoT | 4.3 | 0.7 | **−84 %** | ≥ 20 % ✅ |
| **Time per CR** (minutes, average) | Bot | 32.7 | 6.7 | **−79 %** | — |
| | IoT | 28.0 | 5.2 | **−81 %** | — |
| **Runtime failures** | Bot | 9 % | 6 % | **−36.6 %** | ≥ 30 % ✅ |
| | IoT | 0 %* | 1 %† | n/a | * antipattern / † correct validation |
| **Checklist compliance** | Bot | n/a | 100 % | — | ≥ 90 % ✅ |
| | IoT | n/a | 100 % | — | ≥ 90 % ✅ |
| **Failure diagnosis MTTD** | Bot | ~5-10 min | **~14 s** | — | ≤ 60 s ✅ |
| **Literal secrets in JSON** | Bot | 4 | **0** | −100 % | 0 ✅ |
| | IoT | several | **0** | −100 % | 0 ✅ |

### Quantified trade-offs

| Trade-off | Magnitude | Documented decision |
|---|---|---|
| **TP-GLOBAL-01:** modularization vs latency | Bot: +9 % p50 Set A · IoT: +119 % to +192 % p50 | Accepted (ADR-001) — project prioritizes maintainability |
| **TP-IOT-01:** critical channel resilience vs nominal latency | +10.8 ms p50 critical vs warning | Accepted (ADR-004 IoT) |
| **TP-GLOBAL-02:** strict validation vs contract flexibility | Qualitative | Accepted — correctness over flexibility |

### ATAM coverage

- 12/12 scenarios with traceable evidence (Bot 100% · IoT 100%)
- Runtime analysis of IOT-Q4 confirmed active retry + identified SP-IOT-01 (duplicated channel in the error handler)
- Analysis of IOT-Q5 confirmed differentiated routing + quantified TP-IOT-01

---

## Page 4 · Preliminary findings for discussion + Request to the panel

### Architectural findings from the author's ATAM analysis

**3 Sensitivity Points** (decisions that affect a single attribute):
- **SP-BOT-01** — BOT-Q4 idempotency depends on the `Idempotency-Key` header and the external service honoring it.
- **SP-BOT-02** — BOT-Q5 MTTD depends on the structure of E1's JSON log.
- **SP-IOT-01** — IoT error handler channel coincides with the E4 channel (discovered at runtime).

**3 Tradeoff Points** (decisions that affect multiple attributes):
- **TP-GLOBAL-01** — Subflows: maintainability ↑↑ vs latency ↓ (significant in IoT).
- **TP-GLOBAL-02** — Strict E1 validation: correctness ↑↑ vs evolutionary flexibility ↓.
- **TP-IOT-01** — Differentiated critical/warning routing: resilience ↑ vs latency +10.8 ms.

**4 open Risks** (mitigation recommended in production):
- **R-BOT-01** — Manual token rotation, no auto-rotation.
- **R-IOT-01** — Dead-letter not inserted if E4 is fully down (correlated with SP-IOT-01).
- **R-GLOBAL-01** — Logs in ephemeral stdout with no persistent volume.
- **R-GLOBAL-02** — Dependency on external services honoring contracts.

**5 confirmed Non-risks** (decisions that clearly preserve the attribute):
- **NR-IOT-01** — E3 (PostgreSQL) is independent of E4; data is safe even if E4 fails.
- **NR-IOT-02** — Idempotency prevents duplication even with external retries.
- **NR-BOT-01** — E1 validation prevents unauthorized side effects.
- **NR-BOT-02** — Correct HTTP contracts (401/400) in 100% of Sets C/D.
- **NR-GLOBAL-01** — The static validator protects against security regressions.

### What we need from you

Your expert opinion externally validates these conclusions and helps identify findings we may not have anticipated. The survey has **two parts**:

**Main part (10–12 minutes):**
1. Quick characterization of your professional profile (1.5 min)
2. Eight perceived-validation questions with a 1-5 Likert scale (5 min)
3. Three open questions on risks, trade-offs, and refinements (3 min)
4. Overall perception of the framework (1 min)

**Optional advanced part — Mini-ATAM (+15 minutes):**
If your role and experience allow, 1-5 scoring for as-is/to-be on the 12 scenarios and architectural classification (SP/TP/R/NR). This component provides additional methodological value to triangulate the author's scoring.

### Guiding questions while you review the video and this document

So that your answers to the open questions (Section C) are specific and useful:

1. Are the three identified Tradeoff Points reasonable and proportionate? Is any missing?
2. Do the four open Risks have appropriate severity? Do you know of more effective mitigations?
3. Are the 10 mandatory rules applicable in your context? Does any rule seem unnecessary, missing, or need nuance?
4. Is the TP-GLOBAL-01 trade-off (+119% latency in IoT due to modularization) acceptable, or would it be a blocker in your context?

### Contact

**Elian Hernando Gil Sierra** · MGADS Student — UNAB · 2026

Project repository (public): https://github.com/[user]/n8n-microframework
Email: [author's email]

Thank you very much for your time and expertise.

---

*4-page document — version 1.0 — 2026-05-07*
*Survey support material documented in* `atam/protocolo-encuesta.md`
