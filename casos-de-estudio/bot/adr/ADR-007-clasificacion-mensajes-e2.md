# ADR-007 — Clasificación de mensajes en E2: array REGLAS con trazabilidad por ID

**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Mantenibilidad / Modularidad + Adecuación funcional / Corrección (ISO/IEC 25010)
**Reglas relacionadas:** REG-007, REC-001, REC-002
**Escenario ATAM:** BOT-Q1 (modificar regla R002 toca solo E2)

---

## Contexto

El flujo as-is dispersa la lógica de clasificación en múltiples nodos:

- Nodo `Clasificar Mensaje`: lógica de categorías + llamada HTTP al historial del usuario
- Nodo `Asignar Prioridad`: reglas de prioridad hardcodeadas en condiciones IF anidadas
- Nodo `Verificar Rate Limit`: lógica adicional que mezcla control de estado con decisiones

Esta dispersión genera un problema directo medible: el CR1 (cambiar la prioridad de la
regla R002 de "media" a "alta") requirió tocar 8 nodos en el as-is (documentado en
`medicion/cr-logs/bot/cr-log-bot-as-is.csv`). El objetivo del to-be es que CR1 toque
≤1 nodo.

El to-be debe centralizar toda la lógica de clasificación y prioridad en E2, usando
un mecanismo que sea:
(a) Modificable sin tocar más de un nodo para cambios de reglas.
(b) Trazable — cada decisión debe registrar qué regla se aplicó (REC-002).
(c) Puro — E2 no debe tener llamadas HTTP ni acceso a BD (REG-007).

---

## Decisión

E2 implementa la clasificación con dos estructuras de datos declarativas:

### Constante REGLAS (array de objetos)

```javascript
const REGLAS = [
  { id: 'R001', patron: /urgente|emergencia|crítico/i,  categoria: 'urgente',    prioridad: 'alta' },
  { id: 'R002', patron: /factura|pago|cobro|cargo/i,    categoria: 'facturacion', prioridad: 'media' },
  { id: 'R003', patron: /contraseña|acceso|cuenta|login/i, categoria: 'acceso', prioridad: 'alta' },
  { id: 'R004', patron: /error|falla|no funciona/i,     categoria: 'tecnico',    prioridad: 'media' },
  { id: 'R005', patron: /.*/,                            categoria: 'general',    prioridad: 'baja'  }
];
```

**Primera regla que hace match gana.** R005 es el fallback garantizado (siempre hace match).

### Constante PRIORIDADES (nivel de urgencia operativo)

```javascript
const PRIORIDADES = {
  alta: { nivel_urgencia: 3, requiere_supervisor: true },
  media: { nivel_urgencia: 2, requiere_supervisor: false },
  baja: { nivel_urgencia: 1, requiere_supervisor: false }
};
```

### Output de E2 (cumple contrato `bot-e2-output.schema.json`)

```javascript
const regla_aplicada = REGLAS.find(r => r.patron.test(mensaje));
return [{
  json: {
    run_id,
    categoria: regla_aplicada.categoria,
    prioridad: regla_aplicada.prioridad,
    regla_id: regla_aplicada.id,           // REC-002: trazabilidad
    nivel_urgencia: PRIORIDADES[regla_aplicada.prioridad].nivel_urgencia,
    requiere_supervisor: PRIORIDADES[regla_aplicada.prioridad].requiere_supervisor
  }
}];
```

El campo `regla_id` se propaga al log de E2 y a la respuesta final, satisfaciendo REC-002.

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Motor de reglas externo (Drools, json-rules-engine) | Dependencia npm no disponible en nodos Code de n8n estándar; fuera del alcance LC/NC |
| Nodos IF encadenados en n8n (como en el as-is) | Cada rama es un nodo visual separado — CR1 sigue requiriendo tocar múltiples nodos |
| Regex exclusivamente (sin estructura de objetos) | Menos legible: el mapeo categoría→prioridad quedaría en otro lugar, dispersando la lógica |
| Tabla de decisión en nodo JSON externo | Requiere un nodo adicional de lectura de archivo — overhead sin beneficio para 5 reglas |

---

## Consecuencias

**Positivas:**
- CR1 (cambiar prioridad de R002 de "media" a "alta") toca exactamente 1 línea en
  la constante `REGLAS`. `nodos_tocados = 1` → meta del escenario ATAM BOT-Q1 cumplida.
- `regla_id` en el log permite diagnosticar sin ambigüedad qué regla clasificó cada
  mensaje en producción.
- Añadir una nueva categoría (R006, R007) no requiere tocar ningún otro nodo.

**Negativas:**
- Las reglas regex son sensibles a idioma. Un mensaje en inglés no será clasificado
  por las reglas en español. Declarado como limitación del caso de estudio (no del
  micro-framework).

---

## Criterio de verificación

1. CR1 en to-be → `cr-log-bot-to-be.csv`: `nodes_touched = 1`
2. Input Set A (mensaje "urgente") → log E2 contiene `"regla_id":"R001"`
3. `validar-flujos.mjs --caso bot --estado to-be` → REG-007: ✓ CUMPLE (E2 sin HTTP/Postgres)
