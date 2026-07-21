> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# datasets/ — Datasets sintéticos deterministas

**Ruta:** `medicion/datasets/`
**Pertenece a:** [`medicion/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene los **10 Input Sets (A–K)** por caso de estudio usados en todas las
corridas de medición, generados de forma **determinística** (misma semilla → mismos
datos, siempre) para garantizar comparabilidad exacta entre as-is y to-be. También
contiene los archivos de prueba de carga JMeter (complementarios, fuera del pool
estadístico principal).

## Contenido de esta carpeta

| Archivo / Subcarpeta | Descripción |
|---|---|
| `generar_datasets.py` | Generador determinístico — usa `numpy.random.default_rng(seed)` |
| `seeds.yaml` | Semillas versionadas (`master_seed: 20260421`) — no modificar sin ADR |
| [`bot/`](bot/README.md) | 10 Input Sets del caso Bot |
| [`iot/`](iot/README.md) | 10 Input Sets del caso IoT |
| [`jmeter/`](jmeter/README.md) | Planes de prueba de carga JMeter (complementarios) |

## Relación con la metodología

Los sets A–E son estáticos (payload único repetido N veces); F, G, I, J, K son dinámicos
(200 payloads únicos por seed). Cada set estresa reglas REG-* específicas del
micro-framework — ver el detalle completo en
[`../proyecto-overview.md`](../proyecto-overview.md) §Input
Sets sintéticos y en
[`casos-de-estudio/bot/adr/ADR-004`](../../casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.md)
(diseño experimental, aplica a ambos casos). **Estos archivos son inmutables durante la
fase de medición** — cualquier cambio requiere un ADR (ver
[`../../microframework/convenciones/convenios-y-reglas.md`](../../microframework/convenciones/convenios-y-reglas.md)).

## Navegación

- Padre: [`medicion/`](../README.md)
- Ver también: [`medicion/run-logs/`](../run-logs/README.md) (resultados de ejecutar estos datasets) · [`automatizacion/README.md`](../../automatizacion/README.md) (script que los consume)
