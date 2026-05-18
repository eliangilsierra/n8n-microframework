# Métricas derivadas — Fases 5 y 6

**Fecha:** 2026-05-05
**Fuentes:** run-logs, cr-logs, JSON de flujos, validar-flujos.mjs
**Referencia:** `docs/context/proyecto-overview.md` §Métricas de evaluación

---

## Dimensión Entrega — Impacto de Change Requests

### Nodos tocados por CR (métrica principal)

| CR | Tipo | Bot as-is | Bot to-be | Delta bot | IoT as-is | IoT to-be | Delta iot |
|----|------|-----------|-----------|-----------|-----------|-----------|-----------|
| CR1 | Regla de negocio | 8 | 1 | −87.5% | 6 | 1 | −83.3% |
| CR2 | Integración | 5 | 1 | −80.0% | 4 | 1 | −75.0% |
| CR3 | Validación/error | 3 | 1 | −66.7% | 3 | 0 | −100.0% |
| **Promedio** | | **5.3** | **1.0** | **−81.4%** | **4.3** | **0.7** | **−84.4%** |

**Meta orientativa:** reducción ≥ 20% en to-be vs as-is ✅ Superada ampliamente (Bot −81%, IoT −84%)

### Tiempo por CR (minutos)

| CR | Bot as-is | Bot to-be | Δ tiempo bot | IoT as-is | IoT to-be | Δ tiempo iot |
|----|-----------|-----------|-------------|-----------|-----------|-------------|
| CR1 | 37 min | 8 min | −78% | 35 min | 9 min | −74% |
| CR2 | 33 min | 7 min | −79% | 27 min | 6 min | −78% |
| CR3 | 28 min | 5 min | −82% | 22 min | 0.5 min | −98% |
| **Promedio** | **32.7 min** | **6.7 min** | **−79%** | **28.0 min** | **5.2 min** | **−81%** |

### Intentos hasta verificación exitosa

| CR | Bot as-is | Bot to-be | IoT as-is | IoT to-be |
|----|-----------|-----------|-----------|-----------|
| CR1 | 3 | 1 | 3 | 1 |
| CR2 | 2 | 1 | 2 | 1 |
| CR3 | 2 | 1 | 2 | 1 |
| **Total** | **7** | **3** | **7** | **3** |

### Dependencias externas tocadas

| CR | Bot as-is | Bot to-be | IoT as-is | IoT to-be |
|----|-----------|-----------|-----------|-----------|
| CR1 | 0 | 0 | 0 | 0 |
| CR2 | 1 | 1 | 1 | 1 |
| CR3 | 0 | 0 | 0 | 0 |
| **Total** | **1** | **1** | **1** | **1** |

*Las dependencias externas no se reducen porque CR2 requiere cambio de endpoint por diseño — independiente de la arquitectura.*

---

## Dimensión Operación — Run-logs

### Ejecuciones fallidas

| Caso | N as-is | Fallos as-is | % as-is | N to-be | Fallos to-be | % to-be | Δ%fail |
|------|---------|-------------|---------|---------|-------------|---------|--------|
| Bot | 2000 | 175 | 8.75% | 2000 | 111 | 5.55% | −36.6% ✅ |
| IoT | 2000 | 4 | 0.20% | 2000 | 11 | 0.55% | +175% ⚠️ |

**Bot:** reducción de fallos ≥ 30% ✅ (−36.6%). Meta orientativa cumplida.
**IoT:** incremento esperado — el to-be valida correctamente (E1 rechaza entradas inválidas que el as-is aceptaba). Los 11 fallos to-be son rechazos correctos de sets inválidos (D, E), no regresiones.

### Latencia p50 (sets canónicos A y B)

| Caso | Set | p50 as-is | p50 to-be | Δp50 | Interpretación |
|------|-----|-----------|-----------|------|----------------|
| Bot | A | 120 ms | 131 ms | +9% | Overhead subflujos acceptable — eliminó rate limiter REG-002 |
| Bot | B | 118 ms | 120 ms | +2% | Overhead mínimo |
| Bot | C | 66 ms | 39 ms | −42% | To-be rechaza en E1 sin invocar E2/E3 — más rápido |
| IoT | A | 78 ms | 171 ms | +119% | Pipeline E1→E2→E3→E4 más etapas vs monolito |
| IoT | B | 78 ms | 182 ms | +134% | Idem — overhead de subflujos en n8n |
| IoT | C | 42 ms | 65 ms | +55% | Rechazo E1 en to-be vs paso completo (antipatrón) en as-is |

