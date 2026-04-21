# Convenciones y reglas de trabajo

Este archivo define las reglas que Claude Code debe seguir al trabajar en el repositorio. Leer completo antes de hacer cualquier modificación.

---

## Convenciones de nombres

### Archivos de flujos n8n (JSON)

```
{caso}-{estado}.json                    # flujo principal
{caso}-{estado}-{etapa}.json            # subflujo

Ejemplos:
bot-as-is.json
bot-to-be-orquestador.json
bot-to-be-e2-dominio.json
iot-as-is.json
iot-to-be-orquestador.json
iot-to-be-e1-validacion.json
iot-to-be-e3-persistencia.json
```

### Nodos dentro de los flujos n8n

Los nodos siguen el patrón: `{Etapa} - {Descripción acción}`

```
E1 - Validacion de entrada
E2 - Reglas de negocio
E3 - Preparar payload adaptador
E3 - Log salida adaptador
E4 - Notificar canal CRITICO
IF - Entrada valida?
IF - Nivel critico?
Webhook - Entrada
Respond - OK (200)
Respond - Entrada invalida (400)
```

### Subflujos (IDs en n8n)

```
bot-e2-dominio
bot-e3-adaptador
iot-e1-validacion
iot-e2-dominio
iot-e3-persistencia
iot-e4-notificacion
```

### ADR (Architecture Decision Records)

```
ADR-{NNN}-{descripcion-kebab-case}.md

Ejemplos:
ADR-001-orquestacion-centralizada.md
ADR-002-gestion-secretos.md
ADR-003-idempotencia-ingesta.md
```

### Run Logs (CSV)

```
run-log-{caso}-{estado}.csv

Ejemplos:
run-log-bot-as-is.csv
run-log-bot-to-be.csv
run-log-iot-as-is.csv
run-log-iot-to-be.csv
```

### CR Logs (CSV)

```
cr-log-{caso}-{estado}.csv

Ejemplos:
cr-log-bot-as-is.csv
cr-log-bot-to-be.csv
```

### Datasets sintéticos

```
input-set-{letra}.json

Ejemplos:
medicion/datasets/bot/input-set-A.json
medicion/datasets/iot/input-set-B.json
```

### Commits

El formato de commit es:

```
[FASE-N] tipo: descripcion breve en minúsculas

Tipos válidos:
feat     → nuevo artefacto o funcionalidad
fix      → corrección de un flujo o documento
docs     → cambio en documentación
measure  → registro de medición o log
adr      → nuevo ADR o modificación
refactor → reestructuración sin cambio funcional
chore    → tareas de configuración o mantenimiento

Ejemplos:
[FASE-2] feat: agregar flujo as-is bot con nodo de validación token
[FASE-3] docs: documentar reglas obligatorias micro-framework v1.0
[FASE-4] adr: registrar decisión de orquestación centralizada bot
[FASE-6] measure: run-log bot as-is input-set-A 10 corridas
```

---

## Estructura de archivos — Detalle por carpeta

### `casos-de-estudio/{caso}/as-is/`

```
flujo-{caso}-as-is.json       ← Export de n8n versionado (nunca comprimir)
diagrama-as-is.drawio         ← Diagrama editable
diagrama-as-is.png            ← Imagen exportada del diagrama
notas-tecnicas.md             ← Estructura del flujo, nodos, puntos críticos, hallazgos
```

### `casos-de-estudio/{caso}/to-be/`

```
flujo-{caso}-to-be-orquestador.json
flujo-{caso}-to-be-e1-{nombre}.json    ← un archivo por subflujo
flujo-{caso}-to-be-e2-{nombre}.json
flujo-{caso}-to-be-e3-{nombre}.json
flujo-{caso}-to-be-e4-{nombre}.json    ← solo si aplica (IoT)
diagrama-to-be.drawio
diagrama-to-be.png
notas-tecnicas.md
```

### `casos-de-estudio/{caso}/adr/`

```
ADR-001-{nombre}.md
ADR-002-{nombre}.md
...
```

Cada ADR sigue esta plantilla:

```markdown
# ADR-{NNN}: {Título de la decisión}

**Estado:** Propuesto | Aceptado | Reemplazado por ADR-XXX  
**Fecha:** YYYY-MM-DD  
**Caso:** bot | iot  
**Atributo de calidad afectado:** Mantenibilidad | Seguridad | Confiabilidad | Trazabilidad

## Contexto

{Descripción del problema o situación que requiere la decisión}

## Decisión

{Descripción de la decisión tomada}

## Alternativas consideradas

- {Alternativa 1}: {por qué se descartó}
- {Alternativa 2}: {por qué se descartó}

## Consecuencias

**Positivas:**
- {consecuencia positiva}

**Negativas / trade-offs:**
- {consecuencia negativa o trade-off}

## Relación con el micro-framework

{Qué regla o patrón del micro-framework sustenta esta decisión}
```

### `medicion/run-logs/{caso}/`

Los Run Logs son CSV con estas columnas exactas:

```csv
run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash
RUN-BOT-001,bot,as-is,A,2026-06-08T10:00:00Z,2026-06-08T10:00:02Z,success,,Corrida normal,a1b2c3d
RUN-BOT-002,bot,as-is,C,2026-06-08T10:01:00Z,2026-06-08T10:01:01Z,fail,validation,Token ausente en input-set-C,a1b2c3d
```

Valores válidos para `error_type`: `validation`, `integration`, `logic`, `timeout`, `unknown`, vacío si status=success.

### `medicion/cr-logs/{caso}/`

Los CR Logs son CSV con estas columnas exactas:

