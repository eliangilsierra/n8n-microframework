> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# mocks/ — Servidores HTTP mock

**Ruta:** `infraestructura/mocks/`
**Pertenece a:** [`infraestructura/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene dos servidores HTTP mínimos en Node.js que simulan los sistemas
externos con los que integran los flujos n8n (sistema de tickets, InfluxDB, sistema de
notificaciones). Permiten ejecutar el estudio completo sin depender de servicios reales
de terceros.

## Contenido de esta carpeta

| Subcarpeta | Descripción |
|---|---|
| [`mock-bot/`](mock-bot/README.md) | Simula el sistema de tickets del caso Bot (puerto 3001) |
| [`mock-iot/`](mock-iot/README.md) | Simula el sistema de alertas del caso IoT (puerto 3002) |

## Relación con la metodología

Los mocks corren como contenedores Docker (`node:20-alpine`) dentro del mismo
`docker-compose.yml` que n8n y PostgreSQL. Cada uno responde a los endpoints que los
flujos as-is y to-be invocan, incluyendo el antipatrón intencional (tecnología incorrecta,
token hardcodeado) documentado en las notas técnicas de cada caso. Ver
[`automatizacion/README.md`](../../automatizacion/README.md) §Arquitectura de mocks para
el diagrama de conexiones.

## Navegación

- Padre: [`infraestructura/`](../README.md)
- Ver también: [`casos-de-estudio/bot/ficha-tecnica.md`](../../casos-de-estudio/bot/ficha-tecnica.md) · [`casos-de-estudio/iot/ficha-tecnica.md`](../../casos-de-estudio/iot/ficha-tecnica.md) (dependencias de infraestructura por caso)
