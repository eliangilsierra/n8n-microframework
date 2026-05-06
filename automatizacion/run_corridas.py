#!/usr/bin/env python3
"""Ejecuta las corridas de medicion contra los webhooks de n8n.

Uso:
    python automatizacion/run_corridas.py --caso bot --estado as-is --n 10
    python automatizacion/run_corridas.py --caso all --estado all --n 10
    python automatizacion/run_corridas.py --caso iot --estado to-be --n 5 --dry-run

Escribe automaticamente en los run-logs CSV del proyecto.
"""
import argparse
import csv
import json
import secrets
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Forzar UTF-8 en stdout para evitar UnicodeEncodeError en Windows (cp1252)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    import requests
except ImportError:
    print("Instala dependencias: pip install -r automatizacion/requirements.txt")
    sys.exit(1)

REPO_ROOT = Path(__file__).parent.parent.resolve()

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

WEBHOOK_URLS: dict[tuple[str, str], str] = {
    ("bot", "as-is"): "http://localhost:5678/webhook/bot-soporte",
    ("bot", "to-be"): "http://localhost:5678/webhook/bot-support-to-be",
    ("iot", "as-is"): "http://localhost:5678/webhook/iot-sensor",
    ("iot", "to-be"): "http://localhost:5678/webhook/iot-sensor-to-be",
}

CSV_PATHS: dict[tuple[str, str], str] = {
    ("bot", "as-is"): "medicion/run-logs/bot/run-log-bot-as-is.csv",
    ("bot", "to-be"): "medicion/run-logs/bot/run-log-bot-to-be.csv",
    ("iot", "as-is"): "medicion/run-logs/iot/run-log-iot-as-is.csv",
    ("iot", "to-be"): "medicion/run-logs/iot/run-log-iot-to-be.csv",
}

CSV_COLUMNS = ["run_id", "case", "version", "input_set",
               "start_ts", "end_ts", "status", "error_type", "notes", "commit_hash"]

# HTTP code esperado por (caso, estado, set).
# IoT as-is Set C retorna 200 porque el as-is no valida entrada (ESE ES el antipatron).
EXPECTED_HTTP: dict[tuple[str, str, str], int] = {
    ("bot", "as-is", "A"): 200, ("bot", "as-is", "B"): 200, ("bot", "as-is", "C"): 401,
    ("bot", "to-be", "A"): 200, ("bot", "to-be", "B"): 200, ("bot", "to-be", "C"): 400,
    ("iot", "as-is", "A"): 200, ("iot", "as-is", "B"): 200, ("iot", "as-is", "C"): 200,
    ("iot", "to-be", "A"): 200, ("iot", "to-be", "B"): 200, ("iot", "to-be", "C"): 422,
    # Set D — boundary values
    ("bot", "as-is", "D"): 200,  # sin validacion, acepta message vacio
    ("bot", "to-be", "D"): 400,  # E1 rechaza message vacio
    ("iot", "as-is", "D"): 200,  # valores en umbral son validos, acepta
    ("iot", "to-be", "D"): 200,  # boundary values son validos en to-be
    # Set E — campos parciales / faltantes
    ("bot", "as-is", "E"): 200,  # sin validacion, acepta user_id ausente
    ("bot", "to-be", "E"): 400,  # E1 rechaza user_id ausente
    ("iot", "as-is", "E"): 200,  # no valida co2 ausente — antipatron visible
    ("iot", "to-be", "E"): 422,  # E1 requiere co2
    # Set F — tráfico normal variable: todos los payloads son válidos → 200 esperado.
    ("bot", "as-is", "F"): 200,   ("bot", "to-be", "F"): 200,
    ("iot", "as-is", "F"): 200,   ("iot", "to-be", "F"): 200,
    # Set G — mezcla industrial 70/15/10/5. EXPECTED_HTTP=200 es el denominador común,
    # pero ~20 payloads de bot tienen token inválido:
    #   - to-be: E1 los rechaza correctamente con HTTP 400/401 → ~20 runs status="fail".
    #     Estos "fallos" son COMPORTAMIENTO CORRECTO del to-be, no defectos.
    #   - as-is: token hardcodeado (REG-001) devuelve 401 → ~20 runs status="fail" también.
    # Los ~20 fails de Set G en ambas versiones son evidencia de validación E1 activa.
    # La conformidad semántica de G se evalúa en analizar_runlogs.py §8, no aquí.
    ("bot", "as-is", "G"): 200,   ("bot", "to-be", "G"): 200,
    ("iot", "as-is", "G"): 200,   ("iot", "to-be", "G"): 200,
    # Set I — degradación: todos válidos estructuralmente, esperado 200
    ("bot", "as-is", "I"): 200,   ("bot", "to-be", "I"): 200,
    ("iot", "as-is", "I"): 200,   ("iot", "to-be", "I"): 200,
    # Set J — percentiles extremos p1/p99.
    # bot/as-is: sin validación de longitud → acepta todos → 200.
    # bot/to-be: E1 rechaza los 100 payloads con message > 1000 chars con HTTP 400.
    #   EXPECTED_HTTP=200 hace que esos 100 runs aparezcan como "fail" en el run-log.
    #   Comportamiento CORRECTO del to-be. Conformidad semántica evaluada en §8.
    # iot: todos los payloads tienen valores dentro de rangos físicos → 200.
    ("bot", "as-is", "J"): 200,   ("bot", "to-be", "J"): 200,
    ("iot", "as-is", "J"): 200,   ("iot", "to-be", "J"): 200,
    # Set K — duplicados: el expected es 200 (el rechazo se mide en BD, no en HTTP)
    ("bot", "as-is", "K"): 200,   ("bot", "to-be", "K"): 200,
    ("iot", "as-is", "K"): 200,   ("iot", "to-be", "K"): 200,
}

