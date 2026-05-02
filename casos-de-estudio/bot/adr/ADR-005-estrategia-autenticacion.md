# ADR-005 — Estrategia de autenticación sin token hardcodeado (Bot to-be)

**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Seguridad / Confidencialidad (ISO/IEC 25010)
**Reglas relacionadas:** REG-001, REG-009
**ADR de framework:** ADR-MF-001

---

## Contexto

El flujo as-is compara el token de autenticación contra un valor literal hardcodeado
en el nodo Code `Verificar Token`:

```javascript
// As-is — ANTIPATRÓN REG-001
if (token !== "my-secret-bot-token-2024") {
  return [{ json: { error: "Unauthorized" } }];
}
```

Este valor literal aparece en el JSON exportado del flujo y queda expuesto en el
repositorio Git. Cualquier persona con acceso al repositorio puede obtener el token
y autenticarse en el webhook.

El to-be debe validar el token sin que su valor aparezca en el JSON exportado,
manteniendo la misma semántica de validación (comparación de string) y respondiendo
con el status code correcto cuando la validación falla (REG-009: 401 Unauthorized).

---

## Decisión

El token se almacena en una credencial n8n de tipo **"Header Auth"** con nombre
`bot-api-token`. La validación en E1 accede al valor por referencia:

```javascript
// To-be — cumple REG-001
const expectedToken = $credentials["bot-api-token"].value;
const providedToken = $input.first().json.headers?.authorization?.replace('Bearer ', '');

if (!providedToken || providedToken !== expectedToken) {
  // E1 retorna { valido: false, errores: ['Token de autenticación inválido o ausente'] }
  // El orquestador responde con 401 basado en este resultado
}
```

**Respuesta del orquestador cuando falla la autenticación:**
```json
HTTP 401 Unauthorized
{ "error": "Unauthorized", "run_id": "RUN-BOT-..." }
```

El `run_id` se incluye en la respuesta de error para correlación en logs.

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| JWT con verificación de firma (RS256/HS256) | Requiere la librería `jsonwebtoken` que no está disponible en el nodo Code nativo de n8n sin instalación de npm adicional — fuera del alcance LC/NC |
| Validación en API Gateway externo (NGINX, Kong) | Infraestructura fuera del alcance declarado del micro-framework; el webhook de n8n sería el punto de entrada directo |
| Comparar con variable de entorno `$env.BOT_TOKEN` | Las variables de entorno de n8n son para configuración de la instancia; exponerlas en nodos Code requiere habilitación explícita en `N8N_CUSTOM_EXTENSIONS` — menos portable |
| No validar autenticación en E1 (dejar al mock decidir) | Viola el contrato del metamodelo: E1 es el guardián del flujo; si un input no válido pasa E1, contamina E2 y E3 |

---

## Consecuencias

**Positivas:**
- El valor del token nunca aparece en el JSON exportado. `validar-flujos.mjs` lo
  confirma automáticamente (REG-001 verificado).
- El comportamiento es semánticamente idéntico al as-is: comparación de string.
- El orquestador responde 401 solo cuando la autenticación falla, no 200 como en
  el as-is (REG-009 corregido).

**Negativas:**
- La credencial `bot-api-token` debe existir en la instancia de n8n antes de importar
  el flujo. Si no existe, el nodo falla con error de credencial. Documentado en
  `docs/protocolo-evidencias.md` §3 (prerequisitos de import).

---

## Criterio de verificación

1. `validar-flujos.mjs --caso bot --estado to-be` → REG-001: ✓ CUMPLE
2. Input Set C (token ausente) → HTTP 401, `run-log-bot-to-be.csv` status=fail, error_type=authentication
3. JSON exportado no contiene el string del token como valor literal
