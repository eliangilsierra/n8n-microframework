> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# medicion/ — Datos y evidencia de la comparación as-is vs to-be

**Ruta:** `medicion/`
**Pertenece a:** [Repositorio (raíz)](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene toda la **evidencia cuantitativa** del estudio: los datasets
sintéticos de entrada, los logs crudos de cada corrida (run-logs) y de cada Change
Request (cr-logs), y los reportes consolidados que comparan as-is vs to-be. Es el
sustento empírico de la evaluación ATAM (Fase 7) y de la matriz de trazabilidad de cada
caso.

## Contenido de esta carpeta

| Subcarpeta / Archivo | Descripción |
|---|---|
| [`consolidado/`](consolidado/README.md) | Reportes finales: comparación as-is/to-be, métricas derivadas, evidencia ATAM, resultado MTTD |
| [`datasets/`](datasets/README.md) | Datasets sintéticos A–K (estáticos + dinámicos) generados determinísticamente |
| [`run-logs/`](run-logs/README.md) | CSV con el resultado de cada corrida individual (8000 filas totales) |
| [`cr-logs/`](cr-logs/README.md) | CSV con el resultado de cada Change Request medido (CR1, CR2, CR3) |
| [`encuesta-validacion/`](encuesta-validacion/README.md) | Datos anonimizados de la Fase V — encuesta de validación externa por panel de expertos |
| `analizar_runlogs.py` | Genera el reporte HTML interactivo `consolidado/reporte-runlogs.html` |
| `analisis_iot_q5.py` | Análisis específico del escenario ATAM IOT-Q5 (urgencia diferenciada) |

## Relación con la metodología

Esta carpeta es la fuente de la evidencia cuantitativa que el anteproyecto exige para
comparar as-is vs to-be (métricas de Entrega, Operación, Seguridad y Trazabilidad — ver
[`docs/context/proyecto-overview.md`](../docs/context/proyecto-overview.md)). Los datos
aquí contenidos son **inmutables una vez registrados** (ver reglas de integridad en
[`docs/context/convenios-y-reglas.md`](../docs/context/convenios-y-reglas.md)) y se
generan/consultan siguiendo el protocolo operativo en
[`docs/protocolo-evidencias.md`](../docs/protocolo-evidencias.md).

## Navegación

- Padre: [Repositorio (raíz)](../README.md)
- Ver también: [`automatizacion/README.md`](../automatizacion/README.md) (scripts que generan estos datos) · [`docs/atam/informe-atam-final.md`](../docs/atam/informe-atam-final.md) (uso de esta evidencia en ATAM)
