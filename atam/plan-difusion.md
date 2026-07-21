> 🌐 **Idioma / Language:** Español · [English](plan-difusion.en.md)

# Plan de Difusión de la Encuesta — Validación Externa

**Versión:** 1.0
**Fecha:** 2026-05-07
**Protocolo:** [`protocolo-encuesta.md`](protocolo-encuesta.md)
**Propósito:** Definir cómo se llega al panel objetivo de 15–30 respondentes para la encuesta amplia y 3–5 expertos para el mini-ATAM, qué canales se usan, qué mensajes se envían y cuándo se ejecutan los recordatorios.

---

## 1. Objetivos cuantitativos

| Métrica | Mínimo | Deseable |
|---|:---:|:---:|
| Respondentes Sección A-D | 15 | 25-30 |
| Respondentes Sección E (mini-ATAM) | 3 | 5 |
| Heterogeneidad de roles | 3 distintos | 5 distintos |
| Tasa de respuesta esperada (industria) | 10-15 % | 25-30 % |
| Invitaciones a enviar | 100 | 150-200 |

---

## 2. Canales de difusión priorizados

### 2.1 Canal directo (mayor tasa de respuesta esperada: 25-40 %)

**Email/LinkedIn DM/WhatsApp directo a contactos profesionales del autor.**

Ventaja: relación previa aumenta la conversión.
Desventaja: pool limitado; sesgo de cercanía al autor.

### 2.2 Comunidades n8n (tasa esperada: 5-10 %)

- **Discord oficial de n8n** (community.n8n.io) — canal `#general` y `#self-hosting`
- **Foro de comunidad n8n** (community.n8n.io) — categoría "Discussions"
- **Subreddit r/n8n** (si aplica)

Ventaja: respondentes con familiaridad alta en LC/NC.
Desventaja: requiere respetar reglas de la comunidad (no spam); tasa de respuesta baja.

### 2.3 Grupos académicos y profesionales (tasa esperada: 10-20 %)

- **Compañeros y profesores MGADS-UNAB** — grupo WhatsApp del programa, contactos directos
- **Grupos de WhatsApp/Telegram de arquitectura y DevOps**
- **Comunidades locales de Bucaramanga**

### 2.4 LinkedIn público (tasa esperada: 1-5 %)

Publicación en el perfil personal del autor pidiendo apoyo. Bajo conversión pero alcance amplio.

### 2.5 Bola de nieve controlada

Solicitar a los primeros 10–15 respondentes que reenvíen la invitación a hasta 2 colegas que cumplan el perfil. Mensaje específico para bola de nieve incluido más abajo.

---

## 3. Plantillas de mensajes

### 3.1 Plantilla A — Email/DM directo a contactos cercanos

```
Asunto: Necesito tu opinión experta (10 min) — Tesis MGADS-UNAB

Hola [Nombre],

Espero que estés muy bien. Te escribo porque estoy en la fase final de mi
trabajo de grado de Maestría en Gestión, Aplicación y Desarrollo de Software
(MGADS) en la Universidad Autónoma de Bucaramanga.

Mi tesis propone un micro-framework arquitectónico para flujos n8n
(automatización Low-Code/No-Code) con principios de Clean Architecture y
DevSecOps, evaluado mediante ATAM. Como parte del componente de validación
externa, necesito recoger opiniones expertas como la tuya.

Son aproximadamente 10–12 minutos:
   • 5 min para revisar un PDF de 4 páginas + un video corto de 5 min
   • 10 min para responder una encuesta concisa (escalas + 3 preguntas abiertas)

Tu opinión es valiosa porque [razón personalizada según el perfil — ej:
"trabajas con arquitecturas microservicio similares", "tienes experiencia
en flujos de integración productivos", "lideras decisiones DevSecOps"].

📄 Material previo: [URL_PDF]
🎥 Video: [URL_VIDEO]
📋 Encuesta: [URL_GOOGLE_FORM]

(Hay una sección opcional adicional de 15 min para evaluación arquitectónica
detallada si te interesa profundizar — totalmente opcional).

Gracias mil por considerarlo. Tu aporte es directo al rigor de la tesis.

Un fuerte abrazo,
Elian Hernando Gil Sierra
Estudiante MGADS – UNAB
```

