> 🌐 **Language / Idioma:** English · [Español](ADR-MF-006-n8n-queue-mode.md)

# ADR-MF-006: n8n Queue Mode with Redis as the horizontal-scaling mechanism

**Status:** Accepted
**Date:** 2026-05-18
**Case:** Micro-framework (applies to both cases — Bot and IoT)
**Affected quality attribute:** Scalability · Reliability · Operability

---

## Context

n8n in its default configuration ("Main Mode") runs everything in a single process: UI,
REST API, webhook reception, and workflow execution. Under high load, a long-running
workflow (e.g., IOT-Q4 with active retry and latency > 30s) can block the capacity to
receive new webhooks.

The MGADS thesis proposal requires that the AWS design support "adoption and evolution in
production environments", implying the ability to scale workflow execution independently
of the user interface.

n8n provides "Queue Mode" as its official horizontal-scaling mechanism. This mode splits
the process into Main (UI + webhooks + queuing) and Workers (execution from the queue),
communicating via BullMQ over Redis.

---

## Decision

We adopt **n8n Queue Mode with ElastiCache Redis (BullMQ)** as the execution architecture
for the AWS deployment. The system operates with two process types:

1. **n8n-main** (1–2 instances): receives webhooks, manages the UI, queues jobs in Redis.
   Key variables: `EXECUTIONS_MODE=queue`, `QUEUE_BULL_REDIS_HOST`.

2. **n8n-workers** (2–8 instances, auto-scaling): consume jobs from Redis and execute
   complete workflows (E1 → E2 → E3 → E4). Same Docker image as main.
   Key variable: `N8N_WORKER=true` (or the `n8n worker` command).

3. **ElastiCache Redis** (`cache.t3.small`, cluster mode disabled, 1 replica): acts as the
   BullMQ message broker. Does not persist business data.

---

## Alternatives considered

- **Main Mode with replicas (no Queue Mode):** Multiple n8n instances in Main Mode don't
  share execution state. A webhook received by instance A may not be visible on instance
  B. Discarded due to state inconsistency between replicas.

- **PostgreSQL as the queue (no Redis):** n8n supports an experimental queue
  implementation over PostgreSQL, removing the Redis dependency. Discarded because, at the
  time of this design (Q2 2026), this option remains experimental with no production
  support in n8n's official documentation. Redis is the only stably supported option.

- **Event-driven architecture with SQS:** Replace BullMQ with Amazon SQS as the broker.
  Discarded because n8n Queue Mode is specifically designed for BullMQ/Redis; there is no
  native SQS integration without modifying n8n's source code.

---

## Consequences

**Positive:**
- Horizontal scaling of workflow execution with no changes to the n8n flows' code nor to
  the micro-framework's rules (E1-E4 work the same on any worker).
- Interrupted jobs (due to worker failure or Fargate Spot) are automatically resumed by
  BullMQ ("stalled jobs" mechanism with configurable timeout).
- n8n-main can respond to new webhooks in < 50ms while workers execute long-running
  workflows (decoupling queuing from execution).
- Queue depth metrics (`n8n/QueueDepth`) enable reactive worker auto-scaling (see
  `escalabilidad.md §2`).
- The idempotency implemented in E3 (`ON CONFLICT DO NOTHING`) protects against duplicate
  executions if a stalled job is resumed by another worker.

**Negative / trade-offs:**
- Redis is a new infrastructure component that does not exist in the local environment:
  adds ~$17–51/month in cost (Staging/Prod) and an additional point of failure.
- If Redis fails, n8n-main cannot queue new jobs (webhooks return an error to the client).
  Mitigated by ElastiCache in Multi-AZ mode with automatic failover.
- `N8N_ENCRYPTION_KEY` must be identical across all instances (main and workers). Managed
  securely via Secrets Manager, but a key change requires restarting ALL containers
  simultaneously.
- n8n's UI in Queue Mode shows execution status with a polling lag (not real-time as in
  Main Mode). Acceptable for operational use.

---

## Relationship to the micro-framework

- **REG-005** (idempotency): the scenario where a worker fails and BullMQ retries the job
  is covered by `ON CONFLICT (idempotency_key) DO NOTHING` in E3 — data already persisted
  is not duplicated.
- **REG-004** (retry with backoff): BullMQ has configurable retry with exponential backoff,
  complementing the HTTP node's retry within the n8n flow.
- **REG-003** (error workflow): if a workflow fails on the worker, n8n triggers the
  configured error workflow — this mechanism works the same in Queue Mode.
- The **Reliability** pattern demonstrated in IOT-Q3 (integrity under retries) and BOT-Q4
  (idempotency) remains intact in the distributed deployment.
