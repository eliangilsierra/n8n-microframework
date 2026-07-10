> 🌐 **Language / Idioma:** English · [Español](ADR-MF-008-validador-dos-ediciones.md)

# ADR-MF-008 — Static validator in two editions (Lite + Pro)

**Date:** 2026-05-31
**Status:** Accepted
**Author:** Elian Hernando Gil Sierra
**Related pillar:** DevSecOps · Pillar 2 — Automated validation

---

## 1. Context

The n8n static flow validator (`microframework/validacion/validar-flujos.mjs`) was the
canonical implementation of the micro-framework's DevSecOps Pillar 2. Version 1.x operated
with 11 REG-* rules and produced plain Markdown using regex over
`JSON.stringify(node.parameters)`. That approach had four limitations affecting both
methodological rigor and the deliverable's academic projection:

1. **Coupling to the repo's naming conventions** — several rules (REG-003, REG-007,
   REG-008, REG-009) only triggered if the file name matched a pattern (`orquestador`,
   `-e2-dominio`, `-e3-`, `-e4-`, `error-handler`). A flow from another team or with an
   arbitrary name received partial coverage.
2. **Lexical, not structural, analysis** — regex over the serialized JSON couldn't
   distinguish a literal value from a field inside a comment or an n8n expression. There
   was no notion of a graph (`connections`), of stages (E1–E4), or of subflows.
3. **Boolean result with no severity** — `cumple: true|false|null`. With no error/warning
   distinction, no confidence, no mapping to ISO 25010 or ATAM. This prevented prioritizing
   findings and limited the evidence available for the evaluation chapter.
4. **Flat Markdown output** — there was no visual artifact worthy of a Master's defense.
   The rule → ISO 25010 → ATAM traceability existed in separate documents, not in the
   report itself.

## 2. Decision

Refactor the validator into **two coexisting editions** sharing the same canonical data
model (`microframework/validacion/report.schema.json`):

- **Lite edition** — a single file `microframework/validacion/validar-flujos.mjs`
  (~1600 LOC), zero external dependencies, self-contained offline HTML (~200 KB with
  embedded SVG for graphs and radar chart — no CDN). Replaces validator v1.
- **Pro edition** — modular package `microframework/validacion-pro/` with
  `src/{parser,rules,metrics,fixers,report,cli,shared}`, a YAML rule DSL for user rules,
  codemods (`--fix`), a multi-subcommand CLI (`analyze|report|diff|fix|watch`), md/json/
  html/sarif/junit output, and a vitest test suite. HTML with CDN.

Both editions implement the same 17 rules (11 REG-* + 6 antipatterns AP-* as graph
queries) and produce the same canonical JSON.

Validator v1 is preserved as `microframework/validacion/legacy/validar-flujos-v1.mjs` for
historical traceability.

## 3. Alternatives considered

| Alternative | Why it was discarded |
|---|---|
| **Rewrite only into a single, more sophisticated file** | Loses the opportunity to demonstrate modular, test-driven architecture at a Master's level. CDN HTML + YAML DSL needs structure. |
| **Migrate to a single module and remove the single-file script** | Breaks the "one binary, one file, no npm install" property, which is an advantage for the external evaluator (Section 2 of the v1 validator README). |
| **Keep v1 unchanged + add Pro as a complement** | v1 would still be regex over text producing flat Markdown. The methodological debt would not be closed. |

## 4. Consequences

### Positive
- **Graph-based analysis** — every rule operates on `(nodes, edges, subflowRefs)` with E1–E4
  stages inferred by typed heuristics, not by name. Full coverage over any n8n JSON, not
  just the ones in the repo.
- **Severity and confidence per finding** — error/warning/info × high/medium/low. Allows
  prioritization and reduces the noise of the old monolithic `✗`.
- **Live ISO 25010 / ATAM / ADR mapping** — the `mapeo-calidad.json` table is injected into
  every finding. The report is the executable traceability matrix, not a static PDF.
- **6 new antipatterns** — god-node, chatty IO, dual-write, exception swallowing, hardcoded
  subflow ID, stage leak — all as graph queries.
- **Self-contained HTML (Lite)** — a single file, 0 external URLs, opens offline. Includes
  a per-flow SVG graph, ISO 25010 radar chart, filterable table, historical sparkline,
  "explain this finding" panels citing ADR/ATAM. Printable as a thesis appendix.
- **SARIF v2.1.0 (Pro)** — direct integration with GitHub Code Scanning. Findings appear
  inline in PRs.
- **YAML DSL (Pro)** — any team defines custom rules in 10 lines. Turns the validator into a
  *framework*, not a script — a publishable contribution.
- **Codemods `--fix` (Pro)** — `add-http-retry`, `envify-secret`, `add-on-conflict`.
  Demonstrates that the micro-framework is operable, not just documentary.
- **Fixture-based tests** — Lite with a dependency-free handmade runner; Pro with vitest.
  v1 had no tests.

### Negative
- **Double maintenance surface** — a bug in the rule engine must be fixed in both editions.
  Mitigation: the key algorithms (parser, classifier, metrics) are parallel, compact
  rewrites (~150 LOC each) that don't require daily synchronization.
- **Higher conceptual complexity of the deliverable** — the evaluator must understand why
  there are two versions. Mitigation: this ADR and the Pro README explain it.

## 5. Audiences per edition

| Audience | Recommended edition | Reason |
|---|---|---|
| MGADS UNAB jury at the defense | **Lite** | Self-contained offline HTML — no network needed in the defense room. |
| External evaluator reproducing on their machine | **Lite** | `node validar-flujos.mjs` and nothing else. No `npm install`. |
| External team adopting the micro-framework | **Pro** | YAML DSL for internal rules, codemods, SARIF in their CI/CD. |
| Public demo (project page, GitHub) | **Pro** | Visually richer CDN HTML; Code Scanning on PRs. |
| Automated tests of the validator itself | **Both** | Lite via the handmade runner, Pro via vitest. |

## 6. Expected quality metrics

After this refactor, the R1 deliverable's traceability matrix can move from:

> "11 rules with a boolean result against the JSON text"

to:

> "17 rules (11 mandatory + 6 graph antipatterns) with severity and confidence, mapped to
> ISO/IEC 25010 and to ATAM scenarios, evaluated over the flow's directed graph, with
> md/json/html/sarif/junit output, executable as a dependency-free binary (Lite) or as an
> extensible module with a YAML DSL and codemods (Pro). A test suite with minimal fixtures
> per antipattern."

## 7. Traceability

- Rules: [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.en.md)
- Antipatterns: [`microframework/antipatrones.md`](../antipatrones.en.md)
- Canonical schema: [`microframework/validacion/report.schema.json`](../validacion/report.schema.json)
- Quality mapping: [`microframework/validacion/mapeo-calidad.json`](../validacion/mapeo-calidad.json)
- Lite: [`microframework/validacion/validar-flujos.mjs`](../validacion/validar-flujos.mjs)
- Pro: [`microframework/validacion-pro/`](../validacion-pro/)
- Legacy v1: [`microframework/validacion/legacy/validar-flujos-v1.mjs`](../validacion/legacy/validar-flujos-v1.mjs)
- v1 validator README (Node vs Python rationale): [`microframework/validacion/README.md`](../validacion/README.md)
