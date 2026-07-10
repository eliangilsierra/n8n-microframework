> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# casos-de-estudio/ — Los dos casos de validación del micro-framework

**Ruta:** `casos-de-estudio/`
**Pertenece a:** [Repositorio (raíz)](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene los **dos casos de estudio** que validan el micro-framework
mediante comparación cuasi-experimental as-is vs to-be: un chatbot de soporte (`bot/`,
patrón webhook-reactivo) y un pipeline de sensores IoT (`iot/`, patrón event-driven
pipeline). Ambos casos comparten la misma metodología: línea base con antipatrones
intencionales (as-is), rediseño aplicando el micro-framework (to-be), y una matriz de
trazabilidad que conecta requerimientos con decisiones arquitectónicas y evidencia
cuantitativa.

## Contenido de esta carpeta

| Subcarpeta | Descripción |
|---|---|
| [`bot/`](bot/README.md) | Caso Bot — chatbot de soporte (16 nodos as-is → orquestador + 2 subflujos to-be) |
| [`iot/`](iot/README.md) | Caso IoT — pipeline de sensores (14 nodos as-is → orquestador + 4 subflujos + error handler to-be) |
| [`común/adr/`](común/adr/README.md) | Decisiones arquitectónicas compartidas entre ambos casos |

## Relación con la metodología

Los dos casos fueron seleccionados para cubrir de forma **ortogonal** el espacio de
problemas LC/NC en n8n (fuente de datos humana vs máquina, persistencia externa vs local,
notificación inline vs por canal diferenciado) — ver
[`docs/context/justificacion-casos-de-estudio.md`](../docs/context/justificacion-casos-de-estudio.md)
para la taxonomía completa y la justificación de representatividad (Yin, 2018,
replicación teórica). Ambos siguen la misma convención de nombres de archivo
`{caso}-{estado}-{etapa}.json` documentada en
[`docs/context/convenios-y-reglas.md`](../docs/context/convenios-y-reglas.md).

## Navegación

- Padre: [Repositorio (raíz)](../README.md)
- Ver también: [`microframework/README.md`](../microframework/README.md) (el marco que ambos casos aplican) · [`medicion/README.md`](../medicion/README.md) (datos y evidencia de la comparación)
