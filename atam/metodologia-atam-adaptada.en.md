> 🌐 **Language / Idioma:** English · [Español](metodologia-atam-adaptada.md)

# Methodology — Asynchronous Modified ATAM with External Validation by Expert Panel

**Version:** 1.0
**Date:** 2026-05-07
**Author:** Elian Hernando Gil Sierra
**Reference ADR:** [`ADR-MF-004`](../microframework/adr/ADR-MF-004-atam-adaptado-individual.md)
**Purpose:** Document the architectural-evaluation methodology applied in this thesis project, explaining in detail how the canonical ATAM method is adapted to the context of a single researcher, and how the absence of the multi-stakeholder component is compensated through triangulation with external validation.

---

## 1. Reference framework

### 1.1 The original ATAM method

The **Architecture Tradeoff Analysis Method** (ATAM) was proposed by Kazman, Klein, and Clements in technical report CMU/SEI-2000-TR-004 and consolidated in Bass, Clements & Kazman (2012) *Software Architecture in Practice* (3rd edition, chapter 21). It is a scenario-based architectural evaluation method whose goal is to identify **risks**, **sensitivity points**, and **tradeoff points** among the quality attributes of an architecture, before those attributes are compromised in production.

ATAM's central premise is that architectural decisions rarely affect a single quality attribute: they typically improve one and degrade another, giving rise to explicit trade-offs that the architecture must document. ATAM makes those trade-offs visible through a nine-step protocol typically executed in two one-day in-person sessions:

| Step | Name | Product |
|---|---|---|
| 1 | Present the ATAM method | Common understanding of the process |
| 2 | Present the business drivers | List of attributes prioritized by the product owner |
| 3 | Present the architecture | Shared architectural documentation |
| 4 | Identify the architectural approaches | Inventory of decisions and patterns applied |
| 5 | Generate the utility tree | Hierarchical tree of attributes refined into concrete scenarios |
| 6 | Analyze the architectural approaches | Initial identification of sensitivity points, tradeoff points, risks, non-risks |
| 7 | Brainstorm and prioritize scenarios | Top-K scenarios prioritized by importance and difficulty |
| 8 | Re-analyze the architectural approaches | Refined analysis of the Top-K scenarios |
| 9 | Present the results | Final report with risks, trade-offs, and recommendations |

ATAM produces four categories of findings:

- **Sensitivity Point (SP):** an architectural decision whose modification mainly impacts one quality attribute.
- **Tradeoff Point (TP):** an architectural decision that affects multiple attributes in opposite directions; improving one implies worsening the other.
- **Risk (R):** an architectural decision, or absence of one, that potentially compromises the fulfillment of a scenario.
- **Non-risk (NR):** an architectural decision that clearly preserves or improves the fulfillment of a scenario.

Additionally, ATAM requires a collaborative human component: findings are not produced analytically over the code, but conversationally among heterogeneous stakeholders who contribute different perspectives. This conversation is what distinguishes ATAM from a desk architectural review.

### 1.2 Constraints of the project context

This project operates under three constraints that prevent applying ATAM in its canonical form:

**R1 — Single researcher.** The project is developed by a single author under the direction of an academic advisor. There is no project team, product owner, real client, or operations representatives available for a collaborative session.

**R2 — Simulated domain.** The two case studies (support Bot and IoT Pipeline) are academic representations of real LC/NC problems but do not correspond to a production system with real stakeholders holding formed opinions about the prioritized quality attributes.

**R3 — Thesis schedule.** The pre-project's schedule reserves 3 weeks for Phase 7 (07/06 to 07/24), which is incompatible with coordinating full ATAM workshops that typically require 6–10 weeks of preparation, including identification, prior training, and stakeholder scheduling.

Under these constraints, a literal application of ATAM would produce a "single-viewpoint evaluation" in which the author designs, implements, evaluates, and reports without external contrast — a situation that Wohlin et al. (2012) identify as one of the main threats to external validity in empirical software studies.

