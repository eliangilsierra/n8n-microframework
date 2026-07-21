> 🌐 **Language / Idioma:** English · [Español](sustentacion-plantillas-referencia.md)

# Reference Template Justification — Bot and IoT Case Studies

**Project:** LC/NC micro-framework for n8n with Clean Architecture and DevSecOps
**Author:** Elian Hernando Gil Sierra
**Program:** Master's in Software Management, Application and Development — UNAB
**Date:** March 2026

---

## 1. Context and justification of the approach

This project's case studies are instances deliberately constructed to represent typical,
documented n8n usage patterns in real production environments. This approach is
methodologically valid in applied software engineering research under the as-is vs to-be
quasi-experimental design, where the goal is not to replicate specific third-party flows
but to build controlled cases exhibiting the same architectural patterns that the
literature and the platform's ecosystem document as common.

The selection and adaptation of reference templates follows three criteria: representativeness
of the architectural pattern, public and verifiable availability in the official n8n
repository, and compatibility with a local execution environment with no paid external
dependencies.

---

## 2. Note on usage metrics in the official n8n repository

The official n8n template repository (`n8n.io/workflows`) does not publicly expose download,
install, or usage counters per template in its web interface or public API
(`api.n8n.io/templates`). The platform does record these metrics internally but does not
publish them per individual template. This limitation is acknowledged and mitigated with the
following alternative adoption evidence:

- Number of templates available in the official repository: more than 8,900 at the time of
  consultation (March 2026), evidencing an active community of creators and users.
- Indirect popularity signals: search-result ranking within the repository, last-updated
  date, and presence in collections curated by n8n.
- Ecosystem adoption evidence: n8n reports more than 100 million Docker downloads and an
  active global user base (n8n-io, GitHub, 2025). The bot and IoT pipeline patterns are the
  most cited use cases in official documentation, the n8n blog, and industry analysis
  (Medium — Reliable Data Engineering, January 2026).
- Academic and industry references documenting the patterns as recurrent in LC/NC
  environments (Ajimati et al., 2025; Binzer et al., 2024).

---

## 3. Reference templates — Bot case

### BOT-REF-01: Bitrix24 Chatbot with Webhook Integration

| Field | Detail |
|---|---|
| ID | 2923 |
| URL | https://n8n.io/workflows/2923-bitrix24-chatbot-application-workflow-example-with-webhook-integration |
| Author | Ferenc Erb (fefehun) |
| Official category | Support Chatbot |
| Last updated | March 2026 |
| Main nodes | Webhook, Function, HTTP Request, If, Respond to Webhook |

**Pattern it represents:** Receiving messages via webhook, authentication token validation,
event-type routing via If nodes, response to external integration. It is the base pattern
for the bot as-is case: business logic mixed with integration, no layer separation, with
credentials directly in the node configuration.

**Relevance to the project:** Evidence that the webhook → authentication → routing →
response pattern exists and is used in production. The absence of separation between
validation, domain, and integration is exactly the antipattern the micro-framework resolves
in the to-be.

---

### BOT-REF-02: Multi-LLM Customer Support Chatbot for WordPress & Webhook Integrations

| Field | Detail |
|---|---|
| ID | 8062 |
| URL | https://n8n.io/workflows/8062-multi-llm-customer-support-chatbot-for-wordpress-and-webhook-integrations |
| Official category | Support Chatbot / AI |
| Main nodes | Webhook, AI Agent, If, Simple Memory, Respond to Webhook |

**Pattern it represents:** Webhook as entry point, processing with conditional logic (If
node to detect conversation end), structured response. Shows the linear-flow pattern with
no separate subflows, with all logic in a single workflow.

**Relevance to the project:** Documents that the support-chatbot pattern with conditional
validation and single response is standard in the n8n community. The lack of modularization
(everything in one flow) reflects the as-is state the project evaluates.

---

### BOT-REF-03: IT Department Q&A Workflow (Slack Bot)

| Field | Detail |
|---|---|
| URL | https://n8n.io/workflows/?node=n8n-nodes-base.respondToWebhook |
| Main nodes | Webhook, If (Check if Bot), Set, Respond to Webhook |

**Pattern it represents:** Webhook verification, sender validation (bot vs human),
conditional response. Documents the pattern of input validation as an If node directly in
the main flow, with no encapsulation into a separate subflow.

**Relevance to the project:** Evidence of the embedded-validation-in-the-orchestrator-flow
antipattern, which is the as-is starting point and what the micro-framework fixes by
separating validation into Stage 1.

