> 🌐 **Idioma / Language:** Español · [English](analisis-approaches.en.md)

# Análisis de Approaches Arquitectónicos — Pasos 4 y 6 de ATAM

**Versión:** 1.0
**Fecha:** 2026-05-07
**Autor:** Elian Hernando Gil Sierra
**Marco metodológico:** [`metodologia-atam-adaptada.md`](metodologia-atam-adaptada.md)
**Propósito:** Producir los entregables analíticos correspondientes a los Pasos 4 (Identificar approaches arquitectónicos) y 6 (Analizar approaches identificando SP/TP/R/NR) del método ATAM, sobre las arquitecturas to-be de los dos casos de estudio.

---

## 1. Identificación de approaches arquitectónicos (Paso 4 ATAM)

### 1.1 Definición operativa

Un **approach arquitectónico** en el sentido de ATAM es una decisión, patrón, táctica o estrategia explícita que el arquitecto adopta para satisfacer uno o más atributos de calidad. En este proyecto los approaches están materializados en las reglas obligatorias (REG-001…010), los cinco patrones documentados, las decisiones ADR (19 totales) y los componentes estructurales del metamodelo E1–E4.

El inventario siguiente enumera doce approaches arquitectónicos identificados en el diseño to-be, cada uno con su origen, los atributos ISO/IEC 25010 que pretende satisfacer y los trade-offs conocidos.

### 1.2 Inventario de approaches

#### AP-01 — Separación en cuatro etapas (E1–E4)

**Descripción.** El diseño to-be descompone cada flujo en cuatro etapas funcionales con responsabilidad única: E1 valida entrada, E2 aplica reglas de dominio, E3 ejecuta integraciones con sistemas externos, E4 produce salida o notificación. Cada etapa es un subflujo n8n invocable por `Execute Workflow` y comunica con las demás mediante contratos JSON Schema explícitos.

**Origen.** ADR-001 Bot (separación de responsabilidades del flujo) + ADR-001 IoT (pipeline de 4 etapas). Inspirado en Clean Architecture (Martin, 2017) que separa frameworks/drivers (E1), entities/use cases (E2), interface adapters (E3) y external interfaces (E4).

**Atributos afectados.**
- Mantenibilidad / Modularidad ↑↑ — cada etapa cambia independientemente
- Mantenibilidad / Reusabilidad ↑ — subflujos invocables desde múltiples orquestadores
- Eficiencia / Comportamiento temporal ↓ — overhead de Execute Workflow en n8n (+119–192 % en IoT)

**Reglas asociadas.** REG-007 (dominio aislado), REG-008 (integraciones en E3/E4), REG-010 (orquestación centralizada).

**Escenarios ATAM relacionados.** BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2, IOT-Q5.

**Trade-offs conocidos.** El overhead de latencia introducido por la modularización es significativo en IoT (+119–192 %) y mínimo en Bot (+2–9 %). Está documentado como trade-off aceptado en el ADR-001 IoT por priorizar mantenibilidad sobre latencia, en coherencia con los drivers del anteproyecto.

---

#### AP-02 — Subflujos como unidades de despliegue (Execute Workflow)

**Descripción.** Cada etapa E1–E4 se implementa como un subflujo n8n independiente con su propio ciclo de vida, importable y exportable como JSON aislado. El orquestador los invoca por ID mediante el nodo `Execute Workflow`. Los subflujos pueden ser actualizados sin tocar el orquestador siempre que se preserve el contrato.

**Origen.** ADR-001 Bot e IoT. Pattern equivalente al "Microflow" o "Sub-workflow" recomendado por la propia documentación de n8n para sistemas de complejidad media-alta.

**Atributos afectados.**
- Mantenibilidad / Modularidad ↑↑ — cambios localizados
- Reusabilidad ↑ — un subflujo puede invocarse desde múltiples orquestadores (potencial no realizado en este alcance, pero arquitectónicamente disponible)
- Eficiencia / Comportamiento temporal ↓ — cada `Execute Workflow` cuesta ~30–50 ms en n8n self-hosted

**Reglas asociadas.** REG-010 (orquestación centralizada).

**Escenarios ATAM relacionados.** BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2.

**Trade-offs conocidos.** Mismo trade-off de AP-01: el costo de invocación entre subflujos es el principal contribuidor al overhead de latencia.

---

#### AP-03 — Gestión de secretos via credenciales nativas de n8n

**Descripción.** Ningún token, password, API key ni cadena de conexión aparece como literal en los JSON de los flujos. Toda credencial se referencia por nombre de credencial configurada en n8n, que internamente las cifra en disco y las inyecta en tiempo de ejecución sin exponerlas en los exports.

**Origen.** ADR-MF-001 (gestión de secretos), REG-001.

**Atributos afectados.**
- Seguridad / Confidencialidad ↑↑ — exports auditables sin riesgo
- Mantenibilidad / Operabilidad ↑ — rotación centralizada de credenciales

