> 🌐 **Language / Idioma:** English · [Español](microframework-v1.0.md)

# LC/NC micro-framework for n8n — v1.0

**Thesis proposal deliverable R1** (§4.2). Consolidated document referencing all
normative micro-framework artifacts. This version closes PHASE 3 and is the baseline
against which the Bot and IoT case studies' to-be flows are built.

**Version:** 1.1 (updated 2026-05-01 with 15 academic-robustness improvements)
**Date:** 2026-04-17 — updated 2026-05-01 with full academic support
**Author:** Elian Hernando Gil Sierra
**Thesis:** MGADS — UNAB 2026

---

## 1. Purpose

Translate **Clean Architecture** and **DevSecOps** principles into n8n's visual and
operational context through a lightweight, verifiable set of rules, patterns, and
templates. The micro-framework introduces no external dependencies: it is a set of design
decisions applicable when building flows.

It directly answers the thesis proposal's specific objectives:

- **SO1** — Define an architectural framework for Low-Code/No-Code flows in n8n, based on
  Clean Architecture principles, relating quality attributes to design decisions,
  organization rules, patterns, and best-practice criteria.
- **SO2** — Systematize the architectural framework's use across two representative case
  studies, documenting as-is and to-be architectures with clear diagrams, decision records
  (ADRs), and a traceability matrix between requirements, decisions, and quality
  attributes.

---

## 2. Micro-framework components

| Component | Location | Purpose |
|---|---|---|
| E1–E4 metamodel | [`microframework/microframework-spec.md`](microframework-spec.en.md) | Four logical stages: validation, domain, adapters, output |
| Mandatory rules (REG-001…010) | [`microframework/reglas/reglas-obligatorias.md`](reglas/reglas-obligatorias.en.md) | 10 rules with binary criteria and ISO/IEC 25010 mapping |
| Recommended rules (REC-001…006) | [`microframework/reglas/reglas-recomendadas.md`](reglas/reglas-recomendadas.en.md) | 6 optional reinforcement rules |
| Patterns | [`microframework/patrones/`](patrones/) | 5 patterns: retry, idempotency, structured log, circuit breaker, error boundary, saga |
| Antipatterns | [`microframework/antipatrones.md`](antipatrones.en.md) | Catalog of 11 documented antipatterns |
| Framework-level ADRs | [`microframework/adr/`](adr/) | ADR-MF-001 (REG-001), ADR-MF-002 (REG-003), ADR-MF-003 (REG-006) |
| I/O contracts | [`microframework/contratos/`](contratos/) | Per-stage JSON Schemas for Bot and IoT (9 files) |
| Conventions | [`microframework/convenciones/naming-conventions.md`](convenciones/naming-conventions.en.md) | File, subflow, node, and variable names |
| Architecture checklist | [`microframework/checklists/checklist-arquitectura.md`](checklists/checklist-arquitectura.en.md) | 10 binary items aligned with REG-* |
| DevSecOps checklist | [`microframework/checklists/checklist-devsecops.md`](checklists/checklist-devsecops.en.md) | 8 security items (Pillar 1) |
| Observability guide | [`microframework/guia-observabilidad.md`](guia-observabilidad.en.md) | Pillar 3: structured log contract per stage |
| Static validation (Lite) | [`microframework/validacion/validar-flujos.mjs`](validacion/validar-flujos.mjs) | Pillar 2 — a single `.mjs` file, zero dependencies, offline HTML. Evaluates 11 REG-* + 6 AP-* antipatterns over the flow graph |
| Static validation (Pro) | [`microframework/validacion-pro/`](validacion-pro/) | Pillar 2 — modular package with a YAML rule DSL, `--fix` codemods, SARIF for GitHub Code Scanning, vitest suite |
| ADR and JSON templates | [`microframework/plantillas/`](plantillas/) | 10 JSON templates (2 as-is + 8 to-be/subflows) + Markdown ADR template |
| ATAM Utility Tree | [`atam/atam-utility-tree.md`](../atam/atam-utility-tree.en.md) | 12 top-K scenarios (6 Bot + 6 IoT) with response measures for PHASE 7 |
| MTTD protocol | [`medicion/protocolo-mttd.md`](../medicion/protocolo-mttd.en.md) | Reproducible Mean Time To Detect measurement procedure |
| Case taxonomy | [`casos-de-estudio/justificacion-casos-de-estudio.md`](../casos-de-estudio/justificacion-casos-de-estudio.en.md) | Formal representativeness of Bot and IoT within n8n's LC/NC space |

---

## 3. E1–E4 metamodel

Every flow adopting the micro-framework is organized into four **logical responsibilities**
(not necessarily four subflows — see the Bot case's ADR-002 for the exception of inline
E4):