---

### BOT-REF-04: Json String Validator via Webhook

| Field | Detail |
|---|---|
| ID | 4704 |
| URL | https://n8n.io/workflows/4704-json-string-validator-via-webhook |
| Main nodes | Webhook, Code, If, Respond to Webhook |

**Pattern it represents:** JSON payload validation in a Code node mixed with the main flow,
error or success response with no layered structure. The template itself suggests, as an
improvement, separating validation into an independent subflow, which directly validates
the micro-framework's argument.

**Relevance to the project:** Explicitly documents in its description that separation of
responsibilities is a desirable improvement not implemented in the base version, which is
this project's central argument.

---

### BOT-REF-05: Bitrix24 Chatbot (awesome-n8n-templates repository)

| Field | Detail |
|---|---|
| URL | https://github.com/enescingoz/awesome-n8n-templates |
| Context | Collection with 280+ community n8n templates |
| Main nodes | Webhook, Function, HTTP Request, If |

**Pattern it represents:** Bot implementation with webhook and routing logic mixed into
Function nodes, with no separation of responsibilities. The repository documents this
pattern as "example workflow for creating a chatbot with webhook integration", confirming
it is a representative case of how these flows are built without architectural guidelines.

**Relevance to the project:** A community repository with more than 280 flows documenting
real construction patterns. This pattern's presence in a community-curated collection
reinforces its representativeness.

---

## 4. Reference templates — IoT case

### IOT-REF-01: Clean and Log IoT Sensor Data to InfluxDB

| Field | Detail |
|---|---|
| ID | 7248 |
| URL | https://n8n.io/workflows/7248-clean-and-log-iot-sensor-data-to-influxdb-webhook-or-function-or-http |
| Author | WeblineIndia |
| Official category | Engineering / Multimodal AI |
| Last updated | February 2026 |
| Main nodes | Webhook, Function, Set, HTTP Request (InfluxDB) |

**Pattern it represents:** Complete IoT ingestion pipeline: webhook receipt, validation and
transformation in a Function node, configuration in a Set node (with visible credentials),
persistence to InfluxDB via HTTP Request. It is the base pattern for the IoT as-is case:
validation, transformation, and persistence stages mixed into a single flow with no layer
separation.

**Relevance to the project:** The template most directly aligned with the IoT case. It
documents exactly the pipeline the project evaluates: ingestion → validation/transformation
→ persistence. The InfluxDB credentials configured in the Set node are the security
antipattern the micro-framework's DevSecOps checklist must detect and fix in the to-be.

---

### IOT-REF-02: Remote IoT Sensor Monitoring via MQTT and InfluxDB

| Field | Detail |
|---|---|
| ID | 4004 |
| URL | https://n8n.io/workflows/4004-remote-iot-sensor-monitoring-via-mqtt-and-influxdb |
| Author | Tony Duffy (tduffy) |
| Official category | Engineering |
| Last updated | March 2026 |
| Main nodes | MQTT Trigger, Code, HTTP Request (InfluxDB) |

**Pattern it represents:** Minimal ad-hoc pipeline: MQTT trigger, a Code node parsing the
payload with no range validation, direct HTTP Request to InfluxDB with no error handling or
notifications. It is the crudest, most representative as-is state: no validation, no
alerts, no traceability, with the InfluxDB URL and token directly in the HTTP Request node
configuration.

**Relevance to the project:** Documents the most basic and common IoT pipeline pattern in
n8n. The extreme simplicity and absence of any architectural structure make this flow a
perfect as-is for analysis. The MQTT → Code → HTTP pattern is the one the community
replicates most frequently in low-code environments with no guidelines.

---

### IOT-REF-03: IoT Sensor Monitoring with GPT-4o Anomaly Detection, MQTT & Multi-Channel Alerts

| Field | Detail |
|---|---|
| ID | 11909 |
| URL | https://n8n.io/workflows/11909-iot-sensor-monitoring-with-gpt-4o-anomaly-detection-mqtt-and-multi-channel-alerts |
| Author | TOMOMITSU ASANO (tomo-0310) |
| Official category | Engineering / AI Summarization |
| Last updated | January 2026 |
| Main nodes | MQTT Trigger, Schedule Trigger, Merge, Set, Switch, Gmail, Slack, Google Sheets |

