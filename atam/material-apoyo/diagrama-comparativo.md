> 🌐 **Idioma / Language:** Español · [English](diagrama-comparativo.en.md)

# Diagramas Comparativos as-is vs to-be — Fuente Mermaid

**Versión:** 1.0
**Fecha:** 2026-05-07
**Propósito:** Código fuente Mermaid de los diagramas comparativos que se incluyen en el PDF resumen ejecutivo y en las diapositivas del video. Render PNG generable desde https://mermaid.live o con `mmdc` CLI.

---

## 1. Diagrama 1 — Caso Bot · As-is vs To-be

### As-is Bot (16 nodos, antipatrones visibles)

```mermaid
flowchart LR
  subgraph AS_IS_BOT["BOT AS-IS · 16 nodos · 9 de 10 REGs violadas"]
    direction LR
    W1[Webhook]:::antipat --> V1[Validar Payload<br/>token hardcoded]:::antipat
    V1 --> RL[Rate Limit<br/>en memoria]:::antipat
    RL --> CK[Check Token<br/>literal en código]:::antipat
    CK --> PM[Procesar Mensaje<br/>negocio + integración]:::antipat
    PM --> CP[Calcular Prioridad<br/>lógica dispersa]:::antipat
    CP --> H1[HTTP Tickets<br/>api-key hardcoded]:::antipat
    H1 --> PR[Parse Respuesta<br/>sin manejo error]:::antipat
    PR --> H2[HTTP Notif<br/>sin retry]:::antipat
    H2 --> SR[Set Respuesta]:::antipat
    SR --> R1[Respond]:::antipat
  end
  classDef antipat fill:#fdd,stroke:#c33,stroke-width:1px,color:#000
```

### To-be Bot (orquestador + 2 subflujos, 10/10 REGs)

```mermaid
flowchart LR
  subgraph TO_BE_BOT["BOT TO-BE · Orquestador + 2 subflujos · 10/10 REGs ✅"]
    direction LR
    W2[Webhook]:::ok --> E1[E1<br/>Validación + Auth<br/>$env.BOT_API_TOKEN]:::ok
    E1 -->|inválido| R401[401/400]:::ok
    E1 -->|válido| E2[E2 subflujo<br/>Dominio<br/>reglas centralizadas]:::ok
    E2 --> E3[E3 subflujo<br/>Adaptador tickets<br/>Idempotency-Key + retry]:::ok
    E3 --> R2[Respond]:::ok
    EW[Error Workflow<br/>log JSON + dead-letter]:::ew -.->|on error| E1
    EW -.->|on error| E2
    EW -.->|on error| E3
  end
  classDef ok fill:#dfd,stroke:#383,stroke-width:1px,color:#000
  classDef ew fill:#fed,stroke:#a73,stroke-width:1px,color:#000,stroke-dasharray: 4 2
```

### Comparación lado a lado (texto narrado en el PDF)

```
AS-IS (anti):  webhook → 16 nodos lineales con antipatrones → respond
                       (token hardcoded, sin retry, sin idempotencia,
                        sin error workflow, lógica mezclada)

TO-BE (clean): webhook → E1 → [E2 subflujo] → [E3 subflujo] → respond
                       └─→ Error workflow (log JSON + dead-letter)

Mejoras medidas:
  • Impacto CR:    5.3 nodos → 1.0 nodo       (−81 %)
  • Tiempo CR:     32.7 min → 6.7 min         (−79 %)
  • Fallos:        9 % → 6 %                  (−36.6 %)
  • MTTD:          5-10 min → ~14 s
  • Secretos:      4 literales → 0
```

---

## 2. Diagrama 2 — Caso IoT · As-is vs To-be

### As-is IoT (14 nodos, antipatrones visibles)

```mermaid
flowchart LR
  subgraph AS_IS_IOT["IOT AS-IS · 14 nodos · 9 de 10 REGs violadas"]
    direction LR
    WI1[Webhook]:::antipat --> VP[Validar Parcial<br/>sin schema]:::antipat
    VP --> CN[Calcular Nivel<br/>umbrales dispersos]:::antipat
    CN --> TC{Temp Crítica?}:::antipat
    TC -->|sí| H3[HTTP Notif Crítico<br/>sin retry]:::antipat
    TC -->|no| TH{Humedad Alta?}:::antipat
    TH -->|sí| H4[HTTP Notif Advert<br/>sin retry]:::antipat
    TH -->|no| INS[INSERT sin<br/>ON CONFLICT<br/>credenciales literales]:::antipat
    H3 --> INS
    H4 --> INS
    INS --> RI[Respond 200<br/>aún con errores]:::antipat
  end
  classDef antipat fill:#fdd,stroke:#c33,stroke-width:1px,color:#000
```

### To-be IoT (orquestador + 4 subflujos + error handler, 10/10 REGs)

```mermaid
flowchart LR
  subgraph TO_BE_IOT["IOT TO-BE · Orquestador + 4 subflujos + Error Handler · 10/10 REGs ✅"]
    direction LR
    WI2[Webhook]:::ok --> E1I[E1 subflujo<br/>Validación schema<br/>+ timestamp authority]:::ok
    E1I -->|inválido 422| R422[Respond 422]:::ok
    E1I -->|válido| E2I[E2 subflujo<br/>Dominio<br/>UMBRALES centralizados]:::ok
    E2I --> E3I[E3 subflujo<br/>Persistencia<br/>idempotency_key<br/>ON CONFLICT]:::ok
    E3I --> E4I[E4 subflujo<br/>Notificación<br/>routing por nivel<br/>retry diferenciado]:::ok
    E4I --> RIB[Respond]:::ok
    EWI[Error Handler<br/>log JSON + payload<br/>dead-letter PostgreSQL]:::ew -.->|on error| E1I
    EWI -.->|on error| E2I
    EWI -.->|on error| E3I
    EWI -.->|on error| E4I
  end
  classDef ok fill:#dfd,stroke:#383,stroke-width:1px,color:#000
  classDef ew fill:#fed,stroke:#a73,stroke-width:1px,color:#000,stroke-dasharray: 4 2
```