**Reglas asociadas.** REG-001 (sin secretos en JSON exportado).

**Escenarios ATAM relacionados.** BOT-Q3, IOT-Q6.

**Trade-offs conocidos.** Crea una dependencia operacional: los flujos no se ejecutan en una instancia n8n nueva sin reconfigurar las credenciales. Mitigable con script de provisioning, fuera del alcance.

---

#### AP-04 — Patrón retry con backoff configurable

**Descripción.** Los nodos HTTP de E3 (integraciones) y E4 (notificaciones) declaran `options.retry.enabled = true` con `maxRetries` y `waitBetweenTries` configurados según la criticidad del canal: IoT usa `maxRetries=3` para CRÍTICO y `maxRetries=2` para ADVERTENCIA; Bot usa `maxRetries=2` para integración con servicio de tickets.

**Origen.** ADR-MF-002 (error workflow + retry), patrón `patron-retry.md`, REG-004.

**Atributos afectados.**
- Fiabilidad / Tolerancia a fallos ↑↑ — fallos transitorios de red recuperados automáticamente
- Eficiencia / Comportamiento temporal ↓ — latencia adicional cuando hay retries (evidencia: outlier 30 011 ms en run-log IoT crítico)

**Reglas asociadas.** REG-004 (retry en nodos HTTP).

**Escenarios ATAM relacionados.** IOT-Q4, IOT-Q5, BOT-Q4 (parcial).

**Trade-offs conocidos.** Los reintentos enmascaran fallos persistentes (no transitorios): un servicio caído durante minutos consume tiempo de retry sin recuperación. Mitigado parcialmente por límite de `maxRetries` y por el error workflow (AP-06).

---

#### AP-05 — Patrón idempotencia con clave única

**Descripción.** Las operaciones de escritura usan una clave de idempotencia para evitar duplicidad. IoT calcula `idempotency_key = SHA256(sensor_id + timestamp_normalizado)` en E2 y E3 inserta con `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING`. Bot envía header `Idempotency-Key` derivado de `mensaje_id` al servicio externo de tickets.

**Origen.** ADR-003 IoT (idempotencia sensor+timestamp), ADR-007 IoT (timestamp authority), patrón `patron-idempotencia.md`, REG-005.

**Atributos afectados.**
- Fiabilidad / Madurez ↑↑ — reintentos seguros sin duplicar datos
- Adecuación funcional / Corrección ↑ — el sistema produce el mismo resultado ante el mismo input

**Reglas asociadas.** REG-005 (idempotencia en operaciones de escritura).

**Escenarios ATAM relacionados.** BOT-Q4, IOT-Q3.

**Trade-offs conocidos.** Requiere disponibilidad de un campo único en el dominio del problema. En IoT se resuelve con `sensor_id + timestamp`; en Bot se asume que el servicio externo respeta el header `Idempotency-Key`, lo cual no todos los proveedores garantizan.

---

#### AP-06 — Error workflow con dead-letter

**Descripción.** Cada orquestador to-be declara en `settings.errorWorkflow` un flujo de manejo de errores que se dispara automáticamente ante cualquier excepción no capturada. El error workflow extrae el contexto (nodo fallido, mensaje de error, payload original), emite un log estructurado JSON y, en IoT, inserta el payload en una tabla `lecturas_sensor_dead_letters` para replay manual posterior.

**Origen.** ADR-MF-002, ADR-005 IoT (error workflow con preservación de payload), ADR-006 Bot, patrón `patron-error-boundary.md`, REG-003.

**Atributos afectados.**
- Fiabilidad / Tolerancia a fallos ↑ — fallos no propagan al cliente como 500 silencioso
- Operabilidad / Monitoreabilidad ↑↑ — operador tiene contexto completo del fallo
- Adecuación funcional / Trazabilidad ↑ — no se pierden datos críticos del sensor

**Reglas asociadas.** REG-003 (workflow de error configurado).

**Escenarios ATAM relacionados.** IOT-Q4, BOT-Q5.

**Trade-offs conocidos.** El error workflow del IoT comparte canal de notificación con E4 (mock-iot). Identificado en runtime como **SP-IOT-01** (sección 2). El dead-letter en PostgreSQL es resiliente al fallo de E3 pero asume que la BD está disponible, lo cual no es cierto si E3 falló por caída de la BD.

---

#### AP-07 — Log estructurado JSON por etapa

**Descripción.** Cada etapa (E1, E2, E3, E4) y el error workflow emiten exactamente un `console.log(JSON.stringify({...}))` con campos mínimos definidos en `microframework/guia-observabilidad.md`: `run_id`, `etapa`, `status`, `start_ts`, campos específicos de la etapa, y cuando aplica `errores` y `error_type`. La salida va a stdout del contenedor n8n y es consultable con `docker compose logs n8n | grep '"status":"fail"'`.

**Origen.** ADR-MF-003 (log estructurado JSON), REG-006, REC-004.

