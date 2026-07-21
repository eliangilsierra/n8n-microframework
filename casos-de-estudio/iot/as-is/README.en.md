> 🌐 **Language / Idioma:** English · [Español](README.md)

# as-is/ — IoT case baseline

**Path:** `casos-de-estudio/iot/as-is/`
**Belongs to:** [`casos-de-estudio/iot/`](../README.en.md)

---

## What it is and why it exists

This folder contains the IoT case's **as-is** flow: a monolithic 14-node pipeline that
**intentionally preserves antipatterns** as a comparative baseline. It must not be fixed
without an ADR that justifies it — this flow's purpose is to measurably exhibit the
antipatterns the micro-framework corrects in the to-be.

## Contents of this folder

| File | Description |
|---|---|
| `iot-as-is.json` | Main as-is pipeline flow |
| [`notas-tecnicas.md`](notas-tecnicas.en.md) | Flow structure, 14-node table, detailed REG-001…010 mapping |
| [`diagrama-as-is.md`](diagrama-as-is.en.md) | Mermaid diagram with per-node antipattern annotations |
| [`cambios-y-evidencia.md`](cambios-y-evidencia.en.md) | Chronological change log of the 3 CR-ASIS applied during PHASE 2 |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.en.md) | Result of applying the architecture checklist (1/7 passed) |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.en.md) | Result of applying the DevSecOps checklist |

## Relationship to the methodology

This as-is intentionally represents an ad-hoc design with no architecture. It violates 9
of the 10 mandatory rules (REG-001 through REG-009), with alert thresholds scattered and
inconsistent across nodes (documented in `notas-tecnicas.md`) and incomplete validation of
the `co2` field. Verified by the
[static validator](../../../microframework/validacion/README.en.md). The flow
modification rules are in
[`../../../microframework/convenciones/convenios-y-reglas.en.md`](../../../microframework/convenciones/convenios-y-reglas.en.md).

## Navigation

- Parent: [`casos-de-estudio/iot/`](../README.en.md)
- See also: [`to-be/`](../to-be/README.en.md) (fixed version) · [`casos-de-estudio/iot/adr/ADR-002`](../adr/ADR-002-umbrales-y-vocabulario.en.md) (to-be's final thresholds)
