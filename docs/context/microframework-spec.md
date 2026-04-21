# Especificación del micro-framework v1.0

## Qué es el micro-framework

Un conjunto ligero de principios, reglas, patrones y plantillas que orientan el diseño y organización de soluciones LC/NC en n8n, sin imponer una arquitectura rígida ni herramientas específicas. Su propósito es traducir principios de Clean Architecture y DevSecOps al contexto visual y operativo de n8n.

No es un framework de código. No requiere instalar librerías ni modificar n8n. Es un conjunto de decisiones de diseño y convenciones que se aplican al construir flujos.

---

## Metamodelo por etapas

Todo flujo que implemente el micro-framework se organiza en cuatro etapas lógicas. Cada etapa corresponde a un subflujo invocado mediante `Execute Workflow`.

### E1 — Validación de entradas

**Responsabilidad:** Verificar que el payload de entrada cumple el contrato definido antes de pasar datos a la lógica de negocio.

**Reglas obligatorias:**
- Validar presencia de todos los campos requeridos
- Validar tipos de datos
- Validar rangos cuando aplique (numéricos, longitud de string)
- Generar `run_id` único al inicio de cada ejecución
- Capturar `start_ts` al inicio
- Emitir log estructurado con resultado de validación
- Retornar `{ valido: boolean, errores: string[], run_id, start_ts, payload/lectura }`
- Si `valido === false`, el orquestador debe responder con 400 o 422 sin continuar

**Reglas recomendadas:**
- Normalizar datos de entrada en esta etapa (redondeo, lowercase, trim)
- Incluir en el log el número de errores encontrados, no solo el booleano

**Anti-patrón:** Mezclar validación con lógica de negocio en el mismo nodo.

### E2 — Lógica de dominio

**Responsabilidad:** Aplicar las reglas de negocio puras. No sabe nada de bases de datos, APIs externas ni canales de notificación.

**Reglas obligatorias:**
- Centralizar todas las reglas de negocio en constantes definidas al inicio del nodo Code (no hardcodeadas en condiciones IF dispersas)
- No hacer llamadas HTTP ni operaciones de base de datos en esta etapa
- Emitir log estructurado con resultado del análisis y regla aplicada
- Retornar resultado enriquecido con decisiones de dominio

**Reglas recomendadas:**
- Documentar cada regla con un identificador (R001, R002, etc.)
- Incluir en el output el identificador de la regla aplicada para trazabilidad

**Anti-patrón:** Hacer una llamada HTTP a un servicio externo dentro de E2 para "enriquecer" los datos antes de tomar la decisión de negocio.

### E3 — Adaptadores de integración

**Responsabilidad:** Traducir el resultado del dominio al formato requerido por el sistema externo y ejecutar la integración.

**Reglas obligatorias:**
- Generar clave de idempotencia antes de cada escritura: `{run_id}-{operacion}` o `{id_negocio}-{timestamp}`
- Usar credenciales de n8n, nunca valores hardcodeados en el nodo
- Habilitar retry nativo en los nodos HTTP Request (mínimo 2 reintentos, 1000ms de espera)
- Emitir log estructurado con duración del tramo, clave de idempotencia y resultado
- No contener lógica de negocio: solo transformación de formato y llamada al sistema externo

**Reglas recomendadas:**
- Incluir el header `Idempotency-Key` en las llamadas HTTP cuando el servicio externo lo soporte
- Capturar el ID del registro creado y propagarlo en el output

**Anti-patrón:** Calcular umbrales o tomar decisiones de clasificación dentro del adaptador.

### E4 — Salida controlada

**Responsabilidad:** Producir la respuesta o notificación final, routing por canal cuando aplique.

**Reglas obligatorias:**
- Estructurar la respuesta según el contrato de salida documentado
- Incluir `run_id` en toda respuesta de salida
- Usar routing basado en el nivel o resultado determinado en E2, no recalcular en E4
- Habilitar retry en notificaciones externas

**Reglas recomendadas:**
- Emitir log de cierre con duración total de la ejecución (`end_ts - start_ts`)
- Para notificaciones, logear si fue enviada o si se hizo skip (nivel normal)

---

## Reglas obligatorias del micro-framework

Las siguientes reglas aplican a todo flujo que adopte el micro-framework. Cada una tiene un criterio de verificación binario (cumple / no cumple).

