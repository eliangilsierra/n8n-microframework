# Validador estático v2 — features y ventajas

Documento de presentación de las capacidades del validador estático del micro-framework
LC/NC para n8n, en sus dos ediciones coexistentes **Lite** y **Pro**. Pensado como
referencia rápida para la defensa, el capítulo de evaluación y la difusión externa.

> Documentación técnica completa en [`microframework/validacion/README.md`](../microframework/validacion/README.md).
> Decisión arquitectónica de las dos ediciones: [`ADR-MF-008`](../microframework/adr/ADR-MF-008-validador-dos-ediciones.md).
> Versión anterior conservada en [`microframework/validacion/legacy/`](../microframework/validacion/legacy/).

---

## TL;DR — qué cambió frente a v1

> Un *linter* booleano de 11 reglas con salida Markdown plana se convirtió en un
> **analizador estático de grafos de flujo n8n**, multi-formato, con DSL YAML extensible,
> codemods automáticos, integración SARIF + GitHub Code Scanning, suite de tests y un
> reporte HTML offline interactivo de calidad de tesis.

| | **v1 (legacy)** | **v2 (Lite + Pro)** |
|---|---|---|
| Análisis | Regex sobre texto JSON serializado | **Grafo dirigido tipado** a partir de `nodes` + `connections` |
| Etapas E1–E4 | Por nombre de archivo (acoplado al repo) | **Por tipo de nodo** (heurística — analiza cualquier JSON) |
| Reglas | 11 REG-* booleanas | **17**: 11 REG-* + 6 antipatrones AP-* |
| Resultado | `cumple: true \| false \| null` | **Severidad** (error/warning/info) × **confianza** (high/medium/low) |
| Métricas | — | Ciclomática · profundidad · cohesion score · fan-out · distribución E1–E4 |
| Mapeo ISO/ATAM/ADR | En PDFs externos | **Inyectado en cada finding** (matriz de trazabilidad viva) |
| Salidas | md, json | md · json canónico · **html offline interactivo** · **sarif v2.1.0** · junit |
| Diff | — | Contra baseline JSON: nuevos / resueltos / regresiones |
| Reglas de usuario | — | **DSL YAML** (Pro) — Semgrep/OPA aplicado a n8n |
| Remediación automática | — | **3 codemods `--fix`** idempotentes (Pro) |
| CI/CD | Exit code | Exit code + **SARIF inline en PRs de GitHub** |
| Tests del propio validador | — | Runner artesanal (Lite) + **vitest** (Pro) |

---

## 1. Análisis basado en grafo, no en texto

v1 hacía `JSON.stringify(node.parameters)` y aplicaba regex. v2 reconstruye el **grafo
dirigido** del flujo:

- **Nodos tipados** con `inDegree`, `outDegree`, etapa inferida E1–E4, posición canvas.
- **Aristas con rama** `main` o `error` (n8n permite ambas).
- **Referencias a subflujos** resueltas desde nodos `Execute Workflow`.

Toda regla y todo antipatrón opera sobre esa estructura — no sobre regex.

**Ventaja concreta:** detecta cosas que v1 jamás podría:

- *God-node*: nodo con grado in+out > 6 (mala descomposición).
- *Chatty IO*: HTTP cuyo predecesor es un loop (`splitInBatches`, `itemLists`).
- *Dual-write sin saga*: dos escrituras a BD sin patrón de compensación visible.
- *Exception swallowing*: rama error que no termina en log/throw, o `continueOnFail: true`
  sin `errorWorkflow` global.
- *Stage leak*: nodo Code clasificado como E2 cuyo `jsCode` contiene `fetch`/`pg.`/`axios`
  (IO oculto en la capa de dominio).

---

## 2. Independencia del repositorio

v1 dependía críticamente del nombre del archivo (`-e2-dominio`, `orquestador`, `-e3-`,
`error-handler`). Un flujo externo con nombre arbitrario perdía cobertura.

**v2 infiere las etapas E1–E4 desde el tipo del nodo** mediante una cascada de
heurísticas (primer match gana):

1. Anotación explícita en el nombre del nodo (`-e1`, `-e2`, …) → autoritativa.
2. `webhook`/`trigger` → E1.
3. `respondToWebhook` → E4.
4. IO típico (httpRequest, postgres, mysql, mongodb, redis, kafka, mqtt, …) → E3.
5. Code/Function con `fetch`/`axios`/`pg.` en `jsCode` → E3 (stage leak).
6. Code/Function sin IO → E2.
7. Set/IF/Switch/Merge → E2.

