> 🌐 **Language / Idioma:** English · [Español](arquitectura-aws.md)

# AWS Architecture Design — n8n Micro-framework

**Version:** 1.0
**Date:** 2026-05-18
**Author:** Elian Hernando Gil Sierra
**Deliverable:** R3 — SO4 of the MGADS-UNAB thesis proposal
**Scope:** Reference design — does not imply a production deployment

---

## Table of contents

1. [Context and objectives](#1-contexto-y-objetivos)
2. [Container view — AWS Services](#2-vista-de-contenedores)
3. [Network design — VPC and subnets](#3-diseño-de-red)
4. [Compute layer — ECS Fargate](#4-capa-de-computo)
5. [Data layer — RDS, Redis, and S3](#5-capa-de-datos)
6. [Local architecture → AWS mapping](#6-mapeo-local-aws)
7. [n8n configuration requirements](#7-configuracion-n8n)
8. [Deployment options per tier](#8-opciones-de-despliegue)
9. [ATAM risk resolution](#9-resolucion-riesgos-atam)
10. [References](#10-referencias)

---

## 1. Context and objectives

### 1.1 Problem addressed by this design

The project's local architecture (defined in `infraestructura/docker-compose.yml`) runs n8n on Docker on a single host. This model, valid for the research environment, presents the systemic limitations documented during the ATAM evaluation (Phase 7):

- **R-GLOBAL-01** — Logs to stdout are ephemeral: restarting the container destroys the diagnostic history.
- **R-BOT-01** — API tokens are managed manually with no automatic rotation.
- **R-GLOBAL-02** — Contracts with external services have no circuit breaker or fallback in case of prolonged unavailability.
- **TP-GLOBAL-01** — Latency increases with the E1-E4 modularization; in a single-node environment, subflows compete for the same CPU.

This document describes how an AWS architecture resolves these risks while preserving the micro-framework's principles (E1–E4 separation, REG-001…010).

### 1.2 Design objectives (SO4)

| Objective | How it is addressed |
|---|---|
| Deployment options | 3 tiers (Dev, Staging, Prod) with differentiated services |
| Scaling points | ECS Workers auto-scaling by Redis queue depth |
| Security controls | IAM least privilege, Secrets Manager, KMS, WAF — see `seguridad-iam.md` |
| Observability | CloudWatch Logs (E1-E4 JSON logs), Metrics, Alarms — see `observabilidad-aws.md` |
| Operation | Rolling updates, Blue/Green, automated backup — see `escalabilidad.md` |
| Cost efficiency | Per-tier estimate with optimizations — see `estimacion-costos.md` |

### 1.3 Central architectural decision

**Pattern adopted: ECS Fargate + n8n Queue Mode + RDS PostgreSQL Multi-AZ**

n8n supports two execution modes: *main mode* (all responsibilities in a single process) and *queue mode* (Main for UI/webhooks + decoupled Workers for execution). For a scalable AWS deployment, **queue mode is mandatory**: it allows Workers to scale horizontally without affecting UI and webhook availability.

Technology decisions are documented in the ADRs:
- `ADR-MF-005` — ECS Fargate vs. EC2 vs. EKS
- `ADR-MF-006` — n8n Queue Mode with Redis
- `ADR-MF-007` — RDS PostgreSQL Multi-AZ

---

## 2. Container view — AWS Services

> **Diagram 1** (C4 Context) and **Diagram 2** (C4 Container) — see `diagramas-aws.md` §1 and §2.
> Insert PNG images rendered from `diagramas-aws.md` when incorporating this document into the thesis.

### 2.1 AWS service inventory

| AWS Service | Role in the architecture | Local equivalent |
|---|---|---|
| **Application Load Balancer (ALB)** | HTTPS entry point, terminates TLS, distributes to n8n-main | Port 5678 exposed directly |
| **ECS Fargate — n8n-main** | n8n UI, REST API, webhook reception, job enqueuing to Redis | n8n container in docker-compose |
| **ECS Fargate — n8n-workers** | Workflow execution (E1→E2→E3→E4), scales 2–8 instances | Same n8n container (no separation) |
| **ECS Fargate — mock-bot** | Ticket API (external service simulation) | mock_bot :3001 container |
| **ECS Fargate — mock-iot** | Notification API (external service simulation) | mock_iot :3002 container |
| **Amazon RDS PostgreSQL** | Persistence of n8n executions, `lecturas_sensor`, `interacciones_bot` | postgres :5432 container |
| **Amazon ElastiCache Redis** | BullMQ queue for Queue Mode | Does not exist in the local architecture |
| **Amazon S3** | Binary data of n8n executions (attached files) | `n8n_data` volume |
| **AWS Secrets Manager** | N8N_ENCRYPTION_KEY, DB_PASSWORD, Redis auth, API tokens | `.env` file (local) |
| **AWS Certificate Manager (ACM)** | SSL/TLS certificates with automatic renewal | None (HTTP locally) |
| **Amazon CloudWatch** | Structured JSON logs E1-E4, metrics, alarms | Ephemeral stdout (local) |
| **AWS WAF** | OWASP top-10 protection, rate limiting (optional in Prod) | None |
| **Amazon Route 53** | DNS for the ALB domain | `localhost` |

### 2.2 Justification of excluded services

| Service considered | Reason for exclusion |
|---|---|
| Amazon EKS (Kubernetes) | Operational complexity disproportionate to the project's scale. ECS Fargate is sufficient. |
| AWS Lambda (for n8n) | n8n requires persistent state and a long-lived connection to Redis/RDS; incompatible with Lambda's serverless model. |
| Amazon SQS | n8n Queue Mode uses BullMQ on Redis (not SQS). Migrating would require modifying n8n's core. |
| Amazon EFS | S3 is n8n's official option for external storage (documented in n8n docs). EFS adds cost with no clear benefit. |
| AWS Cognito | n8n authentication is managed internally or via SSO/SAML. Outside the scope of R3. |

---

## 3. Network design — VPC and subnets

> **Diagram 3** (Multi-AZ topology) — see `diagramas-aws.md` §3.

### 3.1 VPC configuration

| Parameter | Value |
|---|---|
| Main CIDR | `10.0.0.0/16` |
| Availability Zones | 2 (us-east-1a, us-east-1b) — minimum for high availability |
| Internet Gateway | 1 (attached to the VPC) |
| NAT Gateways | 2 (one per AZ) — high availability for outbound traffic |
| DNS hostnames | Enabled |
| DNS resolution | Enabled |

### 3.2 Subnets

| Subnet | CIDR | AZ | Type | Use |
|---|---|---|---|---|
| public-subnet-a | `10.0.1.0/24` | us-east-1a | Public | NAT Gateway A, ALB |
| public-subnet-b | `10.0.4.0/24` | us-east-1b | Public | NAT Gateway B, ALB |
| private-subnet-a | `10.0.2.0/24` | us-east-1a | Private | ECS tasks (n8n-main, workers, mocks) |
| private-subnet-b | `10.0.5.0/24` | us-east-1b | Private | ECS tasks (n8n-main, workers, mocks) |
| data-subnet-a | `10.0.3.0/24` | us-east-1a | Private (isolated) | RDS Primary, Redis Primary |
| data-subnet-b | `10.0.6.0/24` | us-east-1b | Private (isolated) | RDS Standby, Redis Replica |

**Design principle:** Data services (RDS, Redis) are placed in isolated subnets with no direct route to the Internet Gateway. Only the application-layer Security Groups have access to the data ports.

### 3.3 Security Groups

| Security Group | Allowed ingress | Egress | Purpose |
|---|---|---|---|
| `alb-sg` | :443 from 0.0.0.0/0 | :5678 → n8n-main-sg | Public ALB |
| `n8n-main-sg` | :5678 from alb-sg | :6379 redis-sg, :5432 rds-sg, :443 any (external HTTPS) | n8n Main |
| `n8n-worker-sg` | No external ingress | :6379 redis-sg, :5432 rds-sg, :443 any | n8n Workers |
| `mock-sg` | :3001/:3002 from n8n-main-sg, n8n-worker-sg | :443 any | Mock services |
| `rds-sg` | :5432 from n8n-main-sg, n8n-worker-sg | No egress | RDS PostgreSQL |
| `redis-sg` | :6379 from n8n-main-sg, n8n-worker-sg | No egress | ElastiCache Redis |

### 3.4 VPC Endpoints (avoid traffic over the internet)

| Service | Endpoint type | Benefit |
|---|---|---|
| `com.amazonaws.us-east-1.secretsmanager` | Interface | n8n reads secrets without going out to the internet |
| `com.amazonaws.us-east-1.s3` | Gateway | S3 traffic with no NAT Gateway charge |
| `com.amazonaws.us-east-1.ecr.api` | Interface | Pulling ECS images without NAT |
| `com.amazonaws.us-east-1.logs` | Interface | CloudWatch Logs without NAT |

---

## 4. Compute layer — ECS Fargate

### 4.1 ECS Cluster

- **Name:** `n8n-microframework-cluster`
- **Type:** AWS Fargate (Serverless — no EC2 instance management)
- **Container Insights:** Enabled (CPU, memory metrics per task)

### 4.2 Task Definitions

#### n8n-main

| Parameter | Value |
|---|---|
| Family | `n8n-main` |
| Launch type | FARGATE |
| CPU | 1024 (1 vCPU) |
| Memory | 2048 MB (2 GB) |
| Image | `n8nio/n8n:latest` (production: fixed image with SHA256 digest) |
| Port | 5678 |
| Health check | `CMD-SHELL curl -f http://localhost:5678/healthz || exit 1` |
| IAM Task Role | `n8n-main-task-role` (see `seguridad-iam.md`) |
| Log driver | `awslogs` → `/ecs/n8n-main` |

Environment variables (value from Secrets Manager, not hardcoded):

```
N8N_HOST                    = n8n.dominio.com
N8N_PORT                    = 5678
N8N_PROTOCOL                = https
WEBHOOK_URL                 = https://n8n.dominio.com/
NODE_ENV                    = production
DB_TYPE                     = postgresdb
DB_POSTGRESDB_HOST          = <RDS endpoint>
DB_POSTGRESDB_PORT          = 5432
DB_POSTGRESDB_DATABASE      = n8n
DB_POSTGRESDB_USER          = n8n_user
DB_POSTGRESDB_PASSWORD      = secretsmanager:n8n/db-password
N8N_ENCRYPTION_KEY          = secretsmanager:n8n/encryption-key
QUEUE_MODE_ACTIVE           = true
QUEUE_BULL_REDIS_HOST       = <ElastiCache endpoint>
QUEUE_BULL_REDIS_PORT       = 6379
QUEUE_BULL_REDIS_PASSWORD   = secretsmanager:n8n/redis-auth-token
QUEUE_BULL_REDIS_TLS        = true
EXECUTIONS_DATA_PRUNE       = true
EXECUTIONS_DATA_MAX_AGE     = 259200
N8N_BLOCK_ENV_ACCESS_IN_NODE = true
LOG_LEVEL                   = info
GENERIC_TIMEZONE            = America/Bogota
```

#### n8n-workers

Same as n8n-main with the following differences:

```
EXECUTIONS_MODE             = queue
# N8N_HOST, WEBHOOK_URL, N8N_PORT are not required on workers
# Workers expose no ports — they have no HTTP listener
```

No exposed port. No HTTP health check (ECS monitors the process directly).

#### mock-bot / mock-iot

| Parameter | Value |
|---|---|
| CPU | 256 (0.25 vCPU) |
| Memory | 512 MB |
| Image | Custom Node.js 20-alpine image (built from the code in `infraestructura/`) |
| Ports | mock-bot: 3001 / mock-iot: 3002 |

### 4.3 ECS Services

| Service | Task Definition | Desired count | Min | Max | Subnets |
|---|---|---|---|---|---|
| `n8n-main-service` | n8n-main | 2 | 1 | 4 | private-a, private-b |
| `n8n-workers-service` | n8n-workers | 2 | 2 | 8 | private-a, private-b |
| `mock-bot-service` | mock-bot | 1 | 1 | 2 | private-a |
| `mock-iot-service` | mock-iot | 1 | 1 | 2 | private-a |

### 4.4 Application Load Balancer

| Parameter | Value |
|---|---|
| Scheme | Internet-facing |
| Type | Application (ALB) |
| Subnets | public-subnet-a, public-subnet-b |
| Security Group | alb-sg |
| Listener | HTTPS :443, ACM certificate |
| Redirect | HTTP :80 → HTTPS :443 (301) |
| Target Group | n8n-main:5678, health check GET /healthz, threshold 2/2 |
| Sticky sessions | Enabled (AWSALB cookie, 1 hour) — required for the n8n UI |

---

## 5. Data layer — RDS, Redis, and S3

### 5.1 Amazon RDS PostgreSQL

| Parameter | Dev/Staging | Production |
|---|---|---|
| Engine | PostgreSQL 16 | PostgreSQL 16 |
| Instance class | db.t3.micro | db.t3.small |
| Multi-AZ | No | **Yes** (failover < 60 s) |
| Storage | gp3, 20 GB | gp3, 100 GB (auto-scaling up to 500 GB) |
| IOPS | 3000 (gp3 baseline) | 3000 (gp3 baseline) |
| Encryption at rest | KMS (AWS managed key) | KMS (Customer managed key) |
| Automated backups | 7 days | 7 days |
| Backup window | 03:00-04:00 UTC | 03:00-04:00 UTC |
| Maintenance window | Sunday 04:00-05:00 UTC | Sunday 04:00-05:00 UTC |
| Parameter group | `log_min_duration_statement=1000` | `log_min_duration_statement=500` |
| Deletion protection | No | **Yes** |
| Performance Insights | No | **Yes** (7-day retention) |

**Initial schema (identical to local):**

```sql
-- IoT persistence (micro-framework E3)
CREATE TABLE lecturas_sensor (
  id                SERIAL PRIMARY KEY,
  idempotency_key   VARCHAR(255) UNIQUE NOT NULL,
  sensor_id         VARCHAR(100),
  temperatura       DECIMAL(5,1),
  humedad           DECIMAL(5,1),
  co2               INTEGER,
  timestamp         TIMESTAMPTZ,
  nivel_alerta      VARCHAR(20),
  anomalias         JSONB,
  run_id            VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Bot persistence (micro-framework E3)
CREATE TABLE interacciones_bot (
  id                SERIAL PRIMARY KEY,
  run_id            VARCHAR(100) UNIQUE NOT NULL,
  categoria         VARCHAR(50),
  prioridad         VARCHAR(20),
  ticket_id         VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Dead-letter for the IoT error workflow (R-IOT-01 mitigated)
CREATE TABLE dead_letter_iot (
  id                SERIAL PRIMARY KEY,
  run_id            VARCHAR(100),
  payload           JSONB,
  error_message     TEXT,
  etapa             VARCHAR(50),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Amazon ElastiCache Redis

| Parameter | Dev/Staging | Production |
|---|---|---|
| Engine | Redis 7.x | Redis 7.x |
| Node class | cache.t3.micro | cache.t3.small |
| Number of nodes | 1 (no replica) | 2 (1 primary + 1 replica) |
| Cluster mode | Disabled | Disabled |
| Encryption in transit | **Yes** (TLS) | **Yes** (TLS) |
| Auth token | Yes (via Secrets Manager) | Yes (via Secrets Manager) |
| Backup | No | Yes (daily snapshot) |
| Primary use | BullMQ queue for n8n Queue Mode | BullMQ queue for n8n Queue Mode |

### 5.3 Amazon S3

| Parameter | Value |
|---|---|
| Bucket name | `n8n-microframework-binaries-{account-id}` |
| Region | us-east-1 |
| Versioning | Enabled |
| Encryption | SSE-S3 (AES-256) |
| Public access | **Fully blocked** |
| Bucket policy | Only allows access from `n8n-worker-task-role` via IAM |
| Lifecycle policy | Move to S3-IA after 30 days; expire after 180 days |
| Purpose | Binary data of n8n executions (workflow attached files) |

---

## 6. Local architecture → AWS mapping

| Local component | AWS equivalent | Key difference |
|---|---|---|
| `docker-compose.yml` | ECS Task Definitions + Services | Declarative definitions in JSON/YAML; ECS manages the lifecycle |
| Single n8n container | ECS n8n-main + ECS n8n-workers (separate) | Queue Mode: Main enqueues, Workers execute. Independent scaling. |
| postgres container | RDS PostgreSQL Multi-AZ | Managed: automated backups, failover, encryption, Performance Insights |
| mock_bot :3001 container | ECS Fargate mock-bot-service | Same image; in AWS on a private subnet with no direct external access |
| mock_iot :3002 container | ECS Fargate mock-iot-service | Same as above |
| `n8n_data` volume | S3 bucket (binary data) + Secrets Manager (credentials) | S3 is infinitely scalable; Secrets Manager manages rotation |
| stdout logs | CloudWatch Logs `/ecs/n8n-main`, `/ecs/n8n-workers` | Persistent, indexable, queryable with Log Insights |
| `.env` file | AWS Secrets Manager | Automatic rotation, audit trail, IAM-based access |
| In-memory rate limiter (antipattern) | Redis (ElastiCache) for distributed rate limiting | Resolves the REG-002 antipattern in a multi-instance environment |

---

## 7. n8n configuration requirements

### 7.1 Critical n8n variables for AWS production

The following variables **must never be in code or in the Docker image**. They are injected into the ECS Task Definition from Secrets Manager:

| Variable | Criticality | Notes |
|---|---|---|
| `N8N_ENCRYPTION_KEY` | **CRITICAL** | Once set, changing it makes stored credentials unrecoverable. Store in Secrets Manager **with no automatic rotation**. |
| `WEBHOOK_URL` | High | Must point to the ALB's DNS. If it changes, active webhooks break. |
| `DB_POSTGRESDB_PASSWORD` | High | Automatic rotation every 30 days via Secrets Manager + Lambda. |
| `QUEUE_BULL_REDIS_PASSWORD` | High | Rotate quarterly. |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | Medium | Set to `true` to comply with REG-001 (prevents a Code node from reading the server's environment variables). |

### 7.2 n8n Queue Mode considerations in a multi-instance setup

1. **Shared Encryption Key:** All containers (main and workers) must have **exactly the same** `N8N_ENCRYPTION_KEY`. It is distributed via Secrets Manager.
2. **No local state:** n8n-main cannot store state on disk (temporary execution data goes to Redis and RDS). The local `n8n_data` volume does not exist in Fargate — credentials are managed in Secrets Manager.
3. **Fixed webhook URL:** `WEBHOOK_URL` points to the ALB's DNS. Workflows imported from the local environment must have their webhooks re-activated so n8n registers the new URL.
4. **Workflow re-import:** The exported workflows (`bot-to-be-orquestador.json`, `iot-to-be-*`) are imported via the n8n UI in the AWS environment. The `workflowId` values of the subflows change after import and must be updated in the orchestrators (same as in the local environment).

---

## 8. Deployment options per tier

| Aspect | Dev Tier | Staging Tier | Prod Tier |
|---|---|---|---|
| n8n mode | Main mode (no Queue) | Queue Mode | **Queue Mode** |
| n8n-main | 1 task, 0.5 vCPU, 1 GB | 1 task, 1 vCPU, 2 GB | 2 tasks, 1 vCPU, 2 GB |
| n8n-workers | 0 | 1 fixed task | 2–8 tasks (auto-scaling) |
| RDS | db.t3.micro, Single-AZ | db.t3.small, Single-AZ | db.t3.small, **Multi-AZ** |
| Redis | No (n8n uses SQLite/Postgres without queue) | cache.t3.micro, 1 node | cache.t3.small, 2 nodes |
| ALB | No (direct access to the ECS port via IP) | Yes | **Yes** |
| WAF | No | No | **Yes** |
| Secrets Manager | No (direct environment variables) | Yes | **Yes** |
| Deletion protection | No | No | **Yes** |
| Estimated cost | ~$75/month | ~$210/month | ~$390–750/month |

---

## 9. ATAM risk resolution in the AWS design

The following open risks identified in Phase 7 (ATAM) are mitigated by this design:

| ATAM risk | Description | AWS mitigation | Status |
|---|---|---|---|
| **R-GLOBAL-01** | Ephemeral stdout logs — container restart destroys the history | CloudWatch Logs: 30-day persistent, indexable logs with Log Insights | ✅ Mitigated → Non-risk |
| **R-BOT-01** | Manual token rotation with no auto-rotation | Secrets Manager with a rotation Lambda every 30 days for DB_PASSWORD; n8n External Secrets for API tokens | ✅ Mitigated (partial for N8N_ENCRYPTION_KEY, which cannot be rotated) |
| **R-IOT-01** | Dead-letter may not be inserted if E4 and the notification channel are both down (SP-IOT-01) | `dead_letter_iot` table in RDS (independent of E4) managed from the error workflow; E3 PostgreSQL is independent of E4 | ✅ Mitigated — R3 structurally separates E3 from E4 |
| **R-GLOBAL-02** | Dependency on external service contracts with no fallback | ALB timeout configured + n8n retry (REG-004) + CloudWatch alarm if mock-bot/iot does not respond | ⚠️ Partially mitigated — a complete circuit breaker requires implementation in E3 |
| **SP-IOT-01** | Error handler channel matches the E4 channel | In AWS: the error handler writes to `dead_letter_iot` in RDS (not to E4); E4 remains the notification channel. Decoupled paths. | ✅ Structurally resolved |

---

## 10. References

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley.
- Brown, S. (2018). *Software Architecture for Developers* — C4 Model. Leanpub.
- AWS. (2026). *Amazon ECS Developer Guide*. docs.aws.amazon.com/ecs
- AWS. (2026). *Amazon RDS User Guide*. docs.aws.amazon.com/rds
- n8n. (2026). *Scaling n8n — Queue Mode*. docs.n8n.io/hosting/scaling/queue-mode/
- n8n. (2026). *Environment Variables*. docs.n8n.io/hosting/configuration/environment-variables/
- OWASP. (2021). *OWASP Top Ten*. owasp.org/www-project-top-ten/

---

*Document generated as part of deliverable R3 (SO4) of the MGADS-UNAB 2026 thesis.*
*See also: `seguridad-iam.md`, `observabilidad-aws.md`, `escalabilidad.md`, `estimacion-costos.md`, `diagramas-aws.md`*
