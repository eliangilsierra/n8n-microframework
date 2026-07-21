> 🌐 **Idioma / Language:** Español · [English](instrumento-encuesta.en.md)

# Instrumento de Encuesta — Validación Externa del Micro-framework LC/NC

**Versión:** 2.0 — versión refactorizada, ejecutada en campo
**Fecha:** 2026-06-17 (apertura de recolección; ver §Evolución del instrumento)
**Plataforma sugerida:** Google Forms (o Microsoft Forms equivalente)
**Duración estimada:** 10–12 min (encuesta principal) · +15 min (mini-ATAM opcional)
**Protocolo:** [`protocolo-encuesta.md`](protocolo-encuesta.md)
**Propósito:** Especificación canónica de cada pregunta, su tipo, opciones, lógica condicional y validaciones para que la persona que configure el formulario tenga toda la información en un único documento. Este archivo es la fuente de verdad — el Google Form debe construirse exactamente igual a esta especificación.

---

## Evolución del instrumento: del piloto a la versión refactorizada

El instrumento atravesó una refactorización documentada, motivada por la baja tasa de respuesta observada en la versión inicial (v1.0): con aproximadamente 75 ítems visibles y una duración de 25 a 35 minutos, esa versión inducía abandono y fatiga en los respondentes piloto.

La refactorización se guio por un único principio — reducir la fricción cognitiva del respondiente sin sacrificar la validez de los datos — y se materializó en tres decisiones concretas:

1. **Consolidación de ítems en cuadrículas** por constructo y atributo ISO/IEC 25010 (en lugar de una pregunta independiente por afirmación).
2. **Externalización de las cifras del estudio** a un resumen ejecutivo en PDF de lectura previa (ver [`material-apoyo/guia-referencia-tecnica.md`](material-apoyo/guia-referencia-tecnica.md)), lo que además atenúa el sesgo de anclaje al separar la exposición a los datos de la respuesta a cada ítem.
3. **Tabla de referencia visual** para los doce escenarios del mini-ATAM, en lugar de exigir que el respondente reconstruya el contexto de cada escenario a partir de texto corrido.

El resultado fue una reducción a aproximadamente 25 ítems y 16 a 20 minutos de duración, sin pérdida de información relevante para el análisis posterior. Esta es la versión especificada en el resto de este documento.

En coherencia con el mismo principio de reducir la fricción, la clasificación arquitectónica de la Sección E (pregunta `.c` por escenario) se capturó con la **misma escala de soporte de cinco puntos** usada en `.a`/`.b`, en lugar de exigir que el respondente domine y aplique directamente las cuatro categorías ATAM (Non-risk / Sensitivity Point / Tradeoff Point / Risk), cuya distinción no es trivial para quien no tiene formación previa en ATAM. La categoría se recupera mediante una equivalencia definida *a priori*, antes de la recolección:

| Nivel de soporte marcado | Categoría ATAM recuperada |
|:---:|---|
| 1 — No soportado / antipatrón activo | R (Riesgo) |
| 2 — Soporte débil / comportamiento inconsistente | R (Riesgo) |
| 3 — Soporte moderado / sin garantías formales | SP (Sensitivity Point) |
| 4 — Buen soporte / evidencia operacional | TP (Tradeoff Point) |
| 5 — Excelente / medida del escenario cumplida | NR (No-riesgo) |

Esta operacionalización reduce la barrera de entrada del respondiente a costa de imponer una lectura ordinal sobre categorías que en ATAM son cualitativas; sus implicaciones de validez se discuten en el informe ATAM final (§8 y §11 de limitaciones).

> ⚠️ Este documento especifica la versión 2.0, ya refactorizada y ejecutada. Los resultados de la recolección (perfil del panel, valoraciones por ítem, triangulación del scoring y clasificación) se documentan en `informe-atam-final.md` §8, ya completado con los datos de la encuesta.

---

## Configuración global del formulario

