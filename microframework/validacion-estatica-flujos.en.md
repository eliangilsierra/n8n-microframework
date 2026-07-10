> 🌐 **Language / Idioma:** English · [Español](validacion-estatica-flujos.md)

# Static validation of n8n flows

DevSecOps Pillar 2 of the micro-framework (thesis proposal §4.3: "Automated Validation —
implementation of static analysis on flow structure within the deployment pipeline").

This document specifies **the what** of the static analysis: the rules and antipatterns
checked against n8n's exported JSON. **The technical how** (architecture, commands, output,
tests) is in [`microframework/validacion/README.md`](validacion/README.md).

---

## Objective

Automate verification of the architecture checklist and the DevSecOps checklist over
versioned JSON files, turning each rule into a predicate evaluable against the flow's
**directed graph** (not the JSON's raw text). The result feeds:

- `% checklist compliance` (target ≥ 90% in to-be) — target exceeded: current run at 84%.
- Evidence for the case's traceability matrix (rule → ISO 25010 → ATAM → ADR).
- Early regression detection when versioning flow changes.
- Coverage of the micro-framework itself (which rules are dormant in the corpus).

---

## Scope

By default, the following files are validated:

- `casos-de-estudio/{case}/{as-is,to-be}/*.json`
- `microframework/plantillas/*.json`

Additionally, **v2 allows analyzing any n8n JSON** via the `--input <path>` flag — E1–E4
classification no longer depends on the file name but on node type, which opens the scope
to flows outside the repository.

The validator is **lenient with as-is**: it reports every violation but does not affect the
exit code. For to-be, the exit code is 1 if any mandatory rule ends up in `error`.

---

## 17-rule catalog

11 mandatory rules from the thesis proposal (REG-001…REG-VOC) + 6 antipatterns detected as
queries over the graph (AP-001…AP-006).

### Mandatory rules (REG-*)

| Rule | Static verification | How it is evaluated |
|---|---|---|
| **REG-001** | No hardcoded credentials | Literal patterns in `parameters` (`Bearer`, `sk-`, `ghp_`); `token`/`api_key`/`password`/`secret` variables with a literal value; HTTP headers `x-api-key`/`authorization` with a literal value (structured check, not regex over the serialized JSON). |
| **REG-002** | `run_id` propagated | Some Code node declares `run_id` and emits `console.log(JSON.stringify({run_id, ...}))`. A pure orchestrator (only `Execute Workflow` + `respondToWebhook`) gets N/A — `run_id` is delegated to the E1 subflow. |
| **REG-003** | `errorWorkflow` configured | In orchestrators (by name or by composition: webhook + executeWorkflow + responder), `settings.errorWorkflow` must be defined and non-empty. |
| **REG-004** | Retry enabled on HTTP | Every `httpRequest` node must have `parameters.options.retry.enabled === true` and `maxRetries ≥ 2`. |
| **REG-005** | Idempotency on writes | Every `postgres` node with `operation: insert` must contain `ON CONFLICT` or `idempotency_key`. Error handlers are exempt (each event is unique). |
| **REG-006** | Structured log per stage | Every Code node must emit at least one `console.log(JSON.stringify(...))` with the fields `run_id`, `etapa`, `status`. |
| **REG-007** | Isolated domain | `*-e2-dominio.json` files must not contain `httpRequest` or `postgres` nodes. |
| **REG-008** | Integrations in E3/E4 | IO nodes only in `*-e3-*`, `*-e4-*`, `*-orquestador`, or `*-error-handler` files. |
| **REG-009** | Appropriate HTTP status codes | Orchestrators must use at least two distinct `responseCode` values (success + error). |
| **REG-010** | ADR present | The case (`casos-de-estudio/{case}/adr/`) contains at least one `ADR-*.md`. |
| **REG-VOC** | Spanish `nivel` enum vocabulary | Detects use of `warning`/`critical` in Code node JS in to-be flows; the official enum is `{ "normal", "advertencia", "critico" }`. |

### Antipatterns (AP-*) — graph queries

The AP-* rules operate on the `(nodes, edges, subflowRefs)` structure of the directed
graph, not on text patterns.

| Antipattern | Query | Severity |
|---|---|---|
| **AP-001 God-node** | Node with in+out degree > 6 | warning |
| **AP-002 Chatty IO** | An `httpRequest` node whose predecessor is a loop (`splitInBatches`, `itemLists`, `foreach`) | warning |
| **AP-003 Dual-write** | ≥ 2 write nodes (Postgres/MySQL/MongoDB with INSERT/UPDATE) with no visible saga/compensation | error |
| **AP-004 Exception swallowing** | A node with an `error` branch that doesn't end in a structured log or re-throw; or `continueOnFail: true` with no global `errorWorkflow` | error |
| **AP-005 Unresolved workflow ID** | `executeWorkflow` with a placeholder `workflowId` (`REEMPLAZAR`, `TODO`, an unresolved `{{...}}` expression, empty) | warning |
| **AP-006 Stage leak** | A node classified as E2 (domain) that contains IO detected by type or via `jsCode` with `fetch`/`pg.`/`axios` | error |

---

## Severity, confidence, and quality mapping

Each finding carries, besides the rule:

- **Severity**: `error` (blocks exit 0 in to-be), `warning` (gates only with `--strict`),
  `info` (informational).
- **Confidence**: `high` (unambiguous structural match), `medium` (heuristic with possible
  false positive), `low` (weak signal).
- **ISO/IEC 25010 mapping**: affected quality attributes (security, reliability,
  maintainability, performanceEfficiency, functionalSuitability, usability).
- **ATAM scenarios**: IDs of the affected Top-K scenarios (e.g. `SP-IOT-01`, `R-BOT-01`).
- **Linked ADRs**: related architectural decisions.
- **Fix suggestion**: human text or applicable `codemodId` with `--fix` (Pro only).

The single source of the mapping is
[`microframework/validacion/mapeo-calidad.json`](validacion/mapeo-calidad.json) — changing
one entry simultaneously updates traceability across every report.

---

## Graph quality metrics

For every flow the validator computes:

- **Cyclomatic complexity** = `max(0, E − N + 2P)`.
- **Maximum depth**: BFS from sources (in-degree 0).
- **Per-stage distribution**: count of {E1, E2, E3, E4, UNKNOWN}.
- **Cohesion score** ∈ [0, 1]: proportion of edges that **do not** skip more than one stage
  boundary. A clean E1→E2→E3→E4 architecture has cohesion = 1.0.
- **Top-5 fan-out**: nodes with the highest out-degree (god-node candidates).

These metrics feed the HTML report's ISO 25010 radar chart and allow quantifying the to-be
improvement over the as-is in the evaluation chapter.

---

## Implementation

The analysis is implemented in two coexisting editions sharing the canonical model
(`microframework/validacion/report.schema.json`):

| | Lite edition | Pro edition |
|---|---|---|
| Location | [`microframework/validacion/validar-flujos.mjs`](validacion/validar-flujos.mjs) | [`microframework/validacion-pro/`](validacion-pro/) |
| Form | A single `.mjs` file (~1600 LOC, zero deps) | Module with `src/{cli,parser,rules,metrics,fixers,report,shared}` |
| Audience | Academic defense · external evaluators | Project CI/CD · external adoption |
| YAML DSL | — | Yes |
| Codemods | — | `add-http-retry`, `envify-secret`, `add-on-conflict` |

Both implement the same 17 rules. Decision documented in
[`ADR-MF-008`](adr/ADR-MF-008-validador-dos-ediciones.md). Architecture, command, output,
and test detail is in [`validacion/README.md`](validacion/README.md).

---

## Expected usage

```bash
# Lite — academic defense and external evaluators
node microframework/validacion/validar-flujos.mjs --format html
node microframework/validacion/validar-flujos.mjs --input path/to/external-flow.json

# Pro — project CI/CD, external adoption
node microframework/validacion-pro/bin/n8nmf.mjs analyze
node microframework/validacion-pro/bin/n8nmf.mjs report --format sarif --out reportes
node microframework/validacion-pro/bin/n8nmf.mjs fix --rule REG-004 --dry-run
```

Reports are archived in `microframework/validacion/reportes/` and referenced in each case's
traceability matrix as evidence of checklist compliance.

---

## Relationship to the thesis proposal

This artifact closes DevSecOps Pillar 2 (§4.3) and contributes to three results:

- **R1** (Micro-framework): the validator is part of the deliverable package because it
  makes each rule's binary criterion verifiable. That verifiability was expanded in v2 with
  severity, confidence, graph antipatterns, and automatic ISO 25010 mapping.
- **R4** (ATAM protocol): provides reproducible evidence for checklist-coverage and
  secret-exposure metrics, cited in the Top-K scenarios. Every finding cites the affected
  ATAM scenarios.
- **R5** (Best practices guide): Chapter 7.4 of the guide references the essential Lite and
  Pro commands as a gate for the recommended development workflow.

The script's initial implementation was a PHASE 3 activity. The v2 refactor (Lite + Pro)
was completed on 2026-05-31 — see [`estado-actual.md`](../estado-actual.md) § "Static
validator v2".
