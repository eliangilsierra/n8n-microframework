# Matriz de trazabilidad — Caso IoT

**Versión:** 1.3
**Fecha:** 2026-05-01
**Estado:** Actualizada con ADR-005..008 y escenarios ATAM IOT-Q1..Q6 — pendiente evidencia FASE 6 para to-be.

---

## Requerimientos funcionales

| ID | Requerimiento | Prioridad | Atributo ISO 25010 |
|----|---------------|-----------|-------------------|
| RF-IOT-01 | El sistema valida presencia de sensor_id, temperature, humidity, co2 | Alta | Fiabilidad / Madurez + Adecuación funcional / Corrección |
| RF-IOT-02 | El sistema valida rangos físicamente posibles de cada variable | Alta | Adecuación funcional / Corrección |
| RF-IOT-03 | El sistema normaliza los datos de entrada (redondeo) | Media | Mantenibilidad / Modularidad |
| RF-IOT-04 | El sistema clasifica el nivel de alerta: normal, advertencia, crítico | Alta | Mantenibilidad / Modularidad + Adecuación funcional / Corrección |
| RF-IOT-05 | El sistema persiste la lectura en PostgreSQL con idempotencia | Alta | Fiabilidad / Madurez |
| RF-IOT-06 | El sistema notifica por canal diferenciado según nivel de alerta | Alta | Fiabilidad / Tolerancia a fallos + Confiabilidad |
| RF-IOT-07 | El sistema responde 422 si la lectura es inválida, sin persistir | Alta | Adecuación funcional / Corrección |
| RF-IOT-08 | El sistema no envía notificación si el nivel es normal | Media | Eficiencia de desempeño / Comportamiento temporal |

---

## Trazabilidad: Requerimiento → Decisión arquitectónica → Evidencia

| Requerimiento | ADR relacionado | Regla micro-framework | Nodo/Etapa | Input Set | Evidencia (FASE 6) |
|---------------|-----------------|----------------------|------------|-----------|-------------------|
| RF-IOT-01 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | E1, REG-009 | E1 - Validacion | C, D, E | run-log-iot-*.csv (FASE 6) |
| RF-IOT-02 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | E1, REG-009 | E1 - Validacion | C, D, J | run-log-iot-*.csv (FASE 6) |
| RF-IOT-03 | — | REC-001 | E1 - Normalizacion | A, B, F | run-log-iot-*.csv (FASE 6) |
| RF-IOT-04 | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) | REG-007, E2 | E2 - Dominio | A, B, F, J | run-log-iot-*.csv (FASE 6) |
| RF-IOT-05 | [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) | REG-005, E3 | E3 - Persistencia | A, B, K | SELECT + COUNT(DISTINCT) |
| RF-IOT-06 | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) | REG-004, REG-008, E4 | E4 - Notificacion | B, I, J | run-log-iot-*.csv (FASE 6) |
| RF-IOT-07 | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | REG-009 | Respond - 422 | C, D | run-log-iot-*.csv (FASE 6) |
| RF-IOT-08 | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) | E2, E4 | IF - requiereNotificacion | A, F | run-log-iot-*.csv (FASE 6) |

---

## Trazabilidad: Atributo de calidad → Escenario ATAM → Decisión

