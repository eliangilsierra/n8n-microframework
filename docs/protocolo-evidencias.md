# Protocolo de evidencias v1.0

Procedimientos operativos para levantar el entorno, importar flujos y registrar mediciones.
Este documento es la referencia para reproducir el entorno de evaluación desde cero.

**Fecha:** 2026-04-07

---

## 1. Levantar el entorno local

### Prerrequisitos
- Docker Desktop instalado y en ejecución
- Git con el repositorio clonado

### Pasos

```bash
cd infraestructura
cp .env.example .env
```

Editar `.env` y reemplazar todos los valores `changeme`:
- `POSTGRES_PASSWORD` — password para PostgreSQL
- `N8N_BASIC_AUTH_PASSWORD` — password de acceso a n8n
- `N8N_ENCRYPTION_KEY` — clave de 32+ caracteres (generar con `openssl rand -hex 32`)

```bash
docker compose up -d
```

Verificar que ambos servicios estén en estado `healthy`:

```bash
docker compose ps
```

Esperar hasta que el estado de `n8n_postgres` sea `healthy` (puede tardar 10-30 segundos).

### Verificación
- PostgreSQL: `docker compose exec postgres pg_isready -U n8n_user -d sensores_db`
- n8n: Abrir `http://localhost:5678` en el navegador → debe solicitar usuario y password

---

## 2. Crear tabla en PostgreSQL

Ejecutar una única vez después de levantar el entorno:

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

Verificar que la tabla fue creada:

```bash
docker compose exec postgres psql -U n8n_user -d sensores_db -c "\d lecturas_sensor"
```

---

## 3. Importar flujos en n8n

### Orden obligatorio

Siempre importar subflujos **antes** que el orquestador. El orquestador necesita los IDs
de los subflujos para configurar los nodos Execute Workflow.

**Caso Bot (orden de import):**
1. `microframework/plantillas/bot-to-be-e2-dominio.json`
2. `microframework/plantillas/bot-to-be-e3-adaptador.json`
3. `microframework/plantillas/bot-to-be-orquestador.json`
4. `microframework/plantillas/bot-as-is.json`

**Caso IoT (orden de import):**
1. `microframework/plantillas/iot-to-be-e1-validacion.json`
2. `microframework/plantillas/iot-to-be-e2-dominio.json`
3. `microframework/plantillas/iot-to-be-e3-persistencia.json`
4. `microframework/plantillas/iot-to-be-e4-notificacion.json`
5. `microframework/plantillas/iot-to-be-orquestador.json`
6. `microframework/plantillas/iot-as-is.json`

### Procedimiento de import en n8n UI

1. Abrir `http://localhost:5678`
2. Ir a **Workflows** → **Import from file**
3. Seleccionar el archivo JSON en el orden indicado arriba
4. Confirmar el import y anotar el **ID numérico** asignado por n8n

### Capturar IDs post-import

Después de importar cada subflujo, registrar el ID asignado por n8n:

| Subflujo | Nombre en n8n | ID asignado |
|---------|---------------|-------------|
| bot-to-be-e2-dominio | BOT-TO-BE - E2 Logica de dominio | _____________ |
| bot-to-be-e3-adaptador | BOT-TO-BE - E3 Adaptador de persistencia | _____________ |
| iot-to-be-e1-validacion | IOT-TO-BE - E1 Validacion de entrada | _____________ |
| iot-to-be-e2-dominio | IOT-TO-BE - E2 Dominio y analisis de umbrales | _____________ |
| iot-to-be-e3-persistencia | IOT-TO-BE - E3 Adaptador de persistencia | _____________ |
| iot-to-be-e4-notificacion | IOT-TO-BE - E4 Adaptador de notificacion | _____________ |

### Actualizar referencias en los orquestadores

Después de importar los subflujos:

1. Abrir el flujo orquestador (bot-to-be o iot-to-be) en n8n
2. Hacer clic en cada nodo **Execute Workflow**
3. En el campo **Workflow**, seleccionar el subflujo correcto usando el selector de workflows
4. Guardar el flujo
5. Exportar el flujo actualizado (con IDs reales) y copiarlo a `casos-de-estudio/{caso}/to-be/`

