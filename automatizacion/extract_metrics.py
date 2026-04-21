#!/usr/bin/env python3
"""Extrae metricas de ejecucion desde la API REST de n8n.

Requiere una API Key generada en n8n UI (Settings → API → Create API Key).
Exportar antes de ejecutar:
    export N8N_API_KEY="tu-api-key"
  o agregar N8N_API_KEY=... a infraestructura/.env

Uso:
    python automatizacion/extract_metrics.py

Genera: medicion/consolidado/metrics-YYYY-MM-DD.md
"""
import json
import os
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
    from dotenv import load_dotenv
except ImportError:
    print("Instala dependencias: pip install -r automatizacion/requirements.txt")
    sys.exit(1)

REPO_ROOT = Path(__file__).parent.parent.resolve()
N8N_BASE = "http://localhost:5678/api/v1"

WORKFLOW_NAMES = [
    "BOT-AS-IS - Soporte por Webhook (Ad-hoc)",
    "IOT-AS-IS - Pipeline Sensor (Ad-hoc)",
]

# Nombres de orquestadores to-be (agregar cuando existan en n8n)
WORKFLOW_NAMES_TOBE = [
    "BOT-TO-BE - Chatbot de soporte (Orquestador)",
    "IOT-TO-BE - Pipeline IoT (Orquestador)",
]


# ---------------------------------------------------------------------------
# API Key
# ---------------------------------------------------------------------------

def get_api_key() -> str:
    load_dotenv(REPO_ROOT / "infraestructura" / ".env")
    key = os.environ.get("N8N_API_KEY", "").strip()
    if not key:
        print()
        print("[ERROR] Variable N8N_API_KEY no configurada.")
        print()
        print("Para generar la API Key en n8n:")
        print("  1. Abre http://localhost:5678")
        print("  2. Ve a Settings → n8n API → Create an API key")
        print("  3. Copia el valor y:")
        print("     a) Exporta: export N8N_API_KEY='tu-key'")
        print("     b) O agrega a infraestructura/.env: N8N_API_KEY=tu-key")
        print()
        sys.exit(1)
    return key


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def fetch_executions(api_key: str, limit_per_page: int = 100) -> list[dict]:
    headers = {"X-N8N-API-KEY": api_key, "Accept": "application/json"}
    all_execs: list[dict] = []
    cursor = None

    while True:
        params: dict = {"limit": limit_per_page, "includeData": "false"}
        if cursor:
            params["cursor"] = cursor

        try:
            resp = requests.get(f"{N8N_BASE}/executions", headers=headers,
                                params=params, timeout=15)
        except requests.exceptions.ConnectionError:
            print("[ERROR] n8n no responde. Verifica que esté corriendo.")
            sys.exit(1)

        if resp.status_code == 401:
            print("[ERROR] API Key inválida o expirada.")
            sys.exit(1)
        resp.raise_for_status()

        data = resp.json()
        execs = data.get("data", [])
        all_execs.extend(execs)

        cursor = data.get("nextCursor")
        if not cursor or not execs:
            break

    return all_execs


def filter_by_workflow(execs: list[dict], name: str) -> list[dict]:
    return [e for e in execs if e.get("workflowData", {}).get("name", "") == name]


# ---------------------------------------------------------------------------
# Estadisticas
# ---------------------------------------------------------------------------

def parse_duration_ms(exec_entry: dict) -> float | None:
    started = exec_entry.get("startedAt")
    stopped = exec_entry.get("stoppedAt")
    if not started or not stopped:
        return None
    try:
        fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
        t0 = datetime.strptime(started, fmt).replace(tzinfo=timezone.utc)
        t1 = datetime.strptime(stopped, fmt).replace(tzinfo=timezone.utc)
        return (t1 - t0).total_seconds() * 1000
    except Exception:
        return None


