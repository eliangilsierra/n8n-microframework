# ADR-004: Ampliación del diseño experimental a 10 Input Sets (A–E estáticos + F, G, I, J, K dinámicos)

**Estado:** Aceptado
**Fecha:** 2026-04-21
**Caso:** bot (aplicable también a iot — ver nota de alcance)
**Atributo de calidad afectado:** Validez interna metodológica, Adecuación funcional

---

## Contexto

El anteproyecto (`docs/context/proyecto-overview.md` §Input Sets) definió tres Input Sets
por caso:

- **A:** flujo normal (caso feliz)
- **B:** carga alta (volumen sostenido)
- **C:** datos inválidos (token faltante / campos inválidos)

Estos tres sets cubren los escenarios mínimos para validar la diferencia as-is vs. to-be
en funcionamiento general, carga y validación de entradas. Durante FASE 2 se identificó
que la cobertura experimental era insuficiente para **atribuir con precisión** las
diferencias observadas a antipatrones específicos:

1. **REG-005 (idempotencia)** no es observable con A, B, C porque ninguno de los tres
   sets produce duplicados intencionales ni permite verificar `ON CONFLICT` en BD.
2. **REG-009 (códigos de error)** solo se prueba parcialmente con C (validación binaria);
   falta cobertura de boundary values y campos parciales.
3. **Realismo del tráfico:** los sets estáticos A–C usan un único payload repetido N veces,
   lo que no refleja variabilidad de producción y exagera la eficacia del cache por nodo.
4. **Percentiles extremos y degradación:** no se pueden observar con carga uniforme.

La decisión de ampliar la matriz experimental se tomó antes de ejecutar la medición
principal de FASE 2 y debe documentarse formalmente para que la evaluación ATAM (FASE 7)
y la auditoría académica del director puedan verificar que la ampliación no introduce
sesgo respecto al anteproyecto.

---

## Decisión

Ampliamos la matriz experimental de 3 a **10 Input Sets por caso**, divididos en dos grupos:

### Sets estáticos (payload único repetido N veces)

| Set | Nombre | Propósito | REG-* que estresa |
|-----|--------|-----------|-------------------|
| A | Normal | Caso feliz baseline | Baseline |
| B | Carga alta | Volumen sostenido | Baseline con volumen |
| C | Datos inválidos | Token/campo faltante → 4xx esperado | REG-009 |
| D | Boundary values | Umbral exacto (longitud 0 en `message`) | REG-009 (boundary) |
| E | Campos parciales | `user_id` ausente, `session_id` ausente | REG-009, REG-007 |

### Sets dinámicos (200 payloads únicos generados con semilla determinística)

| Set | Nombre | Propósito | REG-* que estresa |
|-----|--------|-----------|-------------------|
| F | Realismo normal | 200 mensajes válidos variados | REG-007 (dominio) |
| G | Mezcla válido/inválido | 150 válidos + 50 inválidos mezclados | REG-009, REG-008 |
| I | Degradación | Delay decreciente 300→50 ms (carga creciente) | Latencia p95/p99 |
| J | Percentiles extremos | Payloads en límites de dominio (longitud máxima, caracteres especiales) | REG-007, REG-009 |
| K | Duplicados idempotencia | Cada `idempotency_key` aparece exactamente 2 veces | REG-005 |

**Generador determinístico:** `medicion/datasets/generar_datasets.py` con `master_seed = 20260421`
definido en `medicion/datasets/seeds.yaml`. Reproducibilidad verificada con SHA-256 de los
archivos generados.

### Total de corridas resultante

- Sets × casos × versiones × N = 10 × 2 × 2 × 200 = **8 000 corridas** por ciclo completo
  as-is → to-be
- La FASE 2 cerró con 4 000 corridas (solo as-is); las 4 000 restantes se ejecutan en FASE 5–6

### Nota de alcance

Este ADR aplica a los casos **bot e iot** simultáneamente. Se archiva en el directorio
del bot por convención de primogenitura (fue el primer caso que motivó la ampliación)
y se referencia desde la matriz de trazabilidad del iot.

---

## Alternativas consideradas

- **Mantener solo A–C como definió el anteproyecto:** respeta al 100% el diseño original
  pero deja sin evidencia cuantitativa a REG-005 (idempotencia), los boundary values y la
  variabilidad de percentiles. Descartado: debilita la evaluación ATAM de los atributos
  "Confiabilidad" y "Adecuación funcional".

- **Agregar 20 sets (A–T):** cobertura exhaustiva pero diluye la narrativa del estudio
  y multiplica el tiempo de ejecución sin hipótesis específicas para cada set.
  Descartado: el principio de parsimonia exige que cada set adicional responda a una
  pregunta concreta del micro-framework.

- **Ampliar solo con sets estáticos (D, E) sin dinámicos:** resuelve boundary y campos
  faltantes pero no resuelve realismo ni percentiles extremos. Descartado: REG-005 no
  queda cubierta por ningún set estático.

- **Reemplazar A–C por sets dinámicos:** rompe continuidad con el anteproyecto y dificulta
  la trazabilidad a RFs originales. Descartado.

---

## Consecuencias

**Positivas:**
- Cobertura experimental amplia para 8 de las 10 reglas obligatorias REG-001..010
  (las otras dos, REG-003 y REG-010, son arquitectónicas y se verifican por inspección
  estática — no necesitan Input Set).
- REG-005 (idempotencia) queda medible por primera vez con el set K.
- Percentiles p95/p99 y latencia bajo degradación medibles con set I.
- Datasets dinámicos reproducibles por semilla → trazabilidad completa de la evidencia.
- Mantiene compatibilidad con A–C del anteproyecto: los 3 sets originales siguen presentes
  y producen los mismos resultados que el diseño original.

**Negativas / trade-offs:**
- Tiempo de ejecución por ciclo completo pasa de 3×200×2×2 = 2 400 corridas a 10×200×2×2 =
  8 000 corridas (~3.3× más). Mitigación: ejecución automatizada con
  `run_corridas.py`, ~15 minutos por caso-versión con `DELAY_STRATEGY` por set.
- La ampliación requiere mantener un generador determinístico y versionar las semillas.
  Costo ya asumido: `generar_datasets.py` y `seeds.yaml` existen y están auditados
  (SHA-256 verificados).
- El anteproyecto debe citarse con la adenda "diseño experimental ampliado según ADR-004"
  en el capítulo metodológico de la tesis, para evitar que un revisor interprete la
  diferencia como desviación no documentada.

---

## Relación con el micro-framework

- **REG-005 (idempotencia):** set K es el único set diseñado específicamente para medir
  esta regla; sin él no existe evidencia cuantitativa del antipatrón INSERT-sin-ON-CONFLICT
  del as-is.
- **REG-009 (códigos de error HTTP):** sets C, D, E, G cubren distintos escenarios de
  validación y boundary values.
- **REG-007 / REG-008 (separación dominio/integración):** sets F, G, J estresan la
  variabilidad del dominio sin tocar la integración.
- **Patrón-idempotencia (`microframework/patrones/patron-idempotencia.md`):** set K
  ejecuta la misma llave dos veces → valida la implementación del patrón en E3.
- **`EXPECTED_HTTP`** en `automatizacion/run_corridas.py` codifica el comportamiento
  esperado por (caso, versión, set) — verificable en tiempo de ejecución.
- Referencias cruzadas:
  - `medicion/datasets/generar_datasets.py` (generador determinístico)
  - `medicion/datasets/seeds.yaml` (semillas versionadas, master_seed=20260421)
  - `docs/context/proyecto-overview.md` §Input Sets (debe actualizarse con esta adenda)
