> 🌐 **Language / Idioma:** English · [Español](observabilidad-aws.md)

# Observability on AWS — n8n-microframework

**Version:** 1.0
**Date:** 2026-05-18
**Phase:** 8 — AWS architecture design (SO4)
**ATAM risk resolution:** R-GLOBAL-01 (ephemeral logs → persistent CloudWatch Logs)

---

## §1 Observability strategy

The micro-framework establishes in **REG-006** that each stage (E1–E4) must emit a
structured JSON log with the fields `etapa`, `status`, `duracion_ms`, and `errores`. In
the local environment (Docker Compose) these logs are lost when the container restarts —
risk **R-GLOBAL-01** identified in ATAM Phase 7.

On AWS, CloudWatch Logs automatically captures all stdout/stderr logs from the ECS
Fargate containers and persists them durably. The observability strategy has three
complementary layers:

| Layer | AWS Service | Purpose |
|---|---|---|
| **Structured logs** | CloudWatch Logs | Persistence and querying of E1-E4 JSON logs |
| **Metrics and alarms** | CloudWatch Metrics + Alarms | Proactive degradation detection |
| **Operational dashboard** | CloudWatch Dashboard | Unified view of system status |

---

## §2 CloudWatch Log Groups

### Log Group configuration

Each ECS service has its own Log Group with differentiated retention based on cost
and the need for historical analysis:

| Log Group | Source service | Retention | Purpose |
|---|---|---|---|
| `/ecs/n8n-main` | ECS n8n-main | 30 days | UI, webhook, enqueuing, and startup logs |
| `/ecs/n8n-workers` | ECS n8n-workers | 30 days | E1-E4 workflow execution logs |
| `/ecs/mock-bot` | ECS mock-bot | 7 days | Simulated ticket API logs |
| `/ecs/mock-iot` | ECS mock-iot | 7 days | Simulated IoT notification API logs |
| `/rds/n8n-postgresql` | RDS PostgreSQL | 7 days | Slow queries (≥ 1000ms), connection errors |
| `/elasticache/n8n-redis` | ElastiCache Redis | 3 days | Redis slow log (optional) |

### ECS configuration — Log Driver

In each Task Definition, the `logConfiguration` section directs the container's
output to CloudWatch:

```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/n8n-workers",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "n8n-worker",
      "awslogs-create-group": "true"
    }
  }
}
```

The `awslogs-stream-prefix` field generates streams in the format:
`n8n-worker/n8n-workers/<task-id>`, allowing identification of which container
generated each log line.

---

## §3 Micro-framework structured logs — format in CloudWatch

The to-be n8n workflows emit logs in the format defined by REG-006. In CloudWatch these
logs appear as text in the streams, but CloudWatch Log Insights automatically parses
them as JSON:

### Example log entry (CloudWatch Logs stream)

```json
{
  "@timestamp": "2026-05-18T14:32:01.583Z",
  "@logStream": "n8n-worker/n8n-workers/abc123def456",
  "@message": "{\"etapa\":\"E3\",\"caso\":\"iot-to-be\",\"sensor_id\":\"S-42\",\"nivel_alerta\":\"critico\",\"status\":\"ok\",\"duracion_ms\":183,\"idempotency_key\":\"S-42-1716042721\",\"postgres_rows_inserted\":1}",
  "etapa": "E3",
  "caso": "iot-to-be",
  "sensor_id": "S-42",
  "nivel_alerta": "critico",
  "status": "ok",
  "duracion_ms": 183,
  "idempotency_key": "S-42-1716042721",
  "postgres_rows_inserted": 1
}
```

*CloudWatch Log Insights automatically extracts the JSON fields for use in queries.*

---

## §4 CloudWatch Log Insights — Operational queries

### Query 1 — Failures at any stage (MTTD < 15s demonstrated in Phase 7)

This query reproduces the detection mechanism underpinning the BOT-Q5 scenario (MTTD ≤ 60s):

```sql
fields @timestamp, etapa, caso, status, errores, @logStream
| filter status = "fail" or status = "error"
| sort @timestamp desc
| limit 50
```

**Use:** Run against the `/ecs/n8n-workers` Log Group with a 15-minute time window
for recent failure detection.

---

### Query 2 — Latency by stage (percentiles)

Reproduces the IOT-Q5 analysis (`medicion/analisis_iot_q5.py`) but in real time:

```sql
fields etapa, duracion_ms
| filter ispresent(duracion_ms)
| stats
    avg(duracion_ms) as latencia_promedio,
    pct(duracion_ms, 50) as p50,
    pct(duracion_ms, 95) as p95,
    pct(duracion_ms, 99) as p99,
    count() as total_ejecuciones
  by etapa
| sort etapa asc
```

**Interpretation:** p95 > 30000ms indicates active retries (confirmed outlier in
IOT-Q5 runtime).

---

### Query 3 — Latency by IoT alert level (TP-IOT-01 analysis)

Reproduces the documented trade-off: critical has +10.8ms overhead due to maxRetries=3:

```sql
fields nivel_alerta, duracion_ms
| filter caso = "iot-to-be" and etapa = "E4" and ispresent(nivel_alerta)
| stats
    avg(duracion_ms) as promedio_ms,
    pct(duracion_ms, 50) as p50_ms,
    pct(duracion_ms, 95) as p95_ms
  by nivel_alerta
| sort nivel_alerta
```

---

### Query 4 — Workflow error rate by case study

```sql
fields caso, status
| filter ispresent(caso)
| stats
    count(status = "fail") as fallos,
    count() as total,
    100 * count(status = "fail") / count() as tasa_error_pct
  by caso
| sort caso
```

---

### Query 5 — Execution volume per hour (capacity)

```sql
fields @timestamp
| stats count() as ejecuciones by bin(1h)
| sort @timestamp asc
```

**Use:** Identify load peaks to calibrate the workers' auto-scaling threshold.

---

### Query 6 — Idempotency — detecting ON CONFLICT conflicts (IOT-Q3, BOT-Q4)

```sql
fields idempotency_key, postgres_rows_inserted, @timestamp
| filter postgres_rows_inserted = 0
| sort @timestamp desc
| limit 20
```

*Records with `postgres_rows_inserted=0` indicate that `ON CONFLICT DO NOTHING`
discarded a duplicate — the idempotency mechanism worked correctly.*

---

## §5 CloudWatch Metrics and Alarms

### Defined alarms

All alarms send notifications to an SNS Topic (`n8n-ops-alerts`) configured with an
email subscription for the operator. For Production, integration with PagerDuty or
Slack via Lambda is recommended.

#### Alarm 1 — High CPU on n8n-main

```
Name:           n8n-main-cpu-high
Namespace:      AWS/ECS
Metric:         CPUUtilization
Dimensions:     ClusterName=n8n-cluster, ServiceName=n8n-main
Threshold:      > 80% for 2 consecutive 5-minute periods
Action:         SNS n8n-ops-alerts (WARNING)
Purpose:        Indication of excessive load — consider increasing Task Definition vCPU
```

#### Alarm 2 — High CPU on n8n-workers

```
Name:           n8n-workers-cpu-high
Namespace:      AWS/ECS
Metric:         CPUUtilization
Dimensions:     ClusterName=n8n-cluster, ServiceName=n8n-workers
Threshold:      > 80% for 3 consecutive 5-minute periods
Action:         SNS n8n-ops-alerts (WARNING)
Purpose:        Complements auto-scaling; indicates workers are saturated
```

#### Alarm 3 — Low RDS storage

```
Name:           rds-low-storage
Namespace:      AWS/RDS
Metric:         FreeStorageSpace
Dimensions:     DBInstanceIdentifier=n8n-postgresql
Threshold:      < 10 GB (10737418240 bytes)
Action:         SNS n8n-ops-alerts (CRITICAL)
Purpose:        Prevent interruption from a full disk — trigger storage autoscaling or manual expansion
```

#### Alarm 4 — High ALB latency

```
Name:           alb-latency-high
Namespace:      AWS/ApplicationELB
Metric:         TargetResponseTime
Dimensions:     LoadBalancer=<ALB ARN>
Threshold:      > 5 seconds (p99) for 5 minutes
Action:         SNS n8n-ops-alerts (WARNING)
Purpose:        Detect response degradation to webhooks
```

#### Alarm 5 — RDS connections near limit

```
Name:           rds-connections-high
Namespace:      AWS/RDS
Metric:         DatabaseConnections
Dimensions:     DBInstanceIdentifier=n8n-postgresql
Threshold:      > 180 connections (90% of max_connections=200)
Action:         SNS n8n-ops-alerts (WARNING)
Purpose:        Prevent connection rejection; consider PgBouncer or a larger instance
```

#### Alarm 6 — High Redis memory

```
Name:           redis-memory-high
Namespace:      AWS/ElastiCache
Metric:         DatabaseMemoryUsagePercentage
Dimensions:     CacheClusterId=n8n-redis
Threshold:      > 75%
Action:         SNS n8n-ops-alerts (WARNING)
Purpose:        Prevent eviction of jobs from the BullMQ queue
```

#### Alarm 7 — Workflow error rate (custom metric)

This alarm requires publishing a custom metric from the micro-framework logs using
**CloudWatch Embedded Metrics Format** (EMF) in the error workflow (E3):

```json
{
  "_aws": {
    "Timestamp": 1716042721000,
    "CloudWatchMetrics": [{
      "Namespace": "n8n/Workflows",
      "Dimensions": [["caso"]],
      "Metrics": [{ "Name": "WorkflowFailure", "Unit": "Count" }]
    }]
  },
  "caso": "iot-to-be",
  "WorkflowFailure": 1,
  "etapa": "ERROR_HANDLER",
  "status": "fail"
}
```

```
Name:           n8n-workflow-failure-rate-high
Namespace:      n8n/Workflows
Metric:         WorkflowFailure
Threshold:      Sum > 10 in a 5-minute period
Action:         SNS n8n-ops-alerts (CRITICAL)
Purpose:        Detect spikes in workflow failures — possible issue with an external API
```

