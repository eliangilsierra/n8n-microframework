> 🌐 **Language / Idioma:** English · [Español](README.md)

# run-logs/bot/ — Bot case run-logs

**Path:** `medicion/run-logs/bot/`
**Belongs to:** [`medicion/run-logs/`](../README.en.md)

---

## What it is and why it exists

Contains the result CSVs for the Bot case's 4000 runs (2000 as-is + 2000 to-be, 10 sets ×
200 repetitions each).

## Contents of this folder

| File | Description |
|---|---|
| `run-log-bot-as-is.csv` | Results of runs against the as-is flow (9% failures — intentional antipatterns) |
| `run-log-bot-to-be.csv` | Results of runs against the to-be flow (6% failures — correct validation rejections) |

## Relationship to the methodology

Columns: `run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash`.
**Immutable once recorded** — see
[`../../../microframework/convenciones/convenios-y-reglas.en.md`](../../../microframework/convenciones/convenios-y-reglas.en.md).
Consolidated results in
[`medicion/consolidado/comparacion-2026-05-05.md`](../../consolidado/comparacion-2026-05-05.en.md).

## Navigation

- Parent: [`medicion/run-logs/`](../README.en.md)
- See also: [`medicion/run-logs/iot/`](../iot/README.en.md) · [`medicion/datasets/bot/`](../../datasets/bot/README.en.md) (input datasets)