---

## 2. The proposed adaptation

### 2.1 General strategy: methodological triangulation

The adaptation is built on the principle of **methodological triangulation** (Denzin, 1978): when a single source of evidence has validity limitations, making multiple independent sources converge on the same finding increases the credibility of the conclusions. Applied to this case, triangulation operates across three sources:

```
                 ┌─────────────────────────────┐
                 │   ARCHITECTURAL FINDING      │
                 │ (SP / TP / Risk / Non-risk)  │
                 └──────────────┬──────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐    ┌────────────────────┐    ┌──────────────────┐
│ Documentary   │    │  Quantitative      │    │ Expert opinion   │
│ ADRs (19)     │    │  Run-logs (8,000)  │    │ Panel survey     │
│ Contracts     │    │  CR-logs (12)      │    │ Mini-ATAM (3-5)  │
│ Diagrams      │    │  MTTD, metrics     │    │ Thematic analysis│
│ Checklists    │    │  Static validator  │    │ Inter-rater κ    │
└───────────────┘    └────────────────────┘    └──────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                                ▼
                  Convergence → Robust finding
                  Divergence  → Reported limitation
```

Each finding in the ATAM report (SP/TP/R/NR) explicitly cites its evidence in at least two of the three sources. Divergences between sources — for example, a finding supported by documentation and metrics but contradicted by the panel's opinion — are honestly reported as **limitations** and discussed in the report's conclusions section.

### 2.2 Reordering and asynchronous operation of ATAM's steps

The adaptation preserves the nine steps but reorganizes them into four asynchronous phases operated by the author, plus an external-validation phase that runs in parallel with the last one:

```
Phase I — Analytical preparation           Steps 1, 2, 3, 4, 5
  (author, asynchronous, ~3 weeks)
        │
        ▼
Phase II — Internal approach analysis      Steps 6, 7
  (author, asynchronous, ~1 week)
        │
        ▼
Phase III — Empirical evidence             Step 8
  (8,000 runs + runtime + analysis)
        │
        ▼
Phase IV — Report synthesis                Step 9 (partial)
  (author, asynchronous, ~2 weeks)
        │
        └───────────────► Phase V — External validation
                          (expert panel, ~3 weeks)
                                  │
                                  ▼
                          Final integration into the report
```

### 2.3 Step-by-step mapping

| Original ATAM step | Adaptation in this project | Justification of the equivalence |
|---|---|---|
| **1. Present the ATAM method** | Report's introductory chapter + this methodology document | Documentation replaces the oral presentation; the report's reader is the one who receives the "presentation" |
| **2. Present the business drivers** | Drivers section in the report based on `../medicion/proyecto-overview.en.md` (objectives, prioritized ISO 25010 attributes) | The drivers are already explicit in the pre-project and operationalized as metrics |
| **3. Present the architecture** | Architecture section of the report based on `casos-de-estudio/arquitectura-flujos.md`, as-is/to-be Mermaid diagrams, JSON Schema contracts | Complete architectural documentation substitutes for the in-person session |
| **4. Identify the approaches** | `atam/analisis-approaches.md` §1 — 12 architectural approaches inventoried with their ADRs and affected attributes | Systematic inventory by the author covers what a workshop would do collectively |
| **5. Generate the utility tree** | `atam/atam-utility-tree.md` already produced — 12 top-K scenarios, 6 per case, with stimulus/response/measure and priority (I × D) | Utility tree produced by the author, supported by the literature (Bass et al. 2012) and validated against the pre-project's attributes |
| **6. Analyze the approaches (1st pass)** | `atam/analisis-approaches.md` §2 — SP/TP/R/NR classification per scenario derived from documentary evidence | Systematic individual analysis replaces group brainstorming; compensated by the external-validation component |
| **7. Brainstorm and prioritize** | Prioritization already included in the utility tree (H/M/L scale of importance × difficulty). There is no open brainstorming; the scenarios come from the pre-project and the declared quality objectives | The project's scope defines the scenarios; open brainstorming would not add value with a single author |
| **8. Re-analyze the approaches (2nd pass)** | Refinement of the SP/TP/R/NR classification using **empirical quantitative evidence**: 8,000 runs, 12 measured CRs, IOT-Q4/Q5 runtime, MTTD, static validator. Each finding is contrasted with real metrics | Massive empirical evidence substitutes for the group discussion: what is debated in a workshop is measured here |
| **9. Present the results** | Split into two components: (a) `atam/informe-atam-final.md` produces the report for the advisor and committee; (b) **external validation by an expert panel** via a short survey + optional mini-ATAM verifies the conclusions with external voices | Presentation of results is transformed into external validation, compensating for the absence of the conversational component |