---

## §6 CloudWatch Dashboard — Operational view

The `n8n-microframework-operations` dashboard centralizes the system's critical KPIs
on a single screen.

### Dashboard widgets (3 × 3 layout)

| Row | Column 1 | Column 2 | Column 3 |
|---|---|---|---|
| **1 — Compute** | n8n-main CPU (line, %) | n8n-workers CPU (line, %) | Active workers (number) |
| **2 — Queue and DB** | Redis queue depth (line, count) | RDS connections (line, count) | RDS latency (line, ms) |
| **3 — Network and quality** | ALB p99 latency (line, ms) | ALB 4xx/5xx (bar, count) | n8n failure rate (number, %) |

### Dashboard JSON configuration (excerpt)

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "CPU Utilization — n8n-main",
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ClusterName", "n8n-cluster",
           "ServiceName", "n8n-main", { "stat": "Average", "period": 60 }]
        ],
        "view": "timeSeries",
        "yAxis": { "left": { "min": 0, "max": 100, "label": "%" } },
        "period": 300,
        "annotations": {
          "horizontal": [{ "value": 80, "label": "Alarm threshold", "color": "#ff6961" }]
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "ECS Workers — Running tasks",
        "metrics": [
          ["ECS/ContainerInsights", "RunningTaskCount",
           "ClusterName", "n8n-cluster", "ServiceName", "n8n-workers"]
        ],
        "view": "singleValue",
        "period": 60
      }
    },
    {
      "type": "log",
      "properties": {
        "title": "Recent failures — Workflows",
        "query": "SOURCE '/ecs/n8n-workers' | fields @timestamp, etapa, caso, errores | filter status = 'fail' | sort @timestamp desc | limit 10",
        "region": "us-east-1",
        "view": "table"
      }
    }
  ]
}
```

---

## §7 Container Insights — Advanced ECS metrics

AWS Container Insights provides additional ECS container metrics that are not
available by default: memory usage per task, task count per service, network per
container.

**Activation:**

```bash
# Enable Container Insights on the ECS cluster
aws ecs update-cluster-settings \
  --cluster n8n-cluster \
  --settings name=containerInsights,value=enabled \
  --region us-east-1
```

**Additional metrics available with Container Insights:**

| Metric | Namespace | Use |
|---|---|---|
| `MemoryUtilized` | `ECS/ContainerInsights` | RAM usage per task |
| `RunningTaskCount` | `ECS/ContainerInsights` | Active tasks per service |
| `NetworkRxBytes` | `ECS/ContainerInsights` | Bytes received (webhook traffic) |
| `NetworkTxBytes` | `ECS/ContainerInsights` | Bytes sent (responses to APIs) |
| `StorageReadBytes` | `ECS/ContainerInsights` | Ephemeral disk reads |

---

## §8 X-Ray — Distributed tracing (optional)

AWS X-Ray allows tracing the complete path of a request from the ALB to RDS,
including the time spent at each service. It requires instrumenting n8n's code or
its dependencies.

**Relevant limitation:** n8n is a third-party application with no native X-Ray
instrumentation. The alternative is to enable X-Ray on the ALB to capture the trace
up to n8n-main without application instrumentation:

```
ALB Attributes: x-ray.enabled = true
```

This provides ALB → n8n latency tracing without modifying n8n's code.
For complete E1-E4 traceability, the micro-framework's JSON logs with `duracion_ms`
per stage are the primary mechanism (already implemented in the to-be workflows).

---

## §9 R-GLOBAL-01 resolution

The **R-GLOBAL-01** risk identified in ATAM Phase 7 describes:
> *"The micro-framework's logs are lost when the local Docker container restarts.
> The `etapa: ERROR_HANDLER` remains in ephemeral stdout."*

**Solution in AWS:**

1. ECS Fargate with the `awslogs` log driver captures **all stdout** from the container.
2. Logs are persisted in CloudWatch Logs **before** the container terminates.
3. 30-day retention in `/ecs/n8n-workers` allows retroactive analysis.
4. Log Insights allows ad-hoc queries over historical E1-E4 JSON logs.
5. Alarms detect failures in real time (< 60 seconds from the event).

**Revised ATAM classification:** R-GLOBAL-01 moves from **Risk** to **Non-Risk** in
the AWS design. The logs are as durable and queryable as a telemetry database.

---

## References

- `arquitectura-aws.md` — ECS Task Definitions with `logConfiguration` (§4)
- `seguridad-iam.md` — CloudWatchLogsPolicy in IAM roles (§2)
- `escalabilidad.md` — Auto-scaling based on CloudWatch metrics (§2)
- `medicion/consolidado/mttd-resultado.md` — MTTD < 15s (JSON log structure that persists in CW)
- `atam/registro-riesgos-tradeoffs.md` — R-GLOBAL-01, TP-IOT-01 (latency by nivel_alerta)
- `microframework/reglas/reglas-obligatorias.md` — REG-006 (structured logs)
