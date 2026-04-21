# Ficha técnica — Caso Bot: Chatbot de soporte

## Descripción

Sistema de soporte al cliente implementado como webhook en n8n. Recibe mensajes
de usuarios, los clasifica por categoría y prioridad, crea un ticket en el sistema
de soporte, registra la interacción en PostgreSQL y notifica a un sistema externo.

---

## Endpoints

| Estado | Método | URL | Descripción |
|--------|--------|-----|-------------|
| as-is | POST | `/webhook/bot-soporte` | Entrada monolítica ad-hoc |
| to-be | POST | `/webhook/bot-support-to-be` | Orquestador microframework |

---

## Reglas de negocio implementadas

| ID | Descripción | Implementación as-is | Implementación to-be |
|----|-------------|---------------------|---------------------|
| R001 | Detección de urgencia por palabras clave | `message.includes('urgente')` en nodo 9 Y duplicado en nodo 10 | E2: campo `urgente` calculado una vez |
| R002 | Clasificación por categoría | `if/else` sobre palabras clave en nodo 9 | E2: función pura `clasificar()` |
| R003 | Prioridad por categoría | Tabla hardcodeada en nodo 9 | E2: constante `PRIORIDADES` |
| R004 | Respuesta según categoría | Texto de respuesta en nodo 9 mezclado con lógica | E3: plantilla de respuesta en adaptador |

---

## Input Sets

| Set | Escenario | Datos clave | HTTP as-is | HTTP to-be |
|-----|-----------|-------------|------------|------------|
| A | Mensaje normal, token válido | `message: "tengo un problema con mi factura"` | 200 | 200 |
| B | Mensaje urgente, token válido | `message: "problema urgente con mi cuenta"` | 200 | 200 |
| C | Token inválido | `token: "token-incorrecto"` | 401 | 400 |
| D | Token válido, message vacío | `message: ""` | 200 | 400 |
| E | Token válido, user_id ausente | sin campo `user_id` | 200 | 400 |

**Sets D y E** documentan el antipatrón REG de validación: el as-is acepta
entradas incompletas (sin message o sin user_id) que el to-be rechaza en E1
con HTTP 400 y un mensaje de error estructurado.

---

## Archivos del caso

| Archivo | Descripción |
|---------|-------------|
| `as-is/bot-as-is.json` | Flujo as-is (16 nodos) — importar en n8n |
| `as-is/notas-tecnicas.md` | Detalle de antipatrones y decisiones de diseño |
| `to-be/` | Subflujos E2, E3 y orquestador (ver microframework/plantillas/) |

---

## Dependencias de infraestructura

- **mock-bot** (puerto 3001): simula el sistema de tickets y el endpoint de notificación
  - `POST /api/tickets` → crea ticket, retorna `{ticket_id}`
  - `GET /api/user/:userId/tickets` → historial del usuario
  - `POST /mock/notificar` → notificación externa, retorna `{status:'ok'}`
  - `POST /api/v2/write` → mock InfluxDB (204)
- **PostgreSQL** (`sensores_db`): tabla `interacciones_bot` para persistencia

---

## Métricas de interés ATAM

| Atributo ISO 25010 | Métrica | Diferencia esperada as-is vs to-be |
|--------------------|---------|-------------------------------------|
| Mantenibilidad | Nodos por flujo | 16 (monolito) vs 3+4+orq (modular) |
| Fiabilidad | Tasa de fallos en sets D/E | as-is 0% fallos (acepta todo), to-be 100% rechazo correcto |
| Seguridad | Credenciales en código | 2 hardcodeadas (REG-001) vs 0 |
| Eficiencia | Latencia p95 | Comparable (misma lógica de negocio) |