### 3.2 Plantilla B — Mensaje para LinkedIn público

```
🎓 Necesito tu apoyo (10 min) — Validación externa de mi tesis de Maestría

Estoy cerrando mi trabajo de grado de MGADS en UNAB sobre un micro-framework
arquitectónico para flujos Low-Code/No-Code en n8n, evaluado mediante ATAM
(Architecture Tradeoff Analysis Method).

Busco opiniones expertas de profesionales con 3+ años en desarrollo,
arquitectura, DevOps, seguridad o QA, para validar externamente las
conclusiones arquitectónicas.

📋 Encuesta anónima: [URL_GOOGLE_FORM]
📄 Material previo (5 min de lectura): [URL_PDF]
🎥 Video: [URL_VIDEO]

⏱ Tiempo total: ~15 minutos (incluyendo material previo).

Si conoces a alguien con perfil técnico senior que pueda aportar, te
agradezco si reenvías.

Cualquier feedback es valiosísimo — gracias!

#n8n #SoftwareArchitecture #DevSecOps #LowCode #CleanArchitecture #ATAM #Tesis
```

### 3.3 Plantilla C — Mensaje a comunidades n8n (Discord/Foro)

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

### 3.4 Plantilla D — Mensaje para bola de nieve (reenvío)

```
Hola, Elian Gil (MGADS-UNAB) está cerrando su tesis y necesita opiniones
expertas de gente con 3+ años en software (cualquier rol: dev, arquitectura,
DevOps, seguridad, QA).

Son 10-12 min, anónimo. Su tesis es sobre arquitectura limpia aplicada a
flujos LC/NC en n8n.

📋 Encuesta: [URL]
📄 Material: [URL]
🎥 Video: [URL]

Si conoces alguien adecuado, le agradecemos el reenvío. ¡Gracias!
```

### 3.5 Plantilla E — Invitación expresa a expertos para mini-ATAM

(Enviar solo a contactos seleccionados con perfil de arquitecto/lead con 5+ años de experiencia y familiaridad con ATAM)

```
Hola [Nombre],

Te escribo aparte porque tu perfil de [rol específico] con [años] de
experiencia es exactamente el que necesito para la sección opcional avanzada
de mi encuesta de tesis.

Más allá de la encuesta general (10 min), hay una sección mini-ATAM opcional
(15 min adicionales) donde se evalúan los 12 escenarios de calidad con
scoring 1-5 as-is/to-be y se clasifican como sensitivity point, tradeoff
point, risk o non-risk.

Esta sección es la que aporta mayor valor metodológico al estudio (permite
calcular acuerdo inter-evaluador con tu opinión y otros 2-3 expertos
seleccionados).

Si tienes 25-30 min disponibles esta semana, sería un aporte enorme.

📋 Encuesta completa (incluye mini-ATAM al final): [URL]

Sin presión — si solo puedes la parte principal, también es valioso.

Gracias mil,
Elian
```

---

## 4. Lista de candidatos (plantilla para llenar)

Mantener en una hoja separada (puede ser Google Sheets privado) con la siguiente estructura. Esta lista **NO se commitea** al repositorio (contiene datos personales).

| # | Nombre | Rol | Empresa | Años exp. | Canal | Plantilla | Fecha invitación | Estado | Fecha respuesta | Mini-ATAM? | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [Nombre 1] | Arquitecto | [Empresa] | 12 | LinkedIn DM | E (experto) | YYYY-MM-DD | Pendiente | — | Sí | Conoce ATAM bien |
| 2 | [Nombre 2] | Tech Lead | [Empresa] | 7 | Email | A | YYYY-MM-DD | Respondió | YYYY-MM-DD | No | — |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Categorías de estado:**
- Pendiente — invitación enviada, sin respuesta
- Respondió — completó la encuesta
- Rechazó — declinó explícitamente
- Recordado 1 — primer recordatorio enviado (día 7)
- Recordado 2 — segundo recordatorio enviado (día 14)
- Sin respuesta final — pasó día 21 sin responder
- Reenvió — confirmó haber reenviado a contactos (bola de nieve)