---

## 4. Ejecutar un Input Set

### Prerequisito
- Flujos importados y con referencias actualizadas
- Webhook activado (estado "Active" en n8n)

### Formato del request

**Bot:**
```bash
curl -X POST http://localhost:5678/webhook/bot-soporte-to-be \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/bot/input-set-A.json
```

**IoT:**
```bash
curl -X POST http://localhost:5678/webhook/iot-sensor-to-be \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-A.json
```

### Para as-is:
```bash
curl -X POST http://localhost:5678/webhook/bot-soporte \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/bot/input-set-A.json

curl -X POST http://localhost:5678/webhook/iot-sensor \
  -H "Content-Type: application/json" \
  -d @medicion/datasets/iot/input-set-A.json
```

---

## 5. Registrar una entrada en el run-log

Agregar una fila al CSV correspondiente después de cada corrida:

**Archivo:** `medicion/run-logs/{caso}/run-log-{caso}-{estado}.csv`

```
run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash

RUN-BOT-001,bot,as-is,A,2026-06-08T10:00:00Z,2026-06-08T10:00:02Z,success,,Corrida normal,a1b2c3d
RUN-BOT-002,bot,as-is,C,2026-06-08T10:01:00Z,2026-06-08T10:01:01Z,fail,validation,Token ausente,a1b2c3d
```

**Reglas de integridad:**
- Una vez registrada, una fila NUNCA se borra ni modifica
- Si hay error en el registro: agregar nueva fila correcta y marcar la incorrecta con `status: invalid`
- `commit_hash`: los primeros 7 caracteres del commit activo al momento de la corrida

**Nota sobre `run_id` en as-is vs to-be:**
El as-is genera el `run_id` en el harness de medición (`automatizacion/run_corridas.py`)
con formato simplificado `{caso}-{version}-{set}-{index}-{hash}` porque los flujos
as-is violan REG-002 (no propagan run_id internamente). En el to-be, el `run_id` se
genera en E1 siguiendo el formato de REG-002
(`RUN-{CASO}-{ISO8601}-{SUFFIX}`) y se propaga por todas las etapas hasta la respuesta
y la BD. El análisis comparativo en FASE 6 reconoce ambos formatos.

---

## 6. Registrar una entrada en el cr-log

Usar al ejecutar el protocolo de Cambio de Requisito (CR) durante FASE 6.

**Archivo:** `medicion/cr-logs/{caso}/cr-log-{caso}-{estado}.csv`

```
cr_id,cr_type,case,version,start_ts,end_ts,nodes_touched,deps_touched,attempts,commit_hash,notes

CR-BOT-001,CR1,bot,as-is,2026-04-21T10:15:00-05:00,2026-04-21T10:52:00-05:00,8,0,3,152fd2d,prioridad R002 media->alta
CR-BOT-001,CR1,bot,to-be,2026-06-29T09:00:00Z,2026-06-29T09:20:00Z,1,0,1,c3d4e5f,cambio en constante E2
```

**Campos:**
- `cr_id`: identificador único por fila (`CR-{CASO}-{NNN}`)
- `cr_type`: tipo funcional — `CR1` (negocio), `CR2` (integración), `CR3` (validación)
- `nodes_touched`: número de nodos modificados para implementar el cambio
- `deps_touched`: número de endpoints o tablas externas con contrato modificado
- `attempts`: número de iteraciones de edición+ejecución hasta verificación exitosa
- `notes`: texto libre — rationale breve, incidentes durante la edición, etc.

Los valores de as-is están pre-medidos en FASE 3 (ver `cr-design.md` por caso);
los de to-be se poblán en FASE 6.

---

## 7. Detener y reiniciar el entorno

```bash
# Detener sin borrar datos
docker compose stop

# Reiniciar
docker compose start

# Detener y borrar contenedores (los volúmenes se conservan)
docker compose down

# Borrar todo incluyendo datos (¡destructivo!)
docker compose down -v
```

