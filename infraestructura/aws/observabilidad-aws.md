> 🌐 **Idioma / Language:** Español · [English](observabilidad-aws.en.md)

# Observabilidad en AWS — n8n-microframework

**Versión:** 1.0
**Fecha:** 2026-05-18
**Fase:** 8 — Diseño de arquitectura AWS (OE4)
**Resolución de riesgos ATAM:** R-GLOBAL-01 (logs efímeros → CloudWatch Logs persistente)

---

## §1 Estrategia de observabilidad

El micro-framework establece en **REG-006** que cada etapa (E1–E4) debe emitir un log
estructurado JSON con campos `etapa`, `status`, `duracion_ms` y `errores`. En el entorno
local (Docker Compose) estos logs se pierden al reiniciar el contenedor — riesgo
**R-GLOBAL-01** identificado en ATAM Fase 7.

En AWS, CloudWatch Logs captura todos los logs stdout/stderr de los contenedores ECS
Fargate automáticamente y los persiste de forma duradera. La estrategia de observabilidad
tiene tres capas complementarias:

| Capa | Servicio AWS | Propósito |
|---|---|---|
| **Logs estructurados** | CloudWatch Logs | Persistencia y consulta de logs JSON E1-E4 |
| **Métricas y alarmas** | CloudWatch Metrics + Alarms | Detección proactiva de degradación |
| **Dashboard operacional** | CloudWatch Dashboard | Vista unificada del estado del sistema |

---

## §2 CloudWatch Log Groups

### Configuración de Log Groups

Cada servicio ECS tiene su propio Log Group con retención diferenciada según el costo
y la necesidad de análisis histórico:

| Log Group | Servicio origen | Retención | Propósito |
|---|---|---|---|
| `/ecs/n8n-main` | ECS n8n-main | 30 días | Logs de UI, webhooks, encolado, arranque |
| `/ecs/n8n-workers` | ECS n8n-workers | 30 días | Logs de ejecución de workflows E1-E4 |
| `/ecs/mock-bot` | ECS mock-bot | 7 días | Logs de la API simulada de tickets |
| `/ecs/mock-iot` | ECS mock-iot | 7 días | Logs de la API simulada de notificaciones IoT |
| `/rds/n8n-postgresql` | RDS PostgreSQL | 7 días | Slow queries (≥ 1000ms), errores de conexión |
| `/elasticache/n8n-redis` | ElastiCache Redis | 3 días | Slow log Redis (opcional) |

### Configuración ECS — Log Driver

En cada Task Definition, la sección `logConfiguration` dirige la salida del contenedor
a CloudWatch:

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

El campo `awslogs-stream-prefix` genera streams con el formato:
`n8n-worker/n8n-workers/<task-id>`, permitiendo identificar qué contenedor generó
cada línea de log.

---

## §3 Logs estructurados del micro-framework — formato en CloudWatch

Los flujos n8n to-be emiten logs en el formato definido por REG-006. En CloudWatch estos
logs aparecen como texto en los streams, pero CloudWatch Log Insights los parsea como
JSON automáticamente:

### Ejemplo de entrada de log (CloudWatch Logs stream)

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

*CloudWatch Log Insights extrae automáticamente los campos JSON para uso en queries.*

---

## §4 CloudWatch Log Insights — Queries operacionales

### Query 1 — Fallos en cualquier etapa (MTTD < 15s demostrado en Fase 7)

Esta query reproduce el mecanismo de detección que sustenta el escenario BOT-Q5 (MTTD ≤ 60s):

```sql
fields @timestamp, etapa, caso, status, errores, @logStream
| filter status = "fail" or status = "error"
| sort @timestamp desc
| limit 50
```

**Uso:** Ejecutar en Log Groups `/ecs/n8n-workers` con ventana temporal de los últimos 15 minutos
para detección de fallos recientes.

---

### Query 2 — Latencia por etapa (percentiles)

Reproduce el análisis de IOT-Q5 (`medicion/analisis_iot_q5.py`) pero en tiempo real:

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

**Interpretación:** p95 > 30000ms indica reintentos activos (outlier confirmado en IOT-Q5 runtime).

---

### Query 3 — Latencia por nivel de alerta IoT (análisis TP-IOT-01)

Reproduce el trade-off documentado: crítico tiene +10.8ms overhead por maxRetries=3:

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

### Query 4 — Tasa de error del workflow por caso de estudio

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

### Query 5 — Volumen de ejecuciones por hora (capacidad)

```sql
fields @timestamp
| stats count() as ejecuciones by bin(1h)
| sort @timestamp asc
```

