# Diagramas Mermaid — n8n-microframework en AWS

**Versión:** 1.0
**Fecha:** 2026-05-18
**Fase:** 8 — Diseño de arquitectura AWS (OE4)

Este documento es la fuente canónica de todos los diagramas Mermaid de Fase 8.
Cada diagrama incluye su código fuente completo, el tipo seleccionado con justificación
académica, y las instrucciones para renderizar la imagen PNG final.

---

## Instrucciones de renderizado

### Opción A — mermaid.live (sin instalación)

1. Abrir [https://mermaid.live](https://mermaid.live)
2. Pegar el código del bloque Mermaid correspondiente
3. Descargar como PNG con el botón "Download PNG" (resolución recomendada: `@2x`)

### Opción B — CLI mmdc (renderizado local por lotes)

```bash
# Instalar Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Renderizar un diagrama específico
mmdc -i docs/aws/diagramas-aws.md -o docs/aws/renders/diag1-contexto.png -w 1600 --cssFile "" --configFile docs/aws/mermaid-config.json

# Renderizar todos los diagramas en lote (requiere separar bloques en archivos individuales)
for i in 1 2 3 4 5 6 7; do
  mmdc -i docs/aws/diag${i}.mmd -o docs/aws/renders/diag${i}.png -w 1600
done
```

### Archivo de configuración Mermaid recomendado (`mermaid-config.json`)

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

## Resumen de diagramas

| # | Tipo Mermaid | Ubicación principal | Propósito |
|---|---|---|---|
| 1 | `C4Context` | `arquitectura-aws.md §1` | Contexto del sistema — actores y sistemas externos |
| 2 | `C4Container` | `arquitectura-aws.md §2` | Contenedores AWS y protocolos entre servicios |
| 3 | `flowchart TD` | `arquitectura-aws.md §3` | Topología de red multi-AZ con subnets y VPC |
| 4 | `sequenceDiagram` | `escalabilidad.md §1` | Flujo temporal webhook → Queue Mode → RDS → Auto Scaling |
| 5 | `flowchart LR` | `seguridad-iam.md §1` | Zonas de confianza y controles de seguridad |
| 6 | `graph TD` | `seguridad-iam.md §2` | Jerarquía IAM: roles → políticas → recursos |
| 7 | `xychart-beta` | `estimacion-costos.md §3` | Comparación de costos por componente y tier |

---

## Diagrama 1 — Contexto del sistema (C4 Level 1)

**Tipo:** `C4Context`
**Justificación académica:** La notación C4 (Brown, 2018) es el estándar para documentación
arquitectónica en contextos académicos y de ingeniería de software. El Level 1 de contexto
muestra QUÉ interactúa con el sistema sin revelar detalles de implementación interna.
Es el punto de entrada ideal para el capítulo de arquitectura en la tesis.

**Ubicación:** Insertar imagen renderizada en `arquitectura-aws.md` al inicio de §1 (Contexto).

```mermaid
C4Context
  title Sistema de contexto — n8n-microframework en AWS

  Person(operador, "Operador de automatización", "Configura y monitorea flujos n8n via UI web")
  Person(desarrollador, "Desarrollador", "Importa flujos, valida REGs via validar-flujos.mjs")

  System(n8n_aws, "n8n-microframework AWS", "Motor de automatización LC/NC con Clean Architecture E1-E4 sobre ECS Fargate, RDS PostgreSQL y ElastiCache Redis")

  System_Ext(api_tickets, "API de Tickets", "Servicio externo de gestión de tickets de soporte")
  System_Ext(api_notif, "API de Notificaciones", "Canal de alertas diferenciadas por nivel (crítico/advertencia)")
  System_Ext(sensores, "Sensores IoT", "Dispositivos que envían lecturas de temperatura, humedad y CO2")

  Rel(operador, n8n_aws, "Configura flujos y visualiza ejecuciones", "HTTPS/UI :443")
  Rel(desarrollador, n8n_aws, "Valida arquitectura del micro-framework", "CLI / GitHub Actions")
  Rel(sensores, n8n_aws, "Envía lecturas periódicas", "HTTP POST webhook HTTPS")
  Rel(n8n_aws, api_tickets, "Crea y consulta tickets (idempotente)", "HTTPS REST + Idempotency-Key")
  Rel(n8n_aws, api_notif, "Envía alertas diferenciadas con retry", "HTTPS REST + retry E4")
```

---

## Diagrama 2 — Contenedores AWS (C4 Level 2)

**Tipo:** `C4Container`
**Justificación académica:** El Level 2 de contenedores C4 muestra los procesos/servicios
desplegables y sus interacciones. Es el nivel más usado en documentación técnica de tesis
porque permite anotar la tecnología de cada componente (ECS Fargate, RDS, Redis) con
los protocolos y puertos entre servicios. Corresponde a la "vista lógica de despliegue"
del modelo de vistas 4+1 de Kruchten.

**Ubicación:** Insertar imagen renderizada en `arquitectura-aws.md` al inicio de §2 (Inventario de servicios).

```mermaid
C4Container
  title Diagrama de contenedores — n8n-microframework en AWS

  Person(usuario, "Usuario / Sensor IoT", "Envía webhooks HTTPS o usa la UI de n8n")

  Container_Boundary(vpc, "AWS VPC 10.0.0.0/16 — us-east-1") {
    Container(waf, "AWS WAF", "Web Application Firewall", "OWASP Top 10 + rate limiting 1000 req/5min")
    Container(alb, "Application Load Balancer", "AWS ALB + ACM", "Termina TLS HTTPS :443, distribuye tráfico a n8n-main")
    Container(n8n_main, "n8n Main", "ECS Fargate · n8nio/n8n", "Interfaz de usuario, API REST, recepción de webhooks, encolado BullMQ")
    Container(n8n_workers, "n8n Workers", "ECS Fargate · n8nio/n8n (Queue Mode)", "Ejecutan workflows E1-E4 consumiendo jobs desde Redis. Auto-scaling 2–8 instancias")
    ContainerDb(rds, "PostgreSQL", "Amazon RDS Multi-AZ", "Persistencia de ejecuciones n8n, lecturas_sensor, interacciones_bot. Esquema con idempotency_key")
    ContainerDb(redis, "Redis", "ElastiCache Redis 7", "Cola BullMQ para distribución de jobs entre workers. TLS + auth token")
    Container(secrets, "Secrets Manager", "AWS Secrets Manager", "N8N_ENCRYPTION_KEY, DB_PASSWORD, Redis auth token, API tokens. Rotación automática")
    Container(s3, "S3 Bucket", "Amazon S3", "Binary data de ejecuciones n8n. SSE-S3, versioning, lifecycle policy")
    Container(cw, "CloudWatch", "AWS CloudWatch", "Logs JSON E1-E4 persistentes, métricas, alarmas, dashboard operacional")
    Container(mock_bot, "mock-bot", "ECS Fargate · Node.js :3001", "Simula API de tickets (Dev/Staging). Lambda en Producción")
    Container(mock_iot, "mock-iot", "ECS Fargate · Node.js :3002", "Simula API de notificaciones IoT (Dev/Staging). Lambda en Producción")
  }

  Rel(usuario, waf, "HTTPS :443")
  Rel(waf, alb, "Tráfico filtrado")
  Rel(alb, n8n_main, "HTTP :5678 (interno VPC)")
  Rel(n8n_main, redis, "RPUSH jobs BullMQ · TLS :6379")
  Rel(n8n_workers, redis, "BLPOP jobs BullMQ · TLS :6379")
  Rel(n8n_main, rds, "SQL DDL/queries · TLS :5432")
  Rel(n8n_workers, rds, "INSERT ON CONFLICT · TLS :5432")
  Rel(n8n_workers, mock_bot, "HTTP POST tickets · :3001")
  Rel(n8n_workers, mock_iot, "HTTP POST alertas · :3002")
  Rel(n8n_main, secrets, "GetSecretValue · VPC Endpoint")
  Rel(n8n_workers, s3, "PutObject/GetObject · VPC Endpoint")
  Rel(n8n_main, cw, "stdout JSON logs E1-E4")
  Rel(n8n_workers, cw, "stdout JSON logs E1-E4")
```

---

## Diagrama 3 — Topología de red multi-AZ

**Tipo:** `flowchart TD` con subgraphs anidados
**Justificación académica:** Los diagramas C4 no modelan bien la distribución física en
zonas de disponibilidad (AZs) ni la jerarquía de subnets. El `flowchart` con subgraphs
permite representar la jerarquía VPC → Subnet → AZ → Servicio con claridad visual.
Es el tipo estándar en documentación de arquitecturas cloud (AWS Well-Architected Framework,
whitepapers de AWS) y en referencias como "Cloud Architecture Patterns" (Wilder, 2012).

**Ubicación:** Insertar imagen renderizada en `arquitectura-aws.md` al inicio de §3 (Diseño de red).

```mermaid
flowchart TD
  IGW[Internet Gateway]:::aws
  WAF[AWS WAF\nOpcional Producción]:::aws
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
        RedisR["ElastiCache Redis\nRéplica\nredis-sg"]:::db
      end
    end
  end

  subgraph GLOBAL["Servicios globales / regionales"]
    SM["Secrets Manager\nvía VPC Endpoint"]:::aws
    S3["S3 Bucket\nn8n-microframework-binaries\nvía VPC Endpoint"]:::aws
    CW["CloudWatch Logs\n/ecs/n8n-main\n/ecs/n8n-workers"]:::aws
  end

  ALB --> MainA & MainB
  MainA --> NATA
  MainB --> NATB
  MainA & WorkerA --> RedisP
  MainB & WorkerB --> RedisP
  WorkerA --> RDSP
  WorkerB --> RDSP
  RDSP -.->|"replicación síncrona"| RDSS
  RedisP -.->|"replicación async"| RedisR
  MainA & WorkerA & MainB & WorkerB --> SM & S3 & CW

  classDef aws fill:#FF9900,stroke:#232F3E,color:#000
  classDef ecs fill:#C7F0C7,stroke:#2D6A2D,color:#000
  classDef db fill:#C0D8F0,stroke:#1A4F7A,color:#000
```

---

## Diagrama 4 — Flujo de ejecución en Queue Mode (Sequence)

**Tipo:** `sequenceDiagram`
**Justificación académica:** El diagrama de secuencia es el estándar UML (ISO/IEC 19501)
para documentar interacciones temporales ordenadas entre actores y sistemas. Es el tipo
más apropiado para mostrar el flujo asíncrono de Queue Mode: la separación temporal entre
la recepción del webhook (n8n-main responde < 50ms) y la ejecución del workflow en el
worker (E1-E4) es el comportamiento más importante de esta arquitectura y se representa
naturalmente en secuencia.

**Ubicación:** Insertar imagen renderizada en `escalabilidad.md` después del párrafo introductorio de §1.

*(Diagrama reproducido de `escalabilidad.md §1` — fuente canónica en este archivo)*

```mermaid
sequenceDiagram
  actor Sensor as Sensor IoT
  participant ALB as ALB
  participant Main as n8n-main<br/>(ECS Fargate)
  participant Redis as Redis<br/>(ElastiCache)
  participant Worker as n8n-worker<br/>(ECS Fargate)
  participant RDS as PostgreSQL<br/>(RDS Multi-AZ)
  participant CW as CloudWatch

  Sensor->>ALB: POST /webhook/iot-sensor-to-be (HTTPS :443)
  ALB->>Main: HTTP :5678 (alb-sg rule)
  Main->>Main: E1 — Validación de campos<br/>+ timestamp authority
  Main->>Redis: RPUSH job:{runId} payload<br/>(BullMQ enqueue)
  Main-->>Sensor: HTTP 202 Accepted<br/>(< 50ms — Main no bloquea)

  Note over Redis,Worker: Worker consume job de la cola
  Redis->>Worker: BLPOP job:{runId}
  Worker->>Worker: E2 — Lógica de dominio<br/>(umbrales centralizados ADR-002 IoT)
  Worker->>RDS: INSERT INTO lecturas_sensor<br/>ON CONFLICT (idempotency_key) DO NOTHING
  RDS-->>Worker: OK (idempotente — REG-005)
  Worker->>Worker: E4 — Routing por nivel_alerta<br/>+ retry maxRetries=3 (crítico)
  Worker->>CW: stdout JSON {"etapa":"E4","status":"ok",<br/>"duracion_ms":183,"nivel_alerta":"critico"}

  Note over CW: Metric publicada: n8n/QueueDepth
  CW->>CW: Evalúa alarma:<br/>QueueDepth > 10 jobs?

  alt Queue saturada (QueueDepth > 10)
    CW->>Worker: Auto Scaling — scale-out<br/>(+1 ECS task, cooldown 60s)
    Note over Worker: Min=2, Max=8 tasks
  else Queue normal (QueueDepth < 2, 5 min)
    CW->>Worker: Auto Scaling — scale-in<br/>(-1 ECS task, cooldown 300s)
  end
```

---

## Diagrama 5 — Zonas de confianza y controles de seguridad

**Tipo:** `flowchart LR` con subgraphs de zonas + classDef por color
**Justificación académica:** Los "boundary diagrams" de seguridad (similares a los Data Flow
Diagrams del método STRIDE de Microsoft) se representan mejor con flowchart porque permiten
agrupar servicios por zona de confianza y colorear los límites de control. El flujo de
izquierda a derecha (LR) refleja la dirección natural de una request: Internet → Zona pública
→ Zona de aplicación → Zona de datos. Este tipo es el más usado en documentos de seguridad
arquitectónica cloud (AWS Security Reference Architecture, NIST SP 800-207 Zero Trust).

**Ubicación:** Insertar imagen renderizada en `seguridad-iam.md §1` después del párrafo introductorio.

*(Diagrama reproducido de `seguridad-iam.md §1` — fuente canónica en este archivo)*

```mermaid
flowchart LR
  subgraph INTERNET["☁ Internet"]
    USER[Usuario / Sensor IoT]
  end

  subgraph PUBLIC["🌐 Zona Pública\n(Public Subnets)"]
    WAF[AWS WAF\nOWASP Rules\nRate Limit 1000/5min]:::sec
    ALB[ALB\nACM TLS — wildcard cert\nHTTPS :443 only]:::sec
  end

  subgraph APP["🔒 Zona de Aplicación\n(Private Subnets)"]
    MAIN["n8n-main\nalb-sg → :5678 only\nIAM: n8n-main-task-role"]:::app
    WORKERS["n8n-workers\nSin ingress externo\nIAM: n8n-worker-task-role"]:::app
    SM["Secrets Manager\nGetSecretValue\nvía VPC Endpoint (no internet)"]:::sec
  end

  subgraph DATA["🗄 Zona de Datos\n(Data Subnets)"]
    RDS["RDS PostgreSQL\n:5432 ← App-SG only\nKMS CMK encryption\nMulti-AZ"]:::data
    REDIS["ElastiCache Redis\n:6379 ← App-SG only\nTLS in transit\nAuth Token"]:::data
    S3["S3 Bucket\nSSE-S3 encryption\nVPC Endpoint\nBucket Policy: IAM only"]:::data
  end

  subgraph OBS["📊 Observabilidad"]
    CW["CloudWatch\nLogs + Metrics\nAlarms → SNS Email"]:::obs
  end

  USER -->|"HTTPS :443"| WAF
  WAF -->|"Tráfico filtrado"| ALB
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

## Diagrama 6 — Jerarquía IAM: roles → políticas → recursos

**Tipo:** `graph TD`
**Justificación académica:** La jerarquía IAM (Role → Policy → Actions → Resources) es
naturalmente un árbol dirigido de arriba hacia abajo. El `graph TD` (top-down) es el tipo
más legible para estructuras jerárquicas con múltiples niveles y permite usar subgraphs
para agrupar por categoría. Es preferible al `flowchart` cuando el énfasis está en la
estructura de herencia/delegación y no en el flujo temporal de datos.

**Ubicación:** Insertar imagen renderizada en `seguridad-iam.md §2` después del párrafo sobre "Principios aplicados".

*(Diagrama reproducido de `seguridad-iam.md §2` — fuente canónica en este archivo)*

```mermaid
graph TD
  subgraph ROLES["IAM Task Roles — Least Privilege"]
    R1[n8n-main-task-role]:::role
    R2[n8n-worker-task-role]:::role
    R3[rds-monitoring-role]:::role
    R4[ci-deploy-role]:::role
  end

  subgraph POLICIES["Políticas adjuntas"]
    P1["SecretsManagerReadPolicy\nGetSecretValue\narn:aws:secretsmanager:*:n8n/*"]:::policy
    P2["S3ReadWritePolicy\ns3:GetObject · s3:PutObject\narn:aws:s3:::n8n-microframework-binaries/*"]:::policy
    P3["CloudWatchLogsPolicy\nlogs:CreateLogStream\nlogs:PutLogEvents\n/ecs/n8n-*"]:::policy
    P4["ECRPullPolicy\necr:GetAuthorizationToken\necr:BatchGetImage · ecr:GetDownloadURL"]:::policy
    P5["RDSEnhancedMonitoringPolicy\nAWS Managed: AmazonRDSEnhancedMonitoringRole"]:::policy
    P6["ECSDeployPolicy\necs:UpdateService\necs:RegisterTaskDefinition\necs:DescribeServices"]:::policy
  end

  subgraph RESOURCES["Recursos destino (ARNs específicos)"]
    S1["Secrets Manager\narn:aws:secretsmanager:us-east-1:ACCOUNT:secret:n8n/*"]:::res
    S2["S3 Bucket\narn:aws:s3:::n8n-microframework-binaries"]:::res
    S3R["CloudWatch Log Groups\narn:aws:logs:us-east-1:ACCOUNT:log-group:/ecs/n8n-*"]:::res
    S4["ECR Repository\narn:aws:ecr:us-east-1:ACCOUNT:repository/n8n-microframework"]:::res
    S5["RDS Enhanced Monitoring\nCloudWatch — métricas OS nivel"]:::res
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

## Diagrama 7 — Estimación de costos por tier (XY Chart)

**Tipo:** `xychart-beta` (bar chart)
**Justificación académica:** El `xychart-beta` de Mermaid permite visualizar comparaciones
cuantitativas de forma nativa sin herramientas externas. Un bar chart de costos por
componente y tier es más inmediatamente legible que una tabla de texto y facilita la
comparación visual entre entornos. En el contexto académico de la tesis, este diagrama
respalda la afirmación de que el diseño es "costo-eficiente" al mostrar la escala de
costos diferenciada por tier y por componente.

**Ubicación:** Insertar imagen renderizada en `estimacion-costos.md §3` (Comparación visual por tier).

*(Diagrama reproducido de `estimacion-costos.md §3` — fuente canónica en este archivo)*

```mermaid
xychart-beta
  title "Estimación de costos mensuales (USD) por componente y tier"
  x-axis ["ECS Main", "ECS Workers", "ECS Mocks", "RDS PostgreSQL", "ElastiCache", "ALB", "NAT GW", "S3+CW+Otros"]
  y-axis "USD/mes" 0 --> 150
  bar [6, 6, 3, 15, 0, 0, 0, 3]
  bar [32, 65, 11, 25, 17, 10, 37, 11]
  bar [65, 130, 10, 50, 51, 23, 87, 42]
```

*Leyenda: las tres barras por componente representan Dev · Staging · Producción respectivamente.*

---

## Referencias

- C4 Model: Simon Brown (2018). *The C4 model for software architecture*. InfoQ.
- Mermaid Documentation: https://mermaid.js.org/intro/
- AWS Well-Architected Framework: https://docs.aws.amazon.com/wellarchitected/
- Kruchten, P. (1995). The 4+1 View Model of Architecture. IEEE Software.
- Wilder, B. (2012). *Cloud Architecture Patterns*. O'Reilly Media.
