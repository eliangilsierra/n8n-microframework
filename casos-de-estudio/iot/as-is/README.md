> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# as-is/ — Línea base del caso IoT

**Ruta:** `casos-de-estudio/iot/as-is/`
**Pertenece a:** [`casos-de-estudio/iot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene el flujo **as-is** del caso IoT: un pipeline monolítico de 14 nodos
que **mantiene antipatrones intencionalmente** como línea base comparativa. No se debe
corregir sin un ADR que lo justifique — el propósito de este flujo es exhibir de forma
medible los antipatrones que el micro-framework corrige en el to-be.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `iot-as-is.json` | Flujo principal del pipeline as-is |
| [`notas-tecnicas.md`](notas-tecnicas.md) | Estructura del flujo, tabla de 14 nodos, mapeo detallado REG-001…010 |
| [`diagrama-as-is.md`](diagrama-as-is.md) | Diagrama Mermaid con antipatrones anotados por nodo |
| [`cambios-y-evidencia.md`](cambios-y-evidencia.md) | Change-log cronológico de los 3 CR-ASIS aplicados durante FASE 2 |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.md) | Resultado de aplicar el checklist de arquitectura (1/7 cumplido) |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.md) | Resultado de aplicar el checklist DevSecOps |

## Relación con la metodología

Este as-is representa intencionalmente un diseño ad-hoc sin arquitectura. Viola 9 de las
10 reglas obligatorias (REG-001 a REG-009), con umbrales de alerta dispersos e
inconsistentes entre nodos (documentado en `notas-tecnicas.md`) y validación incompleta
del campo `co2`. Verificado por el
[validador estático](../../../microframework/validacion/README.md). Las reglas de
modificación de flujos están en
[`docs/context/convenios-y-reglas.md`](../../../docs/context/convenios-y-reglas.md).

## Navegación

- Padre: [`casos-de-estudio/iot/`](../README.md)
- Ver también: [`to-be/`](../to-be/README.md) (versión corregida) · [`casos-de-estudio/iot/adr/ADR-002`](../adr/ADR-002-umbrales-y-vocabulario.md) (umbrales definitivos del to-be)
