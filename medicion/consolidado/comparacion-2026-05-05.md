# Comparación as-is vs to-be — Métricas de run-log

Generado: 2026-05-06T02:18:57.337675+00:00
Fuente: `medicion/run-logs/`

> Latencia medida desde el cliente Python (incluye red local + procesamiento n8n).
> Complementar con `metrics-*.md` para duraciones internas de n8n.

## Caso BOT

| Set | N as-is | p50 as-is | p95 as-is | %fail as-is | N to-be | p50 to-be | p95 to-be | %fail to-be | Δp50 | Δ%fail |
|-----|---------|-----------|-----------|-------------|---------|-----------|-----------|-------------|------|--------|
| A | 200 | 120 ms | 159 ms | 25% | 200 | 131 ms | 197 ms | 0% | +9% ↑ | -100% ↓ |
| B | 200 | 118 ms | 160 ms | 1% | 200 | 120 ms | 143 ms | 0% | +2% ↑ | -100% ↓ |
| C | 200 | 66 ms | 82 ms | 25% | 200 | 39 ms | 57 ms | 0% | -42% ↓ | -100% ↓ |

**Total corridas as-is:** 2000  |  **Fallos:** 175 (9%)
**Total corridas to-be:** 2000  |  **Fallos:** 111 (6%)

## Caso IOT

| Set | N as-is | p50 as-is | p95 as-is | %fail as-is | N to-be | p50 to-be | p95 to-be | %fail to-be | Δp50 | Δ%fail |
|-----|---------|-----------|-----------|-------------|---------|-----------|-----------|-------------|------|--------|
| A | 200 | 78 ms | 97 ms | 0% | 200 | 171 ms | 201 ms | 0% | +119% ↑ | 0% ↑ |
| B | 200 | 78 ms | 93 ms | 0% | 200 | 182 ms | 228 ms | 0% | +134% ↑ | 0% ↑ |
| C | 200 | 42 ms | 58 ms | 0% | 200 | 65 ms | 83 ms | 0% | +53% ↑ | 0% ↑ |

**Total corridas as-is:** 2000  |  **Fallos:** 4 (0%)
**Total corridas to-be:** 2000  |  **Fallos:** 11 (1%)

## Interpretación de columnas

| Columna | Descripción |
|---------|-------------|
| Set A | Caso nominal — entrada válida, flujo completo |
| Set B | Caso crítico — valores extremos / urgente |
| Set C | Caso inválido — ausencia de campos obligatorios |
| Δp50 | % de cambio en mediana de latencia (↓ = mejora) |
| Δ%fail | % de cambio en tasa de fallos (↓ = mejora) |

### Nota sobre Set C en as-is IoT

El as-is IoT reporta `%fail=0%` para Set C porque no valida campos obligatorios —
procesa la lectura con valores `undefined`. Esto **es el antipatrón** (ausencia de E1),
no un éxito real. El to-be rechaza correctamente con 422.