**Atributos afectados.**
- Operabilidad / Monitoreabilidad ↑↑ — diagnóstico de fallos sin abrir n8n UI
- Operabilidad / Capacidad de recuperación ↑ — MTTD medido en ~14 segundos vs ~5–10 minutos del as-is

**Reglas asociadas.** REG-006 (log estructurado por etapa).

**Escenarios ATAM relacionados.** BOT-Q5, IOT-Q4 (parcial — observabilidad del error handler).

**Trade-offs conocidos.** Los logs en stdout se pierden si el contenedor se reinicia sin volumen persistente. Mitigación documentada: dead-letter en PostgreSQL para datos críticos. En producción se complementaría con un agregador (CloudWatch, ELK, Loki) — fuera del alcance del proyecto.

---

#### AP-08 — Validación de entrada con JSON Schema en E1

**Descripción.** E1 valida cada request entrante contra un JSON Schema (`microframework/contratos/{caso}-webhook-input.schema.json`) antes de pasarlo a E2. Si el payload no cumple el schema, E1 responde con HTTP 400/422 sin invocar las etapas siguientes. La validación cubre tipos, campos obligatorios, rangos numéricos y patrones de cadena.

**Origen.** ADR-006 IoT (validación schema en E1), ADR-005 Bot (autenticación + validación), REG-009.

**Atributos afectados.**
- Adecuación funcional / Corrección ↑↑ — el sistema no acepta entradas malformadas
- Seguridad / Integridad ↑ — previene side-effects de inputs maliciosos
- Eficiencia / Comportamiento temporal ↑ — rechazos tempranos consumen menos recursos (evidencia: Bot Set C −42 % p50)

**Reglas asociadas.** REG-009 (validación de entrada en E1).

**Escenarios ATAM relacionados.** BOT-Q6, IOT-Q5 (parcial).

**Trade-offs conocidos.** Cambios en el schema requieren versionado coordinado con los clientes que llaman al webhook. Aceptable porque el contrato es público y el versionado se documenta en ADRs.

---

#### AP-09 — Routing diferenciado por nivel de alerta en E4 IoT

**Descripción.** E4 del flujo IoT contiene un nodo IF que dirige el payload a una de dos ramas según el campo `nivel` (calculado en E2): la rama CRÍTICO ejecuta notificación HTTP con `maxRetries=3, waitBetweenTries=2000 ms`; la rama ADVERTENCIA ejecuta notificación HTTP con `maxRetries=2`. Lecturas con `nivel=normal` no notifican.

**Origen.** ADR-004 IoT (routing E4 por severidad).

**Atributos afectados.**
- Fiabilidad / Tolerancia a fallos ↑ (asimétrico) — críticas más resilientes que advertencias
- Eficiencia / Comportamiento temporal ↓ (en crítico) — overhead adicional documentado en TP-IOT-01 (sección 2)

**Reglas asociadas.** REG-008 (routing en E4).

**Escenarios ATAM relacionados.** IOT-Q5 (urgencia diferenciada).

**Trade-offs conocidos.** Tradeoff explícito documentado: la mayor resiliencia del canal crítico introduce +10.8 ms de overhead nominal en latencia de cliente vs advertencia (medido en Set I — `analisis_iot_q5.py`).

---

#### AP-10 — Constantes de dominio centralizadas en E2

**Descripción.** Los umbrales numéricos (temperatura crítica, CO2 advertencia/crítico, humedad advertencia) están definidos como una constante `UMBRALES` al inicio del nodo Code de E2 IoT, en lugar de estar dispersos en nodos IF. Cualquier ajuste de umbrales se hace en una única ubicación.

**Origen.** ADR-002 IoT (umbrales y vocabulario), patrón equivalente a "Named Constants", REG-007, REC-001.

**Atributos afectados.**
- Mantenibilidad / Modificabilidad ↑↑ — CR1 IoT toca 1 nodo vs 6 en as-is (evidencia: cr-log-iot-to-be)
- Trazabilidad / Adecuación funcional ↑ — alineados con ASHRAE 62.1 e ISO 7730 (justificados en ADR-002)

**Reglas asociadas.** REG-007 (lógica de dominio aislada).

**Escenarios ATAM relacionados.** IOT-Q1.

**Trade-offs conocidos.** Cambiar el dominio simulado (almacén ambiental) requiere revisar la constante y producir un nuevo ADR. Aceptable.

---

#### AP-11 — Validación estática automatizada (validar-flujos.mjs)

**Descripción.** Script Node.js ejecutable que recorre todos los JSON de flujos en el repositorio y verifica conformidad con las 10 reglas obligatorias (REG-001…010). Detecta secretos hardcodeados (REG-001), ausencia de error workflow (REG-003), ausencia de retry (REG-004), uso de `console.log` no estructurado (REG-006), etc. Genera reporte Markdown en `microframework/validacion/reportes/`.

