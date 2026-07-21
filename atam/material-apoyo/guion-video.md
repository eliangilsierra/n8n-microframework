> 🌐 **Idioma / Language:** Español · [English](guion-video.en.md)

# Guion del Video de Presentación — Encuesta de Validación Externa

**Versión:** 1.0
**Fecha:** 2026-05-07
**Duración objetivo:** 5:00 a 7:00 minutos
**Plataforma sugerida:** Loom (graba pantalla + cámara con un clic, genera enlace público)
**Estilo:** académico-profesional, sobrio, lenguaje claro y directo
**Audiencia:** profesionales senior de software (3+ años) que no conocen el proyecto

---

## Estructura por bloques de tiempo

### Bloque 0 · Apertura (0:00 – 0:30) · 30 s

**En cámara, con diapositiva de título visible al fondo:**

> "Hola, soy Elian Gil. Estoy cerrando mi trabajo de grado de Maestría en Gestión, Aplicación y Desarrollo de Software en la Universidad Autónoma de Bucaramanga, dirigido por el doctor Sebastián Roa.
>
> En los próximos cinco minutos te cuento brevemente qué hice, los resultados principales, y al final te pido tu opinión experta — son diez minutos adicionales en una encuesta."

**Diapositiva visible:**
```
┌──────────────────────────────────────────────────┐
│ Micro-framework arquitectónico LC/NC para n8n   │
│ Evaluación ATAM y validación externa            │
│                                                  │
│ Elian Hernando Gil Sierra · MGADS · UNAB · 2026 │
└──────────────────────────────────────────────────┘
```

---

### Bloque 1 · El problema (0:30 – 1:30) · 60 s

**Cambiar a compartir pantalla con la siguiente diapositiva:**

> "El problema concreto: las plataformas Low-Code/No-Code como n8n, Zapier o Power Automate están explotando — Gartner proyecta que el 70 % de aplicaciones empresariales nuevas las incorporarán para 2025. Pero su adopción tiende a ser improvisada: flujos sin arquitectura, secretos hardcodeados, sin retry, sin idempotencia, sin observabilidad estructurada.
>
> Esto genera deuda técnica acelerada, riesgos de seguridad, y operaciones difíciles. La literatura lo documenta como un problema sistémico.
>
> Mi pregunta de investigación: ¿podemos definir un micro-framework arquitectónico para n8n que aplique principios de Clean Architecture y DevSecOps, y que demostradamente mejore los atributos de calidad relevantes?"

**Diapositiva sugerida:**
```
┌──────────────────────────────────────────────────┐
│ Adopción LC/NC sin gobernanza arquitectónica    │
│                                                  │
│ • 70 % de apps nuevas en 2025 (Gartner)         │
│ • Antipatrones recurrentes:                      │
│   - Secretos en JSON                             │
│   - Sin retry ni idempotencia                    │
│   - Logs no estructurados                        │
│   - Lógica de dominio mezclada con integración   │
│                                                  │
│ → Deuda técnica acelerada                        │
└──────────────────────────────────────────────────┘
```

---

### Bloque 2 · La propuesta (1:30 – 2:30) · 60 s

> "Mi propuesta es un micro-framework que estructura cualquier flujo n8n en cuatro etapas funcionales con responsabilidad única, e implementa diez reglas obligatorias verificables.
>
> Las cuatro etapas son: E1 que valida la entrada y autentica, E2 que aplica las reglas de negocio sin tocar integraciones, E3 que es la única capa que habla con servicios externos como bases de datos o APIs, y E4 que produce la salida o notificación.
>
> El framework incluye diez reglas con criterio binario verificable — secretos fuera del JSON, error workflow configurado, retry en HTTP, idempotencia, log estructurado, validación de entrada, etcétera. Incluye cinco patrones de diseño, once antipatrones identificados, un validador estático ejecutable y guía de observabilidad mínima."

**Diapositiva — diagrama del metamodelo:**
```
┌─────────────────────────────────────────────────────────────┐
│              Orquestador n8n + Error Workflow               │
│                                                             │
│   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐                 │
│   │  E1  │──▶│  E2  │──▶│  E3  │──▶│  E4  │                 │
│   │      │   │      │   │      │   │      │                 │
│   │ Vali-│   │Domi- │   │Inte- │   │Sali- │                 │
│   │ dar  │   │nio   │   │gracio│   │da    │                 │
│   │entrada   │      │   │nes   │   │       │                │
│   └──────┘   └──────┘   └──────┘   └──────┘                 │
│                                                             │
│   10 reglas · 5 patrones · 11 antipatrones · validador      │
└─────────────────────────────────────────────────────────────┘
```