| ID | Regla | Criterio de verificación |
|----|-------|--------------------------|
| REG-001 | Ningún flujo tiene credenciales hardcodeadas en nodos | El JSON exportado del flujo no contiene tokens, API keys ni passwords como valores literales |
| REG-002 | Todo flujo tiene `run_id` desde E1 que se propaga a todos los subflujos | El campo `run_id` aparece en el output de cada subflujo y en cada entrada del log |
| REG-003 | Todo flujo orquestador tiene configurado `errorWorkflow` en sus settings | El campo `settings.errorWorkflow` del JSON no está vacío |
| REG-004 | Las integraciones externas tienen retry habilitado | El nodo HTTP Request tiene `options.retry.enabled: true` |
| REG-005 | Las escrituras en base de datos incluyen control de idempotencia | El query de inserción incluye `ON CONFLICT ... DO NOTHING` o equivalente |
| REG-006 | Cada etapa emite log estructurado en JSON | El nodo Code de cada etapa incluye `console.log(JSON.stringify({...}))` con los campos mínimos |
| REG-007 | La lógica de negocio está aislada en E2 | El subflujo E2 no contiene nodos HTTP Request ni nodos de base de datos |
| REG-008 | Las integraciones externas están en E3 | Los nodos HTTP Request y de base de datos están únicamente en E3 y E4 |
| REG-009 | El flujo orquestador responde con HTTP status codes apropiados | 200 para éxito, 400/422 para entrada inválida, 401 para autenticación fallida |
| REG-010 | Todo flujo tiene al menos un ADR documentado | La carpeta `adr/` del caso contiene al menos un archivo ADR versionado |

## Reglas recomendadas del micro-framework

| ID | Regla | Beneficio |
|----|-------|-----------|
| REC-001 | Normalizar datos de entrada en E1 (redondeo, formato) | Reduce inconsistencias en E2 y E3 |
| REC-002 | Documentar reglas de negocio con identificadores en E2 | Facilita trazabilidad en ATAM y ADR |
| REC-003 | Incluir `Idempotency-Key` header en HTTP Request | Soporte nativo si el servicio externo lo implementa |
| REC-004 | Capturar `start_ts` y `end_ts` por etapa para medir latencia | Permite calcular latencia por tramo sin herramientas externas |
| REC-005 | Incluir `location` o contexto del sensor/usuario en los logs | Facilita diagnóstico sin abrir el historial de n8n |
| REC-006 | Usar `saveDataSuccessExecution: "all"` en entornos de evaluación | Permite revisar ejecuciones históricas durante la medición |

---

## Checklist de arquitectura (ítems binarios)

Aplicar antes de versionar cualquier flujo to-be:

```
[ ] REG-001: JSON exportado sin credenciales hardcodeadas
[ ] REG-002: run_id presente en output de todos los subflujos
[ ] REG-003: errorWorkflow configurado en settings del orquestador
[ ] REG-004: retry habilitado en todos los nodos HTTP Request
[ ] REG-005: escrituras con control de idempotencia
[ ] REG-006: log estructurado JSON en cada etapa
[ ] REG-007: E2 sin nodos HTTP ni de base de datos
[ ] REG-008: integraciones solo en E3 y E4
[ ] REG-009: status codes HTTP apropiados en respuestas
[ ] REG-010: al menos un ADR documentado en carpeta adr/
```

## Checklist DevSecOps (ítems binarios)

```
[ ] No hay API keys, tokens ni passwords en el JSON del flujo
[ ] No hay datos sensibles en los campos de log (sin loggear tokens de usuarios)
[ ] Las credenciales de integraciones externas están creadas en n8n Credentials
[ ] El archivo .env real no está trackeado en Git (.gitignore incluye .env)
[ ] El .env.example está actualizado con todas las variables necesarias
[ ] El webhook de entrada valida autenticación antes de procesar datos
[ ] Los endpoints de integración usan HTTPS en entornos productivos
[ ] El flujo de error no expone detalles internos del sistema en su respuesta al cliente
```

---

## Patrones documentados

### Patrón: Retry con backoff en integraciones

**Problema:** Los servicios externos fallan transitoriamente por timeout, rate limit o inestabilidad de red.

**Solución:** Habilitar el retry nativo del nodo HTTP Request en n8n con espera entre intentos:

```json
"options": {
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenTries": 2000
  }
}
```

