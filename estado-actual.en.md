> 🌐 **Language / Idioma:** English · [Español](estado-actual.md)

> ⚠️ **Living document notice:** This is a translated snapshot. The Spanish original (`estado-actual.md`) is the single source of truth for project progress and is updated more frequently than this translation. In case of discrepancy, `estado-actual.md` prevails.

# Current Project Status

Single source of truth for progress. Update upon completing each item: change ✗ → ✓ and
refresh "Last updated."

**Last updated:** 2026-07-08
**Active phase:** FASE 7 — ATAM Evaluation Completed ✓ (survey executed, analyzed, and documented) · FASE 8 Completed ✓ · FASE 9 R5 Completed ✓ — R6 pending · Static validator v2 (Lite + Pro) Completed ✓ (2026-05-31)

---

## Phases

| Phase | Name | Status |
|------|------|--------|
| 0 | Environment readiness | Artifacts ✓ — Runtime validated ✓ |
| 1 | Case and synthetic data specification | Completed ✓ |
| 2 | Construction of the as-is state | Completed ✓ |
| 3 | Micro-framework v1.0 design | Completed ✓ |
| 4 | Construction of the to-be state | Completed ✓ (2026-05-05) |
| 5 | Instrument pilot test | Completed ✓ (2026-05-05) |
| 6 | Comparative measurement | Completed ✓ (2026-05-05) — JMeter micro-benchmark pending (optional) |
| 7 | ATAM Evaluation | Completed ✓ — survey executed (17–24 Jun 2026), analyzed, and documented in §8 |
| 8 | AWS architecture design | Completed ✓ (2026-05-18) — OE4 fulfilled |
| 9 | Best-practices guide and closeout | R5 Completed ✓ (2026-05-18) — R6 (final thesis document) pending |

---

## FASE 0 — Environment readiness

### Repository artifacts ✓
- ✓ Folder structure, context documentation in `docs/context/`
- ✓ `infraestructura/docker-compose.yml` (n8n + PostgreSQL + mock-bot + mock-iot) and `.env.example`
- ✓ Mandatory and recommended rules, checklists (architecture + DevSecOps), patterns, antipatterns, conventions, ADR template
- ✓ run-log and cr-log CSVs with headers (8 files)
- ✓ Evidence protocol v1.0 in `docs/protocolo-evidencias.md`
- ✓ Synthetic datasets A/B/C/D/E for Bot and IoT (5 sets × 2 cases = 10 files)
- ✓ Automation scripts: `setup_env.py`, `run_corridas.py`, `extract_metrics.py`, `compare_results.py`
- ✓ Visual analysis script: `medicion/analizar_runlogs.py` (generates `medicion/consolidado/reporte-runlogs.html`)

### Runtime ✓
- ✓ Docker Desktop running — environment brought up with `setup_env.py`
- ✓ n8n accessible at http://localhost:5678
- ✓ PostgreSQL + `lecturas_sensor` and `interacciones_bot` tables created
- ✓ mock-bot (3001) and mock-iot (3002) healthy
- ✓ as-is flows imported into n8n and activated
- ✓ First as-is measurement executed (60 bot runs + 30 iot runs, sets A/B/C)

---

## FASE 1 — Completed ✓ — academic robustness verified (2026-05-01)

- ✓ Bot and IoT technical fact sheets with contracts, rules, CRs, and reproducibility parameters
- ✓ 6 synthetic datasets (input-set-A/B/C for bot and iot) with expectation metadata
- ✓ Traceability matrices (RF → ADR → evidence) for both cases — **v1.3** with ISO 25010 column and ATAM scenarios
- ✓ Academic justification of reference templates (`docs/context/sustentacion-plantillas-referencia.md`)
- ✓ Formal taxonomy of case representativeness (`docs/context/justificacion-casos-de-estudio.md`) — Yin (2018), 4 LC/NC categories, orthogonal Bot/IoT coverage

---

## FASE 2 — Completed ✓ — academic robustness verified (2026-05-01)

### Static analysis ✓
- ✓ Bot as-is technical notes — 9/10 rules violated, flow redesigned to 16 realistic nodes
- ✓ IoT as-is technical notes — 9/10 rules violated, flow redesigned to 14 realistic nodes
- ✓ ADR-001 Bot — separation of concerns via subflows
- ✓ ADR-001 IoT — separation of concerns in a 4-stage pipeline
- ✓ ADR-002 Bot — deliberate omission of E4 as a subflow (inline output in the orchestrator)

### As-is flow redesign (2026-04-19) ✓
- ✓ `bot-as-is.json` redesigned: 10 nodes → 16 nodes with REG-001/002/003/004/005/006/007/008 antipatterns visible
  - Non-distributed in-memory rate limit, hardcoded token, INSERT without ON CONFLICT,
    hardcoded external api-key, domain logic mixed with adapter
