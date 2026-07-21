# ADR-MF-004 — Adaptación de ATAM al contexto de investigación individual con validación externa por panel de expertos

**Nivel:** Micro-framework (aplica a la metodología de evaluación arquitectónica del proyecto)
**Fecha:** 2026-05-07
**Estado:** Aceptado
**Atributo de calidad:** Trazabilidad / Validez metodológica
**Reglas relacionadas:** ninguna (decisión metodológica del proyecto, no de los flujos)

---

## Contexto

El anteproyecto MGADS establece como objetivo específico OE3 *"aplicar un protocolo de evaluación arquitectónica basado en ATAM que permita analizar y comparar impactos, riesgos y compromisos de diseño entre las arquitecturas as-is y to-be"*. El método ATAM original (Kazman, Klein & Clements, 2000; Bass, Clements & Kazman, 2012) es un proceso colaborativo de 9 pasos diseñado para ejecutarse en talleres presenciales con participación simultánea de **stakeholders heterogéneos**: arquitectos del sistema, dueño de producto, equipo de desarrollo, operaciones, seguridad y representantes del cliente o usuario final. Las dos sesiones canónicas (1 día cada una) requieren entre 8 y 15 participantes que generan escenarios, los priorizan por consenso, analizan los approaches arquitectónicos y producen colectivamente la lista de riesgos y trade-offs.

Este proyecto presenta una restricción estructural insalvable: es un trabajo de grado individual desarrollado por un único investigador, sin equipo de proyecto ni cliente real disponibles para realizar las sesiones colaborativas que ATAM-original demanda. Aplicar literalmente ATAM en este contexto produciría una evaluación monovaluada (un único punto de vista — el del autor) que sería metodológicamente débil tanto por el sesgo del evaluador único como por la imposibilidad de generar el componente conversacional que distingue a ATAM de un análisis de escritorio.

Es necesario fijar una decisión metodológica que (i) preserve los elementos analíticos centrales de ATAM — utility tree, identificación de sensitivity/tradeoff points, risks, non-risks y scoring por escenario — y simultáneamente (ii) compense la ausencia del componente multi-stakeholder con un mecanismo de validación externa que reduzca el sesgo del evaluador único y dote al estudio de credibilidad académica defendible ante el jurado.

---

## Decisión

Se adopta una variante denominada **"ATAM Modificado Asincrónico con Validación Externa por Panel de Expertos"** que conserva los 9 pasos de ATAM-original pero los reordena y opera de forma asincrónica, y reemplaza la dinámica de taller multi-stakeholder por una combinación de tres fuentes de evidencia que se triangulan:

1. **Evidencia documental.** La arquitectura, las decisiones (19 ADRs) y los approaches están documentados en el repositorio con trazabilidad RF → ADR → ISO 25010 → escenario ATAM. Esto sustituye al "Paso 3 — Presentar arquitectura" del ATAM presencial.

2. **Evidencia cuantitativa empírica.** Los 12 escenarios del utility tree tienen medidas de respuesta operacionales recolectadas en 8 000 corridas reales sobre la plataforma (4 000 as-is + 4 000 to-be), 12 Change Requests medidos, ejecuciones runtime de IOT-Q4 e IOT-Q5, análisis MTTD y validación estática del validador `validar-flujos.mjs`. Esto sustituye al "Paso 8 — Re-analizar approaches" donde en ATAM-original la discusión grupal refina el análisis.

3. **Validación externa por panel de expertos** (componente compensatorio clave). Se ejecuta una encuesta corta y concisa (10–12 min) dirigida a profesionales senior de desarrollo de software, arquitectura, DevOps, seguridad y QA, acompañada de un mini-ATAM opcional (15 min adicionales) para un sub-panel de 3 a 5 expertos seleccionados. Esto sustituye al "Paso 9 — Presentar resultados" e introduce voces externas al autor que verifican o cuestionan las conclusiones del análisis.

El producto final de R4 (informe ATAM) integra las tres fuentes en un único capítulo donde cada hallazgo (sensitivity point, tradeoff point, risk, non-risk) cita explícitamente su evidencia documental, cuantitativa y de validación externa.

---

## Alternativas consideradas

- **ATAM completo con stakeholders simulados:** invitar a 3–5 colegas a representar roles ficticios (cliente, ops, dev) en una sesión de un día. Descartada porque los participantes carecen de contexto real del dominio (negocios LC/NC reales) y la simulación introduciría ruido sin compensar el sesgo del evaluador único; adicionalmente la coordinación de 5 personas durante un día completo no es viable dentro del cronograma.

