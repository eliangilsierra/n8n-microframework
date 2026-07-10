> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# adr/ — Decisiones arquitectónicas del caso IoT

**Ruta:** `casos-de-estudio/iot/adr/`
**Pertenece a:** [`casos-de-estudio/iot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta registra las decisiones arquitectónicas **específicas del caso IoT** —a
diferencia de `microframework/adr/`, que registra decisiones transversales al
micro-framework. Cada ADR sigue la plantilla en
[`microframework/plantillas/ADR-plantilla.md`](../../../microframework/plantillas/ADR-plantilla.md).

## Contenido de esta carpeta

| ADR | Título | Atributo de calidad |
|---|---|---|
| [ADR-001](ADR-001-separacion-responsabilidades-pipeline.md) | Separación de responsabilidades mediante subflujos orquestados | Mantenibilidad, Confiabilidad, Seguridad |
| [ADR-002](ADR-002-umbrales-y-vocabulario.md) | Umbrales del to-be y vocabulario oficial del campo `nivel` | Adecuación funcional, Mantenibilidad |
| [ADR-003](ADR-003-idempotencia-sensor-timestamp.md) | Idempotencia con clave compuesta `{sensor_id}-{timestamp}` | Confiabilidad |
| [ADR-004](ADR-004-routing-e4-por-severidad.md) | Routing diferenciado de E4 por severidad del evento | Adecuación funcional, Confiabilidad |
| [ADR-005](ADR-005-diseno-error-workflow.md) | Diseño del errorWorkflow con payload para replay | Fiabilidad, Operabilidad |
| [ADR-006](ADR-006-validacion-schema-e1.md) | Validación de schema en E1 con JavaScript inline | Adecuación funcional, Mantenibilidad |
| [ADR-007](ADR-007-timestamp-authority.md) | Autoridad del timestamp: usar timestamp del sensor | Fiabilidad |
| [ADR-008](ADR-008-normalizacion-e1.md) | Normalización de campos en E1 antes de pasar a dominio | Fiabilidad, Mantenibilidad |

También aplica al caso IoT el [`ADR-004 del caso Bot`](../../bot/adr/ADR-004-diseno-experimental-input-sets.md)
(diseño experimental compartido, archivado por convención de primogenitura en `bot/adr/`).

## Relación con la metodología

Estos 8 ADR documentan el rediseño as-is → to-be del pipeline IoT: separación de
responsabilidades (ADR-001), fijación de umbrales y vocabulario (ADR-002), estrategia de
idempotencia (ADR-003, ADR-007, ADR-008), routing por severidad (ADR-004) y manejo de
errores con capacidad de replay (ADR-005, ADR-006). Cada uno alimenta la
[matriz de trazabilidad](../trazabilidad/matriz-trazabilidad.md) del caso.

## Navegación

- Padre: [`casos-de-estudio/iot/`](../README.md)
- Ver también: [`microframework/adr/`](../../../microframework/adr/README.md) (ADR transversales) · [`casos-de-estudio/bot/adr/`](../../bot/adr/README.md)
