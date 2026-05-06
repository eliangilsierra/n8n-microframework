# Comparación as-is vs to-be — Métricas de run-log

Generado: 2026-05-04T02:42:47.782128+00:00
Fuente: `medicion/run-logs/`

> Latencia medida desde el cliente Python (incluye red local + procesamiento n8n).
> Complementar con `metrics-*.md` para duraciones internas de n8n.

## Caso BOT

| Set | N as-is | p50 as-is | p95 as-is | %fail as-is | N to-be | p50 to-be | p95 to-be | %fail to-be | Δp50 | Δ%fail |
|-----|---------|-----------|-----------|-------------|---------|-----------|-----------|-------------|------|--------|
| A | 200 | 120 ms | 159 ms | 25% | 200 | 149 ms | 186 ms | 0% | +25% ↑ | -100% ↓ |
| B | 200 | 118 ms | 160 ms | 1% | 200 | 145 ms | 188 ms | 0% | +23% ↑ | -100% ↓ |
| C | 200 | 66 ms | 82 ms | 25% | 200 | 53 ms | 88 ms | 0% | -20% ↓ | -100% ↓ |

**Total corridas as-is:** 2000  |  **Fallos:** 175 (9%)
**Total corridas to-be:** 2000  |  **Fallos:** 114 (6%)

## Caso IOT

| Set | N as-is | p50 as-is | p95 as-is | %fail as-is | N to-be | p50 to-be | p95 to-be | %fail to-be | Δp50 | Δ%fail |
|-----|---------|-----------|-----------|-------------|---------|-----------|-----------|-------------|------|--------|
| A | 200 | 78 ms | 97 ms | 0% | 200 | 200 ms | 248 ms | 0% | +156% ↑ | 0% ↑ |
| B | 200 | 78 ms | 93 ms | 0% | 200 | 227 ms | 293 ms | 0% | +192% ↑ | +0% ↑ |
| C | 200 | 42 ms | 58 ms | 0% | 200 | 72 ms | 133 ms | 0% | +70% ↑ | 0% ↑ |

**Total corridas as-is:** 2000  |  **Fallos:** 4 (0%)
**Total corridas to-be:** 2000  |  **Fallos:** 12 (1%)

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
