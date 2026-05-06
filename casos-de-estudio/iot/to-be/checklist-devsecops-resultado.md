# Resultado de aplicación del checklist-devsecops — IoT to-be

**Fecha:** 2026-05-05
**Archivos auditados:**
- `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` (v1.1.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json` (v1.0.0)
- `casos-de-estudio/iot/to-be/iot-error-handler.json` (v1.0.0)

**Aplicado por:** Elian Gil (FASE 4 — cierre)
**Referencia del checklist:** `microframework/checklists/checklist-devsecops.md`
**Validación automatizada:** `microframework/validacion/reportes/validacion-2026-05-06.md` (REG-001 iot: 100%)

---

## Resumen

- **Items aplicables:** 7 / 8 (ítem 6 N/A por diseño — ver nota)
- **Items cumplidos:** 7 / 7 aplicables
- **Items violados:** 0 / 7
- **Severidad global:** Sin violaciones — Pilares DevSecOps aplicados correctamente.

---

## Detalle por ítem

| # | Ítem | Cumple | Evidencia |
|---|------|--------|-----------|
| 1 | No hay API keys, tokens ni passwords en el JSON | ✅ | `validar-flujos.mjs` REG-001: sin patrones de secretos literales. E3 usa credencial `"Postgres Local"`. E4 usa credencial `"Notificacion API Key"` — ningún valor literal en ningún nodo |
| 2 | No hay datos sensibles en los campos de log | ✅ | Logs registran: `run_id`, `etapa`, `status`, `sensor_id`, `nivel`, `anomalias_detectadas`. No registran valores de campos privados de usuario ni credenciales |
| 3 | Credenciales de integraciones en n8n Credentials | ✅ | E3: `credentials: { postgres: { id: "postgres-local", name: "Postgres Local" } }`. E4: `credentials: { httpHeaderAuth: { id: "notificacion-api-credential", name: "Notificacion API Key" } }` |
| 4 | El archivo .env real no está trackeado en Git | ✅ | `.gitignore` incluye `*.env` e `infraestructura/.env`. Verificado: `git status` no muestra archivos `.env` |
| 5 | El .env.example está actualizado | ✅ | `infraestructura/.env.example` contiene todas las variables del pipeline IoT (PostgreSQL, n8n, mocks) |
| 6 | El webhook valida autenticación antes de procesar | N/A | Pipeline IoT procesa datos de sensores de red interna. Autenticación a nivel de infraestructura (red privada / API Gateway en to-be AWS). La validación en E1 es de integridad de datos del sensor, no de identidad de llamante. Documentado en ADR-006 IoT |
| 7 | Endpoints de integración usarán HTTPS en producción | ✅ | URLs mock (`http://host.docker.internal:3002`) aceptables solo en evaluación local. En to-be AWS usarían HTTPS con API Gateway. Documentado en diseño Fase 8 |
| 8 | El flujo de error no expone detalles internos | ✅ | El error handler loguea el detalle interno (para el operador) y notifica al canal de ops sin exponer al llamante HTTP. El orquestador no retorna stack trace en la respuesta 422 |

---

## Pilares DevSecOps cubiertos

| Pilar | Estado | Evidencia |
|-------|--------|-----------|
| 1. Gestión de Secretos | ✅ Cumplido | Items 1–5. REG-001 verificado por validar-flujos.mjs. Credenciales vía n8n Credentials |
| 2. Validaciones Automatizadas | ✅ Cumplido | `validar-flujos.mjs` ejecutado: IoT to-be 100% (todos los subflujos). Pilar 2 operativo |
| 3. Resiliencia Operativa | ✅ Cumplido | E4 retry diferenciado (crítico: 3 intentos, advertencia: 2 intentos — REG-004). ON CONFLICT DO NOTHING en E3 (REG-005). Error handler con retry (REG-003) |

---

## Nota sobre autenticación IoT (ítem 6)

El pipeline IoT no implementa validación de token en el payload porque:
1. Los sensores físicos típicamente no gestionan tokens en cada lectura (overhead innecesario).
2. La autenticación se delega a la capa de infraestructura (red segmentada, API Gateway con mTLS en diseño AWS de Fase 8).
3. La validación en E1 se centra en integridad física de la lectura (campos, rangos, timestamp drift), no en identidad.

Esta decisión está alineada con el patrón de arquitectura IoT de referencia (NIST SP 800-213) donde la seguridad del canal es responsabilidad de la red, no del payload de datos del sensor.

---

## Referencias

- Checklist arquitectura to-be: `casos-de-estudio/iot/to-be/checklist-arquitectura-resultado.md` (10/10 ✅)
- Reporte validación estática: `microframework/validacion/reportes/validacion-2026-05-06.md`
- ADR-006 IoT — validación schema E1: `casos-de-estudio/iot/adr/ADR-006-validacion-schema-e1.md`
- ADR-MF-001 — gestión de secretos: `microframework/adr/ADR-MF-001-gestion-secretos-reg001.md`
