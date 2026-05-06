# Micro-benchmark JMeter — Pendiente

**Fecha:** 2026-05-05
**Estado:** Pendiente — JMeter no instalado en entorno de evaluación

## Instrucciones de ejecución

```bash
# Instalar JMeter 5.6+ (https://jmeter.apache.org/download_jmeter.cgi)
# Asegurar que el entorno Docker está levantado

jmeter -n \
  -t medicion/datasets/jmeter/bot-load-test.jmx \
  -l medicion/datasets/jmeter/resultados/bot-jmeter-result.jtl \
  -e -o medicion/datasets/jmeter/resultados/bot-report/

jmeter -n \
  -t medicion/datasets/jmeter/iot-load-test.jmx \
  -l medicion/datasets/jmeter/resultados/iot-jmeter-result.jtl \
  -e -o medicion/datasets/jmeter/resultados/iot-report/
```

## Métricas esperadas (dimensión Operación — micro-benchmark)

- Throughput (req/s) as-is vs to-be
- Latencia p50, p95, p99 bajo carga concurrente
- Tasa de error bajo carga (input set H — spike de concurrencia)

## Impacto en cobertura ATAM

Este benchmark no bloquea ningún escenario ATAM top-K. Es métrica complementaria de la dimensión Operación.
