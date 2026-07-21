> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# reglas/ — Catálogo de reglas del micro-framework

**Ruta:** `microframework/reglas/`
**Pertenece a:** [`microframework/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene el **catálogo completo de reglas** que definen el micro-framework:
10 reglas obligatorias (criterio binario cumple/no cumple) y 6 reglas recomendadas (buenas
prácticas que mejoran la calidad operativa y la trazabilidad, sin ser bloqueantes). Son la
base normativa que el [checklist de arquitectura](../checklists/README.md) verifica
manualmente y que el [validador estático](../validacion/README.md) verifica
automáticamente.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| [`reglas-obligatorias.md`](reglas-obligatorias.md) | REG-001 a REG-010, con criterio de verificación, justificación y mapeo a ISO/IEC 25010 |
| [`reglas-recomendadas.md`](reglas-recomendadas.md) | REC-001 a REC-006, con el beneficio de cada una |

## Relación con la metodología

Las reglas obligatorias (`REG-*`) son el criterio binario que distingue un flujo **to-be**
(cumple el micro-framework) de un flujo **as-is** (línea base sin arquitectura, con
antipatrones intencionales). Cada regla mapea a uno o más atributos de calidad de
ISO/IEC 25010, lo que permite conectar el cumplimiento de reglas con la evaluación ATAM
(Fase 7). El [validador estático](../validacion/README.md) implementa cada `REG-*` como un
predicado evaluable sobre el grafo dirigido del flujo.

## Navegación

- Padre: [`microframework/`](../README.md)
- Ver también: [`microframework/checklists/`](../checklists/README.md) (verificación manual) · [`microframework/validacion/`](../validacion/README.md) (verificación automática) · [`microframework/microframework-spec.md`](../microframework-spec.md) (especificación formal)
