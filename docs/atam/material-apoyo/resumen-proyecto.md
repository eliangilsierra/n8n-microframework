<!--
Fuente Markdown del PDF resumen ejecutivo de 4 páginas que verán los respondentes.
Diseñado para ocupar 4 páginas A4 al exportar a PDF.
Estilo: sobrio, técnico, sin emojis decorativos, máxima densidad informativa.
-->

# Micro-framework Arquitectónico LC/NC para n8n
## Resumen ejecutivo para validación externa por panel de expertos

**Trabajo de grado · Maestría en Gestión, Aplicación y Desarrollo de Software (MGADS)**
**Universidad Autónoma de Bucaramanga (UNAB) · 2026**
**Autor:** Elian Hernando Gil Sierra · **Director:** Sebastian Roa Prada, PhD

---

## Página 1 · Problema y propuesta

### El problema

Las plataformas Low-Code/No-Code (LC/NC) como n8n, Zapier, Make o Power Automate han ganado adopción masiva: Gartner proyecta que para 2025 el 70 % de nuevas aplicaciones empresariales incorporarán LC/NC, con un mercado estimado en USD 26.9 B en 2023. Sin embargo, la adopción de estas plataformas tiende a generar flujos "improvisados" sin estructura arquitectónica, lo que produce deuda técnica acelerada, falta de gobernanza, riesgos de seguridad (secretos en JSON, sin retry, sin idempotencia) y dificultad operacional. La literatura (Binzer et al., 2024; Viljoen et al., 2024) documenta estos antipatrones como un problema sistémico de la adopción LC/NC.

### La propuesta

Un micro-framework arquitectónico para n8n fundamentado en Clean Architecture (Martin, 2017) y prácticas DevSecOps, que estructura cualquier flujo en cuatro etapas funcionales y prescribe reglas verificables de buena práctica.

```
┌────────────────────────────────────────────────────────────────────┐
│                       Orquestador n8n                              │
│                                                                    │
│   ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐                         │
│   │ E1  │───▶│ E2  │───▶│ E3  │───▶│ E4  │                         │
│   │     │    │     │    │     │    │     │                         │
│   │Vali-│    │Domi-│    │Adap-│    │Sali-│                         │
│   │dar  │    │nio  │    │ta-  │    │da/  │                         │
│   │entra│    │(neg.│    │dores│    │noti-│                         │
│   │da   │    │lógi-│    │(BD, │    │fica-│                         │
│   │     │    │ca)  │    │APIs)│    │ción)│                         │
│   └─────┘    └─────┘    └─────┘    └─────┘                         │
│                                                                    │
│                  Error workflow (REG-003)                          │
└────────────────────────────────────────────────────────────────────┘
```

**Lo que el framework define:**
- **10 reglas obligatorias** (REG-001 a REG-010) con criterio binario verificable: gestión de secretos, error workflow, retry, idempotencia, log estructurado, validación de entrada, dominio aislado, separación de integraciones, contratos HTTP correctos, orquestación centralizada.
- **6 reglas recomendadas** (REC-001 a REC-006) de optimización.
- **5 patrones** documentados con trade-offs: retry con backoff, idempotencia, circuit breaker, error boundary, saga/compensación.
- **11 antipatrones** identificados con ejemplos de código.
- **Checklist de arquitectura** (10 ítems) y **checklist DevSecOps** (8 ítems).
- **9 JSON Schemas** de contratos E/S.
- **Validador estático** ejecutable (`validar-flujos.mjs`) que verifica REG-001…010 automáticamente sobre cualquier JSON exportado.
- **Guía de observabilidad** mínima con contrato de log estructurado JSON por etapa.

---

## Página 2 · Casos de estudio comparativos

Se evaluó el framework en dos casos representativos ortogonales: un **Bot de soporte** (síncrono, reglas de negocio, integración con servicio externo de tickets) y un **Pipeline IoT** (ingesta, validación, persistencia, notificación de lecturas de sensores ambientales).

### Caso Bot — As-is (antipatrón) vs To-be (con framework)

