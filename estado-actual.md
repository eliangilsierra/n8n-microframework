> 🌐 **Idioma / Language:** Español · [English](estado-actual.en.md)

# Estado Actual del Proyecto

Fuente única de verdad del avance. Actualizar al completar cada ítem: cambiar ✗ → ✓ y
refrescar "Última actualización".

**Última actualización:** 2026-07-08
**Fase activa:** FASE 7 — Evaluación ATAM Completada ✓ (encuesta ejecutada, analizada y documentada) · FASE 8 Completada ✓ · FASE 9 R5 Completada ✓ — R6 pendiente · Validador estático v2 (Lite + Pro) Completado ✓ (2026-05-31)

---

## Fases

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Alistamiento del entorno | Artefactos ✓ — Runtime validado ✓ |
| 1 | Especificación de casos y datos sintéticos | Completada ✓ |
| 2 | Construcción del estado as-is | Completada ✓ |
| 3 | Diseño del micro-framework v1.0 | Completada ✓ |
| 4 | Construcción del estado to-be | Completada ✓ (2026-05-05) |
| 5 | Prueba piloto de instrumentos | Completada ✓ (2026-05-05) |
| 6 | Medición comparativa | Completada ✓ (2026-05-05) — JMeter micro-benchmark pendiente (opcional) |
| 7 | Evaluación ATAM | Completada ✓ — encuesta ejecutada (17–24 jun 2026), analizada y documentada en §8 |
| 8 | Diseño de arquitectura AWS | Completada ✓ (2026-05-18) — OE4 cumplido |
| 9 | Guía de buenas prácticas y cierre | R5 Completada ✓ (2026-05-18) — R6 (documento final tesis) pendiente |

---

## FASE 0 — Alistamiento del entorno

### Artefactos de repositorio ✓
- ✓ Estructura de carpetas, documentación de contexto del proyecto
- ✓ `infraestructura/docker-compose.yml` (n8n + PostgreSQL + mock-bot + mock-iot) y `.env.example`
- ✓ Reglas obligatorias y recomendadas, checklists (arquitectura + DevSecOps), patrones, antipatrones, convenciones, plantilla ADR
- ✓ CSVs de run-logs y cr-logs con headers (8 archivos)
- ✓ Protocolo de evidencias v1.0 en `medicion/protocolo-evidencias.md`
- ✓ Datasets sintéticos A/B/C/D/E para Bot e IoT (5 sets × 2 casos = 10 archivos)
- ✓ Scripts de automatización: `setup_env.py`, `run_corridas.py`, `extract_metrics.py`, `compare_results.py`
- ✓ Script de análisis visual: `medicion/analizar_runlogs.py` (genera `medicion/consolidado/reporte-runlogs.html`)

### Runtime ✓
- ✓ Docker Desktop en ejecución — entorno levantado con `setup_env.py`
- ✓ n8n accesible en http://localhost:5678
- ✓ PostgreSQL + tablas `lecturas_sensor` e `interacciones_bot` creadas
- ✓ mock-bot (3001) y mock-iot (3002) healthy
- ✓ Flujos as-is importados en n8n y activados
- ✓ Primera medición as-is ejecutada (60 corridas bot + 30 corridas iot, sets A/B/C)

---

## FASE 1 — Completada ✓ — robustez académica verificada (2026-05-01)

- ✓ Fichas técnicas Bot e IoT con contratos, reglas, CRs y parámetros de reproducibilidad
- ✓ 6 datasets sintéticos (input-set-A/B/C para bot e iot) con metadatos de expectativas
- ✓ Matrices de trazabilidad (RF → ADR → evidencia) para ambos casos — **v1.3** con columna ISO 25010 y escenarios ATAM
- ✓ Sustentación académica de plantillas de referencia (`microframework/plantillas/sustentacion-plantillas-referencia.md`)
- ✓ Taxonomía formal de representatividad de casos (`casos-de-estudio/justificacion-casos-de-estudio.md`) — Yin (2018), 4 categorías LC/NC, cobertura ortogonal Bot/IoT

---

## FASE 2 — Completada ✓ — robustez académica verificada (2026-05-01)

### Análisis estático ✓
- ✓ Notas técnicas Bot as-is — 9/10 reglas violadas, flujo rediseñado a 16 nodos realistas
- ✓ Notas técnicas IoT as-is — 9/10 reglas violadas, flujo rediseñado a 14 nodos realistas
- ✓ ADR-001 Bot — separación de responsabilidades mediante subflujos
- ✓ ADR-001 IoT — separación de responsabilidades en pipeline de 4 etapas
- ✓ ADR-002 Bot — omisión deliberada de E4 como subflujo (salida inline en orquestador)

### Rediseño de flujos as-is (2026-04-19) ✓
- ✓ `bot-as-is.json` rediseñado: 10 nodos → 16 nodos con antipatrones REG-001/002/003/004/005/006/007/008 visibles
  - Rate limit en memoria no distribuido, token hardcodeado, INSERT sin ON CONFLICT,
    api-key externa hardcodeada, lógica de dominio mezclada con adaptador
