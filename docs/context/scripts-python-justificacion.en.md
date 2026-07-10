> 🌐 **Language / Idioma:** English · [Español](scripts-python-justificacion.md)

# Project Python scripts — Justification, role, and academic alignment

**Document:** Experimental engineering decision context
**Version:** 1.0
**Date:** 2026-05-23
**Author:** Elian Hernando Gil Sierra — MGADS UNAB 2026

---

## Table of contents

1. [Why Python: technology decision](#1-why-python-technology-decision)
2. [Script inventory and purpose of each](#2-script-inventory-and-purpose-of-each)
3. [Role in the research design](#3-role-in-the-research-design)
4. [Alignment with the specific objectives](#4-alignment-with-the-specific-objectives)
5. [Alignment with thesis proposal commitments](#5-alignment-with-thesis-proposal-commitments)
6. [Why not Node.js for these scripts](#6-why-not-nodejs-for-these-scripts)
7. [Reproducibility guarantees](#7-reproducibility-guarantees)
8. [Recognized limitations](#8-recognized-limitations)

---

## 1. Why Python: technology decision

The project uses Python for all measurement, analysis, and experimental data generation
scripts. This choice is neither arbitrary nor simply "author familiarity": it responds to
three characteristics of the research problem.

### 1.1 The problem is measurement and data analysis, not integration

The project's scripts perform three types of operations:

- **Controlled test orchestration:** sending N HTTP requests to n8n with known payloads,
  recording times and results with millisecond precision.
- **Time-series statistical analysis:** computing percentiles (p50, p95, p99), comparing
  distributions between as-is and to-be, detecting significant differences.
- **Evidence visualization:** producing interactive charts that allow inspecting the data
  from 8,000 runs.

For this kind of work, the Python ecosystem (NumPy, pandas, SciPy, Plotly) is the de facto
standard in applied research and has no mature equivalent in other scripting environments.

### 1.2 Deterministic reproducibility requires NumPy

The experiment's synthetic dataset (`medicion/datasets/generar_datasets.py`) uses
`numpy.random.default_rng(seed)` to generate bit-for-bit reproducible payloads. Each dataset
carries a SHA-256 hash computed over its content, allowing any evaluator to verify they are
using exactly the same inputs. This capability — deterministic generation with an explicit
seed and hash verification — is an experimental-rigor requirement that NumPy fulfills
natively and reliably.

### 1.3 Separation of technological responsibilities

The project uses two scripting tools with radically different purposes:

| Responsibility | Tool | Justification |
|---|---|---|
| Static analysis of n8n artifacts | Node.js (`validar-flujos.mjs`) | Cohesion with the n8n runtime; zero dependencies |
| Dynamic measurement, analysis, and visualization | Python (`run_corridas.py`, `analizar_runlogs.py`, etc.) | Data-science ecosystem; statistics and visualization |

This separation is not an inconsistency: it is a deliberate design decision. Mixing both
responsibilities in the same stack would have compromised one or the other. See
`microframework/validacion/README.md §2` for the complementary justification from the
Node.js validator's side.

---

## 2. Script inventory and purpose of each

### 2.1 `automatizacion/setup_env.py`

**Purpose:** Full bootstrap of the experimental environment with a single command.

**What it does:**
- Reads `infraestructura/.env.example` and generates `infraestructura/.env` with secure
  credentials (using `secrets.token_hex`)
- Runs `docker compose up -d` and waits for n8n, PostgreSQL, and the mock servers to be
  `healthy`
- Prints the instructions for the only manual step: importing flows in the n8n UI

**Why it exists:** The thesis proposal establishes that the experiment must be reproducible
under controlled conditions. Without this script, bringing up the environment would require
manual, error-prone configuration that differs between runs. With it, the environment
always starts from the same initial state.

**Output:** `infraestructura/.env` + 4 Docker services in a healthy state.

---

### 2.2 `medicion/datasets/generar_datasets.py`

**Purpose:** Generate the experiment's synthetic datasets deterministically and verifiably.

**What it does:**
- Reads `medicion/datasets/seeds.yaml` with explicit seeds per dataset and case
- Uses `numpy.random.default_rng(seed)` to generate payloads with physically plausible
  distributions (temperature, humidity, CO2 with real ranges for IoT; messages by category
  for Bot)
- Produces 10 JSON files (5 Bot + 5 IoT) with 200 payloads each: **2,000 total payloads**
- Computes and stores the SHA-256 hash of each file for integrity verification
- Supports `--verify-only` to confirm that existing files have not been modified

**Why it exists:** The quasi-experimental design requires controlled, fixed inputs across
runs. If payloads varied between executions, measured latency differences would not be
attributable solely to the architectural design (as-is vs to-be). The deterministic
generator guarantees that any evaluator who clones the repository and runs the script gets
exactly the same inputs.

**Sets generated:**
- Bot: A (nominal valid), B (high load), C (invalid — missing token), F, G (load variants)
- IoT: A (normal readings), B (mix), C (invalid — missing fields), I (mix with critical), J, K

**Output:** JSON files in `medicion/datasets/bot/` and `medicion/datasets/iot/`.

---

### 2.3 `automatizacion/run_corridas.py`

**Purpose:** Run measurement rounds against n8n webhooks with full control over input,
timing, and logging.

**What it does:**
- Sends HTTP POST requests to n8n webhooks (as-is and to-be, bot and IoT) using the
  generated datasets
- Measures end-to-end latency with high-resolution timestamps
  (`datetime.now(timezone.utc)`)
- Verifies that the received HTTP status code matches what the design expects (including
  cases where as-is returns 200 for invalid input — the documented antipattern)
- Logs every run in the run-log CSVs with: `run_id`, `case`, `version`, `input_set`,
  `start_ts`, `end_ts`, `status`, `error_type`, `commit_hash`
- Supports `--dry-run` to verify configuration without executing

**Why it exists:** n8n's REST API does not allow running flows with arbitrary inputs or
controlling run timing. The only real measurement mechanism is invoking the webhook
externally and recording latency from the client. This script is the experimental harness
that produces the experiment's raw data.

**Scale:** The complete experiment runs **8,000 rounds** (4 case×state combinations × 10
input sets × 200 payloads). This volume guarantees that the p95 and p99 percentiles are
statistically stable.

**Output:** Rows in `medicion/run-logs/bot/run-log-bot-{as-is|to-be}.csv` and
`medicion/run-logs/iot/run-log-iot-{as-is|to-be}.csv`.

---

### 2.4 `automatizacion/extract_metrics.py`

**Purpose:** Extract execution metrics from n8n's REST API as a complementary source.

**What it does:**
- Authenticates against n8n's REST API using `N8N_API_KEY`
- Queries each workflow's execution history by name
- Computes percentiles (p50, p95, p99) and failure rate from n8n's internal records
- Generates a Markdown report at `medicion/consolidado/metrics-YYYY-MM-DD.md`

**Why it exists:** The CSV run-logs record client-side latency (total time including
network and Docker overhead). n8n's API data records server-side time (internal workflow
processing time). Combining both sources allows separating infrastructure overhead from
real processing time, enriching the comparative analysis.

**Usage note:** Requires an API Key manually generated in the n8n UI. It is the only script
with that prerequisite.

**Output:** `medicion/consolidado/metrics-YYYY-MM-DD.md`.

---

### 2.5 `automatizacion/compare_results.py`

**Purpose:** Produce the as-is vs to-be comparison table from the run-logs.

**What it does:**
- Reads the 4 run-log CSVs (bot as-is, bot to-be, iot as-is, iot to-be)
- Computes for every case×state×input_set combination: p50, p95, p99 latency, success rate,
  N runs
- Generates a side-by-side Markdown table with deltas between as-is and to-be
- Includes the percent improvement or degradation per metric

**Why it exists:** The as-is vs to-be comparison is SO2's central quantitative result. This
script automates what would otherwise be a manual spreadsheet calculation, avoiding
transcription errors and guaranteeing that the report's numbers correspond exactly to the
repository's data.

**Output:** `medicion/consolidado/comparacion-YYYY-MM-DD.md`. There are two versioned
reports: [2026-05-03](../../medicion/consolidado/comparacion-2026-05-03.md) and
[2026-05-05](../../medicion/consolidado/comparacion-2026-05-05.md).

---

### 2.6 `medicion/analizar_runlogs.py`

**Purpose:** Full statistical analysis and interactive visualization of the run-logs.

**What it does:**
- Loads the 4 CSVs with pandas
- Computes performance (latency), quality (failure rate), and conformity (correct vs
  incorrect status codes) metrics
- Applies statistical tests with SciPy when available (distribution comparison)
- Generates an interactive HTML report with Plotly: latency distribution charts, as-is vs
  to-be comparisons, breakdown by input set

**Why it exists:** CSVs with 8,000 rows are not manually inspectable. This script turns raw
data into visualizations that allow:
1. Detecting outliers and anomalous patterns in the runs
2. Visually comparing as-is vs to-be latency distributions
3. Producing academically presentable figures for the ATAM report

**Dependencies:** `pandas`, `plotly`, `scipy` (optional for statistical tests).

**Output:** `medicion/consolidado/reporte-runlogs.html` (excluded from Git by
`.gitignore` — regenerated from the CSVs).

---

### 2.7 `medicion/analisis_iot_q5.py`

**Purpose:** Specific analysis of the ATAM IOT-Q5 scenario — differentiated urgency by
alert level.

**What it does:**
- Loads Input Set I (`medicion/datasets/iot/input-set-I.json`), which contains the mix of
  normal/warning/critical readings
- Applies the ADR-002 thresholds (temperature > 35°C → critical, CO2 > 1200 → critical,
  humidity > 80% → warning, CO2 > 800 → warning) to compute the expected level of each
  payload
- Cross-references those levels against the to-be run-log's timings to check whether the
  to-be flow processes critical readings faster or with higher priority than normal ones
- Produces latency statistics segmented by level: `normal`, `advertencia`, `critico`

**Why it exists:** The IOT-Q5 scenario in the ATAM Utility Tree asks: "does the to-be
differentiate response time by event urgency?" Answering that requires cross-referencing
the alert level (a field computed internally by E2, not directly observable in the run-log)
with the measured times. This script performs that cross-reference reproducibly and
documentedly.

**Relationship to ATAM:** This script's output is type-(ii) evidence — empirical
quantitative — in the ATAM evaluation's methodological triangulation. See
`docs/atam/informe-atam-final.md §7` and `medicion/consolidado/atam-evidencia.md`.

**Output:** Console report with level distribution and per-level latency statistics.

---

## 3. Role in the research design

The project adopts a **quasi-experimental as-is vs to-be comparison design** with a
**mixed-methods explanatory sequence**: first quantitative evidence, then qualitative
explanation via ATAM and ADRs.

The Python scripts are the component that produces the **quantitative evidence**. Their
position in the research flow:

```
Framework definition          Case construction            Quantitative measurement
(Phases 1-3)                  (Phases 2-4)                  (Phases 5-6)
     │                             │                             │
     ▼                             ▼                             ▼
microframework-spec.md      as-is/to-be JSON flows        generar_datasets.py
reglas-obligatorias.md      architecture checklists       setup_env.py
ADR-plantilla.md            traceability matrix           run_corridas.py
                                                            extract_metrics.py
                                                            compare_results.py
                                                            analizar_runlogs.py
                                                                 │
                                                                 ▼
                                                      Evidence for ATAM (Phase 7)
                                                      analisis_iot_q5.py
                                                      atam-evidencia.md
```

Without the measurement scripts, the ATAM would only have documentary evidence (checklist,
ADR). With them, the evaluation rests on three sources: documentary, empirical quantitative
over 8,000 real runs, and external validation by an expert panel — the methodological
triangulation that justifies adapting ATAM to an individual project.

---

## 4. Alignment with the specific objectives

### SO1 — Define an architectural framework

`setup_env.py` makes the framework **operable**: anyone can bring up the environment and
verify that the to-be flows work under the conditions described by the micro-framework.
Without a reproducible environment, the framework would be documentation only.

### SO2 — Systematize the framework's use across two case studies

This is the objective most directly supported by the scripts:

- `generar_datasets.py` produces the controlled inputs that make the as-is and to-be
  comparable under exactly the same input conditions
- `run_corridas.py` runs the experiment's **8,000 rounds** that generate the comparative
  data
- `compare_results.py` produces the as-is vs to-be table that is the quantitative result of
  "systematizing the framework's use across two cases"
- `analizar_runlogs.py` turns that data into inspectable visual evidence

Without these scripts, SO2's "systematization" would be only narrative. With them, there
are concrete, reproducible, auditable numbers that demonstrate the framework's impact on
the measured quality attributes.

### SO3 — Implement an ATAM-based architectural evaluation protocol

`analisis_iot_q5.py` and the run-logs produced by `run_corridas.py` are type-(ii) evidence
in ATAM's methodological triangulation. Specifically:

- Per-input-set latency data answers the BOT-Q1…Q6 and IOT-Q1…Q6 scenarios from the Utility
  Tree
- `analisis_iot_q5.py` directly answers the IOT-Q5 scenario (differentiated urgency)
- The 8,000 data points are the empirical basis of the 1-5 as-is vs to-be Scoring Matrix
  (`docs/atam/matriz-scoring.md`)

### SO4 — Propose an AWS architecture design

The scripts contribute indirectly: the risks identified in the ATAM (R-GLOBAL-01 ephemeral
logs, R-BOT-01 no token rotation, R-IOT-01 blocked dead-letter) emerge from the quantitative
analysis. Without the measurement data, those risks would be hypothetical; with the data,
they are observations grounded in empirical evidence that the AWS design must resolve.

---

## 5. Alignment with thesis proposal commitments

### 5.1 Quasi-experimental design (thesis proposal §3.2)

The thesis proposal explicitly establishes a quasi-experimental design where "execution
conditions are kept controlled and replicable (same n8n version, same configuration, same
synthetic inputs)". The scripts fulfill exactly that commitment:

- **Same n8n version:** `setup_env.py` uses the Docker image pinned in
  `infraestructura/docker-compose.yml`
- **Same configuration:** the environment is built from scratch with generated
  credentials, with no residual state
- **Same synthetic inputs:** `generar_datasets.py` produces identical inputs on any machine
  with the same seed

### 5.2 Mixed methodology with explanatory sequence (thesis proposal §3.1)

The thesis proposal describes the approach as "first operational quantitative evidence,
then qualitative explanation". The scripts are the component that produces the
quantitative evidence that precedes and grounds ATAM's qualitative explanation.

### 5.3 Committed metrics (thesis proposal §4.4)

The thesis proposal commits to specific metrics as evidence of the micro-framework's
impact. The scripts produce exactly those metrics:

| Committed metric | Script that produces it |
|---|---|
| p50/p95/p99 latency as-is vs to-be | `run_corridas.py` + `compare_results.py` |
| Failure rate per case and version | `run_corridas.py` + `analizar_runlogs.py` |
| Status-code conformity | `run_corridas.py` (verifies `EXPECTED_HTTP` by design) |
| Latency differentiated by alert level | `analisis_iot_q5.py` |
| n8n internal API statistics | `extract_metrics.py` |

### 5.4 Reproducibility as a validity criterion (thesis proposal §3.3)

The thesis proposal mentions reproducibility as an experiment validity criterion. The
scripts guarantee reproducibility across three layers:

1. **Environment:** `setup_env.py` rebuilds the environment from scratch
2. **Data:** `generar_datasets.py` with explicit seeds and SHA-256 hashes
3. **Measurement:** `run_corridas.py` records Git's `commit_hash` on every run, allowing any
   data point to be associated with the exact code state at that moment

---

## 6. Why not Node.js for these scripts

The decision to use Node.js in the static validator and Python in the measurement scripts
is a **deliberate separation of responsibilities**, not an inconsistency. The core reason:

**The measurement scripts are applied data science.** They need reliable descriptive
statistics (percentiles, standard deviation, hypothesis tests), manipulation of tables with
thousands of rows, and interactive visualization. The Python ecosystem (pandas, NumPy,
SciPy, Plotly) solves this with mature, documented tools used in academic research. Node.js
has no mature equivalent for this kind of work.

**The static validator is n8n artifact analysis.** It needs to parse JSON in n8n's native
format and verify structural predicates. Node.js does this natively, with no dependencies,
in the same runtime as n8n. Python would have added dependencies without providing anything
Node's stdlib couldn't already do.

Using the same language for both responsibilities would have been a false coherence that
would compromise one task or the other.

---

## 7. Reproducibility guarantees

The script set implements the following guarantees:

| Guarantee | Mechanism |
|---|---|
| Identical environment between runs | `setup_env.py` rebuilds from a pinned Docker image |
| Identical inputs between runs | Explicit seeds in `seeds.yaml` + SHA-256 verification |
| Data traceability | Git `commit_hash` recorded in every run-log row |
| Integrity verification | `generar_datasets.py --verify-only` compares current hashes against expected ones |
| Separation of raw and derived data | CSVs versioned in Git; HTML and reports regenerable |
| Documented expected behavior | `EXPECTED_HTTP` in `run_corridas.py` documents the correct status code by design, including the as-is antipatterns |

---

## 8. Recognized limitations

### 8.1 Measured latency is client-side

`run_corridas.py` measures time from the client (the machine running the script) until
receiving the HTTP response. This measurement includes the local Docker network overhead
and the HTTP stack. For the project's purpose — comparing as-is vs to-be in the same
environment — this is valid because both versions are measured with the same overhead. It
is not valid for asserting absolute production latencies.

### 8.2 The local environment does not replicate production

The experiment runs in local Docker with mock servers. The quantitative results are valid
for the as-is vs to-be comparison, not for predicting AWS behavior. The Phase 8 AWS design
addresses that gap.

### 8.3 `extract_metrics.py` requires a manual prerequisite

It is the only script requiring an API Key generated in the n8n UI. If unavailable, the
script does not run, but the CSV run-logs are the primary evidence source and do not depend
on this script.

### 8.4 `analizar_runlogs.py` generates unversioned HTML

The HTML report is excluded from Git (see `.gitignore`) because it is an artifact derived
from the CSVs. Regenerating it takes seconds with `python medicion/analizar_runlogs.py`.
The source CSVs are versioned.

---

## Cross-references

| Document | Relationship |
|---|---|
| [`docs/protocolo-evidencias.md`](../protocolo-evidencias.md) | Full operational protocol for running the experiment |
| [`docs/protocolo-mttd.md`](../protocolo-mttd.md) | Specific MTTD measurement procedure |
| [`automatizacion/README.md`](../../automatizacion/README.md) | Step-by-step command and usage-flow reference |
| [`medicion/consolidado/atam-evidencia.md`](../../medicion/consolidado/atam-evidencia.md) | How the measurement data feeds the ATAM evaluation |
| [`microframework/validacion/README.md`](../../microframework/validacion/README.md) | Complementary justification: why the validator uses Node.js |
| [`docs/context/proyecto-overview.md`](proyecto-overview.md) | SO1–SO4 and the thesis proposal's research design |