| Parámetro | Valor |
|---|---|
| Título del formulario | Validación externa — Micro-framework LC/NC para n8n · MGADS-UNAB 2026 |
| Recolección de correos | DESACTIVADA (preserva el anonimato del respondente) |
| Barra de progreso | ACTIVADA (reduce la tasa de abandono al mostrar el avance) |
| Permitir editar respuestas | ACTIVADA (permite correcciones antes del envío definitivo) |
| Orden de las preguntas dentro de cada sección | NO aleatorizar (el orden lógico de las secciones es parte del diseño) |
| Color del tema | Azul oscuro o gris sobrio (evitar colores llamativos que sugieran sesgo positivo) |
| Mensaje de confirmación al enviar | Texto de agradecimiento + nombre del autor (ver "Pantalla final" más abajo) |

---

## Pantalla 0 — Consentimiento informado

**Tipo:** Portada con texto informativo + 1 pregunta obligatoria.

**Texto de la sección:**

> Usted está siendo invitado(a) a participar en la validación externa de un micro-framework
> arquitectónico para flujos Low-Code/No-Code (LC/NC) en n8n, como parte de un trabajo de
> grado de la Maestría en Gestión, Aplicación y Desarrollo de Software (MGADS) — UNAB · 2026.
>
> **¿Para qué sirve su participación?**
> Su criterio complementa el análisis arquitectónico del autor siguiendo el método ATAM
> (Architecture Tradeoff Analysis Method) adaptado al contexto individual.
>
> **Confidencialidad:** No se solicitan datos de identificación. Solo información demográfica
> agregada. Los resultados se publican únicamente como estadísticas agrupadas.
>
> **Voluntariedad:** Puede cerrar el formulario en cualquier momento sin consecuencias.
>
> Contacto: Elian Hernando Gil Sierra · [correo del autor]
> Director: Sebastian Roa Prada, PhD — UNAB

Texto legal completo (consentimiento informado extendido): ver [`protocolo-encuesta.md`](protocolo-encuesta.md) §3.

**Pregunta única de esta pantalla:**

> **P0.** ¿Acepta participar bajo las condiciones descritas?
>
> Tipo: opción única (obligatoria)
> Opciones:
> - Sí, he leído las condiciones y acepto participar
> - No, prefiero no participar en este momento
>
> Lógica: "No" → ir a pantalla final · "Sí" → continuar a Sección 1.

---

## Sección 1 — Material de apoyo

**Tipo:** Solo texto informativo — sin preguntas.
**Título:** Material de apoyo — léalo antes de continuar.

> 📄 **Resumen ejecutivo** (guía de referencia técnica, PDF · 4 páginas): [ENLACE AL PDF]
> Descripción del problema, framework E1–E4, comparativa as-is vs to-be, métricas y hallazgos ATAM.
> Ver [`material-apoyo/guia-referencia-tecnica.md`](material-apoyo/guia-referencia-tecnica.md) para una versión legible sin necesidad de PDF.
>
> 🎥 **Video de presentación** (5 minutos): [ENLACE AL VIDEO]
> Resumen visual del framework, casos de estudio y métricas principales. Guion en [`material-apoyo/guion-video.md`](material-apoyo/guion-video.md).

Sin preguntas en esta sección. El formulario refactorizado asume explícitamente que el
respondente revisó este material antes de continuar — las Secciones B y E ya no repiten
las cifras del estudio dentro del formulario (ver "Evolución del instrumento" más arriba).

---

## SECCIÓN A — Perfil profesional (4 preguntas · ~2 min)

> Sus datos se reportan únicamente como distribuciones agregadas.

---

**A1. ¿Cuál es su rol principal actual en el desarrollo o gestión de software?**

Tipo: opción única (obligatoria)
Opciones: Desarrollador / Ingeniero de software · Tech Lead · Arquitecto de software ·
DevOps / SRE · Seguridad · QA / Testing · Gerente TI · Estudiante con experiencia · Otro (campo libre)

---

**A2. ¿Cuántos años de experiencia profesional acumulada tiene en roles de desarrollo, arquitectura u operaciones de software?**

Tipo: opción única (obligatoria)
Opciones:
- Menos de 3 años *(descalifica: cierra la encuesta con mensaje de exclusión, o se aplica como filtro post-hoc si no es técnicamente posible cerrarla en el momento — ver `protocolo-encuesta.md` §2.3)*
- Entre 3 y 5 años
- Entre 5 y 10 años
- Más de 10 años

---

**A3-A4-A5 — Nivel de familiaridad (cuadrícula)**

