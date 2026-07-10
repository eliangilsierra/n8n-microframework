> 🌐 **Language / Idioma:** English · [Español](checklist-devsecops-resultado.md)

# DevSecOps checklist application result — IoT as-is

**Date:** 2026-04-21
**Audited file:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Commit:** 152fd2d
**Reference:** `microframework/checklists/checklist-devsecops.md`

---

## Summary of the 3 pillars

| Pillar | Passes | Evidence |
|-------|--------|-----------|
| Secrets management | ❌ partial | PG credentials removed from the node (CR-ASIS-02), but 3 literal API keys persist in HTTP |
| Automated validation | ❌ partial | Validator exists; as-is violates 6/7 rules |
| Operational resilience | ❌ | No retry, no errorWorkflow, no idempotency, no structured log |

---

## Detail

### Pillar 1 — Secrets management

| Control | Status | Evidence |
|---------|--------|-----------|
| PostgreSQL credentials outside the JSON | ✓ | IoT CR-ASIS-02 — node 10 uses credential-reference |
| HTTP API keys outside the JSON | ❌ | Nodes 9, 11, 13 use a literal header |
| `.env` excluded from git | ✓ | `.gitignore` configured |
| Documented rotation | N/A | — |

### Pillar 2 — Automated validation

| Control | Status | Evidence |
|---------|--------|-----------|
| Static validator exists | ✓ | `microframework/validacion/validar-flujos.mjs` |
| Secret patterns updated | ✓ | Block 3, PHASE 3 closure |
| Validatable JSON schemas | ✓ | `iot-*.schema.json` |
| Applied to the as-is | ✓ | This document |
| Validator in CI | ❌ | PHASE 5 |

### Pillar 3 — Operational resilience

| Control | Status | Evidence (node) |
|---------|--------|------------------|
| Retry on HTTP integrations | ❌ | Nodes 9, 11, 13 with no retry |
| errorWorkflow | ❌ | Absent |
| Idempotency on writes | ❌ | Nodes 10, 13 INSERT with no ON CONFLICT |
| Structured JSON log | ❌ | No logs with run_id |
| Circuit breaker / rate-limit on integrations | ❌ | Not applicable; not present; the as-is doesn't implement it |
| Differentiated HTTP response codes | ❌ | Single Respond 200/500 |

---

## Conclusion

The IoT's as-is violates all 3 DevSecOps pillars. Intentional violation documented in IoT
ADR-001 and `cambios-y-evidencia.md`. Fixed in the to-be via ADRs 002, 003, 004.

## Reference

- `notas-tecnicas.md`, `cambios-y-evidencia.md`
- `microframework/checklists/checklist-devsecops.md`
