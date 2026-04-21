# ADR-004: Estrategia híbrida de delay entre requests (patrón de arribo)

**Estado:** Aceptado  
**Fecha:** 2026-04-21  
**Autor:** Elian Gil  
**Contexto:** plan-mejora-medicion.md §3.4  

## Contexto

El script `automatizacion/run_corridas.py` aplica un delay entre requests consecutivos. La elección del patrón de arribo afecta la varianza de latencia medida y, por tanto, el poder estadístico de la comparación as-is vs to-be.

## Alternativas evaluadas

| Patrón | Pros | Contras | Valor académico |
|--------|------|---------|-----------------|
| **Fijo 100 ms** | Reproducibilidad máxima; elimina delay como variable confusora | No refleja tráfico productivo real | Alto para comparar estructuras |
| Jitter uniforme [50,150] ms | Realismo moderado | Ensancha varianza; reduce poder estadístico | Medio |
| Poisson (λ=10 req/s) | Gold standard de simulación | Ráfagas desestabilizan p95/p99; difícil interpretar | Alto solo para pruebas de carga |
| **Decreciente 300→50 ms** | Simula incidente en escalada | Introduce correlación índice-latencia (rompe i.i.d.) | Alto **solo para set I** |

## Decisión

Estrategia **híbrida**:

```python
DELAY_STRATEGY = {
    "A": ("fixed", 0.100),  # sets A-G, J, K: fijo 100ms
    "B": ("fixed", 0.100),
    "C": ("fixed", 0.100),
    "D": ("fixed", 0.100),
    "E": ("fixed", 0.100),
    "F": ("fixed", 0.100),
    "G": ("fixed", 0.100),
    "I": ("linear_decrease", 0.300, 0.050),  # set I: decreciente 300→50ms
    "J": ("fixed", 0.100),
    "K": ("fixed", 0.100),
}
```

Fórmula para set I: `delay_i = 0.300 - (0.250 × i / 199)`

## Justificación

- **Sets A–G, J, K (fijo 100 ms):** El objetivo primario es comparar estructura arquitectónica, no rendimiento bajo carga variable. El realismo de tráfico ya está cubierto por variabilidad de *valores* (sets F, G, I, J, K) y por la prueba JMeter separada (§4.4 del plan).
- **Set I (decreciente):** La aceleración de frecuencia es semánticamente significativa: simula un "incidente en escalada" donde la frecuencia de lecturas de sensor aumenta conforme los valores empeoran (industrial IoT monitoring). En los demás sets la aceleración solo añadiría ruido sin significado.

## Consecuencias

- La correlación entre índice y latencia en set I se documenta como artefacto esperado, no como anomalía.
- Para la comparación as-is vs to-be de set I se usa Mann-Whitney U (no asume i.i.d.) en lugar de t-test.
- La prueba JMeter con Poisson se reporta como sub-estudio independiente, separado del pool estadístico principal.
