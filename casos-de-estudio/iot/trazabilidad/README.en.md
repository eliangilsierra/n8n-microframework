> 🌐 **Language / Idioma:** English · [Español](README.md)

# trazabilidad/ — IoT case traceability matrix

**Path:** `casos-de-estudio/iot/trazabilidad/`
**Belongs to:** [`casos-de-estudio/iot/`](../README.en.md)

---

## What it is and why it exists

This folder contains the IoT case's **traceability matrix**: the complete chain
connecting functional requirements (RF-IOT-01..08) to the architectural decisions (ADR)
that implement them, the micro-framework rules that verify them (REG-*), the ATAM
scenarios that evaluate them, and the quantitative evidence backing them up.

## Contents of this folder

| File | Description |
|---|---|
| [`matriz-trazabilidad.md`](matriz-trazabilidad.en.md) | RF→ADR→REG→evidence tables, quality attribute→ATAM scenario→decision, and Change Request coverage |

## Relationship to the methodology

This matrix is the central traceability artifact required by REG-010 and by ISO/IEC
25010's maintainability/analyzability pillar. It explicitly connects every functional
requirement to its ADR, its verifiable REG-* rule, the subflow where it's implemented,
the Input Set that exercises it, and the evidence file backing it — the same chain
described in
[`microframework/microframework-spec.md`](../../../microframework/microframework-spec.en.md)
applied end to end to the IoT case.

## Navigation

- Parent: [`casos-de-estudio/iot/`](../README.en.md)
- See also: [`casos-de-estudio/iot/adr/`](../adr/README.en.md) · [`casos-de-estudio/bot/trazabilidad/`](../../bot/trazabilidad/README.en.md) (equivalent Bot matrix)
