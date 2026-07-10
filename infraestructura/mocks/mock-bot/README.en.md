> 🌐 **Language / Idioma:** English · [Español](README.md)

# mocks/mock-bot/ — Ticketing system mock

**Path:** `infraestructura/mocks/mock-bot/`
**Belongs to:** [`infraestructura/mocks/`](../README.en.md)

---

## What it is and why it exists

A pure Node.js HTTP server (no dependencies) that simulates the Bot case's external
ticketing system and the IoT as-is case's InfluxDB write endpoint (both cases share this
mock for port convenience).

## Contents of this folder

| File | Description |
|---|---|
| `server.js` | HTTP server — implements `/health`, `/api/tickets`, `/api/user/:userId/tickets`, `/api/v2/write` (InfluxDB mock) |
| `package.json` | No external dependencies — uses only Node's `http` module |

## How to run

Started automatically as part of `docker-compose.yml` (the `mock_bot` container, port
3001). Manual verification:

```bash
curl http://localhost:3001/health   # {"ok":true}
docker logs mock_bot                # view each request's JSON logs
```

## Relationship to the methodology

Responds to `POST /api/tickets` with a random `ticket_id`, `GET /api/user/:userId/tickets`
with simulated history, and `POST /api/v2/write` with 204 (InfluxDB mock used by the IoT
as-is). The intentional antipattern (wrong technology, hardcoded token) remains documented
in the IoT case's technical notes and is visible in the flow's JSON, not in this mock.

## Navigation

- Parent: [`infraestructura/mocks/`](../README.en.md)
- See also: [`infraestructura/mocks/mock-iot/`](../mock-iot/README.en.md) · [`casos-de-estudio/bot/ficha-tecnica.md`](../../../casos-de-estudio/bot/ficha-tecnica.en.md)
