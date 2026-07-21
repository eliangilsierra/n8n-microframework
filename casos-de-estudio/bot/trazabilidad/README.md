> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# trazabilidad/ — Matriz de trazabilidad del caso Bot

**Ruta:** `casos-de-estudio/bot/trazabilidad/`
**Pertenece a:** [`casos-de-estudio/bot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene la **matriz de trazabilidad** del caso Bot: la cadena completa que
conecta requerimientos funcionales (RF-BOT-01..08) con las decisiones arquitectónicas
(ADR) que los implementan, las reglas del micro-framework que los verifican (REG-*), los
escenarios ATAM que los evalúan y la evidencia cuantitativa que los respalda.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| [`matriz-trazabilidad.md`](matriz-trazabilidad.md) | Tablas RF→ADR→REG→evidencia, atributo de calidad→escenario ATAM→decisión, y cobertura de Change Requests |

## Relación con la metodología

Esta matriz es el artefacto central de trazabilidad exigido por REG-010 y por el pilar de
mantenibilidad/analizabilidad de ISO/IEC 25010. Conecta explícitamente cada requerimiento
funcional con su ADR, su regla REG-* verificable, el nodo o etapa donde se implementa, el
Input Set que lo ejerce y el archivo de evidencia (run-log/cr-log) que lo respalda. Es la
misma cadena de trazabilidad descrita en
[`microframework/microframework-spec.md`](../../../microframework/microframework-spec.md)
aplicada de punta a punta al caso Bot.

## Navegación

- Padre: [`casos-de-estudio/bot/`](../README.md)
- Ver también: [`casos-de-estudio/bot/adr/`](../adr/README.md) · [`casos-de-estudio/iot/trazabilidad/`](../../iot/trazabilidad/README.md) (matriz equivalente para IoT)