**Origen.** Pilar 2 DevSecOps del micro-framework.

**Atributos afectados.**
- Adecuación funcional / Gobernanza ↑↑ — conformidad verificable automáticamente
- Mantenibilidad / Modificabilidad ↑ — protege contra regresiones al editar flujos
- Seguridad / Confidencialidad ↑↑ — detección automática de secretos literales

**Reglas asociadas.** Todas (REG-001 a REG-010 evaluables).

**Escenarios ATAM relacionados.** BOT-Q3, IOT-Q6 (verificación de REG-001 automatizada).

**Trade-offs conocidos.** Falsos positivos posibles si la regex de detección es muy estricta. Aceptable por la trazabilidad que aporta.

---

#### AP-12 — Timestamp authority en E1 IoT

**Descripción.** E1 IoT genera o normaliza el `timestamp` de la lectura usando una "autoridad de tiempo" centralizada (UTC, ISO 8601) en lugar de aceptar el timestamp que el sensor reporta. Si el sensor no envía timestamp, E1 lo genera con `new Date().toISOString()`. Si lo envía, E1 lo valida contra una ventana razonable (no en el futuro, no más antiguo que 24 h).

**Origen.** ADR-007 IoT (timestamp authority).

**Atributos afectados.**
- Adecuación funcional / Corrección ↑↑ — timestamps consistentes
- Fiabilidad / Madurez ↑ — base para idempotencia (AP-05) que depende de timestamp normalizado
- Trazabilidad ↑ — eventos ordenables cronológicamente

**Reglas asociadas.** Ninguna específica (decisión de caso).

**Escenarios ATAM relacionados.** IOT-Q3 (componente para idempotencia).

**Trade-offs conocidos.** Sobrescribir un timestamp del sensor descarta información sobre desfase del reloj del dispositivo. Aceptable en el dominio simulado.

---

### 1.3 Mapa approach × atributo

| # | Approach | Mantenibilidad | Fiabilidad | Seguridad | Operabilidad | Adec. Funcional | Eficiencia |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| AP-01 | Separación E1–E4 | ↑↑ |  |  |  |  | ↓ |
| AP-02 | Subflujos Execute Workflow | ↑↑ |  |  |  |  | ↓ |
| AP-03 | Credenciales n8n |  |  | ↑↑ | ↑ |  |  |
| AP-04 | Retry con backoff |  | ↑↑ |  |  |  | ↓ |
| AP-05 | Idempotencia |  | ↑↑ |  |  | ↑ |  |
| AP-06 | Error workflow + dead-letter |  | ↑ |  | ↑↑ | ↑ |  |
| AP-07 | Log estructurado JSON |  |  |  | ↑↑ |  |  |
| AP-08 | Validación JSON Schema E1 |  |  | ↑ |  | ↑↑ | ↑ |
| AP-09 | Routing diferenciado E4 IoT |  | ↑ |  |  |  | ↓ |
| AP-10 | Constantes en E2 | ↑↑ |  |  |  | ↑ |  |
| AP-11 | Validación estática |  |  | ↑↑ |  | ↑↑ |  |
| AP-12 | Timestamp authority |  | ↑ |  |  | ↑↑ |  |

*Convención: ↑↑ = efecto positivo principal · ↑ = efecto positivo secundario · ↓ = trade-off documentado*

---

## 2. Análisis de approaches: clasificación SP / TP / R / NR (Paso 6 ATAM)

Esta sección clasifica los hallazgos arquitectónicos derivados del análisis de los 12 escenarios del utility tree contra los 12 approaches inventariados. Cada hallazgo se identifica con un código único y se documenta con escenario impactado, approaches relacionados, evidencia y, cuando aplica, mitigación recomendada.

### 2.1 Sensitivity Points (decisiones que afectan principalmente un atributo)

#### SP-BOT-01 — Header Idempotency-Key como única defensa contra duplicidad en BOT-Q4

**Descripción.** La integridad de datos ante reintentos del servicio de tickets (BOT-Q4) depende exclusivamente del header `Idempotency-Key` enviado por E3 al endpoint `/api/tickets`. Si el servicio externo no respeta o no procesa correctamente este header, BOT-Q4 falla en runtime aunque la arquitectura sea correcta.

**Approaches relacionados.** AP-05 (idempotencia).
**Escenario.** BOT-Q4.
**Atributo afectado principalmente.** Fiabilidad / Madurez.
**Evidencia.** ADR-005 Bot, contrato `bot-e3-output.schema.json` (campo `idempotency_key` obligatorio).
**Severidad.** Baja (dentro del alcance del estudio el mock-bot respeta el header).
**Mitigación recomendada en producción.** Acordar contractualmente con el proveedor del servicio el comportamiento del header `Idempotency-Key` y validarlo con tests de integración.

---

#### SP-IOT-01 — Canal del error handler coincide con canal de E4

