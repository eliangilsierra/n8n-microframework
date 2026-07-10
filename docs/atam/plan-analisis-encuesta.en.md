> 🌐 **Language / Idioma:** English · [Español](plan-analisis-encuesta.md)

# Statistical Analysis Plan for the External Validation Survey

**Version:** 1.0
**Drafting date:** 2026-05-07
**Status:** Defined **before** starting data collection (pre-registration commitment to prevent HARKing)
**Protocol:** [`protocolo-encuesta.md`](protocolo-encuesta.md)
**Instrument:** [`instrumento-encuesta.md`](instrumento-encuesta.md)
**Purpose:** Define in advance the analyses that will be applied to the responses received. Documenting this plan **before** having the data prevents the bias of selecting statistical tests for convenience (Hypothesizing After Results are Known) and increases the methodological credibility of the study.

---

## 1. Guiding principles

1. **Pre-registration.** All statistical tests and decision thresholds are defined in this document before having the data. If the need for additional tests not contemplated here arises during analysis, they will be explicitly reported as "exploratory."

2. **Descriptive statistics first.** Given the expected sample size (15–30), the priority is honest descriptive reporting. Inferential tests are reserved for hypotheses with sufficient statistical power.

3. **Rigorous qualitative analysis.** Open-ended questions (Section C) are analyzed with thematic coding following Strauss & Corbin (1990), not as loose anecdotes.

4. **Transparency.** The analysis notebook is version-controlled in the repository; the anonymized raw data is an appendix of the thesis.

5. **Honesty over significance.** If the results are inconclusive, this will be reported as such. If the sample is insufficient, the findings will be reported as exploratory.

---

## 2. Data preparation

### 2.1 Export

From Google Forms → Sheets → export to CSV with UTF-8 encoding.

Destination file: `medicion/encuesta-validacion/respuestas-crudas-{YYYY-MM-DD}.csv`

### 2.2 Cleaning

| Operation | Criterion |
|---|---|
| Remove responses with A2 = "Less than 3 years" | Auto-disqualified by the form's filter; should be 0 rows if the filter worked |
| Flag responses with total time < 5 min as "fast responses" | Suspected non-reflective response; analyze separately |
| Flag responses with total time > 60 min as "outliers" | The respondent likely left the tab open; review case by case |
| Assign a sequential `respondent_id` (R-001, R-002, …) | Anonymization |
| Remove the optional email column (F1) | Move to a separate, non-committed sheet |
| Convert Likert text to numeric (1-5) | For statistical analysis |
| Encode multiple-choice options as nominal categories | For frequency counts |

### 2.3 Integrity validation

Checks to run before the analysis:

- All required questions have an answer (no NaN)
- Numeric types in Likert columns (not strings)
- Total response time calculated from start and submission timestamps
- Response count vs. protocol thresholds (§7 of `protocolo-encuesta.md`)

### 2.4 Generated files

```
medicion/encuesta-validacion/
├── respuestas-crudas-{fecha}.csv             # unmodified original
├── respuestas-anonimizadas-{fecha}.csv       # no email, with respondent_id
├── respuestas-limpias-{fecha}.csv            # post-cleaning, ready for analysis
├── analisis-encuesta.ipynb                   # Python notebook with all analyses
└── outputs/
    ├── descriptivos-seccion-a.csv
    ├── descriptivos-seccion-b.csv
    ├── categorias-emergentes-seccion-c.md
    ├── matriz-comparacion-scoring-seccion-e.csv
    └── figuras/                              # plot PNGs
```

---

## 3. Analysis by section

### 3.1 Section A — Respondent characterization

**Objective.** Describe the panel's profile and demonstrate heterogeneity.

**Analyses to run:**

| Analysis | On | Output |
|---|---|---|
| Frequency and percentage | A1 (role) | Table + bar chart |
| Distribution | A2 (experience) | Histogram |
| Mean, median, σ | A3, A4, A5 (familiarity) | Descriptive table |
| Heterogeneity check | A1 + A2 | Cross-tabulation role × experience |

**Acceptable heterogeneity criterion:**
- ≥ 3 distinct roles represented with at least 2 respondents each
- Experience distribution with at least one respondent in each bucket (3-5, 5-10, >10)

**Report:** section 8.1 of the ATAM report ("Respondent profile").

---

