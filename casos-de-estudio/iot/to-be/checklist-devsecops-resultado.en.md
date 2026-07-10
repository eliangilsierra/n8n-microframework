> 🌐 **Language / Idioma:** English · [Español](checklist-devsecops-resultado.md)

# DevSecOps checklist application result — IoT to-be

**Date:** 2026-05-05
**Audited files:**
- `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` (v1.1.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-error-handler.json` (v1.0.0)

**Applied by:** Elian Gil (PHASE 4 — closure)
**Checklist reference:** `microframework/checklists/checklist-devsecops.md`
**Automated validation:** `microframework/validacion/reportes/validacion-2026-05-06.md` (REG-001 iot: 100%)

---

## Summary

- **Applicable items:** 7 / 8 (item 6 N/A by design — see note)
- **Items passed:** 7 / 7 applicable
- **Items violated:** 0 / 7
- **Overall severity:** No violations — DevSecOps pillars correctly applied.

---

## Detail per item

| # | Item | Passes | Evidence |
|---|------|--------|-----------|
| 1 | No API keys, tokens, or passwords in the JSON | ✅ | `validar-flujos.mjs` REG-001: no literal-secret patterns. E3 uses the `"Postgres Local"` credential. E4 uses the `"Notificacion API Key"` credential — no literal value in any node |
| 2 | No sensitive data in log fields | ✅ | Logs record: `run_id`, `etapa`, `status`, `sensor_id`, `nivel`, `anomalias_detectadas`. They record no private user field values or credentials |
| 3 | Integration credentials in n8n Credentials | ✅ | E3: `credentials: { postgres: { id: "postgres-local", name: "Postgres Local" } }`. E4: `credentials: { httpHeaderAuth: { id: "notificacion-api-credential", name: "Notificacion API Key" } }` |
| 4 | The real .env file is not tracked in Git | ✅ | `.gitignore` includes `*.env` and `infraestructura/.env`. Verified: `git status` shows no `.env` files |
| 5 | .env.example is up to date | ✅ | `infraestructura/.env.example` contains every IoT pipeline variable (PostgreSQL, n8n, mocks) |
| 6 | The webhook validates authentication before processing | N/A | The IoT pipeline processes data from internal-network sensors. Authentication is handled at the infrastructure level (private network / API Gateway in the to-be AWS design). E1's validation is about sensor data integrity, not caller identity. Documented in IoT ADR-006 |
| 7 | Integration endpoints will use HTTPS in production | ✅ | Mock URLs (`http://host.docker.internal:3002`) acceptable only in local evaluation. In the to-be AWS design they would use HTTPS with API Gateway. Documented in the Phase 8 design |
| 8 | The error flow does not expose internal details | ✅ | The error handler logs the internal detail (for the operator) and notifies the ops channel with no exposure to the HTTP caller. The orchestrator returns no stack trace in the 422 response |

---

## DevSecOps pillars covered

| Pillar | Status | Evidence |
|-------|--------|-----------|
| 1. Secrets Management | ✅ Met | Items 1–5. REG-001 verified by validar-flujos.mjs. Credentials via n8n Credentials |
| 2. Automated Validation | ✅ Met | `validar-flujos.mjs` run: IoT to-be 100% (every subflow). Pillar 2 operational |
| 3. Operational Resilience | ✅ Met | E4 differentiated retry (critical: 3 attempts, warning: 2 attempts — REG-004). ON CONFLICT DO NOTHING in E3 (REG-005). Error handler with retry (REG-003) |

---

## Note on IoT authentication (item 6)

The IoT pipeline does not implement token validation in the payload because:
1. Physical sensors typically don't manage tokens on every reading (unnecessary overhead).
2. Authentication is delegated to the infrastructure layer (segmented network, API Gateway
   with mTLS in the Phase 8 AWS design).
3. E1's validation focuses on the reading's physical integrity (fields, ranges, timestamp
   drift), not identity.

This decision is aligned with the reference IoT architecture pattern (NIST SP 800-213)
where channel security is the network's responsibility, not the sensor's data payload.

---

## References

- To-be architecture checklist: `casos-de-estudio/iot/to-be/checklist-arquitectura-resultado.md` (10/10 ✅)
- Static validation report: `microframework/validacion/reportes/validacion-2026-05-06.md`
- IoT ADR-006 — E1 schema validation: `casos-de-estudio/iot/adr/ADR-006-validacion-schema-e1.md`
- ADR-MF-001 — secrets management: `microframework/adr/ADR-MF-001-gestion-secretos-reg001.md`
