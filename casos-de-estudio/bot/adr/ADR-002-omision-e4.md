# ADR-002: Omisión deliberada de E4 como subflujo independiente en el caso Bot

**Estado:** Aceptado
**Fecha:** 2026-04-17
**Caso:** bot
**Atributo de calidad afectado:** Mantenibilidad, Eficiencia de desempeño

---

## Contexto

El metamodelo del micro-framework (ver `microframework/microframework-spec.md`) define
cuatro etapas lógicas: E1 validación, E2 dominio, E3 adaptadores, E4 salida controlada.
El caso IoT las implementa todas como subflujos invocados con `Execute Workflow`.

El caso Bot, en cambio, implementa E1 inline en el orquestador (ver ADR-001) y la
etapa E4 de "salida controlada" se resuelve con un único nodo `Respond to Webhook`
dentro del mismo orquestador, sin crear un subflujo dedicado.

Esta decisión requiere justificación explícita para mantener la coherencia del
metamodelo y poder ser verificada en la evaluación ATAM y en el análisis de
trazabilidad.

---

## Decisión

En el caso Bot, la etapa E4 se implementa como un **nodo inline** (`Respond to Webhook`)
dentro del orquestador, no como un subflujo independiente invocado vía `Execute Workflow`.

La responsabilidad lógica de E4 ("producir la respuesta final aplicando el contrato de
salida documentado y el routing por nivel") se mantiene; lo que cambia es la
granularidad de implementación.

El caso IoT sí mantiene E4 como subflujo porque su salida involucra routing por
severidad y dos endpoints de notificación diferenciados (crítico vs warning), con
retry configurado por canal. Esa lógica justifica el subflujo.

---

## Alternativas consideradas

- **Crear un subflujo `bot-to-be-e4-salida.json`:** Descartado. La salida del Bot es
  un único `Respond to Webhook` con un payload estructurado; encapsularla añade
  latencia de `Execute Workflow` (5–15 ms en entorno local) sin beneficio de
  reutilización ni de aislamiento.

- **Omitir E4 del metamodelo del Bot sin ADR:** Descartado. Dejaría una inconsistencia
  silenciosa entre la especificación del micro-framework y la implementación del caso,
  afectando la trazabilidad.

---

## Consecuencias

**Positivas:**
- Sin overhead adicional de `Execute Workflow` en el camino crítico del Bot.
- El orquestador del Bot mantiene 3 invocaciones a subflujos (E2 y E3) más los nodos
  inline de E1 y E4, lo que lo deja con una complejidad visual manejable.
- La simetría con IoT se conserva a nivel **lógico**, no a nivel de implementación.

**Negativas / trade-offs:**
- Un cambio futuro en la lógica de salida del Bot (p. ej. agregar notificación a
  Slack además del webhook) requerirá refactorizar el orquestador para extraer
  E4 a un subflujo. Se acepta ese riesgo porque el caso Bot actual no lo necesita.
- El script de validación estática (ver `microframework/validacion/validar-flujos.mjs`)
  debe considerar esta excepción: para el caso Bot, la verificación de E4 se hace
  sobre el orquestador, no sobre un archivo `*-e4-*.json`.

---

## Relación con el micro-framework

El metamodelo E1–E4 se mantiene como **cuatro responsabilidades lógicas**, no como
cuatro subflujos obligatorios. La regla REG-008 ("integraciones solo en E3 y E4") se
sigue cumpliendo: el `Respond to Webhook` del orquestador del Bot es E4 inline y no
contiene llamadas a servicios externos (esas están en el subflujo E3 de adaptador).

Esta decisión formaliza el criterio: **E4 puede implementarse inline cuando la salida
es un único canal sin routing**. Cualquier salida con routing (multi-canal, por
severidad, por tipo de usuario) exige subflujo dedicado.
