# Registro Consolidado de Riesgos y Trade-offs Arquitectónicos

**Versión:** 1.0
**Fecha:** 2026-05-07
**Insumos:** `docs/atam/analisis-approaches.md` §2, ADRs, evidencia cuantitativa
**Propósito:** Consolidar en un único registro auditable todos los Sensitivity Points, Tradeoff Points y Risks identificados en la evaluación ATAM del to-be, con sus mitigaciones recomendadas y owners potenciales para adopción productiva. Los Non-Risks se omiten aquí por ser positivos (se discuten en el informe principal).

---

## 1. Estructura del registro

Cada entrada del registro incluye los siguientes campos normalizados:

- **ID** — identificador único `[SP|TP|R]-[CASO|GLOBAL]-NN`
- **Tipo** — Sensitivity Point | Tradeoff Point | Risk
- **Título** — descripción corta del hallazgo
- **Escenarios impactados** — IDs del utility tree
- **Approaches relacionados** — AP-NN del inventario de approaches
- **Atributo(s) afectado(s)** — ISO 25010
- **Descripción ampliada**
- **Magnitud / Severidad / Probabilidad** — cualitativa o cuantitativa según disponibilidad
- **Evidencia** — ruta a artefacto del repositorio
- **Mitigación recomendada** — accionable, con horizonte de tiempo
- **Owner sugerido** — para adopción productiva
- **Estado** — Abierto (sin mitigar en este alcance) | Mitigado | Aceptado (trade-off explícito)

---

## 2. Sensitivity Points

### SP-BOT-01 — Header `Idempotency-Key` como única defensa contra duplicidad en tickets

- **Escenarios:** BOT-Q4
- **Approaches:** AP-05
- **Atributo:** Fiabilidad / Madurez
- **Descripción.** La garantía de no-duplicidad en el servicio externo de tickets descansa exclusivamente en que dicho servicio implemente correctamente el header `Idempotency-Key`. Si el proveedor cambia el comportamiento del header o lo deprecia, BOT-Q4 deja de cumplirse aunque la arquitectura del flujo siga siendo correcta.
- **Severidad:** Baja en este proyecto (mock-bot controlado); Media en producción.
- **Probabilidad:** Baja-Media.
- **Evidencia:** ADR-005 Bot; `microframework/contratos/bot-e3-output.schema.json` declara `idempotency_key` como campo obligatorio.
- **Mitigación recomendada (corto plazo):** test de integración en CI que envíe el mismo ticket dos veces y verifique que el servicio responde con 200 OK + mismo ID (idempotencia confirmada en el wire).
- **Mitigación recomendada (mediano plazo):** acuerdo contractual con el proveedor del servicio + tabla local de tickets emitidos con cache de respuesta de N días para defensa adicional.
- **Owner sugerido:** Tech Lead del flujo Bot.
- **Estado:** Aceptado (trade-off explícito con dependencia externa documentada).

---

### SP-BOT-02 — Estructura del log de E1 determina el MTTD de BOT-Q5

- **Escenarios:** BOT-Q5
- **Approaches:** AP-07, AP-08
- **Atributo:** Operabilidad / Monitoreabilidad
- **Descripción.** El MTTD de ~14 segundos depende de que el log JSON emitido por E1 incluya los campos `etapa`, `errores[]` y `unauthorized: true`. Una refactorización descuidada que cambie la estructura del log impacta directamente el MTTD y devuelve BOT-Q5 al comportamiento as-is.
- **Severidad:** Baja.
- **Probabilidad:** Baja (protegida por validador estático + REG-006).
- **Evidencia:** `docs/protocolo-mttd.md`, `medicion/consolidado/mttd-resultado.md`.
- **Mitigación recomendada (corto plazo):** test contractual del schema del log estructurado, ejecutable en pipeline CI antes del merge.
- **Mitigación recomendada (mediano plazo):** definir el schema del log como JSON Schema versionado en `microframework/contratos/log-estructurado-e1.schema.json` y validarlo en runtime en cada deploy.
- **Owner sugerido:** Mantenedor del micro-framework + equipo de observabilidad.
- **Estado:** Mitigado parcialmente (validador estático cubre la regla pero no la estructura interna del log).

