# ADR-MF-008 — Validador estático en dos ediciones (Lite + Pro)

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Autor:** Elian Hernando Gil Sierra
**Pilar relacionado:** DevSecOps · Pilar 2 — Validaciones automatizadas

---

## 1. Contexto

El validador estático de flujos n8n (`microframework/validacion/validar-flujos.mjs`)
era la implementación canónica del Pilar 2 DevSecOps del micro-framework. La versión 1.x
operaba con 11 reglas REG-* y producía Markdown plano usando regex sobre
`JSON.stringify(node.parameters)`. Esa forma tenía cuatro limitaciones que afectaban
tanto el rigor metodológico como la proyección académica del entregable:

1. **Acoplamiento a las convenciones de naming del repo** — varias reglas (REG-003,
   REG-007, REG-008, REG-009) sólo activaban si el nombre del archivo coincidía con un
   patrón (`orquestador`, `-e2-dominio`, `-e3-`, `-e4-`, `error-handler`). Un flujo de
   otro equipo o con nombre arbitrario recibía cobertura parcial.
2. **Análisis léxico, no estructural** — el regex sobre el JSON serializado no
   distinguía un valor literal de un campo dentro de un comentario o de una expresión
   n8n. No había noción de grafo (`connections`), de etapas (E1–E4), ni de subflujos.
3. **Resultado booleano sin severidad** — `cumple: true|false|null`. Sin distinguir
   error de warning, sin confianza, sin mapeo a ISO 25010 o ATAM. Esto impedía
   priorizar findings y limitaba la evidencia para el capítulo de evaluación.
4. **Salida Markdown plana** — no había un artefacto visual digno de defensa de
   maestría. La trazabilidad regla → ISO 25010 → ATAM existía en documentos
   separados, no en el reporte mismo.

## 2. Decisión

Refactorizar el validador en **dos ediciones coexistentes** que comparten el mismo
modelo de datos canónico (`microframework/validacion/report.schema.json`):

- **Edición Lite** — un único archivo `microframework/validacion/validar-flujos.mjs`
  (~1600 LOC), cero dependencias externas, HTML offline autocontenido (~200 KB con
  SVG embebido para grafos y radar — sin CDN). Reemplaza al validador v1.
- **Edición Pro** — paquete modular `microframework/validacion-pro/` con
  `src/{parser,rules,metrics,fixers,report,cli,shared}`, DSL YAML de reglas de
  usuario, codemods (`--fix`), CLI multi-subcomando (`analyze|report|diff|fix|watch`),
  salidas md/json/html/sarif/junit, suite de tests con vitest. HTML con CDN.

Ambas ediciones implementan las mismas 17 reglas (11 REG-* + 6 antipatrones AP-* como
queries sobre el grafo) y producen el mismo JSON canónico.

El validador v1 se conserva como `microframework/validacion/legacy/validar-flujos-v1.mjs`
para trazabilidad histórica.

## 3. Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| **Reescribir sólo a un archivo único más sofisticado** | Pierde la oportunidad de demostrar arquitectura modular y test-driven a nivel maestría. El HTML CDN + DSL YAML necesita estructura. |
| **Migrar sólo a un módulo y eliminar el script único** | Rompe la propiedad "un binario, un archivo, sin npm install" que es ventaja para el evaluador externo (Sección 2 del README del validador v1). |
| **Mantener v1 sin cambios + añadir Pro como complemento** | v1 seguiría siendo regex sobre texto y produciendo Markdown plano. No se cierra la deuda metodológica. |

## 4. Consecuencias

### Positivas
- **Análisis basado en grafo** — toda regla opera sobre `(nodes, edges, subflowRefs)`
  con etapas inferidas E1–E4 por heurística tipada, no por nombre. Cobertura completa
  sobre cualquier JSON de n8n, no sólo los del repo.
- **Severidad y confianza por finding** — error/warning/info × high/medium/low.
  Permite priorizar y reduce el ruido del `✗` monolítico.
