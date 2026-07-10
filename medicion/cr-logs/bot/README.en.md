> 🌐 **Language / Idioma:** English · [Español](README.md)

# cr-logs/bot/ — Bot case CR-logs

**Path:** `medicion/cr-logs/bot/`
**Belongs to:** [`medicion/cr-logs/`](../README.en.md)

---

## What it is and why it exists

Contains the result CSVs for the 3 Change Requests (CR1, CR2, CR3) measured for the Bot
case, both on as-is (pre-measured in Phase 3) and on to-be (Phase 6).

## Contents of this folder

| File | Description |
|---|---|
| `cr-log-bot-as-is.csv` | CR1 (8 nodes), CR2 (5 nodes), CR3 (3 nodes) — monolithic flow |
| `cr-log-bot-to-be.csv` | CR1 (1 node, −87.5%), CR2 (1 node, −80%), CR3 (1 node, −66.7%) |

## Relationship to the methodology

Each CR's detailed design (which nodes are modified, verification criterion) is in
[`casos-de-estudio/bot/cr-design.md`](../../../casos-de-estudio/bot/cr-design.en.md).
Columns: `cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes`.

## Navigation

- Parent: [`medicion/cr-logs/`](../README.en.md)
- See also: [`medicion/cr-logs/iot/`](../iot/README.en.md) · [`casos-de-estudio/bot/cr-design.md`](../../../casos-de-estudio/bot/cr-design.en.md)
