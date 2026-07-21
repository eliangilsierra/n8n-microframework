> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# run-logs/iot/ — Run-logs del caso IoT

**Ruta:** `medicion/run-logs/iot/`
**Pertenece a:** [`medicion/run-logs/`](../README.md)

---

## Qué es y para qué existe

Contiene los CSV de resultado de las 4000 corridas del caso IoT (2000 as-is + 2000
to-be, 10 sets × 200 repeticiones cada uno).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `run-log-iot-as-is.csv` | Resultado de las corridas contra el flujo as-is (0.2% fallos — no valida, acepta todo) |
| `run-log-iot-to-be.csv` | Resultado de las corridas contra el flujo to-be (0.55% fallos — rechazos correctos + fila de evidencia runtime IOT-Q4) |

## Relación con la metodología

Columnas: `run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash`.
**Inmutable una vez registrado** — ver
[`../../../microframework/convenciones/convenios-y-reglas.md`](../../../microframework/convenciones/convenios-y-reglas.md).
El aumento de fallos en to-be (0.2% → 0.55%) es esperado: el as-is no validaba
(antipatrón), el to-be rechaza correctamente entradas inválidas — ver
[`medicion/consolidado/metricas-derivadas.md`](../../consolidado/metricas-derivadas.md).

## Navegación

- Padre: [`medicion/run-logs/`](../README.md)
- Ver también: [`medicion/run-logs/bot/`](../bot/README.md) · [`medicion/datasets/iot/`](../../datasets/iot/README.md) (datasets de entrada)