```csv
cr_id,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash
CR1,bot,as-is,2026-06-22T09:00:00Z,2026-06-22T09:45:00Z,8,2,3,b2c3d4e
CR1,bot,to-be,2026-06-29T09:00:00Z,2026-06-29T09:20:00Z,2,0,1,c3d4e5f
```

---

## Reglas críticas de seguridad

### Lo que NUNCA debe estar en el repositorio

- El archivo `.env` con valores reales
- Tokens de API reales de cualquier servicio
- Passwords de base de datos reales
- Cualquier dato personal o sensible de usuarios reales
- Credenciales de cuentas de AWS, GitHub, o cualquier servicio

### El archivo `.env.example`

El `.env.example` en `infraestructura/` documenta todas las variables necesarias con valores de ejemplo o placeholder:

```env
# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme
N8N_ENCRYPTION_KEY=changeme-32-chars-minimum

# PostgreSQL
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=changeme
POSTGRES_DB=sensores_db

# Servicios mock
MOCK_TICKETS_API_PORT=3001
MOCK_NOTIFICACIONES_API_PORT=3002
```

### El `.gitignore` debe incluir

```gitignore
infraestructura/.env
.env
*.env
n8n_data/
__pycache__/
node_modules/
*.log
```

---

## Reglas para modificar flujos n8n

1. **Antes de modificar:** Exportar el flujo actual desde n8n UI y guardarlo en la carpeta correspondiente con el nombre correcto.

2. **Después de modificar:** Exportar el flujo actualizado, reemplazar el archivo en el repositorio, y hacer commit con el formato correcto.

3. **Verificar antes de hacer commit:** Aplicar el checklist de arquitectura (si es to-be) o confirmar que el as-is mantiene intencionalmente sus antipatrones documentados.

4. **Nunca:** Modificar el JSON del flujo directamente con un editor de texto sin haber probado que funciona en n8n primero.

5. **Siempre:** Cuando se añade un nodo nuevo al to-be, verificar que la regla REG-001 (sin credenciales hardcodeadas) se sigue cumpliendo.

---

## Reglas para los datasets sintéticos

Los archivos en `medicion/datasets/` son inmutables durante la fase de medición. Cualquier modificación invalida la comparabilidad de las métricas.

Si es necesario modificar un dataset:
1. Crear un nuevo archivo con sufijo de versión: `input-set-A-v2.json`
2. Documentar el cambio en `docs/protocolo-evidencias.md`
3. Indicar a partir de qué corrida se usa el nuevo dataset

---

## Reglas para los logs de medición

Los archivos CSV de run-logs y cr-logs son evidencia del estudio. Una vez que una corrida es registrada, nunca se borra ni modifica. Si hay un error en el registro:
1. Agregar una nueva fila con los datos correctos
2. Marcar la fila incorrecta con `status: invalid` y una nota en el campo `notes`

---

## Infraestructura local — Servicios Docker

El archivo `infraestructura/docker-compose.yml` levanta todos los servicios necesarios. Para iniciar el entorno:

```bash
cd infraestructura
cp .env.example .env
# Editar .env con los valores correctos
docker compose up -d
```

Después de levantar los servicios, crear la tabla en PostgreSQL:

```bash
docker compose exec postgres psql -U n8n_user -d sensores_db -c "
CREATE TABLE IF NOT EXISTS lecturas_sensor (
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
);"
```

### Orden de importación de flujos en n8n

Importar siempre subflujos antes del orquestador. Después de importar, actualizar las referencias de ID en el orquestador usando el selector de workflows del nodo Execute Workflow.

**Caso Bot:**
1. `bot-to-be-e2-dominio.json`
2. `bot-to-be-e3-adaptador.json`
3. `bot-to-be-orquestador.json`
4. `bot-as-is.json`

**Caso IoT:**
1. `iot-to-be-e1-validacion.json`
2. `iot-to-be-e2-dominio.json`
3. `iot-to-be-e3-persistencia.json`
4. `iot-to-be-e4-notificacion.json`
5. `iot-to-be-orquestador.json`
6. `iot-as-is.json`

---

## Formato de run_id (v2)

```
{caso}-{version_sin_guión}-{set}-{index:04d}-{seed_hash[:7]}
```

Ejemplos:
- `bot-asis-F-0042-2026042` (corrida 42 del set F, as-is)
- `iot-tobe-K-0199-2026042` (corrida 199 del set K, to-be)

---

## Taxonomía de input sets (A–K)

| Sets | Tipo | Descripción |
|------|------|-------------|
| A–E | Estáticos | Conformidad técnica canónica (un payload repetido N veces) |
| F | Dinámico | Tráfico normal variable dentro de rangos industriales |
| G | Dinámico | Mezcla industrial 70/15/10/5 |
| H | Reservado | Spike de concurrencia (cubierto por JMeter) |
| I | Dinámico | Degradación gradual: valores normales → críticos |
| J | Dinámico | Percentiles extremos p1/p99 |
| K | Dinámico | Duplicados con mismo idempotency_key (mide REG-005) |

---

## GitHub Issues y fases

El proyecto usa GitHub Issues con un Issue por fase. Cada Issue tiene un checklist de tareas. Cuando se completa una tarea:
1. Marcar el ítem en el Issue
2. Referenciar el commit en el comentario del Issue: `Completado en {commit-hash}`

Los labels disponibles son: `fase`, `en-progreso`, `bloqueado`.

El proyecto en GitHub Projects tiene vista Board (Kanban) y vista Table. Usar el Board para el estado general y la Table para ver fechas y prioridades.
