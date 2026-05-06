# Matriz de evidencia ATAM — 12 escenarios × evidencia disponible

**Versión:** 1.0
**Fecha:** 2026-05-05
**Cobertura:** Bot 5/6 (83%) ✅ · IoT 4/6 (67%) ⚠️ · Total 9/12 (75%)
**Meta:** ≥ 80% por caso con evidencia trazable

---

## Caso Bot — 6 escenarios

| ID | Driver | Atributo | Medida de respuesta | Evidencia disponible | Estado |
|----|--------|----------|--------------------|--------------------|--------|
| BOT-Q1 | Modificabilidad de reglas | Mantenibilidad | `nodes_touched ≤ 1` en cr-log-bot-to-be.csv | `cr-log-bot-to-be.csv` CR-BOT-004: `nodes_touched=1` vs as-is=8 (−87.5%) | ✅ Completa |
| BOT-Q2 | Cambio de proveedor tickets | Mantenibilidad | `nodes_touched ≤ 1` en cr-log-bot-to-be.csv | `cr-log-bot-to-be.csv` CR-BOT-005: `nodes_touched=1` vs as-is=5 (−80%) | ✅ Completa |
| BOT-Q3 | Confidencialidad credenciales | Seguridad | `ocurrencias_literal_token = 0` vía validar-flujos.mjs | `validar-flujos.mjs` REG-001: 0 secretos en bot to-be. `run-log-bot-to-be.csv` Set C: token inválido → HTTP 401 ✅ | ✅ Completa |
| BOT-Q4 | Integridad ante reintentos | Fiabilidad | `COUNT(tickets_duplicados) = 0` vía mock-bot | `run-log-bot-to-be.csv` Set K: 0% fallos. REG-005 checklist: `Idempotency-Key` header en E3 ✅ | ✅ Completa |
| BOT-Q5 | Diagnóstico de fallos (MTTD) | Operabilidad | `MTTD ≤ 60 segundos` | `medicion/consolidado/mttd-resultado.md`: MTTD analítico ~14s ✅. Evidencia estructural: E1 log JSON con `etapa`, `errores`. Runtime pending live measurement | ⚠️ Parcial |
| BOT-Q6 | Corrección contratos HTTP | Adecuación funcional | `HTTP_status_correcto = 100%` Sets C y D | `run-log-bot-to-be.csv` Set C: 100% status=success (401 esperado). `comparacion-2026-05-05.md`: Δ%fail Set C −100% | ✅ Completa |

**Cobertura Bot: 5/6 = 83%** ✅ (meta ≥ 80% cumplida)

---

## Caso IoT — 6 escenarios

| ID | Driver | Atributo | Medida de respuesta | Evidencia disponible | Estado |
|----|--------|----------|--------------------|--------------------|--------|
| IOT-Q1 | Ajuste umbrales alerta | Mantenibilidad | `nodes_touched ≤ 1` en cr-log-iot-to-be.csv | `cr-log-iot-to-be.csv` CR-IOT-004: `nodes_touched=1` vs as-is=6 (−83.3%) | ✅ Completa |
| IOT-Q2 | Cambio canal alerta | Mantenibilidad | `nodes_touched ≤ 1` en cr-log-iot-to-be.csv | `cr-log-iot-to-be.csv` CR-IOT-005: `nodes_touched=1` vs as-is=4 (−75%) | ✅ Completa |
| IOT-Q3 | Integridad lecturas ante reintentos | Fiabilidad | `COUNT(*) = 1` en PostgreSQL por idempotency_key | `iot-to-be-e3-persistencia.json`: `ON CONFLICT (idempotency_key) DO NOTHING`. REG-005 ✅. `run-log-iot-to-be.csv` Set K: 0% fallos | ✅ Completa |
| IOT-Q4 | Tolerancia fallos de red | Fiabilidad | `fallos_tipo_integration = 0` post-recovery | `iot-to-be-e4-notificacion.json`: retry maxRetries=3 (CRÍTICO) y maxRetries=2 (ADVERTENCIA). REG-004 ✅. Runtime (docker stop mock-iot) pendiente | ⚠️ Parcial |
| IOT-Q5 | Urgencia diferenciada alertas | Confiabilidad | `duracion_ms_critico < duracion_ms_advertencia` Set I | E4 routing diferenciado: IF-nivel-critico → dos ramas HTTP. Datos de Set I en `run-log-iot-to-be.csv` sin desglose por nivel de alerta. Análisis granular pendiente | ⚠️ Parcial |
| IOT-Q6 | Confidencialidad credenciales BD | Seguridad | `ocurrencias_literal_pg_password = 0` vía validar-flujos.mjs | `validar-flujos.mjs` REG-001: 0 secretos en IoT to-be. E3 usa credencial n8n `"Postgres Local"` sin valores literales ✅ | ✅ Completa |

