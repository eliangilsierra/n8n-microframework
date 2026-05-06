# ADR-MF-003 — Log estructurado JSON por etapa (REG-006)

**Nivel:** Micro-framework (aplica a todas las etapas E1–E4)
**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Operabilidad / Monitoreabilidad (ISO/IEC 25010)
**Reglas relacionadas:** REG-006, REC-004

---

## Contexto

El historial de ejecuciones de n8n tiene tres limitaciones críticas para observabilidad:

1. **No es consultable programáticamente:** no existe API para listar ejecuciones o
   filtrar por campo. La consulta requiere abrir la UI de n8n manualmente.
2. **No permite calcular latencias por tramo:** el historial muestra la duración total,
   pero no la duración de cada nodo con resolución de milisegundos correlacionada por
   `run_id`.
3. **No es persistente de forma garantizada:** el volumen de n8n puede perderse en
   un reinicio del entorno. Los datos de medición no deben depender del historial.

El único mecanismo de observabilidad externo al historial de n8n y disponible sin
dependencias adicionales es **stdout del contenedor**, accesible con `docker compose logs n8n`.

El micro-framework debe definir qué emitir, cuándo y con qué campos mínimos para que
los logs en stdout sean suficientes para diagnosticar fallos y calcular métricas de
latencia sin herramientas externas.

---

## Decisión

Cada etapa (E1, E2, E3, E4) emite exactamente un `console.log(JSON.stringify({...}))`
al inicio o al final de su ejecución, con los campos mínimos definidos en
`microframework/guia-observabilidad.md`.

### Formato por etapa

**E1 — Validación:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E1_validacion',
  status: valido ? 'ok' : 'fail',
  errores: errores,
  n_errores: errores.length,
  start_ts
}));
```

**E2 — Dominio:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E2_dominio',
  status: 'ok',
  resultado_clave: analisis.nivel || analisis.categoria,
  regla_aplicada: analisis.regla_id,
  e2_start,
  e2_end,
  duracion_ms: new Date(e2_end) - new Date(e2_start)
}));
```

**E3 — Adaptadores:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E3_adaptador',
  status: 'ok',
  idempotency_key,
  registro_id: resultado.id,
  e3_start,
  e3_end,
  duracion_ms: new Date(e3_end) - new Date(e3_start)
}));
```

**E4 — Salida:**
```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E4_notificacion',
  status: notificacion_enviada ? 'ok' : 'skip',
  notificacion_enviada,
  nivel: analisis.nivel,
  e4_end,
  duracion_total_ms: new Date(e4_end) - new Date(start_ts)
}));
```

### Consulta operacional

```bash
# Todos los logs de una ejecución específica:
docker compose logs n8n | grep '"run_id":"RUN-BOT-..."'

# Todos los fallos en E1:
docker compose logs n8n | grep '"etapa":"E1_validacion"' | grep '"status":"fail"'

# Latencia de E3 en los últimos 100 logs:
docker compose logs n8n --tail=200 | grep '"etapa":"E3_adaptador"' | \
  node -e "const lines=require('fs').readFileSync('/dev/stdin','utf8').split('\n').filter(Boolean); \
           lines.forEach(l => { try { const d=JSON.parse(l.split('INFO')[1]||l); \
           if(d.duracion_ms) console.log(d.duracion_ms); } catch(e){} })"
```

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| APM externo (OpenTelemetry, Datadog) | Dependencia de infraestructura fuera del alcance del proyecto |
| n8n built-in execution data | Propietario, no exportable programáticamente, no persistente |
| `console.error()` para fallos | Mezclaría el stream con errores de Node.js internos de n8n; `console.log` unifica todo en stdout y facilita el grep |
| Logging a base de datos (tabla `logs`) | Requiere nodo Postgres adicional en cada etapa — overhead estructural; stdout es suficiente para el alcance del proyecto |

---

## Consecuencias

**Positivas:**
- Latencias por tramo calculables con `grep` + `jq` o con el script `analizar_runlogs.py`.
- MTTD (Mean Time To Detect) calculable: el protocolo en `docs/protocolo-mttd.md`
  usa únicamente `docker compose logs n8n` para diagnosticar fallos.
- El campo `run_id` en cada log permite correlacionar todas las etapas de una ejecución
  sin abrir el historial de n8n.
- Sin dependencias externas: funciona con Docker + n8n estándar.

**Negativas:**
- Overhead de serialización JSON por ejecución (~0.5–1ms por `JSON.stringify`).
  Completamente despreciable frente al beneficio de diagnóstico.
- Los logs en stdout no son persistentes si el contenedor se detiene sin persistencia
  de logs. Para el alcance del proyecto (laboratorio local), esto es aceptable.
- El volumen de logs puede crecer rápidamente en entornos con alto throughput.
  Mitigación: rotar logs con `docker compose logs --since 1h` o configurar log driver.

---

## Criterio de verificación (REG-006)

```bash
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be
# REG-006: ✓ CUMPLE — si cada subflujo tiene console.log(JSON.stringify(...)) con campos mínimos
```

El script verifica que el `jsCode` de cada nodo Code en cada subflujo contenga
al menos un `console.log(JSON.stringify(` con los campos `run_id` y `etapa`.
