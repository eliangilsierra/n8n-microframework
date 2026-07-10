> 🌐 **Language / Idioma:** English · [Español](README.md)

# checklists/ — Binary verification checklists

**Path:** `microframework/checklists/`
**Belongs to:** [`microframework/`](../README.en.md)

---

## What it is and why it exists

This folder contains the **manual verification checklists** applied before versioning any
to-be flow. They are fillable templates (plain-text format with `[ ]` checkboxes) that an
evaluator completes item by item, leaving auditable compliance evidence. They complement
the [static validator](../validacion/README.en.md), which automates the same verification
over the exported JSON.

## Contents of this folder

| File | Verifies |
|---|---|
| [`checklist-arquitectura.md`](checklist-arquitectura.en.md) | The 10 mandatory rules (REG-001..010) |
| [`checklist-devsecops.md`](checklist-devsecops.en.md) | 8 security items covering credentials, secrets, and attack surface |

## Relationship to the methodology

Both checklists are the **manual** instance of the same criteria the static validator
verifies automatically — the result of applying a checklist to a to-be flow is evidence
that feeds each case study's traceability matrix ("Checklist coverage" column in
[`docs/context/proyecto-overview.en.md`](../../docs/context/proyecto-overview.en.md)).
Results applied to Bot and IoT are archived under
`casos-de-estudio/{bot,iot}/{as-is,to-be}/checklist-*-resultado.md`.

## Navigation

- Parent: [`microframework/`](../README.en.md)
- See also: [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.en.md) · [`microframework/validacion/`](../validacion/README.en.md) (equivalent automated verification)
