> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# as-is/ — Línea base del caso Bot

**Ruta:** `casos-de-estudio/bot/as-is/`
**Pertenece a:** [`casos-de-estudio/bot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene el flujo **as-is** del caso Bot: una implementación monolítica de
16 nodos que **mantiene antipatrones intencionalmente** como línea base comparativa. No
se debe corregir sin un ADR que lo justifique — el propósito de este flujo es exhibir de
forma medible los antipatrones que el micro-framework corrige en el to-be.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `bot-as-is.json` | Flujo principal (LIMITE=150, usado en la medición estadística) |
| `bot-as-is-ratelimit-demo.json` | Variante (LIMITE=10) para demostración cualitativa del antipatrón REG-002 — no entra al pool estadístico |
| [`notas-tecnicas.md`](notas-tecnicas.md) | Estructura del flujo, tabla de 16 nodos, mapeo detallado REG-001…010 |
| [`diagrama-as-is.md`](diagrama-as-is.md) | Diagrama Mermaid con antipatrones anotados por nodo |
| [`cambios-y-evidencia.md`](cambios-y-evidencia.md) | Change-log cronológico de los 4 CR-ASIS aplicados durante FASE 2 |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.md) | Resultado de aplicar el checklist de arquitectura (1/7 cumplido) |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.md) | Resultado de aplicar el checklist DevSecOps (0/8 cumplido) |

## Relación con la metodología

Este as-is representa intencionalmente un diseño ad-hoc sin arquitectura — la línea base
del estudio cuasi-experimental as-is vs to-be. Viola 9 de las 10 reglas obligatorias del
micro-framework (REG-001 a REG-009), documentadas nodo por nodo en `notas-tecnicas.md` y
verificadas por el [validador estático](../../../microframework/validacion/README.md). El
orden de importación en n8n y las reglas de modificación están en
[`../../../microframework/convenciones/convenios-y-reglas.md`](../../../microframework/convenciones/convenios-y-reglas.md).

## Navegación

- Padre: [`casos-de-estudio/bot/`](../README.md)
- Ver también: [`to-be/`](../to-be/README.md) (versión corregida) · [`casos-de-estudio/bot/adr/ADR-003`](../adr/ADR-003-ratelimit-medicion.md) (por qué dos versiones del as-is)
