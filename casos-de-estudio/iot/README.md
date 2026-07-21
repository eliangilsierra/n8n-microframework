> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# iot/ — Caso de estudio: Pipeline de sensores IoT

**Ruta:** `casos-de-estudio/iot/`
**Pertenece a:** [`casos-de-estudio/`](../README.md)

---

## Qué es y para qué existe

Este caso de estudio representa el patrón **event-driven pipeline**: un pipeline de
ingesta de sensores IoT que recibe lecturas de temperatura, humedad y CO₂ por webhook,
valida rangos físicos, detecta anomalías por umbrales, persiste con control de
idempotencia y notifica por canal diferenciado según severidad. Es el segundo de los dos
casos que validan el micro-framework (ver
[`casos-de-estudio/justificacion-casos-de-estudio.md`](../justificacion-casos-de-estudio.md)
para la justificación de representatividad).

## Contenido de esta carpeta

| Archivo / Subcarpeta | Descripción |
|---|---|
| [`ficha-tecnica.md`](ficha-tecnica.md) | Descripción funcional, endpoints, variables del dominio, Input Sets |
| [`cr-design.md`](cr-design.md) | Diseño de los 3 Change Requests (CR1 umbral, CR2 integración, CR3 validación) |
| [`adr/`](adr/README.md) | 8 ADR de decisiones arquitectónicas específicas del caso IoT |
| [`as-is/`](as-is/README.md) | Flujo línea base con antipatrones intencionales (14 nodos) |
| [`to-be/`](to-be/README.md) | Flujo con el micro-framework aplicado (orquestador + subflujos E1–E4 + error handler) |
| [`trazabilidad/`](trazabilidad/README.md) | Matriz de trazabilidad RF → ADR → REG → evidencia |

## Relación con la metodología

El caso IoT cubre el patrón "Event-driven pipeline" (fuente de datos de máquina, near-real-time,
estado persistido en PostgreSQL con idempotencia) dentro de la taxonomía de 4 categorías
LC/NC — complementario y ortogonal al caso Bot. Su as-is viola intencionalmente 9 de las
10 reglas obligatorias; su to-be implementa las **cuatro** etapas E1–E4 como subflujos
separados (a diferencia del Bot, que omite E4 como subflujo — ver
[`ADR-001`](adr/ADR-001-separacion-responsabilidades-pipeline.md)), más un
`iot-error-handler` con capacidad de replay de lecturas perdidas
([`ADR-005`](adr/ADR-005-diseno-error-workflow.md)).

## Navegación

- Padre: [`casos-de-estudio/`](../README.md)
- Ver también: [`casos-de-estudio/bot/`](../bot/README.md) (caso complementario) · [`microframework/README.md`](../../microframework/README.md)
