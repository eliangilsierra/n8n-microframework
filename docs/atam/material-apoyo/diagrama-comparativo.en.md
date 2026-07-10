> 🌐 **Language / Idioma:** English · [Español](diagrama-comparativo.md)

# Comparative As-is vs To-be Diagrams — Mermaid Source

**Version:** 1.0
**Date:** 2026-05-07
**Purpose:** Mermaid source code for the comparative diagrams included in the executive summary PDF and in the video slides. PNG render generatable from https://mermaid.live or with the `mmdc` CLI.

---

## 1. Diagram 1 — Bot Case · As-is vs To-be

### As-is Bot (16 nodes, visible antipatterns)

```mermaid
flowchart LR
  subgraph AS_IS_BOT["BOT AS-IS · 16 nodes · 9 of 10 REGs violated"]
    direction LR
    W1[Webhook]:::antipat --> V1[Validate Payload<br/>hardcoded token]:::antipat
    V1 --> RL[Rate Limit<br/>in memory]:::antipat
    RL --> CK[Check Token<br/>literal in code]:::antipat
    CK --> PM[Process Message<br/>business + integration]:::antipat
    PM --> CP[Calculate Priority<br/>scattered logic]:::antipat
    CP --> H1[HTTP Tickets<br/>hardcoded api-key]:::antipat
    H1 --> PR[Parse Response<br/>no error handling]:::antipat
    PR --> H2[HTTP Notif<br/>no retry]:::antipat
    H2 --> SR[Set Response]:::antipat
    SR --> R1[Respond]:::antipat
  end
  classDef antipat fill:#fdd,stroke:#c33,stroke-width:1px,color:#000
```

### To-be Bot (orchestrator + 2 subflows, 10/10 REGs)

```mermaid
flowchart LR
  subgraph TO_BE_BOT["BOT TO-BE · Orchestrator + 2 subflows · 10/10 REGs ✅"]
    direction LR
    W2[Webhook]:::ok --> E1[E1<br/>Validation + Auth<br/>$env.BOT_API_TOKEN]:::ok
    E1 -->|invalid| R401[401/400]:::ok
    E1 -->|valid| E2[E2 subflow<br/>Domain<br/>centralized rules]:::ok
    E2 --> E3[E3 subflow<br/>Ticket adapter<br/>Idempotency-Key + retry]:::ok
    E3 --> R2[Respond]:::ok
    EW[Error Workflow<br/>JSON log + dead-letter]:::ew -.->|on error| E1
    EW -.->|on error| E2
    EW -.->|on error| E3
  end
  classDef ok fill:#dfd,stroke:#383,stroke-width:1px,color:#000
  classDef ew fill:#fed,stroke:#a73,stroke-width:1px,color:#000,stroke-dasharray: 4 2
```

### Side-by-side comparison (narrated text in the PDF)

```
AS-IS (anti):  webhook → 16 linear nodes with antipatterns → respond
                       (hardcoded token, no retry, no idempotency,
                        no error workflow, mixed logic)

TO-BE (clean): webhook → E1 → [E2 subflow] → [E3 subflow] → respond
                       └─→ Error workflow (JSON log + dead-letter)

Measured improvements:
  • CR impact:     5.3 nodes → 1.0 node        (−81 %)
  • CR time:       32.7 min → 6.7 min          (−79 %)
  • Failures:      9 % → 6 %                   (−36.6 %)
  • MTTD:          5-10 min → ~14 s
  • Secrets:       4 literals → 0
```

---

## 2. Diagram 2 — IoT Case · As-is vs To-be

### As-is IoT (14 nodes, visible antipatterns)

```mermaid
flowchart LR
  subgraph AS_IS_IOT["IOT AS-IS · 14 nodes · 9 of 10 REGs violated"]
    direction LR
    WI1[Webhook]:::antipat --> VP[Partial Validation<br/>no schema]:::antipat
    VP --> CN[Calculate Level<br/>scattered thresholds]:::antipat
    CN --> TC{Critical Temp?}:::antipat
    TC -->|yes| H3[HTTP Critical Notif<br/>no retry]:::antipat
    TC -->|no| TH{High Humidity?}:::antipat
    TH -->|yes| H4[HTTP Warning Notif<br/>no retry]:::antipat
    TH -->|no| INS[INSERT without<br/>ON CONFLICT<br/>literal credentials]:::antipat
    H3 --> INS
    H4 --> INS
    INS --> RI[Respond 200<br/>even with errors]:::antipat
  end
  classDef antipat fill:#fdd,stroke:#c33,stroke-width:1px,color:#000
```

### To-be IoT (orchestrator + 4 subflows + error handler, 10/10 REGs)

```mermaid
flowchart LR
  subgraph TO_BE_IOT["IOT TO-BE · Orchestrator + 4 subflows + Error Handler · 10/10 REGs ✅"]
    direction LR
    WI2[Webhook]:::ok --> E1I[E1 subflow<br/>Schema validation<br/>+ timestamp authority]:::ok
    E1I -->|invalid 422| R422[Respond 422]:::ok
    E1I -->|valid| E2I[E2 subflow<br/>Domain<br/>centralized THRESHOLDS]:::ok
    E2I --> E3I[E3 subflow<br/>Persistence<br/>idempotency_key<br/>ON CONFLICT]:::ok
    E3I --> E4I[E4 subflow<br/>Notification<br/>level-based routing<br/>differentiated retry]:::ok
    E4I --> RIB[Respond]:::ok
    EWI[Error Handler<br/>JSON log + payload<br/>PostgreSQL dead-letter]:::ew -.->|on error| E1I
    EWI -.->|on error| E2I
    EWI -.->|on error| E3I
    EWI -.->|on error| E4I
  end
  classDef ok fill:#dfd,stroke:#383,stroke-width:1px,color:#000
  classDef ew fill:#fed,stroke:#a73,stroke-width:1px,color:#000,stroke-dasharray: 4 2
```

