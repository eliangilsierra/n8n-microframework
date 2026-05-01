# ADR-004: Routing diferenciado de E4 por severidad del evento

**Estado:** Aceptado
**Fecha:** 2026-04-21
**Caso:** iot
**Atributo de calidad afectado:** Adecuación funcional, Confiabilidad, Mantenibilidad

---

## Contexto

El flujo `iot-as-is.json` envía todas las notificaciones de eventos (advertencia y crítico)
por el mismo canal HTTP (`/api/notify`, nodo 11 "Notificar Evento"), con un único timeout
y sin política de retry diferenciada. Las consecuencias observables en el as-is:

1. **Eventos críticos comparten cola con advertencias:** un pico de advertencias retrasa
   la entrega de eventos críticos, aumentando el Time-to-Detect (TTD) de condiciones de
   riesgo.
2. **Retry uniforme insuficiente:** el as-is no tiene retry (REG-004 violada); cuando
   agregamos retry al to-be, usar los mismos parámetros para críticos y advertencias
   desperdicia intentos en advertencias no urgentes o subestima la importancia de los
   críticos.
3. **Acoplamiento orquestador-integración:** el nodo IF de decisión de notificación está
   inline en el orquestador principal, mezclando lógica de dominio (¿es crítico?) con
   lógica de integración (¿qué endpoint?) — viola REG-008.

El to-be debe definir cómo se enrutarán las notificaciones del subflujo E4
(`iot-to-be-e4-integracion`) para que el CR2 (cambio de endpoint de notificación) sea
local y el TTD de críticos quede desacoplado del tráfico de advertencias.

La matriz de trazabilidad IoT referencia este ADR como "(pendiente)" — su creación es
requisito de cierre formal de FASE 3.

---

## Decisión

Implementamos E4 como **subflujo independiente con branch IF por `nivel`** y dos
integraciones HTTP distintas:

```
E4 (iot-to-be-e4-integracion)
├── Validar input contra iot-e4-input.schema.json
├── IF nivel == "critico"
│   └── POST /api/notify/urgent
│       · timeout: 2000 ms
│       · retry: 5 intentos, backoff exponencial base 200ms
│       · header X-Priority: high
│       · alerta operacional si falla definitivamente
└── ELSE (nivel == "advertencia")
    └── POST /api/notify
        · timeout: 5000 ms
        · retry: 3 intentos, backoff exponencial base 500ms
        · header X-Priority: normal
        · log estructurado si falla definitivamente
```

**Normalización de vocabulario:** el campo `nivel` llega al subflujo con el enum oficial
definido por ADR-002 IoT (`normal` | `advertencia` | `critico`). E4 no se invoca para
`nivel == "normal"` (decisión del orquestador).

**Contrato:** `microframework/contratos/iot-e4-output.schema.json` declara el schema de
respuesta con `{ notified: bool, channel: "urgent"|"normal", attempts: int, duration_ms }`
para que el orquestador pueda registrar métricas diferenciadas por canal.

---

## Alternativas consideradas

- **E4 inline en el orquestador (como Bot):** funcional para flujos con una sola
  integración. Descartado: IoT tiene 2 canales + validación + log estructurado por canal
  = >5 nodos de lógica de integración, que inline violarían REG-008 (separación
  dominio/integración) y dificultarían el CR2 (cambio de endpoint tocaría orquestador).

- **Canal único con prioridad en payload (`priority: "high"|"normal"`):** simplifica la
  arquitectura a un solo endpoint. Descartado: la operativa de notificación urgente
  requiere SLA diferente (timeouts, retries, alerta al fallar), lo cual no se puede
  expresar sólo con un header — la decisión de ruta debe ser arquitectónica, no
  aplicativa. Además el TTD de críticos seguiría acoplado al tráfico de advertencias.

- **Queue asíncrono (Redis Streams / SQS / RabbitMQ) con priority lanes:** el patrón
  estándar para desacoplar productores de consumidores críticos. Descartado: introduce
  dependencia externa (broker) fuera del alcance LC/NC del proyecto y contradice el
  principio del micro-framework de que las decisiones arquitectónicas se implementen
  con primitivas nativas de n8n cuando sea posible.

