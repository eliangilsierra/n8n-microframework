# Cambios y evidencia del as-is — IoT

## Propósito

Registro cronológico de cada cambio arquitectónico hecho al as-is del caso IoT durante
FASE 2, con rationale, commit y vinculación a reglas del micro-framework. Sirve como
respaldo para la auditoría ATAM y la defensa académica.

Complementa a `notas-tecnicas.md` (estado final del as-is) aportando la trayectoria
cronológica y el razonamiento de cada decisión.

---

## Línea base inicial

El as-is del IoT inició como un flujo n8n de **6 nodos** modelando la ingestión de
lecturas ambientales desde sensores industriales con persistencia PostgreSQL:

`Webhook → Validar payload → Evaluar umbral → Insertar BD → Notificar si crítico → Responder`

Limitaciones arquitectónicas identificadas en la primera ejecución (19/04/2026):

- Umbrales dispersos en un único nodo Code sin constante nombrada.
- Sin manejo de idempotencia (REG-005 no medible).
- Sin retry en las integraciones HTTP (REG-004 N/A pero conceptualmente ausente).
- Credenciales de PostgreSQL embebidas en el nodo (REG-001 ejemplo directo).
- Un solo canal de notificación (no exhibía trade-off de routing por severidad).

Decisión: rediseño estructural del as-is para que exhibiera simultáneamente los
antipatrones REG-001, REG-004, REG-005, REG-006, REG-007, REG-008 y REG-009, análogo
al rediseño del Bot (CR-ASIS-01 Bot).

---

## Change-log cronológico

### CR-ASIS-01 (2026-04-19) — Rediseño estructural del flujo IoT (6 → 14 nodos)

**Descripción:** Expansión del flujo as-is para exhibir deliberadamente los antipatrones
REG-* detectables por el validador estático y producibles en el run-log.

**Rationale:** El as-is original era "demasiado limpio" para servir como línea base
comparativa. Sin violaciones visibles, el delta vs. to-be sería marginal y no
atribuible al micro-framework con claridad estadística.

**Nodos agregados/modificados:**

| Nodo | Cambio | REG-* violada |
|------|--------|----------------|
| 3 `Validar Lectura` | Validación binaria sin diferenciar tipos de error (422 vs 400) | REG-009 |
| 5 `Calcular Nivel` | Umbrales hardcodeados `if (temp > 35)`, `if (co2 > 1500)` sin constante | REG-007 |
| 7 `Enriquecer Metadatos` | NUEVO — cálculo de `location`, `shift_id`, merge inline (lógica dominio en orquestador) | REG-007 |
| 9 `Consultar Histórico Sensor` | NUEVO — GET `/api/sensor/:id/history` sin retry, header `x-api-key: literal` | REG-001, REG-004 |
| 10 `Persistir PostgreSQL` | INSERT sin `ON CONFLICT`, credenciales hardcodeadas en nodo | REG-001, REG-005 |
| 11 `Notificar Evento` | POST `/api/notify` único canal, sin retry, `Authorization: Bearer <literal>` | REG-001, REG-004 |
| 13 `Registrar Auditoría` | NUEVO — segundo INSERT sin ON CONFLICT | REG-005 |
| orquestador | Todos los HTTP/DB inline, sin subflujos E3/E4 | REG-008 |
| todos los Code | Sin `console.log(JSON.stringify({run_id, etapa, status}))` | REG-006 |
| settings | Sin `errorWorkflow` | REG-003 |
| Respond to Webhook | `responseCode` único 200 | REG-009 |

**Commit:** `cff317a`

**Evidencia:**
- `notas-tecnicas.md` §Mapeo REG-001..010
- Validador: `node microframework/validacion/validar-flujos.mjs --caso iot --estado as-is` → 7 reglas aplicables, 6 violadas.
- Run-log filas 1..600 (sets A, B, C iniciales).

**REG-* involucradas:** REG-001, REG-004, REG-005, REG-006, REG-007, REG-008, REG-009.

**Formalización:** ADR-001 IoT (separación de responsabilidades pipeline).

---

### CR-ASIS-02 (2026-04-19) — Remoción de credenciales PostgreSQL hardcodeadas del nodo

**Descripción:** Las credenciales de PostgreSQL estaban hardcodeadas en el nodo 10
(`Persistir PostgreSQL`) como `parameters.host`, `parameters.user`, `parameters.password`.
Se removieron los literales y se referencia una credential `postgres-iot-credential`
configurada en la instancia local de n8n.

