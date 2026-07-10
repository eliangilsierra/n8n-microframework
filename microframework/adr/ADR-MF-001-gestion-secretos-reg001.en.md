> 🌐 **Language / Idioma:** English · [Español](ADR-MF-001-gestion-secretos-reg001.md)

# ADR-MF-001 — Secrets management: credentials in n8n Credentials (REG-001)

**Level:** Micro-framework (applies to all flows)
**Date:** 2026-05-01
**Status:** Accepted
**Quality attribute:** Security / Confidentiality (ISO/IEC 25010)
**Related rule:** REG-001

---

## Context

n8n exports the complete JSON of every flow, including the configuration of every node.
Any literal value written in a node (token, password, API key) is exposed in the exported
JSON. If that JSON is versioned in a Git repository (even a private one), the secret is
accessible to any collaborator with repository access and remains in Git history
permanently.

This problem affects every n8n flow, not just this project's. The literature identifies
credential hardcoding as one of the most frequent antipatterns in LC/NC flows (see OWASP
A02:2021 Cryptographic Failures).

The micro-framework must define a mandatory, verifiable mechanism to prevent credentials
from appearing in the exported JSON.

---

## Decision

Every credential (authentication token, API key, database password, external service
secret) is stored exclusively in **n8n's Credentials system** and is referenced in nodes
only by name.

**In HTTP Request nodes:**
```
Authentication: Generic Credential Type
Credential Type: Header Auth
Credential: "credential-name" (n8n selector)
```

**In Postgres nodes:**
```
Credential: "credential-name" (n8n selector)
```

**In Code nodes** (when the value is needed in JS logic):
```javascript
const token = $credentials["credential-name"].value;
```

The exported JSON will only contain the credential's name, never its value.

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| Environment variables in Code nodes (`process.env.SECRET`) | The value of `process.env` is still a literal value once assigned to a variable before use; also, n8n in Docker does not expose host environment variables to Code nodes by default |
| HashiCorp Vault with dynamic lookup | Dependency on external infrastructure — outside the micro-framework's declared scope (LC/NC with no external dependencies) |
| Secrets as webhook input parameters | The secret would end up in the orchestrator's logs (run-logs) and in the input payload — worse exposure |
| `.env` file referenced from `docker-compose.yml` | n8n's environment variables are for instance configuration, not per-flow integration secrets |

---

## Consequences

**Positive:**
- The secret never appears in the exported JSON or in Git history.
- `validar-flujos.mjs` can automatically verify compliance by searching for literal-value
  patterns (tokens, passwords) in the JSON.
- Compatible with credential rotation: changing the value in n8n Credentials updates every
  flow that references it without modifying any JSON.

**Negative:**
- Coupling to n8n's Credentials mechanism: migrating to another platform requires
  re-configuring credentials in the new system.
- Credentials are not under version control (they are instance configuration).
  `.env.example` and `protocolo-evidencias.md` document which credentials must exist to
  reproduce the environment.

---

## Verification criterion (REG-001)

```bash
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be
# The result must include: REG-001: ✓ CUMPLE
```

The script searches the exported JSON for patterns:
- Strings containing `password`, `token`, `api_key`, `Bearer`, `secret` as literal values
  (not as field names).
- Values in the `rightValue` of IF comparisons that are authentication tokens.
- Values in `jsCode` that are literal secret assignments.
