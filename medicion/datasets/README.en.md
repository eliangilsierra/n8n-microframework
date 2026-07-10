> 🌐 **Language / Idioma:** English · [Español](README.md)

# datasets/ — Deterministic synthetic datasets

**Path:** `medicion/datasets/`
**Belongs to:** [`medicion/`](../README.en.md)

---

## What it is and why it exists

This folder contains the **10 Input Sets (A–K)** per case study used in every measurement
run, generated **deterministically** (same seed → same data, always) to guarantee exact
comparability between as-is and to-be. It also contains the JMeter load-test files
(complementary, outside the main statistical pool).

## Contents of this folder

| File / Subfolder | Description |
|---|---|
| `generar_datasets.py` | Deterministic generator — uses `numpy.random.default_rng(seed)` |
| `seeds.yaml` | Versioned seeds (`master_seed: 20260421`) — do not modify without an ADR |
| [`bot/`](bot/README.en.md) | The Bot case's 10 Input Sets |
| [`iot/`](iot/README.en.md) | The IoT case's 10 Input Sets |
| [`jmeter/`](jmeter/README.en.md) | JMeter load-test plans (complementary) |

## Relationship to the methodology

Sets A–E are static (a single payload repeated N times); F, G, I, J, K are dynamic (200
unique payloads per seed). Every set stresses specific micro-framework REG-* rules — see
the complete detail in
[`docs/context/proyecto-overview.md`](../../docs/context/proyecto-overview.en.md) §Synthetic
Input Sets and in
[`casos-de-estudio/bot/adr/ADR-004`](../../casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.en.md)
(experimental design, applies to both cases). **These files are immutable during the
measurement phase** — any change requires an ADR (see
[`docs/context/convenios-y-reglas.md`](../../docs/context/convenios-y-reglas.en.md)).

## Navigation

- Parent: [`medicion/`](../README.en.md)
- See also: [`medicion/run-logs/`](../run-logs/README.en.md) (results of running these datasets) · [`automatizacion/README.md`](../../automatizacion/README.en.md) (the script that consumes them)
