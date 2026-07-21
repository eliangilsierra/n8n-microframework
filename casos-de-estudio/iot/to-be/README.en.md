> 🌐 **Language / Idioma:** English · [Español](README.md)

# to-be/ — IoT case with the micro-framework applied

**Path:** `casos-de-estudio/iot/to-be/`
**Belongs to:** [`casos-de-estudio/iot/`](../README.en.md)

---

## What it is and why it exists

This folder contains the IoT case's **to-be** flow: the micro-framework applied to the
same functional problem as the as-is, with all **four** E1–E4 stages implemented as
separate subflows, plus an error-handling flow with lost-reading replay capability.

## Contents of this folder

| File | Description |
|---|---|
| `iot-to-be-orquestador.json` | Orchestrator — coordinates E1→E2→E3→E4 via `Execute Workflow` |
| `iot-to-be-e1-validacion.json` | E1 subflow — field validation, physical ranges, normalization |
| `iot-to-be-e2-dominio.json` | E2 subflow — threshold analysis with the `UMBRALES` constant |
| `iot-to-be-e3-persistencia.json` | E3 subflow — INSERT with `{sensor_id}-{timestamp}` idempotency |
| `iot-to-be-e4-notificacion.json` | E4 subflow — routing by level (critical/warning), differentiated retry |
| `iot-error-handler.json` | errorWorkflow — preserves the original payload for manual replay |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.en.md) | Architecture checklist result — 10/10 passed |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.en.md) | DevSecOps checklist result — 7/7 applicable passed |

## Relationship to the methodology

This to-be implements the complete E1–E4 metamodel as separate subflows (unlike the Bot,
which omits E4 — see [`IoT ADR-001`](../adr/ADR-001-separacion-responsabilidades-pipeline.en.md)).
Before importing into n8n, follow the order documented in
[`../../../microframework/convenciones/convenios-y-reglas.en.md`](../../../microframework/convenciones/convenios-y-reglas.en.md):
E1 → E2 → E3 → E4 → error-handler → orchestrator.

## Navigation

- Parent: [`casos-de-estudio/iot/`](../README.en.md)
- See also: [`as-is/`](../as-is/README.en.md) (baseline) · [`casos-de-estudio/iot/adr/`](../adr/README.en.md) (decisions justifying this design)
