> 🌐 **Idioma / Language:** Español · [English](metodologia-atam-adaptada.en.md)

# Metodología — ATAM Modificado Asincrónico con Validación Externa por Panel de Expertos

**Versión:** 1.0
**Fecha:** 2026-05-07
**Autor:** Elian Hernando Gil Sierra
**ADR de referencia:** [`ADR-MF-004`](../../microframework/adr/ADR-MF-004-atam-adaptado-individual.md)
**Propósito:** Documentar la metodología de evaluación arquitectónica aplicada en este proyecto de grado, explicando con detalle cómo se adapta el método ATAM canónico al contexto de un investigador único y cómo se compensa la ausencia del componente multi-stakeholder mediante triangulación con validación externa.

---

## 1. Marco de referencia

### 1.1 El método ATAM original

El **Architecture Tradeoff Analysis Method** (ATAM) fue propuesto por Kazman, Klein y Clements en el reporte técnico CMU/SEI-2000-TR-004 y consolidado en Bass, Clements & Kazman (2012) *Software Architecture in Practice* (3ra edición, capítulo 21). Es un método de evaluación arquitectónica basado en escenarios cuyo objetivo es identificar **riesgos**, **puntos sensibles** y **puntos de compromiso** entre los atributos de calidad de una arquitectura, antes de que esos atributos se vean comprometidos en producción.

La premisa central de ATAM es que las decisiones arquitectónicas raramente afectan a un único atributo de calidad: típicamente mejoran uno y degradan otro, configurando trade-offs explícitos que la arquitectura debe documentar. ATAM hace visibles esos trade-offs mediante un protocolo de nueve pasos ejecutados típicamente en dos sesiones presenciales de un día cada una:

| Paso | Nombre | Producto |
|---|---|---|
| 1 | Presentar el método ATAM | Comprensión común del proceso |
| 2 | Presentar los drivers de negocio | Lista de atributos priorizados por el dueño del producto |
| 3 | Presentar la arquitectura | Documentación arquitectónica común |
| 4 | Identificar los approaches arquitectónicos | Inventario de decisiones y patrones aplicados |
| 5 | Generar el utility tree | Árbol jerárquico de atributos refinados en escenarios concretos |
| 6 | Analizar los approaches arquitectónicos | Identificación inicial de sensitivity points, tradeoff points, risks, non-risks |
| 7 | Brainstorming y priorización de escenarios | Top-K escenarios priorizados por importancia y dificultad |
| 8 | Re-analizar los approaches arquitectónicos | Análisis refinado de los Top-K escenarios |
| 9 | Presentar los resultados | Reporte final con riesgos, trade-offs y recomendaciones |

ATAM produce cuatro categorías de hallazgos:

- **Sensitivity Point (SP):** decisión arquitectónica cuya modificación impacta principalmente un atributo de calidad.
- **Tradeoff Point (TP):** decisión arquitectónica que afecta múltiples atributos en direcciones opuestas; mejorar uno implica empeorar el otro.
- **Risk (R):** decisión arquitectónica o ausencia de decisión que potencialmente compromete el cumplimiento de un escenario.
- **Non-risk (NR):** decisión arquitectónica que claramente preserva o mejora el cumplimiento de un escenario.

Adicionalmente, ATAM exige un componente humano colaborativo: los hallazgos no se producen analíticamente sobre el código, sino conversacionalmente entre stakeholders heterogéneos que aportan perspectivas distintas. Esta conversación es lo que distingue a ATAM de una revisión arquitectónica de escritorio.

### 1.2 Restricciones del contexto del proyecto

El presente proyecto opera bajo tres restricciones que impiden aplicar ATAM en su forma canónica:

**R1 — Investigador único.** El proyecto es desarrollado por un solo autor bajo dirección de un director académico. No existe equipo de proyecto, dueño de producto, cliente real ni representantes de operaciones disponibles para una sesión colaborativa.

**R2 — Dominio simulado.** Los dos casos de estudio (Bot de soporte y Pipeline IoT) son representaciones académicas de problemas LC/NC reales pero no corresponden a un sistema productivo con stakeholders reales que tengan opiniones formadas sobre los atributos de calidad priorizados.

**R3 — Cronograma de tesis.** El cronograma del anteproyecto reserva 3 semanas para Fase 7 (07/06 al 07/24) lo cual es incompatible con la coordinación de talleres ATAM completos que típicamente requieren 6–10 semanas de preparación incluyendo identificación, capacitación previa y agendamiento de stakeholders.

Bajo estas restricciones, una aplicación literal de ATAM produciría una "evaluación de un solo punto de vista" en la que el autor diseña, implementa, evalúa y reporta sin contraste externo — una situación que Wohlin et al. (2012) identifican como una de las principales amenazas a la validez externa en estudios empíricos de software.

