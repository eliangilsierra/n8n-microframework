# Material de Apoyo de la Encuesta — Índice de URLs y Estado

**Versión:** 1.0
**Fecha:** 2026-05-07
**Propósito:** Centralizar las URLs públicas del material que los respondentes deben revisar antes de responder la encuesta. Este archivo se actualiza cuando el material se hospeda.

---

## Material requerido

| Archivo | Tipo | Tiempo del respondente | Hosting sugerido | URL pública |
|---|---|:---:|---|---|
| `resumen-proyecto.md` | Fuente Markdown del PDF de 4 páginas | — | (no se publica) | — |
| `resumen-proyecto.pdf` | PDF derivado para el respondente | 5 min | Google Drive público | [PENDIENTE] |
| `guion-video.md` | Guion del video corto | — | (no se publica) | — |
| `video-presentacion.mp4` | Video de 5 minutos grabado del guion | 5 min | Loom o YouTube no listado | [PENDIENTE] |
| `diagrama-comparativo.md` | Fuente Mermaid de los diagramas | — | (no se publica) | — |
| `diagrama-comparativo.png` | Render PNG embebido en el PDF | — | (en el PDF) | — |

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

## Checklist de publicación

Antes de difundir la encuesta:

- [ ] PDF generado y subido a Google Drive
- [ ] Permisos del PDF: "Cualquier persona con el enlace puede ver"
- [ ] URL del PDF copiada y verificada en navegación anónima
- [ ] Video grabado y subido a Loom/YouTube
- [ ] Permisos del video: público o no listado con enlace
- [ ] URL del video copiada y verificada
- [ ] URLs actualizadas en este README
- [ ] URLs sustituidas en el instrumento de encuesta (`instrumento-encuesta.md` Sección B encabezado)
- [ ] URLs sustituidas en las plantillas de difusión (`plan-difusion.md`)
- [ ] Test de descarga del PDF desde un navegador sin sesión de Google
- [ ] Test de reproducción del video desde un navegador sin sesión

---

## URLs definitivas (a llenar)

```
URL_PDF      = [PENDIENTE — llenar tras subir]
URL_VIDEO    = [PENDIENTE — llenar tras subir]
URL_FORM     = [PENDIENTE — llenar tras crear Google Form según instrumento-encuesta.md]
```

Una vez llenadas, sustituir todos los `[URL_PDF]`, `[URL_VIDEO]`, `[URL_GOOGLE_FORM]` en:
- `docs/atam/instrumento-encuesta.md` (Sección B encabezado)
- `docs/atam/plan-difusion.md` (todas las plantillas)