**Rationale:** Aunque el proyecto documenta que "el as-is viola REG-001 intencionalmente",
las credenciales reales NUNCA deben estar en el repositorio (regla crítica del CLAUDE.md).
La violación de REG-001 queda representada por los tokens HTTP hardcodeados (nodos 9, 11,
13), que sí son valores ficticios sin riesgo operativo. Las credenciales de la BD real
van en `.env` (ignorado por git) y se inyectan vía credential de n8n.

**Archivos tocados:**
- `casos-de-estudio/iot/as-is/iot-as-is.json` — nodo 10 credential-reference
- `microframework/plantillas/iot-as-is.json` — ajuste análogo

**Commit:** `cff317a` (mismo commit de CR-ASIS-01, como cierre del rediseño)

**Evidencia:**
- `grep -i "password" casos-de-estudio/iot/as-is/iot-as-is.json` → 0 líneas
- Validador sigue marcando REG-001 violada por los headers HTTP literales, no por la BD.

**REG-* involucradas:** REG-001 (preservada en el flujo via HTTP; removida del nodo Postgres).

---

### CR-ASIS-03 (2026-04-21) — Ampliación de Input Sets A–C a A–K (10 sets)

**Descripción:** Misma ampliación que la del Bot (ADR-004 Bot aplica a ambos casos).
Para IoT, el set K (duplicados idempotencia) es el único capaz de medir REG-005 con
evidencia cuantitativa.

**Rationale:** Sin el set K, el antipatrón INSERT-sin-ON-CONFLICT del as-is no tiene
contraparte medible; el delta vs to-be sería cero y la tesis no podría defender la
regla REG-005 con evidencia empírica.

**Diseño del set K para IoT:**
- 100 `idempotency_key` únicos, cada uno enviado 2 veces → 200 payloads totales.
- Cada par de payloads con el mismo `{sensor_id, timestamp}` (la clave compuesta
  del ADR-003 IoT).
- Resultado esperado: as-is → 200 filas en BD con 100 duplicados; to-be → 100 filas
  con 0 duplicados.

**Archivos creados:**
- `medicion/datasets/iot/input-set-{A..K}.json` (10 archivos)

**Commit:** `a126311`

**Evidencia:**
- Validación del set K: `python -c "import json, collections; d=json.load(open('medicion/datasets/iot/input-set-K.json')); keys=[p['idempotency_key'] for p in d['payloads']]; c=collections.Counter(keys); print(f'Unique:{len(c)} Pairs:{sum(1 for v in c.values() if v==2)}')`
- SHA-256 en `manifest.json`.

**REG-* involucradas:** REG-005 (medible por primera vez).

**Formalización:** ADR-004 Bot (diseño experimental compartido).

---

## Tabla de trazabilidad cambio → commit → evidencia

| CR-ASIS | Fecha | Commit | Archivos tocados | REG-* | Evidencia cuantitativa |
|---------|-------|--------|------------------|-------|------------------------|
| 01 | 2026-04-19 | cff317a | `iot-as-is.json` (6→14 nodos), `notas-tecnicas.md`, `setup_env.py` (tabla lecturas_sensor) | 001,004,005,006,007,008,009 | Validador: 6/7 violaciones; run-log 600 filas |
| 02 | 2026-04-19 | cff317a | `iot-as-is.json` nodo 10 (credential) | 001 parcial | `grep password` = 0 |
| 03 | 2026-04-21 | a126311 | `datasets/iot/input-set-{A..K}.json`, `seeds.yaml` | — (metodología) | SHA-256 manifest + 2000 corridas as-is |

---

## Relación con los ADRs

| Cambio | ADR que lo formaliza |
|--------|----------------------|
| CR-ASIS-01 | `ADR-001-separacion-responsabilidades-pipeline.md` |
| CR-ASIS-01 (umbrales y vocabulario del to-be) | `ADR-002-umbrales-y-vocabulario.md` |
| CR-ASIS-01 (estrategia idempotencia to-be) | `ADR-003-idempotencia-sensor-timestamp.md` |
| CR-ASIS-01 (routing de E4 to-be) | `ADR-004-routing-e4-por-severidad.md` |
| CR-ASIS-03 | `../bot/adr/ADR-004-diseno-experimental-input-sets.md` (compartido) |

---

## Referencias cruzadas

- `casos-de-estudio/iot/as-is/notas-tecnicas.md`
- `casos-de-estudio/iot/adr/` — ADRs 001..004
- `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md`
- `medicion/run-logs/iot/run-log-iot-as-is.csv` — 2000 corridas as-is
- `docs/protocolo-evidencias.md` §5
