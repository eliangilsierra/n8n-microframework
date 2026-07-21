> 🌐 **Idioma / Language:** Español · [English](protocolo-encuesta.en.md)

# Protocolo de Encuesta — Validación Externa por Panel de Expertos

**Versión:** 1.0
**Fecha:** 2026-05-07
**Marco metodológico:** [`metodologia-atam-adaptada.md`](metodologia-atam-adaptada.md) — Fase V
**Propósito:** Definir las reglas operacionales para la recolección de evidencia externa que valide el análisis ATAM del autor. Este documento es auditable por el director de tesis y el jurado para verificar la integridad metodológica del componente de validación.

---

## 1. Objetivo de la encuesta

Validar externamente el análisis ATAM del autor (sensitivity points, tradeoff points, risks, non-risks y scoring 1–5 as-is/to-be) recogiendo opiniones independientes de profesionales senior de la industria del software que actúan como **revisores por pares no especializados** en el dominio específico del proyecto pero competentes en arquitectura de software, DevOps, seguridad o QA.

Pregunta de investigación que la encuesta responde:

> ¿Las decisiones arquitectónicas, los trade-offs y los riesgos identificados por el autor en el análisis ATAM son reconocibles, comprensibles y defendibles para un panel de profesionales de software independientes del autor?

La encuesta **no** pretende validar la calidad técnica del código n8n exportado (eso lo hace la validación estática). La encuesta valida que el **razonamiento arquitectónico** del autor es sensato desde una mirada externa con experiencia profesional.

---

## 2. Población y muestreo

### 2.1 Población objetivo

Profesionales activos en desarrollo, arquitectura, operaciones, seguridad o aseguramiento de calidad de software, con experiencia profesional verificable, sin restricción geográfica.

### 2.2 Criterios de inclusión

Para que una respuesta sea considerada válida, el respondente debe cumplir **todos** los siguientes criterios (auto-reportados en la Sección A del instrumento):

| Criterio | Verificación |
|---|---|
| Edad ≥ 18 años | Implícito por contexto profesional |
| Experiencia profesional en desarrollo de software ≥ 3 años | Pregunta A2 (filtro automático) |
| Rol actual o previo en alguno de: desarrollo, arquitectura, DevOps, seguridad, QA, gestión técnica | Pregunta A1 |
| Familiaridad mínima con conceptos de automatización, integración o flujos de procesos | Implícita en el rol; verificada por A3 |
| Consentimiento informado otorgado | Aceptación obligatoria en pantalla previa al cuestionario |

### 2.3 Criterios de exclusión

- Sin experiencia profesional en software (e.g., estudiantes de pregrado sin experiencia laboral) — excluidos por filtro en A2.
- Familiares directos del autor (primer grado) — declarado voluntariamente; conflicto de interés.
- Respondentes que completen el cuestionario en menos de 5 minutos — sospecha de respuesta no reflexiva; las respuestas se reportan separadas como "respuestas rápidas" y se excluyen del análisis principal.

### 2.4 Tamaños muestrales objetivo

| Nivel | Mínimo | Deseable | Justificación |
|:---:|:---:|:---:|---|
| **Nivel 1 — Encuesta amplia** | 15 | 25–30 | Bajo umbral mínimo para estadística descriptiva con desviación estándar interpretable; Cronbach's α requiere N ≥ 10 para ser estable |
| **Nivel 2 — Mini-ATAM (subset)** | 3 | 5 | Saturación teórica cualitativa (Strauss & Corbin, 1990); inter-rater agreement con 3 evaluadores soporta Krippendorff's α o Fleiss' κ |
| **Heterogeneidad** | 3 roles distintos | 5 roles distintos | Triangulación entre perspectivas (desarrollo, ops, seguridad, etc.) |

El umbral mínimo de 15 respondientes válidos se sustenta en cuatro argumentos convergentes:

| Criterio | Fundamento del umbral |
|---|---|
| Estabilidad de coeficientes de fiabilidad | Los coeficientes de consistencia interna requieren N ≥ 10 para estimaciones estables; n ≥ 15 deja margen ante exclusiones. |
| Interpretabilidad de la dispersión | Con n < 10 la dispersión de una escala Likert es inestable; desde ~15 casos la estadística descriptiva adquiere lectura interpretable. |
| Convención de paneles de validación por expertos | El rango usual de jueces en validación por panel se sitúa entre 5 y 15; n = 15 se ubica en su extremo superior. |
| Heterogeneidad mínima | Una triangulación significativa exige ≥ 3 roles distintos y representación de los tres buckets de experiencia (3–5, 5–10, >10 años). |

