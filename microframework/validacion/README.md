> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# Validador estático de flujos n8n — v2.0

**Componente:** Pilar 2 DevSecOps — Validaciones Automatizadas (§4.3 del anteproyecto)
**Versión:** 2.0 — Edición Lite (`validar-flujos.mjs`) + Edición Pro (`../validacion-pro/`)
**Versión anterior:** 1.x conservada en [`legacy/validar-flujos-v1.mjs`](legacy/validar-flujos-v1.mjs)
**Autor:** Elian Hernando Gil Sierra — MGADS UNAB 2026
**ADR:** [`ADR-MF-008`](../adr/ADR-MF-008-validador-dos-ediciones.md)

---

## Tabla de contenidos

1. [Propósito y rol en el micro-framework](#1-propósito-y-rol-en-el-micro-framework)
2. [Dos ediciones, un modelo de datos](#2-dos-ediciones-un-modelo-de-datos)
3. [Catálogo de 17 reglas](#3-catálogo-de-17-reglas)
4. [Arquitectura técnica](#4-arquitectura-técnica)
5. [Comandos esenciales](#5-comandos-esenciales)
6. [Salidas generadas](#6-salidas-generadas)
7. [Reporte HTML interactivo](#7-reporte-html-interactivo)
8. [Análisis sobre flujos externos arbitrarios](#8-análisis-sobre-flujos-externos-arbitrarios)
9. [DSL YAML de reglas custom (Pro)](#9-dsl-yaml-de-reglas-custom-pro)
10. [Codemods `--fix` (Pro)](#10-codemods---fix-pro)
11. [Integración con CI/CD y SARIF](#11-integración-con-cicd-y-sarif)
12. [Tests del validador](#12-tests-del-validador)
13. [Limitaciones conocidas](#13-limitaciones-conocidas)
14. [Evidencia de ejecución y trazabilidad académica](#14-evidencia-de-ejecución-y-trazabilidad-académica)
15. [Resumen ejecutivo — features y ventajas frente a v1](#15-resumen-ejecutivo--features-y-ventajas-frente-a-v1)

---

## 1. Propósito y rol en el micro-framework

El validador convierte las reglas de diseño del micro-framework — que de otro modo serían
puramente declarativas — en **criterios comprobables automáticamente** sobre el JSON
exportado de cualquier flujo n8n.

n8n no dispone de un motor de política arquitectónica nativo: convenciones como "ningún
nodo hardcodea credenciales" o "E2 no contiene IO" dependerían de la disciplina del
desarrollador. El validador cierra esa brecha: cualquiera ejecuta el comando y obtiene un
reporte cuantificado con severidad, confianza, mapeo a ISO/IEC 25010 y escenarios ATAM
para cada hallazgo.

### Posición en el Pilar 2 DevSecOps

| Pilar | Mecanismo | Verificación |
|---|---|---|
| 1. Gestión de Secretos | Credenciales referenciadas por nombre en n8n | REG-001 + checklist DevSecOps |
| **2. Validaciones Automatizadas** | **Lite + Pro (este documento)** | **17 reglas sobre el grafo del flujo** |
| 3. Resiliencia Operativa | Patrones retry + idempotencia + log estructurado | REG-004, REG-005, REG-006 |

### Rol en la evidencia académica

Los reportes generados constituyen **evidencia documental** del tipo (i) en la
triangulación metodológica del ATAM (`docs/atam/metodologia-atam-adaptada.md`). Cada
reporte JSON canónico (`reportes/validacion-YYYY-MM-DD.json`) es un artefacto auditable y
diffeable que demuestra el nivel de cumplimiento de los flujos to-be en un momento dado.

---

## 2. Dos ediciones, un modelo de datos

Ambas ediciones implementan las **mismas 17 reglas** y producen el **mismo JSON canónico**
(esquema en [`report.schema.json`](report.schema.json)). Difieren en empaquetado, audiencia
y capacidades extra:

|                       | **Edición Lite**                              | **Edición Pro**                                                  |
|-----------------------|-----------------------------------------------|------------------------------------------------------------------|
| Ubicación             | [`validar-flujos.mjs`](validar-flujos.mjs)    | [`../validacion-pro/`](../validacion-pro/)                       |
| Forma                 | Un único archivo `.mjs` (~1600 LOC)           | Módulo `src/{cli,parser,rules,metrics,fixers,report,shared}`     |
| Dependencias runtime  | **Cero** (Node ≥ 18 y nada más)               | Opcional: `yaml` (con fallback inline)                            |
| Dependencias dev      | Ninguna — runner artesanal                    | `vitest`                                                          |
| HTML                  | **Offline autocontenido** (SVG inline ~200 KB) | CDN Tailwind + Mermaid + Chart.js                                 |
| Reglas                | 17 builtins                                   | 17 builtins + **DSL YAML del usuario**                            |
| Codemods `--fix`      | —                                             | `add-http-retry`, `envify-secret`, `add-on-conflict`              |
| Subcomandos           | flags (`--format`, `--baseline`)              | `analyze · report · diff · fix · watch`                           |
| Formatos de salida    | md · json · html · sarif · junit              | md · json · html · sarif · junit                                  |
| Tests                 | runner artesanal + fixtures                   | vitest + fixtures (compartidos con Lite)                          |
| Audiencia recomendada | **Defensa académica · evaluador externo**     | Equipos adoptando el micro-framework · GitHub Code Scanning · demos públicas |

### Qué edición usar

- **Para la defensa MGADS y para que el jurado pueda reproducir en su máquina:** Lite.
  Un solo archivo, `node validar-flujos.mjs --format html` y nada más. El HTML resultante
  abre offline sin red en la sala de defensa.
- **Para CI/CD del proyecto y para equipos externos que adopten el framework:** Pro.
  SARIF para GitHub Code Scanning, DSL YAML para añadir reglas internas, codemods para
  remediar automáticamente.

Esta decisión está documentada en
[`ADR-MF-008-validador-dos-ediciones.md`](../adr/ADR-MF-008-validador-dos-ediciones.md).

---

## 3. Catálogo de 17 reglas

11 reglas obligatorias del anteproyecto (REG-001…REG-VOC) + 6 antipatrones detectados como
queries sobre el grafo (AP-001…AP-006). Cada regla tiene severidad por defecto y mapeo a
ISO 25010 / ATAM / ADR vía [`mapeo-calidad.json`](mapeo-calidad.json).

| ID | Nombre | Severidad | ISO 25010 | Aplica si |
|----|--------|-----------|-----------|-----------|
| **REG-001** | Sin secretos hardcodeados | error | security, maintainability | siempre |
| **REG-002** | `run_id` propagado | warning | maintainability, reliability | hay nodos Code |
| **REG-003** | `errorWorkflow` configurado | error | reliability | flujo es orquestador |
| **REG-004** | Retry ≥ 2 en HTTP | warning | reliability, performanceEfficiency | hay nodos HTTP |
| **REG-005** | Idempotencia en escrituras | error | reliability, functionalSuitability | hay INSERT a Postgres |
| **REG-006** | Log estructurado JSON | warning | maintainability, reliability | hay nodos Code |
| **REG-007** | Dominio aislado (E2 sin IO) | error | maintainability | archivo `-e2-dominio` |
| **REG-008** | Integraciones en E3/E4 | warning | maintainability | hay nodos IO |
| **REG-009** | HTTP status codes apropiados | warning | functionalSuitability, usability | flujo es orquestador |
| **REG-010** | ADR presente | info | maintainability | caso con convención |
| **REG-VOC** | Vocabulario enum `nivel` en español | warning | maintainability, usability | to-be con nodos Code |
| **AP-001** | God-node (grado in+out > 6) | warning | maintainability | siempre |
| **AP-002** | Chatty IO (HTTP dentro de loop) | warning | performanceEfficiency | hay HTTP y loops |
| **AP-003** | Dual-write sin saga/transacción | error | reliability | ≥ 2 escrituras |
| **AP-004** | Exception swallowing | error | reliability, maintainability | hay ramas error |
| **AP-005** | Workflow ID no resuelto en Execute Workflow | warning | maintainability, portability | hay Execute Workflow |
| **AP-006** | Stage leak (IO en nodo E2) | error | maintainability | siempre |

> Cada finding lleva además **confianza** (high/medium/low) y, cuando aplica, una
> **sugerencia de fix** (texto o referencia a codemod). El mapeo regla → ISO/ATAM/ADR se
> resuelve en tiempo de ejecución desde `mapeo-calidad.json`, por lo que reordenar
> atributos en la matriz de trazabilidad no requiere recompilar el validador.

---

## 4. Arquitectura técnica

Cambios fundamentales respecto a v1:

| Aspecto | v1 | v2 (Lite y Pro) |
|---|---|---|
| Análisis | Regex sobre `JSON.stringify(node.parameters)` | Grafo dirigido tipado a partir de `nodes` + `connections` |
| Etapas E1–E4 | Inferidas del **nombre del archivo** | Inferidas del **tipo del nodo** por heurística en cascada |
| Antipatrones | — | 6 queries sobre el grafo (god-node, chatty, dual-write, swallowing, hardcoded ID, stage leak) |
| Métricas | — | Ciclomática, profundidad, fan-out, cohesion score, distribución por etapa |
| Mapeo calidad | Tabla en documentos separados | `mapeo-calidad.json` inyectado en cada finding |
| Resultado | Booleano `cumple: true\|false\|null` | Severidad (error/warning/info) + confianza (high/medium/low) |
| Salidas | md, json | md, **json canónico**, **html offline**, **sarif**, junit |
| Diff | — | Contra baseline JSON: nuevos/resueltos/regresiones |

### Heurística de clasificación E1–E4 (cascada, primer match gana)

1. Nombre del nodo contiene `e1`/`e2`/`e3`/`e4` → respeta la anotación (autoritativa).
2. `type` contiene `webhook` o `trigger` (no `respond`) → **E1**.
3. `type` `respondToWebhook` → **E4**.
4. `type` `executeWorkflow` → **UNKNOWN** (heredaría del subflujo).
5. `type` es un IO (httpRequest, postgres, mysql, mongodb, redis, kafka, mqtt, …) → **E3**.
6. `type` es Code/Function y su `jsCode` contiene `fetch`/`axios`/`pg`/`http.get` → **E3** (stage leak detectable).
7. `type` es Code/Function sin IO → **E2**.
8. `type` es Set/IF/Switch/Merge/ItemLists → **E2**.
9. Default → **UNKNOWN**.

Esto permite analizar **cualquier JSON de n8n**, no sólo los del repositorio.

### Métricas calculadas

- **Complejidad ciclomática**: `max(0, E − N + 2P)` donde `P` es el número de componentes conexos.
- **Profundidad máxima**: BFS desde las fuentes (nodos con in-degree 0).
- **Cohesion score**: proporción de aristas que **no** saltan más de una frontera de etapa
  (E1→E2 cuenta; E1→E4 es leak). Excluye etapas UNKNOWN.
- **Distribución por etapa**: conteo {E1, E2, E3, E4, UNKNOWN}.
- **Fan-out top 5**: nodos con mayor out-degree.

---

## 5. Comandos esenciales

### Lite (un solo archivo, cero deps)

```bash
# Reporte completo: md + json + html offline + sarif + xml junit
node microframework/validacion/validar-flujos.mjs --format html

# Verificación rápida — exit 0 si to-be sin errors, 1 si hay errors
node microframework/validacion/validar-flujos.mjs

# Filtrar por caso/estado (compatibilidad con v1)
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be

# Analizar un flujo n8n arbitrario fuera del repo
node microframework/validacion/validar-flujos.mjs --input ruta/a/mi-flow.json --format html

# Diff contra un baseline previo
node microframework/validacion/validar-flujos.mjs --baseline reportes/validacion-2026-05-31.json

# Sólo json a stdout (sin escribir archivos)
node microframework/validacion/validar-flujos.mjs --format json --quiet

# Reportes en inglés (default: es)
node microframework/validacion/validar-flujos.mjs --format html --lang en

# Tests del validador
node microframework/validacion/tests/run-tests.mjs
```

Flags disponibles: `--input`, `--caso`, `--estado`, `--format`, `--out`, `--baseline`,
`--strict` (exit 1 también ante warnings), `--quiet`, `--lang es|en` (idioma de mensajes
y reportes, default `es`), `--help`.

Los mensajes de reglas, ayuda de CLI y los 5 formatos de reporte (md/json/html/sarif/junit)
son bilingües. El módulo `i18n.mjs` carga `locales/{es,en}.json`; `mapeo-calidad.json`
declara el nombre de cada regla como `{ es, en }` inline (fuente única para Lite y Pro).

### Pro (módulo con subcomandos)

```bash
cd microframework/validacion-pro
npm install                                                # opcional

node bin/n8nmf.mjs analyze                                 # tabla resumen + exit code
node bin/n8nmf.mjs report --format html --out ./reportes   # HTML CDN
node bin/n8nmf.mjs report --format sarif --out ./reportes  # SARIF v2.1.0 para GitHub
node bin/n8nmf.mjs diff --current hoy.json --baseline ayer.json
node bin/n8nmf.mjs fix --rule REG-004 --dry-run            # vista previa codemod
node bin/n8nmf.mjs fix --rule REG-001                      # aplicar codemod
node bin/n8nmf.mjs watch                                   # re-analizar al detectar mtime
node bin/n8nmf.mjs analyze --rules-dir ./rules-custom      # cargar reglas YAML

npm test                                                    # vitest
```

---

## 6. Salidas generadas

Por defecto se escriben en `microframework/validacion/reportes/` (Lite) o `./reportes/`
(Pro). El `--out <dir>` redirige.

| Archivo | Cuándo | Propósito |
|---|---|---|
| `validacion-YYYY-MM-DD.md`     | `--format md` (default)  | Reporte humano, navegable por GitHub |
| `validacion-YYYY-MM-DD.json`   | siempre que se escribe md o html | **Canónico** — alimenta diff, histórico y baseline |
| `validacion-YYYY-MM-DD.html`   | `--format html`          | Reporte interactivo (ver §7) |
| `validacion-YYYY-MM-DD.sarif`  | `--format sarif`         | Para GitHub Code Scanning / dashboards externos |
| `validacion-YYYY-MM-DD.xml`    | `--format junit`         | JUnit XML para CI tradicionales (Jenkins, GitLab) |

### Exit code

| Código | Significado |
|---|---|
| `0` | Ningún flujo `to-be` tiene findings de severidad `error` (warnings permitidos) |
| `1` | Al menos un `to-be` tiene un `error` — o un `warning` si se pasó `--strict` |

Los flujos `as-is` pueden tener errors sin afectar el exit code: documentan la línea base
intencional.

### JSON canónico — esquema

Validado contra [`report.schema.json`](report.schema.json). Estructura resumida:

```jsonc
{
  "tool": "n8n-microframework-validator",
  "version": "2.0.0",
  "edition": "lite" | "pro",
  "generatedAt": "ISO-8601",
  "commit": "<git rev-parse HEAD>",
  "author": "Elian Hernando Gil Sierra",
  "director": "Sebastian Roa Prada, PhD",
  "files": [
    {
      "path": "...", "caso": "bot|iot|plantilla", "estado": "as-is|to-be",
      "graph": { "nodes": [...], "edges": [...], "subflowRefs": [...] },
      "metrics": { "nodeCount", "edgeCount", "cyclomaticComplexity",
                   "maxDepth", "stageDistribution", "cohesionScore", "fanOutTop" },
      "findings": [
        { "id", "ruleId", "ruleName", "severity", "confidence",
          "nodeId", "nodeName", "position", "message", "evidence",
          "iso25010": [...], "atamScenarios": [...], "adr": [...],
          "fixSuggestion": { "kind", "codemodId", "preview" } }
      ],
      "summary": { "errors", "warnings", "infos", "score",
                   "rulesApplicable", "rulesPassed" }
    }
  ],
  "coverage": { "rulesDefined": [...], "rulesExercised": [...], "rulesDormant": [...] },
  "history": [{ "date", "score", "errors", "warnings" }]
}
```

---

## 7. Reporte HTML interactivo

El HTML generado con `--format html` es el artefacto visual del entregable. Diseñado para
imprimirse como anexo del documento de tesis (`@media print` ajusta colores y bordes).

### Lite — autocontenido, offline, ~200 KB

- 0 URLs externas. 0 `<script src>`. Todo CSS y JS embebido inline.
- Grafo de cada flujo como **SVG construido a partir de `node.position`** (las coordenadas
  que n8n ya guarda). Sin Mermaid.
- Radar ISO/IEC 25010 como SVG polígono. Sin Chart.js.
- Sparkline histórico (score promedio por fecha) como SVG polyline. Lee los JSON previos
  de `reportes/`.
- Tabla de findings filtrable por severidad y texto, ordenable, exportable a CSV.
- Panel **"explica este finding"**: click en un nodo → cita textual del parámetro
  ofensor, regla violada, ISO 25010 + ATAM + ADR vinculados, sugerencia de fix.
- Portada académica con autor, director, proyecto, fecha, hash del commit, conteo de flujos.

### Pro — CDN con visualizaciones de nivel comercial

Mismo contenido lógico que Lite, pero usando Mermaid para grafos (renderizado con curvas
y dagre layout) y Chart.js para el radar (animado, hover interactivo). Requiere red al
abrir el HTML.

---

## 8. Análisis sobre flujos externos arbitrarios

El validador v1 estaba acoplado a la convención de nombres del repositorio. **v2 analiza
cualquier JSON de n8n** porque la clasificación E1–E4 es por tipo de nodo, no por nombre
de archivo.

**Lite:**
```bash
node microframework/validacion/validar-flujos.mjs --input /ruta/mi-flow.json --format html
```

**Pro:**
```bash
node microframework/validacion-pro/bin/n8nmf.mjs analyze /ruta/mi-flow.json
node microframework/validacion-pro/bin/n8nmf.mjs report /ruta/al/repo/ --format html --out ./out
```

Para obtener cobertura plena de REG-007 (E2 sin IO), basta con que **algún nodo** tenga el
nombre `*-e2-*` o sea clasificado E2 por la heurística. REG-010 (ADR presente) sí requiere
la convención `casos-de-estudio/{caso}/adr/` — para casos arbitrarios devuelve N/A.

---

## 9. DSL YAML de reglas custom (Pro)

Pro permite escribir reglas declarativas en YAML — convierte el validador en un *framework
de validación*, no un script cerrado. Inspirado en Semgrep / OPA aplicado al dominio n8n.

Ejemplo: prohibir nodos Postgres en la etapa E1 de entrada.

```yaml
id: CUSTOM-001
name: Prohibir Postgres en E1
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

Colócalo en `microframework/validacion-pro/rules-custom/` y ejecuta:

```bash
node bin/n8nmf.mjs analyze --rules-dir ./rules-custom
```

Gramática completa: [`validacion-pro/docs/dsl-spec.md`](../validacion-pro/docs/dsl-spec.md).

---

## 10. Codemods `--fix` (Pro)

Pro incluye tres codemods idempotentes que remedian automáticamente los findings más
mecánicos:

| Codemod | Regla | Acción |
|---|---|---|
| `add-http-retry` | REG-004 | Inyecta `options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }` en nodos HTTP sin retry o con `maxRetries < 2`. |
| `envify-secret` | REG-001 | Reemplaza valor literal de headers `x-api-key` / `authorization` / `api-key` / `x-auth-token` por la expresión n8n `={{ $env.<VAR> }}`. No toca código JS por riesgo semántico. |
| `add-on-conflict` | REG-005 | Anexa ` ON CONFLICT (id) DO NOTHING` a queries `INSERT INTO ...` sin idempotencia. |

```bash
node bin/n8nmf.mjs fix --rule REG-004 --dry-run   # vista previa
node bin/n8nmf.mjs fix --rule REG-004              # aplicar
```

Detalle: [`validacion-pro/docs/codemods.md`](../validacion-pro/docs/codemods.md).

---

## 11. Integración con CI/CD y SARIF

### Lite — gate simple en cualquier CI

```yaml
- name: Validar flujos n8n
  run: node microframework/validacion/validar-flujos.mjs --strict
```

Exit code 0/1 cierra el pipeline cuando hay errors (o warnings con `--strict`).

### Pro — GitHub Code Scanning con SARIF

`render-sarif.mjs` produce SARIF v2.1.0 con `runs[].tool.driver.rules[]` derivados del
catálogo, y `runs[].results[]` derivados de findings (incluyendo `properties.iso25010`,
`properties.atam`, `properties.adr` para dashboards externos).

Workflow ejemplo en [`validacion-pro/docs/sarif-github.md`](../validacion-pro/docs/sarif-github.md).
Una vez subido con `github/codeql-action/upload-sarif@v3`, los findings aparecen como
anotaciones inline en los PRs y en la pestaña Security → Code scanning alerts.

---

## 12. Tests del validador

### Lite — runner artesanal sin dependencias

```bash
node microframework/validacion/tests/run-tests.mjs
```

Recorre [`tests/fixtures/`](tests/fixtures/) (un JSON mínimo por antipatrón con su
`expected.json` paralelo), ejecuta el validador y compara los `ruleId` esperados contra
los emitidos.

Estado actual: **6/6 pass** (reg-001, reg-004, reg-005, reg-006, ap-001, baseline-conforme).

### Pro — vitest

```bash
cd microframework/validacion-pro
npm install
npm test
```

Suite: `parser.test.mjs` · `rules.test.mjs` (reutiliza los mismos fixtures que Lite) ·
`dsl.test.mjs` · `fixers.test.mjs` · `render-sarif.test.mjs`.

---

## 13. Limitaciones conocidas

### 13.1 Análisis léxico-estructural, no semántico

- **REG-001**: no detecta secretos construidos dinámicamente por concatenación dentro de
  un nodo Code. Análisis sobre literales en el JSON.
- **REG-002**: confirma presencia de `run_id` en el código; no verifica que el valor se
  propague correctamente en runtime.
- **REG-004**: lee la configuración del nodo; no detecta retry deshabilitado por una
  expresión dinámica de n8n.

### 13.2 REG-010 verifica presencia, no calidad del ADR

Confirma que existe `casos-de-estudio/{caso}/adr/ADR-*.md`. No valida estructura ni
coherencia del ADR con el flujo.

### 13.3 REG-009 cuenta códigos distintos, no semántica HTTP

Verifica ≥ 2 `responseCode` distintos. Un orquestador con `200` + `201` pasa la regla
aunque ambos sean respuestas de éxito.

### 13.4 Resolución de subflujos referenciados

`Execute Workflow` con `workflowId` no resuelto se reporta como **AP-005**. La resolución
contra archivos del workspace está reservada para versiones futuras.

### 13.5 Un reporte por día

Granularidad de fecha (`validacion-YYYY-MM-DD.*`). Múltiples ejecuciones el mismo día
sobrescriben. Para histórico, los reportes anteriores se versionan en Git o se renombran
manualmente.

---

## 14. Evidencia de ejecución y trazabilidad académica

### Reportes versionados como evidencia

| Reporte | Versión | Notas |
|---|---|---|
| [`reportes/validacion-2026-05-02.md`](reportes/validacion-2026-05-02.md) | v1 | IoT as-is + to-be primeros subflujos — línea base |
| [`reportes/validacion-2026-05-03.md`](reportes/validacion-2026-05-03.md) | v1 | IoT to-be completo — REG-VOC corregido |
| [`reportes/validacion-2026-05-06.md`](reportes/validacion-2026-05-06.md) | v1 | 6 flujos IoT to-be — 100% en todas las reglas v1 |
| `reportes/validacion-YYYY-MM-DD.html` (último) | **v2 Lite** | 23 archivos, to-be score 84%, 0 errors, 4 reglas dormidas |

### Trazabilidad

| Artefacto | Referencia |
|---|---|
| Reglas obligatorias | [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.md) |
| Antipatrones (catálogo) | [`microframework/antipatrones.md`](../antipatrones.md) |
| Mapeo regla → ISO/ATAM/ADR | [`mapeo-calidad.json`](mapeo-calidad.json) |
| Esquema canónico del reporte | [`report.schema.json`](report.schema.json) |
| Decisión Lite + Pro | [`ADR-MF-008-validador-dos-ediciones.md`](../adr/ADR-MF-008-validador-dos-ediciones.md) |
| Pilar 2 DevSecOps | [`docs/context/microframework-spec.md §DevSecOps`](../../docs/context/microframework-spec.md) |
| Rol en evidencia ATAM | [`docs/atam/metodologia-atam-adaptada.md`](../../docs/atam/metodologia-atam-adaptada.md) |
| Entregable R1 del anteproyecto | [`docs/microframework-v1.0.md`](../../docs/microframework-v1.0.md) |
| Guía de buenas prácticas (Cap. 7.4) | [`docs/guia-buenas-practicas.md`](../../docs/guia-buenas-practicas.md) |
| Spec independiente del análisis estático | [`microframework/validacion-estatica-flujos.md`](../validacion-estatica-flujos.md) |

### Por qué Node.js sigue siendo la implementación elegida (heredado de v1)

Cohesión tecnológica con n8n (JS nativo), cero dependencias runtime, disponibilidad
garantizada en CI donde corre n8n, separación de responsabilidades con los scripts Python
de medición, portabilidad para evaluadores externos. Justificación completa en el
[ADR-MF-008 §3](../adr/ADR-MF-008-validador-dos-ediciones.md) y, para la decisión original
Node vs Python en cinco subsecciones, en la versión v1 de este README (conservada en
[`legacy/README-v1.md §2`](legacy/README-v1.md)).

---

## 15. Resumen ejecutivo — features y ventajas frente a v1

> Apéndice de referencia rápida para la defensa, el capítulo de evaluación y la difusión
> externa. Complementa el detalle técnico de las secciones 1–14 con una vista ejecutiva:
> qué cambió frente a v1, cuándo usar cada edición, y evidencia concreta de la última
> corrida contra el corpus completo.

### 15.1 TL;DR — qué cambió frente a v1

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

### 15.2 Comparativa Lite vs Pro — cuándo usar cada una

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

Decisión arquitectónica completa: [`ADR-MF-008`](../adr/ADR-MF-008-validador-dos-ediciones.md).

### 15.3 Resultados de la corrida final contra el repo

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

### 15.4 Resumen de ventajas — una línea cada una

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
- **Documentación completa**: este README, ADR-MF-008, DSL spec, codemods doc, SARIF-GitHub doc.

### 15.5 Referencias rápidas

| Quiero… | Voy a… |
|---|---|
| Ver el reporte HTML | Abrir `microframework/validacion/reportes/validacion-YYYY-MM-DD.html` |
| Entender qué se evalúa y por qué | [`microframework/validacion-estatica-flujos.md`](../validacion-estatica-flujos.md) |
| Escribir una regla custom YAML | [`microframework/validacion-pro/docs/dsl-spec.md`](../validacion-pro/docs/dsl-spec.md) |
| Conocer los codemods disponibles | [`microframework/validacion-pro/docs/codemods.md`](../validacion-pro/docs/codemods.md) |
| Configurar GitHub Code Scanning | [`microframework/validacion-pro/docs/sarif-github.md`](../validacion-pro/docs/sarif-github.md) |
| Ver el catálogo de reglas | [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.md) + [`microframework/antipatrones.md`](../antipatrones.md) |
| Ver el mapeo regla → calidad | [`mapeo-calidad.json`](mapeo-calidad.json) |
| Ver el esquema canónico del reporte | [`report.schema.json`](report.schema.json) |
| Ver la guía de adopción | [`docs/guia-buenas-practicas.md §7.4`](../../docs/guia-buenas-practicas.md) |
