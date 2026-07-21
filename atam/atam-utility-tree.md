> 🌐 **Idioma / Language:** Español · [English](atam-utility-tree.en.md)

# Utility Tree ATAM — Escenarios top-K por caso de estudio

**Versión:** 1.0
**Fecha:** 2026-05-01
**Autor:** Elian Hernando Gil Sierra
**Propósito:** Definir los escenarios de calidad prioritarios (top-K) para la
evaluación ATAM de FASE 7, con medidas de respuesta verificables y trazabilidad
completa a ADRs e Input Sets.

---

## Marco de referencia

Bass, Clements & Kazman (2012) en *Software Architecture in Practice* (3rd ed.)
definen el Utility Tree ATAM como una estructura de cuatro niveles:

```
Utilidad del sistema
└── Atributo de calidad (Mantenibilidad, Fiabilidad, Seguridad…)
    └── Refinamiento (sub-característica ISO 25010)
        └── Escenario concreto con estímulo, respuesta y medida de respuesta
```

Los escenarios se priorizan con pares (importancia para el negocio, dificultad
de implementación): H=alta, M=media, L=baja.

---

## Caso Bot — 6 escenarios top-K

| ID | Driver negocio | Atributo ISO 25010 | Sub-característica | Estímulo | Respuesta esperada | Medida de respuesta | Prioridad |
|----|----------------|-------------------|-------------------|----------|-------------------|---------------------|-----------|
| BOT-Q1 | Modificabilidad de reglas | Mantenibilidad | Modularidad | CR1: cambiar prioridad de R002 de "media" a "alta" | Solo el subflujo E2 modificado | `nodes_touched ≤ 1` en cr-log-bot-to-be.csv | (H, M) |
| BOT-Q2 | Cambio de proveedor de tickets | Mantenibilidad | Modularidad | CR2: cambiar endpoint del servicio de tickets a `/api/v2/tickets` | Solo el subflujo E3 modificado | `nodes_touched ≤ 1` en cr-log-bot-to-be.csv | (H, L) |
| BOT-Q3 | Confidencialidad de credenciales | Seguridad | Confidencialidad | Exportar el JSON del flujo to-be a disco | El token de autenticación no aparece como valor literal | `ocurrencias_literal_token = 0` verificado por `validar-flujos.mjs` | (H, L) |
| BOT-Q4 | Integridad de datos ante reintentos | Fiabilidad | Madurez | Enviar el mismo ticket (Input Set K) dos veces consecutivas | 0 registros duplicados en el servicio externo | `COUNT(tickets_duplicados) = 0` vía mock-bot `/api/tickets` | (H, M) |
| BOT-Q5 | Diagnóstico de fallos en producción | Operabilidad | Monitoreabilidad | Fallo de autenticación en producción (token inválido) | El operador identifica etapa y causa en logs sin abrir n8n UI | `MTTD ≤ 60 segundos` usando `docker compose logs n8n \| grep '"status":"fail"'` | (H, H) |
| BOT-Q6 | Corrección de contratos HTTP | Adecuación funcional | Corrección | Token inválido (Set C) / mensaje ausente (Set D) | 401 Unauthorized / 400 Bad Request respectivamente | `HTTP_status_correcto = 100%` en run-log-bot-to-be.csv para Sets C y D | (H, L) |

---

## Caso IoT — 6 escenarios top-K

| ID | Driver negocio | Atributo ISO 25010 | Sub-característica | Estímulo | Respuesta esperada | Medida de respuesta | Prioridad |
|----|----------------|-------------------|-------------------|----------|-------------------|---------------------|-----------|
| IOT-Q1 | Ajuste de umbrales de alerta | Mantenibilidad | Modularidad | CR1: reducir umbral de temperatura crítica de 35°C a 30°C | Solo la constante `UMBRALES` en E2 modificada | `nodes_touched ≤ 1` en cr-log-iot-to-be.csv | (H, L) |
| IOT-Q2 | Cambio de canal de alerta | Mantenibilidad | Modularidad | CR2: cambiar endpoint de notificación urgente a `/api/v2/notify/urgent` | Solo el nodo HTTP de la rama crítica en E4 modificado | `nodes_touched ≤ 1` en cr-log-iot-to-be.csv | (H, L) |
| IOT-Q3 | Integridad de lecturas ante reintentos | Fiabilidad | Madurez | Enviar la misma lectura del sensor (Input Set K) dos veces | 0 registros duplicados en PostgreSQL | `SELECT COUNT(*) FROM lecturas_sensor WHERE idempotency_key='...' = 1` | (H, M) |
| IOT-Q4 | Tolerancia a fallos de red | Fiabilidad | Tolerancia a fallos | Fallo de red transitorio en E3 (mock-iot no disponible durante 1 retry) | El flujo reintenta y completa sin pérdida de lectura | `fallos_tipo_integration = 0` en run-log después de recovery del mock | (H, H) |
| IOT-Q5 | Urgencia diferenciada de alertas | Confiabilidad | Tolerancia a fallos | Mezcla de lecturas críticas y de advertencia (Input Set I) | Las críticas se procesan y notifican antes que las de advertencia | `duracion_ms_critico < duracion_ms_advertencia` para lecturas equivalentes | (M, H) |
| IOT-Q6 | Confidencialidad de credenciales de BD | Seguridad | Confidencialidad | Exportar el JSON del flujo to-be a disco | Las credenciales de PostgreSQL no aparecen como valores literales | `ocurrencias_literal_pg_password = 0` verificado por `validar-flujos.mjs` | (H, L) |

