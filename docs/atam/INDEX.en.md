> 🌐 **Language / Idioma:** English · [Español](INDEX.md)

# Artifact Index — Phase 7 · ATAM Evaluation

**Version:** 1.1
**Date:** 2026-05-07 (updated 2026-07-08)
**OE3 reached:** 100% — survey executed, analyzed, and documented in §8 of `informe-atam-final.md`

---

## Artifacts by work-plan block

### Block A — Residual evidence completed

| Artifact | Purpose | Status |
|---|---|---|
| `medicion/consolidado/atam-evidencia.md` v1.1 | Matrix of 12 scenarios × evidence — 11/12 coverage (92%) | ✅ |
| `medicion/consolidado/mttd-resultado.md` | MTTD BOT-Q5 (<15s) + IOT-Q4 runtime + NR-IOT-01 verified | ✅ |
| `medicion/run-logs/iot/run-log-iot-to-be.csv` | Additional rows from IOT-Q4 runtime test | ✅ |
| `medicion/analisis_iot_q5.py` | IOT-Q5 analysis script (latency distribution by nivel_alerta) | ✅ |

**ATAM coverage reached:** Bot 5/6 = 83% ✅ · IoT 6/6 = 100% ✅ · Total 11/12 = 92% ✅

---

### Block B — Formal analysis of ATAM approaches

| Artifact | Purpose | Status |
|---|---|---|
| `docs/atam/analisis-approaches.md` | 12 architectural approaches + SP/TP/R/NR classification × 12 scenarios | ✅ |
| `docs/atam/matriz-scoring.md` | 1–5 scoring as-is vs to-be per scenario with justification and evidence | ✅ |
| `docs/atam/registro-riesgos-tradeoffs.md` | Consolidated register: 3 SP · 3 TP · 4 R · 5 NR | ✅ |

**Formalized findings:**
- **3 Sensitivity Points:** SP-BOT-01, SP-BOT-02, SP-IOT-01
- **3 Tradeoff Points:** TP-GLOBAL-01, TP-GLOBAL-02, TP-IOT-01
- **4 Risks:** R-BOT-01, R-IOT-01, R-GLOBAL-01, R-GLOBAL-02
- **5 Non-risks:** NR-BOT-01, NR-BOT-02, NR-IOT-01, NR-IOT-02, NR-GLOBAL-01

---

### Block C — Documented methodological adaptation

| Artifact | Purpose | Status |
|---|---|---|
| `microframework/adr/ADR-MF-004-atam-adaptado-individual.md` | Formal decision: asynchronous adapted ATAM for an individual researcher | ✅ |
| `docs/atam/metodologia-atam-adaptada.md` | Adapted ATAM framework — justification, step-by-step mapping, bias mitigation | ✅ |

---

### Block D — External validation instrument

| Artifact | Purpose | Status |
|---|---|---|
| `docs/atam/protocolo-encuesta.md` | Protocol: criteria, consent, sample size, platform | ✅ |
| `docs/atam/instrumento-encuesta.md` | Complete survey: 18 questions (Section A–E) + optional mini-ATAM | ✅ |
| `docs/atam/plan-analisis-encuesta.md` | Statistical plan: descriptive, Cronbach's α, open coding, κ | ✅ |
| `docs/atam/plan-difusion.md` | Dissemination channels, invitation templates, candidate list | ✅ |
| `docs/atam/material-apoyo/resumen-proyecto.md` | Markdown source of the 4-page PDF for respondents | ✅ |
| `docs/atam/material-apoyo/guion-video.md` | Script for the 5-minute video for respondents | ✅ |
| `docs/atam/material-apoyo/diagrama-comparativo.md` | As-is vs to-be Mermaid diagrams for the PDF and slides | ✅ |
| `docs/atam/material-apoyo/README.md` | Index of public URLs — PDF, video, form | ✅ |
| `docs/atam/material-apoyo/guia-referencia-tecnica.md` | Transcription of the technical reference guide provided to the panel | ✅ |
| `medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv` | Anonymized survey data (N=19, 17 valid) | ✅ |
| `medicion/encuesta-validacion/analisis-encuesta.py` / `.ipynb` | Executed analysis script and notebook (descriptive statistics, Cronbach's α, Krippendorff's κ, thematic coding) | ✅ |
| `medicion/encuesta-validacion/outputs/` | Consolidated results (JSON, CSV, qualitative coding) | ✅ |

