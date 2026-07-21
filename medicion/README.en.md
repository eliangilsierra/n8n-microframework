> 🌐 **Language / Idioma:** English · [Español](README.md)

# medicion/ — As-is vs to-be comparison data and evidence

**Path:** `medicion/`
**Belongs to:** [Repository (root)](../README.en.md)

---

## What it is and why it exists

This folder contains all the study's **quantitative evidence**: the synthetic input
datasets, the raw logs of every run (run-logs) and every Change Request (cr-logs), and the
consolidated reports comparing as-is vs to-be. It is the empirical backing for the ATAM
evaluation (Phase 7) and for each case's traceability matrix.

## Contents of this folder

| Subfolder / File | Description |
|---|---|
| [`consolidado/`](consolidado/README.en.md) | Final reports: as-is/to-be comparison, derived metrics, ATAM evidence, MTTD result |
| [`datasets/`](datasets/README.en.md) | Deterministically generated A–K synthetic datasets (static + dynamic) |
| [`run-logs/`](run-logs/README.en.md) | CSVs with the result of every individual run (8000 total rows) |
| [`cr-logs/`](cr-logs/README.en.md) | CSVs with the result of every measured Change Request (CR1, CR2, CR3) |
| [`encuesta-validacion/`](encuesta-validacion/README.en.md) | Anonymized Phase V data — external validation survey by the expert panel |
| `analizar_runlogs.py` | Generates the interactive HTML report `consolidado/reporte-runlogs.html` |
| `analisis_iot_q5.py` | Specific analysis of the ATAM IOT-Q5 scenario (differentiated urgency) |

## Relationship to the methodology

This folder is the source of the quantitative evidence the thesis proposal requires to
compare as-is vs to-be (Delivery, Operation, Security, and Traceability metrics — see
[`proyecto-overview.en.md`](proyecto-overview.en.md)). The data
here is **immutable once recorded** (see integrity rules in
[`../microframework/convenciones/convenios-y-reglas.en.md`](../microframework/convenciones/convenios-y-reglas.en.md)) and is
generated/queried following the operational protocol in
[`medicion/protocolo-evidencias.md`](protocolo-evidencias.en.md).

## Navigation

- Parent: [Repository (root)](../README.en.md)
- See also: [`automatizacion/README.md`](../automatizacion/README.en.md) (scripts that generate this data) · [`atam/informe-atam-final.md`](../atam/informe-atam-final.md) (how this evidence is used in ATAM)
