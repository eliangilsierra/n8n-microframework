# Índice de artefactos — Fase 8 · Diseño de Arquitectura AWS (OE4)

**Versión:** 1.0
**Fecha:** 2026-05-18
**OE4 alcanzado:** 100% — todos los artefactos producidos

---

## Objetivo del entregable R3

> "Proponer un diseño de arquitectura en AWS, costo-eficiente y escalable, alineado con
> el micro-framework, que describa opciones de despliegue, puntos de escalado, controles
> de seguridad, observabilidad y operación para soportar adopción y evolución en
> entornos productivos." — Anteproyecto MGADS, OE4

**Alcance:** Diseño de referencia documentado (no despliegue real en AWS).

---

## Decisión arquitectónica central

**Patrón:** ECS Fargate + n8n Queue Mode (BullMQ/Redis) + RDS PostgreSQL Multi-AZ

```
Internet → WAF → ALB (HTTPS/443 · ACM)
                   │
         ┌────────┴────────┐
   [AZ-a]                  [AZ-b]
   n8n-main (ECS)          n8n-main (ECS)
   n8n-workers × 1-4       n8n-workers × 1-4
         │                       │
         └────────┬──────────────┘
                  │
         ElastiCache Redis (BullMQ queue)
                  │
         RDS PostgreSQL Multi-AZ
                  │
         Secrets Manager · S3 · CloudWatch
```

---

## Artefactos producidos

### Documentos principales (`docs/aws/`)

| Artefacto | Propósito | Estado |
|---|---|---|
| `docs/aws/arquitectura-aws.md` | Documento principal: VPC, ECS, RDS, Redis, S3, mapeo local→AWS, tier options, resolución de riesgos ATAM | ✅ |
| `docs/aws/seguridad-iam.md` | IAM Task Roles, Secrets Manager, ACM, WAF, Security Groups, cifrado. Diagramas 5 y 6 | ✅ |
| `docs/aws/observabilidad-aws.md` | CloudWatch Logs, Log Insights queries, Metrics/Alarms, Dashboard. Resolución R-GLOBAL-01 | ✅ |
| `docs/aws/escalabilidad.md` | Queue Mode, auto-scaling workers, escalado RDS, Rolling/Blue-Green, mapeo REGs. Diagrama 4 | ✅ |
| `docs/aws/estimacion-costos.md` | Costos por tier (Dev/Staging/Prod), supuestos, optimizaciones. Diagrama 7 | ✅ |
| `docs/aws/diagramas-aws.md` | Fuente canónica de los 7 diagramas Mermaid con código, justificación y render instructions | ✅ |
| `docs/aws/INDEX.md` | Este archivo — índice de todos los artefactos de Fase 8 | ✅ |

### ADRs — Decisiones arquitectónicas (`microframework/adr/`)

| Artefacto | Decisión | Estado |
|---|---|---|
| `ADR-MF-005-ecs-fargate-vs-ec2.md` | ECS Fargate sobre EC2 e EKS — prioriza operabilidad sobre costo puro | ✅ |
| `ADR-MF-006-n8n-queue-mode.md` | Queue Mode con Redis — único mecanismo de escalado horizontal de n8n | ✅ |
| `ADR-MF-007-rds-multi-az.md` | RDS Multi-AZ en Producción — failover < 60s, SLA 99.95% | ✅ |

---

## Diagramas Mermaid producidos

| # | Tipo | Documento | Propósito |
|---|---|---|---|
| 1 | `C4Context` | `arquitectura-aws.md §1` | Contexto del sistema — actores y sistemas externos |
| 2 | `C4Container` | `arquitectura-aws.md §2` | Contenedores AWS y protocolos |
| 3 | `flowchart TD` | `arquitectura-aws.md §3` | Topología multi-AZ con VPC, subnets, AZs |
| 4 | `sequenceDiagram` | `escalabilidad.md §1` | Flujo temporal webhook → Queue → RDS → Auto Scaling |
| 5 | `flowchart LR` | `seguridad-iam.md §1` | Zonas de confianza y controles de seguridad |
| 6 | `graph TD` | `seguridad-iam.md §2` | Jerarquía IAM roles → políticas → recursos |
| 7 | `xychart-beta` | `estimacion-costos.md §3` | Costos mensuales por componente y tier |

Todos los diagramas están consolidados con código fuente + instrucciones de render en
`docs/aws/diagramas-aws.md`.

---

## Resolución de riesgos ATAM (Fase 7 → Fase 8)

| Riesgo/Hallazgo ATAM | Fase 7 | Resolución en AWS |
|---|---|---|
| **R-GLOBAL-01** — Logs efímeros | Risk abierto | ✅ CloudWatch Logs — logs persistentes 30 días |
| **R-BOT-01** — Sin rotación de tokens | Risk abierto | ✅ Secrets Manager — rotación automática 30 días |
| **R-IOT-01** — dead-letter bloqueado si canal caído | Risk abierto | ✅ CloudWatch Alarm como canal independiente vía SNS |
| **SP-IOT-01** — Canal error handler = canal E4 | Sensitivity Point | ✅ Alarm SNS independiente de canal de notificación E4 |
| **R-GLOBAL-02** — Contratos externos sin versionado | Risk abierto | ⚠️ Parcial — API Gateway versioning fuera del alcance del diseño de referencia |

---

## Estimación de costos por tier

| Tier | Uso | Costo estimado/mes |
|---|---|---|
| Dev | Desarrollo individual, 8h/día | ~$33 |
| Staging | QA 24/7, sin Multi-AZ | ~$208 |
| Producción | HA Multi-AZ, workers auto-scaling 2–8 | ~$458 (optimizable a ~$346 con Fargate Spot + Reserved RDS) |

---

## Verificación del entregable R3

- [x] `arquitectura-aws.md` cubre todos los requisitos de OE4: despliegue, escalado, seguridad, observabilidad, operación
- [x] Los 4 riesgos/hallazgos ATAM tienen resolución explícita en el diseño AWS (R-GLOBAL-02 parcial y documentado)
- [x] La estimación de costos tiene supuestos explícitos para los 3 tiers
- [x] Los 7 diagramas Mermaid son renderizables en mermaid.live
- [x] Los 3 ADRs siguen la plantilla de 7 secciones de `microframework/plantillas/ADR-plantilla.md`
- [x] Todo el diseño es coherente con las REGs del micro-framework (REG-001, REG-003, REG-004, REG-005, REG-006)
- [x] `estado-actual.md` refleja Fase 8 completada

---

## Referencias cruzadas con fases anteriores

```
docs/context/proyecto-overview.md          → OE4 y R3 definidos
medicion/consolidado/atam-evidencia.md     → Cobertura ATAM 92% que motiva el diseño
docs/atam/registro-riesgos-tradeoffs.md    → R-GLOBAL-01, R-BOT-01, R-IOT-01, SP-IOT-01
docs/atam/informe-atam-final.md            → Informe formal ATAM con hallazgos referenciados en AWS
microframework/reglas/reglas-obligatorias.md → REG-001..010 aplicadas en el diseño AWS
infraestructura/docker-compose.yml          → Ambiente local que se mapea al diseño AWS
```
