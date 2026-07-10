> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# datasets/bot/ — Input Sets del caso Bot

**Ruta:** `medicion/datasets/bot/`
**Pertenece a:** [`medicion/datasets/`](../README.md)

---

## Qué es y para qué existe

Contiene los 10 archivos `input-set-{A..K}.json` del caso Bot, generados
determinísticamente por `generar_datasets.py` con la semilla en `seeds.yaml`.

## Contenido de esta carpeta

| Set | Tipo | Propósito |
|---|---|---|
| `input-set-A.json` | Estático | Caso normal — mensaje válido, token válido |
| `input-set-B.json` | Estático | Carga alta / mensaje urgente |
| `input-set-C.json` | Estático | Datos inválidos — token ausente |
| `input-set-D.json` | Estático | Boundary values — mensaje vacío |
| `input-set-E.json` | Estático | Campos parciales — `user_id`/`session_id` ausente |
| `input-set-F.json` | Dinámico | Realismo normal (200 mensajes variados) |
| `input-set-G.json` | Dinámico | Mezcla válido/inválido (150/50) |
| `input-set-I.json` | Dinámico | Degradación — delay decreciente 300→50ms |
| `input-set-J.json` | Dinámico | Percentiles extremos |
| `input-set-K.json` | Dinámico | Duplicados — mide idempotencia (REG-005) |

## Relación con la metodología

Estos sets alimentan las 8000 corridas de medición (10 sets × 2 casos × 2 versiones ×
200 repeticiones/N). El detalle de cada set y qué regla estresa está en
[`casos-de-estudio/bot/adr/ADR-004`](../../../casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.md).
**Inmutables durante la fase de medición** — no editar sin ADR.

## Navegación

- Padre: [`medicion/datasets/`](../README.md)
- Ver también: [`medicion/datasets/iot/`](../iot/README.md) · [`medicion/run-logs/bot/`](../../run-logs/bot/README.md) (resultados)