**Descripción.** El nodo HTTP del error workflow IoT (`iot-error-handler.json`) envía la notificación de error al mismo servicio (`mock-iot:3002`) que originó el fallo de E4. Cuando mock-iot está completamente caído (ECONNREFUSED, no error HTTP), el nodo HTTP del error handler también falla, bloqueando la ejecución del nodo siguiente (inserción en `lecturas_sensor_dead_letters`).

**Approaches relacionados.** AP-06 (error workflow), AP-04 (retry — `neverError: true` no protege errores de conexión).
**Escenario.** IOT-Q4.
**Atributo afectado principalmente.** Operabilidad / Monitoreabilidad.
**Evidencia.** Test runtime 2026-05-07 documentado en `medicion/consolidado/mttd-resultado.md` §IOT-Q4-runtime; ADR-005 IoT consecuencias negativas anticipan este caso.
**Severidad.** Media — afecta solo la notificación, no la persistencia del dato (que está garantizada por NR-IOT-01).
**Mitigación recomendada en producción.** Canal de notificación de errores independiente del canal de negocio (e.g., AWS SNS, email transaccional, tabla PostgreSQL directa con servicio de digest separado).

---

#### SP-BOT-02 — Estructura del log de E1 determina el MTTD de BOT-Q5

**Descripción.** El tiempo de diagnóstico de fallos de autenticación (BOT-Q5) depende directamente de los campos incluidos en el log JSON emitido por E1. Si E1 no incluye `etapa`, `errores[]` y `unauthorized: true`, el operador no puede diagnosticar sin abrir n8n UI, regresando al comportamiento as-is. Cambios en la estructura del log impactan directamente el MTTD.

**Approaches relacionados.** AP-07 (log estructurado), AP-08 (validación E1).
**Escenario.** BOT-Q5.
**Atributo afectado principalmente.** Operabilidad / Monitoreabilidad.
**Evidencia.** `medicion/protocolo-mttd.md`, `medicion/consolidado/mttd-resultado.md`.
**Severidad.** Baja — protegido por REG-006 y por el validador estático que verifica la estructura del log.
**Mitigación recomendada.** Test contractual del schema del log estructurado, ejecutable en CI.

---

### 2.2 Tradeoff Points (decisiones que afectan múltiples atributos en direcciones opuestas)

#### TP-GLOBAL-01 — Modularización con subflujos vs latencia

**Descripción.** La descomposición del flujo en subflujos E1–E4 mejora sustancialmente la modularidad (impacto CR Bot −81 %, IoT −84 %) pero introduce overhead de invocación medible: Bot +2–9 % p50, IoT +119–192 % p50. El trade-off es asimétrico: en Bot el overhead es marginal, en IoT es significativo.

**Approaches relacionados.** AP-01 (separación E1–E4), AP-02 (Execute Workflow).
**Escenarios.** Todos los de mantenibilidad (BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2) afectados positivamente; afecta negativamente percepción de eficiencia (no priorizada como atributo top-K en este proyecto).
**Atributos en tensión.** Mantenibilidad ↑↑ vs Eficiencia ↓.
**Magnitud cuantificada.**
- Bot: −81 % nodos por CR a costa de +9 % p50 en Set A. Trade-off favorable.
- IoT: −84 % nodos por CR a costa de +119 % p50 en Set A. Trade-off discutible — para sistemas con SLA estricto de latencia podría no compensar.
**Evidencia.** `medicion/consolidado/comparacion-2026-05-05.md`, `medicion/consolidado/metricas-derivadas.md`.
**Decisión justificada.** ADR-001 IoT documenta explícitamente que el proyecto prioriza mantenibilidad sobre latencia, en coherencia con los drivers del anteproyecto.
**Mitigación recomendada en producción.** n8n en modo clustered con workers paralelos para reducir el overhead de invocación entre subflujos.

---

#### TP-IOT-01 — Resilencia del canal crítico vs latencia nominal

**Descripción.** El routing diferenciado en E4 IoT asigna `maxRetries=3` al canal CRÍTICO y `maxRetries=2` al canal ADVERTENCIA. La mayor configuración de retry mejora la resiliencia de las alertas críticas (más probabilidad de entrega ante fallos transitorios) a costo de mayor overhead promedio: p50 crítico = 183.2 ms vs p50 advertencia = 172.4 ms (Δ = +10.8 ms, +6.3 %).

**Approaches relacionados.** AP-09 (routing diferenciado), AP-04 (retry).
**Escenario.** IOT-Q5.
**Atributos en tensión.** Fiabilidad (críticas) ↑ vs Eficiencia ↓.
**Magnitud cuantificada.** +10.8 ms p50 nominal · outlier 30 011 ms en crítico confirma que el retry se activa en runtime (evidencia directa de la activación del mecanismo).
**Evidencia.** `medicion/analisis_iot_q5.py`, `medicion/consolidado/metricas-derivadas.md` §IOT-Q5.
**Decisión justificada.** ADR-004 IoT — la priorización de fiabilidad sobre latencia en el canal crítico es coherente con la naturaleza del dominio (alertas de sensores ambientales con consecuencias operacionales).
**Mitigación recomendada.** En sistemas con SLA estricto considerar arquitectura asíncrona con cola dedicada para alertas críticas (e.g., AWS SQS FIFO).

