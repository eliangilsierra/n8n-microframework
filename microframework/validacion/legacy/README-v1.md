# Validador estático de flujos n8n

**Componente:** Pilar 2 DevSecOps — Validaciones Automatizadas (§4.3 del anteproyecto)
**Script:** `microframework/validacion/validar-flujos.mjs`
**Versión:** 1.1
**Autor:** Elian Hernando Gil Sierra — MGADS UNAB 2026

---

## Tabla de contenidos

1. [Propósito y rol en el micro-framework](#1-propósito-y-rol-en-el-micro-framework)
2. [Decisión de implementación: Node.js vs Python](#2-decisión-de-implementación-nodejs-vs-python)
3. [Flujo de ejecución](#3-flujo-de-ejecución)
4. [Reglas evaluadas](#4-reglas-evaluadas)
5. [Dependencia en convenciones de nombre de archivo](#5-dependencia-en-convenciones-de-nombre-de-archivo)
6. [Comandos disponibles](#6-comandos-disponibles)
7. [Salidas generadas](#7-salidas-generadas)
8. [Interpretación del reporte](#8-interpretación-del-reporte)
9. [Uso con un flujo externo o arbitrario](#9-uso-con-un-flujo-externo-o-arbitrario)
10. [Limitaciones conocidas](#10-limitaciones-conocidas)
11. [Evidencia de ejecución](#11-evidencia-de-ejecución)
12. [Trazabilidad académica](#12-trazabilidad-académica)

---

## 1. Propósito y rol en el micro-framework

El validador estático es el mecanismo de verificación objetiva y reproducible de las diez reglas obligatorias (REG-001 a REG-010) del micro-framework. Convierte las reglas de diseño, que de otro modo serían puramente declarativas, en **criterios comprobables automáticamente** sobre el JSON exportado de cualquier flujo n8n.

### ¿Qué resuelve?

n8n no dispone de un motor de política arquitectónica nativo. Las decisiones de diseño como "ningún nodo hardcodea credenciales" o "E2 no contiene IO" son convenios que, sin una herramienta de verificación, dependen de la memoria y disciplina del desarrollador. El validador cierra esa brecha: cualquiera puede ejecutar el script sobre un flujo y obtener un reporte binario que responde ¿este flujo cumple el micro-framework?

### Posición en el Pilar 2 DevSecOps

El anteproyecto define tres pilares DevSecOps:

| Pilar | Mecanismo | Verificación |
|---|---|---|
| 1. Gestión de Secretos | Credenciales referenciadas por nombre en n8n | REG-001 + checklist DevSecOps |
| **2. Validaciones Automatizadas** | **`validar-flujos.mjs`** | **REG-001…010 sobre el JSON** |
| 3. Resiliencia Operativa | Patrones retry + idempotencia + log estructurado | REG-004, REG-005, REG-006 |

### Rol en la evidencia académica

Los reportes generados por el validador constituyen **evidencia documental** del tipo (i) en la triangulación metodológica del ATAM (ver `atam/metodologia-atam-adaptada.md`). Cada reporte con timestamp en `microframework/validacion/reportes/` es un artefacto auditable que demuestra el nivel de cumplimiento de los flujos to-be en un momento dado.

---

## 2. Decisión de implementación: Node.js vs Python

El proyecto usa Python en otras fases (`automatizacion/run_corridas.py`, `medicion/analizar_runlogs.py`). Esta decisión de usar Node.js para el validador estático está justificada por cuatro razones técnicas y una operativa, documentadas como criterio de diseño explícito.

### 2.1 Cohesión tecnológica con n8n

n8n es una aplicación Node.js. Su JSON exportado es producido por un motor JavaScript y su estructura interna (tipos de nodos, parámetros, expresiones) está pensada en términos de JavaScript. Parsear y evaluar ese JSON con el mismo runtime elimina cualquier fricción de interpretación: los tipos, las rutas de propiedades y las expresiones de los nodos se leen de forma nativa sin capas de traducción.

### 2.2 Cero dependencias externas

El script usa exclusivamente módulos de la librería estándar de Node.js 18+: `fs`, `path` y `url`. No requiere `npm install`, no genera `node_modules`, no introduce dependencias que puedan quedar desactualizadas o causar conflictos con otras herramientas del repositorio. Python habría requerido al menos `json` (estándar, pero también `re`, `os`, `pathlib`) y potencialmente `jsonschema` para validaciones más expresivas, agregando surface de dependencias.

### 2.3 Disponibilidad garantizada en el entorno CI/CD

El entorno de ejecución ya tiene Node.js instalado porque n8n lo requiere. Cualquier pipeline de CI que levante el contenedor n8n o que simplemente verifique el repositorio antes de importar flujos tiene Node disponible sin instalación adicional. Python, en cambio, requeriría un paso de configuración explícito en el pipeline (`setup-python`, imagen base diferente, etc.), añadiendo complejidad sin beneficio funcional.

### 2.4 Separación de responsabilidades entre scripts

Los scripts Python del proyecto tienen una responsabilidad diferente: **ejecutar y medir** (enviar peticiones HTTP, recolectar run-logs, calcular métricas de latencia). El validador tiene la responsabilidad de **analizar estructura estática**. Mantener lenguajes distintos para responsabilidades distintas comunica claramente la separación: Python para orquestación de pruebas dinámicas, Node.js para análisis estático de artefactos n8n.

### 2.5 Portabilidad sin runtime adicional en el contexto académico

En el contexto de un trabajo de grado reproducible por evaluadores externos, reducir las dependencias de entorno reduce la fricción de reproducibilidad. Un evaluador con Docker y n8n corriendo ya tiene Node.js. Ejecutar `node validar-flujos.mjs` es el comando mínimo posible: un binario, un archivo, sin setup.

### Resumen de la decisión

| Criterio | Node.js | Python |
|---|---|---|
| Cohesión con n8n | ✓ nativo | ✗ requiere traducción |
| Dependencias externas | ✓ cero | ✗ potencialmente `jsonschema` |
| Disponibilidad en CI con n8n | ✓ garantizada | ✗ requiere configuración |
| Coherencia con scripts existentes | ✓ separación clara | ✗ mezcla de responsabilidades |
| Portabilidad para evaluadores | ✓ mínima fricción | ✗ paso adicional de setup |

> **ADR de referencia:** Esta decisión no tiene ADR dedicado porque el razonamiento queda capturado en este documento. Si en el futuro se migra el validador, este README es el punto de partida para el ADR correspondiente.

---

## 3. Flujo de ejecución

```
Invocación: node validar-flujos.mjs [opciones]
                    │
                    ▼
         parseArgs()  ─────────────────────────────────┐
         Lee --caso, --estado, --format                 │
                    │                                   │
                    ▼                                   │
         listJsonFlows()                                │
         Escanea casos-de-estudio/{caso}/{estado}/*.json│
         y microframework/plantillas/*.json             │
                    │                                   │
         Para cada archivo JSON encontrado:             │
                    │                                   │
                    ▼                                   │
         parseFlow(path)                                │
         JSON.parse del archivo                         │
         Si falla → { __error: mensaje }                │
                    │                                   │
                    ▼                                   │
         evaluarArchivo(file)                           │
         Ejecuta los 11 predicados en secuencia:        │
           REG-001 regSecrets()                         │
           REG-002 regRunId()                           │
           REG-003 regErrorWorkflow()                   │
           REG-004 regRetry()                           │
           REG-005 regIdempotencia()                    │
           REG-006 regLogEstructurado()                 │
           REG-007 regDominioAislado()                  │
           REG-008 regIntegracionesLugar()              │
           REG-009 regStatusCodes()                     │
           REG-010 regAdrPresente()                     │
           REG-VOC  regVocabulario()                    │
         Cada predicado → { cumple: true|false|null,    │
                            evidencia: string }          │
                    │                                   │
                    ▼                                   │
         resumirArchivo()                               │
         Calcula cumplen/total/pct                      │
         (solo cuenta reglas donde cumple ≠ null)       │
                    │                                   │
                    ▼                                   │
         renderMd() o renderJson()   ◄──────────────────┘
         Genera reporte completo
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
  console.log(reporte)   writeFileSync(
                         reportes/validacion-YYYY-MM-DD.md)
                    │
                    ▼
         Exit code:
           0 → ningún to-be tiene cumple: false
           1 → al menos un to-be tiene cumple: false
           (as-is reporta fallos sin afectar el exit code)
```

### Comportamiento ante errores de parseo

Si un archivo JSON es inválido (malformado, truncado, encoding incorrecto), el validador registra el error en el reporte con el mensaje de excepción y continúa con los demás archivos. No aborta la ejecución.

---

## 4. Reglas evaluadas

Cada predicado analiza el objeto JSON del flujo en memoria. Ninguno hace llamadas de red, accede a la instancia de n8n ni ejecuta código del flujo.

### REG-001 — Sin secretos hardcodeados

**Qué analiza:** El `parameters` serializado de cada nodo, contra 7 patrones regex:

| Patrón | Qué detecta |
|---|---|
| `Bearer\s+[A-Za-z0-9._-]{8,}` | Tokens Bearer literales en cualquier campo |
| `sk-[A-Za-z0-9]{16,}` | API keys estilo OpenAI |
| `ghp_[A-Za-z0-9]{16,}` | Personal Access Tokens de GitHub |
| `"(password\|api_key\|secret\|token)": "<valor>"` | Campos semánticos con valor literal |
| `"rightValue": "<cadena ≥12 chars>"` | Comparaciones literales en nodos IF/Switch |
| `"name": "x-api-key" ... "value": "<literal>"` | Headers HTTP con API key embebida |
| `const/let/var *token* = '<literal>'` | Asignaciones en nodos Code |

**Resultado N/A:** Nunca — aplica a todos los flujos.
**Nota:** El as-is del caso Bot tiene violaciones deliberadas de esta regla (tokens hardcodeados en nodo IF "Validar Token" y headers de nodos HTTP). Esto es la línea base intencional.

---

### REG-002 — run_id propagado

**Qué analiza:** El texto completo de todos los nodos Code/Function del flujo.

- Busca la cadena `run_id` (presencia del campo)
- Busca `console.log(JSON.stringify` (presencia del log estructurado)

**Resultado N/A:** Orquestadores puros (sin nodos Code pero con nodos Execute Workflow). En ese caso el `run_id` es generado en el subflujo E1 y propagado automáticamente — no existe código que verificar en el orquestador.

---

### REG-003 — errorWorkflow configurado

**Qué analiza:** `flow.settings.errorWorkflow` — debe existir y no ser una cadena vacía.

**Resultado N/A:** Todos los archivos cuyo nombre no contiene `orquestador`. Los subflujos E1–E4 y los error handlers no son orquestadores y no aplican esta regla.

---

### REG-004 — Retry en HTTP

**Qué analiza:** Todos los nodos de tipo `httpRequest`. Para cada uno:
- `parameters.options.retry.enabled` debe ser `true`
- `parameters.options.retry.maxRetries` o `maxTries` debe ser `≥ 2`

**Resultado N/A:** Flujos sin ningún nodo httpRequest (ej: E1 de validación, E2 de dominio, orquestador puro).

---

### REG-005 — Idempotencia en escrituras

**Qué analiza:** Todos los nodos de tipo `postgres`. Para los que tienen operación INSERT (detectado por la presencia de `"insert"` en los parámetros):
- El query debe contener `ON CONFLICT` o el campo `idempotency_key`

**Resultado N/A:**
- Flujos sin nodos Postgres
- Error handlers (cada evento de error es único por naturaleza — aplicar idempotencia generaría falsos positivos silenciando errores duplicados)

---

### REG-006 — Log estructurado JSON

**Qué analiza:** El texto completo de todos los nodos Code/Function.

- Presencia de `console.log(JSON.stringify` (forma de log estructurado)
- Presencia de los campos mínimos: `run_id`, `etapa`, `status`

**Resultado N/A:** Flujos sin nodos Code (ej: orquestador puro que solo tiene nodos Execute Workflow y Respond to Webhook).

---

### REG-007 — Dominio aislado (E2)

**Qué analiza:** Solo en archivos cuyo nombre contiene `-e2-dominio`. Verifica que no existan nodos `httpRequest` ni `postgres`.

**Resultado N/A:** Cualquier archivo que no sea un subflujo E2 identificado por nombre.

---

### REG-008 — Integraciones en E3/E4

**Qué analiza:** Si el flujo tiene nodos `httpRequest` o `postgres`, verifica que el nombre del archivo contenga `-e3-`, `-e4-`, `orquestador` o `error-handler`. Si el archivo no cumple alguna de esas condiciones pero tiene nodos IO, la regla falla.

**Resultado N/A:** Flujos sin ningún nodo IO.

---

### REG-009 — HTTP status codes apropiados

**Qué analiza:** Solo en archivos cuyo nombre contiene `orquestador`. Busca todos los nodos `respondToWebhook` y recolecta los valores de `parameters.responseCode`. La regla requiere al menos **2 valores distintos** (éxito y error).

**Resultado N/A:** Archivos que no son orquestadores.

---

### REG-010 — ADR presente

**Qué analiza:** La existencia de la carpeta `casos-de-estudio/{caso}/adr/` y de al menos un archivo que coincida con el patrón `ADR-*.md`.

**Resultado N/A:** Archivos en `microframework/plantillas/` (son plantillas genéricas, no casos con ADR específico).

---

### REG-VOC — Vocabulario enum `nivel` en español

**Qué analiza:** El código JavaScript de todos los nodos Code en flujos **to-be** de casos de estudio. Detecta el uso de términos en inglés donde el enum oficial del micro-framework es en español:

| Detecta | Correcto |
|---|---|
| `= 'warning'` / `= "warning"` | `"advertencia"` |
| `= 'critical'` / `= "CRITICAL"` | `"critico"` |

**Resultado N/A:**
- Flujos de plantillas
- Flujos as-is (la línea base puede usar cualquier vocabulario)
- Flujos to-be sin nodos Code

---

## 5. Dependencia en convenciones de nombre de archivo

Varias reglas usan el **nombre del archivo JSON** para determinar si aplican. Esta es la tabla completa de activación:

| Patrón en el nombre del archivo | Reglas que activa o modifica |
|---|---|
| contiene `orquestador` | REG-003 (activa), REG-008 (exime), REG-009 (activa) |
| contiene `-e2-dominio` | REG-007 (activa) |
| contiene `-e3-` | REG-008 (permite IO) |
| contiene `-e4-` | REG-008 (permite IO) |
| contiene `error-handler` o `error.handler` | REG-005 (exime), REG-008 (permite IO) |
| está en `microframework/plantillas/` | REG-010 (N/A), REG-VOC (N/A) |

### Consecuencia directa

Si se importa un flujo n8n con nombre arbitrario (ej: `Mi-flujo-nuevo.json`) y se coloca en `casos-de-estudio/{caso}/to-be/`, las reglas que dependen del nombre devolverán `– N/A` en lugar de evaluarse. Las únicas reglas que siempre evalúan, independientemente del nombre, son:

- **REG-001** (secretos) — siempre aplica
- **REG-004** (retry) — aplica si hay nodos HTTP
- **REG-005** (idempotencia) — aplica si hay nodos Postgres con INSERT
- **REG-006** (log estructurado) — aplica si hay nodos Code

Para obtener cobertura completa, los archivos deben seguir las convenciones de naming definidas en `microframework/convenciones/naming-conventions.md`.

---

## 6. Comandos disponibles

```bash
# Evalúa todo el repositorio (casos-de-estudio/ + microframework/plantillas/)
node microframework/validacion/validar-flujos.mjs

# Solo el caso Bot, todos los estados
node microframework/validacion/validar-flujos.mjs --caso bot

# Solo los to-be del caso IoT
node microframework/validacion/validar-flujos.mjs --caso iot --estado to-be

# Solo los as-is del caso Bot
node microframework/validacion/validar-flujos.mjs --caso bot --estado as-is

# Salida JSON (para procesar con jq, integrar en CI o alimentar dashboards)
node microframework/validacion/validar-flujos.mjs --format json

# Guardar salida JSON en archivo
node microframework/validacion/validar-flujos.mjs --format json > reporte.json

# Ayuda
node microframework/validacion/validar-flujos.mjs --help
```

**Requisitos:** Node.js ≥ 18. Sin npm install. Sin dependencias externas.

---

## 7. Salidas generadas

### 7.1 Salida en consola

Siempre se imprime el reporte completo en `stdout`, independientemente del formato.

### 7.2 Archivo de reporte (solo formato Markdown)

Cuando se ejecuta sin `--format json`, el script crea o sobrescribe automáticamente:

```
microframework/validacion/reportes/validacion-YYYY-MM-DD.md
```

El nombre incluye la fecha UTC del día de ejecución. Si se ejecuta dos veces el mismo día, el archivo se sobrescribe con la ejecución más reciente.

### 7.3 Exit code

| Código | Significado |
|---|---|
| `0` | Todos los flujos to-be cumplen todas las reglas aplicables (o N/A) |
| `1` | Al menos un flujo to-be tiene `cumple: false` en alguna regla |

**Nota importante:** Los flujos as-is pueden tener violaciones (`cumple: false`) sin que el exit code sea 1. El as-is es la línea base intencional: documentar sus incumplimientos es parte del análisis, no una falla del pipeline.

---

## 8. Interpretación del reporte

### Tabla resumen

```
| Archivo                         | Caso | %    | Cumple / Aplica |
|---------------------------------|------|------|-----------------|
| casos-de-estudio/iot/to-be/...  | iot  | 100% | 7/7             |
```

- **%:** porcentaje de reglas que cumplen sobre las que aplican (excluye N/A)
- **Cumple / Aplica:** conteo absoluto (numerador = ✓, denominador = reglas con `cumple ≠ null`)

### Detalle por archivo

```
- ✓  REG-001  Sin secretos hardcodeados: sin patrones de secretos literales
- ✗  REG-004  Retry en HTTP: nodo "Llamar API" maxRetries=0 (<2)
- –  REG-003  errorWorkflow configurado: N/A (no es orquestador)
```

| Símbolo | Significado |
|---|---|
| `✓` | La regla aplica y el flujo la cumple |
| `✗` | La regla aplica y el flujo la viola — es un hallazgo real |
| `–` | La regla no aplica a este tipo de flujo (N/A) |

La cadena `evidencia` explica siempre **por qué** se tomó esa decisión: nombre del nodo problemático, patrón detectado, valor encontrado, o razón de la exención.

---

## 9. Uso con un flujo externo o arbitrario

Se puede evaluar cualquier JSON exportado de n8n. El procedimiento:

**Paso 1:** Exportar el flujo desde n8n (menú del flujo → *Download*).

**Paso 2:** Copiar el archivo JSON a la estructura del repositorio:

```
casos-de-estudio/
  {caso}/          ← usar "bot", "iot" o crear una carpeta nueva
    to-be/
      {nombre-con-convencion}.json
```

**Paso 3:** Nombrar el archivo siguiendo las convenciones para obtener cobertura completa:

```
{caso}-to-be-orquestador.json          → activa REG-003 y REG-009
{caso}-to-be-e1-validacion.json        → activa REG-007 si fuera e2
{caso}-to-be-e2-dominio.json           → activa REG-007
{caso}-to-be-e3-{nombre}.json          → permite IO en REG-008
{caso}-to-be-e4-{nombre}.json          → permite IO en REG-008
{caso}-error-handler.json              → exime REG-005, permite IO
```

**Paso 4:** Ejecutar:
```bash
node microframework/validacion/validar-flujos.mjs --caso {caso} --estado to-be
```

**Consideración:** Si el flujo es de un caso completamente nuevo (no bot ni iot), REG-010 buscará la carpeta `casos-de-estudio/{caso}/adr/`. Crearla con al menos un `ADR-001-*.md` satisface la regla.

---

## 10. Limitaciones conocidas

### 10.1 Análisis léxico, no semántico

El validador analiza el **texto y la estructura del JSON**, no ejecuta los nodos. Por eso:

- **REG-001** puede generar **falsos negativos** si un secreto se construye dinámicamente en un nodo Code (ej: concatenación de fragmentos almacenados en variables de entorno). El validador no puede detectar secretos que no estén como literales en el JSON.
- **REG-002** confirma que `run_id` aparece en el código, no que el valor correcto se propague en runtime. Un nodo que tenga `run_id` hardcodeado como `"fijo"` pasaría la regla estática.
- **REG-004** verifica la configuración del nodo HTTP, pero si el retry está deshabilitado condicionalmente por una expresión n8n, el validador no lo detecta.

### 10.2 Dependencia en naming conventions

Descrita en la [sección 5](#5-dependencia-en-convenciones-de-nombre-de-archivo). Un flujo con nombre arbitrario recibe cobertura parcial.

### 10.3 REG-010 verifica presencia, no calidad

El validador confirma que existe al menos un archivo `ADR-*.md`, no que el ADR esté completo, que tenga la plantilla correcta ni que sus decisiones sean coherentes con el flujo. La calidad del ADR requiere revisión manual.

### 10.4 REG-009 cuenta valores distintos, no semántica HTTP

La regla verifica que haya ≥ 2 `responseCode` distintos, pero no valida que 200 corresponda a éxito ni que 422 corresponda a input inválido. Un orquestador con `responseCode: 200` y `responseCode: 201` pasaría la regla aunque ambos sean respuestas de éxito.

### 10.5 Un reporte por día

Los reportes se guardan con granularidad de fecha (`validacion-YYYY-MM-DD.md`). Si se ejecuta el validador múltiples veces en el mismo día, solo persiste la última ejecución. Para comparación histórica inter-día, los reportes anteriores están versionados en Git.

### 10.6 Alcance: solo casos-de-estudio y plantillas

El script escanea únicamente `casos-de-estudio/` y `microframework/plantillas/`. No evalúa flujos en otras rutas del repositorio.

---

## 11. Evidencia de ejecución

Los siguientes reportes están versionados en este repositorio como evidencia de ejecuciones reales:

| Reporte | Flujos evaluados | Resultado |
|---|---|---|
| [`reportes/validacion-2026-05-02.md`](reportes/validacion-2026-05-02.md) | IoT as-is + to-be (primeros subflujos) | Línea base establecida |
| [`reportes/validacion-2026-05-03.md`](reportes/validacion-2026-05-03.md) | IoT to-be completo | REG-VOC corregido |
| [`reportes/validacion-2026-05-06.md`](reportes/validacion-2026-05-06.md) | 6 flujos IoT to-be | 100% en todos |

El reporte de 2026-05-06 representa el estado final del caso IoT: 6 flujos, 100% de cumplimiento en todas las reglas aplicables, incluyendo REG-VOC (vocabulario en español), REG-005 (idempotencia con `ON CONFLICT`), REG-003 (`errorWorkflow` configurado con ID real de n8n) y REG-009 (status codes 200 y 422).

---

## 12. Trazabilidad académica

| Artefacto | Referencia |
|---|---|
| Especificación de las 10 reglas | [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.md) |
| Mapeo REG → ISO/IEC 25010 | [`microframework/reglas/reglas-obligatorias.md §Mapeo`](../reglas/reglas-obligatorias.md) |
| Pilar 2 DevSecOps | [`microframework/microframework-spec.md §DevSecOps`](../../docs/context/microframework-spec.md) |
| Rol en evidencia ATAM | [`atam/metodologia-atam-adaptada.md`](../../docs/atam/metodologia-atam-adaptada.md) |
| Entregable R1 del anteproyecto | [`microframework/microframework-v1.0.md`](../../docs/microframework-v1.0.md) |
| Convenciones de naming | [`microframework/convenciones/naming-conventions.md`](../convenciones/naming-conventions.md) |
| Checklist de arquitectura | [`microframework/checklists/checklist-arquitectura.md`](../checklists/checklist-arquitectura.md) |