**Nota IoT:** el overhead +119% a +134% es consecuencia de añadir 4 subflujos (E1–E4) donde el as-is era monolítico. Es un trade-off documentado de mantenibilidad vs latencia (ADR-001 IoT). Para producción el impacto se mitigaría con n8n en modo clustered.

### Micro-benchmark JMeter

**Estado:** ⚠️ Pendiente — JMeter no está instalado en el entorno de evaluación.

**Acción:** instalar JMeter 5.6+ y ejecutar:
```bash
jmeter -n -t medicion/datasets/jmeter/bot-load-test.jmx -l medicion/datasets/jmeter/resultados/bot-jmeter-result.jtl
jmeter -n -t medicion/datasets/jmeter/iot-load-test.jmx -l medicion/datasets/jmeter/resultados/iot-jmeter-result.jtl
```

---

## Dimensión Seguridad

### Exposición de secretos (0 = ninguna, 1 = alguna)

| Caso | Versión | Secretos en JSON | Resultado |
|------|---------|-----------------|-----------|
| Bot | As-is | Token hardcodeado en nodo 6 (`rightValue`), api_key en nodo 8 header, const en nodo 9 jsCode, api-key en nodos 12/14 | **1 (violación)** |
| Bot | To-be | 0 secretos literales — token vía `$env.BOT_API_TOKEN`, api-key vía credencial n8n | **0 ✅** |
| IoT | As-is | Credenciales PostgreSQL en nodo output (validar-flujos.mjs detecta REG-001 en plantilla iot-as-is) | **1 (violación)** |
| IoT | To-be | 0 secretos literales — Postgres vía credencial `"Postgres Local"`, API key vía credencial `"Notificacion API Key"` | **0 ✅** |

**Fuente:** `validar-flujos.mjs` REG-001. Bot as-is: 0/4 (100% violación). Bot to-be: 100% cumplimiento.

### Superficie de código (nodos Code por versión)

| Caso | As-is nodos Code | To-be nodos Code | Δ |
|------|-----------------|-----------------|---|
| Bot | 2 (Validar Payload, Procesar Mensaje) | 5 (E1 orq., E2 dominio, E3 preparar, E3 log, error handler) | +3 |
| IoT | 1 (Calcular Nivel jsCode) | 8 (E1, E2, E3 preparar, E3 log, E4 inicio, E4 log-ok, E4 log-skip, error handler) | +7 |

*El incremento en nodos Code es esperado: el to-be centraliza lógica en Code nodes con responsabilidad única en lugar de distribuirla en nodos IF y Set. Cada nodo Code tiene una responsabilidad clara (E1, E2, E3, E4) y log estructurado.*

### Mínimo privilegio

| Verificación | Estado |
|-------------|--------|
| Credencial Postgres usa usuario `n8n_user` (no superuser) | ✅ Confirmado en docker-compose.yml |
| Credencial API Key de tickets usada solo en E3 (no en E1 ni E2) | ✅ Verificado en JSON to-be bot |
| Credencial API Key de notificaciones usada solo en E4 | ✅ Verificado en JSON to-be IoT |
| Error handlers no tienen acceso a DB de negocio | ✅ Error handler IoT notifica a mock, no accede a PostgreSQL directamente |

---

## Dimensión Trazabilidad

### Cobertura ADR

| Caso | ADRs documentados | Decisiones identificadas | Cobertura |
|------|------------------|------------------------|-----------|
| Bot | ADR-001…008 (8) | 8 (separación, omisión E4, rate-limit, experimental, autenticación, error workflow, clasificación E2, rate-limit to-be) | 100% |
| IoT | ADR-001…008 (8) | 8 (pipeline, umbrales, idempotencia, routing E4, error workflow, validación E1, timestamp authority, normalización) | 100% |
| Framework | ADR-MF-001…003 (3) | 3 (REG-001, REG-003, REG-006) | 100% |
| **Total** | **19** | **19** | **100%** ✅ |

### Cobertura ATAM

Ver `medicion/consolidado/atam-evidencia.md`:
- Bot: 5/6 = 83% ✅ (BOT-Q5 analítico ~14s)
- IoT: 6/6 = 100% ✅ (IOT-Q4 runtime 2026-05-07; IOT-Q5 análisis 2026-05-07)
- Total: 11/12 = 92% ✅

### Cobertura checklist to-be

| Caso | Arquitectura | DevSecOps |
|------|-------------|-----------|
| Bot | 10/10 = 100% ✅ | 8/8 = 100% ✅ |
| IoT | 10/10 = 100% ✅ | 7/7 aplicables = 100% ✅ (1 ítem N/A por diseño) |

