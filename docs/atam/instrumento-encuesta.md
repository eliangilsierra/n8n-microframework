# Instrumento de Encuesta — Validación Externa del Micro-framework LC/NC

**Versión:** 1.0 — listo para pilotaje
**Fecha:** 2026-05-07
**Plataforma sugerida:** Google Forms (o Microsoft Forms equivalente)
**Duración estimada:** 10–12 min (encuesta principal) · +15 min (mini-ATAM opcional)
**Protocolo:** [`protocolo-encuesta.md`](protocolo-encuesta.md)
**Propósito:** Especificación canónica de cada pregunta, su tipo, opciones, lógica condicional y validaciones para que la persona que configure el formulario tenga toda la información en un único documento. Este archivo es la fuente de verdad — el Google Form debe construirse exactamente igual a esta especificación.

---

## Configuración global del formulario

| Parámetro | Valor |
|---|---|
| Título del formulario | Validación externa — Micro-framework LC/NC para n8n (MGADS-UNAB) |
| Descripción visible | Su opinión experta apoya un trabajo de grado de Maestría. Toma 10–12 minutos. Anónimo y voluntario. |
| Recolección de correos | DESACTIVADA (anonimato) |
| Limitar a 1 respuesta por persona | DESACTIVADA (no requiere login para reducir fricción) |
| Mostrar barra de progreso | ACTIVADA |
| Orden de las preguntas dentro de cada sección | ALEATORIZADO **NO** (preservar orden lógico) |
| Mensaje de confirmación al enviar | "Muchas gracias por su tiempo y experticia. Su aporte contribuye directamente al rigor académico del trabajo. — Elian Hernando Gil Sierra" |

---

## Pantalla 0 — Consentimiento informado

**Tipo:** Sección de portada con texto largo + 1 pregunta obligatoria.

**Texto:** ver `protocolo-encuesta.md` §3 (texto completo del consentimiento).

**Pregunta única de esta pantalla:**

> **P0.** ¿Acepta participar en esta encuesta bajo las condiciones descritas?
>
> Tipo: opción única (obligatoria)
> Opciones:
> - Sí, acepto y deseo continuar
> - No, prefiero salir
>
> Lógica: si "No" → ir a pantalla final de agradecimiento; si "Sí" → continuar a Sección A.

---

## SECCIÓN A — Caracterización del respondente (5 preguntas, ~1.5 min)

> Texto introductorio de la sección:
> *"Las siguientes preguntas permiten caracterizar el perfil de los respondentes y se reportarán únicamente de forma agregada (sin posibilidad de identificarle individualmente)."*

---

**A1. ¿Cuál es su rol principal actual en el desarrollo o gestión de software?**

Tipo: opción única (obligatoria)
Opciones:
- Desarrollador / Ingeniero de software
- Tech Lead / Líder técnico
- Arquitecto de software
- Ingeniero DevOps / SRE
- Ingeniero de seguridad de software
- Ingeniero de aseguramiento de calidad (QA / Testing)
- Gerente o director de tecnología
- Estudiante con experiencia laboral en software
- Otro: [campo de texto corto]

---

**A2. ¿Cuántos años de experiencia profesional tiene en desarrollo, arquitectura u operaciones de software?**

Tipo: opción única (obligatoria)
Opciones:
- Menos de 3 años *(si selecciona esta opción se muestra mensaje: "Esta encuesta requiere al menos 3 años de experiencia. Agradecemos su interés pero su perfil queda fuera del alcance del estudio." y se termina la encuesta)*
- Entre 3 y 5 años
- Entre 5 y 10 años
- Más de 10 años

---

**A3. ¿Qué tan familiarizado(a) está con plataformas Low-Code / No-Code para automatización o integración? (n8n, Zapier, Make, Power Automate, Workato, etc.)**

Tipo: escala Likert 1-5 (obligatoria)
Etiquetas:
- 1 = Ninguna familiaridad
- 2 = Baja (he oído de ellas)
- 3 = Media (he revisado o probado alguna)
- 4 = Alta (las uso en proyectos personales o laborales)
- 5 = Muy alta (las uso intensivamente o lidero proyectos basados en ellas)

---

**A4. ¿Qué tan familiarizado(a) está con principios de Clean Architecture y separación de responsabilidades en software?**

Tipo: escala Likert 1-5 (obligatoria)
Etiquetas:
- 1 = Ninguna
- 2 = Baja
- 3 = Media
- 4 = Alta
- 5 = Muy alta (los aplico y enseño)

---

**A5. ¿Qué tan familiarizado(a) está con métodos de evaluación arquitectónica o atributos de calidad de software? (ATAM, SAAM, ADRs, ISO 25010)**

Tipo: escala Likert 1-5 (obligatoria)
Etiquetas:
- 1 = Ninguna
- 2 = Baja
- 3 = Media
- 4 = Alta
- 5 = Muy alta

