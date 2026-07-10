> 🌐 **Language / Idioma:** English · [Español](plan-trabajo-fase7.md)

# Work Plan — Phase 7 (ATAM Evaluation) — Full Closure

**Version:** 1.0
**Date:** 2026-05-07
**Author:** Elian Hernando Gil Sierra
**Purpose:** Bring OE3 (ATAM protocol implementation) from 45% to the maximum achievable before executing the survey, leaving only the collection of responses and their subsequent analysis pending.

> ✅ **Closure note (2026-07-08).** This document is the work plan as conceived before executing
> Phase 7 — it is kept intact as a historical planning record. The checklists and references to a
> "§8 placeholder" below describe the *planned* state, not the current one. Phase 7 has since been
> fully executed: the survey was collected (June 17–24, 2026), analyzed, and §8 of
> `informe-atam-final.md` is written up with real results. See `docs/atam/INDEX.md` and
> `estado-actual.md` for the current status.

---

## Table of contents

- [1. Starting state and objective](#1-estado-de-partida-y-objetivo)
- [2. Executive summary of the plan](#2-resumen-ejecutivo-del-plan)
- [3. Block A — Complete residual evidence (4 h)](#3-bloque-a)
- [4. Block B — Formal ATAM approaches analysis (16 h)](#4-bloque-b)
- [5. Block C — Documented methodological adaptation (4 h)](#5-bloque-c)
- [6. Block D — Full design of the external validation instrument (12 h)](#6-bloque-d)
- [7. Block E — Consolidated ATAM report (16 h)](#7-bloque-e)
- [8. Block F — Closure and traceability (2 h)](#8-bloque-f)
- [9. Suggested schedule](#9-cronograma-sugerido)
- [10. Final artifact structure](#10-estructura-final-de-artefactos)
- [11. Definition of "Done"](#11-definicion-de-listo)

---

## 1. Starting state and objective

### Current state of OE3 (as of 2026-05-07)
- ✅ Utility Tree with 12 top-K scenarios (`docs/atam/atam-utility-tree.md`)
- ✅ Scenario × evidence matrix (11/12 = 92% coverage) (`medicion/consolidado/atam-evidencia.md`)
- ✅ IOT-Q4 runtime executed → SP-IOT-01, R-IOT-01, NR-IOT-01 documented
- ✅ IOT-Q5 analysis executed → TP-IOT-01 documented
- ⏳ Formal analysis of architectural approaches (ATAM Step 6)
- ⏳ 1–5 as-is/to-be scoring matrix per scenario
- ⏳ Consolidated registry of risks and trade-offs
- ⏳ Formal methodological adaptation documented (ADR)
- ⏳ External validation instrument designed
- ⏳ Consolidated ATAM report drafted

### Objective of this plan
By the end of the plan's execution, OE3 reaches ~90% progress. The remaining 10% corresponds exclusively to:
1. Execution of the survey (waiting on the panel — outside the author's control)
2. Statistical analysis of the responses received (routine, ~3-5 days post-collection)
3. Integration of findings into a reserved section of the report (~1 day)

---

## 2. Executive summary of the plan

| Block | Description | Effort | Main output |
|---|---|---|---|
| **A** | Complete residual evidence (BOT-Q5 runtime, NR-IOT-01 query) | 4 h | Updated `mttd-resultado.md` and `atam-evidencia.md` |
| **B** | Formal ATAM approaches analysis (SP/TP/R/NR + 1-5 scoring) | 16 h | `analisis-approaches.md`, `matriz-scoring.md`, `registro-riesgos-tradeoffs.md` |
| **C** | Documented methodological adaptation (ADR + methodology chapter) | 4 h | `ADR-MF-004` + `metodologia-atam-adaptada.md` |
| **D** | Full survey design (instrument + protocol + material + analysis) | 12 h | `protocolo-encuesta.md`, `instrumento-encuesta.md`, `material-apoyo/`, `plan-analisis-encuesta.md` |
| **E** | Consolidated ATAM report (thesis chapter) | 16 h | `informe-atam-final.md` |
| **F** | Closure and traceability | 2 h | Updated `estado-actual.md`, artifact index |

**Total effort:** ~54 h ≈ 7 days of focused work.

---

## 3. Block A — Complete residual evidence {#3-bloque-a}
**Effort:** 4 h

### A.1 — E3 PostgreSQL verification for NR-IOT-01 (30 min)
**Purpose:** confirm that the IOT-Q4 runtime test reading was persisted in PostgreSQL before the E4 failure.

**Procedure (PowerShell):**
```powershell
docker compose -f infraestructura/docker-compose.yml exec postgres `
  psql -U n8n_user -d sensores_db -c `
  "SELECT sensor_id, temperatura, humedad, co2, nivel_alerta, created_at
   FROM lecturas_sensor
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC LIMIT 5;"
```
**Output:** annotation in `mttd-resultado.md §IOT-Q4-runtime` with the row `id` and timestamp. If the row exists → NR-IOT-01 confirmed at runtime.

### A.2 — BOT-Q5 runtime live measurement (3 h)
**Purpose:** convert BOT-Q5 from "analytical" (~14 s estimated) to "runtime measured" (Bot 6/6 = 100%).

**Procedure:**
1. Import `bot-to-be-orquestador.json`, activated in n8n.
2. Start a stopwatch when executing:
   ```powershell
   $body = Get-Content "medicion\datasets\bot\input-set-C.json" -Raw
   Invoke-WebRequest -Method POST -Uri "http://localhost:5678/webhook/bot-support-to-be" `
     -ContentType "application/json" -Body $body
   ```
3. Measure the time from receiving the 401 to identifying the node+cause with:
   ```powershell
   docker compose -f infraestructura/docker-compose.yml logs n8n --since 2m | `
     Select-String '"status":"fail"' | Select-Object -Last 3
   ```
4. Repeat 5 times and record (median and range).

**Output:**
- `BOT-Q5-runtime` section in `mttd-resultado.md` with a table of 5 measurements.
- Row in `run-log-bot-to-be.csv` with `run_id: bot-tobe-Q5-LIVE-{NNNN}-{commit}`.
- Update `atam-evidencia.md`: BOT-Q5 ⚠️ Partial → ✅ Complete.
- Final coverage: Bot 6/6 = 100%, IoT 6/6 = 100%, **Total 12/12 = 100% ✅**.

---

## 4. Block B — Formal ATAM approaches analysis {#4-bloque-b}
**Effort:** 16 h ≈ 2 days

### B.1 — Identification of architectural approaches (4 h)
**File:** `docs/atam/analisis-approaches.md`

**Approaches to document** (architectural decisions with impact on quality attributes):

| ID | Approach | Origin | Attributes affected |
|---|---|---|---|
| AP-01 | E1–E4 separation (Clean Architecture in flows) | Bot/IoT ADR-001 | Maintainability, Modularity |
| AP-02 | Execute Workflow subflows | ADR-001 | Maintainability, Reusability, ⚠️ Efficiency (latency) |
| AP-03 | Secrets management via n8n credentials | ADR-MF-001 | Security/Confidentiality |
| AP-04 | Retry-with-backoff pattern (REG-004) | ADR-MF-002 | Reliability/Fault tolerance |
| AP-05 | Idempotency pattern (`ON CONFLICT` + idempotency_key) | IoT ADR-003, REG-005 | Reliability/Maturity |
| AP-06 | Error workflow with dead-letter | IoT ADR-005, Bot ADR-006, REG-003 | Reliability, Operability |
| AP-07 | Structured JSON log per stage | ADR-MF-003, REG-006 | Operability/Monitorability |
| AP-08 | E1 validation with JSON Schema | IoT ADR-006, REG-009 | Functional suitability, Security |
| AP-09 | Level-differentiated routing (IoT E4) | IoT ADR-004 | Reliability, Efficiency |
| AP-10 | Centralized constants in E2 (UMBRALES) | IoT ADR-002, REG-007, REC-001 | Maintainability |
| AP-11 | Static validation `validar-flujos.mjs` | DevSecOps Pillar 2 | Functional suitability (governance) |
| AP-12 | Timestamp authority (IoT E1) | IoT ADR-007 | Functional suitability, Traceability |

For each approach document: **Decision · Attributes affected · Associated rules · ADRs · ATAM scenarios covered · Known trade-offs**.

### B.2 — SP / TP / R / NR classification per scenario (8 h)
**File:** `docs/atam/analisis-approaches.md` §2

For each of the 12 scenarios, complete:

| Field | Description |
|---|---|
| Sensitivity Points (SP) | Decisions whose modification mainly affects ONE attribute |
| Tradeoff Points (TP) | Decisions that affect multiple attributes in opposite directions |
| Risks (R) | Decisions that could compromise an attribute in a specific scenario |
| Non-risks (NR) | Decisions that clearly preserve the attribute |

**Preliminary findings already identified** (to be integrated):
- SP-IOT-01: The error handler channel coincides with the E4 channel
- R-IOT-01: `neverError:true` does not cover ECONNREFUSED → dead-letter can be blocked
- NR-IOT-01: E3 PostgreSQL is independent of E4
- TP-IOT-01: maxRetries=3 critical vs. 2 warning: resilience ↑ vs. latency +10.8 ms

**Additional expected findings** (to be derived):
- TP-GLOBAL-01: Execute Workflow subflows → maintainability ↑ vs. latency +119–192% in IoT
- R-BOT-01: Token in `$env` requires a documented rotation process (not n8n's responsibility)
- NR-BOT-01: E1 validation rejects with 401/400 before invoking adapters → prevents unauthorized side effects
- SP-BOT-01: Idempotency-Key in E3 → sole dependency to guarantee BOT-Q4

### B.3 — 1–5 as-is vs. to-be scoring matrix (3 h)
**File:** `docs/atam/matriz-scoring.md`

**Template:**

| Scenario | Attribute | As-is score (1-5) | As-is justification | To-be score (1-5) | To-be justification | Δ | Evidence |
|---|---|---|---|---|---|---|---|
| BOT-Q1 | Maintainability | 2 | 8 nodes touched, scattered logic | 5 | 1 node in E2, stable contract | +3 | cr-log-bot CR1 |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Operationally defined scale:**
- 1 = Not supported / explicit antipattern
- 2 = Partial with documented violations
- 3 = Minimally compliant
- 4 = Well supported with evidence
- 5 = Excellent, with quantitative evidence and an explicit pattern

### B.4 — Consolidated registry of risks and trade-offs (1 h)
**File:** `docs/atam/registro-riesgos-tradeoffs.md`

**Template per finding:**
```
ID: [SP|TP|R|NR]-[CASE]-[NN]
Type: Sensitivity Point | Tradeoff Point | Risk | Non-Risk
Description: ...
Impacted scenarios: ...
Related approaches: ...
Affected attributes: ...
Severity: High | Medium | Low (only for R)
Recommended mitigation: ...
Evidence: file path / commit
```

---

## 5. Block C — Documented methodological adaptation {#5-bloque-c}
**Effort:** 4 h

### C.1 — ADR-MF-004: individual ATAM adaptation (1.5 h)
**File:** `microframework/adr/ADR-MF-004-atam-adaptado-individual.md`

Documents and justifies:
- Context: individual thesis project without a multi-stakeholder team
- Decision: asynchronous modified ATAM with external validation by an expert panel
- Alternatives considered: full ATAM (discarded due to constraint), pure internal evaluation (discarded due to bias), SAAM (discarded for lower robustness)
- Academic support: Bass et al. (2012) ATAM lightweight variants, Wohlin et al. (2012) expert opinion surveys, Kitchenham & Pfleeger personal opinion survey guidelines
- Positive consequences and methodological trade-offs

### C.2 — Methodological document (2.5 h)
**File:** `docs/atam/metodologia-atam-adaptada.md`

Content:
1. ATAM reference framework (Bass et al. 2012, Kazman 2000)
2. Justification of the adaptation to the individual context
3. Step-by-step mapping from original ATAM → adapted ATAM
4. Methodological triangulation (quantitative + documentary + expert opinion)
5. Table of equivalences by ATAM step:

| Original ATAM step | Adaptation in this project | Justification |
|---|---|---|
| 1. Present ATAM | Section 2 of the report | Documentation replaces the oral presentation |
| 2. Present business drivers | Section 3 (based on proyecto-overview.md) | — |
| 3. Present architecture | Section 4 (based on arquitectura-flujos.md) | — |
| 4. Identify approaches | Section 5 (analisis-approaches.md) | — |
| 5. Generate utility tree | atam-utility-tree.md (already produced) | — |
| 6. Analyze approaches (SP/TP/R/NR) | Section 6 (analisis-approaches.md §2) | — |
| 7. Brainstorm/prioritize scenarios | Prioritization by importance × difficulty (utility tree) | Brainstorming replaced by structured analysis |
| 8. Re-analyze approaches | Refinement based on quantitative evidence | Empirical evidence instead of discussion |
| 9. Present results | **External validation by expert panel** (survey) | Compensates for the absence of real-time stakeholders |

6. Bias mitigation plan (single-evaluator → survey + quantitative data)

---

## 6. Block D — Full design of the external validation instrument {#6-bloque-d}
**Effort:** 12 h ≈ 1.5 days

> By the end of this block, the instrument is **ready to distribute** — only sending the invitations remains.

### D.1 — Survey protocol (2 h)
**File:** `docs/atam/protocolo-encuesta.md`

Content:

**a) Respondent inclusion criteria**
- Age ≥ 18 years
- Minimum 3 years of professional experience in software development
- Current or past role in: development, architecture, DevOps, QA, security
- Basic familiarity with process automation or integrations

**b) Exclusion criteria**
- No experience in professional software
- Direct conflict of interest with the author (first-degree relatives)

**c) Informed consent** (full text to be included as the first screen of the form):
```
This survey is part of the Master's thesis in Software Management, Application,
and Development (MGADS) at the Universidad Autónoma de Bucaramanga.

Objective: externally validate an architectural micro-framework for
Low-Code/No-Code workflows in n8n.

Estimated time: 10–12 minutes.

Anonymity: No data that would allow individual identification is requested.
Responses are processed in aggregate and only descriptive statistics are
published in the final document.

Use of data: exclusively academic. Not shared with third parties.

Voluntariness: you may abandon the survey at any time. By submitting the
form you consent to the anonymous academic use of your responses.

Contact: [author's email].
```

**d) Procedure**
1. The respondent receives the link through a direct channel (email/LinkedIn DM/WhatsApp)
2. Reads the consent → accepts → reviews supporting material (4-page PDF + 5-min video) → responds
3. Mini-ATAM (3-5 selected experts): additional optional block with scoring of the 12 scenarios

**e) Target sample size**
- Broad survey: ≥ 15 respondents (minimum acceptable for descriptive reporting)
- Mini-ATAM experts: 3–5 respondents (qualitative saturation)

**f) Platform**
Google Forms (free, exportable to CSV, integrable with Sheets)

### D.2 — Main survey instrument (5 h)
**File:** `docs/atam/instrumento-encuesta.md`

**Final structure: 18 questions, estimated time 10–12 min**

---

#### SECTION A — Respondent characterization (5 questions, ~1.5 min)

**A1.** What is your current primary role?
- Developer / Software Engineer
- Tech Lead / Senior developer
- Software Architect
- DevOps Engineer / SRE
- Security Engineer
- QA / Testing Engineer
- Other: _____

**A2.** How many years of professional experience do you have in software development?
- < 3 years
- 3 to 5 years
- 5 to 10 years
- > 10 years

**A3.** Familiarity with Low-Code/No-Code platforms (n8n, Zapier, Make, Power Automate, etc.)
*Scale: 1=None · 2=Low · 3=Medium · 4=High · 5=Very high*

**A4.** Familiarity with Clean Architecture principles and separation of concerns
*Scale: 1=None · 2=Low · 3=Medium · 4=High · 5=Very high*

**A5.** Familiarity with architectural evaluation methods (ATAM, SAAM, ADR, ISO 25010 attributes)
*Scale: 1=None · 2=Low · 3=Medium · 4=High · 5=Very high*

---

#### SECTION B — Perceived validation of the framework (8 questions, ~5 min)
*Indicate your level of agreement with each statement after reviewing the supporting material (PDF + video).*
*1–5 Likert scale: 1=Strongly disagree · 2=Disagree · 3=Neutral · 4=Agree · 5=Strongly agree*

**Maintainability**
**B1.** Separation into E1–E4 stages clearly improves modularity compared to the as-is design shown.
**B2.** The reduction in nodes touched per Change Request (from 5–8 to 1) is a significant architectural improvement.

**Reliability**
**B3.** The proposed retry and idempotency patterns are adequate to prevent data loss or duplication.
**B4.** The error workflow with dead-letter (preservation of the original payload) is a sound architectural decision for the IoT domain.

**Security**
**B5.** Secrets management via n8n native credentials (REG-001) is appropriate for production environments.

**Operability**
**B6.** The structured JSON log per stage facilitates failure diagnosis without requiring the n8n interface to be opened.

**Applicability**
**B7.** The framework's 10 mandatory rules are applicable to real LC/NC projects in my work context.
**B8.** The framework provides architectural value without imposing an excessive complexity burden on the developer.

---

#### SECTION C — Identification of risks and trade-offs (3 open-ended questions, ~3 min)

**C1.** What architectural risk do you consider most relevant in the presented to-be design?
*(Suggestion: think about latency, circular dependencies, operational complexity, cost of change, etc.)*
[Open answer — max. 500 characters]

**C2.** What trade-off do you identify as most critical among those presented?
*(For example: +119% additional latency in IoT due to subflows vs. the gain in modularity.)*
[Open answer — max. 500 characters]

**C3.** What rule or pattern of the framework would you question, refine, or add?
[Open answer — max. 500 characters]

---

#### SECTION D — Overall perception (2 questions, ~1 min)

**D1.** On a scale of 1 to 10, how do you rate the proposed micro-framework overall?
*1–10 scale*

**D2.** Would you adopt this framework (or its principles) in a current or future LC/NC project?
- Yes, without major modifications
- Yes, with adaptations to my context
- Maybe, would require more evidence
- No, I would not adopt it

*If you answered "Maybe" or "No", please briefly justify:*
[Optional open answer — max. 300 characters]

---

#### SECTION E — Mini-ATAM (OPTIONAL, invited experts only — ~15 additional min)

*This section is optional. If your role and experience allow it, we invite you to evaluate the 12 ATAM scenarios with as-is vs. to-be severity scoring and architectural classification.*

[Link to complementary form with template per scenario:]
- As-is score (1-5)
- To-be score (1-5)
- Architectural classification: ☐ Non-risk ☐ Sensitivity ☐ Tradeoff ☐ Risk
- Confidence (1-5)
- Free comment

---

### D.3 — Supporting material (3.5 h)
**Folder:** `docs/atam/material-apoyo/`

**a) Executive summary PDF (4 pages)** — `resumen-proyecto.pdf`

Structure:
- **Page 1:** Problem (ungoverned LC/NC) + proposal (E1–E4 micro-framework) + 1 metamodel diagram
- **Page 2:** 2 case studies (Bot + IoT) — comparative as-is vs. to-be diagrams (1 case per column)
- **Page 3:** Table of key quantitative results (CR impact, failures, latency, MTTD, checklist)
- **Page 4:** Preliminary architectural findings (SP/TP/R/NR) + key questions for the evaluator

**b) Video script (5 min)** — `guion-video.md`

Structure:
- 0:00–0:30 — Who I am and what this project is (MGADS)
- 0:30–1:30 — Problem: real LC/NC case without clear architecture → consequences
- 1:30–2:30 — Proposal: E1–E4 micro-framework with 10 rules, 5 patterns, DevSecOps
- 2:30–3:30 — Bot case: as-is → to-be → metrics
- 3:30–4:30 — IoT case: as-is → to-be → metrics + ATAM findings (SP/TP)
- 4:30–5:00 — What I need from you (review PDF + 10-min survey) + thanks

Record with Loom or OBS Studio. Upload to YouTube (unlisted) or Loom.

**c) Animated or static diagram** — `diagrama-comparativo.png`

Mermaid + Excalidraw to show as-is vs. to-be side by side with annotations per stage.

### D.4 — Statistical analysis plan (1 h)
**File:** `docs/atam/plan-analisis-encuesta.md`

Content:

**Quantitative analysis (Section A, B, D1, D2):**
- Descriptive statistics: frequencies, percentages, mean, median, standard deviation per Likert item
- Distribution of respondents by role and experience (Section A) to characterize the sample
- Internal consistency test: Cronbach's α by group of related items (if N ≥ 15)
- Light correlational analysis: does the perception of the framework (B7-B8) vary by role or experience?

**Qualitative analysis (Section C, D2 justification):**
- Open coding of responses (Strauss & Corbin 1990)
- Identification of emergent categories of risks and trade-offs
- Frequency table of mentioned categories
- Representative quotes to include in the report

**Mini-ATAM analysis (Section E):**
- Comparison of as-is vs. to-be scoring among experts (boxplot per scenario)
- Inter-rater agreement: Cohen's κ (2 experts) or Krippendorff's α (≥ 3 experts)
- Agreement on architectural classification (SP/TP/R/NR)

**Sample acceptance criteria:**
- N ≥ 15 for Section A-D (minimum for descriptive reporting)
- N ≥ 3 experts for Section E (qualitative saturation)
- Role heterogeneity: at least 3 distinct roles represented

**Tools:**
- Export responses to CSV from Google Forms
- Analysis in Python (pandas, scipy.stats, krippendorff) — `analisis-encuesta.ipynb` notebook
- Visualizations with matplotlib/seaborn

### D.5 — Distribution plan and candidate list (30 min)
**File:** `docs/atam/plan-difusion.md`

Distribution channels:
- Personal email to selected colleagues
- Direct LinkedIn messages to contacts with a suitable profile
- n8n communities (official Discord, forum)
- Academic and professional WhatsApp/Telegram groups
- MGADS classmates and professors

**Short invitation template:**
```
Hi [name],

I'm in the final stage of my MGADS-UNAB Master's thesis:
an architectural micro-framework for n8n workflows with Clean
Architecture and DevSecOps principles, evaluated using ATAM.

I need your expert opinion — it's 10–12 minutes:
• 5 min reviewing 1 PDF + 1 short video
• 10 min answering a concise survey with scales and 3 open-ended questions

Your input is valuable because [personalized reason based on the invitee's profile].

Link: [form URL]
Prior material: [PDF/video URL]

Thanks so much,
Elian Hernando Gil Sierra
```

**Candidate list** (to be filled in during execution — template included with columns: Name, Role, Company, Channel, Status, Invitation date, Response date, Notes)

### D.6 — Piloting (included in the effort of the previous steps)
**Procedure:**
- Before broad distribution, pilot with 2–3 close people
- Gather feedback on question clarity and actual response time
- Adjust wording if the median time exceeds 15 min

---

## 7. Block E — Consolidated ATAM report {#7-bloque-e}
**Effort:** 16 h ≈ 2 days
**File:** `docs/atam/informe-atam-final.md`

This is the **thesis chapter** corresponding to R4 (ATAM Protocol and Report).

### Proposed structure (following Bass et al. 2012, ch. 21)

```
1. Introduction and objective
   1.1 Project context and motivation for architectural evaluation
   1.2 Scope of the evaluation
   1.3 Methodological adaptation (reference to metodologia-atam-adaptada.md)

2. Business drivers
   2.1 Case study characteristics
   2.2 Prioritized quality attributes (ISO 25010)
   2.3 Implicit stakeholders

3. Presentation of the architecture
   3.1 As-is architecture (Bot, IoT) with diagrams
   3.2 To-be architecture (Bot, IoT) with diagrams
   3.3 Applied architectural approaches (reference to analisis-approaches.md)

4. Utility tree
   4.1 12 top-K scenarios (imported from atam-utility-tree.md)
   4.2 Prioritization (importance × difficulty)

5. Analysis of the approaches
   5.1 Sensitivity Points identified
   5.2 Tradeoff Points identified
   5.3 Risks identified
   5.4 Non-risks identified
   5.5 Consolidated matrix (summary table)

6. As-is vs. to-be scoring matrix
   6.1 Scoring methodology
   6.2 Full table per scenario (reference to matriz-scoring.md)
   6.3 Visualization (radar chart per case)

7. Quantitative evaluation of evidence
   7.1 Operational metrics (summary of comparacion-2026-05-05.md)
   7.2 Maintainability metrics (cr-logs)
   7.3 Security metrics (validar-flujos.mjs)
   7.4 Operability metrics (MTTD)

8. External validation by expert panel
   [PLACEHOLDER — complete after survey execution]
   8.1 Respondent profile
   8.2 Quantitative results (Likert)
   8.3 Qualitative analysis (emergent categories)
   8.4 Inter-rater agreement (mini-ATAM)
   8.5 Triangulation with quantitative evidence

9. Synthesis of findings
   9.1 Top 5 architectural risks identified
   9.2 Top 3 main trade-offs
   9.3 Validation of the thesis proposal's goals
   9.4 Study limitations

10. Conclusions of the ATAM evaluation
    10.1 Does the micro-framework improve the prioritized attributes?
    10.2 Recommendations for adoption
    10.3 Future work (unresolved points)

Appendices
A. Full utility tree
B. Detailed scoring matrix
C. Survey templates
D. Anonymized raw data (CSV)
```

**Drafting strategy:**
- Sections 1–7 and 9.1–9.3 + 10 are drafted now (not dependent on the survey)
- Section 8 remains with a clearly delimited placeholder
- Section 9.4 already includes the limitations (among them, dependence on panel responses)

---

## 8. Block F — Closure and traceability {#8-bloque-f}
**Effort:** 2 h

### F.1 — Update `estado-actual.md` (30 min)
- Mark Phase 7 as "In advanced execution (90%) — pending only the external survey"
- Update the main phase table
- Update the immediate pending list

### F.2 — Consolidated ATAM artifact index (30 min)
**File:** `docs/atam/INDEX.md`
Lists all files produced in Phase 7 with their purpose.

### F.3 — Final "Ready for survey" checklist (15 min)
- [ ] Supporting material uploaded to accessible hosting (public URL)
- [ ] Google Forms form created and piloted
- [ ] Invitee list with ≥ 20 candidates
- [ ] Invitation template ready
- [ ] Follow-up plan (reminders at 7 and 14 days)

### F.4 — Final commit of the block (45 min)
- Message: `[FASE-7] feat: cierre completo de ATAM previo a encuesta`
- Includes: all documents generated in Blocks A-F
- Create a GitHub issue for "Run the external validation survey"

---

## 9. Suggested schedule {#9-cronograma-sugerido}

Assuming ~8 h/day of dedication:

| Day | Blocks | Tangible output |
|---|---|---|
| **Day 1** | A complete + B.1 (4+4 h) | 100% evidence + analisis-approaches.md §1 |
| **Day 2** | B.2 (8 h) | analisis-approaches.md §2 complete (SP/TP/R/NR for 12 scenarios) |
| **Day 3** | B.3 + B.4 + C complete (3+1+4 h) | matriz-scoring.md, registro-riesgos-tradeoffs.md, ADR-MF-004, metodologia-atam-adaptada.md |
| **Day 4** | D.1 + D.2 + D.5 (2+5+1 h, leaves D.3 for day 5) | protocolo-encuesta.md, instrumento-encuesta.md, plan-difusion.md |
| **Day 5** | D.3 + D.4 + piloting (3.5+1+3 h) | material-apoyo/ complete, plan-analisis-encuesta.md, piloting with 2 people |
| **Day 6** | E part 1 (8 h) | ATAM report sections 1–6 |
| **Day 7** | E part 2 + F (8+2 h) | Complete ATAM report (with §8 placeholder), closure and commit |

**Slack:** the thesis proposal's schedule reserves 06/07 to 24/07 for Phase 7 (3 weeks). This plan is executed in ~7 days → leaving ~14 days of slack for response collection.

---

## 10. Final artifact structure {#10-estructura-final-de-artefactos}

```
docs/atam/
├── INDEX.md                                 # Index of all artifacts
├── plan-trabajo-fase7.md                    # This document
├── metodologia-atam-adaptada.md             # Block C.2
├── analisis-approaches.md                   # Block B.1 + B.2
├── matriz-scoring.md                        # Block B.3
├── registro-riesgos-tradeoffs.md            # Block B.4
├── informe-atam-final.md                    # Block E (thesis chapter)
├── protocolo-encuesta.md                    # Block D.1
├── instrumento-encuesta.md                  # Block D.2
├── plan-analisis-encuesta.md                # Block D.4
├── plan-difusion.md                         # Block D.5
└── material-apoyo/
    ├── resumen-proyecto.pdf                 # 4-page PDF
    ├── guion-video.md                       # Video script
    ├── diagrama-comparativo.png             # As-is vs. to-be diagram
    └── README.md                            # Material hosting URLs

microframework/adr/
└── ADR-MF-004-atam-adaptado-individual.md   # Block C.1

medicion/consolidado/
├── atam-evidencia.md                        # Updated (BOT-Q5 ✅)
└── mttd-resultado.md                        # Updated (BOT-Q5 runtime + NR-IOT-01 verified)
```

---

## 11. Definition of "Done" {#11-definicion-de-listo}

By completing Blocks A–F, OE3 reaches **~90%** with the following criteria met:

✅ ATAM coverage **12/12 = 100%** with runtime evidence
✅ Complete formal analysis of architectural approaches
✅ 1–5 as-is/to-be scoring matrix for the 12 scenarios
✅ Consolidated registry of risks and trade-offs
✅ Documented methodological adaptation with academic support
✅ Survey instrument designed, piloted, and ready to distribute
✅ Supporting material produced and hosted
✅ Statistical analysis plan defined
✅ Consolidated ATAM report drafted (with a §8 placeholder awaiting survey data)

**Only pending item to reach 100%:**
- 🕓 Run the survey campaign (~2–3 weeks of collection)
- 🕓 Analyze responses received (~3–5 days)
- 🕓 Complete §8 of the report + adjust §9-10 according to findings (~1 day)

---

## References

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley. Ch. 21 — ATAM.
- Kazman, R., Klein, M. & Clements, P. (2000). *ATAM: Method for Architecture Evaluation*. CMU/SEI-2000-TR-004.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer. Ch. 8 — Personal Opinion Surveys.
- Kitchenham, B. & Pfleeger, S. L. (2008). *Personal Opinion Surveys*. In Guide to Advanced Empirical Software Engineering (pp. 63–92). Springer.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Denzin, N. K. (1978). *The Research Act: A Theoretical Introduction to Sociological Methods*. McGraw-Hill. — Methodological triangulation.
- ISO/IEC 25010:2011 — Systems and software quality models.
