# Patrón: Saga / Compensación para consistencia E3–E4

**Categoría:** Resiliencia operativa / Consistencia eventual
**Etapa aplicable:** E3 → E4
**Nivel de madurez:** Recomendado para sistemas con requisitos de entrega garantizada de notificaciones

---

## Problema

E3 (persistencia) tiene éxito, pero E4 (notificación) falla tras agotar todos los
reintentos. El estado resultante es **parcialmente inconsistente**:

- La lectura fue persistida en PostgreSQL ✓
- La notificación de alerta nunca fue enviada ✗

Este estado no es detectable por el cliente (el sensor recibió HTTP 200 cuando E3
completó). El operador de infraestructura tampoco lo detecta porque no hay alerta.
Un sensor con temperatura crítica quedó sin notificar — silenciosamente.

El patrón de saga/compensación permite detectar y recuperar este estado inconsistente
sin pérdida de la notificación.

---

## Solución

### Paso 1 — Marcar la lectura como "notificación pendiente" si E4 falla definitivamente

**E4 — Code node en rama de error (después de agotar reintentos):**

```javascript
const updatePayload = {
  run_id: $json.run_id,
  notificacion_pendiente: true,
  error_notificacion: $json.error?.message || 'E4 falló definitivamente',
  ts_fallo_notificacion: new Date().toISOString()
};

console.log(JSON.stringify({
  run_id: updatePayload.run_id,
  etapa: 'E4_saga_compensacion',
  status: 'notificacion_pendiente',
  nivel: $json.nivel
}));

return [{ json: updatePayload }];
```

**E4 — Nodo Postgres: actualizar la lectura ya persistida por E3:**

```sql
UPDATE lecturas_sensor
SET notificacion_pendiente = true,
    error_notificacion = $2,
    ts_fallo_notificacion = $3
WHERE run_id = $1;
```

Este UPDATE es idempotente: actualizarlo varias veces con los mismos valores no
tiene efecto adicional.

### Paso 2 — Scheduled workflow de reintento de notificaciones

Un flujo cron (cada 5 minutos) consulta y reintenta notificaciones pendientes:

```sql
SELECT * FROM lecturas_sensor
WHERE notificacion_pendiente = true
AND nivel IN ('critico', 'advertencia')
ORDER BY created_at ASC
LIMIT 20;
```

Para cada lectura, reenvía la notificación al endpoint correspondiente.
Si tiene éxito:

```sql
UPDATE lecturas_sensor
SET notificacion_pendiente = false,
    ts_notificacion_replay = NOW()
WHERE run_id = $1;
```

### Modificación del schema de la tabla

```sql
ALTER TABLE lecturas_sensor
ADD COLUMN notificacion_pendiente BOOLEAN DEFAULT FALSE,
ADD COLUMN error_notificacion TEXT,
ADD COLUMN ts_fallo_notificacion TIMESTAMPTZ,
ADD COLUMN ts_notificacion_replay TIMESTAMPTZ;
```

---

## Trade-offs

| Aspecto | Beneficio | Costo |
|---------|-----------|-------|
| Consistencia | Garantía de entrega eventual de notificaciones críticas | Ventana de inconsistencia: hasta 5 minutos sin notificación |
| Operabilidad | `SELECT WHERE notificacion_pendiente=true` da visibilidad del backlog | Requiere columnas adicionales en la tabla y scheduled workflow |
| Complejidad | La lógica de compensación es simple (un UPDATE) | Introduce dependencia en el cron — si el cron falla, las notificaciones siguen pendientes |
| Atomicidad | E3 y E4 son independientes — E3 nunca se revierte por fallo de E4 | Para algunos dominios (trading, transacciones financieras), esto puede no ser aceptable |

**Cuándo NO usar este patrón:**
- Cuando la notificación y la persistencia deben ser atómicas (use una cola de mensajes transaccional en su lugar).
- Cuando la latencia de notificación es un SLA estricto (< 1 minuto en todos los casos).

---

## Relación con ADR-004 IoT (routing E4 por severidad)

El patrón saga complementa el routing de E4: si la rama de notificación "crítico"
falla definitivamente, el saga marca la lectura como `notificacion_pendiente`. El
scheduled workflow de replay reintenta la notificación con la misma ruta de severidad
determinada originalmente en E2 (almacenada en la columna `nivel_alerta`).

---

## Referencias

- Garcia-Molina, H. & Salem, K. (1987). *Sagas*. ACM SIGMOD Record.
- Richardson, C. (2018). *Microservices Patterns*. Manning. Cap. 4 (Sagas).
