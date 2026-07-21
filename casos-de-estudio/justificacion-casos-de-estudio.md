# Justificación de la selección de casos de estudio

**Versión:** 1.0  
**Fecha:** 2026-05-01  
**Autor:** Elian Hernando Gil Sierra  
**Propósito:** Sustentar académicamente la representatividad de los casos Bot e IoT
dentro del espacio de problemas LC/NC en n8n.

---

## 1. Taxonomía de patrones LC/NC en n8n

El repositorio oficial de n8n alberga más de 8 900 plantillas públicas (2026). A partir
del análisis de las plantillas más descargadas y referenciadas en la documentación oficial,
se identifican cuatro categorías de patrones:

| Categoría | Descripción | Ejemplos típicos |
|-----------|-------------|-----------------|
| **Webhook-reactivo** | Flujo activado por HTTP POST; procesa y responde en tiempo real | Chatbots, validadores, notificadores |
| **Scheduled-batch** | Flujo activado por cron; procesa lotes de datos de forma periódica | ETL nocturno, informes, sincronización |
| **Event-driven pipeline** | Flujo activado por evento externo (webhook o cola); transforma y persiste datos | Sensores IoT, webhooks de pagos, webhooks de CI/CD |
| **Hybrid orchestration** | Flujo maestro que coordina múltiples subflujos o flujos externos | Procesos de negocio multi-paso, RPA |

Cada categoría se caracteriza por cuatro dimensiones ortogonales:

| Dimensión | Webhook-reactivo | Scheduled-batch | Event-driven pipeline | Hybrid orchestration |
|-----------|-----------------|-----------------|----------------------|---------------------|
| Fuente de datos | Humano / cliente HTTP | Sistema interno / BD | Máquina / sensor | Múltiples fuentes |
| Tiempo de respuesta | Tiempo real (< 2 s) | Diferido (minutos-horas) | Tiempo real / near-real-time | Variable |
| Persistencia de estado | Sin estado propio | Estado en BD / archivos | Estado en BD / serie temporal | Estado distribuido |
| Dirección del flujo | Humano → Sistema | Sistema → Sistema | Máquina → Sistema | Orquestado |

---

## 2. Posición de Bot e IoT en la taxonomía

### Caso Bot — Chatbot de soporte

- **Categoría:** Webhook-reactivo
- **Fuente de datos:** Humano (mensaje de usuario)
- **Tiempo de respuesta:** Tiempo real (respuesta en la misma conexión HTTP)
- **Persistencia de estado:** Sin estado propio en el flujo (los tickets se persisten en servicio externo)
- **Dirección del flujo:** Humano → Sistema

### Caso IoT — Pipeline de sensores

- **Categoría:** Event-driven pipeline
- **Fuente de datos:** Máquina (sensor físico simulado)
- **Tiempo de respuesta:** Near-real-time (respuesta 200/422 en la misma conexión; notificación asincrónica)
- **Persistencia de estado:** Estado persistido en PostgreSQL local con idempotencia
- **Dirección del flujo:** Máquina → Sistema

### Comparación de dimensiones

| Dimensión | Bot | IoT | ¿Difieren? |
|-----------|-----|-----|-----------|
| Fuente de datos | Humano | Máquina/sensor | ✓ Sí |
| Dominio de datos | Texto no estructurado | Numérico con rangos físicos | ✓ Sí |
| Persistencia | Tickets en servicio externo | Lecturas en BD local | ✓ Sí |
| Notificación | Inline en respuesta HTTP | Canal diferenciado por severidad | ✓ Sí |
| Idempotencia | Por `run_id` (operación) | Por clave natural `{sensor_id, timestamp}` | ✓ Sí |
| Categoría principal | Webhook-reactivo | Event-driven pipeline | ✓ Sí |