**Objetivo de la lista de invitación inicial:**

| Tipo de invitación | # objetivo | Tasa esperada | Respondentes esperados |
|---|:---:|:---:|:---:|
| Plantilla A (directo cercano) | 40 | 30 % | 12 |
| Plantilla B (LinkedIn público) | 1 post → 200 vistas | 2 % | 4 |
| Plantilla C (comunidades n8n) | 3 publicaciones | 5 % | 5 |
| Plantilla D (bola de nieve) | 20 reenvíos | 15 % | 3 |
| Plantilla E (expertos mini-ATAM) | 8 | 50 % | 4 |
| **Total esperado** | **~130** | — | **~28** |

---

## 5. Cronograma de difusión

| Día | Hora sugerida | Acción |
|:---:|:---:|---|
| **0** (lunes) | 09:00 | **Día previo:** verificar URLs activas, formulario funcionando, material accesible |
| **1** (martes) | 09:00 | Envío de Plantilla A a 20 contactos prioritarios (lista en `lista-invitados-prioritarios.md`) |
| **1** | 10:00 | Envío de Plantilla E a 5 expertos seleccionados |
| **1** | 14:00 | Publicación en LinkedIn (Plantilla B) |
| **2** (miércoles) | 09:00 | Envío de Plantilla A a 20 contactos del segundo nivel |
| **2** | 11:00 | Publicación en Discord oficial n8n (Plantilla C en inglés) |
| **3** (jueves) | 10:00 | Publicación en foro community.n8n.io (Plantilla C) |
| **3** | 14:00 | Envío a grupo WhatsApp MGADS-UNAB (Plantilla A adaptada) |
| **5** (sábado) | — | Revisión de respuestas hasta el momento; ajustes si la tasa es baja |
| **7** (lunes) | 09:00 | **Primer recordatorio** a no-respondentes de la primera ola (Plantilla A modificada) |
| **8** (martes) | 10:00 | Solicitud explícita de reenvío (Plantilla D) a respondentes confirmados |
| **10** (jueves) | 10:00 | Segunda publicación LinkedIn con métrica preliminar (e.g., "Llevamos 12 respuestas, faltan 13 para alcanzar el mínimo") |
| **14** (lunes) | 09:00 | **Segundo recordatorio** + invitación expresa adicional a expertos para mini-ATAM si N E < 3 |
| **17** (jueves) | 10:00 | Recordatorio final a no-respondentes |
| **21** (lunes) | 09:00 | **Cierre formal de recolección.** Anuncio de cierre + agradecimiento general. Mantener el formulario abierto pero no esperar más respuestas para análisis |
| **22-26** | — | Análisis estadístico (ver `plan-analisis-encuesta.md`) |

---

## 6. Lista de candidatos sugeridos por rol y contexto

Esta es una guía interna para que el autor priorice contactos. Se debe llenar con nombres reales en archivo aparte no commiteado.

### 6.1 Arquitectos / Tech Leads (alta prioridad para mini-ATAM)

- Colegas senior del trabajo actual con responsabilidad arquitectónica
- Ex-colegas con quien se haya colaborado en arquitectura
- Profesores MGADS con perfil técnico
- Director de tesis (Sebastián Roa Prada) — invitar formalmente aunque no participe en muestra

### 6.2 Desarrolladores senior

- Compañeros de equipo actuales y anteriores con ≥ 5 años
- Contactos LinkedIn con perfil senior en empresas conocidas

### 6.3 DevOps / SRE

- Contactos en roles de infraestructura
- Comunidades de Docker, Kubernetes en Bucaramanga/Bogotá

### 6.4 Seguridad

- Contactos con rol específico de seguridad de aplicaciones
- Miembros de OWASP Colombia / capítulos locales

### 6.5 QA / Testing

