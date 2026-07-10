> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# mocks/mock-bot/ — Mock del sistema de tickets

**Ruta:** `infraestructura/mocks/mock-bot/`
**Pertenece a:** [`infraestructura/mocks/`](../README.md)

---

## Qué es y para qué existe

Servidor HTTP en Node.js puro (sin dependencias) que simula el sistema de tickets
externo del caso Bot y el endpoint de escritura InfluxDB del caso IoT as-is (ambos casos
comparten este mock por conveniencia de puertos).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `server.js` | Servidor HTTP — implementa `/health`, `/api/tickets`, `/api/user/:userId/tickets`, `/api/v2/write` (mock InfluxDB) |
| `package.json` | Sin dependencias externas — usa solo el módulo `http` de Node |

## Cómo ejecutar

Se levanta automáticamente como parte de `docker-compose.yml` (contenedor `mock_bot`,
puerto 3001). Verificación manual:

```bash
curl http://localhost:3001/health   # {"ok":true}
docker logs mock_bot                # ver logs JSON de cada request
```

## Relación con la metodología

Responde `POST /api/tickets` con un `ticket_id` aleatorio, `GET /api/user/:userId/tickets`
con historial simulado, y `POST /api/v2/write` con 204 (mock InfluxDB usado por el IoT
as-is). El antipatrón intencional (tecnología incorrecta, token hardcodeado) sigue
documentado en las notas técnicas del caso IoT y es visible en el JSON del flujo, no en
este mock.

## Navegación

- Padre: [`infraestructura/mocks/`](../README.md)
- Ver también: [`infraestructura/mocks/mock-iot/`](../mock-iot/README.md) · [`casos-de-estudio/bot/ficha-tecnica.md`](../../../casos-de-estudio/bot/ficha-tecnica.md)