---

### SP-IOT-01 — Canal del error handler coincide con canal de E4

- **Escenarios:** IOT-Q4
- **Approaches:** AP-06, AP-04
- **Atributo:** Operabilidad / Monitoreabilidad + Trazabilidad
- **Descripción.** El nodo HTTP del error workflow IoT (`iot-error-handler.json`) notifica a `mock-iot:3002/api/errors`, el mismo servicio que originó el fallo de E4. Ante una caída total de mock-iot (ECONNREFUSED, no error HTTP), el HTTP del error handler también falla — la opción `neverError: true` solo cubre respuestas no-2xx, no errores de conexión. El nodo siguiente (insert en `lecturas_sensor_dead_letters`) queda bloqueado.
- **Severidad:** Media — afecta capacidad de auditoría post-incidente; **no afecta integridad del dato del sensor** (garantizada por NR-IOT-01: E3 PostgreSQL es independiente).
- **Probabilidad:** Baja en producción con canal de notificación SLA-alto; Alta en testing donde se detiene mock-iot deliberadamente.
- **Evidencia:** Test runtime 2026-05-07 — fila `iot-tobe-Q4-LIVE-0001-43e6e62` en `run-log-iot-to-be.csv`; `mttd-resultado.md` §IOT-Q4-runtime; ADR-005 IoT consecuencias negativas anticipan este caso.
- **Mitigación recomendada (corto plazo):** reordenar el error handler para que el nodo Postgres dead-letter se ejecute **antes** del HTTP de notificación; agregar `continueOnFail: true` al HTTP del error handler para que el dead-letter ocurra aun si la notificación falla.
- **Mitigación recomendada (mediano plazo):** canal de notificación independiente del canal de negocio — AWS SNS, email transaccional vía SES, o tabla PostgreSQL con servicio de digest separado consumiendo de ella.
- **Owner sugerido:** Tech Lead del flujo IoT.
- **Estado:** Abierto — mitigación de corto plazo factible en próxima iteración del flujo, no incluida en este alcance.

---

## 3. Tradeoff Points

### TP-GLOBAL-01 — Modularización con subflujos vs latencia de cliente

- **Escenarios:** BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2 (afectados positivamente); afecta percepción de eficiencia (no priorizada como top-K en este proyecto).
- **Approaches:** AP-01, AP-02
- **Atributos en tensión:** Mantenibilidad / Modularidad **↑↑** vs Eficiencia / Comportamiento temporal **↓**
- **Descripción.** La descomposición del flujo en subflujos E1–E4 invocados via `Execute Workflow` mejora la modularidad de forma cuantificable (impacto CR Bot −81 %, IoT −84 %) pero introduce overhead de invocación entre subflujos. La magnitud del trade-off es asimétrica entre los dos casos.

**Datos:**

| Caso | Δ nodos por CR | Δ p50 Set A | Δ p50 Set B | Δ p50 Set C |
|---|:---:|:---:|:---:|:---:|
| Bot | −81 % | +9 % (+11 ms) | +2 % (+2 ms) | −42 % (−27 ms) |
| IoT | −84 % | **+119 %** (+93 ms) | **+134 %** (+104 ms) | +53 % (+23 ms) |

- **Aceptabilidad:** Bot — trade-off favorable; el overhead es marginal y se compensa con la mejora de modularidad. IoT — trade-off discutible para sistemas con SLA estricto de latencia; aceptado en este proyecto por priorización explícita declarada en ADR-001 IoT.
- **Evidencia:** `medicion/consolidado/comparacion-2026-05-05.md`, `medicion/consolidado/metricas-derivadas.md`.
- **Mitigación recomendada (corto plazo):** documentar el trade-off explícitamente en la guía de adopción del framework (R5) para que adoptantes con SLA estricto evalúen conscientemente.
- **Mitigación recomendada (mediano plazo):** n8n en modo clustered con workers paralelos; estudio de impacto de eliminar 1 subflujo intermedio en escenarios donde la separación E2/E3 no aporte valor.
- **Mitigación recomendada (largo plazo):** evaluación de plataformas LC/NC alternativas con menor overhead de invocación entre subflujos.
- **Owner sugerido:** Mantenedor del micro-framework + arquitecto en contexto de adopción.
- **Estado:** Aceptado (trade-off documentado y cuantificado).