### 3.2 Section B — Perceived validation

**Objective.** Quantify respondents' level of agreement with the framework's statements.

**Descriptive analysis (per item):**

| Statistic | Applies to | Interpretation |
|---|---|---|
| Mean | B1–B8 | Centrality of agreement |
| Median | B1–B8 | Robust to outliers; more relevant with Likert data |
| Standard deviation | B1–B8 | Dispersion / consensus |
| % of responses ≥ 4 ("Agree" + "Strongly agree") | B1–B8 | "Approval rate" |
| % of responses = 3 (Neutral) | B1–B8 | Indicates lack of judgment or an ambiguous item |
| % of responses ≤ 2 ("Disagree" + "Strongly disagree") | B1–B8 | "Rejection rate" |

**Interpretive criterion (defined a priori):**

| Median | % ≥ 4 | Reading |
|:---:|:---:|---|
| ≥ 4 | ≥ 70 % | The framework strongly validates this aspect |
| ≥ 4 | 50–70 % | Moderate validation; review % neutral and disagreement |
| 3 | any | Polarized item or respondents without judgment; review qualitative comments |
| ≤ 3 | < 50 % | Weak validation; the aspect requires review of the framework |

**Internal consistency analysis (only if N ≥ 15):**

Cronbach's α calculated by logical item groups:

| Group | Items | Hypothesis |
|---|---|---|
| Maintainability | B1, B2 | α ≥ 0.70 indicates both items measure the same construct |
| Reliability | B3, B4 | idem |
| Applicability | B7, B8 | idem |

α < 0.50 indicates the items measure different constructs and are reported separately.

**Light correlational analysis (exploratory):**

Does the framework's rating vary according to the respondent's profile?

| Independent variable | Dependent variable | Test |
|---|---|---|
| A1 role | Mean of B1-B8 | Kruskal-Wallis (non-parametric) |
| A2 experience | Mean of B1-B8 | Spearman correlation |
| A3 LC/NC familiarity | Mean of B7-B8 (applicability) | Spearman correlation |
| A5 ATAM familiarity | D1 overall score | Spearman correlation |

Report with effect size (not only p-value). With a small N, p-values are unstable; effect size is more informative.

**Report:** section 8.2 of the ATAM report ("Quantitative results").

---

### 3.3 Section C — Risks and trade-offs (qualitative analysis)

**Objective.** Identify the emergent categories of risks, trade-offs, and refinements that the panel identifies independently, and compare them with the author's findings (`registro-riesgos-tradeoffs.md`).

**Procedure — Open coding (Strauss & Corbin, 1990):**

**Step 1 — Immersive reading.** Read the 3 × N complete responses without coding, for familiarization with the corpus.

**Step 2 — Open coding.** For each response, identify key concept(s) and assign descriptive code(s). Examples:
- "The subflow overhead is concerning for systems with strict SLAs" → codes: `latencia_subflujos`, `SLA_critico`
- "Missing credential rotation policy" → codes: `gestion_credenciales`, `rotacion_secretos`

**Step 3 — Grouping into categories.** Group related codes into higher-level categories. Examples:
- Category "Operational risks" → codes: `gestion_credenciales`, `monitoreo_runtime`, `dependencia_n8n`
- Category "Latency trade-off" → codes: `latencia_subflujos`, `SLA_critico`, `overhead_execute_workflow`

**Step 4 — Frequency table.** Report how many respondents mention each category.

**Step 5 — Comparison with the author's findings.** For each emergent category, indicate whether it corresponds to a finding already documented in `registro-riesgos-tradeoffs.md` (convergence) or if it is new (divergence).

**Report format:**

| Emergent category | # respondents | % | Convergence with author's findings | Representative quotes |
|---|:---:|:---:|---|---|
| Subflow latency trade-off | 8 | 53 % | ✅ TP-GLOBAL-01 | "The +119% overhead in IoT is hard to justify for real-time alerts" (R-012) |
| Credential management | 5 | 33 % | ✅ R-BOT-01 | "There's no clear rotation policy" (R-003) |
| Coupling to the n8n runtime | 3 | 20 % | ❌ New | "If n8n changes Execute Workflow behavior, the whole framework is affected" (R-007) |
| ... | ... | ... | ... | ... |

**Saturation criterion:** coding is considered to have reached saturation when a new response generates no new categories. With N = 15-30 and focused open-ended questions, saturation is typically reached between responses 10-15.

