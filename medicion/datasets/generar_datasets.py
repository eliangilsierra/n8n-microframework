#!/usr/bin/env python3
"""Generador determinístico de datasets dinámicos F, G, I, J, K para bot e IoT.

Uso:
    python medicion/datasets/generar_datasets.py
    python medicion/datasets/generar_datasets.py --verify-only

Lee medicion/datasets/seeds.yaml y genera 10 archivos JSON (5 bot + 5 iot)
con 200 payloads cada uno. Los hashes SHA-256 garantizan reproducibilidad bit-a-bit.
"""

import argparse
import hashlib
import json
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Verificar numpy ──────────────────────────────────────────────────────────
try:
    import numpy as np
except ImportError:
    print("[ERROR] numpy no está instalado.")
    print("  Instalar con: pip install numpy")
    sys.exit(1)

try:
    import yaml
except ImportError:
    # Fallback: parsear el YAML manualmente (es muy simple)
    yaml = None

REPO_ROOT = Path(__file__).parent.parent.parent.resolve()
SEEDS_FILE = Path(__file__).parent / "seeds.yaml"
BOT_DIR = Path(__file__).parent / "bot"
IOT_DIR = Path(__file__).parent / "iot"

TODAY = "2026-04-21"


# ── Carga de semillas ────────────────────────────────────────────────────────

def load_seeds() -> dict:
    """Carga seeds.yaml. Soporta pyyaml o parsing manual."""
    text = SEEDS_FILE.read_text(encoding="utf-8")
    if yaml is not None:
        return yaml.safe_load(text)
    # Parsing manual mínimo para el formato fijo del archivo
    seeds = {"derived": {"bot": {}, "iot": {}}}
    section = None
    subsection = None
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("master_seed:"):
            seeds["master_seed"] = int(stripped.split(":")[1].strip())
        elif stripped.startswith("N_per_set:"):
            seeds["N_per_set"] = int(stripped.split(":")[1].strip())
        elif stripped == "bot:":
            section = "derived"
            subsection = "bot"
        elif stripped == "iot:":
            section = "derived"
            subsection = "iot"
        elif subsection and ":" in stripped and not stripped.startswith("#"):
            key, val = stripped.split(":", 1)
            key = key.strip()
            val = val.strip()
            if key in ("F", "G", "I", "J", "K"):
                seeds["derived"][subsection][key] = int(val)
    return seeds


# ── SHA-256 de payloads ──────────────────────────────────────────────────────

