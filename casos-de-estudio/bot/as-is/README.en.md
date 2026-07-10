> 🌐 **Language / Idioma:** English · [Español](README.md)

# as-is/ — Bot case baseline

**Path:** `casos-de-estudio/bot/as-is/`
**Belongs to:** [`casos-de-estudio/bot/`](../README.en.md)

---

## What it is and why it exists

This folder contains the Bot case's **as-is** flow: a monolithic 16-node implementation
that **intentionally preserves antipatterns** as a comparative baseline. It must not be
fixed without an ADR that justifies it — this flow's purpose is to measurably exhibit the
antipatterns the micro-framework corrects in the to-be.

## Contents of this folder

| File | Description |
|---|---|
| `bot-as-is.json` | Main flow (LIMITE=150, used in the statistical measurement) |
| `bot-as-is-ratelimit-demo.json` | Variant (LIMITE=10) for the qualitative demonstration of the REG-002 antipattern — not part of the statistical pool |
| [`notas-tecnicas.md`](notas-tecnicas.en.md) | Flow structure, 16-node table, detailed REG-001…010 mapping |
| [`diagrama-as-is.md`](diagrama-as-is.en.md) | Mermaid diagram with per-node antipattern annotations |
| [`cambios-y-evidencia.md`](cambios-y-evidencia.en.md) | Chronological change log of the 4 CR-ASIS applied during PHASE 2 |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.en.md) | Result of applying the architecture checklist (1/7 passed) |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.en.md) | Result of applying the DevSecOps checklist (0/8 passed) |

## Relationship to the methodology

This as-is intentionally represents an ad-hoc design with no architecture — the baseline
of the quasi-experimental as-is vs to-be study. It violates 9 of the micro-framework's 10
mandatory rules (REG-001 through REG-009), documented node by node in `notas-tecnicas.md`
and verified by the [static validator](../../../microframework/validacion/README.en.md). The
import order in n8n and the modification rules are in
[`docs/context/convenios-y-reglas.md`](../../../docs/context/convenios-y-reglas.en.md).

## Navigation

- Parent: [`casos-de-estudio/bot/`](../README.en.md)
- See also: [`to-be/`](../to-be/README.en.md) (fixed version) · [`casos-de-estudio/bot/adr/ADR-003`](../adr/ADR-003-ratelimit-medicion.en.md) (why there are two as-is versions)
