> 🌐 **Language / Idioma:** English · [Español](README.md)

# casos-de-estudio/ — The two micro-framework validation cases

**Path:** `casos-de-estudio/`
**Belongs to:** [Repository (root)](../README.en.md)

---

## What it is and why it exists

This folder contains the **two case studies** that validate the micro-framework through a
quasi-experimental as-is vs to-be comparison: a support chatbot (`bot/`, webhook-reactive
pattern) and an IoT sensor pipeline (`iot/`, event-driven pipeline pattern). Both cases
share the same methodology: a baseline with intentional antipatterns (as-is), a redesign
applying the micro-framework (to-be), and a traceability matrix connecting requirements to
architectural decisions and quantitative evidence.

## Contents of this folder

| Subfolder | Description |
|---|---|
| [`bot/`](bot/README.en.md) | Bot case — support chatbot (16-node as-is → orchestrator + 2 to-be subflows) |
| [`iot/`](iot/README.en.md) | IoT case — sensor pipeline (14-node as-is → orchestrator + 4 subflows + error handler to-be) |
| [`común/adr/`](común/adr/README.en.md) | Architectural decisions shared between both cases |

## Relationship to the methodology

The two cases were selected to **orthogonally** cover the LC/NC problem space in n8n
(human vs machine data source, external vs local persistence, inline vs
severity-channeled notification) — see
[`casos-de-estudio/justificacion-casos-de-estudio.md`](justificacion-casos-de-estudio.en.md)
for the complete taxonomy and representativeness justification (Yin, 2018, theoretical
replication). Both follow the same `{case}-{state}-{stage}.json` file naming convention
documented in
[`../microframework/convenciones/convenios-y-reglas.en.md`](../microframework/convenciones/convenios-y-reglas.en.md).

## Navigation

- Parent: [Repository (root)](../README.en.md)
- See also: [`microframework/README.md`](../microframework/README.en.md) (the framework both cases apply) · [`medicion/README.md`](../medicion/README.en.md) (comparison data and evidence)