**Survey execution — completed:**
- [x] Generate PDF from `resumen-proyecto.md` / `guia-referencia-tecnica.md` and host it
- [x] Create Google Form following `instrumento-encuesta.md` (v2.0 refactored after piloting)
- [x] Pilot and adjust (see "Post-pilot adjustments" in `protocolo-encuesta.md` §8)
- [x] Distribute and collect responses (June 17–24, 2026, N=19, 17 valid)

---

### Block E — Consolidated ATAM report

| Artifact | Purpose | Status |
|---|---|---|
| `docs/atam/informe-atam-final.md` | Thesis chapter R4 — 10 complete sections, §8 with real survey results | ✅ |

**§8 completed:** "External validation by expert panel" documents the panel profile (8.1),
Section B results (8.2), Sections C/E4 qualitative coding (8.3), Section E triangulation with
Krippendorff's α (8.4), and the final synthesis (8.5).

---

### Block F — Closure and traceability

| Artifact | Purpose | Status |
|---|---|---|
| `docs/atam/INDEX.md` | This file — index of all Phase 7 artifacts | ✅ |
| `estado-actual.md` | Source of truth for progress — Phase 7 completed ✓ | ✅ |

---

## Complete traceability: ATAM Scenarios → Evidence → Approaches

| Scenario | Attribute | As-is score | To-be score | Approaches | Findings |
|---|---|:---:|:---:|---|---|
| BOT-Q1 | Maintainability | 2 | 5 | AP-01, AP-02, AP-10 | NR-BOT-01 |
| BOT-Q2 | Maintainability | 2 | 5 | AP-01, AP-02 | NR-BOT-01 |
| BOT-Q3 | Security | 1 | 5 | AP-03, AP-08, AP-11 | NR-BOT-02 |
| BOT-Q4 | Reliability | 1 | 4 | AP-04, AP-05 | SP-BOT-01 |
| BOT-Q5 | Operability | 1 | 5 | AP-07 | SP-BOT-02, NR-GLOBAL-01 |
| BOT-Q6 | Functional suitability | 2 | 5 | AP-08 | NR-BOT-02 |
| IOT-Q1 | Maintainability | 2 | 5 | AP-01, AP-10 | NR-GLOBAL-01 |
| IOT-Q2 | Maintainability | 2 | 5 | AP-01, AP-09 | — |
| IOT-Q3 | Reliability | 1 | 5 | AP-05, AP-08, AP-12 | NR-IOT-02 |
| IOT-Q4 | Reliability | 1 | 3 | AP-04, AP-06 | SP-IOT-01, R-IOT-01, NR-IOT-01 |
| IOT-Q5 | Reliability | 2 | 4 | AP-09, AP-04 | TP-IOT-01 |
| IOT-Q6 | Security | 1 | 5 | AP-03, AP-11 | NR-GLOBAL-01 |

---

## Pre-existing artifacts (Phases 1–6) referenced in Phase 7

> `atam-utility-tree.md` (this same directory) was produced in PHASE 5 but is filed
> alongside the other Phase 7 artifacts since it is its direct input — not in `docs/context/`.

```
medicion/consolidado/comparacion-2026-05-05.md → Main comparative metrics
medicion/consolidado/metricas-derivadas.md  → Detailed latency and failure analysis
medicion/run-logs/{bot,iot}/run-log-*-to-be.csv → Evidence from 8000 runs
medicion/cr-logs/{bot,iot}/cr-log-*-to-be.csv  → Evidence from 12 CRs
microframework/validacion/reportes/validacion-2026-05-06.md → Static validation 100%
casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md → RF→ADR→ISO→ATAM v1.3
casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md → RF→ADR→ISO→ATAM v1.3
```

---

## Definition of "Ready for survey" — completed

- [x] ATAM coverage ≥ 80% per case (Bot 83% ✅, IoT 100% ✅)
- [x] 15 architectural findings formalized (3 SP + 3 TP + 4 R + 5 NR)
- [x] 1–5 scoring as-is/to-be for the 12 scenarios
- [x] Survey instrument designed and refactored post-pilot (v2.0)
- [x] Support material produced (source PDF + video script + diagrams)
- [x] PDF generated and hosted; video recorded and hosted
- [x] Google Form created and piloted with documented adjustments
- [x] Dissemination campaign executed (N=19 responses, 17 valid, Jun 17–24 2026)
- [x] Consolidated ATAM report drafted — §8 with real survey results
