> 🌐 **Language / Idioma:** English · [Español](checklist-arquitectura-resultado.md)

# Architecture checklist application result — IoT as-is

**Date:** 2026-04-21
**Audited file:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Commit:** 152fd2d
**Applied by:** Elian Gil (PHASE 3 — closure)
**Checklist reference:** `microframework/checklists/checklist-arquitectura.md`

---

## Summary

- **Applicable items:** 7 / 10.
- **Items passed:** 1 / 7 (REG-010).
- **Items violated:** 6 / 7.
- **Overall severity:** High.

---

## Detail per REG

| REG-* | Passes | Evidence (node) | Severity | Notes |
|-------|--------|------------------|-----------|-------|
| REG-001 | ❌ | Node 9 `x-api-key: literal` header; node 11 `Authorization: Bearer <literal>`; node 13 `x-api-key` header | High | PG credentials removed (IoT CR-ASIS-02) |
| REG-002 | ❌ | No node generates/propagates `run_id` | High | |
| REG-003 | ❌ | `settings.errorWorkflow` absent | High | |
| REG-004 | ❌ | Nodes 9, 11, 13 httpRequest with no retry | High | |
| REG-005 | ❌ | Node 10 `lecturas_sensor` INSERT with no ON CONFLICT; node 13 audit INSERT with no ON CONFLICT | High | 2 writes affected |
| REG-006 | ❌ | No structured JSON log | Medium | |
| REG-007 | ❌ | Hardcoded `if (temp > 35)` threshold in node 5; domain enrichment mixed with IO in node 7 | High | CR1 touches 6 nodes |
| REG-008 | ❌ | HTTP/Postgres inline in the orchestrator (nodes 9, 10, 11, 13) — no E3/E4 subflows | High | |
| REG-009 | ❌ | Single Respond 200; doesn't distinguish 422 (validation) vs 400 (format) vs 409 (duplicate) | Medium | |
| REG-010 | ✓ | `casos-de-estudio/iot/adr/` contains ADRs 001, 002, 003, 004 | — | |

---

## Complementary evidence

- **Static validator:** `node microframework/validacion/validar-flujos.mjs --caso iot --estado as-is`
  reports 6/7 applicable rules violated.
- **REG-005 verification query:**
  `SELECT sensor_id, timestamp, COUNT(*) FROM lecturas_sensor GROUP BY 1,2 HAVING COUNT(*) > 1;`
  in the DB post as-is runs returns N duplicate rows (quantitative evidence of the
  antipattern; set K makes this pathology visible by design).

---

## Reference

- `notas-tecnicas.md`, `cambios-y-evidencia.md`
- Fix ADRs: `../adr/ADR-001`, `ADR-002`, `ADR-003`, `ADR-004`