---

### TP-GLOBAL-02 — Validación E1 estricta vs flexibilidad de evolución del contrato

- **Escenarios:** BOT-Q6 (positivo); aplica a cualquier escenario evolutivo del contrato no listado en el utility tree.
- **Approaches:** AP-08, AP-12
- **Atributos en tensión:** Adecuación funcional / Corrección **↑↑** vs Mantenibilidad / Compatibilidad **↓**
- **Descripción.** El rechazo estricto en E1 con HTTP 400/422 contra JSON Schema mejora la corrección funcional y reduce side-effects no autorizados (NR-BOT-01), pero introduce rigidez evolutiva: cualquier cambio en el schema requiere coordinación con los productores de eventos (sensores, clientes Bot) y un período de transición.
- **Aceptabilidad:** Aceptado — el proyecto prioriza la corrección sobre la flexibilidad porque el costo de procesar un payload malformado (lectura inválida ingresada a la BD; ticket creado con datos basura) es mayor que el costo de coordinar versionado.
- **Evidencia:** Contratos `microframework/contratos/*.schema.json`, ADR-008 IoT, ADR-006 IoT.
- **Mitigación recomendada (corto plazo):** versionado semántico de schemas con header `X-API-Version` y endpoint `/v1`, `/v2`.
- **Mitigación recomendada (mediano plazo):** período de deprecation explícito (e.g., 90 días) con doble validación (acepta v1 y v2) antes de retirar v1.
- **Owner sugerido:** Owner del contrato del webhook (típicamente Tech Lead del flujo).
- **Estado:** Aceptado.

---

### TP-IOT-01 — Resiliencia del canal crítico vs latencia nominal

- **Escenarios:** IOT-Q5
- **Approaches:** AP-09, AP-04
- **Atributos en tensión:** Fiabilidad / Tolerancia a fallos **↑** (en críticas) vs Eficiencia / Comportamiento temporal **↓**
- **Descripción.** El routing diferenciado en E4 asigna `maxRetries=3, waitBetweenTries=2000 ms` a la rama CRÍTICO y `maxRetries=2` a ADVERTENCIA. La mayor configuración de retry mejora la probabilidad de entrega de alertas críticas ante fallos transitorios, a costo de mayor overhead nominal en latencia.

**Datos:**

| Nivel | p50 ms | p95 ms | max ms | Notas |
|---|:---:|:---:|:---:|---|
| normal | 157.6 | 174.4 | 179.5 | sin notificación |
| advertencia | 172.4 | 202.9 | 215.4 | 1 HTTP con retry=2 |
| **crítico** | **183.2** | **222.0** | **30 011** | 1 HTTP con retry=3; outlier evidencia retry activo |

Δ(crítico − advertencia) = +10.8 ms p50 (+6.3 %).

- **Aceptabilidad:** Aceptado — la priorización de fiabilidad sobre latencia en el canal crítico es coherente con el dominio (alertas ambientales con consecuencias operacionales).
- **Evidencia:** `medicion/analisis_iot_q5.py`, `medicion/consolidado/metricas-derivadas.md` §IOT-Q5.
- **Mitigación recomendada (corto plazo):** ninguna — el trade-off es deseable.
- **Mitigación recomendada (mediano plazo):** en sistemas con SLA estricto de latencia para alertas críticas, considerar arquitectura asíncrona con AWS SQS FIFO o equivalente que desacople la latencia del cliente de la entrega de la alerta.
- **Owner sugerido:** Tech Lead del flujo IoT.
- **Estado:** Aceptado.

---

## 4. Risks

### R-BOT-01 — Rotación de tokens fuera del alcance del flujo

