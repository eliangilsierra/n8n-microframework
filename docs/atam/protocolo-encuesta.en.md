> 🌐 **Language / Idioma:** English · [Español](protocolo-encuesta.md)

# Survey Protocol — External Validation by Expert Panel

**Version:** 1.0
**Date:** 2026-05-07
**Methodological framework:** [`metodologia-atam-adaptada.md`](metodologia-atam-adaptada.md) — Phase V
**Purpose:** Define the operational rules for collecting external evidence that validates the author's ATAM analysis. This document is auditable by the thesis advisor and the jury to verify the methodological integrity of the validation component.

---

## 1. Survey objective

Externally validate the author's ATAM analysis (sensitivity points, tradeoff points, risks, non-risks, and 1–5 as-is/to-be scoring) by collecting independent opinions from senior software industry professionals who act as **peer reviewers not specialized** in the project's specific domain but competent in software architecture, DevOps, security, or QA.

Research question the survey answers:

> Are the architectural decisions, trade-offs, and risks identified by the author in the ATAM analysis recognizable, understandable, and defensible to a panel of software professionals independent of the author?

The survey does **not** aim to validate the technical quality of the exported n8n code (that is done by static validation). The survey validates that the author's **architectural reasoning** is sound from an external perspective with professional experience.

---

## 2. Population and sampling

### 2.1 Target population

Professionals active in software development, architecture, operations, security, or quality assurance, with verifiable professional experience, with no geographic restriction.

### 2.2 Inclusion criteria

For a response to be considered valid, the respondent must meet **all** of the following criteria (self-reported in Section A of the instrument):

| Criterion | Verification |
|---|---|
| Age ≥ 18 years | Implicit given the professional context |
| Professional experience in software development ≥ 3 years | Question A2 (automatic filter) |
| Current or previous role in one of: development, architecture, DevOps, security, QA, technical management | Question A1 |
| Minimum familiarity with automation, integration, or process flow concepts | Implicit in the role; verified by A3 |
| Informed consent granted | Mandatory acceptance on the screen preceding the questionnaire |

### 2.3 Exclusion criteria

- No professional software experience (e.g., undergraduate students without work experience) — excluded by the A2 filter.
- Direct family members of the author (first degree) — voluntarily declared; conflict of interest.
- Respondents who complete the questionnaire in less than 5 minutes — suspected non-reflective response; these responses are reported separately as "fast responses" and excluded from the main analysis.

### 2.4 Target sample sizes

| Level | Minimum | Desirable | Justification |
|:---:|:---:|:---:|---|
| **Level 1 — Broad survey** | 15 | 25–30 | Low minimum threshold for descriptive statistics with an interpretable standard deviation; Cronbach's α requires N ≥ 10 to be stable |
| **Level 2 — Mini-ATAM (subset)** | 3 | 5 | Theoretical qualitative saturation (Strauss & Corbin, 1990); inter-rater agreement with 3 evaluators supports Krippendorff's α or Fleiss' κ |
| **Heterogeneity** | 3 distinct roles | 5 distinct roles | Triangulation across perspectives (development, ops, security, etc.) |

The minimum threshold of 15 valid respondents is grounded in four converging arguments:

| Criterion | Rationale for the threshold |
|---|---|
| Stability of reliability coefficients | Internal consistency coefficients require N ≥ 10 for stable estimates; n ≥ 15 leaves margin for exclusions. |
| Interpretability of dispersion | With n < 10 the dispersion of a Likert scale is unstable; from ~15 cases onward descriptive statistics become interpretable. |
| Convention for expert validation panels | The usual range of judges in panel validation sits between 5 and 15; n = 15 sits at its upper end. |
| Minimum heterogeneity | Meaningful triangulation requires ≥ 3 distinct roles and representation of the three experience buckets (3–5, 5–10, >10 years). |

The requirement of more than 3 years of experience responds to a competence criterion:
evaluating architectural trade-offs such as maintainability versus latency, idempotency
under retries, or secrets management in production presupposes prior exposure to systems
in operation. A professional with less than 3 years has rarely encountered the antipatterns
the as-is represents, so their judgment on the severity of the original design would lack
empirical grounding.

### 2.5 Sampling strategy

**Intentional convenience** sampling combined with snowball sampling:

- **Convenience.** Direct invitation to the author's professional contacts on LinkedIn, colleagues from the current and previous jobs, and MGADS-UNAB classmates and professors.
- **Controlled snowball.** Respondents are asked to forward the invitation to up to 2 colleagues who meet the inclusion criteria, with explicit instructions not to pressure participation.

**Recognized limitation:** this type of sampling is not probabilistic, and the results are not generalizable to the global population of software professionals. The survey produces **descriptive and exploratory** evidence, not inferential evidence. This limitation is explicitly reported in the limitations section of the ATAM report.

---

## 3. Informed consent

The following text is presented as the **mandatory first screen** of the form. Continuing to the questionnaire requires explicitly checking the acceptance box.

```
═══════════════════════════════════════════════════════════════════════════════

INFORMED CONSENT
External validation of the LC/NC micro-framework for n8n

This survey is part of the Master's thesis in Software Management,
Application, and Development (MGADS) at the Universidad Autónoma de
Bucaramanga (UNAB), Colombia. Directed by Sebastian Roa Prada, PhD.

OBJECTIVE
Externally validate an architectural micro-framework for Low-Code/No-Code
workflows on the n8n platform, grounded in Clean Architecture principles and
DevSecOps practices. Your expert opinion complements the author's analytical
evaluation and is part of the external validation component of the ATAM
(Architecture Tradeoff Analysis Method) evaluation applied to the project.

ESTIMATED TIME
- Main survey: 10 to 12 minutes
- Optional mini-ATAM section (experts only): 15 additional minutes

ANONYMITY AND CONFIDENTIALITY
No data that would allow individual identification (name, email, company,
ID) is requested. Only aggregate demographic information is requested
(role, years of experience, familiarity with technologies). Responses are
processed in aggregate and published as descriptive statistics in the final
document.

USE OF DATA
Data is used exclusively for academic purposes for the aforementioned
thesis. Anonymized responses may be included as an appendix to the final
document and, eventually, be input for a derived publication in an indexed
academic journal or conference, always preserving anonymity.

VOLUNTARINESS
Your participation is entirely voluntary. You may abandon the survey at any
time simply by closing the browser window, with no need for explanation.
There are no consequences for not participating.

PARTICIPANT RIGHTS
If you wish to request the deletion of your responses after submitting them,
you may contact the author via the email provided at the end of the form,
and the request will be processed, provided it is technically possible to
identify your responses within the aggregated set.

CONTACT
Elian Hernando Gil Sierra
MGADS Student - UNAB
Email: [author's email]

═══════════════════════════════════════════════════════════════════════════════

[ ] I have read, understood, and agree to the conditions above. I confirm
    that I am at least 18 years old and that my participation is voluntary.

[Continue to the survey]   [Cancel and exit]
```

---

## 4. Procedure

### 4.1 Full respondent flow

```
1. Receives invitation with link to supporting material + link to the form
   ↓
2. (Recommended) Reviews supporting material asynchronously:
   - 4-page executive summary PDF (5 min)
   - Short 5-minute video
   ↓
3. Opens the Google Forms form
   ↓
4. Screen 1: Informed consent → accepts
   ↓
5. Section A: Characterization (5 questions, 1.5 min)
   ↓
6. Section B: Perceived validation (8 Likert items, 5 min)
   ↓
7. Section C: Risks and trade-offs (3 open-ended questions, 3 min)
   ↓
8. Section D: Overall perception (2 questions, 1 min)
   ↓
9. (Optional, invited experts only) Section E: Mini-ATAM (15 min)
   - As-is/to-be scoring per scenario
   - SP/TP/R/NR classification
   ↓
10. Closing screen: thank you + option to receive results summary
    by email (optional field)
   ↓
11. Submission → data stored in Google Forms / Sheets
```

### 4.2 Total time

- **Main survey only:** ~15 minutes including reading the material and consent.
- **Survey + mini-ATAM:** ~30 minutes.

### 4.3 Technical platform

| Aspect | Decision | Reason |
|---|---|---|
| Platform | Google Forms | Free, widely known, exports to Google Sheets and CSV |
| Mini-ATAM | Conditional section in the same form + explicit invitation for the 3–5 selected experts | Reduces friction vs. a separate form |
| Storage | Google Sheets linked to the Form | Real-time responses, exportable to CSV for Python analysis |
| Material hosting | Public Google Drive (PDF) + Loom or unlisted YouTube (video) | Direct access without login |

### 4.4 Campaign schedule

