> 🌐 **Idioma / Language:** Español · [English](arquitectura-aws.en.md)

# Diseño de Arquitectura AWS — n8n Micro-framework

**Versión:** 1.0
**Fecha:** 2026-05-18
**Autor:** Elian Hernando Gil Sierra
**Entregable:** R3 — OE4 del anteproyecto MGADS-UNAB
**Alcance:** Diseño de referencia — no implica despliegue productivo

---

## Tabla de contenidos

1. [Contexto y objetivos](#1-contexto-y-objetivos)
2. [Vista de contenedores — Servicios AWS](#2-vista-de-contenedores)
3. [Diseño de red — VPC y subredes](#3-diseño-de-red)
4. [Capa de cómputo — ECS Fargate](#4-capa-de-computo)
5. [Capa de datos — RDS, Redis y S3](#5-capa-de-datos)
6. [Mapeo arquitectura local → AWS](#6-mapeo-local-aws)
7. [Requisitos de configuración de n8n](#7-configuracion-n8n)
8. [Opciones de despliegue por tier](#8-opciones-de-despliegue)
9. [Resolución de riesgos ATAM](#9-resolucion-riesgos-atam)
10. [Referencias](#10-referencias)

---

## 1. Contexto y objetivos

### 1.1 Problema que aborda este diseño

La arquitectura local del proyecto (definida en `infraestructura/docker-compose.yml`) ejecuta n8n sobre Docker en un único host. Este modelo, válido para el entorno de investigación, presenta las limitaciones sistémicas documentadas durante la evaluación ATAM (Fase 7):

- **R-GLOBAL-01** — Logs en stdout son efímeros: el reinicio del contenedor destruye el historial de diagnóstico.
- **R-BOT-01** — Los tokens de API se gestionan manualmente sin rotación automática.
- **R-GLOBAL-02** — Los contratos con servicios externos no tienen circuit breaker ni fallback en caso de indisponibilidad prolongada.
- **TP-GLOBAL-01** — La latencia se incrementa con la modularización E1-E4; en un entorno de un solo nodo, los subflujos compiten por el mismo CPU.

Este documento describe cómo una arquitectura AWS resuelve estos riesgos manteniendo los principios del micro-framework (separación E1–E4, REG-001…010).

### 1.2 Objetivos del diseño (OE4)

| Objetivo | Cómo se aborda |
|---|---|
| Opciones de despliegue | 3 tiers (Dev, Staging, Prod) con servicios diferenciados |
| Puntos de escalado | ECS Workers auto-scaling por profundidad de cola Redis |
| Controles de seguridad | IAM least privilege, Secrets Manager, KMS, WAF — ver `seguridad-iam.md` |
| Observabilidad | CloudWatch Logs (logs JSON E1-E4), Metrics, Alarms — ver `observabilidad-aws.md` |
| Operación | Rolling updates, Blue/Green, backup automatizado — ver `escalabilidad.md` |
| Costo-eficiencia | Estimación por tier con optimizaciones — ver `estimacion-costos.md` |

### 1.3 Decisión arquitectónica central

**Patrón adoptado: ECS Fargate + n8n Queue Mode + RDS PostgreSQL Multi-AZ**

n8n soporta dos modos de ejecución: *main mode* (todas las responsabilidades en un proceso) y *queue mode* (Main para UI/webhooks + Workers desacoplados para ejecución). Para un despliegue AWS escalable, **queue mode es obligatorio**: permite escalar los Workers horizontalmente sin afectar la disponibilidad de la UI y los webhooks.

Las decisiones de tecnología están documentadas en los ADRs:
- `ADR-MF-005` — ECS Fargate vs. EC2 vs. EKS
- `ADR-MF-006` — n8n Queue Mode con Redis
- `ADR-MF-007` — RDS PostgreSQL Multi-AZ

---

## 2. Vista de contenedores — Servicios AWS

> **Diagrama 1** (C4 Context) y **Diagrama 2** (C4 Container) — ver `diagramas-aws.md` §1 y §2.
> Insertar imágenes PNG renderizadas desde `diagramas-aws.md` al incorporar este documento en la tesis.

### 2.1 Inventario de servicios AWS

| Servicio AWS | Rol en la arquitectura | Equivalente local |
|---|---|---|
| **Application Load Balancer (ALB)** | Punto de entrada HTTPS, termina TLS, distribuye a n8n-main | Puerto 5678 expuesto directamente |
| **ECS Fargate — n8n-main** | UI de n8n, API REST, recepción de webhooks, encolado de jobs en Redis | Container n8n en docker-compose |
| **ECS Fargate — n8n-workers** | Ejecución de workflows (E1→E2→E3→E4), escala 2–8 instancias | Mismo container n8n (sin separación) |
| **ECS Fargate — mock-bot** | API de tickets (simulación de servicio externo) | Container mock_bot :3001 |
| **ECS Fargate — mock-iot** | API de notificaciones (simulación de servicio externo) | Container mock_iot :3002 |
| **Amazon RDS PostgreSQL** | Persistencia de ejecuciones n8n, `lecturas_sensor`, `interacciones_bot` | Container postgres :5432 |
| **Amazon ElastiCache Redis** | Cola BullMQ para Queue Mode | No existe en arquitectura local |
| **Amazon S3** | Binary data de ejecuciones n8n (archivos adjuntos) | Volumen `n8n_data` |
| **AWS Secrets Manager** | N8N_ENCRYPTION_KEY, DB_PASSWORD, Redis auth, API tokens | Archivo `.env` (local) |
| **AWS Certificate Manager (ACM)** | Certificados SSL/TLS con renovación automática | Ninguno (HTTP en local) |
| **Amazon CloudWatch** | Logs JSON estructurados E1-E4, métricas, alarmas | stdout efímero (local) |
| **AWS WAF** | Protección OWASP top-10, rate limiting (opcional en Prod) | Ninguno |
| **Amazon Route 53** | DNS para el dominio del ALB | `localhost` |

### 2.2 Justificación de servicios no incluidos

| Servicio considerado | Motivo de exclusión |
|---|---|
| Amazon EKS (Kubernetes) | Complejidad operacional desproporcionada para la escala del proyecto. ECS Fargate es suficiente. |
| AWS Lambda (para n8n) | n8n requiere estado persistente y conexión larga con Redis/RDS; no es compatible con el modelo serverless de Lambda. |
| Amazon SQS | n8n Queue Mode usa BullMQ sobre Redis (no SQS). Migrar requeriría modificar el core de n8n. |
| Amazon EFS | S3 es la opción oficial de n8n para external storage (documentado en n8n docs). EFS añade costo sin beneficio claro. |
| AWS Cognito | La autenticación de n8n se gestiona internamente o via SSO/SAML. Fuera del alcance de R3. |

---

## 3. Diseño de red — VPC y subredes

> **Diagrama 3** (Topología multi-AZ) — ver `diagramas-aws.md` §3.

### 3.1 Configuración de la VPC

| Parámetro | Valor |
|---|---|
| CIDR principal | `10.0.0.0/16` |
| Zonas de disponibilidad | 2 (us-east-1a, us-east-1b) — mínimo para alta disponibilidad |
| Internet Gateway | 1 (adjunto a la VPC) |
| NAT Gateways | 2 (uno por AZ) — alta disponibilidad para tráfico de salida |
| DNS hostnames | Habilitado |
| DNS resolution | Habilitado |

### 3.2 Subredes

| Subred | CIDR | AZ | Tipo | Uso |
|---|---|---|---|---|
| public-subnet-a | `10.0.1.0/24` | us-east-1a | Pública | NAT Gateway A, ALB |
| public-subnet-b | `10.0.4.0/24` | us-east-1b | Pública | NAT Gateway B, ALB |
| private-subnet-a | `10.0.2.0/24` | us-east-1a | Privada | ECS tasks (n8n-main, workers, mocks) |
| private-subnet-b | `10.0.5.0/24` | us-east-1b | Privada | ECS tasks (n8n-main, workers, mocks) |
| data-subnet-a | `10.0.3.0/24` | us-east-1a | Privada (aislada) | RDS Primary, Redis Primary |
| data-subnet-b | `10.0.6.0/24` | us-east-1b | Privada (aislada) | RDS Standby, Redis Replica |

**Principio de diseño:** Los servicios de datos (RDS, Redis) se ubican en subredes aisladas sin ruta directa al Internet Gateway. Solo los Security Groups de la capa de aplicación tienen acceso a los puertos de datos.

### 3.3 Security Groups

| Security Group | Ingress permitido | Egress | Propósito |
|---|---|---|---|
| `alb-sg` | :443 desde 0.0.0.0/0 | :5678 → n8n-main-sg | ALB público |
| `n8n-main-sg` | :5678 desde alb-sg | :6379 redis-sg, :5432 rds-sg, :443 cualquier (HTTPS externo) | n8n Main |
| `n8n-worker-sg` | Sin ingress externo | :6379 redis-sg, :5432 rds-sg, :443 cualquier | n8n Workers |
| `mock-sg` | :3001/:3002 desde n8n-main-sg, n8n-worker-sg | :443 cualquier | Servicios mock |
| `rds-sg` | :5432 desde n8n-main-sg, n8n-worker-sg | Sin egress | RDS PostgreSQL |
| `redis-sg` | :6379 desde n8n-main-sg, n8n-worker-sg | Sin egress | ElastiCache Redis |

### 3.4 VPC Endpoints (evitan tráfico por Internet)

| Servicio | Tipo de endpoint | Beneficio |
|---|---|---|
| `com.amazonaws.us-east-1.secretsmanager` | Interface | n8n lee secretos sin salir a Internet |
| `com.amazonaws.us-east-1.s3` | Gateway | Tráfico S3 sin cargo de NAT Gateway |
| `com.amazonaws.us-east-1.ecr.api` | Interface | Pull de imágenes ECS sin NAT |
| `com.amazonaws.us-east-1.logs` | Interface | CloudWatch Logs sin NAT |

---

## 4. Capa de cómputo — ECS Fargate

### 4.1 ECS Cluster

- **Nombre:** `n8n-microframework-cluster`
- **Tipo:** AWS Fargate (Serverless — sin gestión de instancias EC2)
- **Container Insights:** Habilitado (métricas de CPU, memoria por tarea)

### 4.2 Task Definitions

#### n8n-main

| Parámetro | Valor |
|---|---|
| Familia | `n8n-main` |
| Launch type | FARGATE |
| CPU | 1024 (1 vCPU) |
| Memoria | 2048 MB (2 GB) |
| Imagen | `n8nio/n8n:latest` (producción: imagen fija con digest SHA256) |
| Puerto | 5678 |
| Health check | `CMD-SHELL curl -f http://localhost:5678/healthz || exit 1` |
| IAM Task Role | `n8n-main-task-role` (ver `seguridad-iam.md`) |
| Log driver | `awslogs` → `/ecs/n8n-main` |

Variables de entorno (valor desde Secrets Manager, no hardcodeadas):

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

Igual que n8n-main con las siguientes diferencias:

```
EXECUTIONS_MODE             = queue
# N8N_HOST, WEBHOOK_URL, N8N_PORT no son necesarios en workers
# Workers no exponen puertos — no tienen listener HTTP
```

Sin puerto expuesto. Sin health check HTTP (ECS monitorea el proceso directamente).

#### mock-bot / mock-iot

| Parámetro | Valor |
|---|---|
| CPU | 256 (0.25 vCPU) |
| Memoria | 512 MB |
| Imagen | Imagen Node.js 20-alpine custom (construida desde el código de `infraestructura/`) |
| Puertos | mock-bot: 3001 / mock-iot: 3002 |

### 4.3 ECS Services

| Service | Task Definition | Desired count | Min | Max | Subredes |
|---|---|---|---|---|---|
| `n8n-main-service` | n8n-main | 2 | 1 | 4 | private-a, private-b |
| `n8n-workers-service` | n8n-workers | 2 | 2 | 8 | private-a, private-b |
| `mock-bot-service` | mock-bot | 1 | 1 | 2 | private-a |
| `mock-iot-service` | mock-iot | 1 | 1 | 2 | private-a |

### 4.4 Application Load Balancer

| Parámetro | Valor |
|---|---|
| Esquema | Internet-facing |
| Tipo | Application (ALB) |
| Subredes | public-subnet-a, public-subnet-b |
| Security Group | alb-sg |
| Listener | HTTPS :443, certificado ACM |
| Redirect | HTTP :80 → HTTPS :443 (301) |
| Target Group | n8n-main:5678, health check GET /healthz, threshold 2/2 |
| Sticky sessions | Habilitado (cookie AWSALB, 1 hora) — necesario para UI n8n |

---

## 5. Capa de datos — RDS, Redis y S3

### 5.1 Amazon RDS PostgreSQL

| Parámetro | Dev/Staging | Producción |
|---|---|---|
| Motor | PostgreSQL 16 | PostgreSQL 16 |
| Clase de instancia | db.t3.micro | db.t3.small |
| Multi-AZ | No | **Sí** (failover < 60 s) |
| Storage | gp3, 20 GB | gp3, 100 GB (auto-scaling hasta 500 GB) |
| IOPS | 3000 (gp3 base) | 3000 (gp3 base) |
| Cifrado at rest | KMS (AWS managed key) | KMS (Customer managed key) |
| Automated backups | 7 días | 7 días |
| Backup window | 03:00-04:00 UTC | 03:00-04:00 UTC |
| Maintenance window | Domingo 04:00-05:00 UTC | Domingo 04:00-05:00 UTC |
| Parameter group | `log_min_duration_statement=1000` | `log_min_duration_statement=500` |
| Deletion protection | No | **Sí** |
| Performance Insights | No | **Sí** (retención 7 días) |

**Schema inicial (idéntico al local):**

```sql
-- Persistencia IoT (micro-framework E3)
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

-- Persistencia Bot (micro-framework E3)
CREATE TABLE interacciones_bot (
  id                SERIAL PRIMARY KEY,
  run_id            VARCHAR(100) UNIQUE NOT NULL,
  categoria         VARCHAR(50),
  prioridad         VARCHAR(20),
  ticket_id         VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Dead-letter para error workflow IoT (R-IOT-01 mitigado)
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

| Parámetro | Dev/Staging | Producción |
|---|---|---|
| Motor | Redis 7.x | Redis 7.x |
| Clase de nodo | cache.t3.micro | cache.t3.small |
| Número de nodos | 1 (sin réplica) | 2 (1 primario + 1 réplica) |
| Cluster mode | Disabled | Disabled |
| Cifrado en tránsito | **Sí** (TLS) | **Sí** (TLS) |
| Auth token | Sí (via Secrets Manager) | Sí (via Secrets Manager) |
| Backup | No | Sí (snapshot diario) |
| Uso principal | Cola BullMQ para n8n Queue Mode | Cola BullMQ para n8n Queue Mode |

### 5.3 Amazon S3

| Parámetro | Valor |
|---|---|
| Nombre del bucket | `n8n-microframework-binaries-{account-id}` |
| Región | us-east-1 |
| Versioning | Habilitado |
| Cifrado | SSE-S3 (AES-256) |
| Acceso público | **Bloqueado completamente** |
| Bucket policy | Solo permite acceso desde `n8n-worker-task-role` via IAM |
| Lifecycle policy | Mover a S3-IA después de 30 días; expirar después de 180 días |
| Propósito | Binary data de ejecuciones n8n (archivos adjuntos de workflows) |

---

## 6. Mapeo arquitectura local → AWS

| Componente local | Equivalente AWS | Diferencia clave |
|---|---|---|
| `docker-compose.yml` | ECS Task Definitions + Services | Definiciones declarativas en JSON/YAML; ECS gestiona el ciclo de vida |
| Container n8n único | ECS n8n-main + ECS n8n-workers (separados) | Queue Mode: Main encola, Workers ejecutan. Escala independiente. |
| Container postgres | RDS PostgreSQL Multi-AZ | Managed: backups automáticos, failover, cifrado, Performance Insights |
| Container mock_bot :3001 | ECS Fargate mock-bot-service | Misma imagen; en AWS en subred privada sin acceso externo directo |
| Container mock_iot :3002 | ECS Fargate mock-iot-service | Ídem |
| Volumen `n8n_data` | S3 bucket (binary data) + Secrets Manager (credentials) | S3 es infinitamente escalable; Secrets Manager gestiona rotación |
| Logs stdout | CloudWatch Logs `/ecs/n8n-main`, `/ecs/n8n-workers` | Persistentes, indexables, consultables con Log Insights |
| Archivo `.env` | AWS Secrets Manager | Rotación automática, audit trail, acceso con IAM |
| Rate limiter en memoria (antipatrón) | Redis (ElastiCache) para rate limiting distribuido | Resuelve el antipatrón REG-002 en entorno multi-instancia |

---

## 7. Requisitos de configuración de n8n

### 7.1 Variables críticas de n8n para producción AWS

Las siguientes variables **nunca deben estar en código o en la imagen Docker**. Se inyectan en ECS Task Definition desde Secrets Manager:

| Variable | Criticidad | Notas |
|---|---|---|
| `N8N_ENCRYPTION_KEY` | **CRÍTICA** | Una vez establecida, cambiarla hace irrecuperables las credenciales almacenadas. Guardar en Secrets Manager **sin rotación automática**. |
| `WEBHOOK_URL` | Alta | Debe apuntar al DNS del ALB. Si cambia, los webhooks activos se rompen. |
| `DB_POSTGRESDB_PASSWORD` | Alta | Rotación automática cada 30 días via Secrets Manager + Lambda. |
| `QUEUE_BULL_REDIS_PASSWORD` | Alta | Rotar trimestralmente. |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | Media | Establecer en `true` para cumplir REG-001 (evita que un nodo Code lea variables de entorno del servidor). |

### 7.2 Consideraciones de n8n Queue Mode en multi-instancia

1. **Encryption Key compartida:** Todos los contenedores (main y workers) deben tener **exactamente la misma** `N8N_ENCRYPTION_KEY`. Se distribuye a través de Secrets Manager.
2. **Sin estado local:** n8n-main no puede guardar estado en disco (los datos temporales de ejecución van a Redis y RDS). El volumen `n8n_data` local no existe en Fargate — las credenciales se gestionan en Secrets Manager.
3. **Webhook URL fija:** `WEBHOOK_URL` apunta al DNS del ALB. Los flujos importados del entorno local deben tener sus webhooks re-activados para que n8n registre la nueva URL.
4. **Re-importación de flujos:** Los flujos exportados (`bot-to-be-orquestador.json`, `iot-to-be-*`) se importan vía la UI de n8n en el entorno AWS. Los `workflowId` de los subflujos cambian tras la importación y deben actualizarse en los orquestadores (igual que en el entorno local).

---

## 8. Opciones de despliegue por tier

| Aspecto | Tier Dev | Tier Staging | Tier Prod |
|---|---|---|---|
| n8n mode | Main mode (sin Queue) | Queue Mode | **Queue Mode** |
| n8n-main | 1 tarea, 0.5 vCPU, 1 GB | 1 tarea, 1 vCPU, 2 GB | 2 tareas, 1 vCPU, 2 GB |
| n8n-workers | 0 | 1 tarea fija | 2–8 tareas (auto-scaling) |
| RDS | db.t3.micro, Single-AZ | db.t3.small, Single-AZ | db.t3.small, **Multi-AZ** |
| Redis | No (n8n usa SQLite/Postgres sin queue) | cache.t3.micro, 1 nodo | cache.t3.small, 2 nodos |
| ALB | No (acceso directo al puerto ECS vía IP) | Sí | **Sí** |
| WAF | No | No | **Sí** |
| Secrets Manager | No (variables de entorno directas) | Sí | **Sí** |
| Deletion protection | No | No | **Sí** |
| Costo estimado | ~$75/mes | ~$210/mes | ~$390–750/mes |

---

## 9. Resolución de riesgos ATAM en el diseño AWS

Los siguientes riesgos abiertos identificados en la Fase 7 (ATAM) quedan mitigados por este diseño:

| Riesgo ATAM | Descripción | Mitigación en AWS | Estado |
|---|---|---|---|
| **R-GLOBAL-01** | Logs en stdout efímeros — container restart destruye el historial | CloudWatch Logs: logs persistentes 30 días, indexables, con Log Insights | ✅ Mitigado → Non-risk |
| **R-BOT-01** | Rotación manual de tokens sin auto-rotación | Secrets Manager con rotation Lambda cada 30 días para DB_PASSWORD; n8n External Secrets para API tokens | ✅ Mitigado (parcial para N8N_ENCRYPTION_KEY que no puede rotarse) |
| **R-IOT-01** | Dead-letter puede no insertarse si E4 y el canal de notificación están caídos (SP-IOT-01) | Tabla `dead_letter_iot` en RDS (independiente de E4) gestionada desde el error workflow; E3 PostgreSQL es independiente de E4 | ✅ Mitigado — R3 separa E3 de E4 estructuralmente |
| **R-GLOBAL-02** | Dependencia de contratos de servicios externos sin fallback | ALB timeout configurado + n8n retry (REG-004) + CloudWatch alarm si mock-bot/iot no responde | ⚠️ Parcialmente mitigado — circuit breaker completo requiere implementación en E3 |
| **SP-IOT-01** | Canal del error handler coincide con canal de E4 | En AWS: error handler escribe a `dead_letter_iot` en RDS (no a E4); E4 sigue siendo el canal de notificación. Paths desacoplados. | ✅ Resuelto estructuralmente |

---

## 10. Referencias

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley.
- Brown, S. (2018). *Software Architecture for Developers* — C4 Model. Leanpub.
- AWS. (2026). *Amazon ECS Developer Guide*. docs.aws.amazon.com/ecs
- AWS. (2026). *Amazon RDS User Guide*. docs.aws.amazon.com/rds
- n8n. (2026). *Scaling n8n — Queue Mode*. docs.n8n.io/hosting/scaling/queue-mode/
- n8n. (2026). *Environment Variables*. docs.n8n.io/hosting/configuration/environment-variables/
- OWASP. (2021). *OWASP Top Ten*. owasp.org/www-project-top-ten/

---

*Documento generado como parte del entregable R3 (OE4) del trabajo de grado MGADS-UNAB 2026.*
*Ver también: `seguridad-iam.md`, `observabilidad-aws.md`, `escalabilidad.md`, `estimacion-costos.md`, `diagramas-aws.md`*
