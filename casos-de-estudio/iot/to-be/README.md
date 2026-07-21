> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# to-be/ — Caso IoT con el micro-framework aplicado

**Ruta:** `casos-de-estudio/iot/to-be/`
**Pertenece a:** [`casos-de-estudio/iot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene el flujo **to-be** del caso IoT: la aplicación del micro-framework
sobre el mismo problema funcional que el as-is, con las **cuatro** etapas E1–E4
implementadas como subflujos separados, más un flujo de manejo de errores con capacidad
de replay de lecturas perdidas.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `iot-to-be-orquestador.json` | Orquestador — coordina E1→E2→E3→E4 vía `Execute Workflow` |
| `iot-to-be-e1-validacion.json` | Subflujo E1 — validación de campos, rangos físicos, normalización |
| `iot-to-be-e2-dominio.json` | Subflujo E2 — análisis de umbrales con constante `UMBRALES` |
| `iot-to-be-e3-persistencia.json` | Subflujo E3 — INSERT con idempotencia `{sensor_id}-{timestamp}` |
| `iot-to-be-e4-notificacion.json` | Subflujo E4 — routing por nivel (crítico/advertencia), retry diferenciado |
| `iot-error-handler.json` | errorWorkflow — preserva el payload original para replay manual |
| [`checklist-arquitectura-resultado.md`](checklist-arquitectura-resultado.md) | Resultado del checklist de arquitectura — 10/10 cumplido |
| [`checklist-devsecops-resultado.md`](checklist-devsecops-resultado.md) | Resultado del checklist DevSecOps — 7/7 aplicable cumplido |

## Relación con la metodología

Este to-be implementa el metamodelo E1–E4 completo como subflujos separados (a diferencia
del Bot, que omite E4 — ver [`ADR-001 IoT`](../adr/ADR-001-separacion-responsabilidades-pipeline.md)).
Antes de importar en n8n, seguir el orden documentado en
[`../../../microframework/convenciones/convenios-y-reglas.md`](../../../microframework/convenciones/convenios-y-reglas.md):
E1 → E2 → E3 → E4 → error-handler → orquestador.

## Navegación

- Padre: [`casos-de-estudio/iot/`](../README.md)
- Ver también: [`as-is/`](../as-is/README.md) (línea base) · [`casos-de-estudio/iot/adr/`](../adr/README.md) (decisiones que justifican este diseño)
