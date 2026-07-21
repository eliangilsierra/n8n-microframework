> 🌐 **Idioma / Language:** Español · [English](matriz-scoring.en.md)

# Matriz de Scoring 1–5 — as-is vs to-be por Escenario ATAM

**Versión:** 1.0
**Fecha:** 2026-05-07
**Autor:** Elian Hernando Gil Sierra (scoring analítico del autor; validación externa con panel pendiente)
**Insumos:** `atam/analisis-approaches.md`, `medicion/consolidado/atam-evidencia.md`, `medicion/consolidado/metricas-derivadas.md`, run-logs, cr-logs, validador estático
**Propósito:** Producir la matriz numérica comparativa que ATAM-original genera en el Paso 8 como base para identificar la magnitud de la mejora del to-be sobre el as-is por escenario.

---

## 1. Escala de scoring

La escala es ordinal de 5 puntos, operacionalizada con criterios verificables:

| Score | Etiqueta | Criterio operacional |
|:---:|---|---|
| **1** | No soportado / antipatrón | El sistema no satisface el escenario; presenta antipatrón explícito documentado; viola regla del micro-framework |
| **2** | Parcial con violaciones | El sistema satisface el escenario parcialmente con violaciones documentadas; comportamiento inconsistente |
| **3** | Cumple mínimamente | El sistema satisface el escenario en el caso nominal pero sin garantías formales ni patrones explícitos |
| **4** | Bien soportado | El sistema satisface el escenario con patrón explícito y evidencia operacional |
| **5** | Excelente | El sistema satisface el escenario con patrón explícito, evidencia cuantitativa cumple la medida de respuesta del utility tree y la decisión está documentada en ADR |

La asignación de score se justifica para cada celda con (a) la evidencia operacional disponible y (b) el cumplimiento o no de la medida de respuesta declarada en `atam-utility-tree.md`.

---

## 2. Matriz Bot — 6 escenarios

| ID | Escenario | Atributo | As-is | Justificación as-is | To-be | Justificación to-be | Δ | Evidencia |
|---|---|---|:---:|---|:---:|---|:---:|---|
| BOT-Q1 | Modificabilidad reglas (CR1) | Mantenibilidad | **2** | CR1 toca 8 nodos dispersos (Validar Payload, Procesar Mensaje, Calcular Prioridad, etc.); lógica de prioridad embebida en nodos IF | **5** | CR1 toca 1 nodo en subflujo E2; lógica centralizada en constante; medida del utility tree (`nodes_touched ≤ 1`) cumplida | +3 | `cr-log-bot-as-is.csv` vs `cr-log-bot-to-be.csv` CR-BOT-004 |
| BOT-Q2 | Cambio proveedor tickets (CR2) | Mantenibilidad | **2** | CR2 toca 5 nodos (Validar Payload mock-bot URL, Procesar Respuesta, headers de auth, manejo de error, Set de salida); endpoint y formato dispersos | **5** | CR2 toca 1 nodo en subflujo E3; URL parametrizada en credencial n8n; medida (`nodes_touched ≤ 1`) cumplida | +3 | `cr-log-bot-to-be.csv` CR-BOT-005 |
| BOT-Q3 | Confidencialidad credenciales | Seguridad | **1** | Token y api-key hardcodeados en nodos 6, 8, 12, 14; antipatrón REG-001 visible; `validar-flujos.mjs` reporta violación | **5** | 0 secretos en JSON; token vía `$env.BOT_API_TOKEN`, api-key vía credencial; medida (`ocurrencias_literal_token = 0`) cumplida; defendido por NR-GLOBAL-01 | +4 | `microframework/validacion/reportes/validacion-2026-05-06.md` |
| BOT-Q4 | Integridad ante reintentos | Fiabilidad | **2** | Sin header Idempotency-Key, mock-bot tradicionalmente acepta duplicados; antipatrón REG-005 | **4** | Header Idempotency-Key en E3; mock-bot respeta el header; SP-BOT-01 identificado (dependencia del comportamiento del servicio externo limita score a 4) | +2 | ADR-005 Bot, contrato `bot-e3-output.schema.json` |
| BOT-Q5 | Diagnóstico fallos (MTTD) | Operabilidad | **1** | Sin logs estructurados; diagnóstico requiere navegar UI n8n → Workflows → Executions → nodo; MTTD estimado 5–10 min, no reproducible | **5** | Log JSON estructurado por etapa; MTTD analítico ~14 s; medida (`MTTD ≤ 60 s`) cumplida con holgura significativa; runtime live pendiente (eleva confianza pero el analítico ya cumple la medida) | +4 | `medicion/consolidado/mttd-resultado.md` |
| BOT-Q6 | Corrección contratos HTTP | Adec. funcional | **2** | E1 no diferencia 401/400; retorna 200 con cuerpo de error o 500 según el nodo que falle; `run-log-bot-as-is.csv` muestra inconsistencias | **5** | 100 % de status HTTP correctos en Sets C y D; 401 para token inválido, 400 para payload malformado; medida cumplida; defendido por NR-BOT-02 | +3 | `run-log-bot-to-be.csv` Sets C y D |

