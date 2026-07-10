> 🌐 **Language / Idioma:** English · [Español](README.md)

# Input/output contracts per stage

This directory contains the JSON Schemas that formalize the I/O contracts of every
micro-framework stage for the Bot and IoT cases. The schemas are the normative
specification against which E1 validates, and against which the transformation between
stages is implemented.

## Files

### Bot case
- `bot-webhook-input.schema.json` — payload received by the orchestrator's webhook
- `bot-e1-output.schema.json` — E1 output (input to E2)
- `bot-e2-output.schema.json` — E2 output (input to E3)
- `bot-e3-output.schema.json` — E3 output (input to inline E4, see ADR-002)

### IoT case
- `iot-webhook-input.schema.json` — sensor payload to the webhook
- `iot-e1-output.schema.json` — E1 output
- `iot-e2-output.schema.json` — E2 output
- `iot-e3-output.schema.json` — E3 output
- `iot-e4-output.schema.json` — orchestrator's final response to the client

## Usage

- **Validation in E1:** E1's Code node checks the input payload against the case's
  `*-webhook-input.schema.json` schema.
- **Validation between stages:** every subflow documents its contract with the
  corresponding `*-e{N}-output.schema.json` schema.
- **Static validation:** the `microframework/validacion/validar-flujos.mjs` script
  verifies that Code nodes reference the fields declared in these schemas.

## Versioning

Schema changes require an ADR. Backward compatibility is preserved by adding optional
fields; fields are never removed without an ADR justifying it.