- **Escenarios:** BOT-Q3 (parcialmente), riesgo operacional general.
- **Approaches:** AP-03, AP-08
- **Atributo en riesgo:** Seguridad / Confidencialidad
- **Descripción.** El token `api_source_token` se almacena como variable de entorno o credencial n8n y se rota manualmente. Si el token se compromete (filtración accidental, exposición en log), permanece válido hasta intervención humana. El flujo no detecta tokens próximos a expirar ni soporta rotación sin downtime.
- **Severidad:** Media.
- **Probabilidad:** Baja en el proyecto académico; Alta en producción con tokens de larga vida.
- **Evidencia:** ADR-005 Bot, ADR-MF-001.
- **Mitigación recomendada (corto plazo):** política operacional de rotación periódica documentada en runbook (e.g., trimestral).
- **Mitigación recomendada (mediano plazo):** integración con AWS Secrets Manager o HashiCorp Vault con rotación automática y soporte de "dos tokens válidos simultáneamente" durante ventana de rotación.
- **Mitigación recomendada (largo plazo):** migración a OAuth 2.0 client credentials con tokens de corta duración (15 min) auto-refrescados.
- **Owner sugerido:** Equipo de seguridad + Tech Lead Bot.
- **Estado:** Abierto — fuera del alcance del micro-framework v1.0; se referencia para R3 (diseño AWS) y R5 (guía de buenas prácticas).

---

### R-IOT-01 — Dead-letter no insertado si E4 está totalmente caído

- **Escenarios:** IOT-Q4 (parcialmente — la lectura sí persiste en E3 vía NR-IOT-01, pero el dead-letter no captura el contexto del fallo).
- **Approaches:** AP-06, AP-04
- **Atributo en riesgo:** Trazabilidad — contexto del fallo no auditable post-incidente.
- **Descripción.** Cuando E4 falla por ECONNREFUSED, el nodo HTTP del error handler también falla por SP-IOT-01, bloqueando la inserción en `lecturas_sensor_dead_letters`. El payload original queda solo en el log JSON de stdout, efímero.
- **Severidad:** Media — el dato del sensor está seguro (NR-IOT-01); el operador pierde información del contexto del fallo.
- **Probabilidad:** Baja en producción con canal de notificación SLA-alto; Alta en este entorno de pruebas.
- **Evidencia:** Test runtime 2026-05-07.
- **Mitigación recomendada (corto plazo):** reordenar el error handler (Postgres antes que HTTP) o agregar `continueOnFail: true` al HTTP del error handler.
- **Mitigación recomendada (mediano plazo):** canal de notificación independiente (ver SP-IOT-01 mitigación).
- **Owner sugerido:** Tech Lead IoT.
- **Estado:** Abierto — mitigación de corto plazo planificada para próxima iteración.

---

### R-GLOBAL-01 — Pérdida de logs si el contenedor n8n se reinicia sin volumen persistente

- **Escenarios:** BOT-Q5, IOT-Q4 (componentes de observabilidad).
- **Approaches:** AP-07
- **Atributo en riesgo:** Operabilidad / Monitoreabilidad — diagnóstico imposible si los logs se perdieron.
- **Descripción.** Los logs estructurados emitidos por las etapas vía `console.log` se escriben a stdout del contenedor. Si el contenedor se reinicia sin un volumen persistente ni un colector externo (CloudWatch, ELK, Loki), los logs se pierden. El protocolo MTTD asume disponibilidad de `docker compose logs n8n --since 5m`.
- **Severidad:** Media.
- **Probabilidad:** Alta en entornos sin disciplina operacional; Baja con volumen persistente o agregador.
- **Evidencia:** `docs/protocolo-mttd.md` §requisitos del entorno.
- **Mitigación recomendada (corto plazo):** documentar como requisito de despliegue productivo en la guía de buenas prácticas (R5).
- **Mitigación recomendada (mediano plazo):** integrar agregador de logs (CloudWatch en AWS — diseñado en R3, AWS Architecture).
- **Owner sugerido:** Equipo de operaciones + Mantenedor del micro-framework.
- **Estado:** Abierto — mitigación inherente al diseño productivo (R3).

---

### R-GLOBAL-02 — Dependencia en respeto del contrato por servicios externos

