> 🌐 **Language / Idioma:** English · [Español](instrumento-encuesta.md)

# Survey Instrument — External Validation of the LC/NC Micro-framework

**Version:** 2.0 — refactored version, executed in the field
**Date:** 2026-06-17 (collection opened; see §Instrument evolution)
**Suggested platform:** Google Forms (or equivalent Microsoft Forms)
**Estimated duration:** 10–12 min (main survey) · +15 min (optional mini-ATAM)
**Protocol:** [`protocolo-encuesta.md`](protocolo-encuesta.md)
**Purpose:** Canonical specification of each question, its type, options, conditional logic, and validations so that the person configuring the form has all the information in a single document. This file is the source of truth — the Google Form must be built exactly according to this specification.

---

## Instrument evolution: from pilot to refactored version

The instrument went through a documented refactoring, motivated by the low response rate observed in the initial version (v1.0): with approximately 75 visible items and a duration of 25 to 35 minutes, that version induced abandonment and fatigue among pilot respondents.

The refactoring was guided by a single principle — reduce the respondent's cognitive friction without sacrificing data validity — and was implemented through three concrete decisions:

1. **Consolidating items into grids** by construct and ISO/IEC 25010 attribute (instead of one independent question per statement).
2. **Externalizing the study's figures** to a previously-read executive summary PDF (see [`material-apoyo/guia-referencia-tecnica.en.md`](material-apoyo/guia-referencia-tecnica.en.md)), which also mitigates anchoring bias by separating exposure to the data from the response to each item.
3. **A visual reference table** for the twelve mini-ATAM scenarios, instead of requiring the respondent to reconstruct each scenario's context from running text.

The result was a reduction to approximately 25 items and 16 to 20 minutes of duration, without loss of information relevant to the subsequent analysis. This is the version specified in the rest of this document.

Consistent with the same friction-reduction principle, the architectural classification in Section E (the `.c` question per scenario) was captured with the **same five-point support scale** used in `.a`/`.b`, instead of requiring the respondent to master and directly apply the four ATAM categories (Non-risk / Sensitivity Point / Tradeoff Point / Risk), whose distinction is non-trivial for someone without prior ATAM training. The category is recovered through an equivalence defined *a priori*, before data collection:

| Support level marked | Recovered ATAM category |
|:---:|---|
| 1 — Not supported / active antipattern | R (Risk) |
| 2 — Weak support / inconsistent behavior | R (Risk) |
| 3 — Moderate support / no formal guarantees | SP (Sensitivity Point) |
| 4 — Good support / operational evidence | TP (Tradeoff Point) |
| 5 — Excellent / scenario measure met | NR (Non-risk) |

This operationalization reduces the respondent's entry barrier at the cost of imposing an ordinal reading on categories that in ATAM are qualitative; its validity implications are discussed in the final ATAM report (§8 and §11 on limitations).

> ⚠️ This document specifies version 2.0, already refactored and executed. Collection results (panel profile, per-item ratings, scoring and classification triangulation) are documented in `informe-atam-final.md` §8, already completed with the survey data.

---

## Global form configuration

| Parameter | Value |
|---|---|
| Form title | External validation — LC/NC Micro-framework for n8n · MGADS-UNAB 2026 |
| Email collection | DISABLED (preserves respondent anonymity) |
| Progress bar | ENABLED (reduces the abandonment rate by showing progress) |
| Allow editing responses | ENABLED (allows corrections before final submission) |
| Question order within each section | Do NOT randomize (the logical order of sections is part of the design) |
| Theme color | Dark blue or sober gray (avoid eye-catching colors that suggest bias) |
| Confirmation message on submit | Thank-you text + author's name (see "Final screen" below) |

---

## Screen 0 — Informed consent

**Type:** Cover with informational text + 1 required question.

**Section text:**

