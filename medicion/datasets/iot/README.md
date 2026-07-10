> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# datasets/iot/ — Input Sets del caso IoT

**Ruta:** `medicion/datasets/iot/`
**Pertenece a:** [`medicion/datasets/`](../README.md)

---

## Qué es y para qué existe

Contiene los 10 archivos `input-set-{A..K}.json` del caso IoT, generados
determinísticamente por `generar_datasets.py` con la semilla en `seeds.yaml`.

## Contenido de esta carpeta

| Set | Tipo | Propósito |
|---|---|---|
| `input-set-A.json` | Estático | Lectura normal, sin alerta |
| `input-set-B.json` | Estático | Temperatura alta, alerta activa |
| `input-set-C.json` | Estático | Datos inválidos — temperatura no numérica |
| `input-set-D.json` | Estático | Boundary values — valores exactamente en el umbral |
| `input-set-E.json` | Estático | co2 ausente del payload |
| `input-set-F.json` | Dinámico | Realismo normal (200 lecturas variadas) |
| `input-set-G.json` | Dinámico | Mezcla industrial 70/15/10/5 |
| `input-set-I.json` | Dinámico | Degradación gradual — normal → crítico |
| `input-set-J.json` | Dinámico | Percentiles extremos p1/p99 |
| `input-set-K.json` | Dinámico | Duplicados — mide idempotencia `{sensor_id, timestamp}` (REG-005) |

## Relación con la metodología

Estos sets alimentan las 8000 corridas de medición. El detalle de cada set y qué regla
estresa está en
[`casos-de-estudio/bot/adr/ADR-004`](../../../casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.md)
(diseño experimental compartido con Bot). **Inmutables durante la fase de medición** — no
editar sin ADR.

## Navegación

- Padre: [`medicion/datasets/`](../README.md)
- Ver también: [`medicion/datasets/bot/`](../bot/README.md) · [`medicion/run-logs/iot/`](../../run-logs/iot/README.md) (resultados)