- ✓ `iot-as-is.json` redesigned: 6 nodes → 14 nodes with REG-001/002/003/004/005/006/007/008/009 antipatterns visible
  - Incomplete co2 validation, credentials in node output, HTTP 200 on validation error,
    inconsistent thresholds between nodes, dual-write without idempotency
- ✓ mock-bot updated: GET route `/api/user/:userId/tickets` for user history
- ✓ `setup_env.py` updated: creates `interacciones_bot` table in addition to `lecturas_sensor`
- ✓ Input sets D and E created for bot and iot (boundary + missing fields)
- ✓ `run_corridas.py` updated: INPUT_SETS A–E, full EXPECTED_HTTP

### Runtime execution — full measurement ✓
- ✓ 2000 bot as-is runs (sets A–K × 200 each) → `run-log-bot-as-is.csv`
- ✓ 2000 iot as-is runs (sets A–K × 200 each) → `run-log-iot-as-is.csv`
- ✓ Redesigned flows re-imported into n8n (LIMITE=150 active)
- ✓ Sets D, E and dynamic F, G, I, J, K executed with N=200
- ✓ `checklist-arquitectura` and `checklist-devsecops` — as-is antipatterns documented in notas-tecnicas.md (as-is flows intentionally violate REG-001…009)

### Run-log analysis (2026-04-20) ✓
- ✓ `medicion/analizar_runlogs.py` script created — generates interactive HTML report with Plotly
- ✓ Documented in `docs/protocolo-evidencias.md §8`
- Anomalies detected in the current data:
  - ⚠️ Bot as-is: 10 success / 20 fail pattern per set inconsistent with expectations
    (requires re-execution with redesigned flows imported into n8n)
  - ⚠️ `commit_hash = "unknown"` in 100% of bot and IoT rows (resolve before Fase 6)
  - ⚠️ IoT as-is: non-uniform distribution (set A=31, set E=29 instead of 30)
  - ℹ️ `notes` field empty in all rows — complete in next session
- IoT as-is: 100% success rate across all sets ✅ (correct — with no validation this is the expected antipattern)

### 2026-04-21 — Extended measurement with dynamic datasets ✓

- ✓ `medicion/datasets/generar_datasets.py` — deterministic generator created and functional
- ✓ `medicion/datasets/seeds.yaml` — versioned seeds (master_seed: 20260421)
- ✓ Datasets F, G, I, J, K generated for bot and IoT (10 files × 200 payloads each) — SHA-256 verified
- ✓ `automatizacion/run_corridas.py` v2 — supports sets A-K, N=200, DELAY_STRATEGY, arrays
- ✓ `casos-de-estudio/bot/as-is/bot-as-is-ratelimit-demo.json` — demo flow LIMITE=10
- ✓ `casos-de-estudio/bot/as-is/bot-as-is.json` — threshold updated to LIMITE=150
- ✓ ADR-003 (bot rate-limit measurement vs demo) created
- ✓ ADR-004 (hybrid arrival pattern) created in casos-de-estudio/bot/adr/
- ✓ `medicion/analizar_runlogs.py` v2 — §8 semantic conformance added
- ✓ `microframework/contratos/iot-webhook-input.schema.json` — bug fixed (token removed, co2 added)
- ✓ Complete as-is measurement: 4000 total runs (2000 bot + 2000 iot), sets A-K, N=200, commit a126311
- ✓ Set A anomaly (contaminated n8n counter) verified and resolved — LIMITE=150 behavior confirmed
- Documented observation: the in-memory rate limiter contaminates consecutive sets within the same session
  when the time window (60s) does not expire between sets — evidence of the REG-002 antipattern
- ✓ As-is architectural diagrams in Mermaid with antipatterns annotated per node (`casos-de-estudio/{bot,iot}/as-is/diagrama-as-is.md`)
- ✓ Formal justification of the as-is redesign (`docs/context/justificacion-rediseno-asis.md`) — internal validity per Wohlin et al. (2012)
- ✓ `commit_hash="unknown"` anomaly documented methodologically in `docs/protocolo-evidencias.md §9`

---

## FASE 3 — Completed ✓ (academic robustness verified 2026-05-01)