- ✓ `iot-as-is.json` rediseñado: 6 nodos → 14 nodos con antipatrones REG-001/002/003/004/005/006/007/008/009 visibles
  - Validación incompleta de co2, credenciales en output del nodo, HTTP 200 en error de validación,
    umbrales inconsistentes entre nodos, dual-write sin idempotencia
- ✓ mock-bot actualizado: ruta GET `/api/user/:userId/tickets` para historial de usuario
- ✓ `setup_env.py` actualizado: crea tabla `interacciones_bot` además de `lecturas_sensor`
- ✓ Input sets D y E creados para bot e iot (boundary + campos faltantes)
- ✓ `run_corridas.py` actualizado: INPUT_SETS A–E, EXPECTED_HTTP completo

### Ejecución runtime — medición completa ✓
- ✓ 2000 corridas bot as-is (sets A–K × 200 c/u) → `run-log-bot-as-is.csv`
- ✓ 2000 corridas iot as-is (sets A–K × 200 c/u) → `run-log-iot-as-is.csv`
- ✓ Flujos rediseñados re-importados en n8n (LIMITE=150 activo)
- ✓ Sets D, E y dinámicos F, G, I, J, K ejecutados con N=200
- ✓ `checklist-arquitectura` y `checklist-devsecops` — antipatrones as-is documentados en notas-tecnicas.md (flujos as-is violan intencionalmente REG-001…009)

### Análisis de run-logs (2026-04-20) ✓
- ✓ Script `medicion/analizar_runlogs.py` creado — genera reporte HTML interactivo con Plotly
- ✓ Documentado en `medicion/protocolo-evidencias.md §8`
- Anomalías detectadas en los datos actuales:
  - ⚠️ Bot as-is: patrón 10 success / 20 fail por set inconsistente con expectativas
    (requiere re-ejecución con flujos rediseñados importados en n8n)
  - ⚠️ `commit_hash = "unknown"` en 100% de filas bot e IoT (resolver antes de Fase 6)
  - ⚠️ IoT as-is: distribución no uniforme (set A=31, set E=29 en lugar de 30)
  - ℹ️ Campo `notes` vacío en todas las filas — completar en próxima sesión
- IoT as-is: 100% success rate en todos los sets ✅ (correcto — sin validación es el antipatrón esperado)

### 2026-04-21 — Medición extendida con datasets dinámicos ✓

- ✓ `medicion/datasets/generar_datasets.py` — generador determinístico creado y funcional
- ✓ `medicion/datasets/seeds.yaml` — semillas versionadas (master_seed: 20260421)
- ✓ Datasets F, G, I, J, K generados para bot e IoT (10 archivos × 200 payloads c/u) — SHA-256 verificados
- ✓ `automatizacion/run_corridas.py` v2 — soporta sets A-K, N=200, DELAY_STRATEGY, arrays
- ✓ `casos-de-estudio/bot/as-is/bot-as-is-ratelimit-demo.json` — flujo demo LIMITE=10
- ✓ `casos-de-estudio/bot/as-is/bot-as-is.json` — umbral actualizado a LIMITE=150
- ✓ ADR-003 (bot rate-limit medición vs demo) creado
- ✓ ADR-004 (patrón de arribo híbrido) creado en casos-de-estudio/bot/adr/
- ✓ `medicion/analizar_runlogs.py` v2 — §8 conformidad semántica agregada
- ✓ `microframework/contratos/iot-webhook-input.schema.json` — bug corregido (token quitado, co2 agregado)
- ✓ Medición as-is completa: 4000 corridas totales (2000 bot + 2000 iot), sets A-K, N=200, commit a126311
- ✓ Anomalía Set A (contador n8n contaminado) verificada y resuelta — comportamiento LIMITE=150 confirmado
- Observación documentada: rate limiter en memoria contamina sets consecutivos dentro de la misma sesión
  cuando la ventana de tiempo (60s) no expira entre sets — evidencia del antipatrón REG-002
- ✓ Diagramas arquitectónicos as-is en Mermaid con antipatrones anotados por nodo (`casos-de-estudio/{bot,iot}/as-is/diagrama-as-is.md`)
- ✓ Justificación formal del rediseño as-is (`casos-de-estudio/justificacion-rediseno-asis.md`) — validez interna según Wohlin et al. (2012)
- ✓ Anomalía `commit_hash="unknown"` documentada metodológicamente en `medicion/protocolo-evidencias.md §9`

---

## FASE 3 — Completada ✓ (robustez académica verificada 2026-05-01)