INPUT_SETS = ["A", "B", "C", "D", "E", "F", "G", "I", "J", "K"]

DELAY_STRATEGY: dict[str, tuple] = {
    "A": ("fixed", 0.100),
    "B": ("fixed", 0.100),
    "C": ("fixed", 0.100),
    "D": ("fixed", 0.100),
    "E": ("fixed", 0.100),
    "F": ("fixed", 0.100),
    "G": ("fixed", 0.100),
    "I": ("linear_decrease", 0.300, 0.050),
    "J": ("fixed", 0.100),
    "K": ("fixed", 0.100),
}

N_TOTAL = 200  # N por set (default)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def generate_run_id(caso: str, estado: str, set_letter: str = "", index: int = 0, seed_hash: str = "") -> str:
    sh = seed_hash[:7] if seed_hash else secrets.token_hex(3).upper()
    return f"{caso}-{estado.replace('-','')}-{set_letter}-{index:04d}-{sh}"


def load_dataset(caso: str, set_letter: str) -> "list[dict] | dict":
    """Retorna lista de payloads (array sets) o dict único (sets estáticos A-E)."""
    path = REPO_ROOT / "medicion" / "datasets" / caso / f"input-set-{set_letter}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if "payloads" in data:
        # Formato array (sets dinámicos F, G, I, J, K)
        return data["payloads"]
    else:
        # Formato objeto único (sets estáticos A-E)
        data.pop("_meta", None)
        return data


def get_commit_hash(abort_on_failure: bool = True) -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    if abort_on_failure:
        print("[ERROR] No se pudo obtener el commit hash. Asegúrate de estar en un repo git.")
        print("  Solución: git init / git add . / git commit -m 'initial'")
        sys.exit(1)
    return "unknown"


def execute_run(url: str, payload: dict, timeout_s: int = 30):
    start = datetime.now(timezone.utc)
    http_code = None
    error_type = None
    try:
        resp = requests.post(url, json=payload, timeout=timeout_s)
        http_code = resp.status_code
    except requests.exceptions.Timeout:
        error_type = "timeout"
    except requests.exceptions.ConnectionError:
        error_type = "integration"
    end = datetime.now(timezone.utc)
    return start, end, http_code, error_type


def determine_status(http_code: int | None, expected: int, error_type: str | None) -> str:
    if error_type is not None:
        return "fail"
    return "success" if http_code == expected else "fail"


def classify_error(http_code: int | None, expected: int, raw_error: str | None) -> str:
    if raw_error:
        return raw_error
    if http_code is None:
        return "unknown"
    if http_code == expected:
        return ""
    if 400 <= http_code < 500:
        return "validation"
    if http_code >= 500:
        return "integration"
    return "unknown"


def append_csv(csv_path: Path, row: dict) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    write_header = not csv_path.exists() or csv_path.stat().st_size == 0
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        if write_header:
            writer.writeheader()
        writer.writerow(row)


def latency_ms(start: datetime, end: datetime) -> float:
    return (end - start).total_seconds() * 1000


def compute_delay(set_letter: str, index: int, n_total: int) -> float:
    """Calcula el delay a aplicar después de la corrida i-ésima del set dado."""
    strategy = DELAY_STRATEGY.get(set_letter, ("fixed", 0.100))
    if strategy[0] == "fixed":
        return strategy[1]
    elif strategy[0] == "linear_decrease":
        delay_start, delay_end = strategy[1], strategy[2]
        return delay_start - (delay_start - delay_end) * index / max(n_total - 1, 1)
    return 0.100


