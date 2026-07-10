> 🌐 **Language / Idioma:** English · [Español](plan-difusion.md)

# Survey Distribution Plan — External Validation

**Version:** 1.0
**Date:** 2026-05-07
**Protocol:** [`protocolo-encuesta.md`](protocolo-encuesta.md)
**Purpose:** Define how the target panel of 15–30 respondents is reached for the broad survey and 3–5 experts for the mini-ATAM, which channels are used, what messages are sent, and when reminders are executed.

---

## 1. Quantitative objectives

| Metric | Minimum | Desirable |
|---|:---:|:---:|
| Section A-D respondents | 15 | 25-30 |
| Section E respondents (mini-ATAM) | 3 | 5 |
| Role heterogeneity | 3 distinct | 5 distinct |
| Expected response rate (industry) | 10-15 % | 25-30 % |
| Invitations to send | 100 | 150-200 |

---

## 2. Prioritized distribution channels

### 2.1 Direct channel (highest expected response rate: 25-40 %)

**Email/LinkedIn DM/direct WhatsApp to the author's professional contacts.**

Advantage: prior relationship increases conversion.
Disadvantage: limited pool; bias toward closeness to the author.

### 2.2 n8n communities (expected rate: 5-10 %)

- **Official n8n Discord** (community.n8n.io) — `#general` and `#self-hosting` channels
- **n8n community forum** (community.n8n.io) — "Discussions" category
- **r/n8n subreddit** (if applicable)

Advantage: respondents with high LC/NC familiarity.
Disadvantage: requires respecting community rules (no spam); low response rate.

### 2.3 Academic and professional groups (expected rate: 10-20 %)

- **MGADS-UNAB classmates and professors** — program WhatsApp group, direct contacts
- **Architecture and DevOps WhatsApp/Telegram groups**
- **Local Bucaramanga communities**

### 2.4 Public LinkedIn (expected rate: 1-5 %)

Post on the author's personal profile asking for support. Low conversion but broad reach.

### 2.5 Controlled snowball

Ask the first 10–15 respondents to forward the invitation to up to 2 colleagues who fit the profile. Specific message for the snowball included below.

---

## 3. Message templates

### 3.1 Template A — Direct email/DM to close contacts

```
Subject: I need your expert opinion (10 min) — MGADS-UNAB Thesis

Hi [Name],

I hope you're doing well. I'm writing because I'm in the final stage of my
Master's thesis in Software Management, Application, and Development
(MGADS) at Universidad Autónoma de Bucaramanga.

My thesis proposes an architectural micro-framework for n8n workflows
(Low-Code/No-Code automation) with Clean Architecture principles and
DevSecOps practices, evaluated using ATAM. As part of the external
validation component, I need to gather expert opinions like yours.

It's approximately 10–12 minutes:
   • 5 min to review a 4-page PDF + a short 5-min video
   • 10 min to answer a concise survey (scales + 3 open-ended questions)

Your opinion is valuable because [personalized reason based on the profile —
e.g., "you work with similar microservice architectures", "you have
experience with production integration flows", "you lead DevSecOps
decisions"].

📄 Prior material: [URL_PDF]
🎥 Video: [URL_VIDEO]
📋 Survey: [URL_GOOGLE_FORM]

(There's an optional additional 15-min section for detailed architectural
evaluation if you're interested in going deeper — entirely optional).

Thanks so much for considering it. Your contribution directly supports the
rigor of the thesis.

A big hug,
Elian Hernando Gil Sierra
MGADS Student – UNAB
```

### 3.2 Template B — Message for public LinkedIn

```
🎓 I need your support (10 min) — External validation of my Master's thesis

I'm wrapping up my MGADS thesis at UNAB on an architectural micro-framework
for Low-Code/No-Code workflows in n8n, evaluated using ATAM (Architecture
Tradeoff Analysis Method).

I'm looking for expert opinions from professionals with 3+ years in
development, architecture, DevOps, security, or QA, to externally validate
the architectural conclusions.

📋 Anonymous survey: [URL_GOOGLE_FORM]
📄 Prior material (5 min read): [URL_PDF]
🎥 Video: [URL_VIDEO]

⏱ Total time: ~15 minutes (including prior material).

If you know someone with a senior technical profile who could contribute,
I'd appreciate it if you'd forward this.

Any feedback is extremely valuable — thanks!

#n8n #SoftwareArchitecture #DevSecOps #LowCode #CleanArchitecture #ATAM #Thesis
```

### 3.3 Template C — Message to n8n communities (Discord/Forum)