**Ventaja concreta:** `node validar-flujos.mjs --input cualquier-flujo.json` produce un
reporte útil sin convención de nombres. El micro-framework deja de ser sólo evaluable
dentro del repo de tesis y se vuelve aplicable a flujos de cualquier equipo.

---

## 3. Severidad, confianza y mapeo automático

Cada finding lleva:

```json
{
  "ruleId": "REG-005",
  "ruleName": "Idempotencia en escrituras",
  "severity": "error",
  "confidence": "high",
  "nodeName": "Insertar lectura sensor",
  "message": "INSERT sin ON CONFLICT ni idempotency_key",
  "evidence": "INSERT INTO lecturas_sensor (id, valor) VALUES ($1, $2)",
  "iso25010": ["reliability", "functionalSuitability"],
  "atamScenarios": ["SP-BOT-01", "NR-IOT-02"],
  "adr": [],
  "fixSuggestion": {
    "kind": "codemod-id",
    "codemodId": "add-on-conflict",
    "preview": "Agregar ON CONFLICT (id) DO NOTHING"
  }
}
```

La fuente del mapeo es [`mapeo-calidad.json`](../microframework/validacion/mapeo-calidad.json)
— editar una entrada actualiza simultáneamente todos los reportes futuros.

**Ventajas concretas:**

- **Priorización real**: un `error · high` antes que un `warning · medium`.
- **Matriz de trazabilidad viva**: la columna ISO 25010 y la columna ATAM ya no
  son un PDF — están en cada finding del JSON.
- **Defensa preparada**: para cualquier hallazgo del reporte se puede responder en
  vivo "este finding afecta `reliability` ISO 25010 y el escenario ATAM `SP-BOT-01`".

---

## 4. Métricas de calidad cuantificadas

Para cada flujo se calculan:

| Métrica | Fórmula | Para qué sirve |
|---|---|---|
| **Complejidad ciclomática** | `max(0, E − N + 2P)` (P = componentes conexos) | Comparable con complejidad de funciones — discutible en defensa |
| **Profundidad máxima** | BFS desde fuentes (in-degree 0) | Indica path crítico del flujo |
| **Distribución por etapa** | Conteo {E1, E2, E3, E4, UNKNOWN} | Visualiza desbalance arquitectónico |
| **Cohesion score** ∈ [0,1] | Aristas que **no** saltan más de una etapa / total | Una arquitectura limpia E1→E2→E3→E4 tiene cohesion = 1.0 |
| **Fan-out top 5** | Nodos con mayor out-degree | Candidatos a god-node |

**Ventaja concreta:** se puede cuantificar la mejora del to-be vs as-is en métricas
duras, no sólo en "% de checklist". El radar ISO 25010 del HTML se alimenta de aquí.

---

## 5. Reporte HTML interactivo — Lite, **autocontenido y offline**

Un solo archivo `.html` de ~200 KB. **0 URLs externas. 0 `<script src>`.** Todo embebido
inline. Abre en cualquier navegador sin red.

Secciones:

- **Portada académica** con autor, director, proyecto, fecha ISO, hash del commit, conteo
  de flujos analizados. Imprimible como anexo de la tesis (`@media print` integrado).
- **Resumen ejecutivo**: 6 KPIs (flujos, score promedio, errors, warnings, findings,
  reglas dormidas).
- **Radar ISO/IEC 25010** como SVG polígono — findings agregados por atributo de calidad.
- **Cobertura del micro-framework**: qué reglas activó al menos un flujo y cuáles quedaron
  *dormidas* (gap de evidencia).
- **Sparkline histórico** — lee los `validacion-YYYY-MM-DD.json` previos y grafica score
  promedio por fecha. **Demuestra mejora continua, no foto.**
- **Tabla de findings filtrable** por severidad y texto libre, ordenable, exportable a CSV.
- **Diagrama SVG del flujo** por cada archivo, con nodos coloreados por etapa (E1 azul,
  E2 verde, E3 ámbar, E4 púrpura). Borde rojo = nodo con `error`, ámbar = `warning`.
- **Panel "explica este finding"**: click en un nodo del diagrama → tarjeta con cita
  textual del parámetro ofensor, regla violada, atributos ISO 25010, escenarios ATAM,
  ADRs vinculados y sugerencia de fix.

**Ventaja concreta para la defensa:** ese HTML es **el** artefacto visual de venta. Funciona
en una laptop desconectada de internet, con tipografía oscura sobria, y se puede imprimir
como anexo del documento de tesis.

### Pro — HTML CDN con Mermaid + Chart.js

