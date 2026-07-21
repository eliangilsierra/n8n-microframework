# Scripts Python del proyecto — Justificación, rol y alineación académica

**Documento:** Contexto de decisiones de ingeniería experimental
**Versión:** 1.0
**Fecha:** 2026-05-23
**Autor:** Elian Hernando Gil Sierra — MGADS UNAB 2026

---

## Tabla de contenidos

1. [Por qué Python: decisión tecnológica](#1-por-qué-python-decisión-tecnológica)
2. [Inventario de scripts y propósito de cada uno](#2-inventario-de-scripts-y-propósito-de-cada-uno)
3. [Rol en el diseño de investigación](#3-rol-en-el-diseño-de-investigación)
4. [Alineación con los objetivos específicos](#4-alineación-con-los-objetivos-específicos)
5. [Alineación con compromisos del anteproyecto](#5-alineación-con-compromisos-del-anteproyecto)
6. [Por qué no Node.js para estos scripts](#6-por-qué-no-nodejs-para-estos-scripts)
7. [Garantías de reproducibilidad](#7-garantías-de-reproducibilidad)
8. [Limitaciones reconocidas](#8-limitaciones-reconocidas)

---

## 1. Por qué Python: decisión tecnológica

El proyecto usa Python para todos los scripts de medición, análisis y generación de datos experimentales. Esta elección no es arbitraria ni es simplemente "familiaridad del autor": responde a tres características del problema de investigación.

### 1.1 El problema es de medición y análisis de datos, no de integración

Los scripts del proyecto ejecutan tres tipos de operaciones:

- **Orquestación controlada de pruebas:** enviar N peticiones HTTP a n8n con payloads conocidos, registrar tiempos y resultados con precisión de milisegundos.
- **Análisis estadístico de series de tiempo:** calcular percentiles (p50, p95, p99), comparar distribuciones entre as-is y to-be, detectar diferencias significativas.
- **Visualización de evidencia:** producir gráficos interactivos que permitan inspeccionar los datos de 8 000 corridas.

Para este tipo de trabajo, el ecosistema Python (NumPy, pandas, SciPy, Plotly) es el estándar de facto en investigación aplicada y no tiene equivalente maduro en otros entornos de scripting.

### 1.2 Reproducibilidad determinística requiere NumPy

El dataset sintético del experimento (`medicion/datasets/generar_datasets.py`) usa `numpy.random.default_rng(seed)` para generar payloads reproducibles bit-a-bit. Cada dataset lleva un hash SHA-256 calculado sobre su contenido, que permite verificar que cualquier evaluador está usando exactamente los mismos inputs. Esta capacidad —generación determinística con semilla explícita y verificación por hash— es un requisito de rigor experimental que NumPy cumple de forma nativa y probada.

### 1.3 Separación de responsabilidades tecnológicas

El proyecto usa dos herramientas de scripting con propósitos radicalmente distintos:

| Responsabilidad | Herramienta | Justificación |
|---|---|---|
| Análisis estático de artefactos n8n | Node.js (`validar-flujos.mjs`) | Cohesión con el runtime de n8n; cero dependencias |
| Medición dinámica, análisis y visualización | Python (`run_corridas.py`, `analizar_runlogs.py`, etc.) | Ecosistema de ciencia de datos; estadística y visualización |

Esta separación no es una inconsistencia: es una decisión de diseño deliberada. Mezclar ambas responsabilidades en el mismo stack habría comprometido una u otra. Ver `microframework/validacion/README.md §2` para la justificación complementaria desde el lado del validador Node.js.

---

## 2. Inventario de scripts y propósito de cada uno

### 2.1 `automatizacion/setup_env.py`

**Propósito:** Bootstrap completo del entorno experimental con un solo comando.

**Qué hace:**
- Lee `infraestructura/.env.example` y genera `infraestructura/.env` con credenciales seguras (usando `secrets.token_hex`)
- Ejecuta `docker compose up -d` y espera a que n8n, PostgreSQL y los mock servers estén `healthy`
- Imprime las instrucciones para el único paso manual: el import de flujos en la UI de n8n

**Por qué existe:** El anteproyecto establece que el experimento debe ser reproducible bajo condiciones controladas. Sin este script, levantar el entorno requeriría configuración manual propensa a errores y diferente entre ejecuciones. Con él, el entorno siempre parte del mismo estado inicial.

**Salida:** `infraestructura/.env` + 4 servicios Docker en estado healthy.

---

### 2.2 `medicion/datasets/generar_datasets.py`

**Propósito:** Generar los datasets sintéticos del experimento de forma determinística y verificable.

**Qué hace:**
- Lee `medicion/datasets/seeds.yaml` con semillas explícitas por dataset y caso
- Usa `numpy.random.default_rng(seed)` para generar payloads con distribuciones físicamente verosímiles (temperatura, humedad, CO2 con rangos reales para IoT; mensajes por categoría para Bot)
- Produce 10 archivos JSON (5 Bot + 5 IoT) con 200 payloads cada uno: **2 000 payloads totales**
- Calcula y guarda el hash SHA-256 de cada archivo para verificación de integridad
- Soporta `--verify-only` para confirmar que los archivos existentes no han sido modificados

**Por qué existe:** El diseño cuasi-experimental requiere inputs controlados y fijos entre corridas. Si los payloads variaran entre ejecuciones, las diferencias de latencia medidas no serían atribuibles solo al diseño arquitectónico (as-is vs to-be). El generador determinístico garantiza que cada evaluador que clone el repositorio y ejecute el script obtenga exactamente los mismos inputs.

**Conjuntos generados:**
- Bot: A (válido nominal), B (alta carga), C (inválido — token ausente), F, G (variantes de carga)
- IoT: A (lecturas normales), B (mix), C (inválido — campos faltantes), I (mix con críticos), J, K

**Salida:** Archivos JSON en `medicion/datasets/bot/` y `medicion/datasets/iot/`.

---

### 2.3 `automatizacion/run_corridas.py`

**Propósito:** Ejecutar las corridas de medición contra los webhooks de n8n con control total sobre input, timing y registro.

**Qué hace:**
- Envía peticiones HTTP POST a los webhooks de n8n (as-is y to-be, bot e IoT) usando los datasets generados
- Mide latencia end-to-end con timestamps de alta resolución (`datetime.now(timezone.utc)`)
- Verifica que el HTTP status code recibido coincida con el esperado por diseño (incluyendo los casos donde as-is devuelve 200 ante input inválido — que es el antipatrón documentado)
- Registra cada corrida en los CSVs de run-log con: `run_id`, `case`, `version`, `input_set`, `start_ts`, `end_ts`, `status`, `error_type`, `commit_hash`
- Soporta `--dry-run` para verificar configuración sin ejecutar

**Por qué existe:** La API REST de n8n no permite ejecutar flujos con inputs arbitrarios ni controlar el timing de las corridas. El único mecanismo de medición real es invocar el webhook externamente y registrar la latencia desde el cliente. Este script es el harness experimental que produce los datos brutos del experimento.

**Escala:** El experimento completo ejecuta **8 000 corridas** (4 combinaciones caso×estado × 10 input sets × 200 payloads). Este volumen garantiza que los percentiles p95 y p99 sean estadísticamente estables.

**Salida:** Filas en `medicion/run-logs/bot/run-log-bot-{as-is|to-be}.csv` y `medicion/run-logs/iot/run-log-iot-{as-is|to-be}.csv`.

---

### 2.4 `automatizacion/extract_metrics.py`

**Propósito:** Extraer métricas de ejecución desde la API REST de n8n como fuente complementaria.

**Qué hace:**
- Se autentica con la API REST de n8n usando `N8N_API_KEY`
- Consulta el historial de ejecuciones de cada workflow por nombre
- Calcula percentiles (p50, p95, p99) y tasa de fallos desde los registros internos de n8n
- Genera un reporte Markdown en `medicion/consolidado/metrics-YYYY-MM-DD.md`

**Por qué existe:** Los run-logs CSV registran latencia client-side (tiempo total incluyendo red y overhead de Docker). Los datos de la API de n8n registran tiempo server-side (tiempo de procesamiento interno del workflow). La combinación de ambas fuentes permite separar overhead de infraestructura de tiempo de procesamiento real, enriqueciendo el análisis comparativo.

**Nota de uso:** Requiere que se haya generado una API Key manualmente en la UI de n8n. Es el único script que tiene ese prerequisito.

**Salida:** `medicion/consolidado/metrics-YYYY-MM-DD.md`.

---

### 2.5 `automatizacion/compare_results.py`

**Propósito:** Producir la tabla comparativa as-is vs to-be a partir de los run-logs.

**Qué hace:**
- Lee los 4 CSVs de run-log (bot as-is, bot to-be, iot as-is, iot to-be)
- Calcula para cada combinación caso×estado×input_set: p50, p95, p99 de latencia, tasa de éxito, N de corridas
- Genera una tabla Markdown lado a lado con deltas entre as-is y to-be
- Incluye el porcentaje de mejora o degradación por métrica

**Por qué existe:** La comparación as-is vs to-be es el resultado cuantitativo central del OE2. Este script automatiza lo que de otra manera sería un proceso manual de cálculo en hoja de cálculo, evitando errores de transcripción y garantizando que los números del informe corresponden exactamente a los datos en el repositorio.

**Salida:** `medicion/consolidado/comparacion-YYYY-MM-DD.md`. Hay dos reportes versionados: [2026-05-03](../medicion/consolidado/comparacion-2026-05-03.md) y [2026-05-05](../medicion/consolidado/comparacion-2026-05-05.md).

---

### 2.6 `medicion/analizar_runlogs.py`

**Propósito:** Análisis estadístico completo y visualización interactiva de los run-logs.

**Qué hace:**
- Carga los 4 CSVs con pandas
- Calcula métricas de rendimiento (latencia), calidad (tasa de fallos) y conformidad (status codes correctos vs incorrectos)
- Aplica tests estadísticos con SciPy cuando está disponible (comparación de distribuciones)
- Genera un reporte HTML interactivo con Plotly: gráficos de distribución de latencia, comparativas as-is vs to-be, desglose por input set

**Por qué existe:** Los CSVs con 8 000 filas no son inspeccionables manualmente. Este script transforma los datos brutos en visualizaciones que permiten:
1. Detectar outliers y patrones anómalos en las corridas
2. Comparar visualmente las distribuciones de latencia as-is vs to-be
3. Producir figuras académicamente presentables para el informe ATAM

**Dependencias:** `pandas`, `plotly`, `scipy` (opcional para tests estadísticos).

**Salida:** `medicion/consolidado/reporte-runlogs.html` (excluido de Git por `.gitignore` — se regenera desde los CSVs).

---

### 2.7 `medicion/analisis_iot_q5.py`

**Propósito:** Análisis específico del escenario IOT-Q5 del ATAM — urgencia diferenciada por nivel de alerta.

**Qué hace:**
- Carga el dataset Set I (`medicion/datasets/iot/input-set-I.json`), que contiene la mezcla de lecturas normal/advertencia/crítico
- Aplica los umbrales del ADR-002 (temperatura > 35°C → crítico, CO2 > 1200 → crítico, humedad > 80% → advertencia, CO2 > 800 → advertencia) para calcular el nivel esperado de cada payload
- Cruza esos niveles con los tiempos del run-log to-be para verificar si el flujo to-be procesa lecturas críticas más rápido o con mayor prioridad que las normales
- Produce estadísticas de latencia segmentadas por nivel: `normal`, `advertencia`, `critico`

**Por qué existe:** El escenario IOT-Q5 del Utility Tree ATAM pregunta: "¿el to-be diferencia el tiempo de respuesta según la urgencia del evento?". Responder esa pregunta requiere cruzar el nivel de alerta (campo calculado internamente por E2, no observable directamente en el run-log) con los tiempos medidos. Este script hace ese cruce de forma reproducible y documentada.

**Relación con ATAM:** El output de este script es evidencia de tipo (ii) — cuantitativa empírica — en la triangulación metodológica de la evaluación ATAM. Ver `atam/informe-atam-final.md §7` y `medicion/consolidado/atam-evidencia.md`.

**Salida:** Reporte en consola con distribución de niveles y estadísticas de latencia por nivel.

---

## 3. Rol en el diseño de investigación

El proyecto adopta un **diseño cuasi-experimental de comparación as-is vs to-be** con **metodología mixta de secuencia explicativa**: primero evidencia cuantitativa, luego explicación cualitativa por ATAM y ADR.

Los scripts Python son el componente que produce la **evidencia cuantitativa**. Su posición en el flujo de investigación:

```
Definición del marco         Construcción de casos        Medición cuantitativa
(Fases 1-3)                  (Fases 2-4)                  (Fases 5-6)
     │                             │                             │
     ▼                             ▼                             ▼
microframework-spec.md      flujos JSON as-is/to-be      generar_datasets.py
reglas-obligatorias.md      checklists arquitectura      setup_env.py
ADR-plantilla.md            matriz-trazabilidad.md       run_corridas.py
                                                         extract_metrics.py
                                                         compare_results.py
                                                         analizar_runlogs.py
                                                              │
                                                              ▼
                                                   Evidencia para ATAM (Fase 7)
                                                   analisis_iot_q5.py
                                                   atam-evidencia.md
```

Sin los scripts de medición, el ATAM solo tendría evidencia documental (checklist, ADR). Con ellos, la evaluación descansa en tres fuentes: documental, cuantitativa empírica sobre 8 000 corridas reales, y validación externa por panel de expertos — la triangulación metodológica que justifica la adaptación de ATAM a un proyecto individual.

---

## 4. Alineación con los objetivos específicos

### OE1 — Definir un marco arquitectónico

`setup_env.py` hace al marco **operable**: cualquiera puede levantar el entorno y verificar que los flujos to-be funcionan en las condiciones descritas por el micro-framework. Sin un entorno reproducible, el marco sería solo documentación.

### OE2 — Sistematizar el uso del marco en dos casos de estudio

Este es el objetivo más directamente soportado por los scripts:

- `generar_datasets.py` produce los inputs controlados que hacen comparable el as-is y el to-be bajo exactamente las mismas condiciones de entrada
- `run_corridas.py` ejecuta el experimento de las **8 000 corridas** que genera los datos comparativos
- `compare_results.py` produce la tabla as-is vs to-be que es el resultado cuantitativo de "sistematizar el uso del marco en dos casos"
- `analizar_runlogs.py` convierte esos datos en evidencia visual inspeccionable

Sin estos scripts, la "sistematización" del OE2 sería solo narrativa. Con ellos, hay números concretos, reproducibles y auditables que demuestran el impacto del marco en los atributos de calidad medidos.

### OE3 — Implementar un protocolo de evaluación arquitectónica basado en ATAM

`analisis_iot_q5.py` y los run-logs producidos por `run_corridas.py` son evidencia de tipo (ii) en la triangulación metodológica del ATAM. Específicamente:

- Los datos de latencia por input set responden los escenarios BOT-Q1…Q6 e IOT-Q1…Q6 del Utility Tree
- `analisis_iot_q5.py` responde directamente el escenario IOT-Q5 (urgencia diferenciada)
- Los 8 000 datos son la base empírica de la Matriz de Scoring 1-5 as-is vs to-be (`atam/matriz-scoring.md`)

### OE4 — Proponer un diseño de arquitectura AWS

Los scripts contribuyen indirectamente: los riesgos identificados en el ATAM (R-GLOBAL-01 logs efímeros, R-BOT-01 sin rotación de tokens, R-IOT-01 dead-letter bloqueado) emergen del análisis cuantitativo. Sin los datos de medición, esos riesgos serían hipotéticos; con los datos, son observaciones fundamentadas en evidencia empírica que el diseño AWS debe resolver.

---

## 5. Alineación con compromisos del anteproyecto

### 5.1 Diseño cuasi-experimental (§3.2 del anteproyecto)

El anteproyecto establece explícitamente un diseño cuasi-experimental donde "las condiciones de ejecución se mantienen controladas y replicables (misma versión de n8n, misma configuración, mismas entradas sintéticas)". Los scripts realizan exactamente ese compromiso:

- **Misma versión de n8n:** `setup_env.py` usa la imagen Docker fijada en `infraestructura/docker-compose.yml`
- **Misma configuración:** el entorno se construye desde cero con credenciales generadas, sin estado residual
- **Mismas entradas sintéticas:** `generar_datasets.py` produce inputs idénticos en cualquier máquina con la misma semilla

### 5.2 Metodología mixta con secuencia explicativa (§3.1 del anteproyecto)

El anteproyecto describe el enfoque como "primero evidencia cuantitativa operativa, luego explicación cualitativa". Los scripts son el componente que produce la evidencia cuantitativa que antecede y fundamenta la explicación cualitativa del ATAM.

### 5.3 Métricas comprometidas (§4.4 del anteproyecto)

El anteproyecto compromete métricas específicas como evidencia del impacto del micro-framework. Los scripts producen exactamente esas métricas:

| Métrica comprometida | Script que la produce |
|---|---|
| Latencia p50/p95/p99 as-is vs to-be | `run_corridas.py` + `compare_results.py` |
| Tasa de fallos por caso y versión | `run_corridas.py` + `analizar_runlogs.py` |
| Conformidad de status codes | `run_corridas.py` (verifica `EXPECTED_HTTP` por diseño) |
| Latencia diferenciada por nivel de alerta | `analisis_iot_q5.py` |
| Estadísticas de la API interna de n8n | `extract_metrics.py` |

### 5.4 Reproducibilidad como criterio de validez (§3.3 del anteproyecto)

El anteproyecto menciona la reproducibilidad como criterio de validez del experimento. Los scripts garantizan reproducibilidad en tres capas:

1. **Entorno:** `setup_env.py` reconstruye el entorno desde cero
2. **Datos:** `generar_datasets.py` con semillas explícitas y hashes SHA-256
3. **Medición:** `run_corridas.py` registra el `commit_hash` de Git en cada corrida, permitiendo asociar cualquier dato al estado exacto del código en ese momento

---

## 6. Por qué no Node.js para estos scripts

La decisión de usar Node.js en el validador estático y Python en los scripts de medición es una **separación deliberada de responsabilidades**, no una inconsistencia. La razón central:

**Los scripts de medición son ciencia de datos aplicada.** Necesitan estadística descriptiva confiable (percentiles, desviación estándar, tests de hipótesis), manipulación de tablas con miles de filas, y visualización interactiva. El ecosistema Python (pandas, NumPy, SciPy, Plotly) resuelve esto con herramientas maduras, documentadas y usadas en investigación académica. Node.js no tiene un equivalente maduro para este tipo de trabajo.

**El validador estático es análisis de artefactos n8n.** Necesita parsear JSON del formato nativo de n8n y verificar predicados estructurales. Node.js lo hace de forma nativa, sin dependencias, en el mismo runtime que n8n. Python habría agregado dependencias sin aportar nada que la stdlib de Node no pudiera hacer.

Usar el mismo lenguaje para ambas responsabilidades habría sido una falsa coherencia que comprometería una u otra tarea.

---

## 7. Garantías de reproducibilidad

El conjunto de scripts implementa las siguientes garantías:

| Garantía | Mecanismo |
|---|---|
| Entorno idéntico entre ejecuciones | `setup_env.py` reconstruye desde imagen Docker fijada |
| Inputs idénticos entre ejecuciones | Semillas explícitas en `seeds.yaml` + verificación SHA-256 |
| Rastreabilidad de datos | `commit_hash` de Git registrado en cada fila del run-log |
| Verificación de integridad | `generar_datasets.py --verify-only` compara hashes actuales con esperados |
| Separación de datos brutos y derivados | CSVs versionados en Git; HTML y reportes regenerables |
| Comportamiento esperado documentado | `EXPECTED_HTTP` en `run_corridas.py` documenta el status code correcto por diseño, incluyendo los antipatrones del as-is |

---

## 8. Limitaciones reconocidas

### 8.1 Latencia medida es client-side

`run_corridas.py` mide tiempo desde el cliente (la máquina que corre el script) hasta recibir la respuesta HTTP. Esta medición incluye el overhead de la red local Docker y el stack HTTP. Para el propósito del proyecto —comparar as-is vs to-be en el mismo entorno— esto es válido porque ambas versiones se miden con el mismo overhead. No es válido para afirmar latencias absolutas en producción.

### 8.2 El entorno local no replica producción

El experimento corre en Docker local con mock servers. Los resultados cuantitativos son válidos para la comparación as-is vs to-be, no para predecir comportamiento en AWS. El diseño AWS de la Fase 8 aborda ese gap.

### 8.3 `extract_metrics.py` requiere prerequisito manual

Es el único script que requiere una API Key generada en la UI de n8n. Si no está disponible, el script no ejecuta, pero los run-logs CSV son la fuente primaria de evidencia y no dependen de este script.

### 8.4 `analizar_runlogs.py` genera HTML no versionado

El reporte HTML se excluye de Git (ver `.gitignore`) porque es un artefacto derivado de los CSVs. Regenerarlo toma segundos con `python medicion/analizar_runlogs.py`. Los CSVs fuente sí están versionados.

---

## Referencias cruzadas

| Documento | Relación |
|---|---|
| [`medicion/protocolo-evidencias.md`](../medicion/protocolo-evidencias.md) | Protocolo operativo completo para ejecutar el experimento |
| [`medicion/protocolo-mttd.md`](../medicion/protocolo-mttd.md) | Procedimiento específico de medición MTTD |
| [`automatizacion/README.md`](README.md) | Referencia de comandos y flujo de uso paso a paso |
| [`medicion/consolidado/atam-evidencia.md`](../medicion/consolidado/atam-evidencia.md) | Cómo los datos de medición alimentan la evaluación ATAM |
| [`microframework/validacion/README.md`](../microframework/validacion/README.md) | Justificación complementaria: por qué el validador usa Node.js |
| [`../medicion/proyecto-overview.md`](../medicion/proyecto-overview.md) | OE1–OE4 y diseño de investigación del anteproyecto |
