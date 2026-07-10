> 🌐 **Language / Idioma:** English · [Español](ADR-007-clasificacion-mensajes-e2.md)

# ADR-007 — Message classification in E2: REGLAS array with per-ID traceability

**Date:** 2026-05-01
**Status:** Accepted
**Quality attribute:** Maintainability / Modularity + Functional suitability / Correctness (ISO/IEC 25010)
**Related rules:** REG-007, REC-001, REC-002
**ATAM scenario:** BOT-Q1 (modifying rule R002 touches only E2)

---

## Context

The as-is flow scatters classification logic across multiple nodes:

- `Clasificar Mensaje` node: category logic + HTTP call to the user's history
- `Asignar Prioridad` node: priority rules hardcoded in nested IF conditions
- `Verificar Rate Limit` node: additional logic mixing state control with decisions

This dispersion creates a direct, measurable problem: CR1 (changing rule R002's priority
from "medium" to "high") required touching 8 nodes in the as-is (documented in
`medicion/cr-logs/bot/cr-log-bot-as-is.csv`). The to-be's goal is for CR1 to touch ≤1 node.

The to-be must centralize all classification and priority logic in E2, using a mechanism
that is:
(a) Modifiable with no more than one node touched for rule changes.
(b) Traceable — every decision must record which rule was applied (REC-002).
(c) Pure — E2 must have no HTTP calls or DB access (REG-007).

---

## Decision

E2 implements classification with two declarative data structures:

### REGLAS constant (array of objects)

```javascript
const REGLAS = [
  { id: 'R001', patron: /urgente|emergencia|crítico/i,  categoria: 'urgente',    prioridad: 'alta' },
  { id: 'R002', patron: /factura|pago|cobro|cargo/i,    categoria: 'facturacion', prioridad: 'media' },
  { id: 'R003', patron: /contraseña|acceso|cuenta|login/i, categoria: 'acceso', prioridad: 'alta' },
  { id: 'R004', patron: /error|falla|no funciona/i,     categoria: 'tecnico',    prioridad: 'media' },
  { id: 'R005', patron: /.*/,                            categoria: 'general',    prioridad: 'baja'  }
];
```

**The first matching rule wins.** R005 is the guaranteed fallback (always matches).

### PRIORIDADES constant (operational urgency level)

```javascript
const PRIORIDADES = {
  alta: { nivel_urgencia: 3, requiere_supervisor: true },
  media: { nivel_urgencia: 2, requiere_supervisor: false },
  baja: { nivel_urgencia: 1, requiere_supervisor: false }
};
```

### E2 output (meets the `bot-e2-output.schema.json` contract)

```javascript
const regla_aplicada = REGLAS.find(r => r.patron.test(mensaje));
return [{
  json: {
    run_id,
    categoria: regla_aplicada.categoria,
    prioridad: regla_aplicada.prioridad,
    regla_id: regla_aplicada.id,           // REC-002: traceability
    nivel_urgencia: PRIORIDADES[regla_aplicada.prioridad].nivel_urgencia,
    requiere_supervisor: PRIORIDADES[regla_aplicada.prioridad].requiere_supervisor
  }
}];
```

The `regla_id` field propagates to E2's log and to the final response, satisfying REC-002.

---

## Alternatives considered

| Alternative | Reason for rejection |
|-------------|-----------------|
| External rule engine (Drools, json-rules-engine) | npm dependency unavailable in standard n8n Code nodes; outside LC/NC scope |
| Chained IF nodes in n8n (as in the as-is) | Every branch is a separate visual node — CR1 still requires touching multiple nodes |
| Regex only (no object structure) | Less readable: the category→priority mapping would live elsewhere, scattering the logic |
| Decision table in an external JSON node | Requires an additional file-reading node — overhead with no benefit for 5 rules |

---

## Consequences

**Positive:**
- CR1 (changing R002's priority from "medium" to "high") touches exactly 1 line in the
  `REGLAS` constant. `nodos_tocados = 1` → the BOT-Q1 ATAM scenario goal is met.
- `regla_id` in the log allows unambiguously diagnosing which rule classified each message
  in production.
- Adding a new category (R006, R007) requires touching no other node.

**Negative:**
- Regex rules are language-sensitive. A message in English won't be classified by the
  Spanish-language rules. Declared as a case-study limitation (not of the micro-framework).

---

## Verification criterion

1. CR1 on to-be → `cr-log-bot-to-be.csv`: `nodes_touched = 1`
2. Input Set A (message "urgente") → E2's log contains `"regla_id":"R001"`
3. `validar-flujos.mjs --caso bot --estado to-be` → REG-007: ✓ CUMPLE (E2 with no HTTP/Postgres)