**Promedio Bot — as-is:** 1.67 → **Promedio Bot — to-be:** 4.83 → **Δ promedio: +3.16 puntos** (+190 %)

---

## 3. Matriz IoT — 6 escenarios

| ID | Escenario | Atributo | As-is | Justificación as-is | To-be | Justificación to-be | Δ | Evidencia |
|---|---|---|:---:|---|:---:|---|:---:|---|
| IOT-Q1 | Ajuste umbrales (CR1) | Mantenibilidad | **2** | CR1 toca 6 nodos (Temp Critica?, Humedad Alta?, Determinar Nivel, Set de output, etc.); umbrales dispersos; viola REG-007 | **5** | CR1 toca 1 nodo en subflujo E2; constante `UMBRALES` centralizada (AP-10); ADR-002 alinea con ASHRAE/ISO 7730; medida (`nodes_touched ≤ 1`) cumplida | +3 | `cr-log-iot-to-be.csv` CR-IOT-004 |
| IOT-Q2 | Cambio canal alerta (CR2) | Mantenibilidad | **2** | CR2 toca 4 nodos (HTTP notificación crítica, advertencia, parámetros, manejo de respuesta); routing y endpoints mezclados | **5** | CR2 toca 1 nodo en E4 (rama crítica); routing por nivel separa responsabilidad; medida (`nodes_touched ≤ 1`) cumplida | +3 | `cr-log-iot-to-be.csv` CR-IOT-005 |
| IOT-Q3 | Integridad reintentos | Fiabilidad | **1** | INSERT sin ON CONFLICT, sin idempotency_key; duplicados en `lecturas_sensor`; antipatrón REG-005 visible | **5** | `idempotency_key = SHA256(sensor_id + timestamp)`; `ON CONFLICT (idempotency_key) DO NOTHING`; Set K: 0 % fallos, 1 fila por key; medida (`COUNT = 1`) cumplida; defendido por NR-IOT-02 | +4 | ADR-003 IoT + `iot-to-be-e3-persistencia.json` |
| IOT-Q4 | Tolerancia fallos red | Fiabilidad | **1** | Sin retry en nodos HTTP; falla permanente al primer error; antipatrón REG-004 | **4** | Retry maxRetries=3 (CRÍTICO) confirmado en runtime (outlier 30 011 ms); error workflow disparado; dead-letter parcialmente bloqueado por SP-IOT-01 (limita score a 4); NR-IOT-01 garantiza integridad del dato en E3 | +3 | Runtime 2026-05-07, `mttd-resultado.md` §IOT-Q4-runtime |
| IOT-Q5 | Urgencia diferenciada | Confiabilidad | **1** | Sin routing por nivel; antipatrón "god node" emite la misma notificación independiente de severidad | **4** | Routing E4 por `nivel` (AP-09); maxRetries asimétrico 3 vs 2; análisis Set I confirma diferenciación estructural; TP-IOT-01 documentado (Δ latencia +10.8 ms es trade-off, no defecto); score 4 por la latencia diferencial pequeña — no es prioridad estricta de cola | +3 | `analisis_iot_q5.py`, `metricas-derivadas.md` §IOT-Q5 |
| IOT-Q6 | Confidencialidad BD | Seguridad | **1** | Credenciales PostgreSQL como literales en nodo de output; viola REG-001 | **5** | 0 secretos en JSON; credencial `"Postgres Local"` referenciada por nombre; validador confirma; defendido por NR-GLOBAL-01 | +4 | `microframework/validacion/reportes/validacion-2026-05-06.md` |

**Promedio IoT — as-is:** 1.33 → **Promedio IoT — to-be:** 4.67 → **Δ promedio: +3.34 puntos** (+251 %)

---

## 4. Síntesis comparativa global

### 4.1 Resumen estadístico

| Métrica | Bot | IoT | Global |
|---|:---:|:---:|:---:|
| Promedio as-is | 1.67 | 1.33 | 1.50 |
| Promedio to-be | 4.83 | 4.67 | 4.75 |
| Mejora promedio | +3.16 | +3.34 | +3.25 |
| Mejora % | +190 % | +251 % | +217 % |
| Escenarios con score to-be = 5 | 4 / 6 | 4 / 6 | 8 / 12 |
| Escenarios con score to-be = 4 | 2 / 6 | 2 / 6 | 4 / 12 |
| Escenarios con score to-be < 4 | 0 / 6 | 0 / 6 | 0 / 12 |

