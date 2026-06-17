# Codemods disponibles

Los codemods se aplican con `n8nmf fix [path] --rule <REG-ID> [--dry-run]`.
Cada uno modifica el JSON del flujo de forma quirúrgica y idempotente.

| Codemod | Regla | Acción | Idempotente |
|---|---|---|---|
| `add-http-retry` | REG-004 | Agrega `options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }` a nodos `httpRequest` que no lo tengan o tengan `maxRetries < 2`. | Sí |
| `envify-secret` | REG-001 | Reemplaza el valor literal de headers `x-api-key` / `authorization` / `api-key` / `x-auth-token` por la expresión n8n `={{ $env.<VAR> }}`. No toca código JS por riesgo de romper semántica. | Sí |
| `add-on-conflict` | REG-005 | Anexa ` ON CONFLICT (id) DO NOTHING` a queries `INSERT INTO ...` que no contengan `ON CONFLICT` ni `idempotency_key`. | Sí |

## Patrón de uso recomendado

```bash
# 1. Ver qué patches generaría
n8nmf fix casos-de-estudio/bot/to-be/ --rule REG-004 --dry-run

# 2. Revisar la lista
# 3. Aplicar
n8nmf fix casos-de-estudio/bot/to-be/ --rule REG-004

# 4. Re-importar el flujo en n8n y verificar
n8nmf analyze casos-de-estudio/bot/to-be/
```

## Roadmap

Codemods planeados pero **no** incluidos en v2.0:

- `add-error-workflow` — escribir `settings.errorWorkflow` en orquestador.
- `extract-e3-subflow` — extraer un nodo IO de E2 a un subflujo E3 (cambio
  estructural mayor — requiere intervención manual + ADR).
- `inject-run-id` — inyectar generación y propagación de `run_id` en E1.
