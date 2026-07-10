> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# adr/ — Decisiones arquitectónicas del caso Bot

**Ruta:** `casos-de-estudio/bot/adr/`
**Pertenece a:** [`casos-de-estudio/bot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta registra las decisiones arquitectónicas **específicas del caso Bot** —a
diferencia de `microframework/adr/`, que registra decisiones transversales al
micro-framework. Cada ADR sigue la plantilla en
[`microframework/plantillas/ADR-plantilla.md`](../../../microframework/plantillas/ADR-plantilla.md).

## Contenido de esta carpeta

| ADR | Título | Atributo de calidad |
|---|---|---|
| [ADR-001](ADR-001-separacion-responsabilidades-flujo.md) | Separación de responsabilidades mediante subflujos orquestados | Mantenibilidad, Trazabilidad |
| [ADR-002](ADR-002-omision-e4.md) | Omisión deliberada de E4 como subflujo independiente | Mantenibilidad, Eficiencia |
| [ADR-003](ADR-003-ratelimit-medicion.md) | Separación entre medición estadística y demostración del antipatrón REG-002 | Mantenibilidad, Trazabilidad |
| [ADR-004](ADR-004-diseno-experimental-input-sets.md) | Ampliación del diseño experimental a 10 Input Sets (aplica también a IoT) | Validez interna metodológica |
| [ADR-005](ADR-005-estrategia-autenticacion.md) | Estrategia de autenticación sin token hardcodeado | Seguridad / Confidencialidad |
| [ADR-006](ADR-006-diseno-error-workflow.md) | Diseño del errorWorkflow (bot-error-handler) | Fiabilidad, Operabilidad |
| [ADR-007](ADR-007-clasificacion-mensajes-e2.md) | Clasificación de mensajes en E2 con array REGLAS | Mantenibilidad, Adecuación funcional |
| [ADR-008](ADR-008-rate-limiting-tobe.md) | Eliminación del rate-limiter en el to-be — stateless por diseño | Mantenibilidad, Fiabilidad |

## Relación con la metodología

Estos 8 ADR documentan íntegramente el rediseño as-is → to-be del caso Bot: desde la
separación de responsabilidades (ADR-001, ADR-002) hasta decisiones de validez
experimental (ADR-003, ADR-004) y correcciones puntuales de seguridad y resiliencia
(ADR-005 a ADR-008). Cada uno alimenta la [matriz de trazabilidad](../trazabilidad/matriz-trazabilidad.md)
del caso.

## Navegación

- Padre: [`casos-de-estudio/bot/`](../README.md)
- Ver también: [`microframework/adr/`](../../../microframework/adr/README.md) (ADR transversales) · [`casos-de-estudio/iot/adr/`](../../iot/adr/README.md)
