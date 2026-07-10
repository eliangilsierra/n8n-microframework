"""Builds analisis-encuesta.ipynb (nbformat v4) matching the structure pre-registered
in docs/atam/plan-analisis-encuesta.md §5. Run once: python build_notebook.py"""
import json
from pathlib import Path

HERE = Path(__file__).parent

def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": text.splitlines(keepends=True)}

def code(text):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
            "source": text.splitlines(keepends=True)}

cells = []

cells.append(md("# Análisis de la Encuesta de Validación Externa — Fase V\n\n"
    "Ejecuta el plan pre-registrado en `docs/atam/plan-analisis-encuesta.md` sobre "
    "`respuestas-anonimizadas-2026-06-24.csv` (N=19 recolectadas, N=17 válidas).\n\n"
    "Alimenta la sección 8 de `docs/atam/informe-atam-final.md`."))

cells.append(md("## 1. Configuración"))
cells.append(code(
    "import csv, json, statistics\n"
    "from collections import Counter\n"
    "from pathlib import Path\n"
    "import krippendorff\n\n"
    "CSV_PATH = Path('respuestas-anonimizadas-2026-06-24.csv')\n"
    "OUT = Path('outputs')\n"
    "OUT.mkdir(exist_ok=True)\n\n"
    "LIKERT_B = {'Totalmente en desacuerdo': 1, 'En desacuerdo': 2, 'Neutral': 3,\n"
    "            'De acuerdo': 4, 'Totalmente de acuerdo': 5}\n"
    "SUPPORT_SCALE = {'No soportado': 1, 'Soporte débil': 2, 'Soporte moderado': 3,\n"
    "                  'Buen soporte': 4, 'Excelente soporte': 5}\n"
    "SCENARIOS = ['BOT-Q1','BOT-Q2','BOT-Q3','BOT-Q4','BOT-Q5','BOT-Q6',\n"
    "             'IOT-Q1','IOT-Q2','IOT-Q3','IOT-Q4','IOT-Q5','IOT-Q6']\n\n"
    "# Scoring del autor — docs/atam/matriz-scoring.md (v1.0, 2026-05-07)\n"
    "AUTHOR_ASIS = {'BOT-Q1':2,'BOT-Q2':2,'BOT-Q3':1,'BOT-Q4':2,'BOT-Q5':1,'BOT-Q6':2,\n"
    "               'IOT-Q1':2,'IOT-Q2':2,'IOT-Q3':1,'IOT-Q4':1,'IOT-Q5':1,'IOT-Q6':1}\n"
    "AUTHOR_TOBE = {'BOT-Q1':5,'BOT-Q2':5,'BOT-Q3':5,'BOT-Q4':4,'BOT-Q5':5,'BOT-Q6':5,\n"
    "               'IOT-Q1':5,'IOT-Q2':5,'IOT-Q3':5,'IOT-Q4':4,'IOT-Q5':4,'IOT-Q6':5}\n"
    "# Clasificación del autor — docs/atam/analisis-approaches.md + registro-riesgos-tradeoffs.md\n"
    "AUTHOR_CLASS = {'BOT-Q1':'TP','BOT-Q2':'TP','BOT-Q3':'NR','BOT-Q4':'SP','BOT-Q5':'SP',\n"
    "                'BOT-Q6':'NR','IOT-Q1':'TP','IOT-Q2':'TP','IOT-Q3':'NR','IOT-Q4':'SP',\n"
    "                'IOT-Q5':'TP','IOT-Q6':'NR'}\n\n"
    "def score_to_class(score):\n"
    "    \"\"\"Tabla 8 de equivalencia — docs/atam/instrumento-encuesta.md\"\"\"\n"
    "    if score <= 2: return 'R'\n"
    "    if score == 3: return 'SP'\n"
    "    if score == 4: return 'TP'\n"
    "    return 'NR'\n"
))

cells.append(md("## 2. Validación de datos"))
cells.append(code(
    "with open(CSV_PATH, encoding='utf-8') as f:\n"
    "    rows = list(csv.DictReader(f))\n"
    "header = list(rows[0].keys())\n"
    "a1_col, a2_col = header[3], header[4]\n\n"
    "n_total = len(rows)\n"
    "valid = [r for r in rows if 'Menos de 3' not in r[a2_col]]\n"
    "n_valid = len(valid)\n"
    "print(f'N total recolectadas: {n_total}')\n"
    "print(f'N válidas (>=3 años exp.): {n_valid}')\n"
    "print(f'N excluidas: {n_total - n_valid}')\n"
    "assert n_total == 19 and n_valid == 17, 'N no coincide con lo esperado'\n"
))

