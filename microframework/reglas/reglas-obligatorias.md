# Reglas obligatorias del micro-framework

Todo flujo que adopte el micro-framework debe cumplir estas 10 reglas. Cada una tiene
criterio de verificación binario: **cumple / no cumple**.

Usar el `checklist-arquitectura.md` para verificar antes de versionar cualquier flujo to-be.

---

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

---

## Detalle por regla

### REG-001 — Sin credenciales hardcodeadas

**Por qué:** Las credenciales en el JSON exportado quedan expuestas en el repositorio Git,
comprometiendo la seguridad de sistemas externos.

**Cómo verificar:** Buscar en el JSON exportado las cadenas: `password`, `token`, `api_key`,
`Bearer`, `secret`. Ninguna debe tener valor literal; deben referenciar credenciales de n8n.

**En n8n:** Usar el gestor de Credentials de n8n. El JSON exportado contendrá solo el nombre
de la credencial, no el valor.

---

### REG-002 — run_id propagado

**Por qué:** El `run_id` permite correlacionar todos los logs de una ejecución sin depender
del historial interno de n8n.

**Cómo verificar:** Revisar el output JSON de cada subflujo. El campo `run_id` debe estar
presente con el mismo valor en todos.

**Formato:** `RUN-BOT-{timestamp}-{random6}` o `RUN-IOT-{timestamp}-{random6}`

**Nota sobre as-is:** Este formato aplica al to-be. Los run-logs del as-is usan un
formato simplificado `{caso}-{version}-{set}-{index}-{hash}` generado por el harness
de medición (`automatizacion/run_corridas.py`) porque los flujos as-is violan REG-002
por diseño (no propagan `run_id` internamente). Ver `medicion/protocolo-evidencias.md` §5.

---

### REG-003 — errorWorkflow configurado

**Por qué:** Sin un flujo de error, los fallos son invisibles operativamente y no se registran.

**Cómo verificar:** En el JSON del orquestador, el campo `settings.errorWorkflow` no debe
ser una cadena vacía.

---

### REG-004 — Retry habilitado en HTTP

**Por qué:** Los servicios externos fallan transitoriamente. Sin retry, un timeout único
resulta en datos o tickets perdidos.

**Configuración mínima en el nodo HTTP Request:**
```json
"options": {
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "waitBetweenTries": 2000
  }
}
```

---

### REG-005 — Idempotencia en escrituras

**Por qué:** Los reintentos crean registros duplicados silenciosamente si no hay control
de idempotencia.

**SQL requerido:**
```sql
INSERT INTO tabla (idempotency_key, ...)
VALUES ($1, ...)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
```

---

### REG-006 — Log estructurado JSON por etapa

**Por qué:** El historial de n8n no es consultable programáticamente. Los logs JSON
permiten calcular latencias y correlacionar eventos.

**Campos mínimos por etapa:**
- E1: `run_id`, `etapa`, `status`, `errores`, `start_ts`
- E2: `run_id`, `etapa`, `status`, `resultado_clave`, `duracion_ms`
- E3: `run_id`, `etapa`, `status`, `idempotency_key`, `duracion_ms`
- E4: `run_id`, `etapa`, `status`, `notificacion_enviada`

---

### REG-007 — Lógica de negocio solo en E2

**Por qué:** Separar dominio de integraciones permite modificar reglas de negocio sin tocar
adaptadores, y probar E2 de forma aislada.

**Prohibido en E2:** nodos HTTP Request, nodos Postgres, nodos de base de datos de cualquier tipo.

---

### REG-008 — Integraciones solo en E3/E4

**Por qué:** Centralizar integraciones facilita reemplazar servicios externos sin modificar
la lógica de negocio.

**E3:** Adaptadores de persistencia y APIs externas.
**E4:** Canales de notificación y respuesta HTTP al cliente.

---

### REG-009 — HTTP status codes apropiados

**Por qué:** Los status codes incorrectos dificultan el diagnóstico y rompen el contrato
con el cliente del webhook.

| Situación | Status code |
|-----------|-------------|
| Éxito | 200 OK |
| Entrada inválida (campos faltantes, tipos incorrectos) | 400 Bad Request |
| Entrada semánticamente inválida (rangos, contratos) | 422 Unprocessable Entity |
| Token de autenticación inválido | 401 Unauthorized |
| Error interno no controlado | 500 Internal Server Error |

---

### REG-010 — Al menos un ADR por caso

**Por qué:** Las decisiones arquitectónicas sin documentar se pierden y dificultan la
evaluación ATAM.

**Dónde:** `casos-de-estudio/{caso}/adr/ADR-001-{nombre}.md`

**Plantilla:** Ver `microframework/plantillas/ADR-plantilla.md`

---

## Mapeo REG-* → ISO/IEC 25010

Cada regla contribuye a uno o más atributos del modelo de calidad ISO/IEC 25010. Este
mapeo alimenta la evaluación ATAM (FASE 7) y la matriz de trazabilidad de cada caso.

| Regla | Característica ISO 25010 | Subcaracterística | Justificación |
|---|---|---|---|
| REG-001 | Seguridad | Confidencialidad | Evita exposición de secretos en el JSON versionado |
| REG-002 | Mantenibilidad | Analizabilidad | `run_id` permite correlacionar logs sin depender del historial interno de n8n |
| REG-003 | Fiabilidad | Tolerancia a fallos | `errorWorkflow` captura fallos y los hace visibles operativamente |
| REG-004 | Fiabilidad | Recuperabilidad | Retry absorbe fallos transitorios de servicios externos |
| REG-005 | Fiabilidad | Madurez | Idempotencia evita duplicados en reintentos |
| REG-006 | Operabilidad | Monitoreabilidad | Log estructurado JSON permite calcular MTTD y latencias por tramo |
| REG-007 | Mantenibilidad | Modularidad | Aislar dominio reduce impacto de cambio |
| REG-008 | Mantenibilidad | Modularidad / Reusabilidad | Centralizar integraciones permite reemplazar servicios sin tocar dominio |
| REG-009 | Adecuación funcional | Corrección | Status codes correctos cumplen el contrato HTTP con el cliente |
| REG-010 | Mantenibilidad | Analizabilidad | ADR documenta decisiones para auditoría y ATAM |

Referencia cruzada: ver `../../medicion/proyecto-overview.md` sección "Mapeo a ISO/IEC 25010"
para la vinculación con las métricas del anteproyecto.