---

#### TP-GLOBAL-02 — Validación E1 estricta vs flexibilidad de integración

**Descripción.** La validación JSON Schema en E1 (AP-08) rechaza con HTTP 400/422 cualquier payload que no cumpla el contrato. Esto mejora la corrección funcional y reduce side-effects (NR-BOT-01) pero introduce rigidez: cambios en los productores de eventos (sensores, clientes) requieren coordinación de versionado del schema.

**Approaches relacionados.** AP-08 (validación schema), AP-12 (timestamp authority).
**Escenarios.** BOT-Q6 (positivo), aplica a cualquier evolución del contrato.
**Atributos en tensión.** Adecuación funcional / Corrección ↑↑ vs Mantenibilidad / Compatibilidad ↓.
**Magnitud cuantificada.** Sin métrica directa; cualitativo.
**Evidencia.** Contratos `microframework/contratos/*.schema.json` versionados, ADR-008 IoT (normalización E1).
**Decisión justificada.** El proyecto explicitamente prioriza la corrección — un sensor con timestamp inválido o un cliente bot sin token no debe ser procesado.
**Mitigación recomendada.** Versionado semántico de schemas + endpoint `/v1`, `/v2`, etc., con deprecation period explícito.

---

### 2.3 Risks (decisiones o ausencias que podrían comprometer un atributo)

#### R-IOT-01 — Dead-letter no insertado si E4 está totalmente caído

**Descripción.** Cuando E4 falla por ECONNREFUSED (no por error HTTP), el nodo HTTP del error handler también falla por la misma razón (SP-IOT-01), bloqueando la ejecución del nodo siguiente que inserta en `lecturas_sensor_dead_letters`. El payload original queda solo en el log JSON de stdout, que es efímero si el contenedor se reinicia.

**Approaches relacionados.** AP-06 (error workflow + dead-letter), AP-04 (retry con `neverError: true`).
**Escenarios impactados.** IOT-Q4 (parcialmente — la lectura sí persiste en E3, pero el dead-letter no captura el contexto del fallo).
**Atributos en riesgo.** Trazabilidad ↓ — contexto del fallo no auditable post-incidente.
**Severidad.** Media — el dato del sensor está seguro (NR-IOT-01) pero el operador pierde información del fallo.
**Probabilidad.** Baja en producción si el canal de notificación tiene SLA alto; alta en este entorno de pruebas porque mock-iot se detiene deliberadamente.
**Evidencia.** Test runtime 2026-05-07 — fila `iot-tobe-Q4-LIVE-0001-43e6e62` en `run-log-iot-to-be.csv`; ADR-005 IoT consecuencias negativas anticipan este caso.
**Mitigación recomendada.**
1. Reordenar el error handler para que el dead-letter en PostgreSQL ocurra **antes** del HTTP de notificación, no después.
2. Canal de notificación independiente del canal de negocio.
3. Configurar `continueOnFail: true` en el nodo HTTP del error handler para que el nodo Postgres se ejecute incluso si el HTTP falla.

---

#### R-BOT-01 — Rotación de tokens fuera del alcance del flujo

**Descripción.** El token de autenticación que E1 valida (`api_source_token`) está almacenado como variable de entorno o credencial n8n y rotarlo requiere intervención manual en la instancia de n8n. El flujo no tiene mecanismo de auto-rotación ni de detección de tokens próximos a expirar.

**Approaches relacionados.** AP-03 (credenciales n8n), AP-08 (validación E1).
**Escenarios impactados.** BOT-Q3 (parcialmente), riesgo operacional general.
**Atributos en riesgo.** Seguridad / Confidencialidad — token comprometido permanece válido hasta rotación manual.
**Severidad.** Media.
**Probabilidad.** Baja en el contexto del proyecto académico; alta en producción real.
**Evidencia.** ADR-005 Bot, ADR-MF-001.
**Mitigación recomendada.** Integración con AWS Secrets Manager o HashiCorp Vault con rotación automática. Fuera del alcance del micro-framework v1.0.

---

#### R-GLOBAL-01 — Pérdida de logs si el contenedor n8n se reinicia sin volumen persistente

**Descripción.** Los logs estructurados emitidos por las etapas vía `console.log` van a stdout del contenedor. Si el contenedor se reinicia sin un volumen persistente o un colector externo (CloudWatch, ELK, Loki), los logs se pierden. El protocolo MTTD asume que `docker compose logs n8n --since 5m` está disponible.

