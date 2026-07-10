> 🌐 **Language / Idioma:** English · [Español](README.md)

# reglas/ — Micro-framework rule catalog

**Path:** `microframework/reglas/`
**Belongs to:** [`microframework/`](../README.en.md)

---

## What it is and why it exists

This folder contains the **complete catalog of rules** that define the micro-framework: 10
mandatory rules (binary pass/fail criteria) and 6 recommended rules (best practices that
improve operational quality and traceability without being blocking). They are the
normative basis that the [architecture checklist](../checklists/README.en.md) verifies
manually and that the [static validator](../validacion/README.en.md) verifies
automatically.

## Contents of this folder

| File | Description |
|---|---|
| [`reglas-obligatorias.md`](reglas-obligatorias.en.md) | REG-001 through REG-010, with verification criteria, rationale, and ISO/IEC 25010 mapping |
| [`reglas-recomendadas.md`](reglas-recomendadas.en.md) | REC-001 through REC-006, with the benefit of each |

## Relationship to the methodology

The mandatory rules (`REG-*`) are the binary criterion that distinguishes a **to-be** flow
(complies with the micro-framework) from an **as-is** flow (baseline without architecture,
with intentional antipatterns). Each rule maps to one or more ISO/IEC 25010 quality
attributes, connecting rule compliance to the ATAM evaluation (Phase 7). The
[static validator](../validacion/README.en.md) implements every `REG-*` as an evaluable
predicate over the flow's directed graph.

## Navigation

- Parent: [`microframework/`](../README.en.md)
- See also: [`microframework/checklists/`](../checklists/README.en.md) (manual verification) · [`microframework/validacion/`](../validacion/README.en.md) (automated verification) · [`docs/context/microframework-spec.en.md`](../../docs/context/microframework-spec.en.md) (formal specification)
