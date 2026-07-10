> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# cr-logs/iot/ — CR-logs del caso IoT

**Ruta:** `medicion/cr-logs/iot/`
**Pertenece a:** [`medicion/cr-logs/`](../README.md)

---

## Qué es y para qué existe

Contiene los CSV de resultado de los 3 Change Requests (CR1, CR2, CR3) medidos para el
caso IoT, tanto en as-is (pre-medido en Fase 3) como en to-be (Fase 6).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `cr-log-iot-as-is.csv` | CR1 (6 nodos), CR2 (4 nodos), CR3 (3 nodos) — pipeline monolítico |
| `cr-log-iot-to-be.csv` | CR1 (1 nodo, −83.3%), CR2 (1 nodo, −75%), CR3 (0 nodos, −100%) |

## Relación con la metodología

El diseño detallado de cada CR (qué nodos se modifican, criterio de verificación) está en
[`casos-de-estudio/iot/cr-design.md`](../../../casos-de-estudio/iot/cr-design.md).
Columnas: `cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes`.

## Navegación

- Padre: [`medicion/cr-logs/`](../README.md)
- Ver también: [`medicion/cr-logs/bot/`](../bot/README.md) · [`casos-de-estudio/iot/cr-design.md`](../../../casos-de-estudio/iot/cr-design.md)
