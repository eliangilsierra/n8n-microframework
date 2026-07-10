> 🌐 **Language / Idioma:** English · [Español](README.md)

# Pro Edition — n8n Static Validator

Modular version of the validator (`microframework/validacion-pro/`). Coexists with the
**Lite Edition** (`microframework/validacion/validar-flujos.mjs`) and shares its
canonical data model (`report.schema.json`).

## Why two editions

| | Lite | Pro |
|---|---|---|
| Form | A single `.mjs` (~1600 LOC) | Module `src/{parser,rules,metrics,fixers,report,cli}` |
| Runtime dependencies | **Zero** | `yaml` optional (inline fallback) |
| Dev dependencies | None (hand-rolled test runner) | `vitest` |
| HTML | Offline, embedded SVG | Tailwind/Chart.js CDN + optional offline |
| Rules | 17 builtins | 17 builtins + **user YAML DSL** |
| Codemods (`--fix`) | No | Yes (envify-secret, add-http-retry, add-on-conflict) |
| Subcommands | analyze/report/diff (flags) | analyze · report · diff · fix · watch |
| Tests | hand-rolled runner + fixtures | vitest + fixtures |
| Audience | Offline academic defense, UNAB jury | Public demos, GitHub Code Scanning, external teams |

Both produce the same canonical JSON — Lite's report can be consumed by Pro and
vice versa.

## Quick start

```bash
cd microframework/validacion-pro
npm install                       # optional: installs vitest and yaml
node ./bin/n8nmf.mjs --help

# Analyze the whole repo
node ./bin/n8nmf.mjs analyze

# HTML report with CDN
node ./bin/n8nmf.mjs report --format html --out ./reportes

# SARIF report for GitHub Code Scanning
node ./bin/n8nmf.mjs report --format sarif --out ./reportes

# Reports in English (default: es)
node ./bin/n8nmf.mjs report --format html --lang en

# Diff against a JSON baseline
node ./bin/n8nmf.mjs diff --current reportes/hoy.json --baseline reportes/ayer.json

# Apply an automatic codemod
node ./bin/n8nmf.mjs fix --rule REG-004 --input casos-de-estudio/bot/to-be/

# Load user YAML rules
node ./bin/n8nmf.mjs analyze --rules-dir ./rules-custom
```

## YAML DSL — declarative rules

See [docs/dsl-spec.md](docs/dsl-spec.md). Minimal example:

```yaml
id: CUSTOM-001
name: Prohibir Postgres en E1
severity: error
match:
  stage: E1
  nodeType: postgres
assert:
  not: true
message: "Postgres detectado en E1 — mover a E3."
```

Place this file in `rules-custom/` and it will load automatically.

## Codemods

See [docs/codemods.md](docs/codemods.md). Safe application:

```bash
node ./bin/n8nmf.mjs fix --input <flow.json> --rule REG-001 --dry-run    # preview patch
node ./bin/n8nmf.mjs fix --input <flow.json> --rule REG-001               # apply
```

## SARIF + GitHub Code Scanning

See [docs/sarif-github.md](docs/sarif-github.md). The `.github/workflows/validar.yml`
workflow can upload the SARIF so findings appear inline in PRs.

## Tests

```bash
npm test
```

Target coverage ≥ 85% in `src/rules/` and `src/parser/`.

## Language / i18n

`--lang es|en` flag (default `es`) on all subcommands. Rule messages, CLI help, and
all 5 report formats are bilingual. Module `src/shared/i18n.mjs` +
`src/shared/locales/{es,en}.json`; `mapeo-calidad.json` (shared with Lite) declares
each rule's name as `{ es, en }` inline.