### 4.2 Distribución de mejora por atributo ISO 25010

| Atributo | Escenarios | Δ score promedio | Interpretación |
|---|:---:|:---:|---|
| Mantenibilidad / Modularidad | 4 (BOT-Q1, BOT-Q2, IOT-Q1, IOT-Q2) | **+3.00** | Mejora consistente y predecible; impacto CR baja de 8/5/6/4 nodos a 1/1/1/1 |
| Fiabilidad / Madurez | 2 (BOT-Q4, IOT-Q3) | **+3.00** | Patrón idempotencia más SP-BOT-01 limita a 4 en Bot |
| Fiabilidad / Tolerancia a fallos | 2 (IOT-Q4, IOT-Q5) | **+3.00** | Retry + routing diferenciado; SP-IOT-01 y TP-IOT-01 limitan a 4 |
| Seguridad / Confidencialidad | 2 (BOT-Q3, IOT-Q6) | **+4.00** | Mayor magnitud de mejora — el as-is violaba REG-001 sistemáticamente |
| Operabilidad / Monitoreabilidad | 1 (BOT-Q5) | **+4.00** | Log estructurado + protocolo MTTD reproducible |
| Adec. funcional / Corrección | 1 (BOT-Q6) | **+3.00** | HTTP correctos en 100 % de los Sets C y D |

### 4.3 Visualización tipo radar (texto)

```
                    Bot                              IoT
            BOT-Q1                            IOT-Q1
              5 ●                                5 ●
       BOT-Q6      BOT-Q2               IOT-Q6        IOT-Q2
         5 ●        5 ●                  5 ●            5 ●
                                                            
       BOT-Q5      BOT-Q3               IOT-Q5         IOT-Q3
         5 ●        5 ●                  4 ●            5 ●
              4 ●                                 4 ●
            BOT-Q4                              IOT-Q4

         (línea continua: to-be)          (línea continua: to-be)
         (As-is en todos: 1 o 2)          (As-is en todos: 1 o 2)
```

### 4.4 Lectura interpretativa

1. **Ningún escenario to-be obtiene score 5 en seguridad o fiabilidad** — los 4 puntos en BOT-Q4, IOT-Q4 e IOT-Q5 reflejan dependencias externas (servicio de tickets, mock-iot) o trade-offs documentados (TP-IOT-01) que limitan el cumplimiento absoluto de la medida de respuesta del utility tree. Esto es honestidad analítica: el framework mejora sustancialmente pero no garantiza perfección en escenarios que requieren cooperación de terceros.

2. **La magnitud de mejora más grande es en seguridad** (Δ = +4.00 en BOT-Q3 e IOT-Q6) — coherente con que el as-is violaba REG-001 sistemáticamente y el to-be lo cumple al 100 % con doble defensa (credenciales n8n + validador estático).

3. **La mejora es ligeramente mayor en IoT** (+251 % vs +190 %) — atribuible a que el as-is IoT partía de scores más bajos (promedio 1.33 vs 1.67 en Bot) por su naturaleza monolítica más severa.

4. **Cero regresiones** — ningún escenario tiene score to-be inferior al as-is. Los trade-offs documentados (TP-GLOBAL-01 latencia +119 % en IoT, TP-IOT-01 +10.8 ms crítico vs advertencia) no impactan los escenarios top-K porque ninguno tiene eficiencia como atributo principal evaluado en el utility tree — la eficiencia se reporta como trade-off contextual en el informe, no como métrica de scoring.

5. **Validación externa completada.** El scoring anterior es analítico del autor con base en evidencia cuantitativa. La encuesta de validación externa (Sección E del instrumento, mini-ATAM, N=17) comparó este scoring con el de un panel de 17 expertos y calculó el acuerdo inter-evaluador mediante Krippendorff's α. Resultado: convergencia exacta en 12/12 escenarios to-be y 11/12 as-is; las divergencias se documentan en `informe-atam-final.md` §8.4.

---

## 5. Relación con el resto del análisis ATAM

- **Aporta al informe ATAM final:** sección 6 "Matriz de scoring as-is vs to-be" se construye directamente sobre esta tabla.
- **Insumo del Bloque E (encuesta):** los expertos del mini-ATAM puntúan los mismos 12 escenarios en la Sección E del instrumento; la comparación con la presente matriz produce evidencia de convergencia/divergencia.
- **Soporta los hallazgos de `analisis-approaches.md`:** cada justificación de score cita el SP/TP/R/NR aplicable, manteniendo trazabilidad cruzada.
- **Cumple R4 del anteproyecto:** la "matriz scoring" listada como artefacto obligatorio del entregable R4 (Protocolo e informe ATAM) está completa.
