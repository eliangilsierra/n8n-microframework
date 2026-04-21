# Ficha técnica — Caso IoT: Pipeline de sensores

## Descripción

Pipeline de ingesta de datos de sensores IoT implementado como webhook en n8n.
Recibe lecturas de temperatura, humedad y CO₂, las valida, normaliza, persiste en
InfluxDB (serie temporal) y PostgreSQL (relacional), y envía alertas cuando los
valores superan umbrales predefinidos.

---

## Endpoints

| Estado | Método | URL | Descripción |
|--------|--------|-----|-------------|
| as-is | POST | `/webhook/iot-sensor` | Pipeline monolítico ad-hoc |
| to-be | POST | `/webhook/iot-sensor-to-be` | Orquestador microframework |

---

## Variables del dominio

| Campo | Tipo | Unidad | Rango válido | Umbral advertencia | Umbral crítico |
|-------|------|--------|-------------|-------------------|----------------|
| `temperature` | float | °C | -40 a 125 | > 30°C | > 35°C |
| `humidity` | float | % | 0 a 100 | > 80% (to-be) / > 85% (as-is) | — |
| `co2` | integer | ppm | 0 a 5000 | > 1000 (as-is) / > 800 (to-be) | > 1500 (as-is) / > 1200 (to-be) |

**Nota:** Los umbrales del as-is están hardcodeados en distintos nodos con valores
inconsistentes entre sí y con el to-be. Este es el antipatrón documentado para ATAM.

---

## Input Sets

| Set | Escenario | Datos clave | HTTP as-is | HTTP to-be |
|-----|-----------|-------------|------------|------------|
| A | Lectura normal, sin alerta | `temp: 22.5, humidity: 60, co2: 800` | 200 | 200 |
| B | Temperatura alta, alerta activa | `temp: 38.0, humidity: 75, co2: 950` | 200 | 200 |
| C | Datos inválidos (temperatura string) | `temperature: "NaN"` | 200 | 422 |
| D | Valores exactamente en umbral | `temp: 35.0, humidity: 85.0, co2: 1000` | 200 | 200 |
| E | co2 ausente del payload | sin campo `co2` | 200 | 422 |

**Set C** expone REG-009: el as-is retorna HTTP 200 con `nivel:'normal'` ante datos
inválidos en lugar de 422. **Set E** expone la validación incompleta: co2 ausente
silenciado como 0 en el as-is (`parseFloat(undefined) || 0`).

---

## Archivos del caso

| Archivo | Descripción |
|---------|-------------|
| `as-is/iot-as-is.json` | Flujo as-is (14 nodos) — importar en n8n |
| `as-is/notas-tecnicas.md` | Detalle de antipatrones y decisiones de diseño |
| `to-be/` | Subflujos E1–E4 y orquestador (ver microframework/plantillas/) |

---

## Dependencias de infraestructura

- **mock-bot** (puerto 3001): mock de InfluxDB
  - `POST /api/v2/write` → retorna 204 (simula escritura de serie temporal)
- **mock-iot** (puerto 3002): mock de sistema de alertas
  - `POST /mock/notificar` → retorna `{notificacion_enviada: true}`
- **PostgreSQL** (`sensores_db`): tabla `lecturas_sensor` para persistencia relacional

---

## Tabla PostgreSQL

```sql
CREATE TABLE IF NOT EXISTS lecturas_sensor (
  id               SERIAL PRIMARY KEY,
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,  -- solo en to-be
  sensor_id        VARCHAR(100) NOT NULL,
  temperature      DECIMAL(5,1),
  humidity         DECIMAL(5,1),
  co2              INTEGER,
  timestamp        TIMESTAMPTZ NOT NULL,
  nivel_alerta     VARCHAR(20) DEFAULT 'normal',
  anomalias        JSONB,
  run_id           VARCHAR(100),                  -- solo en to-be
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

El as-is usa `INSERT ... VALUES (...)` sin `idempotency_key` ni `ON CONFLICT` —
antipatrón REG-005 documentado para ATAM.

---

## Métricas de interés ATAM

| Atributo ISO 25010 | Métrica | Diferencia esperada as-is vs to-be |
|--------------------|---------|-------------------------------------|
| Mantenibilidad | Nodos por flujo | 14 (monolito) vs 4+4+orq (modular) |
| Fiabilidad | Tasa de fallos en set C y E | as-is 0% (acepta datos inválidos), to-be 100% rechazo |
| Seguridad | Credenciales en historial | db_token visible en output (REG-001) vs 0 |
| Fiabilidad | Duplicados en BD por retry | posible (sin ON CONFLICT) vs imposible (con idempotency_key) |
| Eficiencia | Latencia p95 | Comparable (misma lógica de negocio) |