### Entregables núcleo del micro-framework
- ✓ Metamodelo por etapas E1–E4 (`microframework/microframework-spec.md`)
- ✓ 10 reglas obligatorias (REG-001…REG-010) y 6 recomendadas (`microframework/reglas/`)
- ✓ Mapeo REG-* → ISO/IEC 25010 en `microframework/reglas/reglas-obligatorias.md`
- ✓ **5 patrones** documentados: retry, idempotencia, circuit breaker, error boundary, saga/compensación (`microframework/patrones/`)
- ✓ **11 antipatrones** documentados (`microframework/antipatrones.md`) — +4: ID hardcodeado, chatty, exception swallowing, god node
- ✓ **3 ADRs a nivel de framework** (`microframework/adr/`): ADR-MF-001 (REG-001), ADR-MF-002 (REG-003), ADR-MF-003 (REG-006)
- ✓ Checklist arquitectura y DevSecOps (`microframework/checklists/`)
- ✓ Convenciones de nombres (`microframework/convenciones/naming-conventions.md`)
- ✓ Plantilla ADR (`microframework/plantillas/ADR-plantilla.md`)
- ✓ Guía de observabilidad mínima (`microframework/guia-observabilidad.md`) — Pilar 3 DevSecOps
- ✓ Contratos E/S como JSON Schema (`microframework/contratos/`) — 9 schemas alineados con datasets reales
- ✓ Script de validación estática ejecutable (`microframework/validacion/validar-flujos.mjs`) — Pilar 2 DevSecOps
- ✓ Documento consolidado entregable R1 (`microframework/microframework-v1.0.md`) — **versión 1.1** con soporte académico completo
- ✓ **Fundamento teórico** — Clean Architecture (Martin 2017), NIST SSDF, OWASP, literatura LC/NC, posicionamiento
- ✓ **Utility Tree ATAM** (`atam/atam-utility-tree.md`) — 12 escenarios (6 Bot + 6 IoT) con medidas de respuesta
- ✓ **Protocolo MTTD** (`medicion/protocolo-mttd.md`) — procedimiento reproducible con meta < 60 segundos

### Decisiones arquitectónicas por caso (ADRs)
- ✓ **19 ADRs totales** conforme a plantilla de 7 secciones:
  - Bot: ADR-001 a 008 — separación, omisión E4, rate-limit, diseño experimental, autenticación, errorWorkflow, clasificación E2, rate-limit to-be
  - IoT: ADR-001 a 008 — pipeline, umbrales, idempotencia, routing E4, errorWorkflow, validación E1, timestamp authority, normalización E1
  - Framework: ADR-MF-001/002/003 — REG-001, REG-003, REG-006

### Evidencia de cambios al as-is (FASE 2 → 3)
- ✓ `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` — 4 CR-ASIS cronológicos
- ✓ `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` — 3 CR-ASIS cronológicos
- ✓ Notas técnicas Bot enriquecidas con nodo 8 y `api_source_token` (REG-001)

### Diseño y pre-medición de Change Requests
- ✓ `casos-de-estudio/bot/cr-design.md` + `casos-de-estudio/iot/cr-design.md` — CR1/CR2/CR3 completamente especificados
- ✓ CR-log schema extendido (`cr_type`, `notes`) en los 4 CSV
- ✓ Pre-medición as-is ejecutada: `cr-log-bot-as-is.csv` y `cr-log-iot-as-is.csv` con 3 filas cada uno; medición to-be pendiente para FASE 6

### Checklists aplicados al as-is (evidencia de línea base)
- ✓ `casos-de-estudio/bot/as-is/checklist-arquitectura-resultado.md` (6/7 violadas)
- ✓ `casos-de-estudio/bot/as-is/checklist-devsecops-resultado.md` (3 pilares fallan)
- ✓ `casos-de-estudio/iot/as-is/checklist-arquitectura-resultado.md` (6/7 violadas)
- ✓ `casos-de-estudio/iot/as-is/checklist-devsecops-resultado.md` (3 pilares fallan)

### Matrices de trazabilidad
- ✓ `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md` — **v1.3**: ADR-001..008 linkeados, columna ISO 25010 en RFs, escenarios ATAM BOT-Q1..Q6
- ✓ `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` — **v1.3**: ADR-001..008 linkeados, columna ISO 25010 en RFs, escenarios ATAM IOT-Q1..Q6

---

## FASE 4 — Construcción del to-be

### Artefactos ✓
- ✓ 8 plantillas JSON to-be en `microframework/plantillas/` (orquestadores + subflujos)
- ✓ Contratos E/S por caso definidos en fichas y en `arquitectura-flujos.md`
- ✓ Log estructurado JSON definido por etapa

### Runtime ejecutado (2026-05-04) ✓
- ✓ Subflujos importados en n8n (bot: 2 subflujos; iot: 4 subflujos + error handler)
- ✓ IDs reales capturados y configurados en n8n UI (bot orquestador actualizado y re-exportado)
- ✓ Medición to-be ejecutada: 2000 corridas bot + 2000 corridas iot (sets A–K, N=200, commit b1bdb8a)
- ✓ Run-logs to-be generados: `run-log-bot-to-be.csv`, `run-log-iot-to-be.csv`
- ✓ Reporte comparativo generado: `medicion/consolidado/comparacion-2026-05-03.md`
- ✓ Reporte HTML interactivo actualizado: `medicion/consolidado/reporte-runlogs.html`

