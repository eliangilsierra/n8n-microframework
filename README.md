> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# Micro-framework LC/NC para n8n con arquitecturas limpias y DevSecOps

**Trabajo de grado — Maestría en Gestión, Aplicación y Desarrollo de Software (MGADS),
Universidad Autónoma de Bucaramanga (UNAB), 2026**

**Autor:** Elian Hernando Gil Sierra · **Director:** Sebastian Roa Prada, PhD

---

## Resumen del proyecto

Este repositorio contiene el diseño, la implementación y la evidencia de evaluación de un
**micro-framework arquitectónico** para soluciones Low-Code/No-Code (LC/NC) sobre la
plataforma de automatización [n8n](https://n8n.io), fundamentado en principios de **Clean
Architecture** y prácticas **DevSecOps**.

El micro-framework se valida comparando diseños **as-is** (línea base, sin arquitectura) y
**to-be** (con el micro-framework aplicado) en **dos casos de estudio** — un chatbot de
soporte (`bot`) y un pipeline de ingesta de sensores IoT (`iot`) — mediante el método
**ATAM** (Architecture Tradeoff Analysis Method). El proyecto también incluye un diseño de
arquitectura de referencia en AWS y un validador estático de flujos n8n desarrollado como
parte del pilar DevSecOps.

Este repositorio es el **artefacto de soporte** del artículo enviado a *Journal of Software:
Evolution and Process* (JSEP). Todo el contenido está pensado para que un investigador
externo pueda **entender la metodología y replicar el estudio** sin más contexto que el que
aquí se documenta.

---

## Cómo navegar este repositorio

- Toda la documentación es **bilingüe**: cada archivo `.md` en español tiene un par
  `.en.md` con la traducción (excepto los logs/datasets de evidencia, que son datos, no prosa).
  Un banner en la parte superior de cada documento enlaza a su contraparte de idioma.
- La **estructura de carpetas refleja la metodología**: `casos-de-estudio/` separa
  as-is de to-be, `microframework/` contiene las reglas/patrones/ADR/validador,
  `atam/` documenta la evaluación ATAM, `infraestructura/aws/` el diseño de arquitectura.
- Cada carpeta y subcarpeta tiene su propio `README.md` explicando qué es, para qué existe
  y cómo se relaciona con la metodología, con enlaces de navegación (carpeta padre,
  siguiente sección, "ver también").
- Para el detalle de la evaluación ATAM ver [`atam/INDEX.md`](atam/INDEX.md); para el diseño de arquitectura AWS ver [`infraestructura/aws/INDEX.md`](infraestructura/aws/INDEX.md).

---

## Mapa del repositorio

| Carpeta | Qué contiene | README |
|---|---|---|
| [`microframework/`](microframework/README.md) | El micro-framework en sí: reglas obligatorias/recomendadas, patrones, ADR, checklists, plantillas, y el validador estático (Lite + Pro) | [→](microframework/README.md) |
| [`casos-de-estudio/`](casos-de-estudio/README.md) | Los dos casos de validación (`bot`, `iot`): flujos as-is/to-be, ADR por caso, matriz de trazabilidad | [→](casos-de-estudio/README.md) |
| [`atam/`](atam/INDEX.md) | Evaluación ATAM: utility tree, approaches, matriz de scoring, registro de riesgos/tradeoffs, instrumento de encuesta, material de apoyo e informe final | [→](atam/INDEX.md) |
| [`medicion/`](medicion/README.md) | Datasets sintéticos, run-logs, cr-logs, reportes consolidados as-is vs to-be y protocolos operativos (evidencias, MTTD) | [→](medicion/README.md) |
| [`automatizacion/`](automatizacion/README.md) | Scripts Python que orquestan el entorno, las corridas de medición y los reportes comparativos | [→](automatizacion/README.md) |
| [`infraestructura/`](infraestructura/README.md) | Docker Compose (n8n + PostgreSQL + mocks) y plantilla de variables de entorno | [→](infraestructura/README.md) |

---

## Metodología en un vistazo

- **As-is vs to-be:** cada caso de estudio tiene una versión as-is (línea base, con
  antipatrones intencionales) y una to-be (con el micro-framework aplicado), comparadas
  bajo las mismas condiciones de ejecución. Ver [`casos-de-estudio/arquitectura-flujos.md`](casos-de-estudio/arquitectura-flujos.md).
- **Etapas E1–E4:** todo flujo to-be se organiza en cuatro etapas lógicas — **E1 Validación
  de entradas**, **E2 Lógica de dominio**, **E3 Adaptadores de integración**, **E4 Salida
  controlada** — cada una como subflujo invocado mediante `Execute Workflow`. Ver
  [`microframework/microframework-spec.md`](microframework/microframework-spec.md).
- **ADR (Architecture Decision Records):** cada decisión de diseño relevante se documenta
  con la plantilla en [`microframework/plantillas/ADR-plantilla.md`](microframework/plantillas/ADR-plantilla.md).
- **ATAM:** la evaluación de atributos de calidad (mantenibilidad, seguridad, confiabilidad,
  trazabilidad) sigue una metodología ATAM adaptada. Ver [`atam/INDEX.md`](atam/INDEX.md).
- **Reglas obligatorias (REG-001..010) y recomendadas (REC-001..006):** el catálogo completo
  de reglas del micro-framework está en [`microframework/reglas/`](microframework/reglas/README.md).

---

## Los dos casos de estudio

### Caso Bot — Chatbot de soporte
Recibe mensajes por webhook, valida autenticación, clasifica el mensaje (incidente,
facturación, soporte técnico, saludo, general), determina prioridad y persiste el ticket.
Ver [`casos-de-estudio/bot/README.md`](casos-de-estudio/bot/README.md).

### Caso IoT — Pipeline de sensores
Recibe lecturas de sensores por webhook, valida y normaliza los datos, detecta anomalías
por umbrales, persiste con control de idempotencia y notifica por canal diferenciado según
nivel de alerta. Ver [`casos-de-estudio/iot/README.md`](casos-de-estudio/iot/README.md).

---

## El validador estático

El pilar DevSecOps del micro-framework incluye un validador estático de flujos n8n en dos
ediciones coexistentes (ver [`ADR-MF-008`](microframework/adr/ADR-MF-008-validador-dos-ediciones.md)):

- **Lite** — un único archivo sin dependencias externas, HTML de reporte autocontenido
  (offline). Pensado para reproducir el estudio sin instalar nada.
- **Pro** — paquete modular con DSL YAML de reglas propias, codemods automáticos, y
  salidas md/json/html/sarif/junit para integración en CI/CD.

Ambas implementan las mismas 17 reglas (11 REG-* + 6 antipatrones) y comparten el mismo
esquema de reporte. Ver [`microframework/validacion/README.md`](microframework/validacion/README.md).

---

## Reproducir el estudio (quickstart)

1. Levantar el entorno local (Docker: n8n + PostgreSQL + mocks) — ver
   [`infraestructura/README.md`](infraestructura/README.md) y
   [`automatizacion/README.md`](automatizacion/README.md).
2. Seguir el protocolo operativo completo en [`medicion/protocolo-evidencias.md`](medicion/protocolo-evidencias.md)
   (bootstrap, importación de flujos, corridas de medición, extracción de métricas).
3. Ejecutar el validador estático sobre los flujos to-be — ver
   [`microframework/validacion/README.md`](microframework/validacion/README.md).
4. Comparar resultados as-is vs to-be con los scripts de
   [`automatizacion/`](automatizacion/README.md) y los reportes en
   [`medicion/consolidado/`](medicion/consolidado/README.md).

---

## Estado actual del proyecto

El avance detallado por fase (0–9) vive en [`estado-actual.md`](estado-actual.md), la única
fuente de verdad del progreso — no se duplica aquí para evitar desincronización.

---

## Cómo citar / autoría

**Autor:** Elian Hernando Gil Sierra · **Director:** Sebastian Roa Prada, PhD
**Institución:** Universidad Autónoma de Bucaramanga (UNAB) — Maestría en Gestión,
Aplicación y Desarrollo de Software (MGADS), 2026.

El anteproyecto de tesis es la fuente normativa del alcance del proyecto (documento del autor, no versionado en el repositorio público).