Tipo: cuadrícula de varias opciones (obligatoria — requerir una respuesta por fila)
Filas: Plataformas LC/NC (n8n, Zapier, Make, Power Automate) · Clean Architecture y separación de responsabilidades · Evaluación arquitectónica (ATAM, ISO 25010, ADRs, TOGAF)
Columnas: Ninguna · Baja · Media · Alta · Muy alta

---

## SECCIÓN B — Valoración del micro-framework (4 cuadrículas / 8 ítems · ~4 min)

> Escala común a las 4 cuadrículas: 1 = Totalmente en desacuerdo · 2 = En desacuerdo · 3 = Neutral · 4 = De acuerdo · 5 = Totalmente de acuerdo. Cada cuadrícula exige una respuesta por fila.
>
> Los textos de fila se acortaron a un máximo de 70 caracteres (regla de diseño de Google Forms: filas más largas se apilan verticalmente y degradan la lectura). Los contextos de ayuda con cifras específicas del estudio que existían en la versión inicial del instrumento se eliminaron — el respondente ya revisó esas cifras en el material de apoyo de la Sección 1, y repetirlas en el formulario introduce sesgo de anclaje (ver "Evolución del instrumento").

**Cuadrícula B1–B2 · Mantenibilidad**
- B1 — Las cuatro etapas (E1→E2→E3→E4) mejoran la modularidad del flujo
- B2 — Pasar de ~5 nodos por cambio (as-is) a 1 nodo (to-be) es una mejora verificable

**Cuadrícula B3–B4 · Fiabilidad**
- B3 — Retry con backoff e idempotencia con clave única previenen duplicación de datos
- B4 — Guardar el payload completo en dead-letter es correcto para lecturas IoT irrecuperables

**Cuadrícula B5–B6 · Seguridad y Operabilidad**
- B5 — Gestionar secretos solo vía credenciales nativas de n8n es práctica mínima aceptable
- B6 — El log JSON por etapa permite diagnosticar fallos sin abrir la interfaz de n8n

**Cuadrícula B7–B8 · Aplicabilidad**
- B7 — Las 10 reglas obligatorias (REG-001 a REG-010) son aplicables en proyectos LC/NC reales
- B8 — El framework aporta valor arquitectónico sin imponer complejidad excesiva al desarrollador

---

## SECCIÓN C — Perspectiva crítica (1 pregunta · ~2 min)

> Se buscan perspectivas críticas, no validación. La planeación de la refactorización
> (Decisión 5) contemplaba tres preguntas independientes (C1 riesgo, C2 trade-off, C3
> refinamiento) con textos de ayuda acortados a 50–80 palabras. **La versión efectivamente
> publicada en Google Forms consolidó las tres en una sola pregunta abierta** (confirmado en
> los datos crudos de respuesta), llevando la simplificación un paso más allá de lo
> documentado en la planeación.

---

**C1. ¿Qué observación técnica considera más importante sobre el framework presentado?**

Tipo: párrafo obligatorio · máximo 500 caracteres
Texto de ayuda: *"Puede referirse a riesgos arquitectónicos, trade-offs que le parezcan críticos, reglas que cuestionaría, o aspectos que refinaría. Sea conciso."*

---

## SECCIÓN D — Valoración global (2 preguntas obligatorias + 1 condicional opcional · ~1 min)

> Última sección obligatoria.

---

**D1. En una escala de 1 a 10, ¿cómo califica globalmente el micro-framework propuesto?**

Tipo: escala lineal 1-10 (obligatoria)
Etiqueta 1: Pobre — no lo recomendaría
Etiqueta 10: Excelente — lo adoptaría sin cambios mayores

---

**D2. ¿Adoptaría este framework —o sus principios nucleares— en un proyecto LC/NC actual o futuro de su organización?**

Tipo: opción única (obligatoria)
Opciones:
- Sí, sin modificaciones mayores
- Sí, con adaptaciones a mi contexto
- Tal vez, necesitaría más evidencia
- No lo adoptaría

**Lógica:** ③ "Tal vez" o ④ "No" → mostrar D2-bis (condicional).

**D2-bis. ¿Cuál es la razón principal por la que no lo adoptaría o necesitaría más evidencia?** (opcional)
Tipo: respuesta corta opcional, máximo 300 caracteres

---

## SECCIÓN E — Mini-ATAM (opcional, ~8 min adicionales)