Misma información, pero con grafo Mermaid (curvas dagre) y radar Chart.js (animación,
hover interactivo). Requiere red al abrir. Adecuado para demos públicas.

---

## 6. Detección de antipatrones de grafo (los 6 nuevos)

Las AP-* son la novedad técnica más relevante. Cada una es una *query* sobre el grafo:

| AP | Cómo se detecta | Por qué importa |
|---|---|---|
| **AP-001 God-node** | `node.inDegree + node.outDegree > 6` | Mala descomposición — viola maintainability |
| **AP-002 Chatty IO** | HTTP cuyo predecesor es `splitInBatches`/`itemLists`/`loop`/`foreach` | N+1 problem — viola performanceEfficiency |
| **AP-003 Dual-write** | ≥ 2 nodos Postgres/MySQL/MongoDB con INSERT/UPDATE sin `saga`/`compensat`/`begin transaction`/`commit` | Inconsistencia eventual no controlada — viola reliability |
| **AP-004 Exception swallowing** | Rama `error` sin log/throw downstream; o `continueOnFail` sin `errorWorkflow` global | Errores silenciados — viola reliability + maintainability |
| **AP-005 Workflow ID no resuelto** | `executeWorkflow` con `workflowId` placeholder (`REEMPLAZAR`, `TODO`, `{{...}}` no resuelto, vacío) | Flujo no portable — viola maintainability + portability |
| **AP-006 Stage leak** | Nodo clasificado E2 con IO detectado por tipo o por `jsCode` con `fetch`/`pg.` | Capa de dominio rota — viola maintainability |

**Ventaja concreta:** ninguno de estos antipatrones es detectable con regex sobre
texto. Requieren razonar sobre la topología del flujo — y eso es exactamente lo que un
evaluador de maestría espera ver de una herramienta del Pilar 2 DevSecOps.

---

## 7. DSL YAML de reglas custom (edición Pro)

Cualquiera define reglas adicionales en YAML. No hace falta editar el código del
validador. Inspirado en Semgrep / OPA.

```yaml
id: CUSTOM-001
name: Prohibir Postgres en E1 (entrada)
severity: error
confidence: high
iso25010: [maintainability, security]
atam: [SP-IOT-01]
match:
  stage: E1
  nodeType: postgres
assert:
  not: true
message: "Postgres detectado en E1 — mover a un subflujo E3 dedicado a IO."
fix:
  hint: "Extraer este nodo a un subflujo Execute Workflow → E3 Adaptador."
```

Selectores `match` disponibles: `stage`, `nodeType` (regex), `nameRegex`, `paramPath`,
`incomingEdges`, `outgoingEdges`, `inSubgraphWith`.
Aserciones `assert` disponibles: `not`, `exists`, `equals`, `regex`.

**Ventajas concretas:**

- Convierte el validador en un **framework de validación**, no un script cerrado.
- Cada equipo adoptante codifica sus propias políticas internas sin tocar Node.js.
- Contribución publicable: aplicar Semgrep-style policy-as-code al dominio LC/NC es novel.

---

## 8. Codemods `--fix` automáticos (edición Pro)

Tres remediaciones automáticas, **idempotentes** (aplicarlas dos veces no rompe nada):

| Codemod | Regla | Acción |
|---|---|---|
| `add-http-retry` | REG-004 | Inyecta `options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }` |
| `envify-secret` | REG-001 | Header literal `x-api-key: sk-...` → `={{ $env.X_API_KEY }}` |
| `add-on-conflict` | REG-005 | `INSERT INTO ... VALUES (...)` → `... ON CONFLICT (id) DO NOTHING` |

```bash
n8nmf fix --rule REG-004 --dry-run   # vista previa del patch
n8nmf fix --rule REG-004              # aplicar
```

**Ventaja concreta:** demuestra que el micro-framework es **operable, no sólo
documental**. El evaluador puede ver un patch JSON y aplicarlo en su instancia n8n local.

---

## 9. Integración CI/CD — SARIF + GitHub Code Scanning

Pro produce SARIF v2.1.0 con:

- `runs[].tool.driver.rules[]` — catálogo de 17+ reglas con metadata.
- `runs[].results[]` — findings con `level`, ubicación y propiedades extendidas
  (`iso25010`, `atam`, `adr`, `confidence`, `evidence`).

Workflow ejemplo en
[`microframework/validacion-pro/docs/sarif-github.md`](../microframework/validacion-pro/docs/sarif-github.md):

