> 🌐 **Language / Idioma:** English · [Español](README.md)

# to-be/ — Bot case with the micro-framework applied

**Path:** `casos-de-estudio/bot/to-be/`
**Belongs to:** [`casos-de-estudio/bot/`](../README.en.md)

---

## What it is and why it exists

This folder contains the Bot case's **to-be** flow: the micro-framework applied to the
same functional problem as the as-is, with the E1–E4 metamodel, secrets management,
retry, idempotency, and observability implemented per the 10 mandatory rules.

## Contents of this folder

| File | Description |
|---|---|
| `bot-to-be-orquestador.json` | Orchestrator — E1 (validation) and E4 (output) inline, invokes E2 and E3 |
| `bot-to-be-e2-dominio.json` | E2 subflow — message classification with the `REGLAS` array |
| `bot-to-be-e3-adaptador.json` | E3 subflow — ticketing system integration, retry + idempotency |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.en.md) | Architecture checklist result — 10/10 passed |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.en.md) | DevSecOps checklist result — 8/8 passed |

## Relationship to the methodology

This to-be applies the micro-framework's E1–E4 metamodel: E1 and E4 are implemented
inline in the orchestrator (decision documented in
[`ADR-002`](../adr/ADR-002-omision-e4.en.md)), while E2 (domain) and E3 (adapter) are
separate subflows invoked with `Execute Workflow`. Before importing into n8n, follow the
import order documented in
[`../../../microframework/convenciones/convenios-y-reglas.en.md`](../../../microframework/convenciones/convenios-y-reglas.en.md):
E2 → E3 → orchestrator.

## Navigation

- Parent: [`casos-de-estudio/bot/`](../README.en.md)
- See also: [`as-is/`](../as-is/README.en.md) (baseline) · [`casos-de-estudio/bot/adr/`](../adr/README.en.md) (decisions justifying this design)
