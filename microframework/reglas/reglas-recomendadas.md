# Reglas recomendadas del micro-framework

Estas reglas no son obligatorias pero mejoran la calidad operativa y la trazabilidad.
Su cumplimiento se evalúa en el checklist DevSecOps y contribuye a la puntuación ATAM.

---

| ID | Regla | Beneficio |
|----|-------|-----------|
| REC-001 | Normalizar datos de entrada en E1 (redondeo, formato de strings) | Reduce inconsistencias en E2 y E3; evita duplicados por variantes de formato |
| REC-002 | Documentar reglas de negocio con identificadores en E2 (R001, R002...) | Facilita trazabilidad en ATAM y ADR; permite citar reglas específicas en evidencia |
| REC-003 | Incluir `Idempotency-Key` header en HTTP Request cuando el servicio lo soporte | Soporte nativo end-to-end si el servicio externo implementa idempotencia |
| REC-004 | Capturar `start_ts` y `end_ts` por etapa para medir latencia de tramo | Permite calcular latencia por tramo sin herramientas externas |
| REC-005 | Incluir `location` o contexto del sensor/usuario en los logs | Facilita diagnóstico sin abrir el historial de n8n |
| REC-006 | Usar `saveDataSuccessExecution: "all"` en settings del orquestador durante evaluación | Permite revisar ejecuciones históricas completas durante la fase de medición |

---

## Detalle por regla

### REC-001 — Normalizar en E1

Antes de pasar datos a E2, normalizar:
- Números: `Math.round(valor * 10) / 10` para temperatura y humedad
- Strings: `.trim().toLowerCase()` cuando aplique
- Timestamps: convertir a ISO 8601 si viene en otro formato

**Ejemplo en bot:** Si `message` viene con espacios al inicio/fin, hacer `.trim()` en E1
antes de enviar a E2 para evitar que las reglas de clasificación fallen.

---

### REC-002 — Identificadores de regla en E2

Definir reglas como objetos con `id`:

```javascript
const REGLAS = [
  { id: 'R001', condicion: (m) => m.includes('urgente'), categoria: 'incidente', prioridad: 'alta' },
  { id: 'R002', condicion: (m) => m.includes('factura'), categoria: 'facturacion', prioridad: 'media' },
  // ...
  { id: 'DEFAULT', condicion: () => true, categoria: 'general', prioridad: 'baja' }
];
```

Incluir `regla_aplicada: regla.id` en el output y en el log de E2.

---

### REC-003 — Header Idempotency-Key en HTTP

En el nodo HTTP Request de E3, agregar el header:

```
Idempotency-Key: {{ $json.idempotency_key }}
```

Solo tiene efecto si el servicio externo lo implementa. No tiene costo si no lo implementa.

---

### REC-004 — Latencia por tramo

Capturar timestamps al inicio y fin de cada etapa:

```javascript
const e2_start = new Date().toISOString();
// ... lógica ...
const e2_end = new Date().toISOString();
const duracion_ms = new Date(e2_end) - new Date(e2_start);
```

Propagar `e2_start`, `e2_end`, `duracion_ms` en el output para alimentar el run-log.

---

### REC-005 — Contexto en logs

Agregar campos de contexto al log estructurado:

```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E2_dominio_iot',
  status: 'ok',
  sensor_id: lectura.sensor_id,    // ← contexto
  location: lectura.location,       // ← contexto
  nivel,
  duracion_ms
}));
```

---

### REC-006 — saveDataSuccessExecution durante medición

En el JSON del flujo orquestador, configurar:

```json
"settings": {
  "saveDataSuccessExecution": "all",
  "saveManualExecutions": true
}
```

Revertir a `"none"` en entornos productivos para no saturar la base de datos de n8n.
