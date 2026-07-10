> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# infraestructura/ — Entorno local Docker

**Ruta:** `infraestructura/`
**Pertenece a:** [Repositorio (raíz)](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene la definición del **entorno local reproducible** del proyecto:
Docker Compose con n8n, PostgreSQL y los dos servicios mock (bot e IoT), más la plantilla
de variables de entorno. Es el punto de partida para levantar el entorno antes de
importar flujos o correr mediciones.

## Contenido de esta carpeta

| Archivo / Subcarpeta | Descripción |
|---|---|
| `docker-compose.yml` | Define 4 servicios: `postgres`, `n8n`, `mock-bot` (3001), `mock-iot` (3002) |
| `.env.example` | Plantilla de variables de entorno — copiar a `.env` y completar |
| [`mocks/`](mocks/README.md) | Servidores HTTP mock que simulan sistemas externos (tickets, InfluxDB, notificaciones) |
| [`aws/`](aws/README.md) | Carpeta reservada para IaC del diseño de arquitectura AWS (Fase 8) |

## Relación con la metodología

El entorno local reproduce, con mocks locales, las integraciones externas que en el
diseño de arquitectura AWS (`docs/aws/`) corresponden a servicios reales (API Gateway,
RDS, etc.). Los comandos de levantamiento y verificación están documentados en
[`docs/protocolo-evidencias.md`](../docs/protocolo-evidencias.md) §1-2 y en
[`automatizacion/README.md`](../automatizacion/README.md) (script `setup_env.py` que
automatiza este proceso). **Nunca versionar `.env` con valores reales** — ver
[`docs/context/convenios-y-reglas.md`](../docs/context/convenios-y-reglas.md) §Reglas
críticas de seguridad.

## Navegación

- Padre: [Repositorio (raíz)](../README.md)
- Ver también: [`automatizacion/README.md`](../automatizacion/README.md) (scripts que orquestan este entorno) · [`docs/aws/INDEX.md`](../docs/aws/INDEX.md) (diseño de despliegue en la nube)
