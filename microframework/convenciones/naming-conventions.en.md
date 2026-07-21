> 🌐 **Language / Idioma:** English · [Español](naming-conventions.md)

# Naming conventions

Quick reference for the naming patterns used in the project.
Full source of truth: `convenios-y-reglas.en.md`.

---

## n8n flow files

```
{case}-{state}.json                    # main flow / orchestrator
{case}-{state}-{stage}.json            # subflow

bot-as-is.json
bot-to-be-orquestador.json
bot-to-be-e2-dominio.json
bot-to-be-e3-adaptador.json
iot-as-is.json
iot-to-be-orquestador.json
iot-to-be-e1-validacion.json
iot-to-be-e2-dominio.json
iot-to-be-e3-persistencia.json
iot-to-be-e4-notificacion.json
```

---

## Nodes inside flows

Pattern: `{Stage} - {Action description}`

```
Webhook - Entrada
E1 - Validacion de entrada
IF - Entrada valida?
E2 - Reglas de negocio
E3 - Preparar payload adaptador
E3 - Log salida adaptador
IF - Requiere notificacion?
IF - Nivel critico?
E4 - Notificar canal CRITICO
E4 - Notificar canal WARNING
Respond - OK (200)
Respond - Entrada invalida (400)
Respond - Error interno (500)
Execute Workflow Trigger
```

---

## Subflow IDs in n8n

Use these names when configuring the Execute Workflow node (Workflow ID field):

```
bot-e2-dominio
bot-e3-adaptador
iot-e1-validacion
iot-e2-dominio
iot-e3-persistencia
iot-e4-notificacion
```

*Note: the actual IDs assigned by n8n after import are numeric. These are the reference
names used for identification within the repository.*

---

## ADR (Architecture Decision Records)

```
ADR-{NNN}-{kebab-case-description}.md

ADR-001-orquestacion-centralizada.md
ADR-002-gestion-secretos.md
ADR-003-idempotencia-ingesta.md
```

Location: `casos-de-estudio/{case}/adr/`

---

## CSV logs

```
run-log-{case}-{state}.csv         # Location: medicion/run-logs/{case}/
cr-log-{case}-{state}.csv          # Location: medicion/cr-logs/{case}/

run-log-bot-as-is.csv
run-log-bot-to-be.csv
run-log-iot-as-is.csv
run-log-iot-to-be.csv
cr-log-bot-as-is.csv
cr-log-bot-to-be.csv
cr-log-iot-as-is.csv
cr-log-iot-to-be.csv
```

---

## Synthetic datasets

```
input-set-{letter}.json              # Location: medicion/datasets/{case}/

input-set-A.json   # Normal scenario / standard operation
input-set-B.json   # Critical scenario / extreme values
input-set-C.json   # Invalid scenario / malformed data
```

---

## Commits

```
[FASE-N] tipo: descripcion breve en minúsculas

Types: feat | fix | docs | measure | adr | refactor | chore

[FASE-0] chore: agregar PostgreSQL al docker-compose
[FASE-2] feat: agregar flujo as-is bot con nodo de validación token
[FASE-3] docs: documentar reglas obligatorias micro-framework v1.0
[FASE-4] adr: registrar decisión de orquestación centralizada bot
[FASE-6] measure: run-log bot as-is input-set-A 10 corridas
```

(Commit message text stays in Spanish per the project's actual git history convention.)

---

## run_id

```
RUN-BOT-{timestamp_ms}-{random6}     # Bot case
RUN-IOT-{timestamp_ms}-{random6}     # IoT case

Example: RUN-BOT-1748732456789-A3F2K1
```

Generated in E1 at the start of every execution. Never reused between executions.
