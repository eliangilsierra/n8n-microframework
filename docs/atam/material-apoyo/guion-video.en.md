> 🌐 **Language / Idioma:** English · [Español](guion-video.md)

# Presentation Video Script — External Validation Survey

**Version:** 1.0
**Date:** 2026-05-07
**Target duration:** 5:00 to 7:00 minutes
**Suggested platform:** Loom (records screen + camera in one click, generates a public link instantly)
**Style:** academic-professional, sober, clear and direct language
**Audience:** senior software professionals (3+ years) who are not familiar with the project

---

## Structure by time blocks

### Block 0 · Opening (0:00 – 0:30) · 30 s

**On camera, with the title slide visible in the background:**

> "Hi, I'm Elian Gil. I'm wrapping up my master's thesis in Software Management, Application, and Development at Universidad Autónoma de Bucaramanga, advised by Dr. Sebastián Roa.
>
> Over the next five minutes I'll briefly walk you through what I did, the main results, and at the end I'll ask for your expert opinion — that's an additional ten minutes on a survey."

**Visible slide:**
```
┌──────────────────────────────────────────────────┐
│ LC/NC architectural micro-framework for n8n     │
│ ATAM evaluation and external validation         │
│                                                  │
│ Elian Hernando Gil Sierra · MGADS · UNAB · 2026 │
└──────────────────────────────────────────────────┘
```

---

### Block 1 · The problem (0:30 – 1:30) · 60 s

**Switch to screen sharing with the following slide:**

> "The concrete problem: Low-Code/No-Code platforms like n8n, Zapier, or Power Automate are exploding — Gartner projects that 70% of new enterprise applications will incorporate them by 2025. But their adoption tends to be improvised: flows without architecture, hardcoded secrets, no retry, no idempotency, no structured observability.
>
> This generates accelerated technical debt, security risks, and difficult operations. The literature documents it as a systemic problem.
>
> My research question: can we define an architectural micro-framework for n8n that applies Clean Architecture and DevSecOps principles, and that demonstrably improves the relevant quality attributes?"

**Suggested slide:**
```
┌──────────────────────────────────────────────────┐
│ LC/NC adoption without architectural governance │
│                                                  │
│ • 70% of new apps in 2025 (Gartner)             │
│ • Recurring antipatterns:                        │
│   - Secrets in JSON                              │
│   - No retry or idempotency                      │
│   - Unstructured logs                            │
│   - Domain logic mixed with integration          │
│                                                  │
│ → Accelerated technical debt                     │
└──────────────────────────────────────────────────┘
```

---

### Block 2 · The proposal (1:30 – 2:30) · 60 s

> "My proposal is a micro-framework that structures any n8n flow into four functional stages with single responsibility, and implements ten verifiable mandatory rules.
>
> The four stages are: E1, which validates input and authenticates; E2, which applies business rules without touching integrations; E3, which is the only layer that talks to external services such as databases or APIs; and E4, which produces the output or notification.
>
> The framework includes ten rules with a verifiable binary criterion — secrets kept out of the JSON, error workflow configured, retry on HTTP, idempotency, structured logging, input validation, and so on. It includes five design patterns, eleven identified antipatterns, an executable static validator, and a minimum observability guide."

**Slide — metamodel diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│              n8n Orchestrator + Error Workflow               │
│                                                             │
│   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐                 │
│   │  E1  │──▶│  E2  │──▶│  E3  │──▶│  E4  │                 │
│   │      │   │      │   │      │   │      │                 │
│   │Vali- │   │Domain│   │Integ-│   │Out-  │                 │
│   │date  │   │      │   │ratio-│   │put   │                 │
│   │input │   │      │   │ns    │   │      │                 │
│   └──────┘   └──────┘   └──────┘   └──────┘                 │
│                                                             │
│   10 rules · 5 patterns · 11 antipatterns · validator       │
└─────────────────────────────────────────────────────────────┘
```

---

### Block 3 · Bot case study (2:30 – 3:15) · 45 s

**Show the Bot's as-is and to-be diagrams side by side:**

> "The first case is a support bot. The as-is design, intentionally unstructured to represent the typical state of improvised adoption, has 16 nodes and violates 9 of the 10 rules. Hardcoded tokens, no retry, no idempotency.
>
> The to-be design, applying the framework, ends up as an orchestrator with two subflows: E2 domain and E3 adapter. It complies with 10 of 10 rules.
>
> Results measured over 4,000 runs: Change Request impact drops from 5 modified nodes per change to 1 — an 81% reduction. The failure rate drops from 9 to 6 percent. The mean time to diagnose failures drops from 5-10 minutes to 14 seconds. And zero literal secrets in the JSON."

**Slide — compact table:**
```
                            As-is      To-be      Δ
Nodes per CR (average)      5.3        1.0        −81 %
Time per CR (min)          32.7        6.7        −79 %
Runtime failures             9 %        6 %       −36.6 %
Diagnosis MTTD            5-10 min    ~14 s       much better
Secrets in JSON               4         0         −100 %
Checklist compliance         n/a       100 %      ✅
```

---

### Block 4 · IoT case study (3:15 – 4:00) · 45 s

> "The second case is an IoT pipeline — ingestion, validation, persistence, and notification of environmental sensor readings. Same pattern: as-is with antipatterns, to-be with the framework.
>
> The to-be has an orchestrator, four subflows, one per stage, and an error handler with a dead-letter in PostgreSQL so as not to lose critical readings.
>
> Similar results in maintainability and security — an 84% reduction in CR impact. But here appears the most interesting trade-off in the study: latency. Sensor readings in the to-be have between 119 and 192 percent more latency than in the as-is, due to the overhead of Execute Workflow calls between subflows.
>
> This is explicitly documented as a Tradeoff Point: the project prioritizes maintainability over latency. But this is exactly the kind of decision where your outside opinion is valuable: is this trade-off defensible for your context?"

**Slide:**
```
IoT case — Quantified trade-off

                  Maintainability            Latency p50
                  (CR impact)                (Set A)