```
📋 [Survey] Academic validation of an n8n architectural micro-framework
(MSc thesis, ~10 min) — looking for input from experienced developers

Hi everyone,

I'm finalizing my MSc thesis at the Autonomous University of Bucaramanga
(Colombia, MGADS program). I designed a micro-framework for n8n workflows
based on Clean Architecture principles and DevSecOps practices, then evaluated
it with ATAM on two case studies (a support bot and an IoT pipeline).

I'd love to get your expert opinion as part of the external validation
component. The survey is short and focused:

   ⏱  ~10-12 minutes total
   🌐  Anonymous, voluntary
   🎯  Looking for 3+ years of experience in software roles
   📊  Validates perceived utility + identifies risks/tradeoffs

📄 Background material (PDF, 4 pages): [URL_PDF]
🎥 Video summary (5 min): [URL_VIDEO]
📋 Survey: [URL_GOOGLE_FORM]

If you have time for an additional 15-min deep-dive mini-ATAM (architectural
scoring on 12 quality scenarios), there's an optional section at the end —
very valuable for the academic rigor of the study.

Thanks so much for considering this 🙏

Elian Hernando Gil Sierra
MGADS Student — UNAB
```

### 3.4 Template D — Message for the snowball (forwarding)

```
Hi, Elian Gil (MGADS-UNAB) is wrapping up his thesis and needs expert
opinions from people with 3+ years in software (any role: dev, architecture,
DevOps, security, QA).

It's 10-12 min, anonymous. His thesis is about clean architecture applied to
LC/NC workflows in n8n.

📋 Survey: [URL]
📄 Material: [URL]
🎥 Video: [URL]

If you know anyone suitable, we'd appreciate you forwarding it. Thanks!
```

### 3.5 Template E — Express invitation to experts for the mini-ATAM

(Send only to selected contacts with an architect/lead profile, 5+ years of experience, and familiarity with ATAM)

```
Hi [Name],

I'm writing to you separately because your profile as [specific role] with
[years] of experience is exactly what I need for the optional advanced
section of my thesis survey.

Beyond the general survey (10 min), there's an optional mini-ATAM section
(15 additional minutes) where the 12 quality scenarios are evaluated with
1-5 as-is/to-be scoring and classified as sensitivity point, tradeoff
point, risk, or non-risk.

This section is the one that provides the greatest methodological value to
the study (it allows calculating inter-rater agreement with your opinion
and 2-3 other selected experts).

If you have 25-30 minutes available this week, it would be an enormous
contribution.

📋 Full survey (includes mini-ATAM at the end): [URL]

No pressure — if you can only do the main part, that's valuable too.

Thanks so much,
Elian
```

---

## 4. List of candidates (template to fill in)

Keep in a separate sheet (can be a private Google Sheets) with the following structure. This list is **NOT committed** to the repository (it contains personal data).

| # | Name | Role | Company | Years exp. | Channel | Template | Invitation date | Status | Response date | Mini-ATAM? | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [Name 1] | Architect | [Company] | 12 | LinkedIn DM | E (expert) | YYYY-MM-DD | Pending | — | Yes | Knows ATAM well |
| 2 | [Name 2] | Tech Lead | [Company] | 7 | Email | A | YYYY-MM-DD | Responded | YYYY-MM-DD | No | — |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Status categories:**
- Pending — invitation sent, no response
- Responded — completed the survey
- Declined — explicitly declined
- Reminded 1 — first reminder sent (day 7)
- Reminded 2 — second reminder sent (day 14)
- No final response — passed day 21 without responding
- Forwarded — confirmed having forwarded to contacts (snowball)

**Initial invitation list objective:**

| Invitation type | Target # | Expected rate | Expected respondents |
|---|:---:|:---:|:---:|
| Template A (close direct) | 40 | 30 % | 12 |
| Template B (public LinkedIn) | 1 post → 200 views | 2 % | 4 |
| Template C (n8n communities) | 3 posts | 5 % | 5 |
| Template D (snowball) | 20 forwards | 15 % | 3 |
| Template E (mini-ATAM experts) | 8 | 50 % | 4 |
| **Total expected** | **~130** | — | **~28** |

---

## 5. Distribution schedule

| Day | Suggested time | Action |
|:---:|:---:|---|
| **0** (Monday) | 09:00 | **Day before:** verify active URLs, form working, material accessible |
| **1** (Tuesday) | 09:00 | Send Template A to 20 priority contacts (list in `lista-invitados-prioritarios.md`) |
| **1** | 10:00 | Send Template E to 5 selected experts |
| **1** | 14:00 | Post on LinkedIn (Template B) |
| **2** (Wednesday) | 09:00 | Send Template A to 20 second-tier contacts |
| **2** | 11:00 | Post on the official n8n Discord (Template C in English) |
| **3** (Thursday) | 10:00 | Post on the community.n8n.io forum (Template C) |
| **3** | 14:00 | Send to MGADS-UNAB WhatsApp group (adapted Template A) |
| **5** (Saturday) | — | Review responses so far; adjustments if the rate is low |
| **7** (Monday) | 09:00 | **First reminder** to first-wave non-respondents (modified Template A) |
| **8** (Tuesday) | 10:00 | Explicit request for forwarding (Template D) to confirmed respondents |
| **10** (Thursday) | 10:00 | Second LinkedIn post with preliminary metric (e.g., "We're at 12 responses, 13 more to reach the minimum") |
| **14** (Monday) | 09:00 | **Second reminder** + additional express invitation to experts for the mini-ATAM if N E < 3 |
| **17** (Thursday) | 10:00 | Final reminder to non-respondents |
| **21** (Monday) | 09:00 | **Formal close of data collection.** Closing announcement + general thanks. Keep the form open but do not expect more responses for analysis |
| **22-26** | — | Statistical analysis (see `plan-analisis-encuesta.md`) |

