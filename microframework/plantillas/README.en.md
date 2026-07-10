> 🌐 **Language / Idioma:** English · [Español](README.md)

# plantillas/ — Reusable templates

**Path:** `microframework/plantillas/`
**Belongs to:** [`microframework/`](../README.en.md)

---

## What it is and why it exists

This folder contains the project's **reusable templates**: the ADR template used both for
micro-framework decisions and case-study decisions, the folder-README template (used to
write all of the repository's navigable documentation), and reference copies of the to-be
JSON flows for both cases (useful as a starting point when adopting the micro-framework in
a new project).

## Contents of this folder

| File | Description |
|---|---|
| [`ADR-plantilla.md`](ADR-plantilla.en.md) | Architecture Decision Record template (7 sections) |
| [`README-carpeta-plantilla.md`](README-carpeta-plantilla.en.md) | Folder-README template — 5 variants by content type |
| `bot-as-is.json` | Reference copy of the Bot case's as-is flow |
| `bot-to-be-e2-dominio.json`, `bot-to-be-e3-adaptador.json`, `bot-to-be-orquestador.json` | Reference copies of the Bot case's to-be subflows |
| `bot-error-handler.json` | Reference error-handling flow |
| `iot-as-is.json` | Reference copy of the IoT case's as-is flow |
| `iot-to-be-e1-validacion.json`, `iot-to-be-e2-dominio.json`, `iot-to-be-e3-persistencia.json`, `iot-to-be-orquestador.json` | Reference copies of the IoT case's to-be subflows |

## Relationship to the methodology

These templates are the mechanism that guarantees **structural consistency** across every
ADR and README in the repository, and the recommended starting point for any external team
that wants to adopt the micro-framework in a new case: start from the reference JSON copies
and apply the rules in `microframework/reglas/` from the design stage onward.

## Navigation

- Parent: [`microframework/`](../README.en.md)
- See also: [`microframework/adr/README.en.md`](../adr/README.en.md) · [`casos-de-estudio/`](../../casos-de-estudio/README.en.md) (real flows derived from these templates)