> Completamente opcional. Para profesionales con experiencia en arquitectura de software.

---

**E0. ¿Desea participar?**

Tipo: opción única (obligatoria)
Opciones:
- Sí, deseo participar (~8 minutos adicionales)
- No, prefiero terminar aquí

Lógica: "No" → pantalla final.

---

**Tabla de referencia de escenarios (imagen).** En lugar de un bloque de ~600 palabras describiendo cada escenario en prosa, esta sección incluye una **imagen PNG insertada directamente** (generada en HTML con estilos inline y exportada como imagen, sin dependencias externas) con:
- Tabla 1: los 12 escenarios × 5 columnas (ID · Qué se evalúa · Atributo · AS-IS · TO-BE), codificada por color (rojo as-is, verde to-be).
- Tabla 2: la escala de scoring 1–5 y las definiciones de clasificación NR/SP/TP/R (ver tabla de equivalencia en "Evolución del instrumento").

El texto de instrucciones en el formulario se reduce a 3 líneas + enlace al material de apoyo (Sección 1).

**E1 — Scoring del diseño AS-IS**
Tipo: cuadrícula de varias opciones (obligatoria — 12 filas × 5 columnas)
Columnas: 1 No soportado · 2 · 3 · 4 · 5 Excelente soporte

**E2 — Scoring del diseño TO-BE**
Tipo: cuadrícula de varias opciones (obligatoria — 12 filas idénticas × 5 columnas)
Mismas columnas que E1.

**E3 — Clasificación arquitectónica**
Tipo: cuadrícula de varias opciones (obligatoria — 12 filas × 5 columnas)
Mismas columnas y escala que E1/E2 (no una lista con los nombres de las 4 categorías ATAM — ver la tabla de equivalencia en "Evolución del instrumento" para la conversión score→categoría).

> ⚠️ **Nota de implementación.** El documento de planeación de la refactorización había propuesto originalmente para E3 una cuadrícula de 4 columnas con los nombres de categoría directamente (NR · SP · TP · R). La versión finalmente publicada en Google Forms usó, en cambio, la misma escala de soporte de 5 columnas que E1/E2 (confirmado en los datos crudos de respuesta: los valores registrados son literalmente "Buen soporte" y "Excelente soporte", no siglas de categoría), consistente con el principio de no exigir el dominio directo de las cuatro categorías ATAM. Este documento describe la versión efectivamente publicada.

**E4 — Comentario libre** (opcional, máximo 500 caracteres)
Texto: *"¿Tiene alguna observación sobre los escenarios o el ejercicio de scoring?"*

**Filas de las cuadrículas E1, E2 y E3** (idénticas en las tres):

| ID | Descripción de fila (≤ 70 caracteres) | Atributo |
|---|---|---|
| BOT-Q1 | Cambio de reglas de prioridad | Mantenibilidad |
| BOT-Q2 | Cambio de proveedor de tickets | Mantenibilidad |
| BOT-Q3 | Credenciales expuestas en JSON exportado | Seguridad |
| BOT-Q4 | Ticket duplicado por reintento | Fiabilidad |
| BOT-Q5 | Diagnóstico de fallo silencioso en producción | Operabilidad |
| BOT-Q6 | Códigos HTTP incorrectos ante errores de entrada | Adec. funcional |
| IOT-Q1 | Ajuste de umbral de temperatura | Mantenibilidad |
| IOT-Q2 | Cambio de canal de notificación | Mantenibilidad |
| IOT-Q3 | Lectura duplicada por reenvío del sensor | Fiabilidad |
| IOT-Q4 | Canal de notificación caído 30 s | Fiabilidad |
| IOT-Q5 | Routing crítico vs advertencia | Confiabilidad |
| IOT-Q6 | Credenciales de BD en JSON exportado | Seguridad |

---

## Pantalla final — Agradecimiento

> **¡Muchas gracias por su participación!**
>
> Su criterio profesional contribuye directamente al rigor metodológico de este trabajo
> de grado. Los resultados del panel de expertos se integrarán al informe ATAM final.
>
> Una vez finalizado el análisis se publicará un resumen ejecutivo con los hallazgos del panel.

**F1. (Opcional) Correo electrónico para recibir el resumen de resultados.**
Tipo: respuesta corta con validación de formato de correo.
Nota: este dato se almacena separado de las respuestas y se elimina a los 60 días del cierre.

