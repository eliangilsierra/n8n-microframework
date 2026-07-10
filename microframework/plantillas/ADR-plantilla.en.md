> 🌐 **Language / Idioma:** English · [Español](ADR-plantilla.md)

# ADR-{NNN}: {Decision title}

**Status:** Proposed | Accepted | Superseded by ADR-XXX
**Date:** YYYY-MM-DD
**Case:** bot | iot
**Affected quality attribute:** Maintainability | Security | Reliability | Traceability

---

## Context

{Description of the problem or situation that requires the decision. Include the system's
current state, environment constraints, and why it's not possible to continue without
making a decision. Answer: What forces us to decide this now?}

---

## Decision

{Description of the decision made. Write in present tense and active voice:
"We use X because Y", "We implement Z to solve W". Be specific about
what is implemented and how.}

---

## Alternatives considered

- **{Alternative 1}:** {Why it was discarded — include the main trade-off}
- **{Alternative 2}:** {Why it was discarded — include the main trade-off}

---

## Consequences

**Positive:**
- {Concrete positive consequence — quantify if possible}

**Negative / trade-offs:**
- {Negative consequence or trade-off — describe the cost assumed}

---

## Relationship to the micro-framework

{Which micro-framework rule or pattern supports this decision. Reference by ID:
REG-001..010, REC-001..006, or pattern name: patron-retry, patron-idempotencia.}

---

<!-- Usage instructions (delete once the ADR is complete):

1. Copy this file to casos-de-estudio/{case}/adr/ADR-{NNN}-{kebab-name}.md
2. Replace every field between braces {}
3. Delete the instructions (this comment block)
4. Commit with: [FASE-N] adr: {brief description of the decision}

Example file names:
  ADR-001-orquestacion-centralizada.md
  ADR-002-gestion-secretos-n8n-credentials.md
  ADR-003-idempotencia-ingesta-iot.md
-->
