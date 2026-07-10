> 🌐 **Language / Idioma:** English · [Español](ADR-003-idempotencia-sensor-timestamp.md)

# ADR-003: Idempotency strategy with a composite `{sensor_id}-{timestamp}` key

**Status:** Accepted
**Date:** 2026-04-21
**Case:** iot
**Affected quality attribute:** Reliability, Functional suitability

---

## Context

The `iot-as-is.json` flow runs `INSERT INTO lecturas_sensor` with no idempotency control
(node 10, `Persistir PostgreSQL`), violating REG-005. This produces the following
observable problems:

1. **Duplicates from retries:** if the client retries a reading (due to timeout or a
   transient error), the as-is inserts two rows for the same physical reading. Set K
   (duplicates) is designed precisely to measure this pathology: every `idempotency_key`
   appears twice across the 200 payloads → 100 expected duplicates in the DB with as-is
   vs. 0 duplicates with to-be.

2. **Duplicates from concurrent events:** two simulated sensors sending readings in the
   same second with an identical `timestamp` (an inevitable collision in high-frequency
   industrial sensors) generate duplicate rows.

3. **Loss of "unique reading" semantics:** the data dictionary declares that every
   (sensor, instant) produces one and only one measurement. The as-is allows this
   invariant to be silently violated.

The to-be's E3 (`iot-to-be-e3-persistencia`) must fix REG-005 by choosing a concrete
idempotency strategy. The decision must:

- Add no external dependencies (Redis, event broker) — outside the project's LC/NC scope.
- Be verifiable in direct SQL with the `lecturas_sensor` schema.
- Allow safe retries with no rewrite cost.
- Be measurable in the CR-log and in set K of the experimental matrix.

---

## Decision

We implement idempotency in E3 with a **composite key** formed by `{sensor_id, timestamp}`
and PostgreSQL's native `ON CONFLICT DO NOTHING` mechanism:

```sql
-- Schema (executed by setup_env.py)
CREATE TABLE IF NOT EXISTS lecturas_sensor (
  sensor_id    VARCHAR(64)  NOT NULL,
  timestamp    TIMESTAMPTZ  NOT NULL,
  temperature  NUMERIC(5,2) NOT NULL,
  humidity     NUMERIC(5,2) NOT NULL,
  co2          NUMERIC(7,2),
  nivel        VARCHAR(20)  NOT NULL,
  run_id       VARCHAR(64)  NOT NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  PRIMARY KEY (sensor_id, timestamp)
);

-- INSERT in the to-be's E3
INSERT INTO lecturas_sensor (sensor_id, timestamp, temperature, humidity, co2, nivel, run_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (sensor_id, timestamp) DO NOTHING;
```

**Guarantees:**
- `ON CONFLICT DO NOTHING` is atomic (part of the same INSERT transaction).
- Retries of the same payload → 0 additional rows inserted, with no client error.
- The client always receives HTTP 200 with `{ inserted: true|false, run_id }` (contract
  documented in `iot-e3-output.schema.json`).

The input contract's (`iot-webhook-input.schema.json`) `idempotency_key` field remains
optional: if the client provides it, it propagates to `run_id` for traceability; if not,
the composite key `{sensor_id, timestamp}` is sufficient to guarantee idempotency at the
DB level.

---

## Alternatives considered

- **Client-generated UUID (mandatory `idempotency_key`):** standard for modern REST APIs
  (Stripe, PayPal). Discarded: the simulated sensor doesn't natively generate UUIDs and
  requiring it would increase client-server coupling; also, the `{sensor_id, timestamp}`
  key is already unique by domain definition (a sensor cannot emit two readings at the
  same instant).

- **SHA-256 hash of the full payload as the key:** total coverage including changes in
  temperature/humidity. Discarded: computational overhead per INSERT and semantically
  incorrect — if a sensor resends the same reading with slightly different values
  (measurement noise), two rows would be inserted representing the same physical
  measurement, contradicting the domain's semantics.

