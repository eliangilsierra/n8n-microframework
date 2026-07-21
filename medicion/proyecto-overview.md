# Proyecto: overview completo

## Título

Análisis y diseño de un micro-framework LC/NC para n8n con arquitecturas limpias y DevSecOps: evaluación ATAM y diseño de arquitectura en AWS.

## Objetivo general

Desarrollar un micro-framework para soluciones Low-Code/No-Code en n8n, fundamentado en principios de Clean Architecture y prácticas DevSecOps, que permita estructurar y evaluar arquitecturas de software mediante la comparación de diseños as-is y to-be usando ATAM, analizar su impacto en atributos de calidad como mantenibilidad, trazabilidad, seguridad y confiabilidad, y orientar el diseño de arquitecturas costo-eficientes y escalables en AWS.

## Objetivos específicos

**OE1:** Definir un marco arquitectónico para flujos Low-Code/No-Code en n8n, basado en principios de arquitectura limpia, que relacione atributos de calidad con decisiones de diseño, reglas de organización, patrones y criterios de buenas prácticas.

**OE2:** Sistematizar el uso del marco arquitectónico en dos casos de estudio representativos, documentando arquitecturas as-is y to-be con diagramas claros, registro de decisiones (ADR) y una matriz de trazabilidad entre requerimientos, decisiones y atributos de calidad.

**OE3:** Implementar un protocolo de evaluación arquitectónica basado en ATAM que permita analizar y comparar impactos, riesgos y compromisos de diseño entre las arquitecturas as-is y to-be de los casos de estudio seleccionados.

**OE4:** Proponer un diseño de arquitectura en AWS, costo-eficiente y escalable, alineado con el micro-framework, que describa opciones de despliegue, puntos de escalado, controles de seguridad, observabilidad y operación para soportar adopción y evolución en entornos productivos.

## Metodología

El estudio adopta un **enfoque de investigación mixta con secuencia explicativa**: primero evidencia cuantitativa operativa (indicadores comparables entre as-is y to-be), luego explicación cualitativa basada en arquitectura y documentación (ATAM, ADR, matriz de trazabilidad y checklists).

El diseño de investigación es **cuasi-experimental bajo un esquema de comparación as-is vs to-be** aplicado a dos casos de estudio. Las condiciones de ejecución se mantienen controladas y replicables (misma versión de n8n, misma configuración, mismas entradas sintéticas).

### Fases del proyecto

| Fase | Nombre | Período |
|------|--------|---------|
| 0 | Alistamiento del entorno | Mar 2026 |
| 1 | Especificación de casos y datos sintéticos | Mar 2026 |
| 2 | Construcción del estado as-is | Mar–Abr 2026 |
| 3 | Diseño del micro-framework v1.0 | Abr 2026 |
| 4 | Construcción del estado to-be | May 2026 |
| 5 | Prueba piloto de instrumentos | Jun 2026 |
| 6 | Medición comparativa | Jun–Jul 2026 |
| 7 | Evaluación ATAM | Jul 2026 |
| 8 | Diseño de arquitectura AWS | Jul 2026 |
| 9 | Guía de buenas prácticas y cierre | Ago 2026 |

## Casos de estudio

La muestra se compone de dos casos de estudio representativos definidos intencionalmente:

### Caso Bot — Chatbot de soporte

**Patrón que representa:** Automatización de interacción conversacional con validación de autenticación, clasificación de mensajes por reglas de negocio y persistencia de tickets.

**Funcionalidad mínima:**
- Recibe mensaje por webhook HTTP POST
- Valida token de autenticación
- Clasifica el mensaje en categorías: incidente, facturación, soporte técnico, saludo, general
- Determina prioridad: alta, media, baja
- Persiste ticket en servicio externo
- Responde al cliente con mensaje clasificado

**Plantillas de referencia del repositorio oficial n8n:**
- ID 2923: Bitrix24 chatbot application workflow example with webhook integration
- ID 8062: Multi-LLM customer support chatbot for WordPress & webhook integrations
- ID 10040: Create a complete user authentication system with PostgreSQL & webhooks
- ID 4704: Json string validator via webhook
- ID 3144: Auto-retry engine: error recovery workflow

### Caso IoT — Pipeline de sensores

**Patrón que representa:** Ingesta, validación, transformación, persistencia y notificación de datos de sensores con detección de anomalías por umbrales.

**Funcionalidad mínima:**
- Recibe lectura de sensor por webhook HTTP POST (temperatura, humedad, CO2, sensor_id, timestamp)
- Valida campos obligatorios y rangos físicamente posibles
- Normaliza los datos (redondeo, formato de timestamp)
- Analiza lectura contra umbrales para detectar anomalías
- Clasifica nivel de alerta: normal, warning, crítico
- Persiste en PostgreSQL local con control de idempotencia (ON CONFLICT DO NOTHING)
- Notifica por canal diferenciado según nivel (crítico vs warning)

