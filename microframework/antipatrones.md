# Anti-patrones documentados

Estos anti-patrones están presentes intencionalmente en los flujos as-is de los casos de
estudio como línea base. El micro-framework existe para eliminarlos en los flujos to-be.

---

| Anti-patrón | Descripción | Consecuencia | Regla que lo corrige |
|-------------|-------------|-------------|----------------------|
| Flujo monolítico | Toda la lógica en un solo flujo sin subflujos | Impacto de cambio alto: cualquier modificación puede afectar todo el flujo | Metamodelo E1-E4 |
| Credenciales en nodos | API keys o tokens como valores literales en configuración de nodos | Exposición de secretos en el JSON exportado del flujo | REG-001 |
| Validación ausente | Procesar el payload de entrada sin verificar campos obligatorios ni tipos | Fallos en etapas posteriores con mensajes de error ambiguos | E1 obligatorio |
| Lógica en adaptadores | Reglas de negocio o cálculos dentro del adaptador de integración | Duplicación de lógica, dificulta modificar reglas sin tocar integraciones | REG-007, REG-008 |
| Sin idempotencia | Escrituras sin control de duplicados ante reintentos | Los reintentos crean registros duplicados silenciosamente | REG-005 |
| Sin log estructurado | Solo el historial de n8n como fuente de diagnóstico | Imposibilidad de calcular latencias por tramo o correlacionar eventos | REG-006 |
| Sin flujo de error | No configurar `errorWorkflow` en el orquestador | Los fallos no se registran ni notifican, son invisibles operativamente | REG-003 |
| Acoplamiento por ID hardcodeado | El nodo Execute Workflow referencia subflujos por ID numérico hardcodeado en el JSON | Un re-import del subflujo genera un nuevo ID; el orquestador falla silenciosamente sin mensaje descriptivo | Documentar IDs en `notas-tecnicas.md` post-import; actualizar referencias desde n8n UI |
| Chatty integration | Múltiples llamadas HTTP al mismo servicio externo por ejecución cuando una sola llamada batch bastaría | Latencia total = N × latencia unitaria; aumenta la superficie de fallos transitorios | REG-004, REG-008 — centralizar en E3 y evaluar API batch del servicio externo |
| Exception swallowing | `try/catch` en Code node sin re-throw ni log; la excepción se silencia y el nodo retorna `status: 'ok'` | El flujo continúa con datos `undefined` o vacíos; el error es completamente invisible | REG-003, REG-006 — siempre re-throw o emitir `console.log` con `status: 'fail'` antes de retornar |
| God node | Nodo Code único con >100 líneas que mezcla validación, dominio y transformación de formato | Viola el metamodelo E1–E4 a nivel de nodo individual; cualquier cambio requiere entender todo el nodo | Metamodelo E1–E4 — si un nodo supera 50 líneas de lógica, dividir en nodos separados o subflujos |

---

## Ejemplos en el as-is del proyecto

### Bot as-is (`bot-as-is.json`)

- **Flujo monolítico:** Validación, clasificación, persistencia y respuesta en un solo flujo
- **Sin idempotencia:** El nodo HTTP Request al sistema de tickets no tiene control de duplicados
- **Sin log estructurado:** No hay `console.log` con JSON; solo el historial de n8n
- **Sin flujo de error:** No hay `errorWorkflow` configurado en settings

### IoT as-is (`iot-as-is.json`)

- **Credenciales en nodos:** `db_token: 'token-influxdb-hardcodeado-789'` visible en el código
- **Lógica en adaptadores:** Los umbrales de alerta (`temperatura > 35`) están hardcodeados
  mezclados con la transformación de datos y la llamada a la base de datos
- **Validación ausente:** Si falta un campo del sensor, queda `undefined` sin error explícito
- **Sin idempotencia:** No hay `ON CONFLICT` en las escrituras a base de datos

---

## Cómo identificar un anti-patrón en un flujo existente

1. **Flujo monolítico:** Abrir el flujo en n8n. Si no hay nodos `Execute Workflow`, es monolítico.

2. **Credenciales en nodos:** Exportar el JSON y buscar: `token`, `api_key`, `password`, `Bearer`,
   `secret`. Si alguno tiene valor literal (no referencia a credencial), está hardcodeado.

3. **Validación ausente:** Revisar el primer nodo Code. Si no hay verificación de presencia de
   campos obligatorios con mensajes de error, la validación está ausente.

4. **Lógica en adaptadores:** Revisar los nodos de integración (HTTP Request, Postgres). Si
   contienen condiciones de negocio o cálculos que no son transformaciones de formato, hay
   lógica mezclada.

5. **Sin idempotencia:** Buscar el query SQL de INSERT. Si no tiene `ON CONFLICT`, no hay
   idempotencia.

6. **Sin log estructurado:** Buscar `console.log` en los nodos Code. Si no existen o no
   producen JSON con `run_id` y `etapa`, el log es insuficiente.

7. **Sin flujo de error:** Ver los settings del orquestador. Si `settings.errorWorkflow` está
   vacío o ausente, los errores son invisibles.

8. **Acoplamiento por ID hardcodeado:** Buscar nodos `Execute Workflow` en el JSON exportado.
   Si el campo `workflowId` es un número (ej. `"workflowId": "42"`), está hardcodeado. Los
   IDs varían entre instancias de n8n — deben actualizarse después de cada import.

9. **Chatty integration:** Contar las llamadas HTTP en E3 al mismo host. Si hay más de 2
   llamadas al mismo endpoint por ejecución, investigar si el servicio tiene API batch.

10. **Exception swallowing:** Buscar `try/catch` en nodos Code. Si el `catch` no tiene
    `throw` ni `console.log`, la excepción está siendo silenciada.

11. **God node:** Contar las líneas de `jsCode` en cada nodo Code del JSON exportado.
    Si un nodo supera 100 líneas, evaluar si mezcla responsabilidades de múltiples etapas.