### Cierre FASE 4 (2026-05-05) ✓
- ✓ **[BUG-1]** `EXPECTED_STATUS` en `analizar_runlogs.py` corregido
- ✓ **[BUG-2]** Orquestadores exportados con IDs reales (bot con IDs `GLCqR9yqvkmE20QY`/`EqMaNbc6Rq60G8u9`; IoT requiere reemplazar `iot-to-be-orquestador.json` en repo con el export de n8n)
- ✓ **[BUG-3/4/5]** Resueltos (ver notas anteriores)
- ✓ CR-logs to-be poblados: `cr-log-bot-to-be.csv` (3 CRs) y `cr-log-iot-to-be.csv` (3 CRs)
- ✓ Checklists arquitectura to-be: Bot 10/10, IoT 10/10
- ✓ Checklists DevSecOps to-be: Bot 8/8, IoT 7/7 aplicables
- ✓ Archivos obsoletos eliminados: `bot-to-be-orquestador-v2.json`, `iot-to-be-orquestador-v2.json`
- ✓ Validador estático ejecutado y reporte guardado: `microframework/validacion/reportes/validacion-2026-05-06.md`
- ⚠️ **Acción pendiente (menor):** reemplazar `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` con export real de n8n (placeholders en campo `workflowId`; no afecta REGs evaluadas)

### Estado del reporte HTML (post-correcciones 2026-05-04)
- **3 CRÍTICAS** en bot/as-is (Sets A, C, D) — todas producidas por rate limiter REG-002. Evidencia del antipatrón. ✅ Esperadas.
- **4 INFO** — campo `notes` vacío (documentado metodológicamente).
- **to-be completo**: todos los sets técnicamente evaluables muestran ✅ conforme.
- **Sets G, J bot/to-be**: marcados como "mixed" → evaluación en §8 del reporte.

### Observaciones de la medición (2026-05-04)
| Métrica | BOT as-is | BOT to-be | IOT as-is | IOT to-be |
|---------|-----------|-----------|-----------|-----------|
| Total corridas | 2000 | 2000 | 2000 | 2000 |
| Fallos totales | 175 (9%) | 114 (6%) | 4 (0%) | 12 (1%) |
| p50 Set A | 120 ms | 149 ms (+25%) | 78 ms | 200 ms (+156%) |
| p50 Set B | 118 ms | 145 ms (+23%) | 78 ms | 227 ms (+192%) |
| p50 Set C | 66 ms | 53 ms (-20%) | 42 ms | 72 ms (+70%) |
| Antipatrón REG-002 visible | ✅ 25% fail Set A | ✅ Eliminado (0% fail) | N/A | N/A |
| Validación E1 Set C (rechazo) | ✅ retorna 401 | ✅ retorna 400 | ✅ 200 (antipatrón) | ✅ retorna 422 |

---

## FASE 5 — Prueba piloto de instrumentos — Completada ✓ (2026-05-05)

- ✓ `run_corridas.py` — validado: 8000 corridas totales ejecutadas sin fallo del script
- ✓ `analizar_runlogs.py` — validado: genera HTML con detección de anomalías correcta
- ✓ `validar-flujos.mjs` — validado: 22 archivos evaluados; to-be bot 100%, to-be iot 100%
- ✓ `compare_results.py` — reporte comparativo `comparacion-2026-05-05.md` generado
- ✓ MTTD analítico documentado: Bot ~14s ✅; IoT estructural ✅ (ver `mttd-resultado.md`)
- ⚠️ JMeter micro-benchmark: herramienta no instalada; instrucciones en `medicion/datasets/jmeter/resultados/PENDIENTE.md` — no bloquea ATAM

---

## FASE 6 — Medición comparativa — Completada ✓ (2026-05-05)

### Run-logs ✓
- ✓ `run-log-bot-as-is.csv` — 2000 corridas, sets A–K
- ✓ `run-log-iot-as-is.csv` — 2000 corridas, sets A–K
- ✓ `run-log-bot-to-be.csv` — 2000 corridas, sets A–K
- ✓ `run-log-iot-to-be.csv` — 2000 corridas, sets A–K

### CR-logs ✓
- ✓ `cr-log-bot-as-is.csv` — 3 CRs medidos (as-is: 8/5/3 nodos)
- ✓ `cr-log-iot-as-is.csv` — 3 CRs medidos (as-is: 6/4/3 nodos)
- ✓ `cr-log-bot-to-be.csv` — 3 CRs medidos (to-be: 1/1/1 nodos — −81% promedio)
- ✓ `cr-log-iot-to-be.csv` — 3 CRs medidos (to-be: 1/1/0 nodos — −84% promedio)

### Métricas calculadas ✓
- ✓ Comparación latencia y fallos: `medicion/consolidado/comparacion-2026-05-05.md`
- ✓ Reporte HTML interactivo: `medicion/consolidado/reporte-runlogs.html`
- ✓ Métricas derivadas: `medicion/consolidado/metricas-derivadas.md`
- ✓ Matriz ATAM × evidencia: `medicion/consolidado/atam-evidencia.md` v1.1 (Bot 83% ✅, IoT 100% ✅ — actualizado 2026-05-07)
- ✓ MTTD documentado: `medicion/consolidado/mttd-resultado.md`

