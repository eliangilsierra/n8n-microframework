> 🌐 **Language / Idioma:** English · [Español](INDEX.md)

# Artifact index — Phase 8 · AWS Architecture Design (SO4)

**Version:** 1.0
**Date:** 2026-05-18
**SO4 achieved:** 100% — all artifacts produced

---

## Objective of deliverable R3

> "Propose a cost-efficient and scalable AWS architecture design, aligned with the
> micro-framework, describing deployment options, scaling points, security controls,
> observability, and operation to support adoption and evolution in production
> environments." — MGADS Thesis Proposal, SO4

**Scope:** Documented reference design (no actual AWS deployment).

---

## Central architectural decision

**Pattern:** ECS Fargate + n8n Queue Mode (BullMQ/Redis) + RDS PostgreSQL Multi-AZ

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

## Artifacts produced

### Main documents (`infraestructura/aws/`)

| Artifact | Purpose | Status |
|---|---|---|
| `infraestructura/aws/arquitectura-aws.md` | Main document: VPC, ECS, RDS, Redis, S3, local→AWS mapping, tier options, ATAM risk resolution | ✅ |
| `infraestructura/aws/seguridad-iam.md` | IAM Task Roles, Secrets Manager, ACM, WAF, Security Groups, encryption. Diagrams 5 and 6 | ✅ |
| `infraestructura/aws/observabilidad-aws.md` | CloudWatch Logs, Log Insights queries, Metrics/Alarms, Dashboard. R-GLOBAL-01 resolution | ✅ |
| `infraestructura/aws/escalabilidad.md` | Queue Mode, worker auto-scaling, RDS scaling, Rolling/Blue-Green, REG mapping. Diagram 4 | ✅ |
| `infraestructura/aws/estimacion-costos.md` | Costs per tier (Dev/Staging/Prod), assumptions, optimizations. Diagram 7 | ✅ |
| `infraestructura/aws/diagramas-aws.md` | Canonical source of the 7 Mermaid diagrams with code, rationale, and render instructions | ✅ |
| `infraestructura/aws/INDEX.md` | This file — index of all Phase 8 artifacts | ✅ |

### ADRs — Architectural decisions (`microframework/adr/`)

| Artifact | Decision | Status |
|---|---|---|
| `ADR-MF-005-ecs-fargate-vs-ec2.md` | ECS Fargate over EC2 and EKS — prioritizes operability over pure cost | ✅ |
| `ADR-MF-006-n8n-queue-mode.md` | Queue Mode with Redis — the only horizontal-scaling mechanism for n8n | ✅ |
| `ADR-MF-007-rds-multi-az.md` | RDS Multi-AZ in Production — failover < 60s, SLA 99.95% | ✅ |

---

## Mermaid diagrams produced

| # | Type | Document | Purpose |
|---|---|---|---|
| 1 | `C4Context` | `arquitectura-aws.md §1` | System context — actors and external systems |
| 2 | `C4Container` | `arquitectura-aws.md §2` | AWS containers and protocols |
| 3 | `flowchart TD` | `arquitectura-aws.md §3` | Multi-AZ topology with VPC, subnets, AZs |
| 4 | `sequenceDiagram` | `escalabilidad.md §1` | Temporal flow webhook → Queue → RDS → Auto Scaling |
| 5 | `flowchart LR` | `seguridad-iam.md §1` | Trust zones and security controls |
| 6 | `graph TD` | `seguridad-iam.md §2` | IAM hierarchy roles → policies → resources |
| 7 | `xychart-beta` | `estimacion-costos.md §3` | Monthly costs by component and tier |

All diagrams are consolidated with source code + render instructions in
`infraestructura/aws/diagramas-aws.md`.

---

## ATAM risk resolution (Phase 7 → Phase 8)

| ATAM risk/finding | Phase 7 | Resolution in AWS |
|---|---|---|
| **R-GLOBAL-01** — Ephemeral logs | Open risk | ✅ CloudWatch Logs — 30-day persistent logs |
| **R-BOT-01** — No token rotation | Open risk | ✅ Secrets Manager — automatic 30-day rotation |
| **R-IOT-01** — Dead-letter blocked if channel is down | Open risk | ✅ CloudWatch Alarm as an independent channel via SNS |
| **SP-IOT-01** — Error handler channel = SO4 channel | Sensitivity Point | ✅ SNS Alarm independent of the SO4 notification channel |
| **R-GLOBAL-02** — Unversioned external contracts | Open risk | ⚠️ Partial — API Gateway versioning outside the scope of the reference design |

---

## Cost estimate per tier

| Tier | Use | Estimated cost/month |
|---|---|---|
| Dev | Individual development, 8h/day | ~$33 |
| Staging | QA 24/7, no Multi-AZ | ~$208 |
| Production | Multi-AZ HA, auto-scaling workers 2–8 | ~$458 (optimizable to ~$346 with Fargate Spot + Reserved RDS) |

---

## R3 deliverable verification

- [x] `arquitectura-aws.md` covers all SO4 requirements: deployment, scaling, security, observability, operation
- [x] All 4 ATAM risks/findings have an explicit resolution in the AWS design (R-GLOBAL-02 partial and documented)
- [x] The cost estimate has explicit assumptions for all 3 tiers
- [x] All 7 Mermaid diagrams are renderable on mermaid.live
- [x] All 3 ADRs follow the 7-section template in `microframework/plantillas/ADR-plantilla.md`
- [x] The entire design is consistent with the micro-framework's REGs (REG-001, REG-003, REG-004, REG-005, REG-006)
- [x] `estado-actual.md` reflects Phase 8 as completed

---

## Cross-references with previous phases

```
../../medicion/proyecto-overview.en.md          → SO4 and R3 defined
medicion/consolidado/atam-evidencia.md     → 92% ATAM coverage that motivates the design
atam/registro-riesgos-tradeoffs.md    → R-GLOBAL-01, R-BOT-01, R-IOT-01, SP-IOT-01
atam/informe-atam-final.md            → Formal ATAM report with findings referenced in AWS
microframework/reglas/reglas-obligatorias.md → REG-001..010 applied in the AWS design
infraestructura/docker-compose.yml          → Local environment mapped to the AWS design
```
