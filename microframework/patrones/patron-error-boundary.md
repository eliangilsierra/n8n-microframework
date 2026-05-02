# Patrón: Error Boundary (Dead Letter) para fallos definitivos en E3

**Categoría:** Resiliencia operativa
**Etapa aplicable:** E3
**Nivel de madurez:** Recomendado para sistemas con requisitos de no pérdida de datos

---

## Problema

Cuando todos los reintentos de E3 se agotan (REG-004 configurado con maxRetries=3),
el dato no fue persistido y el flujo falla. Sin manejo adicional:

1. El cliente recibe un error 500 (o timeout si el errorWorkflow también falla).
2. El dato se pierde definitivamente — no hay rastro de qué se intentó persistir.
3. No hay mecanismo de recuperación sin intervención manual.

El patrón de retry (REG-004) resuelve fallos **transitorios**. El error boundary
resuelve el caso en que el servicio externo falla de forma **persistente** durante
el período de reintento.

---

## Solución

E3 en su rama de error final (después de agotar todos los reintentos), en lugar de
propagar el error, implementa un dead-letter: registra el dato no persistido con
`status: 'dead-letter'` para posterior replay.

### Implementación en n8n

**Nodo Code: preparar entrada dead-letter**

```javascript
const deadLetter = {
  run_id: $json.run_id,
  payload_original: $json.lectura || $json.payload,
  error_message: $json.error?.message || 'E3 falló definitivamente',
  intentos: 3,         // maxRetries configurado en REG-004
  created_at: new Date().toISOString(),
  status: 'pending'    // pending → procesado cuando el servicio vuelva
};

console.log(JSON.stringify({
  run_id: deadLetter.run_id,
  etapa: 'E3_dead_letter',
  status: 'dead-letter',
  payload_guardado: true
}));

return [{ json: deadLetter }];
```

**Nodo Postgres: insertar en tabla dead_letters**

```sql
INSERT INTO dead_letters (run_id, payload_json, error_message, created_at, status)
VALUES ($1, $2::jsonb, $3, $4, 'pending')
ON CONFLICT (run_id) DO NOTHING;
```

**Nodo Respond to Webhook: 202 Accepted al cliente**

```json
HTTP 202 Accepted
{
  "status": "accepted_pending",
  "message": "El dato fue recibido pero la persistencia está pendiente. run_id: {{run_id}}",
  "run_id": "{{run_id}}"
}
```

### Scheduled workflow de replay

Un flujo separado (cron cada 5 minutos) consulta y reintenta:

```sql
SELECT * FROM dead_letters WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10;
```

Para cada fila, reintenta la operación original. Si tiene éxito: `UPDATE dead_letters SET status = 'procesado'`.

---

## Trade-offs

| Aspecto | Beneficio | Costo |
|---------|-----------|-------|
| Pérdida de datos | El dato nunca se pierde — siempre queda en dead_letters | El cliente recibe 202 "pendiente" en lugar de un 200 de confirmación |
| Consistencia | Eventual: el dato se persistirá cuando el servicio se recupere | Ventana de inconsistencia entre recepción y persistencia |
| Operabilidad | `SELECT FROM dead_letters WHERE status='pending'` da visibilidad inmediata de backlog | Requiere tabla adicional y scheduled workflow de replay |
| Contrato HTTP | 202 indica al cliente que el dato fue recibido y está en cola | Clientes que esperan confirmación inmediata pueden interpretarlo incorrectamente |

**Cuándo NO usar este patrón:**
- Cuando el contrato HTTP del cliente requiere confirmación inmediata de persistencia (200 OK).
- Cuando la latencia del dato es más valiosa que la garantía de no pérdida.

---

## Relación con REG-003 y ADR-005 IoT

El errorWorkflow (ADR-005 IoT) y el error boundary son complementarios:
- **errorWorkflow:** captura fallos que no son recuperables desde el flujo mismo.
- **Error boundary:** captura fallos de E3 específicamente y los convierte en un
  estado recuperable (dead-letter) sin propagar el error al cliente.