### Core micro-framework deliverables
- ✓ Stage-based metamodel E1–E4 (`docs/context/microframework-spec.md`)
- ✓ 10 mandatory rules (REG-001…REG-010) and 6 recommended (`microframework/reglas/`)
- ✓ REG-* → ISO/IEC 25010 mapping in `microframework/reglas/reglas-obligatorias.md`
- ✓ **5 patterns** documented: retry, idempotency, circuit breaker, error boundary, saga/compensation (`microframework/patrones/`)
- ✓ **11 antipatterns** documented (`microframework/antipatrones.md`) — +4: hardcoded ID, chatty, exception swallowing, god node
- ✓ **3 framework-level ADRs** (`microframework/adr/`): ADR-MF-001 (REG-001), ADR-MF-002 (REG-003), ADR-MF-003 (REG-006)
- ✓ Architecture and DevSecOps checklist (`microframework/checklists/`)
- ✓ Naming conventions (`microframework/convenciones/naming-conventions.md`)
- ✓ ADR template (`microframework/plantillas/ADR-plantilla.md`)
- ✓ Minimum observability guide (`microframework/guia-observabilidad.md`) — DevSecOps Pillar 3
- ✓ I/O contracts as JSON Schema (`microframework/contratos/`) — 9 schemas aligned with real datasets
- ✓ Executable static validation script (`microframework/validacion/validar-flujos.mjs`) — DevSecOps Pillar 2
- ✓ Consolidated R1 deliverable document (`docs/microframework-v1.0.md`) — **version 1.1** with full academic support
- ✓ **Theoretical foundation** (`docs/context/fundamento-teorico.md`) — Clean Architecture (Martin 2017), NIST SSDF, OWASP, LC/NC literature, positioning
- ✓ **ATAM Utility Tree** (`docs/atam/atam-utility-tree.md`) — 12 scenarios (6 Bot + 6 IoT) with response measures
- ✓ **MTTD Protocol** (`docs/protocolo-mttd.md`) — reproducible procedure with target < 60 seconds

### Architectural decisions per case (ADRs)
- ✓ **19 total ADRs** following the 7-section template:
  - Bot: ADR-001 to 008 — separation, E4 omission, rate-limit, experimental design, authentication, errorWorkflow, E2 message classification, to-be rate-limit
  - IoT: ADR-001 to 008 — pipeline, thresholds, idempotency, E4 routing, errorWorkflow, E1 validation, timestamp authority, E1 normalization
  - Framework: ADR-MF-001/002/003 — REG-001, REG-003, REG-006

### Evidence of changes to the as-is (FASE 2 → 3)
- ✓ `casos-de-estudio/bot/as-is/cambios-y-evidencia.md` — 4 chronological CR-ASIS entries
- ✓ `casos-de-estudio/iot/as-is/cambios-y-evidencia.md` — 3 chronological CR-ASIS entries
- ✓ Bot technical notes enriched with node 8 and `api_source_token` (REG-001)

### Design and pre-measurement of Change Requests
- ✓ `casos-de-estudio/bot/cr-design.md` + `casos-de-estudio/iot/cr-design.md` — CR1/CR2/CR3 fully specified
- ✓ CR-log schema extended (`cr_type`, `notes`) in all 4 CSVs
- ✓ As-is pre-measurement executed: `cr-log-bot-as-is.csv` and `cr-log-iot-as-is.csv` with 3 rows each; to-be measurement pending for FASE 6

### Checklists applied to the as-is (baseline evidence)
- ✓ `casos-de-estudio/bot/as-is/checklist-arquitectura-resultado.md` (6/7 violated)
- ✓ `casos-de-estudio/bot/as-is/checklist-devsecops-resultado.md` (3 pillars fail)
- ✓ `casos-de-estudio/iot/as-is/checklist-arquitectura-resultado.md` (6/7 violated)
- ✓ `casos-de-estudio/iot/as-is/checklist-devsecops-resultado.md` (3 pillars fail)

### Traceability matrices
- ✓ `casos-de-estudio/bot/trazabilidad/matriz-trazabilidad.md` — **v1.3**: ADR-001..008 linked, ISO 25010 column in RFs, ATAM scenarios BOT-Q1..Q6
- ✓ `casos-de-estudio/iot/trazabilidad/matriz-trazabilidad.md` — **v1.3**: ADR-001..008 linked, ISO 25010 column in RFs, ATAM scenarios IOT-Q1..Q6

---

## FASE 4 — Construction of the to-be

### Artifacts ✓
- ✓ 8 to-be JSON templates in `microframework/plantillas/` (orchestrators + subflows)
- ✓ I/O contracts per case defined in fact sheets and in `arquitectura-flujos.md`
- ✓ Structured JSON log defined per stage

### Runtime executed (2026-05-04) ✓
- ✓ Subflows imported into n8n (bot: 2 subflows; iot: 4 subflows + error handler)
- ✓ Real IDs captured and configured in the n8n UI (bot orchestrator updated and re-exported)
- ✓ To-be measurement executed: 2000 bot runs + 2000 iot runs (sets A–K, N=200, commit b1bdb8a)
- ✓ To-be run-logs generated: `run-log-bot-to-be.csv`, `run-log-iot-to-be.csv`
- ✓ Comparative report generated: `medicion/consolidado/comparacion-2026-05-03.md`
- ✓ Interactive HTML report updated: `medicion/consolidado/reporte-runlogs.html`