### Comparación lado a lado IoT

```
AS-IS (anti):  webhook → 14 nodos · sin schema · sin idempotencia ·
                          umbrales dispersos · credenciales literales ·
                          respond 200 incluso con errores

TO-BE (clean): webhook → E1 → E2 → E3 → E4 → respond
                          └─→ Error handler con dead-letter PostgreSQL

Mejoras medidas:
  • Impacto CR:    4.3 nodos → 0.7 nodos      (−84 %)
  • Tiempo CR:     28.0 min → 5.2 min         (−81 %)
  • Cumplimiento:  6/7 violadas → 10/10 ✅
  • Secretos:      múltiples → 0
  • MTTD:          5-10 min → ~14 s (estructural)
  
Trade-off cuantificado (TP-GLOBAL-01):
  • Latencia p50 Set A:  78 ms → 171 ms      (+119 %)
  • Latencia p50 Set B:  78 ms → 182 ms      (+134 %)
  • Decisión: aceptado, ADR-001 IoT prioriza mantenibilidad
```

---

## 3. Diagrama 3 — Metamodelo E1–E4 (genérico para cualquier flujo n8n)

```mermaid
flowchart LR
  subgraph ORQ["Orquestador n8n"]
    direction LR
    WBH[Webhook<br/>punto único de entrada]:::entry
    WBH --> EE1[E1 Validación<br/>schema · auth<br/>rechazo temprano<br/>HTTP 400/401/422]:::stage
    EE1 -->|válido| EE2[E2 Dominio<br/>reglas de negocio<br/>SIN integraciones<br/>SIN HTTP externos]:::stage
    EE2 --> EE3[E3 Adaptadores<br/>integraciones externas<br/>idempotencia<br/>retry]:::stage
    EE3 --> EE4[E4 Salida<br/>notificación o respuesta<br/>routing por contexto]:::stage
    EE4 --> RFIN[Respond]:::entry
  end
  ERWF[Error Workflow<br/>dead-letter + log JSON]:::err -.->|on error| EE1
  ERWF -.->|on error| EE2
  ERWF -.->|on error| EE3
  ERWF -.->|on error| EE4
  classDef entry fill:#cce,stroke:#225,stroke-width:1px,color:#000
  classDef stage fill:#dfd,stroke:#383,stroke-width:1px,color:#000
  classDef err fill:#fed,stroke:#a73,stroke-width:1px,color:#000,stroke-dasharray: 4 2
```

**Convenciones aplicadas en el metamodelo:**
- E1 nunca habla con servicios externos
- E2 nunca habla con servicios externos (solo lógica pura)
- E3 es la única capa que ejecuta integraciones HTTP, BD, queues
- E4 produce salida (respuesta al webhook o notificación a un canal)
- Error workflow se dispara automáticamente ante cualquier excepción
- Cada etapa emite exactamente un log JSON por ejecución

---

## 4. Diagrama 4 — Mapeo escenarios ATAM × approaches

(Diagrama complementario opcional para diapositiva del bloque 5 del video.)

```mermaid
flowchart TB
  subgraph SC["12 Escenarios ATAM top-K"]
    direction TB
    BQ1[BOT-Q1<br/>Modificabilidad reglas]
    BQ2[BOT-Q2<br/>Cambio proveedor]
    BQ3[BOT-Q3<br/>Confidencialidad]
    BQ4[BOT-Q4<br/>Integridad reintentos]
    BQ5[BOT-Q5<br/>MTTD diagnóstico]
    BQ6[BOT-Q6<br/>Contratos HTTP]
    IQ1[IOT-Q1<br/>Ajuste umbrales]
    IQ2[IOT-Q2<br/>Canal alerta]
    IQ3[IOT-Q3<br/>Integridad lecturas]
    IQ4[IOT-Q4<br/>Tolerancia fallos red]
    IQ5[IOT-Q5<br/>Urgencia diferenciada]
    IQ6[IOT-Q6<br/>Confidencialidad BD]
  end
  subgraph AP["12 Approaches arquitectónicos"]
    direction TB
    A01[AP-01 Separación E1-E4]
    A04[AP-04 Retry]
    A05[AP-05 Idempotencia]
    A06[AP-06 Error workflow]
    A07[AP-07 Log estructurado]
    A09[AP-09 Routing diferenciado]
    A11[AP-11 Validador estático]
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

## 5. Renderizado para PDF y diapositivas

### Render directo con Mermaid Live Editor

1. Copiar el bloque ```` ```mermaid ... ``` ```` deseado
2. Pegar en https://mermaid.live
3. Ajustar tema (recomendado: "default" o "neutral" para PDF impreso)
4. Exportar como PNG en alta resolución (ancho ≥ 1600 px)
5. Guardar como `atam/material-apoyo/diagrama-{N}-{nombre}.png`

### Render con CLI mmdc (mermaid-cli)

```bash
# Instalación una vez
npm install -g @mermaid-js/mermaid-cli

# Render de un diagrama específico (extraer el bloque mermaid a archivo .mmd primero)
mmdc -i diagrama-bot-asis.mmd -o diagrama-bot-asis.png -w 1920 -H 1080 -b transparent
```

### Configuración recomendada para impresión

- Ancho mínimo: 1600 px (para PDF a 4 páginas)
- Fondo: transparente o blanco
- Tema: `default` (alto contraste para imprimir)
- Tamaño de letra mínimo legible: 12 pt