**Cobertura IoT: 4/6 = 67%** ⚠️ (meta ≥ 80% no cumplida — ver plan de cierre)

---

## Resumen de cobertura global

| Caso | Escenarios cubiertos | Escenarios parciales | Cobertura | Meta |
|------|---------------------|---------------------|-----------|------|
| Bot | 5 (BOT-Q1,Q2,Q3,Q4,Q6) | 1 (BOT-Q5) | 83% | ✅ ≥ 80% |
| IoT | 4 (IOT-Q1,Q2,Q3,Q6) | 2 (IOT-Q4,Q5) | 67% | ⚠️ < 80% |
| **Total** | **9** | **3** | **75%** | **Pendiente** |

---

## Plan para alcanzar 80% en IoT

| Escenario | Acción requerida | Artefacto a generar | Tiempo estimado |
|-----------|-----------------|--------------------|----|
| IOT-Q4 | Ejecutar: `docker compose stop mock-iot && sleep 3 && docker compose start mock-iot` + enviar lectura crítica + verificar en DB | Nota en `run-log-iot-to-be.csv` con `notes: MTTD=XXs, retry_exitoso=true` | 15 min |
| IOT-Q5 | Analizar `run-log-iot-to-be.csv` Set I: filtrar filas por `nivel` y comparar `duracion_ms` | Sección adicional en `mttd-resultado.md` o script Python | 30 min |

Si IOT-Q4 se completa: cobertura IoT → 5/6 = 83% ✅

---

## Mapeo escenarios → ADRs → artefactos de medición

| Escenario | ADR principal | Artefacto de medición | Commit de evidencia |
|-----------|---------------|----------------------|-------------------|
| BOT-Q1 | ADR-007 Bot | `cr-log-bot-to-be.csv` | b1bdb8a |
| BOT-Q2 | ADR-001 Bot | `cr-log-bot-to-be.csv` | b1bdb8a |
| BOT-Q3 | ADR-005 Bot + ADR-MF-001 | `validar-flujos.mjs` (REG-001) + `run-log-bot-to-be.csv` | b1bdb8a |
| BOT-Q4 | ADR-001 Bot | `run-log-bot-to-be.csv` Set K | b1bdb8a |
| BOT-Q5 | ADR-MF-003 + ADR-006 Bot | `mttd-resultado.md` | b1bdb8a |
| BOT-Q6 | ADR-005 Bot | `run-log-bot-to-be.csv` Sets C y D | b1bdb8a |
| IOT-Q1 | ADR-002 IoT + ADR-008 IoT | `cr-log-iot-to-be.csv` | b1bdb8a |
| IOT-Q2 | ADR-004 IoT | `cr-log-iot-to-be.csv` | b1bdb8a |
| IOT-Q3 | ADR-003 IoT + ADR-007 IoT | `run-log-iot-to-be.csv` Set K + DB query | b1bdb8a |
| IOT-Q4 | ADR-004 IoT | `run-log-iot-to-be.csv` (pendiente runtime) | pendiente |
| IOT-Q5 | ADR-004 IoT | `run-log-iot-to-be.csv` Set I (análisis pendiente) | pendiente |
| IOT-Q6 | ADR-MF-001 + ADR-001 IoT | `validar-flujos.mjs` (REG-001) | b1bdb8a |

---

## Referencias

- Utility Tree ATAM: `docs/context/atam-utility-tree.md`
- Run-logs to-be: `medicion/run-logs/{bot,iot}/run-log-*-to-be.csv`
- CR-logs to-be: `medicion/cr-logs/{bot,iot}/cr-log-*-to-be.csv`
- MTTD: `medicion/consolidado/mttd-resultado.md`
- Validación estática: `microframework/validacion/reportes/validacion-2026-05-06.md`
