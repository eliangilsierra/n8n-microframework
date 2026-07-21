> 🌐 **Idioma / Language:** Español · [English](plan-analisis-encuesta.en.md)

# Plan de Análisis Estadístico de la Encuesta de Validación Externa

**Versión:** 1.0
**Fecha de redacción:** 2026-05-07
**Estado:** Definido **antes** de iniciar la recolección (compromiso pre-registro para prevenir HARKing)
**Protocolo:** [`protocolo-encuesta.md`](protocolo-encuesta.md)
**Instrumento:** [`instrumento-encuesta.md`](instrumento-encuesta.md)
**Propósito:** Definir con antelación los análisis que se aplicarán a las respuestas recibidas. Documentar este plan **antes** de tener los datos previene el sesgo de selección de pruebas estadísticas convenientes (Hypothesizing After Results are Known) y aumenta la credibilidad metodológica del estudio.

---

## 1. Principios rectores

1. **Pre-registro.** Todas las pruebas estadísticas y umbrales de decisión están definidos en este documento antes de tener los datos. Si durante el análisis surge la necesidad de pruebas adicionales no contempladas, se reportarán explícitamente como "exploratorias".

2. **Estadística descriptiva primero.** Dado el tamaño muestral esperado (15–30), la prioridad es reporte descriptivo honesto. Las pruebas inferenciales se reservan para hipótesis con poder estadístico suficiente.

3. **Análisis cualitativo riguroso.** Las preguntas abiertas (Sección C) se analizan con codificación temática siguiendo Strauss & Corbin (1990), no como anécdotas sueltas.

4. **Transparencia.** El notebook de análisis se versiona en el repositorio; los datos crudos anonimizados son anexo del trabajo de grado.

5. **Honesty over significance.** Si los resultados no son concluyentes, se reporta así. Si la muestra es insuficiente, se reportan los hallazgos como exploratorios.

---

## 2. Preparación de datos

### 2.1 Exportación

Desde Google Forms → Sheets → exportar a CSV con codificación UTF-8.

Archivo destino: `medicion/encuesta-validacion/respuestas-crudas-{YYYY-MM-DD}.csv`

### 2.2 Limpieza

| Operación | Criterio |
|---|---|
| Eliminar respuestas con A2 = "Menos de 3 años" | Auto-descalifica por filtro del formulario; debería ser 0 filas si el filtro funcionó |
| Marcar respuestas con tiempo total < 5 min como "respuestas rápidas" | Sospechosa de respuesta no reflexiva; analizar por separado |
| Marcar respuestas con tiempo total > 60 min como "atípicas" | Probable que el respondente dejó pestaña abierta; revisar caso por caso |
| Asignar `respondent_id` secuencial (R-001, R-002, …) | Anonimización |
| Eliminar columna de correo opcional (F1) | Mover a hoja separada no commiteada |
| Convertir Likert texto a numérico (1-5) | Para análisis estadístico |
| Codificar opciones múltiples a categorías nominales | Para frecuencias |

### 2.3 Validación de integridad

Verificaciones a ejecutar antes del análisis:

- Todas las preguntas obligatorias tienen respuesta (no NaN)
- Tipos numéricos en columnas Likert (no strings)
- Tiempo total de respuesta calculado a partir de timestamps de inicio y envío
- Conteo de respuestas vs umbrales del protocolo (§7 de `protocolo-encuesta.md`)

### 2.4 Archivos generados

```
medicion/encuesta-validacion/
├── respuestas-crudas-{fecha}.csv             # original sin modificar
├── respuestas-anonimizadas-{fecha}.csv       # sin correo, con respondent_id
├── respuestas-limpias-{fecha}.csv            # post-limpieza, listas para análisis
├── analisis-encuesta.ipynb                   # notebook Python con todos los análisis
└── outputs/
    ├── descriptivos-seccion-a.csv
    ├── descriptivos-seccion-b.csv
    ├── categorias-emergentes-seccion-c.md
    ├── matriz-comparacion-scoring-seccion-e.csv
    └── figuras/                              # PNG de plots
```

