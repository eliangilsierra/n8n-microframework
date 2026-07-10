> 🌐 **Language / Idioma:** English · [Español](README.md)

# bot/ — Case study: Support chatbot

**Path:** `casos-de-estudio/bot/`
**Belongs to:** [`casos-de-estudio/`](../README.en.md)

---

## What it is and why it exists

This case study represents the **webhook-reactive** pattern: a support chatbot that
receives user messages over HTTP, validates authentication, classifies the message by
category and priority, persists a ticket in an external service, and responds to the
client. It is one of the two cases that validate the micro-framework through an as-is vs
to-be comparison (see
[`docs/context/justificacion-casos-de-estudio.md`](../../docs/context/justificacion-casos-de-estudio.en.md)
for the justification of why this pattern is representative).

## Contents of this folder

| File / Subfolder | Description |
|---|---|
| [`ficha-tecnica.md`](ficha-tecnica.en.md) | Functional description, endpoints, business rules, Input Sets |
| [`cr-design.md`](cr-design.en.md) | Design of the 3 Change Requests (CR1 rule, CR2 integration, CR3 validation) |
| [`adr/`](adr/README.en.md) | 8 ADRs of architectural decisions specific to the Bot case |
| [`as-is/`](as-is/README.en.md) | Baseline flow with intentional antipatterns (16 nodes) |
| [`to-be/`](to-be/README.en.md) | Flow with the micro-framework applied (orchestrator + E2/E3 subflows) |
| [`trazabilidad/`](trazabilidad/README.en.md) | RF → ADR → REG → evidence traceability matrix |

## Relationship to the methodology

The Bot case covers the "Webhook-reactive" pattern (human data source, real-time
response, no own state) within the 4-category LC/NC taxonomy. Its as-is intentionally
violates 9 of the micro-framework's 10 mandatory rules; its to-be fixes them by applying
the E1–E4 metamodel, with E1 and E4 implemented inline in the orchestrator (see
[`ADR-002`](adr/ADR-002-omision-e4.en.md)) and E2/E3 as separate subflows.

## Navigation

- Parent: [`casos-de-estudio/`](../README.en.md)
- See also: [`casos-de-estudio/iot/`](../iot/README.en.md) (complementary case) · [`microframework/README.md`](../../microframework/README.en.md)
