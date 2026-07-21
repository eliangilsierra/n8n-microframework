> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# run-logs/ — Registro crudo de corridas de medición

**Ruta:** `medicion/run-logs/`
**Pertenece a:** [`medicion/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene los **CSV de evidencia cruda** de cada corrida individual contra
los webhooks de n8n (as-is y to-be, Bot e IoT). Son la fuente primaria de las métricas de
latencia y tasa de fallos de la dimensión Operación del anteproyecto.

## Contenido de esta carpeta

| Subcarpeta | Descripción |
|---|---|
| [`bot/`](bot/README.md) | Run-logs del caso Bot (as-is + to-be) |
| [`iot/`](iot/README.md) | Run-logs del caso IoT (as-is + to-be) |

## Relación con la metodología

Formato exacto de columnas: `run_id,case,version,input_set,start_ts,end_ts,status,error_type,notes,commit_hash`
(ver [`../../microframework/convenciones/convenios-y-reglas.md`](../../microframework/convenciones/convenios-y-reglas.md)
§Run Logs). **Regla de integridad crítica:** una vez que una corrida es registrada,
**nunca se borra ni modifica** — si hay un error, se agrega una nueva fila correcta y se
marca la incorrecta con `status: invalid`. Estos CSV son generados por
`automatizacion/run_corridas.py` siguiendo
[`medicion/protocolo-evidencias.md`](../protocolo-evidencias.md) §4-5.

## Navegación

- Padre: [`medicion/`](../README.md)
- Ver también: [`medicion/cr-logs/`](../cr-logs/README.md) · [`medicion/consolidado/`](../consolidado/README.md) (reportes derivados de estos datos)
