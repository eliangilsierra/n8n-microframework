> 🌐 **Language / Idioma:** English · [Español](checklist-devsecops.md)

# DevSecOps checklist — To-be flows

Apply alongside the architecture checklist before versioning any to-be flow. Focused on
credential/secret security and attack surface.

**Case:** _______________
**Flow version:** _______________
**Verification date:** _______________
**Responsible:** _______________

---

## Security items

```
[ ] No API keys, tokens, or passwords in the flow's JSON
    → Manual review of the exported JSON with text search

[ ] No sensitive data in log fields
    → Logs do not record user token values or PII data

[ ] External integration credentials are created in n8n Credentials
    → HTTP Request nodes reference a credential by name, not literal value

[ ] The real .env file is not tracked in Git
    → git status shows no .env; .gitignore includes .env and *.env

[ ] .env.example is up to date with all necessary variables
    → Every variable used in docker-compose.yml has an entry in .env.example

[ ] The input webhook validates authentication before processing data
    → The flow checks the token field before invoking business subflows

[ ] Integration endpoints use HTTPS in production environments
    → Mock URLs (localhost) are acceptable only in the local evaluation environment

[ ] The error flow does not expose internal system details in its response to the client
    → Respond to Webhook on error returns a generic message, not the stack trace
```

---

## Result

| Items passed | Items failed | Decision |
|-----------------|----------------|----------|
| /8 | /8 | Approve / Reject |

**Notes:**

---

*See security rules in `docs/context/convenios-y-reglas.md` — Section "Critical security rules"*

---

## DevSecOps pillars from the thesis proposal (§4.3)

This checklist covers the 3 operational pillars defined in the thesis proposal:

| Pillar | Where it is instrumented |
|---|---|
| 1. Secrets management | Items 1–5 of this checklist + credentials managed in n8n |
| 2. Automated validation | `microframework/validacion/validar-flujos.mjs` — script that verifies REG-001…REG-010 over the exported JSON |
| 3. Operational resilience | Rules REG-004 (retry), REG-005 (idempotency), and patterns in `microframework/patrones/` |
