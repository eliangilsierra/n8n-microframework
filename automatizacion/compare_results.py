#!/usr/bin/env python3
"""Genera la tabla comparativa as-is vs to-be a partir de los run-logs.

Lee los 4 CSVs de run-log y produce una tabla markdown con metricas
lado a lado para cada caso (Bot e IoT).

Uso:
    python automatizacion/compare_results.py

Genera: medicion/consolidado/comparacion-YYYY-MM-DD.md
"""
import csv
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.resolve()

CSV_PATHS = {
    ("bot", "as-is"):  REPO_ROOT / "medicion/run-logs/bot/run-log-bot-as-is.csv",
    ("bot", "to-be"):  REPO_ROOT / "medicion/run-logs/bot/run-log-bot-to-be.csv",
    ("iot", "as-is"):  REPO_ROOT / "medicion/run-logs/iot/run-log-iot-as-is.csv",
    ("iot", "to-be"):  REPO_ROOT / "medicion/run-logs/iot/run-log-iot-to-be.csv",
}


# ---------------------------------------------------------------------------
# Carga y calculo
# ---------------------------------------------------------------------------

def load_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                row["_lat_ms"] = (
                    datetime.fromisoformat(row["end_ts"]) -
                    datetime.fromisoformat(row["start_ts"])
                ).total_seconds() * 1000
            except Exception:
                row["_lat_ms"] = None
            rows.append(row)
    return rows


def compute_stats(rows: list[dict], set_letter: str) -> dict:
    subset = [r for r in rows if r.get("input_set") == set_letter]
    n = len(subset)
    if n == 0:
        return {"n": 0, "p50": None, "p95": None, "pct_fail": None}

    lats = [r["_lat_ms"] for r in subset if r["_lat_ms"] is not None]
    fails = sum(1 for r in subset if r.get("status") == "fail")

    p50 = statistics.median(lats) if lats else None
    p95 = sorted(lats)[max(0, int(len(lats) * 0.95) - 1)] if len(lats) >= 2 else (lats[0] if lats else None)
    pct_fail = fails / n * 100

    return {"n": n, "p50": p50, "p95": p95, "pct_fail": pct_fail}


def fmt_ms(v) -> str:
    return f"{v:.0f}" if v is not None else "—"


def fmt_pct(v) -> str:
    return f"{v:.0f}%" if v is not None else "—"


def delta_str(v_asis, v_tobe, lower_is_better: bool = True) -> str:
    if v_asis is None or v_tobe is None:
        return "—"
    diff = v_tobe - v_asis
    pct = (diff / v_asis * 100) if v_asis != 0 else 0
    sign = "+" if diff > 0 else ""
    better = (diff < 0) == lower_is_better
    arrow = "↓" if diff < 0 else "↑"
    return f"{sign}{pct:.0f}% {arrow}"


# ---------------------------------------------------------------------------
# Reporte
# ---------------------------------------------------------------------------

def generate_report(generated_at: str) -> str:
    lines = [
        "# Comparación as-is vs to-be — Métricas de run-log",
        "",
        f"Generado: {generated_at}",
        "Fuente: `medicion/run-logs/`",
        "",
        "> Latencia medida desde el cliente Python (incluye red local + procesamiento n8n).",
        "> Complementar con `metrics-*.md` para duraciones internas de n8n.",
        "",
    ]

    for caso in ["bot", "iot"]:
        rows_asis = load_csv(CSV_PATHS[(caso, "as-is")])
        rows_tobe = load_csv(CSV_PATHS[(caso, "to-be")])

        n_asis = len(rows_asis)
        n_tobe = len(rows_tobe)

        lines.append(f"## Caso {caso.upper()}")
        lines.append("")

        if n_asis == 0 and n_tobe == 0:
            lines.append("_Sin datos registrados aún._")
            lines.append("")
            continue

        lines.append("| Set | N as-is | p50 as-is | p95 as-is | %fail as-is "
                     "| N to-be | p50 to-be | p95 to-be | %fail to-be "
                     "| Δp50 | Δ%fail |")
        lines.append("|-----|---------|-----------|-----------|-------------|"
                     "---------|-----------|-----------|-------------|------|--------|")

        for set_letter in ["A", "B", "C"]:
            sa = compute_stats(rows_asis, set_letter)
            st = compute_stats(rows_tobe, set_letter)

            d_p50   = delta_str(sa["p50"],     st["p50"],     lower_is_better=True)
            d_fail  = delta_str(sa["pct_fail"], st["pct_fail"], lower_is_better=True)

            lines.append(
                f"| {set_letter} "
                f"| {sa['n']} | {fmt_ms(sa['p50'])} ms | {fmt_ms(sa['p95'])} ms | {fmt_pct(sa['pct_fail'])} "
                f"| {st['n']} | {fmt_ms(st['p50'])} ms | {fmt_ms(st['p95'])} ms | {fmt_pct(st['pct_fail'])} "
                f"| {d_p50} | {d_fail} |"
            )

        lines.append("")

        # Totales por version
        total_asis_fail = sum(1 for r in rows_asis if r.get("status") == "fail")
        total_tobe_fail = sum(1 for r in rows_tobe if r.get("status") == "fail")

        lines.append(f"**Total corridas as-is:** {n_asis}  |  "
                     f"**Fallos:** {total_asis_fail} ({total_asis_fail/n_asis*100:.0f}%)" if n_asis else "")
        lines.append(f"**Total corridas to-be:** {n_tobe}  |  "
                     f"**Fallos:** {total_tobe_fail} ({total_tobe_fail/n_tobe*100:.0f}%)" if n_tobe else "")
        lines.append("")

    lines += [
        "## Interpretación de columnas",
        "",
        "| Columna | Descripción |",
        "|---------|-------------|",
        "| Set A | Caso nominal — entrada válida, flujo completo |",
        "| Set B | Caso crítico — valores extremos / urgente |",
        "| Set C | Caso inválido — ausencia de campos obligatorios |",
        "| Δp50 | % de cambio en mediana de latencia (↓ = mejora) |",
        "| Δ%fail | % de cambio en tasa de fallos (↓ = mejora) |",
        "",
        "### Nota sobre Set C en as-is IoT",
        "",
        "El as-is IoT reporta `%fail=0%` para Set C porque no valida campos obligatorios —",
        "procesa la lectura con valores `undefined`. Esto **es el antipatrón** (ausencia de E1),",
        "no un éxito real. El to-be rechaza correctamente con 422.",
        "",
    ]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print()
    print("n8n-microframework — Comparación as-is vs to-be")
    print("-" * 50)
    print()

    for (caso, estado), path in CSV_PATHS.items():
        n = len(load_csv(path))
        status = f"{n} filas" if n > 0 else "vacío"
        print(f"  {caso} {estado}: {status}")

    print()
    generated_at = datetime.now(timezone.utc).isoformat()
    report = generate_report(generated_at)

    out_dir = REPO_ROOT / "medicion" / "consolidado"
    out_dir.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    out_path = out_dir / f"comparacion-{date_str}.md"
    out_path.write_text(report, encoding="utf-8")

    print(f"Reporte guardado: medicion/consolidado/comparacion-{date_str}.md")
    print()


if __name__ == "__main__":
    main()