def print_summary(results: list[dict]) -> None:
    print()
    print("=" * 65)
    print("  RESUMEN DE CORRIDAS")
    print("=" * 65)
    from collections import defaultdict
    groups: dict[tuple, list] = defaultdict(list)
    for r in results:
        groups[(r["case"], r["version"], r["input_set"])].append(r)

    header = f"{'Caso':<6} {'Estado':<8} {'Set':<4} {'N':>4}  {'p50ms':>7}  {'p95ms':>7}  {'%fail':>6}"
    print(header)
    print("-" * 65)
    for (caso, estado, set_letter), rows in sorted(groups.items()):
        lats = [r["latencia_ms"] for r in rows if r["latencia_ms"] is not None]
        fails = sum(1 for r in rows if r["status"] == "fail")
        p50 = statistics.median(lats) if lats else float("nan")
        p95 = sorted(lats)[int(len(lats) * 0.95)] if len(lats) >= 2 else (lats[0] if lats else float("nan"))
        pct_fail = (fails / len(rows) * 100) if rows else 0
        print(f"{caso:<6} {estado:<8} {set_letter:<4} {len(rows):>4}  {p50:>7.0f}  {p95:>7.0f}  {pct_fail:>5.0f}%")
    print("=" * 65)
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Corridas de medicion n8n-microframework")
    parser.add_argument("--caso", choices=["bot", "iot", "all"], default="all")
    parser.add_argument("--estado", choices=["as-is", "to-be", "all"], default="all")
    parser.add_argument("--sets", default="A,B,C,D,E",
        help="Sets a ejecutar separados por coma. Default: A,B,C,D,E. "
             "Dinámicos: F,G,I,J,K. Todos: A,B,C,D,E,F,G,I,J,K")
    parser.add_argument("--n", type=int, default=N_TOTAL,
        help=f"Corridas por input-set (default: {N_TOTAL})")
    parser.add_argument("--dry-run", action="store_true", help="Muestra qué haría sin ejecutar")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    casos = ["bot", "iot"] if args.caso == "all" else [args.caso]
    estados = ["as-is", "to-be"] if args.estado == "all" else [args.estado]
    sets_to_run = [s.strip().upper() for s in args.sets.split(",")]
    # En dry-run no es obligatorio tener un commit (el repo puede estar sin commits aún)
    commit = get_commit_hash(abort_on_failure=not args.dry_run)

    total = len(casos) * len(estados) * len(sets_to_run) * args.n
    print()
    print("n8n-microframework — Corridas de medicion")
    print("-" * 45)
    print(f"Casos:    {casos}")
    print(f"Estados:  {estados}")
    print(f"Sets:     {sets_to_run}")
    print(f"N/set:    {args.n}")
    print(f"Total:    {total} corridas")
    print(f"Commit:   {commit}")
    if args.dry_run:
        print("MODO:     dry-run (no ejecuta requests reales)")
    print()

    if args.dry_run:
        for caso in casos:
            for estado in estados:
                url = WEBHOOK_URLS[(caso, estado)]
                csv_path = REPO_ROOT / CSV_PATHS[(caso, estado)]
                for set_letter in sets_to_run:
                    exp = EXPECTED_HTTP[(caso, estado, set_letter)]
                    print(f"  [dry] {caso} {estado} Set {set_letter} × {args.n} → POST {url}  (espera {exp})")
                    print(f"         → {csv_path.relative_to(REPO_ROOT)}")
        print()
        return

    # Verificar conectividad antes de empezar
    test_url = WEBHOOK_URLS[(casos[0], estados[0])]
    try:
        requests.get("http://localhost:5678", timeout=5)
    except requests.exceptions.ConnectionError:
        print("[ERROR] n8n no responde en http://localhost:5678")
        print("  Verifica con: docker compose ps  (desde infraestructura/)")
        sys.exit(1)

    all_results: list[dict] = []
    run_counter = 0

    for caso in casos:
        for estado in estados:
            url = WEBHOOK_URLS[(caso, estado)]
            csv_path = REPO_ROOT / CSV_PATHS[(caso, estado)]

            for set_letter in sets_to_run:
                expected = EXPECTED_HTTP[(caso, estado, set_letter)]
                dataset = load_dataset(caso, set_letter)

                print(f"▶ {caso.upper()} {estado} Set {set_letter} ({args.n} corridas) → {url}")

                for i in range(args.n):
                    run_counter += 1
                    if isinstance(dataset, list):
                        payload = dataset[i % len(dataset)]
                    else:
                        payload = dataset
                    run_id = generate_run_id(caso, estado, set_letter, i)
                    start, end, http_code, raw_err = execute_run(url, payload)
                    status = determine_status(http_code, expected, raw_err)
                    error_type = classify_error(http_code, expected, raw_err)
                    lat = latency_ms(start, end)

                    row = {
                        "run_id": run_id,
                        "case": caso,
                        "version": estado,
                        "input_set": set_letter,
                        "start_ts": start.isoformat(),
                        "end_ts": end.isoformat(),
                        "status": status,
                        "error_type": error_type,
                        "notes": "",
                        "commit_hash": commit,
                    }
                    append_csv(csv_path, row)

                    status_icon = "✓" if status == "success" else "✗"
                    code_str = str(http_code) if http_code else raw_err
                    print(f"  [{run_counter:>4}] {set_letter} {status_icon} HTTP {code_str:<4} {lat:>6.0f}ms")

                    all_results.append({**row, "latencia_ms": lat})

                    time.sleep(compute_delay(set_letter, i, args.n))

                print()

    print_summary(all_results)
    print(f"Run-logs actualizados en medicion/run-logs/")


if __name__ == "__main__":
    main()