### 2.4 External-validation component: methodological detail

The external-validation component operates as a **non-specialized peer-review** layer that replaces the role of the "external stakeholder" that original ATAM would have in its steps 1, 7, and 9.

**Two-level design:**

**Level 1 — Broad survey (target: N ≥ 15 respondents).** A concise 10–12 minute instrument administered via Google Forms to senior professionals in development, architecture, DevOps, security, and QA. Validation of the **perceived usefulness** of the framework with Likert scales on the five prioritized ISO 25010 attributes, plus three open questions about risks, trade-offs, and refinements to the framework. Provides aggregate quantitative evidence (descriptive statistics + light correlational analysis) and qualitative evidence (open coding of responses).

**Level 2 — Mini-ATAM with experts (target: 3–5 experts from Level 1).** A sub-panel selected by greater experience (≥ 5 years + architect/lead role) executes structured scoring of the 12 ATAM scenarios on a 1–5 as-is/to-be scale, with architectural classification of each as SP/TP/R/NR. Provides evidence of **convergence or divergence with the author's analysis** and allows inter-rater agreement to be calculated (Cohen's κ for 2 experts, Krippendorff's α for 3 or more).

**Academic framing:** the methodological decision is supported by Kitchenham & Pfleeger's (2008) guidelines on personal-opinion surveys in empirical software engineering, and by chapter 8 of Wohlin et al. (2012) on qualitative studies and expert surveys.

---

## 3. Operationalization: how each finding is produced

Each finding in the report (SP, TP, R, NR) is produced following the protocol:

1. **Initial analytical generation.** The author identifies the finding through inspection of the ADRs, diagrams, and code of the n8n flows. It is written up in `atam/analisis-approaches.md` with the architectural justification.

2. **Quantitative support.** Evidence is sought in the measurement artifacts:
   - Run-logs (`medicion/run-logs/*.csv`) for latency, failure rate
   - CR-logs (`medicion/cr-logs/*.csv`) for change impact
   - Static validator (`microframework/validacion/reportes/*.md`) for security and conformance
   - Consolidated reports (`medicion/consolidado/*.md`) for derived metrics
   - Runtime tests (IOT-Q4, IOT-Q5, BOT-Q5) for live behavior verification

3. **Triangulation with expert opinion (Phase V).** The finding is included in the survey's support material in a neutral way (without biasing the response) so experts identify it independently. Findings identified by ≥ 1 expert are marked as "convergent." Findings not identified by anyone on the panel are marked as "purely analytical" and that limitation is reported.

4. **Final inclusion decision.** Only findings supported by at least two of the three sources (documentary + quantitative + expert) are elevated to "confirmed finding" in the ATAM report. Findings supported by a single source are reported as "preliminary" or "exploratory."

---

## 4. Validity assurance and bias mitigation

### 4.1 Identified threats to validity