```yaml
- run: node microframework/validacion-pro/bin/n8nmf.mjs report --format sarif --out ./sarif
- uses: github/codeql-action/upload-sarif@v3
  with: { sarif_file: ./sarif/validacion-*.sarif, category: n8n-microframework }
```

**Ventaja concreta:** los findings aparecen como **anotaciones inline en los PRs** y en
la pestaña Security → Code scanning alerts. Para mostrar en defensa: un PR del repo con
findings inline = imagen muy convincente del rigor DevSecOps.

---

## 10. Suite de tests del propio validador

v1 no tenía tests.

### Lite — runner artesanal, sin dependencias

`microframework/validacion/tests/fixtures/` contiene 6 carpetas con un JSON de 3–5 nodos
y un `expected.json` paralelo:

```
fixtures/
├── reg-001-secret-literal/
├── reg-004-sin-retry/
├── reg-005-insert-sin-onconflict/
├── reg-006-log-no-estructurado/
├── ap-001-god-node/
└── baseline-conforme/
```

`tests/run-tests.mjs` ejecuta cada fixture y compara los `ruleId` esperados contra los
emitidos. **Estado actual: 6/6 pass.**

### Pro — vitest

`microframework/validacion-pro/tests/` con cobertura objetivo ≥ 85 % en parser y rules:

- `parser.test.mjs` — build-graph, classify-stage.
- `rules.test.mjs` — reutiliza los mismos fixtures que Lite (cross-edition consistency).
- `dsl.test.mjs` — DSL YAML loader + evaluator.
- `fixers.test.mjs` — codemods idempotentes.
- `render-sarif.test.mjs` — validez del SARIF emitido.

**Ventaja concreta:** demuestra rigor a un evaluador técnico. Cuando se discutan
limitaciones del validador, se puede responder "cada regla está cubierta por un fixture
con expectativa explícita".

---

## 11. Diff contra baseline

Para hacer evolución comparable:

```bash
node microframework/validacion/validar-flujos.mjs --baseline reportes/anterior.json
```

Emite una sección con:

- 🆕 **Nuevos** — findings que no existían en el baseline.
- ✅ **Resueltos** — findings del baseline que ya no aparecen.
- 🔴 **Regresiones** — findings nuevos sobre reglas que el baseline tenía como passed.

**Ventaja concreta:** evita regresiones silenciosas. Útil tanto en CI/CD como en la
narración de la mejora as-is → to-be del capítulo de evaluación.

---

## 12. Cobertura del propio micro-framework

Cada reporte incluye:

```json
"coverage": {
  "rulesDefined": ["REG-001", ..., "AP-006"],
  "rulesExercised": ["REG-001", "REG-004", ...],
  "rulesDormant": ["AP-001", "AP-002", "AP-003", "AP-006"]
}
```

Las **reglas dormidas** son aquellas que ningún flujo del corpus activó.

**Ventaja concreta:** el reporte señala honestamente los huecos de evidencia. Un
evaluador no puede objetar "y la regla AP-003 ¿cómo sabes que funciona?" — el reporte
mismo dice "está dormida, está cubierta por el fixture X, pero ningún flujo del corpus
la dispara hoy".

---

## 13. Formatos de salida — 5 en uno

Una sola ejecución produce:

| Formato | Uso |
|---|---|
| **md** | Reporte humano navegable en GitHub |
| **json canónico** | Alimenta diff, histórico, baseline, integraciones externas |
| **html offline** (Lite) o html CDN (Pro) | Defensa académica / demos públicas |
| **sarif v2.1.0** | GitHub Code Scanning + dashboards externos |
| **junit xml** | Jenkins, GitLab CI tradicionales |

Todos derivan del mismo modelo de datos canónico definido en
[`report.schema.json`](../microframework/validacion/report.schema.json).

---

## 14. Comparativa Lite vs Pro — cuándo usar cada una

| Caso de uso | Edición recomendada |
|---|---|
| **Defensa MGADS en sala** (posiblemente sin internet) | **Lite** — un comando, HTML offline |
| **Evaluador externo reproduciendo** en su máquina | **Lite** — `node validar-flujos.mjs` sin `npm install` |
| **CI/CD del repositorio de tesis** | Lite (gate simple con exit code) o Pro (SARIF) |
| **Equipo externo adoptando el micro-framework** | **Pro** — DSL YAML para reglas internas |
| **GitHub Code Scanning + PRs con findings inline** | **Pro** — SARIF v2.1.0 |
| **Aplicar fixes automáticos con `--fix`** | **Pro** — codemods |
| **Demos públicas / página del proyecto** | **Pro** — HTML CDN más vistoso |
| **Bug fix del rule engine** | Ambas (los algoritmos son paralelos) |

