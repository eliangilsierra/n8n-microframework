# Reporte de validación estática de flujos

**Fecha:** 2026-05-03T22:04:24.936Z
**Caso:** IoT — estado to-be
**Archivos evaluados:** 6
**Resultado global:** ✅ 100% cumplimiento (36 reglas aplicables / 36 cumplidas)

## Contexto

Reporte generado post-correcciones de FASE 4 (validación y alineación arquitectónica completa).
Cubre 10 commits aplicados entre 2026-05-02 y 2026-05-03 que resolvieron los siguientes hallazgos:

| Hallazgo | Severidad | Commit |
|----------|-----------|--------|
| ADR-002: vocabulario `'warning'` en lugar de `'advertencia'` (E2) | Crítica | Commit 2 |
| ADR-005: `iot-error-handler.json` no existía | Crítica | Commit 5 |
| ADR-006: timestamp no requerido en E1 | Alta | Commit 1 |
| ADR-007: validación de drift no implementada | Alta | Commit 1 |
| ADR-002: umbrales CO2 divergentes (1000/2000 → 800/1200 ppm) | Alta | Commit 2 |
| ADR-004: parámetros retry divergentes con spec | Alta | Commit 7 (docs) |
| ADR-008: normalización timestamp/location/sensor_id incompleta | Media | Commit 1 |
| E2: `regla_aplicada` ausente del output (contrato LSP) | Media | Commit 2 |
| E3: objeto `persistencia` ausente del output (contrato LSP) | Media | Commit 3 |
| E4: `e4_start`/`duracion_ms` ausentes del log | Media | Commit 4 |
| REG-VOC no existía como regla del validador | Nueva regla | Commit 9 |

Regla REG-VOC detecta en nodos Code cualquier uso de valores en inglés para el enum
`nivel` (`'warning'`, `'critical'`, `'normal_ok'`) y tipos de anomalía (`tipo: 'warning'`,
`tipo: 'critical'`). Esta clase de bug era invisible al validador anterior — un flujo
podía producir `nivel = 'warning'` y nunca ser detectado hasta el momento de ejecución.

---

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
- ✓ **REG-003** errorWorkflow configurado: settings.errorWorkflow="iot-error-handler"
- – **REG-004** Retry en HTTP: sin nodos HTTP
- – **REG-005** Idempotencia en escrituras: sin nodos Postgres
- – **REG-006** Log estructurado JSON: sin nodos Code
- – **REG-007** Dominio aislado: N/A (no es E2)
- – **REG-008** Integraciones en E3/E4: sin nodos IO
- ✓ **REG-009** HTTP status codes: responseCodes: 422, 200
- ✓ **REG-010** ADR presente: 8 ADR(s) presentes
- – **REG-VOC** Vocabulario enum nivel (español): sin nodos Code