def calculate_stats(execs: list[dict]) -> dict:
    durations = [d for e in execs if (d := parse_duration_ms(e)) is not None]
    statuses = [e.get("status", "unknown") for e in execs]

    n = len(execs)
    n_success = statuses.count("success")
    n_error = statuses.count("error")

    if durations:
        sorted_d = sorted(durations)
        p50 = statistics.median(sorted_d)
        idx95 = max(0, int(len(sorted_d) * 0.95) - 1)
        idx99 = max(0, int(len(sorted_d) * 0.99) - 1)
        p95 = sorted_d[idx95]
        p99 = sorted_d[idx99]
        p_min = sorted_d[0]
        p_max = sorted_d[-1]
    else:
        p50 = p95 = p99 = p_min = p_max = float("nan")

    return {
        "n": n,
        "n_success": n_success,
        "n_error": n_error,
        "pct_error": (n_error / n * 100) if n else 0,
        "p50_ms": p50,
        "p95_ms": p95,
        "p99_ms": p99,
        "min_ms": p_min,
        "max_ms": p_max,
    }


# ---------------------------------------------------------------------------
# Reporte
# ---------------------------------------------------------------------------

def format_report(stats_by_workflow: dict[str, dict], generated_at: str) -> str:
    lines = [
        "# Reporte de métricas de ejecución — n8n API",
        "",
        f"Generado: {generated_at}",
        f"Fuente: `GET {N8N_BASE}/executions`",
        "",
        "| Workflow | N | Éxitos | Fallos | %Fallo | p50 ms | p95 ms | p99 ms | min ms | max ms |",
        "|----------|---|--------|--------|--------|--------|--------|--------|--------|--------|",
    ]
    for name, s in stats_by_workflow.items():
        short = name[:40] + "…" if len(name) > 40 else name

        def fmt(v):
            return f"{v:.0f}" if v == v else "N/A"

        lines.append(
            f"| {short} | {s['n']} | {s['n_success']} | {s['n_error']} "
            f"| {s['pct_error']:.1f}% | {fmt(s['p50_ms'])} | {fmt(s['p95_ms'])} "
            f"| {fmt(s['p99_ms'])} | {fmt(s['min_ms'])} | {fmt(s['max_ms'])} |"
        )

    lines += [
        "",
        "## Notas de interpretación",
        "",
        "- **p50**: mediana de duración end-to-end medida por n8n (incluye overhead interno)",
        "- **p95/p99**: colas de latencia — relevantes para SLOs y análisis ATAM",
        "- **%Fallo**: ejecuciones con status=error / total. En as-is incluye fallos",
        "  estructurales (InfluxDB no disponible, sin manejo de error — antipatrón REG-003/004)",
        "- Complementar con `medicion/run-logs/` para latencia medida desde el cliente",
        "",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print()
    print("n8n-microframework — Extracción de métricas desde API n8n")
    print("-" * 55)
    print()

    api_key = get_api_key()
    print(f"API Key configurada ({'*' * 8}{api_key[-4:]})")

    print("Descargando historial de ejecuciones...")
    all_execs = fetch_executions(api_key)
    print(f"  {len(all_execs)} ejecuciones descargadas")
    print()

    all_names = WORKFLOW_NAMES + WORKFLOW_NAMES_TOBE
    stats_by_workflow: dict[str, dict] = {}

    for name in all_names:
        filtered = filter_by_workflow(all_execs, name)
        if not filtered:
            print(f"  [SKIP] '{name}' — sin ejecuciones registradas")
            continue
        stats = calculate_stats(filtered)
        stats_by_workflow[name] = stats
        print(f"  [OK]   '{name}' — {stats['n']} ejecuciones, p50={stats['p50_ms']:.0f}ms, "
              f"%fallo={stats['pct_error']:.1f}%")

    if not stats_by_workflow:
        print()
        print("[AVISO] No se encontraron ejecuciones para los workflows esperados.")
        print("  Verifica que los flujos estén importados y hayan sido ejecutados.")
        return

    generated_at = datetime.now(timezone.utc).isoformat()
    report = format_report(stats_by_workflow, generated_at)

    out_dir = REPO_ROOT / "medicion" / "consolidado"
    out_dir.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    out_path = out_dir / f"metrics-{date_str}.md"
    out_path.write_text(report, encoding="utf-8")

    print()
    print(f"Reporte guardado: medicion/consolidado/metrics-{date_str}.md")
    print()


if __name__ == "__main__":
    main()
