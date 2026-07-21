> 🌐 **Language / Idioma:** English · [Español](README.md)

# run-logs/iot/ — IoT case run-logs

**Path:** `medicion/run-logs/iot/`
**Belongs to:** [`medicion/run-logs/`](../README.en.md)

---

## What it is and why it exists

Contains the result CSVs for the IoT case's 4000 runs (2000 as-is + 2000 to-be, 10 sets ×
200 repetitions each).

## Contents of this folder

| File | Description |
|---|---|
| `run-log-iot-as-is.csv` | Results of runs against the as-is flow (0.2% failures — doesn't validate, accepts everything) |
| `run-log-iot-to-be.csv` | Results of runs against the to-be flow (0.55% failures — correct rejections + the IOT-Q4 runtime evidence row) |

## Relationship to the methodology

Columns: `run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash`.
**Immutable once recorded** — see
[`../../../microframework/convenciones/convenios-y-reglas.en.md`](../../../microframework/convenciones/convenios-y-reglas.en.md).
The increase in to-be failures (0.2% → 0.55%) is expected: the as-is didn't validate
(antipattern), the to-be correctly rejects invalid inputs — see
[`medicion/consolidado/metricas-derivadas.md`](../../consolidado/metricas-derivadas.en.md).

## Navigation

- Parent: [`medicion/run-logs/`](../README.en.md)
- See also: [`medicion/run-logs/bot/`](../bot/README.en.md) · [`medicion/datasets/iot/`](../../datasets/iot/README.en.md) (input datasets)
