"""
analizar_runlogs.py — Análisis visual de run-logs del micro-framework n8n
=========================================================================
Uso:
    python medicion/analizar_runlogs.py
    python medicion/analizar_runlogs.py --output medicion/consolidado/

Descripción:
    Carga los CSVs de run-logs (as-is y/o to-be) de los casos bot e IoT,
    calcula métricas de rendimiento, calidad y conformidad, y genera un
    reporte interactivo HTML con Plotly.

Entradas detectadas automáticamente:
    medicion/run-logs/bot/run-log-bot-as-is.csv
    medicion/run-logs/bot/run-log-bot-to-be.csv
    medicion/run-logs/iot/run-log-iot-as-is.csv
    medicion/run-logs/iot/run-log-iot-to-be.csv

Salida:
    medicion/consolidado/reporte-runlogs.html

Dependencias:
    pip install pandas plotly scipy

Referencia:
    docs/protocolo-evidencias.md §8 Análisis y visualización de run-logs
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime

# ── Verificar dependencias ──────────────────────────────────────────────────
MISSING = []
try:
    import pandas as pd
except ImportError:
    MISSING.append("pandas")
try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
except ImportError:
    MISSING.append("plotly")
try:
    from scipy import stats as scipy_stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

if MISSING:
    print(f"❌  Dependencias faltantes: {', '.join(MISSING)}")
    print("    Instalar con: pip install pandas plotly scipy")
    sys.exit(1)

# ── Constantes ──────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
REPO_ROOT  = SCRIPT_DIR.parent
RUNLOGS_DIR = SCRIPT_DIR / "run-logs"
OUTPUT_DIR  = SCRIPT_DIR / "consolidado"

CASES    = ["bot", "iot"]
VERSIONS = ["as-is", "to-be"]
SETS     = ["A", "B", "C", "D", "E", "F", "G", "I", "J", "K"]

# Comportamiento esperado por (case, version, input_set)
# "success" = HTTP coincide con lo esperado; "fail" = debería fallar por diseño
EXPECTED_STATUS: dict[tuple, str] = {
    # Bot as-is — sin validación estricta (antipatrón)
    ("bot", "as-is", "A"): "success",   # input válido
    ("bot", "as-is", "B"): "success",   # input crítico válido
    ("bot", "as-is", "C"): "fail",      # token ausente → HTTP 401
    ("bot", "as-is", "D"): "success",   # mensaje vacío → as-is acepta (antipatrón REG-003)
    ("bot", "as-is", "E"): "success",   # user_id ausente → as-is acepta (antipatrón REG-003)
    # Bot to-be — validación E1 estricta
    ("bot", "to-be", "A"): "success",
    ("bot", "to-be", "B"): "success",
    ("bot", "to-be", "C"): "fail",      # token ausente → HTTP 400
    ("bot", "to-be", "D"): "fail",      # mensaje vacío → HTTP 400
    ("bot", "to-be", "E"): "fail",      # user_id ausente → HTTP 400
    # IoT as-is — sin validación (antipatrón)
    ("iot", "as-is", "A"): "success",
    ("iot", "as-is", "B"): "success",   # crítico, procesa y alerta
    ("iot", "as-is", "C"): "success",   # campos faltantes → as-is procesa con NaN (antipatrón REG-003)
    ("iot", "as-is", "D"): "success",   # valores en umbral
    ("iot", "as-is", "E"): "success",   # CO2 ausente → as-is procesa (antipatrón REG-003)
    # IoT to-be — validación E1 estricta
    ("iot", "to-be", "A"): "success",
    ("iot", "to-be", "B"): "success",
    ("iot", "to-be", "C"): "fail",      # campos faltantes → HTTP 422
    ("iot", "to-be", "D"): "success",
    ("iot", "to-be", "E"): "fail",      # CO2 ausente → HTTP 422
    # Sets dinámicos F (normal variable) — todos éxito
    ("bot", "as-is", "F"): "success",   ("bot", "to-be", "F"): "success",
    ("iot", "as-is", "F"): "success",   ("iot", "to-be", "F"): "success",
    # Set G (mezcla) — éxito como promedio (la conformidad real es mixta, ver §8)
    ("bot", "as-is", "G"): "mixed",     ("bot", "to-be", "G"): "mixed",
    ("iot", "as-is", "G"): "mixed",     ("iot", "to-be", "G"): "mixed",
    # Set I (degradación) — éxito (todos válidos estructuralmente)
    ("bot", "as-is", "I"): "success",   ("bot", "to-be", "I"): "success",
    ("iot", "as-is", "I"): "success",   ("iot", "to-be", "I"): "success",
    # Set J (extremos) — éxito (válidos numéricamente)
    ("bot", "as-is", "J"): "success",   ("bot", "to-be", "J"): "success",
    ("iot", "as-is", "J"): "success",   ("iot", "to-be", "J"): "success",
    # Set K (duplicados) — éxito HTTP (la diferencia se mide en BD)
    ("bot", "as-is", "K"): "success",   ("bot", "to-be", "K"): "success",
    ("iot", "as-is", "K"): "success",   ("iot", "to-be", "K"): "success",
}

# Paleta de colores del proyecto
COLORS = {
    "success":  "#22c55e",
    "fail":     "#ef4444",
    "bot":      "#6366f1",
    "iot":      "#f59e0b",
    "as-is":    "#64748b",
    "to-be":    "#0ea5e9",
    "warning":  "#f97316",
    "bg":       "#f8fafc",
    "card":     "#ffffff",
    "border":   "#e2e8f0",
    "text":     "#1e293b",
    "muted":    "#64748b",
}

SET_DESCRIPTIONS = {
    "bot": {
        "A": "Input válido (factura)",
        "B": "Incidente crítico (error en pagos)",
        "C": "Token ausente (validación)",
        "D": "Mensaje vacío (boundary)",
        "E": "user_id ausente (boundary)",
        "F": "Tráfico normal variable (200 únicos)",
        "G": "Mezcla industrial 70/15/10/5",
        "I": "Degradación gradual (normal→crítico)",
        "J": "Percentiles extremos p1/p99",
        "K": "Duplicados idempotency_key",
    },
    "iot": {
        "A": "Lectura normal (22.5°C)",
        "B": "Lectura crítica (48.3°C / CO₂ 2100)",
        "C": "Campos faltantes (validación)",
        "D": "Valores en umbral (35°C)",
        "E": "CO₂ ausente (boundary)",
        "F": "Tráfico normal variable (200 únicos)",
        "G": "Mezcla industrial 70/15/10/5",
        "I": "Degradación gradual (normal→crítico)",
        "J": "Percentiles extremos p1/p99",
        "K": "Duplicados idempotency_key",
    },
}

# ── Carga de datos ──────────────────────────────────────────────────────────
def discover_csvs() -> dict[tuple, Path]:
    """Retorna los CSVs existentes como {(case, version): Path}."""
    found = {}
    for case in CASES:
        for version in VERSIONS:
            path = RUNLOGS_DIR / case / f"run-log-{case}-{version}.csv"
            if path.exists():
                found[(case, version)] = path
    return found


def load_csv(path: Path) -> pd.DataFrame:
    """Carga un CSV de run-log y calcula columnas derivadas."""
    df = pd.read_csv(path, parse_dates=["start_ts", "end_ts"])
    df["duration_ms"] = (
        (df["end_ts"] - df["start_ts"]).dt.total_seconds() * 1000
    ).round(2)
    # Normalizar campos opcionales
    df["error_type"] = df["error_type"].fillna("")
    df["notes"]      = df["notes"].fillna("")
    df["commit_hash"] = df["commit_hash"].fillna("").astype(str)
    # Eliminar filas marcadas como inválidas
    valid = df[df["status"] != "invalid"].copy()
    return valid


def load_all(csv_map: dict) -> pd.DataFrame:
    """Concatena todos los CSVs en un único DataFrame."""
    frames = []
    for (case, version), path in csv_map.items():
        df = load_csv(path)
        frames.append(df)
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)

# ── Métricas ────────────────────────────────────────────────────────────────
def compute_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Calcula métricas por (case, version, input_set)."""
    rows = []
    for (case, version, iset), grp in df.groupby(["case", "version", "input_set"]):
        n_total   = len(grp)
        n_success = (grp["status"] == "success").sum()
        n_fail    = (grp["status"] == "fail").sum()
        sr        = n_success / n_total if n_total > 0 else 0.0
        expected  = EXPECTED_STATUS.get((case, version, iset), None)
        if expected == "success":
            expected_sr = 1.0
        elif expected == "fail":
            expected_sr = 0.0
        elif expected == "mixed":
            # Set G y otros mixed: conformidad se evalúa por análisis semántico (§8)
            expected_sr = None
        else:
            expected_sr = None

        durations = grp["duration_ms"].dropna()
        rows.append({
            "case":        case,
            "version":     version,
            "input_set":   iset,
            "n_total":     n_total,
            "n_success":   n_success,
            "n_fail":      n_fail,
            "success_rate": round(sr * 100, 1),
            "expected_status": expected,
            "expected_sr":  expected_sr,
            "conforme":    (expected_sr is not None) and abs(sr - expected_sr) < 0.1,
            "p50_ms":  round(durations.quantile(0.50), 2) if len(durations) else None,
            "p95_ms":  round(durations.quantile(0.95), 2) if len(durations) else None,
            "p99_ms":  round(durations.quantile(0.99), 2) if len(durations) else None,
            "mean_ms": round(durations.mean(), 2) if len(durations) else None,
            "min_ms":  round(durations.min(),  2) if len(durations) else None,
            "max_ms":  round(durations.max(),  2) if len(durations) else None,
        })
    return pd.DataFrame(rows)


