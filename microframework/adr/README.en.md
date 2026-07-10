> 🌐 **Language / Idioma:** English · [Español](README.md)

# adr/ — Micro-framework Architecture Decision Records

**Path:** `microframework/adr/`
**Belongs to:** [`microframework/`](../README.en.md)

---

## What it is and why it exists

This folder records the **architectural decisions of the micro-framework itself** (as
opposed to `casos-de-estudio/{bot,iot}/adr/`, which records decisions specific to each case
study). Each ADR documents the context, the decision made, alternatives considered, and the
consequences of a micro-framework rule, pattern, or technology choice, following the
template at [`microframework/plantillas/ADR-plantilla.en.md`](../plantillas/ADR-plantilla.en.md).

## Contents of this folder

| ID | Title | Affected quality attribute |
|---|---|---|
| [ADR-MF-001](ADR-MF-001-gestion-secretos-reg001.en.md) | Secrets management (REG-001) | Security |
| [ADR-MF-002](ADR-MF-002-error-workflow-reg003.en.md) | Mandatory error workflow (REG-003) | Reliability |
| [ADR-MF-003](ADR-MF-003-log-estructurado-reg006.en.md) | Structured log per stage (REG-006) | Operability / Traceability |
| [ADR-MF-004](ADR-MF-004-atam-adaptado-individual.en.md) | ATAM adapted for individual evaluation | Methodological traceability |
| [ADR-MF-005](ADR-MF-005-ecs-fargate-vs-ec2.en.md) | ECS Fargate vs EC2 (AWS design) | Scalability / Operability |
| [ADR-MF-006](ADR-MF-006-n8n-queue-mode.en.md) | n8n Queue Mode (AWS design) | Scalability |
| [ADR-MF-007](ADR-MF-007-rds-multi-az.en.md) | RDS Multi-AZ (AWS design) | Reliability |
| [ADR-MF-008](ADR-MF-008-validador-dos-ediciones.en.md) | Static validator in two editions (Lite + Pro) | Maintainability / Traceability |

## Relationship to the methodology

ADRs are the **decision-traceability mechanism** required by REG-010 (every flow has at
least one ADR) and by the maintainability pillar of ISO/IEC 25010. Unlike case-study ADRs,
these document decisions that apply **transversally** to the whole micro-framework: why a
rule is defined as mandatory, or why the AWS architecture design chooses one service over
another. Numbering uses the `ADR-MF-` prefix to distinguish them from case ADRs
(`ADR-NNN` without a prefix, under `casos-de-estudio/{case}/adr/`).

## Navigation

- Parent: [`microframework/`](../README.en.md)
- See also: [`microframework/plantillas/ADR-plantilla.en.md`](../plantillas/ADR-plantilla.en.md) · [`casos-de-estudio/bot/adr/`](../../casos-de-estudio/bot/README.en.md) · [`casos-de-estudio/iot/adr/`](../../casos-de-estudio/iot/README.en.md)
