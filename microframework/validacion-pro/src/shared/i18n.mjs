/* ============================================================================
 *  i18n.mjs — Cargador de idioma (Edición Pro)
 * ----------------------------------------------------------------------------
 *  Misma mecánica que microframework/validacion/i18n.mjs (Lite), adaptada a
 *  la ubicación de módulos de Pro. Carga src/shared/locales/{es,en}.json y
 *  expone `t(key, vars)` con interpolación `{var}` y fallback a español.
 * ========================================================================= */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SUPPORTED = ['es', 'en'];
const DEFAULT_LANG = 'es';

function loadLocale(lang) {
  const p = join(HERE, 'locales', `${lang}.json`);
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch { return {}; }
}

let currentLang = DEFAULT_LANG;
let dict = loadLocale(DEFAULT_LANG);
let fallbackDict = dict;

export function setLang(lang) {
  currentLang = SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
  dict = loadLocale(currentLang);
  fallbackDict = currentLang === DEFAULT_LANG ? dict : loadLocale(DEFAULT_LANG);
}

export function getLang() {
  return currentLang;
}

function getPath(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o && typeof o === 'object' && k in o) ? o[k] : undefined, obj);
}

export function t(key, vars = {}) {
  let template = getPath(dict, key);
  if (template === undefined) template = getPath(fallbackDict, key);
  if (template === undefined) return key;
  if (typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : `{${name}}`));
}
