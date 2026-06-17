# DSL YAML de reglas — especificación

El validador Pro permite escribir reglas declarativas en YAML, cargadas con
`--rules-dir <dir>`. Inspirado en Semgrep / OPA aplicado al dominio n8n.

## Esquema mínimo

```yaml
id: CUSTOM-001                  # requerido — único
name: Texto humano              # requerido
severity: error|warning|info    # default: warning
confidence: high|medium|low     # default: medium
iso25010: [security, reliability]   # opcional — atributos ISO afectados
atam: [SP-IOT-01]                   # opcional — escenarios ATAM relevantes
adr: [ADR-MF-XXX]                   # opcional — ADRs vinculados
match:
  stage: E1|E2|E3|E4|UNKNOWN        # filtra por etapa inferida
  nodeType: regex                    # case-insensitive
  nameRegex: regex                   # contra node.name
  paramPath: 'a.b.c'                 # falla match si path no existe
  incomingEdges: 2                   # in-degree exacto
  outgoingEdges: 1
  inSubgraphWith: regex              # exige presencia de otro nodo cuyo type cumpla
assert:
  not: true                          # si match aplica, falla (prohibición)
  exists: 'options.retry'
  equals:
    'options.retry.enabled': true
  regex:
    'url': '^https://'
message: "Mensaje legible del finding."
fix:
  hint: "Sugerencia textual (no se aplica automáticamente)."
```

## Semántica

- Una regla se evalúa por cada nodo del grafo.
- Si `match` se cumple para un nodo, se evalúa `assert`.
- Si `assert` **falla**, se emite un finding con la severidad indicada.
- `assert.not: true` significa prohibición: cualquier nodo que matchee falla automáticamente.

## Composición con builtins

Las reglas DSL conviven con las builtins (REG-001..REG-VOC + AP-001..AP-006). El
`--rules-dir` se aplica de forma aditiva — no reemplaza el catálogo base.

## Ejemplos

Ver [rules-custom/prohibido-postgres-en-e1.yaml](../rules-custom/prohibido-postgres-en-e1.yaml)
y [rules-custom/no-mqtt-en-bot.yaml](../rules-custom/no-mqtt-en-bot.yaml).

## Parser

Por defecto se usa el módulo `yaml` (npm). Si no está instalado, cae a un parser
mini embebido (`src/rules/yaml-mini.mjs`) que soporta el subset descrito arriba —
sin anchors, sin multi-doc, sin flow style anidado.