### FASE 4 closeout (2026-05-05) ✓
- ✓ **[BUG-1]** `EXPECTED_STATUS` in `analizar_runlogs.py` fixed
- ✓ **[BUG-2]** Orchestrators exported with real IDs (bot with IDs `GLCqR9yqvkmE20QY`/`EqMaNbc6Rq60G8u9`; IoT requires replacing `iot-to-be-orquestador.json` in the repo with the n8n export)
- ✓ **[BUG-3/4/5]** Resolved (see previous notes)
- ✓ To-be CR-logs populated: `cr-log-bot-to-be.csv` (3 CRs) and `cr-log-iot-to-be.csv` (3 CRs)
- ✓ To-be architecture checklists: Bot 10/10, IoT 10/10
- ✓ To-be DevSecOps checklists: Bot 8/8, IoT 7/7 applicable
- ✓ Obsolete files removed: `bot-to-be-orquestador-v2.json`, `iot-to-be-orquestador-v2.json`
- ✓ Static validator run and report saved: `microframework/validacion/reportes/validacion-2026-05-06.md`
- ⚠️ **Pending action (minor):** replace `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` with a real n8n export (placeholders in the `workflowId` field; does not affect evaluated REGs)

### HTML report status (post-fixes 2026-05-04)
- **3 CRITICAL** in bot/as-is (Sets A, C, D) — all produced by the REG-002 rate limiter. Evidence of the antipattern. ✅ Expected.
- **4 INFO** — empty `notes` field (documented methodologically).
- **complete to-be**: all technically evaluable sets show ✅ conformant.
- **Sets G, J bot/to-be**: marked as "mixed" → evaluated in report §8.

### Measurement observations (2026-05-04)
| Metric | BOT as-is | BOT to-be | IOT as-is | IOT to-be |
|---------|-----------|-----------|-----------|-----------|
| Total runs | 2000 | 2000 | 2000 | 2000 |
| Total failures | 175 (9%) | 114 (6%) | 4 (0%) | 12 (1%) |
| p50 Set A | 120 ms | 149 ms (+25%) | 78 ms | 200 ms (+156%) |
| p50 Set B | 118 ms | 145 ms (+23%) | 78 ms | 227 ms (+192%) |
| p50 Set C | 66 ms | 53 ms (-20%) | 42 ms | 72 ms (+70%) |
| REG-002 antipattern visible | ✅ 25% fail Set A | ✅ Eliminated (0% fail) | N/A | N/A |
| E1 validation Set C (rejection) | ✅ returns 401 | ✅ returns 400 | ✅ 200 (antipattern) | ✅ returns 422 |

---

## FASE 5 — Instrument pilot test — Completed ✓ (2026-05-05)

- ✓ `run_corridas.py` — validated: 8000 total runs executed with no script failure
- ✓ `analizar_runlogs.py` — validated: generates HTML with correct anomaly detection
- ✓ `validar-flujos.mjs` — validated: 22 files evaluated; to-be bot 100%, to-be iot 100%
- ✓ `compare_results.py` — comparative report `comparacion-2026-05-05.md` generated
- ✓ Analytical MTTD documented: Bot ~14s ✅; IoT structural ✅ (see `mttd-resultado.md`)
- ⚠️ JMeter micro-benchmark: tool not installed; instructions in `medicion/datasets/jmeter/resultados/PENDIENTE.md` — does not block ATAM

---

## FASE 6 — Comparative measurement — Completed ✓ (2026-05-05)

### Run-logs ✓
- ✓ `run-log-bot-as-is.csv` — 2000 runs, sets A–K
- ✓ `run-log-iot-as-is.csv` — 2000 runs, sets A–K
- ✓ `run-log-bot-to-be.csv` — 2000 runs, sets A–K
- ✓ `run-log-iot-to-be.csv` — 2000 runs, sets A–K

### CR-logs ✓
- ✓ `cr-log-bot-as-is.csv` — 3 CRs measured (as-is: 8/5/3 nodes)
- ✓ `cr-log-iot-as-is.csv` — 3 CRs measured (as-is: 6/4/3 nodes)
- ✓ `cr-log-bot-to-be.csv` — 3 CRs measured (to-be: 1/1/1 nodes — −81% average)
- ✓ `cr-log-iot-to-be.csv` — 3 CRs measured (to-be: 1/1/0 nodes — −84% average)

### Calculated metrics ✓
- ✓ Latency and failure comparison: `medicion/consolidado/comparacion-2026-05-05.md`
- ✓ Interactive HTML report: `medicion/consolidado/reporte-runlogs.html`
- ✓ Derived metrics: `medicion/consolidado/metricas-derivadas.md`
- ✓ ATAM × evidence matrix: `medicion/consolidado/atam-evidencia.md` v1.1 (Bot 83% ✅, IoT 100% ✅ — updated 2026-05-07)
- ✓ MTTD documented: `medicion/consolidado/mttd-resultado.md`

