# ADR-001: Separación de responsabilidades mediante subflujos orquestados

**Estado:** Aceptado
**Fecha:** 2026-04-07
**Caso:** bot
**Atributo de calidad afectado:** Mantenibilidad, Trazabilidad

---

## Contexto

El flujo as-is del chatbot de soporte implementa en un único flujo monolítico: la
validación del token, la clasificación del mensaje, la llamada al servicio externo de
tickets y la generación de la respuesta. El análisis estático del JSON identificó las
siguientes consecuencias directas de esta arquitectura:

- Cambiar una regla de clasificación (e.g., la prioridad de facturación) requiere
  modificar el mismo nodo donde se construye el payload del sistema de tickets.
- No es posible probar la lógica de clasificación de forma aislada sin invocar el
  servicio externo.
- La adición de una nueva categoría (e.g., "soporte_técnico") requiere insertar nodos
  IF adicionales en el flujo principal, aumentando el acoplamiento entre lógica de
  negocio y presentación.
- El flujo tiene 7 violaciones de las 10 reglas obligatorias del micro-framework,
  incluidas credenciales hardcodeadas y ausencia de trazabilidad.

Se necesita una decisión arquitectónica que justifique el rediseño to-be y documente
los trade-offs asumidos.

---

## Decisión

Aplicamos el metamodelo de 4 etapas del micro-framework al caso Bot, separando el flujo
monolítico en un orquestador y 2 subflujos invocados con `Execute Workflow`:

- **E1 (Validación):** Implementada inline en el orquestador — valida token, message,
  user_id y longitud. Genera `run_id`.
- **E2 (Dominio):** Subflujo `bot-to-be-e2-dominio` — centraliza las 5 reglas de
  clasificación (R001–R004 + DEFAULT) en una constante modificable.
- **E3 (Adaptador):** Subflujo `bot-to-be-e3-adaptador` — maneja la integración con el
  sistema de tickets con retry y control de idempotencia.

Esta separación establece que:
1. Modificar una regla de clasificación solo requiere tocar E2.
2. Cambiar el proveedor de tickets solo requiere tocar E3.
3. Cada etapa puede verificarse con el checklist REG-007 y REG-008.

---

## Alternativas consideradas

- **Mantener flujo monolítico con mejoras:** Agregar retry, logs y corregir credenciales
  sin cambiar la estructura. Descartado porque no resuelve el acoplamiento entre reglas
  de negocio y adaptadores, que es el objeto de estudio del trabajo.

- **Microservicios externos:** Extraer la lógica a servicios REST externos invocados
  desde n8n. Descartado porque sale del alcance de LC/NC y requiere infraestructura
  adicional no contemplada en el proyecto.

- **4 subflujos separados (E1 propio):** Crear un subflujo dedicado solo para E1.
  Descartado para el caso Bot porque la validación de token es simple y mantenerla en el
  orquestador reduce el overhead de Execute Workflow sin pérdida de separación.

---

## Consecuencias

**Positivas:**
- Cambio en una regla de negocio (CR1) toca únicamente E2 — impacto de cambio medible
  como reducción en `nodes_touched` del cr-log.
- Cambio en el proveedor de tickets (CR2) toca únicamente E3 — independencia de
  integraciones verificable en ATAM.
- `run_id` generado en E1 propagado a toda la ejecución — trazabilidad completa.
- Credenciales en n8n Credentials — REG-001 cumplida, secretos eliminados del JSON.

**Negativas / trade-offs:**
- La latencia de E2 y E3 incluye overhead del nodo Execute Workflow (estimado: 5–15ms
  por invocación en entorno local). Aceptable dado que el objetivo es evaluación de
  mantenibilidad, no optimización de latencia.
- Después de importar los subflujos en n8n, los orquestadores deben actualizarse
  manualmente con los IDs reales asignados por n8n. Procedimiento documentado en
  `medicion/protocolo-evidencias.md`.

---

## Relación con el micro-framework

Esta decisión implementa el metamodelo E1-E4 descrito en `microframework/reglas/reglas-obligatorias.md`,
específicamente las reglas REG-007 (lógica en E2), REG-008 (integraciones en E3) y
REG-002 (run_id propagado). El patrón de separación es el objetivo central del
micro-framework y el objeto de comparación principal del estudio.
