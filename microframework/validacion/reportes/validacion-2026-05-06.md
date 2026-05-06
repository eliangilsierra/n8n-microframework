# Reporte de validación estática de flujos

Fecha: 2026-05-06T03:11:50.541Z
Archivos evaluados: 6

## Estado: to-be

| Archivo | Caso | % | Cumple / Aplica |
|---|---|---|---|
| casos-de-estudio/iot/to-be/iot-error-handler.json | iot | 100% | 7/7 |
| casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json | iot | 100% | 5/5 |
| casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json | iot | 100% | 6/6 |
| casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json | iot | 100% | 7/7 |
| casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json | iot | 100% | 7/7 |
| casos-de-estudio/iot/to-be/iot-to-be-orquestador.json | iot | 100% | 4/4 |

## Detalle por archivo

### casos-de-estudio/iot/to-be/iot-error-handler.json
- ✓ **REG-001** Sin secretos hardcodeados: sin patrones de secretos literales
- ✓ **REG-002** run_id propagado: run_id presente en nodos Code y en log
- – **REG-003** errorWorkflow configurado: N/A (no es orquestador)
- ✓ **REG-004** Retry en HTTP: 1 nodo(s) HTTP con retry >=2
- – **REG-005** Idempotencia en escrituras: N/A (error handler — cada evento de error es único)
- ✓ **REG-006** Log estructurado JSON: log JSON con run_id, etapa, status
- – **REG-007** Dominio aislado: N/A (no es E2)
- ✓ **REG-008** Integraciones en E3/E4: IO ubicado correctamente
- – **REG-009** HTTP status codes: N/A (no orquestador)
- ✓ **REG-010** ADR presente: 8 ADR(s) presentes
- ✓ **REG-VOC** Vocabulario enum nivel (español): vocabulario enum nivel correcto (español)

### casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json
- ✓ **REG-001** Sin secretos hardcodeados: sin patrones de secretos literales
- ✓ **REG-002** run_id propagado: run_id presente en nodos Code y en log
- – **REG-003** errorWorkflow configurado: N/A (no es orquestador)
- – **REG-004** Retry en HTTP: sin nodos HTTP
- – **REG-005** Idempotencia en escrituras: sin nodos Postgres
- ✓ **REG-006** Log estructurado JSON: log JSON con run_id, etapa, status
- – **REG-007** Dominio aislado: N/A (no es E2)
- – **REG-008** Integraciones en E3/E4: sin nodos IO
- – **REG-009** HTTP status codes: N/A (no orquestador)
- ✓ **REG-010** ADR presente: 8 ADR(s) presentes
- ✓ **REG-VOC** Vocabulario enum nivel (español): vocabulario enum nivel correcto (español)

### casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json
- ✓ **REG-001** Sin secretos hardcodeados: sin patrones de secretos literales
- ✓ **REG-002** run_id propagado: run_id presente en nodos Code y en log
- – **REG-003** errorWorkflow configurado: N/A (no es orquestador)
- – **REG-004** Retry en HTTP: sin nodos HTTP
- – **REG-005** Idempotencia en escrituras: sin nodos Postgres
- ✓ **REG-006** Log estructurado JSON: log JSON con run_id, etapa, status
- ✓ **REG-007** Dominio aislado: E2 sin IO externo
- – **REG-008** Integraciones en E3/E4: sin nodos IO
- – **REG-009** HTTP status codes: N/A (no orquestador)
- ✓ **REG-010** ADR presente: 8 ADR(s) presentes
- ✓ **REG-VOC** Vocabulario enum nivel (español): vocabulario enum nivel correcto (español)

### casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json
- ✓ **REG-001** Sin secretos hardcodeados: sin patrones de secretos literales
- ✓ **REG-002** run_id propagado: run_id presente en nodos Code y en log
- – **REG-003** errorWorkflow configurado: N/A (no es orquestador)
- – **REG-004** Retry en HTTP: sin nodos HTTP
- ✓ **REG-005** Idempotencia en escrituras: escrituras con control de idempotencia
- ✓ **REG-006** Log estructurado JSON: log JSON con run_id, etapa, status
- – **REG-007** Dominio aislado: N/A (no es E2)
- ✓ **REG-008** Integraciones en E3/E4: IO ubicado correctamente
- – **REG-009** HTTP status codes: N/A (no orquestador)
- ✓ **REG-010** ADR presente: 8 ADR(s) presentes
- ✓ **REG-VOC** Vocabulario enum nivel (español): vocabulario enum nivel correcto (español)

### casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json
- ✓ **REG-001** Sin secretos hardcodeados: sin patrones de secretos literales
- ✓ **REG-002** run_id propagado: run_id presente en nodos Code y en log
- – **REG-003** errorWorkflow configurado: N/A (no es orquestador)
- ✓ **REG-004** Retry en HTTP: 2 nodo(s) HTTP con retry >=2
- – **REG-005** Idempotencia en escrituras: sin nodos Postgres
- ✓ **REG-006** Log estructurado JSON: log JSON con run_id, etapa, status
- – **REG-007** Dominio aislado: N/A (no es E2)
- ✓ **REG-008** Integraciones en E3/E4: IO ubicado correctamente
- – **REG-009** HTTP status codes: N/A (no orquestador)
- ✓ **REG-010** ADR presente: 8 ADR(s) presentes
- ✓ **REG-VOC** Vocabulario enum nivel (español): vocabulario enum nivel correcto (español)

### casos-de-estudio/iot/to-be/iot-to-be-orquestador.json
- ✓ **REG-001** Sin secretos hardcodeados: sin patrones de secretos literales
- – **REG-002** run_id propagado: N/A (orquestador puro — run_id generado y propagado por subflujo E1)
- ✓ **REG-003** errorWorkflow configurado: settings.errorWorkflow="4GF3XKH6qZRw4i6M"
- – **REG-004** Retry en HTTP: sin nodos HTTP
- – **REG-005** Idempotencia en escrituras: sin nodos Postgres
- – **REG-006** Log estructurado JSON: sin nodos Code
- – **REG-007** Dominio aislado: N/A (no es E2)
- – **REG-008** Integraciones en E3/E4: sin nodos IO
- ✓ **REG-009** HTTP status codes: responseCodes: 422, 200
- ✓ **REG-010** ADR presente: 8 ADR(s) presentes
- – **REG-VOC** Vocabulario enum nivel (español): sin nodos Code
