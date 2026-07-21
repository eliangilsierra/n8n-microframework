> 🌐 **Language / Idioma:** English · [Español](justificacion-casos-de-estudio.md)

# Justification of the case study selection

**Version:** 1.0
**Date:** 2026-05-01
**Author:** Elian Hernando Gil Sierra
**Purpose:** Academically support the representativeness of the Bot and IoT cases within
the LC/NC problem space in n8n.

---

## 1. Taxonomy of LC/NC patterns in n8n

The official n8n repository hosts more than 8,900 public templates (2026). Based on the
analysis of the most downloaded and officially documented templates, four pattern
categories are identified:

| Category | Description | Typical examples |
|-----------|-------------|-----------------|
| **Webhook-reactive** | Flow triggered by HTTP POST; processes and responds in real time | Chatbots, validators, notifiers |
| **Scheduled-batch** | Flow triggered by cron; processes data batches periodically | Nightly ETL, reports, synchronization |
| **Event-driven pipeline** | Flow triggered by an external event (webhook or queue); transforms and persists data | IoT sensors, payment webhooks, CI/CD webhooks |
| **Hybrid orchestration** | Master flow coordinating multiple subflows or external flows | Multi-step business processes, RPA |

Each category is characterized by four orthogonal dimensions:

| Dimension | Webhook-reactive | Scheduled-batch | Event-driven pipeline | Hybrid orchestration |
|-----------|-----------------|-----------------|----------------------|---------------------|
| Data source | Human / HTTP client | Internal system / DB | Machine / sensor | Multiple sources |
| Response time | Real time (< 2 s) | Deferred (minutes-hours) | Real time / near-real-time | Variable |
| State persistence | No own state | State in DB / files | State in DB / time series | Distributed state |
| Flow direction | Human → System | System → System | Machine → System | Orchestrated |

---

## 2. Position of Bot and IoT in the taxonomy

### Bot case — Support chatbot

- **Category:** Webhook-reactive
- **Data source:** Human (user message)
- **Response time:** Real time (response on the same HTTP connection)
- **State persistence:** No own state in the flow (tickets are persisted in an external service)
- **Flow direction:** Human → System

### IoT case — Sensor pipeline

- **Category:** Event-driven pipeline
- **Data source:** Machine (simulated physical sensor)
- **Response time:** Near-real-time (200/422 response on the same connection; asynchronous notification)
- **State persistence:** State persisted in local PostgreSQL with idempotency
- **Flow direction:** Machine → System

### Dimension comparison

| Dimension | Bot | IoT | Differ? |
|-----------|-----|-----|-----------|
| Data source | Human | Machine/sensor | ✓ Yes |
| Data domain | Unstructured text | Numeric with physical ranges | ✓ Yes |
| Persistence | Tickets in external service | Readings in local DB | ✓ Yes |
| Notification | Inline in HTTP response | Channel differentiated by severity | ✓ Yes |
| Idempotency | By `run_id` (operation) | By natural key `{sensor_id, timestamp}` | ✓ Yes |
| Main category | Webhook-reactive | Event-driven pipeline | ✓ Yes |

Both cases share HTTP webhook triggering (same platform, same input mechanism) but differ
on **every other relevant dimension**. This guarantees orthogonal coverage of the problem
space within n8n's most frequent category.

---

## 3. Justification of representativeness

### Methodological framework

Yin (2018), in *Case Study Research and Applications*, establishes that a multiple-case
design can follow **literal replication** logic (cases produce similar results) or
**theoretical replication** logic (cases produce contrasting results for predictable
reasons). This study adopts **theoretical replication**:

- Both cases implement the same micro-framework (E1–E4, REG-001…010).
- Differences in domain, persistence, and notification predict differences in the concrete
  application of each rule (e.g., the idempotency key in IoT is the data's natural
  identity, while in Bot it is the operation's identifier).
- These differences are what make the micro-framework evaluable under varied conditions,
  strengthening the external validity (transferability) of the findings.

### Representativeness in the n8n ecosystem

The selected reference templates (see `microframework/plantillas/sustentacion-plantillas-referencia.md`)
confirm that:

1. The **bot/chatbot with webhook** pattern is one of the most frequent in the official
   repository (templates ID 2923, 8062, 10040 — combined, they exceed 50,000 documented
   uses).
2. The **IoT/sensor pipeline** pattern is the second most frequent in the real-time data
   domain (templates ID 7248, 4004, 11909).

Choosing these two patterns as case studies is backed by their verifiable prevalence in the
ecosystem, which maximizes the practical applicability of the findings.

### Antipattern coverage

The 9 antipatterns documented in `microframework/antipatrones.md` (REG-001…009) are
observable in both as-is cases, though with different manifestations:

| Antipattern | Manifestation in Bot | Manifestation in IoT |
|------------|---------------------|---------------------|
| REG-001 (credentials) | Hardcoded authentication token | Hardcoded PostgreSQL credentials |
| REG-002 (run_id) | No run_id in any node | No run_id in any node |
| REG-005 (idempotency) | INSERT without ON CONFLICT on tickets | 2 INSERTs without ON CONFLICT |
| REG-007 (domain) | Classification + IO in the same node | Scattered thresholds in integration nodes |
| REG-009 (HTTP codes) | Always 200, even with an invalid token | Always 200, even with missing fields |

This cross-coverage confirms that the two cases are sufficient to fully evaluate the
micro-framework.

---

## 4. Generalization limits

As stated in the thesis proposal (§6 Limitations):

- The two cases **do not allow statistical generalization** to every possible n8n flow.
- Findings are **transferable by structural similarity** (*pattern matching*): a new flow
  with characteristics similar to Bot or IoT can adopt the micro-framework with reasonable
  confidence in the results.
- Flows in the **Scheduled-batch** and **Hybrid orchestration** categories are not directly
  covered; their evaluation would require additional cases.
- The local lab environment limits extrapolating latency metrics to production environments
  with real load.

---

## 5. References

- Yin, R.K. (2018). *Case Study Research and Applications: Design and Methods* (6th ed.). SAGE Publications.
- n8n GmbH (2026). Official n8n template repository. https://n8n.io/workflows/
- `microframework/plantillas/sustentacion-plantillas-referencia.md` — detailed analysis of the 10 reference templates
- `../medicion/proyecto-overview.en.md` §Case studies — functional description of Bot and IoT
