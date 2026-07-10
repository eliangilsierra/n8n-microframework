> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# adr/ — Architecture Decision Records del micro-framework

**Ruta:** `microframework/adr/`
**Pertenece a:** [`microframework/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta registra las **decisiones arquitectónicas del micro-framework en sí** (a
diferencia de `casos-de-estudio/{bot,iot}/adr/`, que registra decisiones específicas de
cada caso de estudio). Cada ADR documenta el contexto, la decisión tomada, las alternativas
consideradas y las consecuencias de una regla, patrón o elección tecnológica del
micro-framework, siguiendo la plantilla en
[`microframework/plantillas/ADR-plantilla.md`](../plantillas/ADR-plantilla.md).

## Contenido de esta carpeta

| ID | Título | Atributo de calidad afectado |
|---|---|---|
| [ADR-MF-001](ADR-MF-001-gestion-secretos-reg001.md) | Gestión de secretos (REG-001) | Seguridad |
| [ADR-MF-002](ADR-MF-002-error-workflow-reg003.md) | Error workflow obligatorio (REG-003) | Fiabilidad |
| [ADR-MF-003](ADR-MF-003-log-estructurado-reg006.md) | Log estructurado por etapa (REG-006) | Operabilidad / Trazabilidad |
| [ADR-MF-004](ADR-MF-004-atam-adaptado-individual.md) | ATAM adaptado a evaluación individual | Trazabilidad metodológica |
| [ADR-MF-005](ADR-MF-005-ecs-fargate-vs-ec2.md) | ECS Fargate vs EC2 (diseño AWS) | Escalabilidad / Operabilidad |
| [ADR-MF-006](ADR-MF-006-n8n-queue-mode.md) | n8n Queue Mode (diseño AWS) | Escalabilidad |
| [ADR-MF-007](ADR-MF-007-rds-multi-az.md) | RDS Multi-AZ (diseño AWS) | Fiabilidad |
| [ADR-MF-008](ADR-MF-008-validador-dos-ediciones.md) | Validador estático en dos ediciones (Lite + Pro) | Mantenibilidad / Trazabilidad |

## Relación con la metodología

Los ADR son el mecanismo de **trazabilidad de decisiones** exigido por REG-010 (todo flujo
tiene al menos un ADR) y por el pilar de mantenibilidad de ISO/IEC 25010. A diferencia de
los ADR de caso de estudio, estos documentan decisiones que aplican **transversalmente** a
todo el micro-framework: por qué una regla se define como obligatoria, o por qué el diseño
de arquitectura en AWS elige un servicio sobre otro. La numeración usa el prefijo `ADR-MF-`
para distinguirlos de los ADR de caso (`ADR-NNN` sin prefijo, en `casos-de-estudio/{caso}/adr/`).

## Navegación

- Padre: [`microframework/`](../README.md)
- Ver también: [`microframework/plantillas/ADR-plantilla.md`](../plantillas/ADR-plantilla.md) · [`casos-de-estudio/bot/adr/`](../../casos-de-estudio/bot/README.md) · [`casos-de-estudio/iot/adr/`](../../casos-de-estudio/iot/README.md)
