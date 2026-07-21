# Convenciones de nombres

Referencia rápida de los patrones de nombres usados en el proyecto.
Fuente de verdad completa: `convenios-y-reglas.md`.

---

## Archivos de flujos n8n

```
{caso}-{estado}.json                    # flujo principal / orquestador
{caso}-{estado}-{etapa}.json            # subflujo

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

## Nodos dentro de los flujos

Patrón: `{Etapa} - {Descripción acción}`

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

## IDs de subflujos en n8n

Usar estos nombres al configurar el nodo Execute Workflow (campo Workflow ID):

```
bot-e2-dominio
bot-e3-adaptador
iot-e1-validacion
iot-e2-dominio
iot-e3-persistencia
iot-e4-notificacion
```

*Nota: Los IDs reales asignados por n8n después del import son numéricos. Estos son
los nombres de referencia para identificación en el repositorio.*

---

## ADR (Architecture Decision Records)

```
ADR-{NNN}-{descripcion-kebab-case}.md

ADR-001-orquestacion-centralizada.md
ADR-002-gestion-secretos.md
ADR-003-idempotencia-ingesta.md
```

Ubicación: `casos-de-estudio/{caso}/adr/`

---

## Logs CSV

```
run-log-{caso}-{estado}.csv         # Ubicación: medicion/run-logs/{caso}/
cr-log-{caso}-{estado}.csv          # Ubicación: medicion/cr-logs/{caso}/

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

## Datasets sintéticos

```
input-set-{letra}.json              # Ubicación: medicion/datasets/{caso}/

input-set-A.json   # Escenario normal / operación estándar
input-set-B.json   # Escenario crítico / valores extremos
input-set-C.json   # Escenario inválido / datos malformados
```

---

## Commits

```
[FASE-N] tipo: descripcion breve en minúsculas

Tipos: feat | fix | docs | measure | adr | refactor | chore

[FASE-0] chore: agregar PostgreSQL al docker-compose
[FASE-2] feat: agregar flujo as-is bot con nodo de validación token
[FASE-3] docs: documentar reglas obligatorias micro-framework v1.0
[FASE-4] adr: registrar decisión de orquestación centralizada bot
[FASE-6] measure: run-log bot as-is input-set-A 10 corridas
```

---

## run_id

```
RUN-BOT-{timestamp_ms}-{random6}     # Caso bot
RUN-IOT-{timestamp_ms}-{random6}     # Caso iot

Ejemplo: RUN-BOT-1748732456789-A3F2K1
```

Generado en E1 al inicio de cada ejecución. Nunca reutilizar entre ejecuciones.