---

## Resumen del instrumento — para verificación

| Sección | Ítems visibles | Tiempo estimado |
|---|:---:|:---:|
| 0 — Consentimiento | 1 | 1 min |
| 1 — Material de apoyo | 0 (informativa) | 5–7 min (lectura previa) |
| A — Perfil profesional | 4 (1 cuadrícula de 3 filas) | 2 min |
| B — Valoración del framework | 8 (4 cuadrículas de 2 filas) | 4 min |
| C — Perspectiva crítica | 1 | 2 min |
| D — Valoración global | 2 + 1 condicional | 1 min |
| **Subtotal encuesta principal (A–D)** | **~23** | **~9 min** |
| E — Mini-ATAM (opcional) | 1 (E0) + 3 cuadrículas de 12 filas + 1 comentario | 6–8 min |
| F — Seguimiento (opcional) | 1 | 30 s |
| **TOTAL con Sección E** | **~27** | **15–19 min** |

Comparado con la versión inicial (v1.0, ~75 ítems, 25–35 min), la refactorización redujo
los ítems visibles en ~67 % y el tiempo total en ~40 %, sin pérdida de información
recolectada (ver "Evolución del instrumento").

---

## Notas de configuración para Google Forms

| Parámetro | Valor | Nota |
|---|---|---|
| Recolección de correos | DESACTIVADA | Preserva el anonimato del respondente |
| Barra de progreso | ACTIVADA | Reduce la tasa de abandono al mostrar el avance |
| Permitir editar respuestas | ACTIVADA | Permite correcciones antes del envío definitivo |
| Orden de preguntas | NO aleatorizar | El orden lógico de las secciones es parte del diseño |
| Lógica P0 = "No" | Ir a pantalla final | Sección de cierre con agradecimiento |
| Lógica A2 = "< 3 años" | Ir a pantalla final con mensaje de exclusión | O aplicar exclusión post-hoc si no es posible técnicamente (ver `protocolo-encuesta.md` §2.3) |
| Lógica D2 = "Tal vez" / "No" | Ir a sección D2-bis antes de continuar | Sección separada en Google Forms |
| Lógica E0 = "No" | Ir a pantalla final de agradecimiento | Saltar toda la Sección E |
| Color del tema | Azul oscuro o gris sobrio | Evitar colores llamativos que sugieran sesgo positivo |
| Requerir una respuesta por fila | SÍ en todas las cuadrículas | A3-A4-A5, B1–B8, E1, E2, E3 |
| Test de envío con respuestas dummy | Llenar el formulario 2 veces antes de difundir | Eliminar las respuestas dummy del Sheets antes del lanzamiento real |

---

## Apéndice — Mapeo de preguntas a hipótesis de la encuesta

Para la sección de análisis del informe, este es el mapa de cada pregunta a la pregunta de investigación que ayuda a responder:

| Pregunta | Hipótesis / Aspecto evaluado |
|---|---|
| A1, A2 | Perfil del panel (rol, experiencia) |
| A3-A4-A5 (cuadrícula) | Familiaridad del panel con LC/NC, Clean Architecture y evaluación arquitectónica |
| B1, B2 | Validación de la modularidad y reducción de impacto CR |
| B3 | Validación de los patrones de retry e idempotencia |
| B4 | Validación del error workflow IoT |
| B5 | Validación de gestión de secretos |
| B6 | Validación del log estructurado |
| B7, B8 | Validación de aplicabilidad y costo cognitivo |
| C1 | Identificación independiente de riesgos, trade-offs y sugerencias de refinamiento (pregunta consolidada; puede revelar nuevos R-*/TP-* no anticipados) |
| D1 | Aceptabilidad global (score) |
| D2 | Intención de adopción |
| E1 por escenario | Triangulación del scoring as-is del autor (`matriz-scoring.md`) |
| E2 por escenario | Triangulación del scoring to-be del autor (`matriz-scoring.md`) |
| E3 por escenario | Triangulación de la clasificación SP/TP/R/NR del autor (`analisis-approaches.md`) — recuperada del nivel 1–5 vía la tabla de equivalencia (ver "Evolución del instrumento") |
| E4 | Hallazgos emergentes no anticipados |
