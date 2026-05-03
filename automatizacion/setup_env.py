#!/usr/bin/env python3
"""Bootstrap del entorno de medicion.

Uso:
    python automatizacion/setup_env.py

Levanta n8n, PostgreSQL y los mock servers con un solo comando.
Al terminar imprime las instrucciones para el unico paso manual: import de flujos en n8n.
"""
import os
import re
import secrets
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("Instala dependencias primero: pip install -r automatizacion/requirements.txt")
    sys.exit(1)

REPO_ROOT = Path(__file__).parent.parent.resolve()
INFRA_DIR = REPO_ROOT / "infraestructura"
ENV_EXAMPLE = INFRA_DIR / ".env.example"
ENV_FILE = INFRA_DIR / ".env"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log(level: str, msg: str) -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")


def ok(msg: str) -> None:
    log("OK", msg)


def err(msg: str) -> None:
    log("ERROR", msg)


def info(msg: str) -> None:
    log("INFO", msg)


# ---------------------------------------------------------------------------
# Pasos
# ---------------------------------------------------------------------------

def check_docker() -> None:
    info("Verificando Docker...")
    result = subprocess.run(
        ["docker", "info"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        err("Docker no está corriendo. Inicia Docker Desktop y vuelve a ejecutar este script.")
        sys.exit(1)
    ok("Docker está corriendo")


def generate_env() -> None:
    if ENV_FILE.exists():
        ok(f".env ya existe en {ENV_FILE} — no se sobreescribe")
        return

    info("Generando infraestructura/.env desde .env.example...")
    if not ENV_EXAMPLE.exists():
        err(f"No se encontró {ENV_EXAMPLE}")
        sys.exit(1)

    lines = ENV_EXAMPLE.read_text(encoding="utf-8").splitlines()
    out_lines = []
    for line in lines:
        if line.startswith("#") or "=" not in line:
            out_lines.append(line)
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip()
        if "ENCRYPTION_KEY" in key and "changeme" in val.lower():
            val = secrets.token_hex(32)
        elif "PASSWORD" in key and "changeme" in val.lower():
            val = secrets.token_urlsafe(16)
        out_lines.append(f"{key}={val}")

    ENV_FILE.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    ok(f".env generado en {ENV_FILE}")
    info("  Guarda una copia de las credenciales generadas en un lugar seguro.")


def start_services() -> None:
    info("Ejecutando docker compose up -d...")
    result = subprocess.run(
        ["docker", "compose", "up", "-d"],
        cwd=INFRA_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        err("docker compose up falló:")
        print(result.stderr)
        sys.exit(1)
    ok("Servicios levantados con docker compose up -d")


def _docker_exec_pg_ready() -> bool:
    result = subprocess.run(
        ["docker", "compose", "exec", "-T", "postgres",
         "pg_isready", "-U", "n8n_user", "-d", "sensores_db"],
        cwd=INFRA_DIR,
        capture_output=True,
    )
    return result.returncode == 0


def _http_ok(url: str) -> bool:
    try:
        r = requests.get(url, timeout=3)
        return r.status_code < 500
    except Exception:
        return False


def wait_healthy(name: str, check_fn, timeout_s: int = 120) -> None:
    info(f"Esperando que {name} esté disponible (timeout {timeout_s}s)...")
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if check_fn():
            ok(f"{name} healthy")
            return
        time.sleep(5)
    err(f"{name} no respondió en {timeout_s}s. Verifica con: docker compose ps")
    sys.exit(1)


def create_table() -> None:
    info("Creando tablas en PostgreSQL...")
    statements = [
        (
            "lecturas_sensor",
            """CREATE TABLE IF NOT EXISTS lecturas_sensor (
  id               SERIAL PRIMARY KEY,
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,
  sensor_id        VARCHAR(100) NOT NULL,
  temperature      DECIMAL(5,1),
  humidity         DECIMAL(5,1),
  co2              INTEGER,
  timestamp        TIMESTAMPTZ NOT NULL,
  nivel_alerta     VARCHAR(20) DEFAULT 'normal',
  anomalias        JSONB,
  run_id           VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);""",
        ),
        (
            "interacciones_bot",
            """CREATE TABLE IF NOT EXISTS interacciones_bot (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(100),
  session_id  VARCHAR(100),
  categoria   VARCHAR(50),
  prioridad   VARCHAR(20),
  ticket_id   VARCHAR(100),
  ts          TIMESTAMPTZ DEFAULT NOW()
);""",
        ),
        (
            "lecturas_sensor_dead_letters",
            """CREATE TABLE IF NOT EXISTS lecturas_sensor_dead_letters (
  id               SERIAL PRIMARY KEY,
  run_id           VARCHAR(100),
  payload_original JSONB,
  error_message    TEXT,
  node_name        VARCHAR(200),
  ts               TIMESTAMPTZ DEFAULT NOW()
);""",
        ),
    ]
    for table_name, sql in statements:
        result = subprocess.run(
            ["docker", "compose", "exec", "-T", "postgres",
             "psql", "-U", "n8n_user", "-d", "sensores_db", "-c", sql],
            cwd=INFRA_DIR,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            err(f"Error creando tabla {table_name}:")
            print(result.stderr)
            sys.exit(1)
        ok(f"Tabla {table_name} creada (o ya existía)")


def print_manual_steps() -> None:
    print()
    print("=" * 70)
    print("  PASOS MANUALES REQUERIDOS")
    print("=" * 70)
    print()
    print("El entorno está listo. Ahora debes importar los flujos en n8n UI.")
    print("Esto es el ÚNICO paso que no se puede automatizar (n8n asigna IDs")
    print("nuevos en cada instalación y los orquestadores los necesitan).")
    print()
    print("1. Abre http://localhost:5678")
    print("   Usuario: admin")
    print("   Password: ver infraestructura/.env → N8N_BASIC_AUTH_PASSWORD")
    print()
    print("2. Importa los flujos en este orden exacto (Workflows → Import from File):")
    print()
    print("   CASO BOT:")
    print("   a. microframework/plantillas/bot-to-be-e2-dominio.json")
    print("   b. microframework/plantillas/bot-to-be-e3-adaptador.json")
    print("   c. microframework/plantillas/bot-to-be-orquestador.json")
    print("   d. casos-de-estudio/bot/as-is/bot-as-is.json")
    print()
    print("   CASO IoT:")
    print("   a. casos-de-estudio/iot/to-be/iot-to-be-e1-validacion.json")
    print("   b. casos-de-estudio/iot/to-be/iot-to-be-e2-dominio.json")
    print("   c. casos-de-estudio/iot/to-be/iot-to-be-e3-persistencia.json")
    print("   d. casos-de-estudio/iot/to-be/iot-to-be-e4-notificacion.json")
    print("   e. casos-de-estudio/iot/to-be/iot-error-handler.json")
    print("   f. casos-de-estudio/iot/to-be/iot-to-be-orquestador.json")
    print("   g. casos-de-estudio/iot/as-is/iot-as-is.json")
    print()
    print("3. En bot-to-be-orquestador: abre cada nodo 'Execute Workflow',")
    print("   selecciona el subflujo correcto por nombre, guarda.")
    print("   En iot-to-be-orquestador: mismo proceso para los 4 nodos.")
    print()
    print("4. Activa todos los flujos (toggle 'Active' en cada workflow).")
    print()
    print("5. Verifica con:")
    print("   curl -X POST http://localhost:5678/webhook/bot-soporte \\")
    print('     -H "Content-Type: application/json" \\')
    print("     -d @medicion/datasets/bot/input-set-A.json")
    print("   # Espera HTTP 200")
    print()
    print("   curl -X POST http://localhost:5678/webhook/iot-sensor \\")
    print('     -H "Content-Type: application/json" \\')
    print("     -d @medicion/datasets/iot/input-set-A.json")
    print("   # Espera HTTP 200")
    print()
    print("6. Una vez verificado, ejecuta las corridas:")
    print("   python automatizacion/run_corridas.py --caso all --estado all --n 30")
    print()
    print("=" * 70)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print()
    print("n8n-microframework — Bootstrap del entorno de medicion")
    print("-" * 55)
    print()

    check_docker()
    generate_env()
    start_services()

    wait_healthy("postgres",  _docker_exec_pg_ready, timeout_s=120)
    wait_healthy("n8n",       lambda: _http_ok("http://localhost:5678"), timeout_s=120)
    wait_healthy("mock-bot",  lambda: _http_ok("http://localhost:3001/health"), timeout_s=60)
    wait_healthy("mock-iot",  lambda: _http_ok("http://localhost:3002/health"), timeout_s=60)

    create_table()
    print_manual_steps()


if __name__ == "__main__":
    main()
