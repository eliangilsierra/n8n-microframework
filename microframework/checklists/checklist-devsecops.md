# Checklist DevSecOps — Flujos to-be

Aplicar junto al checklist de arquitectura antes de versionar cualquier flujo to-be.
Enfocado en seguridad de credenciales, secretos y superficie de ataque.

**Caso:** _______________
**Versión del flujo:** _______________
**Fecha de verificación:** _______________
**Responsable:** _______________

---

## Ítems de seguridad

```
[ ] No hay API keys, tokens ni passwords en el JSON del flujo
    → Revisión manual del JSON exportado con búsqueda de texto

[ ] No hay datos sensibles en los campos de log
    → Los logs no registran valores de tokens de usuario ni datos PII

[ ] Las credenciales de integraciones externas están creadas en n8n Credentials
    → Los nodos HTTP Request referencian una credencial por nombre, no valor literal

[ ] El archivo .env real no está trackeado en Git
    → git status no muestra .env; .gitignore incluye .env y *.env

[ ] El .env.example está actualizado con todas las variables necesarias
    → Toda variable usada en docker-compose.yml tiene entrada en .env.example

[ ] El webhook de entrada valida autenticación antes de procesar datos
    → El flujo verifica el campo token antes de invocar subflujos de negocio

[ ] Los endpoints de integración usan HTTPS en entornos productivos
    → Las URLs mock (localhost) son aceptables solo en entorno local de evaluación

[ ] El flujo de error no expone detalles internos del sistema en su respuesta al cliente
    → El Respond to Webhook en caso de error devuelve mensaje genérico, no el stack trace
```

---

## Resultado

| Ítems cumplidos | Ítems fallidos | Decisión |
|-----------------|----------------|----------|
| /8 | /8 | Aprobar / Rechazar |

**Notas:**

---

*Ver reglas de seguridad en `docs/context/convenios-y-reglas.md` — Sección "Reglas críticas de seguridad"*

---

## Pilares DevSecOps del anteproyecto (§4.3)

Este checklist cubre los 3 pilares operativos definidos en el anteproyecto:

| Pilar | Dónde se instrumenta |
|---|---|
| 1. Gestión de Secretos | Ítems 1–5 de este checklist + credenciales gestionadas en n8n |
| 2. Validaciones Automatizadas | `microframework/validacion-estatica-flujos.md` — script que verifica REG-001…REG-010 sobre el JSON exportado |
| 3. Resiliencia Operativa | Reglas REG-004 (retry), REG-005 (idempotencia) y patrones en `microframework/patrones/` |
