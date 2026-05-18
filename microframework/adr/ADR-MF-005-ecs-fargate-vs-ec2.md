# ADR-MF-005: ECS Fargate como plataforma de cómputo para n8n en AWS

**Estado:** Aceptado
**Fecha:** 2026-05-18
**Caso:** Micro-framework (aplica a ambos casos — Bot e IoT)
**Atributo de calidad afectado:** Mantenibilidad · Operabilidad · Escalabilidad

---

## Contexto

El Objetivo Específico OE4 del anteproyecto MGADS requiere diseñar una arquitectura AWS
"costo-eficiente y escalable" para el micro-framework n8n. El entorno local usa Docker
Compose, lo que implica que el despliegue en nube debe orquestar contenedores.

Las opciones principales para correr contenedores Docker en AWS son EC2 (instancias
virtuales gestionadas manualmente), ECS Fargate (contenedores serverless sin gestión
de instancias) y EKS (Kubernetes gestionado). La decisión debe balancear costo
operacional, carga de gestión y capacidad de escalado horizontal.

El contexto es el de un equipo reducido (investigación académica / startup temprana)
donde minimizar el toil operacional es prioritario sobre la optimización extrema de
costos de infraestructura.

---

## Decisión

Usamos **AWS ECS Fargate** como plataforma de cómputo para todos los servicios del
micro-framework (n8n-main, n8n-workers, mock-bot, mock-iot). ECS Fargate ejecuta
contenedores Docker sin requerir aprovisionamiento, parcheo ni gestión de instancias EC2.

La configuración concreta:
- **ECS Cluster:** `n8n-cluster` en modo Fargate (sin EC2 capacity providers)
- **Task Definitions:** una por servicio con CPU/RAM especificados
- **Networking mode:** `awsvpc` (cada task tiene su propia ENI y Security Group)
- **Launch type:** `FARGATE` para On-Demand y `FARGATE_SPOT` para workers escalables

---

## Alternativas consideradas

- **EC2 con ECS (instancias auto-scaling):** 30–40% más barato para cargas constantes.
  Descartado porque requiere gestionar el ciclo de vida de instancias EC2 (patching,
  AMIs, scaling groups), lo que aumenta el toil sin agregar valor al micro-framework.
  El ahorro de costo no justifica la complejidad operacional adicional para este contexto.

- **EKS (Kubernetes gestionado):** Mayor flexibilidad para multi-tenant y microservicios
  complejos. Descartado por complejidad operacional significativamente mayor: se requieren
  conocimientos de Kubernetes (deployments, services, ingress, RBAC) que no agregan valor
  académico al diseño del micro-framework. Costo base de EKS (~$0.10/h solo por el control
  plane) sin justificación para este caso de uso.

- **Lambda (funciones serverless):** Apropiado para los mocks en Producción (carga
  esporádica). Descartado para n8n-main y workers porque n8n requiere un proceso
  persistente (no puede iniciar en frío por el peso de la aplicación ~500 MB).
  Lambda se mantiene como opción para mock-bot y mock-iot en Producción (referenciado
  en arquitectura-aws.md §4).

---

## Consecuencias

**Positivas:**
- Sin gestión de instancias EC2: no hay patching, AMI updates ni capacity planning manual.
- Auto-scaling de tasks Fargate en segundos (vs minutos en EC2 para lanzar instancia nueva).
- `networking mode=awsvpc` proporciona aislamiento de red por task sin configuración adicional.
- Integración nativa con CloudWatch Logs, Secrets Manager y IAM Task Roles.
- Fargate Spot reduce el costo de workers hasta un 70% con interrupción manejada por BullMQ.

**Negativas / trade-offs:**
- Costo 30–40% superior a EC2 equivalente para cargas constantes: ~$65/mes en workers
  vs ~$45/mes en EC2 t3.small × 4.
- Cold start de tasks Fargate: 15–30 segundos para lanzar una nueva task durante
  scale-out (aceptable para el umbral de escalado configurado en `escalabilidad.md §2`).
- Sin acceso a la instancia subyacente para debugging avanzado (solo CloudWatch Logs).
- El tamaño mínimo de vCPU en Fargate (0.25 vCPU) puede ser insuficiente para workflows
  intensivos en CPU; requiere perfilado si el use case escala significativamente.

---

## Relación con el micro-framework

Esta decisión habilita la escala de las reglas del micro-framework sin modificarlas:
- **REG-001** (secretos): ECS Secrets integration con Secrets Manager aplica la regla
  sin cambios en el JSON del flujo n8n.
- **REG-006** (logs estructurados): `awslogs` log driver captura automáticamente el
  stdout JSON de cada etapa E1-E4.
- El patrón **patron-retry** (REG-004) implementado en los flujos n8n se complementa
  con el mecanismo de retry de BullMQ a nivel de queue.