---

## SECCIÓN B — Validación percibida del framework (8 preguntas, ~5 min)

> Texto introductorio de la sección (importante):
> *"**Antes de continuar, le solicitamos revisar el material de apoyo** (5–7 minutos en total):*
> - *📄 [PDF resumen ejecutivo de 4 páginas](URL_PDF)*
> - *🎥 [Video de presentación de 5 minutos](URL_VIDEO)*
>
> *Las siguientes 8 afirmaciones evalúan distintos aspectos del micro-framework propuesto. Indique su nivel de acuerdo en una escala de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). No hay respuestas correctas o incorrectas — buscamos su criterio profesional honesto."*

**Configuración común para B1–B8:**
- Tipo: escala Likert 1-5 (obligatoria)
- Etiquetas: 1 = Totalmente en desacuerdo · 2 = En desacuerdo · 3 = Neutral · 4 = De acuerdo · 5 = Totalmente de acuerdo

---

### Bloque Mantenibilidad

**B1.** La separación del flujo en cuatro etapas funcionales (E1 Validación, E2 Dominio, E3 Adaptadores, E4 Salida) mejora claramente la modularidad respecto al diseño as-is mostrado.

**B2.** La reducción del impacto de Change Requests (de 5–8 nodos modificados en as-is a 1 nodo en to-be) es una mejora arquitectónica significativa y verificable.

---

### Bloque Fiabilidad

**B3.** Los patrones de retry con backoff e idempotencia con clave única propuestos en el framework son adecuados para prevenir pérdida o duplicidad de datos en escenarios reales.

**B4.** El error workflow con dead-letter (preservación del payload original ante fallos) es una decisión arquitectónica acertada para el dominio IoT donde las lecturas de sensor son datos irrecuperables.

---

### Bloque Seguridad

**B5.** La gestión de secretos exclusivamente mediante credenciales nativas de n8n (sin tokens ni API keys literales en el JSON exportado) es apropiada para entornos productivos.

---

### Bloque Operabilidad

**B6.** El log estructurado JSON por etapa, consultable desde stdout del contenedor (`docker logs | grep`), facilita el diagnóstico de fallos sin requerir acceso a la interfaz gráfica de n8n.

---

### Bloque Aplicabilidad

**B7.** Las 10 reglas obligatorias del framework (REG-001 a REG-010) son aplicables a proyectos LC/NC reales en mi contexto laboral.

**B8.** El framework aporta valor arquitectónico tangible sin imponer una carga excesiva de complejidad sobre el desarrollador.

---

## SECCIÓN C — Identificación de riesgos y trade-offs (3 preguntas, ~3 min)

> Texto introductorio:
> *"En esta sección le pedimos su criterio experto sobre riesgos y compromisos que el framework presenta. Sus respuestas se analizan cualitativamente y enriquecen directamente el informe ATAM. Sea conciso pero específico."*

---

**C1. ¿Cuál considera que es el riesgo arquitectónico más relevante en el diseño to-be presentado?**

Tipo: respuesta abierta (obligatoria)
Longitud: máximo 500 caracteres
Texto de ayuda: *"Piense en aspectos como latencia adicional, dependencias circulares, complejidad operacional, costo de cambio o riesgos de adopción. Si identifica más de uno, mencione el principal."*

---

**C2. ¿Qué trade-off (compromiso entre atributos de calidad) identifica como más crítico entre los presentados?**

Tipo: respuesta abierta (obligatoria)
Longitud: máximo 500 caracteres
Texto de ayuda: *"Por ejemplo: en el caso IoT, la modularización mejora la mantenibilidad en −84% nodos por cambio, pero aumenta la latencia entre +119% y +192%. ¿Cuál trade-off le parece más significativo y por qué?"*

---

**C3. ¿Qué regla, patrón o componente del framework cuestionaría, refinaría o agregaría?**

Tipo: respuesta abierta (obligatoria, mínimo 1 carácter — puede ser "ninguno")
Longitud: máximo 500 caracteres
Texto de ayuda: *"Sugerencia de mejora libre. Si no tiene observaciones puede escribir 'ninguno'."*

---

## SECCIÓN D — Percepción global (2 preguntas, ~1 min)

---

**D1. En una escala de 1 a 10, ¿cómo califica globalmente el micro-framework propuesto?**

Tipo: escala lineal 1-10 (obligatoria)
Etiqueta extremo izquierdo: 1 — Pobre, no lo recomendaría
Etiqueta extremo derecho: 10 — Excelente, lo adoptaría sin dudar

---

**D2. ¿Adoptaría este framework (o sus principios) en un proyecto LC/NC actual o futuro de su organización?**