def detect_anomalies(df: pd.DataFrame, metrics: pd.DataFrame) -> list[dict]:
    """Detecta anomalías automáticamente. Retorna lista de {severity, msg, detail}."""
    issues = []

    # Conformidad por set
    non_conforme = metrics[~metrics["conforme"] & metrics["expected_status"].notna()]
    for _, row in non_conforme.iterrows():
        exp_label = "100% éxito" if row["expected_status"] == "success" else "100% fallo"
        issues.append({
            "severity": "CRÍTICA",
            "msg": f"[{row['case'].upper()} / {row['version']} / Set {row['input_set']}] "
                   f"No conforme — esperado: {exp_label}, observado: {row['success_rate']:.1f}% éxito",
            "detail": (
                f"N={row['n_total']} | success={row['n_success']} | fail={row['n_fail']}"
            ),
        })

    # commit_hash "unknown"
    for (case, version), grp in df.groupby(["case", "version"]):
        unknown_pct = (grp["commit_hash"].str.lower() == "unknown").mean() * 100
        if unknown_pct > 50:
            issues.append({
                "severity": "ADVERTENCIA",
                "msg": f"[{case.upper()} / {version}] commit_hash='unknown' en {unknown_pct:.0f}% de filas",
                "detail": "Verificar que git esté disponible en el entorno al ejecutar run_corridas.py",
            })

    # N no uniforme por set
    for (case, version), grp in df.groupby(["case", "version"]):
        counts = grp.groupby("input_set").size()
        if counts.std() > 1:
            detail_str = " | ".join([f"Set {s}: {n}" for s, n in counts.items()])
            issues.append({
                "severity": "ADVERTENCIA",
                "msg": f"[{case.upper()} / {version}] N no uniforme entre sets (σ={counts.std():.1f})",
                "detail": detail_str,
            })

    # Notes vacíos
    for (case, version), grp in df.groupby(["case", "version"]):
        empty_notes_pct = (grp["notes"] == "").mean() * 100
        if empty_notes_pct == 100:
            issues.append({
                "severity": "INFO",
                "msg": f"[{case.upper()} / {version}] Campo 'notes' vacío en todas las filas",
                "detail": "Agregar notas cualitativas en la próxima sesión de medición",
            })

    # error_type vacío en fallas
    for (case, version), grp in df.groupby(["case", "version"]):
        fails = grp[grp["status"] == "fail"]
        if len(fails) > 0:
            missing_etype = (fails["error_type"] == "").mean() * 100
            if missing_etype > 0:
                issues.append({
                    "severity": "ADVERTENCIA",
                    "msg": f"[{case.upper()} / {version}] {missing_etype:.0f}% de fallas sin error_type",
                    "detail": f"{int(missing_etype * len(fails) / 100)} filas con status=fail y error_type vacío",
                })

    # Timestamps fuera de orden
    for (case, version), grp in df.groupby(["case", "version"]):
        grp_sorted = grp.sort_values("start_ts")
        if not grp_sorted["start_ts"].is_monotonic_increasing:
            issues.append({
                "severity": "ADVERTENCIA",
                "msg": f"[{case.upper()} / {version}] Timestamps de inicio no están en orden cronológico",
                "detail": "Revisar si hay ejecuciones concurrentes o registros desordenados",
            })

    # Latencias negativas o cero
    neg = df[df["duration_ms"] <= 0]
    if len(neg) > 0:
        issues.append({
            "severity": "CRÍTICA",
            "msg": f"{len(neg)} filas con duration_ms ≤ 0 (timestamps invertidos o inválidos)",
            "detail": f"run_ids: {', '.join(neg['run_id'].head(5).tolist())}",
        })

    return issues

