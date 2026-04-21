# Guía de observabilidad mínima

Pilar 3 de DevSecOps del micro-framework (§4.3 del anteproyecto: "Resiliencia Operativa —
instrumentación de logs estructurados, retry e idempotencia"). Esta guía define el contrato
mínimo de eventos que todo flujo del micro-framework debe emitir para habilitar medición,
diagnóstico y evaluación ATAM.

Regla obligatoria asociada: **REG-006** (log estructurado JSON por etapa).

---

## Principio

Cada etapa (E1, E2, E3, E4) emite un `console.log(JSON.stringify({...}))` al cerrar su
responsabilidad. El formato es JSON en una sola línea para que sea consultable con
`grep`, `jq` o CloudWatch Insights sin parseo adicional.

El historial de ejecuciones de n8n **no** es la fuente de observabilidad: es un complemento
visual, no un sistema de medición.

---

## Campos comunes a toda etapa

| Campo | Tipo | Descripción |
|---|---|---|
| `run_id` | string | Identificador único generado en E1 (REG-002). Formato: `RUN-{CASO}-{timestamp}-{random6}` |
| `etapa` | string | `E1_validacion`, `E2_dominio`, `E3_adaptador`, `E4_salida` |
| `status` | string | `ok`, `fail`, `skip` |
| `caso` | string | `bot` o `iot` |
| `start_ts` | ISO 8601 | Timestamp de inicio de la etapa |
| `end_ts` | ISO 8601 | Timestamp de fin de la etapa |
| `duracion_ms` | number | `end_ts - start_ts` en milisegundos |

---

## Eventos por etapa

### E1 — Validación

```json
{
  "run_id": "RUN-BOT-20260417T143025-a1b2c3",
  "etapa": "E1_validacion",
  "status": "ok",
  "caso": "bot",
  "errores": [],
  "campos_validados": ["message", "user_id", "token"],
  "start_ts": "2026-04-17T14:30:25.123Z",
  "end_ts": "2026-04-17T14:30:25.128Z",
  "duracion_ms": 5
}
```

Campo adicional obligatorio: `errores: string[]` (vacío si `status === "ok"`).

### E2 — Dominio

```json
{
  "run_id": "RUN-IOT-20260417T143030-d4e5f6",
  "etapa": "E2_dominio",
  "status": "ok",
  "caso": "iot",
  "resultado_clave": "critico",
  "regla_aplicada": "R003",
  "start_ts": "2026-04-17T14:30:30.200Z",
  "end_ts": "2026-04-17T14:30:30.212Z",
  "duracion_ms": 12
}
```

Campos adicionales obligatorios: `resultado_clave` (decisión de dominio, ej. `nivel`,
`accion`) y `regla_aplicada` (ID de la regla según REC-002).

### E3 — Adaptador

```json
{
  "run_id": "RUN-IOT-20260417T143030-d4e5f6",
  "etapa": "E3_adaptador",
  "status": "ok",
  "caso": "iot",
  "idempotency_key": "sensor-42-20260417T143030",
  "registro_id": "9287",
  "reintentos": 0,
  "start_ts": "2026-04-17T14:30:30.250Z",
  "end_ts": "2026-04-17T14:30:30.295Z",
  "duracion_ms": 45
}
```

Campos adicionales obligatorios: `idempotency_key` (REG-005), `registro_id` (ID devuelto
por el sistema externo) y `reintentos` (número de reintentos efectivamente usados).

### E4 — Salida

```json
{
  "run_id": "RUN-IOT-20260417T143030-d4e5f6",
  "etapa": "E4_salida",
  "status": "ok",
  "caso": "iot",
  "notificacion_enviada": true,
  "canal": "critico",
  "nivel": "critico",
  "start_ts": "2026-04-17T14:30:30.310Z",
  "end_ts": "2026-04-17T14:30:30.340Z",
  "duracion_ms": 30,
  "duracion_total_ms": 215
}
```

Campos adicionales obligatorios: `notificacion_enviada` (bool) y `duracion_total_ms`
(diferencia entre `end_ts` de E4 y `start_ts` de E1).

Para E4 inline en el orquestador (ver ADR-002 del caso Bot), el log se emite desde un
nodo Code justo antes del `Respond to Webhook`.

---

## Métricas derivables

A partir de los campos anteriores se calculan las métricas del protocolo de evidencias:

| Métrica del anteproyecto | Derivación |
|---|---|
| Latencia por tramo | `duracion_ms` por etapa |
| Latencia extremo a extremo | `duracion_total_ms` del log de E4 |
| Tasa de fallo | count(`status=fail`) / count(total) |
| MTTD (Mean Time To Detect) | delta entre el primer `status=fail` y el reporte en dashboard |
| Eficiencia retry | sum(`reintentos`) / count(E3) |
| Cobertura `run_id` | count(eventos con `run_id`) / count(total) — debe ser 100% (REG-002) |

Ver `docs/context/proyecto-overview.md` sección "Dimensiones de medición" para los
umbrales y metas del anteproyecto.

---

## Patrón de implementación (nodo Code)

```javascript
const start = new Date().toISOString();
// ... lógica de la etapa ...
const end = new Date().toISOString();

const logEvent = {
  run_id: $input.first().json.run_id,
  etapa: 'E2_dominio',
  status: 'ok',
  caso: 'iot',
  resultado_clave: nivel,
  regla_aplicada: 'R003',
  start_ts: start,
  end_ts: end,
  duracion_ms: new Date(end) - new Date(start)
};
console.log(JSON.stringify(logEvent));

return [{ json: { ...$input.first().json, ...resultadoDominio, logEvent } }];
```

---

## Prohibiciones

- **No loguear** valores de `token`, `password`, `api_key` ni ningún campo marcado como
  sensible. El checklist DevSecOps verifica esto (ítem 2).
- **No loguear** el payload completo de entrada si contiene PII. Loguear solo los nombres
  de campos validados (`campos_validados: string[]`), no sus valores.
- **No usar** `console.error` ni `console.warn`: el formato único es `console.log` con
  JSON para uniformidad en la ingesta.

---

## Relación con AWS (FASE 8)

Los logs emitidos por `console.log` en n8n se capturan por stdout del contenedor y se
envían a CloudWatch Logs. La consulta se estructura como:

```
fields @timestamp, run_id, etapa, status, duracion_ms
| filter caso = "iot" and status = "fail"
| stats count() by etapa
```

El diseño AWS de FASE 8 incluye esta pipeline como parte de los atributos de
Operabilidad/Monitoreabilidad del modelo ISO/IEC 25010.
