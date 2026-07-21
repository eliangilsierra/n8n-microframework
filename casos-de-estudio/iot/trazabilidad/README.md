> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# trazabilidad/ — Matriz de trazabilidad del caso IoT

**Ruta:** `casos-de-estudio/iot/trazabilidad/`
**Pertenece a:** [`casos-de-estudio/iot/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene la **matriz de trazabilidad** del caso IoT: la cadena completa que
conecta requerimientos funcionales (RF-IOT-01..08) con las decisiones arquitectónicas
(ADR) que los implementan, las reglas del micro-framework que los verifican (REG-*), los
escenarios ATAM que los evalúan y la evidencia cuantitativa que los respalda.

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| [`matriz-trazabilidad.md`](matriz-trazabilidad.md) | Tablas RF→ADR→REG→evidencia, atributo de calidad→escenario ATAM→decisión, y cobertura de Change Requests |

## Relación con la metodología

Esta matriz es el artefacto central de trazabilidad exigido por REG-010 y por el pilar de
mantenibilidad/analizabilidad de ISO/IEC 25010. Conecta explícitamente cada requerimiento
funcional con su ADR, su regla REG-* verificable, el subflujo donde se implementa, el
Input Set que lo ejerce y el archivo de evidencia que lo respalda — la misma cadena
descrita en
[`microframework/microframework-spec.md`](../../../microframework/microframework-spec.md)
aplicada de punta a punta al caso IoT.

## Navegación

- Padre: [`casos-de-estudio/iot/`](../README.md)
- Ver también: [`casos-de-estudio/iot/adr/`](../adr/README.md) · [`casos-de-estudio/bot/trazabilidad/`](../../bot/trazabilidad/README.md) (matriz equivalente para Bot)
