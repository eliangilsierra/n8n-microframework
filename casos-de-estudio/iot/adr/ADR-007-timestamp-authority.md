# ADR-007 — Autoridad del timestamp: usar timestamp del sensor (cliente)

**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Fiabilidad / Madurez (ISO/IEC 25010)
**Reglas relacionadas:** REG-005, ADR-003 IoT (idempotencia sensor-timestamp)
**Escenario ATAM:** IOT-Q3 (reenvío de misma lectura → 0 duplicados)

---

## Contexto

Cada lectura de sensor incluye un campo `timestamp` generado por el sensor mismo.
El sistema n8n también tiene su propio reloj (`new Date().toISOString()` en el nodo Code).

La clave de idempotencia del caso IoT es `{sensor_id}_{timestamp}` (documentado en
ADR-003 IoT). Esta decisión implica que el timestamp usado en la clave determina
si dos envíos del mismo dato se tratan como la misma lectura (idempotente) o como
lecturas diferentes (duplicado).

La pregunta es: ¿usar el timestamp del **sensor** (del payload de entrada) o el
timestamp del **servidor** (n8n, en el momento de procesamiento)?

---

## Decisión

Se usa el **timestamp del sensor** (del campo `timestamp` del payload) como autoridad
temporal para la clave de idempotencia y para el registro en base de datos.

### Justificación técnica

Si se usara el timestamp del servidor (n8n):

```
Envío 1 del sensor:   timestamp_payload=2026-05-01T10:00:00Z → servidor=10:00:01Z → key="sensor1_10:00:01Z"
Reintento del sensor: timestamp_payload=2026-05-01T10:00:00Z → servidor=10:00:03Z → key="sensor1_10:00:03Z"
```

→ Los dos envíos del mismo dato generan claves diferentes → se insertan como dos
registros diferentes → duplicado silencioso. La idempotencia del ADR-003 quedaría inerte.

Con timestamp del sensor:

```
Envío 1:   timestamp_payload=2026-05-01T10:00:00Z → key="sensor1_2026-05-01T10:00:00Z"
Reintento: timestamp_payload=2026-05-01T10:00:00Z → key="sensor1_2026-05-01T10:00:00Z"
```

→ Las dos claves son idénticas → `ON CONFLICT DO NOTHING` → 0 duplicados. ✓

### Validación contra drift de reloj

E1 valida que el timestamp del sensor no esté en el futuro por más de 5 minutos:

```javascript
const ahora = new Date();
const ts_sensor = new Date(payload.timestamp);
const diff_ms = ts_sensor - ahora;

if (diff_ms > 5 * 60 * 1000) {
  errores.push(`timestamp en el futuro: diferencia de ${Math.round(diff_ms/1000)}s (máximo 300s)`);
}
```

Esta validación detecta sensores con reloj desincronizado (drift) que podrían
generar claves de idempotencia incorrectas para lecturas futuras no reales.

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Timestamp del servidor (n8n) | Rompe la idempotencia: dos envíos del mismo payload tendrán claves diferentes y se insertarán como duplicados |
| UUID generado por E1 (independiente del timestamp) | No es idempotente: cada invocación de E1 genera un UUID diferente, incluso para el mismo payload |
| Hash del payload completo como clave | Robusto pero computacionalmente más costoso y sensible a diferencias en campos no significativos (p.ej., espacios en `location`) — la clave `{sensor_id, timestamp}` es suficiente y más legible |
| Timestamp del servidor + campo de idempotencia en el header HTTP | Requiere que el cliente (sensor) envíe un header de idempotencia — modifica el contrato de entrada |

---

## Consecuencias

**Positivas:**
- Idempotencia garantizada: múltiples envíos del mismo payload producen exactamente
  1 registro en PostgreSQL, verificable con `SELECT COUNT(*) FROM lecturas_sensor WHERE idempotency_key = '...'`.
- El `timestamp` en la BD refleja cuándo ocurrió la medición, no cuándo llegó al sistema
  — semánticamente más correcto para análisis de series temporales.
- Input Set K (reenvío de misma lectura) → 0 duplicados, medible directamente.

**Negativas:**
- Sensores con reloj desincronizado se rechazan con 422 (E1 valida el drift).
  Esto puede ser un problema si los sensores físicos no tienen NTP configurado.
  Declarado como limitación del entorno de laboratorio (los datasets simulan timestamps
  recientes y consistentes).
- Lecturas históricas (timestamp muy en el pasado) no son rechazadas por E1 — podrían
  insertarse con timestamp antiguo. Declarado como fuera del alcance del caso de estudio.

---

## Criterio de verificación

1. Input Set K (mismo payload enviado dos veces) → `SELECT COUNT(*)` en PostgreSQL = 1 (REG-005)
2. Payload con `timestamp` 10 minutos en el futuro → HTTP 422, `errores` contiene "timestamp en el futuro"
3. `idempotency_key` en la tabla = `{sensor_id}_{timestamp_del_sensor}` (no timestamp del servidor)