# ── Gráficos ────────────────────────────────────────────────────────────────
def fig_success_bars(df: pd.DataFrame, case: str) -> go.Figure:
    """Barras apiladas success/fail por input_set × version para un case."""
    case_df = df[df["case"] == case].copy()
    versions_present = sorted(case_df["version"].unique())

    fig = go.Figure()
    for version in versions_present:
        ver_df = case_df[case_df["version"] == version]
        sets_data = ver_df.groupby("input_set")["status"].value_counts().unstack(fill_value=0)
        isets = sorted(sets_data.index.tolist())
        successes = [sets_data.loc[s, "success"] if "success" in sets_data.columns else 0 for s in isets]
        fails     = [sets_data.loc[s, "fail"]    if "fail"    in sets_data.columns else 0 for s in isets]
        totals    = [s + f for s, f in zip(successes, fails)]

        desc = SET_DESCRIPTIONS.get(case, {})
        hover_labels = [f"Set {s}<br>{desc.get(s,'')}" for s in isets]

        fig.add_trace(go.Bar(
            name=f"{version} — éxito",
            x=[f"Set {s}<br><span style='font-size:10px'>{desc.get(s,'')[:22]}</span>" for s in isets],
            y=successes,
            marker_color=COLORS["to-be"] if version == "to-be" else COLORS["as-is"],
            opacity=0.9,
            legendgroup=version,
            legendgrouptitle_text=version,
            customdata=list(zip(isets, totals, [version]*len(isets))),
            hovertemplate="<b>%{customdata[2]} / Set %{customdata[0]}</b><br>"
                          "✅ Éxito: %{y}<br>Total: %{customdata[1]}<extra></extra>",
        ))
        fig.add_trace(go.Bar(
            name=f"{version} — fallo",
            x=[f"Set {s}<br><span style='font-size:10px'>{desc.get(s,'')[:22]}</span>" for s in isets],
            y=fails,
            marker_color=COLORS["fail"],
            opacity=0.7 if version == "as-is" else 0.5,
            legendgroup=version,
            customdata=list(zip(isets, totals, [version]*len(isets))),
            hovertemplate="<b>%{customdata[2]} / Set %{customdata[0]}</b><br>"
                          "❌ Fallo: %{y}<br>Total: %{customdata[1]}<extra></extra>",
        ))

    fig.update_layout(
        barmode="stack",
        title=dict(text=f"<b>{case.upper()} — Distribución éxito/fallo por Input Set</b>", x=0.5),
        xaxis_title="Input Set",
        yaxis_title="Número de ejecuciones",
        plot_bgcolor="white",
        paper_bgcolor="white",
        legend=dict(groupclick="toggleitem"),
        margin=dict(t=60, b=80),
        height=400,
    )
    fig.update_xaxes(tickfont_size=11)
    return fig


def fig_pie_status(df: pd.DataFrame, case: str, version: str) -> go.Figure:
    """Pie chart de éxito/fallo para un case+version."""
    sub = df[(df["case"] == case) & (df["version"] == version)]
    counts = sub["status"].value_counts()
    labels = counts.index.tolist()
    values = counts.values.tolist()
    color_map = {"success": COLORS["success"], "fail": COLORS["fail"]}
    colors = [color_map.get(l, "#94a3b8") for l in labels]

    fig = go.Figure(go.Pie(
        labels=[l.capitalize() for l in labels],
        values=values,
        marker_colors=colors,
        hole=0.45,
        textinfo="percent+value",
        hovertemplate="<b>%{label}</b><br>N=%{value} (%{percent})<extra></extra>",
    ))
    fig.update_layout(
        title=dict(text=f"<b>{case.upper()} / {version}</b>", x=0.5, font_size=14),
        showlegend=True,
        margin=dict(t=50, b=20, l=20, r=20),
        height=280,
        paper_bgcolor="white",
    )
    return fig


def fig_boxplot_latency(df: pd.DataFrame, case: str) -> go.Figure:
    """Box plot de latencia por input_set × version."""
    case_df = df[df["case"] == case]
    versions_present = sorted(case_df["version"].unique())

    fig = go.Figure()
    for version in versions_present:
        ver_df = case_df[case_df["version"] == version]
        for iset in sorted(ver_df["input_set"].unique()):
            grp = ver_df[ver_df["input_set"] == iset]["duration_ms"].dropna()
            desc = SET_DESCRIPTIONS.get(case, {}).get(iset, "")
            fig.add_trace(go.Box(
                y=grp,
                name=f"{version} / Set {iset}",
                boxpoints="outliers",
                marker_color=COLORS["to-be"] if version == "to-be" else COLORS["as-is"],
                line_width=1.5,
                hovertemplate=f"<b>{version} / Set {iset}</b><br>{desc}<br>%{{y:.1f}} ms<extra></extra>",
                legendgroup=version,
                legendgrouptitle_text=version if iset == sorted(ver_df["input_set"].unique())[0] else None,
            ))

    fig.update_layout(
        title=dict(text=f"<b>{case.upper()} — Distribución de latencia (ms)</b>", x=0.5),
        yaxis_title="Duración (ms)",
        xaxis_title="Versión / Input Set",
        plot_bgcolor="white",
        paper_bgcolor="white",
        boxmode="group",
        height=420,
        margin=dict(t=60, b=80),
        showlegend=True,
    )
    return fig


def fig_histogram_latency(df: pd.DataFrame, case: str) -> go.Figure:
    """Histograma de distribución de latencias por versión."""
    case_df = df[df["case"] == case]
    versions_present = sorted(case_df["version"].unique())

    fig = go.Figure()
    for version in versions_present:
        grp = case_df[case_df["version"] == version]["duration_ms"].dropna()
        fig.add_trace(go.Histogram(
            x=grp,
            name=version,
            nbinsx=30,
            marker_color=COLORS["to-be"] if version == "to-be" else COLORS["as-is"],
            opacity=0.75,
            hovertemplate=f"<b>{version}</b><br>Rango: %{{x}}<br>Ejecuciones: %{{y}}<extra></extra>",
        ))

    fig.update_layout(
        title=dict(text=f"<b>{case.upper()} — Histograma de latencia</b>", x=0.5),
        xaxis_title="Duración (ms)",
        yaxis_title="Frecuencia",
        barmode="overlay",
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=350,
        margin=dict(t=60, b=60),
    )
    return fig


