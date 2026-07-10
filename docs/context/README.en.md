> 🌐 **Language / Idioma:** English · [Español](README.md)

# context/ — Project context and foundation

**Path:** `docs/context/`
**Belongs to:** [`docs/`](../README.en.md)

---

## What it is and why it exists

This folder is the project's **normative source**: it defines objectives, methodology,
terminology, flow architecture, and the micro-framework's formal specification. It is the
first place to read before modifying any flow, rule, or document in the repository (see
the root `CLAUDE.md`, which references these files explicitly in that order).

## Contents of this folder

| Document | Content |
|---|---|
| [`ANTEPROYECTO_ELIAN_GIL_MGADS.pdf`](ANTEPROYECTO_ELIAN_GIL_MGADS.pdf) | Full thesis proposal — normative source of the Master's scope (Spanish original) |
| [`proyecto-overview.md`](proyecto-overview.en.md) | Objectives, methodology, case studies, evaluation metrics, ISO/IEC 25010 mapping |
| [`arquitectura-flujos.md`](arquitectura-flujos.en.md) | As-is and to-be architecture, technical detail of both case studies |
| [`microframework-spec.md`](microframework-spec.en.md) | Micro-framework v1.0 specification: E1–E4 stages, rules, patterns, antipatterns |
| [`convenios-y-reglas.md`](convenios-y-reglas.en.md) | Repository structure, naming conventions, and working rules |
| [`fundamento-teorico.md`](fundamento-teorico.en.md) | Theoretical foundation: Clean Architecture, DevSecOps, LC/NC, ATAM |
| [`justificacion-casos-de-estudio.md`](justificacion-casos-de-estudio.en.md) | Case study taxonomy and representativeness (Yin, 2018) |
| [`justificacion-rediseno-asis.md`](justificacion-rediseno-asis.en.md) | Justification for the as-is redesign |
| [`scripts-python-justificacion.md`](scripts-python-justificacion.en.md) | Academic justification of the automation scripts |
| [`sustentacion-plantillas-referencia.md`](sustentacion-plantillas-referencia.en.md) | Comparison against official n8n repository templates |

> The ATAM Utility Tree (top-K scenarios) lives at
> [`docs/atam/atam-utility-tree.md`](../atam/atam-utility-tree.en.md) — it's a direct
> input to the Phase 7 evaluation, not pre-project context.

## Relationship to the methodology

Everything under `microframework/` and `casos-de-estudio/` is a concrete implementation of
what is specified here. `microframework-spec.md` and `convenios-y-reglas.md` in particular
are the **terminological source of truth**: any new repository document must reuse the same
stage names (E1–E4), the same rule IDs (REG-*/REC-*), and the same file conventions defined
here, without paraphrasing.

## Navigation

- Parent: [`docs/`](../README.en.md)
- See also: [`docs/INDEX.en.md`](../INDEX.en.md) · [`microframework/README.en.md`](../../microframework/README.en.md)