Decisión arquitectónica completa: [`ADR-MF-008`](../microframework/adr/ADR-MF-008-validador-dos-ediciones.md).

---

## 15. Resultados de la corrida final contra el repo

Última ejecución de Lite contra todo el corpus (`casos-de-estudio/` +
`microframework/plantillas/`):

| Métrica | Valor |
|---|---|
| Archivos analizados | 23 (5 as-is + 18 to-be) |
| Score promedio to-be | **84 %** |
| Errors en to-be | **0** |
| Warnings en to-be | 20 |
| Reglas ejercitadas | 13/17 (4 dormidas: AP-001/002/003/006) |
| As-is — score | 18 % (línea base con violaciones intencionales — esperado) |
| Exit code | **0** |
| Tamaño del HTML offline | ~200 KB |
| Tiempo de ejecución | < 2 s para 23 archivos |

Lite sobre el corpus completo en menos de dos segundos, exit 0, HTML autocontenido listo
para imprimir. El reporte está versionado en
`microframework/validacion/reportes/validacion-2026-06-01.html`.

---

## 16. Resumen de ventajas — una línea cada una

- **Analiza cualquier JSON de n8n**, no solo los del repo (clasificación por tipo de nodo, no por nombre).
- **17 reglas** vs 11 — incluye 6 antipatrones de grafo no detectables por regex.
- **Severidad + confianza** por finding — adiós al booleano monolítico.
- **Mapeo ISO 25010 + ATAM + ADR inyectado** — matriz de trazabilidad viva.
- **Métricas cuantitativas** (ciclomática, cohesion, fan-out) para discutir en defensa.
- **HTML offline 100 % autocontenido** (Lite) — abre sin red en la sala de defensa.
- **HTML CDN visualmente rico** (Pro) con Mermaid + Chart.js para demos públicas.
- **DSL YAML de reglas custom** (Pro) — Semgrep/OPA aplicado a n8n.
- **3 codemods idempotentes `--fix`** (Pro) — el micro-framework es operable.
- **SARIF v2.1.0** — findings inline en PRs vía GitHub Code Scanning.
- **5 formatos de salida** desde un único modelo canónico.
- **Diff contra baseline** — evita regresiones silenciosas.
- **Cobertura honesta** del micro-framework — señala reglas dormidas.
- **Suite de tests con fixtures** — Lite (runner artesanal) y Pro (vitest).
- **Cero dependencias runtime** (Lite mantiene el espíritu del v1).
- **Compatibilidad CLI con v1** — `--caso` y `--estado` siguen funcionando.
- **v1 conservada en `legacy/`** — trazabilidad histórica para el documento de tesis.
- **Documentación completa**: README, ADR-MF-008, DSL spec, codemods doc, SARIF-GitHub doc.

---

## Referencias rápidas

| Quiero… | Voy a… |
|---|---|
| Ver el reporte HTML | Abrir `microframework/validacion/reportes/validacion-YYYY-MM-DD.html` |
| Entender la arquitectura técnica | [`microframework/validacion/README.md`](../microframework/validacion/README.md) |
| Entender qué se evalúa y por qué | [`microframework/validacion-estatica-flujos.md`](../microframework/validacion-estatica-flujos.md) |
| Entender por qué hay dos ediciones | [`microframework/adr/ADR-MF-008-validador-dos-ediciones.md`](../microframework/adr/ADR-MF-008-validador-dos-ediciones.md) |
| Escribir una regla custom YAML | [`microframework/validacion-pro/docs/dsl-spec.md`](../microframework/validacion-pro/docs/dsl-spec.md) |
| Conocer los codemods disponibles | [`microframework/validacion-pro/docs/codemods.md`](../microframework/validacion-pro/docs/codemods.md) |
| Configurar GitHub Code Scanning | [`microframework/validacion-pro/docs/sarif-github.md`](../microframework/validacion-pro/docs/sarif-github.md) |
| Ver el catálogo de reglas | [`microframework/reglas/reglas-obligatorias.md`](../microframework/reglas/reglas-obligatorias.md) + [`microframework/antipatrones.md`](../microframework/antipatrones.md) |
| Ver el mapeo regla → calidad | [`microframework/validacion/mapeo-calidad.json`](../microframework/validacion/mapeo-calidad.json) |
| Ver el esquema canónico del reporte | [`microframework/validacion/report.schema.json`](../microframework/validacion/report.schema.json) |
| Ver la guía de adopción | [`docs/guia-buenas-practicas.md §7.4`](guia-buenas-practicas.md) |