def fig_comparison_delta(metrics: pd.DataFrame, case: str) -> go.Figure | None:
    """Gráfico de barras con Δ success_rate y Δ latencia p95 entre versiones."""
    c_metrics = metrics[metrics["case"] == case]
    if not all(v in c_metrics["version"].values for v in ["as-is", "to-be"]):
        return None

    asis  = c_metrics[c_metrics["version"] == "as-is"].set_index("input_set")
    tobe  = c_metrics[c_metrics["version"] == "to-be"].set_index("input_set")
    common = sorted(set(asis.index) & set(tobe.index))

    delta_sr  = [tobe.loc[s, "success_rate"] - asis.loc[s, "success_rate"] for s in common]
    delta_p95 = [
        (tobe.loc[s, "p95_ms"] or 0) - (asis.loc[s, "p95_ms"] or 0)
        for s in common
    ]

    fig = make_subplots(rows=1, cols=2, subplot_titles=("Δ Tasa de éxito (%)", "Δ Latencia p95 (ms)"))

    colors_sr  = [COLORS["success"] if d >= 0 else COLORS["fail"] for d in delta_sr]
    colors_p95 = [COLORS["success"] if d <= 0 else COLORS["fail"] for d in delta_p95]

    fig.add_trace(go.Bar(
        x=[f"Set {s}" for s in common], y=delta_sr,
        marker_color=colors_sr, name="Δ Success Rate",
        hovertemplate="Set %{x}<br>Δ Éxito: %{y:+.1f}%<extra></extra>",
    ), row=1, col=1)
    fig.add_trace(go.Bar(
        x=[f"Set {s}" for s in common], y=delta_p95,
        marker_color=colors_p95, name="Δ Latencia p95",
        hovertemplate="Set %{x}<br>Δ p95: %{y:+.1f} ms<extra></extra>",
    ), row=1, col=2)

    fig.add_hline(y=0, line_dash="dot", line_color="gray", row=1, col=1)
    fig.add_hline(y=0, line_dash="dot", line_color="gray", row=1, col=2)

    fig.update_layout(
        title=dict(text=f"<b>{case.upper()} — Mejora to-be vs as-is</b>", x=0.5),
        plot_bgcolor="white", paper_bgcolor="white",
        showlegend=False, height=380, margin=dict(t=80, b=60),
    )
    return fig


def fig_error_types(df: pd.DataFrame, case: str) -> go.Figure | None:
    """Barras apiladas de tipos de error (solo filas fail)."""
    case_df = df[(df["case"] == case) & (df["status"] == "fail")]
    if len(case_df) == 0:
        return None

    versions_present = sorted(case_df["version"].unique())
    error_types = sorted(case_df["error_type"].replace("", "sin_tipo").unique())
    et_colors = {
        "validation":  "#f59e0b",
        "integration": "#ef4444",
        "timeout":     "#8b5cf6",
        "idempotency": "#06b6d4",
        "sin_tipo":    "#94a3b8",
        "unknown":     "#94a3b8",
    }

    fig = go.Figure()
    for et in error_types:
        counts_by_version = []
        for version in versions_present:
            grp = case_df[(case_df["version"] == version) &
                          (case_df["error_type"].replace("", "sin_tipo") == et)]
            counts_by_version.append(len(grp))
        fig.add_trace(go.Bar(
            name=et,
            x=versions_present,
            y=counts_by_version,
            marker_color=et_colors.get(et, "#94a3b8"),
            hovertemplate=f"<b>{et}</b><br>Versión: %{{x}}<br>Fallas: %{{y}}<extra></extra>",
        ))

    fig.update_layout(
        barmode="stack",
        title=dict(text=f"<b>{case.upper()} — Tipos de error en fallas</b>", x=0.5),
        xaxis_title="Versión",
        yaxis_title="Número de fallas",
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=360,
        margin=dict(t=60, b=60),
    )
    return fig


def fig_timeline(df: pd.DataFrame, case: str) -> go.Figure:
    """Scatter temporal de ejecuciones coloreado por status."""
    case_df = df[df["case"] == case].sort_values("start_ts")
    versions_present = sorted(case_df["version"].unique())

    fig = go.Figure()
    for version in versions_present:
        for status in ["success", "fail"]:
            grp = case_df[(case_df["version"] == version) & (case_df["status"] == status)]
            if len(grp) == 0:
                continue
            fig.add_trace(go.Scatter(
                x=grp["start_ts"],
                y=grp["duration_ms"],
                mode="markers",
                name=f"{version} / {status}",
                marker=dict(
                    color=COLORS["success"] if status == "success" else COLORS["fail"],
                    symbol="circle" if version == "as-is" else "diamond",
                    size=7,
                    opacity=0.7,
                ),
                hovertemplate="<b>%{text}</b><br>Inicio: %{x}<br>Duración: %{y:.1f} ms<extra></extra>",
                text=grp["run_id"],
                legendgroup=version,
                legendgrouptitle_text=version if status == "success" else None,
            ))

    fig.update_layout(
        title=dict(text=f"<b>{case.upper()} — Timeline de ejecuciones</b>", x=0.5),
        xaxis_title="Timestamp de inicio",
        yaxis_title="Duración (ms)",
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=380,
        margin=dict(t=60, b=60),
    )
    return fig


def fig_latency_comparison_lines(metrics: pd.DataFrame, case: str) -> go.Figure | None:
    """Líneas de latencia p50/p95 por set para ambas versiones."""
    c = metrics[metrics["case"] == case]
    versions_present = sorted(c["version"].unique())
    if len(versions_present) < 2:
        return None

    fig = go.Figure()
    for version in versions_present:
        ver = c[c["version"] == version].sort_values("input_set")
        fig.add_trace(go.Scatter(
            x=ver["input_set"],
            y=ver["p50_ms"],
            mode="lines+markers",
            name=f"{version} p50",
            line=dict(
                color=COLORS["to-be"] if version == "to-be" else COLORS["as-is"],
                dash="solid",
            ),
            hovertemplate=f"<b>{version} p50</b><br>Set %{{x}}<br>%{{y:.1f}} ms<extra></extra>",
        ))
        fig.add_trace(go.Scatter(
            x=ver["input_set"],
            y=ver["p95_ms"],
            mode="lines+markers",
            name=f"{version} p95",
            line=dict(
                color=COLORS["to-be"] if version == "to-be" else COLORS["as-is"],
                dash="dot",
            ),
            hovertemplate=f"<b>{version} p95</b><br>Set %{{x}}<br>%{{y:.1f}} ms<extra></extra>",
        ))

    fig.update_layout(
        title=dict(text=f"<b>{case.upper()} — Latencia p50/p95 por set (as-is vs to-be)</b>", x=0.5),
        xaxis_title="Input Set",
        yaxis_title="Duración (ms)",
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=380,
        margin=dict(t=60, b=60),
    )
    return fig


