# SARIF + GitHub Code Scanning

La edición Pro produce SARIF v2.1.0 compatible con GitHub Code Scanning. Los
findings aparecen como anotaciones inline en los PRs.

## Generar el SARIF

```bash
n8nmf report --format sarif --out ./reportes
# → ./reportes/validacion-YYYY-MM-DD.sarif
```

## Workflow GitHub Actions

`.github/workflows/validar-n8n.yml`:

```yaml
name: Validar flujos n8n
on:
  pull_request:
    paths:
      - 'casos-de-estudio/**/*.json'
      - 'microframework/plantillas/*.json'
      - 'microframework/validacion-pro/**'
permissions:
  contents: read
  security-events: write
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd microframework/validacion-pro && npm install
      - run: node microframework/validacion-pro/bin/n8nmf.mjs report --format sarif --out ./sarif
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: ./sarif/validacion-*.sarif
          category: n8n-microframework
```

## Visualización en PRs

Una vez subido, GitHub muestra los findings en:

- La pestaña **Security → Code scanning alerts** del repositorio.
- Inline en los **diffs** de los PRs (los archivos JSON con findings tienen
  anotaciones laterales).
- Como **status check** del PR.

## Notas

- Los `ruleId` en SARIF corresponden a las IDs internas (`REG-001`, `AP-003`, etc.).
- Las propiedades `iso25010`, `atam`, `adr`, `confidence` van en `result.properties`
  para que dashboards externos puedan filtrarlas.
- La URL en `tool.driver.informationUri` apunta al repo del micro-framework.
