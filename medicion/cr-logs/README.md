> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# cr-logs/ — Registro de Change Requests medidos

**Ruta:** `medicion/cr-logs/`
**Pertenece a:** [`medicion/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene los **CSV de evidencia** de los 3 Change Requests (CR1 regla de
negocio, CR2 integración, CR3 validación) medidos para cada caso, en as-is y en to-be.
Son la fuente de la métrica principal del proyecto: **nodos tocados por CR** (impacto de
cambio), que demuestra la reducción de −81% (Bot) y −84% (IoT) lograda por el
micro-framework.

## Contenido de esta carpeta

| Subcarpeta | Descripción |
|---|---|
| [`bot/`](bot/README.md) | CR-logs del caso Bot (as-is + to-be) |
| [`iot/`](iot/README.md) | CR-logs del caso IoT (as-is + to-be) |

## Relación con la metodología

Formato de columnas: `cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes`
(ver [`docs/context/convenios-y-reglas.md`](../../docs/context/convenios-y-reglas.md)
§CR Logs). El diseño de cada CR está en `cr-design.md` de cada caso
([`bot/cr-design.md`](../../casos-de-estudio/bot/cr-design.md),
[`iot/cr-design.md`](../../casos-de-estudio/iot/cr-design.md)). Mismas reglas de
inmutabilidad que los run-logs.

## Navegación

- Padre: [`medicion/`](../README.md)
- Ver también: [`medicion/run-logs/`](../run-logs/README.md) · [`medicion/consolidado/metricas-derivadas.md`](../consolidado/metricas-derivadas.md) (análisis de estos datos)
