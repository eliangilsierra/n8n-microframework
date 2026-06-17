# Legacy — Validador v1

Este directorio conserva la versión 1.x del validador estático como evidencia histórica
para el documento de tesis.

## Archivos

- [`validar-flujos-v1.mjs`](validar-flujos-v1.mjs) — versión monolítica de ~400 líneas, 11
  reglas REG-*, salida Markdown plana, basada en regex sobre
  `JSON.stringify(node.parameters)`.
- [`README-v1.md`](README-v1.md) — README original del validador v1 (12 secciones, ~480
  líneas). Incluye en su §2 la justificación detallada de la elección Node.js vs Python en
  cinco subsecciones técnicas + una operativa.

## Reemplazo

v1 fue reemplazado por la **edición Lite v2** en
[`../validar-flujos.mjs`](../validar-flujos.mjs) y por la edición Pro en
[`../../validacion-pro/`](../../validacion-pro/). Decisión documentada en
[`ADR-MF-008`](../../adr/ADR-MF-008-validador-dos-ediciones.md).

Diferencias clave:

| | v1 | v2 (Lite + Pro) |
|---|---|---|
| Análisis | Regex sobre JSON serializado | Grafo dirigido tipado |
| Etapas E1–E4 | Por nombre de archivo | Por tipo de nodo (heurística) |
| Reglas | 11 REG-* | 17 (11 REG-* + 6 antipatrones AP-*) |
| Severidad | Booleano `cumple` | error/warning/info × high/medium/low confianza |
| Salidas | md, json | md, json canónico, html offline, sarif v2.1.0, junit |
| Mapeo ISO 25010 / ATAM / ADR | En documentos externos | Inyectado en cada finding |
| Tests | — | runner artesanal (Lite) + vitest (Pro) |
| DSL YAML del usuario | — | Sí (Pro) |
| Codemods `--fix` | — | Sí (Pro) |

## Política de uso

**No** ejecutar v1 en pipelines nuevos. Permanece versionado únicamente como referencia
histórica y para comparación as-is vs to-be del propio validador.
