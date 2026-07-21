> 🌐 **Language / Idioma:** English · [Español](README.md)

# aws/ — AWS architecture design (Phase 8, OE4)

**Path:** `infraestructura/aws/`
**Belongs to:** [`infraestructura/`](../README.en.md)

---

## What it is and why it exists

This folder contains the **AWS reference architecture design** produced in Phase 8 (OE4):
main architecture, security/IAM, observability, scalability, cost estimation, and diagrams.
The thesis proposal's scope is a **documented design**, not a real deployment; should the
project move to implementation, the infrastructure-as-code (Terraform/CDK) would live here
too.

## Contents of this folder

The complete artifact index is in [`INDEX.en.md`](INDEX.en.md). Main documents:

- [`arquitectura-aws.en.md`](arquitectura-aws.en.md) — main reference architecture
- [`seguridad-iam.en.md`](seguridad-iam.en.md) — security and IAM
- [`observabilidad-aws.en.md`](observabilidad-aws.en.md) — observability
- [`escalabilidad.en.md`](escalabilidad.en.md) — scalability
- [`estimacion-costos.en.md`](estimacion-costos.en.md) — cost estimation
- [`diagramas-aws.en.md`](diagramas-aws.en.md) — diagrams

## Relationship to the methodology

The thesis proposal's Phase 8 scope is a **documented reference design**, not a real AWS
deployment (see [`INDEX.en.md`](INDEX.en.md) §Scope). It keeps the repository structure
consistent with the architectural design without anticipating code outside the current
scope.

## Navigation

- Parent: [`infraestructura/`](../README.en.md)
- See also: [`infraestructura/aws/INDEX.md`](INDEX.en.md) (complete AWS architecture design)