**Pattern it represents:** Advanced IoT pipeline with labeled sections: Ingestion,
Normalization & Deduplication, AI Analysis, Routing & Archiving. Documents the pattern of
severity-based routing with a Switch node (Critical → Email+Slack, Warning → Slack) and
logging to Google Sheets.

**Relevance to the project:** Although it has external dependencies that make it directly
unviable for the local environment, it is the most important reference for the IoT to-be
design. Severity-based routing and labeled sections are exactly the patterns the
micro-framework introduces as an architectural improvement. The template's sections
(Ingestion, Normalization, Analysis, Alerting) correspond directly to the stages of the
proposed metamodel.

---

### IOT-REF-04: Database Activity Monitoring with PostgreSQL and Twilio SMS

| Field | Detail |
|---|---|
| URL | https://blog.n8n.io/database-activity-monitoring |
| Source | Official n8n blog |
| Main nodes | Cron, Function (data generation), PostgreSQL, If, Twilio SMS |

**Pattern it represents:** Two complementary workflows: one that generates sensor data and
inserts it into a database, and another that monitors thresholds and triggers SMS alerts.
Documents the pattern of separating ingestion and monitoring into two distinct flows, and
threshold-based conditional notification.

**Relevance to the project:** Published on n8n's official blog as an engineering use case,
giving it institutional credibility. The proposed database schema (`sensor_id`, `value`,
`time_stamp`, `notification`) is practically identical to the project's IoT case data
contract, validating the case study's representativeness.

---

### IOT-REF-05: Building Real-Time Data Pipelines with n8n

| Field | Detail |
|---|---|
| URL | https://www.wednesday.is/writing-articles/building-real-time-data-pipelines-with-n8n |
| Source | Wednesday Solutions — technical reference article |
| Documented patterns | Webhook-to-stream, schema validation, deduplication, dead-letter, idempotency |

**Pattern it represents:** Reference architecture for real-time data pipelines with n8n.
Documents patterns such as webhook-to-stream, schema validation on ingestion, invalid-event
quarantine, exponential-backoff retries, dead-letter topics, and idempotency.

**Relevance to the project:** The most complete technical source documenting the
architectural patterns the micro-framework proposes for the IoT to-be. The concepts of
separating ingestion from processing, idempotency, and timestamp-based observability are
directly cited as best practices for n8n pipelines, technically underpinning the
micro-framework's rules.

---

## 5. Relationship between reference templates and project templates

### Bot case

| Project template | Pattern taken from | Adaptations made |
|---|---|---|
| BOT-AS-IS | BOT-REF-01, BOT-REF-03, BOT-REF-04 | Removed Bitrix24 dependency; external integration replaced by a local HTTP mock; hardcoded token in an If node to represent the security antipattern; entire flow in a single workflow with no subflows |
| BOT-TO-BE (next phase) | BOT-REF-02 (conditional structure) | Separated into subflows via Execute Workflow; token moved to n8n credentials; transversal structured log; standardized error handling |

### IoT case

| Project template | Pattern taken from | Adaptations made |
|---|---|---|
| IOT-AS-IS | IOT-REF-01, IOT-REF-02 | InfluxDB credentials exposed in a Code node to represent the antipattern; validation and transformation mixed into a single Code node; no error handling; direct notification with no severity routing |
| IOT-TO-BE (next phase) | IOT-REF-03 (severity routing), IOT-REF-05 (pipeline patterns) | Separated into per-stage subflows; credentials in n8n's manager; range validation in a dedicated subflow; severity routing with Switch; per-run structured log |

---

## 6. Methodological validity argument

Building representative case studies by adapting existing templates is a standard
methodological practice in applied software engineering research. The approach follows the
principles of quasi-experimental case-study research design (Yin, 2018), where internal
validity depends on the case's representativeness relative to the phenomenon studied, not
on the case being taken directly from a real production context.

The five reference templates per case document that:

1. The implemented functional patterns (webhook support bot, IoT ingestion-validation-
   persistence-notification pipeline) exist and are used in production on the n8n platform.
2. The architectural antipatterns represented in the as-is (exposed credentials, mixed
   logic, absence of separation of responsibilities, non-standardized error handling) are
   common and documented as recurring problems in ungoverned LC/NC flows.
3. The to-be's architectural patterns (layer separation, severity routing, idempotency,
   structured log) are documented as best practices in recognized technical sources of the
   n8n ecosystem.

These three conditions, combined with the academic literature cited in the thesis
proposal's theoretical framework, constitute the complete justification of the case studies
as representative, methodologically valid instances for the proposed analysis.

---

## 7. References

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