---

## 3. Análisis por sección

### 3.1 Sección A — Caracterización del respondente

**Objetivo.** Describir el perfil del panel y demostrar heterogeneidad.

**Análisis a ejecutar:**

| Análisis | Sobre | Output |
|---|---|---|
| Frecuencia y porcentaje | A1 (rol) | Tabla + diagrama de barras |
| Distribución | A2 (experiencia) | Histograma |
| Media, mediana, σ | A3, A4, A5 (familiaridades) | Tabla descriptiva |
| Verificación de heterogeneidad | A1 + A2 | Tabla cruzada rol × experiencia |

**Criterio de heterogeneidad aceptable:**
- ≥ 3 roles distintos representados con al menos 2 respondentes cada uno
- Distribución de experiencia con al menos un respondente en cada bucket (3-5, 5-10, >10)

**Reporte:** sección 8.1 del informe ATAM ("Perfil de respondentes").

---

### 3.2 Sección B — Validación percibida

**Objetivo.** Cuantificar el nivel de acuerdo de los respondentes con las afirmaciones del framework.

**Análisis descriptivo (por ítem):**

| Estadístico | Aplica a | Interpretación |
|---|---|---|
| Media | B1–B8 | Centralidad del acuerdo |
| Mediana | B1–B8 | Robusta a outliers; más relevante con Likert |
| Desviación estándar | B1–B8 | Dispersión / consenso |
| % de respuestas ≥ 4 ("De acuerdo" + "Totalmente de acuerdo") | B1–B8 | "Tasa de aprobación" |
| % de respuestas = 3 (Neutral) | B1–B8 | Indica falta de criterio o ítem ambiguo |
| % de respuestas ≤ 2 ("En desacuerdo" + "Totalmente en desacuerdo") | B1–B8 | "Tasa de rechazo" |

**Criterio interpretativo (definido a priori):**

| Mediana | % ≥ 4 | Lectura |
|:---:|:---:|---|
| ≥ 4 | ≥ 70 % | El framework valida fuertemente este aspecto |
| ≥ 4 | 50–70 % | Validación moderada; revisar % neutrales y desacuerdos |
| 3 | cualquier | Ítem polarizado o respondentes sin criterio; revisar comentarios cualitativos |
| ≤ 3 | < 50 % | Validación débil; el aspecto requiere revisión del framework |

**Análisis de consistencia interna (solo si N ≥ 15):**

Cronbach's α calculado por grupos lógicos de ítems:

| Grupo | Ítems | Hipótesis |
|---|---|---|
| Mantenibilidad | B1, B2 | α ≥ 0.70 indica que ambos ítems miden el mismo constructo |
| Fiabilidad | B3, B4 | idem |
| Aplicabilidad | B7, B8 | idem |

α < 0.50 indica que los ítems miden constructos distintos y se reportan separadamente.

**Análisis correlacional ligero (exploratorio):**

¿La valoración del framework varía según el perfil del respondente?

| Variable independiente | Variable dependiente | Prueba |
|---|---|---|
| A1 rol | Media de B1-B8 | Kruskal-Wallis (no paramétrica) |
| A2 experiencia | Media de B1-B8 | Correlación de Spearman |
| A3 familiaridad LC/NC | Media de B7-B8 (aplicabilidad) | Correlación de Spearman |
| A5 familiaridad ATAM | D1 score global | Correlación de Spearman |

Reportar con tamaño del efecto (no solo p-valor). Con N pequeño los p-valores son inestables; el tamaño del efecto es más informativo.

**Reporte:** sección 8.2 del informe ATAM ("Resultados cuantitativos").

---

### 3.3 Sección C — Riesgos y trade-offs (análisis cualitativo)

**Objetivo.** Identificar las categorías emergentes de riesgos, trade-offs y refinamientos que el panel identifica de forma independiente, y compararlos con los hallazgos del autor (`registro-riesgos-tradeoffs.md`).

**Procedimiento — Codificación abierta (Strauss & Corbin, 1990):**

