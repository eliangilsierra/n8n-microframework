> 🌐 **Language / Idioma:** English · [Español](fundamento-teorico.md)

# Theoretical foundation of the micro-framework

**Version:** 1.0
**Date:** 2026-05-01
**Author:** Elian Hernando Gil Sierra
**Purpose:** Articulate the conceptual basis of the micro-framework in Clean Architecture,
DevSecOps, and the LC/NC literature, and position it against comparable work.

---

## 1. Clean Architecture (Martin, 2017)

### 1.1 SOLID principles applied to the micro-framework

| Principle | Application in the micro-framework |
|-----------|----------------------------------|
| **SRP** (Single Responsibility) | Each E1–E4 stage has a single responsibility: validate, decide, integrate, or respond. No stage crosses that boundary. |
| **OCP** (Open/Closed) | Business rules in E2 can be extended (adding rules to the `REGLAS` array) without modifying the adapters in E3 or E4. |
| **LSP** (Liskov Substitution) | Subflows are interchangeable: a different E3 can be implemented without changing E1, E2, or E4, as long as it respects the JSON Schema contract. |
| **ISP** (Interface Segregation) | I/O contracts (JSON Schema) are specific per stage — E2 only receives what it needs from E1's output, not the full payload. |
| **DIP** (Dependency Inversion) | E2 (domain) does not depend on E3 (adapters). E3 depends on E2's contract, not the other way around. The dependency direction always points toward the domain. |

### 1.2 E1–E4 mapping to Clean Architecture layers

```
┌─────────────────────────────────────────────┐
│  Frameworks & Drivers (n8n, PostgreSQL, HTTP) │
│  → E3 Integration adapters                    │
│  → E4 Controlled output (Respond Webhook)     │
├─────────────────────────────────────────────┤
│  Interface Adapters                           │
│  → E3 (format transformation)                 │
│  → E1 (input normalization)                   │
├─────────────────────────────────────────────┤
│  Application Business Rules (Use Cases)       │
│  → E1 (input contract validation)             │
│  → E2 (domain rule orchestration)             │
├─────────────────────────────────────────────┤
│  Enterprise Business Rules (Entities)         │
│  → REGLAS, UMBRALES constants in E2           │
│  → I/O contract JSON Schemas                  │
└─────────────────────────────────────────────┘
```

### 1.3 Boundary Rule in n8n

In Clean Architecture, data crossing layer boundaries must only flow inward (from
frameworks toward entities). In the micro-framework:

- The input HTTP payload only enters E1 (validation). E2 receives only E1's validated
  output (`{valido, errores, run_id, start_ts, payload}`).
- E2 only passes its enriched result to E3. E3 cannot "ask back" to E2.
- The `run_id` generated in E1 propagates outward (E2, E3, E4, response) but is never
  modified — it is immutable from its generation onward (REG-002).

---

## 2. DevSecOps

### 2.1 NIST SP 800-218 SSDF (Secure Software Development Framework)

NIST SP 800-218 v1.1 (2022) defines practices for integrating security into the development
lifecycle. The following SSDF practices are directly implemented by the micro-framework:

| SSDF practice | Description | Micro-framework implementation |
|---------------|-------------|-----------------------------------|
| **PO.1** (Define Security Requirements) | Define security requirements as part of the development process | REG-001 defines the binary requirement: zero credentials in JSON |
| **PS.1** (Store and Transmit Sensitive Data Securely) | Do not store secrets in code artifacts | Pillar 1 — Secrets Management via n8n Credentials |
| **PS.3** (Archive and Protect Each Software Release) | Version only artifacts without secrets | `.gitignore` excludes `.env`; REG-001 verified before versioning |
| **RV.1** (Identify and Confirm Vulnerabilities) | Review vulnerabilities before deploying | Pillar 2 — `validar-flujos.mjs` verifies REG-001..010 over the JSON |
| **RV.2** (Assess, Prioritize, and Remediate Vulnerabilities) | Prioritize and remediate findings | `checklist-devsecops.md` with 8 items prioritized by severity |
| **PW.4** (Reuse Existing, Well-Secured Software) | Reuse known secure components | Native n8n retry (no custom implementation) — REG-004 |
| **PW.5** (Create Source Code by Adhering to Secure Coding Practices) | Apply secure coding practices | REG-001..010 as verifiable practices with binary criteria |

### 2.2 OWASP Top 10 2021 — Micro-framework coverage

| OWASP category | Relationship to the micro-framework |
|-----------------|------------------------------|
| **A02:2021 Cryptographic Failures** | REG-001 directly prevents this: credentials in the exported JSON are equivalent to sensitive data in the repository |
| **A01:2021 Broken Access Control** | REG-009 + E1 validate authentication before processing (401 for invalid token, 400 for missing fields) |
| **A09:2021 Security Logging and Monitoring Failures** | REG-006 (structured JSON log) + the observability guide directly address this risk |

### 2.3 The three DevSecOps pillars in n8n

