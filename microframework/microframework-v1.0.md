# Micro-framework LC/NC para n8n — v1.0

**Entregable R1 del anteproyecto** (§4.2). Documento consolidado que referencia todos los
artefactos normativos del micro-framework. Esta versión cierra FASE 3 y es la base contra
la que se construyen los flujos to-be de los casos Bot e IoT.

**Versión:** 1.1 (actualizado 2026-05-01 con 15 mejoras de robustez académica)
**Fecha:** 2026-04-17 — actualizado 2026-05-01 con soporte académico completo
**Autor:** Elian Hernando Gil Sierra
**Trabajo de grado:** MGADS — UNAB 2026

---

## 1. Propósito

Traducir principios de **Clean Architecture** y **DevSecOps** al contexto visual y operativo
de n8n mediante un conjunto ligero y verificable de reglas, patrones y plantillas. El
micro-framework no introduce dependencias externas: es un conjunto de decisiones de diseño
aplicables al construir flujos.

Responde directamente a los objetivos específicos del anteproyecto:

- **OE1** — Definir un marco arquitectónico para flujos Low-Code/No-Code en n8n, basado
  en principios de arquitectura limpia, que relacione atributos de calidad con decisiones
  de diseño, reglas de organización, patrones y criterios de buenas prácticas.
- **OE2** — Sistematizar el uso del marco arquitectónico en dos casos de estudio
  representativos, documentando arquitecturas as-is y to-be con diagramas claros, registro
  de decisiones (ADR) y una matriz de trazabilidad entre requerimientos, decisiones y
  atributos de calidad.

---

## 2. Componentes del micro-framework

| Componente | Ubicación | Propósito |
|---|---|---|
| Metamodelo E1–E4 | [`microframework/microframework-spec.md`](microframework-spec.md) | Cuatro etapas lógicas: validación, dominio, adaptadores, salida |
| Reglas obligatorias (REG-001…010) | [`microframework/reglas/reglas-obligatorias.md`](reglas/reglas-obligatorias.md) | 10 reglas con criterio binario y mapeo a ISO/IEC 25010 |
| Reglas recomendadas (REC-001…006) | [`microframework/reglas/reglas-recomendadas.md`](reglas/reglas-recomendadas.md) | 6 reglas de refuerzo opcionales |
| Patrones | [`microframework/patrones/`](patrones/) | 5 patrones: retry, idempotencia, log estructurado, circuit breaker, error boundary, saga |
| Antipatrones | [`microframework/antipatrones.md`](antipatrones.md) | Catálogo de 11 antipatrones documentados |
| ADRs de framework | [`microframework/adr/`](adr/) | ADR-MF-001 (REG-001), ADR-MF-002 (REG-003), ADR-MF-003 (REG-006) |
| Contratos E/S | [`microframework/contratos/`](contratos/) | JSON Schemas por etapa para Bot e IoT (9 archivos) |
| Convenciones | [`microframework/convenciones/naming-conventions.md`](convenciones/naming-conventions.md) | Nombres de archivos, subflujos, nodos y variables |
| Checklist arquitectura | [`microframework/checklists/checklist-arquitectura.md`](checklists/checklist-arquitectura.md) | 10 ítems binarios alineados con REG-* |
| Checklist DevSecOps | [`microframework/checklists/checklist-devsecops.md`](checklists/checklist-devsecops.md) | 8 ítems de seguridad (Pilar 1) |
| Guía de observabilidad | [`microframework/guia-observabilidad.md`](guia-observabilidad.md) | Pilar 3: contrato de logs estructurados por etapa |
| Validación estática (Lite) | [`microframework/validacion/validar-flujos.mjs`](validacion/validar-flujos.mjs) | Pilar 2 — un único archivo `.mjs`, cero dependencias, HTML offline. Evalúa 11 REG-* + 6 antipatrones AP-* sobre el grafo del flujo |
| Validación estática (Pro) | [`microframework/validacion-pro/`](validacion-pro/) | Pilar 2 — módulo con DSL YAML de reglas, codemods `--fix`, SARIF para GitHub Code Scanning, suite vitest |
| Plantillas ADR y JSON | [`microframework/plantillas/`](plantillas/) | 10 plantillas JSON (2 as-is + 8 to-be/subflujos) + plantilla ADR Markdown |
| Utility Tree ATAM | [`atam/atam-utility-tree.md`](../atam/atam-utility-tree.md) | 12 escenarios top-K (6 Bot + 6 IoT) con medidas de respuesta para FASE 7 |
| Protocolo MTTD | [`medicion/protocolo-mttd.md`](../medicion/protocolo-mttd.md) | Procedimiento reproducible de medición de Mean Time To Detect |
| Taxonomía de casos | [`casos-de-estudio/justificacion-casos-de-estudio.md`](../casos-de-estudio/justificacion-casos-de-estudio.md) | Representatividad formal de Bot e IoT en el espacio LC/NC de n8n |