**Paso 1 — Lectura inmersiva.** Leer las 3 × N respuestas completas sin codificar, para familiarización con el corpus.

**Paso 2 — Codificación abierta.** Para cada respuesta, identificar concepto(s) clave y asignar código(s) descriptivo(s). Ejemplos:
- "El overhead de subflujos es preocupante para sistemas con SLA estricto" → códigos: `latencia_subflujos`, `SLA_critico`
- "Falta política de rotación de credenciales" → códigos: `gestion_credenciales`, `rotacion_secretos`

**Paso 3 — Agrupación en categorías.** Agrupar códigos relacionados en categorías de mayor nivel. Ejemplos:
- Categoría "Riesgos de operación" → códigos: `gestion_credenciales`, `monitoreo_runtime`, `dependencia_n8n`
- Categoría "Trade-off latencia" → códigos: `latencia_subflujos`, `SLA_critico`, `overhead_execute_workflow`

**Paso 4 — Tabla de frecuencia.** Reportar cuántos respondentes mencionan cada categoría.

**Paso 5 — Comparación con hallazgos del autor.** Para cada categoría emergente, indicar si corresponde a un hallazgo ya documentado en `registro-riesgos-tradeoffs.md` (convergencia) o si es nuevo (divergencia).

**Formato de reporte:**

| Categoría emergente | # respondentes | % | Convergencia con hallazgos del autor | Citas representativas |
|---|:---:|:---:|---|---|
| Trade-off latencia subflujos | 8 | 53 % | ✅ TP-GLOBAL-01 | "El overhead +119 % en IoT es difícil de justificar para alertas en tiempo real" (R-012) |
| Gestión de credenciales | 5 | 33 % | ✅ R-BOT-01 | "Falta política clara de rotación" (R-003) |
| Acoplamiento al runtime n8n | 3 | 20 % | ❌ Nuevo | "Si n8n cambia el comportamiento de Execute Workflow, todo el framework se ve afectado" (R-007) |
| ... | ... | ... | ... | ... |

**Criterio de saturación:** se considera que la codificación ha alcanzado saturación cuando una nueva respuesta no genera categorías nuevas. Con N = 15-30 y preguntas abiertas focalizadas, la saturación se alcanza típicamente entre las respuestas 10-15.

**Nuevos hallazgos emergentes (no en el registro del autor):** se incorporan como anexo "Hallazgos identificados por el panel" en el informe ATAM final y se discuten en la sección 9 (Síntesis).

**Reporte:** sección 8.3 del informe ATAM ("Análisis cualitativo").

---

### 3.4 Sección D — Percepción global

**D1 — Score 1-10:**

| Estadístico | Valor a calcular |
|---|---|
| Media | — |
| Mediana | — |
| Desviación estándar | — |
| Mínimo, máximo | — |
| Distribución | Histograma con etiquetas |

**Interpretación a priori:**

| Media D1 | Lectura |
|:---:|---|
| ≥ 8.0 | Framework muy bien recibido |
| 7.0–7.9 | Bien recibido con observaciones |
| 5.0–6.9 | Recibido tibiamente; revisar críticas |
| < 5.0 | Mal recibido; reevaluación profunda necesaria |

**D2 — Intención de adopción:**

| Análisis | Output |
|---|---|
| Distribución de respuestas | Diagrama de barras |
| % de "Sí" (sin/con adaptaciones) | "Tasa de intención de adopción" |
| Justificaciones de "Tal vez" / "No" | Análisis cualitativo similar a Sección C |

**Reporte:** sección 8.2 (cuantitativo D1) + 8.3 (cualitativo D2-bis) del informe ATAM.

---

### 3.5 Sección E — Mini-ATAM (3-5 expertos)

**Objetivo.** Triangular el scoring 1-5 as-is/to-be del autor (`matriz-scoring.md`) con la opinión independiente de expertos.

**Análisis comparativo (por escenario):**

Para cada uno de los 12 escenarios:

