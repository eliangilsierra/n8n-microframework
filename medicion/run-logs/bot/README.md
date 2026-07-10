> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# run-logs/bot/ — Run-logs del caso Bot

**Ruta:** `medicion/run-logs/bot/`
**Pertenece a:** [`medicion/run-logs/`](../README.md)

---

## Qué es y para qué existe

Contiene los CSV de resultado de las 4000 corridas del caso Bot (2000 as-is + 2000
to-be, 10 sets × 200 repeticiones cada uno).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `run-log-bot-as-is.csv` | Resultado de las corridas contra el flujo as-is (9% de fallos — antipatrones intencionales) |
| `run-log-bot-to-be.csv` | Resultado de las corridas contra el flujo to-be (6% de fallos — rechazos correctos de validación) |

## Relación con la metodología

Columnas: `run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash`.
**Inmutable una vez registrado** — ver
[`docs/context/convenios-y-reglas.md`](../../../docs/context/convenios-y-reglas.md).
Resultados consolidados en
[`medicion/consolidado/comparacion-2026-05-05.md`](../../consolidado/comparacion-2026-05-05.md).

## Navegación

- Padre: [`medicion/run-logs/`](../README.md)
- Ver también: [`medicion/run-logs/iot/`](../iot/README.md) · [`medicion/datasets/bot/`](../../datasets/bot/README.md) (datasets de entrada)
