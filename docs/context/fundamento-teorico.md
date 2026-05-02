# Fundamento teórico del micro-framework

**Versión:** 1.0
**Fecha:** 2026-05-01
**Autor:** Elian Hernando Gil Sierra
**Propósito:** Articular las bases conceptuales del micro-framework en Clean Architecture,
DevSecOps y la literatura LC/NC, y posicionarlo frente a trabajos comparables.

---

## 1. Clean Architecture (Martin, 2017)

### 1.1 Principios SOLID aplicados al micro-framework

| Principio | Aplicación en el micro-framework |
|-----------|----------------------------------|
| **SRP** (Single Responsibility) | Cada etapa E1–E4 tiene una única responsabilidad: validar, decidir, integrar o responder. Ninguna etapa cruza esa frontera. |
| **OCP** (Open/Closed) | Las reglas de negocio en E2 se pueden extender (añadir reglas al array `REGLAS`) sin modificar los adaptadores en E3 o E4. |
| **LSP** (Liskov Substitution) | Los subflujos son intercambiables: un E3 diferente puede implementarse sin cambiar E1, E2 o E4, siempre que respete el contrato JSON Schema. |
| **ISP** (Interface Segregation) | Los contratos E/S (JSON Schema) son específicos por etapa — E2 solo recibe lo que necesita del output de E1, no el payload completo. |
| **DIP** (Dependency Inversion) | E2 (dominio) no depende de E3 (adaptadores). E3 depende del contrato de E2, no al revés. La dirección de dependencia apunta siempre hacia el dominio. |

### 1.2 Mapeo E1–E4 a capas de Clean Architecture

```
┌─────────────────────────────────────────────┐
│  Frameworks & Drivers (n8n, PostgreSQL, HTTP) │
│  → E3 Adaptadores de integración              │
│  → E4 Salida controlada (Respond Webhook)     │
├─────────────────────────────────────────────┤
│  Interface Adapters                           │
│  → E3 (transformación de formato)             │
│  → E1 (normalización de entrada)              │
├─────────────────────────────────────────────┤
│  Application Business Rules (Use Cases)       │
│  → E1 (validación del contrato de entrada)    │
│  → E2 (orquestación de reglas de dominio)     │
├─────────────────────────────────────────────┤
│  Enterprise Business Rules (Entities)         │
│  → Constantes REGLAS, UMBRALES en E2          │
│  → JSON Schemas de contratos E/S              │
└─────────────────────────────────────────────┘
```

### 1.3 Boundary Rule en n8n

En Clean Architecture, los datos que cruzan los límites entre capas deben hacerlo
solo hacia adentro (desde frameworks hasta entidades). En el micro-framework:

- El payload HTTP de entrada solo entra a E1 (validación). E2 recibe únicamente
  el output validado de E1 (`{valido, errores, run_id, start_ts, payload}`).
- E2 solo pasa su resultado enriquecido a E3. E3 no puede "preguntarle" a E2.
- El `run_id` generado en E1 se propaga hacia afuera (E2, E3, E4, respuesta) pero
  nunca se modifica — es inmutable desde su generación (REG-002).

---

## 2. DevSecOps

### 2.1 NIST SP 800-218 SSDF (Secure Software Development Framework)

El NIST SP 800-218 v1.1 (2022) define prácticas para integrar seguridad en el ciclo
de desarrollo. Las siguientes prácticas SSDF son directamente implementadas por el
micro-framework:

| Práctica SSDF | Descripción | Implementación en micro-framework |
|---------------|-------------|-----------------------------------|
| **PO.1** (Define Security Requirements) | Definir requisitos de seguridad como parte del proceso de desarrollo | REG-001 define el requisito binario: cero credenciales en JSON |
| **PS.1** (Store and Transmit Sensitive Data Securely) | No almacenar secretos en artefactos de código | Pilar 1 — Gestión de Secretos via n8n Credentials |
| **PS.3** (Archive and Protect Each Software Release) | Versionar solo artefactos sin secretos | `.gitignore` excluye `.env`; REG-001 verificado antes de versionar |
| **RV.1** (Identify and Confirm Vulnerabilities) | Revisar vulnerabilidades antes de desplegar | Pilar 2 — `validar-flujos.mjs` verifica REG-001..010 sobre el JSON |
| **RV.2** (Assess, Prioritize, and Remediate Vulnerabilities) | Priorizar y remediar hallazgos | `checklist-devsecops.md` con 8 ítems priorizados por severidad |
| **PW.4** (Reuse Existing, Well-Secured Software) | Reusar componentes seguros conocidos | Retry nativo n8n (no implementación custom) — REG-004 |
| **PW.5** (Create Source Code by Adhering to Secure Coding Practices) | Aplicar prácticas de código seguro | REG-001..010 como prácticas verificables con criterio binario |

### 2.2 OWASP Top 10 2021 — Cobertura del micro-framework

| Categoría OWASP | Relación con micro-framework |
|-----------------|------------------------------|
| **A02:2021 Cryptographic Failures** | REG-001 previene directamente: credenciales en el JSON exportado equivalen a datos sensibles en el repositorio |
| **A01:2021 Broken Access Control** | REG-009 + E1 validan autenticación antes de procesar (401 para token inválido, 400 para campos faltantes) |
| **A09:2021 Security Logging and Monitoring Failures** | REG-006 (log estructurado JSON) + Guía de observabilidad abordan directamente este riesgo |

### 2.3 Los tres pilares DevSecOps en n8n

