"""
Análisis de la encuesta de validación externa — Fase V.
Ejecuta el plan pre-registrado en docs/atam/plan-analisis-encuesta.md sobre
medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv.

Dependencia externa: pip install krippendorff
Uso: python analisis-encuesta.py
Salidas: medicion/encuesta-validacion/outputs/*.csv
"""
import csv
import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path

import krippendorff

HERE = Path(__file__).parent
CSV_PATH = HERE / "respuestas-anonimizadas-2026-06-24.csv"
OUT = HERE / "outputs"
OUT.mkdir(exist_ok=True)

LIKERT_B = {
    "Totalmente en desacuerdo": 1, "En desacuerdo": 2, "Neutral": 3,
    "De acuerdo": 4, "Totalmente de acuerdo": 5,
}
SUPPORT_SCALE = {
    "No soportado": 1, "Soporte débil": 2, "Soporte moderado": 3,
    "Buen soporte": 4, "Excelente soporte": 5,
}
SCENARIOS = ["BOT-Q1", "BOT-Q2", "BOT-Q3", "BOT-Q4", "BOT-Q5", "BOT-Q6",
             "IOT-Q1", "IOT-Q2", "IOT-Q3", "IOT-Q4", "IOT-Q5", "IOT-Q6"]

# Author's scores from docs/atam/matriz-scoring.md
AUTHOR_ASIS = {"BOT-Q1": 2, "BOT-Q2": 2, "BOT-Q3": 1, "BOT-Q4": 2, "BOT-Q5": 1, "BOT-Q6": 2,
               "IOT-Q1": 2, "IOT-Q2": 2, "IOT-Q3": 1, "IOT-Q4": 1, "IOT-Q5": 1, "IOT-Q6": 1}
AUTHOR_TOBE = {"BOT-Q1": 5, "BOT-Q2": 5, "BOT-Q3": 5, "BOT-Q4": 4, "BOT-Q5": 5, "BOT-Q6": 5,
               "IOT-Q1": 5, "IOT-Q2": 5, "IOT-Q3": 5, "IOT-Q4": 4, "IOT-Q5": 4, "IOT-Q6": 5}
# Author's classification from docs/atam/analisis-approaches.md + registro-riesgos-tradeoffs.md
AUTHOR_CLASS = {"BOT-Q1": "TP", "BOT-Q2": "TP", "BOT-Q3": "NR", "BOT-Q4": "SP", "BOT-Q5": "SP",
                "BOT-Q6": "NR", "IOT-Q1": "TP", "IOT-Q2": "TP", "IOT-Q3": "NR", "IOT-Q4": "SP",
                "IOT-Q5": "TP", "IOT-Q6": "NR"}

def score_to_class(score):
    """Table 8 equivalence, docs/atam/instrumento-encuesta.md"""
    if score <= 2:
        return "R"
    if score == 3:
        return "SP"
    if score == 4:
        return "TP"
    return "NR"

