> 🌐 **Language / Idioma:** English · [Español](patron-idempotencia.md)

# Pattern: Idempotency with composite key

**Category:** Data reliability
**Applies to:** E3 — Integration adapters
**Related rule:** REG-005

---

## Problem

Automatic retries (due to timeout or network error) can create duplicate database records
if the write operation executes more than once with the same data.

---

## Solution

Generate a unique idempotency key before every write and use a `UNIQUE` constraint +
`ON CONFLICT DO NOTHING` in the SQL.

### Key generation (Code node in E3)

```javascript
// For the Bot case: key based on run_id and the operation
const idempotency_key = `${run_id}-ticket`;

// For the IoT case: key based on the data's identity
const idempotency_key = `${lectura.sensor_id}-${lectura.timestamp}`;
```

**Key-choice rule:**
- If the data comes from a single execution: use `{run_id}-{operation}`
- If the data has its own identity (sensor + timestamp): use the data's identity

### SQL query with idempotency

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

If the key already exists, the operation does nothing and returns `null` for `id`. The flow
must handle this case: it is a success (the data was already recorded), not an error.

### Required DDL

```sql
CREATE TABLE lecturas_sensor (
  id               SERIAL PRIMARY KEY,
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,
  sensor_id        VARCHAR(100) NOT NULL,
  -- ... remaining columns
);
```

The `UNIQUE` index on `idempotency_key` is the pattern's central piece.

---

## Implementation in n8n (IoT case — E3)

```
[Code node] Prepare payload + generate idempotency_key
      ↓
[Postgres node] INSERT ... ON CONFLICT DO NOTHING RETURNING id
      ↓
[Code node] Log result (id null = already existed, id present = created)
```

---

## Trade-off

**Benefit:** Retries are safe. The operation can be retried any number of times without
risk of database duplicates.

**Cost:** Requires a `UNIQUE` index on `idempotency_key`, which adds write overhead on
every INSERT. Negligible at this project's volumes.

**Limitation:** The key must be specific enough not to collide between different
executions. `{sensor_id}-{timestamp}` is adequate if the timestamp has millisecond
resolution. If two readings from the same sensor arrive within the same millisecond, the
second one will be silently discarded.

---

## Combination with retry

This pattern is designed to work together with the retry pattern:

1. E3 generates `idempotency_key` before the first attempt
2. HTTP Request (or Postgres) fails → automatic retry
3. The second attempt uses the same `idempotency_key` generated in step 1
4. The `UNIQUE` constraint guarantees no duplicate is created

The key must be generated **before** any write attempt, not on every attempt.