### Resultados clave
| Meta | Resultado |
|------|-----------|
| Impacto CR ≥ 20% reducción nodos | Bot −81%, IoT −84% ✅ |
| Fallos ≥ 30% reducción | Bot −36.6% ✅ |
| Checklist ≥ 90% en to-be | Bot 100%, IoT 100% ✅ |
| Cobertura ATAM ≥ 80% | Bot 83% ✅ · IoT 100% ✅ · Total 92% ✅ |

### Pendiente menor (no bloquea fases siguientes)
- ✓ IOT-Q4 runtime: ejecutado 2026-05-07 → SP-IOT-01, R-IOT-01, NR-IOT-01 identificados
- ✓ IOT-Q5 análisis: ejecutado 2026-05-07 → TP-IOT-01 cuantificado (+10.8 ms)
- ⚠️ JMeter micro-benchmark: herramienta no instalada — métrica complementaria, no bloquea tesis

---

## FASE 7 — Evaluación ATAM — Completada ✓ (iniciada 2026-05-07, encuesta ejecutada y analizada 2026-06-24, §8 documentada 2026-07-08)

### Artefactos producidos ✓
- ✓ Evidencia ATAM completada: Bot 5/6 (83%) ✅ · IoT 6/6 (100%) ✅ · Total 11/12 (92%) ✅
- ✓ IOT-Q4 runtime ejecutado → SP-IOT-01, R-IOT-01, NR-IOT-01 documentados
- ✓ IOT-Q5 análisis ejecutado (`medicion/analisis_iot_q5.py`) → TP-IOT-01 documentado
- ✓ `atam/analisis-approaches.md` — 12 approaches + clasificación SP/TP/R/NR × 12 escenarios
- ✓ `atam/matriz-scoring.md` — Scoring 1–5 as-is vs to-be para los 12 escenarios
- ✓ `atam/registro-riesgos-tradeoffs.md` — 3 SP · 3 TP · 4 R · 5 NR formalizados
- ✓ `microframework/adr/ADR-MF-004-atam-adaptado-individual.md` — adaptación metodológica formal
- ✓ `atam/metodologia-atam-adaptada.md` — marco ATAM adaptado con sustento académico
- ✓ `atam/protocolo-encuesta.md` — protocolo completo de validación externa
- ✓ `atam/instrumento-encuesta.md` — 18 preguntas + mini-ATAM opcional (10–12 min)
- ✓ `atam/plan-analisis-encuesta.md` — plan estadístico (α Cronbach, κ Krippendorff)
- ✓ `atam/plan-difusion.md` — canales, plantillas y lista de candidatos
- ✓ `atam/material-apoyo/resumen-proyecto.md` — PDF 4 páginas (fuente Markdown)
- ✓ `atam/material-apoyo/guion-video.md` — guion video 5–7 min para panel
- ✓ `atam/material-apoyo/diagrama-comparativo.md` — diagramas Mermaid as-is vs to-be
- ✓ `atam/informe-atam-final.md` — informe ATAM capítulo de tesis (§1–§10 completos, §8 con resultados reales de encuesta)
- ✓ `atam/INDEX.md` — índice completo de todos los artefactos de Fase 7
- ✓ `medicion/encuesta-validacion/` — datos anonimizados (N=19, 17 válidos), script y notebook de análisis ejecutados, outputs consolidados

### Hallazgos ATAM formalizados
| Tipo | IDs | Descripción resumida |
|---|---|---|
| Sensitivity Points (3) | SP-BOT-01, SP-BOT-02, SP-IOT-01 | Idempotencia E3 · Log E1 · Canal error handler IoT |
| Tradeoff Points (3) | TP-GLOBAL-01, TP-GLOBAL-02, TP-IOT-01 | Subflujos vs latencia · Validación vs flexibilidad · Retry diferenciado |
| Risks (4) | R-BOT-01, R-IOT-01, R-GLOBAL-01, R-GLOBAL-02 | Rotación token · Dead-letter bloqueado · Logs efímeros · Contratos externos |
| Non-risks (5) | NR-BOT-01, NR-BOT-02, NR-IOT-01, NR-IOT-02, NR-GLOBAL-01 | E1 previene side-effects · HTTP 401/400 · E3 independiente · Idempotencia IoT · Validador estático |

### Validación externa por panel de expertos — Completada ✓
- ✓ Recolección ejecutada del 17 al 24 de junio de 2026 (N=19, 17 válidos tras filtro de experiencia)
- ✓ Convergencia to-be 12/12 escenarios; as-is 11/12 (Δ=1 en IOT-Q5)
- ✓ 95.1 % de pares respondiente-escenario perciben mejora as-is→to-be
- ✓ §8 del `informe-atam-final.md` (y `.en.md`) completado con perfil de panel, resultados Sección B, codificación cualitativa Sección C/E4, triangulación Sección E y síntesis

---

## FASE 8 — Diseño de Arquitectura AWS — Completada ✓ (2026-05-18)

