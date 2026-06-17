# Reporte de validación estática — Lite v2.0.0

- Generado: 2026-06-17T22:50:26.879Z
- Commit: `202f98542c8d`
- Archivos analizados: 5

## Estado: as-is

| Archivo | Caso | Score | Err | Warn | Info | Nodos | Ciclomática |
|---|---|---|---|---|---|---|---|
| casos-de-estudio/bot/as-is/bot-as-is-ratelimit-demo.json | bot | 14% | 5 | 8 | 0 | 16 | 2 |
| casos-de-estudio/bot/as-is/bot-as-is.json | bot | 14% | 5 | 8 | 0 | 16 | 2 |
| casos-de-estudio/iot/as-is/iot-as-is.json | iot | 43% | 1 | 7 | 0 | 14 | 4 |
| microframework/plantillas/bot-as-is.json | plantilla | 0% | 2 | 2 | 0 | 10 | 3 |
| microframework/plantillas/iot-as-is.json | plantilla | 20% | 0 | 6 | 0 | 6 | 2 |

## Cobertura del micro-framework

- Reglas definidas: 17
- Reglas ejercitadas: 7
- ⚠️ Reglas dormidas (no ejercitadas por ningún flujo): REG-003, REG-007, REG-009, REG-VOC, AP-001, AP-002, AP-003, AP-004, AP-005, AP-006

## Detalle por archivo

### casos-de-estudio/bot/as-is/bot-as-is-ratelimit-demo.json
- Métricas: nodos=16, aristas=16, ciclomática=2, profundidad=13, cohesion=0.813
- Etapas: E1=1 E2=8 E3=4 E4=3 UNK=0
- 🛑 **REG-001** Sin secretos hardcodeados @ "Token Valido?": Secreto literal detectado: Comparación literal de token en IF/Switch
    - evidencia: `"rightValue":"mi-token-secreto-hardcodeado-123"`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Reemplazar literal por credencial n8n o {{$env.VAR_NAME}}
- 🛑 **REG-001** Sin secretos hardcodeados @ "Consultar Historial Usuario": Header HTTP "x-api-key" con valor literal
    - evidencia: `x-api-key: clave-api-externa-hardcodeada-456…`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Header debe usar {{$env.X_API_KEY}}
- 🛑 **REG-001** Sin secretos hardcodeados @ "Crear Ticket": Header HTTP "x-api-key" con valor literal
    - evidencia: `x-api-key: clave-api-externa-hardcodeada-456…`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Header debe usar {{$env.X_API_KEY}}
- 🛑 **REG-001** Sin secretos hardcodeados @ "Notificar Sistema Externo": Header HTTP "x-api-key" con valor literal
    - evidencia: `x-api-key: clave-api-externa-hardcodeada-456…`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Header debe usar {{$env.X_API_KEY}}
- ⚠️ **REG-002** run_id propagado: No se detectó console.log(JSON.stringify(...)) con run_id
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02
- ⚠️ **REG-004** Retry en HTTP @ "Consultar Historial Usuario": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-004** Retry en HTTP @ "Crear Ticket": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-004** Retry en HTTP @ "Notificar Sistema Externo": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- 🛑 **REG-005** Idempotencia en escrituras @ "Guardar Interaccion": INSERT sin ON CONFLICT ni idempotency_key
    - evidencia: `INSERT INTO interacciones_bot (user_id, session_id, categoria, prioridad, ticket_id) VALUES ('{{ $('Clasificar y Preparar Ticket').item.json.user_id }}', '{{ $('Clasificar y Preparar Ticket').item.jso`
    - ISO 25010: reliability, functionalSuitability
    - ATAM: SP-BOT-01, NR-IOT-02
    - fix: Agregar ON CONFLICT (id) DO NOTHING o columna idempotency_key UNIQUE.
