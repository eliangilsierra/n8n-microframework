import { readFileSync, existsSync } from 'node:fs';
import { MAPEO_PATH } from './paths.mjs';
import { getLang } from './i18n.mjs';

let cache = null;

export function getQualityMap() {
  if (cache) return cache;
  if (!existsSync(MAPEO_PATH)) { cache = { reglas: {} }; return cache; }
  try { cache = JSON.parse(readFileSync(MAPEO_PATH, 'utf8')); }
  catch { cache = { reglas: {} }; }
  return cache;
}

export function metaForRule(ruleId) {
  const m = getQualityMap().reglas[ruleId];
  return m || { severityDefault: 'warning', iso25010: [], atam: [], adr: [] };
}

/**
 * Resuelve `nombre` (bilingüe inline {es, en} en mapeo-calidad.json) al
 * idioma activo. Compatible hacia atrás si `nombre` fuera un string plano.
 */
export function ruleDisplayName(ruleId) {
  const nombre = metaForRule(ruleId).nombre;
  if (!nombre) return ruleId;
  if (typeof nombre === 'string') return nombre;
  return nombre[getLang()] || nombre.es || ruleId;
}