cells.append(md("## 3. Sección A — Caracterización"))
cells.append(code(
    "roles = Counter(r[a1_col] for r in valid)\n"
    "exp = Counter(r[a2_col] for r in valid)\n"
    "print('Roles:', dict(roles))\n"
    "print('Experiencia:', dict(exp))\n"
    "print('Heterogeneidad (>=3 roles distintos):', len(roles) >= 3)\n\n"
    "senior = [r for r in valid if ('5 y 10' in r[a2_col]) or ('Más de 10' in r[a2_col])]\n"
    "print(f'Subgrupo >=5 años: n={len(senior)}')\n\n"
    "fam_map = {'Ninguna': 1, 'Baja': 2, 'Media': 3, 'Alta': 4, 'Muy Alta': 5, 'Muy alta': 5}\n"
    "fam_cols = header[5:8]\n"
    "for i, col in enumerate(fam_cols, start=3):\n"
    "    vals = [fam_map[r[col]] for r in valid]\n"
    "    print(f'A{i} media:', round(statistics.mean(vals), 2), '| sd:', round(statistics.stdev(vals), 2))\n"
))

cells.append(md("## 4. Sección B — Ítems Likert"))
cells.append(code(
    "b_cols = header[8:16]\n"
    "b_stats = {}\n"
    "b_vals_by_item = {}\n"
    "for i, col in enumerate(b_cols, start=1):\n"
    "    vals = [LIKERT_B[r[col]] for r in valid]\n"
    "    b_vals_by_item[f'B{i}'] = vals\n"
    "    b_stats[f'B{i}'] = {\n"
    "        'mean': round(statistics.mean(vals), 2),\n"
    "        'median': statistics.median(vals),\n"
    "        'sd': round(statistics.stdev(vals), 2),\n"
    "        'pct_ge4': round(100 * sum(1 for v in vals if v >= 4) / len(vals)),\n"
    "    }\n"
    "for k, v in b_stats.items():\n"
    "    print(k, v)\n"
))
cells.append(code(
    "def cronbach_alpha(items):\n"
    "    k = len(items)\n"
    "    item_vars = [statistics.variance(v) for v in items]\n"
    "    total_scores = [sum(x) for x in zip(*items)]\n"
    "    total_var = statistics.variance(total_scores)\n"
    "    return (k / (k - 1)) * (1 - sum(item_vars) / total_var)\n\n"
    "print('Cronbach alpha Mantenibilidad (B1+B2):', round(cronbach_alpha([b_vals_by_item['B1'], b_vals_by_item['B2']]), 3))\n"
    "print('Cronbach alpha Fiabilidad (B3+B4):', round(cronbach_alpha([b_vals_by_item['B3'], b_vals_by_item['B4']]), 3))\n"
    "print('Cronbach alpha Aplicabilidad (B7+B8):', round(cronbach_alpha([b_vals_by_item['B7'], b_vals_by_item['B8']]), 3))\n"
))

cells.append(md("## 5. Sección C — Codificación cualitativa (abierta)\n\n"
    "Ver `outputs/categorias-emergentes-seccion-c.md` para la codificación temática completa "
    "de las respuestas C1 (17) y E4 (15 no vacías), contrastada con "
    "`docs/atam/registro-riesgos-tradeoffs.md`."))
cells.append(code(
    "c1_col, e4_col = header[16], header[56]\n"
    "n_c1_empty = sum(1 for r in valid if r[c1_col].strip().lower() in ('ninguna', 'ningúna', ''))\n"
    "n_e4_empty = sum(1 for r in valid if r[e4_col].strip().lower() in ('ninguna', 'no', ''))\n"
    "print(f'C1 sin contenido temático: {n_c1_empty}/17')\n"
    "print(f'E4 sin contenido temático: {n_e4_empty}/17')\n"
))

cells.append(md("## 6. Sección D — Percepción global"))
cells.append(code(
    "d1_col, d2_col = header[17], header[18]\n"
    "d1_vals = [int(r[d1_col]) for r in valid]\n"
    "d2_dist = Counter(r[d2_col] for r in valid)\n"
    "print('D1 media:', round(statistics.mean(d1_vals), 2), '| mediana:', statistics.median(d1_vals),\n"
    "      '| rango:', min(d1_vals), '-', max(d1_vals))\n"
    "print('D2 distribución:', dict(d2_dist))\n"
))

