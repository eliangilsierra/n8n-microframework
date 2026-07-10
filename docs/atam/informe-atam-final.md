> 🌐 **Idioma / Language:** Español · [English](informe-atam-final.en.md)

# Informe Consolidado de Evaluación ATAM
## Micro-framework Arquitectónico LC/NC para n8n

**Capítulo de tesis correspondiente a R4 — Protocolo e Informe ATAM**

**Versión:** 1.1 (sección 8 completa con resultados de la encuesta de validación externa)
**Fecha:** 2026-05-07 (sección 8 actualizada 2026-07-08)
**Autor:** Elian Hernando Gil Sierra
**Director:** Sebastian Roa Prada, PhD
**Programa:** Maestría en Gestión, Aplicación y Desarrollo de Software (MGADS)
**Institución:** Universidad Autónoma de Bucaramanga

---

## Tabla de contenidos

1. [Introducción y objetivo](#1-introducción-y-objetivo)
2. [Drivers de negocio y atributos de calidad](#2-drivers-de-negocio-y-atributos-de-calidad)
3. [Presentación de la arquitectura evaluada](#3-presentación-de-la-arquitectura-evaluada)
4. [Utility tree y escenarios top-K](#4-utility-tree-y-escenarios-top-k)
5. [Análisis de approaches arquitectónicos](#5-análisis-de-approaches-arquitectónicos)
6. [Matriz de scoring as-is vs to-be](#6-matriz-de-scoring-as-is-vs-to-be)
7. [Evaluación cuantitativa de evidencia](#7-evaluación-cuantitativa-de-evidencia)
8. [Validación externa por panel de expertos](#8-validación-externa-por-panel-de-expertos)
9. [Síntesis de hallazgos](#9-síntesis-de-hallazgos)
10. [Conclusiones de la evaluación ATAM](#10-conclusiones-de-la-evaluación-atam)
11. [Limitaciones del estudio](#11-limitaciones-del-estudio)
12. [Trabajo futuro](#12-trabajo-futuro)
13. [Anexos](#13-anexos)
14. [Referencias](#14-referencias)

---

## 1. Introducción y objetivo

Este capítulo presenta los resultados de la evaluación arquitectónica del micro-framework propuesto en el trabajo de grado, aplicada sobre las arquitecturas to-be de dos casos de estudio (un Bot de soporte y un Pipeline IoT) mediante el método ATAM (Architecture Tradeoff Analysis Method) de Bass, Clements y Kazman (2012). La evaluación produce los entregables exigidos por el objetivo específico OE3 del anteproyecto y el resultado R4 del plan de trabajo.

### 1.1 Contexto

El micro-framework propuesto en este trabajo (documentado en `docs/microframework-v1.0.md` y `docs/context/microframework-spec.md`) estructura cualquier flujo n8n en cuatro etapas funcionales (E1 Validación, E2 Dominio, E3 Adaptadores, E4 Salida) y prescribe 10 reglas obligatorias con criterio binario verificable, 6 reglas recomendadas, 5 patrones de diseño y un proceso de validación estática automatizada. El framework está fundamentado en principios de Clean Architecture (Martin, 2017) y prácticas DevSecOps (Feio et al., 2024).

La evaluación arquitectónica es un componente esencial del trabajo de grado porque permite responder preguntas como: ¿el framework efectivamente mejora los atributos de calidad que pretende mejorar? ¿qué trade-offs introduce? ¿qué riesgos arquitectónicos quedan abiertos en la propuesta?

### 1.2 Adaptación metodológica

ATAM en su forma canónica (Kazman et al., 2000) es un proceso colaborativo presencial que requiere stakeholders heterogéneos. Este proyecto de grado individual no dispone de un equipo multi-stakeholder, por lo que se adoptó una **adaptación documentada** denominada "ATAM Modificado Asincrónico con Validación Externa por Panel de Expertos", justificada formalmente en el ADR-MF-004 (`microframework/adr/ADR-MF-004-atam-adaptado-individual.md`) y desarrollada en detalle en `docs/atam/metodologia-atam-adaptada.md`.

La adaptación preserva todos los productos analíticos centrales de ATAM (utility tree, escenarios top-K, sensitivity/tradeoff points, risks/non-risks, scoring) y compensa la ausencia del componente multi-stakeholder mediante **triangulación metodológica** (Denzin, 1978) entre tres fuentes de evidencia: (i) documental, (ii) cuantitativa empírica sobre 8 000 corridas reales, y (iii) validación externa por panel de expertos (ver sección 8).

### 1.3 Objetivos del informe

Este capítulo cumple cuatro funciones:

1. Documentar el utility tree y los escenarios de calidad priorizados.
2. Identificar y analizar los approaches arquitectónicos del to-be, clasificando los hallazgos en Sensitivity Points, Tradeoff Points, Risks y Non-Risks.
3. Presentar la matriz de scoring 1-5 as-is vs to-be soportada en evidencia cuantitativa empírica.
4. Integrar la validación externa del panel de expertos (sección 8) y producir las conclusiones de la evaluación.

### 1.4 Alcance

El alcance de la evaluación es:

- **Sistemas evaluados:** las arquitecturas to-be de los casos Bot e IoT, comparadas contra sus respectivos as-is como línea base.
- **Atributos evaluados:** los cinco atributos ISO/IEC 25010 priorizados en el anteproyecto: Mantenibilidad, Fiabilidad, Seguridad, Operabilidad, Adecuación funcional. Eficiencia se reporta como atributo asociado a trade-offs, no como atributo top-K.
- **Escenarios:** 12 escenarios top-K (6 por caso) definidos en `docs/atam/atam-utility-tree.md`.
- **Evidencia:** documental, cuantitativa (8 000 corridas + 12 CRs + runtime de IOT-Q4 e IOT-Q5 + análisis MTTD + validador estático), y opinión experta (sección 8).

Fuera del alcance: evaluación de la arquitectura AWS productiva (objeto de R3), evaluación de otras plataformas LC/NC distintas a n8n, despliegue real en producción.

---

## 2. Drivers de negocio y atributos de calidad

### 2.1 Drivers principales

Los drivers de negocio que motivan el micro-framework, extraídos del anteproyecto y consolidados en `docs/context/proyecto-overview.md`, son:

| ID | Driver | Implicación arquitectónica |
|---|---|---|
| D1 | Reducir el costo de cambio en flujos LC/NC adoptados sin estructura | Modularidad fuerte (E1–E4 separadas) |
| D2 | Eliminar antipatrones de seguridad recurrentes (secretos en JSON, sin auth) | Gestión de credenciales nativa + validador estático |
| D3 | Garantizar tolerancia a fallos en integraciones externas | Retry, idempotencia, error workflow con dead-letter |
| D4 | Habilitar observabilidad operacional sin herramientas adicionales | Log estructurado JSON en stdout consultable con grep |
| D5 | Hacer la conformidad arquitectónica verificable automáticamente | Validador estático ejecutable en CI |

### 2.2 Atributos de calidad priorizados (ISO/IEC 25010)

| Característica ISO 25010 | Sub-característica | Drivers asociados | Métrica/medida de respuesta |
|---|---|---|---|
| Mantenibilidad | Modularidad | D1 | Reducción de nodos modificados por CR ≥ 20 % |
| Mantenibilidad | Reusabilidad | D1 | Capacidad de invocar subflujos desde múltiples orquestadores |
| Fiabilidad | Madurez | D3 | 0 registros duplicados ante reintentos (idempotencia) |
| Fiabilidad | Tolerancia a fallos | D3 | Recuperación automática ante fallos transitorios de red |
| Seguridad | Confidencialidad | D2 | 0 secretos literales en JSON exportado |
| Operabilidad | Monitoreabilidad | D4 | MTTD diagnóstico de fallo ≤ 60 segundos |
| Adecuación funcional | Corrección | — | Cumplimiento contractual HTTP (401/400/422 según caso) |

La trazabilidad completa de driver → ADR → atributo → escenario está en las matrices de trazabilidad por caso: `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md` y `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` (versión 1.3).

### 2.3 Stakeholders implícitos

En ausencia de stakeholders reales, los siguientes roles fueron considerados implícitamente al definir escenarios y prioridades:

| Rol implícito | Atributos de mayor interés | Decisiones representadas |
|---|---|---|
| Desarrollador / mantenedor de flujos | Mantenibilidad, Operabilidad | Modularización, log estructurado, validador estático |
| Dueño de producto LC/NC | Fiabilidad, Adecuación funcional | Idempotencia, retry, contratos correctos |
| Equipo de seguridad | Seguridad | Gestión de credenciales, validador estático REG-001 |
| Equipo de operaciones | Operabilidad, Fiabilidad | Log estructurado, error workflow, dead-letter |
| Director académico / jurado | Trazabilidad, rigor metodológico | ADRs, matrices de trazabilidad, evidencia cuantitativa |

---

## 3. Presentación de la arquitectura evaluada

### 3.1 Metamodelo del micro-framework

El metamodelo establece que **cualquier flujo n8n se descompone en cuatro etapas funcionales** con responsabilidad única, comunicadas mediante contratos JSON Schema explícitos:

```
┌────────────────────────────────────────────────────────────────┐
│                 Orquestador n8n + Error Workflow               │
│                                                                │
│   ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐                     │
│   │ E1  │───▶│ E2  │───▶│ E3  │───▶│ E4  │                     │
│   │Vali-│    │Domi-│    │Adap-│    │Sali-│                     │
│   │dar  │    │nio  │    │tado-│    │da/  │                     │
│   │     │    │     │    │res  │    │noti-│                     │
│   │     │    │     │    │     │    │f.   │                     │
│   └─────┘    └─────┘    └─────┘    └─────┘                     │
│                                                                │
│   E1: schema + auth     E2: solo lógica     E3: integraciones  │
│                          (sin HTTP)          E4: salida única  │
└────────────────────────────────────────────────────────────────┘
```

Detalle técnico completo en `docs/context/arquitectura-flujos.md`.

### 3.2 Arquitectura as-is (línea base)

Las arquitecturas as-is fueron **intencionalmente rediseñadas como antipatrones representativos** del estado típico de flujos LC/NC adoptados sin estructura. Esta decisión metodológica está justificada en `docs/context/justificacion-rediseno-asis.md` apelando a la validez interna en estudios cuasi-experimentales (Wohlin et al., 2012).

| Caso | # nodos as-is | REGs violadas | Antipatrones visibles |
|---|:---:|:---:|---|
| Bot | 16 | 9/10 | Token hardcodeado, rate limiter en memoria, sin retry, sin idempotencia, lógica de negocio mezclada con integraciones, error 500 silencioso |
| IoT | 14 | 9/10 | Sin schema E1, umbrales dispersos en nodos IF, credenciales literales, INSERT sin ON CONFLICT, HTTP 200 incluso ante errores |

Diagramas detallados con anotaciones por nodo en `casos-de-estudio/{bot,iot}/as-is/diagrama-as-is.md`.

### 3.3 Arquitectura to-be (con framework aplicado)

| Caso | Componentes to-be | REGs cumplidas |
|---|---|:---:|
| Bot | Orquestador + 2 subflujos (E2 dominio, E3 adaptador) + error workflow | 10/10 |
| IoT | Orquestador + 4 subflujos (E1 validación, E2 dominio, E3 persistencia, E4 notificación) + error handler con dead-letter | 10/10 |

Los flujos to-be se importan en n8n en un orden específico (subflujos antes que orquestador) documentado en `docs/context/convenios-y-reglas.md`. Los JSON están en `casos-de-estudio/{bot,iot}/to-be/`.

### 3.4 Approaches arquitectónicos aplicados

Doce approaches arquitectónicos están inventariados y caracterizados en `docs/atam/analisis-approaches.md` §1. Resumen:

| # | Approach | Atributo principal afectado |
|---|---|---|
| AP-01 | Separación E1–E4 | Mantenibilidad / Modularidad |
| AP-02 | Subflujos Execute Workflow | Mantenibilidad / Reusabilidad |
| AP-03 | Credenciales nativas n8n | Seguridad / Confidencialidad |
| AP-04 | Retry con backoff | Fiabilidad / Tolerancia a fallos |
| AP-05 | Idempotencia con clave única | Fiabilidad / Madurez |
| AP-06 | Error workflow con dead-letter | Operabilidad + Fiabilidad |
| AP-07 | Log estructurado JSON | Operabilidad / Monitoreabilidad |
| AP-08 | Validación JSON Schema E1 | Adecuación funcional / Corrección |
| AP-09 | Routing diferenciado E4 IoT | Fiabilidad |
| AP-10 | Constantes en E2 | Mantenibilidad / Modificabilidad |
| AP-11 | Validador estático `validar-flujos.mjs` | Adecuación funcional / Gobernanza |
| AP-12 | Timestamp authority | Adecuación funcional / Trazabilidad |

---

## 4. Utility tree y escenarios top-K

El utility tree completo, con priorización por importancia × dificultad (escala H/M/L), está en `docs/atam/atam-utility-tree.md`. Resumen de los 12 escenarios top-K evaluados:

### 4.1 Escenarios Bot

| ID | Atributo | Estímulo | Medida de respuesta | Prioridad (I × D) |
|---|---|---|---|:---:|
| BOT-Q1 | Mantenibilidad / Modularidad | CR1 — cambiar prioridad de mensajes | `nodes_touched ≤ 1` | (H, M) |
| BOT-Q2 | Mantenibilidad / Modularidad | CR2 — cambiar endpoint tickets | `nodes_touched ≤ 1` | (H, L) |
| BOT-Q3 | Seguridad / Confidencialidad | Exportar JSON del flujo | `ocurrencias_literal_token = 0` | (H, L) |
| BOT-Q4 | Fiabilidad / Madurez | Enviar mismo ticket 2× | `COUNT(duplicados) = 0` | (H, M) |
| BOT-Q5 | Operabilidad / Monitoreabilidad | Fallo de autenticación | `MTTD ≤ 60 s` | (H, H) |
| BOT-Q6 | Adec. funcional / Corrección | Token inválido / payload malformado | HTTP 401/400 correctos | (H, L) |

### 4.2 Escenarios IoT

| ID | Atributo | Estímulo | Medida de respuesta | Prioridad (I × D) |
|---|---|---|---|:---:|
| IOT-Q1 | Mantenibilidad / Modularidad | CR1 — ajustar umbral crítico | `nodes_touched ≤ 1` | (H, L) |
| IOT-Q2 | Mantenibilidad / Modularidad | CR2 — cambiar canal alerta | `nodes_touched ≤ 1` | (H, L) |
| IOT-Q3 | Fiabilidad / Madurez | Enviar misma lectura 2× | `COUNT(*) = 1` por idempotency_key | (H, M) |
| IOT-Q4 | Fiabilidad / Tolerancia a fallos | Fallo de red en E4 | `fallos_integration = 0` post-recovery | (H, H) |
| IOT-Q5 | Confiabilidad / Tolerancia a fallos | Mezcla críticas y advertencias | `duracion_ms_critico` vs `_advertencia` | (M, H) |
| IOT-Q6 | Seguridad / Confidencialidad | Exportar JSON del flujo | `ocurrencias_literal_pg_password = 0` | (H, L) |

### 4.3 Cobertura ISO/IEC 25010 alcanzada

Los 12 escenarios cubren las 5 sub-características ISO 25010 que el framework promete mejorar (Mantenibilidad, Fiabilidad, Seguridad, Operabilidad, Adecuación funcional). La distribución es:

- Mantenibilidad: 4 escenarios (BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2)
- Fiabilidad: 4 escenarios (BOT-Q4, IOT-Q3, IOT-Q4, IOT-Q5)
- Seguridad: 2 escenarios (BOT-Q3, IOT-Q6)
- Operabilidad: 1 escenario (BOT-Q5)
- Adecuación funcional: 1 escenario (BOT-Q6)

---

## 5. Análisis de approaches arquitectónicos

El análisis formal completo está en `docs/atam/analisis-approaches.md` §2. Resumen consolidado de los 15 hallazgos arquitectónicos identificados:

### 5.1 Sensitivity Points (3)

| ID | Descripción | Escenario | Severidad |
|---|---|---|:---:|
| SP-BOT-01 | Idempotencia depende del header `Idempotency-Key` y de su respeto por el servicio externo | BOT-Q4 | Baja |
| SP-BOT-02 | MTTD depende de la estructura del log JSON de E1 | BOT-Q5 | Baja |
| SP-IOT-01 | Canal del error handler IoT coincide con canal de E4 | IOT-Q4 | **Media** |

### 5.2 Tradeoff Points (3)

| ID | Atributos en tensión | Magnitud | Decisión |
|---|---|---|---|
| TP-GLOBAL-01 | Mantenibilidad ↑↑ vs Eficiencia ↓ (subflujos) | Bot +9 %; IoT +119–192 % p50 | Aceptado (ADR-001) |
| TP-GLOBAL-02 | Adecuación funcional ↑↑ vs Mantenibilidad evolutiva ↓ | Cualitativo | Aceptado |
| TP-IOT-01 | Resiliencia crítico ↑ vs Latencia ↓ | +10.8 ms p50 crítico vs advertencia | Aceptado (ADR-004 IoT) |

### 5.3 Risks (4)

| ID | Riesgo | Atributo | Severidad | Estado |
|---|---|---|:---:|---|
| R-BOT-01 | Rotación manual de tokens, sin auto-rotación | Seguridad | Media | Abierto (fuera de alcance v1.0) |
| R-IOT-01 | Dead-letter no insertado si E4 está totalmente caído | Trazabilidad | Media | Abierto (mitigación de corto plazo factible) |
| R-GLOBAL-01 | Pérdida de logs en stdout si contenedor reinicia sin volumen | Operabilidad | Media | Abierto (mitigación inherente al despliegue R3) |
| R-GLOBAL-02 | Dependencia en respeto del contrato por servicios externos | Fiabilidad | Baja-Alta | Abierto (mitigable con contract testing) |

### 5.4 Non-Risks (5)

| ID | Descripción | Escenario |
|---|---|---|
| NR-BOT-01 | Validación E1 previene side-effects no autorizados | BOT-Q3, BOT-Q6 |
| NR-BOT-02 | Contratos HTTP correctos en 100 % Sets C y D | BOT-Q6 |
| NR-IOT-01 | E3 PostgreSQL independiente de E4 | IOT-Q4 |
| NR-IOT-02 | Idempotencia previene duplicidad ante reintentos externos | IOT-Q3 |
| NR-GLOBAL-01 | Validador estático protege contra regresiones REG-001 | BOT-Q3, IOT-Q6 |

### 5.5 Hallazgos descubiertos en runtime

Dos hallazgos relevantes emergieron de la ejecución en runtime de los escenarios IOT-Q4 e IOT-Q5 (2026-05-07):

**SP-IOT-01.** Al detener mock-iot y enviar una lectura crítica, se confirmó que el retry en E4 (maxRetries=3) ejecutó correctamente y el error workflow se disparó. Sin embargo, el nodo HTTP del error handler también falló con ECONNREFUSED al intentar notificar al mismo servicio caído. La opción `neverError: true` no protege errores de conexión a nivel de red, solo respuestas HTTP no-2xx. Esto bloqueó la ejecución del nodo siguiente (insert en `lecturas_sensor_dead_letters`). El dato del sensor permaneció seguro en `lecturas_sensor` (NR-IOT-01 confirmado) pero el contexto del fallo no se persistió formalmente. Este es un hallazgo de alto valor metodológico: es exactamente el tipo de descubrimiento que ATAM busca y que solo emerge en ejecución runtime, no en análisis estático.

**TP-IOT-01.** El análisis del Set I (degradación gradual de lecturas) confirmó que el routing diferenciado en E4 (CRÍTICO con maxRetries=3, ADVERTENCIA con maxRetries=2) introduce overhead de latencia nominal de +10.8 ms p50 en el branch crítico vs el branch advertencia. El outlier de 30 011 ms (≈ 30 s) en el branch crítico es evidencia directa de que el mecanismo de retry se activó en al menos una corrida real — confirmación operacional de REG-004.

Detalles completos en `medicion/consolidado/mttd-resultado.md` §IOT-Q4-runtime y `medicion/consolidado/metricas-derivadas.md` §IOT-Q5.

---

## 6. Matriz de scoring as-is vs to-be

La matriz completa con justificación celda por celda está en `docs/atam/matriz-scoring.md`. Resumen ejecutivo:

### 6.1 Scoring Bot

| ID | As-is | To-be | Δ | Observación |
|---|:---:|:---:|:---:|---|
| BOT-Q1 | 2 | 5 | +3 | CR1 de 8 nodos a 1 |
| BOT-Q2 | 2 | 5 | +3 | CR2 de 5 nodos a 1 |
| BOT-Q3 | 1 | 5 | +4 | 4 secretos a 0; doble defensa (credenciales + validador) |
| BOT-Q4 | 2 | 4 | +2 | Idempotencia implementada; SP-BOT-01 limita a 4 |
| BOT-Q5 | 1 | 5 | +4 | MTTD ~14 s < 60 s meta |
| BOT-Q6 | 2 | 5 | +3 | 100 % status HTTP correctos |
| **Promedio** | **1.67** | **4.83** | **+3.16** | **+190 %** |

### 6.2 Scoring IoT

| ID | As-is | To-be | Δ | Observación |
|---|:---:|:---:|:---:|---|
| IOT-Q1 | 2 | 5 | +3 | CR1 de 6 nodos a 1; UMBRALES centralizados |
| IOT-Q2 | 2 | 5 | +3 | CR2 de 4 nodos a 1 |
| IOT-Q3 | 1 | 5 | +4 | Idempotencia + ON CONFLICT; 0 duplicados Set K |
| IOT-Q4 | 1 | 4 | +3 | Retry confirmado runtime; SP-IOT-01 limita a 4 |
| IOT-Q5 | 1 | 4 | +3 | Routing diferenciado; TP-IOT-01 documentado |
| IOT-Q6 | 1 | 5 | +4 | 0 credenciales literales |
| **Promedio** | **1.33** | **4.67** | **+3.34** | **+251 %** |

### 6.3 Interpretación global

- **Promedio global as-is:** 1.50 → **Promedio global to-be:** 4.75 (Δ = +3.25, +217 %)
- **Cero regresiones:** ningún escenario tiene score to-be inferior al as-is
- **8 de 12 escenarios** alcanzan score 5 (excelente) en to-be
- **4 de 12** alcanzan score 4 — todos por limitaciones documentadas (SP-BOT-01, SP-IOT-01, TP-IOT-01)
- **Mejora máxima** en seguridad (Δ = +4.00 en BOT-Q3 e IOT-Q6) — coherente con que el as-is violaba REG-001 sistemáticamente

---

## 7. Evaluación cuantitativa de evidencia

Esta sección sintetiza las métricas operacionales medidas sobre las 8 000 corridas y los 12 Change Requests. Detalle completo en `medicion/consolidado/metricas-derivadas.md` y `medicion/consolidado/comparacion-2026-05-05.md`.

### 7.1 Métricas de Mantenibilidad (Change Requests)

| Métrica | Caso | As-is | To-be | Δ | Meta |
|---|---|:---:|:---:|:---:|:---:|
| Nodos modificados por CR (promedio) | Bot | 5.3 | 1.0 | **−81 %** | ≥ 20 % ✅ |
| | IoT | 4.3 | 0.7 | **−84 %** | ≥ 20 % ✅ |
| Tiempo por CR (minutos, promedio) | Bot | 32.7 | 6.7 | −79 % | — |
| | IoT | 28.0 | 5.2 | −81 % | — |
| Intentos hasta verificación exitosa (suma 3 CRs) | Bot | 7 | 3 | −57 % | — |
| | IoT | 7 | 3 | −57 % | — |

### 7.2 Métricas de Fiabilidad (Run-logs)

| Métrica | Caso | As-is | To-be | Δ | Meta |
|---|---|:---:|:---:|:---:|:---:|
| Tasa de fallos (sobre 2 000 corridas c/u) | Bot | 9 % | 6 % | −36.6 % | ≥ 30 % ✅ |
| | IoT | 0 %* | 1 %† | n/a* | * antipatrón / † validación correcta |
| Duplicados ante reintentos Set K | Bot | n/d | 0 | — | 0 ✅ |
| | IoT | n/d | 0 | — | 0 ✅ |

\* El as-is IoT presenta 0 % de fallos artificialmente porque carece de validación (procesa todo). El to-be IoT presenta 1 % de "fallos" que en realidad son rechazos correctos (HTTP 422) de Sets D y E inválidos.

### 7.3 Métricas de Seguridad

| Métrica | Caso | As-is | To-be | Resultado |
|---|---|:---:|:---:|---|
| Secretos literales detectados por `validar-flujos.mjs` REG-001 | Bot | 4 | **0** | −100 % ✅ |
| | IoT | varios | **0** | −100 % ✅ |
| Mínimo privilegio en credenciales (verificación binaria) | Bot | 0 | 1 | Cumplido |
| | IoT | 0 | 1 | Cumplido |

### 7.4 Métricas de Operabilidad

| Métrica | Caso | As-is | To-be | Meta |
|---|---|:---:|:---:|:---:|
| MTTD diagnóstico de fallo de autenticación (analítico) | Bot | ~5–10 min | **~14 s** | ≤ 60 s ✅ |
| Evidencia runtime de retry activo | IoT | n/a | ✅ outlier 30 011 ms en Set I | — |
| Evidencia runtime de error workflow disparado | IoT | n/a | ✅ test 2026-05-07 | — |

### 7.5 Métricas de Trazabilidad

| Métrica | Valor |
|---|:---:|
| Cobertura ADR (decisiones documentadas / decisiones esperadas) | 19/19 = 100 % ✅ |
| Cobertura ATAM (escenarios con evidencia trazable) | 12/12 = 100 % ✅ |
| Cobertura checklist arquitectura to-be Bot | 10/10 = 100 % ✅ |
| Cobertura checklist arquitectura to-be IoT | 10/10 = 100 % ✅ |
| Cobertura checklist DevSecOps to-be Bot | 8/8 = 100 % ✅ |
| Cobertura checklist DevSecOps to-be IoT | 7/7 aplicables = 100 % ✅ |

### 7.6 Trade-off cuantificado: latencia

La latencia es el principal trade-off del framework (TP-GLOBAL-01):

| Caso | Set | p50 as-is | p50 to-be | Δ | Interpretación |
|---|:---:|:---:|:---:|:---:|---|
| Bot | A | 120 ms | 131 ms | **+9 %** | Overhead aceptable |
| Bot | B | 118 ms | 120 ms | +2 % | Overhead mínimo |
| Bot | C | 66 ms | 39 ms | **−42 %** | Rechazo temprano en E1 — más rápido |
| IoT | A | 78 ms | 171 ms | **+119 %** | Overhead significativo |
| IoT | B | 78 ms | 182 ms | **+134 %** | Idem |
| IoT | C | 42 ms | 65 ms | +55 % | Validación E1 vs paso completo del antipatrón |

El trade-off es asimétrico: marginal en Bot, significativo en IoT. Está aceptado y documentado en ADR-001 IoT — el proyecto prioriza mantenibilidad sobre latencia, en coherencia con los drivers del anteproyecto. En contextos productivos con SLA estricto se recomendaría n8n clustered o evaluar este trade-off explícitamente.

---

## 8. Validación externa por panel de expertos

> **Estado:** Recolección cerrada (17–24 de junio de 2026) y análisis completo sobre los datos
> anonimizados. Fuente de datos: [`medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv`](../../medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv).
> Análisis reproducible en [`medicion/encuesta-validacion/analisis-encuesta.py`](../../medicion/encuesta-validacion/analisis-encuesta.py)
> y [`analisis-encuesta.ipynb`](../../medicion/encuesta-validacion/analisis-encuesta.ipynb) (ejecutado,
> con outputs embebidos), siguiendo el plan pre-registrado en `plan-analisis-encuesta.md`.
> Salidas consolidadas en `medicion/encuesta-validacion/outputs/`.

### 8.1 Perfil de respondentes

- N total recolectadas (Sección A–D): **19**
- N excluidas (< 3 años de experiencia, filtro post-hoc pre-registrado): **2**
- N válido: **17**, por encima del umbral mínimo de 15
- N Sección E (mini-ATAM): **17** (todos los válidos completaron la sección opcional)
- Subgrupo de mayor experiencia (≥ 5 años): **n = 7**

| Rol (A1) | n |
|---|:---:|
| Desarrollador / Ingeniero de software | 10 |
| Arquitecto de software | 4 |
| Tech Lead / Líder técnico | 1 |
| Analista de sistemas / Analista de software | 1 |
| Scrum Master / Agile Coach | 1 |

**Heterogeneidad de roles:** 5 roles distintos representados — cumple el criterio de ≥ 3.

| Experiencia (A2) | n |
|---|:---:|
| Entre 3 y 5 años | 10 |
| Entre 5 y 10 años | 4 |
| Más de 10 años | 3 |

| Familiaridad | Media | σ |
|---|:---:|:---:|
| A3 — Plataformas LC/NC | 3.29 | 1.05 |
| A4 — Clean Architecture | 4.00 | 1.06 |
| A5 — Evaluación arquitectónica (ATAM, ISO 25010) | 3.29 | 0.99 |

### 8.2 Resultados cuantitativos — Sección B Likert

| Ítem | Media | Mediana | σ | % ≥ 4 | Lectura |
|---|:---:|:---:|:---:|:---:|---|
| B1 — Las 4 etapas mejoran la modularidad | 4.71 | 5 | 0.47 | 100 % | Validación fuerte |
| B2 — De ~5 a 1 nodo por cambio es mejora verificable | 4.53 | 5 | 0.62 | 94 % | Validación fuerte |
| B3 — Retry + idempotencia previenen pérdida/duplicación | 4.53 | 5 | 0.51 | 100 % | Validación fuerte |
| B4 — Dead-letter correcto para IoT | 4.35 | 4 | 0.49 | 100 % | Validación fuerte |
| B5 — Secretos vía credenciales nativas es aceptable | 4.24 | 4 | 0.44 | 100 % | Validación fuerte |
| B6 — Log JSON permite diagnóstico sin abrir n8n | 4.53 | 5 | 0.62 | 94 % | Validación fuerte |
| B7 — Las 10 reglas son aplicables en proyectos reales | 4.18 | 4 | 0.53 | 94 % | Validación fuerte (la más baja del set) |
| B8 — Aporta valor sin complejidad excesiva | 4.29 | 4 | 0.59 | 94 % | Validación fuerte |

Todas las medianas ≥ 4 con % ≥ 4 entre 94 % y 100 % — validación fuerte en el criterio interpretativo
a priori, sin rechazos por debajo del punto medio en ningún ítem.

**Consistencia interna (Cronbach's α por par temático):**

| Grupo | α |
|---|:---:|
| Mantenibilidad (B1+B2) | 0.505 |
| Fiabilidad (B3+B4) | −0.816 |
| Aplicabilidad (B7+B8) | 0.365 |

Los tres coeficientes son bajos o no interpretables (uno negativo), consistente con lo anticipado
en el plan de análisis: la concentración casi unánime de respuestas en los niveles 4–5 (efecto techo)
deprime los coeficientes de correlación aunque el acuerdo sustantivo sea alto. Se prioriza, por tanto,
la lectura descriptiva (medias, medianas, % de acuerdo) por sobre estos coeficientes, tal como estaba
pre-registrado.

Los ítems de menor media (B7 = 4.18, B5 = 4.24) anticipan los temas que desarrolla el análisis
cualitativo de la Sección C: aplicabilidad de las reglas en proyectos reales y gestión de secretos
sin rotación automática.

### 8.3 Análisis cualitativo — Secciones C y E4

La versión efectivamente publicada del instrumento consolidó las preguntas C1–C3 planeadas en una
sola pregunta abierta (ver `instrumento-encuesta.md` §Sección C). La codificación temática se aplicó
sobre esa pregunta consolidada (C1) y sobre el comentario libre de la Sección E (E4), siguiendo
Strauss & Corbin (1990). Codificación completa en
[`outputs/categorias-emergentes-seccion-c.md`](../../medicion/encuesta-validacion/outputs/categorias-emergentes-seccion-c.md).

| Categoría | # respondientes | Convergencia con el registro del autor |
|---|:---:|---|
| Ausencia de escenario de carga, escalabilidad y concurrencia | 7/17 | Emergente — la más frecuente del panel, no estaba en el registro previo del autor |
| Latencia acumulada por subflujos secuenciales en IoT | 4/17 | ✅ Converge con TP-GLOBAL-01 |
| Dead-letter / error handler acoplado al canal de E4 | 2/17 (clara) + 5/17 (relacionada) | ✅ Converge con SP-IOT-01 / R-IOT-01 |
| Gestión de secretos sin rotación, auditoría ni revocación | 2/17 | ✅ Converge con R-BOT-01 |
| Testabilidad y curva de aprendizaje no evaluadas | 2/17 | Emergente |
| Punto único de falla del orquestador (REG-002) no evaluado | 1/17 explícita | Emergente |
| Reglas uniformes sin clasificación por criticidad del flujo | 1/17 | Emergente |

3/17 respuestas C1 y 5/17 respuestas E4 no tuvieron contenido temático ("Ninguna"/"no").

**Hallazgos emergentes no anticipados por el autor** (más allá de las 7 categorías anteriores):
- Resistencia organizacional/cultural a la restricción de E2 en equipos sin cultura arquitectónica previa.
- Perspectiva del consumidor del API ante contratos HTTP incorrectos (enriquece NR-BOT-02 con el ángulo del cliente aguas abajo).
- Sugerencia de extender retry con backoff a llamadas internas entre subflujos, no solo HTTP saliente.
- Comentario metodológico sobre la conveniencia de validar el scoring ATAM con evaluadores independientes adicionales.

**Discrepancias con el análisis del autor:** ninguna clasificación del panel contradice directamente
un non-risk o riesgo cerrado del autor; las divergencias observadas son de énfasis (la ausencia de
escenarios de carga/concurrencia domina la atención del panel más que en el análisis original) y se
discuten en la sección 9.

### 8.4 Triangulación con scoring del autor — Sección E

| Escenario | As-is autor | As-is panel (mediana, rango) | Δ | To-be autor | To-be panel (mediana, rango) | Δ | Clase autor | Clase moda panel | Coincide |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| BOT-Q1 | 2 | 2 (2–5) | 0 | 5 | 5 (4–5) | 0 | TP | TP (12) | ✅ |
| BOT-Q2 | 2 | 2 (1–4) | 0 | 5 | 5 (4–5) | 0 | TP | NR (13) | ❌ |
| BOT-Q3 | 1 | 1 (1–5) | 0 | 5 | 5 (4–5) | 0 | NR | Empate TP/SP (6/6) | ❌ |
| BOT-Q4 | 2 | 2 (1–5) | 0 | 4 | 4 (4–5) | 0 | SP | NR (9) | ❌ |
| BOT-Q5 | 1 | 1 (1–5) | 0 | 5 | 5 (3–5) | 0 | SP | NR (10) | ❌ |
| BOT-Q6 | 2 | 2 (1–4) | 0 | 5 | 5 (4–5) | 0 | NR | NR (15) | ✅ |
| IOT-Q1 | 2 | 2 (1–4) | 0 | 5 | 5 (3–5) | 0 | TP | NR (12) | ❌ |
| IOT-Q2 | 2 | 2 (1–4) | 0 | 5 | 5 (4–5) | 0 | TP | TP (9) | ✅ |
| IOT-Q3 | 1 | 1 (1–5) | 0 | 5 | 5 (4–5) | 0 | NR | NR (12) | ✅ |
| IOT-Q4 | 1 | 1 (1–5) | 0 | 4 | 4 (3–5) | 0 | SP (+R-IOT-01) | R (7) | ✅ (vía R-IOT-01) |
| IOT-Q5 | 1 | 2 (1–4) | 1 | 4 | 4 (4–5) | 0 | TP | TP (11) | ✅ |
| IOT-Q6 | 1 | 1 (1–4) | 0 | 5 | 5 (4–5) | 0 | NR | NR (12) | ✅ |

**Convergencia de scoring:** to-be coincide exactamente en **12/12** escenarios; as-is coincide en
**11/12**, con la única diferencia en IOT-Q5 (Δ = 1, dentro del criterio de convergencia |Δ| ≤ 1).
Media global del panel: as-is = **1.92**, to-be = **4.65**, Δ = **+2.73** (frente a 1.50 → 4.75 del
análisis del autor — el panel es más conservador en el to-be pero confirma la misma dirección y
magnitud del cambio). El **95.1 %** de los pares respondiente-escenario percibió mejora (to-be >
as-is; 194/204).

**Clasificación arquitectónica:** la moda del panel coincide con la clasificación primaria del autor
en **6/12** escenarios — cifra menor que la del scoring (12/12 to-be) pero interpretable, no
aleatoria: la equivalencia de la Tabla 8 impone una lectura ordinal (R < SP < TP < NR) sobre
categorías que en ATAM son cualitativas, de modo que una decisión bien soportada puede ser a la vez
un punto de sensibilidad y percibida como no-riesgo por el panel ("efecto de constructo"). BOT-Q3 no
tuvo moda clara (empate TP/SP, 6 y 6). El panel reprodujo limpiamente los no-riesgos (BOT-Q1, BOT-Q6,
IOT-Q2, IOT-Q3, IOT-Q5, IOT-Q6) y, de forma destacada, elevó IOT-Q4 a **Risk** (moda 7/17) — más
severo que el sensitivity point del autor, pero convergente con el riesgo R-IOT-01 ya documentado y
el hallazgo más crítico del registro de riesgos.

**Robustez — subgrupo de mayor experiencia (≥ 5 años, n = 7):** conserva la convergencia total,
**12/12** en el to-be, descartando que la convergencia dependa de los respondentes menos senior.

**Acuerdo inter-evaluador (Krippendorff's α, n = 17):**

| Medida | α |
|---|:---:|
| Scoring as-is (ordinal) | 0.086 |
| Scoring to-be (ordinal) | 0.145 |
| Clasificación (nominal) | 0.140 |

**Interpretación:** los tres coeficientes son bajos según los umbrales de Krippendorff (2018:
< 0.667 inaceptable). Esto **no** se interpreta como baja fiabilidad inter-jueces sustantiva, sino
como una manifestación del efecto techo — análoga a la paradoja de kappa: cuando las respuestas se
concentran en las categorías altas (o, en clasificación, se dispersan entre pocas etiquetas
plausibles para escenarios ya consensuados como positivos), el coeficiente corregido por azar se
deprime aunque la concordancia bruta sea alta. La evidencia de convergencia se sustenta, por tanto,
en la coincidencia modal y de medianas (12/12 to-be, 11/12 as-is, 6/12 clasificación) y no en α,
consistente con lo declarado a priori en el plan de análisis. El mismo efecto techo explica los
valores de Cronbach's α de la Sección B (§8.2).

### 8.5 Síntesis de la validación externa

**Hallazgos del autor CONFIRMADOS por el panel:**
- La mejora sustancial de mantenibilidad, seguridad y operabilidad (RQ1): aprobación 94–100 % en B1–B8, D1 = 8.71/10.
- El scoring ATAM to-be del autor: convergencia exacta en 12/12 escenarios.
- El scoring ATAM as-is del autor: convergencia en 11/12 (Δ = 1 en IOT-Q5).
- TP-GLOBAL-01 (modularización vs latencia): mencionado espontáneamente por 4/17 respondientes.
- SP-IOT-01 / R-IOT-01 (canal de error acoplado a E4): mencionado por 2/17 de forma clara y reflejado en la clasificación modal de IOT-Q4 (Risk, 7/17) — el panel elevó este escenario más allá de la severidad asignada por el autor.
- R-BOT-01 (rotación de secretos): mencionado espontáneamente por 2/17.
- La intención de adopción es favorable (D2: 15/17 = 88 %, ninguna respuesta de rechazo).

**Hallazgos del autor NO confirmados en la moda de clasificación (aunque el scoring numérico sí converge):**
- BOT-Q2, BOT-Q4, BOT-Q5, IOT-Q1: el panel los clasificó modalmente como No-riesgo donde el autor
  identificó un Tradeoff Point o Sensitivity Point. Esto no contradice el *scoring* (que sí converge
  exactamente en los cuatro), sino la *categorización*: es un efecto de constructo — una decisión
  bien soportada (BOT-Q4, BOT-Q5) puede seguir siendo, técnicamente, un punto de sensibilidad, pero
  el panel la percibe como no-riesgo precisamente porque valora que está bien soportada.
- BOT-Q3: sin moda de clasificación (empate TP/SP), reflejando genuina divergencia de criterio sobre
  la gestión de secretos.

**Hallazgos emergentes del panel a incorporar en trabajo futuro:**
- Ausencia de escenarios de carga, escalabilidad y concurrencia (7/17 — el hallazgo emergente más
  frecuente; no estaba en el registro de riesgos del autor).
- Punto único de falla del orquestador ante caída del proceso principal (REG-002).
- Testabilidad y curva de aprendizaje del modelo E1–E4 para equipos sin experiencia previa.
- Reglas uniformes sin diferenciación por criticidad del flujo.
- Extender el patrón de retry a llamadas internas entre subflujos.

Estos hallazgos emergentes, en particular la ausencia de escenarios de carga/concurrencia, se
incorporan como línea de trabajo futuro en la sección 12.

---

## 9. Síntesis de hallazgos

### 9.1 Top 5 riesgos arquitectónicos identificados

Ordenados por relevancia para adopción productiva (combinación de severidad × probabilidad):

| Rank | ID | Riesgo | Mitigación recomendada |
|:---:|---|---|---|
| 1 | **SP-IOT-01 / R-IOT-01** | Canal duplicado en error handler IoT bloquea dead-letter ante caída total del canal | Reordenar nodos del error handler o usar canal independiente |
| 2 | **R-GLOBAL-01** | Logs efímeros en stdout sin volumen persistente | Volumen persistente + agregador (CloudWatch en R3) |
| 3 | **R-BOT-01** | Rotación manual de tokens sin auto-rotación | Secrets Manager / Vault con auto-rotación |
| 4 | **R-GLOBAL-02** | Dependencia en respeto de contrato por servicios externos | Contract testing en CI/CD |
| 5 | **SP-BOT-02** | MTTD depende de la estructura del log JSON | Schema versionado + test contractual en CI |

### 9.2 Top 3 trade-offs principales

| Rank | ID | Trade-off | Magnitud |
|:---:|---|---|---|
| 1 | **TP-GLOBAL-01** | Modularización subflujos vs latencia | +119–192 % p50 en IoT |
| 2 | **TP-IOT-01** | Resiliencia canal crítico vs latencia nominal | +10.8 ms p50 |
| 3 | **TP-GLOBAL-02** | Validación E1 estricta vs flexibilidad evolutiva | Cualitativo |

### 9.3 Validación de las metas del anteproyecto

| Meta del anteproyecto | Resultado | Cumplimiento |
|---|---|:---:|
| Impacto de cambio: reducción ≥ 20 % en nodos | Bot −81 %, IoT −84 % | ✅ Superada significativamente |
| Confiabilidad: reducción ≥ 30 % en fallos | Bot −36.6 % | ✅ Cumplida |
| Cumplimiento checklist ≥ 90 % en to-be | Bot 100 %, IoT 100 % | ✅ Cumplida |
| Cobertura ATAM ≥ 80 % por caso | Bot 100 %, IoT 100 % | ✅ Cumplida |
| Mejora en calificación ordinal ATAM | Bot +190 %, IoT +251 % | ✅ Cumplida |

### 9.4 Honestidad en limitaciones del to-be

A pesar de los resultados positivos, el análisis es honesto sobre lo que el framework **no** garantiza:

- No garantiza latencia comparable a la del as-is en IoT (+119–192 % p50 documentado)
- No garantiza rotación automática de credenciales (R-BOT-01 abierto)
- No garantiza dead-letter exitoso si el canal de notificación está completamente caído (R-IOT-01 abierto)
- No garantiza persistencia de logs sin volumen externo o agregador (R-GLOBAL-01 abierto)
- Asume cooperación de servicios externos según contrato (R-GLOBAL-02 abierto)

Estas limitaciones son intencionalmente reportadas como evidencia de rigor analítico y como pista para R3 (diseño AWS) y R5 (guía de buenas prácticas) que deben atender los riesgos abiertos.

---

## 10. Conclusiones de la evaluación ATAM

### 10.1 ¿El micro-framework mejora los atributos priorizados?

**Sí, de forma sustancial y verificable.** La evaluación cuantitativa sobre 8 000 corridas controladas y 12 Change Requests medidos confirma:

- Mejora promedio de scoring de +3.25 puntos sobre escala 5 (+217 %), sin regresiones en ningún escenario
- 4 de 5 metas orientativas del anteproyecto cumplidas con holgura significativa
- 100 % cobertura ATAM con evidencia trazable en ambos casos

### 10.2 ¿Cuáles son los trade-offs explícitos asumidos?

Tres trade-offs documentados con cuantificación:

- **TP-GLOBAL-01:** latencia adicional por modularización (significativo en IoT: +119–192 %)
- **TP-GLOBAL-02:** rigidez evolutiva por validación E1 estricta
- **TP-IOT-01:** overhead de latencia por mayor resiliencia en canal crítico (+10.8 ms)

Todos están justificados en ADRs con priorización explícita acorde a los drivers del anteproyecto.

### 10.3 ¿Qué riesgos arquitectónicos quedan abiertos?

Cuatro riesgos abiertos con mitigaciones recomendadas:

- **R-BOT-01:** rotación manual de tokens (escalable con Secrets Manager — R3)
- **R-IOT-01:** dead-letter bloqueable por SP-IOT-01 (mitigable en ~1 h)
- **R-GLOBAL-01:** logs efímeros sin volumen (cubierto en R3)
- **R-GLOBAL-02:** dependencia de contratos externos (mitigable con contract testing en CI/CD)

Ninguno es bloqueante para la viabilidad del framework.

### 10.4 Recomendaciones para adopción

Para una organización que considere adoptar el framework:

1. **Aplicar el validador estático** desde el primer commit como hard-gate en CI/CD
2. **Aceptar conscientemente el trade-off de latencia** — el framework es óptimo para escenarios donde mantenibilidad y trazabilidad son prioritarios sobre latencia mínima
3. **Implementar las mitigaciones de los 4 risks abiertos** desde el día 1 productivo (Secrets Manager, agregador de logs, canal de error independiente, contract testing)
4. **Adaptar el utility tree y los escenarios** al contexto específico de la organización — los 12 escenarios de este estudio son representativos pero no exhaustivos para todo dominio LC/NC
5. **Pilotear con un caso simple** (1–2 flujos) antes de escalar a portafolio amplio

### 10.5 Conclusión metodológica

La evaluación demuestra que **es posible aplicar ATAM en un contexto de proyecto de grado individual sin perder rigor analítico**, mediante triangulación metodológica entre evidencia documental, cuantitativa empírica y validación externa por panel de expertos. La adaptación está justificada en literatura establecida (Bass et al., 2012; Wohlin et al., 2012) y produce los entregables exigidos por el anteproyecto sin pretender haber realizado un ATAM canónico, lo cual sería metodológicamente incorrecto en este contexto.

---

## 11. Limitaciones del estudio

Las limitaciones de la evaluación, reportadas honestamente para el jurado:

1. **Casos de estudio simulados.** Bot e IoT son representaciones académicas; no son sistemas productivos con stakeholders reales. Generalización a otros dominios LC/NC requiere replicación.

2. **As-is intencionalmente desestructurado.** El as-is no representa "el promedio de los flujos n8n en producción" sino "el peor escenario antipatrónico" como línea base. Una organización con prácticas intermedias vería mejoras menos dramáticas.

3. **Evaluación por un único autor.** Aunque mitigada por validación externa (sección 8), persiste el sesgo del evaluador único en la fase de generación de hallazgos (análisis previo a la encuesta).

4. **Adaptación de ATAM.** La adaptación asincrónica sin componente conversacional pierde la capacidad de ATAM-original de generar trade-offs no anticipados por fricción grupal en tiempo real (limitación inherente a la adaptación declarada en ADR-MF-004).

5. **Tamaño muestral de la validación externa.** Con N=17 respondentes válidos (dentro del rango 15–30 estimado en el protocolo), los análisis estadísticos son descriptivos y exploratorios, no inferenciales con poder amplio.

6. **Muestreo no probabilístico.** Conveniencia + bola de nieve; los resultados de la encuesta no son generalizables a la población global de profesionales de software.

7. **n8n específico.** El framework se diseñó y evaluó sobre n8n; aplicabilidad directa a Zapier, Make o Power Automate requiere adaptación de los mecanismos (Execute Workflow, credentials, error workflow) a las primitivas de cada plataforma.

8. **Duración de respuesta no verificable.** El plan de análisis pre-registrado incluía un chequeo de calidad basado en el tiempo mediano de respuesta (≥ 7 min, como proxy de reflexividad); Google Forms solo registra la marca temporal de envío, no la de inicio, por lo que ese chequeo no pudo ejecutarse con los datos recolectados. Se documenta como limitación abierta en lugar de omitirse silenciosamente.

---

## 12. Trabajo futuro

Las siguientes líneas extienden el estudio y son candidatas para investigación posterior o aplicación práctica:

1. **Replicación en caso productivo real** con stakeholders genuinos y datos de tráfico productivo durante ≥ 3 meses.
2. **Comparación cuantitativa contra otras plataformas LC/NC** (Zapier, Make, Power Automate) aplicando un framework equivalente.
3. **Validación de las mitigaciones recomendadas** — especialmente SP-IOT-01 (canal de error independiente) y R-BOT-01 (auto-rotación de tokens).
4. **Estudio longitudinal de adopción del framework** en un equipo de 5–10 desarrolladores durante 6 meses, midiendo curva de aprendizaje, adherencia y mejora de métricas.
5. **Extensión del utility tree** con escenarios adicionales emergentes del panel de expertos (sección 8.3).
6. **Integración con métricas DORA** (DevOps Research and Assessment): lead time, deployment frequency, MTTR, change failure rate.
7. **Aplicación del framework a un caso de IA/LLM en n8n** — los flujos de IA introducen consideraciones de costos por token y latencia variable no contempladas en este estudio.

---

## 13. Anexos

### Anexo A — Utility tree completo
Ver `docs/atam/atam-utility-tree.md`.

### Anexo B — Matriz detallada de scoring
Ver `docs/atam/matriz-scoring.md`.

### Anexo C — Registro de riesgos y trade-offs
Ver `docs/atam/registro-riesgos-tradeoffs.md`.

### Anexo D — Análisis de approaches arquitectónicos
Ver `docs/atam/analisis-approaches.md`.

### Anexo E — Metodología ATAM adaptada
Ver `docs/atam/metodologia-atam-adaptada.md` y `microframework/adr/ADR-MF-004-atam-adaptado-individual.md`.

### Anexo F — Instrumento y protocolo de la encuesta
Ver `docs/atam/instrumento-encuesta.md`, `docs/atam/protocolo-encuesta.md`.

### Anexo G — Plan de análisis estadístico
Ver `docs/atam/plan-analisis-encuesta.md`.

### Anexo H — Material de apoyo de la encuesta
Ver `docs/atam/material-apoyo/`.

### Anexo I — Datos crudos anonimizados de la encuesta
Ruta: `medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv`

### Anexo J — Notebook de análisis estadístico
Ruta: `medicion/encuesta-validacion/analisis-encuesta.ipynb` (ejecutado, con outputs embebidos).
Script equivalente de línea de comandos: `medicion/encuesta-validacion/analisis-encuesta.py`.

---

## 14. Referencias

- Bass, L., Clements, P. & Kazman, R. (2012). *Software Architecture in Practice* (3rd ed.). Addison-Wesley. Capítulo 21 — ATAM.
- Binzer, B., Reichel, A. & Winkler, T. J. (2024). Low-code platforms: a literature review. *Journal of Systems and Software*, 215.
- Cohen, J. (1960). A coefficient of agreement for nominal scales. *Educational and Psychological Measurement*, 20(1), 37-46.
- Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. *Psychometrika*, 16(3), 297-334.
- Denzin, N. K. (1978). *The Research Act: A Theoretical Introduction to Sociological Methods*. McGraw-Hill.
- Feio, F., Pereira, L. & Pinto, L. (2024). DevSecOps practices: a systematic mapping study. *Information and Software Technology*, 167.
- Gartner (2022). *Low-Code Development Technologies Forecast 2023–2027*.
- ISO/IEC 25010:2011. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*.
- Kazman, R., Klein, M. & Clements, P. (2000). *ATAM: Method for Architecture Evaluation*. Technical Report CMU/SEI-2000-TR-004. Software Engineering Institute, Carnegie Mellon University.
- Kitchenham, B. & Pfleeger, S. L. (2008). Personal Opinion Surveys. In *Guide to Advanced Empirical Software Engineering* (pp. 63–92). Springer.
- Krippendorff, K. (2018). *Content Analysis: An Introduction to Its Methodology* (4th ed.). Sage.
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- Strauss, A. & Corbin, J. (1990). *Basics of Qualitative Research: Grounded Theory Procedures and Techniques*. Sage.
- Viljoen, J., Schmidt, A. & van Greuning, J. (2024). Governance of low-code platforms in enterprise contexts. *International Journal of Information Management*, 76.
- Wohlin, C., Runeson, P., Höst, M., Ohlsson, M. C., Regnell, B. & Wesslén, A. (2012). *Experimentation in Software Engineering*. Springer.
- Yin, R. K. (2018). *Case Study Research and Applications: Design and Methods* (6th ed.). Sage.

---

*Documento generado el 2026-05-07 · Versión 1.0 con sección 8 en estado preliminar*
*Próxima actualización tras cierre de la encuesta de validación externa*
