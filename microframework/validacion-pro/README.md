# Edición Pro — Validador estático n8n

Versión modular del validador (`microframework/validacion-pro/`). Convive con la
**Edición Lite** (`microframework/validacion/validar-flujos.mjs`) y comparte su
modelo de datos canónico (`report.schema.json`).

## Por qué dos ediciones

| | Lite | Pro |
|---|---|---|
| Forma | Un solo `.mjs` (~1600 LOC) | Módulo `src/{parser,rules,metrics,fixers,report,cli}` |
| Dependencias runtime | **Cero** | `yaml` opcional (fallback inline) |
| Dependencias dev | Ninguna (test runner artesanal) | `vitest` |
| HTML | Offline, SVG embebido | CDN Tailwind/Chart.js + opcional offline |
| Reglas | 17 builtins | 17 builtins + **DSL YAML de usuario** |
| Codemods (`--fix`) | No | Sí (envify-secret, add-http-retry, add-on-conflict) |
| Subcomandos | analyze/report/diff (flags) | analyze · report · diff · fix · watch |
| Tests | runner artesanal + fixtures | vitest + fixtures |
| Audiencia | Defensa académica offline, jurado UNAB | Demos públicas, GitHub Code Scanning, equipos externos |

Ambas producen el mismo JSON canónico — el reporte de Lite puede consumirse por Pro
y viceversa.

## Quick start

```bash
cd microframework/validacion-pro
npm install                       # opcional: instala vitest y yaml
node ./bin/n8nmf.mjs --help

# Analizar todo el repo
node ./bin/n8nmf.mjs analyze

# Reporte HTML con CDN
node ./bin/n8nmf.mjs report --format html --out ./reportes

# Reporte SARIF para GitHub Code Scanning
node ./bin/n8nmf.mjs report --format sarif --out ./reportes

# Diff contra baseline JSON
node ./bin/n8nmf.mjs diff --current reportes/hoy.json --baseline reportes/ayer.json

# Aplicar codemod automático
node ./bin/n8nmf.mjs fix --rule REG-004 --input casos-de-estudio/bot/to-be/

# Cargar reglas YAML del usuario
node ./bin/n8nmf.mjs analyze --rules-dir ./rules-custom
```

## DSL YAML — reglas declarativas

Ver [docs/dsl-spec.md](docs/dsl-spec.md). Ejemplo mínimo:

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

Coloca este archivo en `rules-custom/` y se cargará automáticamente.

## Codemods

Ver [docs/codemods.md](docs/codemods.md). Aplicación segura:

```bash
node ./bin/n8nmf.mjs fix --input <flow.json> --rule REG-001 --dry-run    # ver patch
node ./bin/n8nmf.mjs fix --input <flow.json> --rule REG-001               # aplicar
```

## SARIF + GitHub Code Scanning

Ver [docs/sarif-github.md](docs/sarif-github.md). El workflow `.github/workflows/validar.yml`
puede subir el SARIF para que los findings aparezcan inline en PRs.

## Tests

```bash
npm test
```

Cobertura objetivo ≥ 85% en `src/rules/` y `src/parser/`.
