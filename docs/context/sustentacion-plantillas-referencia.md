# Sustentación de Plantillas de Referencia — Casos de Estudio Bot e IoT

**Proyecto:** Micro-framework LC/NC para n8n con Clean Architecture y DevSecOps  
**Autor:** Elian Hernando Gil Sierra  
**Programa:** Maestría en Gestión, Aplicación y Desarrollo de Software — UNAB  
**Fecha:** Marzo 2026

---

## 1. Contexto y justificación del enfoque

Los casos de estudio de este proyecto son instancias construidas deliberadamente para representar patrones típicos y documentados de uso de n8n en entornos productivos reales. Este enfoque es metodológicamente válido en investigación aplicada de ingeniería de software bajo el diseño cuasi-experimental as-is vs to-be, donde el objetivo no es replicar flujos específicos de terceros sino construir casos controlados que exhiban los mismos patrones arquitectónicos que la literatura y el ecosistema de la plataforma documentan como comunes.

La selección y adaptación de las plantillas de referencia sigue tres criterios: representatividad del patrón arquitectónico, disponibilidad pública y verificable en el repositorio oficial de n8n, y compatibilidad con un entorno de ejecución local sin dependencias externas de pago.

---

## 2. Nota sobre métricas de uso en el repositorio oficial de n8n

El repositorio oficial de plantillas de n8n (`n8n.io/workflows`) no expone públicamente contadores de descargas, installs o usos por plantilla en su interfaz web ni en su API pública (`api.n8n.io/templates`). La plataforma sí registra estas métricas internamente pero no las publica por plantilla individual. Esta limitación es reconocida y se mitiga con las siguientes evidencias alternativas de adopción:

- Número de plantillas disponibles en el repositorio oficial: más de 8.900 al momento de la consulta (marzo 2026), lo que evidencia una comunidad activa de creadores y usuarios.
- Señales indirectas de popularidad: posicionamiento en resultados de búsqueda dentro del repositorio, fecha de última actualización, y presencia en colecciones curadas por n8n.
- Evidencia de adopción del ecosistema: n8n reporta más de 100 millones de descargas de Docker y una base de usuarios global activa (n8n-io, GitHub, 2025). Los patrones de bot y pipeline IoT son los casos de uso más citados en la documentación oficial, el blog de n8n y en análisis de la industria (Medium — Reliable Data Engineering, enero 2026).
- Referencias académicas y de industria que documentan los patrones como recurrentes en entornos LC/NC (Ajimati et al., 2025; Binzer et al., 2024).

---

## 3. Plantillas de referencia — Caso Bot

### BOT-REF-01: Bitrix24 Chatbot with Webhook Integration

| Campo | Detalle |
|---|---|
| ID | 2923 |
| URL | https://n8n.io/workflows/2923-bitrix24-chatbot-application-workflow-example-with-webhook-integration |
| Autor | Ferenc Erb (fefehun) |
| Categoría oficial | Support Chatbot |
| Última actualización | Marzo 2026 |
| Nodos principales | Webhook, Function, HTTP Request, If, Respond to Webhook |

**Patrón que representa:** Recepción de mensajes por webhook, validación de token de autenticación, enrutamiento de tipos de eventos mediante nodos If, respuesta a integración externa. Es el patrón base del caso bot as-is: lógica de negocio mezclada con integración, sin separación de capas, con credenciales en la configuración directa del nodo.

**Relevancia para el proyecto:** Evidencia que el patrón webhook → autenticación → routing → respuesta existe y es usado en producción. La ausencia de separación entre validación, dominio e integración es exactamente el antipatrón que el micro-framework resuelve en el to-be.

---

### BOT-REF-02: Multi-LLM Customer Support Chatbot for WordPress & Webhook Integrations

| Campo | Detalle |
|---|---|
| ID | 8062 |
| URL | https://n8n.io/workflows/8062-multi-llm-customer-support-chatbot-for-wordpress-and-webhook-integrations |
| Categoría oficial | Support Chatbot / AI |
| Nodos principales | Webhook, AI Agent, If, Simple Memory, Respond to Webhook |

**Patrón que representa:** Webhook como punto de entrada, procesamiento con lógica condicional (If node para detectar fin de conversación), respuesta estructurada. Muestra el patrón de flujo lineal sin subflujos separados, con toda la lógica en un único workflow.

