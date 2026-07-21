# Diseño de Change Requests — IoT

## Propósito

Especificación formal de los 3 CRs (CR1 regla de negocio, CR2 integración, CR3
validación) del caso IoT, pre-medidos en as-is durante FASE 3 y a medir en to-be
durante FASE 6.

---

## CR1 — Regla de negocio: cambio de umbral de temperatura crítica

**Cambio exacto:** reducir el umbral de temperatura crítica de `> 35 °C` a `> 30 °C`
(sensibilidad aumentada para detección temprana de sobrecalentamiento).

**Archivo as-is:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Nodo(s) a modificar en as-is:**
- Nodo 5 `Calcular Nivel` (jsCode) — condición `if (temp > 35)` hardcodeada
- Nodo 6 `Nivel Critico?` (IF) — umbral referenciado en expresión
- Nodo 7 `Enriquecer Metadatos` (set) — etiqueta `severidad` derivada
- Nodo 11 `Notificar Evento` — payload del evento con umbral excedido
- Nodo 12 `Determinar Canal` (IF) — lógica de routing
- Nodo 14 `Responder` — mensaje con umbral

**Nodos tocados esperado as-is:** **6**
**Nodos tocados esperado to-be:** **1** (solo constante `UMBRALES.TEMP_CRITICA` en
`iot-to-be-e2-dominio`)
**Delta esperado:** 5 nodos menos en to-be.

**Dependencias externas:** 0.

**Input Sets:** A, B, F (realismo normal con distribución de temperaturas).

**Método de verificación:** ejecutar set F (200 lecturas variadas) y verificar que la
tasa de filas con `nivel='critico'` cambia del X% (as-is con 35°C) al Y% (as-is con
30°C); el delta esperado es aproximadamente +15 puntos porcentuales.

**REG-* involucradas:** REG-007 (dominio aislado).

**Hipótesis medible:** `nodes_touched_asis - nodes_touched_tobe ≥ 4`.

**Relación con ADR-002 IoT:** ADR-002 documenta los umbrales to-be (35°C preservado);
CR1 prueba el costo de cambiar un umbral ante un requerimiento nuevo — independiente
de los valores de ADR-002 (que son del dominio inicial).

---

## CR2 — Integración: cambio de endpoint de notificación urgente

**Cambio exacto:** migrar el canal crítico de `http://mock-iot:3002/api/notify`
a `http://mock-iot:3002/api/v2/notify/urgent` con nuevo contrato (añadir campo
`incident_class`).

**Archivo as-is:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Nodo(s) a modificar en as-is:**
- Nodo 11 `Notificar Evento` (httpRequest) — URL + headers + body
- Nodo 12 `Determinar Canal` (IF) — condición de enrutamiento
- Nodo 13 `Registrar Auditoría` (postgres) — columna `notif_channel`
- Nodo 14 `Responder` — respuesta al cliente

**Nodos tocados esperado as-is:** **4**
**Nodos tocados esperado to-be:** **1** (solo nodo HTTP de rama crítica en
`iot-to-be-e4-integracion`)
**Delta esperado:** 3 nodos menos en to-be.

**Dependencias externas tocadas:** 1 (endpoint urgente).

**Input Sets:** J (percentiles extremos, mayoría de críticos).

**Método de verificación:** ejecutar set J y verificar que todos los eventos críticos
llegan al nuevo endpoint; auditoría en BD registra `notif_channel='urgent'`.

**REG-* involucradas:** REG-008 (integraciones en E3/E4), REG-004 (retry).

**Hipótesis medible:** `nodes_touched_asis - nodes_touched_tobe ≥ 2`.

**Relación con ADR-004 IoT:** ADR-004 define el routing diferenciado que hace
CR2 local al to-be.

---

## CR3 — Validación: validar `co2 >= 0`

**Cambio exacto:** añadir validación explícita de `co2 >= 0` con respuesta HTTP 422
y código `CO2_NEGATIVE`.

**Archivo as-is:** `casos-de-estudio/iot/as-is/iot-as-is.json`
**Nodo(s) a modificar en as-is:**
- Nodo 3 `Validar Lectura` (jsCode) — añadir chequeo
- Nodo 4 `Error Validación` (respondToWebhook) — diferenciar código 422 vs 400
- Nodo 14 `Responder` — schema de respuesta

**Nodos tocados esperado as-is:** **3**
**Nodos tocados esperado to-be:** **1** (solo schema `iot-webhook-input.schema.json`
donde `co2.minimum: 0` ya existe — verificación declarativa)
**Delta esperado:** 2 nodos menos en to-be.

**Dependencias externas:** 0.

**Input Sets:** C (inválidos), D (boundary con co2=-1).

**Método de verificación:** set D incluye payloads con `co2=-1`; todas deben
recibir HTTP 422 con código `CO2_NEGATIVE`.

**REG-* involucradas:** REG-009 (códigos HTTP diferenciados).

**Hipótesis medible:** `nodes_touched_asis - nodes_touched_tobe ≥ 2`.

---

## Procedimiento de pre-medición contra as-is (ejecutado FASE 3)

Idéntico al del Bot (`bot/cr-design.md` §Procedimiento). El branch temporal
`cr-measurement-asis` se reutiliza (mismo branch, commits distintos por caso).

## Medición contra to-be (FASE 6 — pendiente)

Se ejecutará sobre `iot-to-be-*.json` una vez construido el to-be, poblando
`cr-log-iot-to-be.csv`.

---

## Schema extendido del CR-log

Ver `bot/cr-design.md` §Schema — mismo formato para ambos casos.

---

## Referencias

- `medicion/cr-logs/iot/cr-log-iot-as-is.csv` — log con las 3 filas pre-medidas.
- `medicion/cr-logs/iot/cr-log-iot-to-be.csv` — reservado para FASE 6.
- ADR-001 IoT, ADR-002 IoT, ADR-003 IoT, ADR-004 IoT.
- `medicion/protocolo-evidencias.md` §6.
