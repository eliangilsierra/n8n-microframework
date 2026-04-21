# Matriz de trazabilidad — Caso IoT

**Versión:** 1.0
**Fecha:** 2026-04-07
**Estado:** Plantilla — completar durante FASE 4 y FASE 7

---

## Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-IOT-01 | El sistema valida presencia de sensor_id, temperature, humidity, co2 | Alta |
| RF-IOT-02 | El sistema valida rangos físicamente posibles de cada variable | Alta |
| RF-IOT-03 | El sistema normaliza los datos de entrada (redondeo) | Media |
| RF-IOT-04 | El sistema clasifica el nivel de alerta: normal, warning, crítico | Alta |
| RF-IOT-05 | El sistema persiste la lectura en PostgreSQL con idempotencia | Alta |
| RF-IOT-06 | El sistema notifica por canal diferenciado según nivel de alerta | Alta |
| RF-IOT-07 | El sistema responde 422 si la lectura es inválida, sin persistir | Alta |
| RF-IOT-08 | El sistema no envía notificación si el nivel es normal | Media |

---

## Trazabilidad: Requerimiento → Decisión arquitectónica → Evidencia

| Requerimiento | ADR relacionado | Regla micro-framework | Nodo/Etapa | Input Set | Evidencia (FASE 6) |
|---------------|-----------------|----------------------|------------|-----------|-------------------|
| RF-IOT-01 | ADR-001 (pendiente) | E1 | E1 - Validacion | C | run-log-iot-*.csv |
| RF-IOT-02 | ADR-001 (pendiente) | E1 | E1 - Validacion | C | run-log-iot-*.csv |
| RF-IOT-03 | — | REC-001 | E1 - Normalizacion | A, B | run-log-iot-*.csv |
| RF-IOT-04 | ADR-002 (pendiente) | REG-007, E2 | E2 - Dominio | A, B | run-log-iot-*.csv |
| RF-IOT-05 | ADR-003 (pendiente) | REG-005, E3 | E3 - Persistencia | A, B | SELECT lecturas_sensor |
| RF-IOT-06 | ADR-004 (pendiente) | REG-004, E4 | E4 - Notificacion | B | run-log-iot-*.csv |
| RF-IOT-07 | ADR-001 (pendiente) | REG-009 | Respond - 422 | C | run-log-iot-*.csv |
| RF-IOT-08 | — | E4 | IF - requiereNotificacion | A | run-log-iot-*.csv |

---

## Trazabilidad: Atributo de calidad → Escenario ATAM → Decisión

| Atributo de calidad | Escenario ATAM | Decisión arquitectónica | ADR |
|--------------------|----------------|------------------------|-----|
| Mantenibilidad | Modificar umbral crítico de temperatura toca solo E2 | Umbrales centralizados en E2 | ADR-002 (pendiente) |
| Seguridad | Credenciales PostgreSQL no aparecen en JSON exportado | Credenciales en n8n | ADR-001 (pendiente) |
| Confiabilidad | Reintento de inserción no crea lecturas duplicadas | Idempotencia con ON CONFLICT | ADR-003 (pendiente) |
| Confiabilidad | Fallo en notificación no pierde la lectura persistida | E3 y E4 separados | Metamodelo E1-E4 |
| Trazabilidad | Toda lectura tiene run_id y sensor_id en logs y BD | run_id desde E1 | REG-002 |

---

## Change Requests y cobertura

| CR | Descripción | RF afectado | Etapa impactada (as-is) | Etapa impactada (to-be) |
|----|-------------|-------------|------------------------|------------------------|
| CR1 | Bajar umbral crítico temperatura de 45°C a 40°C | RF-IOT-04 | Nodo Code monolítico | Solo E2 |
| CR2 | Cambiar endpoint de notificaciones | RF-IOT-06 | Nodo HTTP Request en flujo | Solo E4 |
| CR3 | Agregar validación co2 ≥ 0 (rechazar negativos) | RF-IOT-02 | Nodo Code monolítico | Solo E1 |

---

*Completar columnas "Evidencia (FASE 6)" con referencias a run_id y commit_hash
una vez ejecutadas las corridas de medición comparativa.*
