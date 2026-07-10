> 🌐 **Language / Idioma:** English · [Español](ADR-MF-005-ecs-fargate-vs-ec2.md)

# ADR-MF-005: ECS Fargate as the compute platform for n8n on AWS

**Status:** Accepted
**Date:** 2026-05-18
**Case:** Micro-framework (applies to both cases — Bot and IoT)
**Affected quality attribute:** Maintainability · Operability · Scalability

---

## Context

The MGADS thesis proposal's Specific Objective SO4 requires designing a "cost-efficient and
scalable" AWS architecture for the n8n micro-framework. The local environment uses Docker
Compose, meaning the cloud deployment must orchestrate containers.

The main options for running Docker containers on AWS are EC2 (manually managed virtual
instances), ECS Fargate (serverless containers with no instance management), and EKS
(managed Kubernetes). The decision must balance operational cost, management load, and
horizontal-scaling capacity.

The context is a small team (academic research / early-stage startup) where minimizing
operational toil takes priority over extreme infrastructure cost optimization.

---

## Decision

We use **AWS ECS Fargate** as the compute platform for all micro-framework services
(n8n-main, n8n-workers, mock-bot, mock-iot). ECS Fargate runs Docker containers with no
EC2 instance provisioning, patching, or management required.

Concrete configuration:
- **ECS Cluster:** `n8n-cluster` in Fargate mode (no EC2 capacity providers)
- **Task Definitions:** one per service with specified CPU/RAM
- **Networking mode:** `awsvpc` (each task has its own ENI and Security Group)
- **Launch type:** `FARGATE` for On-Demand and `FARGATE_SPOT` for scalable workers

---

## Alternatives considered

- **EC2 with ECS (auto-scaling instances):** 30–40% cheaper for constant loads. Discarded
  because it requires managing the EC2 instance lifecycle (patching, AMIs, scaling
  groups), which increases toil without adding value to the micro-framework. The cost
  savings do not justify the additional operational complexity for this context.

- **EKS (managed Kubernetes):** Greater flexibility for multi-tenant and complex
  microservices. Discarded due to significantly higher operational complexity: it requires
  Kubernetes knowledge (deployments, services, ingress, RBAC) that adds no academic value
  to the micro-framework's design. EKS's base cost (~$0.10/h for the control plane alone)
  is unjustified for this use case.

- **Lambda (serverless functions):** Appropriate for the mocks in Production (sporadic
  load). Discarded for n8n-main and workers because n8n requires a persistent process (it
  cannot cold-start due to the application's weight ~500 MB). Lambda remains an option for
  mock-bot and mock-iot in Production (referenced in arquitectura-aws.md §4).

---

## Consequences

**Positive:**
- No EC2 instance management: no patching, AMI updates, or manual capacity planning.
- Fargate task auto-scaling in seconds (vs minutes on EC2 to launch a new instance).
- `networking mode=awsvpc` provides per-task network isolation with no additional
  configuration.
- Native integration with CloudWatch Logs, Secrets Manager, and IAM Task Roles.
- Fargate Spot reduces worker cost by up to 70% with interruption handled by BullMQ.

**Negative / trade-offs:**
- Cost 30–40% higher than equivalent EC2 for constant loads: ~$65/month in workers vs
  ~$45/month on EC2 t3.small × 4.
- Fargate task cold start: 15–30 seconds to launch a new task during scale-out (acceptable
  for the scaling threshold configured in `escalabilidad.md §2`).
- No access to the underlying instance for advanced debugging (only CloudWatch Logs).
- Fargate's minimum vCPU size (0.25 vCPU) may be insufficient for CPU-intensive workflows;
  requires profiling if the use case scales significantly.

---

## Relationship to the micro-framework

This decision enables scaling the micro-framework's rules without modifying them:
- **REG-001** (secrets): ECS Secrets integration with Secrets Manager applies the rule
  with no changes to the n8n flow's JSON.
- **REG-006** (structured logs): the `awslogs` log driver automatically captures the JSON
  stdout of every E1-E4 stage.
- The **retry pattern** (REG-004) implemented in the n8n flows is complemented by BullMQ's
  retry mechanism at the queue level.
