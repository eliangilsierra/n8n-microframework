> 🌐 **Idioma / Language:** Español · [English](arquitectura-flujos.en.md)

# Arquitectura de flujos: as-is y to-be

## Principio arquitectónico central

El micro-framework traduce Clean Architecture al contexto visual de n8n. En lugar de clases y capas de código, los límites son subflujos orquestados mediante el nodo `Execute Workflow`. Cada subflujo tiene una responsabilidad única, un contrato de entrada/salida definido en JSON, y no conoce los detalles de implementación de los demás.

---

## Arquitectura as-is (estado actual — patrón ad-hoc)

### Descripción del patrón

El estado as-is representa cómo se construyen flujos en n8n sin lineamientos arquitectónicos. Las características definitorias son:

- Un solo flujo monolítico que mezcla validación, lógica de negocio, integración y formateo de salida
- Credenciales y tokens hardcodeados directamente en los nodos (visibles en el export JSON)
- Sin manejo de errores estandarizado: un fallo en cualquier nodo detiene el flujo sin recuperación
- Sin log estructurado: solo el historial de ejecuciones de n8n, no consultable programáticamente
- Sin control de idempotencia: los reintentos pueden crear registros duplicados
- Lógica de umbrales (IoT) o reglas de clasificación (Bot) embebidas en el mismo nodo que hace la integración

### Diagrama conceptual as-is

```
Trigger o evento
(webhook, cron, input)
        │
        ▼
Lógica y decisiones ──────► Integraciones externas
mezcladas en el flujo        acopladas directamente
        │                            │
        ▼                            ▼
Manejo de errores          Secretos y configuración
no estandarizado           dispersos en nodos
        │
        ▼
Observabilidad limitada
(logs básicos de n8n)
```

### Nodos típicos del as-is

| Nodo | Rol en as-is | Problema arquitectónico |
|------|-------------|------------------------|
| Webhook | Trigger de entrada | Acepta cualquier payload sin validación previa |
| IF | Validación de token | Token hardcodeado en la condición del nodo |
| Code | Todo mezclado | Validación + lógica de negocio + formateo en un solo bloque |
| HTTP Request | Integración externa | API key hardcodeada en el header del nodo |
| Postgres | Persistencia | Sin clave de idempotencia, posibles duplicados en reintento |
| Respond to Webhook | Salida | Respuesta sin estructura de contrato definida |

---

## Arquitectura to-be (micro-framework aplicado)

### Principios aplicados

**Separación de responsabilidades:** Cada etapa tiene una única razón para cambiar. Si cambia la API externa, solo se modifica el Adaptador (E3). Si cambia una regla de negocio, solo se modifica el Dominio (E2).

**Orquestación centralizada:** El flujo orquestador invoca subflujos mediante `Execute Workflow` y controla el flujo completo. El estado de toda la operación es rastreable en un único punto.

**Contratos de entrada/salida:** Cada subflujo declara qué campos recibe y qué campos retorna. Los contratos se documentan en `microframework/plantillas/contratos-entrada-salida.md`.

**Gestión centralizada de secretos:** Ningún secret, API key ni token aparece en el JSON exportado del flujo. Todos los accesos a servicios externos usan credenciales de n8n.

**Idempotencia:** Las operaciones de persistencia incluyen una clave de idempotencia (`run_id-operacion` o `sensor_id-timestamp`) con `ON CONFLICT DO NOTHING` en PostgreSQL.

**Log estructurado por corrida:** Cada etapa emite un `console.log` con un objeto JSON que incluye como mínimo: `run_id`, `etapa`, `status`, `start_ts` / `end_ts`, y campos relevantes al contexto.

### Diagrama conceptual to-be

```
Trigger o evento
(webhook, cron, input)
        │
        ▼
    Etapa 1                    Log estructurado
  Validación ◄────────────────── por corrida
  de entradas                    (transversal)
        │
        ▼ (solo si válido)
    Etapa 2
  Lógica de              ◄── Secretos gestionados
   dominio                    de forma centralizada
        │
        ▼
    Etapa 3
  Adaptadores            ◄── Manejo de errores
  de integración              estandarizado
  (con retry)                 (retry + fallback)
        │
        ▼
    Etapa 4
  Salida controlada
  (respuesta / notificación)
```

---

## Caso Bot — Detalle técnico

### Flujos del to-be

El caso Bot se compone de 4 archivos JSON importables en n8n:

**1. bot-to-be-orquestador.json** — Flujo principal
- Nodo: `Webhook` en path `/bot-support-to-be`
- Nodo: `Code` (E1 — Validación: campos requeridos, tipo, longitud)
- Nodo: `IF` (¿entrada válida?)
- Nodo: `Execute Workflow` → subflujo E2
- Nodo: `Execute Workflow` → subflujo E3
- Nodo: `IF` (¿error en pipeline?)
- Nodo: `Respond to Webhook` — 200 OK / 400 Bad Request / 401 Unauthorized / 500 Internal Server Error
- Settings: `errorWorkflow: "bot-error-handler"`, `saveDataSuccessExecution: "all"`

**2. bot-to-be-e2-dominio.json** — Subflujo de lógica de negocio
- Trigger: `Execute Workflow Trigger`
- Nodo: `Code` con catálogo de reglas de clasificación (R001–R004)
- Input esperado: `{ run_id, start_ts, payload }`
- Output: `{ run_id, start_ts, categoria, prioridad, respuesta, requiereEscalacion, payload }`

**3. bot-to-be-e3-adaptador.json** — Subflujo de persistencia
- Trigger: `Execute Workflow Trigger`
- Nodo: `Code` (preparar payload + generar idempotency_key)
- Nodo: `HTTP Request` con credencial de n8n + retry habilitado (3 intentos, 2000ms)
- Nodo: `Code` (log estructurado de salida)
- Input esperado: `{ run_id, start_ts, categoria, prioridad, respuesta, payload }`
- Output: `{ run_id, categoria, prioridad, respuesta, ticket_id, payload }`

### Contrato de entrada — Bot

```json
{
  "token": "string (requerido)",
  "user_id": "string (requerido)",
  "session_id": "string (opcional)",
  "message": "string (requerido, max 1000 chars)"
}
```

### Contrato de salida — Bot (200 OK)

```json
{
  "ok": true,
  "run_id": "string",
  "respuesta": "string",
  "categoria": "string",
  "prioridad": "string"
}
```

### Reglas de clasificación del Bot (E2)

| ID | Condición | Categoría | Prioridad | Escalación |
|----|-----------|-----------|-----------|------------|
| R001 | mensaje contiene: urgente, critico, emergencia | incidente | alta | sí |
| R002 | mensaje contiene: factura, pago, cobro | facturación | media | no |
| R003 | mensaje contiene: error, falla, no funciona | soporte_tecnico | media | no |
| R004 | mensaje contiene: hola, buenos, buenas | saludo | baja | no |
| DEFAULT | cualquier otro caso | general | baja | no |

### Validaciones E1 — Bot

- `token`: requerido (presencia)
- `message`: requerido, tipo string
- `user_id`: requerido, tipo string
- `message.length`: máximo 1000 caracteres

---

## Caso IoT — Detalle técnico

### Flujos del to-be

El caso IoT se compone de 6 archivos JSON importables en n8n:

**1. iot-to-be-orquestador.json** — Flujo principal
- Nodo: `Webhook` en path `/iot-sensor-to-be`
- Nodo: `Execute Workflow` → E1 validación
- Nodo: `IF` (¿lectura válida?)
- Nodo: `Execute Workflow` → E2 dominio
- Nodo: `Execute Workflow` → E3 persistencia
- Nodo: `Execute Workflow` → E4 notificación
- Nodo: `Respond to Webhook` (200 OK o 422 Unprocessable)
- Settings: `errorWorkflow: "iot-error-handler"`, `saveDataSuccessExecution: "all"`

**2. iot-to-be-e1-validacion.json** — Validación y normalización
- Genera `run_id` único: `RUN-IOT-{timestamp}-{random}`
- Valida campos obligatorios: sensor_id, temperature, humidity, co2
- Valida rangos físicos: temp (-50 a 100), hum (0 a 100), co2 (0 a 5000)
- Normaliza: `Math.round(temp * 10) / 10`, `Math.round(hum * 10) / 10`, `Math.round(co2)`
- Output: `{ run_id, start_ts, valido, errores, lectura }`

**3. iot-to-be-e2-dominio.json** — Análisis de umbrales
- Umbrales centralizados en constante `UMBRALES` al inicio del nodo Code
- Analiza temperatura, humedad y CO2 contra umbrales normal y crítico
- Determina nivel: `normal`, `warning`, `critico`
- Determina `requiereNotificacion: boolean`
- Output: `{ run_id, start_ts, lectura, analisis: { nivel, anomalias[], requiereNotificacion } }`