---

## 6. List of suggested candidates by role and context

This is an internal guide for the author to prioritize contacts. It should be filled in with real names in a separate, non-committed file.

### 6.1 Architects / Tech Leads (high priority for mini-ATAM)

- Senior colleagues at the current job with architectural responsibility
- Former colleagues with whom architecture collaboration has occurred
- MGADS professors with a technical profile
- Thesis advisor (Sebastián Roa Prada) — invite formally even if he doesn't participate in the sample

### 6.2 Senior developers

- Current and former team members with ≥ 5 years
- LinkedIn contacts with senior profiles at well-known companies

### 6.3 DevOps / SRE

- Contacts in infrastructure roles
- Docker, Kubernetes communities in Bucaramanga/Bogotá

### 6.4 Security

- Contacts with a specific application security role
- OWASP Colombia members / local chapters

### 6.5 QA / Testing

- QA engineers with test automation experience
- Test architects with a systemic quality view

### 6.6 Others (LC/NC specifically)

- Active members of the n8n community
- Consultants who have worked with Zapier, Make, Power Automate

---

## 7. Campaign monitoring metrics

Update weekly (Monday) during the campaign:

| Metric | Day 1 | Day 7 | Day 14 | Day 21 (close) |
|---|:---:|:---:|:---:|:---:|
| Invitations sent | — | — | — | — |
| Responses received | — | — | — | — |
| Cumulative response rate | — | — | — | — |
| Completed mini-ATAMs | — | — | — | — |
| Roles represented | — | — | — | — |
| Decided action | — | — | — | — |

**Threshold-based decisions on day 14:**

| If on day 14… | Action |
|---|---|
| N ≥ 15 + mini-ATAM ≥ 3 | Close on day 21 as planned |
| N ≥ 15 + mini-ATAM < 3 | Focus days 14-21 on experts for mini-ATAM (personalized Template E) |
| N < 15 | Extend the close by 1 additional week (day 28) + second LinkedIn wave + aggressive snowball |
| N < 10 | Report as exploratory evidence; adjust the ATAM report's narrative |

---

## 8. Best practices during distribution

1. **Do not insist excessively.** Maximum 2 reminders per channel.
2. **Personalize Template A.** The `[personalized reason]` field must be real, not copy-paste.
3. **Respect community rules.** Before posting on Discord or the n8n forum, read the channel's rules; prefer channels designated for "research" or "showcase" when they exist.
4. **Thank publicly.** After the close, publish a thank-you (without names) on LinkedIn highlighting the participation received.
5. **Share results.** Fulfill the promise to send the executive summary to those who requested it (field F1 of the instrument).
6. **Honesty about the academic context.** Always clarify that this is for an MGADS-UNAB thesis and not for commercial purposes.

---

## 9. Campaign risks and mitigation

| Risk | Probability | Impact | Mitigation |
|---|:---:|:---:|---|
| Low response rate | Medium | High | Multiple channels, reminders, snowball |
| Bias toward respondents close to the author | High | Medium | Report % of respondents by channel; snowball to reach second-degree contacts |
| Too few experts for the mini-ATAM | Medium | Medium | Express Template E invitation; extend the deadline if necessary |
| Non-reflective responses (time < 5 min) | Low | Low | Flag and report separately; do not automatically exclude |
| Form leaks (duplicate responses) | Low | Low | No login to reduce friction; detect duplicates by response pattern during analysis |

---

## 10. Pre-launch checklist — completed ✓

Verified before day 1 of the campaign (June 17, 2026):

- [x] Google Form published with all questions according to `instrumento-encuesta.md`
- [x] Conditional logic tested (A2 < 3 years disqualifies, D2 shows D2-bis, E0 = "No" skips to the end)
- [x] Executive summary PDF uploaded to Google Drive with a public link
- [x] Video uploaded to Loom or unlisted YouTube with a working link
- [x] Piloting completed with 2-3 people and adjustments applied (see "Post-pilot adjustments" in `protocolo-encuesta.md` §8)
- [x] Priority invitee list (at least 20 names) complete
- [x] Templates A, B, C, D, E adapted with real URLs
- [x] Google Sheets linked to the Form to receive responses in real time
- [x] Weekly tracking system prepared (tracking sheet)
- [x] Final thank-you message configured in the Form
