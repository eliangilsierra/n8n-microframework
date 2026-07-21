> 🌐 **Language / Idioma:** English · [Español](README.md)

# External Validation Survey Data — Expert Panel

**Path:** `medicion/encuesta-validacion/`
**Belongs to:** [medicion/](../README.en.md)

---

## What it is and why it exists

This folder contains the raw (anonymized) data from Phase V — external validation by an
expert panel — collected via Google Forms between June 17 and June 24, 2026 (see
[`atam/protocolo-encuesta.en.md`](../../atam/protocolo-encuesta.en.md) §4.4). It is
the data source that feeds section 8 of
[`atam/informe-atam-final.md`](../../atam/informe-atam-final.md), now complete,
following the pre-registered analysis plan in
[`atam/plan-analisis-encuesta.md`](../../atam/plan-analisis-encuesta.md).

## Contents of this folder

| File | Description |
|---|---|
| `respuestas-anonimizadas-2026-06-24.csv` | 19 responses (rows), 57 columns. The optional email column (F1) was removed; a sequential `respondent_id` (R-001…R-019) was added in its place, following the pre-registered anonymization procedure in `plan-analisis-encuesta.md` §2.2. |
| `analisis-encuesta.py` | Executable script that fully reproduces the results in `informe-atam-final.md` §8: descriptive statistics for Sections A/B/D, Cronbach's α per thematic pair, Section E triangulation, and Krippendorff's α. |
| `analisis-encuesta.ipynb` | Same analysis as a notebook, already executed (outputs embedded), organized in the same 9 sections as `plan-analisis-encuesta.md` §5. |
| `build_notebook.py` | Generates `analisis-encuesta.ipynb` from scratch — use only if the notebook needs to be rebuilt. |
| `requirements.txt` | The one external dependency (`krippendorff`) — install with `pip install -r requirements.txt` before running. |
| `outputs/` | Consolidated results: `reporte-completo.json`, `descriptivos-seccion-b.csv`, `matriz-comparacion-scoring-seccion-e.csv`, `categorias-emergentes-seccion-c.md` (manual qualitative coding). |

## How to reproduce the analysis

```bash
cd medicion/encuesta-validacion
pip install -r requirements.txt
python analisis-encuesta.py
```

The script only depends on the anonymized CSV in this same folder (it does not require the raw
CSV with emails, which is never committed). The console output and the files in `outputs/`
must match exactly the figures cited in `informe-atam-final.md` §8 — if they don't, that's a
regression and should be reported.

> ⚠️ **The original raw CSV (with the unanonymized email column) is NOT committed to this
> repository**, in compliance with the anonymity protocol declared in the survey's informed
> consent (`protocolo-encuesta.md` §3 and §5). Only 3 of the 19 respondents filled in that
> optional field; those 3 emails remain outside version control, held exclusively by the
> author, and are deleted 60 days after the collection closes, as promised to respondents.

## Anonymized CSV column schema

| Column range | Instrument section | Content |
|---|---|---|
| 0 | — | `respondent_id` (R-001…R-019, generated during anonymization) |
| 1 | — | Submission timestamp (Google Forms) |
| 2 | Screen 0 | Informed consent acceptance |
| 3–4 | Section A | A1 (role), A2 (years of experience) |
| 5–7 | Section A | A3-A4-A5 grid (familiarity with LC/NC, Clean Architecture, architectural evaluation) — 3 columns, one per grid row |
| 8–15 | Section B | B1–B8 grids (framework valuation, 4 grids of 2 rows) — 8 columns |
| 16 | Section C | C1 — consolidated open question (risks, trade-offs, and refinement suggestions in a single field; see the note in `instrumento-encuesta.en.md` §Section C) |
| 17 | Section D | D1 — overall 1–10 rating |
| 18 | Section D | D2 — adoption intent |
| 19 | Section D | D2-bis — reason (conditional, optional) |
| 20–31 | Section E | E1 — AS-IS scoring, 12 columns (one per scenario BOT-Q1…IOT-Q6) |
| 32–43 | Section E | E2 — TO-BE scoring, 12 columns |
| 44–55 | Section E | E3 — architectural classification, 12 columns (1–5 support-scale values, not category acronyms — see the equivalence in `instrumento-encuesta.en.md` §Instrument evolution) |
| 56 | Section E | E4 — optional free comment |

The complete mapping of each question to its analysis hypothesis is in
[`atam/instrumento-encuesta.en.md`](../../atam/instrumento-encuesta.en.md) §Appendix.

## Relationship to the methodology

This data is the external evidence (the third source of the methodological triangulation,
alongside documentary evidence and the quantitative evidence from the 8,000 runs) that
corroborates or challenges the author's ATAM analysis. The pre-registered analysis plan
(`plan-analisis-encuesta.md`) defines, before having seen this data, which statistical tests
and interpretation criteria apply — the actual analysis over this CSV has already been run
(`analisis-encuesta.py` / `.ipynb`) and is documented in `informe-atam-final.md` §8.

## Navigation

- **Parent:** [medicion/](../README.en.md)
- **See also:** [`atam/protocolo-encuesta.en.md`](../../atam/protocolo-encuesta.en.md) · [`atam/instrumento-encuesta.en.md`](../../atam/instrumento-encuesta.en.md) · [`atam/plan-analisis-encuesta.md`](../../atam/plan-analisis-encuesta.md)

---
*Last updated: 2026-07-08 · Source of truth for progress: [estado-actual.md](../../estado-actual.en.md)*
