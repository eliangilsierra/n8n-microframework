> 🌐 **Language / Idioma:** English · [Español](ADR-002-omision-e4.md)

# ADR-002: Deliberate omission of E4 as an independent subflow in the Bot case

**Status:** Accepted
**Date:** 2026-04-17
**Case:** bot
**Affected quality attribute:** Maintainability, Performance efficiency

---

## Context

The micro-framework's metamodel (see `microframework/microframework-spec.md`) defines four
logical stages: E1 validation, E2 domain, E3 adapters, E4 controlled output. The IoT case
implements all of them as subflows invoked with `Execute Workflow`.

The Bot case, however, implements E1 inline in the orchestrator (see ADR-001) and resolves
the "controlled output" E4 stage with a single `Respond to Webhook` node within the same
orchestrator, with no dedicated subflow created.

This decision requires explicit justification to keep the metamodel coherent and
verifiable in the ATAM evaluation and traceability analysis.

---

## Decision

In the Bot case, the E4 stage is implemented as an **inline node** (`Respond to Webhook`)
within the orchestrator, not as an independent subflow invoked via `Execute Workflow`.

E4's logical responsibility ("produce the final response applying the documented output
contract and level-based routing") is preserved; what changes is the implementation
granularity.

The IoT case does keep E4 as a subflow because its output involves severity-based routing
and two differentiated notification endpoints (critical vs warning), with retry configured
per channel. That logic justifies the subflow.

---

## Alternatives considered

- **Create a `bot-to-be-e4-salida.json` subflow:** Discarded. The Bot's output is a single
  `Respond to Webhook` with a structured payload; encapsulating it adds `Execute Workflow`
  latency (5–15 ms in the local environment) with no reuse or isolation benefit.

- **Omit E4 from the Bot's metamodel with no ADR:** Discarded. It would leave a silent
  inconsistency between the micro-framework's specification and the case's
  implementation, affecting traceability.

---

## Consequences

**Positive:**
- No additional `Execute Workflow` overhead in the Bot's critical path.
- The Bot's orchestrator keeps 3 subflow invocations (E2 and E3) plus the inline E1 and E4
  nodes, leaving it with manageable visual complexity.
- Symmetry with IoT is preserved at the **logical** level, not the implementation level.

**Negative / trade-offs:**
- A future change to the Bot's output logic (e.g., adding a Slack notification besides the
  webhook) will require refactoring the orchestrator to extract E4 into a subflow. This
  risk is accepted because the current Bot case doesn't need it.
- The static validation script (see `microframework/validacion/validar-flujos.mjs`) must
  account for this exception: for the Bot case, E4 verification is done on the
  orchestrator, not on a `*-e4-*.json` file.

---

## Relationship to the micro-framework

The E1–E4 metamodel is preserved as **four logical responsibilities**, not as four
mandatory subflows. REG-008 ("integrations only in E3 and E4") still holds: the Bot
orchestrator's `Respond to Webhook` is inline E4 and contains no calls to external
services (those are in the E3 adapter subflow).

This decision formalizes the criterion: **E4 can be implemented inline when the output is
a single channel with no routing**. Any output with routing (multi-channel, by severity,
by user type) requires a dedicated subflow.