**Plantillas de referencia del repositorio oficial n8n:**
- ID 7248: Clean and log IoT sensor data to InfluxDB
- ID 4004: Remote IoT sensor monitoring via MQTT and InfluxDB
- ID 11909: IoT sensor monitoring with GPT-4o anomaly detection, MQTT & multi-channel alerts
- ID 4407: n8n Workflow Error Alerts with Google Sheets, Telegram, and Gmail
- ID 2556: Exponential backoff for Google APIs

## Métricas de evaluación

### Dimensión: Entrega

| Métrica | Definición | Fuente | Unidad |
|---------|-----------|--------|--------|
| Tiempo de cambio | Minutos desde inicio CR hasta cumplimiento de pruebas + checklist + commit | CR Log + commit hash | Minutos por CR |
| Impacto de cambio | Número de nodos/subflujos modificados por CR | Diff export + revisión manual | Conteo |
| Acoplamiento práctico | Número de dependencias externas afectadas por CR | Checklist técnico CR | Conteo |
| Re-trabajo | Número de intentos hasta pasar pruebas y checklist | Bitácora + commits | Conteo |

### Dimensión: Operación

| Métrica | Definición | Fuente | Unidad |
|---------|-----------|--------|--------|
| Ejecuciones fallidas | Fallos / N corridas por Input Set | Run Log (status + error_type) | % fallos |
| Latencia tramo clave | Tiempo entre timestamp inicio-fin por tramo | Logs estructurados | ms / mediana / p95 |
| Micro benchmark | Tiempo de respuesta bajo carga controlada | JMeter + logs | ms + tasa error |

### Dimensión: Seguridad

| Métrica | Definición | Fuente | Unidad |
|---------|-----------|--------|--------|
| Exposición secretos | Presencia de secretos en nodos/export/log | Checklist + revisión export | 0 / 1 |
| Mínimo privilegio | Integraciones con permisos estrictamente necesarios | Checklist + config simulada | 0 / 1 |
| Superficie código | Número de nodos con ejecución de código | Inventario flujo | Conteo |

### Dimensión: Trazabilidad

| Métrica | Definición | Fuente | Unidad |
|---------|-----------|--------|--------|
| Cobertura ADR | ADR creados / decisiones esperadas × 100 | Lista decisiones vs ADR | % |
| Cobertura ATAM | Escenarios con evidencia trazable / escenarios priorizados × 100 | Matriz escenario-evidencia | % |
| Cobertura checklist | Ítems cumplidos / total × 100 | Checklist binario | % |
| MTTD (diagnóstico) | Tiempo desde el timestamp de fallo hasta identificar la causa raíz usando el log estructurado | Log estructurado + bitácora de diagnóstico | Segundos / minutos |
| Ratio reuso de subflujos | Subflujos invocados por más de un orquestador / total de subflujos del caso | Inventario de flujos + referencias `Execute Workflow` | % |

Las dos últimas métricas (MTTD y Ratio de reuso) corresponden a la Tabla 1 del
anteproyecto (§4.4, Operabilidad y Reusabilidad según ISO/IEC 25010) y se capturan a
partir de los mismos artefactos que las demás métricas, sin instrumentos adicionales.

---

## Mapeo a ISO/IEC 25010

El anteproyecto fundamenta la evaluación de calidad en ISO/IEC 25010 (§4.4, Tabla 1).
Las dimensiones operativas del proyecto (Entrega, Operación, Seguridad, Trazabilidad)
se relacionan con las características ISO así:

| Característica ISO/IEC 25010 | Sub-característica | Dimensión operativa del proyecto | Métricas que la evidencian |
|---|---|---|---|
| Mantenibilidad | Modularidad | Entrega | Tiempo de cambio, Impacto de cambio, Acoplamiento práctico, Re-trabajo |
| Mantenibilidad | Reusabilidad | Entrega / Operación | Ratio reuso de subflujos |
| Mantenibilidad | Analizabilidad | Trazabilidad | Cobertura ADR, Cobertura ATAM, Cobertura checklist |
| Fiabilidad | Tolerancia a fallos | Operación | Ejecuciones fallidas, resultado de patrones de retry/idempotencia |
| Fiabilidad | Recuperabilidad | Operación | Ejecuciones fallidas + `error_type` en run-log |
| Seguridad | Confidencialidad | Seguridad | Exposición de secretos |
| Seguridad | Integridad | Seguridad | Mínimo privilegio, Superficie de código |
| Eficiencia de desempeño | Comportamiento temporal | Operación | Latencia tramo clave, Micro benchmark |
| Operabilidad | Capacidad de ser monitoreado | Trazabilidad / Operación | MTTD (diagnóstico), logs estructurados por etapa |

