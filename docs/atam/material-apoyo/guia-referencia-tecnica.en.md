> 🌐 **Language / Idioma:** English · [Español](guia-referencia-tecnica.md)

# Technical Reference Guide

**Architectural Micro-framework LC/NC for n8n**

Master's thesis · Master's in Management, Application and Software Development (MGADS) · UNAB · 2026
**Author:** Elian Hernando Gil Sierra · **Advisor:** Sebastian Roa Prada, PhD

> 📄 **This file is a reading transcription** of the original PDF [`guia-referencia-tecnica.pdf`](guia-referencia-tecnica.pdf) (4 pages), generated to make review easier without needing a PDF reader. The PDF is the authoritative source and reference; in case of any formatting or content discrepancy, the PDF prevails. This guide is one of the support materials reviewed by the expert panel respondents before the external validation survey (see [`protocolo-encuesta.md`](../protocolo-encuesta.en.md) §4).

---

## 1. The Problem

Low-Code/No-Code (LC/NC) platforms such as n8n, Zapier, Make, or Power Automate have gained massive adoption in enterprise environments. Without architectural structure, they generate critical and systemic technical debt as documented in the literature (Binzer et al., 2024; Viljoen et al., 2024).

| Frequent antipattern | Operational impact |
|---|---|
| Secrets and API keys hardcoded in the exported JSON | Immediate security risk upon any export of the flow |
| No retry mechanism or idempotency | Duplicated or lost data on transient network failures |
| Business logic coupled to external integrations | Simple changes impact 5–8 nodes; high maintenance cost |
| No error workflow defined | Silent, unrecoverable failures; manual diagnosis in the UI |
| Absence of structured logging | Average MTTD ~7 minutes; impossible to automate failure alerts |

## 2. The Proposal: The Micro-Framework

An architectural micro-framework for n8n was designed, grounded in Clean Architecture (Martin, 2017) and DevSecOps practices. It does not modify n8n nor require external tools: it is a set of design decisions and verifiable rules applied directly when building flows.

### 2.1 Metamodel: Four Functional Stages (E1–E4)

```
Execution flow:
  webhook → E1 Validation → E2 Domain → E3 Adapters → E4 Output → respond
  If any stage fails → Error Workflow captures the failure and preserves the payload in a PostgreSQL dead-letter
```

| Stage | Responsibility | Key restriction |
|---|---|---|
| E1 — Validation | Validates the payload against a strict schema. Verifies authentication and authorization. | Does not execute business logic nor call external APIs. |
| E2 — Domain | Executes pure business logic: calculations, classifications, routing. | Does not call the DB or APIs. No external side effects. |
| E3 — Adapters | Interacts with external services: DB, third-party APIs, queues. | One integration per node. Implements mandatory idempotency. |
| E4 — Output | Produces the final response: notifications, webhooks, status records. | Last link. Differentiated routing by criticality. |

### 2.2 The 10 Mandatory Rules (REG-001 to REG-010)

Binary criterion, automatically verifiable on the exported JSON via the static validator `validar-flujos.mjs`.

> ⚠️ **Transcription note:** the original PDF table uses a two-column layout that could not be reconstructed with absolute certainty when extracting the text (the exact association between each `REG-00X` ID and its content row was lost in the conversion). The following names and criteria are complete and faithful to the PDF; for the exact ID↔rule correspondence, see [`microframework/reglas/reglas-obligatorias.md`](../../../microframework/reglas/reglas-obligatorias.en.md), which is the canonical source for the mapping.

| Rule name | Verifiable criterion |
|---|---|
| Secrets management | No literal tokens or passwords in the JSON. Use an n8n native credential or `$env.VAR_NAME`. |
| Centralized orchestration | A single orchestrator flow per process. Subflows invoked from it. |
| Mandatory error workflow | Captures failures. Preserves the payload in a PostgreSQL dead-letter. |
| Retry with backoff | Retries with growing wait time on every outgoing HTTP call. |
| Idempotency | Idempotency-Key on HTTP / ON CONFLICT in the DB on mutating operations. |
| Structured JSON log | Log node at the start and close of each stage: stage, timestamp, status. |
| Input validation in E1 | Strict schema before any processing. HTTP 400 on invalid input. |
| Isolated domain in E2 | E2 does not directly call the DB or external APIs. |
| Correct HTTP contracts | HTTP 401 on invalid token · 400 on malformed payload · 200 only on real success. |
| Separation of integrations | In E3, one external integration per node. No mixing of responsibilities. |

