# Matriz de trazabilidad — Caso Bot

**Versión:** 1.0
**Fecha:** 2026-04-07
**Estado:** Plantilla — completar durante FASE 4 y FASE 7

---

## Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-BOT-01 | El sistema valida presencia del token antes de procesar | Alta |
| RF-BOT-02 | El sistema clasifica el mensaje en una de 5 categorías | Alta |
| RF-BOT-03 | El sistema determina prioridad: alta, media o baja | Alta |
| RF-BOT-04 | El sistema persiste un ticket en el servicio externo | Alta |
| RF-BOT-05 | El sistema responde con categoría, prioridad y mensaje al usuario | Alta |
| RF-BOT-06 | El sistema rechaza con 400 si el token está ausente | Alta |
| RF-BOT-07 | El sistema rechaza con 400 si el mensaje excede 1000 caracteres | Media |

---

## Trazabilidad: Requerimiento → Decisión arquitectónica → Evidencia

| Requerimiento | ADR relacionado | Regla micro-framework | Nodo/Etapa | Input Set | Evidencia (FASE 6) |
|---------------|-----------------|----------------------|------------|-----------|-------------------|
| RF-BOT-01 | ADR-001 (pendiente) | REG-001, E1 | E1 - Validacion | C | run-log-bot-*.csv |
| RF-BOT-02 | ADR-002 (pendiente) | REG-007, E2 | E2 - Reglas | A, B | run-log-bot-*.csv |
| RF-BOT-03 | ADR-002 (pendiente) | REG-007, E2 | E2 - Reglas | A, B | run-log-bot-*.csv |
| RF-BOT-04 | ADR-003 (pendiente) | REG-004, REG-005, E3 | E3 - Adaptador | A, B | run-log-bot-*.csv |
| RF-BOT-05 | — | REG-009, E4 | Respond - OK | A, B | run-log-bot-*.csv |
| RF-BOT-06 | ADR-001 (pendiente) | REG-009, E1 | Respond - 400 | C | run-log-bot-*.csv |
| RF-BOT-07 | ADR-001 (pendiente) | E1 | E1 - Validacion | — | run-log-bot-*.csv |

---

## Trazabilidad: Atributo de calidad → Escenario ATAM → Decisión

| Atributo de calidad | Escenario ATAM | Decisión arquitectónica | ADR |
|--------------------|----------------|------------------------|-----|
| Mantenibilidad | Modificar regla R002 (prioridad facturacion) toca solo E2 | Separación dominio/adaptador | ADR-002 (pendiente) |
| Seguridad | Token y API keys no aparecen en JSON exportado | Credenciales en n8n, no en nodos | ADR-001 (pendiente) |
| Confiabilidad | Reintento de ticket no crea duplicados | Idempotencia en E3 | ADR-003 (pendiente) |
| Trazabilidad | Toda ejecución tiene run_id rastreable | run_id propagado desde E1 | REG-002 |

---

## Change Requests y cobertura

| CR | Descripción | RF afectado | Etapa impactada (as-is) | Etapa impactada (to-be) |
|----|-------------|-------------|------------------------|------------------------|
| CR1 | Cambiar prioridad R002 a "alta" | RF-BOT-03 | Flujo monolítico completo | Solo E2 |
| CR2 | Cambiar endpoint de tickets | RF-BOT-04 | Flujo monolítico completo | Solo E3 |
| CR3 | Agregar validación user_id | RF-BOT-01 | Nodo IF inicial | Solo E1 |

---

*Completar columnas "Evidencia (FASE 6)" con referencias a run_id y commit_hash
una vez ejecutadas las corridas de medición comparativa.*