- **E1 — Validation:** verifies the payload against the contract, generates `run_id`,
  captures `start_ts`. No contact with IO or the domain.
- **E2 — Domain:** applies pure business rules. No DB or HTTP access (REG-007).
- **E3 — Adapters:** translates the domain decision into the external system's format and
  executes the integration with retry (REG-004) and idempotency (REG-005).
- **E4 — Output:** produces the final response or notification with appropriate status
  codes (REG-009).

Full specification: [`microframework/microframework-spec.md`](microframework-spec.en.md).

---

## 4. DevSecOps — three pillars

Aligned with §4.3 of the thesis proposal:

| Pillar | Instrumentation | Verification |
|---|---|---|
| 1. Secrets Management | n8n credentials referenced by name; `.env` outside Git | Items 1–5 of the DevSecOps checklist + REG-001 |
| 2. Automated Validation | Lite [`validar-flujos.mjs`](validacion/validar-flujos.mjs) + Pro [`validacion-pro/`](validacion-pro/) | Evaluates 17 rules (11 REG-* + 6 AP-*) over the flow graph. Every finding carries severity, confidence, ISO 25010, ATAM, ADR. Outputs: md, canonical json, offline html, sarif, junit |
| 3. Operational Resilience | Retry and idempotency patterns + [`guia-observabilidad.md`](guia-observabilidad.en.md) | REG-004, REG-005, REG-006 |

---

## 5. ISO/IEC 25010 mapping