## 3. Evaluated Case Studies

The framework was applied to two representative and orthogonal cases of real n8n usage, covering synchronous and asynchronous enterprise integration patterns.

**Total scale:** 8,000 runs · 12 Change Requests · 12 ATAM scenarios · 19 ADRs

| | Bot Case — Messaging Support System | IoT Case — Sensor Ingestion Pipeline |
|---|---|---|
| Type | Synchronous flow — receives message webhooks, applies priority rules, and creates tickets in an external service. | Asynchronous flow — receives sensor readings, validates, persists to PostgreSQL, and notifies according to criticality level. |
| As-is | 16 nodes · hardcoded token · no retry · no error workflow · 9/10 REGs violated | 14 nodes · no idempotency · no error workflow · exposed credentials · 9/10 REGs violated |
| To-be | Orchestrator + E2 + E3 · 10/10 REGs met | Orchestrator + E1 + E2 + E3 + E4 + error handler · 10/10 REGs met |

The diagrams in the PDF illustrate the architectural transformation applied in each case: the as-is diagram shows the original monolithic structure with the active antipatterns; the to-be diagram shows the separation into functional stages with the resilience mechanisms incorporated. REG references identify the framework rule met or violated in each component.

## 4. Quantitative Results: As-is vs To-be

Metrics were measured over 8,000 controlled runs distributed across four input sets per case (valid, invalid, retries, incorrect tokens), executed under equivalent conditions in the as-is and to-be versions. The 12 Change Requests were applied manually, recording nodes touched, dependencies affected, attempts, and time per CR. Security metrics come from the static validator `validar-flujos.mjs`. MTTD was measured by calculating the time from the emission of the failure log to the identification of the `stage` field in the structured log.

| Metric | Case | As-is | To-be | Improvement | Target |
|---|---|:---:|:---:|:---:|---|
| Nodes modified / CR | Bot | 5.3 | 1.0 | −81 % | MET (target 20 %) |
| Nodes modified / CR | IoT | 4.3 | 0.7 | −84 % | MET (target 20 %) |
| Time per CR (min) | Bot | 32.7 | 6.7 | −79 % | — |
| Time per CR (min) | IoT | 28.0 | 5.2 | −81 % | — |
| Execution failure rate | Bot | 9 % | 6 % | −33 % | MET (target 30 %) |
| MTTD failure diagnosis | Bot | ~7 min | 14 s | −97 % | MET (target 60 s) |
| Literal secrets in JSON | Bot | 4 | 0 | −100 % | MET (target = 0) |
| Literal secrets in JSON | IoT | several | 0 | −100 % | MET (target = 0) |
| REGs checklist compliance | Bot+IoT | 10 % | 100 % | +90 pp | MET (target 90 %) |

## 5. Quantified Trade-offs

Trade-offs were identified by inspecting the ADRs and quantified over the same run-logs from the 8,000 runs. The additional latency of TP-GLOBAL-01 is measured at the 50th percentile (p50) to exclude retry outliers; the magnitude is real and deliberate: the project prioritizes maintainability over performance, a decision documented in ADR-001. None of these trade-offs impacts the ATAM top-K scenarios because none evaluates efficiency as the main attribute — latency is reported as a contextual cost, not as a regression.

| ID | Trade-off | Attributes in tension | Measured magnitude |
|---|---|---|---|
| TP-GLOBAL-01 | Modularization vs Latency | Maintainability ++ vs Performance −− | Bot: +9 % p50 · IoT: +119 % to +192 % p50 (4 sequential subflows) |
| TP-GLOBAL-02 | Strict validation vs Flexibility | Functional correctness ++ vs Evolutionary flexibility −− | E1 rejects any payload that does not meet the exact defined schema. |
| TP-IOT-01 | Differentiated routing vs Latency | Critical-channel resilience + vs Baseline latency −− | +10.8 ms p50 on the critical channel vs the warning channel (ADR-IoT-004). |

The most significant trade-off is the additional latency from modularization in IoT (+119 %–192 % p50): a deliberate cost assumed in favor of maintainability, documented in ADR-001.

## 6. ATAM Findings — Synthesis

