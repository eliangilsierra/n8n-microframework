# Validación estática de flujos

Implementación del Pilar 2 de DevSecOps (§4.3 del anteproyecto).

Especificación: `microframework/validacion-estatica-flujos.md`.

## Uso

```bash
# Todo el repositorio (salida Markdown + reporte en reportes/)
node microframework/validacion/validar-flujos.mjs

# Un único caso y estado
node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be

# Salida JSON para CI
node microframework/validacion/validar-flujos.mjs --format json > reporte.json
```

## Código de salida

- `0` — ningún archivo to-be viola reglas obligatorias.
- `1` — al menos un archivo to-be incumple alguna REG-*.

El as-is reporta incumplimientos sin fallar el exit code (es la línea base por diseño).

## Reglas evaluadas

Ver tabla completa en `microframework/validacion-estatica-flujos.md`. Cada regla
devuelve `{ cumple: true|false|null, evidencia: string }`; `null` = no aplicable
al archivo (p. ej. REG-003 solo aplica a orquestadores).