| Pilar | Problema específico en n8n | Solución del micro-framework |
|-------|---------------------------|------------------------------|
| 1. Gestión de Secretos | n8n exporta el JSON completo incluyendo configuración de nodos con valores literales | Credenciales solo como referencias por nombre (`$credentials["nombre"]`); REG-001 |
| 2. Validaciones Automatizadas | No existe herramienta nativa para verificar cumplimiento de reglas arquitectónicas en flujos n8n | `validar-flujos.mjs` — script Node.js que evalúa REG-001..010 sobre el JSON exportado |
| 3. Resiliencia Operativa | Los fallos en n8n son silenciosos si no hay errorWorkflow; los logs internos no son consultables programáticamente | REG-003 (errorWorkflow), REG-004 (retry), REG-005 (idempotencia), REG-006 (logs JSON en stdout) |

---

## 3. Literatura LC/NC

### 3.1 Gap identificado en la literatura

| Fuente | Hallazgo | Implicación para este trabajo |
|--------|----------|-------------------------------|
| Bock & Frank (2021) "Low-Code Platform" — BISE | Ningún framework existente (a 2021) define reglas arquitectónicas formales para plataformas LC/NC | El micro-framework propuesto cubre este gap para n8n específicamente |
| Richardson & Watt (2018) "Low-Code Development Platform" | Los sistemas LC/NC carecen de patrones de observabilidad y trazabilidad equivalentes a los disponibles en desarrollo tradicional | REG-006 + Guía de observabilidad abordan este gap |
| Cabot (2020) "Positioning of Low-Code Development Platforms" — JOT | La proliferación de plataformas LC/NC carece de marcos de evaluación de calidad estandarizados | El uso de ISO/IEC 25010 como marco de evaluación del micro-framework es una contribución directa a este gap |
| Sahay et al. (2020) "Supporting the understanding and comparison of low-code development platforms" — SANER | Las comparaciones entre plataformas LC/NC son difíciles por falta de criterios comunes | Los 10 criterios binarios REG-001..010 con mapeo ISO 25010 proporcionan una base comparable |

### 3.2 Frameworks comparables — ausencia de equivalentes para n8n

| Framework / Guía | Plataforma | Metamodelo de etapas | Criterios binarios | Verificación automática |
|-----------------|------------|---------------------|-------------------|------------------------|
| **Microsoft Power Platform DLP** | Power Platform | No | No (políticas cualitativas) | Parcial (governance center) |
| **Zapier Best Practices Guide** | Zapier | No | No (recomendaciones) | No |
| **n8n Community Guidelines** (2026) | n8n | No | No | No |
| **Este micro-framework** | n8n | Sí (E1–E4) | Sí (REG-001..010) | Sí (`validar-flujos.mjs`) |

La tabla confirma que el micro-framework es el primero en formalizar, para n8n:
(a) un metamodelo de etapas con responsabilidades explícitas,
(b) reglas con criterio de verificación binario,
(c) un script de verificación estática ejecutable sobre el JSON exportado.

---

## 4. Posicionamiento del micro-framework

### 4.1 Contribución original

El micro-framework es el primero (a conocimiento del autor, 2026) en formalizar para
la plataforma n8n:

1. **Metamodelo por etapas (E1–E4)** — traducción explícita de las capas de Clean
   Architecture al paradigma de nodos visuales de n8n, con responsabilidades que
   no se solapan y contratos JSON Schema por etapa.

2. **Reglas con criterio binario y trazabilidad ISO 25010** — 10 reglas que pueden
   verificarse como "cumple / no cumple" sobre el artefacto exportado (no sobre el
   código fuente ni sobre la ejecución), mapeadas a 5 características del modelo de
   calidad ISO/IEC 25010:2011.

3. **Verificación estática automática** — `validar-flujos.mjs` evalúa REG-001..010
   sobre el JSON exportado de n8n sin necesidad de ejecutar el flujo, sin conectarse
   a una instancia de n8n y sin dependencias externas más allá de Node.js.

4. **Integración de los tres pilares DevSecOps en el contexto visual** — la gestión
   de secretos (REG-001), la validación automatizada (validar-flujos.mjs) y la
   resiliencia operativa (REG-003, REG-004, REG-005, REG-006) se implementan con
   primitivas nativas de n8n, sin introducir dependencias externas.

### 4.2 Limitaciones declaradas

- El micro-framework es específico de n8n v1.x. Los mecanismos (`Execute Workflow`,
  `Respond to Webhook`, `$getWorkflowStaticData`) son propietarios de n8n.
- La verificación estática (Pilar 2) no puede detectar errores semánticos en la
  lógica de E2 — solo verifica la presencia de estructuras en el JSON.
- La evaluación se realiza en un entorno de laboratorio local. Las métricas de latencia
  (REG-006) no son extrapolables directamente a entornos productivos con carga real.

---

## 5. Referencias

- Martin, R.C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- NIST (2022). *SP 800-218 Secure Software Development Framework (SSDF) v1.1*. National Institute of Standards and Technology.
- ISO/IEC (2011). *ISO/IEC 25010:2011 — Systems and software quality models*. International Organization for Standardization.
- Yin, R.K. (2018). *Case Study Research and Applications: Design and Methods* (6th ed.). SAGE Publications.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer.
- Bock, A. & Frank, U. (2021). Low-Code Platform. *Business & Information Systems Engineering*, 63(6), 733–740.
- Cabot, J. (2020). Positioning of Low-Code Development Platforms. *Journal of Object Technology*, 19(2).
- Sahay, A. et al. (2020). Supporting the understanding and comparison of low-code development platforms. *IEEE SANER 2020*.
- OWASP (2021). *OWASP Top Ten 2021*. Open Web Application Security Project.
