# Matriz de trazabilidad — Caso Bot

**Versión:** 1.1
**Fecha:** 2026-04-21
**Estado:** Actualizada en cierre FASE 3 — pendiente evidencia FASE 6 para to-be.

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
| RF-BOT-01 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | REG-001, E1 | E1 - Validacion | C, D, E | run-log-bot-*.csv (FASE 6) |
| RF-BOT-02 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | REG-007, E2 | E2 - Reglas | A, B, F | run-log-bot-*.csv (FASE 6) |
| RF-BOT-03 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md), [ADR-002](../adr/ADR-002-omision-e4.md) | REG-007, E2 | E2 - Reglas | A, B, F | run-log-bot-*.csv (FASE 6) |
| RF-BOT-04 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | REG-004, REG-005, E3 | E3 - Adaptador | A, B, K | run-log-bot-*.csv (FASE 6) |
| RF-BOT-05 | [ADR-002](../adr/ADR-002-omision-e4.md) | REG-009, E4 | Respond - OK | A, B | run-log-bot-*.csv (FASE 6) |
| RF-BOT-06 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | REG-009, E1 | Respond - 400/401 | C | run-log-bot-*.csv (FASE 6) |
| RF-BOT-07 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md), [ADR-004](../adr/ADR-004-diseno-experimental-input-sets.md) | REG-009, E1 | E1 - Validacion | D, E, G, J | run-log-bot-*.csv (FASE 6) |

---

## Trazabilidad: Atributo de calidad → Escenario ATAM → Decisión

| Atributo de calidad | Escenario ATAM | Decisión arquitectónica | ADR |
|--------------------|----------------|------------------------|-----|
| Mantenibilidad | Modificar regla R002 (prioridad) toca solo E2 | Separación dominio/adaptador | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Mantenibilidad | Cambio de endpoint de tickets toca solo E3 | Adaptador aislado | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Seguridad | Token y API keys no aparecen en JSON exportado | Credenciales en n8n, no en nodos | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Confiabilidad | Reintento de ticket no crea duplicados | Idempotencia en E3 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) |
| Validez interna | N=200 viable sin saturación de rate-limit | Dos versiones paralelas (LIMITE=150 / LIMITE=10) | [ADR-003](../adr/ADR-003-ratelimit-medicion.md) |
| Adecuación funcional | Evidencia cuantitativa por antipatrón específico | Matriz experimental ampliada a 10 sets | [ADR-004](../adr/ADR-004-diseno-experimental-input-sets.md) |
| Trazabilidad | Toda ejecución tiene run_id rastreable | run_id propagado desde E1 | REG-002 |

---

## Change Requests y cobertura

| CR | Descripción | RF afectado | Etapa impactada (as-is) | Etapa impactada (to-be) | Medido as-is | Medido to-be |
|----|-------------|-------------|------------------------|------------------------|--------------|--------------|
| CR1 | Cambiar prioridad R002 a "alta" | RF-BOT-03 | 8 nodos (flujo monolítico) | Solo E2 (≤1 nodo esperado) | CR-BOT-001 @ 152fd2d (2026-04-21) | FASE 6 |
| CR2 | Cambiar endpoint de tickets a /api/v2 | RF-BOT-04 | 5 nodos (flujo monolítico) | Solo E3 (≤1 nodo esperado) | CR-BOT-002 @ 152fd2d (2026-04-21) | FASE 6 |
| CR3 | Validar longitud mínima de `message` | RF-BOT-07 | 3 nodos | Solo schema E1 (0 nodos) | CR-BOT-003 @ 152fd2d (2026-04-21) | FASE 6 |

Ver detalle en `casos-de-estudio/bot/cr-design.md` y datos crudos en
`medicion/cr-logs/bot/cr-log-bot-as-is.csv`.

---

## Cambios al as-is (FASE 2)

Ver `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` para el change-log cronológico
completo de los 4 CR-ASIS aplicados (rediseño estructural, ajuste de rate-limit,
ampliación de Input Sets, mock endpoint).

---

## ADRs del caso Bot

| ADR | Título | Estado |
|-----|--------|--------|
| [ADR-001](../adr/ADR-001-separacion-responsabilidades-flujo.md) | Separación de responsabilidades del flujo (E1–E4 lógico) | Aceptado |
| [ADR-002](../adr/ADR-002-omision-e4.md) | Omisión de E4 como subflujo separado en Bot | Aceptado |
| [ADR-003](../adr/ADR-003-ratelimit-medicion.md) | Separación medición estadística vs demo REG-002 | Aceptado |
| [ADR-004](../adr/ADR-004-diseno-experimental-input-sets.md) | Ampliación matriz experimental a 10 Input Sets (aplica también a IoT) | Aceptado |

---

*Las celdas "Evidencia (FASE 6)" y "Medido to-be" se completan cuando se ejecuten las
corridas de medición comparativa del to-be (FASE 6).*
