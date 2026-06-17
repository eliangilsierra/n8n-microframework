# Reporte de validación estática — Lite v2.0.0

- Generado: 2026-06-17T22:50:28.369Z
- Commit: `202f98542c8d`
- Archivos analizados: 18

## Estado: to-be

| Archivo | Caso | Score | Err | Warn | Info | Nodos | Ciclomática |
|---|---|---|---|---|---|---|---|
| casos-de-estudio/bot/to-be/bot-to-be-e2-dominio.json | bot | 100% | 0 | 0 | 0 | 2 | 1 |
| casos-de-estudio/bot/to-be/bot-to-be-e3-adaptador.json | bot | 86% | 0 | 1 | 0 | 4 | 1 |
| casos-de-estudio/bot/to-be/bot-to-be-orquestador.json | bot | 100% | 0 | 0 | 0 | 11 | 1 |
| casos-de-estudio/iot/to-be/iot-error-handler.json | iot | 100% | 0 | 0 | 0 | 4 | 1 |
| casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json | iot | 100% | 0 | 0 | 0 | 2 | 1 |
| casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json | iot | 100% | 0 | 0 | 0 | 2 | 1 |
| casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json | iot | 100% | 0 | 0 | 0 | 4 | 1 |
| casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json | iot | 86% | 0 | 1 | 0 | 8 | 2 |
| casos-de-estudio/iot/to-be/iot-to-be-orquestador.json | iot | 100% | 0 | 0 | 0 | 8 | 1 |
| microframework/plantillas/bot-error-handler.json | plantilla | 80% | 0 | 1 | 0 | 3 | 1 |
| microframework/plantillas/bot-to-be-e2-dominio.json | plantilla | 100% | 0 | 0 | 0 | 2 | 1 |
| microframework/plantillas/bot-to-be-e3-adaptador.json | plantilla | 80% | 0 | 1 | 0 | 4 | 1 |
| microframework/plantillas/bot-to-be-orquestador.json | plantilla | 100% | 0 | 0 | 0 | 11 | 1 |
| microframework/plantillas/iot-to-be-e1-validacion.json | plantilla | 100% | 0 | 0 | 0 | 2 | 1 |
| microframework/plantillas/iot-to-be-e2-dominio.json | plantilla | 100% | 0 | 0 | 0 | 2 | 1 |
| microframework/plantillas/iot-to-be-e3-persistencia.json | plantilla | 100% | 0 | 0 | 0 | 4 | 1 |
| microframework/plantillas/iot-to-be-e4-notificacion.json | plantilla | 100% | 0 | 0 | 0 | 7 | 2 |
| microframework/plantillas/iot-to-be-orquestador.json | plantilla | 75% | 0 | 4 | 0 | 8 | 1 |

## Cobertura del micro-framework

- Reglas definidas: 17
- Reglas ejercitadas: 12
- ⚠️ Reglas dormidas (no ejercitadas por ningún flujo): AP-001, AP-002, AP-003, AP-004, AP-006

## Detalle por archivo

### casos-de-estudio/bot/to-be/bot-to-be-e2-dominio.json
- Métricas: nodos=2, aristas=1, ciclomática=1, profundidad=1, cohesion=1
- Etapas: E1=1 E2=1 E3=0 E4=0 UNK=0
- ✓ Sin findings

### casos-de-estudio/bot/to-be/bot-to-be-e3-adaptador.json
- Métricas: nodos=4, aristas=3, ciclomática=1, profundidad=3, cohesion=0.667
- Etapas: E1=1 E2=0 E3=3 E4=0 UNK=0
- ⚠️ **REG-006** Log estructurado JSON @ "E3 - Preparar payload adaptador": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));

### casos-de-estudio/bot/to-be/bot-to-be-orquestador.json
- Métricas: nodos=11, aristas=10, ciclomática=1, profundidad=6, cohesion=0.6
- Etapas: E1=2 E2=4 E3=1 E4=4 UNK=0
- ✓ Sin findings

### casos-de-estudio/iot/to-be/iot-error-handler.json
- Métricas: nodos=4, aristas=3, ciclomática=1, profundidad=3, cohesion=1
- Etapas: E1=1 E2=1 E3=2 E4=0 UNK=0
- ✓ Sin findings

### casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json
- Métricas: nodos=2, aristas=1, ciclomática=1, profundidad=1, cohesion=1
- Etapas: E1=2 E2=0 E3=0 E4=0 UNK=0
- ✓ Sin findings

### casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json
- Métricas: nodos=2, aristas=1, ciclomática=1, profundidad=1, cohesion=1
- Etapas: E1=1 E2=1 E3=0 E4=0 UNK=0
- ✓ Sin findings

### casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json
- Métricas: nodos=4, aristas=3, ciclomática=1, profundidad=3, cohesion=0.667
- Etapas: E1=1 E2=0 E3=3 E4=0 UNK=0
- ✓ Sin findings

### casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json
- Métricas: nodos=8, aristas=8, ciclomática=2, profundidad=5, cohesion=0.625
- Etapas: E1=1 E2=2 E3=2 E4=3 UNK=0
- ⚠️ **REG-006** Log estructurado JSON @ "E4 - Capturar inicio etapa": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));

### casos-de-estudio/iot/to-be/iot-to-be-orquestador.json
- Métricas: nodos=8, aristas=7, ciclomática=1, profundidad=6, cohesion=0.857
- Etapas: E1=2 E2=2 E3=1 E4=3 UNK=0
- ✓ Sin findings

### microframework/plantillas/bot-error-handler.json
- Métricas: nodos=3, aristas=2, ciclomática=1, profundidad=2, cohesion=1
- Etapas: E1=1 E2=1 E3=1 E4=0 UNK=0
- ⚠️ **REG-004** Retry en HTTP @ "HTTP - Notificar error (mock)": maxRetries=1 < 2
    - evidencia: `options.retry.maxRetries = 1`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: Subir maxRetries a 3 con backoff exponencial.

### microframework/plantillas/bot-to-be-e2-dominio.json
- Métricas: nodos=2, aristas=1, ciclomática=1, profundidad=1, cohesion=1
- Etapas: E1=1 E2=1 E3=0 E4=0 UNK=0
- ✓ Sin findings

### microframework/plantillas/bot-to-be-e3-adaptador.json
- Métricas: nodos=4, aristas=3, ciclomática=1, profundidad=3, cohesion=0.667
- Etapas: E1=1 E2=0 E3=3 E4=0 UNK=0
- ⚠️ **REG-006** Log estructurado JSON @ "E3 - Preparar payload adaptador": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));

### microframework/plantillas/bot-to-be-orquestador.json
- Métricas: nodos=11, aristas=10, ciclomática=1, profundidad=6, cohesion=0.6
- Etapas: E1=2 E2=4 E3=1 E4=4 UNK=0
- ✓ Sin findings

### microframework/plantillas/iot-to-be-e1-validacion.json
- Métricas: nodos=2, aristas=1, ciclomática=1, profundidad=1, cohesion=1
- Etapas: E1=2 E2=0 E3=0 E4=0 UNK=0
- ✓ Sin findings

### microframework/plantillas/iot-to-be-e2-dominio.json
- Métricas: nodos=2, aristas=1, ciclomática=1, profundidad=1, cohesion=1
- Etapas: E1=1 E2=1 E3=0 E4=0 UNK=0
- ✓ Sin findings

### microframework/plantillas/iot-to-be-e3-persistencia.json
- Métricas: nodos=4, aristas=3, ciclomática=1, profundidad=3, cohesion=0.667
- Etapas: E1=1 E2=0 E3=3 E4=0 UNK=0
- ✓ Sin findings

### microframework/plantillas/iot-to-be-e4-notificacion.json
- Métricas: nodos=7, aristas=7, ciclomática=2, profundidad=4, cohesion=0.857
- Etapas: E1=1 E2=2 E3=2 E4=2 UNK=0
- ✓ Sin findings

### microframework/plantillas/iot-to-be-orquestador.json
- Métricas: nodos=8, aristas=7, ciclomática=1, profundidad=6, cohesion=0.857
- Etapas: E1=2 E2=2 E3=1 E4=3 UNK=0
- ⚠️ **AP-005** Hardcoded workflow ID en Execute Workflow @ "Execute - E1 Validacion entrada": Execute Workflow con workflowId no resuelto: "REEMPLAZAR_CON_ID_E1"
    - ISO 25010: maintainability, portability
- ⚠️ **AP-005** Hardcoded workflow ID en Execute Workflow @ "Execute - E2 Dominio y umbrales": Execute Workflow con workflowId no resuelto: "REEMPLAZAR_CON_ID_E2"
    - ISO 25010: maintainability, portability
- ⚠️ **AP-005** Hardcoded workflow ID en Execute Workflow @ "Execute - E3 Persistencia": Execute Workflow con workflowId no resuelto: "REEMPLAZAR_CON_ID_E3"
    - ISO 25010: maintainability, portability
- ⚠️ **AP-005** Hardcoded workflow ID en Execute Workflow @ "Execute - E4 Notificacion": Execute Workflow con workflowId no resuelto: "REEMPLAZAR_CON_ID_E4"
    - ISO 25010: maintainability, portability
