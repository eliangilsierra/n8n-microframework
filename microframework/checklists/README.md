> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# checklists/ — Checklists de verificación binaria

**Ruta:** `microframework/checklists/`
**Pertenece a:** [`microframework/`](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene los **checklists de verificación manual** que se aplican antes de
versionar cualquier flujo to-be. Son plantillas rellenables (formato texto plano con
casillas `[ ]`) que un evaluador completa ítem por ítem, dejando evidencia auditable del
cumplimiento. Complementan al [validador estático](../validacion/README.md), que automatiza
la misma verificación sobre el JSON exportado.

## Contenido de esta carpeta

| Archivo | Verifica |
|---|---|
| [`checklist-arquitectura.md`](checklist-arquitectura.md) | Las 10 reglas obligatorias (REG-001..010) |
| [`checklist-devsecops.md`](checklist-devsecops.md) | 8 ítems de seguridad de credenciales, secretos y superficie de ataque |

## Relación con la metodología

Ambos checklists son la instancia **manual** del mismo criterio que verifica el validador
estático de forma automática — el resultado de aplicar un checklist a un flujo to-be es
evidencia que alimenta la matriz de trazabilidad de cada caso de estudio (columna
"Cobertura checklist" en [`docs/context/proyecto-overview.md`](../../docs/context/proyecto-overview.md)).
Los resultados aplicados a Bot e IoT se archivan en
`casos-de-estudio/{bot,iot}/{as-is,to-be}/checklist-*-resultado.md`.

## Navegación

- Padre: [`microframework/`](../README.md)
- Ver también: [`microframework/reglas/reglas-obligatorias.md`](../reglas/reglas-obligatorias.md) · [`microframework/validacion/`](../validacion/README.md) (verificación automatizada equivalente)
