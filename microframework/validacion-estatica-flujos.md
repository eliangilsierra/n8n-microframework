# Validación estática de flujos n8n

Pilar 2 de DevSecOps del micro-framework (§4.3 del anteproyecto: "Validaciones
Automatizadas — Implementación de análisis estáticos sobre la estructura de los flujos
dentro del pipeline de despliegue").

Este documento especifica el análisis estático que se ejecuta sobre los archivos JSON
exportados desde n8n para verificar el cumplimiento binario de las reglas obligatorias
del micro-framework (REG-001 a REG-010) sin necesidad de ejecutar el flujo.

---

## Objetivo

Automatizar la verificación del checklist de arquitectura y del checklist DevSecOps
sobre los archivos JSON versionados, convirtiendo cada regla en un predicado que el
script evalúa a "cumple / no cumple" con una evidencia textual (ruta dentro del JSON).

El resultado alimenta:
- `% cumplimiento checklist` (meta ≥ 90% en to-be).
- Evidencia para la matriz de trazabilidad del caso.
- Detección temprana de regresiones al versionar cambios en los flujos.

---

## Alcance

Se valida todo archivo JSON bajo:

- `casos-de-estudio/{caso}/{as-is,to-be}/*.json`
- `microframework/plantillas/*.json`

El validador es intencionalmente tolerante con el as-is: reporta cada violación pero
no falla, porque el as-is representa el antipatrón por diseño. Para el to-be la salida
es "fail" si alguna regla obligatoria no se cumple.

---

## Reglas a verificar (mapeo a REG-*)

| Regla | Verificación estática | Cómo se evalúa sobre el JSON |
|---|---|---|
| REG-001 | Sin credenciales hardcodeadas | Buscar patrones en valores de `parameters`: tokens con prefijos típicos (`Bearer `, `sk-`, `ghp_`), variables con nombre `token`, `api_key`, `password`, `secret` cuyo valor sea literal y no una expresión `={{ }}` o una referencia a credencial. |
| REG-002 | `run_id` propagado | Todo subflujo cuyo trigger sea `Execute Workflow Trigger` debe declarar `run_id` como campo esperado en inputs y como campo presente en al menos un `console.log(JSON.stringify({...}))`. |
| REG-003 | `errorWorkflow` configurado | En orquestadores (archivos con sufijo `-orquestador.json`), verificar que `settings.errorWorkflow` esté definido y no vacío. |
| REG-004 | Retry habilitado en HTTP | Todo nodo cuyo `type` sea `n8n-nodes-base.httpRequest` debe tener `parameters.options.retry.enabled === true` y `maxRetries >= 2`. |
| REG-005 | Idempotencia en escrituras | Todo nodo cuyo `type` sea `n8n-nodes-base.postgres` y `operation === 'insert'` (o equivalente) debe contener la cláusula `ON CONFLICT` en su query, o el payload debe incluir `idempotency_key`. |
| REG-006 | Log estructurado por etapa | Cada archivo debe contener al menos un `console.log(JSON.stringify(` con los campos `run_id`, `etapa`, `status`, `start_ts`, `end_ts`, `duracion_ms` (regex sobre el código JS serializado). |
| REG-007 | Dominio aislado | Los archivos `*-e2-dominio.json` no deben contener nodos `httpRequest`, `postgres`, ni ningún nodo con `category` externa (ejecución de IO). |
| REG-008 | Integraciones solo en E3/E4 | Los nodos `httpRequest` y `postgres` solo pueden aparecer en archivos `*-e3-*.json`, `*-e4-*.json` o `*-orquestador.json`. |
| REG-009 | Status codes HTTP apropiados | Los nodos `respondToWebhook` del orquestador deben usar al menos dos `responseCode` diferentes (éxito + error) a lo largo del flujo. |
| REG-010 | ADR presente | Fuera del JSON: el caso (`casos-de-estudio/{caso}/adr/`) contiene al menos un archivo `ADR-*.md`. |

---

## Implementación sugerida

Script único en Node.js o Python que:

1. Recorre los directorios de flujos.
2. Parsea cada JSON y produce un informe por archivo.
3. Agrega un resumen global con `% cumplimiento` por caso y estado.
4. Emite salida en dos formatos: humano (Markdown) y máquina (JSON).

Estructura sugerida:

```
microframework/validacion/
├── validar-flujos.mjs        script principal (Node, sin dependencias externas)
├── reglas/
│   ├── REG-001-sin-secretos.mjs
│   ├── REG-002-run-id.mjs
│   ├── ...
└── reportes/
    └── validacion-YYYY-MM-DD.md    salida versionable con el resultado
```

---

## Uso esperado

```bash
# Validar todo el repositorio
node microframework/validacion/validar-flujos.mjs

# Validar un único caso
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be

# Salida JSON para integrar en CI
node microframework/validacion/validar-flujos.mjs --format json > reporte.json
```

El reporte generado se archiva en `microframework/validacion/reportes/` y se referencia
en la matriz de trazabilidad del caso como evidencia del cumplimiento del checklist.

---

## Relación con el anteproyecto

Este artefacto cierra el Pilar 2 de DevSecOps (§4.3) y contribuye a dos resultados:

- **R1** (Micro-framework): el validador forma parte del paquete entregable, porque
  hace verificable el "criterio binario" de cada regla.
- **R4** (Protocolo ATAM): provee evidencia reproducible para las métricas de cobertura
  de checklist y exposición de secretos, citadas en los escenarios Top-K.

La implementación del script es una actividad de FASE 3 (cierre del micro-framework
v1.0) y debe completarse antes del inicio de FASE 5 (prueba piloto de instrumentos).
