> 🌐 **Language / Idioma:** English · [Español](README.md)

# iot/ — Case study: IoT sensor pipeline

**Path:** `casos-de-estudio/iot/`
**Belongs to:** [`casos-de-estudio/`](../README.en.md)

---

## What it is and why it exists

This case study represents the **event-driven pipeline** pattern: an IoT sensor ingestion
pipeline that receives temperature, humidity, and CO₂ readings via webhook, validates
physical ranges, detects threshold-based anomalies, persists with idempotency control, and
notifies through a channel differentiated by severity. It is the second of the two cases
that validate the micro-framework (see
[`casos-de-estudio/justificacion-casos-de-estudio.md`](../justificacion-casos-de-estudio.en.md)
for the representativeness justification).

## Contents of this folder

| File / Subfolder | Description |
|---|---|
| [`ficha-tecnica.md`](ficha-tecnica.en.md) | Functional description, endpoints, domain variables, Input Sets |
| [`cr-design.md`](cr-design.en.md) | Design of the 3 Change Requests (CR1 threshold, CR2 integration, CR3 validation) |
| [`adr/`](adr/README.en.md) | 8 ADRs of architectural decisions specific to the IoT case |
| [`as-is/`](as-is/README.en.md) | Baseline flow with intentional antipatterns (14 nodes) |
| [`to-be/`](to-be/README.en.md) | Flow with the micro-framework applied (orchestrator + E1–E4 subflows + error handler) |
| [`trazabilidad/`](trazabilidad/README.en.md) | RF → ADR → REG → evidence traceability matrix |

## Relationship to the methodology

The IoT case covers the "Event-driven pipeline" pattern (machine data source,
near-real-time, state persisted in PostgreSQL with idempotency) within the 4-category
LC/NC taxonomy — complementary and orthogonal to the Bot case. Its as-is intentionally
violates 9 of the 10 mandatory rules; its to-be implements all **four** E1–E4 stages as
separate subflows (unlike the Bot, which omits E4 as a subflow — see
[`ADR-001`](adr/ADR-001-separacion-responsabilidades-pipeline.en.md)), plus an
`iot-error-handler` with lost-reading replay capability
([`ADR-005`](adr/ADR-005-diseno-error-workflow.en.md)).

## Navigation

- Parent: [`casos-de-estudio/`](../README.en.md)
- See also: [`casos-de-estudio/bot/`](../bot/README.en.md) (complementary case) · [`microframework/README.md`](../../microframework/README.en.md)