**Relevancia para el proyecto:** Documenta que el patrón de chatbot de soporte con validación condicional y respuesta única es estándar en la comunidad n8n. La ausencia de modularización (todo en un flujo) refleja el estado as-is que el proyecto evalúa.

---

### BOT-REF-03: IT Department Q&A Workflow (Slack Bot)

| Campo | Detalle |
|---|---|
| URL | https://n8n.io/workflows/?node=n8n-nodes-base.respondToWebhook |
| Nodos principales | Webhook, If (Check if Bot), Set, Respond to Webhook |

**Patrón que representa:** Verificación de webhook, validación de remitente (bot vs humano), respuesta condicional. Documenta el patrón de validación de entrada como nodo If directamente en el flujo principal, sin encapsulamiento en subflujo separado.

**Relevancia para el proyecto:** Evidencia el antipatrón de validación embebida en el flujo orquestador, que es el punto de partida del as-is y el que el micro-framework corrige separando la validación a la Etapa 1.

---

### BOT-REF-04: Json String Validator via Webhook

| Campo | Detalle |
|---|---|
| ID | 4704 |
| URL | https://n8n.io/workflows/4704-json-string-validator-via-webhook |
| Nodos principales | Webhook, Code, If, Respond to Webhook |

**Patrón que representa:** Validación de payload JSON en un nodo Code mezclado con el flujo principal, respuesta de error o éxito sin estructura de capas. La propia plantilla sugiere como mejora separar la validación en un subflujo independiente, lo que valida directamente el argumento del micro-framework.

**Relevancia para el proyecto:** Documenta explícitamente en su descripción que la separación de responsabilidades es una mejora deseable pero no implementada en la versión base, lo cual es el argumento central del proyecto.

---

### BOT-REF-05: Bitrix24 Chatbot (repositorio awesome-n8n-templates)

| Campo | Detalle |
|---|---|
| URL | https://github.com/enescingoz/awesome-n8n-templates |
| Contexto | Colección con 280+ plantillas comunitarias de n8n |
| Nodos principales | Webhook, Function, HTTP Request, If |

**Patrón que representa:** Implementación de bot con webhook y lógica de routing mezclada en nodos Function, sin separación de responsabilidades. El repositorio documenta este patrón como "example workflow for creating a chatbot with webhook integration", lo cual confirma que es un caso representativo de cómo se construyen estos flujos sin lineamientos arquitectónicos.

**Relevancia para el proyecto:** Repositorio comunitario con más de 280 flujos que documenta patrones de construcción reales. La presencia de este patrón en una colección curada por la comunidad refuerza su representatividad.

---

## 4. Plantillas de referencia — Caso IoT

### IOT-REF-01: Clean and Log IoT Sensor Data to InfluxDB

| Campo | Detalle |
|---|---|
| ID | 7248 |
| URL | https://n8n.io/workflows/7248-clean-and-log-iot-sensor-data-to-influxdb-webhook-or-function-or-http |
| Autor | WeblineIndia |
| Categoría oficial | Engineering / Multimodal AI |
| Última actualización | Febrero 2026 |
| Nodos principales | Webhook, Function, Set, HTTP Request (InfluxDB) |

**Patrón que representa:** Pipeline completo de ingesta IoT: recepción por webhook, validación y transformación en nodo Function, configuración en nodo Set (con credenciales visibles), persistencia en InfluxDB via HTTP Request. Es el patrón base del caso IoT as-is: etapas de validación, transformación y persistencia mezcladas en un único flujo sin separación de capas.

**Relevancia para el proyecto:** Es la plantilla más directamente alineada con el caso IoT. Documenta exactamente el pipeline que el proyecto evalúa: ingesta → validación/transformación → persistencia. Las credenciales de InfluxDB configuradas en el nodo Set son el antipatrón de seguridad que el checklist DevSecOps del micro-framework debe detectar y corregir en el to-be.

---

### IOT-REF-02: Remote IoT Sensor Monitoring via MQTT and InfluxDB

| Campo | Detalle |
|---|---|
| ID | 4004 |
| URL | https://n8n.io/workflows/4004-remote-iot-sensor-monitoring-via-mqtt-and-influxdb |
| Autor | Tony Duffy (tduffy) |
| Categoría oficial | Engineering |
| Última actualización | Marzo 2026 |
| Nodos principales | MQTT Trigger, Code, HTTP Request (InfluxDB) |