### Key results
| Goal | Result |
|------|-----------|
| CR impact ≥ 20% node reduction | Bot −81%, IoT −84% ✅ |
| Failures ≥ 30% reduction | Bot −36.6% ✅ |
| Checklist ≥ 90% in to-be | Bot 100%, IoT 100% ✅ |
| ATAM coverage ≥ 80% | Bot 83% ✅ · IoT 100% ✅ · Total 92% ✅ |

### Minor pending items (does not block subsequent phases)
- ✓ IOT-Q4 runtime: executed 2026-05-07 → SP-IOT-01, R-IOT-01, NR-IOT-01 identified
- ✓ IOT-Q5 analysis: executed 2026-05-07 → TP-IOT-01 quantified (+10.8 ms)
- ⚠️ JMeter micro-benchmark: tool not installed — complementary metric, does not block the thesis

---

## FASE 7 — ATAM Evaluation — Completed ✓ (started 2026-05-07, survey executed and analyzed 2026-06-24, §8 documented 2026-07-08)

### Artifacts produced ✓
- ✓ ATAM evidence completed: Bot 5/6 (83%) ✅ · IoT 6/6 (100%) ✅ · Total 11/12 (92%) ✅
- ✓ IOT-Q4 runtime executed → SP-IOT-01, R-IOT-01, NR-IOT-01 documented
- ✓ IOT-Q5 analysis executed (`medicion/analisis_iot_q5.py`) → TP-IOT-01 documented
- ✓ `docs/atam/analisis-approaches.md` — 12 approaches + SP/TP/R/NR classification × 12 scenarios
- ✓ `docs/atam/matriz-scoring.md` — 1–5 scoring as-is vs to-be for the 12 scenarios
- ✓ `docs/atam/registro-riesgos-tradeoffs.md` — 3 SP · 3 TP · 4 R · 5 NR formalized
- ✓ `microframework/adr/ADR-MF-004-atam-adaptado-individual.md` — formal methodological adaptation
- ✓ `docs/atam/metodologia-atam-adaptada.md` — adapted ATAM framework with academic support
- ✓ `docs/atam/protocolo-encuesta.md` — complete external validation protocol
- ✓ `docs/atam/instrumento-encuesta.md` — 18 questions + optional mini-ATAM (10–12 min)
- ✓ `docs/atam/plan-analisis-encuesta.md` — statistical plan (Cronbach's α, Krippendorff's κ)
- ✓ `docs/atam/plan-difusion.md` — channels, templates, and candidate list
- ✓ `docs/atam/material-apoyo/resumen-proyecto.md` — 4-page PDF (Markdown source)
- ✓ `docs/atam/material-apoyo/guion-video.md` — 5–7 min script for the panel video
- ✓ `docs/atam/material-apoyo/diagrama-comparativo.md` — Mermaid as-is vs to-be diagrams
- ✓ `docs/atam/informe-atam-final.md` — ATAM report, thesis chapter (§1–§10 complete, §8 with real survey results)
- ✓ `docs/atam/INDEX.md` — complete index of all FASE 7 artifacts
- ✓ `medicion/encuesta-validacion/` — anonymized data (N=19, 17 valid), executed analysis script and notebook, consolidated outputs

### Formalized ATAM findings
| Type | IDs | Summary description |
|---|---|---|
| Sensitivity Points (3) | SP-BOT-01, SP-BOT-02, SP-IOT-01 | E3 idempotency · E1 log · IoT error handler channel |
| Tradeoff Points (3) | TP-GLOBAL-01, TP-GLOBAL-02, TP-IOT-01 | Subflows vs latency · Validation vs flexibility · Differentiated retry |
| Risks (4) | R-BOT-01, R-IOT-01, R-GLOBAL-01, R-GLOBAL-02 | Token rotation · Blocked dead-letter · Ephemeral logs · External contracts |
| Non-risks (5) | NR-BOT-01, NR-BOT-02, NR-IOT-01, NR-IOT-02, NR-GLOBAL-01 | E1 prevents side-effects · HTTP 401/400 · E3 independent · IoT idempotency · Static validator |

### External validation by expert panel — Completed ✓
- ✓ Collection executed June 17–24, 2026 (N=19, 17 valid after experience filter)
- ✓ To-be convergence 12/12 scenarios; as-is 11/12 (Δ=1 on IOT-Q5)
- ✓ 95.1% of respondent-scenario pairs perceive improvement as-is→to-be
- ✓ §8 of `informe-atam-final.md` (and `.en.md`) completed with panel profile, Section B results, Section C/E4 qualitative coding, Section E triangulation, and synthesis

---

## FASE 8 — AWS Architecture Design — Completed ✓ (2026-05-18)

