> 🌐 **Language / Idioma:** English · [Español](README.md)

# patrones/ — Documented resilience patterns

**Path:** `microframework/patrones/`
**Belongs to:** [`microframework/`](../README.en.md)

---

## What it is and why it exists

This folder documents **5 resilience design patterns** applicable to the E3 (integration
adapters) and E4 (controlled output) stages of the micro-framework. Each pattern includes
the problem it solves, the solution with n8n example code, explicit trade-offs, and its
relationship to the relevant mandatory rules or ADRs.

## Contents of this folder

| Pattern | Problem it solves | Related rule |
|---|---|---|
| [`patron-retry.md`](patron-retry.en.md) | Transient failures in external services (timeout, rate limit) | REG-004 |
| [`patron-idempotencia.md`](patron-idempotencia.en.md) | Duplicate records caused by retries | REG-005 |
| [`patron-circuit-breaker.md`](patron-circuit-breaker.en.md) | Saturation of a downed external service from continuous retries | Complements REG-004 (recommended, not mandatory in v1.0) |
| [`patron-error-boundary.md`](patron-error-boundary.en.md) | Permanent data loss when E3 exhausts all retries | Complements REG-004 (recommended) |
| [`patron-saga-compensacion.md`](patron-saga-compensacion.en.md) | Partial inconsistency when E3 (persistence) succeeds but E4 (notification) fails | Complements REG-003 (recommended) |

## Relationship to the methodology

Only `patron-retry.md` and `patron-idempotencia.md` back **mandatory** rules (REG-004 and
REG-005 respectively); the other three are **recommended** patterns for systems with
stricter no-data-loss or eventual-consistency requirements, and are not part of the
architecture checklist's binary criteria. All apply to the E3/E4 stages of the metamodel
(see [`docs/context/microframework-spec.en.md`](../../docs/context/microframework-spec.en.md)).

## Navigation

- Parent: [`microframework/`](../README.en.md)
- See also: [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.en.md) · [`microframework/checklists/checklist-arquitectura.md`](../checklists/checklist-arquitectura.en.md)
