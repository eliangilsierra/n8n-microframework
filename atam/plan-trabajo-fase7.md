> 🌐 **Idioma / Language:** Español · [English](plan-trabajo-fase7.en.md)

# Plan de Trabajo — Fase 7 (Evaluación ATAM) — Cierre Completo

**Versión:** 1.0
**Fecha:** 2026-05-07
**Autor:** Elian Hernando Gil Sierra
**Propósito:** Llevar OE3 (implementación del protocolo ATAM) del 45 % al máximo alcanzable antes de la ejecución de la encuesta, dejando únicamente pendiente la recolección de respuestas y su análisis posterior.

> ✅ **Nota de cierre (2026-07-08).** Este documento es el plan de trabajo tal como se concibió
> antes de ejecutar la Fase 7 — se conserva íntegro como registro histórico de planeación. Los
> checklists y referencias a "placeholder §8" que aparecen abajo describen el estado *planeado*,
> no el actual. La Fase 7 ya se ejecutó por completo: la encuesta se recolectó (17–24 de junio de
> 2026), se analizó y el capítulo §8 de `informe-atam-final.md` está redactado con resultados
> reales. Ver `atam/INDEX.md` y `estado-actual.md` para el estado vigente.

---

## Tabla de contenidos

- [1. Estado de partida y objetivo](#1-estado-de-partida-y-objetivo)
- [2. Resumen ejecutivo del plan](#2-resumen-ejecutivo-del-plan)
- [3. Bloque A — Completar evidencia residual (4 h)](#3-bloque-a)
- [4. Bloque B — Análisis formal de approaches ATAM (16 h)](#4-bloque-b)
- [5. Bloque C — Adaptación metodológica documentada (4 h)](#5-bloque-c)
- [6. Bloque D — Diseño completo del instrumento de validación externa (12 h)](#6-bloque-d)
- [7. Bloque E — Informe ATAM consolidado (16 h)](#7-bloque-e)
- [8. Bloque F — Cierre y trazabilidad (2 h)](#8-bloque-f)
- [9. Cronograma sugerido](#9-cronograma-sugerido)
- [10. Estructura final de artefactos](#10-estructura-final-de-artefactos)
- [11. Definición de "Listo"](#11-definicion-de-listo)

---

## 1. Estado de partida y objetivo

### Estado actual de OE3 (cierre 2026-05-07)
- ✅ Utility Tree con 12 escenarios top-K (`atam/atam-utility-tree.md`)
- ✅ Matriz escenario × evidencia (11/12 = 92 % cobertura) (`medicion/consolidado/atam-evidencia.md`)
- ✅ IOT-Q4 runtime ejecutado → SP-IOT-01, R-IOT-01, NR-IOT-01 documentados
- ✅ IOT-Q5 análisis ejecutado → TP-IOT-01 documentado
- ⏳ Análisis formal de approaches arquitectónicos (Paso 6 ATAM)
- ⏳ Matriz scoring 1–5 as-is/to-be por escenario
- ⏳ Registro consolidado de riesgos y trade-offs
- ⏳ Adaptación metodológica formal documentada (ADR)
- ⏳ Instrumento de validación externa diseñado
- ⏳ Informe ATAM consolidado redactado

### Objetivo de este plan
Al finalizar la ejecución del plan, OE3 alcanza ~90 % de avance. El 10 % restante corresponde exclusivamente a:
1. Ejecución de la encuesta (espera del panel — fuera del control del autor)
2. Análisis estadístico de las respuestas recibidas (rutinario, ~3-5 días post-recolección)
3. Integración de hallazgos en sección reservada del informe (~1 día)

---

## 2. Resumen ejecutivo del plan

| Bloque | Descripción | Esfuerzo | Salida principal |
|---|---|---|---|
| **A** | Completar evidencia residual (BOT-Q5 runtime, NR-IOT-01 query) | 4 h | `mttd-resultado.md` y `atam-evidencia.md` actualizados |
| **B** | Análisis formal de approaches ATAM (SP/TP/R/NR + scoring 1-5) | 16 h | `analisis-approaches.md`, `matriz-scoring.md`, `registro-riesgos-tradeoffs.md` |
| **C** | Adaptación metodológica documentada (ADR + capítulo metodología) | 4 h | `ADR-MF-004` + `metodologia-atam-adaptada.md` |
| **D** | Diseño completo de la encuesta (instrumento + protocolo + material + análisis) | 12 h | `protocolo-encuesta.md`, `instrumento-encuesta.md`, `material-apoyo/`, `plan-analisis-encuesta.md` |
| **E** | Informe ATAM consolidado (capítulo de tesis) | 16 h | `informe-atam-final.md` |
| **F** | Cierre y trazabilidad | 2 h | `estado-actual.md` actualizado, índice de artefactos |

**Esfuerzo total:** ~54 h ≈ 7 días de trabajo focalizado.

---

## 3. Bloque A — Completar evidencia residual {#3-bloque-a}
**Esfuerzo:** 4 h

### A.1 — Verificación E3 PostgreSQL para NR-IOT-01 (30 min)
**Propósito:** confirmar que la lectura del test runtime de IOT-Q4 quedó persistida en PostgreSQL antes del fallo de E4.

**Procedimiento (PowerShell):**
```powershell
docker compose -f infraestructura/docker-compose.yml exec postgres `
  psql -U n8n_user -d sensores_db -c `
  "SELECT sensor_id, temperatura, humedad, co2, nivel_alerta, created_at
   FROM lecturas_sensor
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC LIMIT 5;"
```
**Salida:** anotación en `mttd-resultado.md §IOT-Q4-runtime` con `id` de la fila y timestamp. Si la fila existe → NR-IOT-01 confirmado en runtime.

### A.2 — BOT-Q5 runtime live measurement (3 h)
**Propósito:** convertir BOT-Q5 de "analítico" (~14 s estimados) a "runtime medido" (Bot 6/6 = 100 %).

**Procedimiento:**
1. Importar `bot-to-be-orquestador.json` activado en n8n.
2. Iniciar cronómetro al ejecutar:
   ```powershell
   $body = Get-Content "medicion\datasets\bot\input-set-C.json" -Raw
   Invoke-WebRequest -Method POST -Uri "http://localhost:5678/webhook/bot-support-to-be" `
     -ContentType "application/json" -Body $body
   ```
3. Medir tiempo desde recepción del 401 hasta identificación del nodo+causa con:
   ```powershell
   docker compose -f infraestructura/docker-compose.yml logs n8n --since 2m | `
     Select-String '"status":"fail"' | Select-Object -Last 3
   ```
4. Repetir 5 veces y registrar (mediana y rango).

**Salida:**
- Sección `BOT-Q5-runtime` en `mttd-resultado.md` con tabla de 5 mediciones.
- Fila en `run-log-bot-to-be.csv` con `run_id: bot-tobe-Q5-LIVE-{NNNN}-{commit}`.
- Actualizar `atam-evidencia.md`: BOT-Q5 ⚠️ Parcial → ✅ Completa.
- Cobertura final: Bot 6/6 = 100 %, IoT 6/6 = 100 %, **Total 12/12 = 100 % ✅**.

---

## 4. Bloque B — Análisis formal de approaches ATAM {#4-bloque-b}
**Esfuerzo:** 16 h ≈ 2 días

### B.1 — Identificación de approaches arquitectónicos (4 h)
**Archivo:** `atam/analisis-approaches.md`

**Approaches a documentar** (decisiones arquitectónicas con impacto en atributos de calidad):

| ID | Approach | Origen | Atributos afectados |
|---|---|---|---|
| AP-01 | Separación E1–E4 (Clean Architecture en flujos) | ADR-001 Bot/IoT | Mantenibilidad, Modularidad |
| AP-02 | Subflujos Execute Workflow | ADR-001 | Mantenibilidad, Reusabilidad, ⚠️ Eficiencia (latencia) |
| AP-03 | Gestión de secretos vía credenciales n8n | ADR-MF-001 | Seguridad/Confidencialidad |
| AP-04 | Patrón retry con backoff (REG-004) | ADR-MF-002 | Fiabilidad/Tolerancia a fallos |
| AP-05 | Patrón idempotencia (`ON CONFLICT` + idempotency_key) | ADR-003 IoT, REG-005 | Fiabilidad/Madurez |
| AP-06 | Error workflow con dead-letter | ADR-005 IoT, ADR-006 Bot, REG-003 | Fiabilidad, Operabilidad |
| AP-07 | Log estructurado JSON por etapa | ADR-MF-003, REG-006 | Operabilidad/Monitoreabilidad |
| AP-08 | Validación E1 con JSON Schema | ADR-006 IoT, REG-009 | Adecuación funcional, Seguridad |
| AP-09 | Routing diferenciado por nivel (E4 IoT) | ADR-004 IoT | Fiabilidad, Eficiencia |
| AP-10 | Constantes centralizadas en E2 (UMBRALES) | ADR-002 IoT, REG-007, REC-001 | Mantenibilidad |
| AP-11 | Validación estática `validar-flujos.mjs` | Pilar 2 DevSecOps | Adecuación funcional (gobernanza) |
| AP-12 | Timestamp authority (E1 IoT) | ADR-007 IoT | Adecuación funcional, Trazabilidad |

Para cada approach documentar: **Decisión · Atributos afectados · Reglas asociadas · ADRs · Escenarios ATAM cubiertos · Trade-offs conocidos**.

### B.2 — Clasificación SP / TP / R / NR por escenario (8 h)
**Archivo:** `atam/analisis-approaches.md` §2

Para cada uno de los 12 escenarios, completar:

| Campo | Descripción |
|---|---|
| Sensitivity Points (SP) | Decisiones cuya modificación afecta principalmente UN atributo |
| Tradeoff Points (TP) | Decisiones que afectan múltiples atributos en direcciones contrarias |
| Risks (R) | Decisiones que podrían comprometer un atributo en un escenario específico |
| Non-risks (NR) | Decisiones que claramente preservan el atributo |

**Hallazgos preliminares ya identificados** (a integrar):
- SP-IOT-01: Canal del error handler coincide con canal E4
- R-IOT-01: `neverError:true` no cubre ECONNREFUSED → dead-letter bloqueable
- NR-IOT-01: E3 PostgreSQL es independiente de E4
- TP-IOT-01: maxRetries=3 crítico vs 2 advertencia: resilencia ↑ vs latencia +10.8 ms

**Hallazgos esperados adicionales** (a derivar):
- TP-GLOBAL-01: Subflujos Execute Workflow → mantenibilidad ↑ vs latencia +119–192 % en IoT
- R-BOT-01: Token en `$env` requiere proceso de rotación documentado (no es responsabilidad de n8n)
- NR-BOT-01: Validación E1 rechaza con 401/400 antes de invocar adaptadores → previene side-effects no autorizados
- SP-BOT-01: Idempotency-Key en E3 → única dependencia para garantizar BOT-Q4

### B.3 — Matriz de scoring 1–5 as-is vs to-be (3 h)
**Archivo:** `atam/matriz-scoring.md`

**Plantilla:**

| Escenario | Atributo | Score as-is (1-5) | Justificación as-is | Score to-be (1-5) | Justificación to-be | Δ | Evidencia |
|---|---|---|---|---|---|---|---|
| BOT-Q1 | Mantenibilidad | 2 | 8 nodos tocados, lógica dispersa | 5 | 1 nodo en E2, contrato estable | +3 | cr-log-bot CR1 |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Escala definida operacionalmente:**
- 1 = No soportado / antipatrón explícito
- 2 = Parcial con violaciones documentadas
- 3 = Cumple mínimamente
- 4 = Bien soportado con evidencia
- 5 = Excelente, con evidencia cuantitativa y patrón explícito

### B.4 — Registro consolidado de riesgos y trade-offs (1 h)
**Archivo:** `atam/registro-riesgos-tradeoffs.md`

**Plantilla por hallazgo:**
```
ID: [SP|TP|R|NR]-[CASO]-[NN]
Tipo: Sensitivity Point | Tradeoff Point | Risk | Non-Risk
Descripción: ...
Escenarios impactados: ...
Approaches relacionados: ...
Atributos afectados: ...
Severidad: Alta | Media | Baja (solo para R)
Mitigación recomendada: ...
Evidencia: ruta de archivo / commit
```

---

## 5. Bloque C — Adaptación metodológica documentada {#5-bloque-c}
**Esfuerzo:** 4 h

### C.1 — ADR-MF-004: adaptación ATAM individual (1.5 h)
**Archivo:** `microframework/adr/ADR-MF-004-atam-adaptado-individual.md`

Documenta y justifica:
- Contexto: proyecto de grado individual sin equipo multi-stakeholder
- Decisión: ATAM modificado asincrónico con validación externa por panel de expertos
- Alternativas consideradas: ATAM completo (descartado por restricción), evaluación interna pura (descartado por sesgo), SAAM (descartado por menor robustez)
- Soporte académico: Bass et al. (2012) ATAM lightweight variants, Wohlin et al. (2012) expert opinion surveys, Kitchenham & Pfleeger personal opinion survey guidelines
- Consecuencias positivas y trade-offs metodológicos

### C.2 — Documento metodológico (2.5 h)
**Archivo:** `atam/metodologia-atam-adaptada.md`

Contenido:
1. Marco de referencia ATAM (Bass et al. 2012, Kazman 2000)
2. Justificación de la adaptación al contexto individual
3. Mapeo paso a paso ATAM-original → ATAM-adaptado
4. Triangulación metodológica (cuantitativa + documental + opinión experta)
5. Tabla de equivalencias por paso de ATAM:

| Paso ATAM original | Adaptación en este proyecto | Justificación |
|---|---|---|
| 1. Presentar ATAM | Sección 2 del informe | Documentación reemplaza presentación oral |
| 2. Presentar drivers de negocio | Sección 3 (basado en proyecto-overview.md) | — |
| 3. Presentar arquitectura | Sección 4 (basado en arquitectura-flujos.md) | — |
| 4. Identificar approaches | Sección 5 (analisis-approaches.md) | — |
| 5. Generar utility tree | atam-utility-tree.md (ya producido) | — |
| 6. Analizar approaches (SP/TP/R/NR) | Sección 6 (analisis-approaches.md §2) | — |
| 7. Brainstorming/priorizar escenarios | Priorización por importancia × dificultad (utility tree) | Brainstorming sustituido por análisis estructurado |
| 8. Re-analizar approaches | Refinamiento basado en evidencia cuantitativa | Evidencia empírica en lugar de discusión |
| 9. Presentar resultados | **Validación externa por panel de expertos** (encuesta) | Compensa ausencia de stakeholders en tiempo real |

6. Plan de mitigación de sesgos (single-evaluator → encuesta + datos cuantitativos)

---

## 6. Bloque D — Diseño completo del instrumento de validación externa {#6-bloque-d}
**Esfuerzo:** 12 h ≈ 1.5 días

> Al finalizar este bloque, el instrumento está **listo para distribuir** — solo queda enviar las invitaciones.

### D.1 — Protocolo de la encuesta (2 h)
**Archivo:** `atam/protocolo-encuesta.md`

Contenido:

**a) Criterios de inclusión del respondente**
- Edad ≥ 18 años
- Mínimo 3 años de experiencia profesional en desarrollo de software
- Rol actual o pasado en: desarrollo, arquitectura, DevOps, QA, seguridad
- Familiaridad básica con automatización de procesos o integraciones

**b) Criterios de exclusión**
- Sin experiencia en software profesional
- Conflicto de interés directo con el autor (familiares de primer grado)

**c) Consentimiento informado** (texto completo a incluir como primera pantalla del formulario):
```
Esta encuesta forma parte del trabajo de grado de Maestría en Gestión, Aplicación
y Desarrollo de Software (MGADS) de la Universidad Autónoma de Bucaramanga.

Objetivo: validar externamente un micro-framework arquitectónico para flujos
Low-Code/No-Code en n8n.

Tiempo estimado: 10–12 minutos.

Anonimato: No se solicitan datos que permitan identificarle individualmente.
Las respuestas se procesan agregadas y se publican únicamente estadísticas
descriptivas en el documento final.

Uso de datos: exclusivamente académico. No se comparten con terceros.

Voluntariedad: puede abandonar la encuesta en cualquier momento. Al enviar el
formulario usted consiente el uso académico anónimo de sus respuestas.

Contacto: [email del autor].
```

**d) Procedimiento**
1. El respondente recibe enlace por canal directo (email/LinkedIn DM/WhatsApp)
2. Lee el consentimiento → acepta → revisa material de apoyo (PDF 4 págs + video 5 min) → responde
3. Mini-ATAM (3-5 expertos seleccionados): bloque adicional opcional con scoring de los 12 escenarios

**e) Tamaño muestral objetivo**
- Encuesta amplia: ≥ 15 respondentes (mínimo aceptable para reporte descriptivo)
- Mini-ATAM expertos: 3–5 respondentes (saturación cualitativa)

**f) Plataforma**
Google Forms (gratuito, exportable a CSV, integrable con Sheets)

### D.2 — Instrumento principal de encuesta (5 h)
**Archivo:** `atam/instrumento-encuesta.md`

**Estructura final: 18 preguntas, tiempo estimado 10–12 min**

---

#### SECCIÓN A — Caracterización del respondente (5 preguntas, ~1.5 min)

**A1.** ¿Cuál es su rol principal actual?
- Desarrollador / Ingeniero de software
- Tech Lead / Senior developer
- Arquitecto de software
- Ingeniero DevOps / SRE
- Ingeniero de seguridad
- Ingeniero QA / Testing
- Otro: _____

**A2.** ¿Cuántos años de experiencia profesional tiene en desarrollo de software?
- < 3 años
- 3 a 5 años
- 5 a 10 años
- > 10 años

**A3.** Familiaridad con plataformas Low-Code/No-Code (n8n, Zapier, Make, Power Automate, etc.)
*Escala: 1=Ninguna · 2=Baja · 3=Media · 4=Alta · 5=Muy alta*

**A4.** Familiaridad con principios de Clean Architecture y separación de responsabilidades
*Escala: 1=Ninguna · 2=Baja · 3=Media · 4=Alta · 5=Muy alta*

**A5.** Familiaridad con métodos de evaluación arquitectónica (ATAM, SAAM, ADR, atributos ISO 25010)
*Escala: 1=Ninguna · 2=Baja · 3=Media · 4=Alta · 5=Muy alta*

---

#### SECCIÓN B — Validación percibida del framework (8 preguntas, ~5 min)
*Indique su nivel de acuerdo con cada afirmación tras revisar el material de apoyo (PDF + video).*
*Escala Likert 1–5: 1=Totalmente en desacuerdo · 2=En desacuerdo · 3=Neutral · 4=De acuerdo · 5=Totalmente de acuerdo*

**Mantenibilidad**
**B1.** La separación en etapas E1–E4 mejora claramente la modularidad respecto al diseño as-is mostrado.
**B2.** La reducción de nodos tocados por Change Request (de 5–8 a 1) es una mejora arquitectónica significativa.

**Fiabilidad**
**B3.** Los patrones de retry e idempotencia propuestos son adecuados para prevenir pérdida o duplicidad de datos.
**B4.** El error workflow con dead-letter (preservación de payload original) es una decisión arquitectónica acertada para el dominio IoT.

**Seguridad**
**B5.** La gestión de secretos mediante credenciales nativas de n8n (REG-001) es apropiada para entornos productivos.

**Operabilidad**
**B6.** El log estructurado JSON por etapa facilita el diagnóstico de fallos sin requerir abrir la interfaz de n8n.

**Aplicabilidad**
**B7.** Las 10 reglas obligatorias del framework son aplicables a proyectos LC/NC reales en mi contexto laboral.
**B8.** El framework aporta valor arquitectónico sin imponer una carga excesiva de complejidad sobre el desarrollador.

---

#### SECCIÓN C — Identificación de riesgos y trade-offs (3 preguntas abiertas, ~3 min)

**C1.** ¿Qué riesgo arquitectónico considera más relevante en el diseño to-be presentado?
*(Sugerencia: piense en latencia, dependencias circulares, complejidad operacional, costo de cambio, etc.)*
[Respuesta abierta — máx. 500 caracteres]

**C2.** ¿Qué trade-off identifica como más crítico entre los presentados?
*(Por ejemplo: latencia adicional +119 % en IoT por subflujos vs ganancia en modularidad.)*
[Respuesta abierta — máx. 500 caracteres]

**C3.** ¿Qué regla o patrón del framework cuestionaría, refinaría o agregaría?
[Respuesta abierta — máx. 500 caracteres]

---

#### SECCIÓN D — Percepción global (2 preguntas, ~1 min)

**D1.** En una escala de 1 a 10, ¿cómo califica globalmente el micro-framework propuesto?
*Escala 1–10*

**D2.** ¿Adoptaría este framework (o sus principios) en un proyecto LC/NC actual o futuro?
- Sí, sin modificaciones mayores
- Sí, con adaptaciones a mi contexto
- Tal vez, requeriría más evidencia
- No lo adoptaría

*Si respondió "Tal vez" o "No", por favor justifique brevemente:*
[Respuesta abierta opcional — máx. 300 caracteres]

---

#### SECCIÓN E — Mini-ATAM (OPCIONAL, sólo para expertos invitados — ~15 min adicionales)

*Esta sección es opcional. Si su rol y experiencia se lo permiten, le invitamos a evaluar los 12 escenarios ATAM con scoring de severidad as-is vs to-be y clasificación arquitectónica.*

[Enlace a formulario complementario con plantilla por escenario:]
- Score as-is (1-5)
- Score to-be (1-5)
- Clasificación arquitectónica: ☐ Non-risk ☐ Sensitivity ☐ Tradeoff ☐ Risk
- Confianza (1-5)
- Comentario libre

---

### D.3 — Material de apoyo (3.5 h)
**Carpeta:** `atam/material-apoyo/`

**a) PDF resumen ejecutivo (4 páginas)** — `resumen-proyecto.pdf`

Estructura:
- **Página 1:** Problema (LC/NC sin gobernanza) + propuesta (micro-framework E1–E4) + 1 diagrama del metamodelo
- **Página 2:** 2 casos de estudio (Bot + IoT) — diagramas comparativos as-is vs to-be (1 caso por columna)
- **Página 3:** Tabla de resultados cuantitativos clave (impacto CR, fallos, latencia, MTTD, checklist)
- **Página 4:** Hallazgos arquitectónicos preliminares (SP/TP/R/NR) + preguntas clave para el evaluador

**b) Guion de video (5 min)** — `guion-video.md`

Estructura:
- 0:00–0:30 — Quién soy y qué es este proyecto (MGADS)
- 0:30–1:30 — Problema: caso real LC/NC sin arquitectura clara → consecuencias
- 1:30–2:30 — Propuesta: micro-framework E1–E4 con 10 reglas, 5 patrones, DevSecOps
- 2:30–3:30 — Caso Bot: as-is → to-be → métricas
- 3:30–4:30 — Caso IoT: as-is → to-be → métricas + hallazgos ATAM (SP/TP)
- 4:30–5:00 — Qué necesito de usted (revisar PDF + 10 min encuesta) + agradecimiento

Grabar con Loom o OBS Studio. Subir a YouTube (no listado) o Loom.

**c) Diagrama animado o estático** — `diagrama-comparativo.png`

Mermaid + Excalidraw para mostrar lado a lado as-is vs to-be con anotaciones por etapa.

### D.4 — Plan de análisis estadístico (1 h)
**Archivo:** `atam/plan-analisis-encuesta.md`

Contenido:

**Análisis cuantitativo (Sección A, B, D1, D2):**
- Estadística descriptiva: frecuencias, porcentajes, media, mediana, desviación estándar por ítem Likert
- Distribución de respondentes por rol y experiencia (Sección A) para caracterizar la muestra
- Test de consistencia interna: Cronbach's α por grupo de ítems relacionados (si N ≥ 15)
- Análisis correlacional ligero: ¿la percepción del framework (B7-B8) varía según el rol o experiencia?

**Análisis cualitativo (Sección C, D2 justificación):**
- Codificación abierta de respuestas (Strauss & Corbin 1990)
- Identificación de categorías emergentes de riesgos y trade-offs
- Tabla de frecuencia de categorías mencionadas
- Citas representativas para incluir en el informe

**Análisis mini-ATAM (Sección E):**
- Comparación de scoring as-is vs to-be entre expertos (boxplot por escenario)
- Inter-rater agreement: Cohen's κ (2 expertos) o Krippendorff's α (≥ 3 expertos)
- Concordancia en clasificación arquitectónica (SP/TP/R/NR)

**Criterios de aceptación de la muestra:**
- N ≥ 15 para Sección A-D (mínimo para reporte descriptivo)
- N ≥ 3 expertos para Sección E (saturación cualitativa)
- Heterogeneidad de roles: al menos 3 roles distintos representados

**Herramientas:**
- Exportar respuestas a CSV desde Google Forms
- Análisis en Python (pandas, scipy.stats, krippendorff) — notebook `analisis-encuesta.ipynb`
- Visualizaciones con matplotlib/seaborn

### D.5 — Plan de difusión y lista de candidatos (30 min)
**Archivo:** `atam/plan-difusion.md`

Canales de difusión:
- Email personal a colegas seleccionados
- Mensajes directos LinkedIn a contactos con perfil adecuado
- Comunidades n8n (Discord oficial, foro)
- Grupos de WhatsApp/Telegram académicos y profesionales
- Compañeros y profesores de MGADS

**Plantilla de invitación corta:**
```
Hola [nombre],

Estoy en la fase final de mi tesis de Maestría en MGADS-UNAB:
un micro-framework arquitectónico para flujos n8n con principios de Clean
Architecture y DevSecOps, evaluado mediante ATAM.

Necesito tu opinión experta — son 10–12 minutos:
• 5 min revisar 1 PDF + 1 video corto
• 10 min responder una encuesta concisa con escalas y 3 preguntas abiertas

Tu input es valioso porque [razón personalizada según el perfil del invitado].

Link: [URL del formulario]
Material previo: [URL PDF/video]

Mil gracias,
Elian Hernando Gil Sierra
```

**Lista de candidatos** (a llenar en la ejecución — plantilla incluida con columnas: Nombre, Rol, Empresa, Canal, Estado, Fecha invitación, Fecha respuesta, Notas)

### D.6 — Pilotaje (incluido en el esfuerzo de los pasos anteriores)
**Procedimiento:**
- Antes de difundir ampliamente, pilotar con 2–3 personas cercanas
- Recoger feedback sobre claridad de preguntas y tiempo real de respuesta
- Ajustar redacción si la mediana de tiempo supera 15 min

---

## 7. Bloque E — Informe ATAM consolidado {#7-bloque-e}
**Esfuerzo:** 16 h ≈ 2 días
**Archivo:** `atam/informe-atam-final.md`

Este es el **capítulo de tesis** correspondiente a R4 (Protocolo e informe ATAM).

### Estructura propuesta (siguiendo Bass et al. 2012, cap. 21)

```
1. Introducción y objetivo
   1.1 Contexto del proyecto y motivación para evaluación arquitectónica
   1.2 Alcance de la evaluación
   1.3 Adaptación metodológica (referencia a metodologia-atam-adaptada.md)

2. Drivers de negocio
   2.1 Características de los casos de estudio
   2.2 Atributos de calidad priorizados (ISO 25010)
   2.3 Stakeholders implícitos

3. Presentación de la arquitectura
   3.1 Arquitectura as-is (Bot, IoT) con diagramas
   3.2 Arquitectura to-be (Bot, IoT) con diagramas
   3.3 Approaches arquitectónicos aplicados (referencia a analisis-approaches.md)

4. Utility tree
   4.1 12 escenarios top-K (importados de atam-utility-tree.md)
   4.2 Priorización (importancia × dificultad)

5. Análisis de los approaches
   5.1 Sensitivity Points identificados
   5.2 Tradeoff Points identificados
   5.3 Risks identificados
   5.4 Non-risks identificados
   5.5 Matriz consolidada (tabla resumen)

6. Matriz de scoring as-is vs to-be
   6.1 Metodología de scoring
   6.2 Tabla completa por escenario (referencia a matriz-scoring.md)
   6.3 Visualización (radar chart por caso)

7. Evaluación cuantitativa de evidencia
   7.1 Métricas operacionales (resumen de comparacion-2026-05-05.md)
   7.2 Métricas de mantenibilidad (cr-logs)
   7.3 Métricas de seguridad (validar-flujos.mjs)
   7.4 Métricas de operabilidad (MTTD)

8. Validación externa por panel de expertos
   [PLACEHOLDER — completar tras ejecución de la encuesta]
   8.1 Perfil de respondentes
   8.2 Resultados cuantitativos (Likert)
   8.3 Análisis cualitativo (categorías emergentes)
   8.4 Inter-rater agreement (mini-ATAM)
   8.5 Triangulación con evidencia cuantitativa

9. Síntesis de hallazgos
   9.1 Top 5 riesgos arquitectónicos identificados
   9.2 Top 3 trade-offs principales
   9.3 Validación de las metas del anteproyecto
   9.4 Limitaciones del estudio

10. Conclusiones de la evaluación ATAM
    10.1 ¿El micro-framework mejora los atributos priorizados?
    10.2 Recomendaciones para adopción
    10.3 Trabajo futuro (puntos no resueltos)

Anexos
A. Utility tree completo
B. Matriz de scoring detallada
C. Plantillas de la encuesta
D. Datos crudos anonimizados (CSV)
```

**Estrategia de redacción:**
- Las secciones 1–7 y 9.1–9.3 + 10 se redactan ahora (sin depender de la encuesta)
- La sección 8 queda con placeholder claramente delimitado
- La sección 9.4 incluye desde ya las limitaciones (entre ellas, dependencia de respuestas del panel)

---

## 8. Bloque F — Cierre y trazabilidad {#8-bloque-f}
**Esfuerzo:** 2 h

### F.1 — Actualizar `estado-actual.md` (30 min)
- Marcar Fase 7 como "En ejecución avanzada (90 %) — pendiente solo encuesta externa"
- Actualizar tabla principal de fases
- Actualizar lista de pendientes inmediatos

### F.2 — Índice consolidado de artefactos ATAM (30 min)
**Archivo:** `atam/INDEX.md`
Lista todos los archivos producidos en Fase 7 con su propósito.

### F.3 — Checklist final de "Listo para encuesta" (15 min)
- [ ] Material de apoyo subido a hosting accesible (URL pública)
- [ ] Formulario Google Forms creado y pilotado
- [ ] Lista de invitados con ≥ 20 candidatos
- [ ] Plantilla de invitación lista
- [ ] Plan de seguimiento (recordatorios a 7 y 14 días)

### F.4 — Commit final del bloque (45 min)
- Mensaje: `[FASE-7] feat: cierre completo de ATAM previo a encuesta`
- Incluye: todos los documentos generados en Bloques A-F
- Crear issue en GitHub para "Ejecutar encuesta de validación externa"

---

## 9. Cronograma sugerido {#9-cronograma-sugerido}

Asumiendo dedicación de ~8 h/día:

| Día | Bloques | Salida tangible |
|---|---|---|
| **Día 1** | A completo + B.1 (4+4 h) | Evidencia 100 % + analisis-approaches.md §1 |
| **Día 2** | B.2 (8 h) | analisis-approaches.md §2 completo (SP/TP/R/NR para 12 escenarios) |
| **Día 3** | B.3 + B.4 + C completo (3+1+4 h) | matriz-scoring.md, registro-riesgos-tradeoffs.md, ADR-MF-004, metodologia-atam-adaptada.md |
| **Día 4** | D.1 + D.2 + D.5 (2+5+1 h, deja D.3 para día 5) | protocolo-encuesta.md, instrumento-encuesta.md, plan-difusion.md |
| **Día 5** | D.3 + D.4 + pilotaje (3.5+1+3 h) | material-apoyo/ completo, plan-analisis-encuesta.md, pilotaje con 2 personas |
| **Día 6** | E parte 1 (8 h) | Informe ATAM secciones 1–6 |
| **Día 7** | E parte 2 + F (8+2 h) | Informe ATAM completo (con placeholder §8), cierre y commit |

**Holgura:** el cronograma del anteproyecto reserva del 06/07 al 24/07 para Fase 7 (3 semanas). Este plan se ejecuta en ~7 días → quedan ~14 días de holgura para la recolección de respuestas.

---

## 10. Estructura final de artefactos {#10-estructura-final-de-artefactos}

```
atam/
├── INDEX.md                                 # Índice de todos los artefactos
├── plan-trabajo-fase7.md                    # Este documento
├── metodologia-atam-adaptada.md             # Bloque C.2
├── analisis-approaches.md                   # Bloque B.1 + B.2
├── matriz-scoring.md                        # Bloque B.3
├── registro-riesgos-tradeoffs.md            # Bloque B.4
├── informe-atam-final.md                    # Bloque E (capítulo de tesis)
├── protocolo-encuesta.md                    # Bloque D.1
├── instrumento-encuesta.md                  # Bloque D.2
├── plan-analisis-encuesta.md                # Bloque D.4
├── plan-difusion.md                         # Bloque D.5
└── material-apoyo/
    ├── resumen-proyecto.pdf                 # PDF 4 págs
    ├── guion-video.md                       # Guion del video
    ├── diagrama-comparativo.png             # Diagrama as-is vs to-be
    └── README.md                            # URLs de hosting del material

microframework/adr/
└── ADR-MF-004-atam-adaptado-individual.md   # Bloque C.1

medicion/consolidado/
├── atam-evidencia.md                        # Actualizado (BOT-Q5 ✅)
└── mttd-resultado.md                        # Actualizado (BOT-Q5 runtime + NR-IOT-01 verificado)
```

---

## 11. Definición de "Listo" {#11-definicion-de-listo}

Al completar los Bloques A–F, OE3 alcanza **~90 %** con los siguientes criterios cumplidos:

✅ Cobertura ATAM **12/12 = 100 %** con evidencia runtime
✅ Análisis formal de approaches arquitectónicos completo
✅ Matriz de scoring 1–5 as-is/to-be para los 12 escenarios
✅ Registro consolidado de riesgos y trade-offs
✅ Adaptación metodológica documentada con sustento académico
✅ Instrumento de encuesta diseñado, pilotado y listo para distribuir
✅ Material de apoyo producido y hosteado
✅ Plan de análisis estadístico definido
✅ Informe ATAM consolidado redactado (con placeholder de §8 esperando datos de encuesta)

**Único pendiente para llegar a 100 %:**
- 🕓 Ejecutar campaña de encuesta (~2–3 semanas de recolección)
- 🕓 Analizar respuestas recibidas (~3–5 días)
- 🕓 Completar §8 del informe + ajuste de §9-10 según hallazgos (~1 día)

---

## Referencias

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley. Cap. 21 — ATAM.
- Kazman, R., Klein, M. & Clements, P. (2000). *ATAM: Method for Architecture Evaluation*. CMU/SEI-2000-TR-004.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer. Cap. 8 — Personal Opinion Surveys.
- Kitchenham, B. & Pfleeger, S. L. (2008). *Personal Opinion Surveys*. In Guide to Advanced Empirical Software Engineering (pp. 63–92). Springer.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Denzin, N. K. (1978). *The Research Act: A Theoretical Introduction to Sociological Methods*. McGraw-Hill. — Triangulación metodológica.
- ISO/IEC 25010:2011 — Systems and software quality models.
