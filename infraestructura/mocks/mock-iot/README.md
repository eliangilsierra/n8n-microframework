> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# mocks/mock-iot/ — Mock del sistema de alertas

**Ruta:** `infraestructura/mocks/mock-iot/`
**Pertenece a:** [`infraestructura/mocks/`](../README.md)

---

## Qué es y para qué existe

Servidor HTTP en Node.js puro (sin dependencias) que simula el sistema de notificaciones
externo del caso IoT — recibe las alertas diferenciadas por nivel (crítico/advertencia)
que el subflujo E4 envía.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `server.js` | Servidor HTTP — implementa `/health` y el endpoint de notificación, responde `{status:'ok', notificacion_enviada:true, nivel, ts}` |
| `package.json` | Sin dependencias externas — usa solo el módulo `http` de Node |

## Cómo ejecutar

Se levanta automáticamente como parte de `docker-compose.yml` (contenedor `mock_iot`,
puerto 3002). Verificación manual:

```bash
curl http://localhost:3002/health   # {"ok":true}
docker logs mock_iot                # ver logs JSON de cada notificación recibida
```

## Relación con la metodología

Este mock es el que se detiene deliberadamente en el escenario ATAM **IOT-Q4** (tolerancia
a fallos de red) para verificar que el retry y el error workflow del to-be funcionan
correctamente — ver
[`medicion/consolidado/mttd-resultado.md`](../../../medicion/consolidado/mttd-resultado.md)
§IOT-Q4-runtime.

## Navegación

- Padre: [`infraestructura/mocks/`](../README.md)
- Ver también: [`infraestructura/mocks/mock-bot/`](../mock-bot/README.md) · [`casos-de-estudio/iot/ficha-tecnica.md`](../../../casos-de-estudio/iot/ficha-tecnica.md)