```
AS-IS (16 nodos, 9/10 REGs violadas):
  webhook → [validar payload] → [rate limit memoria] → [token hardcoded]
           → [procesar mensaje] → [calcular prioridad] → [HTTP tickets api-key hardcoded]
           → [parse respuesta] → ... → respond

TO-BE (orquestador + 2 subflujos, 10/10 REGs cumplidas):
  webhook → E1 (validación + auth) → E2 (subflujo dominio) → E3 (subflujo adaptador)
          → respond

  • Token vía $env.BOT_API_TOKEN (REG-001 ✅)
  • Header Idempotency-Key en E3 (REG-005 ✅)
  • Error workflow con dead-letter (REG-003 ✅)
  • Log estructurado JSON por etapa (REG-006 ✅)
  • Retry en HTTP (REG-004 ✅)
```

### Caso IoT — As-is vs To-be

```
AS-IS (14 nodos, 9/10 REGs violadas):
  webhook → [validar parcial] → [calcular nivel jsCode]
           → [HTTP notificación] → [INSERT sin ON CONFLICT] → respond

TO-BE (orquestador + 4 subflujos + error handler, 10/10 REGs cumplidas):
  webhook → E1 (validación + timestamp authority)
          → E2 (subflujo dominio: UMBRALES centralizados)
          → E3 (subflujo persistencia: idempotency_key + ON CONFLICT)
          → E4 (subflujo notificación: routing por nivel + retry diferenciado)
          → respond

  Error workflow IoT → preserva payload original en dead-letter PostgreSQL
```

### Estadísticas de la evaluación

- **8 000 corridas controladas** (4 000 as-is + 4 000 to-be), datasets sintéticos con semilla determinística (sets A–K, N=200 cada uno).
- **12 Change Requests medidos** (3 CR × 2 casos × 2 versiones).
- **12 escenarios ATAM top-K** evaluados (6 Bot + 6 IoT).
- **19 ADRs** documentando todas las decisiones arquitectónicas.

---

## Página 3 · Resultados cuantitativos

### Mejoras medidas as-is vs to-be

| Métrica | Caso | As-is | To-be | Δ | Meta del estudio |
|---|---|:---:|:---:|:---:|:---:|
| **Impacto de CR** (nodos modificados/CR, promedio) | Bot | 5.3 | 1.0 | **−81 %** | ≥ 20 % ✅ |
| | IoT | 4.3 | 0.7 | **−84 %** | ≥ 20 % ✅ |
| **Tiempo por CR** (minutos, promedio) | Bot | 32.7 | 6.7 | **−79 %** | — |
| | IoT | 28.0 | 5.2 | **−81 %** | — |
| **Fallos en ejecución** | Bot | 9 % | 6 % | **−36.6 %** | ≥ 30 % ✅ |
| | IoT | 0 %* | 1 %† | n/a | * antipatrón / † validación correcta |
| **Cumplimiento checklist** | Bot | n/a | 100 % | — | ≥ 90 % ✅ |
| | IoT | n/a | 100 % | — | ≥ 90 % ✅ |
| **MTTD diagnóstico fallo** | Bot | ~5-10 min | **~14 s** | — | ≤ 60 s ✅ |
| **Secretos literales en JSON** | Bot | 4 | **0** | −100 % | 0 ✅ |
| | IoT | varios | **0** | −100 % | 0 ✅ |

### Trade-offs cuantificados

| Trade-off | Magnitud | Decisión documentada |
|---|---|---|
| **TP-GLOBAL-01:** modularización vs latencia | Bot: +9 % p50 Set A · IoT: +119 % a +192 % p50 | Aceptado (ADR-001) — proyecto prioriza mantenibilidad |
| **TP-IOT-01:** resiliencia canal crítico vs latencia nominal | +10.8 ms p50 crítico vs advertencia | Aceptado (ADR-004 IoT) |
| **TP-GLOBAL-02:** validación estricta vs flexibilidad de contrato | Cualitativo | Aceptado — corrección sobre flexibilidad |

### Cobertura ATAM

- 12/12 escenarios con evidencia trazable (Bot 100 % · IoT 100 %)
- Análisis runtime de IOT-Q4 confirmó retry activo + identificó SP-IOT-01 (canal duplicado en error handler)
- Análisis de IOT-Q5 confirmó routing diferenciado + cuantificó TP-IOT-01

