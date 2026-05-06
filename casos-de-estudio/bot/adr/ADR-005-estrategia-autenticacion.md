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

El token se lee desde la variable de entorno `BOT_API_TOKEN` a través de `$env.BOT_API_TOKEN`
en el nodo Code de E1. La validación compara el token recibido en el body con el valor
configurado en el entorno, sin que ese valor aparezca en el JSON del flujo:

```javascript
// To-be — cumple REG-001 (ADR-005)
const tokenPresente = !!body.token;

if (tokenPresente) {
  try {
    const expectedToken = $env.BOT_API_TOKEN;
    if (expectedToken && body.token !== expectedToken) {
      errores.push('Token de autenticacion invalido');
      unauthorized = true;
    }
  } catch(e) { /* $env no disponible — solo se valida presencia */ }
}
```

El bloque `try/catch` cubre versiones del sandbox de n8n donde `$env` no está disponible
como global — en ese caso el flujo acepta cualquier token no vacío (fail-open documentado,
intencionado para entornos de desarrollo sin la variable configurada).

El flag `unauthorized` se propaga al orquestador, que distingue entre:
- `token ausente` → `errores[]` → `valido: false` → **400 Bad Request**
- `token presente pero inválido` → `unauthorized: true` → **401 Unauthorized**

**Respuesta del orquestador cuando la autenticación falla:**
```json
HTTP 401 Unauthorized
{ "ok": false, "run_id": "RUN-BOT-...", "error": "Token de autenticacion invalido" }
```

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| JWT con verificación de firma (RS256/HS256) | Requiere la librería `jsonwebtoken` que no está disponible en el nodo Code nativo de n8n sin instalación de npm adicional — fuera del alcance LC/NC |
| Validación en API Gateway externo (NGINX, Kong) | Infraestructura fuera del alcance declarado del micro-framework; el webhook de n8n sería el punto de entrada directo |
| Credencial n8n tipo "Header Auth" (`$credentials["bot-api-token"].value`) | Incompatible con el nodo Code en n8n 2.14.x — `$credentials` no está disponible como global en el sandbox del nodo Code; solo es accesible desde nodos con soporte explícito de credenciales (HTTP Request, etc.) |
| No validar autenticación en E1 (dejar al mock decidir) | Viola el contrato del metamodelo: E1 es el guardián del flujo; si un input no válido pasa E1, contamina E2 y E3 |

---

## Consecuencias

**Positivas:**
- El valor del token nunca aparece en el JSON exportado. `validar-flujos.mjs` lo
  confirma automáticamente (REG-001 verificado).
- El comportamiento es semánticamente idéntico al as-is: comparación de string.
- El orquestador responde 401 cuando el token es inválido y 400 cuando está ausente,
  en lugar del 200 incorrecto del as-is (REG-009 corregido).
- No requiere ninguna configuración adicional de credenciales en la instancia n8n —
  solo la variable `BOT_API_TOKEN` en el `.env` (ya documentada en `.env.example`).

**Negativas / Trade-offs:**
- La variable `BOT_API_TOKEN` debe configurarse en el `.env` del entorno. Si no está
  definida, `$env.BOT_API_TOKEN` devuelve `undefined` y el flujo acepta cualquier token
  no vacío (fail-open). Este comportamiento es intencionado para entornos de desarrollo
  y está documentado en el comentario del `catch`.
- Si en una versión futura de n8n `$env` queda restringido, la validación de valor
  se desactiva automáticamente sin fallo del flujo — la presencia del token sí se
  sigue validando.

---

## Criterio de verificación

1. `validar-flujos.mjs --caso bot --estado to-be` → REG-001: ✓ CUMPLE
2. Input Set C (token ausente) → HTTP 400, `run-log-bot-to-be.csv` status=fail, error_type=validation
3. Input Set C con token presente pero incorrecto → HTTP 401, error_type=authentication
4. JSON exportado no contiene el string del token como valor literal
5. `BOT_API_TOKEN` definida en `.env.example` como referencia
