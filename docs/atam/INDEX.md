# Índice de artefactos — Fase 7 · Evaluación ATAM

**Versión:** 1.0
**Fecha:** 2026-05-07
**OE3 alcanzado:** ~90 % — pendiente solo ejecución de encuesta y análisis de respuestas

---

## Artefactos por bloque del plan de trabajo

### Bloque A — Evidencia residual completada

| Artefacto | Propósito | Estado |
|---|---|---|
| `medicion/consolidado/atam-evidencia.md` v1.1 | Matriz 12 escenarios × evidencia — cobertura 11/12 (92%) | ✅ |
| `medicion/consolidado/mttd-resultado.md` | MTTD BOT-Q5 (<15s) + IOT-Q4 runtime + NR-IOT-01 verificado | ✅ |
| `medicion/run-logs/iot/run-log-iot-to-be.csv` | Filas adicionales de test IOT-Q4 runtime | ✅ |
| `medicion/analisis_iot_q5.py` | Script de análisis IOT-Q5 (distribución latencia por nivel_alerta) | ✅ |

**Cobertura ATAM alcanzada:** Bot 5/6 = 83% ✅ · IoT 6/6 = 100% ✅ · Total 11/12 = 92% ✅

---

### Bloque B — Análisis formal de approaches ATAM

| Artefacto | Propósito | Estado |
|---|---|---|
| `docs/atam/analisis-approaches.md` | 12 approaches arquitectónicos + clasificación SP/TP/R/NR × 12 escenarios | ✅ |
| `docs/atam/matriz-scoring.md` | Scoring 1–5 as-is vs to-be por escenario con justificación y evidencia | ✅ |
| `docs/atam/registro-riesgos-tradeoffs.md` | Registro consolidado: 3 SP · 3 TP · 4 R · 5 NR | ✅ |

**Hallazgos formalizados:**
- **3 Sensitivity Points:** SP-BOT-01, SP-BOT-02, SP-IOT-01
- **3 Tradeoff Points:** TP-GLOBAL-01, TP-GLOBAL-02, TP-IOT-01
- **4 Risks:** R-BOT-01, R-IOT-01, R-GLOBAL-01, R-GLOBAL-02
- **5 Non-risks:** NR-BOT-01, NR-BOT-02, NR-IOT-01, NR-IOT-02, NR-GLOBAL-01

---

### Bloque C — Adaptación metodológica documentada

| Artefacto | Propósito | Estado |
|---|---|---|
| `microframework/adr/ADR-MF-004-atam-adaptado-individual.md` | Decisión formal: ATAM modificado asíncrono para investigador individual | ✅ |
| `docs/atam/metodologia-atam-adaptada.md` | Marco ATAM adaptado — justificación, mapeo paso a paso, mitigación de sesgos | ✅ |

---

### Bloque D — Instrumento de validación externa

| Artefacto | Propósito | Estado |
|---|---|---|
| `docs/atam/protocolo-encuesta.md` | Protocolo: criterios, consentimiento, tamaño muestral, plataforma | ✅ |
| `docs/atam/instrumento-encuesta.md` | Encuesta completa: 18 preguntas (Sección A–E) + mini-ATAM opcional | ✅ |
| `docs/atam/plan-analisis-encuesta.md` | Plan estadístico: descriptiva, Cronbach α, codificación abierta, κ | ✅ |
| `docs/atam/plan-difusion.md` | Canales de difusión, plantillas de invitación, lista de candidatos | ✅ |
| `docs/atam/material-apoyo/resumen-proyecto.md` | Fuente Markdown del PDF de 4 páginas para respondentes | ✅ |
| `docs/atam/material-apoyo/guion-video.md` | Guion del video de 5 minutos para respondentes | ✅ |
| `docs/atam/material-apoyo/diagrama-comparativo.md` | Diagramas Mermaid as-is vs to-be para PDF y diapositivas | ✅ |
| `docs/atam/material-apoyo/README.md` | Índice de URLs públicas — PDF, video, formulario (PENDIENTE hosting) | ✅ |

**Pendiente de ejecución (fuera del control del autor):**
- [ ] Generar PDF desde `resumen-proyecto.md` y subir a Google Drive (URL pública)
- [ ] Grabar video siguiendo `guion-video.md` y subir a Loom/YouTube
- [ ] Crear Google Form siguiendo `instrumento-encuesta.md`
- [ ] Actualizar URLs en `material-apoyo/README.md`, `instrumento-encuesta.md` y `plan-difusion.md`
- [ ] Pilotar con 2–3 personas cercanas antes de difusión amplia
- [ ] Distribuir a ≥ 20 candidatos según `plan-difusion.md`

