> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# Material de Apoyo de la Encuesta — Índice de URLs y Estado

**Versión:** 1.1
**Fecha:** 2026-05-07 (actualizado 2026-07-08)
**Propósito:** Centralizar las URLs públicas del material que los respondentes deben revisar antes de responder la encuesta. Este archivo se actualiza cuando el material se hospeda.

> ✅ **Estado:** el material se generó, hospedó y usó en la campaña real (17–24 de junio de
> 2026; ver `informe-atam-final.md` §8.1). Las URLs públicas específicas (Google Drive, Loom/
> YouTube, Google Form) no se versionan en este repositorio por no ser necesarias para la
> reproducibilidad del análisis — el contenido íntegro del material está en las fuentes
> Markdown/PDF de esta carpeta y los datos recolectados en `medicion/encuesta-validacion/`.

---

## Material requerido

| Archivo | Tipo | Tiempo del respondente | Hosting sugerido | URL pública |
|---|---|:---:|---|---|
| `resumen-proyecto.md` | Fuente Markdown del borrador inicial de 4 páginas | — | (no se publica) | — |
| `guia-referencia-tecnica.md` | Transcripción legible del PDF efectivamente usado en la encuesta | — | (no se publica) | — |
| `guia-referencia-tecnica.pdf` | **PDF efectivamente revisado por el panel** (Sección 1 del instrumento) | 5 min | Google Drive público | ✅ presente en el repo · hospedado y usado en campaña (URL no versionada) |
| `guion-video.md` | Guion del video corto | — | (no se publica) | — |
| `video-presentacion.mp4` | Video de 5 minutos grabado del guion | 5 min | Loom o YouTube no listado | ✅ grabado y usado en campaña (URL no versionada) |
| `diagrama-comparativo.md` | Fuente Mermaid de los diagramas | — | (no se publica) | — |
| `diagrama-comparativo.png` | Render PNG embebido en el PDF | — | (en el PDF) | — |

> ℹ️ **Nota de reconciliación.** El borrador inicial `resumen-proyecto.md`/`.pdf` (planeado en la
> Fase 7) fue reemplazado en la práctica por `guia-referencia-tecnica.pdf`, el documento que el
> panel de expertos efectivamente revisó (ver `instrumento-encuesta.md` §Sección 1). Se conserva
> `resumen-proyecto.md` como fuente del borrador para trazabilidad histórica, pero la referencia
> canónica y autoritativa del material de apoyo es `guia-referencia-tecnica.pdf` / `.md`.

---

## Generación de los artefactos publicables

### 1. PDF a partir del Markdown

Opciones:
- **Pandoc:** `pandoc resumen-proyecto.md -o resumen-proyecto.pdf --pdf-engine=xelatex`
- **VS Code + extensión "Markdown PDF":** botón derecho → Export PDF
- **Typora:** File → Export → PDF
- **Manual:** abrir en navegador → imprimir a PDF (cuidando paginación)

**Verificación tras generar:**
- 4 páginas exactas (puede requerir ajustar tamaño de letra o márgenes)
- Diagrama comparativo visible en página 2
- Tabla de métricas legible en página 3
- Sin texto cortado por saltos de página

### 2. Video de 5 minutos

Herramientas sugeridas:
- **Loom** (recomendado): graba pantalla + cámara, genera enlace público al instante
- **OBS Studio** (open source): control completo, requiere subir luego a YouTube no listado
- **Quicktime** (Mac) / **Xbox Game Bar** (Windows): captura simple de pantalla

**Verificación tras grabar:**
- Duración entre 5:00 y 7:00 minutos
- Audio claro (sin ecos, sin ruidos de fondo molestos)
- Imagen a 1080p mínimo
- Subtítulos en YouTube (auto-generados está bien para encuesta académica)

### 3. Diagrama PNG

Convertir el código Mermaid de `diagrama-comparativo.md` usando:
- **Mermaid Live Editor:** https://mermaid.live → exportar PNG en alta resolución
- **VS Code + extensión "Markdown Preview Mermaid Support":** capturar el preview
- **CLI:** `mmdc -i diagrama-comparativo.md -o diagrama.png -w 1920`

---

## Checklist de publicación — completado ✓

Ejecutado antes de difundir la encuesta (17 de junio de 2026):

- [x] PDF generado y subido a Google Drive
- [x] Permisos del PDF: "Cualquier persona con el enlace puede ver"
- [x] URL del PDF copiada y verificada en navegación anónima
- [x] Video grabado y subido a Loom/YouTube
- [x] Permisos del video: público o no listado con enlace
- [x] URL del video copiada y verificada
- [x] URLs sustituidas en el instrumento de encuesta y en las plantillas de difusión al momento de enviarlas (los archivos versionados en `instrumento-encuesta.md` y `plan-difusion.md` conservan los tokens `[URL_PDF]`/`[URL_VIDEO]`/`[URL_GOOGLE_FORM]` como plantilla reutilizable, no como pendiente)
- [x] Test de descarga del PDF desde un navegador sin sesión de Google
- [x] Test de reproducción del video desde un navegador sin sesión

---

## URLs definitivas

Las URLs públicas reales (Google Drive, Loom/YouTube, Google Form) se usaron para la campaña
del 17–24 de junio de 2026 pero **no se versionan en este repositorio**: no son necesarias para
reproducir el análisis (los datos recolectados y el material fuente ya están versionados) y
evitan depender de enlaces externos que pueden expirar o cambiar de permisos.
