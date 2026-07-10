> 🌐 **Language / Idioma:** English · [Español](README.md)

# docs/ — Project methodological documentation

**Path:** `docs/`
**Belongs to:** [Repository (root)](../README.en.md)

---

## What it is and why it exists

This folder contains all the project's **methodological, theoretical, and architecture
documentation**: the context and foundation behind design decisions (`context/`), the
complete ATAM evaluation (`atam/`), the reference AWS architecture design (`aws/`), and the
operational protocols for reproducing the study.

For a detailed map of every document, see [`docs/INDEX.en.md`](INDEX.en.md).

## Contents of this folder

| Subfolder / File | Description |
|---|---|
| [`context/`](context/README.en.md) | Thesis proposal, project overview, flow architecture, micro-framework specification, conventions, theoretical foundation |
| [`atam/`](atam/INDEX.en.md) | ATAM evaluation artifacts (Phase 7): final report, adapted methodology, scoring matrix, survey instruments |
| [`aws/`](aws/INDEX.en.md) | AWS architecture design (Phase 8): architecture, security/IAM, observability, scalability, costs, diagrams |
| [`guia-buenas-practicas.md`](guia-buenas-practicas.en.md) | Best practices guide (closing deliverable, Phase 9) |
| [`microframework-v1.0.md`](microframework-v1.0.en.md) | Micro-framework v1.0 overview |
| [`protocolo-evidencias.md`](protocolo-evidencias.en.md) | Operational protocol: environment setup, flow import, measurement logging |
| [`protocolo-mttd.md`](protocolo-mttd.en.md) | Mean Time To Detect measurement protocol |

## Relationship to the methodology

`docs/context/` is the normative source for all terminology and conventions used
throughout the rest of the repository (E1–E4 stages, REG-*/REC-* rules, folder structure).
`atam/` and `aws/` document the two most recent research deliverables (quality-attribute
evaluation and reference cloud design), both built on the `context/` specification. The
protocols (`protocolo-evidencias.md`, `protocolo-mttd.md`) are the operational instructions
that let an external researcher exactly reproduce the study's measurement conditions.

## Navigation

- Parent: [Repository (root)](../README.en.md)
- See also: [`docs/INDEX.en.md`](INDEX.en.md) (detailed sitemap) · [`microframework/README.en.md`](../microframework/README.en.md)