---

## 2. La adaptación propuesta

### 2.1 Estrategia general: triangulación metodológica

La adaptación se construye sobre el principio de **triangulación metodológica** (Denzin, 1978): cuando una única fuente de evidencia tiene limitaciones de validez, hacer converger múltiples fuentes independientes sobre el mismo hallazgo aumenta la credibilidad de las conclusiones. Aplicada al caso, la triangulación opera entre tres fuentes:

```
                 ┌─────────────────────────────┐
                 │   HALLAZGO ARQUITECTÓNICO   │
                 │ (SP / TP / Risk / Non-risk) │
                 └──────────────┬──────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐    ┌────────────────────┐    ┌──────────────────┐
│ Documental    │    │  Cuantitativa      │    │ Opinión experta  │
│ ADRs (19)     │    │  Run-logs (8 000)  │    │ Encuesta panel   │
│ Contratos     │    │  CR-logs (12)      │    │ Mini-ATAM (3-5)  │
│ Diagramas     │    │  MTTD, métricas    │    │ Análisis temático│
│ Checklists    │    │  Validador estát.  │    │ Inter-rater κ    │
└───────────────┘    └────────────────────┘    └──────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                                ▼
                  Convergencia → Hallazgo robusto
                  Divergencia  → Limitación reportada
```

Cada hallazgo del informe ATAM (SP/TP/R/NR) cita explícitamente su evidencia en al menos dos de las tres fuentes. Las divergencias entre fuentes — por ejemplo, un hallazgo soportado por documentación y métricas pero contradicho por la opinión del panel — se reportan honestamente como **limitaciones** y se discuten en la sección de conclusiones del informe.

### 2.2 Reordenamiento y operación asincrónica de los pasos de ATAM

La adaptación preserva los nueve pasos pero los reorganiza en cuatro fases asincrónicas operadas por el autor, más una fase de validación externa que ocurre en paralelo a la última:

```
Fase I — Preparación analítica            Pasos 1, 2, 3, 4, 5
  (autor, asincrónico, ~3 semanas)
        │
        ▼
Fase II — Análisis interno de approaches   Pasos 6, 7
  (autor, asincrónico, ~1 semana)
        │
        ▼
Fase III — Evidencia empírica              Paso 8
  (8 000 corridas + runtime + análisis)
        │
        ▼
Fase IV — Síntesis del informe             Paso 9 (parcial)
  (autor, asincrónico, ~2 semanas)
        │
        └───────────────► Fase V — Validación externa
                          (panel de expertos, ~3 semanas)
                                  │
                                  ▼
                          Integración final en informe
```

### 2.3 Mapeo paso a paso

| Paso ATAM original | Adaptación en este proyecto | Justificación de la equivalencia |
|---|---|---|
| **1. Presentar el método ATAM** | Capítulo introductorio del informe + este documento de metodología | Documentación reemplaza presentación oral; el lector del informe es quien recibe la "presentación" |
| **2. Presentar los drivers de negocio** | Sección de drivers en el informe basada en `docs/context/proyecto-overview.md` (objetivos, atributos ISO 25010 priorizados) | Los drivers ya están explícitos en el anteproyecto y operacionalizados como métricas |
| **3. Presentar la arquitectura** | Sección de arquitectura del informe basada en `docs/context/arquitectura-flujos.md`, diagramas Mermaid as-is/to-be, contratos JSON Schema | Documentación arquitectónica completa sustituye la sesión presencial |
| **4. Identificar los approaches** | `docs/atam/analisis-approaches.md` §1 — 12 approaches arquitectónicos inventariados con sus ADRs y atributos afectados | Inventario sistemático del autor cubre lo que en taller se haría colectivamente |
| **5. Generar el utility tree** | `docs/atam/atam-utility-tree.md` ya producido — 12 escenarios top-K, 6 por caso, con estímulo/respuesta/medida y prioridad (I × D) | Utility tree producido por el autor con sustento en literatura (Bass et al. 2012) y validado contra los atributos del anteproyecto |
| **6. Analizar los approaches (1ra pasada)** | `docs/atam/analisis-approaches.md` §2 — clasificación SP/TP/R/NR por escenario derivada de evidencia documental | Análisis sistemático individual reemplaza brainstorming grupal; se compensa con el componente de validación externa |
| **7. Brainstorming y priorización** | Priorización ya incluida en el utility tree (escala H/M/L de importancia × dificultad). No hay brainstorming abierto; los escenarios provienen del anteproyecto y de los objetivos de calidad declarados | El alcance del proyecto define los escenarios; el brainstorming abierto no agregaría valor con un único autor |
| **8. Re-analizar los approaches (2da pasada)** | Refinamiento de la clasificación SP/TP/R/NR usando **evidencia cuantitativa empírica**: 8 000 corridas, 12 CRs medidos, IOT-Q4/Q5 runtime, MTTD, validador estático. Cada hallazgo se contrasta con métricas reales | La evidencia empírica masiva sustituye la discusión grupal: lo que en taller se debate, aquí se mide |
| **9. Presentar los resultados** | Componente dividido en dos: (a) `docs/atam/informe-atam-final.md` produce el reporte para el director y jurado; (b) **validación externa por panel de expertos** mediante encuesta corta + mini-ATAM verifica las conclusiones con voces externas | La presentación de resultados se transforma en validación externa, compensando la ausencia del componente conversacional |

