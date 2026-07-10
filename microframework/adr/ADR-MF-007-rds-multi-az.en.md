> 🌐 **Language / Idioma:** English · [Español](ADR-MF-007-rds-multi-az.md)

# ADR-MF-007: RDS PostgreSQL Multi-AZ for production data persistence

**Status:** Accepted
**Date:** 2026-05-18
**Case:** Micro-framework (applies to both cases — Bot and IoT)
**Affected quality attribute:** Reliability · Data integrity · Availability

---

## Context

The micro-framework's two case studies persist critical data in PostgreSQL:
- **Bot:** the `interacciones_bot` table with created tickets (idempotency_key prevents
  duplicates).
- **IoT:** the `lecturas_sensor` table with sensor readings (loss = gap in the time
  series).

The ATAM scenario **IOT-Q3** ("Reading integrity under retries") sets as its response
criterion `COUNT(*) = 1` per `idempotency_key` — that is, data integrity is a verified
requirement, not an aspirational one.

In the local environment (Docker Compose), PostgreSQL runs in a single container with no
replication. A container or host failure implies unavailability and possible loss of
uncommitted data. For the reference AWS design (SO4), the database must be guaranteed to
meet the micro-framework's implicit SLA.

---

## Decision

We use **Amazon RDS PostgreSQL in Multi-AZ configuration** for the Production environment.
RDS Multi-AZ maintains a synchronous replica in a second Availability Zone (AZ-b) and
performs automatic failover to the replica if the primary instance fails.

Specific configuration:
- **Engine:** PostgreSQL 16 (compatible with the local schema)
- **Instance:** `db.t3.small` (2 vCPU, 2 GB RAM) — allows `max_connections=200`
- **Storage:** gp3 · 100 GB · provisioned IOPS 3000 (gp3's free baseline)
- **Multi-AZ:** `MultiAZ=true` — synchronous replica in us-east-1b
- **Encryption:** KMS CMK with `StorageEncrypted=true`
- **Backups:** 7-day retention · backup window 02:00–03:00 UTC
- **Failover:** Automatic · target time < 60 seconds (AWS SLA: typically 60s)

**Dev** and **Staging** environments use Single-AZ (`MultiAZ=false`) to reduce costs.

---

## Alternatives considered

- **RDS Single-AZ across all tiers:** Saves ~$25/month in Production. Discarded because an
  RDS Single-AZ failure can mean several minutes of unavailability (restoration time from a
  snapshot), during which every workflow fails. The risk of losing IoT sensor data or bot
  tickets is unacceptable for a real production environment.

- **Aurora PostgreSQL Serverless v2:** Greater resilience and automatic scaling. Discarded
  because Aurora's minimum cost (~$0.12/h in us-east-1) is 3× that of RDS t3.small, with no
  proportional benefit for the expected data volume (< 10 GB in the micro-framework's first
  year of operation).

- **PostgreSQL on ECS (container):** No instance management, more flexible. Discarded
  because it provides no automatic backups, automatic failover, or encryption at rest
  without additional manual configuration. The operational complexity of managing
  PostgreSQL in an ephemeral ECS container far exceeds RDS's cost.

- **Amazon DynamoDB:** Scalable NoSQL with no connection limit. Discarded because the n8n
  flows use direct SQL (`ON CONFLICT DO NOTHING`) and n8n stores its internal state in
  PostgreSQL; migrating both to DynamoDB would require modifying n8n's source code.

---

## Consequences

**Positive:**
- Automatic failover < 60 seconds with no manual intervention — the application
  automatically reconnects to the new primary endpoint (RDS's DNS CNAME does not change).
- Automatic backups with point-in-time restoration up to 7 days back.
- `StorageEncrypted=true` meets the confidentiality requirements documented in ATAM
  scenarios BOT-Q3 and IOT-Q6 (credentials at rest).
- Performance Insights + Enhanced Monitoring provides visibility into slow queries with no
  additional configuration.
- Storage auto-scaling up to 500 GB prevents interruptions from a full disk.

**Negative / trade-offs:**
- Cost 2× compared to Single-AZ: ~$25/month additional in Production (~$300/year).
  Accepted because RDS Multi-AZ's 99.95% SLA justifies the cost in an environment where
  data loss has implications for the micro-framework's integrity.
- The Multi-AZ replica is read-only for failover purposes (it is not an accessible read
  replica). Scalable read analysis requires a separate Read Replica.
- `max_connections=200` may be insufficient if the number of workers scales beyond 8.
  Mitigated with PgBouncer as a connection proxy (described in `escalabilidad.md §4`).

---

## Relationship to the micro-framework

- **REG-005** (idempotency): the `ON CONFLICT (idempotency_key) DO NOTHING` clause
  implemented in E3 of the to-be flows survives RDS Multi-AZ failover — PostgreSQL
  preserves data already committed to the synchronous replica before the failover.
- The ATAM scenario **IOT-Q3** (reliability — integrity under retries, evidence:
  `run-log-iot-to-be.csv Set K: 0% failures`) extends to the AWS design: idempotency works
  on RDS Multi-AZ with no changes to the flow.
- **NR-IOT-02** (Non-risk identified in ATAM): "E3 persistence is independent of E4
  notification" — this finding holds in AWS because RDS and the notification channel
  (external API / SNS) are independent services.
