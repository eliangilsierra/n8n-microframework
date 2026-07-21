> 🌐 **Language / Idioma:** English · [Español](README.md)

# Survey Support Material — URL Index and Status

**Version:** 1.1
**Date:** 2026-05-07 (updated 2026-07-08)
**Purpose:** Centralize the public URLs of the material that respondents must review before answering the survey. This file is updated once the material is hosted.

> ✅ **Status:** the material was generated, hosted, and used in the real campaign (June 17–24,
> 2026; see `informe-atam-final.md` §8.1). The specific public URLs (Google Drive, Loom/YouTube,
> Google Form) are not versioned in this repository since they are not needed for the analysis's
> reproducibility — the full material content is in the Markdown/PDF sources in this folder and
> the collected data is in `medicion/encuesta-validacion/`.

---

## Required material

| File | Type | Respondent time | Suggested hosting | Public URL |
|---|---|:---:|---|---|
| `resumen-proyecto.md` | Markdown source of the initial 4-page draft | — | (not published) | — |
| `guia-referencia-tecnica.md` | Readable transcription of the PDF actually used in the survey | — | (not published) | — |
| `guia-referencia-tecnica.pdf` | **PDF actually reviewed by the panel** (Section 1 of the instrument) | 5 min | Public Google Drive | ✅ present in the repo · hosted and used in campaign (URL not versioned) |
| `guion-video.md` | Script for the short video | — | (not published) | — |
| `video-presentacion.mp4` | 5-minute video recorded from the script | 5 min | Loom or unlisted YouTube | ✅ recorded and used in campaign (URL not versioned) |
| `diagrama-comparativo.md` | Mermaid source of the diagrams | — | (not published) | — |
| `diagrama-comparativo.png` | PNG render embedded in the PDF | — | (in the PDF) | — |

> ℹ️ **Reconciliation note.** The initial draft `resumen-proyecto.md`/`.pdf` (planned in Phase 7)
> was in practice replaced by `guia-referencia-tecnica.pdf`, the document the expert panel
> actually reviewed (see `instrumento-encuesta.en.md` §Section 1). `resumen-proyecto.md` is kept
> as the draft source for historical traceability, but the canonical and authoritative reference
> for the support material is `guia-referencia-tecnica.pdf` / `.md`.

---

## Generating the publishable artifacts

### 1. PDF from the Markdown

Options:
- **Pandoc:** `pandoc resumen-proyecto.md -o resumen-proyecto.pdf --pdf-engine=xelatex`
- **VS Code + "Markdown PDF" extension:** right click → Export PDF
- **Typora:** File → Export → PDF
- **Manual:** open in a browser → print to PDF (watching pagination)

**Verification after generating:**
- Exactly 4 pages (may require adjusting font size or margins)
- Comparative diagram visible on page 2
- Metrics table legible on page 3
- No text cut off by page breaks

### 2. 5-minute video

Suggested tools:
- **Loom** (recommended): records screen + camera, generates a public link instantly
- **OBS Studio** (open source): full control, requires uploading afterward to unlisted YouTube
- **Quicktime** (Mac) / **Xbox Game Bar** (Windows): simple screen capture

**Verification after recording:**
- Duration between 5:00 and 7:00 minutes
- Clear audio (no echo, no distracting background noise)
- Image at 1080p minimum
- Subtitles on YouTube (auto-generated is fine for an academic survey)

### 3. PNG diagram

Convert the Mermaid code from `diagrama-comparativo.md` using:
- **Mermaid Live Editor:** https://mermaid.live → export high-resolution PNG
- **VS Code + "Markdown Preview Mermaid Support" extension:** capture the preview
- **CLI:** `mmdc -i diagrama-comparativo.md -o diagrama.png -w 1920`

---

## Publication checklist — completed ✓

Executed before disseminating the survey (June 17, 2026):

- [x] PDF generated and uploaded to Google Drive
- [x] PDF permissions: "Anyone with the link can view"
- [x] PDF URL copied and verified in an anonymous browsing session
- [x] Video recorded and uploaded to Loom/YouTube
- [x] Video permissions: public or unlisted with link
- [x] Video URL copied and verified
- [x] URLs substituted in the survey instrument and dissemination templates at send time (the versioned files in `instrumento-encuesta.md` and `plan-difusion.md` keep the `[URL_PDF]`/`[URL_VIDEO]`/`[URL_GOOGLE_FORM]` tokens as a reusable template, not as pending work)
- [x] Download test of the PDF from a browser without a Google session
- [x] Playback test of the video from a browser without a session

---

## Final URLs

The real public URLs (Google Drive, Loom/YouTube, Google Form) were used for the June 17–24,
2026 campaign but **are not versioned in this repository**: they are not needed to reproduce the
analysis (the collected data and source material are already versioned) and avoids depending on
external links that can expire or change permissions.
