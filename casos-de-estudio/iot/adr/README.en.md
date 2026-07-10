> 🌐 **Language / Idioma:** English · [Español](README.md)

# adr/ — Architectural decisions for the IoT case

**Path:** `casos-de-estudio/iot/adr/`
**Belongs to:** [`casos-de-estudio/iot/`](../README.en.md)

---

## What it is and why it exists

This folder records architectural decisions **specific to the IoT case** — as opposed to
`microframework/adr/`, which records decisions transversal to the micro-framework. Every
ADR follows the template at
[`microframework/plantillas/ADR-plantilla.md`](../../../microframework/plantillas/ADR-plantilla.en.md).

## Contents of this folder

| ADR | Title | Quality attribute |
|---|---|---|
| [ADR-001](ADR-001-separacion-responsabilidades-pipeline.en.md) | Separation of responsibilities via orchestrated subflows | Maintainability, Reliability, Security |
| [ADR-002](ADR-002-umbrales-y-vocabulario.en.md) | To-be thresholds and the official vocabulary for the `nivel` field | Functional suitability, Maintainability |
| [ADR-003](ADR-003-idempotencia-sensor-timestamp.en.md) | Idempotency with a composite `{sensor_id}-{timestamp}` key | Reliability |
| [ADR-004](ADR-004-routing-e4-por-severidad.en.md) | Differentiated E4 routing by event severity | Functional suitability, Reliability |
| [ADR-005](ADR-005-diseno-error-workflow.en.md) | errorWorkflow design with a replay payload | Reliability, Operability |
| [ADR-006](ADR-006-validacion-schema-e1.en.md) | E1 schema validation with inline JavaScript | Functional suitability, Maintainability |
| [ADR-007](ADR-007-timestamp-authority.en.md) | Timestamp authority: use the sensor's timestamp | Reliability |
| [ADR-008](ADR-008-normalizacion-e1.en.md) | Field normalization in E1 before passing to the domain | Reliability, Maintainability |

The IoT case also relies on [Bot's `ADR-004`](../../bot/adr/ADR-004-diseno-experimental-input-sets.en.md)
(shared experimental design, filed under `bot/adr/` by primogeniture convention).

## Relationship to the methodology

These 8 ADRs document the IoT pipeline's as-is → to-be redesign: responsibility
separation (ADR-001), fixing thresholds and vocabulary (ADR-002), idempotency strategy
(ADR-003, ADR-007, ADR-008), severity-based routing (ADR-004), and error handling with
replay capability (ADR-005, ADR-006). Each one feeds the case's
[traceability matrix](../trazabilidad/matriz-trazabilidad.en.md).

## Navigation

- Parent: [`casos-de-estudio/iot/`](../README.en.md)
- See also: [`microframework/adr/`](../../../microframework/adr/README.en.md) (transversal ADRs) · [`casos-de-estudio/bot/adr/`](../../bot/adr/README.en.md)
