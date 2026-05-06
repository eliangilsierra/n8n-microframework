# ADR-003: Separación entre medición estadística y demostración del antipatrón REG-002

**Estado:** Aceptado
**Fecha:** 2026-04-21
**Caso:** bot
**Atributo de calidad afectado:** Mantenibilidad, Trazabilidad (validez interna metodológica)

---

## Contexto

El flujo `bot-as-is.json` implementa rate-limiting in-memory con `$getWorkflowStaticData('global')`
por `user_id` (nodo 3 "Verificar Rate Limit"). El diseño inicial usaba `LIMITE = 10` para hacer
visible rápidamente el antipatrón REG-002 (rate-limit no distribuido, sin reset al reiniciar el
contenedor, con ventana fija de 60 segundos).

Con N=200 corridas por set e Input Sets que reutilizan el mismo `user_id` (A, B, D, E usan
`user-001` en todos los payloads), el umbral 10 produce un patrón simétrico 10✓/190✗ en todos
los sets que usan tokens válidos. Esta señal satura los run-logs y **enmascara** las violaciones
de REG-001, REG-003, REG-004, REG-005, REG-006, REG-007, REG-008, REG-009 y REG-010, impidiendo
que el análisis estadístico comparativo (FASE 6) atribuya correctamente las diferencias de
latencia, tasa de error y comportamiento al micro-framework vs. al rate-limiter. La decisión
metodológica debe tomarse antes de iniciar FASE 4 porque define el diseño experimental de
la medición to-be.

---

## Decisión

Mantenemos **dos versiones paralelas del flujo bot as-is**:

| Archivo | Umbral | Propósito |
|---------|--------|-----------|
| `bot-as-is.json` | `LIMITE = 150` | Medición estadística principal (N=200 por set < 150 = rate-limit no se activa) |
| `bot-as-is-ratelimit-demo.json` | `LIMITE = 10` | Demostración cualitativa del antipatrón REG-002 (no entra al pool estadístico) |

El umbral 150 **preserva todas las propiedades patológicas** del antipatrón REG-002:
sigue siendo in-memory, no distribuido, ventana fija de 60 segundos, sin reset limpio entre
sesiones. Solo se eleva el trigger para que no se active durante la medición principal.

El archivo demo se ejecuta una vez en FASE 5 (piloto) para producir la evidencia cualitativa
de REG-002 y se referencia en la tesis como "caso de estudio en memoria" separado de la
serie estadística.

---

## Alternativas consideradas

- **Mantener un solo flujo con LIMITE=10 y reducir N a 10 por set:** Preserva el
  antipatrón visible pero reduce el N efectivo de 200 a 10 por set. Con 10 sets × 10
  corridas = 100 mediciones por caso × versión, el poder estadístico para detectar
  diferencias de latencia p95 cae por debajo del 0.6 (G*Power, α=0.05, efecto medio
  esperado 15%). Descartado: compromete la validez estadística de FASE 6.

- **Excluir las corridas post-rate-limit del pool estadístico (filtrado por `status='fail'`
  con `error_type='rate_limit'`):** Posible en post-proceso pero introduce sesgo de
  selección porque los fallos del rate-limiter están correlacionados con el orden temporal
  del set. Descartado: viola el supuesto de independencia requerido por Mann-Whitney U
  y t-test.

- **Usar `user_id` distinto por corrida para evadir el rate-limit:** Requiere modificar
  los datasets (el set A contempla por diseño un único `user_id` para probar idempotencia
  en ese nivel). Descartado: altera el diseño de los Input Sets documentado en las
  fichas técnicas.

- **Dos versiones paralelas (elegida):** Separa explícitamente medición de demostración.
  Overhead de mantenimiento mínimo porque solo difiere una constante.

---

## Consecuencias

**Positivas:**
- N=200 corridas por set viables sin activación del rate-limit en el flujo principal,
  preservando poder estadístico para t-test y Mann-Whitney U en FASE 6.
- El antipatrón REG-002 se documenta formalmente en `notas-tecnicas.md` y se demuestra
  empíricamente con una corrida dedicada del flujo demo — evidencia cualitativa
  disponible sin contaminar el pool estadístico.
- Serie estadística principal limpia de 8 000 corridas (N=200 × 10 sets × 2 casos × 2
  versiones) sin interferencia del rate-limiter.
- El validador estático sigue marcando REG-002 como violada en ambas versiones (la
  violación está en la arquitectura, no en el valor numérico).

**Negativas / trade-offs:**
- Mantenimiento dual: los dos archivos deben mantenerse sincronizados en todos los
  demás aspectos (token hardcodeado, INSERT sin ON CONFLICT, etc.). Mitigación:
  convención documentada de que solo difieren en la línea `const LIMITE = …;`.
- Un reviewer externo podría interpretar el umbral 150 como "el bot ya no tiene el
  antipatrón". Mitigación: este ADR se referencia explícitamente en la sección de
  metodología de la tesis y en las notas técnicas del as-is.
- La demostración cualitativa de REG-002 requiere una corrida manual adicional en
  FASE 5 no cubierta por el pipeline automatizado.

---

## Relación con el micro-framework

- **REG-002 (idempotencia / trazabilidad del estado):** el flujo as-is viola la regla
  al mantener estado de rate-limit en `$getWorkflowStaticData('global')` — estado
  no distribuido, sin persistencia entre reinicios. La violación existe en ambas
  versiones independientemente del valor de `LIMITE`.
- **Metodología experimental (fuera del catálogo REG-*):** este ADR documenta una
  decisión de validez interna del estudio, no una decisión arquitectónica del
  micro-framework. Se registra como ADR porque afecta la reproducibilidad y la
  interpretación de los resultados.
- **Referencias cruzadas:**
  - `casos-de-estudio/bot/as-is/notas-tecnicas.md` §REG-002
  - `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` (change-log CR-ASIS-03)
  - `docs/protocolo-evidencias.md` §5 (run-logs)
