# Patrón: Idempotencia con clave compuesta

**Categoría:** Confiabilidad de datos
**Aplica a:** E3 — Adaptadores de integración
**Regla relacionada:** REG-005

---

## Problema

Los reintentos automáticos (por timeout o error de red) pueden crear registros duplicados
en la base de datos si la operación de escritura se ejecuta más de una vez con los mismos datos.

---

## Solución

Generar una clave de idempotencia única antes de cada escritura y usar una restricción
`UNIQUE` + `ON CONFLICT DO NOTHING` en el SQL.

### Generación de la clave (nodo Code en E3)

```javascript
// Para el caso Bot: clave basada en el run_id y la operación
const idempotency_key = `${run_id}-ticket`;

// Para el caso IoT: clave basada en la identidad del dato
const idempotency_key = `${lectura.sensor_id}-${lectura.timestamp}`;
```

**Regla de elección de la clave:**
- Si el dato proviene de una ejecución única: usar `{run_id}-{operacion}`
- Si el dato tiene identidad propia (sensor + timestamp): usar la identidad del dato

### Query SQL con idempotencia

```sql
INSERT INTO lecturas_sensor (
  idempotency_key,
  sensor_id,
  temperature,
  humidity,
  co2,
  timestamp,
  nivel_alerta,
  anomalias,
  run_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
```

Si la clave ya existe, la operación no hace nada y retorna `null` en `id`. El flujo
debe manejar este caso: es éxito (el dato ya estaba registrado), no un error.

### DDL requerido

```sql
CREATE TABLE lecturas_sensor (
  id               SERIAL PRIMARY KEY,
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,
  sensor_id        VARCHAR(100) NOT NULL,
  -- ... resto de columnas
);
```

El índice `UNIQUE` en `idempotency_key` es la pieza central del patrón.

---

## Implementación en n8n (caso IoT — E3)

```
[nodo Code] Preparar payload + generar idempotency_key
      ↓
[nodo Postgres] INSERT ... ON CONFLICT DO NOTHING RETURNING id
      ↓
[nodo Code] Log resultado (id null = ya existía, id presente = creado)
```

---

## Trade-off

**Beneficio:** Los reintentos son seguros. Se puede reintentar cualquier número de veces
sin riesgo de duplicados en la base de datos.

**Costo:** Requiere un índice `UNIQUE` en `idempotency_key`, lo que añade overhead de
escritura en cada INSERT. Despreciable para volúmenes de este proyecto.

**Limitación:** La clave debe ser suficientemente específica para no colisionar entre
ejecuciones distintas. `{sensor_id}-{timestamp}` es adecuado si el timestamp tiene
resolución de milisegundos. Si dos lecturas del mismo sensor llegan en el mismo milisegundo,
la segunda se descartará silenciosamente.

---

## Combinación con retry

Este patrón está diseñado para operar junto con el patrón de retry:

1. E3 genera `idempotency_key` antes del primer intento
2. HTTP Request (o Postgres) falla → retry automático
3. El segundo intento usa la misma `idempotency_key` generada en el paso 1
4. La restricción `UNIQUE` garantiza que no se crea un duplicado

La clave debe generarse **antes** de cualquier intento de escritura, no en cada intento.