---

## Página 4 · Hallazgos preliminares para discusión + Petición al panel

### Hallazgos arquitectónicos del análisis ATAM del autor

**3 Sensitivity Points** (decisiones que afectan un atributo):
- **SP-BOT-01** — Idempotencia BOT-Q4 depende del header `Idempotency-Key` y el respeto del servicio externo.
- **SP-BOT-02** — MTTD BOT-Q5 depende de la estructura del log JSON de E1.
- **SP-IOT-01** — Canal del error handler IoT coincide con canal de E4 (descubierto en runtime).

**3 Tradeoff Points** (decisiones que afectan múltiples atributos):
- **TP-GLOBAL-01** — Subflujos: mantenibilidad ↑↑ vs latencia ↓ (significativo en IoT).
- **TP-GLOBAL-02** — Validación E1 estricta: corrección ↑↑ vs flexibilidad evolutiva ↓.
- **TP-IOT-01** — Routing diferenciado crítico/advertencia: resiliencia ↑ vs latencia +10.8 ms.

**4 Risks abiertos** (mitigación recomendada en producción):
- **R-BOT-01** — Rotación manual de tokens, sin auto-rotación.
- **R-IOT-01** — Dead-letter no insertado si E4 está totalmente caído (correlacionado con SP-IOT-01).
- **R-GLOBAL-01** — Logs en stdout efímeros sin volumen persistente.
- **R-GLOBAL-02** — Dependencia en respeto de contratos por servicios externos.

**5 Non-risks confirmados** (decisiones que claramente preservan el atributo):
- **NR-IOT-01** — E3 (PostgreSQL) es independiente de E4; dato seguro aunque E4 falle.
- **NR-IOT-02** — Idempotencia previene duplicidad incluso con reintentos externos.
- **NR-BOT-01** — Validación E1 previene side-effects no autorizados.
- **NR-BOT-02** — Contratos HTTP correctos (401/400) en 100 % de Sets C/D.
- **NR-GLOBAL-01** — Validador estático protege contra regresiones de seguridad.

### Lo que necesitamos de usted

Su opinión experta valida externamente estas conclusiones y permite identificar hallazgos no anticipados. La encuesta tiene **dos partes**:

**Parte principal (10–12 minutos):**
1. Caracterización rápida de su perfil profesional (1.5 min)
2. Ocho preguntas de validación percibida con escala Likert 1-5 (5 min)
3. Tres preguntas abiertas sobre riesgos, trade-offs y refinamientos (3 min)
4. Percepción global del framework (1 min)

**Parte opcional avanzada — Mini-ATAM (+15 minutos):**
Si su rol y experiencia se lo permiten, scoring 1-5 as-is/to-be para los 12 escenarios y clasificación arquitectónica (SP/TP/R/NR). Este componente aporta valor metodológico adicional para triangular el scoring del autor.

### Preguntas-guía mientras revisa el video y este documento

Para que sus respuestas en las preguntas abiertas (Sección C) sean específicas y útiles:

1. ¿Los tres Tradeoff Points identificados son razonables y proporcionados? ¿Falta alguno?
2. ¿Los cuatro Risks abiertos tienen severidad apropiada? ¿Conoce mitigaciones más efectivas?
3. ¿Las 10 reglas obligatorias son aplicables en su contexto? ¿Alguna regla sobra, falta, o necesita matiz?
4. ¿El trade-off TP-GLOBAL-01 (latencia +119 % en IoT por modularización) es aceptable, o sería bloqueante en su contexto?

### Contacto

**Elian Hernando Gil Sierra** · Estudiante MGADS — UNAB · 2026

Repositorio del proyecto (público): https://github.com/[usuario]/n8n-microframework
Correo: [correo del autor]

Muchas gracias por su tiempo y experticia.

---

*Documento de 4 páginas — versión 1.0 — 2026-05-07*
*Material de apoyo de la encuesta de validación externa documentada en* `docs/atam/protocolo-encuesta.md`