- Ingenieros QA con experiencia en automatización
- Test architects con visión de calidad sistémica

### 6.6 Otros (LC/NC específicamente)

- Miembros activos de la comunidad n8n
- Consultores que hayan trabajado con Zapier, Make, Power Automate

---

## 7. Métricas de seguimiento de la campaña

Actualizar semanalmente (lunes) durante la campaña:

| Métrica | Día 1 | Día 7 | Día 14 | Día 21 (cierre) |
|---|:---:|:---:|:---:|:---:|
| Invitaciones enviadas | — | — | — | — |
| Respuestas recibidas | — | — | — | — |
| Tasa de respuesta acumulada | — | — | — | — |
| Mini-ATAM completos | — | — | — | — |
| Roles representados | — | — | — | — |
| Acción decidida | — | — | — | — |

**Decisiones por umbral al día 14:**

| Si al día 14… | Acción |
|---|---|
| N ≥ 15 + mini-ATAM ≥ 3 | Cerrar al día 21 según plan |
| N ≥ 15 + mini-ATAM < 3 | Enfocar día 14-21 en expertos para mini-ATAM (Plantilla E personalizada) |
| N < 15 | Extender cierre 1 semana adicional (día 28) + segunda ola en LinkedIn + bola de nieve agresiva |
| N < 10 | Reportar como evidencia exploratoria; ajustar discurso del informe ATAM |

---

## 8. Buenas prácticas durante la difusión

1. **No insistir excesivamente.** Máximo 2 recordatorios por canal.
2. **Personalizar la Plantilla A.** El campo `[razón personalizada]` debe ser real, no copy-paste.
3. **Respetar reglas de comunidades.** Antes de publicar en Discord o foro de n8n, leer las reglas del canal; preferir canales designados para "research" o "showcase" cuando existan.
4. **Agradecer públicamente.** Tras el cierre, publicar agradecimiento (sin nombres) en LinkedIn destacando la participación recibida.
5. **Compartir resultados.** Cumplir la promesa de enviar el resumen ejecutivo a quienes lo soliciten (campo F1 del instrumento).
6. **Honestidad sobre el contexto académico.** Aclarar siempre que es para tesis MGADS-UNAB y no para fines comerciales.

---

## 9. Riesgos de la campaña y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|:---:|:---:|---|
| Baja tasa de respuesta | Media | Alto | Múltiples canales, recordatorios, bola de nieve |
| Sesgo de respondentes cercanos al autor | Alta | Medio | Reportar % de respondentes por canal; bola de nieve para alcanzar segundo grado |
| Muy pocos expertos para mini-ATAM | Media | Medio | Invitación expresa Plantilla E; extensión de plazo si necesario |
| Respuestas no reflexivas (tiempo < 5 min) | Baja | Bajo | Marcar y reportar separadamente; no excluir automáticamente |
| Filtraciones del formulario (respuestas duplicadas) | Baja | Bajo | No login para reducir fricción; en análisis detectar duplicados por patrón de respuestas |

---

## 10. Checklist pre-lanzamiento — completado ✓

Verificado antes del día 1 de la campaña (17 de junio de 2026):

- [x] Google Form publicado con todas las preguntas según `instrumento-encuesta.md`
- [x] Lógica condicional probada (A2 < 3 años descalifica, D2 muestra D2-bis, E0 = "No" salta a final)
- [x] PDF resumen ejecutivo subido a Google Drive con enlace público
- [x] Video subido a Loom o YouTube no listado con enlace funcional
- [x] Pilotaje completado con 2-3 personas y ajustes aplicados (ver "Ajustes post-pilotaje" en `protocolo-encuesta.md` §8)
- [x] Lista de invitados prioritarios (al menos 20 nombres) completa
- [x] Plantillas A, B, C, D, E adaptadas con URLs reales
- [x] Google Sheets vinculado al Form para recibir respuestas en tiempo real
- [x] Sistema de tracking semanal preparado (hoja de seguimiento)
- [x] Mensaje de agradecimiento final configurado en el Form