**4. iot-to-be-e3-persistencia.json** — Persistencia con idempotencia
- Genera `idempotency_key`: `{sensor_id}-{timestamp}`
- Query PostgreSQL con `ON CONFLICT (idempotency_key) DO NOTHING`
- Credencial de PostgreSQL gestionada por n8n (no en el JSON del flujo)
- Log estructurado de salida con duración del tramo

**5. iot-to-be-e4-notificacion.json** — Notificación por severidad
- IF: ¿requiereNotificacion?
  - Sí → IF: ¿nivel crítico?
    - Sí → HTTP POST a endpoint `/notificaciones/critico` (retry 3 intentos)
    - No → HTTP POST a endpoint `/notificaciones/warning` (retry 2 intentos)
  - No → Log de skip (nivel normal)

### Contrato de entrada — IoT

```json
{
  "sensor_id": "string (requerido)",
  "temperature": "number (requerido, rango físico: -50 a 100)",
  "humidity": "number (requerido, rango físico: 0 a 100)",
  "co2": "number (requerido, rango físico: 0 a 5000)",
  "timestamp": "string ISO 8601 (opcional, default: now)",
  "location": "string (opcional)"
}
```

### Umbrales de dominio IoT (E2)

| Variable | Min normal | Max normal | Max crítico |
|----------|-----------|-----------|------------|
| temperature | 10°C | 35°C | 45°C |
| humidity | 20% | 80% | 95% |
| co2 | — | 1000 ppm | 2000 ppm |

### Esquema de tabla PostgreSQL requerido

```sql
CREATE TABLE lecturas_sensor (
  id               SERIAL PRIMARY KEY,
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,
  sensor_id        VARCHAR(100) NOT NULL,
  temperature      DECIMAL(5,1),
  humidity         DECIMAL(5,1),
  co2              INTEGER,
  timestamp        TIMESTAMPTZ NOT NULL,
  nivel_alerta     VARCHAR(20) DEFAULT 'normal',
  anomalias        JSONB,
  run_id           VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Log estructurado — Formato estándar

Todos los subflujos emiten logs con `console.log(JSON.stringify({...}))`. Los campos mínimos requeridos son:

```json
{
  "run_id": "RUN-IOT-1710000000000-AB1C2D",
  "etapa": "E2_dominio_iot",
  "status": "ok | fail | skip",
  "start_ts": "2026-03-15T10:00:00.000Z",
  "end_ts": "2026-03-15T10:00:00.045Z",
  "duracion_ms": 45
}
```

Los campos adicionales varían por etapa y se documentan en `microframework/guia-observabilidad.md`.

---

## Servicios externos en entorno local

El entorno local usa servicios mock levantados con Docker:

| Servicio | URL local | Puerto | Propósito |
|---------|----------|--------|-----------|
| n8n | http://localhost:5678 | 5678 | Motor de flujos |
| PostgreSQL | host.docker.internal:5432 | 5432 | Persistencia IoT |
| Mock API tickets | http://host.docker.internal:3001 | 3001 | Servicio externo Bot |
| Mock API notificaciones | http://host.docker.internal:3002 | 3002 | Canal de notificación IoT |

Los servicios mock en puertos 3001 y 3002 pueden ser simulados con `webhook.site` durante las pruebas iniciales, o levantados con un servidor express mínimo dockerizado.

---

## Diferencias clave as-is vs to-be

| Aspecto | As-is | To-be |
|---------|-------|-------|
| Estructura | Un solo flujo monolítico | Orquestador + subflujos por etapa |
| Credenciales | Hardcodeadas en nodos (visibles en JSON) | Gestionadas por credenciales de n8n |
| Validación de entrada | Mínima o ninguna | Etapa dedicada (E1) con contrato definido |
| Lógica de negocio | Mezclada con integración | Aislada en subflujo de dominio (E2) |
| Manejo de errores | Ninguno (falla el flujo completo) | Error workflow + retry en integraciones |
| Idempotencia | Ausente | Clave de idempotencia en cada escritura |
| Log | Historial básico de n8n | Log estructurado JSON por etapa y corrida |
| Trazabilidad | Imposible consultar programáticamente | `run_id` en todos los logs y registros |
| Modificabilidad | Cambio en una regla afecta todo el flujo | Cambio en una regla toca solo E2 |