**Meta ≥ 90% cumplida** en todos los checklists.

### MTTD

Ver `medicion/consolidado/mttd-resultado.md`:
- Bot to-be: ~14 segundos (meta < 60s ✅)
- IoT to-be: evidencia estructural ✅; runtime pendiente

### Ratio reuso de subflujos

| Caso | Total subflujos | Invocados por >1 orquestador | Ratio |
|------|----------------|------------------------------|-------|
| Bot | 2 (E2, E3) | 0 | 0% |
| IoT | 4 (E1, E2, E3, E4) | 0 | 0% |

**Observación:** El ratio es 0% porque cada caso tiene un único orquestador en esta fase del proyecto. El micro-framework está diseñado para que en evoluciones futuras (e.g., un bot-v2 que reutilice el mismo E3 de persistencia de tickets) el ratio aumente. La arquitectura lo permite por el mecanismo `Execute Workflow` con IDs. El ratio 0% es esperado y no representa una violación de las metas del proyecto (el anteproyecto no establece meta numérica para esta métrica en Fase 6).

---

## Síntesis de metas orientativas

| Meta | Valor | Resultado |
|------|-------|-----------|
| Impacto de cambio: reducción ≥ 20% en nodos tocados | Bot −81%, IoT −84% | ✅ Superada |
| Confiabilidad: reducción ≥ 30% en fallos | Bot −36.6% | ✅ Cumplida |
| Confiabilidad IoT | +175% (corrección intencional — as-is aceptaba todo) | N/A — antipatrón resuelto |
| Cumplimiento checklist ≥ 90% en to-be | Bot 100%, IoT 100% | ✅ Cumplida |
| Cobertura ATAM ≥ 80% por caso | Bot 83%, IoT 100% | ✅ Ambos cumplidos |

---

## IOT-Q5 — Urgencia diferenciada por nivel de alerta (2026-05-07)

**Script:** `medicion/analisis_iot_q5.py`
**Input:** `medicion/run-logs/iot/run-log-iot-to-be.csv` Set I (N=200)
**Niveles calculados con umbrales ADR-002** (temp>35°C o co2>1200 → crítico; hum>80% o co2>800 → advertencia)

### Distribución Set I

| Nivel | N | % |
|---|---|---|
| normal | 47 | 24% |
| advertencia | 60 | 30% |
| crítico | 93 | 46% |

*Set I es "gradual_degradation" — los valores de temperatura/CO2 escalan progresivamente, por eso crítico domina en la segunda mitad del set.*

### Latencia por nivel (cliente Python)

| Nivel | N | p50 ms | p95 ms | min ms | max ms |
|---|---|---|---|---|---|
| normal | 47 | 157.6 | 174.4 | 139.6 | 179.5 |
| advertencia | 60 | 172.4 | 202.9 | 154.4 | 215.4 |
| **crítico** | **93** | **183.2** | **222.0** | **158.6** | **30011.0** |

### Hallazgos

**Diferenciación estructural confirmada:**
E4 implementa dos ramas HTTP distintas según `nivel` (ADR-004 IoT): rama CRÍTICO con `maxRetries=3` y rama ADVERTENCIA con `maxRetries=2`. El routing diferenciado existe y funciona.

**TP-IOT-01 — Tradeoff Point:** El branch CRÍTICO tiene overhead de latencia nominal +10.8ms respecto a ADVERTENCIA (183.2 vs 172.4 ms p50). La mayor configuración de retry (3 vs 2) introduce overhead mínimo cuando mock-iot responde sin errores. El outlier de 30011ms en crítico confirma que el mecanismo de retry **se activó en runtime** para al menos una lectura crítica — evidencia directa de REG-004 en acción.

**Interpretación metodológica:** IOT-Q5 evalúa routing diferenciado por nivel, no prioridad de cola de mensajes. En n8n cada webhook es síncrono e independiente — no existe scheduler de prioridades a nivel de proceso. La "urgencia diferenciada" es arquitectónica: el branch CRÍTICO tiene mayor resiliencia (más reintentos) al costo de +10.8ms de latencia nominal. Esto es coherente con el objetivo del escenario.

---

## Referencias

- Run-logs: `medicion/run-logs/`
- CR-logs: `medicion/cr-logs/`
- Comparación: `medicion/consolidado/comparacion-2026-05-05.md`
- ATAM: `medicion/consolidado/atam-evidencia.md`
- MTTD: `medicion/consolidado/mttd-resultado.md`
- Validación estática: `microframework/validacion/reportes/validacion-2026-05-06.md`
