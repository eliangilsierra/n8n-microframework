> 🌐 **Language / Idioma:** English · [Español](README.md)

# datasets/jmeter/ — Complementary load tests

**Path:** `medicion/datasets/jmeter/`
**Belongs to:** [`medicion/datasets/`](../README.en.md)

---

## What it is and why it exists

Contains the JMeter test plans for the concurrent-load micro-benchmark (thesis
proposal's Operation dimension). It is **complementary** to the main 8000-run statistical
pool — it blocks no top-K ATAM scenario.

## Contents of this folder

| File | Description |
|---|---|
| `bot-load-test.jmx` | JMeter test plan for the Bot case |
| `iot-load-test.jmx` | JMeter test plan for the IoT case |
| `resultados/` | Results output folder (`.jtl`, HTML reports) |
| [`resultados/PENDIENTE.md`](resultados/PENDIENTE.en.md) | Status: pending — JMeter not installed in the evaluation environment |

## Relationship to the methodology

The JMeter micro-benchmark measures throughput and latency under concurrent load (input
set H — concurrency spike), complementing the main pool's synchronous measurements. See
execution instructions in
[`resultados/PENDIENTE.md`](resultados/PENDIENTE.en.md) and
[`medicion/consolidado/metricas-derivadas.md`](../../consolidado/metricas-derivadas.en.md)
§JMeter micro-benchmark.

## Navigation

- Parent: [`medicion/datasets/`](../README.en.md)
- See also: [`../../../microframework/convenciones/convenios-y-reglas.en.md`](../../../microframework/convenciones/convenios-y-reglas.en.md) §Input set taxonomy
