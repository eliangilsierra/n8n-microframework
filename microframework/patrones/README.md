> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# patrones/ — Patrones de resiliencia documentados

**Ruta:** `microframework/patrones/`
**Pertenece a:** [`microframework/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta documenta **5 patrones de diseño de resiliencia** aplicables a las etapas E3
(adaptadores de integración) y E4 (salida controlada) del micro-framework. Cada patrón
incluye el problema que resuelve, la solución con código de ejemplo para n8n, trade-offs
explícitos y su relación con las reglas obligatorias o ADR relevantes.

## Contenido de esta carpeta

| Patrón | Problema que resuelve | Regla relacionada |
|---|---|---|
| [`patron-retry.md`](patron-retry.md) | Fallos transitorios en servicios externos (timeout, rate limit) | REG-004 |
| [`patron-idempotencia.md`](patron-idempotencia.md) | Registros duplicados por reintentos | REG-005 |
| [`patron-circuit-breaker.md`](patron-circuit-breaker.md) | Saturación de un servicio externo caído por reintentos continuos | Complementa REG-004 (recomendado, no obligatorio en v1.0) |
| [`patron-error-boundary.md`](patron-error-boundary.md) | Pérdida definitiva de datos cuando E3 agota todos sus reintentos | Complementa REG-004 (recomendado) |
| [`patron-saga-compensacion.md`](patron-saga-compensacion.md) | Inconsistencia parcial cuando E3 (persistencia) tiene éxito pero E4 (notificación) falla | Complementa REG-003 (recomendado) |

## Relación con la metodología

Solo `patron-retry.md` y `patron-idempotencia.md` respaldan reglas **obligatorias**
(REG-004 y REG-005 respectivamente); los otros tres son patrones **recomendados** para
sistemas con requisitos más estrictos de no pérdida de datos o consistencia eventual, y no
son parte del criterio binario del checklist de arquitectura. Todos aplican a las etapas
E3/E4 del metamodelo (ver
[`microframework/microframework-spec.md`](../microframework-spec.md)).

## Navegación

- Padre: [`microframework/`](../README.md)
- Ver también: [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.md) · [`microframework/checklists/checklist-arquitectura.md`](../checklists/checklist-arquitectura.md)