- **Evaluación interna pura sin validación externa:** ejecutar solo los pasos analíticos de ATAM (utility tree, scoring, riesgos) sin componente externo. Descartada porque preserva el sesgo del evaluador único sin mitigación, debilitando la validez externa del estudio frente a Wohlin et al. (2012) que recomienda triangulación cuando hay un único investigador.

- **Reemplazo total por SAAM (Software Architecture Analysis Method):** método predecesor más liviano, centrado en modificabilidad. Descartada porque SAAM no captura tradeoff points multi-atributo que sí están en juego (e.g., latencia ↑ vs modularidad ↑ en IoT to-be) y porque el anteproyecto comprometió explícitamente ATAM, no SAAM.

- **Encuesta amplia sin componente analítico interno:** solo recolectar opiniones externas sin producir el utility tree, scoring ni clasificación SP/TP/R/NR por el autor. Descartada porque el panel de expertos no tiene acceso al nivel de detalle de los ADRs ni del código para realizar un análisis completo en pocos minutos; el rol del panel es validar el análisis del autor, no producirlo desde cero.

---

## Consecuencias

**Positivas:**

- Preserva los entregables formales de ATAM exigidos por el anteproyecto (utility tree, escenarios top-K, matriz de scoring, registro de riesgos y trade-offs) sin diluir el rigor analítico.
- Mitiga el sesgo del evaluador único mediante **triangulación metodológica** (Denzin, 1978): tres fuentes independientes (documentación, métricas, expertos externos) convergen sobre cada hallazgo.
- Producible dentro de la restricción de tiempo y recursos del proyecto individual: ~7 días de análisis + ~3 semanas de recolección de encuesta asincrónica.
- Defendible académicamente con referencias explícitas a literatura sobre ATAM lightweight (Bass et al., 2012, cap. 21), expert opinion surveys (Wohlin et al., 2012, cap. 8) y guías de encuesta de opinión personal en ingeniería de software empírica (Kitchenham & Pfleeger, 2008).
- Genera un dataset reutilizable: las respuestas anonimizadas del panel quedan como anexo del trabajo y son insumo natural para una publicación derivada (CLEI, JISBD, IEEE LATAM).

**Negativas / trade-offs:**

- El componente de validación externa depende del tamaño y heterogeneidad del panel efectivamente reclutado. Si N < 15 respondentes o no se logran ≥ 3 expertos en el mini-ATAM, los análisis estadísticos (Cronbach's α, Cohen's κ) pierden potencia y los resultados deben presentarse como exploratorios. Mitigación: definir tamaño muestral mínimo de aceptación y reportar honestamente las limitaciones.
- La asincronía elimina el componente conversacional original de ATAM que a veces revela trade-offs no anticipados; los expertos no se confrontan entre sí. Mitigación: incluir preguntas abiertas que capturen reacciones individuales y reportar las divergencias encontradas.
- Las respuestas del panel pueden llegar después del cierre del informe; el capítulo §8 del informe ATAM se redacta con un placeholder explícito y se completa al recibir los datos. Mitigación: el informe se redacta con sección 8 modular para integración posterior sin reescritura.
- La adaptación requiere documentación adicional (este ADR + `metodologia-atam-adaptada.md`) para que el jurado pueda evaluar la rigurosidad de la adaptación. Mitigación: producir ambos documentos antes del cierre del informe.

---

## Relación con el micro-framework

Esta decisión es **metodológica del proyecto**, no normativa para los flujos n8n. No introduce reglas (REG-*) ni patrones nuevos en el micro-framework. Su relación con el resto del proyecto es:

- Define cómo se evalúa el cumplimiento del micro-framework v1.0 sobre los casos de estudio.
- Establece el procedimiento que produce R4 (entregable "Protocolo e informe ATAM" del anteproyecto).
- Documenta para el jurado por qué la evaluación no sigue la coreografía presencial de ATAM-original.
- Referencia cruzada operativa:
  - `atam/metodologia-atam-adaptada.md` — desarrollo completo de la adaptación
  - `atam/informe-atam-final.md` — aplicación de la metodología
  - `atam/protocolo-encuesta.md` — procedimiento del componente de validación externa
  - `atam/atam-utility-tree.md` — utility tree preservado del ATAM-original
  - `medicion/consolidado/atam-evidencia.md` — matriz de evidencia cuantitativa