**Uso:** Identificar picos de carga para calibrar el umbral de auto-scaling de workers.

---

### Query 6 — Idempotencia — detectar conflictos ON CONFLICT (IOT-Q3, BOT-Q4)

```sql
fields idempotency_key, postgres_rows_inserted, @timestamp
| filter postgres_rows_inserted = 0
| sort @timestamp desc
| limit 20
```

*Registros con `postgres_rows_inserted=0` indican que el `ON CONFLICT DO NOTHING` descartó
un duplicado — el mecanismo de idempotencia funcionó correctamente.*

---

## §5 CloudWatch Metrics y Alarmas

### Alarmas definidas

Todas las alarmas envían notificaciones a un SNS Topic (`n8n-ops-alerts`) configurado con
una suscripción de email al operador. Para Producción se recomienda integrar con PagerDuty
o Slack via Lambda.

#### Alarma 1 — CPU alta en n8n-main

```
Nombre:         n8n-main-cpu-high
Namespace:      AWS/ECS
Metric:         CPUUtilization
Dimensiones:    ClusterName=n8n-cluster, ServiceName=n8n-main
Umbral:         > 80% durante 2 períodos consecutivos de 5 minutos
Acción:         SNS n8n-ops-alerts (WARNING)
Propósito:      Indicación de carga excesiva — considerar aumentar vCPU de Task Definition
```

#### Alarma 2 — CPU alta en n8n-workers

```
Nombre:         n8n-workers-cpu-high
Namespace:      AWS/ECS
Metric:         CPUUtilization
Dimensiones:    ClusterName=n8n-cluster, ServiceName=n8n-workers
Umbral:         > 80% durante 3 períodos consecutivos de 5 minutos
Acción:         SNS n8n-ops-alerts (WARNING)
Propósito:      Complementa auto-scaling; indica que los workers están saturados
```

#### Alarma 3 — Almacenamiento RDS bajo

```
Nombre:         rds-low-storage
Namespace:      AWS/RDS
Metric:         FreeStorageSpace
Dimensiones:    DBInstanceIdentifier=n8n-postgresql
Umbral:         < 10 GB (10737418240 bytes)
Acción:         SNS n8n-ops-alerts (CRITICAL)
Propósito:      Prevenir interrupción por disco lleno — activar storage autoscaling o expand manual
```

#### Alarma 4 — Latencia ALB alta

```
Nombre:         alb-latency-high
Namespace:      AWS/ApplicationELB
Metric:         TargetResponseTime
Dimensiones:    LoadBalancer=<ALB ARN>
Umbral:         > 5 segundos (p99) durante 5 minutos
Acción:         SNS n8n-ops-alerts (WARNING)
Propósito:      Detectar degradación de respuesta ante los webhooks
```

#### Alarma 5 — Conexiones RDS al límite

```
Nombre:         rds-connections-high
Namespace:      AWS/RDS
Metric:         DatabaseConnections
Dimensiones:    DBInstanceIdentifier=n8n-postgresql
Umbral:         > 180 conexiones (90% de max_connections=200)
Acción:         SNS n8n-ops-alerts (WARNING)
Propósito:      Prevenir rechazo de conexiones; considerar PgBouncer o aumentar instancia
```

#### Alarma 6 — Memoria Redis alta

```
Nombre:         redis-memory-high
Namespace:      AWS/ElastiCache
Metric:         DatabaseMemoryUsagePercentage
Dimensiones:    CacheClusterId=n8n-redis
Umbral:         > 75%
Acción:         SNS n8n-ops-alerts (WARNING)
Propósito:      Prevenir evicción de jobs de la queue BullMQ
```

#### Alarma 7 — Tasa de error del workflow (métrica custom)

