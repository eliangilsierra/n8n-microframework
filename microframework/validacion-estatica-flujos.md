# Validación estática de flujos n8n

Pilar 2 de DevSecOps del micro-framework (§4.3 del anteproyecto: "Validaciones
Automatizadas — Implementación de análisis estáticos sobre la estructura de los flujos
dentro del pipeline de despliegue").

Este documento especifica **el qué** del análisis estático: las reglas y antipatrones que
se verifican sobre el JSON exportado de n8n. El **cómo técnico** (arquitectura, comandos,
salidas, tests) está en [`microframework/validacion/README.md`](validacion/README.md).

---

## Objetivo

Automatizar la verificación del checklist de arquitectura y del checklist DevSecOps sobre
los archivos JSON versionados, convirtiendo cada regla en un predicado evaluable contra el
**grafo dirigido del flujo** (no contra el texto del JSON). El resultado alimenta:

- `% cumplimiento checklist` (meta ≥ 90 % en to-be) — meta superada: corrida actual a 84 %.
- Evidencia para la matriz de trazabilidad del caso (regla → ISO 25010 → ATAM → ADR).
- Detección temprana de regresiones al versionar cambios en los flujos.
- Cobertura del propio micro-framework (qué reglas están dormidas en el corpus).

---

## Alcance

Por defecto se validan los archivos en:

- `casos-de-estudio/{caso}/{as-is,to-be}/*.json`
- `microframework/plantillas/*.json`

Adicionalmente, **v2 permite analizar cualquier JSON de n8n** mediante el flag `--input
<ruta>` — la clasificación E1–E4 ya no depende del nombre del archivo sino del tipo de
nodo, lo que abre el alcance a flujos externos al repo.

El validador es **tolerante con el as-is**: reporta cada violación pero no afecta el exit
code. Para el to-be la salida es exit 1 si alguna regla obligatoria queda en `error`.

---

## Catálogo de 17 reglas

11 reglas obligatorias del anteproyecto (REG-001…REG-VOC) + 6 antipatrones detectados como
queries sobre el grafo (AP-001…AP-006).

### Reglas obligatorias (REG-*)

| Regla | Verificación estática | Cómo se evalúa |
|---|---|---|
| **REG-001** | Sin credenciales hardcodeadas | Patrones literales en `parameters` (`Bearer`, `sk-`, `ghp_`); variables `token`/`api_key`/`password`/`secret` con valor literal; headers HTTP `x-api-key`/`authorization` con valor literal (chequeo estructurado, no regex sobre el JSON serializado). |
| **REG-002** | `run_id` propagado | Algún nodo Code declara `run_id` y emite `console.log(JSON.stringify({run_id, ...}))`. Orquestador puro (sólo `Execute Workflow` + `respondToWebhook`) recibe N/A — `run_id` se delega al subflujo E1. |
| **REG-003** | `errorWorkflow` configurado | En orquestadores (por nombre o por composición: webhook + executeWorkflow + responder), `settings.errorWorkflow` debe estar definido y no vacío. |
| **REG-004** | Retry habilitado en HTTP | Todo nodo `httpRequest` debe tener `parameters.options.retry.enabled === true` y `maxRetries ≥ 2`. |
| **REG-005** | Idempotencia en escrituras | Todo nodo `postgres` con `operation: insert` debe contener `ON CONFLICT` o `idempotency_key`. Los error handlers están exentos (cada evento es único). |
| **REG-006** | Log estructurado por etapa | Cada nodo Code debe emitir al menos un `console.log(JSON.stringify(...))` con los campos `run_id`, `etapa`, `status`. |
| **REG-007** | Dominio aislado | Archivos `*-e2-dominio.json` no deben contener nodos `httpRequest` ni `postgres`. |
| **REG-008** | Integraciones en E3/E4 | Nodos IO sólo en archivos `*-e3-*`, `*-e4-*`, `*-orquestador` o `*-error-handler`. |
| **REG-009** | Status codes HTTP apropiados | Orquestadores deben usar al menos dos `responseCode` distintos (éxito + error). |
| **REG-010** | ADR presente | El caso (`casos-de-estudio/{caso}/adr/`) contiene al menos un `ADR-*.md`. |
| **REG-VOC** | Vocabulario enum `nivel` en español | Detecta uso de `warning`/`critical` en código JS de nodos Code en flujos to-be; el enum oficial es `{ "normal", "advertencia", "critico" }`. |

### Antipatrones (AP-*) — queries sobre el grafo

Las AP-* operan sobre la estructura `(nodes, edges, subflowRefs)` del grafo dirigido,
no sobre patrones de texto.

| Antipatrón | Query | Severidad |
|---|---|---|
| **AP-001 God-node** | Nodo con grado in+out > 6 | warning |
| **AP-002 Chatty IO** | Nodo `httpRequest` cuyo predecesor es un loop (`splitInBatches`, `itemLists`, `foreach`) | warning |
| **AP-003 Dual-write** | ≥ 2 nodos de escritura (Postgres/MySQL/MongoDB con INSERT/UPDATE) sin saga/compensación visible | error |
| **AP-004 Exception swallowing** | Nodo con rama `error` que no termina en log estructurado ni re-throw; o `continueOnFail: true` sin `errorWorkflow` global | error |
| **AP-005 Workflow ID no resuelto** | `executeWorkflow` con `workflowId` placeholder (`REEMPLAZAR`, `TODO`, expresión `{{...}}` sin resolver, vacío) | warning |
| **AP-006 Stage leak** | Nodo clasificado como E2 (dominio) que contiene IO detectado por tipo o por `jsCode` con `fetch`/`pg.`/`axios` | error |

---

## Severidad, confianza y mapeo a calidad

Cada finding lleva además de la regla:

- **Severidad**: `error` (bloquea exit 0 en to-be), `warning` (gate sólo con `--strict`),
  `info` (informativo).
- **Confianza**: `high` (match estructural inequívoco), `medium` (heurística con
  posibilidad de falso positivo), `low` (señal débil).
- **Mapeo ISO/IEC 25010**: atributos de calidad afectados (security, reliability,
  maintainability, performanceEfficiency, functionalSuitability, usability).
- **Escenarios ATAM**: IDs de los escenarios Top-K afectados (e.g. `SP-IOT-01`,
  `R-BOT-01`).
- **ADRs vinculados**: decisiones arquitectónicas relacionadas.
- **Sugerencia de fix**: texto humano o `codemodId` aplicable con `--fix` (sólo Pro).

La fuente única del mapeo es
[`microframework/validacion/mapeo-calidad.json`](validacion/mapeo-calidad.json) — alterar
una entrada actualiza simultáneamente la trazabilidad en todos los reportes.

---

## Métricas de calidad del grafo

Para cada flujo el validador calcula:

- **Complejidad ciclomática** = `max(0, E − N + 2P)`.
- **Profundidad máxima**: BFS desde fuentes (in-degree 0).
- **Distribución por etapa**: conteo {E1, E2, E3, E4, UNKNOWN}.
- **Cohesion score** ∈ [0, 1]: proporción de aristas que **no** saltan más de una frontera
  de etapa. Una arquitectura limpia E1→E2→E3→E4 tiene cohesion = 1.0.
- **Fan-out top 5**: nodos con mayor out-degree (candidatos a god-node).

Estas métricas alimentan el radar ISO 25010 del reporte HTML y permiten cuantificar la
mejora del to-be respecto al as-is en el capítulo de evaluación.

---

## Implementación

El análisis está implementado en dos ediciones coexistentes que comparten el modelo
canónico (`microframework/validacion/report.schema.json`):

| | Edición Lite | Edición Pro |
|---|---|---|
| Ubicación | [`microframework/validacion/validar-flujos.mjs`](validacion/validar-flujos.mjs) | [`microframework/validacion-pro/`](validacion-pro/) |
| Forma | Un archivo `.mjs` (~1600 LOC, cero deps) | Módulo con `src/{cli,parser,rules,metrics,fixers,report,shared}` |
| Audiencia | Defensa académica · evaluadores externos | CI/CD del proyecto · adopción externa |
| DSL YAML | — | Sí |
| Codemods | — | `add-http-retry`, `envify-secret`, `add-on-conflict` |

Ambas implementan las mismas 17 reglas. Decisión documentada en
[`ADR-MF-008`](adr/ADR-MF-008-validador-dos-ediciones.md). El detalle de arquitectura,
comandos, salidas y tests está en [`validacion/README.md`](validacion/README.md).

---

## Uso esperado

```bash
# Lite — defensa académica y evaluadores externos
node microframework/validacion/validar-flujos.mjs --format html
node microframework/validacion/validar-flujos.mjs --input ruta/a/flow-externo.json

# Pro — CI/CD del proyecto, adopción externa
node microframework/validacion-pro/bin/n8nmf.mjs analyze
node microframework/validacion-pro/bin/n8nmf.mjs report --format sarif --out reportes
node microframework/validacion-pro/bin/n8nmf.mjs fix --rule REG-004 --dry-run
```

Los reportes se archivan en `microframework/validacion/reportes/` y se referencian en la
matriz de trazabilidad del caso como evidencia del cumplimiento del checklist.

---

## Relación con el anteproyecto

Este artefacto cierra el Pilar 2 de DevSecOps (§4.3) y contribuye a tres resultados:

- **R1** (Micro-framework): el validador forma parte del paquete entregable porque hace
  verificable el criterio binario de cada regla. Esa verificabilidad fue ampliada en v2
  con severidad, confianza, antipatrones de grafo y mapeo automático a ISO 25010.
- **R4** (Protocolo ATAM): provee evidencia reproducible para las métricas de cobertura
  del checklist y de exposición de secretos, citadas en los escenarios Top-K. Cada finding
  cita los escenarios ATAM afectados.
- **R5** (Guía de buenas prácticas): el Cap. 7.4 de la guía referencia los comandos
  esenciales de Lite y Pro como gate del flujo de desarrollo recomendado.

La implementación inicial del script fue una actividad de FASE 3. El refactor a v2 (Lite +
Pro) se completó el 2026-05-31 — ver [`estado-actual.md`](../estado-actual.md) §
"Validador estático v2".
