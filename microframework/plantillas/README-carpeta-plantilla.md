> 🌐 **Idioma / Language:** Español · [English](README-carpeta-plantilla.en.md)

# Plantilla: README de carpeta

**Pertenece a:** [`microframework/plantillas/`](README.md)

Esta plantilla define la estructura mínima y consistente que debe tener el `README.md` de
**cualquier** carpeta o subcarpeta del repositorio, para que un investigador externo pueda
entender qué es, para qué existe y cómo se relaciona con la metodología sin salir de esa
carpeta. Sigue la misma convención que [`ADR-plantilla.md`](ADR-plantilla.md).

---

## Esqueleto común (todas las variantes)

```markdown
> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# {Título de la carpeta}

**Ruta:** `{ruta/relativa/}`
**Pertenece a:** [{breadcrumb padre}](../README.md)

---

## Qué es y para qué existe

{2-4 oraciones, lenguaje llano, para alguien sin contexto previo del proyecto}

## Contenido de esta carpeta

| Archivo / Subcarpeta | Descripción |
|---|---|
| ... | ... |

## Relación con la metodología

{Cómo se conecta esta carpeta con as-is/to-be, ATAM, etapas E1–E4, o el patrón ADR —
la sección que aplique}

## Navegación

- Anterior: [{...}](...)
- Padre: [{...}](../README.md)
- Siguiente: [{...}](...)
- Ver también: [{...}](...)

---

*Última actualización: {fecha} · Fuente de verdad de avance: [estado-actual.md](.../estado-actual.md)*
```

---

## Variantes según tipo de carpeta

Usar la tabla de decisión para elegir qué añadir a la sección "Relación con la
metodología" y qué tabla extra incluir en "Contenido de esta carpeta".

| Tipo de carpeta | Ejemplos | Qué añadir |
|---|---|---|
| **A — Carpeta de ADR** | `microframework/adr/`, `casos-de-estudio/{bot,iot}/adr/`, `casos-de-estudio/común/adr/` | Tabla con columnas `ID · Título · Estado · Atributo de calidad afectado`; link a [`ADR-plantilla.md`](ADR-plantilla.md); nota sobre la numeración (`ADR-NNN` en casos de estudio vs `ADR-MF-NNN` en el micro-framework) |
| **B — Carpeta as-is/to-be** | `casos-de-estudio/{bot,iot}/as-is/`, `casos-de-estudio/{bot,iot}/to-be/` | Tabla de flujos JSON con la convención `{caso}-{estado}-{etapa}.json`; orden de importación en n8n (ver [`docs/context/convenios-y-reglas.md`](../../docs/context/convenios-y-reglas.md)); en `as-is/` incluir el disclaimer: *"este flujo mantiene antipatrones intencionalmente como línea base; no corregir sin ADR"* |
| **C — Carpeta de datos/evidencia** | `medicion/datasets/`, `medicion/run-logs/{bot,iot}/`, `medicion/cr-logs/{bot,iot}/`, `medicion/consolidado/` | Tabla de esquema (columnas exactas del CSV, ver `convenios-y-reglas.md`); advertencia de inmutabilidad: *"no editar ni borrar filas; ver protocolo de corrección"*; link a [`docs/protocolo-evidencias.md`](../../docs/protocolo-evidencias.md) |
| **D — Carpeta de herramienta/código** | `automatizacion/`, `microframework/validacion/`, `microframework/validacion-pro/`, `infraestructura/mocks/mock-*/` | Bloque de comandos "quickstart"; dependencias necesarias; sección "cómo ejecutar/reproducir" |
| **E — Carpeta de reglas/patrones/convenciones** | `microframework/` (raíz), `microframework/checklists/`, `microframework/convenciones/`, `microframework/patrones/`, `microframework/plantillas/`, `microframework/reglas/`, `docs/context/` | Tabla que mapea el contenido a IDs `REG-*`/`REC-*`/nombre de patrón; un párrafo explicando por qué existe esta carpeta dentro del micro-framework (qué pilar de Clean Architecture o DevSecOps sustenta) |

---

## Banner de idioma — snippet a reutilizar

En el doc en español (arriba del todo, antes del título):
```markdown
> 🌐 **Idioma / Language:** Español · [English](nombre-archivo.en.md)
```

En el doc en inglés:
```markdown
> 🌐 **Language / Idioma:** English · [Español](nombre-archivo.md)
```

Enlazar siempre el nombre de archivo real del par (no asumir `README` si el doc se llama
distinto, p. ej. `notas-tecnicas.md` → `notas-tecnicas.en.md`).

---

## Navegación

- Padre: [`microframework/plantillas/`](README.md)
- Ver también: [`ADR-plantilla.md`](ADR-plantilla.md)