### 2.4 Componente de validación externa: detalle metodológico

El componente de validación externa opera como una capa de **revisión por pares no especializados** que reemplaza el papel del "stakeholder externo" que ATAM-original tendría en sus pasos 1, 7 y 9.

**Diseño en dos niveles:**

**Nivel 1 — Encuesta amplia (objetivo: N ≥ 15 respondentes).** Instrumento concisivo de 10–12 minutos administrado vía Google Forms a profesionales senior de desarrollo, arquitectura, DevOps, seguridad y QA. Validación de la **utilidad percibida** del framework con escalas Likert sobre los cinco atributos ISO 25010 priorizados, más tres preguntas abiertas sobre riesgos, trade-offs y refinamientos al framework. Provee evidencia agregada cuantitativa (estadística descriptiva + análisis correlacional ligero) y cualitativa (codificación abierta de respuestas).

**Nivel 2 — Mini-ATAM con expertos (objetivo: 3–5 expertos del Nivel 1).** Sub-panel seleccionado por mayor experiencia (≥ 5 años + rol de arquitecto/lead) ejecuta scoring estructurado de los 12 escenarios ATAM en escala 1–5 as-is/to-be, con clasificación arquitectónica de cada uno como SP/TP/R/NR. Provee evidencia de **convergencia o divergencia con el análisis del autor** y permite calcular acuerdo inter-evaluador (Cohen's κ para 2 expertos, Krippendorff's α para 3 o más).

**Encuadre académico:** la decisión metodológica está soportada por las guías de Kitchenham & Pfleeger (2008) sobre encuestas de opinión personal en ingeniería de software empírica y por el capítulo 8 de Wohlin et al. (2012) sobre estudios cualitativos y encuestas de expertos.

---

## 3. Operacionalización: cómo se produce cada hallazgo

Cada hallazgo del informe (SP, TP, R, NR) se produce siguiendo el protocolo:

1. **Generación analítica inicial.** El autor identifica el hallazgo por inspección de los ADRs, diagramas y código de los flujos n8n. Se redacta en `docs/atam/analisis-approaches.md` con la justificación arquitectónica.

2. **Soporte cuantitativo.** Se busca evidencia en los artefactos de medición:
   - Run-logs (`medicion/run-logs/*.csv`) para latencia, tasa de fallos
   - CR-logs (`medicion/cr-logs/*.csv`) para impacto de cambios
   - Validador estático (`microframework/validacion/reportes/*.md`) para seguridad y conformidad
   - Reportes consolidados (`medicion/consolidado/*.md`) para métricas derivadas
   - Tests runtime (IOT-Q4, IOT-Q5, BOT-Q5) para verificación de comportamiento en vivo

3. **Triangulación con opinión experta (Fase V).** El hallazgo se incluye en el material de apoyo de la encuesta de forma neutral (sin sesgar la respuesta) para que los expertos lo identifiquen independientemente. Los hallazgos identificados por ≥ 1 experto se marcan como "convergentes". Los hallazgos no identificados por nadie del panel se marcan como "puramente analíticos" y se reporta esa limitación.

4. **Decisión de inclusión final.** Solo los hallazgos con soporte en al menos dos de las tres fuentes (documental + cuantitativa + experta) se elevan a "hallazgo confirmado" en el informe ATAM. Los hallazgos con soporte en una sola fuente se reportan como "preliminares" o "exploratorios".

---

## 4. Aseguramiento de validez y mitigación de sesgos

### 4.1 Amenazas a la validez identificadas

