> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# bot/ — Caso de estudio: Chatbot de soporte

**Ruta:** `casos-de-estudio/bot/`
**Pertenece a:** [`casos-de-estudio/`](../README.md)

---

## Qué es y para qué existe

Este caso de estudio representa el patrón **webhook-reactivo**: un chatbot de soporte que
recibe mensajes de usuarios por HTTP, valida autenticación, clasifica el mensaje por
categoría y prioridad, persiste un ticket en un servicio externo y responde al cliente.
Es uno de los dos casos que validan el micro-framework mediante comparación as-is vs to-be
(ver [`casos-de-estudio/justificacion-casos-de-estudio.md`](../justificacion-casos-de-estudio.md)
para la justificación de por qué este patrón es representativo).

## Contenido de esta carpeta

| Archivo / Subcarpeta | Descripción |
|---|---|
| [`ficha-tecnica.md`](ficha-tecnica.md) | Descripción funcional, endpoints, reglas de negocio, Input Sets |
| [`cr-design.md`](cr-design.md) | Diseño de los 3 Change Requests (CR1 regla, CR2 integración, CR3 validación) |
| [`adr/`](adr/README.md) | 8 ADR de decisiones arquitectónicas específicas del caso Bot |
| [`as-is/`](as-is/README.md) | Flujo línea base con antipatrones intencionales (16 nodos) |
| [`to-be/`](to-be/README.md) | Flujo con el micro-framework aplicado (orquestador + subflujos E2/E3) |
| [`trazabilidad/`](trazabilidad/README.md) | Matriz de trazabilidad RF → ADR → REG → evidencia |

## Relación con la metodología

El caso Bot cubre el patrón "Webhook-reactivo" (fuente de datos humana, tiempo de
respuesta real, sin estado propio) dentro de la taxonomía de 4 categorías LC/NC. Su as-is
viola intencionalmente 9 de las 10 reglas obligatorias del micro-framework; su to-be las
corrige aplicando el metamodelo E1–E4, con E1 y E4 implementados inline en el orquestador
(ver [`ADR-002`](adr/ADR-002-omision-e4.md)) y E2/E3 como subflujos separados.

## Navegación

- Padre: [`casos-de-estudio/`](../README.md)
- Ver también: [`casos-de-estudio/iot/`](../iot/README.md) (caso complementario) · [`microframework/README.md`](../../microframework/README.md)