- **Check-then-insert in two queries:**
  ```sql
  SELECT 1 FROM lecturas_sensor WHERE sensor_id=$1 AND timestamp=$2;
  -- if empty: INSERT
  ```
  Discarded: race condition between the SELECT and the INSERT with no explicit
  transaction; two concurrent INSERTs can both pass the SELECT and produce a duplicate.
  Requires `SELECT … FOR UPDATE` with a transaction, adding latency and complexity with no
  benefit over `ON CONFLICT`.

- **Separate `idempotency_keys` table with TTL:** used by financial APIs. Discarded:
  introduces a second table, an expired-key cleanup job, and complexity unjustified for
  the IoT domain (where the domain's natural key is sufficient).

- **`INSERT … ON DUPLICATE KEY UPDATE ...` (MySQL) / `MERGE`:** not applicable — the
  project uses PostgreSQL and `ON CONFLICT DO NOTHING` is the idiomatic syntax.

---

## Consequences

**Positive:**
- **0 duplicates in the DB** for retries of the same reading. Verifiable with:
  `SELECT sensor_id, timestamp, COUNT(*) FROM lecturas_sensor GROUP BY 1,2 HAVING COUNT(*) > 1;`
  (must return 0 rows in to-be).
- **Safe retries** in E3 when the network partially fails — satisfies the precondition of
  `patron-retry` (idempotency).
- **No external dependencies:** all control is in the PostgreSQL schema, no Redis or
  brokers.
- **Clear quantitative evidence** for the PHASE 6 comparison:
  - Set K as-is: `COUNT(*)` = 200, `COUNT(DISTINCT (sensor_id, timestamp))` = 100 → 100 duplicates
  - Set K to-be: `COUNT(*)` = 100, `COUNT(DISTINCT (sensor_id, timestamp))` = 100 → 0 duplicates
- **Optional client idempotency key** → backward compatibility with sensors that don't
  generate it.

**Negative / trade-offs:**
- The "duplicate reading = ignored" semantics assumes the physical sensor never sends two
  distinct readings with the same timestamp. If a faulty sensor does that, the second
  reading is silently lost. Mitigation: the input contract documents this assumption, and
  E3's structured log records `inserted: false` for the operator.
- `ON CONFLICT DO NOTHING` returns no error to the client, only the `inserted` flag.
  Requires the `iot-e3-output.schema.json` contract's consumer to correctly interpret
  `inserted: false` (not an error but an idempotent no-op).
- The composite PRIMARY KEY is larger than a UUID (64 chars + TIMESTAMPTZ vs. 16 bytes) →
  marginally larger index. Irrelevant for the study's volume (max ~10,000 rows).

---

## Relationship to the micro-framework

- **REG-005 (idempotency in E3):** direct, verifiable implementation. The as-is violates
  REG-005 by doing a simple INSERT with no control; the to-be meets it with
  `ON CONFLICT DO NOTHING`.
- **REG-004 (retry on integrations):** precondition satisfied — E3 can be safely retried
  because the INSERTs are idempotent.
- **REG-002 (run_id):** `run_id` is persisted as a column; allows tracing from any DB row
  back to the corresponding run-log.
- **Idempotency pattern** (`microframework/patrones/patron-idempotencia.md`): this ADR is
  the concrete application to the IoT domain; the pattern documents the general approach
  and this ADR documents the specific key choice.
- **IoT ADR-001:** this ADR extends ADR-001 by specifying E3's concrete idempotency
  strategy (which ADR-001 mentions only conceptually).
- **Cross-references:**
  - `microframework/patrones/patron-idempotencia.md`
  - `microframework/contratos/iot-e3-output.schema.json`
  - `microframework/plantillas/iot-to-be-e3-persistencia.json`
  - `medicion/datasets/iot/input-set-K.json` (dataset that verifies the behavior)
  - `automatizacion/setup_env.py` (creates the table with the composite PRIMARY KEY)