### Artefactos producidos ✓
- ✓ `infraestructura/aws/arquitectura-aws.md` — Documento principal: VPC multi-AZ, ECS Fargate, RDS Multi-AZ, ElastiCache Redis, S3, mapeo local→AWS, resolución de riesgos ATAM
- ✓ `infraestructura/aws/seguridad-iam.md` — IAM Task Roles (4 roles), Secrets Manager, ACM, WAF, Security Groups, KMS CMK. Diagramas 5 y 6
- ✓ `infraestructura/aws/observabilidad-aws.md` — CloudWatch Log Groups, 6 Log Insights queries, 7 alarmas, Dashboard. Resolución R-GLOBAL-01
- ✓ `infraestructura/aws/escalabilidad.md` — Queue Mode, auto-scaling workers (2–8), rolling/blue-green deploy, mapeo REGs. Diagrama 4
- ✓ `infraestructura/aws/estimacion-costos.md` — Costos 3 tiers (Dev ~$33, Staging ~$208, Prod ~$458), optimizaciones Fargate Spot. Diagrama 7
- ✓ `infraestructura/aws/diagramas-aws.md` — Fuente canónica de 7 diagramas Mermaid con código, justificación académica e instrucciones de render
- ✓ `infraestructura/aws/INDEX.md` — Índice de todos los artefactos de Fase 8
- ✓ `microframework/adr/ADR-MF-005-ecs-fargate-vs-ec2.md` — ECS Fargate vs EC2 vs EKS
- ✓ `microframework/adr/ADR-MF-006-n8n-queue-mode.md` — Queue Mode con Redis BullMQ
- ✓ `microframework/adr/ADR-MF-007-rds-multi-az.md` — RDS PostgreSQL Multi-AZ en Producción

### Diagramas Mermaid producidos (7 total)

| # | Tipo | Documento | Propósito |
|---|---|---|---|
| 1 | `C4Context` | `arquitectura-aws.md §1` | Contexto del sistema — actores y sistemas externos |
| 2 | `C4Container` | `arquitectura-aws.md §2` | Contenedores AWS y protocolos |
| 3 | `flowchart TD` | `arquitectura-aws.md §3` | Topología multi-AZ con VPC, subnets, AZs |
| 4 | `sequenceDiagram` | `escalabilidad.md §1` | Flujo temporal webhook → Queue → RDS → Auto Scaling |
| 5 | `flowchart LR` | `seguridad-iam.md §1` | Zonas de confianza y controles de seguridad |
| 6 | `graph TD` | `seguridad-iam.md §2` | Jerarquía IAM roles → políticas → recursos |
| 7 | `xychart-beta` | `estimacion-costos.md §3` | Costos mensuales por componente y tier |

### Resolución de riesgos ATAM en AWS

| Riesgo ATAM | Resolución |
|---|---|
| R-GLOBAL-01 — Logs efímeros | ✅ CloudWatch Logs — persistencia 30 días |
| R-BOT-01 — Sin rotación de tokens | ✅ Secrets Manager — rotación automática 30 días |
| R-IOT-01 — Dead-letter bloqueado | ✅ CloudWatch Alarm → SNS como canal independiente |
| SP-IOT-01 — Canal error handler = canal E4 | ✅ Alarm SNS independiente de canal de notificación E4 |
| R-GLOBAL-02 — Contratos sin versionado | ⚠️ Parcial — API Gateway versioning fuera del alcance |

---

## FASE 9 — Guía de Buenas Prácticas (R5) — Completada ✓ (2026-05-18)

### Artefacto producido ✓
- ✓ `microframework/guia-buenas-practicas.md` — Guía monolítica v1.0, ~12 capítulos + 5 apéndices
  - Cap 1 introducción + glosario de 25 términos
  - Cap 2 pre-requisitos y estructura del repo
  - Cap 3 Quick Start 30 minutos ejecutable (Docker → n8n → import → curl → logs → validador)
  - Cap 4 metamodelo E1-E4 con diagrama Mermaid y mapeo ISO 25010
  - Cap 5 Validación E/S (REG-007/008/009 + 9 schemas + ejemplos Bot/IoT) — sección anteproyecto ✅
  - Cap 6 Manejo de errores (REG-003/004/005 + 5 patrones + TP-IOT-01 + SP-IOT-01) — sección anteproyecto ✅
  - Cap 7 Seguridad (REG-001 + 8 ítems DevSecOps + ADR-MF-001 + R-BOT-01) — sección anteproyecto ✅
  - Cap 8 Observabilidad (REG-006 + contrato log JSON + plantilla Code node + ADR-MF-003) — sección anteproyecto ✅
  - Cap 9 Catálogo 11 antipatrones + señales de detección
  - Cap 10 Checklist final aplicable (arquitectura + DevSecOps + quick check + comando único) — sección anteproyecto ✅
  - Cap 11 Escalando local→AWS (mapeo + preservación REGs + costos + referencia infraestructura/aws/)
  - Cap 12 Trazabilidad RF→ADR→REG→ISO→ATAM + modelo madurez 5 niveles + auto-evaluación
  - Apéndices A-E (referencia REGs/ADRs/evidencia/recursos externos/mapa archivos)