| Threat | Type (Wohlin et al. 2012) | Mitigation applied |
|---|---|---|
| Single-evaluator bias | Internal validity | Triangulation with external panel (Level 1 + Level 2) |
| Lack of panel representativeness | External validity | Explicit inclusion criteria (≥ 3 years, relevant roles) + transparent reporting of the respondent profile |
| Confirmation bias when designing the survey | Construct validity | Deliberate inclusion of open questions (Section C of the instrument) that allow findings not anticipated by the author |
| Respondent reactivity (Hawthorne effect) | Internal validity | Anonymous asynchronous survey with no direct contact during the response |
| Low statistical power if N is small | Conclusion | A priori definition of minimum sample sizes and honest reporting if they are not reached |
| Non-random panel selection | External validity | Explicit reporting of the sampling strategy (purposive/convenience) in the report's limitations section |

### 4.2 Reproducibility

For an external evaluator to be able to reproduce or audit the study:

- All instruments are versioned in the repository (`atam/instrumento-encuesta.md`, `atam/protocolo-encuesta.md`)
- The anonymized raw survey data is published as an appendix to the report (CSV)
- The statistical analysis plan is defined **before** receiving responses (`atam/plan-analisis-encuesta.md`) to prevent HARKing (Hypothesizing After Results are Known)
- Informed consent and inclusion criteria are auditable
- The statistical-analysis code is a versioned Python notebook

---

## 5. Recognized limitations

This section anticipates legitimate criticisms and acknowledges them explicitly so the final report can discuss them with academic honesty:

1. **No dynamic conversational component.** Original ATAM generates unanticipated trade-offs through conversational friction among stakeholders. The asynchronous adaptation loses that capability. The survey's open questions substitute for it partially but not equivalently.

2. **The panel validates, it does not co-construct.** In original ATAM, findings emerge from the discussion. Here, the author produces the findings and the panel validates or rejects them. This introduces an anchoring bias: experts see the proposal before forming an opinion.

3. **No real representation of the client or end user.** The case studies are simulated; there are no real product owners with formed preferences about the trade-offs.

4. **Dependence on the quality of the support material.** If the 4-page PDF or the 5-minute video do not adequately convey the problem and the proposal, the panel's responses lose validity. Mitigation: piloting with 2–3 people before dissemination.

5. **Sample size not guaranteed.** Participation in voluntary academic surveys is typically low (10–30%). There is no guarantee of reaching N ≥ 15 + 3 experts.

These limitations are reported in the "Study limitations" section of the ATAM report and are related to future lines of work (e.g., applying the methodology in a real production case with genuine stakeholders).

---

## 6. Closing

The "Asynchronous Modified ATAM with External Validation by Expert Panel" methodology preserves ATAM's central analytical products (utility tree, top-K scenarios, sensitivity/tradeoff points, risks/non-risks, scoring) and enriches them with two components absent from a desk evaluation: **empirical quantitative evidence** from 8,000 real system executions, and **external validation** by a panel of professionals independent from the author.

The adaptation is academically defensible based on established literature (Bass et al., 2012; Wohlin et al., 2012; Kitchenham & Pfleeger, 2008; Denzin, 1978) and produces the deliverables required by the pre-project (R4 — ATAM protocol and report) without pretending that a canonical ATAM has been performed, which would be methodologically incorrect.

---

## References

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley. Chapter 21 — ATAM.
- Denzin, N. K. (1978). *The Research Act: A Theoretical Introduction to Sociological Methods*. McGraw-Hill.
- ISO/IEC 25010:2011. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*.
- Kazman, R., Klein, M. & Clements, P. (2000). *ATAM: Method for Architecture Evaluation*. Technical Report CMU/SEI-2000-TR-004. Software Engineering Institute, Carnegie Mellon University.
- Kitchenham, B. & Pfleeger, S. L. (2008). Personal Opinion Surveys. In *Guide to Advanced Empirical Software Engineering* (pp. 63–92). Springer.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Wohlin, C., Runeson, P., Höst, M., Ohlsson, M. C., Regnell, B. & Wesslén, A. (2012). *Experimentation in Software Engineering*. Springer. Chapter 8 — Personal Opinion Surveys / Qualitative.
