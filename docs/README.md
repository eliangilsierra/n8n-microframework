> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# docs/ — Documentación metodológica del proyecto

**Ruta:** `docs/`
**Pertenece a:** [Repositorio (raíz)](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene toda la **documentación metodológica, teórica y de arquitectura**
del proyecto: el contexto y fundamento que sustenta las decisiones de diseño
(`context/`), la evaluación ATAM completa (`atam/`), el diseño de arquitectura de
referencia en AWS (`aws/`), y los protocolos operativos para reproducir el estudio.

Para el mapa detallado de cada documento, ver [`docs/INDEX.md`](INDEX.md).

## Contenido de esta carpeta

| Subcarpeta / Archivo | Descripción |
|---|---|
| [`context/`](context/README.md) | Anteproyecto, overview del proyecto, arquitectura de flujos, especificación del micro-framework, convenciones, fundamento teórico |
| [`atam/`](atam/INDEX.md) | Artefactos de la evaluación ATAM (Fase 7): informe final, metodología adaptada, matriz de scoring, instrumentos de encuesta |
| [`aws/`](aws/INDEX.md) | Diseño de arquitectura AWS (Fase 8): arquitectura, seguridad/IAM, observabilidad, escalabilidad, costos, diagramas |
| [`guia-buenas-practicas.md`](guia-buenas-practicas.md) | Guía de buenas prácticas (entregable de cierre, Fase 9) |
| [`microframework-v1.0.md`](microframework-v1.0.md) | Overview del micro-framework v1.0 |
| [`protocolo-evidencias.md`](protocolo-evidencias.md) | Protocolo operativo: levantar entorno, importar flujos, registrar mediciones |
| [`protocolo-mttd.md`](protocolo-mttd.md) | Protocolo de medición del Mean Time To Detect |

## Relación con la metodología

`docs/context/` es la fuente normativa de toda terminología y convención usada en el
resto del repositorio (etapas E1–E4, reglas REG-*/REC-*, estructura de carpetas). `atam/`
y `aws/` documentan los dos entregables de investigación más recientes (evaluación de
atributos de calidad y diseño de referencia en la nube), ambos construidos sobre la
especificación de `context/`. Los protocolos (`protocolo-evidencias.md`,
`protocolo-mttd.md`) son las instrucciones operativas que permiten a un investigador
externo reproducir exactamente las condiciones de medición del estudio.

## Navegación

- Padre: [Repositorio (raíz)](../README.md)
- Ver también: [`docs/INDEX.md`](INDEX.md) (sitemap detallado) · [`microframework/README.md`](../microframework/README.md)