Esta alarma requiere publicar una métrica custom desde los logs del micro-framework
usando **CloudWatch Embedded Metrics Format** (EMF) en el error workflow (E3):

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
Nombre:         n8n-workflow-failure-rate-high
Namespace:      n8n/Workflows
Metric:         WorkflowFailure
Umbral:         Sum > 10 en período de 5 minutos
Acción:         SNS n8n-ops-alerts (CRITICAL)
Propósito:      Detectar picos de fallos en workflows — posible problema con API externa
```

---

## §6 CloudWatch Dashboard — Vista operacional

El dashboard `n8n-microframework-operations` centraliza los KPIs críticos del sistema
en una sola pantalla.

### Widgets del dashboard (layout 3 × 3)

| Fila | Columna 1 | Columna 2 | Columna 3 |
|---|---|---|---|
| **1 — Cómputo** | CPU n8n-main (línea, %) | CPU n8n-workers (línea, %) | Workers activos (número) |
| **2 — Cola y BD** | Queue depth Redis (línea, count) | Conexiones RDS (línea, count) | Latencia RDS (línea, ms) |
| **3 — Red y calidad** | Latencia ALB p99 (línea, ms) | 4xx/5xx ALB (barra, count) | Tasa fallos n8n (número, %) |

### Configuración JSON del Dashboard (extracto)

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
          "horizontal": [{ "value": 80, "label": "Umbral alarma", "color": "#ff6961" }]
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Workers ECS — Tareas en ejecución",
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
        "title": "Fallos recientes — Workflows",
        "query": "SOURCE '/ecs/n8n-workers' | fields @timestamp, etapa, caso, errores | filter status = 'fail' | sort @timestamp desc | limit 10",
        "region": "us-east-1",
        "view": "table"
      }
    }
  ]
}
```

---

## §7 Container Insights — Métricas avanzadas de ECS

AWS Container Insights proporciona métricas adicionales de los contenedores ECS que no
están disponibles por defecto: uso de memoria por task, conteo de tareas por servicio,
red por contenedor.

**Activación:**

```bash
# Activar Container Insights en el cluster ECS
aws ecs update-cluster-settings \
  --cluster n8n-cluster \
  --settings name=containerInsights,value=enabled \
  --region us-east-1
```

**Métricas adicionales disponibles con Container Insights:**

| Métrica | Namespace | Uso |
|---|---|---|
| `MemoryUtilized` | `ECS/ContainerInsights` | Uso de RAM por task |
| `RunningTaskCount` | `ECS/ContainerInsights` | Tareas activas por servicio |
| `NetworkRxBytes` | `ECS/ContainerInsights` | Bytes recibidos (tráfico webhooks) |
| `NetworkTxBytes` | `ECS/ContainerInsights` | Bytes enviados (respuestas a APIs) |
| `StorageReadBytes` | `ECS/ContainerInsights` | Lectura de disco efímero |

---

## §8 X-Ray — Trazabilidad distribuida (opcional)

AWS X-Ray permite trazar el camino completo de una request desde el ALB hasta RDS,
incluyendo el tiempo en cada servicio. Requiere instrumentar el código de n8n o sus
dependencias.

**Limitación relevante:** n8n es una aplicación de terceros sin instrumentación X-Ray
nativa. La alternativa es activar X-Ray en el ALB para capturar la traza hasta n8n-main
sin instrumentación de aplicación:

```
ALB Attributes: x-ray.enabled = true
```

Esto proporciona trazabilidad de latencia ALB → n8n sin modificar el código de n8n.
Para trazabilidad completa E1-E4, los logs JSON del micro-framework con `duracion_ms`
por etapa son el mecanismo principal (ya implementado en los flujos to-be).

---

## §9 Resolución de R-GLOBAL-01

El riesgo **R-GLOBAL-01** identificado en ATAM Fase 7 describe:
> *"Los logs del micro-framework se pierden al reiniciar el contenedor Docker local.
> El `etapa: ERROR_HANDLER` queda en stdout efímero."*

**Solución en AWS:**

1. ECS Fargate con `awslogs` log driver captura **toda la stdout** del contenedor.
2. Los logs se persisten en CloudWatch Logs **antes** de que el contenedor termine.
3. Retención de 30 días en `/ecs/n8n-workers` permite análisis retroactivo.
4. Log Insights permite queries ad-hoc sobre los logs JSON E1-E4 históricos.
5. Las alarmas detectan fallos en tiempo real (< 60 segundos desde el evento).

**Clasificación ATAM revisada:** R-GLOBAL-01 pasa de **Risk** a **Non-Risk** en el
diseño AWS. Los logs son tan duraderos y consultables como una base de datos de telemetría.

---

## Referencias

- `arquitectura-aws.md` — ECS Task Definitions con `logConfiguration` (§4)
- `seguridad-iam.md` — CloudWatchLogsPolicy en IAM roles (§2)
- `escalabilidad.md` — Auto-scaling basado en métricas CloudWatch (§2)
- `medicion/consolidado/mttd-resultado.md` — MTTD < 15s (estructura log JSON que persiste en CW)
- `atam/registro-riesgos-tradeoffs.md` — R-GLOBAL-01, TP-IOT-01 (latencia por nivel_alerta)
- `microframework/reglas/reglas-obligatorias.md` — REG-006 (logs estructurados)