| Métrica | Cálculo |
|---|---|
| Score as-is autor | Valor de `matriz-scoring.md` |
| Score as-is panel — mediana | Mediana de las E.a respuestas |
| Score as-is panel — rango | min, max de las E.a respuestas |
| Δ as-is autor vs panel | autor − mediana panel |
| Score to-be autor | Valor de `matriz-scoring.md` |
| Score to-be panel — mediana | Mediana de las E.b respuestas |
| Score to-be panel — rango | min, max de las E.b respuestas |
| Δ to-be autor vs panel | autor − mediana panel |

**Criterio de convergencia:**
- |Δ| ≤ 1 → convergencia (el autor y el panel coinciden dentro del error de la escala)
- |Δ| = 2 → discrepancia moderada (revisar)
- |Δ| ≥ 3 → discrepancia significativa (sesgo o malentendido posible; reportar)

**Visualización:** boxplot por escenario con marca del valor del autor.

**Análisis de clasificación (SP/TP/R/NR) — E.c:**

| Métrica | Cálculo |
|---|---|
| Clasificación del autor | Valor de `analisis-approaches.md` |
| Clasificación modal del panel | Moda de las E.c respuestas |
| Coincidencia autor vs moda panel | Sí / No |
| Tabla de confusión | Matriz 4×4 (Non-risk/SP/TP/R) |

**Inter-rater agreement entre expertos:**

| Métrica | Cuándo usar | Interpretación |
|---|---|---|
| Cohen's κ | Exactamente 2 expertos | < 0.20 pobre · 0.21-0.40 débil · 0.41-0.60 moderado · 0.61-0.80 sustancial · > 0.80 casi perfecto |
| Krippendorff's α | ≥ 3 expertos | < 0.667 inaceptable · 0.667-0.80 tentativa · ≥ 0.80 aceptable |
| Fleiss' κ | ≥ 3 expertos con categorías nominales | Similar interpretación a Cohen's κ |

Para variables ordinales (scoring 1-5): usar Krippendorff's α con métrica `interval` o `ordinal`.
Para variables nominales (clasificación SP/TP/R/NR): usar Krippendorff's α con métrica `nominal`.

**Implementación Python:**

```python
import krippendorff
# scoring_matrix: filas = escenarios, columnas = expertos, valores = scores 1-5
alpha = krippendorff.alpha(reliability_data=scoring_matrix.T, level_of_measurement='ordinal')

# classification_matrix: filas = escenarios, columnas = expertos, valores = SP/TP/R/NR
alpha_nominal = krippendorff.alpha(reliability_data=classification_matrix.T, level_of_measurement='nominal')
```

**Reporte:** sección 8.4 del informe ATAM ("Triangulación con scoring del autor").

---

## 4. Síntesis integrada

Tras completar los análisis por sección, producir:

### 4.1 Tabla maestra de convergencias

| Hallazgo del autor | Identificado por el panel | Magnitud | Decisión |
|---|---|---|---|
| TP-GLOBAL-01 latencia subflujos | Sí (53 % en C2) | Convergencia fuerte | Confirmado como hallazgo principal |
| SP-IOT-01 canal duplicado error handler | Sí (mencionado por 2 expertos en E13) | Convergencia | Confirmado |
| ... | ... | ... | ... |

### 4.2 Hallazgos emergentes del panel (no anticipados por el autor)

Lista de categorías emergentes con frecuencia ≥ 20 % de respondentes que no corresponden a hallazgos previos.

### 4.3 Discrepancias significativas

Casos donde el autor y el panel divergen en scoring (|Δ| ≥ 2) o en clasificación. Discutir posibles razones y reportar honestamente.

### 4.4 Reporte ejecutivo de validación

Una página con:
- Perfil del panel (heterogeneidad lograda)
- Tasa de aprobación promedio de B1-B8
- Score global D1
- Tasa de intención de adopción D2
- Top 3 hallazgos confirmados
- Top 3 hallazgos emergentes
- Inter-rater agreement del mini-ATAM (si N ≥ 3 expertos)

---

## 5. Estructura del notebook Python

