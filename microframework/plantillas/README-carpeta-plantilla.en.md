> 🌐 **Language / Idioma:** English · [Español](README-carpeta-plantilla.md)

# Template: folder README

**Belongs to:** [`microframework/plantillas/`](README.en.md)

This template defines the minimum, consistent structure that the `README.md` of **any**
folder or subfolder in the repository must have, so an external researcher can understand
what it is, why it exists, and how it relates to the methodology without leaving that
folder. It follows the same convention as [`ADR-plantilla.md`](ADR-plantilla.en.md).

---

## Common skeleton (all variants)

```markdown
> 🌐 **Language / Idioma:** English · [Español](README.md)

# {Folder title}

**Path:** `{relative/path/}`
**Belongs to:** [{parent breadcrumb}](../README.en.md)

---

## What it is and why it exists

{2-4 sentences, plain language, for someone with no prior project context}

## Contents of this folder

| File / Subfolder | Description |
|---|---|
| ... | ... |

## Relationship to the methodology

{How this folder connects to as-is/to-be, ATAM, E1–E4 stages, or the ADR pattern —
whichever applies}

## Navigation

- Previous: [{...}](...)
- Parent: [{...}](../README.en.md)
- Next: [{...}](...)
- See also: [{...}](...)

---

*Last updated: {date} · Progress source of truth: [estado-actual.md](.../estado-actual.md)*
```

---

## Variants by folder type

Use the decision table below to choose what to add to the "Relationship to the
methodology" section and which extra table to include under "Contents of this folder".

| Folder type | Examples | What to add |
|---|---|---|
| **A — ADR-holding folder** | `microframework/adr/`, `casos-de-estudio/{bot,iot}/adr/`, `casos-de-estudio/común/adr/` | Table with columns `ID · Title · Status · Affected quality attribute`; link to [`ADR-plantilla.en.md`](ADR-plantilla.en.md); note on numbering (`ADR-NNN` for case studies vs `ADR-MF-NNN` for the micro-framework) |
| **B — as-is/to-be folder** | `casos-de-estudio/{bot,iot}/as-is/`, `casos-de-estudio/{bot,iot}/to-be/` | Table of flow JSON files following the `{case}-{state}-{stage}.json` convention; import order in n8n (see [`../convenciones/convenios-y-reglas.en.md`](../convenciones/convenios-y-reglas.en.md)); in `as-is/` include the disclaimer: *"this flow intentionally preserves antipatterns as a baseline; do not fix without an ADR"* |
| **C — Data/evidence folder** | `medicion/datasets/`, `medicion/run-logs/{bot,iot}/`, `medicion/cr-logs/{bot,iot}/`, `medicion/consolidado/` | Schema table (exact CSV columns, see `convenios-y-reglas.md`); immutability warning: *"do not edit or delete rows; see correction protocol"*; link to [`medicion/protocolo-evidencias.en.md`](../../medicion/protocolo-evidencias.en.md) |
| **D — Tool/code folder** | `automatizacion/`, `microframework/validacion/`, `microframework/validacion-pro/`, `infraestructura/mocks/mock-*/` | Quickstart command block; required dependencies; "how to run/reproduce" section |
| **E — Rules/patterns/conventions folder** | `microframework/` (root), `microframework/checklists/`, `microframework/convenciones/`, `microframework/patrones/`, `microframework/plantillas/`, `microframework/reglas/` | Table mapping the content to `REG-*`/`REC-*` IDs or pattern names; one paragraph explaining why this folder exists within the micro-framework (which Clean Architecture or DevSecOps pillar it supports) |

---

## Language-switcher banner — reusable snippet

In the Spanish doc (at the very top, before the title):
```markdown
> 🌐 **Idioma / Language:** Español · [English](nombre-archivo.en.md)
```

In the English doc:
```markdown
> 🌐 **Language / Idioma:** English · [Español](nombre-archivo.md)
```

Always link the actual sibling filename (do not assume `README` if the doc has a different
name, e.g. `notas-tecnicas.md` → `notas-tecnicas.en.md`).

---

## Navigation

- Parent: [`microframework/plantillas/`](README.en.md)
- See also: [`ADR-plantilla.en.md`](ADR-plantilla.en.md)