| Amenaza | Tipo (Wohlin et al. 2012) | Mitigación aplicada |
|---|---|---|
| Sesgo del evaluador único | Validez interna | Triangulación con panel externo (Nivel 1 + Nivel 2) |
| Falta de representatividad del panel | Validez externa | Criterios de inclusión explícitos (≥ 3 años, roles relevantes) + reporte transparente del perfil de respondentes |
| Sesgo de confirmación al diseñar la encuesta | Validez de constructo | Inclusión deliberada de preguntas abiertas (Sección C del instrumento) que permiten hallazgos no anticipados por el autor |
| Reactividad del respondente (efecto Hawthorne) | Validez interna | Encuesta asincrónica anónima sin contacto directo durante la respuesta |
| Bajo poder estadístico si N es pequeño | Conclusión | Definición a priori de tamaños muestrales mínimos y reporte honesto si no se alcanzan |
| Selección no aleatoria del panel | Validez externa | Reporte explícito de la estrategia de muestreo (intencional/conveniencia) en la sección de limitaciones del informe |

### 4.2 Reproducibilidad

Para que un evaluador externo pueda reproducir o auditar el estudio:

- Todos los instrumentos están versionados en el repositorio (`docs/atam/instrumento-encuesta.md`, `docs/atam/protocolo-encuesta.md`)
- Los datos crudos anonimizados de la encuesta se publican como anexo del informe (CSV)
- El plan de análisis estadístico se define **antes** de recibir las respuestas (`docs/atam/plan-analisis-encuesta.md`) para prevenir HARKing (Hypothesizing After Results are Known)
- El consentimiento informado y los criterios de inclusión son auditables
- El código de análisis estadístico es un notebook Python versionado

---

## 5. Limitaciones reconocidas

Esta sección anticipa las críticas legítimas y las reconoce explícitamente para que el informe final pueda discutirlas con honestidad académica:

1. **Sin componente conversacional dinámico.** ATAM-original genera trade-offs no anticipados por la fricción conversacional entre stakeholders. La adaptación asincrónica pierde esa capacidad. Las preguntas abiertas de la encuesta la sustituyen parcialmente pero no equivalentemente.

2. **El panel valida, no co-construye.** En ATAM-original los hallazgos emergen de la discusión. Aquí los hallazgos los produce el autor y el panel los valida o rechaza. Esto introduce un sesgo de anclaje: los expertos ven la propuesta antes de formar opinión.

3. **Sin representación real del cliente o usuario final.** Los casos de estudio son simulados; no hay dueños de producto reales con preferencias formadas sobre los trade-offs.

4. **Dependencia de la calidad del material de apoyo.** Si el PDF de 4 páginas o el video de 5 minutos no transmiten adecuadamente el problema y la propuesta, las respuestas del panel pierden validez. Mitigación: pilotaje con 2-3 personas antes de difundir.

5. **Tamaño muestral no garantizado.** La participación en encuestas académicas voluntarias es típicamente baja (10–30 %). No hay garantía de alcanzar N ≥ 15 + 3 expertos.

Estas limitaciones se reportan en la sección "Limitaciones del estudio" del informe ATAM y se relacionan con líneas de trabajo futuro (e.g., aplicación de la metodología en un caso productivo real con stakeholders genuinos).

---

## 6. Cierre

La metodología "ATAM Modificado Asincrónico con Validación Externa por Panel de Expertos" preserva los productos analíticos centrales de ATAM (utility tree, escenarios top-K, sensitivity/tradeoff points, risks/non-risks, scoring) y los enriquece con dos componentes ausentes en una evaluación de escritorio: **evidencia cuantitativa empírica** sobre 8 000 ejecuciones reales del sistema y **validación externa** por un panel de profesionales independientes del autor.

La adaptación es defendible académicamente con base en literatura establecida (Bass et al., 2012; Wohlin et al., 2012; Kitchenham & Pfleeger, 2008; Denzin, 1978) y produce los entregables exigidos por el anteproyecto (R4 — protocolo e informe ATAM) sin pretender que se ha realizado un ATAM canónico, lo cual sería metodológicamente incorrecto.

---

## Referencias

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley. Capítulo 21 — ATAM.
- Denzin, N. K. (1978). *The Research Act: A Theoretical Introduction to Sociological Methods*. McGraw-Hill.
- ISO/IEC 25010:2011. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*.
- Kazman, R., Klein, M. & Clements, P. (2000). *ATAM: Method for Architecture Evaluation*. Technical Report CMU/SEI-2000-TR-004. Software Engineering Institute, Carnegie Mellon University.
- Kitchenham, B. & Pfleeger, S. L. (2008). Personal Opinion Surveys. In *Guide to Advanced Empirical Software Engineering* (pp. 63–92). Springer.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Wohlin, C., Runeson, P., Höst, M., Ohlsson, M. C., Regnell, B. & Wesslén, A. (2012). *Experimentation in Software Engineering*. Springer. Capítulo 8 — Personal Opinion Surveys / Cualitativos.