`medicion/encuesta-validacion/analisis-encuesta.ipynb` — estructura recomendada:

```
1. Configuración
   - Imports (pandas, numpy, scipy.stats, matplotlib, seaborn, krippendorff)
   - Lectura del CSV limpio
   - Configuración de seed para reproducibilidad

2. Validación de datos
   - Verificación de N total, completitud, distribución de tiempos de respuesta
   - Reporte de cuántas respuestas pasan los criterios de aceptación

3. Sección A — Caracterización
   - Frecuencias, gráficos, tabla cruzada

4. Sección B — Likert
   - Tabla descriptiva por ítem
   - Cálculo de Cronbach's α por grupos
   - Análisis correlacional con perfil

5. Sección C — Codificación cualitativa
   - Carga del archivo de codificación manual
   - Tabla de frecuencias por categoría
   - Comparación con registro del autor

6. Sección D — Percepción global
   - Histograma de D1
   - Distribución de D2
   - Codificación cualitativa de D2-bis

7. Sección E — Mini-ATAM (si N ≥ 3 expertos)
   - Tabla comparativa por escenario
   - Inter-rater agreement (κ o α)
   - Boxplots y heatmaps de convergencia

8. Síntesis
   - Tabla maestra de convergencias/divergencias
   - Reporte ejecutivo

9. Exportación
   - CSVs de output
   - Figuras PNG para incluir en el informe ATAM
```

**Dependencias Python:**
```
pandas >= 2.0
numpy >= 1.24
scipy >= 1.10
matplotlib >= 3.7
seaborn >= 0.12
krippendorff >= 0.6.1
```

---

## 6. Limitaciones del análisis (a reportar)

- **Tamaño muestral pequeño.** Con N entre 15 y 30 los p-valores son inestables y las pruebas inferenciales tienen poco poder estadístico. El análisis prioriza estadística descriptiva y tamaños de efecto.
- **Mini-ATAM con muy pocos evaluadores (3-5).** Los coeficientes de acuerdo inter-evaluador con N tan pequeño son sensibles a casos individuales. Reportar con intervalo de confianza si es posible (bootstrap).
- **Sesgo del codificador único en Sección C.** La codificación temática la hace el autor, lo cual reintroduce sesgo. Mitigación: documentar el libro de códigos en el notebook para auditoría; revisar con director si es posible.
- **No hay grupo control.** No se compara contra opinión sobre otro framework — la validación es absoluta, no relativa.

---

## 7. Checklist pre-análisis — completado ✓ (con una excepción documentada)

Verificado al cierre de la recolección (24 de junio de 2026):

- [x] Archivo CSV exportado y commiteado en `medicion/encuesta-validacion/`
- [x] Anonimización ejecutada y verificada
- [x] N total ≥ umbral del protocolo (N=17 válidas ≥ 15 ideal)
- [x] Heterogeneidad de roles verificada (5 roles ≥ 3)
- [ ] **Tiempo mediano de respuesta ≥ 7 min — no medible.** Google Forms solo registra la marca
      temporal de envío, no la de inicio ni la duración por respondiente; el instrumento
      desplegado no capturó ese dato. Se documenta como limitación abierta (ver `informe-atam-final.md`
      §11) en lugar de marcarse como verificado sin evidencia.
- [x] Mini-ATAM: 17/17 respondentes válidos completaron la Sección E (≥ 3 requerido)
- [x] Notebook Python configurado con dependencias instaladas (`requirements.txt`, ejecutado end-to-end)
- [x] Plan de análisis (este documento) revisado para confirmar que no se añadieron pruebas no pre-registradas

---

## Referencias

- Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. *Psychometrika*, 16(3), 297-334.
- Krippendorff, K. (2018). *Content Analysis: An Introduction to Its Methodology* (4th ed.). Sage.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer. Cap. 8 y 12.
- Cohen, J. (1960). A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 20(1), 37-46.
- Fleiss, J. L. (1971). Measuring nominal scale agreement among many raters. *Psychological Bulletin*, 76(5), 378-382.