- ⚠️ **REG-006** Log estructurado JSON @ "Sanitizar Input": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-006** Log estructurado JSON @ "Verificar Rate Limit": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-006** Log estructurado JSON @ "Clasificar y Preparar Ticket": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-008** Integraciones en E3/E4: Nodos IO en archivo sin convención E3/E4/orquestador: Consultar Historial Usuario, Crear Ticket, Guardar Interaccion, Notificar Sistema Externo
    - ISO 25010: maintainability
    - ATAM: TP-GLOBAL-01

### casos-de-estudio/bot/as-is/bot-as-is.json
- Métricas: nodos=16, aristas=16, ciclomática=2, profundidad=13, cohesion=0.813
- Etapas: E1=1 E2=8 E3=4 E4=3 UNK=0
- 🛑 **REG-001** Sin secretos hardcodeados @ "Token Valido?": Secreto literal detectado: Comparación literal de token en IF/Switch
    - evidencia: `"rightValue":"mi-token-secreto-hardcodeado-123"`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Reemplazar literal por credencial n8n o {{$env.VAR_NAME}}
- 🛑 **REG-001** Sin secretos hardcodeados @ "Consultar Historial Usuario": Header HTTP "x-api-key" con valor literal
    - evidencia: `x-api-key: clave-api-externa-hardcodeada-456…`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Header debe usar {{$env.X_API_KEY}}
- 🛑 **REG-001** Sin secretos hardcodeados @ "Crear Ticket": Header HTTP "x-api-key" con valor literal
    - evidencia: `x-api-key: clave-api-externa-hardcodeada-456…`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Header debe usar {{$env.X_API_KEY}}
- 🛑 **REG-001** Sin secretos hardcodeados @ "Notificar Sistema Externo": Header HTTP "x-api-key" con valor literal
    - evidencia: `x-api-key: clave-api-externa-hardcodeada-456…`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Header debe usar {{$env.X_API_KEY}}
- ⚠️ **REG-002** run_id propagado: No se detectó console.log(JSON.stringify(...)) con run_id
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02
- ⚠️ **REG-004** Retry en HTTP @ "Consultar Historial Usuario": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-004** Retry en HTTP @ "Crear Ticket": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-004** Retry en HTTP @ "Notificar Sistema Externo": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- 🛑 **REG-005** Idempotencia en escrituras @ "Guardar Interaccion": INSERT sin ON CONFLICT ni idempotency_key
    - evidencia: `INSERT INTO interacciones_bot (user_id, session_id, categoria, prioridad, ticket_id) VALUES ('{{ $('Clasificar y Preparar Ticket').item.json.user_id }}', '{{ $('Clasificar y Preparar Ticket').item.jso`
    - ISO 25010: reliability, functionalSuitability
    - ATAM: SP-BOT-01, NR-IOT-02
    - fix: Agregar ON CONFLICT (id) DO NOTHING o columna idempotency_key UNIQUE.
- ⚠️ **REG-006** Log estructurado JSON @ "Sanitizar Input": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-006** Log estructurado JSON @ "Verificar Rate Limit": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-006** Log estructurado JSON @ "Clasificar y Preparar Ticket": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-008** Integraciones en E3/E4: Nodos IO en archivo sin convención E3/E4/orquestador: Consultar Historial Usuario, Crear Ticket, Guardar Interaccion, Notificar Sistema Externo
    - ISO 25010: maintainability
    - ATAM: TP-GLOBAL-01