La exigencia de más de 3 años de experiencia responde a un criterio de competencia: evaluar
compromisos arquitectónicos como mantenibilidad frente a latencia, idempotencia ante
reintentos o gestión de secretos en producción presupone exposición previa a sistemas en
operación. Un profesional con menos de 3 años rara vez ha enfrentado los antipatrones que
el as-is representa, por lo que su juicio sobre la severidad del diseño original carecería
de anclaje empírico.

### 2.5 Estrategia de muestreo

Muestreo **intencional de conveniencia** combinado con bola de nieve:

- **Conveniencia.** Invitación directa a contactos profesionales del autor en LinkedIn, colegas del trabajo actual y anterior, compañeros y profesores de la MGADS-UNAB.
- **Bola de nieve controlada.** Se solicita a respondentes que reenvíen la invitación a hasta 2 colegas que cumplan los criterios de inclusión, con instrucción explícita de no presionar la participación.

**Limitación reconocida:** este tipo de muestreo no es probabilístico y los resultados no son generalizables a la población global de profesionales de software. La encuesta produce evidencia **descriptiva y exploratoria**, no inferencial. Esta limitación se reporta explícitamente en la sección de limitaciones del informe ATAM.

---

## 3. Consentimiento informado

El siguiente texto se presenta como **primera pantalla obligatoria** del formulario. La continuación al cuestionario requiere marcar explícitamente la casilla de aceptación.

```
═══════════════════════════════════════════════════════════════════════════════

CONSENTIMIENTO INFORMADO
Validación externa del micro-framework LC/NC para n8n

Esta encuesta forma parte del trabajo de grado de la Maestría en Gestión,
Aplicación y Desarrollo de Software (MGADS) de la Universidad Autónoma de
Bucaramanga (UNAB), Colombia. Dirigido por Sebastian Roa Prada, PhD.

OBJETIVO
Validar externamente un micro-framework arquitectónico para flujos
Low-Code/No-Code en la plataforma n8n, fundamentado en principios de Clean
Architecture y prácticas DevSecOps. Su opinión experta complementa la
evaluación analítica del autor y forma parte del componente de validación
externa de la evaluación ATAM (Architecture Tradeoff Analysis Method) aplicada
al proyecto.

TIEMPO ESTIMADO
- Encuesta principal: 10 a 12 minutos
- Sección opcional mini-ATAM (solo para expertos): 15 minutos adicionales

ANONIMATO Y CONFIDENCIALIDAD
No se solicitan datos que permitan identificarle individualmente (nombre,
correo, empresa, documento). Solo se solicita información demográfica
agregada (rol, años de experiencia, familiaridad con tecnologías). Las
respuestas se procesan agregadas y se publican como estadísticas descriptivas
en el documento final.

USO DE LOS DATOS
Los datos se utilizan exclusivamente con fines académicos para el trabajo de
grado mencionado. Las respuestas anonimizadas pueden incluirse como anexo
del documento final y, eventualmente, ser insumo de una publicación derivada
en revista académica indexada o congreso, siempre manteniendo el anonimato.

VOLUNTARIEDAD
Su participación es completamente voluntaria. Puede abandonar la encuesta
en cualquier momento simplemente cerrando la ventana del navegador, sin
necesidad de explicación. No hay consecuencias por no participar.

DERECHOS DEL PARTICIPANTE
Si desea solicitar la eliminación de sus respuestas después de enviarlas,
puede contactar al autor mediante el correo proporcionado al final del
formulario y se procederá según su solicitud, siempre que sea técnicamente
posible identificar sus respuestas dentro del conjunto agregado.

CONTACTO
Elian Hernando Gil Sierra
Estudiante MGADS - UNAB
Correo: [correo del autor]

═══════════════════════════════════════════════════════════════════════════════

[ ] He leído, comprendido y acepto las condiciones anteriores. Confirmo que
    tengo al menos 18 años de edad y que mi participación es voluntaria.

[Continuar a la encuesta]   [Cancelar y salir]
```

---

## 4. Procedimiento

### 4.1 Flujo completo del respondente

