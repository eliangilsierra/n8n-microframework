> 🌐 **Language / Idioma:** English · [Español](README.md)

# microframework/ — The micro-framework itself

**Path:** `microframework/`
**Belongs to:** [Repository (root)](../README.en.md)

---

## What it is and why it exists

This folder contains the **complete definition of the LC/NC micro-framework for n8n**: the
set of mandatory and recommended rules, resilience patterns, documented antipatterns,
reusable templates, verification checklists, and the static validator that automates
compliance checking. It is the project's central artifact — everything that appears as a
"to-be" flow under `casos-de-estudio/` is a concrete application of what is specified here.

The micro-framework is **not a code library**: it is a set of design decisions and
conventions (organization into E1–E4 stages, verifiable rules, resilience patterns) applied
when building n8n flows, plus the tooling (static validator) that automatically verifies
compliance.

## Contents of this folder

| File / Subfolder | Description |
|---|---|
| [`adr/`](adr/README.en.md) | Micro-framework Architecture Decision Records (ADR-MF-001..008) |
| [`checklists/`](checklists/README.en.md) | Binary architecture and DevSecOps checklists for verifying to-be flows |
| [`contratos/`](contratos/README.en.md) | JSON Schemas for input/output contracts per stage and per case |
| [`convenciones/`](convenciones/README.en.md) | Quick-reference naming conventions |
| [`patrones/`](patrones/README.en.md) | 5 documented resilience patterns (retry, idempotency, circuit breaker, error boundary, saga) |
| [`plantillas/`](plantillas/README.en.md) | ADR template, folder-README templates, and reference flow JSONs |
| [`reglas/`](reglas/README.en.md) | Mandatory rules (REG-001..010) and recommended rules (REC-001..006) |
| [`validacion/`](validacion/README.en.md) | Static validator — Lite edition (single file, zero dependencies) |
| [`validacion-pro/`](validacion-pro/README.en.md) | Static validator — Pro edition (modular, YAML DSL, codemods) |
| [`antipatrones.md`](antipatrones.en.md) | Catalog of antipatterns intentionally present in the as-is flows |
| [`guia-observabilidad.md`](guia-observabilidad.en.md) | Minimum structured-log contract per stage (DevSecOps Pillar 3) |
| [`validacion-estatica-flujos.md`](validacion-estatica-flujos.en.md) | Specification of which rules/antipatterns the static validator checks |

## Relationship to the methodology

The micro-framework translates **Clean Architecture** (separation of responsibilities by
layer: E1 validation, E2 domain, E3 adapters, E4 output) and **DevSecOps** (secrets
management, automated validation, operational resilience) into n8n's visual context. The
rules in this folder (`reglas/`) are the binary criteria applied in each to-be flow's
checklist and automatically verified by the static validator (`validacion/`,
`validacion-pro/`). Every relevant design decision is recorded as an ADR under `adr/`.

## Navigation

- Parent: [Repository (root)](../README.en.md)
- See also: [`casos-de-estudio/`](../casos-de-estudio/README.en.md) (concrete application of the micro-framework) · [`docs/context/microframework-spec.en.md`](../docs/context/microframework-spec.en.md) (formal v1.0 specification)

---

*Progress source of truth: [estado-actual.md](../estado-actual.md) (Spanish; English snapshot: [estado-actual.en.md](../estado-actual.en.md))*
