> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# cr-logs/bot/ — CR-logs del caso Bot

**Ruta:** `medicion/cr-logs/bot/`
**Pertenece a:** [`medicion/cr-logs/`](../README.md)

---

## Qué es y para qué existe

Contiene los CSV de resultado de los 3 Change Requests (CR1, CR2, CR3) medidos para el
caso Bot, tanto en as-is (pre-medido en Fase 3) como en to-be (Fase 6).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `cr-log-bot-as-is.csv` | CR1 (8 nodos), CR2 (5 nodos), CR3 (3 nodos) — flujo monolítico |
| `cr-log-bot-to-be.csv` | CR1 (1 nodo, −87.5%), CR2 (1 nodo, −80%), CR3 (1 nodo, −66.7%) |

## Relación con la metodología

El diseño detallado de cada CR (qué nodos se modifican, criterio de verificación) está en
[`casos-de-estudio/bot/cr-design.md`](../../../casos-de-estudio/bot/cr-design.md).
Columnas: `cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes`.

## Navegación

- Padre: [`medicion/cr-logs/`](../README.md)
- Ver también: [`medicion/cr-logs/iot/`](../iot/README.md) · [`casos-de-estudio/bot/cr-design.md`](../../../casos-de-estudio/bot/cr-design.md)
