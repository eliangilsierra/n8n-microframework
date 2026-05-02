# ADR-MF-001 — Gestión de secretos: credenciales en n8n Credentials (REG-001)

**Nivel:** Micro-framework (aplica a todos los flujos)
**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Seguridad / Confidencialidad (ISO/IEC 25010)
**Regla relacionada:** REG-001

---

## Contexto

n8n exporta el JSON completo de cada flujo, incluyendo la configuración de todos
los nodos. Cualquier valor literal escrito en un nodo (token, password, API key)
queda expuesto en el JSON exportado. Si ese JSON se versiona en un repositorio Git
(incluso privado), el secreto es accesible a cualquier colaborador con acceso al
repositorio y queda en el historial de Git de forma permanente.

Este problema afecta a todos los flujos n8n, no solo a los de este proyecto.
La literatura identifica el hardcoding de credenciales como uno de los antipatrones
más frecuentes en flujos LC/NC (ver OWASP A02:2021 Cryptographic Failures).

El micro-framework debe definir un mecanismo obligatorio y verificable para evitar
que credenciales aparezcan en el JSON exportado.

---

## Decisión

Toda credencial (token de autenticación, API key, password de base de datos,
secret de servicio externo) se almacena exclusivamente en el **sistema de Credentials
de n8n** y se referencia en los nodos únicamente por nombre.

**En nodos HTTP Request:**
```
Authentication: Generic Credential Type
Credential Type: Header Auth
Credential: "nombre-de-la-credencial" (selector de n8n)
```

**En nodos Postgres:**
```
Credential: "nombre-de-la-credencial" (selector de n8n)
```

**En nodos Code** (cuando se necesita el valor en lógica JS):
```javascript
const token = $credentials["nombre-de-la-credencial"].value;
```

El JSON exportado contendrá solo el nombre de la credencial, nunca su valor.

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Variables de entorno en Code nodes (`process.env.SECRET`) | El valor de `process.env` sigue siendo un valor literal si se asigna a una variable antes de usarse; además, n8n en Docker no expone variables de entorno del host a los nodos Code por defecto |
| HashiCorp Vault con lookup dinámico | Dependencia de infraestructura externa — fuera del alcance declarado del micro-framework (LC/NC sin dependencias externas) |
| Secretos como parámetros de entrada del webhook | El secreto quedaría en los logs del orquestador (run-logs) y en el payload de entrada — peor exposición |
| `.env` file referenciado desde `docker-compose.yml` | Las variables de entorno de n8n son para configuración de la instancia, no para secretos de integraciones específicas por flujo |

---

## Consecuencias

**Positivas:**
- El secreto nunca aparece en el JSON exportado ni en el historial de Git.
- `validar-flujos.mjs` puede verificar automáticamente el cumplimiento buscando
  patrones de valores literales (tokens, passwords) en el JSON.
- Compatible con rotación de credenciales: cambiar el valor en n8n Credentials
  actualiza todos los flujos que la referencian sin modificar ningún JSON.

**Negativas:**
- Acoplamiento al mecanismo de Credentials de n8n: migrar a otra plataforma requiere
  re-configurar las credenciales en el nuevo sistema.
- Las credenciales no están bajo control de versiones (son configuración de instancia).
  El `.env.example` y el `protocolo-evidencias.md` documentan qué credenciales deben
  existir para reproducir el entorno.

---

## Criterio de verificación (REG-001)

```bash
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be
# El resultado debe incluir: REG-001: ✓ CUMPLE
```

El script busca en el JSON exportado los patrones:
- Cadenas que contengan `password`, `token`, `api_key`, `Bearer`, `secret` como
  valores literales (no como nombres de campos).
- Valores en `rightValue` de comparaciones IF que sean tokens de autenticación.
- Valores en `jsCode` que sean asignaciones de secretos literales.
