# Checklist de arquitectura — Flujos to-be

Aplicar antes de versionar cualquier flujo to-be (exportar JSON y hacer commit).
Todos los ítems deben marcarse como cumplidos. Si alguno falla, corregir antes de versionar.

**Caso:** _______________
**Versión del flujo:** _______________
**Fecha de verificación:** _______________
**Responsable:** _______________

---

## Reglas obligatorias (REG-001..010)

```
[ ] REG-001: JSON exportado sin credenciales hardcodeadas
             → Buscar en el JSON: token, api_key, password, Bearer, secret
             → Ninguno debe tener valor literal

[ ] REG-002: run_id presente en output de todos los subflujos
             → Verificar en cada subflujo que el campo run_id está en el JSON de salida

[ ] REG-003: errorWorkflow configurado en settings del orquestador
             → settings.errorWorkflow del JSON no está vacío ni null

[ ] REG-004: retry habilitado en todos los nodos HTTP Request
             → options.retry.enabled: true en cada nodo HTTP Request de E3/E4

[ ] REG-005: escrituras con control de idempotencia
             → Query SQL incluye ON CONFLICT (idempotency_key) DO NOTHING

[ ] REG-006: log estructurado JSON en cada etapa
             → Cada nodo Code incluye console.log(JSON.stringify({run_id, etapa, status, ...}))

[ ] REG-007: E2 sin nodos HTTP ni de base de datos
             → El subflujo E2 solo contiene nodos Code y Execute Workflow Trigger

[ ] REG-008: integraciones solo en E3 y E4
             → Nodos HTTP Request y Postgres únicamente en subflujos E3 y E4

[ ] REG-009: status codes HTTP apropiados en respuestas
             → 200 éxito, 400/422 entrada inválida, 401 sin autenticación

[ ] REG-010: al menos un ADR documentado en carpeta adr/
             → casos-de-estudio/{caso}/adr/ contiene al menos ADR-001-*.md
```

---

## Resultado

| Ítems cumplidos | Ítems fallidos | Decisión |
|-----------------|----------------|----------|
| /10 | /10 | Aprobar / Rechazar |

**Notas:**

---

*Ver detalle de cada regla en `microframework/reglas/reglas-obligatorias.md`*