| Pillar | Specific problem in n8n | Micro-framework solution |
|-------|---------------------------|------------------------------|
| 1. Secrets Management | n8n exports the full JSON including node configuration with literal values | Credentials only as name references (`$credentials["name"]`); REG-001 |
| 2. Automated Validation | No native tool exists to verify architectural rule compliance in n8n flows | `validar-flujos.mjs` — a Node.js script that evaluates REG-001..010 over the exported JSON |
| 3. Operational Resilience | Failures in n8n are silent with no errorWorkflow; internal logs are not programmatically queryable | REG-003 (errorWorkflow), REG-004 (retry), REG-005 (idempotency), REG-006 (JSON logs on stdout) |

---

## 3. LC/NC literature

### 3.1 Gap identified in the literature

| Source | Finding | Implication for this work |
|--------|----------|-------------------------------|
| Bock & Frank (2021) "Low-Code Platform" — BISE | No existing framework (as of 2021) defines formal architectural rules for LC/NC platforms | The proposed micro-framework covers this gap specifically for n8n |
| Richardson & Watt (2018) "Low-Code Development Platform" | LC/NC systems lack observability and traceability patterns equivalent to those available in traditional development | REG-006 + the observability guide address this gap |
| Cabot (2020) "Positioning of Low-Code Development Platforms" — JOT | The proliferation of LC/NC platforms lacks standardized quality evaluation frameworks | Using ISO/IEC 25010 as the micro-framework's evaluation framework is a direct contribution to this gap |
| Sahay et al. (2020) "Supporting the understanding and comparison of low-code development platforms" — SANER | Comparisons between LC/NC platforms are difficult due to a lack of common criteria | The 10 binary REG-001..010 criteria with ISO 25010 mapping provide a comparable basis |

### 3.2 Comparable frameworks — absence of equivalents for n8n

| Framework / Guide | Platform | Stage metamodel | Binary criteria | Automated verification |
|-----------------|------------|---------------------|-------------------|------------------------|
| **Microsoft Power Platform DLP** | Power Platform | No | No (qualitative policies) | Partial (governance center) |
| **Zapier Best Practices Guide** | Zapier | No | No (recommendations) | No |
| **n8n Community Guidelines** (2026) | n8n | No | No | No |
| **This micro-framework** | n8n | Yes (E1–E4) | Yes (REG-001..010) | Yes (`validar-flujos.mjs`) |

The table confirms that the micro-framework is the first to formalize, for n8n:
(a) a stage metamodel with explicit responsibilities,
(b) rules with a binary verification criterion,
(c) a static verification script executable over the exported JSON.

---

## 4. Positioning of the micro-framework

### 4.1 Original contribution

The micro-framework is the first (to the author's knowledge, 2026) to formalize for the
n8n platform:

1. **Stage metamodel (E1–E4)** — an explicit translation of Clean Architecture's layers
   into n8n's visual node paradigm, with non-overlapping responsibilities and a JSON Schema
   contract per stage.

2. **Rules with a binary criterion and ISO 25010 traceability** — 10 rules verifiable as
   "pass / fail" over the exported artifact (not over the source code or the execution),
   mapped to 5 characteristics of the ISO/IEC 25010:2011 quality model.

3. **Automatic static verification** — `validar-flujos.mjs` evaluates REG-001..010 over
   n8n's exported JSON without needing to run the flow, without connecting to an n8n
   instance, and with no external dependencies beyond Node.js.

4. **Integration of the three DevSecOps pillars in the visual context** — secrets
   management (REG-001), automated validation (validar-flujos.mjs), and operational
   resilience (REG-003, REG-004, REG-005, REG-006) are implemented with native n8n
   primitives, without introducing external dependencies.

### 4.2 Declared limitations

- The micro-framework is specific to n8n v1.x. The mechanisms (`Execute Workflow`,
  `Respond to Webhook`, `$getWorkflowStaticData`) are n8n proprietary.
- Static verification (Pillar 2) cannot detect semantic errors in E2's logic — it only
  verifies the presence of structures in the JSON.
- Evaluation is performed in a local lab environment. Latency metrics (REG-006) are not
  directly extrapolable to production environments with real load.

---

## 5. References

- Martin, R.C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- NIST (2022). *SP 800-218 Secure Software Development Framework (SSDF) v1.1*. National Institute of Standards and Technology.
- ISO/IEC (2011). *ISO/IEC 25010:2011 — Systems and software quality models*. International Organization for Standardization.
- Yin, R.K. (2018). *Case Study Research and Applications: Design and Methods* (6th ed.). SAGE Publications.
- Wohlin, C. et al. (2012). *Experimentation in Software Engineering*. Springer.
- Bock, A. & Frank, U. (2021). Low-Code Platform. *Business & Information Systems Engineering*, 63(6), 733–740.
- Cabot, J. (2020). Positioning of Low-Code Development Platforms. *Journal of Object Technology*, 19(2).
- Sahay, A. et al. (2020). Supporting the understanding and comparison of low-code development platforms. *IEEE SANER 2020*.
- OWASP (2021). *OWASP Top Ten 2021*. Open Web Application Security Project.