| Atributo de calidad | Escenario ATAM | Decisión arquitectónica | ADR |
|--------------------|----------------|------------------------|-----|
| Mantenibilidad | Modificar umbral crítico de temperatura toca solo E2 | Umbrales centralizados en E2 (`UMBRALES`) | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) |
| Adecuación funcional | Vocabulario `nivel` consistente entre as-is y to-be | Enum `{normal, advertencia, critico}` | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) |
| Seguridad | Credenciales PostgreSQL no aparecen en JSON exportado | Credenciales en n8n (credential-reference) | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) |
| Confiabilidad | Reintento de inserción no crea lecturas duplicadas | Clave compuesta + ON CONFLICT DO NOTHING | [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) |
| Confiabilidad | TTD de eventos críticos desacoplado del tráfico de advertencias | Routing por `nivel` en E4 con retry diferenciado | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Confiabilidad | Fallo en notificación no pierde la lectura persistida | E3 y E4 separados | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) |
| Validez interna | REG-005 medible con evidencia cuantitativa | Set K (duplicados idempotencia) | [ADR-004 Bot](../../bot/adr/ADR-004-diseno-experimental-input-sets.md) |
| Trazabilidad | Toda lectura tiene run_id y sensor_id en logs y BD | run_id propagado desde E1 | REG-002 |
| Mantenibilidad | IOT-Q1: CR1 (umbral 35→30°C) toca ≤1 nodo en to-be | Constante UMBRALES centralizada en E2 | [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) |
| Mantenibilidad | IOT-Q2: CR2 (endpoint urgente) toca ≤1 nodo en to-be | Routing E4 aislado | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Fiabilidad | IOT-Q3: 0 lecturas duplicadas en Set K | Idempotencia clave {sensor_id, timestamp} | [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) + [ADR-007](../adr/ADR-007-timestamp-authority.md) |
| Fiabilidad | IOT-Q4: lecturas no perdidas en fallo transitorio E3 | Retry REG-004 + error boundary | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Confiabilidad | IOT-Q5: críticos notificados antes que advertencias | Routing diferenciado E4 | [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) |
| Seguridad | IOT-Q6: credenciales PG no en JSON exportado | Credenciales n8n por nombre | [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) |

---

## Change Requests y cobertura

| CR | Descripción | RF afectado | Etapa impactada (as-is) | Etapa impactada (to-be) | Medido as-is | Medido to-be |
|----|-------------|-------------|------------------------|------------------------|--------------|--------------|
| CR1 | Reducir umbral temp crítica 35°C → 30°C | RF-IOT-04 | 6 nodos | Solo constante `UMBRALES` en E2 (1 nodo) | CR-IOT-001 @ 152fd2d (2026-04-21) | FASE 6 |
| CR2 | Cambiar endpoint notificación urgente → /api/v2/notify/urgent | RF-IOT-06 | 4 nodos | Solo HTTP de rama crítica en E4 (1 nodo) | CR-IOT-002 @ 152fd2d (2026-04-21) | FASE 6 |
| CR3 | Agregar validación co2 ≥ 0 (rechazar negativos) | RF-IOT-02 | 3 nodos | Solo schema E1 (0 nodos) | CR-IOT-003 @ 152fd2d (2026-04-21) | FASE 6 |

Ver detalle en `casos-de-estudio/iot/cr-design.md` y datos crudos en
`medicion/cr-logs/iot/cr-log-iot-as-is.csv`.

---

## Cambios al as-is (FASE 2)

Ver `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` para el change-log cronológico
(rediseño estructural 6→14 nodos, remoción de credenciales PG del nodo, ampliación
de Input Sets).

---

## ADRs del caso IoT

| ADR | Título | Estado |
|-----|--------|--------|
| [ADR-001](../adr/ADR-001-separacion-responsabilidades-pipeline.md) | Separación de responsabilidades del pipeline (E1–E4) | Aceptado |
| [ADR-002](../adr/ADR-002-umbrales-y-vocabulario.md) | Umbrales del to-be y vocabulario `nivel` | Aceptado |
| [ADR-003](../adr/ADR-003-idempotencia-sensor-timestamp.md) | Idempotencia con clave `{sensor_id, timestamp}` | Aceptado |
| [ADR-004](../adr/ADR-004-routing-e4-por-severidad.md) | Routing diferenciado de E4 por severidad | Aceptado |
| [ADR-004 Bot](../../bot/adr/ADR-004-diseno-experimental-input-sets.md) | Diseño experimental (compartido) | Aceptado |
| [ADR-005](../adr/ADR-005-diseno-error-workflow.md) | errorWorkflow con payload para replay de lecturas perdidas (REG-003, REG-006) | Aceptado |
| [ADR-006](../adr/ADR-006-validacion-schema-e1.md) | Validación de schema en E1 con JavaScript inline y errores por campo | Aceptado |
| [ADR-007](../adr/ADR-007-timestamp-authority.md) | Autoridad del timestamp: usar timestamp del sensor (REG-005) | Aceptado |
| [ADR-008](../adr/ADR-008-normalizacion-e1.md) | Normalización de campos en E1 antes de pasar a dominio (REC-001, REG-005) | Aceptado |

---

*Las celdas "Evidencia (FASE 6)" y "Medido to-be" se completan cuando se ejecuten las
corridas de medición comparativa del to-be (FASE 6).*
