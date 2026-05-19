# Guía de Buenas Prácticas — Micro-framework LC/NC para n8n

**Versión:** 1.0
**Fecha:** 2026-05-18
**Entregable:** R5 del anteproyecto MGADS — "Guía práctica de buenas prácticas para n8n orientada a calidad, operación y adopción gradual del micro-framework"
**Autor:** Elian Hernando Gil Sierra
**Estado:** Aceptado

---

## Audiencia

Esta guía está pensada para cuatro perfiles:

- **Principiante absoluto** — nunca ha usado n8n; quiere entender qué es Low-Code/No-Code estructurado y cómo empezar sin equivocarse.
- **Desarrollador LC/NC** — ya construye flujos en n8n; quiere adoptar un marco que reduzca deuda técnica.
- **Arquitecto / líder técnico** — necesita justificar decisiones (ADR), aplicar Clean Architecture y mapear a ISO/IEC 25010.
- **Operador / SRE** — diseña la observabilidad, la gestión de incidentes y el camino hacia producción en AWS.

Toda la guía está respaldada por evidencia cuantitativa real medida sobre dos casos de estudio (Bot e IoT) — 8000 corridas, 12 escenarios ATAM, micro-framework v1.0 validado.

---

## Cómo leer esta guía

Tres rutas según tu tiempo y rol:

| Ruta | Capítulos | Para qué |
|---|---|---|
| **Completa** | 1 → 12 + Apéndices | Adoptar el micro-framework de extremo a extremo |
| **Esencial (recomendada)** | 1, 3, 5, 6, 7, 8, 10 | Las 5 secciones obligatorias del anteproyecto + Quick Start |
| **Adopción gradual** | 1 → 4, después Cap 12 → revisar tu nivel actual y avanzar | Equipos con flujos legacy que quieren mejorar incrementalmente |

---

## Tabla de contenidos

