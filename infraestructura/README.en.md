> 🌐 **Language / Idioma:** English · [Español](README.md)

# infraestructura/ — Local Docker environment

**Path:** `infraestructura/`
**Belongs to:** [Repository (root)](../README.en.md)

---

## What it is and why it exists

This folder contains the definition of the project's **reproducible local environment**:
Docker Compose with n8n, PostgreSQL, and the two mock services (bot and IoT), plus the
environment variable template. It's the starting point for bringing up the environment
before importing flows or running measurements.

## Contents of this folder

| File / Subfolder | Description |
|---|---|
| `docker-compose.yml` | Defines 4 services: `postgres`, `n8n`, `mock-bot` (3001), `mock-iot` (3002) |
| `.env.example` | Environment variable template — copy to `.env` and fill in |
| [`mocks/`](mocks/README.en.md) | Mock HTTP servers simulating external systems (tickets, InfluxDB, notifications) |
| [`aws/`](aws/README.en.md) | Folder reserved for the AWS architecture design's IaC (Phase 8) |

## Relationship to the methodology

The local environment reproduces, with local mocks, the external integrations that in
the AWS architecture design (`docs/aws/`) correspond to real services (API Gateway, RDS,
etc.). The setup and verification commands are documented in
[`docs/protocolo-evidencias.md`](../docs/protocolo-evidencias.en.md) §1-2 and in
[`automatizacion/README.md`](../automatizacion/README.en.md) (the `setup_env.py` script
automates this process). **Never version `.env` with real values** — see
[`docs/context/convenios-y-reglas.md`](../docs/context/convenios-y-reglas.en.md) §Critical
security rules.

## Navigation

- Parent: [Repository (root)](../README.en.md)
- See also: [`automatizacion/README.md`](../automatizacion/README.en.md) (scripts orchestrating this environment) · [`docs/aws/INDEX.md`](../docs/aws/INDEX.en.md) (cloud deployment design)
