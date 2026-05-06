# ADR-003: Estrategia de idempotencia con clave compuesta `{sensor_id}-{timestamp}`

**Estado:** Aceptado
**Fecha:** 2026-04-21
**Caso:** iot
**Atributo de calidad afectado:** Confiabilidad, Adecuación funcional

---

## Contexto

El flujo `iot-as-is.json` ejecuta `INSERT INTO lecturas_sensor` sin control de
idempotencia (nodo 10, `Persistir PostgreSQL`), violando REG-005. Esto produce los
siguientes problemas observables:

1. **Duplicados por reintento:** si el cliente reintenta una lectura (por timeout o
   error transitorio), el as-is inserta dos filas para la misma lectura física. El
   set K (duplicados) está diseñado precisamente para medir esta patología: cada
   `idempotency_key` aparece 2 veces en los 200 payloads → 100 duplicados esperados
   en BD con as-is vs. 0 duplicados con to-be.

2. **Duplicados por eventos concurrentes:** dos sensores simulados enviando lecturas
   en el mismo segundo con `timestamp` idéntico (colisión inevitable en sensores
   industriales a alta frecuencia) generan filas duplicadas.

3. **Pérdida de semántica de "lectura única":** el diccionario de datos declara que
   cada (sensor, instante) produce una y solo una medición. El as-is permite violar
   este invariante silenciosamente.

E3 del to-be (`iot-to-be-e3-persistencia`) debe corregir REG-005 eligiendo una
estrategia de idempotencia concreta. La decisión debe:

- No agregar dependencias externas (Redis, broker de eventos) — fuera del alcance
  LC/NC del proyecto.
- Ser verificable en SQL directo con el schema de `lecturas_sensor`.
- Permitir reintentos seguros sin costo de reescritura.
- Ser medible en CR-log y en el set K de la matriz experimental.

---

## Decisión

Implementamos idempotencia en E3 con una **clave compuesta** formada por
`{sensor_id, timestamp}` y el mecanismo nativo de PostgreSQL `ON CONFLICT DO NOTHING`:

```sql
-- Schema (ejecutado por setup_env.py)
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

-- INSERT en E3 del to-be
INSERT INTO lecturas_sensor (sensor_id, timestamp, temperature, humidity, co2, nivel, run_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (sensor_id, timestamp) DO NOTHING;
```

**Garantías:**
- `ON CONFLICT DO NOTHING` es atómico (parte de la misma transacción del INSERT).
- Reintentos del mismo payload → 0 filas insertadas adicionales, sin error al cliente.
- El cliente recibe siempre HTTP 200 con `{ inserted: true|false, run_id }` (contrato
  documentado en `iot-e3-output.schema.json`).

El campo `idempotency_key` del contrato de entrada (`iot-webhook-input.schema.json`)
se mantiene opcional: si el cliente lo provee se propaga al `run_id` para trazabilidad;
si no, la clave compuesta `{sensor_id, timestamp}` es suficiente para garantizar
la idempotencia a nivel de BD.

---

## Alternativas consideradas

- **UUID generado por el cliente (`idempotency_key` obligatorio):** estándar de
  APIs REST modernas (Stripe, PayPal). Descartado: el sensor simulado no genera
  UUIDs nativamente y requerirlo aumentaría el acoplamiento cliente-servidor;
  además, la clave `{sensor_id, timestamp}` ya es única por definición del dominio
  (un sensor no puede emitir dos lecturas en el mismo instante).

- **Hash SHA-256 del payload completo como clave:** cobertura total incluyendo
  cambios en temperatura/humedad. Descartado: sobrecarga de cómputo por cada INSERT
  y semánticamente incorrecta — si un sensor re-envía la misma lectura con valores
  ligeramente distintos (ruido de medición), se insertarían dos filas que
  representan la misma medición física, contradiciendo la semántica del dominio.

- **Check-then-insert en dos queries:**
  ```sql
  SELECT 1 FROM lecturas_sensor WHERE sensor_id=$1 AND timestamp=$2;
  -- si vacío: INSERT
  ```
  Descartado: race condition entre el SELECT y el INSERT sin transacción explícita;
  dos INSERT concurrentes pueden ambos pasar el SELECT y generar duplicado. Requiere
  `SELECT … FOR UPDATE` con transacción, añadiendo latencia y complejidad sin
  beneficio respecto a `ON CONFLICT`.