---

## 3. Metamodelo E1–E4

Todo flujo que adopte el micro-framework se organiza en cuatro **responsabilidades lógicas**
(no necesariamente cuatro subflujos — ver ADR-002 del caso Bot para la excepción de E4 inline):

- **E1 — Validación:** verifica el payload contra el contrato, genera `run_id`, captura
  `start_ts`. Ningún contacto con IO ni dominio.
- **E2 — Dominio:** aplica reglas de negocio puras. No accede a BD ni HTTP (REG-007).
- **E3 — Adaptadores:** traduce la decisión del dominio al formato del sistema externo
  y ejecuta la integración con retry (REG-004) e idempotencia (REG-005).
- **E4 — Salida:** produce la respuesta o notificación final con status codes apropiados
  (REG-009).

Especificación completa: [`microframework/microframework-spec.md`](microframework-spec.md).

---

## 4. DevSecOps — tres pilares

Alineados con §4.3 del anteproyecto:

| Pilar | Instrumentación | Verificación |
|---|---|---|
| 1. Gestión de Secretos | Credenciales n8n referenciadas por nombre; `.env` fuera de Git | Ítems 1–5 del checklist DevSecOps + REG-001 |
| 2. Validaciones Automatizadas | Lite [`validar-flujos.mjs`](validacion/validar-flujos.mjs) + Pro [`validacion-pro/`](validacion-pro/) | Evalúa 17 reglas (11 REG-* + 6 AP-*) sobre el grafo del flujo. Cada finding lleva severidad, confianza, ISO 25010, ATAM, ADR. Salidas: md, json canónico, html offline, sarif, junit |
| 3. Resiliencia Operativa | Patrones retry e idempotencia + [`guia-observabilidad.md`](guia-observabilidad.md) | REG-004, REG-005, REG-006 |

---

## 5. Mapeo a ISO/IEC 25010

