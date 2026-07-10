# Codificación temática — Secciones C (C1) y E (E4), n = 17

Codificación abierta (Strauss & Corbin, 1990) de las 17 respuestas C1 y las 15 respuestas E4
no vacías/no triviales ("Ninguna"/"no" se excluyen del conteo temático pero cuentan para N).
Contrastada con `docs/atam/registro-riesgos-tradeoffs.md`.

## Categorías alineadas con hallazgos del autor

| Categoría | Respondientes | Frecuencia | Convergencia |
|---|---|:---:|---|
| Latencia acumulada por subflujos secuenciales en IoT | R-001, R-004, R-005, R-011 | 4/17 (24%) | Converge con TP-GLOBAL-01 |
| Dead-letter / error handler acoplado al canal de E4 | R-001, R-011 (mención clara); R-005, R-014, R-018 (relacionada, vía disponibilidad de BD o alertas) | 2/17 clara, 5/17 relacionada | Converge con SP-IOT-01 / R-IOT-01 |
| Gestión de secretos sin rotación, auditoría ni revocación | R-008, R-015 | 2/17 (12%) | Converge con R-BOT-01 |
| Reglas uniformes sin clasificación por criticidad del flujo | R-003 | 1/17 (6%) | Emergente (no en el registro del autor) |
| Ausencia de escenario de carga, escalabilidad y concurrencia | R-001, R-004, R-005, R-008, R-015, R-016, R-018 | 7/17 (41%) | Emergente — la categoría más frecuente del panel |
| Punto único de falla del orquestador (REG-002) no evaluado | R-015 (explícito); R-005 (cuestiona el orquestador único de forma tangencial) | 1/17 explícita | Emergente |
| Testabilidad y curva de aprendizaje no evaluadas | R-010, R-013 | 2/17 (12%) | Emergente |

## Hallazgos adicionales identificados en esta codificación (no listados explícitamente en la síntesis previa del autor)

| Observación | Respondiente | Nota |
|---|---|---|
| Resistencia organizacional/cultural a la restricción de E2 en equipos sin cultura arquitectónica | R-016 | Riesgo de adopción, distinto de un riesgo puramente técnico |
| Perspectiva del consumidor del API ante contratos HTTP incorrectos | R-017 | Enriquece NR-BOT-02 con el ángulo del cliente aguas abajo |
| Extender retry con backoff a llamadas internas entre subflujos, no solo HTTP saliente | R-013 | Sugerencia de refinamiento a REG-004 |
| Validación metodológica independiente del scoring ATAM (evaluadores externos) | R-005 | Comentario sobre el propio diseño de la evaluación, no sobre el framework |
| Postura de seguridad de n8n más amplia que REG-001 (superficie de ataque general) | R-012 | Fuera del alcance actual de las reglas del framework |

## Comentarios sin contenido temático

R-002, R-006, R-007 respondieron "Ninguna"/vacío en C1. R-003, R-006, R-007 respondieron
"no"/"Ninguna" en E4.

## Nota metodológica

Esta codificación se realizó releyendo las 17 respuestas C1 y las respuestas E4
correspondientes directamente desde `respuestas-anonimizadas-2026-06-24.csv`, como paso de
verificación cruzada dentro del pipeline reproducible de análisis (`analisis-encuesta.py`).
Los conteos por categoría pueden diferir levemente de la síntesis original por tratarse de
una tarea con juicio interpretativo; las categorías y su presencia/ausencia general son, sin
embargo, consistentes con las reportadas en la síntesis del estudio (Tabla 40).
