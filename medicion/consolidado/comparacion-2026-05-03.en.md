> 🌐 **Language / Idioma:** English · [Español](comparacion-2026-05-03.md)

# As-is vs to-be comparison — Run-log metrics

Generated: 2026-05-04T02:42:47.782128+00:00
Source: `medicion/run-logs/`

> Latency measured from the Python client (includes local network + n8n processing).
> Complement with `metrics-*.md` for n8n's internal durations.

## BOT case

| Set | N as-is | p50 as-is | p95 as-is | %fail as-is | N to-be | p50 to-be | p95 to-be | %fail to-be | Δp50 | Δ%fail |
|-----|---------|-----------|-----------|-------------|---------|-----------|-----------|-------------|------|--------|
| A | 200 | 120 ms | 159 ms | 25% | 200 | 149 ms | 186 ms | 0% | +25% ↑ | -100% ↓ |
| B | 200 | 118 ms | 160 ms | 1% | 200 | 145 ms | 188 ms | 0% | +23% ↑ | -100% ↓ |
| C | 200 | 66 ms | 82 ms | 25% | 200 | 53 ms | 88 ms | 0% | -20% ↓ | -100% ↓ |

**Total as-is runs:** 2000  |  **Failures:** 175 (9%)
**Total to-be runs:** 2000  |  **Failures:** 114 (6%)

## IOT case

| Set | N as-is | p50 as-is | p95 as-is | %fail as-is | N to-be | p50 to-be | p95 to-be | %fail to-be | Δp50 | Δ%fail |
|-----|---------|-----------|-----------|-------------|---------|-----------|-----------|-------------|------|--------|
| A | 200 | 78 ms | 97 ms | 0% | 200 | 200 ms | 248 ms | 0% | +156% ↑ | 0% ↑ |
| B | 200 | 78 ms | 93 ms | 0% | 200 | 227 ms | 293 ms | 0% | +192% ↑ | +0% ↑ |
| C | 200 | 42 ms | 58 ms | 0% | 200 | 72 ms | 133 ms | 0% | +70% ↑ | 0% ↑ |

**Total as-is runs:** 2000  |  **Failures:** 4 (0%)
**Total to-be runs:** 2000  |  **Failures:** 12 (1%)

## Column interpretation

| Column | Description |
|---------|-------------|
| Set A | Nominal case — valid input, complete flow |
| Set B | Critical case — extreme/urgent values |
| Set C | Invalid case — missing required fields |
| Δp50 | % change in median latency (↓ = improvement) |
| Δ%fail | % change in failure rate (↓ = improvement) |

### Note on IoT as-is Set C

The IoT as-is reports `%fail=0%` for Set C because it doesn't validate required fields —
it processes the reading with `undefined` values. This **is the antipattern** (absence of
E1), not a real success. The to-be correctly rejects it with 422.