El micro-framework contribuye a cinco características del modelo de calidad. Cada regla
está mapeada explícitamente en [`reglas-obligatorias.md`](reglas/reglas-obligatorias.md#mapeo-reg--isoiec-25010).

| Característica | Reglas | Métrica del anteproyecto |
|---|---|---|
| Mantenibilidad (Modularidad, Analizabilidad, Reusabilidad) | REG-002, REG-007, REG-008, REG-010 | Impacto de cambio, Ratio de reuso de subflujos |
| Fiabilidad (Tolerancia, Recuperabilidad, Madurez) | REG-003, REG-004, REG-005 | Tasa de fallo, Eficiencia de retry |
| Seguridad (Confidencialidad) | REG-001 | Exposición de secretos (checklist DevSecOps) |
| Eficiencia de desempeño (Comportamiento temporal) | REG-006 (logs de latencia) | Latencia p50/p95/p99 por tramo |
| Operabilidad (Monitoreabilidad) | REG-006 | MTTD (Mean Time To Detect) |

La cobertura cuantitativa se mide en FASE 7 (ATAM) — meta del anteproyecto: ≥ 80%.

---

## 6. Flujo de adopción

Aplicar el micro-framework a un caso nuevo sigue esta secuencia:

1. Definir contratos E/S del caso como JSON Schema en `microframework/contratos/`.
2. Importar las 4 plantillas de subflujo desde `microframework/plantillas/`
   (o 3 si aplica la omisión de E4 como subflujo — requiere ADR justificándolo).
3. Capturar IDs reales y actualizar referencias `Execute Workflow` en el orquestador.
4. Aplicar el [`checklist-arquitectura.md`](checklists/checklist-arquitectura.md)
   y el [`checklist-devsecops.md`](checklists/checklist-devsecops.md).
5. Ejecutar `node microframework/validacion/validar-flujos.mjs --caso <nombre> --estado to-be`.
6. Documentar decisiones no obvias como ADR en `casos-de-estudio/<caso>/adr/`.
7. Versionar el JSON re-exportado en `casos-de-estudio/<caso>/to-be/`.

---

## 7. Criterios de aceptación del micro-framework v1.0

El micro-framework se considera entregable R1 cuando:

- ✓ 10 reglas obligatorias con criterio binario y mapeo ISO 25010
- ✓ Script de validación estática ejecutable sobre el JSON (falso negativo REG-001 corregido en cierre FASE 3)
- ✓ Guía de observabilidad con contrato de log por etapa
- ✓ Contratos E/S de los casos Bot e IoT como JSON Schema (5 contratos revisados y alineados con datasets reales en cierre FASE 3)
- ✓ Plantillas de subflujos + plantilla ADR (10 JSON + ADR-plantilla)
- ✓ Dos casos de estudio (Bot, IoT) con as-is y to-be diseñados
- ✓ **ADRs completos por caso** — 9 ADRs totales: 4 Bot + 4 IoT + ADR-004 compartido
  - Bot: [001](../casos-de-estudio/bot/adr/ADR-001-separacion-responsabilidades-flujo.md),
    [002](../casos-de-estudio/bot/adr/ADR-002-omision-e4.md),
    [003](../casos-de-estudio/bot/adr/ADR-003-ratelimit-medicion.md),
    [004](../casos-de-estudio/bot/adr/ADR-004-diseno-experimental-input-sets.md)
  - IoT: [001](../casos-de-estudio/iot/adr/ADR-001-separacion-responsabilidades-pipeline.md),
    [002](../casos-de-estudio/iot/adr/ADR-002-umbrales-y-vocabulario.md),
    [003](../casos-de-estudio/iot/adr/ADR-003-idempotencia-sensor-timestamp.md),
    [004](../casos-de-estudio/iot/adr/ADR-004-routing-e4-por-severidad.md)
- ✓ **Change-log de cambios al as-is con evidencia** — `cambios-y-evidencia.md` por caso:
  [Bot](../casos-de-estudio/bot/as-is/cambios-y-evidencia.md) · [IoT](../casos-de-estudio/iot/as-is/cambios-y-evidencia.md)
- ✓ **Diseño de CRs con pre-medición as-is ejecutada** — `cr-design.md` por caso y
  `cr-log-{caso}-as-is.csv` poblado con 3 filas cada uno:
  [Bot design](../casos-de-estudio/bot/cr-design.md) · [IoT design](../casos-de-estudio/iot/cr-design.md)
- ✓ **Checklists aplicados al as-is como evidencia** — 4 archivos de resultado:
  [Bot arq](../casos-de-estudio/bot/as-is/checklist-arquitectura-resultado.md) ·
  [Bot DevSecOps](../casos-de-estudio/bot/as-is/checklist-devsecops-resultado.md) ·
  [IoT arq](../casos-de-estudio/iot/as-is/checklist-arquitectura-resultado.md) ·
  [IoT DevSecOps](../casos-de-estudio/iot/as-is/checklist-devsecops-resultado.md)
- ✓ **Matrices de trazabilidad sin pendientes** — enlaces a ADRs reales en
  [Bot](../casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md) y
  [IoT](../casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md)
- ✓ Ningún artefacto contradice el anteproyecto (§4 alcance, §5 metodología). La
  ampliación de Input Sets está documentada como adenda en `proyecto-overview.md`
  §Input Sets y formalizada en ADR-004 Bot.

Todos los criterios se cumplen en esta versión.

### Criterios adicionales — v1.1 (2026-05-01)

- ✓ **Fundamento teórico completo** — Clean Architecture (Martin 2017), NIST SSDF, OWASP Top 10, literatura LC/NC (Bock & Frank 2021, Cabot 2020, Sahay 2020), posicionamiento frente a Power Platform y Zapier
- ✓ **ADRs a nivel de framework** — 3 ADRs (ADR-MF-001/002/003) para REG-001, REG-003, REG-006 con contexto, decisión, alternativas y consecuencias
- ✓ **ADRs por caso completos** — 8 ADRs por caso (Bot: 001–008, IoT: 001–008)
- ✓ **Patrones expandidos** — 5 patrones (+ circuit breaker, error boundary, saga/compensación)
- ✓ **Antipatrones expandidos** — 11 antipatrones (+ ID hardcodeado, chatty, exception swallowing, god node)
- ✓ **Utility Tree ATAM** — 12 escenarios (6 Bot + 6 IoT) con medidas de respuesta y trazabilidad a ADRs
- ✓ **Protocolo MTTD** — procedimiento reproducible de medición de MTTD con meta < 60 segundos
- ✓ **Diagramas arquitectónicos as-is** — Mermaid con antipatrones anotados por nodo para Bot e IoT
- ✓ **Matrices de trazabilidad v1.2** — columna ISO 25010 en tablas de RFs
- ✓ **Justificación metodológica del rediseño as-is** — validez interna según Wohlin et al. (2012)
- ✓ **Documentación de anomalía commit_hash** — §9 en protocolo-evidencias.md

---

## 8. Relación con los resultados del anteproyecto

| Resultado | Contribución del micro-framework |
|---|---|
| R1 — Micro-framework documentado | Este documento y los artefactos referenciados |
| R2 — Casos as-is y to-be comparables | Plantillas y reglas habilitan diseño to-be uniforme |
| R3 — Medición cuantitativa | REG-006 + guía de observabilidad alimentan las métricas |
| R4 — Evaluación ATAM | Mapeo ISO 25010 + ADR por caso son evidencia reproducible |
| R5 — Diseño AWS | Logs estructurados se trasladan a CloudWatch Insights (FASE 8) |
| R6 — Guía de buenas prácticas | Antipatrones, patrones y checklists son insumo directo |

---

## 9. Versionado y cambios

Cualquier modificación a REG-*, al metamodelo E1–E4 o a los contratos requiere:

- ADR en `casos-de-estudio/{caso}/adr/` si la desviación es por caso.
- Actualización de este documento y bump a la versión (v1.1, v2.0, …).
- Re-ejecución del script de validación sobre todos los casos afectados.

---

## 10. Referencias normativas

- Anteproyecto MGADS (documento normativo del autor, no versionado en el repositorio)
- Proyecto overview: [`../medicion/proyecto-overview.md`](../medicion/proyecto-overview.md)
- Arquitectura as-is / to-be: [`casos-de-estudio/arquitectura-flujos.md`](../casos-de-estudio/arquitectura-flujos.md)
- Convenios y reglas del repositorio: [`convenciones/convenios-y-reglas.md`](convenciones/convenios-y-reglas.md)
- Protocolo de evidencias: [`medicion/protocolo-evidencias.md`](../medicion/protocolo-evidencias.md)
- Estado actual del proyecto: [`estado-actual.md`](../estado-actual.md)
