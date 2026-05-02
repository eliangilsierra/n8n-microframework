# ADR-MF-002 — Diseño del errorWorkflow obligatorio (REG-003)

**Nivel:** Micro-framework (aplica a todos los flujos orquestadores)
**Fecha:** 2026-05-01
**Estado:** Aceptado
**Atributo de calidad:** Fiabilidad / Tolerancia a fallos (ISO/IEC 25010)
**Regla relacionada:** REG-003

---

## Contexto

Sin `errorWorkflow` configurado en `settings` del flujo orquestador, n8n marca la
ejecución como fallida sin ejecutar ninguna acción adicional. El fallo queda registrado
únicamente en el historial interno de n8n, que:

1. No es consultable programáticamente (no expone API de historial).
2. No emite alertas ni notificaciones.
3. No es persistente si el volumen de n8n se pierde.

El resultado práctico es que los fallos en producción son **operativamente invisibles**:
el sistema externo que envió la solicitud recibe un timeout o un error 5xx, pero el
equipo no sabe que ocurrió hasta que alguien revisa manualmente la UI de n8n.

El micro-framework debe definir qué debe hacer el errorWorkflow para que REG-003
tenga valor operativo real, no solo cumplimiento formal de la regla.

---

## Decisión

Cada flujo orquestador debe configurar un errorWorkflow dedicado que implemente
las siguientes tres acciones en orden:

### Acción 1 — Extraer contexto del error

```javascript
const errorData = {
  run_id: $json.run_id || 'UNKNOWN',
  node_name: $json.execution?.lastNodeExecuted || 'UNKNOWN',
  error_message: $json.error?.message || 'No message',
  error_type: $json.error?.name || 'UnknownError',
  workflow_id: $json.workflow?.id,
  etapa: 'ERROR_HANDLER',
  status: 'error',
  ts: new Date().toISOString()
};
```

### Acción 2 — Emitir log estructurado JSON

```javascript
console.log(JSON.stringify(errorData));
```

Este log aparece en el stdout del contenedor n8n y es consultable con:
```bash
docker compose logs n8n | grep '"status":"error"'
```

### Acción 3 — Notificar al endpoint de errores del mock

```
POST /api/errors
Content-Type: application/json
Body: { run_id, node_name, error_message, error_type, ts }
```

El flujo de error siempre responde con status 500 al cliente original para no
enmascarar el fallo.

### Configuración obligatoria

En el JSON del orquestador:
```json
"settings": {
  "errorWorkflow": "ID_DEL_ERROR_WORKFLOW"
}
```

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|-------------|-----------------|
| Try/Catch en nodos Code del orquestador | No captura errores en nodos no-Code (HTTP Request, Postgres) que fallen por timeout o error de red |
| No errorWorkflow — depender del historial de n8n | Los fallos son invisibles operativamente; no satisface REG-003 con valor real |
| errorWorkflow vacío (solo cumple la regla formalmente) | Cumplimiento formal sin valor operativo — se considera antipatrón en este micro-framework |
| APM externo (Datadog, New Relic) | Dependencia fuera del alcance declarado del proyecto |

---

## Consecuencias

**Positivas:**
- Todos los fallos del orquestador generan un registro en el mock + un log JSON.
- El MTTD (Mean Time To Detect) para fallos del orquestador se reduce a segundos
  (tiempo de leer el log con `docker compose logs n8n | grep "status:error"`).
- El `run_id` en el log de error permite correlacionar con los logs de etapas
  exitosas que precedieron al fallo.

**Negativas:**
- Requiere crear y mantener un flujo de error por orquestador (2 flujos adicionales:
  `bot-error-handler` e `iot-error-handler`).
- Si el propio errorWorkflow falla (p.ej., mock no disponible), el fallo queda sin
  notificar. Mitigación: el log JSON siempre se emite antes de la llamada HTTP al mock.

---

## Criterio de verificación (REG-003)

```bash
# En el JSON exportado del orquestador:
cat casos-de-estudio/bot/to-be/bot-to-be-orquestador.json | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
           console.log(d.settings?.errorWorkflow ? 'REG-003: CUMPLE' : 'REG-003: FALLA')"
```

El campo `settings.errorWorkflow` debe ser un string no vacío.
