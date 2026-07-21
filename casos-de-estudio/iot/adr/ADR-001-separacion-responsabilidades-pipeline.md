# ADR-001: Separación de responsabilidades mediante subflujos orquestados

**Estado:** Aceptado
**Fecha:** 2026-04-07
**Caso:** iot
**Atributo de calidad afectado:** Mantenibilidad, Confiabilidad, Seguridad

---

## Contexto

El flujo as-is del pipeline IoT implementa en un único nodo Code (`Procesar y Detectar Alerta`)
tres responsabilidades mezcladas: parseo de campos, detección de anomalías por umbrales y
preparación del payload para InfluxDB (incluyendo la URL y el token de autenticación).

El análisis estático del JSON identificó 8 violaciones de las 10 reglas obligatorias del
micro-framework, con tres agravantes especiales para el caso IoT:

1. El token de base de datos (`db_token`) no solo está hardcodeado sino que se expone
   en el output del nodo, siendo visible en el historial de ejecuciones de n8n.
2. El campo `co2` del contrato de entrada no se procesa en ningún nodo — lectura incompleta.
3. No hay control de idempotencia: dos lecturas del mismo sensor en el mismo segundo
   generan entradas duplicadas en la base de datos sin posibilidad de detección.

Un cambio en los umbrales de temperatura (CR1 del protocolo) requiere modificar el mismo
nodo que construye el payload para la base de datos, lo que hace imposible desacoplar
la evolución del dominio de la evolución de la integración.

---

## Decisión

Aplicamos el metamodelo de 4 etapas del micro-framework al pipeline IoT, con 4 subflujos
invocados desde un orquestador mediante `Execute Workflow`:

- **E1 (Validación):** Subflujo `iot-to-be-e1-validacion` — valida presencia de campos
  obligatorios y rangos físicos, normaliza datos (redondeo), genera `run_id`.
- **E2 (Dominio):** Subflujo `iot-to-be-e2-dominio` — centraliza los umbrales en la
  constante `UMBRALES`, analiza temperatura, humedad y CO2, determina nivel de alerta.
- **E3 (Persistencia):** Subflujo `iot-to-be-e3-persistencia` — escribe en PostgreSQL
  local con clave de idempotencia `{sensor_id}-{timestamp}` y `ON CONFLICT DO NOTHING`.
- **E4 (Notificación):** Subflujo `iot-to-be-e4-notificacion` — routing por nivel
  (crítico vs warning), HTTP Request con retry, log de skip si nivel es normal.

Esta separación establece que:
1. Modificar un umbral (CR1) solo requiere tocar E2.
2. Cambiar el proveedor de notificaciones (CR2) solo requiere tocar E4.
3. Agregar validación de un nuevo campo (CR3) solo requiere tocar E1.

---

## Alternativas consideradas

- **Separar en 2 subflujos (E1+E2 juntos, E3+E4 juntos):** Reduce el overhead de Execute
  Workflow pero mezcla validación con dominio, y persistencia con notificación. Descartado
  porque el CR1 (umbral) y el CR2 (integración) estarían en el mismo subflujo, eliminando
  el beneficio de la separación.

- **Mantener monolítico con PostgreSQL y credenciales en n8n:** Corrección mínima sin
  separación arquitectónica. Descartado porque no permite medir el impacto de cambio
  por etapa, que es el objetivo del CR-log en FASE 6.

- **5 subflujos (E1, E2, E3 escritura, E3 idempotencia, E4):** Separación excesiva.
  Descartado por overhead de Execute Workflow sin beneficio adicional medible.

---

## Consecuencias

**Positivas:**
- Cambio de umbral crítico de temperatura (CR1) toca solo E2 — `nodes_touched = 1` en
  cr-log vs. el flujo as-is donde toca el nodo monolítico (impacto en toda la lógica).
- Cambio de endpoint de notificaciones (CR2) toca solo E4 — independencia total de E2.
- Credencial de PostgreSQL en n8n Credentials — `db_token` eliminado del JSON exportado
  y del historial de ejecuciones (REG-001 cumplida).
- Idempotencia con `ON CONFLICT DO NOTHING` — reintentos seguros sin duplicados.
- CO2 monitoreado en E2 junto con temperatura y humedad — contrato completo implementado.
- Notificaciones diferenciadas (crítico vs warning) — canal correcto por severidad.

**Negativas / trade-offs:**
- 4 invocaciones de Execute Workflow por ejecución exitosa generan overhead de
  ~5–15ms cada una. Latencia total estimada en 20–60ms adicionales respecto al as-is.
  Este trade-off es aceptable para el objetivo de mantenibilidad del estudio.
- Los orquestadores deben actualizarse con los IDs reales de los subflujos post-import.
  Ver procedimiento en `medicion/protocolo-evidencias.md`.
- Cambiar la base de datos de destino requiere modificar E3 y potencialmente E1 si el
  esquema de idempotencia cambia. Esto es intencional: el cambio de proveedor es una
  decisión arquitectónica que merece su propio ADR.

---

## Relación con el micro-framework

Esta decisión implementa el metamodelo E1-E4 descrito en `microframework/reglas/reglas-obligatorias.md`.
Cumple directamente: REG-001 (credenciales), REG-002 (run_id), REG-005 (idempotencia),
REG-007 (E2 sin integraciones), REG-008 (integraciones en E3/E4). El patrón de idempotencia
específico está documentado en `microframework/patrones/patron-idempotencia.md`.
