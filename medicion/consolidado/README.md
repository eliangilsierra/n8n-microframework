> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# consolidado/ — Reportes finales de la comparación as-is vs to-be

**Ruta:** `medicion/consolidado/`
**Pertenece a:** [`medicion/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene los **reportes consolidados** derivados de los run-logs y cr-logs
crudos: comparaciones as-is vs to-be, métricas derivadas por dimensión (Entrega,
Operación, Seguridad, Trazabilidad), la matriz de evidencia ATAM y el resultado de la
medición MTTD.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| [`comparacion-2026-05-03.md`](comparacion-2026-05-03.md) | Primera comparación as-is vs to-be (snapshot intermedio) |
| [`comparacion-2026-05-05.md`](comparacion-2026-05-05.md) | Segunda comparación as-is vs to-be (snapshot final de Fase 6) |
| [`metricas-derivadas.md`](metricas-derivadas.md) | Métricas por las 4 dimensiones del anteproyecto, con metas orientativas verificadas |
| [`atam-evidencia.md`](atam-evidencia.md) | Matriz de evidencia para los 12 escenarios ATAM top-K (Bot + IoT) |
| [`mttd-resultado.md`](mttd-resultado.md) | Resultado de la medición de Mean Time To Detect (BOT-Q5, IOT-Q4) |
| `reporte-runlogs.html` | Reporte HTML interactivo generado por `medicion/analizar_runlogs.py` (no versionar manualmente — se regenera) |

## Relación con la metodología

**Nota:** a diferencia de los run-logs/cr-logs crudos (inmutables una vez registrados),
los reportes de esta carpeta sí se regeneran cuando hay nueva evidencia disponible (de
ahí el sufijo de fecha en los archivos de comparación). Son el insumo
directo del informe ATAM final
([`atam/informe-atam-final.md`](../../atam/informe-atam-final.md)) y de la
guía de buenas prácticas
([`microframework/guia-buenas-practicas.md`](../../microframework/guia-buenas-practicas.md), Apéndice C).

## Navegación

- Padre: [`medicion/`](../README.md)
- Ver también: [`medicion/run-logs/`](../run-logs/README.md) · [`medicion/cr-logs/`](../cr-logs/README.md) (fuentes crudas) · [`atam/informe-atam-final.md`](../../atam/informe-atam-final.md)