Este mapeo permite que cada regla del micro-framework (REG-001…REG-010) y cada escenario
ATAM Top-K se conecten explícitamente con una característica ISO medible.

### Change Requests estándar

**CR1 — Regla de negocio:** Modificación de una condición o regla de decisión (umbral, priorización, mapeo de estados).

**CR2 — Integración:** Cambio de endpoint, proveedor o parámetros de integración; incluye cambio de credencial simulada.

**CR3 — Validación y manejo de error:** Incorporación o ajuste de validación de entradas/salidas y comportamiento ante fallos.

Un cambio se considera hecho cuando:
- Pasa el set de pruebas definido para el caso
- El flujo queda exportado y versionado en el repositorio
- Cumple el checklist mínimo aplicable
- Queda registrado el commit hash y la evidencia del resultado

### Metas orientativas de evaluación

- Impacto de cambio: reducción ≥ 20% en to-be vs as-is (nodos tocados por CR)
- Confiabilidad: reducción ≥ 30% en fallos durante N ejecuciones controladas
- Cumplimiento checklist: ≥ 90% en to-be
- Cobertura ATAM: ≥ 80% de los 6 escenarios top-K por caso con evidencia trazable

## Input Sets sintéticos

Cada caso tiene tres Input Sets (A, B, C) que se usan en todas las corridas para garantizar comparabilidad.

> **Adenda FASE 2 — Ampliación de la matriz experimental (ADR-004 Bot):** la matriz
> de Input Sets se amplió de 3 (A, B, C) a 10 (A–E estáticos + F, G, I, J, K dinámicos)
> para cubrir antipatrones que los 3 sets originales no hacían medibles (idempotencia,
> boundary values, percentiles extremos, degradación). Los 3 sets A–C originales se
> conservan idénticos. La justificación formal está en
> `casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.md` (aplica a ambos casos).

### Bot — Input Sets

**Input Set A — Caso normal:**
```json
{ "token": "mi-token-secreto-hardcodeado-123", "user_id": "user-001", "session_id": "sess-a01", "message": "Hola, necesito ayuda con mi factura del mes pasado" }
```

**Input Set B — Caso urgente:**
```json
{ "token": "mi-token-secreto-hardcodeado-123", "user_id": "user-002", "session_id": "sess-b01", "message": "Tengo un error critico en el sistema de pagos, es urgente" }
```

**Input Set C — Caso inválido (token ausente):**
```json
{ "user_id": "user-003", "session_id": "sess-c01", "message": "Consulta sin token" }
```

### IoT — Input Sets

**Input Set A — Lectura normal:**
```json
{ "sensor_id": "SENSOR-001", "temperature": 22.5, "humidity": 55.0, "co2": 450, "timestamp": "2026-03-15T10:00:00Z", "location": "sala-principal" }
```

**Input Set B — Lectura crítica:**
```json
{ "sensor_id": "SENSOR-002", "temperature": 48.3, "humidity": 92.0, "co2": 2100, "timestamp": "2026-03-15T10:01:00Z", "location": "cuarto-servidores" }
```

**Input Set C — Lectura inválida (campo faltante):**
```json
{ "temperature": 25.0, "humidity": 60.0, "timestamp": "2026-03-15T10:02:00Z" }
```

## Resultados esperados

**R1:** Marco arquitectónico LC/NC para n8n (micro-framework v1.0) con reglas, metamodelo y guía de revisión.

**R2:** Diseños comparativos de dos casos (as-is y to-be) con documentación completa de decisiones (ADR, matrices de trazabilidad, logs, métricas).

**R3:** Diseño de arquitectura en AWS costo-eficiente y escalable alineado con el micro-framework.

**R4:** Protocolo e informe ATAM para evaluar arquitectura en LC/NC comparando as-is vs to-be.

**R5:** Guía práctica de buenas prácticas para n8n orientada a calidad, operación y adopción gradual del micro-framework.

**R6:** Documento final del trabajo de grado.

## Limitaciones declaradas del estudio

- Solo dos casos de estudio: no permite generalización estadística.
- Único investigador implementa as-is y to-be: sesgo de implementación controlado con CR predefinidos y checklists binarios.
- ATAM sin panel real de stakeholders: ejecutado de forma analítica con el director como segundo evaluador en sesiones clave.
- Diseño AWS sin despliegue productivo: es un diseño de referencia con estimación de costos, no un despliegue real.
- Entorno de laboratorio local: los resultados de latencia no son extrapolables directamente a entornos productivos.