- **Sub-subflujos separados (uno por canal):** granularidad máxima con E4-urgent y
  E4-normal como subflujos independientes. Descartado por YAGNI: duplica la validación
  de input y el log estructurado sin beneficio arquitectónico respecto al IF interno.
  Si en el futuro aparecen >3 canales, se reconsidera.

- **Routing por endpoint dinámico calculado desde `UMBRALES`:** una sola llamada HTTP
  con URL construida a partir del nivel (`/api/notify/${nivel}`). Descartado:
  acopla la URL a los valores del enum, dificulta la evolución de los canales y rompe
  la legibilidad del flujo en el canvas de n8n.

---

## Consecuencias

**Positivas:**
- **TTD de críticos desacoplado:** picos de advertencias no afectan la latencia del
  canal urgente. Medible en FASE 6 comparando `duration_ms` por canal en set I
  (degradación) del to-be.
- **CR2 (cambio de endpoint de notificación) toca solo E4:** cumple la métrica
  `cr_nodes_touched_tobe ≤ 3` del anteproyecto (modificar un solo HTTP Request node).
- **Retry diferenciado respalda REG-004:** el canal urgente tiene política más agresiva
  (5 intentos vs 3), justificada por el dominio.
- **Log estructurado por canal** permite alertar de forma diferenciada en observabilidad
  (un fallo en `/api/notify/urgent` es un incidente P1; un fallo en `/api/notify` es P3).
- **Evidencia arquitectónica para ATAM:** el trade-off "complejidad local del subflujo
  vs. aislamiento del TTD crítico" es defendible en la evaluación del atributo
  "Confiabilidad".

**Negativas / trade-offs:**
- El subflujo E4 tiene 2 ramas paralelas → más nodos que un E4 inline simple
  (aprox. 8 nodos vs 4). Mitigación: cada rama es auto-contenida, la validación de
  input es compartida antes del IF.
- Mantener dos políticas de retry diferentes requiere documentar cuál aplica en cada
  rama; un cambio de política en críticos no se refleja automáticamente en advertencias.
  Mitigación: las políticas viven como constantes con nombre al inicio de E4
  (`RETRY_URGENT`, `RETRY_NORMAL`) siguiendo REC-001.
- El mock-server de pruebas (`mock-iot-notify`) debe exponer los dos endpoints
  diferenciados. Mitigación: costo único en infraestructura de pruebas, ya absorbido.
- El orquestador debe decidir si invocar E4 (nivel ≠ normal) antes de delegar — esto
  es una pequeña decisión de dominio que queda en E2, no en E4. Documentado en
  ADR-001 IoT.

---

## Relación con el micro-framework

- **REG-004 (retry en integraciones):** cada rama define su política de retry; el
  validador estático verifica presencia de retry por nodo HTTP.
- **REG-008 (integraciones aisladas en E3/E4):** la separación del routing en E4
  respeta la regla; el orquestador no conoce endpoints concretos.
- **REG-007 (dominio aislado):** la decisión "¿es crítico?" ocurre en E2 (dominio);
  E4 solo ejecuta el routing técnico. La frontera queda limpia.
- **REC-001 (constantes con nombre):** `RETRY_URGENT` y `RETRY_NORMAL` materializan
  la recomendación.
- **Patrón-retry (`microframework/patrones/patron-retry.md`):** este ADR aplica el
  patrón con parámetros específicos por canal; el patrón documenta la forma general.
- **ADR-002 IoT (umbrales y vocabulario):** define el enum `nivel` que usa el IF de
  routing; este ADR es consumidor directo de esa decisión.
- **ADR-001 IoT (separación E1–E4):** este ADR especializa la etapa E4 descrita a
  nivel conceptual en ADR-001.
- **Referencias cruzadas:**
  - `microframework/contratos/iot-e4-output.schema.json`
  - `microframework/plantillas/iot-to-be-e4-integracion.json`
  - `microframework/patrones/patron-retry.md`
  - `medicion/datasets/iot/input-set-I.json` (set de degradación que valida el desacople)
  - `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` (CR2 referencia este ADR)
