# ADR-{NNN}: {Título de la decisión}

**Estado:** Propuesto | Aceptado | Reemplazado por ADR-XXX
**Fecha:** YYYY-MM-DD
**Caso:** bot | iot
**Atributo de calidad afectado:** Mantenibilidad | Seguridad | Confiabilidad | Trazabilidad

---

## Contexto

{Descripción del problema o situación que requiere la decisión. Incluir el estado actual
del sistema, las restricciones del entorno y por qué no es posible continuar sin tomar
una decisión. Responder: ¿Qué nos obliga a decidir esto ahora?}

---

## Decisión

{Descripción de la decisión tomada. Redactar en tiempo presente y voz activa:
"Usamos X porque Y", "Implementamos Z para resolver W". Ser específico sobre
qué se implementa y cómo.}

---

## Alternativas consideradas

- **{Alternativa 1}:** {Por qué se descartó — incluir trade-off principal}
- **{Alternativa 2}:** {Por qué se descartó — incluir trade-off principal}

---

## Consecuencias

**Positivas:**
- {Consecuencia positiva concreta — cuantificar si es posible}

**Negativas / trade-offs:**
- {Consecuencia negativa o trade-off — describir el costo asumido}

---

## Relación con el micro-framework

{Qué regla o patrón del micro-framework sustenta esta decisión. Referenciar por ID:
REG-001..010, REC-001..006, o nombre de patrón: patron-retry, patron-idempotencia.}

---

<!-- Instrucciones de uso (eliminar al completar el ADR):

1. Copiar este archivo a casos-de-estudio/{caso}/adr/ADR-{NNN}-{nombre-kebab}.md
2. Reemplazar todos los campos entre llaves {}
3. Eliminar las instrucciones (este bloque de comentario)
4. Hacer commit con: [FASE-N] adr: {descripcion breve de la decision}

Ejemplo de nombre de archivo:
  ADR-001-orquestacion-centralizada.md
  ADR-002-gestion-secretos-n8n-credentials.md
  ADR-003-idempotencia-ingesta-iot.md
-->