```
1. Recibe invitación con enlace al material de apoyo + enlace al formulario
   ↓
2. (Recomendado) Revisa material de apoyo asincrónicamente:
   - PDF resumen ejecutivo de 4 páginas (5 min)
   - Video corto de 5 minutos
   ↓
3. Abre el formulario Google Forms
   ↓
4. Pantalla 1: Consentimiento informado → acepta
   ↓
5. Sección A: Caracterización (5 preguntas, 1.5 min)
   ↓
6. Sección B: Validación percibida (8 ítems Likert, 5 min)
   ↓
7. Sección C: Riesgos y trade-offs (3 preguntas abiertas, 3 min)
   ↓
8. Sección D: Percepción global (2 preguntas, 1 min)
   ↓
9. (Opcional, solo para invitados expertos) Sección E: Mini-ATAM (15 min)
   - Scoring as-is/to-be por escenario
   - Clasificación SP/TP/R/NR
   ↓
10. Pantalla de cierre: agradecimiento + opción de recibir resumen de
    resultados por correo (campo opcional)
   ↓
11. Envío → datos almacenados en Google Forms / Sheets
```

### 4.2 Tiempo total

- **Solo encuesta principal:** ~15 minutos incluyendo lectura del material y consentimiento.
- **Encuesta + mini-ATAM:** ~30 minutos.

### 4.3 Plataforma técnica

| Aspecto | Decisión | Razón |
|---|---|---|
| Plataforma | Google Forms | Gratuita, ampliamente conocida, exporta a Google Sheets y CSV |
| Mini-ATAM | Sección condicional en el mismo formulario + invitación explícita para los 3–5 expertos seleccionados | Reduce fricción vs formulario separado |
| Almacenamiento | Google Sheets vinculado al Form | Respuestas en tiempo real, exportable a CSV para análisis Python |
| Hospedaje del material | Google Drive público (PDF) + Loom o YouTube no listado (video) | Acceso directo sin login |

### 4.4 Cronograma de la campaña

| Día | Actividad |
|:---:|---|
| 0 | Cierre del diseño del instrumento + pilotaje con 2–3 personas + ajustes |
| 1 | Envío de primera ola de invitaciones (~30 contactos directos) |
| 7 | Primer recordatorio a no respondentes + segunda ola (bola de nieve) |
| 14 | Segundo recordatorio + invitación expresa a expertos para Sección E |
| 21 | Cierre formal de recolección (mantener abierto pero no esperar más respuestas) |
| 22-26 | Análisis estadístico (`plan-analisis-encuesta.md`) |
| 27-28 | Integración de hallazgos en §8 del informe ATAM |

**Total: ~4 semanas desde lanzamiento hasta integración en informe.**

**Ejecución real.** La recolección de la Fase V se realizó del 17 al 24 de junio de 2026,
canalizada a través del departamento de TI de una organización del sector (~200
profesionales con el perfil objetivo identificados). Los resultados de esta ejecución
(perfil del panel, N recolectado/válido, valoraciones por sección) se documentan en
`informe-atam-final.md` §8, ya completado.

---

## 5. Gestión de datos

### 5.1 Almacenamiento

- **Datos crudos:** Google Sheets vinculado al Form, accesible solo por el autor.
- **Copia anonimizada:** exportación CSV a `medicion/encuesta-validacion/respuestas-anonimizadas-{YYYY-MM-DD}.csv` (commiteable al repo solo si no contiene datos identificables).
- **Datos identificables (correo opcional de seguimiento):** mantenidos separados en hoja aparte, **no commiteados** al repo, eliminados tras envío del resumen de resultados.

### 5.2 Anonimización

Antes de incluir el CSV en el repositorio o en el anexo del documento final:
- Verificar que no haya campos de texto abierto con datos identificables (nombres propios, nombres de empresa, correos)
- Si los hay, redactar a `[REDACTED]` antes de publicar
- Asignar `respondent_id` secuencial (R-001, R-002…) que reemplace cualquier identificador

### 5.3 Retención

- Datos crudos y anonimizados: retenidos indefinidamente como anexo del trabajo de grado
- Datos identificables (correos): eliminados máximo 60 días después del cierre de la recolección

### 5.4 Acceso