# ── HTML helpers ─────────────────────────────────────────────────────────────
def fig_to_div(fig: go.Figure, first: bool = False) -> str:
    return fig.to_html(
        full_html=False,
        include_plotlyjs="cdn" if first else False,
        config={"displayModeBar": True, "scrollZoom": False},
    )


def kpi_card(title: str, value: str, subtitle: str = "", color: str = "#1e293b") -> str:
    return f"""
    <div class="kpi-card">
      <div class="kpi-value" style="color:{color}">{value}</div>
      <div class="kpi-title">{title}</div>
      {f'<div class="kpi-sub">{subtitle}</div>' if subtitle else ""}
    </div>"""


def badge(severity: str) -> str:
    colors = {"CRÍTICA": "#ef4444", "ADVERTENCIA": "#f97316", "INFO": "#3b82f6"}
    bg = colors.get(severity, "#94a3b8")
    return f'<span class="badge" style="background:{bg}">{severity}</span>'


def metrics_table(metrics: pd.DataFrame, case: str) -> str:
    c = metrics[metrics["case"] == case].sort_values(["version", "input_set"])
    rows = ""
    for _, r in c.iterrows():
        conf_icon = "✅" if r["conforme"] else ("❌" if r["expected_status"] is not None else "—")
        exp_label = {
            "success": "100% éxito",
            "fail":    "100% fallo",
            "mixed":   "mixto (ver §8)",
            None: "—"
        }.get(r["expected_status"], "—")
        desc = SET_DESCRIPTIONS.get(case, {}).get(r["input_set"], "")
        rows += f"""
        <tr>
          <td><span class="version-badge {r['version'].replace('-','')}">{r['version']}</span></td>
          <td><b>Set {r['input_set']}</b><br><small>{desc}</small></td>
          <td class="num">{r['n_total']}</td>
          <td class="num" style="color:{COLORS['success']}">{r['n_success']}</td>
          <td class="num" style="color:{COLORS['fail']}">{r['n_fail']}</td>
          <td class="num"><b>{r['success_rate']:.1f}%</b></td>
          <td class="num">{exp_label}</td>
          <td class="num">{conf_icon}</td>
          <td class="num">{r['p50_ms'] if r['p50_ms'] is not None else '—'}</td>
          <td class="num">{r['p95_ms'] if r['p95_ms'] is not None else '—'}</td>
          <td class="num">{r['p99_ms'] if r['p99_ms'] is not None else '—'}</td>
        </tr>"""
    return f"""
    <table class="data-table">
      <thead><tr>
        <th>Versión</th><th>Set</th><th>N</th><th>✅ Éxito</th><th>❌ Fallo</th>
        <th>Tasa éxito</th><th>Esperado</th><th>Conforme</th>
        <th>p50 ms</th><th>p95 ms</th><th>p99 ms</th>
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>"""


def mann_whitney_section(df: pd.DataFrame, case: str) -> str:
    """Genera sección de prueba estadística si scipy está disponible."""
    if not SCIPY_AVAILABLE:
        return "<p class='muted'>scipy no disponible — prueba estadística omitida.</p>"
    c = df[df["case"] == case]
    if not all(v in c["version"].values for v in ["as-is", "to-be"]):
        return "<p class='muted'>Ambas versiones requeridas para la prueba estadística.</p>"
    asis_lat = c[c["version"] == "as-is"]["duration_ms"].dropna()
    tobe_lat = c[c["version"] == "to-be"]["duration_ms"].dropna()
    if len(asis_lat) < 2 or len(tobe_lat) < 2:
        return "<p class='muted'>Datos insuficientes para la prueba estadística.</p>"
    stat, pvalue = scipy_stats.mannwhitneyu(asis_lat, tobe_lat, alternative="two-sided")
    sig = "✅ Diferencia estadísticamente significativa (p < 0.05)" if pvalue < 0.05 else "⚪ Sin diferencia significativa (p ≥ 0.05)"
    return f"""
    <div class="stat-box">
      <h4>Prueba Mann-Whitney U — Latencias as-is vs to-be</h4>
      <table class="stat-table">
        <tr><td>Estadístico U</td><td><b>{stat:,.0f}</b></td></tr>
        <tr><td>p-value</td><td><b>{pvalue:.4f}</b></td></tr>
        <tr><td>Conclusión</td><td><b>{sig}</b></td></tr>
      </table>
      <p class='muted'>α = 0.05 · Hipótesis nula: distribuciones idénticas · Bilateral</p>
    </div>"""


def quality_table(df: pd.DataFrame) -> str:
    rows = ""
    for (case, version), grp in df.groupby(["case", "version"]):
        n = len(grp)
        unknown_hash = (grp["commit_hash"].str.lower() == "unknown").sum()
        empty_notes  = (grp["notes"] == "").sum()
        counts       = grp.groupby("input_set").size()
        n_uniform    = "✅" if counts.std() <= 1 else f"❌ σ={counts.std():.1f}"
        dup_ids      = grp["run_id"].duplicated().sum()
        rows += f"""
        <tr>
          <td>{case.upper()}</td>
          <td><span class="version-badge {version.replace('-','')}">{version}</span></td>
          <td class="num">{n}</td>
          <td class="num {'ok' if unknown_hash==0 else 'bad'}">{n-unknown_hash}/{n}</td>
          <td class="num {'ok' if empty_notes==0 else 'warn'}">{n-empty_notes}/{n}</td>
          <td class="num">{n_uniform}</td>
          <td class="num {'ok' if dup_ids==0 else 'bad'}">{dup_ids}</td>
        </tr>"""
    return f"""
    <table class="data-table">
      <thead><tr>
        <th>Caso</th><th>Versión</th><th>Total filas</th>
        <th>commit_hash ≠ unknown</th><th>notes no vacíos</th>
        <th>N uniforme por set</th><th>IDs duplicados</th>
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>"""


def anomalies_html(anomalies: list[dict]) -> str:
    if not anomalies:
        return "<p style='color:#22c55e'>✅ No se detectaron anomalías.</p>"
    items = ""
    for a in anomalies:
        items += f"""
        <div class="anomaly-item">
          {badge(a['severity'])}
          <div class="anomaly-text">
            <p class="anomaly-msg">{a['msg']}</p>
            <p class="anomaly-detail">{a['detail']}</p>
          </div>
        </div>"""
    return items

