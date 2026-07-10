> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# convenciones/ — Convenciones de nombres

**Ruta:** `microframework/convenciones/`
**Pertenece a:** [`microframework/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene una **referencia rápida** de todos los patrones de nombres usados en
el proyecto: archivos de flujos JSON, nodos dentro de los flujos, IDs de subflujos, ADRs,
logs CSV, datasets sintéticos, mensajes de commit y formato de `run_id`. Es un resumen de
consulta ágil; la fuente de verdad completa (con ejemplos extendidos y justificación) está
en [`docs/context/convenios-y-reglas.md`](../../docs/context/convenios-y-reglas.md).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| [`naming-conventions.md`](naming-conventions.md) | Patrones de nombres: flujos JSON, nodos, subflujos, ADR, logs CSV, datasets, commits, `run_id` |

## Relación con la metodología

Las convenciones de nombres son lo que permite que el [validador estático](../validacion/README.md)
clasifique automáticamente las etapas E1–E4 y que cualquier investigador externo pueda
predecir la ubicación de un artefacto sin necesidad de explorar todo el repositorio. La
consistencia de nombres entre `casos-de-estudio/`, `medicion/` y `microframework/` es lo
que hace posible que el estudio sea replicable.

## Navegación

- Padre: [`microframework/`](../README.md)
- Ver también: [`docs/context/convenios-y-reglas.md`](../../docs/context/convenios-y-reglas.md) (fuente de verdad completa)
