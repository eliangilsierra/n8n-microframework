> 🌐 **Language / Idioma:** English · [Español](ADR-001-separacion-responsabilidades-flujo.md)

# ADR-001: Separation of responsibilities via orchestrated subflows

**Status:** Accepted
**Date:** 2026-04-07
**Case:** bot
**Affected quality attribute:** Maintainability, Traceability

---

## Context

The support chatbot's as-is flow implements, in a single monolithic flow: token
validation, message classification, the call to the external ticketing service, and
response generation. Static analysis of the JSON identified the following direct
consequences of this architecture:

- Changing a classification rule (e.g., billing priority) requires modifying the same node
  where the ticketing system's payload is built.
- It is not possible to test the classification logic in isolation without invoking the
  external service.
- Adding a new category (e.g., "soporte_técnico") requires inserting additional IF nodes
  into the main flow, increasing coupling between business logic and presentation.
- The flow has 7 violations of the micro-framework's 10 mandatory rules, including
  hardcoded credentials and no traceability.

An architectural decision is needed to justify the to-be redesign and document the
trade-offs assumed.

---

## Decision

We apply the micro-framework's 4-stage metamodel to the Bot case, splitting the monolithic
flow into an orchestrator and 2 subflows invoked with `Execute Workflow`:

- **E1 (Validation):** Implemented inline in the orchestrator — validates token, message,
  user_id, and length. Generates `run_id`.
- **E2 (Domain):** Subflow `bot-to-be-e2-dominio` — centralizes the 5 classification rules
  (R001–R004 + DEFAULT) in a modifiable constant.
- **E3 (Adapter):** Subflow `bot-to-be-e3-adaptador` — handles the ticketing system
  integration with retry and idempotency control.

This separation establishes that:
1. Modifying a classification rule only requires touching E2.
2. Changing the ticket provider only requires touching E3.
3. Every stage can be verified with the REG-007 and REG-008 checklist.

---

## Alternatives considered

- **Keep the monolithic flow with improvements:** Add retry, logs, and fix credentials
  without changing the structure. Discarded because it doesn't solve the coupling between
  business rules and adapters, which is this study's object of research.

- **External microservices:** Extract the logic to external REST services invoked from
  n8n. Discarded because it goes beyond LC/NC scope and requires additional infrastructure
  not contemplated in the project.

- **4 separate subflows (own E1):** Create a subflow dedicated only to E1. Discarded for
  the Bot case because token validation is simple and keeping it in the orchestrator
  reduces Execute Workflow overhead with no loss of separation.

---

## Consequences

**Positive:**
- Changing a business rule (CR1) touches only E2 — a change impact measurable as a
  reduction in `nodes_touched` in the cr-log.
- Changing the ticket provider (CR2) touches only E3 — integration independence
  verifiable in ATAM.
- `run_id` generated in E1 propagated across the whole execution — complete traceability.
- Credentials in n8n Credentials — REG-001 met, secrets removed from the JSON.

**Negative / trade-offs:**
- E2 and E3 latency includes Execute Workflow node overhead (estimated: 5–15ms per
  invocation in the local environment). Acceptable given the goal is maintainability
  evaluation, not latency optimization.
- After importing the subflows into n8n, the orchestrators must be manually updated with
  the real IDs assigned by n8n. Procedure documented in `docs/protocolo-evidencias.md`.

---

## Relationship to the micro-framework

This decision implements the E1-E4 metamodel described in
`microframework/reglas/reglas-obligatorias.md`, specifically rules REG-007 (logic in E2),
REG-008 (integrations in E3), and REG-002 (propagated run_id). The separation pattern is
the micro-framework's central goal and the study's main object of comparison.
