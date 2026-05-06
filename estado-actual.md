# Estado Actual del Proyecto

Fuente única de verdad del avance. Actualizar al completar cada ítem: cambiar ✗ → ✓ y
refrescar "Última actualización".

**Última actualización:** 2026-05-05
**Fase activa:** FASE 4 ✓ · FASE 5 ✓ · FASE 6 ✓ (cerradas 2026-05-05) · FASE 7 — Evaluación ATAM (siguiente)

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
| 7 | Evaluación ATAM | Pendiente — Utility Tree con 12 escenarios (6 Bot + 6 IoT) ✓ definido |
| 8 | Diseño de arquitectura AWS | Pendiente |
| 9 | Guía de buenas prácticas y cierre | Pendiente |

---

## FASE 0 — Alistamiento del entorno

### Artefactos de repositorio ✓
- ✓ Estructura de carpetas, documentación de contexto en `docs/context/`
- ✓ `infraestructura/docker-compose.yml` (n8n + PostgreSQL + mock-bot + mock-iot) y `.env.example`
- ✓ Reglas obligatorias y recomendadas, checklists (arquitectura + DevSecOps), patrones, antipatrones, convenciones, plantilla ADR
- ✓ CSVs de run-logs y cr-logs con headers (8 archivos)
- ✓ Protocolo de evidencias v1.0 en `docs/protocolo-evidencias.md`
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
- ✓ Sustentación académica de plantillas de referencia (`docs/context/sustentacion-plantillas-referencia.md`)
- ✓ Taxonomía formal de representatividad de casos (`docs/context/justificacion-casos-de-estudio.md`) — Yin (2018), 4 categorías LC/NC, cobertura ortogonal Bot/IoT

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
- ✓ Documentado en `docs/protocolo-evidencias.md §8`
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
- ✓ Justificación formal del rediseño as-is (`docs/context/justificacion-rediseno-asis.md`) — validez interna según Wohlin et al. (2012)
- ✓ Anomalía `commit_hash="unknown"` documentada metodológicamente en `docs/protocolo-evidencias.md §9`

---

## FASE 3 — Completada ✓ (robustez académica verificada 2026-05-01)

### Entregables núcleo del micro-framework
- ✓ Metamodelo por etapas E1–E4 (`docs/context/microframework-spec.md`)
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
- ✓ Documento consolidado entregable R1 (`docs/microframework-v1.0.md`) — **versión 1.1** con soporte académico completo
- ✓ **Fundamento teórico** (`docs/context/fundamento-teorico.md`) — Clean Architecture (Martin 2017), NIST SSDF, OWASP, literatura LC/NC, posicionamiento
- ✓ **Utility Tree ATAM** (`docs/context/atam-utility-tree.md`) — 12 escenarios (6 Bot + 6 IoT) con medidas de respuesta
- ✓ **Protocolo MTTD** (`docs/protocolo-mttd.md`) — procedimiento reproducible con meta < 60 segundos

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
- ✓ Matriz ATAM × evidencia: `medicion/consolidado/atam-evidencia.md` (Bot 83% ✅, IoT 67% ⚠️)
- ✓ MTTD documentado: `medicion/consolidado/mttd-resultado.md`

### Resultados clave
| Meta | Resultado |
|------|-----------|
| Impacto CR ≥ 20% reducción nodos | Bot −81%, IoT −84% ✅ |
| Fallos ≥ 30% reducción | Bot −36.6% ✅ |
| Checklist ≥ 90% en to-be | Bot 100%, IoT 100% ✅ |
| Cobertura ATAM ≥ 80% | Bot 83% ✅ / IoT 67% ⚠️ |

### Pendiente menor (no bloquea FASE 7)
- ⚠️ IOT-Q4 runtime: ejecutar `docker compose stop mock-iot` + lectura crítica + verificar retry en logs (15 min)
- ⚠️ IOT-Q5 análisis: filtrar `run-log-iot-to-be.csv` Set I por nivel de alerta y comparar `duracion_ms` (30 min)
- ⚠️ JMeter micro-benchmark: instalar JMeter y ejecutar `.jmx` files (métrica complementaria)

---

## Pendiente inmediato (próximos pasos)

> FASE 7 — Evaluación ATAM es la siguiente fase formal.

1. **[OPCIONAL - 45 min]** Completar cobertura ATAM IoT a 83%:
   - IOT-Q4: `docker compose stop mock-iot` → curl sensor crítico → verificar retry en logs → anotar en `mttd-resultado.md`
   - IOT-Q5: script Python para filtrar `run-log-iot-to-be.csv` Set I por nivel y comparar `duracion_ms`
2. **[OPCIONAL]** Instalar JMeter y ejecutar micro-benchmark (métrica complementaria, no bloquea FASE 7)
3. **[REQUERIDO IoT]** Reemplazar `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` con export de n8n que tenga IDs reales de subflujos
4. **[INICIO FASE 7]** Redactar informe ATAM formal con utility tree, escenarios priorizados, análisis de trade-offs y riesgos

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
CLAUDE.md                                            punto de entrada para Claude Code
docs/context/ANTEPROYECTO_ELIAN_GIL_MGADS.pdf        anteproyecto (fuente normativa del alcance)
docs/context/proyecto-overview.md                    objetivos, metodología, métricas, metas, mapeo ISO 25010
docs/context/arquitectura-flujos.md                  arquitectura as-is y to-be, detalle técnico
docs/context/microframework-spec.md                  micro-framework v1.0 (E1–E4, reglas, patrones)
docs/context/convenios-y-reglas.md                   convenciones y estructura del repositorio
docs/protocolo-evidencias.md                         protocolo para levantar entorno y registrar mediciones
casos-de-estudio/{bot,iot}/ficha-tecnica.md          especificación de cada caso
casos-de-estudio/{bot,iot}/as-is/notas-tecnicas.md   análisis as-is + ajustes pre-import
casos-de-estudio/{bot,iot}/adr/ADR-*.md              decisiones arquitectónicas por caso
medicion/datasets/{caso}/input-set-*.json            datasets sintéticos inmutables
medicion/run-logs/{caso}/*.csv                       registro de corridas
medicion/analizar_runlogs.py                         análisis visual de run-logs → reporte HTML interactivo
medicion/cr-logs/{caso}/*.csv                        registro de Change Requests
docs/microframework-v1.0.md                          entregable R1 — documento consolidado del micro-framework
microframework/                                      reglas, patrones, antipatrones, checklists, plantillas, convenciones
microframework/guia-observabilidad.md                Pilar 3 DevSecOps — contrato de logs estructurados por etapa
microframework/contratos/                            JSON Schemas de contratos E/S por etapa (Bot e IoT)
microframework/validacion/validar-flujos.mjs         Pilar 2 DevSecOps — script de validación estática REG-001…010
microframework/adr/ADR-MF-*.md                       ADRs a nivel de framework (REG-001, REG-003, REG-006)
microframework/patrones/                             5 patrones: retry, idempotencia, circuit-breaker, error-boundary, saga
docs/context/fundamento-teorico.md                   Base conceptual: Clean Architecture, NIST SSDF, literatura LC/NC
docs/context/atam-utility-tree.md                    Utility Tree ATAM: 12 escenarios top-K con medidas de respuesta
docs/protocolo-mttd.md                               Protocolo de medición MTTD — reproducible, meta < 60 segundos
docs/context/justificacion-casos-de-estudio.md       Taxonomía LC/NC y representatividad formal de Bot e IoT
docs/context/justificacion-rediseno-asis.md          Validez metodológica del rediseño intencional del as-is
```
