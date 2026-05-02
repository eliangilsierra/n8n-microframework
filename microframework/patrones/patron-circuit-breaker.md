# Patrón: Circuit Breaker en integraciones externas

**Categoría:** Resiliencia operativa
**Etapa aplicable:** E3, E4
**Nivel de madurez:** Recomendado (no obligatorio en el micro-framework v1.0)

---

## Problema

Después de N fallos consecutivos a un servicio externo (timeout, 503, 500), el
patrón de retry (REG-004) sigue intentando la llamada. Esto tiene dos efectos negativos:

1. **Saturación del servicio caído:** cada reintento es una solicitud adicional a un
   servicio que ya está sobrecargado o en mantenimiento.
2. **Latencia total acumulada:** si el servicio tarda 30 segundos en timeout y hay
   3 reintentos, la latencia total del flujo es 90+ segundos, lo que puede hacer que
   el webhook del cliente también timeoute.

El patrón de retry (REG-004) es necesario para fallos transitorios (red inestable,
pico de carga momentáneo). El circuit breaker complementa el retry para fallos
**estructurales** (servicio caído, mantenimiento planificado).

---

## Solución

Mantener un contador de fallos consecutivos en `$getWorkflowStaticData('global')`.
Si `fallos_consecutivos > UMBRAL_CB`, el circuito se "abre" y las llamadas al
servicio se saltan inmediatamente (sin reintentos), retornando una respuesta
de "circuito abierto" al cliente.

### Estados del circuito

```
Cerrado (CLOSED)     → operación normal, errores se cuentan
      ↓ umbral superado
Abierto (OPEN)       → llamadas salteadas, respuesta inmediata de fallo
      ↓ después de RESET_MS
Semi-abierto (HALF)  → permite una llamada de prueba
      ↓ prueba exitosa → CLOSED
      ↓ prueba fallida → OPEN
```

### Implementación en n8n (Code node antes del HTTP Request)

```javascript
const CB_UMBRAL = 5;        // fallos consecutivos para abrir
const CB_RESET_MS = 60000;  // 60 segundos en estado abierto antes de semi-abrir

const state = $getWorkflowStaticData('global');
if (!state.cb) state.cb = { estado: 'CLOSED', fallos: 0, abierto_desde: null };

const ahora = Date.now();

// Verificar si debe pasar de OPEN a HALF
if (state.cb.estado === 'OPEN') {
  if (ahora - state.cb.abierto_desde > CB_RESET_MS) {
    state.cb.estado = 'HALF';
  } else {
    // Circuito abierto — saltear llamada
    return [{ json: {
      cb_estado: 'OPEN',
      mensaje: 'Servicio temporalmente no disponible (circuit breaker)',
      run_id: $json.run_id
    }}];
  }
}

// Estado CLOSED o HALF — continuar con la llamada normal
return [{ json: { ...($json), _cb_intentar: true } }];
```

### Code node de callback (después del HTTP Request, en rama de error)

```javascript
const state = $getWorkflowStaticData('global');
state.cb.fallos = (state.cb.fallos || 0) + 1;

if (state.cb.fallos >= CB_UMBRAL || state.cb.estado === 'HALF') {
  state.cb.estado = 'OPEN';
  state.cb.abierto_desde = Date.now();
  console.log(JSON.stringify({
    run_id: $json.run_id,
    etapa: 'E3_circuit_breaker',
    status: 'circuit_opened',
    fallos: state.cb.fallos
  }));
}
```

### Code node de callback en rama de éxito

```javascript
const state = $getWorkflowStaticData('global');
state.cb.fallos = 0;
state.cb.estado = 'CLOSED';
state.cb.abierto_desde = null;
```

---

## Trade-offs

| Aspecto | Beneficio | Costo |
|---------|-----------|-------|
| Latencia | Elimina latencia de reintentos cuando el servicio está caído | Introduce latencia mínima (~1ms) por consulta del estado en cada llamada |
| Resiliencia | Protege el servicio externo de ser saturado durante recuperación | Fallos positivos: el circuito puede abrirse por un pico momentáneo que ya pasó |
| Estado | Reduce carga de red en fallos estructurales | Usa `$getWorkflowStaticData` — estado in-memory volátil (se pierde al reiniciar n8n) |

**Nota sobre `$getWorkflowStaticData`:** Este patrón usa el mismo mecanismo que
el antipatrón REG-002 (rate-limiter in-memory). La diferencia semántica es importante:
el circuit breaker es estado de **infraestructura** (¿el servicio externo está disponible?)
— no estado de dominio ni de negocio. Su pérdida al reiniciar n8n es aceptable porque
el circuito simplemente vuelve a estado "cerrado" (operación normal), sin pérdida de datos.

---

## Cuándo usar

- Integraciones con servicios externos que tienen SLA < 99.9% o tiempos de maintenance.
- Cuando el timeout del HTTP Request es > 10 segundos y el flujo tiene SLA de respuesta corto.
- En entornos productivos con tráfico sostenido (no aplica al entorno de laboratorio del proyecto).

---

## Referencias

- Fowler, M. (2014). *CircuitBreaker*. martinfowler.com.
- Newman, S. (2015). *Building Microservices*. O'Reilly. Cap. 11.
- ADR-MF-002 (REG-003 errorWorkflow) — complementa el circuit breaker para notificación de fallos.
