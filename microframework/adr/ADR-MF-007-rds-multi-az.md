# ADR-MF-007: RDS PostgreSQL Multi-AZ para persistencia de datos en producción

**Estado:** Aceptado
**Fecha:** 2026-05-18
**Caso:** Micro-framework (aplica a ambos casos — Bot e IoT)
**Atributo de calidad afectado:** Fiabilidad · Integridad de datos · Disponibilidad

---

## Contexto

Los dos casos de estudio del micro-framework persisten datos críticos en PostgreSQL:
- **Bot:** tabla `interacciones_bot` con tickets creados (idempotency_key previene duplicados).
- **IoT:** tabla `lecturas_sensor` con mediciones de sensores (pérdida = gap en serie temporal).

El escenario ATAM **IOT-Q3** ("Integridad de lecturas ante reintentos") establece como
criterio de respuesta que `COUNT(*) = 1` por `idempotency_key` — es decir, la integridad
de datos es un requisito verificado, no aspiracional.

En el entorno local (Docker Compose), PostgreSQL corre en un único contenedor sin
replicación. Un fallo del contenedor o del host implica indisponibilidad y posible
pérdida de datos no comprometidos. Para el diseño AWS de referencia (OE4), se debe
garantizar que la base de datos cumpla con el SLA implícito del micro-framework.

---

## Decisión

Usamos **Amazon RDS PostgreSQL en configuración Multi-AZ** para el entorno de Producción.
RDS Multi-AZ mantiene una réplica síncrona en una segunda Availability Zone (AZ-b) y
realiza failover automático a la réplica en caso de fallo de la instancia primaria.

Configuración específica:
- **Motor:** PostgreSQL 16 (compatible con el esquema local)
- **Instancia:** `db.t3.small` (2 vCPU, 2 GB RAM) — permite `max_connections=200`
- **Storage:** gp3 · 100 GB · IOPS provisionadas 3000 (baseline gratuito de gp3)
- **Multi-AZ:** `MultiAZ=true` — réplica síncrona en us-east-1b
- **Cifrado:** KMS CMK con `StorageEncrypted=true`
- **Backups:** Retención de 7 días · ventana de backup 02:00–03:00 UTC
- **Failover:** Automático · tiempo objetivo < 60 segundos (SLA AWS: típicamente 60s)

Para entornos **Dev** y **Staging** se usa Single-AZ (`MultiAZ=false`) para reducir costos.

---

## Alternativas consideradas

- **RDS Single-AZ en todos los tiers:** Ahorro de ~$25/mes en Producción. Descartado
  porque un fallo de RDS Single-AZ puede implicar varios minutos de indisponibilidad
  (tiempo de restauración desde snapshot), durante los cuales todos los workflows fallan.
  El riesgo de pérdida de datos de sensores IoT o tickets bot es inaceptable para
  un entorno productivo real.

- **Aurora PostgreSQL Serverless v2:** Mayor resiliencia y escalado automático.
  Descartado porque el costo mínimo de Aurora (~$0.12/h en us-east-1) es 3× el de
  RDS t3.small, sin beneficio proporcional para el volumen de datos esperado
  (< 10 GB en el primer año de operación del micro-framework).

- **PostgreSQL en ECS (contenedor):** Sin gestión de instancia, más flexible.
  Descartado porque no provee backups automáticos, failover automático ni cifrado
  en reposo sin configuración manual adicional. La complejidad operacional de gestionar
  PostgreSQL en un contenedor efímero de ECS supera ampliamente el costo de RDS.

- **Amazon DynamoDB:** NoSQL escalable sin límite de conexiones.
  Descartado porque los flujos n8n usan SQL directo (`ON CONFLICT DO NOTHING`) y
  n8n almacena su estado interno en PostgreSQL; migrar ambos a DynamoDB requeriría
  modificar el código fuente de n8n.

---

## Consecuencias

**Positivas:**
- Failover automático < 60 segundos sin intervención manual — la aplicación reconecta
  automáticamente al nuevo endpoint primario (CNAME del DNS de RDS no cambia).
- Backups automáticos con restauración point-in-time hasta 7 días atrás.
- `StorageEncrypted=true` cumple con los requisitos de confidencialidad documentados
  en los escenarios ATAM BOT-Q3 e IOT-Q6 (credenciales en reposo).
- Performance Insights + Enhanced Monitoring proporciona visibilidad de queries lentas
  sin configuración adicional.
- Storage auto-scaling hasta 500 GB previene interrupciones por disco lleno.

**Negativas / trade-offs:**
- Costo 2× respecto a Single-AZ: ~$25/mes adicionales en Producción (~$300/año).
  Aceptado porque el SLA de 99.95% de RDS Multi-AZ justifica el costo en un
  entorno donde la pérdida de datos tiene implicaciones en la integridad del
  micro-framework.
- La réplica Multi-AZ es de solo lectura para failover (no es read replica accesible).
  Para análisis de lectura escalable se requiere una Read Replica separada.
- `max_connections=200` puede ser insuficiente si el número de workers escala más allá
  de 8. Mitigado con PgBouncer como proxy de conexiones (descrito en `escalabilidad.md §4`).

---

## Relación con el micro-framework

- **REG-005** (idempotencia): La cláusula `ON CONFLICT (idempotency_key) DO NOTHING`
  implementada en E3 de los flujos to-be sobrevive al failover de RDS Multi-AZ —
  PostgreSQL preserva los datos ya comprometidos en la réplica síncrona antes del failover.
- El escenario ATAM **IOT-Q3** (fiabilidad — integridad ante reintentos, evidencia:
  `run-log-iot-to-be.csv Set K: 0% fallos`) se extiende al diseño AWS: la idempotencia
  funciona en RDS Multi-AZ sin modificaciones al flujo.
- **NR-IOT-02** (Non-risk identificado en ATAM): "E3 persistencia es independiente de E4
  notificación" — este hallazgo se mantiene en AWS porque RDS y el canal de notificación
  (API externa / SNS) son servicios independientes.