**Patrón que representa:** Pipeline mínimo ad-hoc: trigger MQTT, nodo Code para parsear el payload sin validar rangos, HTTP Request directo a InfluxDB sin manejo de errores ni notificaciones. Es el estado as-is más crudo y representativo: sin validación, sin alertas, sin trazabilidad, con la URL y token de InfluxDB en la configuración directa del nodo HTTP Request.

**Relevancia para el proyecto:** Documenta el patrón más básico y común de pipeline IoT en n8n. La simplicidad extrema y la ausencia de cualquier estructura arquitectónica hacen de este flujo un as-is perfecto para el análisis. El patrón MQTT → Code → HTTP es el que la comunidad replica con más frecuencia en entornos de bajo código sin lineamientos.

---

### IOT-REF-03: IoT Sensor Monitoring with GPT-4o Anomaly Detection, MQTT & Multi-Channel Alerts

| Campo | Detalle |
|---|---|
| ID | 11909 |
| URL | https://n8n.io/workflows/11909-iot-sensor-monitoring-with-gpt-4o-anomaly-detection-mqtt-and-multi-channel-alerts |
| Autor | TOMOMITSU ASANO (tomo-0310) |
| Categoría oficial | Engineering / AI Summarization |
| Última actualización | Enero 2026 |
| Nodos principales | MQTT Trigger, Schedule Trigger, Merge, Set, Switch, Gmail, Slack, Google Sheets |

**Patrón que representa:** Pipeline IoT avanzado con secciones etiquetadas: Ingestion, Normalization & Deduplication, AI Analysis, Routing & Archiving. Documenta el patrón de routing por severidad con nodo Switch (Critical → Email+Slack, Warning → Slack) y el logging a Google Sheets.

**Relevancia para el proyecto:** Aunque tiene dependencias externas que lo hacen inviable directamente para el entorno local, es la referencia más importante para el diseño del to-be IoT. El routing por severidad y las secciones etiquetadas son exactamente los patrones que el micro-framework introduce como mejora arquitectónica. Las secciones de la plantilla (Ingestion, Normalization, Analysis, Alerting) corresponden directamente a las etapas del metamodelo propuesto.

---

### IOT-REF-04: Database Activity Monitoring with PostgreSQL and Twilio SMS

| Campo | Detalle |
|---|---|
| URL | https://blog.n8n.io/database-activity-monitoring |
| Fuente | Blog oficial de n8n |
| Nodos principales | Cron, Function (generación de datos), PostgreSQL, If, Twilio SMS |

**Patrón que representa:** Dos workflows complementarios: uno que genera datos de sensores y los inserta en base de datos, y otro que monitorea umbrales y dispara alertas por SMS. Documenta el patrón de separación entre ingesta y monitoreo como dos flujos distintos, y la notificación condicional basada en umbrales.

**Relevancia para el proyecto:** Publicado en el blog oficial de n8n como caso de uso de ingeniería, lo cual le da credibilidad institucional. El esquema de base de datos propuesto (`sensor_id`, `value`, `time_stamp`, `notification`) es prácticamente idéntico al contrato de datos del caso IoT del proyecto, lo que valida la representatividad del caso de estudio.

---

### IOT-REF-05: Building Real-Time Data Pipelines with n8n

| Campo | Detalle |
|---|---|
| URL | https://www.wednesday.is/writing-articles/building-real-time-data-pipelines-with-n8n |
| Fuente | Wednesday Solutions — artículo técnico de referencia |
| Patrones documentados | Webhook-to-stream, validación de esquema, deduplicación, dead-letter, idempotencia |

**Patrón que representa:** Arquitectura de referencia para pipelines de datos en tiempo real con n8n. Documenta patrones como webhook-to-stream, validación de esquema en ingesta, quarantine de eventos inválidos, retries con backoff exponencial, dead-letter topics, e idempotencia.

**Relevancia para el proyecto:** Es la fuente técnica más completa que documenta los patrones arquitectónicos que el micro-framework propone para el to-be IoT. Los conceptos de separación de ingesta y procesamiento, idempotencia, y observabilidad con timestamps están directamente citados como mejores prácticas para pipelines n8n, lo que sustenta técnicamente las reglas del micro-framework.

