# ADR-003: Separación entre medición estadística y demostración del antipatrón REG-002

**Estado:** Aceptado  
**Fecha:** 2026-04-21  
**Autor:** Elian Gil  
**Contexto:** plan-mejora-medicion.md §4.1  

## Contexto

El flujo `bot-as-is.json` implementa rate limiting in-memory con umbral `LIMITE = 10` por `user_id` (nodo 3 "Verificar Rate Limit"). Con N=200 por set, este umbral produce el patrón 10✓/190✗ simétrico en todos los sets que usan tokens válidos, enmascarando la señal de los antipatrones REG-001, 003, 004, 005, 006, 007, 008, 009, 010.

## Decisión

Se mantienen **dos versiones del flujo bot as-is**:

| Archivo | Umbral | Propósito |
|---------|--------|-----------|
| `bot-as-is.json` | `LIMITE = 150` | Medición estadística principal (N=200 < 150 = sin activación del rate limit) |
| `bot-as-is-ratelimit-demo.json` | `LIMITE = 10` | Demostración cualitativa del antipatrón REG-002 (caso de estudio en memoria) |

## Justificación

1. El antipatrón REG-002 se **documenta** en `notas-tecnicas.md` y se **demuestra** mediante una corrida dedicada con el flujo demo (no entra al pool estadístico principal).
2. La serie estadística principal (N=200 × 10 sets × 2 casos × 2 versiones = 8.000 corridas) mide el efecto de los demás antipatrones sin interferencia del rate limiter.
3. El umbral 150 preserva todas las propiedades del antipatrón: sigue siendo in-memory, no distribuido, ventana fija — solo se eleva el trigger para que no se active durante la medición.

## Consecuencias

- El validador estático del micro-framework sigue marcando REG-002 en ambos flujos (threshold in-memory sin distribuir).
- La memoria del proyecto documenta explícitamente la distinción entre "medición" y "demostración".
- ADR-003 debe referenciarse en la sección de metodología de la tesis al describir el diseño cuasi-experimental.
