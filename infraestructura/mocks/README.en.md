> 🌐 **Language / Idioma:** English · [Español](README.md)

# mocks/ — Mock HTTP servers

**Path:** `infraestructura/mocks/`
**Belongs to:** [`infraestructura/`](../README.en.md)

---

## What it is and why it exists

This folder contains two minimal Node.js HTTP servers that simulate the external systems
the n8n flows integrate with (ticketing system, InfluxDB, notification system). They
allow running the complete study with no dependency on real third-party services.

## Contents of this folder

| Subfolder | Description |
|---|---|
| [`mock-bot/`](mock-bot/README.en.md) | Simulates the Bot case's ticketing system (port 3001) |
| [`mock-iot/`](mock-iot/README.en.md) | Simulates the IoT case's alert system (port 3002) |

## Relationship to the methodology

The mocks run as Docker containers (`node:20-alpine`) within the same
`docker-compose.yml` as n8n and PostgreSQL. Each responds to the endpoints the as-is and
to-be flows invoke, including the intentional antipattern (wrong technology, hardcoded
token) documented in each case's technical notes. See
[`automatizacion/README.md`](../../automatizacion/README.en.md) §Mock architecture for
the connection diagram.

## Navigation

- Parent: [`infraestructura/`](../README.en.md)
- See also: [`casos-de-estudio/bot/ficha-tecnica.md`](../../casos-de-estudio/bot/ficha-tecnica.en.md) · [`casos-de-estudio/iot/ficha-tecnica.md`](../../casos-de-estudio/iot/ficha-tecnica.en.md) (per-case infrastructure dependencies)