> You are being invited to participate in the external validation of an architectural
> micro-framework for Low-Code/No-Code (LC/NC) flows in n8n, as part of a Master's thesis
> in Management, Application and Software Development (MGADS) — UNAB · 2026.
>
> **What is your participation for?**
> Your judgment complements the author's architectural analysis following the ATAM
> (Architecture Tradeoff Analysis Method) adapted to the individual context.
>
> **Confidentiality:** No identifying data is requested. Only aggregated demographic
> information. Results are published only as grouped statistics.
>
> **Voluntariness:** You may close the form at any time without consequences.
>
> Contact: Elian Hernando Gil Sierra · [author's email]
> Advisor: Sebastian Roa Prada, PhD — UNAB

Full legal text (extended informed consent): see [`protocolo-encuesta.md`](protocolo-encuesta.md) §3.

**Single question on this screen:**

> **P0.** Do you agree to participate under the conditions described?
>
> Type: single choice (required)
> Options:
> - Yes, I have read the conditions and agree to participate
> - No, I prefer not to participate at this time
>
> Logic: "No" → go to final screen · "Yes" → continue to Section 1.

---

## Section 1 — Support material

**Type:** Informational text only — no questions.
**Title:** Support material — please read before continuing.

> 📄 **Executive summary** (technical reference guide, PDF · 4 pages): [LINK TO PDF]
> Description of the problem, the E1–E4 framework, as-is vs to-be comparison, metrics, and ATAM findings.
> See [`material-apoyo/guia-referencia-tecnica.en.md`](material-apoyo/guia-referencia-tecnica.en.md) for a readable version without needing a PDF.
>
> 🎥 **Presentation video** (5 minutes): [LINK TO VIDEO]
> Visual summary of the framework, case studies, and key metrics. Script in [`material-apoyo/guion-video.en.md`](material-apoyo/guion-video.en.md).

No questions in this section. The refactored form explicitly assumes the respondent
reviewed this material before continuing — Sections B and E no longer repeat the study's
figures inside the form (see "Instrument evolution" above).

---

## SECTION A — Professional profile (4 questions · ~2 min)

> Your data is reported only as aggregated distributions.

---

**A1. What is your current primary role in software development or management?**

Type: single choice (required)
Options: Developer / Software Engineer · Tech Lead · Software Architect · DevOps / SRE ·
Security · QA / Testing · IT Manager · Student with experience · Other (free field)

---

**A2. How many years of accumulated professional experience do you have in software development, architecture, or operations roles?**

Type: single choice (required)
Options:
- Less than 3 years *(disqualifies: closes the survey with an exclusion message, or is applied as a post-hoc filter if not technically possible to close on the spot — see `protocolo-encuesta.md` §2.3)*
- Between 3 and 5 years
- Between 5 and 10 years
- More than 10 years

---

**A3-A4-A5 — Familiarity level (grid)**

Type: multiple-choice grid (required — require one response per row)
Rows: LC/NC platforms (n8n, Zapier, Make, Power Automate) · Clean Architecture and separation of concerns · Architectural evaluation (ATAM, ISO 25010, ADRs, TOGAF)
Columns: None · Low · Medium · High · Very high

---

## SECTION B — Framework valuation (4 grids / 8 items · ~4 min)

> Scale common to the 4 grids: 1 = Strongly disagree · 2 = Disagree · 3 = Neutral · 4 = Agree · 5 = Strongly agree. Each grid requires one response per row.
>
> Row texts were shortened to a maximum of 70 characters (Google Forms design rule: longer rows stack vertically and degrade readability). The help texts with specific study figures that existed in the initial version of the instrument were removed — the respondent already reviewed those figures in the Section 1 support material, and repeating them in the form introduces anchoring bias (see "Instrument evolution").

**Grid B1–B2 · Maintainability**
- B1 — The four stages (E1→E2→E3→E4) improve the flow's modularity
- B2 — Going from ~5 nodes per change (as-is) to 1 node (to-be) is a verifiable improvement

**Grid B3–B4 · Reliability**
- B3 — Retry with backoff and idempotency with a unique key prevent data duplication
- B4 — Storing the full payload in a dead-letter is correct for unrecoverable IoT readings

**Grid B5–B6 · Security and Operability**
- B5 — Managing secrets only via n8n's native credentials is a minimally acceptable practice
- B6 — The JSON log per stage allows diagnosing failures without opening the n8n interface

**Grid B7–B8 · Applicability**
- B7 — The 10 mandatory rules (REG-001 to REG-010) are applicable in real LC/NC projects
- B8 — The framework provides architectural value without imposing excessive complexity on the developer

---

## SECTION C — Critical perspective (1 question · ~2 min)

> Critical perspectives are sought, not validation. The refactoring plan (Decision 5)
> originally called for three independent questions (C1 risk, C2 trade-off, C3 refinement)
> with help texts shortened to 50–80 words. **The version actually published on Google Forms
> consolidated all three into a single open question** (confirmed in the raw response data),
> taking the simplification one step further than what was documented in the planning stage.

---

**C1. What technical observation do you consider most important about the presented framework?**

Type: required paragraph · maximum 500 characters
Help text: *"You may refer to architectural risks, trade-offs you find critical, rules you would question, or aspects you would refine. Be concise."*

---

## SECTION D — Overall perception (2 required questions + 1 conditional optional · ~1 min)

> Last required section.

---

**D1. On a scale of 1 to 10, how do you rate the proposed micro-framework overall?**

Type: 1-10 linear scale (required)
Label 1: Poor — I would not recommend it
Label 10: Excellent — I would adopt it without major changes

---

**D2. Would you adopt this framework — or its core principles — in a current or future LC/NC project at your organization?**

Type: single choice (required)
Options:
- Yes, without major modifications
- Yes, with adaptations to my context
- Maybe, I would need more evidence
- No, I would not adopt it

**Logic:** ③ "Maybe" or ④ "No" → show D2-bis (conditional).

**D2-bis. What is the main reason you would not adopt it or would need more evidence?** (optional)
Type: optional short answer, maximum 300 characters

---

## SECTION E — Mini-ATAM (optional, ~8 additional minutes)

> Completely optional. For professionals with experience in software architecture.

---

**E0. Do you wish to participate?**

Type: single choice (required)
Options:
- Yes, I want to participate (~8 additional minutes)
- No, I prefer to stop here

Logic: "No" → final screen.

---

**Scenario reference table (image).** Instead of a ~600-word block describing each scenario in prose, this section includes a **PNG image inserted directly** (generated in HTML with inline styles and exported as an image, with no external dependencies) with:
- Table 1: the 12 scenarios × 5 columns (ID · What is evaluated · Attribute · AS-IS · TO-BE), color-coded (red for as-is, green for to-be).
- Table 2: the 1–5 scoring scale and the NR/SP/TP/R classification definitions (see the equivalence table in "Instrument evolution").

The instructions text in the form is reduced to 3 lines + a link to the support material (Section 1).

**E1 — AS-IS design scoring**
Type: multiple-choice grid (required — 12 rows × 5 columns)
Columns: 1 Not supported · 2 · 3 · 4 · 5 Excellent support

**E2 — TO-BE design scoring**
Type: multiple-choice grid (required — 12 identical rows × 5 columns)
Same columns as E1.

**E3 — Architectural classification**
Type: multiple-choice grid (required — 12 rows × 5 columns)
Same columns and scale as E1/E2 (not a list with the names of the 4 ATAM categories — see the equivalence table in "Instrument evolution" for the score→category conversion).

> ⚠️ **Implementation note.** The refactoring planning document had originally proposed a 4-column grid for E3 with the category names directly (NR · SP · TP · R). The version actually published on Google Forms instead used the same 5-column support scale as E1/E2 (confirmed in the raw response data: the recorded values are literally "Good support" and "Excellent support," not category acronyms), consistent with the principle of not requiring direct mastery of the four ATAM categories. This document describes the version actually published.

**E4 — Free comment** (optional, maximum 500 characters)
Text: *"Do you have any observation about the scenarios or the scoring exercise?"*

**Rows of grids E1, E2, and E3** (identical across all three):

| ID | Row description (≤ 70 characters) | Attribute |
|---|---|---|
| BOT-Q1 | Change in priority rules | Maintainability |
| BOT-Q2 | Change of ticket provider | Maintainability |
| BOT-Q3 | Credentials exposed in exported JSON | Security |
| BOT-Q4 | Duplicate ticket on retry | Reliability |
| BOT-Q5 | Silent failure diagnosis in production | Operability |
| BOT-Q6 | Incorrect HTTP codes on input errors | Functional suitability |
| IOT-Q1 | Temperature threshold adjustment | Maintainability |
| IOT-Q2 | Notification channel change | Maintainability |
| IOT-Q3 | Duplicate reading from sensor resend | Reliability |
| IOT-Q4 | Notification channel down for 30 s | Reliability |
| IOT-Q5 | Critical vs warning routing | Reliability |
| IOT-Q6 | DB credentials in exported JSON | Security |

---

## Final screen — Thank you

> **Thank you very much for your participation!**
>
> Your professional judgment directly contributes to the methodological rigor of this
> thesis. The expert panel's results will be integrated into the final ATAM report.
>
> Once the analysis is complete, an executive summary with the panel's findings will be published.

**F1. (Optional) Email to receive the results summary.**
Type: short answer with email format validation.
Note: this data is stored separately from the responses and is deleted 60 days after closing.

---

## Instrument summary — for verification

| Section | Visible items | Estimated time |
|---|:---:|:---:|
| 0 — Consent | 1 | 1 min |
| 1 — Support material | 0 (informational) | 5–7 min (prior reading) |
| A — Professional profile | 4 (1 grid of 3 rows) | 2 min |
| B — Framework valuation | 8 (4 grids of 2 rows) | 4 min |
| C — Critical perspective | 1 | 2 min |
| D — Overall perception | 2 + 1 conditional | 1 min |
| **Main survey subtotal (A–D)** | **~23** | **~9 min** |
| E — Mini-ATAM (optional) | 1 (E0) + 3 grids of 12 rows + 1 comment | 6–8 min |
| F — Follow-up (optional) | 1 | 30 s |
| **TOTAL with Section E** | **~27** | **15–19 min** |

Compared to the initial version (v1.0, ~75 items, 25–35 min), the refactoring reduced
visible items by ~67% and total time by ~40%, with no loss of collected information
(see "Instrument evolution").

---

## Google Forms configuration notes

| Parameter | Value | Note |
|---|---|---|
| Email collection | DISABLED | Preserves respondent anonymity |
| Progress bar | ENABLED | Reduces the abandonment rate by showing progress |
| Allow editing responses | ENABLED | Allows corrections before final submission |
| Question order | Do NOT randomize | The logical order of sections is part of the design |
| Logic P0 = "No" | Go to final screen | Closing section with thank-you |
| Logic A2 = "< 3 years" | Go to final screen with exclusion message | Or apply post-hoc exclusion if not technically possible (see `protocolo-encuesta.md` §2.3) |
| Logic D2 = "Maybe" / "No" | Go to D2-bis section before continuing | Separate section in Google Forms |
| Logic E0 = "No" | Go to final thank-you screen | Skip all of Section E |
| Theme color | Dark blue or sober gray | Avoid eye-catching colors that suggest positive bias |
| Require one response per row | YES on all grids | A3-A4-A5, B1–B8, E1, E2, E3 |
| Dummy-response test submission | Fill out the form twice before distributing | Delete the dummy responses from the Sheet before the real launch |

---

## Appendix — Mapping of questions to survey hypotheses

For the report's analysis section, this is the map of each question to the research question it helps answer:

| Question | Hypothesis / Aspect evaluated |
|---|---|
| A1, A2 | Panel profile (role, experience) |
| A3-A4-A5 (grid) | Panel familiarity with LC/NC, Clean Architecture, and architectural evaluation |
| B1, B2 | Validation of modularity and CR impact reduction |
| B3 | Validation of retry and idempotency patterns |
| B4 | Validation of the IoT error workflow |
| B5 | Validation of secrets management |
| B6 | Validation of structured logging |
| B7, B8 | Validation of applicability and cognitive cost |
| C1 | Independent identification of risks, trade-offs, and refinement suggestions (consolidated question; may reveal new unanticipated R-*/TP-*) |
| D1 | Overall acceptability (score) |
| D2 | Adoption intent |
| E1 per scenario | Triangulation of the author's as-is scoring (`matriz-scoring.md`) |
| E2 per scenario | Triangulation of the author's to-be scoring (`matriz-scoring.md`) |
| E3 per scenario | Triangulation of the author's SP/TP/R/NR classification (`analisis-approaches.md`) — recovered from the 1–5 level via the equivalence table (see "Instrument evolution") |
| E4 | Unanticipated emergent findings |