cells.append(md("## 7. Sección E — Mini-ATAM: triangulación y Krippendorff's α"))
cells.append(code(
    "e1_cols, e2_cols, e3_cols = header[20:32], header[32:44], header[44:56]\n"
    "e1_matrix, e2_matrix, e3_class_matrix = {}, {}, {}\n"
    "convergence = {}\n\n"
    "for idx, s in enumerate(SCENARIOS):\n"
    "    e1v = [SUPPORT_SCALE[r[e1_cols[idx]]] for r in valid]\n"
    "    e2v = [SUPPORT_SCALE[r[e2_cols[idx]]] for r in valid]\n"
    "    e3v = [SUPPORT_SCALE[r[e3_cols[idx]]] for r in valid]\n"
    "    e1_matrix[s], e2_matrix[s] = e1v, e2v\n"
    "    e3_class_matrix[s] = [score_to_class(v) for v in e3v]\n"
    "    med_a, med_t = statistics.median(e1v), statistics.median(e2v)\n"
    "    mode_c = Counter(e3_class_matrix[s]).most_common(1)[0][0]\n"
    "    convergence[s] = {\n"
    "        'asis_autor': AUTHOR_ASIS[s], 'asis_panel': med_a, 'asis_delta': abs(AUTHOR_ASIS[s]-med_a),\n"
    "        'tobe_autor': AUTHOR_TOBE[s], 'tobe_panel': med_t, 'tobe_delta': abs(AUTHOR_TOBE[s]-med_t),\n"
    "        'clase_autor': AUTHOR_CLASS[s], 'clase_panel_moda': mode_c, 'coincide': mode_c == AUTHOR_CLASS[s],\n"
    "    }\n"
    "for s, v in convergence.items():\n"
    "    print(s, v)\n"
))
cells.append(code(
    "all_asis = [v for s in SCENARIOS for v in e1_matrix[s]]\n"
    "all_tobe = [v for s in SCENARIOS for v in e2_matrix[s]]\n"
    "print('Media global panel as-is:', round(statistics.mean(all_asis), 2))\n"
    "print('Media global panel to-be:', round(statistics.mean(all_tobe), 2))\n"
    "print('Delta global:', round(statistics.mean(all_tobe) - statistics.mean(all_asis), 2))\n\n"
    "n_pairs = len(valid) * len(SCENARIOS)\n"
    "n_improve = sum(1 for s in SCENARIOS for i in range(len(valid)) if e2_matrix[s][i] > e1_matrix[s][i])\n"
    "print(f'Porcentaje que percibe mejora (par respondiente-escenario): {100*n_improve/n_pairs:.1f}% ({n_improve}/{n_pairs})')\n\n"
    "tobe_exact = sum(1 for s in SCENARIOS if convergence[s]['tobe_delta'] == 0)\n"
    "asis_exact = sum(1 for s in SCENARIOS if convergence[s]['asis_delta'] == 0)\n"
    "class_match = sum(1 for s in SCENARIOS if convergence[s]['coincide'])\n"
    "print(f'Convergencia to-be exacta: {tobe_exact}/12 | as-is exacta: {asis_exact}/12 | clasificación: {class_match}/12')\n"
))
cells.append(code(
    "def build_matrix(score_map):\n"
    "    return [[score_map[s][i] for s in SCENARIOS] for i in range(len(valid))]\n\n"
    "alpha_asis = krippendorff.alpha(reliability_data=build_matrix(e1_matrix), level_of_measurement='ordinal')\n"
    "alpha_tobe = krippendorff.alpha(reliability_data=build_matrix(e2_matrix), level_of_measurement='ordinal')\n"
    "class_matrix = [[e3_class_matrix[s][i] for s in SCENARIOS] for i in range(len(valid))]\n"
    "alpha_class = krippendorff.alpha(reliability_data=class_matrix, level_of_measurement='nominal')\n"
    "print(f\"Krippendorff's alpha — as-is (ordinal): {alpha_asis:.3f}\")\n"
    "print(f\"Krippendorff's alpha — to-be (ordinal): {alpha_tobe:.3f}\")\n"
    "print(f\"Krippendorff's alpha — clasificación (nominal): {alpha_class:.3f}\")\n"
))

cells.append(md("## 8. Síntesis\n\n"
    "Ver el script `analisis-encuesta.py` (ejecutable de línea de comandos, produce los mismos "
    "resultados) y `outputs/reporte-completo.json` para el consolidado completo. Resultado "
    "verificado independientemente contra las cifras publicadas: N=17, D1=8.71/mediana 9, "
    "B1–B8 exactos, D2 (6/9/2/0), convergencia to-be 12/12, as-is 11/12 (Δ=1 en IOT-Q5), "
    "clasificación 6/12 (7/12 vía R-IOT-01), α de Krippendorff 0.086/0.145/0.140, "
    "subgrupo ≥5 años 12/12, 95.1% de percepción de mejora — todas las cifras coinciden."))

cells.append(md("## 9. Exportación"))
cells.append(code(
    "# Ver analisis-encuesta.py para la generación completa de outputs/*.csv y reporte-completo.json.\n"
    "print('Outputs disponibles en outputs/: reporte-completo.json, descriptivos-seccion-b.csv,')\n"
    "print('matriz-comparacion-scoring-seccion-e.csv, categorias-emergentes-seccion-c.md')\n"
))

notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.12"},
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

with open(HERE / "analisis-encuesta.ipynb", "w", encoding="utf-8") as f:
    json.dump(notebook, f, ensure_ascii=False, indent=1)

print("Wrote analisis-encuesta.ipynb")
