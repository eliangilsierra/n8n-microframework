# ADR-MF-006: n8n Queue Mode con Redis como mecanismo de escalado horizontal

**Estado:** Aceptado
**Fecha:** 2026-05-18
**Caso:** Micro-framework (aplica a ambos casos — Bot e IoT)
**Atributo de calidad afectado:** Escalabilidad · Fiabilidad · Operabilidad

---

## Contexto

n8n en su configuración por defecto ("Main Mode") ejecuta todo en un único proceso:
UI, API REST, recepción de webhooks y ejecución de workflows. Bajo carga alta, un
workflow de larga duración (por ejemplo, IOT-Q4 con retry activo y latencia > 30s)
puede bloquear la capacidad de recepción de nuevos webhooks.

El anteproyecto MGADS requiere que el diseño AWS soporte "adopción y evolución en
entornos productivos", lo que implica capacidad de escalar la ejecución de workflows
independientemente de la interfaz de usuario.

n8n provee "Queue Mode" como su mecanismo oficial de escalado horizontal. Este modo
separa el proceso en Main (UI + webhooks + encolado) y Workers (ejecución desde cola),
comunicados mediante BullMQ sobre Redis.

---

## Decisión

Adoptamos **n8n Queue Mode con ElastiCache Redis (BullMQ)** como arquitectura de
ejecución para el despliegue AWS. El sistema opera con dos tipos de proceso:

1. **n8n-main** (1–2 instancias): recibe webhooks, gestiona UI, encola jobs en Redis.
   Variables clave: `EXECUTIONS_MODE=queue`, `QUEUE_BULL_REDIS_HOST`.

2. **n8n-workers** (2–8 instancias, auto-scaling): consumen jobs de Redis y ejecutan
   workflows completos (E1 → E2 → E3 → E4). Misma imagen Docker que main.
   Variable clave: `N8N_WORKER=true` (o comando `n8n worker`).

3. **ElastiCache Redis** (`cache.t3.small`, cluster mode disabled, 1 réplica):
   actúa como broker de mensajes BullMQ. No persiste datos de negocio.

---

## Alternativas consideradas

- **Main Mode con réplicas (sin Queue Mode):** Múltiples instancias de n8n en Main Mode
  no comparten estado de ejecución. Un webhook recibido por la instancia A puede no
  ser visible en la instancia B. Descartado por inconsistencia de estado entre réplicas.

- **Postgres como queue (sin Redis):** n8n soporta una implementación experimental de
  queue sobre PostgreSQL eliminando la dependencia de Redis. Descartado porque en el
  momento de este diseño (Q2 2026) esta opción sigue siendo experimental y sin soporte
  de producción en la documentación oficial de n8n. Redis es la única opción soportada
  de forma estable.

- **Arquitectura event-driven con SQS:** Reemplazar BullMQ con Amazon SQS como broker.
  Descartado porque n8n Queue Mode está diseñado específicamente para BullMQ/Redis; no
  existe integración nativa con SQS sin modificar el código de n8n.

---

## Consecuencias

**Positivas:**
- Escalado horizontal de la ejecución de workflows sin modificar el código de los flujos
  n8n ni las reglas del micro-framework (E1-E4 funcionan igual en cualquier worker).
- Jobs interrumpidos (por fallo de worker o Fargate Spot) son retomados automáticamente
  por BullMQ (mecanismo "stalled jobs" con timeout configurable).
- n8n-main puede responder a nuevos webhooks en < 50ms mientras los workers ejecutan
  workflows de larga duración (decoupling de encolado vs ejecución).
- Métricas de queue depth (`n8n/QueueDepth`) permiten auto-scaling reactivo de workers
  (ver `escalabilidad.md §2`).
- La idempotencia implementada en E3 (`ON CONFLICT DO NOTHING`) protege contra
  ejecuciones dobles si un job stalled es retomado por otro worker.

**Negativas / trade-offs:**
- Redis es un nuevo componente de infraestructura que no existe en el entorno local:
  agrega ~$17–51/mes de costo (Staging/Prod) y un punto de fallo adicional.
- Si Redis falla, n8n-main no puede encolar nuevos jobs (los webhooks retornan error
  al cliente). Mitigado por ElastiCache en modo Multi-AZ con failover automático.
- `N8N_ENCRYPTION_KEY` debe ser idéntica en todas las instancias (main y workers).
  Gestionada de forma segura via Secrets Manager, pero un cambio de clave requiere
  reiniciar TODOS los contenedores simultáneamente.
- La UI de n8n en Queue Mode muestra el estado de las ejecuciones con un lag de polling
  (no es tiempo real como en Main Mode). Aceptable para el uso operacional.

---

## Relación con el micro-framework

- **REG-005** (idempotencia): El escenario de un worker que falla y BullMQ reintenta
  el job se ve cubierto por `ON CONFLICT (idempotency_key) DO NOTHING` en E3 —
  el dato ya persistido no se duplica.
- **REG-004** (retry con backoff): BullMQ tiene retry con backoff exponencial configurable,
  complementando el retry del nodo HTTP dentro del flujo n8n.
- **REG-003** (error workflow): Si un workflow falla en el worker, n8n dispara el
  error workflow configurado — este mecanismo funciona igual en Queue Mode.
- El patrón de **Fiabilidad** demostrado en IOT-Q3 (integridad ante reintentos) y
  BOT-Q4 (idempotencia) se mantiene íntegro en el despliegue distribuido.