Tipo: opción única (obligatoria)
Opciones:
- Sí, sin modificaciones mayores
- Sí, con adaptaciones a mi contexto específico
- Tal vez, requeriría más evidencia o contexto adicional
- No lo adoptaría

**Lógica condicional:**
Si responde "Tal vez" o "No" → mostrar pregunta D2-bis (opcional):

**D2-bis.** ¿Por qué? (opcional)
Tipo: respuesta abierta opcional
Longitud: máximo 300 caracteres

---

## SECCIÓN E — Mini-ATAM (OPCIONAL, solo para expertos invitados, ~15 min)

> Texto introductorio:
> *"**Esta sección es opcional.** Si su rol y experiencia se lo permiten, le invitamos a participar en un mini-ATAM: evaluar cada uno de los 12 escenarios de calidad con scoring 1–5 as-is/to-be y clasificación arquitectónica (sensitivity point, tradeoff point, risk o non-risk).*
>
> *Su tiempo adicional es muy valorado y permite triangular su criterio con el análisis del autor mediante medidas formales de acuerdo inter-evaluador.*
>
> *Si prefiere terminar aquí, marque la opción 'No, terminar aquí' en la pregunta E0 y será dirigido a la pantalla final."*

---

**E0. ¿Desea participar en la sección mini-ATAM opcional?**

Tipo: opción única (obligatoria)
Opciones:
- Sí, continuar al mini-ATAM
- No, terminar la encuesta aquí

Lógica: si "No" → saltar a pantalla final.

---

### Estructura repetida para los 12 escenarios

Para cada uno de los 12 escenarios (BOT-Q1, BOT-Q2, …, IOT-Q6), se presenta:

**1.** Breve descripción del escenario (1–2 líneas con stimulus y response).
**2.** Cuatro preguntas estructuradas (todas obligatorias dentro de la sección):

---

#### Plantilla por escenario (ejemplo BOT-Q1):

> **Escenario BOT-Q1 — Modificabilidad de reglas (Mantenibilidad)**
> *Estímulo: cambio en la lógica de prioridad de mensajes (CR1).*
> *Respuesta esperada en to-be: solo el subflujo E2 se modifica; medida `nodes_touched ≤ 1`.*

**BOT-Q1.a — ¿Cómo califica el soporte del diseño as-is para este escenario?**
Tipo: escala 1–5
1 = No soportado / antipatrón · 5 = Excelente con evidencia

**BOT-Q1.b — ¿Cómo califica el soporte del diseño to-be para este escenario?**
Tipo: escala 1–5

**BOT-Q1.c — ¿Cómo clasificaría arquitectónicamente la decisión principal que afecta este escenario?**
Tipo: opción única
- Non-risk (la decisión preserva claramente el atributo)
- Sensitivity point (afecta principalmente un atributo)
- Tradeoff point (afecta múltiples atributos en direcciones opuestas)
- Risk (la decisión podría comprometer el atributo en algún caso)

**BOT-Q1.d — Comentario breve (opcional)**
Tipo: respuesta abierta opcional, máximo 200 caracteres

---

### Listado completo de 12 escenarios para la Sección E

**Bot — 6 escenarios:**

| ID | Descripción breve para el respondente |
|---|---|
| **BOT-Q1** | Modificabilidad de reglas (Mantenibilidad) — Cambio en lógica de prioridad de mensajes. Esperado: 1 nodo modificado en E2. |
| **BOT-Q2** | Cambio de proveedor de tickets (Mantenibilidad) — Cambio de endpoint del servicio de tickets. Esperado: 1 nodo modificado en E3. |
| **BOT-Q3** | Confidencialidad de credenciales (Seguridad) — Auditar el JSON exportado del flujo. Esperado: 0 tokens literales. |
| **BOT-Q4** | Integridad ante reintentos (Fiabilidad) — Enviar el mismo ticket dos veces. Esperado: 0 duplicados en el servicio externo. |
| **BOT-Q5** | Diagnóstico de fallos en producción (Operabilidad) — Fallo de autenticación. Esperado: causa identificada en logs en ≤ 60 segundos. |
| **BOT-Q6** | Corrección de contratos HTTP (Adecuación funcional) — Token inválido o payload malformado. Esperado: HTTP 401 / 400 correctos. |

**IoT — 6 escenarios:**