**Trade-off:** Aumenta la latencia total en caso de fallo, pero garantiza que errores transitorios no resulten en tickets o lecturas perdidas.

### Patrón: Idempotencia con clave compuesta

**Problema:** Los reintentos automáticos pueden crear registros duplicados en la base de datos.

**Solución:** Generar una clave de idempotencia antes de cada escritura y usar `ON CONFLICT DO NOTHING`:

```javascript
const idempotency_key = `${run_id}-ticket`;
// o para IoT:
const idempotency_key = `${sensor_id}-${timestamp}`;
```

```sql
INSERT INTO tabla (idempotency_key, ...) 
VALUES ('...', ...) 
ON CONFLICT (idempotency_key) DO NOTHING 
RETURNING id;
```

**Trade-off:** Requiere un índice UNIQUE en la columna `idempotency_key`, lo que añade overhead de escritura.

### Patrón: Log estructurado por etapa

**Problema:** El historial de ejecuciones de n8n no es consultable programáticamente y no permite calcular latencias por tramo.

**Solución:** Emitir un `console.log` con JSON en cada nodo Code de cada etapa:

```javascript
console.log(JSON.stringify({
  run_id,
  etapa: 'E2_dominio_iot',
  status: 'ok',
  nivel,
  e2_start,
  e2_end,
  duracion_ms: new Date(e2_end) - new Date(e2_start)
}));
```

**Trade-off:** Aumenta levemente el tiempo de ejecución por el overhead de serialización. Completamente despreciable en comparación con el beneficio de diagnóstico.

### Patrón: Routing por nivel en E4

**Problema:** Las notificaciones deben diferenciarse por severidad (crítico vs warning) con diferentes canales y urgencias.

**Solución:** Usar el nivel determinado en E2 para routing en E4 con nodos IF encadenados:

```
IF analisis.requiereNotificacion === true
  │
  ├── true → IF analisis.nivel === 'critico'
  │               │
  │               ├── true  → HTTP POST /notificaciones/critico (retry 3)
  │               └── false → HTTP POST /notificaciones/warning (retry 2)
  │
  └── false → Log skip (nivel normal)
```

**Trade-off:** Añade latencia por los nodos IF adicionales. Despreciable frente al beneficio de canales diferenciados.

---

## Anti-patrones documentados

| Anti-patrón | Descripción | Consecuencia |
|-------------|-------------|-------------|
| Flujo monolítico | Toda la lógica en un solo flujo sin subflujos | Impacto de cambio alto: cualquier modificación puede afectar todo el flujo |
| Credenciales en nodos | API keys o tokens como valores literales en configuración de nodos | Exposición de secretos en el JSON exportado del flujo |
| Validación ausente | Procesar el payload de entrada sin verificar campos obligatorios | Fallos en etapas posteriores con mensajes de error ambiguos |
| Lógica en adaptadores | Reglas de negocio o cálculos dentro del adaptador de integración | Duplicación de lógica, dificulta modificar reglas sin tocar integraciones |
| Sin idempotencia | Escrituras sin control de duplicados | Los reintentos crean registros duplicados silenciosamente |
| Sin log estructurado | Solo el historial de n8n como fuente de diagnóstico | Imposibilidad de calcular latencias por tramo o correlacionar eventos |
| Sin flujo de error | No configurar `errorWorkflow` en el orquestador | Los fallos no se registran ni notifican, son invisibles operativamente |

---

## Guía de observabilidad mínima

Todo flujo del micro-framework debe registrar al menos los siguientes eventos:

### Inicio de ejecución (E1)
```json
{ "run_id": "...", "etapa": "E1_validacion", "status": "ok|fail", "errores": [], "start_ts": "..." }
```

### Resultado de dominio (E2)
```json
{ "run_id": "...", "etapa": "E2_dominio", "status": "ok", "resultado_clave": "...", "regla_aplicada": "R001", "e2_start": "...", "e2_end": "...", "duracion_ms": 12 }
```

### Resultado de persistencia (E3)
```json
{ "run_id": "...", "etapa": "E3_adaptador", "status": "ok", "idempotency_key": "...", "registro_id": "...", "e3_start": "...", "e3_end": "...", "duracion_ms": 45 }
```

### Resultado de notificación (E4)
```json
{ "run_id": "...", "etapa": "E4_notificacion", "status": "ok|skip", "notificacion_enviada": true, "nivel": "critico", "e4_end": "..." }
```
