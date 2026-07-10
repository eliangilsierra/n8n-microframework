> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# context/ — Contexto y fundamento del proyecto

**Ruta:** `docs/context/`
**Pertenece a:** [`docs/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta es la **fuente normativa** de todo el proyecto: define objetivos, metodología,
terminología, arquitectura de flujos y la especificación formal del micro-framework. Es el
primer lugar que se debe leer antes de modificar cualquier flujo, regla o documento del
repositorio (ver `CLAUDE.md` en la raíz, que referencia estos archivos explícitamente en
ese orden).

## Contenido de esta carpeta

| Documento | Contenido |
|---|---|
| [`ANTEPROYECTO_ELIAN_GIL_MGADS.pdf`](ANTEPROYECTO_ELIAN_GIL_MGADS.pdf) | Anteproyecto completo — fuente normativa del alcance de la maestría |
| [`proyecto-overview.md`](proyecto-overview.md) | Objetivos, metodología, casos de estudio, métricas de evaluación, mapeo ISO/IEC 25010 |
| [`arquitectura-flujos.md`](arquitectura-flujos.md) | Arquitectura as-is y to-be, detalle técnico de los dos casos de estudio |
| [`microframework-spec.md`](microframework-spec.md) | Especificación del micro-framework v1.0: etapas E1–E4, reglas, patrones, anti-patrones |
| [`convenios-y-reglas.md`](convenios-y-reglas.md) | Estructura del repositorio, convenciones de nombres y reglas de trabajo |
| [`fundamento-teorico.md`](fundamento-teorico.md) | Fundamento teórico: Clean Architecture, DevSecOps, LC/NC, ATAM |
| [`justificacion-casos-de-estudio.md`](justificacion-casos-de-estudio.md) | Taxonomía y representatividad de los casos de estudio (Yin, 2018) |
| [`justificacion-rediseno-asis.md`](justificacion-rediseno-asis.md) | Justificación del rediseño del estado as-is |
| [`scripts-python-justificacion.md`](scripts-python-justificacion.md) | Justificación académica de los scripts de automatización |
| [`sustentacion-plantillas-referencia.md`](sustentacion-plantillas-referencia.md) | Sustentación frente a las plantillas del repositorio oficial de n8n |

> El Utility Tree ATAM (escenarios top-K) vive en
> [`docs/atam/atam-utility-tree.md`](../atam/atam-utility-tree.md) — es un insumo directo
> de la evaluación de Fase 7, no contexto previo al proyecto.

## Relación con la metodología

Todo lo que aparece en `microframework/` y `casos-de-estudio/` es una implementación
concreta de lo especificado aquí. `microframework-spec.md` y `convenios-y-reglas.md` en
particular son **fuente de verdad terminológica**: cualquier documento nuevo del repositorio
debe reutilizar los mismos nombres de etapa (E1–E4), los mismos IDs de regla (REG-*/REC-*),
y las mismas convenciones de archivo definidas aquí, sin parafrasear.

## Navegación

- Padre: [`docs/`](../README.md)
- Ver también: [`docs/INDEX.md`](../INDEX.md) · [`microframework/README.md`](../../microframework/README.md)