# ── Sección 8 — Conformidad semántica ───────────────────────────────────────

DYNAMIC_SETS = {"F", "G", "I", "J", "K"}

SEMANTIC_NOTES = {
    "K": (
        "La conformidad de idempotencia no es observable en el HTTP status (siempre 200). "
        "Se mide ejecutando la consulta SQL post-corrida: "
        "<code>SELECT idempotency_key, COUNT(*) FROM interacciones_bot "
        "GROUP BY idempotency_key HAVING COUNT(*) &gt; 1</code>. "
        "As-is esperado: 100 keys con n=2. To-be esperado: 0 filas (ON CONFLICT DO NOTHING)."
    ),
    "I": (
        "La degradación gradual es intencional: los valores de payload escalan de rango normal "
        "a crítico en los 200 payloads. Se espera que el to-be eleve el nivel de alerta "
        "proporcionalmente (normal → warning → critical). La distribución de latencia "
        "correlaciona con el índice i — artefacto esperado, no anomalía (ver ADR-004)."
    ),
    "G": (
        "Distribución de categorías: 140 normal (70%), 30 urgente (15%), "
        "20 token inválido (10%), 10 boundary (5%). "
        "El as-is acepta los 20 payloads con token inválido (antipatrón REG-001). "
        "El to-be los rechaza con HTTP 400/401. La tasa de éxito HTTP global del set G "
        "puede diferir entre as-is y to-be por esta razón."
    ),
}

REG_RULES = [
    ("REG-001", "Token/credencial hardcodeada", "bot"),
    ("REG-002", "Rate limit in-memory no distribuido", "bot"),
    ("REG-003", "Sin validación de entrada (E1)", "ambos"),
    ("REG-004", "Sin run_id trazable", "ambos"),
    ("REG-005", "INSERT sin idempotencia (ON CONFLICT)", "ambos"),
    ("REG-006", "Log sin estructura JSON", "ambos"),
    ("REG-007", "Credenciales en output de nodo", "iot"),
    ("REG-008", "Umbrales inconsistentes entre nodos", "iot"),
    ("REG-009", "Dual-write sin transacción", "iot"),
    ("REG-010", "Error HTTP 200 en payload inválido", "iot"),
]


def build_section8_semantic_conformance(df: "pd.DataFrame") -> str:
    """Genera la sección HTML §8 de conformidad semántica."""
    dynamic_data = df[df["input_set"].isin(DYNAMIC_SETS)]
    if dynamic_data.empty:
        return ""

    # Descripción introductoria
    intro = """
    <div class="info-box">
      La conformidad semántica mide si el comportamiento observado coincide con el esperado
      según las reglas REG-* del micro-framework. Complementa la conformidad técnica (HTTP status)
      con análisis por distribución de categorías, tendencias de degradación e idempotencia en BD.
    </div>"""

    # Tabla de reglas REG-* afectadas por los sets dinámicos
    reg_rows = ""
    for reg_id, desc, scope in REG_RULES:
        reg_rows += f"""
        <tr>
          <td><b>{reg_id}</b></td>
          <td>{desc}</td>
          <td>{scope}</td>
        </tr>"""

    rules_table = f"""
    <h3>Reglas REG-* evaluadas</h3>
    <table class="data-table">
      <thead><tr><th>Regla</th><th>Descripción</th><th>Alcance</th></tr></thead>
      <tbody>{reg_rows}</tbody>
    </table>"""

    # Una subsección por set dinámico presente en los datos
    set_sections = ""
    for set_letter in ["F", "G", "I", "J", "K"]:
        set_df = dynamic_data[dynamic_data["input_set"] == set_letter]
        if set_df.empty:
            continue

        desc = SET_DESCRIPTIONS.get("bot", {}).get(set_letter, set_letter)
        note = SEMANTIC_NOTES.get(set_letter, "")

        # Tabla por (case, version) del set
        rows = ""
        for (case, version), grp in set_df.groupby(["case", "version"]):
            n_total = len(grp)
            n_success = (grp["status"] == "success").sum()
            n_fail = (grp["status"] == "fail").sum()
            sr = n_success / n_total * 100 if n_total > 0 else 0.0
            exp = EXPECTED_STATUS.get((case, version, set_letter), None)
            exp_label = {"success": "100% éxito", "fail": "100% fallo",
                         "mixed": "mixto", None: "—"}.get(exp, "—")
            p50 = grp["duration_ms"].quantile(0.50) if len(grp) > 0 else None
            p95 = grp["duration_ms"].quantile(0.95) if len(grp) > 0 else None
            p50_s = f"{p50:.0f}" if p50 is not None else "—"
            p95_s = f"{p95:.0f}" if p95 is not None else "—"
            rows += f"""
            <tr>
              <td><span class="case-tag tag-{case}">{case.upper()}</span></td>
              <td><span class="version-badge {version.replace('-','')}">{version}</span></td>
              <td class="num">{n_total}</td>
              <td class="num" style="color:{COLORS['success']}">{n_success}</td>
              <td class="num" style="color:{COLORS['fail']}">{n_fail}</td>
              <td class="num"><b>{sr:.1f}%</b></td>
              <td class="num">{exp_label}</td>
              <td class="num">{p50_s}</td>
              <td class="num">{p95_s}</td>
            </tr>"""

        note_html = f'<div class="info-box" style="margin-top:0.75rem">{note}</div>' if note else ""

        set_sections += f"""
        <h3>Set {set_letter} — {desc}</h3>
        <table class="data-table">
          <thead><tr>
            <th>Caso</th><th>Versión</th><th>N</th>
            <th>Éxito</th><th>Fallo</th><th>Tasa éxito</th>
            <th>Esperado</th><th>p50 ms</th><th>p95 ms</th>
          </tr></thead>
          <tbody>{rows}</tbody>
        </table>
        {note_html}"""

    # Nota sobre Set K — verificación SQL
    k_sql_section = ""
    if "K" in dynamic_data["input_set"].values:
        k_sql_section = """
        <h3>Set K — Verificación de idempotencia en PostgreSQL</h3>
        <div class="stat-box">
          <h4>Consultas de verificación post-corrida</h4>
          <pre style="font-size:0.8rem;background:#f1f5f9;padding:0.75rem;border-radius:6px;overflow-x:auto">
-- Bot: duplicados en interacciones_bot
SELECT idempotency_key, COUNT(*) AS n
FROM interacciones_bot
GROUP BY idempotency_key
HAVING COUNT(*) &gt; 1;

-- IoT: duplicados en lecturas_sensor
SELECT idempotency_key, COUNT(*) AS n
FROM lecturas_sensor
GROUP BY idempotency_key
HAVING COUNT(*) &gt; 1;</pre>
          <table class="stat-table" style="margin-top:0.75rem">
            <tr><td>As-is esperado</td><td><b>100 keys con n=2 (duplica todo)</b></td></tr>
            <tr><td>To-be esperado</td><td><b>0 filas (ON CONFLICT DO NOTHING activo)</b></td></tr>
          </table>
          <p class="muted">Ref: REG-005 — INSERT sin idempotencia | Ver ADR-003</p>
        </div>"""

    return f"""
    <section class="section" id="semantica">
      <h2>8 · Conformidad semántica (sets F, G, I, J, K)</h2>
      {intro}
      {rules_table}
      {set_sections}
      {k_sql_section}
    </section>"""