---

## 5. Relación entre plantillas de referencia y plantillas del proyecto

### Caso Bot

| Plantilla del proyecto | Patrón tomado de | Adaptaciones realizadas |
|---|---|---|
| BOT-AS-IS | BOT-REF-01, BOT-REF-03, BOT-REF-04 | Eliminación de dependencia Bitrix24; integración externa reemplazada por mock local HTTP; token hardcodeado en nodo If para representar el antipatrón de seguridad; todo el flujo en un único workflow sin subflujos |
| BOT-TO-BE (próxima fase) | BOT-REF-02 (estructura condicional) | Separación en subflujos mediante Execute Workflow; token movido a credenciales n8n; log estructurado transversal; manejo de errores estandarizado |

### Caso IoT

| Plantilla del proyecto | Patrón tomado de | Adaptaciones realizadas |
|---|---|---|
| IOT-AS-IS | IOT-REF-01, IOT-REF-02 | Credenciales de InfluxDB expuestas en nodo Code para representar antipatrón; validación y transformación mezcladas en un único nodo Code; sin manejo de errores; notificación directa sin routing por severidad |
| IOT-TO-BE (próxima fase) | IOT-REF-03 (routing por severidad), IOT-REF-05 (patrones de pipeline) | Separación en subflujos por etapa; credenciales en gestor de n8n; validación de rangos en subflujo dedicado; routing por severidad con Switch; log estructurado por corrida |

---

## 6. Argumento metodológico de validez

La construcción de casos de estudio representativos mediante adaptación de plantillas existentes es una práctica metodológica estándar en investigación aplicada de ingeniería de software. El enfoque sigue los principios del diseño de investigación con casos de estudio cuasi-experimental (Yin, 2018) donde la validez interna depende de la representatividad del caso respecto al fenómeno estudiado, no de que el caso sea tomado directamente de un contexto productivo real.

Las cinco plantillas de referencia por caso documentan que:

1. Los patrones funcionales implementados (bot de soporte por webhook, pipeline IoT de ingesta-validación-persistencia-notificación) existen y son usados en producción en la plataforma n8n.
2. Los antipatrones arquitectónicos representados en el as-is (credenciales expuestas, lógica mezclada, ausencia de separación de responsabilidades, manejo de errores no estandarizado) son comunes y documentados como problemas recurrentes en flujos LC/NC sin gobernanza.
3. Los patrones arquitectónicos del to-be (separación por capas, routing por severidad, idempotencia, log estructurado) están documentados como mejores prácticas en fuentes técnicas reconocidas del ecosistema n8n.

Estas tres condiciones, combinadas con la literatura académica citada en el marco teórico del anteproyecto, constituyen la sustentación completa de los casos de estudio como instancias representativas y metodológicamente válidas para el análisis propuesto.

---

## 7. Referencias

- n8n-io. (2025). *n8n workflow automation platform*. GitHub. https://github.com/n8n-io/n8n
- n8n. (2025). *Template library*. https://n8n.io/workflows
- n8n. (2025). *Error handling documentation*. https://docs.n8n.io/flow-logic/error-handling
- n8n. (2025). *Database activity monitoring*. n8n Blog. https://blog.n8n.io/database-activity-monitoring
- Wednesday Solutions. (2025). *Building real-time data pipelines with n8n*. https://www.wednesday.is/writing-articles/building-real-time-data-pipelines-with-n8n
- Contabo. (2026). *10 n8n best practices for reliable workflow automation*. https://contabo.com/blog/10-n8n-best-practices-for-reliable-workflow-automation
- enescingoz. (2025). *awesome-n8n-templates*. GitHub. https://github.com/enescingoz/awesome-n8n-templates
- Ajimati, M. O., Carroll, N., & Maher, M. (2025). Adoption of low-code and no-code development: A systematic literature review. *Journal of Systems and Software*, 222, 112300.
- Binzer, B., Elshan, E., Fürstenau, D., & Winkler, T. J. (2024). Establishing a Low-Code/No-Code-Enabled Citizen Development Strategy. *MIS Quarterly Executive*, 23(3).
- Yin, R. K. (2018). *Case study research and applications: Design and methods* (6th ed.). SAGE Publications.
