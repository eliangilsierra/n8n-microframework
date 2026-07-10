> 🌐 **Language / Idioma:** English · [Español](README.md)

# común/adr/ — Decisions shared between cases

**Path:** `casos-de-estudio/común/adr/`
**Belongs to:** [`casos-de-estudio/`](../../README.en.md)

---

## What it is and why it exists

This folder records architectural decisions that **apply simultaneously to both case
studies** (Bot and IoT) and therefore don't belong exclusively to
`casos-de-estudio/bot/adr/` or `casos-de-estudio/iot/adr/`.

## Contents of this folder

| ADR | Title | Applies to |
|---|---|---|
| [ADR-004](ADR-004-patron-arribo.en.md) | Hybrid inter-request delay strategy (arrival pattern) | Bot + IoT — the `automatizacion/run_corridas.py` script |

## Relationship to the methodology

The arrival pattern (delay between requests during measurement runs) is a methodological
decision of the experimental protocol, not an architecture decision of a specific case —
it equally affects the measured latency variance in both cases. See also
[Bot's `ADR-004`](../../bot/adr/ADR-004-diseno-experimental-input-sets.en.md), which
documents the Input Sets expansion (also shared between cases but filed under `bot/adr/`
by primogeniture convention).

## Navigation

- Parent: [`casos-de-estudio/`](../../README.en.md)
- See also: [`casos-de-estudio/bot/adr/`](../../bot/adr/README.en.md) · [`casos-de-estudio/iot/adr/`](../../iot/adr/README.en.md) · [`docs/protocolo-evidencias.md`](../../../docs/protocolo-evidencias.en.md)
