> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# aws/ — Diseño de arquitectura AWS (Fase 8, OE4)

**Ruta:** `infraestructura/aws/`
**Pertenece a:** [`infraestructura/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene el **diseño de arquitectura de referencia en AWS** producido en la
Fase 8 (OE4): arquitectura principal, seguridad/IAM, observabilidad, escalabilidad,
estimación de costos y diagramas. El alcance del anteproyecto es un **diseño documentado**,
no un despliegue real; si el proyecto avanzara a implementación, el código de infraestructura
como código (Terraform/CDK) viviría también aquí.

## Contenido de esta carpeta

El índice completo de artefactos está en [`INDEX.md`](INDEX.md). Documentos principales:

- [`arquitectura-aws.md`](arquitectura-aws.md) — arquitectura de referencia principal
- [`seguridad-iam.md`](seguridad-iam.md) — seguridad e IAM
- [`observabilidad-aws.md`](observabilidad-aws.md) — observabilidad
- [`escalabilidad.md`](escalabilidad.md) — escalabilidad
- [`estimacion-costos.md`](estimacion-costos.md) — estimación de costos
- [`diagramas-aws.md`](diagramas-aws.md) — diagramas

## Relación con la metodología

El alcance de la Fase 8 del anteproyecto es un **diseño de referencia documentado**, no un
despliegue real en AWS (ver [`INDEX.md`](INDEX.md) §Alcance). Mantiene la coherencia entre
la estructura del repositorio y el diseño arquitectónico sin anticipar código que no
corresponde al alcance actual.

## Navegación

- Padre: [`infraestructura/`](../README.md)
- Ver también: [`infraestructura/aws/INDEX.md`](INDEX.md) (diseño completo de arquitectura AWS)
