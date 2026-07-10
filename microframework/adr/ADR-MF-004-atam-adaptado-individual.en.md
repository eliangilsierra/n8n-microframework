> 🌐 **Language / Idioma:** English · [Español](ADR-MF-004-atam-adaptado-individual.md)

# ADR-MF-004 — Adapting ATAM to an individual research context with external expert-panel validation

**Level:** Micro-framework (applies to the project's architectural evaluation methodology)
**Date:** 2026-05-07
**Status:** Accepted
**Quality attribute:** Traceability / Methodological validity
**Related rules:** none (a project methodological decision, not one about the flows)

---

## Context

The MGADS thesis proposal sets as specific objective SO3 *"apply an ATAM-based
architectural evaluation protocol to analyze and compare impacts, risks, and design
trade-offs between the as-is and to-be architectures"*. The original ATAM method (Kazman,
Klein & Clements, 2000; Bass, Clements & Kazman, 2012) is a collaborative 9-step process
designed to run in in-person workshops with the simultaneous participation of
**heterogeneous stakeholders**: system architects, product owner, development team,
operations, security, and client or end-user representatives. The two canonical sessions
(1 day each) require between 8 and 15 participants who generate scenarios, prioritize them
by consensus, analyze architectural approaches, and collectively produce the list of risks
and trade-offs.

This project has an insurmountable structural constraint: it is an individual Master's
thesis developed by a single researcher, with no project team or real client available to
run the collaborative sessions ATAM-original demands. Literally applying ATAM in this
context would produce a single-viewpoint evaluation (only the author's) that would be
methodologically weak both due to single-evaluator bias and the impossibility of generating
the conversational component that distinguishes ATAM from a desk analysis.

A methodological decision is needed that (i) preserves ATAM's core analytical
elements — utility tree, identification of sensitivity/tradeoff points, risks, non-risks,
and per-scenario scoring — while simultaneously (ii) compensating for the absence of the
multi-stakeholder component with an external validation mechanism that reduces
single-evaluator bias and gives the study defensible academic credibility before the jury.

---

## Decision

A variant called **"Asynchronous Modified ATAM with External Validation by an Expert
Panel"** is adopted, which preserves ATAM-original's 9 steps but reorders them and operates
asynchronously, replacing the multi-stakeholder workshop dynamic with a combination of
three triangulated evidence sources:

1. **Documentary evidence.** The architecture, decisions (19 ADRs), and approaches are
   documented in the repository with RF → ADR → ISO 25010 → ATAM scenario traceability.
   This replaces in-person ATAM's "Step 3 — Present architecture".

2. **Empirical quantitative evidence.** The utility tree's 12 scenarios have operational
   response measures collected across 8,000 real platform runs (4,000 as-is + 4,000
   to-be), 12 measured Change Requests, IOT-Q4 and IOT-Q5 runtime executions, MTTD
   analysis, and the `validar-flujos.mjs` validator's static verification. This replaces
   "Step 8 — Re-analyze approaches", where in ATAM-original group discussion refines the
   analysis.

3. **External validation by an expert panel** (the key compensating component). A short,
   concise survey (10–12 min) is run, targeting senior software development, architecture,
   DevOps, security, and QA professionals, accompanied by an optional mini-ATAM (15
   additional minutes) for a sub-panel of 3 to 5 selected experts. This replaces "Step 9 —
   Present results" and introduces voices external to the author that verify or challenge
   the analysis's conclusions.

R4's final product (the ATAM report) integrates the three sources into a single chapter
where every finding (sensitivity point, tradeoff point, risk, non-risk) explicitly cites
its documentary, quantitative, and external-validation evidence.

---

## Alternatives considered

- **Full ATAM with simulated stakeholders:** invite 3–5 colleagues to play fictional roles
  (client, ops, dev) in a one-day session. Discarded because participants lack real domain
  context (real LC/NC business) and the simulation would introduce noise without
  compensating for single-evaluator bias; additionally, coordinating 5 people for a full
  day is not viable within the schedule.

- **Pure internal evaluation with no external validation:** run only ATAM's analytical
  steps (utility tree, scoring, risks) with no external component. Discarded because it
  preserves single-evaluator bias with no mitigation, weakening the study's external
  validity against Wohlin et al. (2012), who recommend triangulation when there is a single
  researcher.

- **Full replacement by SAAM (Software Architecture Analysis Method):** a lighter
  predecessor method focused on modifiability. Discarded because SAAM does not capture the
  multi-attribute tradeoff points actually at stake (e.g., latency ↑ vs modularity ↑ in the
  IoT to-be) and because the thesis proposal explicitly committed to ATAM, not SAAM.

- **Broad survey with no internal analytical component:** only collect external opinions
  without the author producing the utility tree, scoring, or SP/TP/R/NR classification.
  Discarded because the expert panel does not have access to the level of ADR or code
  detail needed to perform a complete analysis in a few minutes; the panel's role is to
  validate the author's analysis, not produce it from scratch.

---

## Consequences

**Positive:**

- Preserves ATAM's formal deliverables required by the thesis proposal (utility tree,
  top-K scenarios, scoring matrix, risk and trade-off registry) without diluting analytical
  rigor.