# ── Ensamblado del HTML ─────────────────────────────────────────────────────
CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; color: #1e293b; }
.header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white; padding: 2rem 2.5rem; }
.header h1 { font-size: 1.7rem; font-weight: 700; }
.header p  { opacity: 0.75; margin-top: 0.25rem; font-size: 0.9rem; }
.nav { background: #1e293b; padding: 0 2.5rem; display: flex; gap: 1.5rem; }
.nav a { color: #94a3b8; text-decoration: none; padding: 0.75rem 0; font-size: 0.85rem;
         border-bottom: 2px solid transparent; }
.nav a:hover { color: white; border-bottom-color: #6366f1; }
.main { max-width: 1400px; margin: 0 auto; padding: 2rem 2.5rem; }
.section { background: white; border: 1px solid #e2e8f0; border-radius: 12px;
           padding: 1.5rem 2rem; margin-bottom: 2rem; }
.section h2 { font-size: 1.15rem; font-weight: 700; color: #1e293b;
              border-left: 4px solid #6366f1; padding-left: 0.75rem; margin-bottom: 1.25rem; }
.section h3 { font-size: 1rem; font-weight: 600; color: #334155; margin: 1.25rem 0 0.75rem; }
.kpi-row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.kpi-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px;
            padding: 1rem 1.5rem; min-width: 160px; flex: 1; }
.kpi-value { font-size: 2rem; font-weight: 800; line-height: 1; }
.kpi-title { font-size: 0.8rem; color: #64748b; margin-top: 0.3rem; text-transform: uppercase; }
.kpi-sub   { font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem; }
.chart-row { display: grid; gap: 1.5rem; }
.chart-row-2 { grid-template-columns: 1fr 1fr; }
.chart-row-3 { grid-template-columns: 1fr 1fr 1fr; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.data-table th { background: #f1f5f9; padding: 0.6rem 0.8rem; text-align: left;
                 font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
.data-table td { padding: 0.55rem 0.8rem; border-bottom: 1px solid #f1f5f9; }
.data-table tr:hover td { background: #f8fafc; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.ok   { color: #22c55e !important; }
.bad  { color: #ef4444 !important; }
.warn { color: #f97316 !important; }
.version-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px;
                 font-size: 0.75rem; font-weight: 600; }
.version-badge.asis   { background: #f1f5f9; color: #475569; }
.version-badge.tobe   { background: #e0f2fe; color: #0369a1; }
.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; color: white;
         font-size: 0.72rem; font-weight: 700; margin-right: 0.5rem; vertical-align: middle; }
.anomaly-item { display: flex; align-items: flex-start; gap: 0.75rem;
                padding: 0.85rem 1rem; border: 1px solid #e2e8f0;
                border-radius: 8px; margin-bottom: 0.6rem; }
.anomaly-msg    { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.anomaly-detail { font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; }
.stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
            padding: 1rem 1.25rem; margin-top: 1rem; }
.stat-box h4 { font-size: 0.9rem; margin-bottom: 0.75rem; }
.stat-table { font-size: 0.85rem; }
.stat-table td { padding: 0.3rem 1rem 0.3rem 0; }
.muted { color: #94a3b8; font-size: 0.8rem; margin-top: 0.5rem; font-style: italic; }
.case-tag { display: inline-block; padding: 0.2rem 0.7rem; border-radius: 20px;
            font-size: 0.8rem; font-weight: 700; color: white; margin-right: 0.5rem; }
.tag-bot { background: #6366f1; }
.tag-iot { background: #f59e0b; }
.info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
            padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.85rem; color: #1e40af; }
@media (max-width: 900px) { .chart-row-2, .chart-row-3 { grid-template-columns: 1fr; }
  .kpi-card { min-width: 140px; } }
"""


def build_report(df: pd.DataFrame, metrics: pd.DataFrame,
                 anomalies: list[dict], csv_map: dict, output_path: Path) -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    first_fig = True
    sections  = []

    def render(fig, note_first=False):
        nonlocal first_fig
        html = fig_to_div(fig, first=first_fig)
        first_fig = False
        return html

    # ── Sección 0 — Resumen ejecutivo ──────────────────────────────────────
    kpis = ""
    for (case, version), grp in df.groupby(["case", "version"]):
        n = len(grp)
        sr = (grp["status"] == "success").mean() * 100
        med = grp["duration_ms"].median()
        conformes = metrics[
            (metrics["case"] == case) & (metrics["version"] == version)
        ]["conforme"]
        all_ok = conformes.all() if len(conformes) > 0 else False
        semaforo = "✅" if all_ok else "⚠️"
        kpis += kpi_card(
            f"{case.upper()} / {version}",
            f"{sr:.0f}%",
            f"{n} ejecuciones · p50={med:.0f}ms · {semaforo}",
            COLORS["success"] if sr >= 70 else COLORS["fail"],
        )

    # Total anomalías por severidad
    crits  = sum(1 for a in anomalies if a["severity"] == "CRÍTICA")
    warns  = sum(1 for a in anomalies if a["severity"] == "ADVERTENCIA")
    infos  = sum(1 for a in anomalies if a["severity"] == "INFO")
    kpis += kpi_card("Anomalías detectadas",
                     f"{crits}C / {warns}W / {infos}I",
                     "Críticas / Advertencias / Info",
                     COLORS["fail"] if crits > 0 else (COLORS["warning"] if warns > 0 else COLORS["success"]))

    datasets_loaded = " &nbsp;|&nbsp; ".join(
        f'<span class="case-tag tag-{case}">{case.upper()}</span><b>{version}</b> ({len(df[(df.case==case)&(df.version==version)])} runs)'
        for (case, version) in sorted(csv_map.keys())
    )

    sections.append(f"""
    <section class="section" id="resumen">
      <h2>1 · Resumen ejecutivo</h2>
      <div class="info-box">📂 Datasets cargados: {datasets_loaded}</div>
      <div class="kpi-row">{kpis}</div>
    </section>""")

    # ── Secciones por caso ──────────────────────────────────────────────────
    for case in [c for c in CASES if c in df["case"].values]:
        case_label = f'<span class="case-tag tag-{case}">{case.upper()}</span>'

        # S2 Distribución
        f_bars = render(fig_success_bars(df, case))

        # S2 Pies
        pie_divs = ""
        for version in sorted(df[df["case"] == case]["version"].unique()):
            pie_divs += render(fig_pie_status(df, case, version))

        # S3 Latencia
        f_box  = render(fig_boxplot_latency(df, case))
        f_hist = render(fig_histogram_latency(df, case))
        mw_html = mann_whitney_section(df, case)

        # S4 Comparación (si aplica)
        compare_html = ""
        f_comp_delta = fig_comparison_delta(metrics, case)
        f_comp_lines = fig_latency_comparison_lines(metrics, case)
        if f_comp_delta and f_comp_lines:
            compare_html = f"""
            <h3>Mejora cuantitativa to-be vs as-is</h3>
            <div class="chart-row chart-row-2">
              {render(f_comp_delta)}
              {render(f_comp_lines)}
            </div>"""

        # S5 Tipos de error
        error_fig = fig_error_types(df, case)
        error_html = render(error_fig) if error_fig else "<p class='muted'>Sin fallas registradas.</p>"

        # S6 Timeline
        f_timeline = render(fig_timeline(df, case))

        sections.append(f"""
        <section class="section" id="{case}">
          <h2>Caso {case_label}</h2>

          <h3>Conformidad y latencia por set</h3>
          {metrics_table(metrics, case)}

          <h3>Distribución de resultados</h3>
          {f_bars}
          <div class="chart-row chart-row-{'2' if len(df[df['case']==case]['version'].unique())>=2 else '1'}">
            {pie_divs}
          </div>

          <h3>Análisis de latencia (ms)</h3>
          <div class="chart-row chart-row-2">
            {f_box}
            {f_hist}
          </div>
          {mw_html}

          {compare_html}

          <h3>Tipos de error</h3>
          {error_html}

          <h3>Timeline de ejecuciones</h3>
          {f_timeline}
        </section>""")

    # ── S7 Calidad de datos ─────────────────────────────────────────────────
    sections.append(f"""
    <section class="section" id="calidad">
      <h2>7 · Calidad de datos</h2>
      {quality_table(df)}

      <h3 style="margin-top:1.5rem">Anomalías detectadas ({len(anomalies)})</h3>
      {anomalies_html(anomalies)}
    </section>""")

    # ── S8 Conformidad semántica ────────────────────────────────────────────
    s8_html = build_section8_semantic_conformance(df)
    if s8_html:
        sections.append(s8_html)

    # ── Ensamblado final ────────────────────────────────────────────────────
    nav_links = '<a href="#resumen">Resumen</a>'
    for case in [c for c in CASES if c in df["case"].values]:
        nav_links += f'<a href="#{case}">{case.upper()}</a>'
    nav_links += '<a href="#calidad">Calidad</a>'
    if s8_html:
        nav_links += '<a href="#semantica">Semántica</a>'

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Análisis Run-Logs — n8n Micro-framework</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>{CSS}</style>
</head>
<body>
  <div class="header">
    <h1>📊 Análisis de Run-Logs — n8n Micro-framework</h1>
    <p>Maestría MGADS · UNAB 2026 · Generado: {ts}</p>
  </div>
  <nav class="nav">{nav_links}</nav>
  <main class="main">
    {''.join(sections)}
    <footer style="text-align:center;color:#94a3b8;font-size:0.75rem;padding:2rem 0 1rem">
      Generado por <code>medicion/analizar_runlogs.py</code> ·
      Ref: <code>docs/protocolo-evidencias.md §8</code>
    </footer>
  </main>
</body>
</html>"""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Análisis visual de run-logs del micro-framework n8n"
    )
    parser.add_argument(
        "--output", type=Path,
        default=OUTPUT_DIR / "reporte-runlogs.html",
        help="Ruta del archivo HTML de salida",
    )
    args = parser.parse_args()
    output_path: Path = args.output
    if output_path.is_dir():
        output_path = output_path / "reporte-runlogs.html"

    print("\n🔍  Buscando CSVs de run-logs...")
    csv_map = discover_csvs()

    if not csv_map:
        print(f"❌  No se encontraron CSVs en {RUNLOGS_DIR}")
        print("    Ejecutar primero: python automatizacion/run_corridas.py")
        sys.exit(1)

    for (case, version), path in sorted(csv_map.items()):
        print(f"   ✅  {case}/{version}  →  {path.relative_to(REPO_ROOT)}")

    missing = [
        f"{c}/{v}" for c in CASES for v in VERSIONS
        if (c, v) not in csv_map
    ]
    for m in missing:
        print(f"   ⚠️   Faltante: {m}")

    print("\n📐  Cargando y calculando métricas...")
    df = load_all(csv_map)
    if df.empty:
        print("❌  Los CSVs están vacíos (solo headers).")
        sys.exit(1)

    metrics   = compute_metrics(df)
    anomalies = detect_anomalies(df, metrics)

    print(f"\n📊  Datos cargados: {len(df)} ejecuciones totales")
    print(f"    Casos: {sorted(df['case'].unique())}")
    print(f"    Versiones: {sorted(df['version'].unique())}")

    print("\n📋  Métricas por set:")
    for _, r in metrics.sort_values(["case", "version", "input_set"]).iterrows():
        conf = "✅" if r["conforme"] else ("❌" if r["expected_status"] else "—")
        print(f"    {r['case']}/{r['version']}/Set {r['input_set']}  "
              f"sr={r['success_rate']:.0f}%  p50={r['p50_ms']}ms  {conf}")

    if anomalies:
        print(f"\n⚠️   {len(anomalies)} anomalías detectadas:")
        for a in anomalies:
            print(f"    [{a['severity']}] {a['msg']}")

    print(f"\n🏗️   Generando reporte HTML...")
    build_report(df, metrics, anomalies, csv_map, output_path)

    size_kb = output_path.stat().st_size // 1024
    print(f"\n✅  Reporte generado: {output_path}  ({size_kb} KB)")
    print("    Abrir en cualquier navegador para ver el análisis completo.\n")


if __name__ == "__main__":
    # Asegurar UTF-8 en consola Windows (PowerShell / cmd sin PYTHONUTF8)
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    main()
