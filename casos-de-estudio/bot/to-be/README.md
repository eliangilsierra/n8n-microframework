> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# to-be/ — Caso Bot con el micro-framework aplicado

**Ruta:** `casos-de-estudio/bot/to-be/`
**Pertenece a:** [`casos-de-estudio/bot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene el flujo **to-be** del caso Bot: la aplicación del micro-framework
sobre el mismo problema funcional que el as-is, con el metamodelo E1–E4, gestión de
secretos, retry, idempotencia y observabilidad implementados según las 10 reglas
obligatorias.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `bot-to-be-orquestador.json` | Orquestador — E1 (validación) y E4 (salida) inline, invoca E2 y E3 |
| `bot-to-be-e2-dominio.json` | Subflujo E2 — clasificación de mensajes con array `REGLAS` |
| `bot-to-be-e3-adaptador.json` | Subflujo E3 — integración con el sistema de tickets, retry + idempotencia |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.md) | Resultado del checklist de arquitectura — 10/10 cumplido |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.md) | Resultado del checklist DevSecOps — 8/8 cumplido |

## Relación con la metodología

Este to-be aplica el metamodelo E1–E4 del micro-framework: E1 y E4 se implementan inline
en el orquestador (decisión documentada en
[`ADR-002`](../adr/ADR-002-omision-e4.md)), mientras E2 (dominio) y E3 (adaptador) son
subflujos separados invocados con `Execute Workflow`. Antes de importar en n8n, seguir el
orden de importación documentado en
[`../../../microframework/convenciones/convenios-y-reglas.md`](../../../microframework/convenciones/convenios-y-reglas.md):
E2 → E3 → orquestador.

## Navegación

- Padre: [`casos-de-estudio/bot/`](../README.md)
- Ver también: [`as-is/`](../as-is/README.md) (línea base) · [`casos-de-estudio/bot/adr/`](../adr/README.md) (decisiones que justifican este diseño)