**Approaches relacionados.** AP-07 (log estructurado).
**Escenarios impactados.** BOT-Q5, IOT-Q4 (componente de observabilidad).
**Atributos en riesgo.** Operabilidad / Monitoreabilidad — diagnóstico imposible si los logs se perdieron.
**Severidad.** Media.
**Probabilidad.** Alta en entornos sin discipline operacional; baja con volumen persistente.
**Evidencia.** `medicion/protocolo-mttd.md` §requisitos del entorno.
**Mitigación recomendada.** Integrar agregador de logs (CloudWatch en AWS — diseñado en R3). Documentar como requisito de despliegue productivo.

---

#### R-GLOBAL-02 — Dependencia en respeto del contrato por servicios externos

**Descripción.** Tanto la idempotencia (AP-05) como el routing (AP-09) y la validación (AP-08) asumen que los servicios externos (mock-bot, mock-iot, PostgreSQL) respetan sus contratos. Un cambio no anunciado en el comportamiento de un mock o de un servicio real productivo invalida garantías arquitectónicas.

**Approaches relacionados.** AP-05, AP-09, AP-08.
**Escenarios impactados.** BOT-Q4, IOT-Q3.
**Atributos en riesgo.** Fiabilidad — fallos silenciosos posibles.
**Severidad.** Baja en este proyecto (mocks controlados), alta en producción.
**Probabilidad.** Media.
**Evidencia.** Inferencia arquitectónica; no medible directamente sin contract testing.
**Mitigación recomendada.** Contract testing (Pact, Spring Cloud Contract) en pipeline CI/CD productivo. Fuera del alcance.

---

### 2.4 Non-Risks (decisiones que claramente preservan el atributo)

#### NR-IOT-01 — E3 PostgreSQL es independiente de E4

**Descripción.** La persistencia de la lectura del sensor en PostgreSQL (E3) ocurre **antes** y de forma **independiente** de la notificación a mock-iot (E4). Cualquier fallo o caída de mock-iot no afecta la integridad del dato del sensor, que ya está confirmado en la tabla `lecturas_sensor` con `idempotency_key` único.

**Approaches relacionados.** AP-01 (separación E3/E4), AP-05 (idempotencia con ON CONFLICT).
**Escenarios cubiertos.** IOT-Q4.
**Atributo preservado.** Fiabilidad / Madurez — integridad de datos garantizada.
**Evidencia.** Test runtime 2026-05-07; estructura del orquestador IoT confirma orden E3 → E4; consulta en PostgreSQL post-fallo confirmará persistencia (verificación pendiente en Bloque A.1 del plan).

---

#### NR-BOT-01 — Validación E1 previene side-effects no autorizados

**Descripción.** La validación de autenticación y schema en E1 rechaza requests inválidos con HTTP 401/400/422 **antes** de invocar E2/E3/E4. Esto impide que un token inválido o un payload malformado disparen llamadas al servicio externo de tickets, evitando side-effects no autorizados.

**Approaches relacionados.** AP-08 (validación E1), AP-01 (separación de etapas).
**Escenarios cubiertos.** BOT-Q3 (parcialmente), BOT-Q6.
**Atributo preservado.** Seguridad / Integridad + Adecuación funcional.
**Evidencia.** `run-log-bot-to-be.csv` Set C: 0 % fallos de integración con servicio externo; latencia Set C −42 % (rechazo temprano vs procesamiento completo en as-is).

---

#### NR-IOT-02 — Idempotencia previene duplicidad incluso con reintentos del cliente

**Descripción.** La clave `idempotency_key = SHA256(sensor_id + timestamp_normalizado)` + cláusula `ON CONFLICT DO NOTHING` en E3 garantiza que enviar la misma lectura dos veces (Input Set K) produce exactamente una fila en `lecturas_sensor`. La idempotencia no depende de retries internos sino que es resiliente a duplicados externos también.

**Approaches relacionados.** AP-05 (idempotencia), AP-12 (timestamp authority).
**Escenarios cubiertos.** IOT-Q3.
**Atributo preservado.** Fiabilidad / Madurez + Adecuación funcional / Corrección.
**Evidencia.** `run-log-iot-to-be.csv` Set K: 0 % fallos · consulta SQL en PostgreSQL confirma 1 fila por idempotency_key.

---

#### NR-GLOBAL-01 — Validación estática protege contra regresiones de seguridad

**Descripción.** El script `validar-flujos.mjs` (AP-11) detecta automáticamente la introducción de secretos hardcodeados en cualquier flujo editado. Una modificación accidental que rompa REG-001 es bloqueada en el validador estático antes de llegar a producción.

**Approaches relacionados.** AP-11 (validador estático), AP-03 (credenciales n8n).
**Escenarios cubiertos.** BOT-Q3, IOT-Q6.
**Atributo preservado.** Seguridad / Confidencialidad — defensa en profundidad sobre AP-03.
**Evidencia.** `microframework/validacion/reportes/validacion-2026-05-06.md` confirma 0 secretos detectados en to-be.

---

