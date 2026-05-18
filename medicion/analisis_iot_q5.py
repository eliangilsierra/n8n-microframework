"""Análisis IOT-Q5 — Urgencia diferenciada por nivel de alerta.

El campo `nivel` no está en el input dataset — lo asigna E2 internamente
usando los umbrales del ADR-002 (temperatura, humedad, CO2).

Umbrales to-be (ADR-002):
  temperatura  > 35°C   → crítico
  co2          > 1200   → crítico
  humedad      > 80%    → advertencia
  co2          > 800    → advertencia
  (si coinciden múltiples condiciones, prevalece la de mayor severidad)
  else                  → normal
"""
import csv
import json
import statistics
import sys
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REPO     = Path(__file__).parent.parent
RUN_LOG  = REPO / "medicion/run-logs/iot/run-log-iot-to-be.csv"
DATASET  = REPO / "medicion/datasets/iot/input-set-I.json"

# Umbrales ADR-002
TEMP_CRITICO        = 35.0
CO2_CRITICO         = 1200
HUMEDAD_ADVERTENCIA = 80.0
CO2_ADVERTENCIA     = 800


def calcular_nivel(p: dict) -> str:
    temp = float(p.get("temperature", 0))
    hum  = float(p.get("humidity", 0))
    co2  = int(p.get("co2", 0))
    if temp > TEMP_CRITICO or co2 > CO2_CRITICO:
        return "critico"
    if hum > HUMEDAD_ADVERTENCIA or co2 > CO2_ADVERTENCIA:
        return "advertencia"
    return "normal"


def ms(r: dict) -> float:
    s = datetime.fromisoformat(r["start_ts"])
    e = datetime.fromisoformat(r["end_ts"])
    return (e - s).total_seconds() * 1000


def main():
    # 1. Cargar payloads Set I y calcular nivel para cada uno con umbrales ADR-002
    data     = json.loads(DATASET.read_text(encoding="utf-8"))
    payloads = data["payloads"]
    levels   = [calcular_nivel(p) for p in payloads]

    dist = {n: levels.count(n) for n in ("normal", "advertencia", "critico")}
    print(f"\nDistribución Set I calculada con umbrales ADR-002 (N={len(payloads)}):")
    for nivel, n in dist.items():
        print(f"  {nivel:>12}  {n:>4} payloads  ({n/len(payloads)*100:.0f}%)")

    # 2. Cargar filas del run-log para Set I (excluye filas LIVE de pruebas manuales)
    with RUN_LOG.open(encoding="utf-8") as f:
        rows_I = [r for r in csv.DictReader(f)
                  if r["input_set"] == "I" and "LIVE" not in r["run_id"]]

    print(f"\nFilas Set I en run-log: {len(rows_I)}")
    if not rows_I:
        print("ERROR: No hay filas de Set I en el run-log.")
        return

    # 3. Parear cada fila con su nivel por índice de aparición dentro del set
    groups: dict[str, list[float]] = {"normal": [], "advertencia": [], "critico": []}
    for idx, row in enumerate(rows_I):
        nivel = levels[idx % len(levels)]
        groups[nivel].append(ms(row))

    # 4. Estadísticas por nivel
    print("\n── Latencia por nivel de alerta (cliente Python) ──────────────")
    print(f"{'Nivel':>12}  {'N':>4}  {'p50 ms':>8}  {'p95 ms':>8}  {'min ms':>8}  {'max ms':>8}")
    print("─" * 60)
    for nivel in ("normal", "advertencia", "critico"):
        durs = groups[nivel]
        if not durs:
            print(f"{nivel:>12}  {'—':>4}")
            continue
        p95_idx = min(int(len(durs) * 0.95), len(durs) - 1)
        print(f"{nivel:>12}  {len(durs):>4}  {statistics.median(durs):>8.1f}"
              f"  {sorted(durs)[p95_idx]:>8.1f}"
              f"  {min(durs):>8.1f}  {max(durs):>8.1f}")

    # 5. Evaluación del escenario IOT-Q5
    p50_crit = statistics.median(groups["critico"])    if groups["critico"]    else None
    p50_adv  = statistics.median(groups["advertencia"]) if groups["advertencia"] else None

    print("\n── Evaluación IOT-Q5 ───────────────────────────────────────────")
    if p50_crit is None or p50_adv is None:
        print("INCOMPLETO: algún nivel no tiene datos suficientes.")
        return

    delta = p50_crit - p50_adv
    if delta < -10:
        print(f"✅ critico p50 ({p50_crit:.1f}ms) < advertencia p50 ({p50_adv:.1f}ms) "
              f"Δ={delta:.1f}ms — Urgencia diferenciada por latencia CONFIRMADA")
    elif abs(delta) <= 10:
        print(f"⚠️  critico p50 ({p50_crit:.1f}ms) ≈ advertencia p50 ({p50_adv:.1f}ms) "
              f"Δ={delta:.1f}ms — Sin diferencia significativa de latencia")
        print("   → Evidencia de IOT-Q5 es ESTRUCTURAL: routing diferenciado en E4 (ADR-004)")
        print("     no de throughput — n8n procesa webhooks secuencialmente por request.")
    else:
        print(f"ℹ️  critico p50 ({p50_crit:.1f}ms) > advertencia p50 ({p50_adv:.1f}ms) "
              f"Δ={delta:.1f}ms — Branch crítico tiene overhead mayor en E4")
        print("   → Trade-off esperado: maxRetries=3 (critico) vs maxRetries=2 (advertencia).")
        print("     La diferenciación de urgencia es ESTRUCTURAL (routing E4), no de latencia.")

    print("\nNota metodológica:")
    print("  IOT-Q5 evalúa routing diferenciado por nivel (E4 branch — ADR-004 IoT),")
    print("  no prioridad de cola. En n8n cada webhook es síncrono e independiente.")
    print("  La evidencia primaria es la existencia de dos ramas HTTP en E4 con")
    print("  configuraciones de retry distintas (critico=3, advertencia=2).")


if __name__ == "__main__":
    main()
