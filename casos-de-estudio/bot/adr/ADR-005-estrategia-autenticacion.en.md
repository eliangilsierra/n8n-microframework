> 🌐 **Language / Idioma:** English · [Español](ADR-005-estrategia-autenticacion.md)

# ADR-005 — Authentication strategy without a hardcoded token (Bot to-be)

**Date:** 2026-05-01
**Status:** Accepted
**Quality attribute:** Security / Confidentiality (ISO/IEC 25010)
**Related rules:** REG-001, REG-009
**Framework ADR:** ADR-MF-001

---

## Context

The as-is flow compares the authentication token against a literal value hardcoded in the
`Verificar Token` Code node:

```javascript
// As-is — REG-001 ANTIPATTERN
if (token !== "my-secret-bot-token-2024") {
  return [{ json: { error: "Unauthorized" } }];
}
```

This literal value appears in the flow's exported JSON and is exposed in the Git
repository. Anyone with repository access can obtain the token and authenticate against
the webhook.

The to-be must validate the token without its value appearing in the exported JSON, while
keeping the same validation semantics (string comparison) and responding with the correct
status code when validation fails (REG-009: 401 Unauthorized).

---

## Decision

The token is read from the `BOT_API_TOKEN` environment variable via `$env.BOT_API_TOKEN`
in E1's Code node. Validation compares the token received in the body against the value
configured in the environment, without that value appearing in the flow's JSON:

```javascript
// To-be — meets REG-001 (ADR-005)
const tokenPresente = !!body.token;

if (tokenPresente) {
  try {
    const expectedToken = $env.BOT_API_TOKEN;
    if (expectedToken && body.token !== expectedToken) {
      errores.push('Token de autenticacion invalido');
      unauthorized = true;
    }
  } catch(e) { /* $env not available — only presence is validated */ }
}
```

The `try/catch` block covers n8n sandbox versions where `$env` is not available as a
global — in that case the flow accepts any non-empty token (documented fail-open,
intentional for development environments without the variable configured).

The `unauthorized` flag propagates to the orchestrator, which distinguishes between:
- `token missing` → `errores[]` → `valido: false` → **400 Bad Request**
- `token present but invalid` → `unauthorized: true` → **401 Unauthorized**

**Orchestrator's response when authentication fails:**
```json
HTTP 401 Unauthorized
{ "ok": false, "run_id": "RUN-BOT-...", "error": "Token de autenticacion invalido" }
```

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| JWT with signature verification (RS256/HS256) | Requires the `jsonwebtoken` library, unavailable in n8n's native Code node without additional npm installation — outside LC/NC scope |
| Validation in an external API Gateway (NGINX, Kong) | Infrastructure outside the micro-framework's declared scope; n8n's webhook would be the direct entry point |
| n8n "Header Auth" credential type (`$credentials["bot-api-token"].value`) | Incompatible with the Code node in n8n 2.14.x — `$credentials` is not available as a global in the Code node's sandbox; only accessible from nodes with explicit credential support (HTTP Request, etc.) |
| Not validating authentication in E1 (leave it to the mock) | Violates the metamodel's contract: E1 is the flow's gatekeeper; if invalid input passes E1, it contaminates E2 and E3 |

---

## Consequences

**Positive:**
- The token's value never appears in the exported JSON. `validar-flujos.mjs` confirms this
  automatically (REG-001 verified).
- Behavior is semantically identical to the as-is: string comparison.
- The orchestrator responds 401 when the token is invalid and 400 when missing, instead of
  the as-is's incorrect 200 (REG-009 fixed).
- Requires no additional credential configuration on the n8n instance — only the
  `BOT_API_TOKEN` variable in `.env` (already documented in `.env.example`).

**Negative / Trade-offs:**
- The `BOT_API_TOKEN` variable must be configured in the environment's `.env`. If not
  defined, `$env.BOT_API_TOKEN` returns `undefined` and the flow accepts any non-empty
  token (fail-open). This behavior is intentional for development environments and is
  documented in the `catch`'s comment.
- If a future n8n version restricts `$env`, value validation deactivates automatically
  with no flow failure — token presence is still validated.

---

## Verification criterion

1. `validar-flujos.mjs --caso bot --estado to-be` → REG-001: ✓ CUMPLE
2. Input Set C (missing token) → HTTP 400, `run-log-bot-to-be.csv` status=fail,
   error_type=validation
3. Input Set C with a present but incorrect token → HTTP 401, error_type=authentication
4. The exported JSON contains no literal token string
5. `BOT_API_TOKEN` defined in `.env.example` as a reference
