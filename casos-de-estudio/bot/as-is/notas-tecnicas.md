# Notas técnicas — Bot as-is

Flujo ad-hoc de soporte por webhook. Diseñado intencionalmente para exhibir los
antipatrones del microframework (REG-001 a REG-010) en un escenario realista de
16 nodos que se asemeja a lo encontrado en equipos sin arquitectura definida.

---

## Estructura del flujo (16 nodos)

| # | Nodo | Tipo | Antipatrón visible |
|---|------|------|--------------------|
| 1 | Webhook Entrada | webhook | — |
| 2 | Sanitizar Input | code | REG-002 (sin run_id), REG-006 (log sin estructura) |
| 3 | Verificar Rate Limit | code | REG-002; rate limit en memoria no distribuido |
| 4 | Limite Excedido? | if | Threshold `> 10` hardcodeado |
| 5 | Error Rate Limit | respondToWebhook 429 | — |
| 6 | Token Valido? | if | REG-001 (token hardcodeado en expresión) |
| 7 | Error Token | respondToWebhook 401 | — |
| 8 | Consultar Historial Usuario | httpRequest GET | REG-004 (sin retry), URL hardcodeada |
| 9 | Clasificar y Preparar Ticket | code | REG-007/008 (R001-R004 + preparación HTTP mezclados) |
| 10 | Detectar Urgencia | if | Duplicación de R001 (`urgente`) ya evaluada en nodo 9 |
| 11 | Marcar Escalacion | set | Campo `escalacion:true` ignorado por la API (dead field) |
| 12 | Crear Ticket | httpRequest POST | REG-004 (sin retry), REG-005 (sin Idempotency-Key) |
| 13 | Guardar Interaccion | postgres | REG-005 (INSERT sin ON CONFLICT) |
| 14 | Notificar Sistema Externo | httpRequest POST | REG-001 (api-key hardcodeada), REG-004 (sin retry) |
| 15 | Preparar Respuesta | set | Acoplamiento a nombres de nodos upstream en expresiones |
| 16 | Responder al Cliente | respondToWebhook 200 | REG-002 (sin run_id en respuesta) |

---

## Antipatrones REG-* verificables

### REG-001 — Credenciales hardcodeadas
- **Nodo 6 (Token Valido?):** `token === "mi-token-secreto-hardcodeado-123"` en expresión del IF.
- **Nodo 14 (Notificar):** header `x-api-key: clave-api-externa-hardcodeada-456` en httpRequest.

### REG-002 — Ausencia de run_id
- Ningún nodo genera ni propaga un `run_id`. Los logs de n8n son el único medio de
  correlación, sin identificador de traza en la respuesta ni en la BD.

### REG-003 — Sin manejo de errores declarativo
- `settings.errorWorkflow` ausente. Cualquier fallo en nodos 8, 12, 13 ó 14 detiene
  la ejecución sin notificación ni compensación.

### REG-004 — HTTP calls sin retry ni timeout explícito
- Tres `httpRequest` sin `retryOnFail`: nodo 8 (Historial), nodo 12 (Crear Ticket),
  nodo 14 (Notificar). Un error transitorio del mock-bot aborta toda la ejecución.

### REG-005 — Sin idempotencia
- **Nodo 12:** ausencia de `Idempotency-Key` en el POST de creación de ticket.
  Un reintento externo crea duplicados en el sistema destino.
- **Nodo 13:** `INSERT INTO interacciones_bot ... VALUES (...)` sin `ON CONFLICT DO NOTHING`.
  Reejecutar la corrida duplica filas en PostgreSQL.

### REG-006 — Logging no estructurado
- **Nodo 2:** `console.log('Solicitud recibida: ' + JSON.stringify({...}))` — mezcla
  texto plano con JSON parcial; sin nivel, sin stage, sin run_id.

### REG-007/008 — Lógica de dominio mezclada con adaptador
- **Nodo 9 (Clasificar y Preparar Ticket):** contiene simultáneamente las reglas R001-R004
  (dominio: clasificación por palabras clave), la construcción del payload HTTP hacia el
  mock-bot (adaptador saliente) y el texto de respuesta al usuario (adaptador entrante).
  En el to-be estas tres responsabilidades se distribuyen en E2 (dominio), E3 (adaptador)
  y el orquestador.

### REG-009 — Código HTTP semánticamente incorrecto
- No aplica directamente al bot (el as-is sí retorna 401/429/200 correctamente),
  pero los campos de error (`rate_exceeded`, `token_invalido`) no siguen un esquema
  de respuesta de error estándar.

### REG-010 — Ausencia de observabilidad
- Sin métricas de latencia por etapa, sin correlación de trazas, sin alertas en caso
  de fallo del nodo Postgres.

---

## Rate limiting en memoria (antipatrón extendido)

El nodo 3 usa `$getWorkflowStaticData('global')` para mantener contadores por `user_id`.
Esta implementación falla en tres escenarios reales:

1. **Reinicio de n8n:** los contadores se pierden — el límite se resetea sin aviso.
2. **Escalado horizontal:** dos instancias de n8n mantienen estados independientes;
   un usuario puede hacer 10 requests por instancia (efectivamente 20).
3. **Ventana deslizante falsa:** la ventana es fija desde el primer request, no deslizante,
   lo que permite ráfagas al inicio de cada ventana.

---

## Tabla PostgreSQL requerida

```sql
CREATE TABLE IF NOT EXISTS interacciones_bot (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(100),
  session_id  VARCHAR(100),
  categoria   VARCHAR(50),
  prioridad   VARCHAR(20),
  ticket_id   VARCHAR(100),
  ts          TIMESTAMPTZ DEFAULT NOW()
);
```

Creada automáticamente por `automatizacion/setup_env.py`.

---

## Flujo de ejecución

```
Webhook Entrada
  └─▶ Sanitizar Input
        └─▶ Verificar Rate Limit
              └─▶ Limite Excedido?
                    ├─▶ [true]  Error Rate Limit (429) ──── fin
                    └─▶ [false] Token Valido?
                                  ├─▶ [false] Error Token (401) ── fin
                                  └─▶ [true]  Consultar Historial Usuario
                                                └─▶ Clasificar y Preparar Ticket
                                                      └─▶ Detectar Urgencia
                                                            ├─▶ [true]  Marcar Escalacion
                                                            │             └─▶ Crear Ticket
                                                            └─▶ [false] Crear Ticket
                                                                          └─▶ Guardar Interaccion
                                                                                └─▶ Notificar Sistema Externo
                                                                                      └─▶ Preparar Respuesta
                                                                                            └─▶ Responder al Cliente (200)
```

---

## Input sets y comportamiento esperado

| Set | Escenario | HTTP as-is | Razón |
|-----|-----------|------------|-------|
| A | Mensaje normal, token válido | 200 | Flujo completo exitoso |
| B | Mensaje con urgencia, token válido | 200 | Nodo 10 activa Marcar Escalacion |
| C | Token inválido | 401 | Nodo 6 rechaza |
| D | Token válido, message vacío | 200 | Sin validación de campos obligatorios |
| E | Token válido, user_id ausente | 200 | Sin validación de campos obligatorios |

Sets D y E documentan el antipatrón: el as-is acepta entradas incompletas que el to-be
rechazaría en E1 (validación de esquema).
