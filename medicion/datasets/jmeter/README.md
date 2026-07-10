> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# datasets/jmeter/ — Pruebas de carga complementarias

**Ruta:** `medicion/datasets/jmeter/`
**Pertenece a:** [`medicion/datasets/`](../README.md)

---

## Qué es y para qué existe

Contiene los planes de prueba JMeter para el micro-benchmark de carga concurrente
(dimensión Operación del anteproyecto). Es **complementario** al pool estadístico
principal de 8000 corridas — no bloquea ningún escenario ATAM top-K.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `bot-load-test.jmx` | Plan de prueba JMeter para el caso Bot |
| `iot-load-test.jmx` | Plan de prueba JMeter para el caso IoT |
| `resultados/` | Carpeta de salida de resultados (`.jtl`, reportes HTML) |
| [`resultados/PENDIENTE.md`](resultados/PENDIENTE.md) | Estado: pendiente — JMeter no instalado en el entorno de evaluación |

## Relación con la metodología

El micro-benchmark JMeter mide throughput y latencia bajo carga concurrente (input set H
— spike de concurrencia), complementando las mediciones síncronas del pool principal. Ver
instrucciones de ejecución en
[`resultados/PENDIENTE.md`](resultados/PENDIENTE.md) y
[`medicion/consolidado/metricas-derivadas.md`](../../consolidado/metricas-derivadas.md)
§Micro-benchmark JMeter.

## Navegación

- Padre: [`medicion/datasets/`](../README.md)
- Ver también: [`docs/context/convenios-y-reglas.md`](../../../docs/context/convenios-y-reglas.md) §Taxonomía de input sets