| ID | Descripción breve para el respondente |
|---|---|
| **IOT-Q1** | Ajuste de umbrales (Mantenibilidad) — Reducir el umbral de temperatura crítica. Esperado: 1 nodo modificado en E2. |
| **IOT-Q2** | Cambio de canal de alerta (Mantenibilidad) — Cambiar endpoint de notificación. Esperado: 1 nodo modificado en E4. |
| **IOT-Q3** | Integridad de lecturas ante reintentos (Fiabilidad) — Enviar la misma lectura dos veces. Esperado: 1 fila por idempotency_key. |
| **IOT-Q4** | Tolerancia a fallos de red (Fiabilidad) — Caída transitoria del canal de notificación. Esperado: retry exitoso o dead-letter. |
| **IOT-Q5** | Urgencia diferenciada de alertas (Confiabilidad) — Mezcla de lecturas críticas y de advertencia. Esperado: routing diferenciado. |
| **IOT-Q6** | Confidencialidad de credenciales BD (Seguridad) — Auditar el JSON exportado del flujo. Esperado: 0 contraseñas literales. |

Cada uno se presenta como bloque independiente con las 4 preguntas (a-d) descritas en la plantilla.

---

### Pregunta final de Sección E

**E13. Comentario libre sobre el mini-ATAM (opcional)**
Tipo: respuesta abierta opcional, máximo 500 caracteres
Texto de ayuda: *"¿Identificó algún sensitivity point, tradeoff point o risk no incluido en los 12 escenarios? ¿Tiene alguna observación general sobre el ejercicio de scoring?"*

---

## Pantalla final — Agradecimiento y opción de seguimiento

> **¡Muchas gracias!**
>
> Su aporte contribuye directamente al rigor metodológico de este trabajo de grado. Una vez completado el análisis se publicará un resumen ejecutivo de los resultados.
>
> Si desea recibir ese resumen por correo, por favor escriba su dirección a continuación. (Este dato se almacena de forma separada del cuestionario y se elimina máximo 60 días después del cierre del estudio.)

**F1. (Opcional) Correo para recibir el resumen de resultados:**
Tipo: campo de correo (opcional, validación de formato)

---

## Resumen del instrumento — para verificación

| Sección | # Preguntas obligatorias | # Preguntas opcionales | Tiempo estimado |
|---|:---:|:---:|:---:|
| 0 — Consentimiento | 1 | 0 | 1 min (lectura) |
| A — Caracterización | 5 | 0 | 1.5 min |
| B — Validación percibida | 8 | 0 | 5 min |
| C — Riesgos y trade-offs | 3 | 0 | 3 min |
| D — Percepción global | 2 | 1 (D2-bis condicional) | 1 min |
| **Subtotal encuesta principal** | **19** | **1** | **~12 min** |
| E — Mini-ATAM (opcional) | 1 + (12 × 3) = 37 | 12 (comentarios c/escenario) + 1 (E13) = 13 | +15 min |
| F — Seguimiento (opcional) | 0 | 1 | 30 s |
| **TOTAL si participa en mini-ATAM** | **56** | **15** | **~28 min** |

---

## Notas para quien configure el formulario

1. **Color del tema:** sobrio (azul oscuro o gris). Evitar colores llamativos que sugieran sesgo.
2. **Logo del proyecto:** opcional, si se incluye usar el logo UNAB.
3. **Vista previa antes de publicar:** verificar que las lógicas condicionales funcionan (A2 < 3 años descalifica; D2 muestra D2-bis si "Tal vez" o "No"; E0 = "No" salta a final).
4. **Test de envío con respuestas dummy:** llenar el formulario 2 veces con datos de prueba antes de difundir; eliminar las respuestas dummy del Sheets antes del lanzamiento real.
5. **URL pública vs restringida:** mantener URL pública pero con un mensaje en el consentimiento que clarifica que no se permite responder más de una vez por persona (honor system).
6. **Material de apoyo:** asegurarse de que las URLs del PDF y video estén activas **antes** de enviar la primera invitación.

---

## Apéndice — Mapeo de preguntas a hipótesis de la encuesta

Para la sección de análisis del informe, este es el mapa de cada pregunta a la pregunta de investigación que ayuda a responder:

| Pregunta | Hipótesis / Aspecto evaluado |
|---|---|
| A1-A5 | Perfil del panel (caracterización demográfica) |
| B1, B2 | Validación de la modularidad y reducción de impacto CR |
| B3 | Validación de los patrones de retry e idempotencia |
| B4 | Validación del error workflow IoT |
| B5 | Validación de gestión de secretos |
| B6 | Validación del log estructurado |
| B7, B8 | Validación de aplicabilidad y costo cognitivo |
| C1 | Identificación independiente de riesgos (puede revelar nuevos R-* no anticipados) |
| C2 | Identificación independiente de trade-offs (puede revelar nuevos TP-* no anticipados) |
| C3 | Sugerencias de refinamiento al framework |
| D1 | Aceptabilidad global (score) |
| D2 | Intención de adopción |
| E.a/b por escenario | Triangulación del scoring del autor (`matriz-scoring.md`) |
| E.c por escenario | Triangulación de la clasificación SP/TP/R/NR del autor (`analisis-approaches.md`) |
| E13 | Hallazgos emergentes no anticipados |
