> 🌐 **Idioma / Language:** Español · [English](README.en.md)

# Datos de la Encuesta de Validación Externa — Panel de Expertos

**Ruta:** `medicion/encuesta-validacion/`
**Pertenece a:** [medicion/](../README.md)

---

## Qué es y para qué existe

Esta carpeta contiene los datos crudos (anonimizados) de la Fase V — validación externa por
panel de expertos — recolectados vía Google Forms entre el 17 y el 24 de junio de 2026 (ver
[`docs/atam/protocolo-encuesta.md`](../../docs/atam/protocolo-encuesta.md) §4.4). Es la fuente
de datos que alimenta la sección 8 de
[`docs/atam/informe-atam-final.md`](../../docs/atam/informe-atam-final.md), ya completada
siguiendo el plan de análisis pre-registrado en
[`docs/atam/plan-analisis-encuesta.md`](../../docs/atam/plan-analisis-encuesta.md).

## Contenido de esta carpeta

| Archivo | Descripción |
|---|---|
| `respuestas-anonimizadas-2026-06-24.csv` | 19 respuestas (filas), 57 columnas. Columna de correo electrónico opcional (F1) eliminada; se agregó `respondent_id` secuencial (R-001…R-019) en su lugar, según el procedimiento de anonimización pre-registrado en `plan-analisis-encuesta.md` §2.2. |
| `analisis-encuesta.py` | Script ejecutable que reproduce íntegramente los resultados de `informe-atam-final.md` §8: estadística descriptiva de Secciones A/B/D, α de Cronbach por pares temáticos, triangulación de la Sección E y α de Krippendorff. |
| `analisis-encuesta.ipynb` | Mismo análisis en formato notebook, ya ejecutado (outputs embebidos), organizado en las mismas 9 secciones que `plan-analisis-encuesta.md` §5. |
| `build_notebook.py` | Genera `analisis-encuesta.ipynb` desde cero — usar solo si se necesita reconstruir el notebook. |
| `requirements.txt` | Única dependencia externa (`krippendorff`) — instalar con `pip install -r requirements.txt` antes de ejecutar. |
| `outputs/` | Resultados consolidados: `reporte-completo.json`, `descriptivos-seccion-b.csv`, `matriz-comparacion-scoring-seccion-e.csv`, `categorias-emergentes-seccion-c.md` (codificación cualitativa manual). |

## Cómo reproducir el análisis

```bash
cd medicion/encuesta-validacion
pip install -r requirements.txt
python analisis-encuesta.py
```

El script solo depende del CSV anonimizado de esta misma carpeta (no requiere el CSV crudo con
correos, que nunca se versiona). La salida por consola y los archivos en `outputs/` deben
coincidir exactamente con las cifras citadas en `informe-atam-final.md` §8 — si no coinciden,
hay una regresión y debe reportarse.

> ⚠️ **El CSV crudo original (con la columna de correo electrónico sin anonimizar) NO se
> commitea a este repositorio**, en cumplimiento del protocolo de anonimato declarado en el
> consentimiento informado de la encuesta (`protocolo-encuesta.md` §3 y §5). Solo 3 de los 19
> respondientes diligenciaron ese campo opcional; esos 3 correos permanecen fuera del control
> de versiones, en poder exclusivo del autor, y se eliminan a los 60 días del cierre de la
> recolección según lo prometido a los respondientes.

## Esquema de columnas del CSV anonimizado

| Rango de columnas | Sección del instrumento | Contenido |
|---|---|---|
| 0 | — | `respondent_id` (R-001…R-019, generado en la anonimización) |
| 1 | — | Marca temporal de envío (Google Forms) |
| 2 | Pantalla 0 | Aceptación del consentimiento informado |
| 3–4 | Sección A | A1 (rol), A2 (años de experiencia) |
| 5–7 | Sección A | Cuadrícula A3-A4-A5 (familiaridad LC/NC, Clean Architecture, evaluación arquitectónica) — 3 columnas, una por fila de la cuadrícula |
| 8–15 | Sección B | Cuadrículas B1–B8 (valoración del framework, 4 cuadrículas de 2 filas) — 8 columnas |
| 16 | Sección C | C1 — pregunta abierta consolidada (riesgos, trade-offs y sugerencias de refinamiento en un solo campo; ver nota en `instrumento-encuesta.md` §Sección C) |
| 17 | Sección D | D1 — calificación global 1–10 |
| 18 | Sección D | D2 — intención de adopción |
| 19 | Sección D | D2-bis — razón (condicional, opcional) |
| 20–31 | Sección E | E1 — scoring AS-IS, 12 columnas (una por escenario BOT-Q1…IOT-Q6) |
| 32–43 | Sección E | E2 — scoring TO-BE, 12 columnas |
| 44–55 | Sección E | E3 — clasificación arquitectónica, 12 columnas (valores de soporte 1–5, no siglas de categoría — ver equivalencia en `instrumento-encuesta.md` §Evolución del instrumento) |
| 56 | Sección E | E4 — comentario libre opcional |

El mapeo completo de cada pregunta a su hipótesis de análisis está en
[`docs/atam/instrumento-encuesta.md`](../../docs/atam/instrumento-encuesta.md) §Apéndice.

## Relación con la metodología

Estos datos son la evidencia externa (tercera fuente de la triangulación metodológica,
junto con la evidencia documental y la cuantitativa de las 8000 corridas) que corrobora o
cuestiona el análisis ATAM del autor. El plan de análisis pre-registrado
(`plan-analisis-encuesta.md`) define, antes de haber visto estos datos, qué pruebas
estadísticas y criterios de interpretación se aplican — el análisis efectivo sobre este CSV
ya se ejecutó (`analisis-encuesta.py` / `.ipynb`) y está documentado en `informe-atam-final.md` §8.

## Navegación

- **Padre:** [medicion/](../README.md)
- **Ver también:** [`docs/atam/protocolo-encuesta.md`](../../docs/atam/protocolo-encuesta.md) · [`docs/atam/instrumento-encuesta.md`](../../docs/atam/instrumento-encuesta.md) · [`docs/atam/plan-analisis-encuesta.md`](../../docs/atam/plan-analisis-encuesta.md)

---
*Última actualización: 2026-07-08 · Fuente de verdad de avance: [estado-actual.md](../../estado-actual.md)*