Los dos casos comparten la activación por webhook HTTP (misma plataforma, mismo mecanismo
de entrada) pero difieren en **todas las demás dimensiones relevantes**. Esto garantiza
cobertura ortogonal del espacio de problemas dentro de la categoría más frecuente en n8n.

---

## 3. Justificación de representatividad

### Marco metodológico

Yin (2018) en *Case Study Research and Applications* establece que el diseño de múltiples
casos puede seguir una lógica de **replicación literal** (los casos producen resultados
similares) o **replicación teórica** (los casos producen resultados contrastantes por
razones predecibles). Este estudio adopta la **replicación teórica**:

- Ambos casos implementan el mismo micro-framework (E1–E4, REG-001…010).
- Las diferencias en dominio, persistencia y notificación predicen diferencias en
  la aplicación concreta de cada regla (p. ej., la clave de idempotencia en IoT es
  la identidad natural del dato, mientras que en Bot es el identificador de la operación).
- Esas diferencias son las que hacen que el micro-framework sea evaluable en condiciones
  variadas, fortaleciendo la validez externa (transferibilidad) de los hallazgos.

### Representatividad en el ecosistema n8n

Las plantillas de referencia seleccionadas (ver `microframework/plantillas/sustentacion-plantillas-referencia.md`)
confirman que:

1. El patrón **bot/chatbot con webhook** es uno de los más frecuentes en el repositorio oficial
   (plantillas ID 2923, 8062, 10040 — combinadas superan 50 000 usos documentados).
2. El patrón **IoT/sensor pipeline** es el segundo más frecuente en el dominio de datos en tiempo real
   (plantillas ID 7248, 4004, 11909).

La elección de estos dos patrones como casos de estudio está respaldada por su prevalencia
verificable en el ecosistema, lo que maximiza la aplicabilidad práctica de los hallazgos.

### Cobertura de antipatrones

Los 9 antipatrones documentados en `microframework/antipatrones.md` (REG-001…009) son
observables en ambos casos as-is, aunque con manifestaciones diferentes:

| Antipatrón | Manifestación en Bot | Manifestación en IoT |
|------------|---------------------|---------------------|
| REG-001 (credenciales) | Token de autenticación hardcodeado | Credenciales PostgreSQL hardcodeadas |
| REG-002 (run_id) | Sin run_id en ningún nodo | Sin run_id en ningún nodo |
| REG-005 (idempotencia) | INSERT sin ON CONFLICT en tickets | 2 INSERTs sin ON CONFLICT |
| REG-007 (dominio) | Clasificación + IO en mismo nodo | Umbrales dispersos en nodos de integración |
| REG-009 (HTTP codes) | Siempre 200, incluso con token inválido | Siempre 200, incluso con campos faltantes |

Esta cobertura cruzada confirma que los dos casos son suficientes para evaluar el
micro-framework en su totalidad.

---

## 4. Límites de generalización

Tal como declara el anteproyecto (§6 Limitaciones):

- Los dos casos **no permiten generalización estadística** a todos los flujos n8n posibles.
- Los hallazgos son **transferibles por similaridad estructural** (*pattern matching*):
  un flujo nuevo con características similares al Bot o al IoT puede adoptarse el
  micro-framework con razonable confianza en los resultados.
- Los flujos de las categorías **Scheduled-batch** y **Hybrid orchestration** no están
  cubiertos directamente; su evaluación requeriría casos adicionales.
- El entorno de laboratorio local limita la extrapolación de métricas de latencia a
  entornos productivos con carga real.

---

## 5. Referencias

- Yin, R.K. (2018). *Case Study Research and Applications: Design and Methods* (6th ed.). SAGE Publications.
- n8n GmbH (2026). Repositorio oficial de plantillas n8n. https://n8n.io/workflows/
- `microframework/plantillas/sustentacion-plantillas-referencia.md` — análisis detallado de las 10 plantillas de referencia
- `../medicion/proyecto-overview.md` §Casos de estudio — descripción funcional de Bot e IoT
