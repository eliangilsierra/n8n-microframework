import { readFileSync, existsSync } from 'node:fs';
import { MAPEO_PATH } from './paths.mjs';

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