---

### Bloque 3 · Caso de estudio Bot (2:30 – 3:15) · 45 s

**Mostrar lado a lado los diagramas as-is y to-be del Bot:**

> "El primer caso es un bot de soporte. El diseño as-is, intencionalmente desestructurado para representar el estado típico de adopción improvisada, tiene 16 nodos y viola 9 de las 10 reglas. Tokens hardcodeados, sin retry, sin idempotencia.
>
> El diseño to-be, aplicando el framework, queda en un orquestador con dos subflujos: E2 dominio y E3 adaptador. Cumple 10 de 10 reglas.
>
> Resultados medidos sobre 4 000 corridas: el impacto de Change Requests baja de 5 nodos modificados por cambio a 1 — una reducción del 81 %. La tasa de fallos baja del 9 al 6 por ciento. El tiempo medio de diagnóstico de fallos baja de 5-10 minutos a 14 segundos. Y cero secretos literales en el JSON."

**Diapositiva — tabla compacta:**
```
                            As-is      To-be      Δ
Nodos por CR (promedio)     5.3        1.0        −81 %
Tiempo por CR (min)         32.7       6.7        −79 %
Fallos en ejecución          9 %        6 %       −36.6 %
MTTD diagnóstico            5-10 min   ~14 s      mucho mejor
Secretos en JSON              4         0         −100 %
Cumplimiento checklist        n/a       100 %     ✅
```

---

### Bloque 4 · Caso de estudio IoT (3:15 – 4:00) · 45 s

> "El segundo caso es un pipeline IoT — ingesta, validación, persistencia y notificación de lecturas de sensores ambientales. Mismo patrón: as-is con antipatrones, to-be con framework.
>
> El to-be tiene un orquestador, cuatro subflujos uno por etapa, y un error handler con dead-letter en PostgreSQL para no perder lecturas críticas.
>
> Resultados similares en mantenibilidad y seguridad — reducción de 84 % en impacto CR. Pero acá aparece el trade-off más interesante del estudio: la latencia. Las lecturas de sensor en el to-be tienen entre 119 y 192 por ciento más latencia que en el as-is, por el overhead de los Execute Workflow entre subflujos.
>
> Esto está documentado explícitamente como Tradeoff Point: el proyecto prioriza mantenibilidad sobre latencia. Pero es justamente el tipo de decisión donde tu opinión externa es valiosa: ¿es defendible este trade-off para tu contexto?"

**Diapositiva:**
```
Caso IoT — Trade-off cuantificado

                  Mantenibilidad             Latencia p50
                  (impacto CR)               (Set A)
As-is             6.3 nodos / CR             78 ms
To-be             1.0 nodos / CR             171 ms

                  −84 %                      +119 %

TP-GLOBAL-01: ¿Aceptable o bloqueante en tu contexto?
```

---

### Bloque 5 · Evaluación ATAM y hallazgos (4:00 – 4:45) · 45 s

> "Sobre estos casos apliqué ATAM, el método de evaluación arquitectónica de Bass y Kazman. Definí 12 escenarios top-K, 6 por caso, con medidas de respuesta cuantitativas. Cobertura del 100 % con evidencia trazable.
>
> Identifiqué 15 hallazgos formales: 3 Sensitivity Points, 3 Tradeoff Points, 4 Risks abiertos y 5 Non-risks.
>
> El hallazgo runtime más interesante: cuando hice el test de tolerancia a fallos deteniendo el servicio de notificaciones, descubrí que el error handler del IoT notifica al mismo servicio caído — una dependencia circular no anticipada que documenté como SP-IOT-01. El dato del sensor está seguro porque la persistencia ocurre antes y es independiente, pero el dead-letter queda bloqueado. Es exactamente el tipo de hallazgo que ATAM busca."

**Diapositiva:**
```
Análisis ATAM — 15 hallazgos arquitectónicos

   3  Sensitivity Points     (afectan 1 atributo)
   3  Tradeoff Points        (multi-atributo, direcciones opuestas)
   4  Risks abiertos         (mitigación en producción)
   5  Non-risks              (decisiones protegidas)

  100 % cobertura ATAM con evidencia trazable
  19 ADRs documentando todas las decisiones
```

---