- **Escenarios:** BOT-Q4, IOT-Q3.
- **Approaches:** AP-05, AP-09, AP-08
- **Atributo en riesgo:** Fiabilidad — fallos silenciosos posibles si un servicio externo cambia comportamiento sin anunciar.
- **Descripción.** Las garantías arquitectónicas de idempotencia (AP-05), routing (AP-09) y validación (AP-08) asumen que los servicios externos (mock-bot, mock-iot, PostgreSQL en producción) respetan sus contratos. Una desviación silenciosa invalida las garantías sin que el flujo lo detecte.
- **Severidad:** Baja en proyecto (mocks controlados), Alta en producción.
- **Probabilidad:** Media.
- **Evidencia:** Inferencia arquitectónica; no medible sin contract testing.
- **Mitigación recomendada (corto plazo):** smoke tests post-deploy que verifiquen comportamiento del servicio externo (e.g., enviar mismo idempotency_key dos veces y confirmar comportamiento esperado).
- **Mitigación recomendada (mediano plazo):** contract testing con Pact o Spring Cloud Contract en pipeline CI/CD.
- **Owner sugerido:** Tech Lead de cada flujo + equipo del servicio externo.
- **Estado:** Abierto — fuera del alcance del micro-framework v1.0.

---

## 5. Matriz consolidada del registro

| ID | Tipo | Severidad | Probabilidad | Estado | Owner sugerido |
|---|---|:---:|:---:|---|---|
| SP-BOT-01 | Sensitivity | Baja-Media | Baja-Media | Aceptado | Tech Lead Bot |
| SP-BOT-02 | Sensitivity | Baja | Baja | Mitigado parcialmente | Mantenedor framework |
| SP-IOT-01 | Sensitivity | Media | Variable | Abierto | Tech Lead IoT |
| TP-GLOBAL-01 | Tradeoff | — | — | Aceptado | Mantenedor framework + Arquitecto adoptante |
| TP-GLOBAL-02 | Tradeoff | — | — | Aceptado | Owner del contrato |
| TP-IOT-01 | Tradeoff | — | — | Aceptado | Tech Lead IoT |
| R-BOT-01 | Risk | Media | Baja-Alta | Abierto | Seguridad + Tech Lead Bot |
| R-IOT-01 | Risk | Media | Baja-Alta | Abierto | Tech Lead IoT |
| R-GLOBAL-01 | Risk | Media | Variable | Abierto | Operaciones + Mantenedor |
| R-GLOBAL-02 | Risk | Baja-Alta | Media | Abierto | Tech Leads de flujos |

### 5.1 Resumen por estado

- **Aceptados (trade-offs explícitos):** 5 (SP-BOT-01, los 3 TP, conceptualmente)
- **Mitigados parcialmente:** 1 (SP-BOT-02)
- **Abiertos para próxima iteración o adopción productiva:** 5 (SP-IOT-01, R-BOT-01, R-IOT-01, R-GLOBAL-01, R-GLOBAL-02)

### 5.2 Top 3 prioridades de mitigación de corto plazo

| Prioridad | ID | Acción | Esfuerzo |
|:---:|---|---|:---:|
| **1** | SP-IOT-01 / R-IOT-01 | Reordenar error handler IoT (Postgres antes que HTTP) o agregar `continueOnFail: true` | 1 h |
| **2** | SP-BOT-02 | Definir log-estructurado-e1.schema.json y agregar al validador estático | 4 h |
| **3** | R-GLOBAL-02 | Smoke tests de contrato post-deploy para mock-bot y mock-iot | 4 h |

Estas 3 mitigaciones suman ~9 horas y pueden ejecutarse antes del cierre del proyecto académico si se desea aumentar el score del to-be en BOT-Q4, BOT-Q5 e IOT-Q4 hasta 5. Si se ejecutan se reportan en el informe ATAM final como "mejoras post-evaluación".

---

## 6. Integración con el informe ATAM

Este registro alimenta directamente las secciones 5 y 9 del `informe-atam-final.md`:

- Sección 5 — Análisis de approaches: cada hallazgo aparece con detalle técnico
- Sección 9 — Síntesis: top 5 riesgos y top 3 trade-offs se extraen de este registro

Asimismo, los expertos del mini-ATAM (Sección E del instrumento) tienen oportunidad de identificar hallazgos adicionales que no estén en este registro. Tales hallazgos emergentes se incorporan post-encuesta como anexo "Hallazgos identificados por el panel" en el informe.