### Artifacts produced ✓
- ✓ `docs/aws/arquitectura-aws.md` — Main document: multi-AZ VPC, ECS Fargate, Multi-AZ RDS, ElastiCache Redis, S3, local→AWS mapping, ATAM risk resolution
- ✓ `docs/aws/seguridad-iam.md` — IAM Task Roles (4 roles), Secrets Manager, ACM, WAF, Security Groups, KMS CMK. Diagrams 5 and 6
- ✓ `docs/aws/observabilidad-aws.md` — CloudWatch Log Groups, 6 Log Insights queries, 7 alarms, Dashboard. Resolution of R-GLOBAL-01
- ✓ `docs/aws/escalabilidad.md` — Queue Mode, worker auto-scaling (2–8), rolling/blue-green deploy, REGs mapping. Diagram 4
- ✓ `docs/aws/estimacion-costos.md` — Costs across 3 tiers (Dev ~$33, Staging ~$208, Prod ~$458), Fargate Spot optimizations. Diagram 7
- ✓ `docs/aws/diagramas-aws.md` — Canonical source of 7 Mermaid diagrams with code, academic justification, and rendering instructions
- ✓ `docs/aws/INDEX.md` — Index of all FASE 8 artifacts
- ✓ `microframework/adr/ADR-MF-005-ecs-fargate-vs-ec2.md` — ECS Fargate vs EC2 vs EKS
- ✓ `microframework/adr/ADR-MF-006-n8n-queue-mode.md` — Queue Mode with Redis BullMQ
- ✓ `microframework/adr/ADR-MF-007-rds-multi-az.md` — RDS PostgreSQL Multi-AZ in Production

### Mermaid diagrams produced (7 total)

| # | Type | Document | Purpose |
|---|---|---|---|
| 1 | `C4Context` | `arquitectura-aws.md §1` | System context — actors and external systems |
| 2 | `C4Container` | `arquitectura-aws.md §2` | AWS containers and protocols |
| 3 | `flowchart TD` | `arquitectura-aws.md §3` | Multi-AZ topology with VPC, subnets, AZs |
| 4 | `sequenceDiagram` | `escalabilidad.md §1` | Temporal flow webhook → Queue → RDS → Auto Scaling |
| 5 | `flowchart LR` | `seguridad-iam.md §1` | Trust zones and security controls |
| 6 | `graph TD` | `seguridad-iam.md §2` | IAM hierarchy roles → policies → resources |
| 7 | `xychart-beta` | `estimacion-costos.md §3` | Monthly costs by component and tier |

### ATAM risk resolution in AWS

| ATAM Risk | Resolution |
|---|---|
| R-GLOBAL-01 — Ephemeral logs | ✅ CloudWatch Logs — 30-day retention |
| R-BOT-01 — No token rotation | ✅ Secrets Manager — automatic 30-day rotation |
| R-IOT-01 — Blocked dead-letter | ✅ CloudWatch Alarm → SNS as an independent channel |
| SP-IOT-01 — Error handler channel = E4 channel | ✅ Independent SNS Alarm, separate from the E4 notification channel |
| R-GLOBAL-02 — Unversioned contracts | ⚠️ Partial — API Gateway versioning out of scope |

---

## FASE 9 — Best-Practices Guide (R5) — Completed ✓ (2026-05-18)

### Artifact produced ✓
- ✓ `docs/guia-buenas-practicas.md` — Monolithic guide v1.0, ~12 chapters + 5 appendices
  - Ch 1 introduction + glossary of 25 terms
  - Ch 2 prerequisites and repo structure
  - Ch 3 executable 30-minute Quick Start (Docker → n8n → import → curl → logs → validator)
  - Ch 4 E1-E4 metamodel with Mermaid diagram and ISO 25010 mapping
  - Ch 5 I/O Validation (REG-007/008/009 + 9 schemas + Bot/IoT examples) — anteproyecto section ✅
  - Ch 6 Error handling (REG-003/004/005 + 5 patterns + TP-IOT-01 + SP-IOT-01) — anteproyecto section ✅
  - Ch 7 Security (REG-001 + 8 DevSecOps items + ADR-MF-001 + R-BOT-01) — anteproyecto section ✅
  - Ch 8 Observability (REG-006 + JSON log contract + Code node template + ADR-MF-003) — anteproyecto section ✅
  - Ch 9 Catalog of 11 antipatterns + detection signals
  - Ch 10 Applicable final checklist (architecture + DevSecOps + quick check + single command) — anteproyecto section ✅
  - Ch 11 Scaling local→AWS (mapping + REG preservation + costs + reference to docs/aws/)
  - Ch 12 RF→ADR→REG→ISO→ATAM traceability + 5-level maturity model + self-assessment
  - Appendices A-E (REG/ADR reference, evidence, external resources, file map)

