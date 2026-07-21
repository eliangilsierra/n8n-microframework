> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# microframework/ — El micro-framework en sí

**Ruta:** `microframework/`
**Pertenece a:** [Repositorio (raíz)](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene la **definición completa del micro-framework LC/NC para n8n**: el
conjunto de reglas obligatorias y recomendadas, patrones de resiliencia, anti-patrones
documentados, plantillas reutilizables, checklists de verificación y el validador estático
que automatiza su cumplimiento. Es el artefacto central del proyecto — todo lo que aparece
en `casos-de-estudio/` como flujo "to-be" es una aplicación concreta de lo que aquí se
especifica.

El micro-framework **no es una librería de código**: es un conjunto de decisiones de
diseño y convenciones (organización en etapas E1–E4, reglas verificables, patrones de
resiliencia) que se aplican al construir flujos en n8n, más las herramientas
(validador estático) que verifican automáticamente su cumplimiento.

## Contenido de esta carpeta

| Archivo / Subcarpeta | Descripción |
|---|---|
| [`adr/`](adr/README.md) | Architecture Decision Records del micro-framework (ADR-MF-001..008) |
| [`checklists/`](checklists/README.md) | Checklists binarios de arquitectura y DevSecOps para verificar flujos to-be |
| [`contratos/`](contratos/README.md) | JSON Schemas de los contratos de entrada/salida por etapa y por caso |
| [`convenciones/`](convenciones/README.md) | Referencia rápida de convenciones de nombres |
| [`patrones/`](patrones/README.md) | 5 patrones de resiliencia documentados (retry, idempotencia, circuit breaker, error boundary, saga) |
| [`plantillas/`](plantillas/README.md) | Plantilla de ADR, plantillas de README de carpeta, y flujos JSON de referencia |
| [`reglas/`](reglas/README.md) | Reglas obligatorias (REG-001..010) y recomendadas (REC-001..006) |
| [`validacion/`](validacion/README.md) | Validador estático — edición Lite (un archivo, cero dependencias) |
| [`validacion-pro/`](validacion-pro/README.md) | Validador estático — edición Pro (modular, DSL YAML, codemods) |
| [`antipatrones.md`](antipatrones.md) | Catálogo de anti-patrones intencionalmente presentes en los as-is |
| [`guia-observabilidad.md`](guia-observabilidad.md) | Contrato mínimo de logs estructurados por etapa (Pilar DevSecOps 3) |
| [`validacion-estatica-flujos.md`](validacion-estatica-flujos.md) | Especificación de qué reglas/antipatrones verifica el validador estático |

## Relación con la metodología

El micro-framework traduce **Clean Architecture** (separación de responsabilidades por
capa: E1 validación, E2 dominio, E3 adaptadores, E4 salida) y **DevSecOps** (gestión de
secretos, validaciones automatizadas, resiliencia operativa) al contexto visual de n8n. Las
reglas de esta carpeta (`reglas/`) son el criterio binario que se aplica en el checklist
de cada flujo to-be y que el validador estático (`validacion/`, `validacion-pro/`) verifica
automáticamente. Cada decisión de diseño relevante queda registrada como ADR en `adr/`.

## Navegación

- Padre: [Repositorio (raíz)](../README.md)
- Ver también: [`casos-de-estudio/`](../casos-de-estudio/README.md) (aplicación concreta del micro-framework) · [`microframework/microframework-spec.md`](microframework-spec.md) (especificación formal v1.0)

---

*Fuente de verdad de avance: [estado-actual.md](../estado-actual.md)*