def sha256_payloads(payloads: list) -> str:
    serialized = json.dumps(payloads, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


# ── UUID determinístico desde rng ────────────────────────────────────────────

def rng_uuid(rng: np.random.Generator) -> str:
    """Genera un UUID v4 determinístico usando el rng dado."""
    # Construir 128 bits desde cuatro enteros de 32 bits
    hi_hi = int(rng.integers(0, 2**32))
    hi_lo = int(rng.integers(0, 2**32))
    lo_hi = int(rng.integers(0, 2**32))
    lo_lo = int(rng.integers(0, 2**32))
    int_val = (hi_hi << 96) | (hi_lo << 64) | (lo_hi << 32) | lo_lo
    return str(uuid.UUID(int=int_val))


# ── BOT — Generadores ────────────────────────────────────────────────────────

BOT_MESSAGES = [
    "Hola, necesito ayuda con mi factura del mes pasado",
    "Tengo un problema con mi cuenta de usuario",
    "No puedo acceder al sistema desde esta mañana",
    "Necesito información sobre mis pagos pendientes",
    "Hay un error en mi último recibo",
    "Quiero cambiar mi contraseña",
    "Mi servicio ha sido interrumpido sin previo aviso",
    "Necesito una copia de mi contrato",
    "Hay un cargo desconocido en mi factura",
    "El sistema no acepta mi tarjeta de crédito",
    "Necesito actualizar mis datos de contacto",
    "Tengo una consulta sobre los términos del servicio",
]

VALID_TOKEN = "mi-token-secreto-hardcodeado-123"


def _bot_normal_payload(rng: np.random.Generator, i: int) -> dict:
    """Genera un payload bot normal, estilo Set F."""
    user_id = f"U-{int(rng.integers(1, 501)):04d}"
    session_id = rng_uuid(rng)
    message = BOT_MESSAGES[int(rng.integers(0, len(BOT_MESSAGES)))]
    idempotency_key = rng_uuid(rng)
    return {
        "user_id": user_id,
        "session_id": session_id,
        "message": message,
        "token": VALID_TOKEN,
        "idempotency_key": idempotency_key,
    }


def generate_bot_F(seed: int) -> list:
    """Set F — Tráfico normal variable (200 payloads únicos)."""
    rng = np.random.default_rng(seed)
    payloads = []
    for i in range(200):
        payloads.append(_bot_normal_payload(rng, i))
    return payloads


def generate_bot_G(seed: int) -> list:
    """Set G — Mezcla industrial 70/15/10/5."""
    rng = np.random.default_rng(seed)

    # Crear array de categorías y barajar
    categories = (
        ["normal"] * 140 +
        ["urgente"] * 30 +
        ["invalido"] * 20 +
        ["boundary"] * 10
    )
    categories = list(rng.permutation(categories))

    payloads = []
    for cat in categories:
        if cat == "normal":
            p = _bot_normal_payload(rng, 0)
        elif cat == "urgente":
            user_id = f"U-{int(rng.integers(1, 501)):04d}"
            session_id = rng_uuid(rng)
            base_msg = BOT_MESSAGES[int(rng.integers(0, len(BOT_MESSAGES)))]
            message = "URGENTE: " + base_msg
            idempotency_key = rng_uuid(rng)
            p = {
                "user_id": user_id,
                "session_id": session_id,
                "message": message,
                "token": VALID_TOKEN,
                "idempotency_key": idempotency_key,
            }
        elif cat == "invalido":
            user_id = f"U-{int(rng.integers(1, 501)):04d}"
            session_id = rng_uuid(rng)
            message = BOT_MESSAGES[int(rng.integers(0, len(BOT_MESSAGES)))]
            invalid_token = "tok-invalido-" + str(int(rng.integers(100, 999)))
            idempotency_key = rng_uuid(rng)
            p = {
                "user_id": user_id,
                "session_id": session_id,
                "message": message,
                "token": invalid_token,
                "idempotency_key": idempotency_key,
            }
        else:  # boundary
            session_id = rng_uuid(rng)
            idempotency_key = rng_uuid(rng)
            p = {
                "user_id": "X",
                "session_id": session_id,
                "message": "",
                "token": VALID_TOKEN,
                "idempotency_key": idempotency_key,
            }
        payloads.append(p)
    return payloads


BOT_URGENCIAS = [
    "consulta rutinaria sobre facturación",
    "pregunta sobre mi cuenta",
    "problema menor con el acceso",
    "dificultad para procesar un pago",
    "error recurrente en el sistema",
    "problema que se repite desde hace días",
    "situación que afecta mi operación normal",
    "problema crítico que bloquea mi trabajo",
    "FALLO TOTAL: sistema completamente caído",
    "URGENTE MÁXIMA PRIORIDAD: bloqueo total del servicio",
]


def generate_bot_I(seed: int) -> list:
    """Set I — Degradación gradual (200 payloads, urgencia creciente)."""
    rng = np.random.default_rng(seed)
    payloads = []
    for i in range(200):
        user_id = f"U-{(i // 20) + 1:04d}"
        session_id = rng_uuid(rng)
        idempotency_key = rng_uuid(rng)
        idx_plantilla = min(9, int(i * 10 / 200))
        message = BOT_URGENCIAS[idx_plantilla]
        p = {
            "user_id": user_id,
            "session_id": session_id,
            "message": message,
            "token": VALID_TOKEN,
            "idempotency_key": idempotency_key,
        }
        payloads.append(p)
    return payloads


def generate_bot_J(seed: int) -> list:
    """Set J — Percentiles extremos p1/p99 (100+100, permutados)."""
    rng = np.random.default_rng(seed)

    # p1: mensaje mínimo, user_id mínimo
    p1_list = []
    for _ in range(100):
        session_id = rng_uuid(rng)
        idempotency_key = rng_uuid(rng)
        p1_list.append({
            "user_id": "U",
            "session_id": session_id,
            "message": "x",
            "token": VALID_TOKEN,
            "idempotency_key": idempotency_key,
        })

    # p99: mensaje máximo (4096 chars), user_id máximo (64 chars)
    p99_list = []
    for _ in range(100):
        session_id = rng_uuid(rng)
        idempotency_key = rng_uuid(rng)
        p99_list.append({
            "user_id": "U" + "1" * 63,   # 64 chars, dentro del pattern {1,64}
            "session_id": session_id,
            "message": "A" * 4096,
            "token": VALID_TOKEN,
            "idempotency_key": idempotency_key,
        })

    combined = p1_list + p99_list
    order = rng.permutation(200)
    return [combined[i] for i in order]


def generate_bot_K(seed: int) -> list:
    """Set K — Duplicados idempotency_key (100 únicos × 2, distancia garantizada >= 100).

    Estrategia: se barajan los 100 índices una sola vez. El original queda en la posición
    del shuffle (slot 0..99) y el duplicado en slot+100 (slot 100..199).
    Distancia entre cada par = exactamente 100 posiciones, superando el mínimo de 10.
    El _meta.permutation_order registra el orden del shuffle.
    """
    rng = np.random.default_rng(seed)

    # Generar 100 payloads únicos (estilo F)
    base_payloads = []
    for i in range(100):
        base_payloads.append(_bot_normal_payload(rng, i))

    # Shuffle único: mismo índice en slot i y slot i+100 → distancia fija = 100
    shuffle_order = list(rng.permutation(100))

    result = [None] * 200
    for slot, idx in enumerate(shuffle_order):
        result[slot] = base_payloads[idx]
        result[slot + 100] = base_payloads[idx]

    return result


# ── IoT — Generadores ────────────────────────────────────────────────────────

IOT_LOCATIONS = [
    "sala-principal", "cuarto-servidores", "pasillo-norte", "bodega-a",
    "oficinas-2p", "laboratorio", "sala-reuniones", "entrada-principal",
]

IOT_BASE_TS = datetime(2026, 4, 21, 8, 0, 0, tzinfo=timezone.utc)


def _iot_timestamp(base: datetime, i: int, jitter_ms: int = 0) -> str:
    dt = base + timedelta(seconds=i * 2) + timedelta(milliseconds=jitter_ms)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_iot_F(seed: int) -> list:
    """Set F — Tráfico normal variable (200 payloads)."""
    rng = np.random.default_rng(seed)
    payloads = []
    for i in range(200):
        sensor_id = f"SENSOR-{int(rng.integers(1, 51)):03d}"
        temperature = round(float(np.clip(rng.normal(24, 3), 18, 32)), 1)
        humidity = round(float(np.clip(rng.normal(55, 10), 30, 80)), 1)
        co2 = int(np.clip(rng.lognormal(np.log(650), 0.3), 400, 950))
        jitter_ms = int(rng.integers(0, 1001))
        timestamp = _iot_timestamp(IOT_BASE_TS, i, jitter_ms)
        location = IOT_LOCATIONS[int(rng.integers(0, len(IOT_LOCATIONS)))]
        payloads.append({
            "sensor_id": sensor_id,
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2,
            "timestamp": timestamp,
            "location": location,
        })
    return payloads


def generate_iot_G(seed: int) -> list:
    """Set G — Mezcla industrial 70/15/10/5."""
    rng = np.random.default_rng(seed)

    categories = (
        ["normal"] * 140 +
        ["alerta_termica"] * 30 +
        ["alerta_humedad_co2"] * 20 +
        ["invalido"] * 10
    )
    categories = list(rng.permutation(categories))

    ts_counter = [0]

    def next_ts():
        jitter_ms = int(rng.integers(0, 1001))
        t = _iot_timestamp(IOT_BASE_TS, ts_counter[0], jitter_ms)
        ts_counter[0] += 1
        return t

    payloads = []
    for cat in categories:
        sensor_id = f"SENSOR-{int(rng.integers(1, 51)):03d}"
        location = IOT_LOCATIONS[int(rng.integers(0, len(IOT_LOCATIONS)))]
        timestamp = next_ts()

        if cat == "normal":
            temperature = round(float(np.clip(rng.normal(24, 3), 18, 32)), 1)
            humidity = round(float(np.clip(rng.normal(55, 10), 30, 80)), 1)
            co2 = int(np.clip(rng.lognormal(np.log(650), 0.3), 400, 950))
            p = {
                "sensor_id": sensor_id,
                "temperature": temperature,
                "humidity": humidity,
                "co2": co2,
                "timestamp": timestamp,
                "location": location,
            }
        elif cat == "alerta_termica":
            temperature = round(float(rng.uniform(35, 42)), 1)
            humidity = round(float(np.clip(rng.normal(55, 10), 30, 80)), 1)
            co2 = int(np.clip(rng.lognormal(np.log(650), 0.3), 400, 950))
            p = {
                "sensor_id": sensor_id,
                "temperature": temperature,
                "humidity": humidity,
                "co2": co2,
                "timestamp": timestamp,
                "location": location,
            }
        elif cat == "alerta_humedad_co2":
            temperature = round(float(np.clip(rng.normal(24, 3), 18, 32)), 1)
            # 50% humidity alta, 50% co2 alto
            if rng.random() < 0.5:
                humidity = round(float(rng.uniform(86, 95)), 1)
                co2 = int(np.clip(rng.lognormal(np.log(650), 0.3), 400, 950))
            else:
                humidity = round(float(np.clip(rng.normal(55, 10), 30, 80)), 1)
                co2 = int(rng.integers(1200, 1801))
            p = {
                "sensor_id": sensor_id,
                "temperature": temperature,
                "humidity": humidity,
                "co2": co2,
                "timestamp": timestamp,
                "location": location,
            }
        else:  # invalido
            temperature = round(float(np.clip(rng.normal(24, 3), 18, 32)), 1)
            humidity = round(float(np.clip(rng.normal(55, 10), 30, 80)), 1)
            co2 = int(np.clip(rng.lognormal(np.log(650), 0.3), 400, 950))
            p = {
                "sensor_id": sensor_id,
                "temperature": temperature,
                "humidity": humidity,
                "co2": co2,
                "timestamp": timestamp,
                "location": location,
            }
            # 50% omitir co2, 50% omitir temperature
            if rng.random() < 0.5:
                del p["co2"]
            else:
                del p["temperature"]

        payloads.append(p)
    return payloads


def generate_iot_I(seed: int) -> list:
    """Set I — Degradación gradual (200 payloads, valores normales → críticos)."""
    rng = np.random.default_rng(seed)

    # Calcular delays acumulados para timestamp monotónico
    delays = []
    for i in range(200):
        delay_i = 2.0 - (1.5 * i / 199)
        delays.append(delay_i)

    payloads = []
    cumulative_seconds = 0.0
    for i in range(200):
        if i > 0:
            cumulative_seconds += delays[i - 1]

        temperature = round(float(np.clip(
            22.0 + (40.0 - 22.0) * i / 199 + rng.normal(0, 0.5), -50, 150
        )), 1)
        humidity = round(float(np.clip(
            50.0 + (92.0 - 50.0) * i / 199 + rng.normal(0, 1.0), 0, 100
        )), 1)
        co2 = int(np.clip(
            500 + (1800 - 500) * i / 199 + rng.normal(0, 30), 0, 5000
        ))
        sensor_id = f"SENSOR-{((i % 10) + 1):03d}"
        dt = IOT_BASE_TS + timedelta(seconds=cumulative_seconds)
        timestamp = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        location = "zona-monitoreada"

        payloads.append({
            "sensor_id": sensor_id,
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2,
            "timestamp": timestamp,
            "location": location,
        })
    return payloads


def generate_iot_J(seed: int) -> list:
    """Set J — Percentiles extremos p1/p99 (100+100, permutados)."""
    rng = np.random.default_rng(seed)

    p1_list = []
    for i in range(100):
        sensor_id = f"SENSOR-{int(rng.integers(1, 51)):03d}"
        jitter_ms = int(rng.integers(0, 1001))
        timestamp = _iot_timestamp(IOT_BASE_TS, i, jitter_ms)
        location = IOT_LOCATIONS[int(rng.integers(0, len(IOT_LOCATIONS)))]
        p1_list.append({
            "sensor_id": sensor_id,
            "temperature": 15.2,
            "humidity": 32.0,
            "co2": 410,
            "timestamp": timestamp,
            "location": location,
        })

    p99_list = []
    for i in range(100):
        sensor_id = f"SENSOR-{int(rng.integers(1, 51)):03d}"
        jitter_ms = int(rng.integers(0, 1001))
        timestamp = _iot_timestamp(IOT_BASE_TS, 100 + i, jitter_ms)
        location = IOT_LOCATIONS[int(rng.integers(0, len(IOT_LOCATIONS)))]
        p99_list.append({
            "sensor_id": sensor_id,
            "temperature": 33.8,
            "humidity": 79.0,
            "co2": 920,
            "timestamp": timestamp,
            "location": location,
        })

    combined = p1_list + p99_list
    order = rng.permutation(200)
    return [combined[i] for i in order]


def _iot_normal_payload_for_K(rng: np.random.Generator, i: int) -> dict:
    """Genera un payload IoT normal con idempotency_key para set K."""
    sensor_id = f"SENSOR-{int(rng.integers(1, 51)):03d}"
    temperature = round(float(np.clip(rng.normal(24, 3), 18, 32)), 1)
    humidity = round(float(np.clip(rng.normal(55, 10), 30, 80)), 1)
    co2 = int(np.clip(rng.lognormal(np.log(650), 0.3), 400, 950))
    jitter_ms = int(rng.integers(0, 1001))
    timestamp = _iot_timestamp(IOT_BASE_TS, i, jitter_ms)
    location = IOT_LOCATIONS[int(rng.integers(0, len(IOT_LOCATIONS)))]
    idempotency_key = rng_uuid(rng)
    return {
        "sensor_id": sensor_id,
        "temperature": temperature,
        "humidity": humidity,
        "co2": co2,
        "timestamp": timestamp,
        "location": location,
        "idempotency_key": idempotency_key,
    }


def generate_iot_K(seed: int) -> list:
    """Set K — Duplicados idempotency_key (100 únicos × 2, distancia garantizada >= 100).

    Misma estrategia que bot K: shuffle único, original en slot i, duplicado en slot i+100.
    """
    rng = np.random.default_rng(seed)

    base_payloads = []
    for i in range(100):
        base_payloads.append(_iot_normal_payload_for_K(rng, i))

    shuffle_order = list(rng.permutation(100))

    result = [None] * 200
    for slot, idx in enumerate(shuffle_order):
        result[slot] = base_payloads[idx]
        result[slot + 100] = base_payloads[idx]

    return result


# ── Escritura de archivo ─────────────────────────────────────────────────────

def write_dataset(output_path: Path, caso: str, set_letter: str,
                  seed: int, master_seed: int, payloads: list) -> str:
    """Escribe el archivo JSON del dataset. Retorna el SHA-256."""
    sha = sha256_payloads(payloads)
    doc = {
        "_meta": {
            "caso": caso,
            "set": set_letter,
            "seed": seed,
            "master_seed": master_seed,
            "generated_at": TODAY,
            "count": len(payloads),
            "distribution": _distribution_name(set_letter),
            "sha256": sha,
        },
        "payloads": payloads,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(doc, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    return sha


def _distribution_name(set_letter: str) -> str:
    names = {
        "F": "normal_variable_100pct_valid",
        "G": "mixed_industrial_70_15_10_5",
        "I": "gradual_degradation",
        "J": "extreme_percentiles_p1_p99",
        "K": "duplicates_idempotency_key",
    }
    return names.get(set_letter, "unknown")


# ── Generadores por caso ─────────────────────────────────────────────────────

BOT_GENERATORS = {
    "F": generate_bot_F,
    "G": generate_bot_G,
    "I": generate_bot_I,
    "J": generate_bot_J,
    "K": generate_bot_K,
}

IOT_GENERATORS = {
    "F": generate_iot_F,
    "G": generate_iot_G,
    "I": generate_iot_I,
    "J": generate_iot_J,
    "K": generate_iot_K,
}


# ── Verificación de estabilidad ──────────────────────────────────────────────

def verify_stability(seeds: dict, written_hashes: dict[str, str]) -> bool:
    """Regenera todos los datasets en memoria y compara SHA-256 con los escritos."""
    master_seed = seeds["master_seed"]
    all_ok = True

    for set_letter, gen_fn in BOT_GENERATORS.items():
        seed = seeds["derived"]["bot"][set_letter]
        payloads = gen_fn(seed)
        sha = sha256_payloads(payloads)
        key = f"bot-{set_letter}"
        if sha != written_hashes.get(key):
            print(f"  ERROR estabilidad: bot/Set {set_letter} — hash difiere")
            all_ok = False

    for set_letter, gen_fn in IOT_GENERATORS.items():
        seed = seeds["derived"]["iot"][set_letter]
        payloads = gen_fn(seed)
        sha = sha256_payloads(payloads)
        key = f"iot-{set_letter}"
        if sha != written_hashes.get(key):
            print(f"  ERROR estabilidad: iot/Set {set_letter} — hash difiere")
            all_ok = False

    return all_ok


def verify_only(seeds: dict) -> None:
    """Verifica hashes de archivos existentes sin regenerar."""
    master_seed = seeds["master_seed"]
    print("\nVerificando hashes SHA-256 de datasets existentes...")
    print(f"{'Archivo':<45} {'N':>4}  {'SHA-256 (12 chars)':<14}  {'Estado'}")
    print("-" * 80)

    all_ok = True
    for set_letter, gen_fn in BOT_GENERATORS.items():
        path = BOT_DIR / f"input-set-{set_letter}.json"
        if not path.exists():
            print(f"  {'bot/input-set-' + set_letter + '.json':<43}   N/A  {'—':<14}  FALTANTE")
            all_ok = False
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        stored_sha = data["_meta"]["sha256"]
        computed_sha = sha256_payloads(data["payloads"])
        status = "OK" if stored_sha == computed_sha else "HASH MISMATCH"
        if stored_sha != computed_sha:
            all_ok = False
        n = len(data["payloads"])
        rel = f"bot/input-set-{set_letter}.json"
        print(f"  {rel:<43}  {n:>4}  {stored_sha[:12]:<14}  {status}")

    for set_letter, gen_fn in IOT_GENERATORS.items():
        path = IOT_DIR / f"input-set-{set_letter}.json"
        if not path.exists():
            print(f"  {'iot/input-set-' + set_letter + '.json':<43}   N/A  {'—':<14}  FALTANTE")
            all_ok = False
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        stored_sha = data["_meta"]["sha256"]
        computed_sha = sha256_payloads(data["payloads"])
        status = "OK" if stored_sha == computed_sha else "HASH MISMATCH"
        if stored_sha != computed_sha:
            all_ok = False
        n = len(data["payloads"])
        rel = f"iot/input-set-{set_letter}.json"
        print(f"  {rel:<43}  {n:>4}  {stored_sha[:12]:<14}  {status}")

    print()
    if all_ok:
        print("Verificacion completada: todos los hashes son validos.")
    else:
        print("ERROR: algunos hashes no coinciden o hay archivos faltantes.")
        sys.exit(1)


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generador determinístico de datasets dinámicos F, G, I, J, K"
    )
    parser.add_argument(
        "--verify-only", action="store_true",
        help="Solo verifica hashes sin regenerar"
    )
    args = parser.parse_args()

    seeds = load_seeds()
    master_seed = seeds["master_seed"]

    if args.verify_only:
        verify_only(seeds)
        return

    print()
    print("n8n-microframework — Generador de datasets dinamicos")
    print(f"master_seed: {master_seed}  |  N_per_set: {seeds['N_per_set']}")
    print("-" * 60)

    written_hashes: dict[str, str] = {}

    print(f"\n{'Archivo':<45} {'N':>4}  {'SHA-256 (12 chars)'}")
    print("-" * 65)

    # Generar bot
    for set_letter, gen_fn in BOT_GENERATORS.items():
        seed = seeds["derived"]["bot"][set_letter]
        payloads = gen_fn(seed)
        path = BOT_DIR / f"input-set-{set_letter}.json"
        sha = write_dataset(path, "bot", set_letter, seed, master_seed, payloads)
        written_hashes[f"bot-{set_letter}"] = sha
        rel = f"bot/input-set-{set_letter}.json"
        print(f"  {rel:<43}  {len(payloads):>4}  {sha[:12]}")

    # Generar iot
    for set_letter, gen_fn in IOT_GENERATORS.items():
        seed = seeds["derived"]["iot"][set_letter]
        payloads = gen_fn(seed)
        path = IOT_DIR / f"input-set-{set_letter}.json"
        sha = write_dataset(path, "iot", set_letter, seed, master_seed, payloads)
        written_hashes[f"iot-{set_letter}"] = sha
        rel = f"iot/input-set-{set_letter}.json"
        print(f"  {rel:<43}  {len(payloads):>4}  {sha[:12]}")

    # Verificación de estabilidad
    print("\nVerificando estabilidad (regeneracion en memoria)...")
    ok = verify_stability(seeds, written_hashes)
    if ok:
        print("  Verificacion de estabilidad: OK — todos los hashes son estables.")
    else:
        print("  ERROR: hay discrepancias en la verificacion de estabilidad.")
        sys.exit(1)

    print(f"\n10 datasets generados en medicion/datasets/{{bot,iot}}/")
    print("Archivos listos para committear.\n")


if __name__ == "__main__":
    main()