### Compliance with the anteproyecto
- ✓ The 5 mandatory sections covered: I/O validation, error handling, security, observability, checklist
- ✓ Every REG-001…010 referenced at least once
- ✓ All 11 antipatterns cataloged
- ✓ All 5 patterns explained
- ✓ Glossary with 25 critical terms
- ✓ Ch 11 references docs/aws/ without duplicating content
- ✓ Navigable TOC with Markdown anchors

---

## Static validator v2 — Major refactor (2026-05-31) ✓

Complete refactor of the validator (DevSecOps Pillar 2) into **two coexisting editions**
that share the canonical `report.schema.json` model:

### Lite Edition — Single-file rewrite
- ✓ `microframework/validacion/validar-flujos.mjs` rewritten (~1600 LOC, zero dependencies)
- ✓ Directed-graph parser built from `nodes` + `connections` (no more regex over JSON.stringify)
- ✓ E1–E4 stage classifier via typed heuristics (does not depend on the file name)
- ✓ 17 rules: 11 REG-* + 6 AP-* antipatterns (god-node, chatty, dual-write, exception swallowing, hardcoded ID, stage leak)
- ✓ Severity (error|warning|info) + confidence (high|medium|low) per finding
- ✓ Metrics: cyclomatic complexity, depth, cohesion score, fan-out
- ✓ Automatic ISO 25010 / ATAM / ADR mapping via `mapeo-calidad.json`
- ✓ Renderers: md, json, sarif (v2.1.0), junit, self-contained offline html
- ✓ HTML: 100% offline, 0 external URLs, SVG graph + ISO 25010 radar + filterable table + historical sparkline + "explain this finding" panel + academic branding
- ✓ Diff against a JSON baseline with new/resolved/regressed findings
- ✓ `microframework/validacion/legacy/validar-flujos-v1.mjs` — v1 kept as historical evidence
- ✓ Handcrafted test runner: 6 fixtures, 6/6 pass

### Pro Edition — Extensible modular package
- ✓ `microframework/validacion-pro/` — `src/{cli,parser,rules,metrics,fixers,report,shared}` structure
- ✓ Multi-subcommand CLI: `analyze` · `report` · `diff` · `fix` · `watch`
- ✓ Declarative rules YAML DSL — `rules-custom/*.yaml` (2 examples)
- ✓ Codemods (`--fix`): `add-http-retry` (REG-004), `envify-secret` (REG-001), `add-on-conflict` (REG-005) — idempotent
- ✓ HTML CDN with Tailwind + Mermaid + Chart.js (radar)
- ✓ SARIF v2.1.0 for GitHub Code Scanning + example workflow
- ✓ vitest suite: parser, rules (fixtures shared with Lite), DSL, fixers, render-sarif
- ✓ Docs: `dsl-spec.md`, `codemods.md`, `sarif-github.md`

### Final run results against the repo
| Metric | Lite v2 |
|---|---|
| Files analyzed | 23 (5 as-is + 18 to-be) |
| Average to-be score | 84% |
| To-be with errors | 0 |
| Rules exercised | 13/17 (4 dormant: AP-001/002/003/006) |
| Exit code | 0 |

### Documentation
- ✓ `microframework/adr/ADR-MF-008-validador-dos-ediciones.md` — architectural decision
- ✓ `microframework/validacion-pro/README.md` — Lite vs Pro comparison + quick start
- ✓ Canonical schema published at `microframework/validacion/report.schema.json`

---

## Immediate pending items (next steps)

> FASE 7 completed ✓ (survey executed, analyzed, and documented in §8). FASE 8 completed ✓. FASE 9 R5 completed ✓. R6 (final thesis document) still pending.

1. **[FASE 9 — R6]** Consolidation of the final thesis document (integration of R1–R5 with technical annexes)
2. **[OPTIONAL — minor]** Replace `casos-de-estudio/iot/to-be/iot-to-be-orquestador.json` with a real n8n export (placeholders in `workflowId` — does not affect evaluated REGs)

---

## Key decisions (do not reopen without an ADR)

| Decision | Justification |
|----------|--------------|
| Local PostgreSQL (not InfluxDB) | Avoids external dependency, standard SQL |
| HTTP webhook in IoT (not MQTT) | No additional broker needed; the project evaluates flow architecture, not transport protocol |
| No LLMs in the flows | Avoids variability that would prevent metric reproducibility |
| JMeter for load testing | Desktop UI, academic standard, free |
| Mocks on localhost:3001 and 3002 | Full control over responses for reproducible tests |
| Subflows referenced by ID in Execute Workflow | Official n8n mechanism for orchestration |
| AWS design only (no deployment) | Explicitly stated in the anteproyecto: reference design with cost estimation, no production deployment |
| Bot uses E1+E2+E3 without E4 as a subflow | Documented in `casos-de-estudio/bot/adr/ADR-002-omision-e4.md` |

---

## Critical files

