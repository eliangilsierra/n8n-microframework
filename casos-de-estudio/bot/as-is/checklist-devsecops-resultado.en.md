> 🌐 **Language / Idioma:** English · [Español](checklist-devsecops-resultado.md)

# DevSecOps checklist application result — Bot as-is

**Date:** 2026-04-21
**Audited file:** `casos-de-estudio/bot/as-is/bot-as-is.json`
**Commit:** 152fd2d
**Reference:** `microframework/checklists/checklist-devsecops.md`

---

## Summary of the 3 pillars

| Pillar | Passes | Evidence |
|-------|--------|-----------|
| Secrets management | ❌ | 5 literal secrets detected by the static validator |
| Automated validation | ❌ partial | The validator exists but the as-is violates 6/7 rules (evidence of an incomplete CI cycle) |
| Operational resilience | ❌ | No retry, no errorWorkflow, no idempotency, no structured log |

---

## Detail

### Pillar 1 — Secrets management (complete failure)

| Control | Status | Evidence |
|---------|--------|-----------|
| Secrets outside the exported JSON | ❌ | See checklist-arquitectura §REG-001 — 5 literals present |
| Use of n8n credential-reference for external services | ❌ | Nodes 8, 12, 14 use a literal header instead of a credential |
| `.env` excluded from git (`.gitignore`) | ✓ | `.gitignore` includes `.env`, `n8n_data/`, `*.env` (repository convention) |
| Documented rotation | N/A | Doesn't apply to the ad-hoc as-is |

### Pillar 2 — Automated validation (partial)

| Control | Status | Evidence |
|---------|--------|-----------|
| Static validator exists | ✓ | `microframework/validacion/validar-flujos.mjs` |
| Validator detects literal secrets | ✓ | Patterns updated in Block 3 of the PHASE 3 closure |
| Validator in the project's CI | ❌ | Not yet integrated into the CI pipeline (out of PHASE 3's scope, planned for PHASE 5) |
| Validatable JSON schemas | ✓ | `microframework/contratos/bot-*.schema.json` updated |
| Applied to the as-is | ✓ | This document is the result |

### Pillar 3 — Operational resilience (complete failure)

| Control | Status | Evidence (node) |
|---------|--------|------------------|
| Retry on HTTP integrations | ❌ | Nodes 8, 12, 14 with no retry |
| errorWorkflow configured | ❌ | `settings.errorWorkflow` absent |
| Idempotency on writes | ❌ | Node 13 INSERT with no ON CONFLICT |
| Structured JSON log | ❌ | No `console.log(JSON.stringify(...))` with run_id |
| Rate-limit with a distributed backend | ❌ | Node 3 uses `$getWorkflowStaticData('global')` (in-memory, non-distributed) |
| Differentiated HTTP response codes | ❌ | A single `responseCode: 200` on success |

---

## Conclusion

The Bot's as-is violates all 3 DevSecOps pillars simultaneously. This result is
**intentional** (a deliberate antipattern documented in Bot ADR-001 and in
`cambios-y-evidencia.md` §CR-ASIS-01). The fix is implemented in the to-be (PHASE 4–5) by
applying the micro-framework.

## Reference

- `notas-tecnicas.md`, `cambios-y-evidencia.md`
- `microframework/checklists/checklist-devsecops.md`
- The case's ADRs
