> 🌐 **Language / Idioma:** English · [Español](README.md)

# n8n flow static validator — v2.0

**Component:** DevSecOps Pillar 2 — Automated Validation (thesis proposal §4.3)
**Version:** 2.0 — Lite edition (`validar-flujos.mjs`) + Pro edition (`../validacion-pro/`)
**Previous version:** 1.x preserved in [`legacy/validar-flujos-v1.mjs`](legacy/validar-flujos-v1.mjs)
**Author:** Elian Hernando Gil Sierra — MGADS UNAB 2026
**ADR:** [`ADR-MF-008`](../adr/ADR-MF-008-validador-dos-ediciones.en.md)

---

## Table of contents

1. [Purpose and role in the micro-framework](#1-purpose-and-role-in-the-micro-framework)
2. [Two editions, one data model](#2-two-editions-one-data-model)
3. [17-rule catalog](#3-17-rule-catalog)
4. [Technical architecture](#4-technical-architecture)
5. [Essential commands](#5-essential-commands)
6. [Generated outputs](#6-generated-outputs)
7. [Interactive HTML report](#7-interactive-html-report)
8. [Analysis of arbitrary external flows](#8-analysis-of-arbitrary-external-flows)
9. [Custom rule YAML DSL (Pro)](#9-custom-rule-yaml-dsl-pro)
10. [Codemods `--fix` (Pro)](#10-codemods---fix-pro)
11. [CI/CD and SARIF integration](#11-cicd-and-sarif-integration)
12. [Validator tests](#12-validator-tests)
13. [Known limitations](#13-known-limitations)
14. [Execution evidence and academic traceability](#14-execution-evidence-and-academic-traceability)
15. [Executive summary — features and advantages over v1](#15-executive-summary--features-and-advantages-over-v1)

---

## 1. Purpose and role in the micro-framework

The validator converts the micro-framework's design rules — which would otherwise be
purely declarative — into **automatically checkable criteria** over any n8n flow's
exported JSON.

n8n has no native architectural policy engine: conventions like "no node hardcodes
credentials" or "E2 contains no IO" would depend on developer discipline. The validator
closes that gap: anyone runs the command and gets a quantified report with severity,
confidence, ISO/IEC 25010 mapping, and ATAM scenarios for every finding.

### Position within DevSecOps Pillar 2

| Pillar | Mechanism | Verification |
|---|---|---|
| 1. Secrets Management | Credentials referenced by name in n8n | REG-001 + DevSecOps checklist |
| **2. Automated Validation** | **Lite + Pro (this document)** | **17 rules over the flow graph** |
| 3. Operational Resilience | Retry + idempotency + structured log patterns | REG-004, REG-005, REG-006 |

### Role in the academic evidence

The generated reports constitute type-(i) **documentary evidence** in ATAM's
methodological triangulation (`docs/atam/metodologia-atam-adaptada.md`). Every canonical
JSON report (`reportes/validacion-YYYY-MM-DD.json`) is an auditable, diffable artifact
demonstrating the to-be flows' compliance level at a given moment.

---

## 2. Two editions, one data model

Both editions implement the **same 17 rules** and produce the **same canonical JSON**
(schema in [`report.schema.json`](report.schema.json)). They differ in packaging,
audience, and extra capabilities:

|                       | **Lite edition**                              | **Pro edition**                                                  |
|-----------------------|-----------------------------------------------|------------------------------------------------------------------|
| Location              | [`validar-flujos.mjs`](validar-flujos.mjs)    | [`../validacion-pro/`](../validacion-pro/)                       |
| Form                  | A single `.mjs` file (~1600 LOC)              | Module `src/{cli,parser,rules,metrics,fixers,report,shared}`     |
| Runtime dependencies  | **Zero** (Node ≥ 18 and nothing else)         | Optional: `yaml` (with inline fallback)                          |
| Dev dependencies      | None — handmade runner                        | `vitest`                                                          |
| HTML                  | **Self-contained offline** (inline SVG ~200 KB) | CDN Tailwind + Mermaid + Chart.js                                 |
| Rules                 | 17 builtins                                   | 17 builtins + **user YAML DSL**                                   |
| Codemods `--fix`      | —                                             | `add-http-retry`, `envify-secret`, `add-on-conflict`              |
| Subcommands           | flags (`--format`, `--baseline`)              | `analyze · report · diff · fix · watch`                           |
| Output formats        | md · json · html · sarif · junit              | md · json · html · sarif · junit                                  |
| Tests                 | handmade runner + fixtures                    | vitest + fixtures (shared with Lite)                              |
| Recommended audience  | **Academic defense · external evaluator**     | Teams adopting the micro-framework · GitHub Code Scanning · public demos |

### Which edition to use

- **For the MGADS defense, and for the jury to reproduce on their own machine:** Lite.
  A single file, `node validar-flujos.mjs --format html` and nothing else. The resulting
  HTML opens offline with no network in the defense room.
- **For the project's CI/CD, and for external teams adopting the framework:** Pro.
  SARIF for GitHub Code Scanning, YAML DSL to add internal rules, codemods to
  automatically remediate.

This decision is documented in
[`ADR-MF-008-validador-dos-ediciones.md`](../adr/ADR-MF-008-validador-dos-ediciones.en.md).

---

## 3. 17-rule catalog

11 mandatory rules from the thesis proposal (REG-001…REG-VOC) + 6 antipatterns detected
as graph queries (AP-001…AP-006). Every rule has a default severity and an ISO 25010 /
ATAM / ADR mapping via [`mapeo-calidad.json`](mapeo-calidad.json).

| ID | Name | Severity | ISO 25010 | Applies if |
|----|--------|-----------|-----------|-----------|
| **REG-001** | No hardcoded secrets | error | security, maintainability | always |
| **REG-002** | `run_id` propagated | warning | maintainability, reliability | there are Code nodes |
| **REG-003** | `errorWorkflow` configured | error | reliability | flow is an orchestrator |
| **REG-004** | Retry ≥ 2 on HTTP | warning | reliability, performanceEfficiency | there are HTTP nodes |
| **REG-005** | Idempotency on writes | error | reliability, functionalSuitability | there is a Postgres INSERT |
| **REG-006** | Structured JSON log | warning | maintainability, reliability | there are Code nodes |
| **REG-007** | Isolated domain (E2 with no IO) | error | maintainability | `-e2-dominio` file |
| **REG-008** | Integrations in E3/E4 | warning | maintainability | there are IO nodes |
| **REG-009** | Appropriate HTTP status codes | warning | functionalSuitability, usability | flow is an orchestrator |
| **REG-010** | ADR present | info | maintainability | case follows convention |
| **REG-VOC** | Spanish `nivel` enum vocabulary | warning | maintainability, usability | to-be with Code nodes |
| **AP-001** | God-node (in+out degree > 6) | warning | maintainability | always |
| **AP-002** | Chatty IO (HTTP inside a loop) | warning | performanceEfficiency | there are HTTP nodes and loops |
| **AP-003** | Dual-write with no saga/transaction | error | reliability | ≥ 2 writes |
| **AP-004** | Exception swallowing | error | reliability, maintainability | there are error branches |
| **AP-005** | Unresolved workflow ID in Execute Workflow | warning | maintainability, portability | there is an Execute Workflow |
| **AP-006** | Stage leak (IO in an E2 node) | error | maintainability | always |

> Every finding also carries **confidence** (high/medium/low) and, when applicable, a
> **fix suggestion** (text or codemod reference). The rule → ISO/ATAM/ADR mapping is
> resolved at runtime from `mapeo-calidad.json`, so reordering attributes in the
> traceability matrix doesn't require recompiling the validator.

---

## 4. Technical architecture

Fundamental changes from v1:

| Aspect | v1 | v2 (Lite and Pro) |
|---|---|---|
| Analysis | Regex over `JSON.stringify(node.parameters)` | Typed directed graph from `nodes` + `connections` |
| E1–E4 stages | Inferred from the **file name** | Inferred from the **node type** via a cascading heuristic |
| Antipatterns | — | 6 graph queries (god-node, chatty, dual-write, swallowing, hardcoded ID, stage leak) |
| Metrics | — | Cyclomatic, depth, fan-out, cohesion score, per-stage distribution |
| Quality mapping | Table in separate documents | `mapeo-calidad.json` injected into every finding |
| Result | Boolean `cumple: true\|false\|null` | Severity (error/warning/info) + confidence (high/medium/low) |
| Outputs | md, json | md, **canonical json**, **offline html**, **sarif**, junit |
| Diff | — | Against a JSON baseline: new/resolved/regressions |

### E1–E4 classification heuristic (cascade, first match wins)

1. Node name contains `e1`/`e2`/`e3`/`e4` → respects the annotation (authoritative).
2. `type` contains `webhook` or `trigger` (not `respond`) → **E1**.
3. `type` `respondToWebhook` → **E4**.
4. `type` `executeWorkflow` → **UNKNOWN** (would inherit from the subflow).
5. `type` is IO (httpRequest, postgres, mysql, mongodb, redis, kafka, mqtt, …) → **E3**.
6. `type` is Code/Function and its `jsCode` contains `fetch`/`axios`/`pg`/`http.get` → **E3** (detectable stage leak).
7. `type` is Code/Function with no IO → **E2**.
8. `type` is Set/IF/Switch/Merge/ItemLists → **E2**.
9. Default → **UNKNOWN**.

This allows analyzing **any n8n JSON**, not just the repository's own.

### Computed metrics

- **Cyclomatic complexity**: `max(0, E − N + 2P)` where `P` is the number of connected components.
- **Maximum depth**: BFS from sources (nodes with in-degree 0).
- **Cohesion score**: proportion of edges that **do not** skip more than one stage
  boundary (E1→E2 counts; E1→E4 is a leak). Excludes UNKNOWN stages.
- **Per-stage distribution**: count of {E1, E2, E3, E4, UNKNOWN}.
- **Top-5 fan-out**: nodes with the highest out-degree.

---

## 5. Essential commands

### Lite (a single file, zero deps)

```bash
# Complete report: md + json + offline html + sarif + xml junit
node microframework/validacion/validar-flujos.mjs --format html

# Quick check — exit 0 if to-be has no errors, 1 if there are errors
node microframework/validacion/validar-flujos.mjs

# Filter by case/state (v1 compatibility)
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be

# Analyze an arbitrary n8n flow outside the repo
node microframework/validacion/validar-flujos.mjs --input path/to/my-flow.json --format html

# Diff against a previous baseline
node microframework/validacion/validar-flujos.mjs --baseline reportes/validacion-2026-05-31.json

# JSON only to stdout (no files written)
node microframework/validacion/validar-flujos.mjs --format json --quiet

# Reports in English (default: es)
node microframework/validacion/validar-flujos.mjs --format html --lang en

# Validator tests
node microframework/validacion/tests/run-tests.mjs
```

Available flags: `--input`, `--caso`, `--estado`, `--format`, `--out`, `--baseline`,
`--strict` (exit 1 on warnings too), `--quiet`, `--lang es|en` (language for messages
and reports, default `es`), `--help`.

Rule messages, CLI help, and all 5 report formats (md/json/html/sarif/junit) are
bilingual. The `i18n.mjs` module loads `locales/{es,en}.json`; `mapeo-calidad.json`
declares each rule's name as `{ es, en }` inline (single source for both Lite and Pro).

### Pro (module with subcommands)

```bash
cd microframework/validacion-pro
npm install                                                # optional

node bin/n8nmf.mjs analyze                                 # summary table + exit code
node bin/n8nmf.mjs report --format html --out ./reportes   # CDN HTML
node bin/n8nmf.mjs report --format sarif --out ./reportes  # SARIF v2.1.0 for GitHub
node bin/n8nmf.mjs diff --current today.json --baseline yesterday.json
node bin/n8nmf.mjs fix --rule REG-004 --dry-run            # codemod preview
node bin/n8nmf.mjs fix --rule REG-001                      # apply codemod
node bin/n8nmf.mjs watch                                   # re-analyze on mtime change
node bin/n8nmf.mjs analyze --rules-dir ./rules-custom      # load YAML rules

npm test                                                    # vitest
```

---

## 6. Generated outputs

By default, written to `microframework/validacion/reportes/` (Lite) or `./reportes/`
(Pro). `--out <dir>` redirects.

| File | When | Purpose |
|---|---|---|
| `validacion-YYYY-MM-DD.md`     | `--format md` (default)  | Human report, browsable on GitHub |
| `validacion-YYYY-MM-DD.json`   | whenever md or html is written | **Canonical** — feeds diff, history, and baseline |
| `validacion-YYYY-MM-DD.html`   | `--format html`          | Interactive report (see §7) |
| `validacion-YYYY-MM-DD.sarif`  | `--format sarif`         | For GitHub Code Scanning / external dashboards |
| `validacion-YYYY-MM-DD.xml`    | `--format junit`         | JUnit XML for traditional CI (Jenkins, GitLab) |

### Exit code

| Code | Meaning |
|---|---|
| `0` | No `to-be` flow has `error`-severity findings (warnings allowed) |
| `1` | At least one `to-be` has an `error` — or a `warning` if `--strict` was passed |

`as-is` flows can have errors with no effect on the exit code: they document the
intentional baseline.

### Canonical JSON — schema

Validated against [`report.schema.json`](report.schema.json). Summarized structure:

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

## 7. Interactive HTML report

The HTML generated with `--format html` is the deliverable's visual artifact. Designed to
be printed as a thesis appendix (`@media print` adjusts colors and borders).

### Lite — self-contained, offline, ~200 KB

- 0 external URLs. 0 `<script src>`. All CSS and JS embedded inline.
- Each flow's graph as an **SVG built from `node.position`** (the coordinates n8n already
  stores). No Mermaid.
- ISO/IEC 25010 radar as an SVG polygon. No Chart.js.
- Historical sparkline (average score by date) as an SVG polyline. Reads previous JSONs
  from `reportes/`.
- Findings table filterable by severity and text, sortable, exportable to CSV.
- **"Explain this finding" panel**: click a node → textual citation of the offending
  parameter, violated rule, linked ISO 25010 + ATAM + ADR, fix suggestion.
- Academic cover page with author, advisor, project, date, commit hash, flow count.

### Pro — CDN with commercial-grade visualizations

Same logical content as Lite, but using Mermaid for graphs (rendered with curves and a
dagre layout) and Chart.js for the radar (animated, interactive hover). Requires network
to open the HTML.

---

## 8. Analysis of arbitrary external flows

The v1 validator was coupled to the repository's naming convention. **v2 analyzes any n8n
JSON** because E1–E4 classification is by node type, not file name.

**Lite:**
```bash
node microframework/validacion/validar-flujos.mjs --input /path/my-flow.json --format html
```

**Pro:**
```bash
node microframework/validacion-pro/bin/n8nmf.mjs analyze /path/my-flow.json
node microframework/validacion-pro/bin/n8nmf.mjs report /path/to/repo/ --format html --out ./out
```

To get full REG-007 coverage (E2 with no IO), it's enough for **some node** to have the
name `*-e2-*` or be classified E2 by the heuristic. REG-010 (ADR present) does require the
`casos-de-estudio/{case}/adr/` convention — for arbitrary cases it returns N/A.

---

## 9. Custom rule YAML DSL (Pro)

Pro allows writing declarative rules in YAML — turning the validator into a *validation
framework*, not a closed script. Inspired by Semgrep / OPA applied to the n8n domain.

Example: forbid Postgres nodes in the input E1 stage.

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

Place it in `microframework/validacion-pro/rules-custom/` and run:

```bash
node bin/n8nmf.mjs analyze --rules-dir ./rules-custom
```

Full grammar: [`validacion-pro/docs/dsl-spec.md`](../validacion-pro/docs/dsl-spec.md).

---

## 10. Codemods `--fix` (Pro)

Pro includes three idempotent codemods that automatically remediate the most mechanical
findings:

| Codemod | Rule | Action |
|---|---|---|
| `add-http-retry` | REG-004 | Injects `options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }` into HTTP nodes with no retry or `maxRetries < 2`. |
| `envify-secret` | REG-001 | Replaces the literal value of `x-api-key` / `authorization` / `api-key` / `x-auth-token` headers with the n8n expression `={{ $env.<VAR> }}`. Doesn't touch JS code due to semantic risk. |
| `add-on-conflict` | REG-005 | Appends ` ON CONFLICT (id) DO NOTHING` to `INSERT INTO ...` queries with no idempotency. |

```bash
node bin/n8nmf.mjs fix --rule REG-004 --dry-run   # preview
node bin/n8nmf.mjs fix --rule REG-004              # apply
```

Detail: [`validacion-pro/docs/codemods.md`](../validacion-pro/docs/codemods.md).

---

## 11. CI/CD and SARIF integration

### Lite — simple gate in any CI

```yaml
- name: Validar flujos n8n
  run: node microframework/validacion/validar-flujos.mjs --strict
```

Exit code 0/1 closes the pipeline when there are errors (or warnings with `--strict`).

### Pro — GitHub Code Scanning with SARIF

`render-sarif.mjs` produces SARIF v2.1.0 with `runs[].tool.driver.rules[]` derived from
the catalog, and `runs[].results[]` derived from findings (including
`properties.iso25010`, `properties.atam`, `properties.adr` for external dashboards).

Example workflow in [`validacion-pro/docs/sarif-github.md`](../validacion-pro/docs/sarif-github.md).
Once uploaded with `github/codeql-action/upload-sarif@v3`, findings appear as inline
annotations on PRs and in the Security → Code scanning alerts tab.

---

## 12. Validator tests

### Lite — handmade, dependency-free runner

```bash
node microframework/validacion/tests/run-tests.mjs
```

Walks [`tests/fixtures/`](tests/fixtures/) (a minimal JSON per antipattern with a
parallel `expected.json`), runs the validator, and compares expected `ruleId`s against
the emitted ones.

Current state: **6/6 pass** (reg-001, reg-004, reg-005, reg-006, ap-001, baseline-conforme).

### Pro — vitest

```bash
cd microframework/validacion-pro
npm install
npm test
```

Suite: `parser.test.mjs` · `rules.test.mjs` (reuses the same fixtures as Lite) ·
`dsl.test.mjs` · `fixers.test.mjs` · `render-sarif.test.mjs`.

---

## 13. Known limitations

### 13.1 Lexical-structural analysis, not semantic

- **REG-001**: doesn't detect secrets built dynamically via concatenation inside a Code
  node. Analysis is over literals in the JSON.
- **REG-002**: confirms `run_id` presence in the code; doesn't verify the value
  propagates correctly at runtime.
- **REG-004**: reads the node's configuration; doesn't detect retry disabled by a
  dynamic n8n expression.

### 13.2 REG-010 verifies presence, not ADR quality

Confirms `casos-de-estudio/{case}/adr/ADR-*.md` exists. Doesn't validate the ADR's
structure or coherence with the flow.

### 13.3 REG-009 counts distinct codes, not HTTP semantics

Verifies ≥ 2 distinct `responseCode`s. An orchestrator with `200` + `201` passes the rule
even if both are success responses.

### 13.4 Referenced subflow resolution

`Execute Workflow` with an unresolved `workflowId` is reported as **AP-005**. Resolution
against workspace files is reserved for future versions.

### 13.5 One report per day

Date granularity (`validacion-YYYY-MM-DD.*`). Multiple runs the same day overwrite each
other. For history, previous reports are versioned in Git or renamed manually.

---

## 14. Execution evidence and academic traceability

### Reports versioned as evidence

| Report | Version | Notes |
|---|---|---|
| [`reportes/validacion-2026-05-02.md`](reportes/validacion-2026-05-02.md) | v1 | IoT as-is + to-be first subflows — baseline |
| [`reportes/validacion-2026-05-03.md`](reportes/validacion-2026-05-03.md) | v1 | Complete IoT to-be — REG-VOC fixed |
| [`reportes/validacion-2026-05-06.md`](reportes/validacion-2026-05-06.md) | v1 | 6 IoT to-be flows — 100% on all v1 rules |
| `reportes/validacion-YYYY-MM-DD.html` (latest) | **v2 Lite** | 23 files, to-be score 84%, 0 errors, 4 dormant rules |

### Traceability

| Artifact | Reference |
|---|---|
| Mandatory rules | [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.en.md) |
| Antipatterns (catalog) | [`microframework/antipatrones.md`](../antipatrones.en.md) |
| Rule → ISO/ATAM/ADR mapping | [`mapeo-calidad.json`](mapeo-calidad.json) |
| Canonical report schema | [`report.schema.json`](report.schema.json) |
| Lite + Pro decision | [`ADR-MF-008-validador-dos-ediciones.md`](../adr/ADR-MF-008-validador-dos-ediciones.en.md) |
| DevSecOps Pillar 2 | [`docs/context/microframework-spec.md §DevSecOps`](../../docs/context/microframework-spec.en.md) |
| Role in ATAM evidence | [`docs/atam/metodologia-atam-adaptada.md`](../../docs/atam/metodologia-atam-adaptada.md) |
| Thesis proposal R1 deliverable | [`docs/microframework-v1.0.md`](../../docs/microframework-v1.0.en.md) |
| Best practices guide (Ch. 7.4) | [`docs/guia-buenas-practicas.md`](../../docs/guia-buenas-practicas.en.md) |
| Static-analysis-independent spec | [`microframework/validacion-estatica-flujos.md`](../validacion-estatica-flujos.en.md) |

### Why Node.js remains the chosen implementation (inherited from v1)

Technological cohesion with n8n (native JS), zero runtime dependencies, guaranteed
availability in the CI where n8n runs, separation of responsibilities from the Python
measurement scripts, portability for external evaluators. Full justification in
[ADR-MF-008 §3](../adr/ADR-MF-008-validador-dos-ediciones.en.md) and, for the original
Node vs Python decision across five subsections, in this README's v1 version (preserved
in [`legacy/README-v1.md §2`](legacy/README-v1.md)).

---

## 15. Executive summary — features and advantages over v1

> Quick-reference appendix for the defense, the evaluation chapter, and external
> dissemination. Complements the technical detail of sections 1–14 with an executive
> view: what changed from v1, when to use each edition, and concrete evidence from the
> latest run against the full corpus.

### 15.1 TL;DR — what changed from v1

> A boolean *linter* with 11 rules and flat Markdown output became a **static analyzer of
> n8n flow graphs**, multi-format, with an extensible YAML DSL, automatic codemods, SARIF
> + GitHub Code Scanning integration, a test suite, and a thesis-quality interactive
> offline HTML report.

| | **v1 (legacy)** | **v2 (Lite + Pro)** |
|---|---|---|
| Analysis | Regex over serialized JSON text | **Typed directed graph** from `nodes` + `connections` |
| E1–E4 stages | By file name (coupled to the repo) | **By node type** (heuristic — analyzes any JSON) |
| Rules | 11 boolean REG-* | **17**: 11 REG-* + 6 AP-* antipatterns |
| Result | `cumple: true \| false \| null` | **Severity** (error/warning/info) × **confidence** (high/medium/low) |
| Metrics | — | Cyclomatic · depth · cohesion score · fan-out · E1–E4 distribution |
| ISO/ATAM/ADR mapping | In external PDFs | **Injected into every finding** (live traceability matrix) |
| Outputs | md, json | md · canonical json · **interactive offline html** · **sarif v2.1.0** · junit |
| Diff | — | Against a JSON baseline: new / resolved / regressions |
| User rules | — | **YAML DSL** (Pro) — Semgrep/OPA applied to n8n |
| Automatic remediation | — | **3 idempotent `--fix` codemods** (Pro) |
| CI/CD | Exit code | Exit code + **inline SARIF in GitHub PRs** |
| Validator's own tests | — | Handmade runner (Lite) + **vitest** (Pro) |

### 15.2 Lite vs Pro comparison — when to use each

| Use case | Recommended edition |
|---|---|
| **MGADS defense in the room** (possibly no internet) | **Lite** — one command, offline HTML |
| **External evaluator reproducing** on their machine | **Lite** — `node validar-flujos.mjs` with no `npm install` |
| **Thesis repository's CI/CD** | Lite (simple exit-code gate) or Pro (SARIF) |
| **External team adopting the micro-framework** | **Pro** — YAML DSL for internal rules |
| **GitHub Code Scanning + PRs with inline findings** | **Pro** — SARIF v2.1.0 |
| **Applying automatic fixes with `--fix`** | **Pro** — codemods |
| **Public demos / project page** | **Pro** — more visually appealing CDN HTML |
| **Rule engine bug fix** | Both (the algorithms are parallel) |

Full architectural decision: [`ADR-MF-008`](../adr/ADR-MF-008-validador-dos-ediciones.en.md).

### 15.3 Final run results against the repo

Latest Lite run against the whole corpus (`casos-de-estudio/` +
`microframework/plantillas/`):

| Metric | Value |
|---|---|
| Files analyzed | 23 (5 as-is + 18 to-be) |
| Average to-be score | **84%** |
| Errors in to-be | **0** |
| Warnings in to-be | 20 |
| Rules exercised | 13/17 (4 dormant: AP-001/002/003/006) |
| As-is — score | 18% (baseline with intentional violations — expected) |
| Exit code | **0** |
| Offline HTML size | ~200 KB |
| Execution time | < 2 s for 23 files |

Lite runs over the full corpus in under two seconds, exit 0, self-contained HTML ready to
print. The report is versioned at
`microframework/validacion/reportes/validacion-2026-06-01.html`.

### 15.4 Summary of advantages — one line each

- **Analyzes any n8n JSON**, not just the repo's (classification by node type, not name).
- **17 rules** vs 11 — includes 6 graph antipatterns not detectable by regex.
- **Severity + confidence** per finding — goodbye monolithic boolean.
- **Injected ISO 25010 + ATAM + ADR mapping** — live traceability matrix.
- **Quantitative metrics** (cyclomatic, cohesion, fan-out) to discuss at the defense.
- **100% self-contained offline HTML** (Lite) — opens with no network in the defense room.
- **Visually rich CDN HTML** (Pro) with Mermaid + Chart.js for public demos.
- **Custom rule YAML DSL** (Pro) — Semgrep/OPA applied to n8n.
- **3 idempotent `--fix` codemods** (Pro) — the micro-framework is operable.
- **SARIF v2.1.0** — inline findings in PRs via GitHub Code Scanning.
- **5 output formats** from a single canonical model.
- **Diff against baseline** — prevents silent regressions.
- **Honest coverage** of the micro-framework — flags dormant rules.
- **Fixture-based test suite** — Lite (handmade runner) and Pro (vitest).
- **Zero runtime dependencies** (Lite keeps v1's spirit).
- **CLI compatibility with v1** — `--caso` and `--estado` still work.
- **v1 preserved in `legacy/`** — historical traceability for the thesis document.
- **Complete documentation**: this README, ADR-MF-008, DSL spec, codemods doc, SARIF-GitHub doc.

### 15.5 Quick references

| I want to… | I go to… |
|---|---|
| See the HTML report | Open `microframework/validacion/reportes/validacion-YYYY-MM-DD.html` |
| Understand what's evaluated and why | [`microframework/validacion-estatica-flujos.md`](../validacion-estatica-flujos.en.md) |
| Write a custom YAML rule | [`microframework/validacion-pro/docs/dsl-spec.md`](../validacion-pro/docs/dsl-spec.md) |
| Learn the available codemods | [`microframework/validacion-pro/docs/codemods.md`](../validacion-pro/docs/codemods.md) |
| Set up GitHub Code Scanning | [`microframework/validacion-pro/docs/sarif-github.md`](../validacion-pro/docs/sarif-github.md) |
| See the rule catalog | [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.en.md) + [`microframework/antipatrones.md`](../antipatrones.en.md) |
| See the rule → quality mapping | [`mapeo-calidad.json`](mapeo-calidad.json) |
| See the report's canonical schema | [`report.schema.json`](report.schema.json) |
| See the adoption guide | [`docs/guia-buenas-practicas.md §7.4`](../../docs/guia-buenas-practicas.en.md) |
