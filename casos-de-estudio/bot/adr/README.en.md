> 🌐 **Language / Idioma:** English · [Español](README.md)

# adr/ — Architectural decisions for the Bot case

**Path:** `casos-de-estudio/bot/adr/`
**Belongs to:** [`casos-de-estudio/bot/`](../README.en.md)

---

## What it is and why it exists

This folder records architectural decisions **specific to the Bot case** — as opposed to
`microframework/adr/`, which records decisions transversal to the micro-framework. Every
ADR follows the template at
[`microframework/plantillas/ADR-plantilla.md`](../../../microframework/plantillas/ADR-plantilla.en.md).

## Contents of this folder

| ADR | Title | Quality attribute |
|---|---|---|
| [ADR-001](ADR-001-separacion-responsabilidades-flujo.en.md) | Separation of responsibilities via orchestrated subflows | Maintainability, Traceability |
| [ADR-002](ADR-002-omision-e4.en.md) | Deliberate omission of E4 as an independent subflow | Maintainability, Efficiency |
| [ADR-003](ADR-003-ratelimit-medicion.en.md) | Separation between statistical measurement and REG-002 antipattern demonstration | Maintainability, Traceability |
| [ADR-004](ADR-004-diseno-experimental-input-sets.en.md) | Expansion of the experimental design to 10 Input Sets (also applies to IoT) | Methodological internal validity |
| [ADR-005](ADR-005-estrategia-autenticacion.en.md) | Authentication strategy with no hardcoded token | Security / Confidentiality |
| [ADR-006](ADR-006-diseno-error-workflow.en.md) | errorWorkflow design (bot-error-handler) | Reliability, Operability |
| [ADR-007](ADR-007-clasificacion-mensajes-e2.en.md) | Message classification in E2 with a REGLAS array | Maintainability, Functional suitability |
| [ADR-008](ADR-008-rate-limiting-tobe.en.md) | Removal of the rate-limiter in the to-be — stateless by design | Maintainability, Reliability |

## Relationship to the methodology

These 8 ADRs fully document the Bot case's as-is → to-be redesign: from responsibility
separation (ADR-001, ADR-002) to experimental-validity decisions (ADR-003, ADR-004) and
specific security and resilience fixes (ADR-005 through ADR-008). Each one feeds the
case's [traceability matrix](../trazabilidad/matriz-trazabilidad.en.md).

## Navigation

- Parent: [`casos-de-estudio/bot/`](../README.en.md)
- See also: [`microframework/adr/`](../../../microframework/adr/README.en.md) (transversal ADRs) · [`casos-de-estudio/iot/adr/`](../../iot/adr/README.en.md)
