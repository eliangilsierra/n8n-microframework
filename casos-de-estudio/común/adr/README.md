> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# común/adr/ — Decisiones compartidas entre casos

**Ruta:** `casos-de-estudio/común/adr/`
**Pertenece a:** [`casos-de-estudio/`](../../README.md)

---

## Qué es y para qué existe

Esta carpeta registra decisiones arquitectónicas que **aplican simultáneamente a ambos
casos de estudio** (Bot e IoT) y por lo tanto no pertenecen exclusivamente a
`casos-de-estudio/bot/adr/` ni a `casos-de-estudio/iot/adr/`.

## Contenido de esta carpeta

| ADR | Título | Aplica a |
|---|---|---|
| [ADR-004](ADR-004-patron-arribo.md) | Estrategia híbrida de delay entre requests (patrón de arribo) | Bot + IoT — script `automatizacion/run_corridas.py` |

## Relación con la metodología

El patrón de arribo (delay entre requests durante las corridas de medición) es una
decisión metodológica del protocolo experimental, no una decisión de arquitectura de un
caso específico — afecta por igual la varianza de latencia medida en ambos casos. Ver
también [`ADR-004 del caso Bot`](../../bot/adr/ADR-004-diseno-experimental-input-sets.md),
que documenta la ampliación de Input Sets (también compartida entre casos pero archivada
en `bot/adr/` por convención de primogenitura).

## Navegación

- Padre: [`casos-de-estudio/`](../../README.md)
- Ver también: [`casos-de-estudio/bot/adr/`](../../bot/adr/README.md) · [`casos-de-estudio/iot/adr/`](../../iot/adr/README.md) · [`docs/protocolo-evidencias.md`](../../../docs/protocolo-evidencias.md)
