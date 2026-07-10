> 🌐 **Language / Idioma:** English · [Español](README.md)

# convenciones/ — Naming conventions

**Path:** `microframework/convenciones/`
**Belongs to:** [`microframework/`](../README.en.md)

---

## What it is and why it exists

This folder contains a **quick reference** for every naming pattern used in the project:
JSON flow files, nodes inside flows, subflow IDs, ADRs, CSV logs, synthetic datasets, commit
messages, and the `run_id` format. It is a fast-lookup summary; the complete source of
truth (with extended examples and rationale) is in
[`docs/context/convenios-y-reglas.en.md`](../../docs/context/convenios-y-reglas.en.md).

## Contents of this folder

| File | Description |
|---|---|
| [`naming-conventions.md`](naming-conventions.en.md) | Naming patterns: JSON flows, nodes, subflows, ADRs, CSV logs, datasets, commits, `run_id` |

## Relationship to the methodology

Naming conventions are what let the [static validator](../validacion/README.en.md)
automatically classify E1–E4 stages, and what lets any external researcher predict where an
artifact lives without exploring the entire repository. Naming consistency across
`casos-de-estudio/`, `medicion/`, and `microframework/` is what makes the study replicable.

## Navigation

- Parent: [`microframework/`](../README.en.md)
- See also: [`docs/context/convenios-y-reglas.en.md`](../../docs/context/convenios-y-reglas.en.md) (complete source of truth)