### Cumplimiento con anteproyecto
- ✓ Las 5 secciones obligatorias cubiertas: validación E/S, manejo errores, seguridad, observabilidad, checklist
- ✓ Cada REG-001…010 referenciado al menos una vez
- ✓ Los 11 antipatrones catalogados
- ✓ Los 5 patrones explicados
- ✓ Glosario con 25 términos críticos
- ✓ Cap 11 referencia infraestructura/aws/ sin duplicar contenido
- ✓ TOC navegable con anclas Markdown

---

## Validador estático v2 — Refactor mayor (2026-05-31) ✓

Refactorización completa del validador (Pilar 2 DevSecOps) en **dos ediciones coexistentes**
que comparten el modelo canónico `report.schema.json`:

### Edición Lite — Reescritura del archivo único
- ✓ `microframework/validacion/validar-flujos.mjs` reescrito (~1600 LOC, cero dependencias)
- ✓ Parser de grafo dirigido a partir de `nodes` + `connections` (no más regex sobre JSON.stringify)
- ✓ Clasificador de etapas E1–E4 por heurísticas tipadas (no depende del nombre del archivo)
- ✓ 17 reglas: 11 REG-* + 6 antipatrones AP-* (god-node, chatty, dual-write, exception swallowing, hardcoded ID, stage leak)
- ✓ Severidad (error|warning|info) + confianza (high|medium|low) por finding
- ✓ Métricas: complejidad ciclomática, profundidad, cohesion score, fan-out
- ✓ Mapeo automático ISO 25010 / ATAM / ADR vía `mapeo-calidad.json`
- ✓ Renderers: md, json, sarif (v2.1.0), junit, html offline autocontenido
- ✓ HTML: 100% offline, 0 URLs externas, grafo SVG + radar ISO 25010 + tabla filtrable + sparkline histórico + panel "explica este finding" + branding académico
- ✓ Diff contra baseline JSON con findings nuevos/resueltos/regresiones
- ✓ `microframework/validacion/legacy/validar-flujos-v1.mjs` — v1 conservada como evidencia histórica
- ✓ Test runner artesanal: 6 fixtures, 6/6 pass

### Edición Pro — Paquete modular extensible
- ✓ `microframework/validacion-pro/` — estructura `src/{cli,parser,rules,metrics,fixers,report,shared}`
- ✓ CLI multi-subcomando: `analyze` · `report` · `diff` · `fix` · `watch`
- ✓ DSL YAML de reglas declarativas — `rules-custom/*.yaml` (2 ejemplos)
- ✓ Codemods (`--fix`): `add-http-retry` (REG-004), `envify-secret` (REG-001), `add-on-conflict` (REG-005) — idempotentes
- ✓ HTML CDN con Tailwind + Mermaid + Chart.js (radar)
- ✓ SARIF v2.1.0 para GitHub Code Scanning + workflow ejemplo
- ✓ Suite vitest: parser, rules (fixtures compartidos con Lite), DSL, fixers, render-sarif
- ✓ Docs: `dsl-spec.md`, `codemods.md`, `sarif-github.md`

### Resultados de la corrida final contra el repo
| Métrica | Lite v2 |
|---|---|
| Archivos analizados | 23 (5 as-is + 18 to-be) |
| Score promedio to-be | 84% |
| To-be con errors | 0 |
| Reglas ejercitadas | 13/17 (4 dormidas: AP-001/002/003/006) |
| Exit code | 0 |

### Documentación
- ✓ `microframework/adr/ADR-MF-008-validador-dos-ediciones.md` — decisión arquitectónica
- ✓ `microframework/validacion-pro/README.md` — comparativa Lite vs Pro + quick start
- ✓ Schema canónico publicado en `microframework/validacion/report.schema.json`

---

## Pendiente inmediato (próximos pasos)

> FASE 7 completada ✓ (encuesta ejecutada, analizada y documentada en §8). FASE 8 completada ✓. FASE 9 R5 completada ✓. Falta R6 (documento final de tesis).

1. **[FASE 9 — R6]** Consolidación del documento final de tesis (integración de R1–R5 con anexos técnicos)
2. **[OPCIONAL — menor]** Reemplazar `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` con export real de n8n (placeholders en `workflowId` — no afecta REGs evaluadas)

---

## Decisiones clave (no reabrir sin ADR)

| Decisión | Justificación |
|----------|--------------|
| PostgreSQL local (no InfluxDB) | Evita dependencia externa, SQL estándar |
| HTTP webhook en IoT (no MQTT) | Sin broker adicional; el proyecto evalúa arquitectura de flujos, no protocolo de transporte |
| Sin LLMs en los flujos | Evita variabilidad que impide reproducibilidad de métricas |
| JMeter para carga | UI de escritorio, estándar académico, gratuito |
| Mocks en localhost:3001 y 3002 | Control total sobre respuestas para pruebas reproducibles |
| Subflujos referenciados por ID en Execute Workflow | Mecanismo oficial de n8n para orquestación |
| AWS solo diseño (sin despliegue) | El anteproyecto lo declara explícitamente: diseño de referencia con estimación de costos, sin despliegue productivo |
| Bot usa E1+E2+E3 sin E4 como subflujo | Documentado en `casos-de-estudio/bot/adr/ADR-002-omision-e4.md` |

