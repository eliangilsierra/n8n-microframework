# ADR-002: Umbrales de dominio del to-be y vocabulario oficial del campo `nivel`

**Estado:** Aceptado
**Fecha:** 2026-04-21
**Caso:** iot
**Atributo de calidad afectado:** Adecuación funcional, Mantenibilidad, Trazabilidad

---

## Contexto

El flujo `iot-as-is.json` implementa umbrales de alerta hardcodeados y dispersos en
varios nodos, con los siguientes valores:

| Variable | Nodo as-is | Umbral as-is |
|----------|-----------|--------------|
| Temperatura crítica | 6 (`Temp Critica?`) | `> 35 °C` |
| Humedad alta | 7 (`Humedad Alta?`) | `> 85 %` |
| CO₂ advertencia | 8 (`Determinar Nivel`) | `> 1000 ppm` |
| CO₂ crítico | 8 (`Determinar Nivel`) | `> 1500 ppm` |

Adicionalmente, el flujo as-is produce el valor `nivel: 'advertencia'` (cadena en español)
cuando detecta una condición intermedia, mientras que los contratos
`iot-e2-output.schema.json` e `iot-e4-output.schema.json` declaran el enum como
`["normal", "warning", "critico"]` — mezcla de inglés y español no intencionada.

Para la construcción del to-be y la comparación estadística con el as-is se necesita:

1. **Fijar umbrales definitivos** del to-be que sean consistentes con recomendaciones
   estándar de calidad del aire interior (ASHRAE 62.1, ISO 7730) y estándares de
   confort térmico.
2. **Elegir un vocabulario único** para el campo `nivel` y alinear schemas, flujos y
   run-logs.

La decisión afecta directamente la interpretación de los resultados de FASE 6
(medición comparativa) porque una diferencia en tasa de alertas entre as-is y to-be
podría atribuirse al micro-framework cuando en realidad se debe a un cambio de umbrales.

---

## Decisión

### Vocabulario oficial del campo `nivel`

Adoptamos **`advertencia`** (español) como valor estándar para el nivel intermedio.
El enum oficial es:

```
nivel ∈ { "normal", "advertencia", "critico" }
```

Los tres valores quedan en español para mantener consistencia con el resto del proyecto
(documentación, comentarios de código, notas técnicas — todos en español).

### Umbrales definitivos del to-be

| Variable | Umbral as-is | Umbral to-be | Justificación |
|----------|--------------|--------------|---------------|
| Temperatura crítica | `> 35 °C` | `> 35 °C` | Sin cambio — valor operativo adecuado para almacén frío |
| Humedad advertencia | `> 85 %` | `> 80 %` | ISO 7730 recomienda 30–70 % para confort; 80 % es el umbral inferior de advertencia para riesgo de condensación |
| CO₂ advertencia | `> 1000 ppm` | `> 800 ppm` | ASHRAE 62.1 recomienda < 1000 ppm en espacios ocupados; 800 ppm es el umbral de advertencia con margen de seguridad |
| CO₂ crítico | `> 1500 ppm` | `> 1200 ppm` | >1000 ppm indica ventilación inadecuada; 1200 ppm marca el límite crítico antes del nivel de afectación cognitiva documentado en la literatura |

Los umbrales se centralizan en una **constante `UMBRALES`** en el subflujo E2
(`iot-to-be-e2-dominio`), cumpliendo REG-007 (dominio aislado) y REC-001 (constantes
con nombre).

### Alcance de aplicación

- **Contratos a actualizar (decisión gatillada por este ADR):**
  - `microframework/contratos/iot-e2-output.schema.json` → enum `nivel`
  - `microframework/contratos/iot-e4-output.schema.json` → enum `nivel`
- **Flujos as-is:** no se tocan. El `iot-as-is.json` sigue produciendo `'advertencia'`
  (que ya coincide con el nuevo enum), y los umbrales as-is viejos se preservan como
  parte del antipatrón REG-007 (valores dispersos, distintos de los del to-be).