def load_rows():
    with open(CSV_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    header = list(rows[0].keys())
    return rows, header

def main():
    rows, header = load_rows()
    a2_col, a1_col = header[4], header[3]
    n_total = len(rows)
    valid = [r for r in rows if "Menos de 3" not in r[a2_col]]
    n_valid = len(valid)

    report = {"n_total": n_total, "n_valid": n_valid, "n_excluded": n_total - n_valid}

    # ---- Section A: profile ----
    roles = Counter(r[a1_col] for r in valid)
    exp = Counter(r[a2_col] for r in valid)
    fam_cols = header[5:8]  # A3, A4, A5
    fam_ge_media = {}
    fam_stats = {}
    fam_map = {"Ninguna": 1, "Baja": 2, "Media": 3, "Alta": 4, "Muy Alta": 5, "Muy alta": 5}
    for i, col in enumerate(fam_cols, start=3):
        vals = [fam_map[r[col]] for r in valid]
        fam_ge_media[f"A{i}"] = sum(1 for v in vals if v >= 3)
        fam_stats[f"A{i}"] = {
            "mean": round(statistics.mean(vals), 2),
            "sd": round(statistics.stdev(vals), 2),
        }
    report["section_A"] = {
        "roles": dict(roles), "experience": dict(exp),
        "familiarity_ge_media_of_17": fam_ge_media, "familiarity_mean_sd": fam_stats,
    }

    # subgroup >=5 years for robustness checks
    senior = [r for r in valid if ("5 y 10" in r[a2_col]) or ("Más de 10" in r[a2_col])]
    report["n_senior_ge5y"] = len(senior)

    # ---- Section B: Likert ----
    b_cols = header[8:16]
    b_stats = {}
    b_vals_by_item = {}
    for i, col in enumerate(b_cols, start=1):
        vals = [LIKERT_B[r[col]] for r in valid]
        b_vals_by_item[f"B{i}"] = vals
        b_stats[f"B{i}"] = {
            "mean": round(statistics.mean(vals), 2),
            "median": statistics.median(vals),
            "sd": round(statistics.stdev(vals), 2),
            "pct_ge4": round(100 * sum(1 for v in vals if v >= 4) / len(vals)),
        }
    report["section_B"] = b_stats

    # ---- Internal consistency: Cronbach's alpha per thematic pair ----
    def cronbach_alpha(items):
        k = len(items)
        item_vars = [statistics.variance(v) for v in items]
        total_scores = [sum(x) for x in zip(*items)]
        total_var = statistics.variance(total_scores)
        return (k / (k - 1)) * (1 - sum(item_vars) / total_var)

    report["section_B_cronbach_alpha"] = {
        "mantenibilidad_B1_B2": round(cronbach_alpha([b_vals_by_item["B1"], b_vals_by_item["B2"]]), 3),
        "fiabilidad_B3_B4": round(cronbach_alpha([b_vals_by_item["B3"], b_vals_by_item["B4"]]), 3),
        "aplicabilidad_B7_B8": round(cronbach_alpha([b_vals_by_item["B7"], b_vals_by_item["B8"]]), 3),
    }

    # ---- Section C + E4: qualitative coding (open) ----
    c1_col = header[16]
    e4_col = header[56]
    open_texts = {r["respondent_id"]: (r[c1_col].strip(), r[e4_col].strip()) for r in valid}
    report["open_responses_for_coding"] = open_texts

    # ---- Section D ----
    d1_col, d2_col = header[17], header[18]
    d1_vals = [int(r[d1_col]) for r in valid]
    d2_dist = Counter(r[d2_col] for r in valid)
    report["section_D"] = {
        "D1_mean": round(statistics.mean(d1_vals), 2), "D1_median": statistics.median(d1_vals),
        "D1_min": min(d1_vals), "D1_max": max(d1_vals),
        "D2_distribution": dict(d2_dist),
    }

    # ---- Section E: mini-ATAM ----
    e1_cols = header[20:32]
    e2_cols = header[32:44]
    e3_cols = header[44:56]

    e1_matrix, e2_matrix, e3_matrix, e3_class_matrix = {}, {}, {}, {}
    convergence_asis, convergence_tobe, convergence_class = {}, {}, {}
    for idx, scenario in enumerate(SCENARIOS):
        e1_vals = [SUPPORT_SCALE[r[e1_cols[idx]]] for r in valid]
        e2_vals = [SUPPORT_SCALE[r[e2_cols[idx]]] for r in valid]
        e3_vals = [SUPPORT_SCALE[r[e3_cols[idx]]] for r in valid]
        e1_matrix[scenario] = e1_vals
        e2_matrix[scenario] = e2_vals
        e3_matrix[scenario] = e3_vals
        e3_classes = [score_to_class(v) for v in e3_vals]
        e3_class_matrix[scenario] = e3_classes

        med_asis = statistics.median(e1_vals)
        med_tobe = statistics.median(e2_vals)
        convergence_asis[scenario] = {
            "author": AUTHOR_ASIS[scenario], "panel_median": med_asis,
            "panel_range": [min(e1_vals), max(e1_vals)],
            "delta": abs(AUTHOR_ASIS[scenario] - med_asis),
            "converges": abs(AUTHOR_ASIS[scenario] - med_asis) <= 1,
        }
        convergence_tobe[scenario] = {
            "author": AUTHOR_TOBE[scenario], "panel_median": med_tobe,
            "panel_range": [min(e2_vals), max(e2_vals)],
            "delta": abs(AUTHOR_TOBE[scenario] - med_tobe),
            "converges": abs(AUTHOR_TOBE[scenario] - med_tobe) <= 1,
        }
        mode_class = Counter(e3_classes).most_common(1)[0][0]
        convergence_class[scenario] = {
            "author": AUTHOR_CLASS[scenario],
            "panel_mode": mode_class,
            "distribution": dict(Counter(e3_classes)),
            "matches": mode_class == AUTHOR_CLASS[scenario],
        }

    report["section_E"] = {
        "convergence_asis": convergence_asis,
        "convergence_tobe": convergence_tobe,
        "convergence_class": convergence_class,
    }

    # global panel means (as-is / to-be) across all 12 scenarios, all respondents
    all_asis = [v for scenario in SCENARIOS for v in e1_matrix[scenario]]
    all_tobe = [v for scenario in SCENARIOS for v in e2_matrix[scenario]]
    report["section_E"]["panel_global_asis_mean"] = round(statistics.mean(all_asis), 2)
    report["section_E"]["panel_global_tobe_mean"] = round(statistics.mean(all_tobe), 2)
    report["section_E"]["panel_global_delta"] = round(
        statistics.mean(all_tobe) - statistics.mean(all_asis), 2)

    # % of individual (respondent x scenario) ratings where to-be > as-is
    n_pairs = n_valid * len(SCENARIOS)
    n_improve_pairs = sum(
        1 for s in SCENARIOS for r_idx in range(n_valid)
        if e2_matrix[s][r_idx] > e1_matrix[s][r_idx]
    )
    report["section_E"]["pct_perceive_improvement"] = round(100 * n_improve_pairs / n_pairs, 1)
    report["section_E"]["pct_perceive_improvement_n"] = f"{n_improve_pairs}/{n_pairs}"

    # flag ties in classification mode explicitly
    for s in SCENARIOS:
        dist = convergence_class[s]["distribution"]
        top = max(dist.values())
        tied = [k for k, v in dist.items() if v == top]
        convergence_class[s]["mode_is_tie"] = len(tied) > 1
        convergence_class[s]["tied_categories"] = tied if len(tied) > 1 else None

    # Convergence to-be exact count, as-is exact count
    tobe_exact = sum(1 for s in SCENARIOS if convergence_tobe[s]["panel_median"] == convergence_tobe[s]["author"])
    asis_exact = sum(1 for s in SCENARIOS if convergence_asis[s]["panel_median"] == convergence_asis[s]["author"])
    report["section_E"]["tobe_exact_matches"] = f"{tobe_exact}/12"
    report["section_E"]["asis_exact_matches"] = f"{asis_exact}/12"

    # senior subgroup convergence (to-be)
    senior_ids = {r["respondent_id"] for r in senior}
    valid_ids = [r["respondent_id"] for r in valid]
    senior_tobe_matches = 0
    for scenario in SCENARIOS:
        vals = [e2_matrix[scenario][i] for i, rid in enumerate(valid_ids) if rid in senior_ids]
        med = statistics.median(vals)
        if med == AUTHOR_TOBE[scenario]:
            senior_tobe_matches += 1
    report["section_E"]["senior_subgroup_tobe_matches"] = f"{senior_tobe_matches}/12 (n={len(senior)})"

    class_matches = sum(1 for s in SCENARIOS if convergence_class[s]["matches"])
    report["section_E"]["class_mode_matches"] = f"{class_matches}/12"

    # ---- Krippendorff's alpha ----
    # reliability_data shape: (raters, units) -> here raters = respondents, units = scenarios
    def build_matrix(score_map):
        return [[score_map[s][i] for s in SCENARIOS] for i in range(n_valid)]

    alpha_asis = krippendorff.alpha(reliability_data=build_matrix(e1_matrix), level_of_measurement="ordinal")
    alpha_tobe = krippendorff.alpha(reliability_data=build_matrix(e2_matrix), level_of_measurement="ordinal")
    # nominal alpha on recovered class labels
    class_matrix = [[e3_class_matrix[s][i] for s in SCENARIOS] for i in range(n_valid)]
    alpha_class = krippendorff.alpha(reliability_data=class_matrix, level_of_measurement="nominal")

    report["krippendorff"] = {
        "alpha_asis": round(alpha_asis, 3),
        "alpha_tobe": round(alpha_tobe, 3),
        "alpha_classification_nominal": round(alpha_class, 3),
    }

    # ---- write outputs ----
    with open(OUT / "reporte-completo.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    with open(OUT / "descriptivos-seccion-b.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["item", "mean", "median", "sd", "pct_ge4"])
        for k, v in b_stats.items():
            w.writerow([k, v["mean"], v["median"], v["sd"], v["pct_ge4"]])

    with open(OUT / "matriz-comparacion-scoring-seccion-e.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["escenario", "asis_autor", "asis_panel_mediana", "asis_rango", "asis_delta", "asis_converge",
                    "tobe_autor", "tobe_panel_mediana", "tobe_rango", "tobe_delta", "tobe_converge",
                    "clase_autor", "clase_panel_moda", "clase_coincide"])
        for s in SCENARIOS:
            a, t, c = convergence_asis[s], convergence_tobe[s], convergence_class[s]
            w.writerow([s, a["author"], a["panel_median"], f"{a['panel_range'][0]}-{a['panel_range'][1]}", a["delta"], a["converges"],
                        t["author"], t["panel_median"], f"{t['panel_range'][0]}-{t['panel_range'][1]}", t["delta"], t["converges"],
                        c["author"], c["panel_mode"], c["matches"]])

    print(json.dumps({k: v for k, v in report.items() if k != "open_responses_for_coding"}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