---

## Archivos críticos

```
estado-actual.md                                     este archivo (única fuente de verdad del avance)
medicion/proyecto-overview.md                    objetivos, metodología, métricas, metas, mapeo ISO 25010
casos-de-estudio/arquitectura-flujos.md                  arquitectura as-is y to-be, detalle técnico
microframework/microframework-spec.md                  micro-framework v1.0 (E1–E4, reglas, patrones)
microframework/convenciones/convenios-y-reglas.md                   convenciones y estructura del repositorio
medicion/protocolo-evidencias.md                         protocolo para levantar entorno y registrar mediciones
casos-de-estudio/{bot,iot}/ficha-tecnica.md          especificación de cada caso
casos-de-estudio/{bot,iot}/as-is/notas-tecnicas.md   análisis as-is + ajustes pre-import
casos-de-estudio/{bot,iot}/adr/ADR-*.md              decisiones arquitectónicas por caso
medicion/datasets/{caso}/input-set-*.json            datasets sintéticos inmutables
medicion/run-logs/{caso}/*.csv                       registro de corridas
medicion/analizar_runlogs.py                         análisis visual de run-logs → reporte HTML interactivo
medicion/cr-logs/{caso}/*.csv                        registro de Change Requests
microframework/microframework-v1.0.md                          entregable R1 — documento consolidado del micro-framework
microframework/                                      reglas, patrones, antipatrones, checklists, plantillas, convenciones
microframework/guia-observabilidad.md                Pilar 3 DevSecOps — contrato de logs estructurados por etapa
microframework/contratos/                            JSON Schemas de contratos E/S por etapa (Bot e IoT)
microframework/validacion/validar-flujos.mjs         Pilar 2 DevSecOps — script de validación estática REG-001…010
microframework/adr/ADR-MF-*.md                       ADRs a nivel de framework (REG-001, REG-003, REG-006)
microframework/patrones/                             5 patrones: retry, idempotencia, circuit-breaker, error-boundary, saga
atam/atam-utility-tree.md                    Utility Tree ATAM: 12 escenarios top-K con medidas de respuesta
medicion/protocolo-mttd.md                               Protocolo de medición MTTD — reproducible, meta < 60 segundos
casos-de-estudio/justificacion-casos-de-estudio.md       Taxonomía LC/NC y representatividad formal de Bot e IoT
casos-de-estudio/justificacion-rediseno-asis.md          Validez metodológica del rediseño intencional del as-is
atam/INDEX.md                                   Índice de todos los artefactos de Fase 7
atam/informe-atam-final.md                      Informe ATAM capítulo de tesis (R4) — §1–§10 completos, incl. §8 validación externa
atam/analisis-approaches.md                     12 approaches + clasificación SP/TP/R/NR × 12 escenarios
atam/matriz-scoring.md                          Scoring 1–5 as-is vs to-be por escenario
atam/registro-riesgos-tradeoffs.md              3 SP · 3 TP · 4 R · 5 NR formalizados
atam/instrumento-encuesta.md                    Encuesta de validación externa — 18 preguntas + mini-ATAM
atam/material-apoyo/resumen-proyecto.md         Fuente Markdown del PDF de 4 páginas para respondentes
atam/material-apoyo/guion-video.md              Guion del video de 5–7 minutos
medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv  Datos anonimizados de la encuesta (N=19, 17 válidos)
medicion/encuesta-validacion/analisis-encuesta.py    Script reproducible del análisis de la encuesta (§8)
microframework/adr/ADR-MF-004-atam-adaptado-individual.md  Adaptación metodológica ATAM individual
infraestructura/aws/INDEX.md                                   Índice de todos los artefactos de Fase 8
infraestructura/aws/arquitectura-aws.md                        Documento principal AWS: VPC, ECS, RDS, Redis, S3, riesgos ATAM
infraestructura/aws/seguridad-iam.md                           IAM, Secrets Manager, ACM, WAF, Security Groups (Diagramas 5 y 6)
infraestructura/aws/observabilidad-aws.md                      CloudWatch Logs, Alarms, Dashboard, Log Insights queries
infraestructura/aws/escalabilidad.md                           Queue Mode, auto-scaling workers, deploy strategies (Diagrama 4)
infraestructura/aws/estimacion-costos.md                       Costos 3 tiers, optimizaciones, comparativa (Diagrama 7)
infraestructura/aws/diagramas-aws.md                           Fuente canónica de los 7 diagramas Mermaid de Fase 8
microframework/adr/ADR-MF-005-ecs-fargate-vs-ec2.md  Decisión ECS Fargate vs EC2/EKS
microframework/adr/ADR-MF-006-n8n-queue-mode.md    Decisión Queue Mode con Redis BullMQ
microframework/adr/ADR-MF-007-rds-multi-az.md      Decisión RDS PostgreSQL Multi-AZ en Producción
microframework/guia-buenas-practicas.md                       Entregable R5 — guía monolítica de 12 capítulos + 5 apéndices
```