**Nota:** `docker compose down -v` borra los datos de PostgreSQL y el state de n8n.
Solo usar si se quiere reiniciar el entorno desde cero.

---

## 8. Análisis y visualización de run-logs

### Propósito

`medicion/analizar_runlogs.py` genera un reporte HTML interactivo a partir de los CSVs
de run-logs. Detecta automáticamente qué archivos existen (as-is y/o to-be) y produce
un análisis estadístico completo con gráficos Plotly, tablas de conformidad y lista
de anomalías priorizadas.

### Dependencias

```bash
pip install pandas plotly scipy
```

### Ejecución

```bash
# Desde la raíz del repositorio
python medicion/analizar_runlogs.py

# Especificar carpeta de salida
python medicion/analizar_runlogs.py --output medicion/consolidado/
```

El reporte se guarda en `medicion/consolidado/reporte-runlogs.html`.
Abrir en cualquier navegador — no requiere servidor ni conexión local.

### Secciones del reporte

| # | Sección | Contenido |
|---|---------|-----------|
| 1 | Resumen ejecutivo | Tarjetas KPI: tasa de éxito global, latencia mediana, semáforo de conformidad |
| 2 | Distribución de resultados | Barras apiladas success/fail por input_set × version; pie charts por case |
| 3 | Análisis de latencia | Box plot y histograma de duration_ms; tabla p50/p95/p99 por set |
| 4 | Comparación as-is vs to-be | Δ success rate y Δ latencia p95; líneas p50/p95 por set; prueba Mann-Whitney U |
| 5 | Tipos de error | Barras apiladas de error_type solo en filas fail |
| 6 | Timeline | Scatter start_ts vs duration_ms coloreado por status — detecta outliers y pausas |
| 7 | Calidad de datos | Tabla de integridad (commit_hash, notes, N uniforme); lista de anomalías con severidad |

La Sección 4 solo aparece cuando existen datos de ambas versiones (as-is **y** to-be).

### Cuándo ejecutar

- **Al terminar cada sesión de medición** para validar integridad de los nuevos datos.
- **Antes de la comparación formal** (Fase 6) para confirmar que los datos son comparables.
- **Después de agregar datos to-be** para verificar la mejora y calcular los deltas.

### Lógica de conformidad

El script compara el `success_rate` observado contra el comportamiento esperado definido
en `automatizacion/run_corridas.py`. La tabla de referencia es:

| Caso | Versión | Set | Esperado | Justificación |
|------|---------|-----|----------|---------------|
| bot | as-is | A, B, D, E | 100% éxito | Sin validación (antipatrón REG-003) |
| bot | as-is | C | 100% fallo | Token ausente → HTTP 401 |
| bot | to-be | A, B | 100% éxito | Validación E1 pasa |
| bot | to-be | C, D, E | 100% fallo | E1 rechaza → HTTP 400 |
| iot | as-is | A, B, C, D, E | 100% éxito | Sin validación (antipatrón REG-003/004) |
| iot | to-be | A, B, D | 100% éxito | Validación E1 pasa |
| iot | to-be | C, E | 100% fallo | Campos faltantes → HTTP 422 |

---

## 9. Anomalía commit_hash="unknown" — Documentación metodológica

### Causa raíz

`automatizacion/run_corridas.py` obtiene el hash con:

```python
subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True)
```

El proceso se ejecutaba desde el directorio de trabajo del intérprete Python, que en
algunas sesiones no era el directorio raíz del repositorio sino un subdirectorio.
`git rev-parse HEAD` falla silenciosamente fuera de un repo y devuelve cadena vacía,
que el harness captura como `"unknown"`.

### Impacto en la validez de los datos

Los run-logs con `commit_hash="unknown"` corresponden a corridas as-is ejecutadas
el 2026-04-20/21. La validez de los datos **no se ve afectada**: el campo `commit_hash`
es un campo de auditoría para trazabilidad, no un campo de integridad de los datos
de medición. Los campos `run_id`, `status`, `error_type`, `start_ts`, `end_ts` son
generados por el propio harness desde la respuesta HTTP del webhook y son correctos.

