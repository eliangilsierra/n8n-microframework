> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# plantillas/ — Plantillas reutilizables

**Ruta:** `microframework/plantillas/`
**Pertenece a:** [`microframework/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene las **plantillas reutilizables** del proyecto: la plantilla de ADR
que se usa tanto para decisiones del micro-framework como para decisiones de caso de
estudio, la plantilla de README de carpeta (usada para escribir toda la documentación
navegable del repositorio), y copias de referencia de los flujos JSON to-be de ambos casos
(útiles como punto de partida al adoptar el micro-framework en un proyecto nuevo).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| [`ADR-plantilla.md`](ADR-plantilla.md) | Plantilla de Architecture Decision Record (7 secciones) |
| [`README-carpeta-plantilla.md`](README-carpeta-plantilla.md) | Plantilla de README de carpeta — 5 variantes según tipo de contenido |
| `bot-as-is.json` | Copia de referencia del flujo as-is del caso Bot |
| `bot-to-be-e2-dominio.json`, `bot-to-be-e3-adaptador.json`, `bot-to-be-orquestador.json` | Copias de referencia de los subflujos to-be del caso Bot |
| `bot-error-handler.json` | Flujo de manejo de errores de referencia |
| `iot-as-is.json` | Copia de referencia del flujo as-is del caso IoT |
| `iot-to-be-e1-validacion.json`, `iot-to-be-e2-dominio.json`, `iot-to-be-e3-persistencia.json`, `iot-to-be-orquestador.json` | Copias de referencia de los subflujos to-be del caso IoT |

## Relación con la metodología

Estas plantillas son el mecanismo que garantiza **consistencia estructural** entre todos
los ADR y READMEs del repositorio, y el punto de partida recomendado para cualquier equipo
externo que quiera adoptar el micro-framework en un nuevo caso: partir de las copias JSON
de referencia y aplicar las reglas de `microframework/reglas/` desde el diseño.

## Navegación

- Padre: [`microframework/`](../README.md)
- Ver también: [`microframework/adr/README.md`](../adr/README.md) · [`casos-de-estudio/`](../../casos-de-estudio/README.md) (flujos reales derivados de estas plantillas)