- **Autor:** acceso completo a datos crudos
- **Director de tesis:** acceso a datos anonimizados a solicitud, para auditoría metodológica
- **Jurado:** acceso a datos anonimizados como anexo del documento final
- **Terceros:** sin acceso

---

## 6. Análisis de datos

El plan detallado está en [`plan-analisis-encuesta.md`](plan-analisis-encuesta.md). Resumen del enfoque:

| Sección | Tipo de análisis |
|---|---|
| A. Caracterización | Frecuencias, distribución por rol, experiencia, familiaridad |
| B. Validación percibida | Descriptiva por ítem (media, mediana, σ); Cronbach's α por grupo de ítems si N ≥ 15 |
| C. Riesgos y trade-offs | Codificación temática abierta (Strauss & Corbin); tabla de frecuencia de categorías; citas representativas |
| D. Percepción global | Distribución del score 1–10; análisis cualitativo de justificaciones |
| E. Mini-ATAM | Comparación scoring as-is/to-be vs scoring del autor; inter-rater agreement (Cohen's κ o Krippendorff's α) |

---

## 7. Criterios de aceptación del estudio

El componente de validación externa se considera **aceptable para reporte cuantitativo** si se cumplen todos los siguientes umbrales al cierre de la recolección:

| Criterio | Umbral |
|---|---|
| N total Sección A-D | ≥ 15 respondentes |
| Heterogeneidad de roles | ≥ 3 roles distintos representados |
| Tasa de completitud (respondentes que llegan a D2) | ≥ 80 % |
| Mini-ATAM (Sección E) | ≥ 3 respondentes |
| Tiempo mediano de respuesta | ≥ 7 min (descartar respuestas rápidas no reflexivas) |

Si alguno de los umbrales no se cumple, el componente se reporta como **evidencia exploratoria** y se discute la limitación explícitamente en el informe; las conclusiones se matizan acorde.

---

## 8. Pilotaje

**Antes** de la difusión amplia, el instrumento se pilota con 2–3 personas seleccionadas para evaluar:

1. **Claridad del lenguaje.** ¿Las preguntas son comprensibles sin necesidad de explicación adicional?
2. **Tiempo real de respuesta.** ¿Coincide con la estimación de 10–12 min?
3. **Calidad del material de apoyo.** ¿El PDF de 4 páginas y el video de 5 min son suficientes para responder con criterio?
4. **Funcionamiento técnico.** ¿Los enlaces funcionan, las lógicas condicionales (Sección E opcional) operan correctamente?
5. **Sesgos de redacción.** ¿Alguna pregunta induce respuesta?

Los pilotos no se cuentan en la muestra final. Los hallazgos del pilotaje se documentan en una sección breve "Ajustes post-pilotaje" del informe ATAM.

### Ajustes post-pilotaje

El pilotaje sobre la versión inicial del instrumento (v1.0, ~75 ítems visibles, 25–35 min)
identificó cuatro categorías de problemas, documentados formalmente y usados para refactorizar
el instrumento a la versión 2.0 especificada en `instrumento-encuesta.md`:

1. **Extensión excesiva.** El formulario completo, incluida la Sección E (48 ítems individuales
   — 12 escenarios × 4 preguntas cada uno), representaba un tiempo real de respuesta de
   25 a 35 minutos, muy por encima del umbral de 15 minutos recomendado para encuestas de
   validación académica voluntarias.
2. **Carga cognitiva en la Sección E.** Cada uno de los 12 escenarios del mini-ATAM presentaba
   título, estímulo, respuesta esperada, resultado medido y cuatro preguntas — un volumen de
   información propio de un taller ATAM presencial con moderador, no de un formulario
   autodirigido.
3. **Subutilización de los tipos de control de Google Forms.** El instrumento original usaba
   exclusivamente escalas lineales individuales, sin aprovechar el tipo "cuadrícula de varias
   opciones" que permite agrupar varios ítems de la misma escala en una sola pregunta visual.
4. **Textos de fila demasiado largos.** Al intentar consolidar en cuadrículas, los textos de
   fila originales (150–300 caracteres) se apilaban verticalmente y degradaban la lectura,
   especialmente en móviles.