### Side-by-side comparison IoT

```
AS-IS (anti):  webhook → 14 nodes · no schema · no idempotency ·
                          scattered thresholds · literal credentials ·
                          respond 200 even with errors

TO-BE (clean): webhook → E1 → E2 → E3 → E4 → respond
                          └─→ Error handler with PostgreSQL dead-letter

Measured improvements:
  • CR impact:     4.3 nodes → 0.7 nodes       (−84 %)
  • CR time:       28.0 min → 5.2 min          (−81 %)
  • Compliance:    6/7 violated → 10/10 ✅
  • Secrets:       multiple → 0
  • MTTD:          5-10 min → ~14 s (structural)

Quantified trade-off (TP-GLOBAL-01):
  • Latency p50 Set A:  78 ms → 171 ms       (+119 %)
  • Latency p50 Set B:  78 ms → 182 ms       (+134 %)
  • Decision: accepted, ADR-001 IoT prioritizes maintainability
```

---

## 3. Diagram 3 — E1–E4 Metamodel (generic for any n8n flow)

```mermaid
flowchart LR
  subgraph ORQ["n8n Orchestrator"]
    direction LR
    WBH[Webhook<br/>single entry point]:::entry
    WBH --> EE1[E1 Validation<br/>schema · auth<br/>early rejection<br/>HTTP 400/401/422]:::stage
    EE1 -->|valid| EE2[E2 Domain<br/>business rules<br/>NO integrations<br/>NO external HTTP]:::stage
    EE2 --> EE3[E3 Adapters<br/>external integrations<br/>idempotency<br/>retry]:::stage
    EE3 --> EE4[E4 Output<br/>notification or response<br/>context-based routing]:::stage
    EE4 --> RFIN[Respond]:::entry
  end
  ERWF[Error Workflow<br/>dead-letter + JSON log]:::err -.->|on error| EE1
  ERWF -.->|on error| EE2
  ERWF -.->|on error| EE3
  ERWF -.->|on error| EE4
  classDef entry fill:#cce,stroke:#225,stroke-width:1px,color:#000
  classDef stage fill:#dfd,stroke:#383,stroke-width:1px,color:#000
  classDef err fill:#fed,stroke:#a73,stroke-width:1px,color:#000,stroke-dasharray: 4 2
```

**Conventions applied in the metamodel:**
- E1 never talks to external services
- E2 never talks to external services (pure logic only)
- E3 is the only layer that executes HTTP integrations, DB, queues
- E4 produces output (response to the webhook or notification to a channel)
- The error workflow triggers automatically on any exception
- Each stage emits exactly one JSON log per execution

---

## 4. Diagram 4 — ATAM scenario × approach mapping

(Optional complementary diagram for the video's block 5 slide.)

```mermaid
flowchart TB
  subgraph SC["12 top-K ATAM Scenarios"]
    direction TB
    BQ1[BOT-Q1<br/>Rule modifiability]
    BQ2[BOT-Q2<br/>Provider change]
    BQ3[BOT-Q3<br/>Confidentiality]
    BQ4[BOT-Q4<br/>Retry integrity]
    BQ5[BOT-Q5<br/>MTTD diagnosis]
    BQ6[BOT-Q6<br/>HTTP contracts]
    IQ1[IOT-Q1<br/>Threshold adjustment]
    IQ2[IOT-Q2<br/>Alert channel]
    IQ3[IOT-Q3<br/>Reading integrity]
    IQ4[IOT-Q4<br/>Network fault tolerance]
    IQ5[IOT-Q5<br/>Differentiated urgency]
    IQ6[IOT-Q6<br/>DB confidentiality]
  end
  subgraph AP["12 architectural approaches"]
    direction TB
    A01[AP-01 E1-E4 separation]
    A04[AP-04 Retry]
    A05[AP-05 Idempotency]
    A06[AP-06 Error workflow]
    A07[AP-07 Structured logging]
    A09[AP-09 Differentiated routing]
    A11[AP-11 Static validator]
  end
  BQ1 --> A01
  BQ2 --> A01
  BQ3 --> A11
  BQ4 --> A05
  BQ5 --> A07
  BQ6 --> A07
  IQ1 --> A01
  IQ2 --> A01
  IQ3 --> A05
  IQ4 --> A06
  IQ4 --> A04
  IQ5 --> A09
  IQ6 --> A11
```

---

## 5. Rendering for PDF and slides

### Direct render with Mermaid Live Editor

1. Copy the desired ```` ```mermaid ... ``` ```` block
2. Paste into https://mermaid.live
3. Adjust theme (recommended: "default" or "neutral" for printed PDF)
4. Export as high-resolution PNG (width ≥ 1600 px)
5. Save as `docs/atam/material-apoyo/diagrama-{N}-{name}.png`

### Render with mmdc CLI (mermaid-cli)

```bash
# One-time installation
npm install -g @mermaid-js/mermaid-cli

# Render a specific diagram (extract the mermaid block to a .mmd file first)
mmdc -i diagrama-bot-asis.mmd -o diagrama-bot-asis.png -w 1920 -H 1080 -b transparent
```

### Recommended configuration for printing

- Minimum width: 1600 px (for a 4-page PDF)
- Background: transparent or white
- Theme: `default` (high contrast for printing)
- Minimum legible font size: 12 pt