### Bloque 6 · Qué necesito de ti y cierre (4:45 – 5:30) · 45 s

**Volver a cámara:**

> "El framework está completo y los resultados están medidos. Lo que falta es validación externa por personas como tú — profesionales senior con 3 o más años de experiencia en software, en cualquier rol: desarrollo, arquitectura, DevOps, seguridad, QA.
>
> La encuesta tiene dos partes. La principal toma 10 a 12 minutos: cinco preguntas demográficas, ocho de validación percibida en escala Likert, tres preguntas abiertas sobre riesgos y trade-offs, y dos de percepción global.
>
> Hay una sección opcional avanzada de 15 minutos adicionales para mini-ATAM — scoring de los 12 escenarios y clasificación arquitectónica. Si tienes tiempo, esta sección es la que más aporta valor metodológico al estudio.
>
> El PDF de 4 páginas que descargaste tiene toda la información que necesitas para responder con criterio. Las preguntas abiertas son las más valiosas — busco que identifiques riesgos y trade-offs que yo pueda haber pasado por alto.
>
> Muchísimas gracias por tu tiempo. Tu opinión va directa al rigor de la tesis."

**Diapositiva final:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  📋 Encuesta (10-12 min):   [URL_FORM]           │
│  📄 PDF resumen (5 min):    [URL_PDF]            │
│                                                  │
│  Sección opcional mini-ATAM:  +15 min            │
│                                                  │
│  Anónimo · Voluntario · Uso académico            │
│                                                  │
│  Elian Hernando Gil Sierra                       │
│  MGADS — UNAB — 2026                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Notas para la grabación

### Antes de grabar

1. **Pruebas de audio.** Grabar 30 segundos de prueba y verificar nivel/calidad.
2. **Diapositivas listas.** Tener las 6 diapositivas preparadas en orden, idealmente con transiciones simples (sin animaciones distractoras).
3. **Ensayo cronometrado.** Hacer una pasada completa con cronómetro. Si supera 7 minutos, recortar narrativa.
4. **Plano cámara.** Encuadre medio (cintura hacia arriba), buena iluminación frontal, fondo neutro.
5. **Pantalla limpia.** Cerrar notificaciones de chat, correo, etc.

### Durante la grabación

1. **Hablar con ritmo natural** — no leer literalmente el guion, sino tener los puntos clave a mano y narrar.
2. **Pausas estratégicas** entre bloques (1-2 s) facilitan posproducción.
3. **Mirada a cámara** en apertura y cierre; en bloques 1-5 puede mirar las diapositivas.
4. **Sin muletillas excesivas** ("eh", "este", "o sea"). Si te equivocas, pausa de 3 segundos y retoma desde el inicio del párrafo — facilita corte limpio.

### Después de grabar

1. **Revisión completa** antes de publicar.
2. **Subtítulos auto-generados** activados (Loom y YouTube los generan automáticamente).
3. **Capítulos/marcadores** opcionales (Loom permite agregar timestamps): "Problema 0:30", "Propuesta 1:30", "Caso Bot 2:30", etc.
4. **Permisos de acceso:**
   - **Loom:** "Anyone with link can view"
   - **YouTube:** "Unlisted" (no público, no privado)
5. **URL final** se copia a `atam/material-apoyo/README.md` y se sustituye en plantillas de difusión.

### Checklist de calidad del video final

- [ ] Duración 5:00 a 7:00 minutos
- [ ] Audio claro, sin ruido de fondo molesto
- [ ] Imagen 1080p mínimo
- [ ] Sin información personal sensible visible (correos, contraseñas, datos de terceros)
- [ ] Las 6 diapositivas se ven correctamente al cambiar
- [ ] La diapositiva final muestra URLs visibles (aunque sean placeholders en la grabación; las URLs reales van en la descripción del video y en el correo de invitación)
- [ ] Subtítulos disponibles en el reproductor

---

## Variaciones del guion (opcionales)

Si después del pilotaje surge feedback de que el video es muy denso o poco accesible para perfiles no-arquitecto, considerar grabar una variante:

- **Variante A — "Solo desarrolladores":** énfasis en patrones aplicables (retry, idempotencia, log estructurado), menos énfasis en ATAM formal.
- **Variante B — "Solo arquitectos / leads":** énfasis en hallazgos ATAM, trade-offs y decisiones de diseño; saltar las explicaciones básicas de los patrones.

No es obligatorio; la versión principal de este guion sirve para ambos perfiles si el respondente revisa también el PDF.