### casos-de-estudio/iot/as-is/iot-as-is.json
- Métricas: nodos=14, aristas=16, ciclomática=4, profundidad=12, cohesion=0.875
- Etapas: E1=1 E2=8 E3=3 E4=2 UNK=0
- ⚠️ **REG-004** Retry en HTTP @ "Guardar en InfluxDB": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-004** Retry en HTTP @ "Enviar Notificacion": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- 🛑 **REG-005** Idempotencia en escrituras @ "Persistir en PostgreSQL": INSERT sin ON CONFLICT ni idempotency_key
    - evidencia: `INSERT INTO lecturas_sensor (sensor_id, temperatura, humedad, co2, nivel, location, ts)
VALUES ('{{ $('Determinar Nivel Final').item.json.sensor_id }}',
        {{ $('Determinar Nivel Final').item.jso`
    - ISO 25010: reliability, functionalSuitability
    - ATAM: SP-BOT-01, NR-IOT-02
    - fix: Agregar ON CONFLICT (id) DO NOTHING o columna idempotency_key UNIQUE.
- ⚠️ **REG-006** Log estructurado JSON @ "Verificar Campos Basicos": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-006** Log estructurado JSON @ "Normalizar Lecturas": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-006** Log estructurado JSON @ "Determinar Nivel Final": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-006** Log estructurado JSON @ "Log Resultado": Log JSON sin campos: status
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
- ⚠️ **REG-008** Integraciones en E3/E4: Nodos IO en archivo sin convención E3/E4/orquestador: Guardar en InfluxDB, Persistir en PostgreSQL, Enviar Notificacion
    - ISO 25010: maintainability
    - ATAM: TP-GLOBAL-01

### microframework/plantillas/bot-as-is.json
- Métricas: nodos=10, aristas=11, ciclomática=3, profundidad=5, cohesion=0.909
- Etapas: E1=1 E2=6 E3=1 E4=2 UNK=0
- 🛑 **REG-001** Sin secretos hardcodeados @ "Token Valido?": Secreto literal detectado: Comparación literal de token en IF/Switch
    - evidencia: `"rightValue":"mi-token-secreto-hardcodeado-123"`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Reemplazar literal por credencial n8n o {{$env.VAR_NAME}}
- 🛑 **REG-001** Sin secretos hardcodeados @ "Notificar Sistema Externo": Header HTTP "x-api-key" con valor literal
    - evidencia: `x-api-key: clave-api-externa-hardcodeada-456…`
    - ISO 25010: security, maintainability
    - ATAM: R-BOT-01
    - fix: Header debe usar {{$env.X_API_KEY}}
- ⚠️ **REG-004** Retry en HTTP @ "Notificar Sistema Externo": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-008** Integraciones en E3/E4: Nodos IO en archivo sin convención E3/E4/orquestador: Notificar Sistema Externo
    - ISO 25010: maintainability
    - ATAM: TP-GLOBAL-01

### microframework/plantillas/iot-as-is.json
- Métricas: nodos=6, aristas=6, ciclomática=2, profundidad=4, cohesion=1
- Etapas: E1=1 E2=2 E3=2 E4=1 UNK=0
- ⚠️ **REG-002** run_id propagado: Ningún nodo Code referencia run_id
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02
    - fix: Generar run_id en E1 con crypto.randomUUID() y propagarlo en el payload.
- ⚠️ **REG-002** run_id propagado: No se detectó console.log(JSON.stringify(...)) con run_id
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02
- ⚠️ **REG-004** Retry en HTTP @ "Guardar en InfluxDB": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-004** Retry en HTTP @ "Enviar Notificacion": Nodo HTTP sin retry habilitado
    - evidencia: `options.retry.enabled = false`
    - ISO 25010: reliability, performanceEfficiency
    - ATAM: TP-IOT-01
    - fix: options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }
- ⚠️ **REG-006** Log estructurado JSON @ "Procesar y Detectar Alerta": Nodo Code sin console.log(JSON.stringify(...))
    - ISO 25010: maintainability, reliability
    - ATAM: SP-BOT-02, R-GLOBAL-01
    - fix: console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));
- ⚠️ **REG-008** Integraciones en E3/E4: Nodos IO en archivo sin convención E3/E4/orquestador: Guardar en InfluxDB, Enviar Notificacion
    - ISO 25010: maintainability
    - ATAM: TP-GLOBAL-01
