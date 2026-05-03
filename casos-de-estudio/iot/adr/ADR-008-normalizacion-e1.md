# ADR-008 — Normalización de campos en E1 antes de pasar a dominio

**Fecha:** 2026-05-01
**Estado:** Implementado 2026-05-02
**Atributo de calidad:** Fiabilidad / Madurez + Mantenibilidad / Modularidad (ISO/IEC 25010)
**Reglas relacionadas:** REC-001, REG-005
**ADR relacionado:** ADR-007 IoT (timestamp authority)

---

## Contexto

REC-001 del micro-framework recomienda normalizar los datos de entrada en E1 antes
de pasarlos a E2. Para el caso IoT, la normalización tiene una implicación directa
en la **corrección de la idempotencia** (REG-005): si dos envíos del mismo dato
físico difieren en formato (22.5 vs 22.50 vs 22.500), la clave de idempotencia
podría ser diferente aunque representen la misma medición.

La pregunta es: ¿qué campos normalizar, con qué precisión, y en qué momento dentro
de E1?

---

## Decisión

La normalización ocurre en E1, **después** de la validación y **antes** de construir
el output. Si la validación falla, no se normaliza (retorna `{ valido: false, lectura: null }`).

### Campos y reglas de normalización

| Campo | Regla | Justificación |
|-------|-------|---------------|
| `temperature` | `Math.round(x * 10) / 10` (1 decimal) | Precisión de sensor estándar; evita diferencias de formato en clave idempotencia |
| `humidity` | `Math.round(x * 10) / 10` (1 decimal) | Misma justificación que temperature |
| `co2` | `Math.round(x)` (entero) | Los sensores de CO2 reportan valores enteros; decimales son artefactos de conversión |
| `timestamp` | `new Date(x).toISOString()` (ISO 8601 UTC) | Normaliza formatos "2026-05-01 10:00" → "2026-05-01T10:00:00.000Z" |
| `location` | `.trim().toLowerCase()` | Evita que "Sala A" y "sala a" se traten como sensores diferentes |
| `sensor_id` | `.trim()` | Espacios accidentales en el ID podrían generar claves de idempotencia incorrectas |

### Implementación en E1

```javascript
// Solo se ejecuta si errores.length === 0
const lectura = {
  sensor_id:   payload.sensor_id.trim(),
  temperature: Math.round(payload.temperature * 10) / 10,
  humidity:    Math.round(payload.humidity * 10) / 10,
  co2:         Math.round(payload.co2),
  timestamp:   new Date(payload.timestamp).toISOString(),
  location:    (payload.location || '').trim().toLowerCase()
};
```

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Normalizar en E2 | E2 es la etapa de dominio — no debe transformar datos, solo aplicar reglas. La normalización es responsabilidad de E1 (entrada limpia al sistema) |
| No normalizar (pasar el valor tal como llegó) | `22.5` y `22.50` en `temperature` generarían idempotency_keys diferentes para la misma medición física |
| Normalizar con mayor precisión (2 decimales) | Aumentaría el ruido: variaciones en el último decimal de sensores de baja precisión crearían lecturas "diferentes" que en realidad son iguales |
| Normalizar solo si el tipo es correcto | La validación de tipo ya garantiza que el campo es un número antes de normalizar |

---

## Consecuencias

**Positivas:**
- La clave de idempotencia `{sensor_id}_{timestamp}` es estable frente a variaciones
  de formato en los campos numéricos.
- E2 recibe datos tipados y con precisión uniforme — las comparaciones de umbrales
  no tienen artefactos de punto flotante.
- `location` en minúsculas permite agrupación de lecturas sin distinción de mayúsculas.

**Negativas:**
- El redondeo de 1 decimal puede introducir un error máximo de 0.05°C en temperatura.
  Para los umbrales del caso (35°C crítico, 28°C advertencia), este error es irrelevante.
- `Math.round` JavaScript usa "round half to even" en algunos casos edge. Para el
  rango de valores de temperatura ambiental, no hay casos problemáticos conocidos.

---

## Relación con REG-005 (idempotencia)

La normalización es una **precondición necesaria** para que la idempotencia funcione
correctamente. Sin normalización:

```
Envío 1:   temperature=22.50 → key="sensor1_..._22.5"   (float truncado)
Envío 2:   temperature=22.5  → key="sensor1_..._22.5"   (idéntico ✓)
Envío 3:   temperature=22.500 → key="sensor1_..._22.5"  (idéntico ✓)
```

Con normalización antes de construir la clave, los tres envíos generan la misma clave.

---

## Criterio de verificación

1. Enviar lectura con `temperature=22.50` y luego `temperature=22.5` (mismo timestamp) → 1 registro en BD (REG-005)
2. `location="Sala A"` en el registro de BD → `"sala a"` (lowercase)
3. `timestamp="2026-05-01 10:00:00"` en el registro de BD → `"2026-05-01T10:00:00.000Z"` (ISO 8601)
