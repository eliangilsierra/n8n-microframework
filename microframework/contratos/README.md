# Contratos de entrada/salida por etapa

Este directorio contiene los JSON Schemas que formalizan los contratos E/S de cada
etapa del micro-framework para los casos Bot e IoT. Los schemas son la especificación
normativa contra la que se valida E1 y contra la que se implementa la transformación
entre etapas.

## Archivos

### Caso Bot
- `bot-webhook-input.schema.json` — payload que recibe el webhook del orquestador
- `bot-e1-output.schema.json` — salida de E1 (entrada a E2)
- `bot-e2-output.schema.json` — salida de E2 (entrada a E3)
- `bot-e3-output.schema.json` — salida de E3 (entrada a E4 inline, ver ADR-002)

### Caso IoT
- `iot-webhook-input.schema.json` — payload del sensor al webhook
- `iot-e1-output.schema.json` — salida de E1
- `iot-e2-output.schema.json` — salida de E2
- `iot-e3-output.schema.json` — salida de E3
- `iot-e4-output.schema.json` — respuesta final del orquestador al cliente

## Uso

- **Validación en E1:** el nodo Code de E1 verifica el payload de entrada contra el
  schema `*-webhook-input.schema.json` del caso.
- **Validación entre etapas:** cada subflujo documenta su contrato con el schema
  `*-e{N}-output.schema.json` correspondiente.
- **Validación estática:** el script `microframework/validacion/validar-flujos.mjs`
  verifica que los nodos Code referencien los campos declarados en estos schemas.

## Versionado

Cambios en los schemas requieren ADR. La compatibilidad hacia atrás se preserva
agregando campos opcionales; nunca se eliminan campos sin ADR que lo justifique.
