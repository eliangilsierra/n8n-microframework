> 🌐 **Language / Idioma:** English · [Español](ficha-tecnica.md)

# Technical datasheet — IoT case: Sensor pipeline

## Description

An IoT sensor data ingestion pipeline implemented as an n8n webhook. Receives temperature,
humidity, and CO₂ readings, validates and normalizes them, persists to InfluxDB (time
series) and PostgreSQL (relational), and sends alerts when values exceed predefined
thresholds.

---

## Endpoints

| State | Method | URL | Description |
|--------|--------|-----|-------------|
| as-is | POST | `/webhook/iot-sensor` | Ad-hoc monolithic pipeline |
| to-be | POST | `/webhook/iot-sensor-to-be` | Micro-framework orchestrator |

---

## Domain variables

| Field | Type | Unit | Valid range | Warning threshold | Critical threshold |
|-------|------|--------|-------------|-------------------|----------------|
| `temperature` | float | °C | -40 to 125 | > 30°C | > 35°C |
| `humidity` | float | % | 0 to 100 | > 80% (to-be) / > 85% (as-is) | — |
| `co2` | integer | ppm | 0 to 5000 | > 1000 (as-is) / > 800 (to-be) | > 1500 (as-is) / > 1200 (to-be) |

**Note:** the as-is's thresholds are hardcoded in different nodes with values
inconsistent with each other and with the to-be. This is the antipattern documented for
ATAM.

---

## Input Sets

| Set | Scenario | Key data | HTTP as-is | HTTP to-be |
|-----|-----------|-------------|------------|------------|
| A | Normal reading, no alert | `temp: 22.5, humidity: 60, co2: 800` | 200 | 200 |
| B | High temperature, active alert | `temp: 38.0, humidity: 75, co2: 950` | 200 | 200 |
| C | Invalid data (temperature string) | `temperature: "NaN"` | 200 | 422 |
| D | Values exactly at the threshold | `temp: 35.0, humidity: 85.0, co2: 1000` | 200 | 200 |
| E | co2 missing from the payload | no `co2` field | 200 | 422 |

**Set C** exposes REG-009: the as-is returns HTTP 200 with `nivel:'normal'` for invalid
data instead of 422. **Set E** exposes the incomplete validation: missing co2 silenced as
0 in the as-is (`parseFloat(undefined) || 0`).

---

## Case files

| File | Description |
|---------|-------------|
| `as-is/iot-as-is.json` | As-is flow (14 nodes) — import into n8n |
| `as-is/notas-tecnicas.md` | Detail of antipatterns and design decisions |
| `to-be/` | E1–E4 subflows and orchestrator (see microframework/plantillas/) |

---

## Infrastructure dependencies

- **mock-bot** (port 3001): InfluxDB mock
  - `POST /api/v2/write` → returns 204 (simulates a time-series write)
- **mock-iot** (port 3002): alert system mock
  - `POST /mock/notificar` → returns `{notificacion_enviada: true}`
- **PostgreSQL** (`sensores_db`): `lecturas_sensor` table for relational persistence

---

## PostgreSQL table

```sql
CREATE TABLE IF NOT EXISTS lecturas_sensor (
  id               SERIAL PRIMARY KEY,
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,  -- to-be only
  sensor_id        VARCHAR(100) NOT NULL,
  temperature      DECIMAL(5,1),
  humidity         DECIMAL(5,1),
  co2              INTEGER,
  timestamp        TIMESTAMPTZ NOT NULL,
  nivel_alerta     VARCHAR(20) DEFAULT 'normal',
  anomalias        JSONB,
  run_id           VARCHAR(100),                  -- to-be only
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

The as-is uses `INSERT ... VALUES (...)` with no `idempotency_key` or `ON CONFLICT` —
the REG-005 antipattern documented for ATAM.

---

## ATAM metrics of interest

| ISO 25010 attribute | Metric | Expected as-is vs to-be difference |
|--------------------|---------|-------------------------------------|
| Maintainability | Nodes per flow | 14 (monolith) vs 4+4+orq (modular) |
| Reliability | Failure rate in sets C and E | as-is 0% (accepts invalid data), to-be 100% rejection |
| Security | Credentials in history | db_token visible in output (REG-001) vs 0 |
| Reliability | DB duplicates on retry | possible (no ON CONFLICT) vs impossible (with idempotency_key) |
| Efficiency | p95 latency | Comparable (same business logic) |
