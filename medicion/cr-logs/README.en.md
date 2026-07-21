> 🌐 **Language / Idioma:** English · [Español](README.md)

# cr-logs/ — Measured Change Request log

**Path:** `medicion/cr-logs/`
**Belongs to:** [`medicion/`](../README.en.md)

---

## What it is and why it exists

This folder contains the **evidence CSVs** for the 3 Change Requests (CR1 business rule,
CR2 integration, CR3 validation) measured for each case, on as-is and on to-be. They are
the source of the project's main metric: **nodes touched per CR** (change impact), which
demonstrates the −81% (Bot) and −84% (IoT) reduction achieved by the micro-framework.

## Contents of this folder

| Subfolder | Description |
|---|---|
| [`bot/`](bot/README.en.md) | Bot case CR-logs (as-is + to-be) |
| [`iot/`](iot/README.en.md) | IoT case CR-logs (as-is + to-be) |

## Relationship to the methodology

Column format: `cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes`
(see [`../../microframework/convenciones/convenios-y-reglas.en.md`](../../microframework/convenciones/convenios-y-reglas.en.md)
§CR Logs). Each CR's design is in each case's `cr-design.md`
([`bot/cr-design.md`](../../casos-de-estudio/bot/cr-design.en.md),
[`iot/cr-design.md`](../../casos-de-estudio/iot/cr-design.en.md)). Same immutability
rules as the run-logs.

## Navigation

- Parent: [`medicion/`](../README.en.md)
- See also: [`medicion/run-logs/`](../run-logs/README.en.md) · [`medicion/consolidado/metricas-derivadas.md`](../consolidado/metricas-derivadas.en.md) (analysis of this data)