- **Flujos to-be:** se construyen directamente con el nuevo vocabulario y umbrales
  (ver ADR-001 IoT para la estructura E1–E4).

---

## Alternativas consideradas

- **Vocabulario `warning` (inglés):** estándar internacional en IoT industrial (MQTT,
  AWS IoT, Azure). Descartado: requiere modificar el as-is existente para alinearlo
  con el enum, introduciendo cambio no relacionado con el micro-framework; y rompe la
  consistencia de idioma del resto del proyecto (toda la documentación está en español).

- **Mantener umbrales as-is en el to-be:** evita cualquier diferencia de alertas entre
  versiones atribuible a umbrales, aislando el efecto puro del micro-framework.
  Descartado: no hay mejora medible para ATAM en el atributo "Adecuación funcional", y
  los umbrales as-is no están alineados con estándares (ASHRAE/ISO), lo cual es
  evidencia adicional del antipatrón.

- **Valores mixtos `"normal" / "warning" / "critical"` (inglés total):** consistencia
  interna en inglés pero incoherente con el resto del proyecto. Descartado.

- **Enum ampliado con 4 niveles (añadir `"info"`):** captura más granularidad pero no
  corresponde a ninguna acción diferenciada en E4. Descartado por YAGNI.

---

## Consecuencias

**Positivas:**
- Comparabilidad estadística: en FASE 6 la diferencia de tasa de alertas entre as-is y
  to-be se atribuye correctamente a la combinación de (arquitectura + umbrales
  ajustados), ambos documentados en este ADR + ADR-001 IoT.
- Umbrales del to-be respaldados por estándares (ASHRAE 62.1, ISO 7730) — defensa
  académica sólida frente al director y el comité evaluador.
- El vocabulario `advertencia` ya está presente en el as-is → cambio solo en los
  schemas (2 archivos), no en los flujos (0 archivos).
- REG-007 y REC-001 satisfechas simultáneamente por el patrón "constante `UMBRALES`"
  del subflujo E2.

**Negativas / trade-offs:**
- Comparar el campo `nivel` entre versiones requiere normalización en el script de
  análisis (`medicion/analizar_runlogs.py`) porque el as-is produce `'advertencia'`
  con los umbrales viejos y el to-be con umbrales nuevos → conteos diferentes
  para el mismo payload. Mitigación: el ADR documenta que la diferencia de conteo es
  intencional.
- Un revisor externo podría cuestionar por qué no se adoptó `warning` dado el uso
  internacional. Mitigación: este ADR documenta explícitamente la decisión de idioma
  del proyecto.
- La decisión de umbrales es específica del dominio simulado (almacén con sensores
  ambientales). Cambiar el dominio requiere revisar los umbrales con su propio ADR.

---

## Relación con el micro-framework

- **REG-007 (dominio aislado):** se satisface al centralizar `UMBRALES` en el subflujo
  E2 del to-be. El as-is viola REG-007 al dispersar umbrales en nodos 6, 7 y 8.
- **REC-001 (constantes con nombre):** la constante `UMBRALES` sigue el patrón
  recomendado `const UMBRALES = { TEMP_CRITICA: 35, HUMEDAD: 80, CO2_ADVERTENCIA: 800,
  CO2_CRITICO: 1200 }`.
- **REG-008 (integraciones en E3/E4):** no afectada directamente, pero el routing de
  E4 depende del valor `nivel` → acoplamiento documentado en ADR-004 IoT (routing E4).
- **ADR-001 IoT (separación E1–E4):** este ADR extiende a ADR-001 fijando valores
  concretos que antes estaban descritos solo a nivel conceptual.
- **Referencias cruzadas:**
  - `microframework/contratos/iot-e2-output.schema.json`
  - `microframework/contratos/iot-e4-output.schema.json`
  - `microframework/plantillas/iot-to-be-e2-dominio.json` (implementa la constante)
  - `casos-de-estudio/iot/as-is/notas-tecnicas.md` §inconsistencia de umbrales
