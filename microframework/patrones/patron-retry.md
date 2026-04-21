# Patrón: Retry con backoff en integraciones

**Categoría:** Resiliencia
**Aplica a:** E3 — Adaptadores de integración, E4 — Salida controlada
**Regla relacionada:** REG-004

---

## Problema

Los servicios externos fallan transitoriamente por timeout, rate limit o inestabilidad de red.
Sin retry, un único fallo resulta en tickets o lecturas de sensor perdidos sin posibilidad de
recuperación automática.

---

## Solución

Habilitar el retry nativo del nodo HTTP Request en n8n con espera entre intentos:

```json
"options": {
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenTries": 2000
  }
}
```

**Configuración recomendada por tipo de operación:**

| Operación | maxRetries | waitBetweenTries |
|-----------|-----------|-----------------|
| Escritura de ticket (crítica) | 3 | 2000 ms |
| Notificación warning | 2 | 1000 ms |
| Notificación crítica | 3 | 500 ms |

---

## Implementación en n8n

1. Seleccionar el nodo HTTP Request en el subflujo E3 o E4
2. Ir a la pestaña **Options**
3. Activar el toggle **Retry On Fail**
4. Configurar **Max Tries** y **Wait Between Tries**

El retry solo se activa cuando el servicio responde con un status de error (4xx, 5xx) o
cuando la conexión se pierde. No se activa en errores de validación de datos.

---

## Trade-off

**Beneficio:** Errores transitorios no resultan en pérdida de datos. La operación se reintenta
automáticamente sin intervención manual.

**Costo:** La latencia total de la ejecución aumenta en caso de fallo. Con 3 reintentos y
2000 ms de espera, el peor caso es +6 segundos.

**Límite:** El retry no resuelve fallos permanentes. Si el servicio externo está caído, los
3 intentos fallarán y el flujo pasará al `errorWorkflow`.

---

## Combinación con idempotencia

El retry puede crear registros duplicados si el servicio externo procesa la primera solicitud
pero falla al enviar la respuesta. Para prevenirlo, combinar con el patrón de idempotencia:

1. Generar `idempotency_key` antes del primer intento (en nodo Code previo al HTTP Request)
2. Incluir la clave en el body o header de la solicitud
3. El servicio externo usa la clave para ignorar duplicados

Ver `patron-idempotencia.md` para el detalle completo.