The micro-framework contributes to five quality-model characteristics. Each rule is
explicitly mapped in
[`reglas-obligatorias.md`](reglas/reglas-obligatorias.en.md#iso-iec-25010-mapping).

| Characteristic | Rules | Thesis proposal metric |
|---|---|---|
| Maintainability (Modularity, Analyzability, Reusability) | REG-002, REG-007, REG-008, REG-010 | Change impact, Subflow reuse ratio |
| Reliability (Tolerance, Recoverability, Maturity) | REG-003, REG-004, REG-005 | Failure rate, Retry efficiency |
| Security (Confidentiality) | REG-001 | Secret exposure (DevSecOps checklist) |
| Performance efficiency (Time behavior) | REG-006 (latency logs) | p50/p95/p99 latency per segment |
| Operability (Monitorability) | REG-006 | MTTD (Mean Time To Detect) |

Quantitative coverage is measured in PHASE 7 (ATAM) — thesis proposal goal: ≥ 80%.

---

## 6. Adoption flow

Applying the micro-framework to a new case follows this sequence:

1. Define the case's I/O contracts as JSON Schema in `microframework/contratos/`.
2. Import the 4 subflow templates from `microframework/plantillas/`
   (or 3 if the omission of E4 as a subflow applies — requires a justifying ADR).
3. Capture real IDs and update `Execute Workflow` references in the orchestrator.
4. Apply the [`checklist-arquitectura.md`](checklists/checklist-arquitectura.en.md)
   and the [`checklist-devsecops.md`](checklists/checklist-devsecops.en.md).
5. Run `node microframework/validacion/validar-flujos.mjs --caso <name> --estado to-be`.
6. Document non-obvious decisions as an ADR in `casos-de-estudio/<case>/adr/`.
7. Version the re-exported JSON in `casos-de-estudio/<case>/to-be/`.

---

## 7. Micro-framework v1.0 acceptance criteria

The micro-framework is considered deliverable R1 when:

- ✓ 10 mandatory rules with binary criteria and ISO 25010 mapping
- ✓ Static validation script executable over the JSON (REG-001 false negative fixed at PHASE 3 closure)
- ✓ Observability guide with a per-stage log contract
- ✓ Bot and IoT I/O contracts as JSON Schema (5 contracts reviewed and aligned with real datasets at PHASE 3 closure)
- ✓ Subflow templates + ADR template (10 JSON + ADR template)
- ✓ Two case studies (Bot, IoT) with as-is and to-be designed
- ✓ **Complete per-case ADRs** — 9 total ADRs: 4 Bot + 4 IoT + shared ADR-004
  - Bot: [001](../casos-de-estudio/bot/adr/ADR-001-separacion-responsabilidades-flujo.md),
    [002](../casos-de-estudio/bot/adr/ADR-002-omision-e4.md),
    [003](../casos-de-estudio/bot/adr/ADR-003-ratelimit-medicion.md),
    [004](../casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.md)
  - IoT: [001](../casos-de-estudio/iot/adr/ADR-001-separacion-responsabilidades-pipeline.md),
    [002](../casos-de-estudio/iot/adr/ADR-002-umbrales-y-vocabulario.md),
    [003](../casos-de-estudio/iot/adr/ADR-003-idempotencia-sensor-timestamp.md),
    [004](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md)
- ✓ **As-is change log with evidence** — `cambios-y-evidencia.md` per case:
  [Bot](../casos-de-estudio/bot/as-is/cambios-y-evidencia.md) · [IoT](../casos-de-estudio/iot/as-is/cambios-y-evidencia.md)
- ✓ **CR design with executed as-is pre-measurement** — `cr-design.md` per case and
  `cr-log-{case}-as-is.csv` populated with 3 rows each:
  [Bot design](../casos-de-estudio/bot/cr-design.md) · [IoT design](../casos-de-estudio/iot/cr-design.md)
- ✓ **Checklists applied to the as-is as evidence** — 4 result files:
  [Bot arch](../casos-de-estudio/bot/as-is/checklist-arquitectura-resultado.md) ·
  [Bot DevSecOps](../casos-de-estudio/bot/as-is/checklist-devsecops-resultado.md) ·
  [IoT arch](../casos-de-estudio/iot/as-is/checklist-arquitectura-resultado.md) ·
  [IoT DevSecOps](../casos-de-estudio/iot/as-is/checklist-devsecops-resultado.md)
- ✓ **Traceability matrices with no pending items** — links to real ADRs in
  [Bot](../casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md) and
  [IoT](../casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md)
- ✓ No artifact contradicts the thesis proposal (§4 scope, §5 methodology). The Input
  Sets expansion is documented as an addendum in `proyecto-overview.md` §Input Sets and
  formalized in Bot ADR-004.

All criteria are met in this version.

### Additional criteria — v1.1 (2026-05-01)

- ✓ **Complete theoretical foundation** — Clean Architecture (Martin 2017), NIST SSDF, OWASP Top 10, LC/NC literature (Bock & Frank 2021, Cabot 2020, Sahay 2020), positioning against Power Platform and Zapier
- ✓ **Framework-level ADRs** — 3 ADRs (ADR-MF-001/002/003) for REG-001, REG-003, REG-006 with context, decision, alternatives, and consequences
- ✓ **Complete per-case ADRs** — 8 ADRs per case (Bot: 001–008, IoT: 001–008)
- ✓ **Expanded patterns** — 5 patterns (+ circuit breaker, error boundary, saga/compensation)
- ✓ **Expanded antipatterns** — 11 antipatterns (+ hardcoded ID, chatty, exception swallowing, god node)
- ✓ **ATAM Utility Tree** — 12 scenarios (6 Bot + 6 IoT) with response measures and ADR traceability
- ✓ **MTTD protocol** — reproducible MTTD measurement procedure with a < 60 second goal
- ✓ **As-is architecture diagrams** — Mermaid with per-node annotated antipatterns for Bot and IoT
- ✓ **Traceability matrices v1.2** — ISO 25010 column in the requirement tables
- ✓ **Methodological justification of the as-is redesign** — internal validity per Wohlin et al. (2012)
- ✓ **commit_hash anomaly documentation** — §9 in protocolo-evidencias.md

---

## 8. Relationship to the thesis proposal's results

| Result | Micro-framework contribution |
|---|---|
| R1 — Documented micro-framework | This document and the referenced artifacts |
| R2 — Comparable as-is and to-be cases | Templates and rules enable uniform to-be design |
| R3 — Quantitative measurement | REG-006 + the observability guide feed the metrics |
| R4 — ATAM evaluation | ISO 25010 mapping + per-case ADRs are reproducible evidence |
| R5 — AWS design | Structured logs move to CloudWatch Insights (PHASE 8) |
| R6 — Best practices guide | Antipatterns, patterns, and checklists are direct input |

---

## 9. Versioning and changes

Any modification to REG-*, to the E1–E4 metamodel, or to the contracts requires:

- An ADR in `casos-de-estudio/{case}/adr/` if the deviation is per-case.
- Updating this document and bumping the version (v1.1, v2.0, …).
- Re-running the validation script over all affected cases.

---

## 10. Normative references

- MGADS thesis proposal (author's normative document, not versioned in the repository)
- Project overview: [`../medicion/proyecto-overview.en.md`](../medicion/proyecto-overview.en.md)
- As-is / to-be architecture: [`casos-de-estudio/arquitectura-flujos.md`](../casos-de-estudio/arquitectura-flujos.md)
- Repository conventions and rules: [`convenciones/convenios-y-reglas.en.md`](convenciones/convenios-y-reglas.en.md)
- Evidence protocol: [`medicion/protocolo-evidencias.md`](../medicion/protocolo-evidencias.en.md)
- Current project status: [`estado-actual.md`](../estado-actual.md)