**Principio rector de los ajustes:** reducir la fricción cognitiva del respondiente sin
sacrificar la validez de los datos recolectados. Los seis cambios concretos aplicados —
consolidar A3+A4+A5 en una cuadrícula, consolidar B1–B8 en 4 cuadrículas temáticas, acortar
todos los textos de fila a ≤ 70 caracteres, refactorizar la Sección E de 48 ítems a 3
cuadrículas de 12 filas + una tabla de referencia visual (imagen), simplificar los textos
de ayuda de la Sección C, y consolidar las instrucciones del mini-ATAM en una imagen — se
detallan en `instrumento-encuesta.md` (sección "Evolución del instrumento" y estructura de
las Secciones A, B, C y E).

**Impacto en la validez del instrumento** (evaluado por tipo):

| Tipo de validez | Impacto | Justificación |
|---|---|---|
| Validez de contenido | Neutro | Los mismos constructos y atributos ISO 25010 están representados; no se eliminó ningún ítem sustantivo. |
| Validez de constructo | Positivo leve | Eliminar los contextos de ayuda con cifras específicas reduce el sesgo de anclaje. |
| Validez interna | Positivo | Un instrumento más corto reduce la fatiga del respondiente, mejorando la calidad de las respuestas al final del formulario. |
| Validez de criterio | Neutro | Los datos recolectados (scores 1–5, clasificación, respuestas abiertas) son idénticos; el análisis estadístico opera sobre los mismos valores. |
| Validez externa | Positivo | Un instrumento menos intimidante puede incrementar la tasa de participación y reducir la auto-selección de respondentes. |

**Resultado cuantificado:** de ~75 a ~25 ítems visibles (−67 %), de 25–35 a 16–20 minutos de
duración total (−40 % aprox.), sin pérdida de información recolectada.

**Limitaciones que la refactorización no elimina** (reconocidas explícitamente): el panel
valida pero no co-construye los hallazgos, lo que introduce un sesgo de anclaje que ninguna
refactorización del formulario puede eliminar por completo; el muestreo sigue siendo no
probabilístico por conveniencia; la calidad de las respuestas queda condicionada a que el
respondiente haya revisado el material de apoyo, condición que el formulario refactorizado
asume más explícitamente que el original; y respondientes con baja familiaridad con ATAM
(A5 < 3) pueden tener dificultad para completar la Sección E incluso con las instrucciones
simplificadas — mitigado por el carácter opcional de esa sección.

---

## 9. Limitaciones metodológicas reconocidas

Para reportar en la sección de limitaciones del informe ATAM:

1. **Muestreo no probabilístico.** Conveniencia + bola de nieve. Los resultados no son generalizables; son exploratorios y descriptivos.
2. **Posible sesgo del respondente cercano al autor.** Una proporción de respondentes son colegas o conocidos profesionales del autor, lo que puede sesgar positivamente la evaluación. Mitigación: incluir bola de nieve para alcanzar contactos de segundo grado y reportar la proporción.
3. **Sesgo de anclaje.** Los respondentes ven el material del autor antes de formar opinión, lo que ancla sus respuestas en el marco propuesto. Mitigación: incluir preguntas abiertas (Sección C) que permitan respuestas no anticipadas.
4. **Falta de validación de expertise.** El nivel de expertise se auto-reporta y no se verifica. Mitigación: solicitar rol y años de experiencia, y triangular con la calidad técnica de las respuestas abiertas.
5. **Limitación del formato asincrónico.** No hay discusión grupal que enriquezca hallazgos (limitación inherente a la adaptación de ATAM declarada en ADR-MF-004).

---

## 10. Aspectos éticos

- **Sin riesgos físicos o psicológicos** para los participantes; encuesta cognitiva de baja carga.
- **Sin compensación monetaria** ni en especie para no introducir sesgos por incentivo.
- **Sin datos sensibles** recolectados (no se pregunta salario, empresa específica, datos de identificación legal).
- **Consentimiento explícito** previo al cuestionario.
- **Derecho a retiro** garantizado.
- **Trabajo de grado de Maestría sin requisito formal de IRB** en UNAB para este tipo de encuesta no clínica de bajo riesgo. Se sigue buena práctica investigativa equivalente.

---

## Referencias

- Kitchenham, B. & Pfleeger, S. L. (2008). Personal Opinion Surveys. In *Guide to Advanced Empirical Software Engineering* (pp. 63–92). Springer.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer. Cap. 8 — Personal Opinion Surveys.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Krippendorff, K. (2018). *Content Analysis: An Introduction to Its Methodology* (4th ed.). Sage.