- **Tabla separada `idempotency_keys` con TTL:** usada por APIs financieras.
  Descartado: introduce segunda tabla, job de limpieza de expirados y complejidad
  no justificada para el dominio IoT (donde la clave natural del dominio es suficiente).

- **`INSERT … ON DUPLICATE KEY UPDATE ...` (MySQL) / `MERGE`:** no aplicable —
  el proyecto usa PostgreSQL y `ON CONFLICT DO NOTHING` es la sintaxis idiomática.

---

## Consecuencias

**Positivas:**
- **0 duplicados en BD** para reintentos de la misma lectura. Verificable con:
  `SELECT sensor_id, timestamp, COUNT(*) FROM lecturas_sensor GROUP BY 1,2 HAVING COUNT(*) > 1;`
  (debe retornar 0 filas en to-be).
- **Reintentos seguros** en E3 cuando la red falla parcialmente — cumple la
  precondición de `patron-retry` (idempotencia).
- **Sin dependencias externas:** todo el control está en el schema PostgreSQL,
  sin Redis ni brokers.
- **Evidencia cuantitativa clara** para la comparación FASE 6:
  - Set K as-is: `COUNT(*)` = 200, `COUNT(DISTINCT (sensor_id, timestamp))` = 100 → 100 duplicados
  - Set K to-be: `COUNT(*)` = 100, `COUNT(DISTINCT (sensor_id, timestamp))` = 100 → 0 duplicados
- **Idempotency key del cliente opcional** → compatibilidad hacia atrás con sensores
  que no lo generan.

**Negativas / trade-offs:**
- La semántica "lectura duplicada = ignorada" asume que el sensor físico nunca envía
  dos lecturas distintas con el mismo timestamp. Si un sensor defectuoso hace eso, la
  segunda lectura se pierde silenciosamente. Mitigación: el contrato de entrada
  documenta esta asunción, y el log estructurado de E3 registra `inserted: false`
  para operador.
- `ON CONFLICT DO NOTHING` no devuelve error al cliente, solo el flag `inserted`.
  Requiere que el consumidor del contrato `iot-e3-output.schema.json` interprete
  correctamente `inserted: false` (no es un error sino un no-op idempotente).
- La PRIMARY KEY compuesta tiene tamaño mayor que un UUID (64 chars + TIMESTAMPTZ
  vs. 16 bytes) → índice marginalmente más grande. Irrelevante para el volumen
  del estudio (N máximo ~10 000 filas).

---

## Relación con el micro-framework

- **REG-005 (idempotencia en E3):** implementación directa y verificable. El flujo
  as-is viola REG-005 al hacer INSERT simple sin control; el to-be la cumple con
  `ON CONFLICT DO NOTHING`.
- **REG-004 (retry en integraciones):** precondición satisfecha — E3 puede
  reintentarse con seguridad porque los INSERT son idempotentes.
- **REG-002 (run_id):** el `run_id` se persiste como columna; permite trazar desde
  cualquier fila de BD de vuelta al run-log correspondiente.
- **Patrón-idempotencia (`microframework/patrones/patron-idempotencia.md`):**
  este ADR es la aplicación concreta al dominio IoT; el patrón documenta el enfoque
  general y este ADR documenta la elección de clave específica.
- **ADR-001 IoT:** este ADR extiende ADR-001 especificando la estrategia concreta
  de idempotencia para E3 (que ADR-001 menciona a nivel conceptual).
- **Referencias cruzadas:**
  - `microframework/patrones/patron-idempotencia.md`
  - `microframework/contratos/iot-e3-output.schema.json`
  - `microframework/plantillas/iot-to-be-e3-persistencia.json`
  - `medicion/datasets/iot/input-set-K.json` (dataset que verifica el comportamiento)
  - `automatizacion/setup_env.py` (crea la tabla con PRIMARY KEY compuesta)