1. [Introducción y motivación](#1-introducción-y-motivación)
2. [Pre-requisitos y entorno](#2-pre-requisitos-y-entorno)
3. [Quick Start de 30 minutos](#3-quick-start-de-30-minutos)
4. [Fundamentos: el metamodelo E1–E4](#4-fundamentos-el-metamodelo-e1e4)
5. [Validación de E/S](#5-validación-de-es)
6. [Manejo de errores: reintentos e idempotencia](#6-manejo-de-errores-reintentos-e-idempotencia)
7. [Seguridad: gestión de secretos](#7-seguridad-gestión-de-secretos)
8. [Observabilidad: logs estructurados](#8-observabilidad-logs-estructurados)
9. [Catálogo de antipatrones](#9-catálogo-de-antipatrones)
10. [Checklist final aplicable](#10-checklist-final-aplicable)
11. [Escalando del laboratorio a producción AWS](#11-escalando-del-laboratorio-a-producción-aws)
12. [Trazabilidad y madurez](#12-trazabilidad-y-madurez)
13. [Apéndices](#apéndices)

---

## 1. Introducción y motivación

### 1.1 El problema

Las plataformas Low-Code/No-Code (LC/NC) como n8n han democratizado la automatización: cualquier persona puede construir un flujo arrastrando nodos. Pero ese poder tiene un costo silencioso. Sin estructura, los flujos crecen como un nodo monolítico donde se mezclan: recepción del request, validación, reglas de negocio, persistencia, notificaciones y manejo de errores. Cuando algo falla, todo falla. Cuando hay que cambiar una regla, hay que tocar todo. Cuando hay un incidente, no hay logs útiles.

Esto es lo que llamamos **arquitectura ad-hoc**: funciona el primer día y se vuelve inmantenible al tercer mes.

### 1.2 La solución: un micro-framework

El **micro-framework LC/NC para n8n** propone:

- Un **metamodelo de 4 etapas (E1–E4)** inspirado en Clean Architecture (Martin, 2017): validación, dominio, adaptadores, salida.
- **10 reglas obligatorias (REG-001…010)** con criterio binario de cumplimiento.
- **6 reglas recomendadas (REC-001…006)** para trazabilidad y operabilidad.
- **5 patrones probados** (retry, idempotencia, circuit-breaker, error-boundary, saga).
- **11 antipatrones catalogados** con su regla correctora.
- **Checklists ejecutables** (arquitectura + DevSecOps) verificados por un script automático.

### 1.3 La evidencia

El micro-framework fue validado sobre dos casos de estudio reales: un Bot de soporte y un pipeline IoT. Mediciones comparativas as-is (sin micro-framework) vs to-be (con micro-framework):

| Métrica | as-is | to-be | Mejora |
|---|---|---|---|
| Nodos afectados por Change Request (Bot) | 8.7 promedio | 1.0 | **−81 %** |
| Nodos afectados por Change Request (IoT) | 6.3 promedio | 0.67 | **−84 %** |
| Tasa de fallos Bot | 9 % | 6 % | **−36.6 %** |
| Checklist de arquitectura cumplido (Bot/IoT) | 1/10 | 10/10 | **100 %** |
| Cobertura ATAM | — | 11/12 escenarios | **92 %** |
| MTTD (Mean Time To Detect) Bot | n/a | ~14 segundos | **Meta < 60 s ✅** |

*Fuente: `medicion/consolidado/comparacion-2026-05-05.md`, `metricas-derivadas.md`, `atam-evidencia.md`.*

Lo que prometemos: si aplicas las reglas de esta guía, tu flujo será modificable, seguro, observable y diagnosticable.

### 1.4 Qué obtendrás al terminar

- Un entorno n8n funcionando localmente en 30 minutos (Cap. 3).
- Capacidad de leer cualquier flujo n8n y diagnosticar qué REG viola (Caps. 4–9).
- Un checklist imprimible para revisar tus propios flujos antes de un merge (Cap. 10).
- Un camino claro de escalado del laboratorio a producción AWS (Cap. 11).
- Un mapa para autoevaluar tu nivel de madurez (Cap. 12).

### 1.5 Glosario rápido

Antes de empezar, fija estos 25 términos:

| Término | Significado breve |
|---|---|
| **n8n** | Plataforma de automatización LC/NC; "Node-mation" con nodos visuales y código embebido |
| **Workflow** | Flujo de automatización en n8n; es un grafo de nodos conectados |
| **Subflow / Subflujo** | Workflow invocado desde otro via nodo `Execute Workflow` |
| **Webhook** | Endpoint HTTP que dispara la ejecución de un workflow |
| **LC/NC** | Low-Code / No-Code — paradigma de desarrollo visual con poco código |
| **Clean Architecture** | Estilo arquitectónico (Martin 2017) que separa dominio, casos de uso e infraestructura |
| **DevSecOps** | Integración de seguridad y operación dentro del ciclo de desarrollo |
| **E1 / E2 / E3 / E4** | Las 4 etapas del metamodelo: Validación / Dominio / Adaptador / Salida |
| **REG-001…010** | Las 10 reglas obligatorias del micro-framework |
| **REC-001…006** | Las 6 reglas recomendadas |
| **ADR** | Architecture Decision Record — registro versionado de una decisión arquitectónica |
| **ATAM** | Architecture Tradeoff Analysis Method (Bass & Kazman) — método de evaluación arquitectónica |
| **MTTD** | Mean Time To Detect — tiempo medio para detectar un incidente |
| **Idempotencia** | Propiedad: ejecutar la operación N veces produce el mismo efecto que ejecutarla 1 vez |
| **Retry con backoff** | Reintento con espera creciente entre intentos (típicamente exponencial) |
| **Circuit Breaker** | Patrón que detiene reintentos cuando un servicio externo está caído |
| **Error Boundary** | Punto del flujo donde se captura y aísla el error |
| **Saga / Compensación** | Patrón de transacción distribuida con rollback explícito |
| **Antipatrón** | Solución común que parece resolver un problema pero crea otros peores |
| **CR — Change Request** | Solicitud de cambio sobre un flujo (CR1, CR2, CR3 en este proyecto) |
| **run_id** | Identificador único de una ejecución (formato `RUN-{CASO}-{ts}-{rnd}`) |
| **Idempotency-Key** | Header HTTP / clave en BD que permite detectar duplicados |
| **ON CONFLICT DO NOTHING** | Cláusula SQL de PostgreSQL para evitar inserts duplicados |
| **CloudWatch Logs** | Servicio AWS que persiste logs stdout de los contenedores |
| **Queue Mode** | Modo de n8n que separa main (UI/webhooks) de workers (ejecución) via Redis |

---

## 2. Pre-requisitos y entorno

### 2.1 Hardware y software

| Recurso | Mínimo | Recomendado |
|---|---|---|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disco | 5 GB libres | 20 GB libres |
| Sistema | Windows 10/11 · macOS 12+ · Linux moderno | Windows 11 Pro · macOS 14 |
| Software base | Docker Desktop · Git · editor (VS Code) | + Node.js 20 LTS (para `validar-flujos.mjs`) |

### 2.2 Estructura del repositorio

Para esta guía solo necesitas conocer las carpetas clave:

```
n8n-microframework/
├── infraestructura/            # docker-compose.yml + .env.example (entorno local)
├── microframework/             # Reglas, patrones, checklists, plantillas — el corazón
│   ├── reglas/                 # REG-001…010 + REC-001…006
│   ├── patrones/               # 5 patrones (retry, idempotencia, ...)
│   ├── antipatrones.md         # 11 antipatrones
│   ├── checklists/             # arquitectura + devsecops
│   ├── plantillas/             # JSONs to-be importables en n8n
│   ├── contratos/              # 9 JSON Schemas E/S
│   ├── guia-observabilidad.md  # Contrato del log JSON por etapa
│   ├── validacion/             # validar-flujos.mjs (script de validación)
│   └── adr/                    # ADRs framework-level (MF-001..007)
├── casos-de-estudio/           # Bot e IoT (as-is + to-be) — ejemplos completos
├── medicion/                   # Datasets, run-logs y métricas comparativas
├── docs/                       # Documentación de contexto y entregables
│   ├── aws/                    # Diseño de Fase 8 (Capítulo 11 lo referencia)
│   ├── atam/                   # Evaluación ATAM Fase 7
│   ├── microframework-v1.0.md  # R1 — documento consolidado del micro-framework
│   └── guia-buenas-practicas.md # ← este documento (R5)
└── estado-actual.md            # Fuente de verdad del avance del proyecto
```

### 2.3 Convenciones críticas (resumen)

Tres reglas que aplican siempre:

1. **Credenciales nunca en Git.** Van en `.env` (ignorado) y se referencian por nombre desde los Credentials de n8n.
2. **El JSON exportado del flujo es la fuente de verdad.** Si modificas en la UI de n8n, re-exporta y versiona en Git.
3. **Cada decisión arquitectónica relevante se documenta como ADR.** Plantilla en `microframework/plantillas/ADR-plantilla.md`.

La especificación completa de convenciones está en `docs/context/convenios-y-reglas.md`.

---

## 3. Quick Start de 30 minutos

Este capítulo te lleva desde cero hasta tener un flujo n8n del micro-framework ejecutándose y emitiendo logs JSON. Asume que tienes Docker Desktop instalado.

### 3.1 Clonar el repositorio (2 min)

```bash
git clone https://github.com/<tu-org>/n8n-microframework.git
cd n8n-microframework
```

### 3.2 Configurar variables de entorno (2 min)

```powershell
# PowerShell
Copy-Item infraestructura\.env.example infraestructura\.env
```

```bash
# Bash / macOS / Linux
cp infraestructura/.env.example infraestructura/.env
```

Edita `infraestructura/.env` y ajusta como mínimo:

```
POSTGRES_USER=n8n
POSTGRES_PASSWORD=cambia-esto-en-local
POSTGRES_DB=n8n_db
N8N_ENCRYPTION_KEY=genera-32-bytes-aleatorios
```

> ⚠️ `N8N_ENCRYPTION_KEY` no debe cambiar después de creado el entorno: las credenciales guardadas en n8n se cifran con esta clave y serían irrecuperables.

### 3.3 Levantar el entorno (5 min)

```bash
docker compose -f infraestructura/docker-compose.yml up -d
```

Esto levanta cuatro contenedores: `n8n` (puerto 5678), `postgres` (5432), `mock-bot` (3001) y `mock-iot` (3002).

Verifica:

```bash
docker compose -f infraestructura/docker-compose.yml ps
```

Los cuatro contenedores deben aparecer en estado `Up` / `healthy`.

### 3.4 Acceder a la UI de n8n y crear cuenta local (3 min)

Abre [http://localhost:5678](http://localhost:5678). En la primera carga, n8n te pedirá crear una cuenta de owner local — usa cualquier email y contraseña; no hay servicios externos involucrados.

### 3.5 Configurar la credencial de PostgreSQL (3 min)

En la UI:

1. **Settings → Credentials → New Credential** → tipo `Postgres`.
2. Asigna el nombre **`Postgres Local`** (este nombre se referencia en los flujos).
3. Configura:
   - Host: `postgres`
   - Database: `n8n_db`
   - User: `n8n`
   - Password: el valor de `POSTGRES_PASSWORD` en `.env`
   - Port: `5432`
4. Guarda y prueba la conexión.

### 3.6 Importar el flujo to-be IoT (5 min)

Desde la UI, importa en este orden (los subflujos primero):

1. `microframework/plantillas/iot-to-be-e1-validacion.json`
2. `microframework/plantillas/iot-to-be-e2-dominio.json`
3. `microframework/plantillas/iot-to-be-e3-persistencia.json`
4. `microframework/plantillas/iot-to-be-e4-notificacion.json`
5. `microframework/plantillas/iot-to-be-orquestador.json`

Para cada subflujo, anota el **ID** que n8n le asigna (visible en la URL: `/workflow/{ID}`).

Abre el orquestador y para cada nodo `Execute Workflow`, selecciona el subflujo correspondiente desde el dropdown (los IDs hardcodeados en el JSON pueden no coincidir con tu instancia — esto es el antipatrón "acoplamiento por ID hardcodeado", documentado en Cap. 9).

Activa el orquestador (toggle en la esquina superior derecha).

### 3.7 Ejecutar un primer request (3 min)

```powershell
# PowerShell
$body = Get-Content "medicion\datasets\iot\input-set-B.json" -Raw
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:5678/webhook/iot-sensor-to-be" `
  -ContentType "application/json" `
  -Body $body
```

```bash
# Bash
curl -X POST http://localhost:5678/webhook/iot-sensor-to-be \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-B.json
```

Debes recibir HTTP `200 OK` y una respuesta JSON con `run_id` y `nivel_alerta`.

### 3.8 Ver los logs JSON estructurados (3 min)

```bash
docker compose -f infraestructura/docker-compose.yml logs n8n | grep '"etapa"'
```

Verás líneas como:

```json
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E1_validacion","status":"ok","caso":"iot","duracion_ms":5,...}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E2_dominio","status":"ok","resultado_clave":"critico","duracion_ms":12,...}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E3_adaptador","status":"ok","idempotency_key":"sensor-S42-...","duracion_ms":45,...}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E4_salida","status":"ok","notificacion_enviada":true,"duracion_total_ms":215}
```

Cada etapa es trazable, mensurable y diagnosticable. Esto es **Observabilidad por diseño** (REG-006).

### 3.9 Ejecutar el validador estático (4 min)

```bash
node microframework/validacion/validar-flujos.mjs
```

El script analiza todos los JSON de flujo del repositorio y produce un reporte indicando qué REGs cumple/falla cada uno. Los flujos to-be deben dar **100 %** de cumplimiento.

### 3.10 Errores comunes y solución

| Error | Causa probable | Solución |
|---|---|---|
| `address already in use :5678` | Otro proceso usa el puerto | Cambiar el puerto en `docker-compose.yml` o detener el otro proceso |
| `connection refused postgres` | Postgres aún arrancando | Espera 15 s y reintenta `docker compose ps` |
| `Could not find workflow` en n8n | Subflujo no importado o ID desactualizado | Importar subflujos primero; actualizar referencias en orquestador |
| `webhook not found` | Workflow no activado | Toggle "Active" en la esquina superior derecha |
| `HTTP 401` con payload válido | Header de autenticación faltante | Revisar el payload en `medicion/datasets/iot/` |

---

## 4. Fundamentos: el metamodelo E1–E4

### 4.1 De Clean Architecture a n8n

Robert C. Martin propone en *Clean Architecture* (2017) que un sistema sostenible separa cuatro capas concéntricas: entidades de dominio, casos de uso, adaptadores de interfaz e infraestructura externa. La regla de dependencia es estricta: las capas internas no conocen las externas.

n8n no impone ninguna estructura: cualquier flujo puede tocar HTTP, base de datos, lógica de dominio y respuesta al cliente en un solo nodo. Por eso necesitamos un **metamodelo** que traduzca Clean Architecture al mundo LC/NC.

### 4.2 Las cuatro etapas

```mermaid
flowchart LR
  WH[Webhook<br/>Entrada HTTP]:::io
  E1[E1 — Validación<br/>Estructura, tipos,<br/>contratos JSON]:::e1
  E2[E2 — Dominio<br/>Reglas de negocio<br/>SIN integraciones]:::e2
  E3[E3 — Adaptador<br/>BD + APIs externas<br/>Idempotencia]:::e3
  E4[E4 — Salida<br/>Notificaciones +<br/>Respuesta HTTP]:::e4
  RESP[Respond to<br/>Webhook]:::io
  ERR[Error Workflow<br/>obligatorio]:::err

  WH --> E1
  E1 -->|✓ válido| E2
  E1 -.->|✗ HTTP 400/422| RESP
  E2 --> E3
  E3 --> E4
  E4 --> RESP
  E1 -.->|excepción| ERR
  E2 -.->|excepción| ERR
  E3 -.->|excepción| ERR
  E4 -.->|excepción| ERR

  classDef e1 fill:#FFE5B4,stroke:#B8860B,color:#000
  classDef e2 fill:#C7F0C7,stroke:#2D6A2D,color:#000
  classDef e3 fill:#C0D8F0,stroke:#1A4F7A,color:#000
  classDef e4 fill:#E8D5FF,stroke:#6A2D9A,color:#000
  classDef io fill:#F0F0F0,stroke:#333,color:#000
  classDef err fill:#FFCCCC,stroke:#A00,color:#000
```

### 4.3 Responsabilidades por etapa

| Etapa | Responsable de | Prohibido | REGs aplicables |
|---|---|---|---|
| **E1 — Validación** | Generar `run_id`, verificar estructura, tipos, contratos JSON, autenticación. Decidir si el request pasa a E2 o se rechaza con HTTP 400/422/401. | Lógica de negocio. Llamadas a BD o APIs. | REG-002, REG-009 |
| **E2 — Dominio** | Aplicar reglas de negocio puras. Clasificación, decisión, transformación de datos según reglas (R001, R002…). | Llamadas HTTP. Acceso a BD. Tocar credenciales. | REG-007 |
| **E3 — Adaptador** | Persistencia (PostgreSQL con `ON CONFLICT`), llamadas a APIs externas con retry, idempotencia, gestión de errores transitorios. | Reglas de negocio (las que vienen ya decididas de E2). | REG-004, REG-005, REG-008 |
| **E4 — Salida** | Notificaciones diferenciadas (canal por nivel), respuesta HTTP al cliente, log final con `duracion_total_ms`. | Decisiones de dominio. Acceso a BD primario. | REG-008 |

Transversal a todas las etapas: **REG-001** (sin credenciales hardcodeadas), **REG-003** (errorWorkflow configurado), **REG-006** (log JSON por etapa), **REG-010** (al menos un ADR documentado).

### 4.4 Mapeo a ISO/IEC 25010

| Etapa | Atributo de calidad principal | Subcaracterística |
|---|---|---|
| E1 | Adecuación funcional | Corrección (rechazo correcto de entrada inválida) |
| E2 | Mantenibilidad | Modularidad (cambiar regla = tocar solo E2) |
| E3 | Fiabilidad | Madurez, recuperabilidad, tolerancia a fallos |
| E4 | Operabilidad | Monitoreabilidad |
| Transversal | Seguridad · Mantenibilidad · Fiabilidad · Operabilidad | Confidencialidad, analizabilidad, modificabilidad |

Para profundizar en el metamodelo formal, ver `docs/context/microframework-spec.md`.

### 4.5 Por qué este metamodelo funciona

Tres consecuencias prácticas medidas en este proyecto:

1. **Cambiar una regla de negocio toca 1 subflujo** (E2), no todo el flujo. Medido: −81 % nodos por CR en Bot, −84 % en IoT.
2. **Reemplazar un proveedor externo toca 1 subflujo** (E3 o E4), sin riesgo en el dominio. Demostrado en CR-BOT-005 (cambio de proveedor de tickets): 1 nodo modificado vs 5 en as-is.
3. **Diagnosticar un fallo toma segundos**, no minutos: el log JSON identifica la etapa exacta. Medido: MTTD ~14 s en Bot Q5.

---

## 5. Validación de E/S

> **Reglas en juego:** REG-007 (E2 sin integraciones), REG-008 (integraciones solo en E3/E4), REG-009 (HTTP status codes apropiados).
> **Sección obligatoria del anteproyecto:** ✅ "Validación E/S".

### 5.1 Por qué importa

El antipatrón **"validación ausente"** es el más común en flujos LC/NC ad-hoc. En nuestro proyecto, el flujo IoT as-is muestra **0 % de fallos** porque simplemente no valida — todo entra, todo se persiste, hasta cuando faltan campos críticos como `co2`. Esto no es robustez: es ceguera.

El flujo IoT to-be, con E1 validando contra contrato, rechaza correctamente entradas inválidas con HTTP 422 y persiste solo lo válido. Esto se traduce en datos confiables aguas abajo.

### 5.2 Validación en E1: el patrón

E1 tiene tres responsabilidades:

1. **Generar `run_id`** (formato `RUN-{CASO}-{timestamp}-{random6}`) — REG-002.
2. **Validar estructura y tipos** del payload contra un contrato JSON Schema.
3. **Decidir el destino**: pasar a E2 (válido) o responder con HTTP 4xx (inválido).

#### Implementación mínima en n8n

Un nodo `Code` al inicio del flujo:

```javascript
// E1 — Validación
const start_ts = new Date().toISOString();
const input = $input.first().json;
const run_id = `RUN-IOT-${Date.now()}-${Math.random().toString(36).substring(2,8)}`;

const errores = [];
if (!input.sensor_id) errores.push('sensor_id requerido');
if (typeof input.temperatura !== 'number') errores.push('temperatura debe ser número');
if (typeof input.humedad !== 'number') errores.push('humedad debe ser número');
if (typeof input.co2 !== 'number') errores.push('co2 debe ser número');

const status = errores.length === 0 ? 'ok' : 'fail';
const end_ts = new Date().toISOString();

console.log(JSON.stringify({
  run_id, etapa: 'E1_validacion', status, caso: 'iot',
  errores, campos_validados: ['sensor_id','temperatura','humedad','co2'],
  start_ts, end_ts, duracion_ms: new Date(end_ts) - new Date(start_ts)
}));

return [{ json: { run_id, status, errores, ...input, start_ts } }];
```

Un nodo `IF` posterior enruta:
- `status === 'ok'` → E2 (siguiente subflujo).
- `status === 'fail'` → `Respond to Webhook` con HTTP **422** y el array `errores`.

### 5.3 Contratos formales con JSON Schema

El repositorio incluye 9 JSON Schemas listos para usar en `microframework/contratos/`:

| Schema | Propósito |
|---|---|
| `bot-webhook-input.schema.json` | Validar payload de entrada Bot |
| `bot-e1-output.schema.json` | Validar salida de E1 Bot |
| `bot-e2-output.schema.json` | Validar salida de E2 (clasificación) |
| `bot-e3-output.schema.json` | Validar salida de E3 (ticket creado) |
| `iot-webhook-input.schema.json` | Validar payload de entrada IoT |
| `iot-e1-output.schema.json` | Validar salida de E1 IoT |
| `iot-e2-output.schema.json` | Validar salida de E2 (clasificación nivel) |
| `iot-e3-output.schema.json` | Validar salida de E3 (insert PostgreSQL) |
| `iot-e4-output.schema.json` | Validar salida de E4 (notificación enviada) |

Estos contratos sirven en tres momentos:
- **Diseño:** son la fuente de verdad de qué espera cada etapa.
- **Runtime:** se pueden cargar dinámicamente en E1 con `ajv` (vía Code node) para validación formal.
- **Validación estática:** `validar-flujos.mjs` los usa para verificar consistencia.

### 5.4 HTTP status codes (REG-009)

| Situación | Status | Cuándo usar |
|---|---|---|
| Éxito | **200** | Operación completada correctamente |
| Sintaxis inválida | **400** | JSON malformado, campo de tipo incorrecto, campos faltantes |
| Semántica inválida | **422** | JSON bien formado pero rangos fuera de contrato (ej. co2 < 0) |
| Autenticación fallida | **401** | Token ausente o incorrecto |
| Error interno no controlado | **500** | Excepción no capturada — el error workflow debe atraparla |

> Antipatrón crítico: responder **HTTP 200** ante un error de validación. Esto rompe el contrato HTTP con el cliente. El flujo IoT as-is lo hace; el to-be lo corrige.

### 5.5 Ejemplos medidos en este proyecto

**Bot — Set C (token inválido)**

- as-is: respondía HTTP 200 con mensaje genérico → 0 % failure visible.
- to-be: responde HTTP 401 con `{"error":"token inválido"}` → 100 % failure correctamente reportado.
- Escenario ATAM: **BOT-Q3** (Confidencialidad credenciales).

**IoT — Set C (campo co2 faltante)**

- as-is: persistía la lectura con `co2: undefined` → datos corruptos en BD.
- to-be: responde HTTP 422 con `{"errores":["co2 debe ser número"]}` → BD intacta.
- Escenario ATAM: **IOT-Q3** (Integridad lecturas).

### 5.6 Checklist mini de validación

```
[ ] E1 genera run_id único antes de cualquier procesamiento
[ ] E1 valida estructura, tipos y autenticación
[ ] Entradas inválidas se responden con HTTP 400/422/401 (no 200)
[ ] E1 emite log JSON con campo `errores` (array, vacío si OK)
```

---

## 6. Manejo de errores: reintentos e idempotencia

> **Reglas en juego:** REG-003 (errorWorkflow), REG-004 (retry), REG-005 (idempotencia).
> **Patrones:** retry, idempotencia, error-boundary, circuit-breaker, saga-compensación.
> **Sección obligatoria del anteproyecto:** ✅ "Manejo de errores (reintentos e idempotencia)".

### 6.1 La realidad de las integraciones externas

Las APIs fallan. PostgreSQL se desconecta. La red parpadea. Si tu flujo no está preparado para esto, dos cosas pasarán:

1. Datos perdidos: el sensor envió la lectura, la API externa falló, el dato nunca llegó a la BD.
2. Datos duplicados: el retry envía la misma operación dos veces y el ticket se crea por duplicado.

El micro-framework resuelve esto con tres elementos: **retry con backoff**, **idempotencia** y **error workflow**.

### 6.2 Patrón Retry con backoff exponencial (REG-004)

#### Configuración mínima en el nodo HTTP Request de n8n

```json
"options": {
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenTries": 2000
  }
}
```

**Reintentos diferenciados por urgencia** (caso IoT):

- **Crítico:** `maxRetries: 3`, espera inicial 2 s → resilencia máxima.
- **Advertencia:** `maxRetries: 2`, espera inicial 1 s → resilencia moderada.
- **Normal:** sin retry → minimiza latencia nominal.

#### Trade-off identificado en ATAM (TP-IOT-01)

Más reintentos = más resilencia, pero **+10.8 ms** de overhead nominal. Cuando el servicio externo está caído y maxRetries=3 se activa, la latencia puede llegar a 30 s. Medido y aceptado en este proyecto porque la pérdida de una alerta crítica es peor que el delay.

Para profundizar ver `microframework/patrones/patron-retry.md`.

### 6.3 Patrón Idempotencia (REG-005)

Una operación es **idempotente** si ejecutarla N veces produce el mismo resultado que ejecutarla 1 vez. Esto es crítico cuando combinamos retry con escrituras.

#### Implementación en PostgreSQL

```sql
INSERT INTO lecturas_sensor (idempotency_key, sensor_id, temperatura, humedad, co2, nivel_alerta, ts)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
```

- **`idempotency_key`** debe ser determinístico para una misma operación lógica. Buena fórmula: `${sensor_id}-${ts_epoch}` o `${user_id}-${request_hash}`.
- **`ON CONFLICT DO NOTHING`** asegura que un segundo insert con la misma clave no produzca error ni duplicado.

#### Implementación en APIs externas

Cuando el servicio externo lo soporta (REC-003):

```
HTTP POST /api/tickets
Headers:
  Idempotency-Key: bot-user42-20260518T143025
```

Si el servidor lo implementa, devolverá la misma respuesta para la misma clave incluso ante reintentos.

#### Evidencia en este proyecto

- **BOT-Q4:** Set K (reintentos forzados, 200 corridas) → 0 % tickets duplicados ✅.
- **IOT-Q3:** Set K (reintentos forzados, 200 corridas) → 0 % lecturas duplicadas en BD ✅.

Para profundizar ver `microframework/patrones/patron-idempotencia.md`.

### 6.4 Error workflow obligatorio (REG-003)

Toda excepción no controlada en cualquier nodo del orquestador debe disparar un **error workflow** dedicado. Sin él, los fallos son invisibles.

#### Cómo configurarlo en n8n

1. Crear un workflow nuevo con un nodo `Error Trigger`. Este nodo recibe el contexto del error (nodo que falló, mensaje, stack, payload original).
2. En el error workflow:
   - Emitir un log JSON con `etapa: "ERROR_HANDLER"`, `status: "fail"`, `error_node`, `error_message`.
   - Insertar el evento en una tabla `dead_letter_iot` o `dead_letter_bot` para análisis posterior.
   - Notificar por canal alterno (Slack, email, SNS en AWS).
3. En el orquestador: `Settings → Error Workflow → seleccionar el workflow de error`.

#### Sensitivity Point identificado en ATAM (SP-IOT-01)

El error handler del flujo IoT inicialmente notificaba usando el **mismo canal HTTP** que E4 usa para alertas. Si el canal cae, ni la alerta original ni el aviso de error llegan. Mitigación: usar un canal independiente para el error handler (en AWS: CloudWatch Alarm → SNS, ver Cap. 11).

Para profundizar ver `microframework/patrones/patron-error-boundary.md` y `ADR-MF-002-error-workflow-reg003.md`.

### 6.5 Patrones avanzados — cuándo aplicarlos

**Circuit Breaker** (`patron-circuit-breaker.md`)
- Cuándo: una API externa falla repetidamente (ej. > 50 % en los últimos 60 s).
- Qué hace: deja de intentar durante una "ventana de enfriamiento" (típicamente 30–60 s) y devuelve fast-fail.
- Por qué: evita saturar un servicio caído y consumir conexiones que no van a tener respuesta.

**Saga / Compensación** (`patron-saga-compensacion.md`)
- Cuándo: una operación de negocio toca múltiples sistemas externos y el éxito parcial es peor que el rollback.
- Qué hace: define para cada paso `forward` una operación `compensate` que revierte sus efectos.
- Ejemplo: si E3 inserta en BD y E4 falla, una saga revertiría el insert.
- En este proyecto: documentado como patrón disponible pero no aplicado (los casos Bot e IoT no requieren transacciones distribuidas).

### 6.6 Checklist mini de manejo de errores

```
[ ] El orquestador tiene errorWorkflow configurado en settings
[ ] Cada nodo HTTP Request tiene retry habilitado con maxRetries ≥ 2
[ ] Cada INSERT a BD incluye ON CONFLICT (idempotency_key) DO NOTHING
[ ] El error handler usa canal alterno al de las notificaciones normales
```

---

## 7. Seguridad: gestión de secretos

> **Regla en juego:** REG-001 (sin credenciales hardcodeadas).
> **Checklist:** DevSecOps (8 ítems).
> **ADR:** `ADR-MF-001-gestion-secretos-reg001.md`.
> **Sección obligatoria del anteproyecto:** ✅ "Seguridad (gestión de secretos)".

### 7.1 La regla cero

> **Ningún flujo del repositorio puede contener credenciales como valor literal.**

Cuando exportas un workflow de n8n, el JSON se versiona en Git. Si una API key, password o token está hardcodeado en un nodo, queda expuesto para siempre en el historial del repositorio — incluso si después lo borras. Esto es lo más fácil de evitar y lo más común de encontrar.

### 7.2 Cómo gestionar secretos en n8n local

n8n tiene un **gestor de Credentials** integrado. Las credenciales se almacenan cifradas en la base de datos de n8n (cifradas con `N8N_ENCRYPTION_KEY`). El JSON exportado solo contiene una **referencia por nombre**, no el valor real.

#### Patrón correcto

1. En la UI de n8n: **Settings → Credentials → New** → tipo apropiado (PostgreSQL, HTTP Header Auth, etc.).
2. Asignar un nombre descriptivo y estable: `Postgres Local`, `Bot API Token`, `IoT Webhook Auth`.
3. Configurar los valores reales.
4. En los nodos del flujo: seleccionar la credencial por nombre desde el dropdown.

#### Lo que verás en el JSON exportado (correcto)

```json
"credentials": {
  "postgres": {
    "id": "abc123",
    "name": "Postgres Local"
  }
}
```

#### Lo que NUNCA debes ver en el JSON

```json
"parameters": {
  "headers": {
    "Authorization": "Bearer sk_live_REAL_TOKEN_AQUI"   // ⛔ HARDCODEADO
  }
}
```

### 7.3 Variables sensibles del entorno

Las variables de entorno se gestionan en dos niveles:

| Archivo | Trackeado en Git | Propósito |
|---|---|---|
| `infraestructura/.env.example` | ✅ Sí | Plantilla con nombres de variables, sin valores reales |
| `infraestructura/.env` | ❌ Nunca | Valores reales locales — está en `.gitignore` |

**Variables críticas:**

| Variable | Notas |
|---|---|
| `POSTGRES_PASSWORD` | Cambiar en cada entorno |
| `N8N_ENCRYPTION_KEY` | 32 bytes aleatorios; NUNCA cambiar después de creado el entorno |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | Si activas auth básica de n8n |

### 7.4 Validación automática (Pilar 2 DevSecOps)

El repositorio incluye `microframework/validacion/validar-flujos.mjs`, un script Node.js sin dependencias externas que recorre todos los JSONs de flujos y verifica las REGs. Para REG-001, busca:

- Patrones: `token`, `api_key`, `password`, `Bearer`, `secret` con valor literal en cualquier campo `parameters`.
- Si encuentra un patrón sospechoso, marca el flujo como **FAIL** en el reporte.

**Cómo ejecutarlo:**

```bash
node microframework/validacion/validar-flujos.mjs
```

**Cuándo:** antes de cada commit que toque flujos, y como gate en CI/CD.

### 7.5 Riesgo abierto: rotación de tokens (R-BOT-01)

El micro-framework v1.0 no mitiga estructuralmente la **rotación periódica** de tokens API. En el entorno local, la rotación es manual: actualizar el valor en la credencial de n8n y reiniciar el flujo si está activo.

**En producción AWS (Fase 8):** AWS Secrets Manager rota automáticamente las contraseñas RDS cada 30 días. Para tokens API externos: rotación mediante Lambda + integración con External Secrets en n8n.

Ver Cap. 11 para el detalle del diseño AWS.

### 7.6 Checklist DevSecOps — los 8 ítems explicados

| # | Ítem | Cómo verificarlo |
|---|---|---|
| 1 | No hay API keys, tokens ni passwords en el JSON del flujo | Búsqueda manual en el JSON + `validar-flujos.mjs` |
| 2 | No hay datos sensibles en los campos de log | Inspección de `console.log(JSON.stringify({...}))` — solo nombres de campos, no valores |
| 3 | Las credenciales están creadas en n8n Credentials | Cada nodo HTTP / DB referencia credencial por nombre |
| 4 | El archivo `.env` real no está trackeado en Git | `git status` no debe mostrar `.env`; `.gitignore` lo incluye |
| 5 | El `.env.example` está actualizado con todas las variables | Cada variable usada en `docker-compose.yml` tiene entrada en `.env.example` |
| 6 | El webhook valida autenticación antes de procesar | E1 verifica el token antes de pasar a E2 |
| 7 | Los endpoints usan HTTPS en producción | URLs `https://` (no `http://`) en credenciales productivas; `localhost` aceptable en dev |
| 8 | El error handler no expone detalles internos al cliente | El `Respond to Webhook` en error devuelve mensaje genérico, NO el stack trace |

### 7.7 Antipatrones de seguridad a evitar

- **Token hardcodeado** en un nodo HTTP.
- **API-key visible en el output del nodo** y por tanto en los logs (n8n persiste los outputs si `saveDataSuccessExecution` no es `none`).
- **Password en el campo `notes`** o `description` del workflow.
- **Stack trace devuelto al cliente** en respuestas de error.

---

## 8. Observabilidad: logs estructurados

> **Regla en juego:** REG-006 (log JSON por etapa).
> **Recomendadas:** REC-004 (timestamps por etapa), REC-005 (contexto en logs).
> **Documento de referencia:** `microframework/guia-observabilidad.md` (Pilar 3 DevSecOps).
> **ADR:** `ADR-MF-003-log-estructurado-reg006.md`.
> **Sección obligatoria del anteproyecto:** ✅ "Observabilidad (logs estructurados)".

### 8.1 Por qué los logs JSON son innegociables

El historial de ejecuciones de n8n es útil para depurar visualmente, pero no es un sistema de observabilidad: no se puede consultar programáticamente, no se puede calcular MTTD, no se puede correlacionar eventos entre ejecuciones.

Los logs JSON estructurados:
- Se emiten con `console.log` desde un nodo Code → llegan a stdout del contenedor.
- Son consultables con `grep`, `jq`, CloudWatch Insights, sin parseo adicional.
- Permiten calcular métricas (latencia, fallos, MTTD) en cualquier herramienta de análisis.

**Evidencia medida:** MTTD ≈ 14 segundos en el escenario BOT-Q5 (Operabilidad) — meta del anteproyecto < 60 s ampliamente cumplida.

### 8.2 Contrato de log por etapa

#### Campos comunes (todas las etapas)

| Campo | Tipo | Significado |
|---|---|---|
| `run_id` | string | Identificador único de la ejecución (REG-002) |
| `etapa` | string | `E1_validacion` · `E2_dominio` · `E3_adaptador` · `E4_salida` |
| `status` | string | `ok` · `fail` · `skip` |
| `caso` | string | `bot` · `iot` |
| `start_ts` | ISO 8601 | Inicio de la etapa |
| `end_ts` | ISO 8601 | Fin de la etapa |
| `duracion_ms` | number | `end_ts - start_ts` |

#### Campos adicionales por etapa

| Etapa | Campos extra | Justificación |
|---|---|---|
| E1 | `errores: string[]`, `campos_validados: string[]` | Diagnóstico de fallas de validación sin exponer valores sensibles |
| E2 | `resultado_clave: string`, `regla_aplicada: string` (R001, R002...) | Trazabilidad de qué regla decidió el resultado |
| E3 | `idempotency_key: string`, `registro_id: string`, `reintentos: number` | Verificación de idempotencia y eficiencia de retry |
| E4 | `notificacion_enviada: bool`, `canal: string`, `duracion_total_ms: number` | Métrica end-to-end del flujo completo |

### 8.3 Ejemplo de log JSON por etapa (caso IoT crítico)

```json
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E1_validacion","status":"ok","caso":"iot","errores":[],"campos_validados":["sensor_id","temperatura","humedad","co2"],"start_ts":"2026-05-18T14:30:25.123Z","end_ts":"2026-05-18T14:30:25.128Z","duracion_ms":5}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E2_dominio","status":"ok","caso":"iot","resultado_clave":"critico","regla_aplicada":"R003","start_ts":"2026-05-18T14:30:25.200Z","end_ts":"2026-05-18T14:30:25.212Z","duracion_ms":12}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E3_adaptador","status":"ok","caso":"iot","idempotency_key":"S42-20260518T143025","registro_id":"9287","reintentos":0,"start_ts":"2026-05-18T14:30:25.250Z","end_ts":"2026-05-18T14:30:25.295Z","duracion_ms":45}
{"run_id":"RUN-IOT-20260518T143025-a1b2c3","etapa":"E4_salida","status":"ok","caso":"iot","notificacion_enviada":true,"canal":"critico","duracion_total_ms":215,"duracion_ms":30}
```

### 8.4 Plantilla de implementación (nodo Code)

```javascript
const start_ts = new Date().toISOString();
const input = $input.first().json;
const run_id = input.run_id;

// --- lógica de la etapa ---
const resultado = clasificarNivel(input.temperatura, input.humedad, input.co2);
// ----------------------------

const end_ts = new Date().toISOString();
const logEvent = {
  run_id,
  etapa: 'E2_dominio',
  status: 'ok',
  caso: 'iot',
  resultado_clave: resultado.nivel,
  regla_aplicada: resultado.regla_id,   // R001, R002...
  start_ts, end_ts,
  duracion_ms: new Date(end_ts) - new Date(start_ts)
};
console.log(JSON.stringify(logEvent));

return [{ json: { ...input, ...resultado, logEvent } }];
```

### 8.5 Consultar los logs localmente

```powershell
# PowerShell — buscar fallos en los últimos logs
docker compose -f infraestructura/docker-compose.yml logs n8n | Select-String '"status":"fail"' | Select-Object -Last 20

# Filtrar por etapa específica
docker compose -f infraestructura/docker-compose.yml logs n8n | Select-String '"etapa":"E3_adaptador"'

# Buscar una ejecución específica por run_id
docker compose -f infraestructura/docker-compose.yml logs n8n | Select-String 'RUN-IOT-20260518T143025-a1b2c3'
```

```bash
# Bash — extraer solo las líneas JSON y calcular p95 de latencia E2
docker compose -f infraestructura/docker-compose.yml logs n8n \
  | grep '"etapa":"E2_dominio"' \
  | jq -r '.duracion_ms' \
  | sort -n \
  | awk 'BEGIN{c=0} {a[c++]=$1} END{print a[int(c*0.95)]}'
```

### 8.6 Prohibiciones críticas

- **No loguear** valores de `token`, `password`, `api_key`. Solo nombres de campos.
- **No loguear** payloads completos si contienen PII. Loguear `campos_validados: ["nombre","email"]`, no sus valores.
- **No usar** `console.error` ni `console.warn`. El formato único es `console.log` con JSON.

### 8.7 Riesgo abierto: persistencia local (R-GLOBAL-01)

En Docker Compose, los logs de stdout se conservan según la política del log driver (por defecto, archivos rotativos del daemon Docker). Si el contenedor se recrea, los logs anteriores se pierden a menos que:

- Se mapee `/var/lib/docker/containers/<id>/<id>-json.log` a un volumen persistente, o
- Se use un driver externo (`fluentd`, `gelf`, `awslogs`).

**Solución estructural:** desplegar en AWS con `awslogs` log driver → CloudWatch Logs persiste 30 días (Cap. 11).

### 8.8 Mini-protocolo MTTD

Para validar que tu observabilidad funciona:

1. Forzar un fallo: enviar un payload inválido al webhook.
2. Cronometrar desde la respuesta HTTP 422 hasta que aparezca el log `"status":"fail"` en `docker logs`.
3. Cronometrar desde ese log hasta que un operador pueda identificar el nodo que falló (debe ser < 60 s).

Protocolo completo en `docs/protocolo-mttd.md`.

### 8.9 Métricas derivables del log JSON

| Métrica | Fórmula |
|---|---|
| Latencia por tramo | `duracion_ms` por etapa |
| Latencia end-to-end | `duracion_total_ms` del log E4 |
| Tasa de fallo | `count(status=fail) / count(total)` |
| Eficiencia de retry | `sum(reintentos) / count(E3)` |
| Cobertura run_id | `count(eventos con run_id) / count(total)` — debe ser 100 % (REG-002) |

---

## 9. Catálogo de antipatrones

Estos 11 antipatrones están presentes intencionalmente en los flujos as-is del proyecto como línea base. El micro-framework existe para eliminarlos.

### 9.1 Tabla completa

| Antipatrón | Síntoma rápido | Regla que lo corrige |
|---|---|---|
| Flujo monolítico | Sin nodos `Execute Workflow`; toda la lógica en un solo workflow | Metamodelo E1–E4 |
| Credenciales en nodos | API keys o tokens como valor literal en `parameters` | REG-001 |
| Validación ausente | Procesar payload sin verificar campos obligatorios ni tipos | E1 obligatorio |
| Lógica en adaptadores | Reglas de negocio dentro de nodos HTTP o Postgres | REG-007, REG-008 |
| Sin idempotencia | INSERT sin `ON CONFLICT`; reintentos duplican registros | REG-005 |
| Sin log estructurado | Solo el historial de n8n como diagnóstico | REG-006 |
| Sin flujo de error | `settings.errorWorkflow` vacío; fallos invisibles | REG-003 |
| Acoplamiento por ID hardcodeado | `Execute Workflow` referencia ID numérico que cambia al re-importar | Documentar IDs post-import; actualizar en UI |
| Chatty integration | > 2 llamadas HTTP al mismo endpoint por ejecución | REG-004 + API batch |
| Exception swallowing | `try/catch` sin re-throw ni log; el error es invisible | REG-003 + REG-006 |
| God node | Nodo Code > 100 líneas que mezcla validación, dominio y formato | Dividir en nodos por etapa |

### 9.2 Cómo detectarlos en una revisión de pares — 5 señales rápidas

1. **¿Hay `Execute Workflow` en el orquestador?** Si no, probablemente sea monolítico.
2. **Buscar en el JSON:** `Bearer`, `api_key`, `password`, `token`. Si hay valor literal, es REG-001 violada.
3. **¿`settings.errorWorkflow` está vacío?** REG-003 violada.
4. **¿Los nodos Code tienen `console.log(JSON.stringify(...))`?** Si no, REG-006 violada.
5. **¿Los queries SQL tienen `ON CONFLICT`?** Si no, REG-005 violada.

Para profundidad sobre cada antipatrón con ejemplos del as-is real del proyecto, ver `microframework/antipatrones.md`.

---

## 10. Checklist final aplicable

Esta sección consolida los checklists para que puedas imprimirlos o copiarlos como template antes de versionar un flujo to-be.

### 10.1 Checklist de Arquitectura (10 REGs)

```
Caso: _______________  Versión: _______________  Fecha: __________  Responsable: __________

[ ] REG-001: JSON exportado sin credenciales hardcodeadas
             → Buscar: token, api_key, password, Bearer, secret — ninguno con valor literal

[ ] REG-002: run_id presente en output de todos los subflujos
             → Verificar el campo run_id en el JSON de salida de cada subflujo

[ ] REG-003: errorWorkflow configurado en settings del orquestador
             → settings.errorWorkflow del JSON no está vacío ni null

[ ] REG-004: retry habilitado en todos los nodos HTTP Request
             → options.retry.enabled: true en cada nodo HTTP de E3/E4

[ ] REG-005: escrituras con control de idempotencia
             → Query SQL incluye ON CONFLICT (idempotency_key) DO NOTHING

[ ] REG-006: log estructurado JSON en cada etapa
             → Cada nodo Code incluye console.log(JSON.stringify({run_id, etapa, status, ...}))

[ ] REG-007: E2 sin nodos HTTP ni de base de datos
             → El subflujo E2 solo contiene nodos Code y Execute Workflow Trigger

[ ] REG-008: integraciones solo en E3 y E4
             → Nodos HTTP Request y Postgres únicamente en subflujos E3 y E4

[ ] REG-009: status codes HTTP apropiados en respuestas
             → 200 éxito, 400/422 entrada inválida, 401 sin autenticación

[ ] REG-010: al menos un ADR documentado en carpeta adr/
             → casos-de-estudio/{caso}/adr/ contiene al menos ADR-001-*.md
```

### 10.2 Checklist DevSecOps (8 ítems)

```
[ ] No hay API keys, tokens ni passwords en el JSON del flujo
[ ] No hay datos sensibles en los campos de log
[ ] Las credenciales de integraciones externas están creadas en n8n Credentials
[ ] El archivo .env real no está trackeado en Git
[ ] El .env.example está actualizado con todas las variables necesarias
[ ] El webhook valida autenticación antes de procesar datos
[ ] Los endpoints de integración usan HTTPS en entornos productivos
[ ] El flujo de error no expone detalles internos al cliente
```

### 10.3 Quick Quality Check (5 ítems pre-merge)

Versión exprés para revisión rápida en pull requests:

```
[ ] El nombre del flujo sigue {caso}-{estado}.json
[ ] El JSON exportado fue actualizado (timestamps coherentes con el commit)
[ ] El validador estático pasa: node microframework/validacion/validar-flujos.mjs
[ ] Hay al menos un nuevo entry en run-log o cr-log si la corrida es relevante
[ ] El commit referencia un issue/ADR (ej. "[FASE-N] feat: ... (#issue)")
```

### 10.4 Comando único de validación

```bash
node microframework/validacion/validar-flujos.mjs
```

El script verifica REG-001…010 sobre todos los JSONs de flujo en el repositorio y produce un reporte en `microframework/validacion/reportes/validacion-YYYY-MM-DD.md`.

### 10.5 Cómo interpretar el reporte

Ejemplo de salida:

```
=== Reporte de Validación ===
Fecha: 2026-05-06
Archivos analizados: 22

✅ iot-to-be-orquestador.json — 10/10 REGs cumplidas
✅ iot-to-be-e1-validacion.json — 10/10
✅ bot-to-be-orquestador.json — 10/10
❌ bot-as-is.json — 1/10 (esperado: as-is es la línea base con antipatrones)
   ✗ REG-001: credencial hardcodeada en nodo "HTTP Request" línea 142
   ✗ REG-003: settings.errorWorkflow vacío
   ✗ REG-004: nodo HTTP Request sin retry
   ✗ REG-005: INSERT sin ON CONFLICT
   ... (5 más)
```

**Criterio de aprobación:** todos los flujos `to-be` deben dar 10/10. Los `as-is` deben fallar (son la línea base).

---

## 11. Escalando del laboratorio a producción AWS

> **Documento de referencia:** `docs/aws/INDEX.md` y los 6 documentos completos de Fase 8.
> Este capítulo es un **puente conceptual**: muestra cómo cada elemento del entorno local se traduce a AWS sin duplicar el contenido detallado.

### 11.1 Cuándo necesitas escalar

| Síntoma | Solución AWS |
|---|---|
| Un workflow pesado bloquea la recepción de webhooks | Queue Mode (separar main de workers) |
| Necesitas alta disponibilidad de la BD | RDS Multi-AZ con failover < 60 s |
| Los logs se pierden al reiniciar el contenedor | CloudWatch Logs con retención 30 días |
| Necesitas rotación automática de credenciales | Secrets Manager con rotation Lambda |
| Requisitos de compliance (PCI, SOC 2, ISO 27001) | WAF, KMS, CloudTrail, IAM least-privilege |
| Tráfico variable que justifica auto-scaling | ECS Fargate con auto-scaling 2–8 workers |

### 11.2 Mapeo local → AWS

| Componente local | Servicio AWS | Notas |
|---|---|---|
| n8n (Docker `:5678`) | **ECS Fargate** + **ALB** (HTTPS via ACM) | Imagen `n8nio/n8n` sin cambios |
| PostgreSQL (Docker `:5432`) | **RDS PostgreSQL Multi-AZ** | Mismo schema (`lecturas_sensor`, `interacciones_bot`) |
| mock-bot / mock-iot | ECS Fargate (Dev/Staging) · Lambda (Prod) | Reemplazables por APIs reales |
| Sin Redis local | **ElastiCache Redis** (BullMQ queue) | Habilita Queue Mode (workers separados) |
| `.env` con credenciales | **AWS Secrets Manager** + ECS Secrets injection | Rotación automática 30 días |
| stdout JSON logs | **CloudWatch Logs** + Log Insights | Mismo formato JSON, ahora persistente |
| Rate limiter en memoria | ElastiCache Redis (clave distribuida) | Resuelve antipatrón rate-limit no distribuido |
| Sin certificado | **ACM** (renovación automática) | Validación DNS via Route 53 |

### 11.3 Cómo se preserva cada REG en AWS

| REG | Implementación local | Implementación AWS |
|---|---|---|
| REG-001 (secretos) | `.env` + n8n Credentials | Secrets Manager + IAM Task Role |
| REG-002 (run_id) | Generado en E1 (sin cambios) | Sin cambios — viaja en el payload de BullMQ |
| REG-003 (errorWorkflow) | Configurado en settings de n8n | CloudWatch Alarm independiente → SNS (mitiga SP-IOT-01) |
| REG-004 (retry) | `options.retry` en nodo HTTP | Igual + BullMQ retry de jobs stalled |
| REG-005 (idempotencia) | `ON CONFLICT` en PostgreSQL local | RDS Multi-AZ preserva schema; failover no pierde idempotencia |
| REG-006 (logs JSON) | stdout efímero | CloudWatch Logs persistente (resuelve R-GLOBAL-01) |
| REG-007/008 (separación) | Sin cambios | Sin cambios — la estructura E1–E4 es del flujo, no del entorno |
| REG-009 (HTTP codes) | Sin cambios | Sin cambios |
| REG-010 (ADRs) | Sin cambios | Sin cambios — 3 ADRs AWS adicionales (MF-005, 006, 007) |

### 11.4 Patrón arquitectónico central

**ECS Fargate + n8n Queue Mode + RDS Multi-AZ.** Los componentes principales:

- **n8n-main** (1–2 instancias): UI, API REST, recepción de webhooks, encolado en Redis.
- **n8n-workers** (2–8 instancias con auto-scaling): consumen jobs de Redis y ejecutan E1–E4.
- **ElastiCache Redis**: cola BullMQ — único habilitador de escalado horizontal de n8n.
- **RDS PostgreSQL Multi-AZ**: failover automático < 60 s, SLA 99.95 %.

Ver el diagrama de contenedores C4 en `docs/aws/arquitectura-aws.md §2` y el sequence diagram del flujo Queue Mode en `docs/aws/escalabilidad.md §1`.

### 11.5 Costos referenciales por tier

| Tier | Uso típico | Costo estimado/mes (us-east-1) |
|---|---|---|
| **Dev** | Desarrollo individual, 8 h/día | ~$33 |
| **Staging** | QA 24/7, sin Multi-AZ | ~$208 |
| **Producción** | HA Multi-AZ, workers auto-scaling 2–8, WAF | ~$458 (optimizable a ~$346 con Fargate Spot + Reserved RDS) |

Detalle completo en `docs/aws/estimacion-costos.md`.

### 11.6 Riesgos ATAM resueltos por el diseño AWS

| Riesgo Fase 7 | Resolución AWS |
|---|---|
| R-GLOBAL-01 — Logs efímeros | ✅ CloudWatch Logs (retención 30 días) |
| R-BOT-01 — Rotación de tokens manual | ✅ Secrets Manager rotation Lambda |
| R-IOT-01 — Dead-letter bloqueado si canal caído | ✅ CloudWatch Alarm → SNS (canal alterno) |
| SP-IOT-01 — Error handler usa mismo canal que E4 | ✅ Alarm SNS independiente del canal E4 |

### 11.7 Decisiones documentadas

Tres ADRs framework-level justifican el diseño AWS:

- **`ADR-MF-005-ecs-fargate-vs-ec2.md`** — Por qué Fargate y no EC2 ni EKS.
- **`ADR-MF-006-n8n-queue-mode.md`** — Por qué Queue Mode con Redis.
- **`ADR-MF-007-rds-multi-az.md`** — Por qué Multi-AZ en Producción.

Para el diseño completo (VPC, IAM, observabilidad, escalabilidad, costos), ver el índice en `docs/aws/INDEX.md`.

---

## 12. Trazabilidad y madurez

### 12.1 Cómo se conecta todo

El proyecto trazó una cadena explícita desde requisitos hasta evaluación:

```
Requisito Funcional (RF)
       │
       ▼
ADR (Decisión arquitectónica)
       │
       ▼
REG-001…010  (Regla con criterio binario)
       │
       ▼
Atributo ISO/IEC 25010
       │
       ▼
Escenario ATAM (medible)
       │
       ▼
Evidencia (run-log / cr-log / análisis)
```

Esta matriz vive en `casos-de-estudio/{bot,iot}/trazabilidad/matriz-trazabilidad.md` (v1.3). Cada RF tiene un ADR que lo decide, un REG que lo verifica, un atributo ISO 25010 que lo clasifica, un escenario ATAM que lo prueba y una evidencia cuantitativa que lo respalda.

### 12.2 Modelo de madurez de adopción

Adoptar el micro-framework de golpe es desalentador. Este modelo de 5 niveles permite avanzar incrementalmente. Cada nivel es un objetivo concreto verificable.

| Nivel | Nombre | REGs cumplidas | Esfuerzo típico |
|---|---|---|---|
| **0** | Ad-hoc | 0–2 | Estado inicial (típico as-is) |
| **1** | Higiene mínima | REG-001 + REG-006 | 1–2 sprints |
| **2** | Resiliencia básica | + REG-003 + E1 validación | 1 sprint |
| **3** | Resiliencia completa | + REG-004 + REG-005 + REG-007 | 2 sprints |
| **4** | Verificación automatizada | + REG-002 + REG-008 + REG-009 + REG-010 + validador en CI | 1 sprint |
| **5** | Producción AWS | Todo lo anterior + observabilidad centralizada + auto-scaling | Fase 8 completa |

#### Detalle por nivel

- **Nivel 0 — Ad-hoc:** flujo monolítico, credenciales en nodos, sin logs útiles. Es donde están la mayoría de los flujos LC/NC del mundo.
- **Nivel 1 — Higiene mínima:** los dos cambios con mayor ROI: (1) mover credenciales a n8n Credentials y (2) emitir logs JSON estructurados. Solo con esto recuperas observabilidad y eliminas el riesgo de exposición de secretos.
- **Nivel 2 — Resiliencia básica:** agregar E1 con validación formal y configurar errorWorkflow. Convierte el "falla silenciosamente" en "falla con diagnóstico".
- **Nivel 3 — Resiliencia completa:** retry e idempotencia en E3, aislamiento del dominio en E2. Tu flujo sobrevive a reintentos y a cambios de proveedor externo sin tocar reglas de negocio.
- **Nivel 4 — Verificación automatizada:** REG-010 (ADRs), validador en CI, checklist en pull requests. La calidad deja de depender de la disciplina individual.
- **Nivel 5 — Producción AWS:** despliegue con Queue Mode + RDS Multi-AZ + CloudWatch + Secrets Manager. Pasa de "funciona en mi máquina" a "soporta producción real".

### 12.3 Auto-evaluación

Para conocer tu nivel actual, responde estas preguntas sobre uno de tus flujos representativos:

1. ¿El JSON exportado tiene alguna credencial como valor literal? → Si sí, eres Nivel 0.
2. ¿Los nodos Code emiten `console.log(JSON.stringify({...}))` con `run_id` y `etapa`? → Si no, no superas Nivel 0.
3. ¿`settings.errorWorkflow` está configurado? → Si no, eres Nivel 1.
4. ¿Hay un nodo o subflujo dedicado a validación de entrada (E1) con HTTP 4xx en rechazos? → Si no, eres Nivel 1.
5. ¿Los HTTP Request tienen retry habilitado y los INSERT tienen `ON CONFLICT`? → Si no, eres Nivel 2.
6. ¿La lógica de negocio está aislada en un subflujo sin nodos HTTP/BD? → Si no, eres Nivel 2.
7. ¿Hay al menos un ADR documentado y el validador estático corre en CI? → Si no, eres Nivel 3.
8. ¿Estás en AWS con CloudWatch Logs y Secrets Manager? → Si no, eres Nivel 4.

Si respondiste "sí" a todas, eres Nivel 5.

### 12.4 Plan de avance recomendado

| Nivel actual | Próximo paso | Esfuerzo |
|---|---|---|
| 0 → 1 | Mover credenciales a n8n Credentials + agregar logs JSON | 1 sprint |
| 1 → 2 | Implementar E1 con validación + errorWorkflow | 1 sprint |
| 2 → 3 | Retry en HTTP + idempotencia en BD + aislar E2 | 2 sprints |
| 3 → 4 | Documentar 3 ADRs + integrar `validar-flujos.mjs` en CI | 1 sprint |
| 4 → 5 | Implementar diseño Fase 8 (ver `docs/aws/INDEX.md`) | 4 días |

---

## Apéndices

### A. Referencia rápida REG-001…010 + REC-001…006

#### Reglas obligatorias

| ID | Regla | ISO 25010 |
|---|---|---|
| REG-001 | Sin credenciales hardcodeadas | Seguridad / Confidencialidad |
| REG-002 | `run_id` propagado a todos los subflujos | Mantenibilidad / Analizabilidad |
| REG-003 | `errorWorkflow` configurado | Fiabilidad / Tolerancia a fallos |
| REG-004 | Retry habilitado en HTTP Request | Fiabilidad / Recuperabilidad |
| REG-005 | Idempotencia en escrituras (`ON CONFLICT`) | Fiabilidad / Madurez |
| REG-006 | Log JSON estructurado por etapa | Operabilidad / Monitoreabilidad |
| REG-007 | E2 sin nodos HTTP/BD | Mantenibilidad / Modularidad |
| REG-008 | Integraciones solo en E3/E4 | Mantenibilidad / Modularidad |
| REG-009 | HTTP status codes apropiados | Adecuación funcional / Corrección |
| REG-010 | Al menos un ADR documentado | Mantenibilidad / Analizabilidad |

#### Reglas recomendadas

| ID | Regla | Beneficio |
|---|---|---|
| REC-001 | Normalizar datos en E1 | Reduce inconsistencias |
| REC-002 | Identificadores R001/R002 en reglas de E2 | Trazabilidad ATAM |
| REC-003 | Header `Idempotency-Key` en HTTP | Soporte end-to-end |
| REC-004 | `start_ts` / `end_ts` por etapa | Latencia por tramo |
| REC-005 | Contexto (sensor_id, location) en logs | Diagnóstico sin UI |
| REC-006 | `saveDataSuccessExecution: "all"` en evaluación | Historial completo |

### B. ADRs framework-level (resumen)

| ID | Decisión | Atributo |
|---|---|---|
| ADR-MF-001 | Credenciales en n8n Credentials, no en JSON | Seguridad |
| ADR-MF-002 | errorWorkflow obligatorio en todo orquestador | Fiabilidad |
| ADR-MF-003 | Log JSON estructurado por etapa | Operabilidad |
| ADR-MF-004 | ATAM adaptado individual asíncrono | Metodológico |
| ADR-MF-005 | ECS Fargate sobre EC2/EKS para AWS | Operabilidad / Costo |
| ADR-MF-006 | n8n Queue Mode con Redis BullMQ | Escalabilidad |
| ADR-MF-007 | RDS PostgreSQL Multi-AZ en Producción | Fiabilidad |

### C. Evidencia cuantitativa (resumen)

| Métrica | Bot as-is | Bot to-be | IoT as-is | IoT to-be |
|---|:---:|:---:|:---:|:---:|
| Nodos afectados por CR | 8.7 | 1.0 (−81 %) | 6.3 | 0.67 (−84 %) |
| Tasa de fallos | 9 % | 6 % (−36.6 %) | 0 %* | 1 % |
| Checklist arquitectura | 1/10 | 10/10 | 1/10 | 10/10 |
| Checklist DevSecOps | 0/8 | 8/8 | 0/7 | 7/7 |
| Cobertura ATAM | n/a | 5/6 (83 %) | n/a | 6/6 (100 %) |
| MTTD | n/a | ~14 s ✅ | n/a | estructural ✅ |

*IoT as-is 0 % fallos = no valida (antipatrón "validación ausente"). El to-be rechaza correctamente con HTTP 422.*

Fuentes: `medicion/consolidado/comparacion-2026-05-05.md`, `metricas-derivadas.md`, `atam-evidencia.md`.

### D. Recursos externos

- **n8n:** Documentación oficial — https://docs.n8n.io
- **n8n Queue Mode:** https://docs.n8n.io/hosting/scaling/queue-mode/
- **Clean Architecture:** Robert C. Martin (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Pearson.
- **ATAM:** Len Bass, Paul Clements & Rick Kazman (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley.
- **ISO/IEC 25010:2011:** Systems and software Quality Requirements and Evaluation (SQuaRE).
- **NIST SSDF:** Secure Software Development Framework (SP 800-218).
- **OWASP:** Top 10 Web Application Security Risks — https://owasp.org/Top10/
- **C4 Model:** Simon Brown (2018) — https://c4model.com
- **AWS Well-Architected Framework:** https://docs.aws.amazon.com/wellarchitected/

### E. Mapa de archivos del repositorio — qué leer cuándo

| Necesitas... | Lee |
|---|---|
| Visión general del proyecto | `docs/context/proyecto-overview.md` |
| Arquitectura de los flujos as-is y to-be | `docs/context/arquitectura-flujos.md` |
| Especificación formal del metamodelo E1–E4 | `docs/context/microframework-spec.md` |
| Fundamento teórico (Clean Architecture, NIST, LC/NC) | `docs/context/fundamento-teorico.md` |
| Documento R1 consolidado del micro-framework | `docs/microframework-v1.0.md` |
| Detalle de cada regla | `microframework/reglas/reglas-obligatorias.md` |
| Profundidad de cada patrón | `microframework/patrones/patron-*.md` |
| Contrato del log JSON por etapa | `microframework/guia-observabilidad.md` |
| Protocolo MTTD reproducible | `docs/protocolo-mttd.md` |
| Diseño AWS completo (R3) | `docs/aws/INDEX.md` |
| Informe ATAM final (R4) | `docs/atam/informe-atam-final.md` |
| Esta guía (R5) | `docs/guia-buenas-practicas.md` |
| Estado actual del proyecto | `estado-actual.md` |
| Convenciones de archivos y commits | `docs/context/convenios-y-reglas.md` |

---

## Cierre

El micro-framework no es un dogma: es una propuesta validada con evidencia cuantitativa. Si la regla no aporta valor en tu contexto, documenta por qué (ADR) y sigue adelante. Lo que sí es innegociable son los tres principios que sostienen todas las REGs:

1. **Aislar las responsabilidades** (Clean Architecture en LC/NC).
2. **Hacer visibles los fallos** (logs estructurados + error workflow).
3. **Tratar los secretos como secretos** (Credentials, no literales).

Si solo te llevas tres reglas de esta guía, llévate REG-001, REG-003 y REG-006. Con ellas alcanzas el Nivel 1 de madurez y eliminas la mitad de los riesgos operacionales típicos de un flujo n8n ad-hoc.

El resto del camino — hasta Nivel 5 y producción AWS — está documentado paso a paso en este repositorio.

---

**Fin de la Guía de Buenas Prácticas v1.0**