```
estado-actual.md                                     this file (single source of truth for progress)
CLAUDE.md                                            repository configuration and conventions
docs/context/ANTEPROYECTO_ELIAN_GIL_MGADS.pdf        anteproyecto (normative source of scope)
docs/context/proyecto-overview.md                    objectives, methodology, metrics, goals, ISO 25010 mapping
docs/context/arquitectura-flujos.md                  as-is and to-be architecture, technical detail
docs/context/microframework-spec.md                  micro-framework v1.0 (E1–E4, rules, patterns)
docs/context/convenios-y-reglas.md                   repository conventions and structure
docs/protocolo-evidencias.md                         protocol for environment setup and measurement logging
casos-de-estudio/{bot,iot}/ficha-tecnica.md          specification of each case
casos-de-estudio/{bot,iot}/as-is/notas-tecnicas.md   as-is analysis + pre-import adjustments
casos-de-estudio/{bot,iot}/adr/ADR-*.md              architectural decisions per case
medicion/datasets/{caso}/input-set-*.json            immutable synthetic datasets
medicion/run-logs/{caso}/*.csv                       run log records
medicion/analizar_runlogs.py                         visual run-log analysis → interactive HTML report
medicion/cr-logs/{caso}/*.csv                        Change Request records
docs/microframework-v1.0.md                          R1 deliverable — consolidated micro-framework document
microframework/                                      rules, patterns, antipatterns, checklists, templates, conventions
microframework/guia-observabilidad.md                DevSecOps Pillar 3 — structured logging contract per stage
microframework/contratos/                            I/O contract JSON Schemas per stage (Bot and IoT)
microframework/validacion/validar-flujos.mjs         DevSecOps Pillar 2 — REG-001…010 static validation script
microframework/adr/ADR-MF-*.md                       framework-level ADRs (REG-001, REG-003, REG-006)
microframework/patrones/                             5 patterns: retry, idempotency, circuit-breaker, error-boundary, saga
docs/context/fundamento-teorico.md                   Conceptual basis: Clean Architecture, NIST SSDF, LC/NC literature
docs/atam/atam-utility-tree.md                    ATAM Utility Tree: 12 top-K scenarios with response measures
docs/protocolo-mttd.md                               MTTD measurement protocol — reproducible, target < 60 seconds
docs/context/justificacion-casos-de-estudio.md       LC/NC taxonomy and formal representativeness of Bot and IoT
docs/context/justificacion-rediseno-asis.md          Methodological validity of the intentional as-is redesign
docs/atam/INDEX.md                                   Index of all FASE 7 artifacts
docs/atam/informe-atam-final.md                      ATAM report, thesis chapter (R4) — §1–§10 complete, incl. §8 external validation
docs/atam/analisis-approaches.md                     12 approaches + SP/TP/R/NR classification × 12 scenarios
docs/atam/matriz-scoring.md                          1–5 scoring as-is vs to-be per scenario
docs/atam/registro-riesgos-tradeoffs.md              3 SP · 3 TP · 4 R · 5 NR formalized
docs/atam/instrumento-encuesta.md                    External validation survey — 18 questions + mini-ATAM
docs/atam/material-apoyo/resumen-proyecto.md         Markdown source of the 4-page PDF for respondents
docs/atam/material-apoyo/guion-video.md              Script for the 5–7 minute video
medicion/encuesta-validacion/respuestas-anonimizadas-2026-06-24.csv  Anonymized survey data (N=19, 17 valid)
medicion/encuesta-validacion/analisis-encuesta.py    Reproducible survey analysis script (§8)
microframework/adr/ADR-MF-004-atam-adaptado-individual.md  Individual ATAM methodological adaptation
docs/aws/INDEX.md                                   Index of all FASE 8 artifacts
docs/aws/arquitectura-aws.md                        Main AWS document: VPC, ECS, RDS, Redis, S3, ATAM risks
docs/aws/seguridad-iam.md                           IAM, Secrets Manager, ACM, WAF, Security Groups (Diagrams 5 and 6)
docs/aws/observabilidad-aws.md                      CloudWatch Logs, Alarms, Dashboard, Log Insights queries
docs/aws/escalabilidad.md                           Queue Mode, worker auto-scaling, deploy strategies (Diagram 4)
docs/aws/estimacion-costos.md                       Costs across 3 tiers, optimizations, comparison (Diagram 7)
docs/aws/diagramas-aws.md                           Canonical source of the 7 Mermaid diagrams for FASE 8
microframework/adr/ADR-MF-005-ecs-fargate-vs-ec2.md  Decision: ECS Fargate vs EC2/EKS
microframework/adr/ADR-MF-006-n8n-queue-mode.md    Decision: Queue Mode with Redis BullMQ
microframework/adr/ADR-MF-007-rds-multi-az.md      Decision: RDS PostgreSQL Multi-AZ in Production
docs/guia-buenas-practicas.md                       R5 deliverable — monolithic guide, 12 chapters + 5 appendices
```
