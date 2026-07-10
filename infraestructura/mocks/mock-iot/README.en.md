> 🌐 **Language / Idioma:** English · [Español](README.md)

# mocks/mock-iot/ — Alert system mock

**Path:** `infraestructura/mocks/mock-iot/`
**Belongs to:** [`infraestructura/mocks/`](../README.en.md)

---

## What it is and why it exists

A pure Node.js HTTP server (no dependencies) that simulates the IoT case's external
notification system — receives the level-differentiated alerts (critical/warning) that
the E4 subflow sends.

## Contents of this folder

| File | Description |
|---|---|
| `server.js` | HTTP server — implements `/health` and the notification endpoint, responds `{status:'ok', notificacion_enviada:true, nivel, ts}` |
| `package.json` | No external dependencies — uses only Node's `http` module |

## How to run

Started automatically as part of `docker-compose.yml` (the `mock_iot` container, port
3002). Manual verification:

```bash
curl http://localhost:3002/health   # {"ok":true}
docker logs mock_iot                # view JSON logs for each notification received
```

## Relationship to the methodology

This is the mock deliberately stopped in the **IOT-Q4** ATAM scenario (network fault
tolerance) to verify that the to-be's retry and error workflow work correctly — see
[`medicion/consolidado/mttd-resultado.md`](../../../medicion/consolidado/mttd-resultado.en.md)
§IOT-Q4-runtime.

## Navigation

- Parent: [`infraestructura/mocks/`](../README.en.md)
- See also: [`infraestructura/mocks/mock-bot/`](../mock-bot/README.en.md) · [`casos-de-estudio/iot/ficha-tecnica.md`](../../../casos-de-estudio/iot/ficha-tecnica.en.md)