The ATAM evaluation analyzes software architectures by answering a practical question: how well does the design support real situations of change, failure, or use? For this project, 12 concrete scenarios were defined — 6 per case study — simulating real situations each flow would be exposed to. Each scenario was evaluated against the original design (as-is) and the redesign with the framework (to-be) using a 1-to-5 scale, where 1 means the design does not support the situation and 5 means it supports it with verifiable evidence.

| ISO 25010 Attribute | Scenario | What was evaluated? | As-is | To-be | Δ |
|---|---|---|:---:|:---:|:---:|
| Maintainability | BOT-Q1: Rule modifiability | If a business rule changes, how many nodes must be touched? | 2 | 5 | +3.0 |
| Maintainability | BOT-Q2: Provider change | If the ticket provider changes, is the change isolated? | 2 | 5 | +3.0 |
| Maintainability | IOT-Q1: Threshold adjustment | If a temperature threshold changes, is the change isolated? | 2 | 5 | +3.0 |
| Maintainability | IOT-Q2: Alert channel change | If the notification channel changes, is the change isolated? | 2 | 5 | +3.0 |
| Reliability | BOT-Q4: Idempotency under retries | If the same message arrives twice, are duplicates generated? | 2 | 4 | +2.0 |
| Reliability | IOT-Q3: Idempotency in persistence | If the same reading arrives twice, is it persisted as a duplicate? | 1 | 5 | +4.0 |
| Reliability | IOT-Q4: Fault tolerance | If the notification channel fails, does the system recover without losing the data? | 1 | 4 | +3.0 |
| Reliability | IOT-Q5: Differentiated urgency | If critical and warning readings arrive mixed, are they processed with the correct urgency? | 1 | 4 | +3.0 |
| Security | BOT-Q3: Credential confidentiality | Does the flow expose tokens if the file is exported? | 1 | 5 | +4.0 |
| Security | IOT-Q6: DB credential confidentiality | Does the flow expose the database password if the file is exported? | 1 | 5 | +4.0 |
| Operability | BOT-Q5: Failure diagnosis (MTTD ~14 s vs ~7 min) | If a failure occurs, how long does it take to identify what and where? | 1 | 5 | +4.0 |
| Functional suitability | BOT-Q6: Correct HTTP contracts (401/400/200) | Does the flow respond with the correct HTTP code on invalid input? | 2 | 5 | +3.0 |

### Classification of findings by ATAM category

| Category | # | Findings |
|---|:---:|---|
| **Sensitivity Points (SP)** | 3 | SP-BOT-01: Idempotency depends on the external service honoring Idempotency-Key. · SP-BOT-02: MTTD depends on the structure of the `stage` field in the JSON log. · SP-IOT-01: The error handler's channel coincides with E4's channel. |
| **Tradeoff Points (TP)** | 3 | TP-GLOBAL-01: Modularization vs latency. · TP-GLOBAL-02: Strict validation vs evolutionary flexibility. · TP-IOT-01: Differentiated routing vs nominal latency. |
| **Open Risks (R)** | 4 | R-BOT-01: Manual token rotation. · R-IOT-01: Dead-letter can fail if E4 is down. · R-GLOBAL-01: Ephemeral stdout logs without a centralized system. · R-GLOBAL-02: Idempotency depends on third-party APIs. |
| **Non-Risks (NR)** | 5 | NR-IOT-01: E3 is independent of E4; the data persists even if notification fails. · NR-IOT-02: ON CONFLICT prevents duplication on retries. · NR-BOT-01: E1 prevents side effects from malformed payloads. · NR-BOT-02: Correct HTTP 401/400 in 100 % of test sets. · NR-GLOBAL-01: The static validator prevents security regressions. |

## 7. Synthesis and Considerations

The results reflect a systematic and traceable evaluation over two representative cases, with quantitative evidence from 8,000 runs and architectural evidence from 12 ATAM scenarios and 19 documented ADRs. On every measured indicator, the to-be design outperforms the as-is, with no regression in any scenario.

The results are not absolute: three sensitivity points flag external dependencies that the framework cannot control on its own. The IoT latency trade-off (+119 %–192 % p50) is a deliberate cost assumed in favor of maintainability.

A framework that improves maintainability by more than 80 %, eliminates 100 % of exposed secrets, and reduces MTTD from minutes to seconds — while assuming a controlled and documented latency overhead — represents a verifiable net improvement for the type of LC/NC solutions it addresses.

> The ATAM scores correspond to the author's analysis. The expert panel's function is to confirm, question, or enrich these classifications with independent professional judgment.