---

### Bloque E — Informe ATAM consolidado

| Artefacto | Propósito | Estado |
|---|---|---|
| `docs/atam/informe-atam-final.md` | Capítulo de tesis R4 — 10 secciones completas + placeholder §8 encuesta | ✅ |

**Sección reservada:** §8 "Validación externa por panel de expertos" contiene placeholder estructurado listo para completar con los datos de la encuesta.

---

### Bloque F — Cierre y trazabilidad

| Artefacto | Propósito | Estado |
|---|---|---|
| `docs/atam/INDEX.md` | Este archivo — índice de todos los artefactos de Fase 7 | ✅ |
| `estado-actual.md` | Fuente de verdad de avance — Fase 7 actualizada a ~90% | ✅ |

---

## Trazabilidad completa: Escenarios ATAM → Evidencia → Approaches

| Escenario | Atributo | Score as-is | Score to-be | Approaches | Hallazgos |
|---|---|:---:|:---:|---|---|
| BOT-Q1 | Mantenibilidad | 2 | 5 | AP-01, AP-02, AP-10 | NR-BOT-01 |
| BOT-Q2 | Mantenibilidad | 2 | 5 | AP-01, AP-02 | NR-BOT-01 |
| BOT-Q3 | Seguridad | 1 | 5 | AP-03, AP-08, AP-11 | NR-BOT-02 |
| BOT-Q4 | Fiabilidad | 1 | 4 | AP-04, AP-05 | SP-BOT-01 |
| BOT-Q5 | Operabilidad | 1 | 5 | AP-07 | SP-BOT-02, NR-GLOBAL-01 |
| BOT-Q6 | Adec. funcional | 2 | 5 | AP-08 | NR-BOT-02 |
| IOT-Q1 | Mantenibilidad | 2 | 5 | AP-01, AP-10 | NR-GLOBAL-01 |
| IOT-Q2 | Mantenibilidad | 2 | 5 | AP-01, AP-09 | — |
| IOT-Q3 | Fiabilidad | 1 | 5 | AP-05, AP-08, AP-12 | NR-IOT-02 |
| IOT-Q4 | Fiabilidad | 1 | 3 | AP-04, AP-06 | SP-IOT-01, R-IOT-01, NR-IOT-01 |
| IOT-Q5 | Confiabilidad | 2 | 4 | AP-09, AP-04 | TP-IOT-01 |
| IOT-Q6 | Seguridad | 1 | 5 | AP-03, AP-11 | NR-GLOBAL-01 |

---

## Artefactos preexistentes (Fases 1–6) referenciados en Fase 7

```
docs/context/atam-utility-tree.md           → Utility Tree con 12 escenarios top-K
medicion/consolidado/comparacion-2026-05-05.md → Métricas comparativas principales
medicion/consolidado/metricas-derivadas.md  → Análisis detallado de latencia y fallos
medicion/run-logs/{bot,iot}/run-log-*-to-be.csv → Evidencia de 8000 corridas
medicion/cr-logs/{bot,iot}/cr-log-*-to-be.csv  → Evidencia de 12 CRs
microframework/validacion/reportes/validacion-2026-05-06.md → Validación estática 100%
casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md → RF→ADR→ISO→ATAM v1.3
casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md → RF→ADR→ISO→ATAM v1.3
```

---

## Definición de "Listo para encuesta"

- [x] Cobertura ATAM ≥ 80% por caso (Bot 83% ✅, IoT 100% ✅)
- [x] 15 hallazgos arquitectónicos formalizados (3 SP + 3 TP + 4 R + 5 NR)
- [x] Scoring 1–5 as-is/to-be para los 12 escenarios
- [x] Instrumento de encuesta diseñado (18 preguntas + mini-ATAM)
- [x] Material de apoyo producido (PDF fuente + guion video + diagramas)
- [x] Informe ATAM consolidado redactado (§8 con placeholder estructurado)
- [ ] PDF generado y hosteado con URL pública
- [ ] Video grabado y hosteado
- [ ] Google Form creado con las URLs actualizadas
- [ ] Pilotaje con 2–3 respondentes cercanos
- [ ] Campaña de difusión iniciada (≥ 20 invitaciones enviadas)
