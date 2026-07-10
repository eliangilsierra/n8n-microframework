> 🌐 **Language / Idioma:** English · [Español](README.md)

# cr-logs/iot/ — IoT case CR-logs

**Path:** `medicion/cr-logs/iot/`
**Belongs to:** [`medicion/cr-logs/`](../README.en.md)

---

## What it is and why it exists

Contains the result CSVs for the 3 Change Requests (CR1, CR2, CR3) measured for the IoT
case, both on as-is (pre-measured in Phase 3) and on to-be (Phase 6).

## Contents of this folder

| File | Description |
|---|---|
| `cr-log-iot-as-is.csv` | CR1 (6 nodes), CR2 (4 nodes), CR3 (3 nodes) — monolithic pipeline |
| `cr-log-iot-to-be.csv` | CR1 (1 node, −83.3%), CR2 (1 node, −75%), CR3 (0 nodes, −100%) |

## Relationship to the methodology

Each CR's detailed design (which nodes are modified, verification criterion) is in
[`casos-de-estudio/iot/cr-design.md`](../../../casos-de-estudio/iot/cr-design.en.md).
Columns: `cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes`.

## Navigation

- Parent: [`medicion/cr-logs/`](../README.en.md)
- See also: [`medicion/cr-logs/bot/`](../bot/README.en.md) · [`casos-de-estudio/iot/cr-design.md`](../../../casos-de-estudio/iot/cr-design.en.md)