| Day | Activity |
|:---:|---|
| 0 | Close of instrument design + piloting with 2–3 people + adjustments |
| 1 | Sending the first wave of invitations (~30 direct contacts) |
| 7 | First reminder to non-respondents + second wave (snowball) |
| 14 | Second reminder + express invitation to experts for Section E |
| 21 | Formal close of data collection (keep open but do not expect more responses) |
| 22-26 | Statistical analysis (`plan-analisis-encuesta.md`) |
| 27-28 | Integration of findings into §8 of the ATAM report |

**Total: ~4 weeks from launch to integration into the report.**

**Actual execution.** Phase V data collection took place from June 17 to June 24, 2026,
channeled through the IT department of an organization in the sector (~200 professionals
matching the target profile were identified). The results of this execution (panel
profile, N collected/valid, per-section ratings) are documented in `informe-atam-final.md`
§8, already complete.

---

## 5. Data management

### 5.1 Storage

- **Raw data:** Google Sheets linked to the Form, accessible only by the author.
- **Anonymized copy:** CSV export to `medicion/encuesta-validacion/respuestas-anonimizadas-{YYYY-MM-DD}.csv` (committable to the repo only if it contains no identifiable data).
- **Identifiable data (optional follow-up email):** kept separate in another sheet, **not committed** to the repo, deleted after sending the results summary.

### 5.2 Anonymization

Before including the CSV in the repository or in the appendix of the final document:
- Verify there are no open-text fields with identifiable data (proper names, company names, emails)
- If there are, redact them as `[REDACTED]` before publishing
- Assign a sequential `respondent_id` (R-001, R-002…) to replace any identifier

### 5.3 Retention

- Raw and anonymized data: retained indefinitely as an appendix to the thesis
- Identifiable data (emails): deleted at most 60 days after the close of data collection

### 5.4 Access

- **Author:** full access to raw data
- **Thesis advisor:** access to anonymized data upon request, for methodological audit
- **Jury:** access to anonymized data as an appendix to the final document
- **Third parties:** no access

---

## 6. Data analysis

The detailed plan is in [`plan-analisis-encuesta.md`](plan-analisis-encuesta.md). Summary of the approach:

| Section | Type of analysis |
|---|---|
| A. Characterization | Frequencies, distribution by role, experience, familiarity |
| B. Perceived validation | Descriptive per item (mean, median, σ); Cronbach's α per item group if N ≥ 15 |
| C. Risks and trade-offs | Open thematic coding (Strauss & Corbin); category frequency table; representative quotes |
| D. Overall perception | Distribution of the 1–10 score; qualitative analysis of justifications |
| E. Mini-ATAM | Comparison of as-is/to-be scoring vs. the author's scoring; inter-rater agreement (Cohen's κ or Krippendorff's α) |

---

## 7. Study acceptance criteria

The external validation component is considered **acceptable for quantitative reporting** if all of the following thresholds are met at the close of data collection:

| Criterion | Threshold |
|---|---|
| Total N Section A-D | ≥ 15 respondents |
| Role heterogeneity | ≥ 3 distinct roles represented |
| Completion rate (respondents who reach D2) | ≥ 80 % |
| Mini-ATAM (Section E) | ≥ 3 respondents |
| Median response time | ≥ 7 min (discard fast, non-reflective responses) |

If any of the thresholds is not met, the component is reported as **exploratory evidence** and the limitation is explicitly discussed in the report; conclusions are qualified accordingly.

---

## 8. Piloting

**Before** broad distribution, the instrument is piloted with 2–3 selected people to evaluate:

1. **Clarity of language.** Are the questions understandable without needing additional explanation?
2. **Actual response time.** Does it match the 10–12 min estimate?
3. **Quality of the supporting material.** Are the 4-page PDF and the 5-min video sufficient to answer with judgment?
4. **Technical functioning.** Do the links work, do the conditional logics (optional Section E) operate correctly?
5. **Wording bias.** Does any question induce a particular answer?

Pilot responses are not counted in the final sample. Piloting findings are documented in a brief "Post-piloting adjustments" section of the ATAM report.

### Post-piloting adjustments

Piloting the initial version of the instrument (v1.0, ~75 visible items, 25–35 min)
identified four categories of problems, formally documented and used to refactor the
instrument to version 2.0 as specified in `instrumento-encuesta.md`:

1. **Excessive length.** The complete form, including Section E (48 individual items —
   12 scenarios × 4 questions each), represented an actual response time of 25 to 35
   minutes, well above the 15-minute threshold recommended for voluntary academic
   validation surveys.
2. **Cognitive load in Section E.** Each of the 12 mini-ATAM scenarios presented a title,
   stimulus, expected response, measured outcome, and four questions — a volume of
   information proper to an in-person moderated ATAM workshop, not to a self-directed form.
3. **Underuse of Google Forms control types.** The original instrument used exclusively
   individual linear scales, without leveraging the "multiple-choice grid" type, which
   groups several items of the same scale into a single visual question.
4. **Row texts too long.** When attempting to consolidate into grids, the original row
   texts (150–300 characters) stacked vertically and degraded readability, especially on
   mobile devices.

**Guiding principle for the adjustments:** reduce the respondent's cognitive friction
without sacrificing the validity of the collected data. The six concrete changes applied —
consolidating A3+A4+A5 into one grid, consolidating B1–B8 into 4 thematic grids, shortening
all row texts to ≤ 70 characters, refactoring Section E from 48 items to 3 grids of 12 rows
+ a visual reference table (image), simplifying the Section C help texts, and consolidating
the mini-ATAM instructions into an image — are detailed in `instrumento-encuesta.md`
("Instrument evolution" section and the structure of Sections A, B, C, and E).

**Impact on instrument validity** (assessed by type):

| Validity type | Impact | Rationale |
|---|---|---|
| Content validity | Neutral | The same constructs and ISO 25010 attributes are represented; no substantive item was removed. |
| Construct validity | Slight positive | Removing help texts with specific figures reduces anchoring bias. |
| Internal validity | Positive | A shorter instrument reduces respondent fatigue, improving response quality toward the end of the form. |
| Criterion validity | Neutral | The collected data (1–5 scores, classification, open responses) is identical; the statistical analysis operates on the same values. |
| External validity | Positive | A less intimidating instrument may increase the participation rate and reduce respondent self-selection. |

**Quantified result:** from ~75 to ~25 visible items (−67%), from 25–35 to 16–20 minutes of
total duration (−40% approx.), with no loss of collected information.

**Limitations the refactoring does not eliminate** (explicitly acknowledged): the panel
validates but does not co-construct the findings, which introduces an anchoring bias that
no form refactoring can fully eliminate; sampling remains non-probabilistic by convenience;
response quality remains conditioned on the respondent having reviewed the support material,
a condition the refactored form assumes more explicitly than the original; and respondents
with low ATAM familiarity (A5 < 3) may have difficulty completing Section E even with the
simplified instructions — mitigated by that section's optional nature.

---

## 9. Recognized methodological limitations

To be reported in the limitations section of the ATAM report:

1. **Non-probabilistic sampling.** Convenience + snowball. Results are not generalizable; they are exploratory and descriptive.
2. **Possible bias from respondents close to the author.** A proportion of respondents are colleagues or professional acquaintances of the author, which may positively bias the evaluation. Mitigation: include a snowball to reach second-degree contacts and report the proportion.
3. **Anchoring bias.** Respondents see the author's material before forming an opinion, which anchors their responses to the proposed framework. Mitigation: include open-ended questions (Section C) that allow unanticipated responses.
4. **Lack of expertise validation.** The level of expertise is self-reported and not verified. Mitigation: request role and years of experience, and triangulate with the technical quality of the open-ended responses.
5. **Limitation of the asynchronous format.** There is no group discussion to enrich findings (a limitation inherent to the ATAM adaptation declared in ADR-MF-004).

---

## 10. Ethical aspects

- **No physical or psychological risks** for participants; low-burden cognitive survey.
- **No monetary or in-kind compensation** to avoid introducing incentive bias.
- **No sensitive data** collected (no questions about salary, specific company, or legal identification data).
- **Explicit consent** prior to the questionnaire.
- **Right to withdraw** guaranteed.
- **Master's thesis with no formal IRB requirement** at UNAB for this type of non-clinical, low-risk survey. Equivalent good research practice is followed.

---

## References

- Kitchenham, B. & Pfleeger, S. L. (2008). Personal Opinion Surveys. In *Guide to Advanced Empirical Software Engineering* (pp. 63–92). Springer.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer. Ch. 8 — Personal Opinion Surveys.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Krippendorff, K. (2018). *Content Analysis: An Introduction to Its Methodology* (4th ed.). Sage.
