> 🌐 **Language / Idioma:** English · [Español](diagramas-aws.md)

# Mermaid Diagrams — n8n-microframework on AWS

**Version:** 1.0
**Date:** 2026-05-18
**Phase:** 8 — AWS architecture design (SO4)

This document is the canonical source for all Phase 8 Mermaid diagrams.
Each diagram includes its full source code, the selected type with academic
justification, and the instructions for rendering the final PNG image.

---

## Rendering instructions

### Option A — mermaid.live (no installation)

1. Open [https://mermaid.live](https://mermaid.live)
2. Paste the code from the corresponding Mermaid block
3. Download as PNG with the "Download PNG" button (recommended resolution: `@2x`)

### Option B — mmdc CLI (local batch rendering)

```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Render a specific diagram
mmdc -i docs/aws/diagramas-aws.md -o docs/aws/renders/diag1-contexto.png -w 1600 --cssFile "" --configFile docs/aws/mermaid-config.json

# Batch-render all diagrams (requires splitting blocks into individual files)
for i in 1 2 3 4 5 6 7; do
  mmdc -i docs/aws/diag${i}.mmd -o docs/aws/renders/diag${i}.png -w 1600
done
```

### Recommended Mermaid configuration file (`mermaid-config.json`)

```json
{
  "theme": "base",
  "themeVariables": {
    "fontSize": "16px",
    "fontFamily": "Arial, sans-serif"
  }
}
```

---

## Diagram summary

| # | Mermaid type | Main location | Purpose |
|---|---|---|---|
| 1 | `C4Context` | `arquitectura-aws.md §1` | System context — actors and external systems |
| 2 | `C4Container` | `arquitectura-aws.md §2` | AWS containers and protocols between services |
| 3 | `flowchart TD` | `arquitectura-aws.md §3` | Multi-AZ network topology with subnets and VPC |
| 4 | `sequenceDiagram` | `escalabilidad.md §1` | Temporal flow webhook → Queue Mode → RDS → Auto Scaling |
| 5 | `flowchart LR` | `seguridad-iam.md §1` | Trust zones and security controls |
| 6 | `graph TD` | `seguridad-iam.md §2` | IAM hierarchy: roles → policies → resources |
| 7 | `xychart-beta` | `estimacion-costos.md §3` | Cost comparison by component and tier |

---

## Diagram 1 — System context (C4 Level 1)

**Type:** `C4Context`
**Academic justification:** The C4 notation (Brown, 2018) is the standard for
architectural documentation in academic and software engineering contexts. Level 1
context shows WHAT interacts with the system without revealing internal
implementation details. It is the ideal entry point for the architecture chapter
in the thesis.

**Location:** Insert the rendered image in `arquitectura-aws.md` at the start of §1 (Context).

```mermaid
C4Context
  title System context — n8n-microframework on AWS

  Person(operador, "Automation operator", "Configures and monitors n8n workflows via the web UI")
  Person(desarrollador, "Developer", "Imports workflows, validates REGs via validar-flujos.mjs")

  System(n8n_aws, "n8n-microframework AWS", "LC/NC automation engine with Clean Architecture E1-E4 on ECS Fargate, RDS PostgreSQL, and ElastiCache Redis")

  System_Ext(api_tickets, "Ticket API", "External support ticket management service")
  System_Ext(api_notif, "Notification API", "Alert channel differentiated by level (critical/warning)")
  System_Ext(sensores, "IoT Sensors", "Devices sending temperature, humidity, and CO2 readings")

  Rel(operador, n8n_aws, "Configures workflows and views executions", "HTTPS/UI :443")
  Rel(desarrollador, n8n_aws, "Validates the micro-framework's architecture", "CLI / GitHub Actions")
  Rel(sensores, n8n_aws, "Sends periodic readings", "HTTP POST webhook HTTPS")
  Rel(n8n_aws, api_tickets, "Creates and queries tickets (idempotent)", "HTTPS REST + Idempotency-Key")
  Rel(n8n_aws, api_notif, "Sends differentiated alerts with retry", "HTTPS REST + retry E4")
```

---

## Diagram 2 — AWS containers (C4 Level 2)

**Type:** `C4Container`
**Academic justification:** C4 Level 2 containers shows the deployable
processes/services and their interactions. It is the most commonly used level in
technical thesis documentation because it allows annotating each component's
technology (ECS Fargate, RDS, Redis) with the protocols and ports between services.
It corresponds to the "logical deployment view" of Kruchten's 4+1 view model.

**Location:** Insert the rendered image in `arquitectura-aws.md` at the start of §2 (Service inventory).

```mermaid
C4Container
  title Container diagram — n8n-microframework on AWS

  Person(usuario, "User / IoT Sensor", "Sends HTTPS webhooks or uses the n8n UI")

  Container_Boundary(vpc, "AWS VPC 10.0.0.0/16 — us-east-1") {
    Container(waf, "AWS WAF", "Web Application Firewall", "OWASP Top 10 + rate limiting 1000 req/5min")
    Container(alb, "Application Load Balancer", "AWS ALB + ACM", "Terminates HTTPS TLS :443, distributes traffic to n8n-main")
    Container(n8n_main, "n8n Main", "ECS Fargate · n8nio/n8n", "User interface, REST API, webhook reception, BullMQ enqueuing")
    Container(n8n_workers, "n8n Workers", "ECS Fargate · n8nio/n8n (Queue Mode)", "Execute E1-E4 workflows consuming jobs from Redis. Auto-scaling 2–8 instances")
    ContainerDb(rds, "PostgreSQL", "Amazon RDS Multi-AZ", "Persistence of n8n executions, lecturas_sensor, interacciones_bot. Schema with idempotency_key")
    ContainerDb(redis, "Redis", "ElastiCache Redis 7", "BullMQ queue for distributing jobs among workers. TLS + auth token")
    Container(secrets, "Secrets Manager", "AWS Secrets Manager", "N8N_ENCRYPTION_KEY, DB_PASSWORD, Redis auth token, API tokens. Automatic rotation")
    Container(s3, "S3 Bucket", "Amazon S3", "Binary data of n8n executions. SSE-S3, versioning, lifecycle policy")
    Container(cw, "CloudWatch", "AWS CloudWatch", "Persistent E1-E4 JSON logs, metrics, alarms, operational dashboard")
    Container(mock_bot, "mock-bot", "ECS Fargate · Node.js :3001", "Simulates the ticket API (Dev/Staging). Lambda in Production")
    Container(mock_iot, "mock-iot", "ECS Fargate · Node.js :3002", "Simulates the IoT notification API (Dev/Staging). Lambda in Production")
  }

  Rel(usuario, waf, "HTTPS :443")
  Rel(waf, alb, "Filtered traffic")
  Rel(alb, n8n_main, "HTTP :5678 (internal VPC)")
  Rel(n8n_main, redis, "RPUSH BullMQ jobs · TLS :6379")
  Rel(n8n_workers, redis, "BLPOP BullMQ jobs · TLS :6379")
  Rel(n8n_main, rds, "SQL DDL/queries · TLS :5432")
  Rel(n8n_workers, rds, "INSERT ON CONFLICT · TLS :5432")
  Rel(n8n_workers, mock_bot, "HTTP POST tickets · :3001")
  Rel(n8n_workers, mock_iot, "HTTP POST alerts · :3002")
  Rel(n8n_main, secrets, "GetSecretValue · VPC Endpoint")
  Rel(n8n_workers, s3, "PutObject/GetObject · VPC Endpoint")
  Rel(n8n_main, cw, "stdout JSON logs E1-E4")
  Rel(n8n_workers, cw, "stdout JSON logs E1-E4")
```

---

## Diagram 3 — Multi-AZ network topology

**Type:** `flowchart TD` with nested subgraphs
**Academic justification:** C4 diagrams do not model physical distribution across
availability zones (AZs) or subnet hierarchy well. The `flowchart` with subgraphs
allows representing the VPC → Subnet → AZ → Service hierarchy with visual clarity.
It is the standard type in cloud architecture documentation (AWS Well-Architected
Framework, AWS whitepapers) and references such as "Cloud Architecture Patterns"
(Wilder, 2012).

**Location:** Insert the rendered image in `arquitectura-aws.md` at the start of §3 (Network design).

```mermaid
flowchart TD
  IGW[Internet Gateway]:::aws
  WAF[AWS WAF\nOptional Production]:::aws
  ALB["Application Load Balancer\nHTTPS :443 · ACM cert\nalb-sg"]:::aws

  IGW --> WAF --> ALB

  subgraph VPC["VPC 10.0.0.0/16"]
    subgraph AZa["Availability Zone — us-east-1a"]
      subgraph PubA["Public Subnet\n10.0.1.0/24"]
        NATA[NAT Gateway A]:::aws
      end
      subgraph PrivA["Private Subnet App\n10.0.2.0/24"]
        MainA["ECS Fargate\nn8n-main\n1 vCPU · 2 GB\nn8n-main-sg"]:::ecs
        WorkerA["ECS Fargate\nn8n-worker × 1–4\n1 vCPU · 2 GB\nn8n-worker-sg"]:::ecs
      end
      subgraph DataA["Private Subnet Data\n10.0.3.0/24"]
        RDSP["RDS PostgreSQL\nPrimary\ndb.t3.small\nrds-sg"]:::db
        RedisP["ElastiCache Redis\nPrimary\ncache.t3.small\nredis-sg"]:::db
      end
    end
    subgraph AZb["Availability Zone — us-east-1b"]
      subgraph PubB["Public Subnet\n10.0.4.0/24"]
        NATB[NAT Gateway B]:::aws
      end
      subgraph PrivB["Private Subnet App\n10.0.5.0/24"]
        MainB["ECS Fargate\nn8n-main\n1 vCPU · 2 GB\nn8n-main-sg"]:::ecs
        WorkerB["ECS Fargate\nn8n-worker × 1–4\n1 vCPU · 2 GB\nn8n-worker-sg"]:::ecs
      end
      subgraph DataB["Private Subnet Data\n10.0.6.0/24"]
        RDSS["RDS PostgreSQL\nStandby\nfailover < 60s\nrds-sg"]:::db
        RedisR["ElastiCache Redis\nReplica\nredis-sg"]:::db
      end
    end
  end

  subgraph GLOBAL["Global / regional services"]
    SM["Secrets Manager\nvia VPC Endpoint"]:::aws
    S3["S3 Bucket\nn8n-microframework-binaries\nvia VPC Endpoint"]:::aws
    CW["CloudWatch Logs\n/ecs/n8n-main\n/ecs/n8n-workers"]:::aws
  end

  ALB --> MainA & MainB
  MainA --> NATA
  MainB --> NATB
  MainA & WorkerA --> RedisP
  MainB & WorkerB --> RedisP
  WorkerA --> RDSP
  WorkerB --> RDSP
  RDSP -.->|"synchronous replication"| RDSS
  RedisP -.->|"async replication"| RedisR
  MainA & WorkerA & MainB & WorkerB --> SM & S3 & CW

  classDef aws fill:#FF9900,stroke:#232F3E,color:#000
  classDef ecs fill:#C7F0C7,stroke:#2D6A2D,color:#000
  classDef db fill:#C0D8F0,stroke:#1A4F7A,color:#000
```

---

## Diagram 4 — Execution flow in Queue Mode (Sequence)

**Type:** `sequenceDiagram`
**Academic justification:** The sequence diagram is the UML standard (ISO/IEC 19501)
for documenting ordered temporal interactions between actors and systems. It is the
most appropriate type for showing the asynchronous Queue Mode flow: the temporal
separation between receiving the webhook (n8n-main responds < 50ms) and executing
the workflow in the worker (E1-E4) is this architecture's most important behavior
and is naturally represented in sequence.

**Location:** Insert the rendered image in `escalabilidad.md` after the introductory paragraph of §1.

*(Diagram reproduced from `escalabilidad.md §1` — canonical source in that file)*

```mermaid
sequenceDiagram
  actor Sensor as IoT Sensor
  participant ALB as ALB
  participant Main as n8n-main<br/>(ECS Fargate)
  participant Redis as Redis<br/>(ElastiCache)
  participant Worker as n8n-worker<br/>(ECS Fargate)
  participant RDS as PostgreSQL<br/>(RDS Multi-AZ)
  participant CW as CloudWatch

  Sensor->>ALB: POST /webhook/iot-sensor-to-be (HTTPS :443)
  ALB->>Main: HTTP :5678 (alb-sg rule)
  Main->>Main: E1 — Field validation<br/>+ timestamp authority
  Main->>Redis: RPUSH job:{runId} payload<br/>(BullMQ enqueue)
  Main-->>Sensor: HTTP 202 Accepted<br/>(< 50ms — Main does not block)

  Note over Redis,Worker: Worker consumes the job from the queue
  Redis->>Worker: BLPOP job:{runId}
  Worker->>Worker: E2 — Domain logic<br/>(centralized thresholds ADR-002 IoT)
  Worker->>RDS: INSERT INTO lecturas_sensor<br/>ON CONFLICT (idempotency_key) DO NOTHING
  RDS-->>Worker: OK (idempotent — REG-005)
  Worker->>Worker: E4 — Routing by nivel_alerta<br/>+ retry maxRetries=3 (critical)
  Worker->>CW: stdout JSON {"etapa":"E4","status":"ok",<br/>"duracion_ms":183,"nivel_alerta":"critico"}

  Note over CW: Metric published: n8n/QueueDepth
  CW->>CW: Evaluates alarm:<br/>QueueDepth > 10 jobs?

  alt Queue saturated (QueueDepth > 10)
    CW->>Worker: Auto Scaling — scale-out<br/>(+1 ECS task, cooldown 60s)
    Note over Worker: Min=2, Max=8 tasks
  else Queue normal (QueueDepth < 2, 5 min)
    CW->>Worker: Auto Scaling — scale-in<br/>(-1 ECS task, cooldown 300s)
  end
```

---

## Diagram 5 — Trust zones and security controls

**Type:** `flowchart LR` with zone subgraphs + classDef by color
**Academic justification:** Security "boundary diagrams" (similar to Microsoft's
STRIDE method Data Flow Diagrams) are best represented with flowchart because they
allow grouping services by trust zone and coloring the control boundaries. The
left-to-right (LR) flow reflects the natural direction of a request: Internet →
Public zone → Application zone → Data zone. This type is the most commonly used in
cloud architectural security documents (AWS Security Reference Architecture, NIST
SP 800-207 Zero Trust).

**Location:** Insert the rendered image in `seguridad-iam.md §1` after the introductory paragraph.

*(Diagram reproduced from `seguridad-iam.md §1` — canonical source in that file)*

```mermaid
flowchart LR
  subgraph INTERNET["☁ Internet"]
    USER[User / IoT Sensor]
  end

  subgraph PUBLIC["🌐 Public Zone\n(Public Subnets)"]
    WAF[AWS WAF\nOWASP Rules\nRate Limit 1000/5min]:::sec
    ALB[ALB\nACM TLS — wildcard cert\nHTTPS :443 only]:::sec
  end

  subgraph APP["🔒 Application Zone\n(Private Subnets)"]
    MAIN["n8n-main\nalb-sg → :5678 only\nIAM: n8n-main-task-role"]:::app
    WORKERS["n8n-workers\nNo external ingress\nIAM: n8n-worker-task-role"]:::app
    SM["Secrets Manager\nGetSecretValue\nvia VPC Endpoint (no internet)"]:::sec
  end

  subgraph DATA["🗄 Data Zone\n(Data Subnets)"]
    RDS["RDS PostgreSQL\n:5432 ← App-SG only\nKMS CMK encryption\nMulti-AZ"]:::data
    REDIS["ElastiCache Redis\n:6379 ← App-SG only\nTLS in transit\nAuth Token"]:::data
    S3["S3 Bucket\nSSE-S3 encryption\nVPC Endpoint\nBucket Policy: IAM only"]:::data
  end

  subgraph OBS["📊 Observability"]
    CW["CloudWatch\nLogs + Metrics\nAlarms → SNS Email"]:::obs
  end

  USER -->|"HTTPS :443"| WAF
  WAF -->|"Filtered traffic"| ALB
  ALB -->|"HTTP :5678\nalb-sg rule"| MAIN
  MAIN -->|"TLS :6379\nAuth Token"| REDIS
  MAIN & WORKERS -->|"TLS :5432\nIAM auth"| RDS
  WORKERS -->|"IAM Role + S3 VPC EP"| S3
  MAIN & WORKERS -->|"VPC Endpoint\nno internet"| SM
  MAIN & WORKERS -->|"stdout JSON logs"| CW

  classDef sec fill:#FFD700,stroke:#B8860B,color:#000
  classDef app fill:#C7F0C7,stroke:#2D6A2D,color:#000
  classDef data fill:#C0D8F0,stroke:#1A4F7A,color:#000
  classDef obs fill:#E8D5FF,stroke:#6A2D9A,color:#000
```

---

## Diagram 6 — IAM hierarchy: roles → policies → resources

**Type:** `graph TD`
**Academic justification:** The IAM hierarchy (Role → Policy → Actions → Resources)
is naturally a top-down directed tree. `graph TD` (top-down) is the most legible
type for hierarchical structures with multiple levels and allows using subgraphs to
group by category. It is preferable to `flowchart` when the emphasis is on
inheritance/delegation structure rather than the temporal flow of data.

**Location:** Insert the rendered image in `seguridad-iam.md §2` after the paragraph on "Principles applied".

*(Diagram reproduced from `seguridad-iam.md §2` — canonical source in that file)*

```mermaid
graph TD
  subgraph ROLES["IAM Task Roles — Least Privilege"]
    R1[n8n-main-task-role]:::role
    R2[n8n-worker-task-role]:::role
    R3[rds-monitoring-role]:::role
    R4[ci-deploy-role]:::role
  end

  subgraph POLICIES["Attached policies"]
    P1["SecretsManagerReadPolicy\nGetSecretValue\narn:aws:secretsmanager:*:n8n/*"]:::policy
    P2["S3ReadWritePolicy\ns3:GetObject · s3:PutObject\narn:aws:s3:::n8n-microframework-binaries/*"]:::policy
    P3["CloudWatchLogsPolicy\nlogs:CreateLogStream\nlogs:PutLogEvents\n/ecs/n8n-*"]:::policy
    P4["ECRPullPolicy\necr:GetAuthorizationToken\necr:BatchGetImage · ecr:GetDownloadURL"]:::policy
    P5["RDSEnhancedMonitoringPolicy\nAWS Managed: AmazonRDSEnhancedMonitoringRole"]:::policy
    P6["ECSDeployPolicy\necs:UpdateService\necs:RegisterTaskDefinition\necs:DescribeServices"]:::policy
  end

  subgraph RESOURCES["Target resources (specific ARNs)"]
    S1["Secrets Manager\narn:aws:secretsmanager:us-east-1:ACCOUNT:secret:n8n/*"]:::res
    S2["S3 Bucket\narn:aws:s3:::n8n-microframework-binaries"]:::res
    S3R["CloudWatch Log Groups\narn:aws:logs:us-east-1:ACCOUNT:log-group:/ecs/n8n-*"]:::res
    S4["ECR Repository\narn:aws:ecr:us-east-1:ACCOUNT:repository/n8n-microframework"]:::res
    S5["RDS Enhanced Monitoring\nCloudWatch — OS-level metrics"]:::res
    S6["ECS Services\narn:aws:ecs:us-east-1:ACCOUNT:service/n8n-cluster/*"]:::res
  end

  R1 --> P1 & P3 & P4
  R2 --> P1 & P2 & P3 & P4
  R3 --> P5
  R4 --> P6 & P4

  P1 --> S1
  P2 --> S2
  P3 --> S3R
  P4 --> S4
  P5 --> S5
  P6 --> S6

  classDef role fill:#FF9900,stroke:#232F3E,color:#000,font-weight:bold
  classDef policy fill:#FFD700,stroke:#B8860B,color:#000
  classDef res fill:#C0D8F0,stroke:#1A4F7A,color:#000
```

---

## Diagram 7 — Cost estimation per tier (XY Chart)

**Type:** `xychart-beta` (bar chart)
**Academic justification:** Mermaid's `xychart-beta` allows visualizing quantitative
comparisons natively without external tools. A cost bar chart by component and tier
is more immediately legible than a text table and facilitates visual comparison
between environments. In the thesis's academic context, this diagram supports the
claim that the design is "cost-efficient" by showing the scale of costs
differentiated by tier and component.

**Location:** Insert the rendered image in `estimacion-costos.md §3` (Visual comparison by tier).

*(Diagram reproduced from `estimacion-costos.md §3` — canonical source in that file)*

```mermaid
xychart-beta
  title "Estimated monthly costs (USD) by component and tier"
  x-axis ["ECS Main", "ECS Workers", "ECS Mocks", "RDS PostgreSQL", "ElastiCache", "ALB", "NAT GW", "S3+CW+Other"]
  y-axis "USD/month" 0 --> 150
  bar [6, 6, 3, 15, 0, 0, 0, 3]
  bar [32, 65, 11, 25, 17, 10, 37, 11]
  bar [65, 130, 10, 50, 51, 23, 87, 42]
```

*Legend: the three bars per component represent Dev · Staging · Production respectively.*

---

## References

- C4 Model: Simon Brown (2018). *The C4 model for software architecture*. InfoQ.
- Mermaid Documentation: https://mermaid.js.org/intro/
- AWS Well-Architected Framework: https://docs.aws.amazon.com/wellarchitected/
- Kruchten, P. (1995). The 4+1 View Model of Architecture. IEEE Software.
- Wilder, B. (2012). *Cloud Architecture Patterns*. O'Reilly Media.
