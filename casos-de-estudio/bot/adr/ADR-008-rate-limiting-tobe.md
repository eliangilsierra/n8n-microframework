# ADR-008 — Eliminación del rate-limiter en el to-be: stateless por diseño

**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Mantenibilidad / Modularidad + Fiabilidad / Madurez (ISO/IEC 25010)
**Reglas relacionadas:** REG-002
**Escenario ATAM:** BOT-Q1 (impacto indirecto — elimina estado que complica CR1)

---

## Contexto

El flujo as-is implementa rate-limiting in-memory usando `$getWorkflowStaticData('global')`:

```javascript
// As-is — ANTIPATRÓN REG-002
const staticData = $getWorkflowStaticData('global');
const LIMITE = 150; // ajustado para medición estadística
if (!staticData.contador) staticData.contador = {};
staticData.contador[userId] = (staticData.contador[userId] || 0) + 1;
if (staticData.contador[userId] > LIMITE) {
  return [{ json: { error: "Rate limit exceeded" } }];
}
```

Este mecanismo tiene tres problemas documentados (ADR-003 Bot):

1. **No determinístico para medición:** el contador persiste entre corridas de
   medición, haciendo que los resultados dependan del orden de ejecución.
2. **Se pierde al reiniciar n8n:** `$getWorkflowStaticData` es volátil — un
   reinicio del contenedor resetea todos los contadores.
3. **Viola REG-002:** el `run_id` no puede correlacionar con el estado del
   rate-limiter porque ese estado no está en el log estructurado.

El to-be debe corregir esta situación. La pregunta es: ¿cómo debe implementarse
el rate-limiting en el to-be, o debe eliminarse?

---

## Decisión

El to-be **elimina** el rate-limiter del flujo. El flujo to-be es completamente
**stateless** entre ejecuciones.

**Justificación:**

El rate-limiting es una preocupación de **infraestructura**, no de **lógica de
aplicación**. Las responsabilidades correctas de cada capa son:

| Capa | Responsabilidad | Mecanismo |
|------|----------------|-----------|
| API Gateway / Load Balancer | Rate limiting por IP o token | NGINX `limit_req`, AWS API Gateway throttling |
| n8n webhook | Autenticación (¿quién puede llamar?) | E1 valida token (ADR-005) |
| E1 — Validación | Validez del payload (¿el mensaje es válido?) | Campos, tipos, rangos |
| E2 — Dominio | Reglas de negocio puras | Clasificación, prioridad |

Un flujo n8n no es el lugar correcto para implementar rate-limiting distribuido.
El rate-limiter in-memory del as-is es un antipatrón porque introduce estado
que contamina la semántica de las ejecuciones individuales.

El flujo to-be delega el rate-limiting al operador de infraestructura (en un
entorno real: API Gateway o NGINX frente al webhook de n8n). En el entorno de
laboratorio del proyecto, no hay límite de rate porque el objetivo es medir el
comportamiento del flujo sin la interferencia del estado acumulado.

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Rate-limiter distribuido con Redis | Dependencia externa fuera del alcance del proyecto; introduce estado que viola REG-002 de forma más sofisticada pero igualmente problemática |
| Rate-limiter in-memory con ventana más larga (LIMITE=10000) | Sigue siendo estado acumulado entre ejecuciones — el antipatrón REG-002 persiste |
| Rate-limiter con timestamp (ventana deslizante) | Más correcto que el contador simple, pero sigue siendo estado local no distribuido |
| Mantener el rate-limiter como está | El objetivo del to-be es demostrar la corrección de REG-002, no preservar el antipatrón |

---

## Consecuencias

**Positivas:**
- El flujo to-be es completamente determinístico: el resultado de una ejecución
  no depende del estado de ejecuciones anteriores.
- REG-002 se satisface al eliminar el estado, no al trasladarlo a otro mecanismo.
- Los Input Sets K (idempotencia) y todos los demás producen resultados reproducibles
  independientemente del orden de ejecución.
- La medición comparativa FASE 6 es válida: no hay interferencia de estado acumulado.

**Negativas:**
- En un entorno productivo real, el flujo to-be no tiene protección contra abuso por
  volumen. Esto debe documentarse como limitación del alcance del proyecto: el
  micro-framework no incluye infraestructura de red.

---

## Nota sobre el as-is

El as-is mantiene el rate-limiter con `LIMITE=150` (configurado en ADR-003 Bot) para
garantizar que las 200+ corridas de medición estadística no sean truncadas por el
límite. Esta es la única modificación al antipatrón as-is justificada para la
medición — el antipatrón REG-002 sigue presente en el diseño (in-memory, volátil),
solo el valor numérico del límite cambia.

---

## Criterio de verificación

1. JSON del flujo to-be no contiene `$getWorkflowStaticData` en ningún nodo
2. `validar-flujos.mjs --caso bot --estado to-be` → REG-002: ✓ CUMPLE
3. Input Set A ejecutado 200 veces consecutivas → `success_rate = 100%` (sin rate-limit)