---

## Mapeo escenarios → ADRs → Input Sets

| Escenario | ADR principal | Input Set de verificación | Artefacto de medición |
|-----------|---------------|--------------------------|----------------------|
| BOT-Q1 | [ADR-007 Bot](../casos-de-estudio/bot/adr/ADR-007-clasificacion-mensajes-e2.md) | CR1 | `cr-log-bot-to-be.csv` |
| BOT-Q2 | [ADR-001 Bot](../casos-de-estudio/bot/adr/ADR-001-separacion-responsabilidades-flujo.md) | CR2 | `cr-log-bot-to-be.csv` |
| BOT-Q3 | [ADR-005 Bot](../casos-de-estudio/bot/adr/ADR-005-estrategia-autenticacion.md) + [ADR-MF-001](../microframework/adr/ADR-MF-001-gestion-secretos-reg001.md) | — | `validar-flujos.mjs` (REG-001) |
| BOT-Q4 | [ADR-001 Bot](../casos-de-estudio/bot/adr/ADR-001-separacion-responsabilidades-flujo.md) | Set K | `run-log-bot-to-be.csv` + mock-bot DB |
| BOT-Q5 | [ADR-MF-003](../microframework/adr/ADR-MF-003-log-estructurado-reg006.md) + [ADR-006 Bot](../casos-de-estudio/bot/adr/ADR-006-diseno-error-workflow.md) | Set C | `medicion/protocolo-mttd.md` |
| BOT-Q6 | [ADR-005 Bot](../casos-de-estudio/bot/adr/ADR-005-estrategia-autenticacion.md) | Set C, Set D | `run-log-bot-to-be.csv` |
| IOT-Q1 | [ADR-002 IoT](../casos-de-estudio/iot/adr/ADR-002-umbrales-y-vocabulario.md) + [ADR-008 IoT](../casos-de-estudio/iot/adr/ADR-008-normalizacion-e1.md) | CR1 | `cr-log-iot-to-be.csv` |
| IOT-Q2 | [ADR-004 IoT](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md) | CR2 | `cr-log-iot-to-be.csv` |
| IOT-Q3 | [ADR-003 IoT](../casos-de-estudio/iot/adr/ADR-003-idempotencia-sensor-timestamp.md) + [ADR-007 IoT](../casos-de-estudio/iot/adr/ADR-007-timestamp-authority.md) | Set K | `SELECT COUNT(*)` en PostgreSQL |
| IOT-Q4 | [ADR-004 IoT](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md) (retry E4) | Set I | `run-log-iot-to-be.csv` |
| IOT-Q5 | [ADR-004 IoT](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md) | Set I | `run-log-iot-to-be.csv` (duracion_ms) |
| IOT-Q6 | [ADR-MF-001](../microframework/adr/ADR-MF-001-gestion-secretos-reg001.md) + [ADR-001 IoT](../casos-de-estudio/iot/adr/ADR-001-separacion-responsabilidades-pipeline.md) | — | `validar-flujos.mjs` (REG-001) |

---

## Cobertura de atributos ISO 25010

| Atributo ISO 25010 | Sub-característica | Escenarios | REG relacionadas |
|-------------------|-------------------|------------|-----------------|
| Mantenibilidad | Modularidad | BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2 | REG-007, REG-008 |
| Seguridad | Confidencialidad | BOT-Q3, IOT-Q6 | REG-001 |
| Fiabilidad | Madurez | BOT-Q4, IOT-Q3 | REG-005 |
| Fiabilidad | Tolerancia a fallos | IOT-Q4, IOT-Q5 | REG-003, REG-004 |
| Operabilidad | Monitoreabilidad | BOT-Q5 | REG-006 |
| Adecuación funcional | Corrección | BOT-Q6 | REG-009 |

Los 6 escenarios de cada caso cubren las 5 características ISO 25010 que el
micro-framework promete mejorar (Mantenibilidad, Fiabilidad, Seguridad, Operabilidad,
Adecuación funcional), confirmando la cobertura del utility tree.

---

## Referencias

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley.
- Kazman, R. et al. (2000). ATAM: Method for Architecture Evaluation. CMU/SEI-2000-TR-004.
- ISO/IEC 25010:2011. Systems and software quality models.
- `medicion/protocolo-mttd.md` — protocolo de medición MTTD (escenario BOT-Q5)
- `microframework/reglas/reglas-obligatorias.md` — mapeo REG-* → ISO 25010