- Mitigates single-evaluator bias through **methodological triangulation** (Denzin, 1978):
  three independent sources (documentation, metrics, external experts) converge on every
  finding.
- Producible within the individual project's time and resource constraints: ~7 days of
  analysis + ~3 weeks of asynchronous survey collection.
- Academically defensible with explicit references to lightweight-ATAM literature (Bass et
  al., 2012, ch. 21), expert opinion surveys (Wohlin et al., 2012, ch. 8), and personal
  opinion survey guides in empirical software engineering (Kitchenham & Pfleeger, 2008).
- Generates a reusable dataset: the panel's anonymized responses remain as a thesis annex
  and are natural input for a derived publication (CLEI, JISBD, IEEE LATAM).

**Negative / trade-offs:**

- The external validation component depends on the size and heterogeneity of the panel
  actually recruited. If N < 15 respondents or ≥ 3 experts are not secured for the
  mini-ATAM, the statistical analyses (Cronbach's α, Cohen's κ) lose power and results must
  be presented as exploratory. Mitigation: define a minimum acceptable sample size and
  honestly report the limitations.
- Asynchrony removes ATAM's original conversational component, which sometimes reveals
  unanticipated trade-offs; experts do not confront each other. Mitigation: include open
  questions that capture individual reactions and report the divergences found.
- Panel responses may arrive after the report's closing; §8 of the ATAM report is drafted
  with an explicit placeholder and completed once the data arrives. Mitigation: the report
  is drafted with a modular section 8 for later integration without rewriting.
- The adaptation requires additional documentation (this ADR + `metodologia-atam-adaptada.md`)
  so the jury can evaluate the adaptation's rigor. Mitigation: produce both documents before
  the report's closing.

---

## Relationship to the micro-framework

This decision is **methodological for the project**, not normative for the n8n flows. It
introduces no new rules (REG-*) or patterns into the micro-framework. Its relationship to
the rest of the project is:

- Defines how micro-framework v1.0's compliance is evaluated over the case studies.
- Establishes the procedure that produces R4 (the thesis proposal's "ATAM protocol and
  report" deliverable).
- Documents for the jury why the evaluation does not follow ATAM-original's in-person
  choreography.
- Operational cross-references:
  - `docs/atam/metodologia-atam-adaptada.md` — full development of the adaptation
  - `docs/atam/informe-atam-final.md` — application of the methodology
  - `docs/atam/protocolo-encuesta.md` — procedure for the external validation component
  - `docs/atam/atam-utility-tree.md` — utility tree preserved from ATAM-original
  - `medicion/consolidado/atam-evidencia.md` — quantitative evidence matrix