**New emergent findings (not in the author's registry):** these are incorporated as an appendix "Findings identified by the panel" in the final ATAM report and discussed in section 9 (Synthesis).

**Report:** section 8.3 of the ATAM report ("Qualitative analysis").

---

### 3.4 Section D — Overall perception

**D1 — 1-10 score:**

| Statistic | Value to calculate |
|---|---|
| Mean | — |
| Median | — |
| Standard deviation | — |
| Minimum, maximum | — |
| Distribution | Labeled histogram |

**A priori interpretation:**

| D1 mean | Reading |
|:---:|---|
| ≥ 8.0 | Framework very well received |
| 7.0–7.9 | Well received with observations |
| 5.0–6.9 | Lukewarm reception; review criticisms |
| < 5.0 | Poorly received; deep re-evaluation needed |

**D2 — Adoption intent:**

| Analysis | Output |
|---|---|
| Response distribution | Bar chart |
| % of "Yes" (with/without adaptations) | "Adoption intent rate" |
| Justifications for "Maybe" / "No" | Qualitative analysis similar to Section C |

**Report:** section 8.2 (quantitative D1) + 8.3 (qualitative D2-bis) of the ATAM report.

---

### 3.5 Section E — Mini-ATAM (3-5 experts)

**Objective.** Triangulate the author's 1-5 as-is/to-be scoring (`matriz-scoring.md`) with the independent opinion of experts.

**Comparative analysis (per scenario):**

For each of the 12 scenarios:

| Metric | Calculation |
|---|---|
| Author's as-is score | Value from `matriz-scoring.md` |
| Panel as-is score — median | Median of the E.a responses |
| Panel as-is score — range | min, max of the E.a responses |
| Δ author vs. panel as-is | author − panel median |
| Author's to-be score | Value from `matriz-scoring.md` |
| Panel to-be score — median | Median of the E.b responses |
| Panel to-be score — range | min, max of the E.b responses |
| Δ author vs. panel to-be | author − panel median |

**Convergence criterion:**
- |Δ| ≤ 1 → convergence (the author and the panel agree within the scale's margin of error)
- |Δ| = 2 → moderate discrepancy (review)
- |Δ| ≥ 3 → significant discrepancy (possible bias or misunderstanding; report)

**Visualization:** boxplot per scenario with the author's value marked.

**Classification analysis (SP/TP/R/NR) — E.c:**

| Metric | Calculation |
|---|---|
| Author's classification | Value from `analisis-approaches.md` |
| Panel modal classification | Mode of the E.c responses |
| Author vs. panel mode match | Yes / No |
| Confusion table | 4×4 matrix (Non-risk/SP/TP/R) |

**Inter-rater agreement among experts:**

| Metric | When to use | Interpretation |
|---|---|---|
| Cohen's κ | Exactly 2 experts | < 0.20 poor · 0.21-0.40 weak · 0.41-0.60 moderate · 0.61-0.80 substantial · > 0.80 almost perfect |
| Krippendorff's α | ≥ 3 experts | < 0.667 unacceptable · 0.667-0.80 tentative · ≥ 0.80 acceptable |
| Fleiss' κ | ≥ 3 experts with nominal categories | Similar interpretation to Cohen's κ |

For ordinal variables (1-5 scoring): use Krippendorff's α with `interval` or `ordinal` metric.
For nominal variables (SP/TP/R/NR classification): use Krippendorff's α with `nominal` metric.

**Python implementation:**

```python
import krippendorff
# scoring_matrix: rows = scenarios, columns = experts, values = 1-5 scores
alpha = krippendorff.alpha(reliability_data=scoring_matrix.T, level_of_measurement='ordinal')

# classification_matrix: rows = scenarios, columns = experts, values = SP/TP/R/NR
alpha_nominal = krippendorff.alpha(reliability_data=classification_matrix.T, level_of_measurement='nominal')
```

**Report:** section 8.4 of the ATAM report ("Triangulation with the author's scoring").

---

## 4. Integrated synthesis

After completing the analyses by section, produce:

### 4.1 Master convergence table

| Author's finding | Identified by the panel | Magnitude | Decision |
|---|---|---|---|
| TP-GLOBAL-01 subflow latency | Yes (53 % in C2) | Strong convergence | Confirmed as a main finding |
| SP-IOT-01 duplicated error handler channel | Yes (mentioned by 2 experts in E13) | Convergence | Confirmed |
| ... | ... | ... | ... |

### 4.2 Emergent findings from the panel (not anticipated by the author)

List of emergent categories with frequency ≥ 20 % of respondents that do not correspond to prior findings.

### 4.3 Significant discrepancies

Cases where the author and the panel diverge in scoring (|Δ| ≥ 2) or in classification. Discuss possible reasons and report honestly.

### 4.4 Executive validation report

One page with:
- Panel profile (heterogeneity achieved)
- Average approval rate for B1-B8
- Overall D1 score
- D2 adoption intent rate
- Top 3 confirmed findings
- Top 3 emergent findings
- Mini-ATAM inter-rater agreement (if N ≥ 3 experts)

---

## 5. Python notebook structure

`medicion/encuesta-validacion/analisis-encuesta.ipynb` — recommended structure:

```
1. Configuration
   - Imports (pandas, numpy, scipy.stats, matplotlib, seaborn, krippendorff)
   - Reading the cleaned CSV
   - Seed configuration for reproducibility

2. Data validation
   - Verification of total N, completeness, response time distribution
   - Report of how many responses pass the acceptance criteria

3. Section A — Characterization
   - Frequencies, charts, cross-tabulation

4. Section B — Likert
   - Descriptive table per item
   - Cronbach's α calculation by group
   - Correlational analysis with profile

5. Section C — Qualitative coding
   - Loading the manual coding file
   - Frequency table by category
   - Comparison with the author's registry

6. Section D — Overall perception
   - D1 histogram
   - D2 distribution
   - Qualitative coding of D2-bis

7. Section E — Mini-ATAM (if N ≥ 3 experts)
   - Comparative table per scenario
   - Inter-rater agreement (κ or α)
   - Convergence boxplots and heatmaps

8. Synthesis
   - Master convergence/divergence table
   - Executive report

9. Export
   - Output CSVs
   - PNG figures to include in the ATAM report
```

**Python dependencies:**
```
pandas >= 2.0
numpy >= 1.24
scipy >= 1.10
matplotlib >= 3.7
seaborn >= 0.12
krippendorff >= 0.6.1
```

---

## 6. Limitations of the analysis (to be reported)

- **Small sample size.** With N between 15 and 30, p-values are unstable and inferential tests have low statistical power. The analysis prioritizes descriptive statistics and effect sizes.
- **Mini-ATAM with very few evaluators (3-5).** Inter-rater agreement coefficients with such a small N are sensitive to individual cases. Report with a confidence interval if possible (bootstrap).
- **Single-coder bias in Section C.** The thematic coding is done by the author, which reintroduces bias. Mitigation: document the codebook in the notebook for auditing; review with the advisor if possible.
- **No control group.** There is no comparison against opinions on another framework — the validation is absolute, not relative.

---

## 7. Pre-analysis checklist — completed ✓ (with one documented exception)

Verified at the close of data collection (June 24, 2026):

- [x] CSV file exported and committed in `medicion/encuesta-validacion/`
- [x] Anonymization executed and verified
- [x] Total N ≥ protocol threshold (N=17 valid ≥ 15 ideal)
- [x] Role heterogeneity verified (5 roles ≥ 3)
- [ ] **Median response time ≥ 7 min — not measurable.** Google Forms only records the
      submission timestamp, not the start time or per-respondent duration; the deployed
      instrument did not capture that data. Documented as an open limitation (see
      `informe-atam-final.md` §11) rather than marked verified without evidence.
- [x] Mini-ATAM: 17/17 valid respondents completed Section E (≥ 3 required)
- [x] Python notebook configured with dependencies installed (`requirements.txt`, executed end-to-end)
- [x] Analysis plan (this document) reviewed to confirm no non-pre-registered tests were added

---

## References

- Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. *Psychometrika*, 16(3), 297-334.
- Krippendorff, K. (2018). *Content Analysis: An Introduction to Its Methodology* (4th ed.). Sage.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer. Ch. 8 and 12.
- Cohen, J. (1960). A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 20(1), 37-46.
- Fleiss, J. L. (1971). Measuring nominal scale agreement among many raters. *Psychological Bulletin*, 76(5), 378-382.
