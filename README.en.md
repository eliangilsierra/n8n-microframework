> 🌐 **Language / Idioma:** English · [Español](README.md)

# LC/NC micro-framework for n8n with Clean Architecture and DevSecOps

**Master's thesis — Master's in Software Management, Application and Development (MGADS),
Universidad Autónoma de Bucaramanga (UNAB), 2026**

**Author:** Elian Hernando Gil Sierra · **Advisor:** Sebastian Roa Prada, PhD

---

## Project summary

This repository contains the design, implementation, and evaluation evidence of an
**architectural micro-framework** for Low-Code/No-Code (LC/NC) solutions built on the
[n8n](https://n8n.io) automation platform, grounded in **Clean Architecture** principles
and **DevSecOps** practices.

The micro-framework is validated by comparing **as-is** (baseline, no architecture) and
**to-be** (micro-framework applied) designs across **two case studies** — a customer-support
chatbot (`bot`) and an IoT sensor-ingestion pipeline (`iot`) — using the **ATAM**
(Architecture Tradeoff Analysis Method). The project also includes a reference AWS
architecture design and a static n8n flow validator built as part of the DevSecOps pillar.

This repository is the **supporting artifact** for the article submitted to *Journal of
Software: Evolution and Process* (JSEP). All content is written so that an external
researcher can **understand the methodology and replicate the study** using only what is
documented here.

---

## How to navigate this repository

- All documentation is **bilingual**: every Spanish `.md` file has an `.en.md` counterpart
  with the translation (except evidence logs/datasets, which are data, not prose). A banner
  at the top of every document links to its language counterpart.
- The **folder structure mirrors the methodology**: `casos-de-estudio/` separates as-is
  from to-be, `microframework/` holds the rules/patterns/ADRs/validator,
  `docs/atam/` documents the ATAM evaluation, `docs/aws/` the architecture design.
- Every folder and subfolder has its own `README.md` explaining what it is, why it exists,
  and how it relates to the methodology, with navigation links (parent folder, next
  section, "see also").
- For a detailed map of the documentation under `docs/`, see [`docs/INDEX.en.md`](docs/INDEX.en.md).

---

## Repository map

| Folder | What it contains | README |
|---|---|---|
| [`microframework/`](microframework/README.en.md) | The micro-framework itself: mandatory/recommended rules, patterns, ADRs, checklists, templates, and the static validator (Lite + Pro) | [→](microframework/README.en.md) |
| [`casos-de-estudio/`](casos-de-estudio/README.en.md) | The two validation cases (`bot`, `iot`): as-is/to-be flows, per-case ADRs, traceability matrix | [→](casos-de-estudio/README.en.md) |
| [`docs/`](docs/README.en.md) | Methodological documentation: theoretical context, ATAM evaluation, AWS design, operational protocols | [→](docs/README.en.md) |
| [`medicion/`](medicion/README.en.md) | Synthetic datasets, run-logs, cr-logs, and consolidated as-is vs to-be reports | [→](medicion/README.en.md) |
| [`automatizacion/`](automatizacion/README.en.md) | Python scripts that orchestrate the environment, measurement runs, and comparison reports | [→](automatizacion/README.en.md) |
| [`infraestructura/`](infraestructura/README.en.md) | Docker Compose (n8n + PostgreSQL + mocks) and environment variable template | [→](infraestructura/README.en.md) |
| [`final/`](final/README.en.md) | Archival snapshot of deliverables already submitted per phase (PHASE0–PHASE9) | [→](final/README.en.md) |

---

## Methodology at a glance

- **As-is vs to-be:** each case study has an as-is version (baseline, with intentional
  antipatterns) and a to-be version (micro-framework applied), compared under the same
  execution conditions. See [`docs/context/arquitectura-flujos.en.md`](docs/context/arquitectura-flujos.en.md).
- **E1–E4 stages:** every to-be flow is organized into four logical stages — **E1 Input
  validation**, **E2 Domain logic**, **E3 Integration adapters**, **E4 Controlled output** —
  each one a subflow invoked via `Execute Workflow`. See
  [`docs/context/microframework-spec.en.md`](docs/context/microframework-spec.en.md).
- **ADRs (Architecture Decision Records):** every relevant design decision is documented
  using the template at [`microframework/plantillas/ADR-plantilla.en.md`](microframework/plantillas/ADR-plantilla.en.md).
- **ATAM:** the evaluation of quality attributes (maintainability, security, reliability,
  traceability) follows an adapted ATAM methodology. See [`docs/atam/INDEX.en.md`](docs/atam/INDEX.en.md).
- **Mandatory (REG-001..010) and recommended (REC-001..006) rules:** the full
  micro-framework rule catalog is in [`microframework/reglas/`](microframework/reglas/README.en.md).

---

## The two case studies

### Bot case — Support chatbot
Receives messages via webhook, validates authentication, classifies the message (incident,
billing, technical support, greeting, general), determines priority, and persists the
ticket. See [`casos-de-estudio/bot/README.en.md`](casos-de-estudio/bot/README.en.md).

### IoT case — Sensor pipeline
Receives sensor readings via webhook, validates and normalizes the data, detects anomalies
against thresholds, persists with idempotency control, and notifies through a
severity-differentiated channel. See [`casos-de-estudio/iot/README.en.md`](casos-de-estudio/iot/README.en.md).

---

## The static validator

The DevSecOps pillar of the micro-framework includes a static n8n flow validator in two
coexisting editions (see [`ADR-MF-008`](microframework/adr/ADR-MF-008-validador-dos-ediciones.en.md)):

- **Lite** — a single file with zero external dependencies, self-contained (offline) HTML
  report. Built so the study can be reproduced without installing anything.
- **Pro** — a modular package with a YAML DSL for custom rules, automatic codemods, and
  md/json/html/sarif/junit output for CI/CD integration.

Both implement the same 17 rules (11 REG-* + 6 antipatterns) and share the same report
schema. See [`microframework/validacion/README.en.md`](microframework/validacion/README.en.md).

---

## Reproducing the study (quickstart)

1. Bring up the local environment (Docker: n8n + PostgreSQL + mocks) — see
   [`infraestructura/README.en.md`](infraestructura/README.en.md) and
   [`automatizacion/README.en.md`](automatizacion/README.en.md).
2. Follow the full operational protocol in [`docs/protocolo-evidencias.en.md`](docs/protocolo-evidencias.en.md)
   (bootstrap, flow import, measurement runs, metric extraction).
3. Run the static validator against the to-be flows — see
   [`microframework/validacion/README.en.md`](microframework/validacion/README.en.md).
4. Compare as-is vs to-be results with the [`automatizacion/`](automatizacion/README.en.md)
   scripts and the reports under [`medicion/consolidado/`](medicion/consolidado/README.en.md).

---

## Current project status

Detailed per-phase progress (0–9) lives in [`estado-actual.md`](estado-actual.md) (Spanish,
the single source of truth) — not duplicated here to avoid drift. An English translation
snapshot is available at [`estado-actual.en.md`](estado-actual.en.md).

---

## How to cite / authorship

**Author:** Elian Hernando Gil Sierra · **Advisor:** Sebastian Roa Prada, PhD
**Institution:** Universidad Autónoma de Bucaramanga (UNAB) — Master's in Software
Management, Application and Development (MGADS), 2026.

The full thesis proposal (normative source of scope) is at
[`docs/context/ANTEPROYECTO_ELIAN_GIL_MGADS.pdf`](docs/context/ANTEPROYECTO_ELIAN_GIL_MGADS.pdf).