- **Mapeo ISO 25010 / ATAM / ADR vivo** — la tabla `mapeo-calidad.json` se inyecta en
  cada finding. El reporte es la matriz de trazabilidad ejecutable, no un PDF estático.
- **6 antipatrones nuevos** — god-node, chatty IO, dual-write, exception swallowing,
  hardcoded subflow ID, stage leak — todos como queries sobre el grafo.
- **HTML autocontenido (Lite)** — un solo archivo, 0 URLs externas, abre offline.
  Incluye grafo SVG por flujo, radar ISO 25010, tabla filtrable, sparkline histórico,
  paneles "explica este finding" con ADR/ATAM citados. Imprimible como anexo de tesis.
- **SARIF v2.1.0 (Pro)** — integración directa con GitHub Code Scanning. Los findings
  aparecen inline en PRs.
- **DSL YAML (Pro)** — cualquier equipo define reglas custom en 10 líneas. Convierte
  el validador en un *framework*, no un script — contribución publicable.
- **Codemods `--fix` (Pro)** — `add-http-retry`, `envify-secret`, `add-on-conflict`.
  Demuestra que el micro-framework es operable, no sólo documental.
- **Tests con fixtures** — Lite con runner artesanal sin dependencias; Pro con vitest.
  v1 no tenía tests.

### Negativas
- **Doble superficie de mantenimiento** — bug en el rule engine debe corregirse en
  ambas ediciones. Mitigación: los algoritmos clave (parser, classifier, metrics) son
  reescrituras paralelas y compactas (~150 LOC cada uno), no requieren sincronización
  diaria.
- **Mayor complejidad conceptual del entregable** — el evaluador debe entender por
  qué hay dos versiones. Mitigación: este ADR y el README Pro lo explican.

## 5. Audiencias de cada edición

| Audiencia | Edición recomendada | Motivo |
|---|---|---|
| Jurado MGADS UNAB en defensa | **Lite** | HTML offline autocontenido — no requiere red en la sala de defensa. |
| Evaluador externo reproduciendo en su máquina | **Lite** | `node validar-flujos.mjs` y nada más. Sin `npm install`. |
| Equipo externo adoptando el micro-framework | **Pro** | DSL YAML para reglas internas, codemods, SARIF en su CI/CD. |
| Demo pública (página de proyecto, GitHub) | **Pro** | HTML CDN visualmente más rico; Code Scanning en PRs. |
| Tests automatizados del propio validador | **Ambas** | Lite via runner artesanal, Pro via vitest. |

## 6. Métricas de calidad esperadas

Tras esta refactorización, la matriz de trazabilidad del entregable R1 puede pasar de:

> "11 reglas con resultado booleano contra texto del JSON"

a:

> "17 reglas (11 obligatorias + 6 antipatrones de grafo) con severidad y confianza,
> mapeadas a ISO/IEC 25010 y a escenarios ATAM, evaluadas sobre el grafo dirigido del
> flujo, con salida en md/json/html/sarif/junit, ejecutable como un binario sin
> dependencias (Lite) o como módulo extensible con DSL YAML y codemods (Pro).
> Suite de tests con fixtures mínimos por antipatrón."

## 7. Trazabilidad

- Reglas: [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.md)
- Antipatrones: [`microframework/antipatrones.md`](../antipatrones.md)
- Schema canónico: [`microframework/validacion/report.schema.json`](../validacion/report.schema.json)
- Mapeo calidad: [`microframework/validacion/mapeo-calidad.json`](../validacion/mapeo-calidad.json)
- Lite: [`microframework/validacion/validar-flujos.mjs`](../validacion/validar-flujos.mjs)
- Pro: [`microframework/validacion-pro/`](../validacion-pro/)
- Legacy v1: [`microframework/validacion/legacy/validar-flujos-v1.mjs`](../validacion/legacy/validar-flujos-v1.mjs)
- README validador v1 (justificación Node vs Python): [`microframework/validacion/README.md`](../validacion/README.md)