As-is             6.3 nodes / CR             78 ms
To-be             1.0 nodes / CR             171 ms

                  −84 %                      +119 %

TP-GLOBAL-01: Acceptable or blocking in your context?
```

---

### Block 5 · ATAM evaluation and findings (4:00 – 4:45) · 45 s

> "On these cases I applied ATAM, the architecture evaluation method by Bass and Kazman. I defined 12 top-K scenarios, 6 per case, with quantitative response measures. 100% coverage with traceable evidence.
>
> I identified 15 formal findings: 3 Sensitivity Points, 3 Tradeoff Points, 4 open Risks, and 5 Non-risks.
>
> The most interesting runtime finding: when I ran the fault-tolerance test by stopping the notification service, I discovered that the IoT error handler notifies the same downed service — an unanticipated circular dependency that I documented as SP-IOT-01. The sensor data is safe because persistence happens beforehand and is independent, but the dead-letter gets blocked. That's exactly the kind of finding ATAM looks for."

**Slide:**
```
ATAM Analysis — 15 architectural findings

   3  Sensitivity Points     (affect 1 attribute)
   3  Tradeoff Points        (multi-attribute, opposing directions)
   4  Open Risks             (mitigation in production)
   5  Non-risks              (protected decisions)

  100% ATAM coverage with traceable evidence
  19 ADRs documenting all decisions
```

---

### Block 6 · What I need from you and closing (4:45 – 5:30) · 45 s

**Back to camera:**

> "The framework is complete and the results are measured. What's missing is external validation from people like you — senior professionals with 3 or more years of experience in software, in any role: development, architecture, DevOps, security, QA.
>
> The survey has two parts. The main part takes 10 to 12 minutes: five demographic questions, eight perceived-validation questions on a Likert scale, three open questions about risks and trade-offs, and two on overall perception.
>
> There's an optional advanced section of 15 additional minutes for a mini-ATAM — scoring the 12 scenarios and architectural classification. If you have the time, this section is the one that contributes the most methodological value to the study.
>
> The 4-page PDF you downloaded has all the information you need to answer with informed judgment. The open questions are the most valuable — I'm looking for you to identify risks and trade-offs that I may have overlooked.
>
> Thank you so much for your time. Your opinion goes directly into the rigor of the thesis."

**Final slide:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  📋 Survey (10-12 min):     [URL_FORM]           │
│  📄 Summary PDF (5 min):    [URL_PDF]            │
│                                                  │
│  Optional mini-ATAM section:  +15 min            │
│                                                  │
│  Anonymous · Voluntary · Academic use            │
│                                                  │
│  Elian Hernando Gil Sierra                       │
│  MGADS — UNAB — 2026                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Notes for the recording

### Before recording

1. **Audio test.** Record 30 seconds of test audio and verify level/quality.
2. **Slides ready.** Have all 6 slides prepared in order, ideally with simple transitions (no distracting animations).
3. **Timed rehearsal.** Do a full run-through with a stopwatch. If it exceeds 7 minutes, trim the narrative.
4. **Camera framing.** Medium shot (waist up), good frontal lighting, neutral background.
5. **Clean screen.** Close chat, email, and other notifications.

### During recording

1. **Speak at a natural pace** — don't read the script literally; keep the key points at hand and narrate.
2. **Strategic pauses** between blocks (1-2 s) make post-production easier.
3. **Look at the camera** during the opening and closing; in blocks 1-5 you can look at the slides.
4. **Avoid excessive filler words** ("uh", "um", "like"). If you make a mistake, pause for 3 seconds and restart from the beginning of the paragraph — it makes clean cutting easier.

### After recording

1. **Full review** before publishing.
2. **Auto-generated subtitles** enabled (Loom and YouTube generate them automatically).
3. **Chapters/markers** optional (Loom allows adding timestamps): "Problem 0:30", "Proposal 1:30", "Bot Case 2:30", etc.
4. **Access permissions:**
   - **Loom:** "Anyone with link can view"
   - **YouTube:** "Unlisted" (not public, not private)
5. **Final URL** is copied to `docs/atam/material-apoyo/README.md` and substituted into the dissemination templates.

### Final video quality checklist

- [ ] Duration 5:00 to 7:00 minutes
- [ ] Clear audio, no distracting background noise
- [ ] Image 1080p minimum
- [ ] No sensitive personal information visible (emails, passwords, third-party data)
- [ ] All 6 slides display correctly when switching
- [ ] The final slide shows visible URLs (even if they are placeholders in the recording; the real URLs go in the video description and the invitation email)
- [ ] Subtitles available in the player

---

## Script variations (optional)

If feedback after piloting suggests the video is too dense or not accessible enough for non-architect profiles, consider recording a variant:

- **Variant A — "Developers only":** emphasis on applicable patterns (retry, idempotency, structured logging), less emphasis on formal ATAM.
- **Variant B — "Architects / leads only":** emphasis on ATAM findings, trade-offs, and design decisions; skip the basic explanations of the patterns.

Not mandatory; the main version of this script serves both profiles if the respondent also reviews the PDF.