#### NR-BOT-02 — Contrato HTTP correcto para errores de autenticación

**Descripción.** E1 Bot responde con códigos HTTP correctos según el tipo de error: 401 para token inválido, 400 para payload malformado, 422 para semántica inválida. Esto cumple las convenciones REST y permite que los clientes consumidores reaccionen apropiadamente sin parsear el cuerpo del error.

**Approaches relacionados.** AP-08 (validación E1).
**Escenarios cubiertos.** BOT-Q6.
**Atributo preservado.** Adecuación funcional / Corrección.
**Evidencia.** `run-log-bot-to-be.csv` Sets C y D: 100 % de status HTTP esperados.

---

### 2.5 Matriz consolidada de hallazgos

| ID | Tipo | Escenarios | Approaches | Atributo | Severidad |
|---|---|---|---|---|---|
| SP-BOT-01 | Sensitivity | BOT-Q4 | AP-05 | Fiabilidad | Baja |
| SP-BOT-02 | Sensitivity | BOT-Q5 | AP-07, AP-08 | Operabilidad | Baja |
| SP-IOT-01 | Sensitivity | IOT-Q4 | AP-06, AP-04 | Operabilidad | Media |
| TP-GLOBAL-01 | Tradeoff | BOT-Q1/Q2, IOT-Q1/Q2 | AP-01, AP-02 | Mantenibilidad ↑ vs Eficiencia ↓ | — |
| TP-GLOBAL-02 | Tradeoff | BOT-Q6 + evolutivo | AP-08, AP-12 | Adec. funcional ↑ vs Mantenibilidad ↓ | — |
| TP-IOT-01 | Tradeoff | IOT-Q5 | AP-09, AP-04 | Fiabilidad ↑ vs Eficiencia ↓ | — |
| R-BOT-01 | Risk | BOT-Q3 + general | AP-03 | Seguridad | Media |
| R-IOT-01 | Risk | IOT-Q4 | AP-06, AP-04 | Trazabilidad | Media |
| R-GLOBAL-01 | Risk | BOT-Q5, IOT-Q4 | AP-07 | Operabilidad | Media |
| R-GLOBAL-02 | Risk | BOT-Q4, IOT-Q3 | AP-05, AP-08, AP-09 | Fiabilidad | Baja-Media |
| NR-BOT-01 | Non-risk | BOT-Q3, BOT-Q6 | AP-08, AP-01 | Seguridad + Adec. funcional | — |
| NR-BOT-02 | Non-risk | BOT-Q6 | AP-08 | Adec. funcional | — |
| NR-IOT-01 | Non-risk | IOT-Q4 | AP-01, AP-05 | Fiabilidad | — |
| NR-IOT-02 | Non-risk | IOT-Q3 | AP-05, AP-12 | Fiabilidad | — |
| NR-GLOBAL-01 | Non-risk | BOT-Q3, IOT-Q6 | AP-11, AP-03 | Seguridad | — |

**Totales:** 3 Sensitivity Points · 3 Tradeoff Points · 4 Risks · 5 Non-Risks.

---

## 3. Síntesis interpretativa

El análisis de los 12 approaches arquitectónicos contra los 12 escenarios top-K produce 15 hallazgos formales. La distribución es saludable para un diseño to-be: **5 Non-Risks** confirman que las decisiones clave preservan los atributos priorizados, **3 Tradeoff Points** explícitamente documentados (especialmente TP-GLOBAL-01 sobre subflujos vs latencia) demuestran que el equipo arquitectónico (en este caso, el autor) tomó decisiones informadas sobre los compromisos, y **4 Risks** identificados son todos de severidad baja-media con mitigaciones claras — ninguno bloqueante para la viabilidad del framework.

El hallazgo más relevante para discutir con el panel de expertos en Fase V es **TP-GLOBAL-01** (subflujos vs latencia en IoT con +119–192 %): es el trade-off de mayor magnitud cuantitativa y el más cuestionable desde una perspectiva de SLA productivo. La validación externa puede aportar perspectivas adicionales sobre si la priorización del autor (mantenibilidad sobre latencia) es defendible para distintos contextos de adopción del framework.

Los **3 Sensitivity Points** se concentran en mecanismos de tolerancia a fallos (BOT-Q4 idempotencia externa, IOT-Q4 error handler, BOT-Q5 estructura de log) lo cual es coherente con la naturaleza distribuida de los flujos n8n: las garantías más fuertes del framework dependen de contratos con sistemas externos o de estructuras de log que deben mantenerse estables.

Esta clasificación alimenta directamente:
- La matriz de scoring 1–5 as-is vs to-be (`matriz-scoring.md`)
- El registro consolidado de riesgos y trade-offs (`registro-riesgos-tradeoffs.md`)
- El capítulo 5 y 6 del informe ATAM final (`informe-atam-final.md`)
- La sección de hallazgos preliminares del material de apoyo de la encuesta (`material-apoyo/resumen-proyecto.md`)
