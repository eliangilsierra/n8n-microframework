> 🌐 **Language / Idioma:** English · [Español](ADR-004-patron-arribo.md)

# ADR-004: Hybrid inter-request delay strategy (arrival pattern)

**Status:** Accepted
**Date:** 2026-04-21
**Author:** Elian Gil
**Context:** plan-mejora-medicion.md §3.4

## Context

The `automatizacion/run_corridas.py` script applies a delay between consecutive requests.
The choice of arrival pattern affects the measured latency variance and, therefore, the
statistical power of the as-is vs to-be comparison.

## Alternatives evaluated

| Pattern | Pros | Cons | Academic value |
|--------|------|---------|-----------------|
| **Fixed 100 ms** | Maximum reproducibility; removes delay as a confounding variable | Doesn't reflect real production traffic | High for comparing structures |
| Uniform jitter [50,150] ms | Moderate realism | Widens variance; reduces statistical power | Medium |
| Poisson (λ=10 req/s) | Gold standard for simulation | Bursts destabilize p95/p99; hard to interpret | High only for load testing |
| **Decreasing 300→50 ms** | Simulates an escalating incident | Introduces index-latency correlation (breaks i.i.d.) | High **only for set I** |

## Decision

**Hybrid** strategy:

```python
DELAY_STRATEGY = {
    "A": ("fixed", 0.100),  # sets A-G, J, K: fixed 100ms
    "B": ("fixed", 0.100),
    "C": ("fixed", 0.100),
    "D": ("fixed", 0.100),
    "E": ("fixed", 0.100),
    "F": ("fixed", 0.100),
    "G": ("fixed", 0.100),
    "I": ("linear_decrease", 0.300, 0.050),  # set I: decreasing 300→50ms
    "J": ("fixed", 0.100),
    "K": ("fixed", 0.100),
}
```

Formula for set I: `delay_i = 0.300 - (0.250 × i / 199)`

## Justification

- **Sets A–G, J, K (fixed 100 ms):** the primary goal is comparing architectural
  structure, not performance under variable load. Traffic realism is already covered by
  *value* variability (sets F, G, I, J, K) and by the separate JMeter test (§4.4 of the
  plan).
- **Set I (decreasing):** frequency acceleration is semantically significant: it
  simulates an "escalating incident" where sensor-reading frequency increases as values
  worsen (industrial IoT monitoring). In the other sets, acceleration would only add
  noise with no meaning.

## Consequences

- The correlation between index and latency in set I is documented as an expected
  artifact, not an anomaly.
- Set I's as-is vs to-be comparison uses Mann-Whitney U (doesn't assume i.i.d.) instead of
  a t-test.
- The Poisson JMeter test is reported as an independent sub-study, separate from the main
  statistical pool.
