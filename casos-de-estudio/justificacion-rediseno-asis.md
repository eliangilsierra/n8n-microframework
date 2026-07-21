# Justificación del rediseño de flujos as-is

**Versión:** 1.0
**Fecha:** 2026-05-01
**Autor:** Elian Hernando Gil Sierra
**Propósito:** Documentar la validez metodológica del rediseño intencional de los
flujos as-is para garantizar una línea base representativa y auditable.

---

## 1. Problema: flujos originales insuficientes para la línea base

Los flujos originales tenían una complejidad mínima (Bot: ~10 nodos, IoT: ~6 nodos) que
no permitía hacer visibles los antipatrones REG-001 a REG-009. Por ejemplo:

- **REG-001 (credenciales hardcodeadas)** requiere nodos de autenticación y de integración
  con servicios externos. El flujo IoT original de 6 nodos no tenía ninguno.
- **REG-004 (retry en HTTP)** requiere llamadas HTTP externas. El flujo Bot original
  no tenía llamadas a un servicio de tickets externo.
- **REG-007 (lógica en E2)** requiere lógica de negocio dispersa identificable. Los flujos
  originales tenían en el mejor caso un nodo Code con 5 líneas de lógica trivial.

Una línea base que no exhibe el antipatrón no puede servir para medir el impacto de
corregirlo. El rediseño fue necesario para garantizar que la comparación as-is vs. to-be
tuviera significado cuantitativo.

---

## 2. Marco metodológico de validez

Wohlin et al. (2012) en *Experimentation in Software Engineering* establecen que
la línea base de un experimento controlado debe ser **representativa del estado real**
del objeto de estudio, no del estado mínimo posible. Un flujo de 6 nodos no representa
una implementación real de un pipeline IoT productivo; representa un prototipo mínimo
que carece de las características que hacen que los antipatrones sean relevantes.

El mismo criterio aplica a estudios de caso (Yin, 2018): si el caso as-is no exhibe
los problemas que el marco de análisis predice, el caso no es válido como punto de
comparación para evaluar el marco.

---

## 3. Criterios del rediseño

El rediseño cumple tres criterios de validez interna:

### (a) Funcionalidad equivalente
Las mismas entradas y salidas que los flujos originales. El contrato del webhook
(campos requeridos, formato de respuesta) no cambió. Los flujos rediseñados procesan
los mismos Input Sets que los originales.

### (b) Antipatrones verificables
Todos los antipatrones documentados en `microframework/antipatrones.md` (REG-001 a REG-009)
son verificables en los flujos rediseñados mediante:
- Inspección visual del flujo en n8n
- Ejecución del script `microframework/validacion/validar-flujos.mjs`
- Los resultados están documentados en `checklist-arquitectura-resultado.md` por caso

### (c) Trazabilidad completa
Cada nodo añadido tiene un Change Request documentado en `cambios-y-evidencia.md`:
- **Bot:** 4 CR-ASIS (CR-ASIS-001 a 004) con justificación, fecha y commit hash
- **IoT:** 3 CR-ASIS (CR-ASIS-001 a 003) con justificación, fecha y commit hash

Ningún cambio al as-is fue introducido sin registro explícito.

---

## 4. Registro de cambios

Los cambios al as-is están completamente documentados:

| Caso | Archivo | CR-ASIS | Descripción |
|------|---------|---------|-------------|
| Bot | `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` | 001 | Rediseño estructural de 10 a 16 nodos |
| Bot | — | 002 | Ajuste de rate-limit de LIMITE=10 a LIMITE=150 para medición estadística |
| Bot | — | 003 | Ampliación de Input Sets de 5 a 10 sets (A–K) |
| Bot | — | 004 | Adición de endpoint `/api/user/:userId/tickets` al mock-bot |
| IoT | `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` | 001 | Rediseño estructural de 6 a 14 nodos |
| IoT | — | 002 | Remoción de credenciales PG del nodo (REG-001 en versión real; credenciales mock en versión medición) |
| IoT | — | 003 | Ampliación de Input Sets de 5 a 10 sets (A–K) |

---

## 5. Declaración de validez interna

El script de validación estática (`validar-flujos.mjs`) confirma que los flujos
rediseñados violan exactamente las reglas que la literatura de antipatrones predice
para flujos monolíticos ad-hoc:

- Flujos sin separación de responsabilidades → REG-007, REG-008 no cumplen
- Flujos sin gestión de secretos → REG-001 no cumple
- Flujos sin control de idempotencia → REG-005 no cumple
- Flujos sin retry → REG-004 no cumple
- Flujos sin log estructurado → REG-006 no cumple
- Flujos sin flujo de error → REG-003 no cumple
- Flujos sin run_id → REG-002 no cumple

Esta correspondencia entre las predicciones de la literatura y el estado verificado de
los flujos as-is confirma que los flujos rediseñados son una **línea base representativa
y auditable**, adecuada para evaluar el impacto del micro-framework en la comparación
cuantitativa de FASE 6.

---

## 6. Límites del rediseño

- El rediseño no introduce el micro-framework en el as-is. Los flujos as-is permanecen
  como implementaciones monolíticas ad-hoc — la diferencia es solo de complejidad y
  cobertura de antipatrones, no de arquitectura.
- El rediseño no alteró los datos de medición históricos ya registrados antes del
  rediseño. Los run-logs previos al commit de rediseño se identifican como
  `commit_hash="unknown"` (ver `medicion/protocolo-evidencias.md` §9).
- El rediseño no puede garantizar que represente todos los antipatrones posibles en
  flujos n8n reales. Los flujos rediseñados son representativos de la literatura de
  antipatrones documentada en `microframework/antipatrones.md`, no de todos los
  antipatrones existentes en el ecosistema n8n.

---

## 7. Referencias

- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer.
- Yin, R.K. (2018). *Case Study Research and Applications* (6th ed.). SAGE Publications.
- `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` — change-log Bot as-is
- `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` — change-log IoT as-is
- `microframework/validacion/validar-flujos.mjs` — script de verificación estática
- `medicion/protocolo-evidencias.md` §9 — anomalía commit_hash