### Asociación histórica

Para el análisis comparativo de FASE 6, los datos as-is con `commit_hash="unknown"`
se tratan como pertenecientes al commit **`152fd2d`**, que es el último commit
documentado antes de las corridas as-is (2026-04-20). Esta asociación se registra en
este protocolo como fuente de verdad y no requiere corrección retroactiva de los CSVs.

### Resolución para FASE 6

Las corridas to-be se ejecutarán con la corrección aplicada en `run_corridas.py`:

1. Pasar `cwd=REPO_ROOT` al `subprocess.run` para que git se ejecute desde la raíz.
2. Verificar `git status --porcelain` antes de cada sesión de medición para confirmar
   que el estado está limpio.
3. Documentar el commit hash activo en `estado-actual.md` antes de iniciar corridas.

**Corrección en el código:**

```python
import os
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_commit_hash():
    result = subprocess.run(
        ['git', 'rev-parse', '--short', 'HEAD'],
        capture_output=True, text=True, cwd=REPO_ROOT
    )
    return result.stdout.strip() if result.returncode == 0 else 'unknown'
```

---

## §9 Datasets dinámicos y semillas

### Propósito
Los sets F, G, I, J, K se generan pseudo-aleatoriamente con semilla fija para garantizar
reproducibilidad bit-a-bit entre ejecuciones y equidad as-is/to-be (mismo input, mismo orden).

### Archivos
- `medicion/datasets/seeds.yaml` — semillas versionadas (no modificar sin ADR)
- `medicion/datasets/generar_datasets.py` — generador determinístico
- `medicion/datasets/{bot,iot}/input-set-{F,G,I,J,K}.json` — datasets generados (commiteados)

### Comando de generación
```bash
cd D:\Git\n8n-microframework
pip install numpy
python medicion/datasets/generar_datasets.py
```

### Re-generación
Solo está permitida mediante ADR. Cambiar una semilla invalida la comparabilidad as-is/to-be
para ese set. El generador incluye verificación de hash SHA-256 para detectar drift.

### Taxonomía de sets
| Set | Tipo | N | Propósito |
|-----|------|---|-----------|
| A–E | Estático | 200 (repetición) | Conformidad técnica canónica |
| F | Dinámico | 200 únicos | Tráfico normal variable |
| G | Dinámico | 200 únicos | Mezcla industrial 70/15/10/5 |
| I | Dinámico | 200 únicos | Degradación gradual (normal→crítico) |
| J | Dinámico | 200 únicos | Percentiles extremos p1/p99 |
| K | Dinámico | 200 únicos | Duplicados con idempotency_key repetido |

---

## §10 Conformidad semántica

La conformidad se mide en dos niveles:

| Nivel | Qué mide | Fuente |
|-------|----------|--------|
| Técnica | HTTP status real = HTTP esperado | CSV run-log, columna `status` |
| Semántica | Atributo de calidad observado (idempotencia, nivel correcto, run_id presente) | Post-procesado + consulta SQL |

### Set K — verificación de idempotencia en PostgreSQL
Después de ejecutar el set K, ejecutar:
```sql
-- Bot
SELECT idempotency_key, COUNT(*) AS n FROM interacciones_bot
GROUP BY idempotency_key HAVING COUNT(*) > 1;

-- IoT
SELECT idempotency_key, COUNT(*) AS n FROM lecturas_sensor
GROUP BY idempotency_key HAVING COUNT(*) > 1;
```
- As-is esperado: 100 keys con n=2 (duplica todo)
- To-be esperado: 0 rows (ON CONFLICT DO NOTHING funciona)

---

## §11 Patrón de arribo entre requests

El delay se configura por set en `DELAY_STRATEGY` (ver `automatizacion/run_corridas.py`):

| Sets | Patrón | Valor |
|------|--------|-------|
| A, B, C, D, E, F, G, J, K | Fijo | 100 ms |
| I (degradación) | Decreciente lineal | 300 ms → 50 ms |

Fórmula set I: `delay_i = 0.300 - (0.250 × i / 199)`

Ver ADR-004 para la justificación completa.
