# ADR-006 — Validación de schema en E1: JavaScript inline con errores por campo

**Fecha:** 2026-05-01
**Estado:** Implementado 2026-05-02
**Atributo de calidad:** Adecuación funcional / Corrección + Mantenibilidad / Modularidad (ISO/IEC 25010)
**Reglas relacionadas:** REG-009, E1 metamodelo
**Escenario ATAM:** IOT-Q2 relacionado (validación como precondición de HTTP codes correctos)

---

## Contexto

E1 debe validar el payload del sensor antes de pasar datos a E2. El flujo as-is
tiene validación fragmentada en dos nodos (`Validar Campos` y `Validar Tipos`) que:

1. Solo verifican presencia de campos, no rangos físicamente posibles.
2. Responden siempre 200 OK incluso cuando la validación falla (REG-009 violada).
3. No producen una lista estructurada de errores por campo.

El micro-framework exige que E1 retorne `{ valido: boolean, errores: string[] }` y
que el orquestador use ese resultado para responder con 400/422 si `valido === false`.

La pregunta es: ¿qué mecanismo de validación usar en el nodo Code de E1?

---

## Decisión

E1 usa **JavaScript inline en un nodo Code** para validar el payload con la siguiente
lógica organizada en tres niveles:

### Nivel 1 — Campos requeridos

```javascript
const CAMPOS_REQUERIDOS = ['sensor_id', 'temperature', 'humidity', 'co2', 'timestamp'];
const errores = [];

for (const campo of CAMPOS_REQUERIDOS) {
  if (payload[campo] === undefined || payload[campo] === null || payload[campo] === '') {
    errores.push(`Campo requerido ausente: ${campo}`);
  }
}
```

### Nivel 2 — Tipos de datos

```javascript
if (typeof payload.sensor_id !== 'string') errores.push('sensor_id debe ser string');
if (typeof payload.temperature !== 'number') errores.push('temperature debe ser número');
if (typeof payload.humidity !== 'number') errores.push('humidity debe ser número');
if (!Number.isInteger(payload.co2)) errores.push('co2 debe ser entero');
```

### Nivel 3 — Rangos físicamente posibles

Rangos canónicos (resolución de inconsistencia detectada 2026-05-02):
- `temperature`: `-50` a `125°C` (mín. ampliado a -50 para cubrir aplicaciones de frío;
  máx. 125°C según IEC 60068 para sensores de estado sólido)
- `humidity`: `0–100%`
- `co2`: `0–5000 ppm`

El ADR original especificaba -40/125°C. La implementación E1 usaba -50/100°C. El schema
`iot-webhook-input.schema.json` usaba -50/150°C. Valor canónico adoptado: **-50/125°C**,
alineando E1, schema del webhook y este ADR. El valor 125°C es el límite operativo de
sensores de temperatura tipo NTC/PT100 (IEC 60068-2-2).

```javascript
const RANGOS = {
  temperature: { min: -50, max: 125, unidad: '°C' },
  humidity:    { min: 0,   max: 100, unidad: '%'  },
  co2:         { min: 0,   max: 5000, unidad: 'ppm' }
};

for (const [campo, rango] of Object.entries(RANGOS)) {
  if (payload[campo] < rango.min || payload[campo] > rango.max) {
    errores.push(`${campo} fuera de rango físico: ${payload[campo]} (válido: ${rango.min}–${rango.max} ${rango.unidad})`);
  }
}
```

### Output de E1 (satisface contrato `iot-e1-output.schema.json`)

```javascript
return [{ json: {
  valido: errores.length === 0,
  errores,
  run_id,
  start_ts,
  lectura: errores.length === 0 ? {
    sensor_id: payload.sensor_id.trim(),
    temperature: Math.round(payload.temperature * 10) / 10,
    humidity: Math.round(payload.humidity * 10) / 10,
    co2: Math.round(payload.co2),
    timestamp: new Date(payload.timestamp).toISOString(),
    location: (payload.location || '').trim().toLowerCase()
  } : null
}}];
```

La normalización (round, trim, toISOString) ocurre solo si la validación pasa,
satisfaciendo REC-001.

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Nodo JSON Schema de n8n (nativo) | No produce lista estructurada de errores por campo con mensajes descriptivos; no soporta validación de rangos (solo tipos); el output no sigue el contrato `{valido, errores}` |
| Ajv (librería npm) | No disponible en nodos Code de n8n estándar sin instalar paquetes npm — fuera del alcance LC/NC |
| Validación solo de presencia (sin rangos) | Un sensor con temperature=999°C pasaría la validación y contaminaría E2 con datos físicamente imposibles |
| Separar en múltiples nodos Code (como el as-is) | Fragmenta la validación en nodos separados que no comparten estado — más difícil de mantener y auditar |

---

## Consecuencias

**Positivas:**
- Mensajes de error específicos por campo: el cliente (sensor) sabe exactamente qué
  corregir sin inspeccionar logs.
- Los rangos físicos están centralizados en `RANGOS` — CR3 (agregar validación `co2 ≥ 0`)
  toca solo esta constante (0 nodos adicionales, como mide el as-is en cr-log).
- El contrato de output es exactamente el que define `iot-e1-output.schema.json`.

**Negativas:**
- La validación de tipos JavaScript tiene aristas: `typeof NaN === 'number'` es `true`.
  Mitigación: añadir `isNaN` check para campos numéricos en los rangos.
- Si se necesita validación más compleja (JSON Schema con $ref), este enfoque no escala.
  Declarado como limitación aceptable para el alcance del caso de estudio.

---

## Criterio de verificación

1. Input Set C (campos faltantes) → HTTP 422, `errores` con lista no vacía (REG-009)
2. Input Set D (tipos inválidos) → HTTP 422, mensaje descriptivo por campo
3. Input Set con temperature=999 → HTTP 422, mensaje "temperature fuera de rango físico"
4. `validar-flujos.mjs --caso iot --estado to-be` → E1 contiene validación de campos requeridos
