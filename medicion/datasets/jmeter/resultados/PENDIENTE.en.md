> 🌐 **Language / Idioma:** English · [Español](PENDIENTE.md)

# JMeter micro-benchmark — Pending

**Date:** 2026-05-05
**Status:** Pending — JMeter not installed in the evaluation environment

## Execution instructions

```bash
# Install JMeter 5.6+ (https://jmeter.apache.org/download_jmeter.cgi)
# Make sure the Docker environment is up

jmeter -n \
  -t medicion/datasets/jmeter/bot-load-test.jmx \
  -l medicion/datasets/jmeter/resultados/bot-jmeter-result.jtl \
  -e -o medicion/datasets/jmeter/resultados/bot-report/

jmeter -n \
  -t medicion/datasets/jmeter/iot-load-test.jmx \
  -l medicion/datasets/jmeter/resultados/iot-jmeter-result.jtl \
  -e -o medicion/datasets/jmeter/resultados/iot-report/
```

## Expected metrics (Operation dimension — micro-benchmark)

- Throughput (req/s) as-is vs to-be
- p50, p95, p99 latency under concurrent load
- Error rate under load (input set H — concurrency spike)

## Impact on ATAM coverage

This benchmark blocks no top-K ATAM scenario. It is a complementary metric for the
Operation dimension.
