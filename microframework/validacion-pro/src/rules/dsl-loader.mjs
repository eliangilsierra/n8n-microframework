// Carga reglas declarativas YAML del usuario.
// Usa la dependencia opcional `yaml` si está instalada; cae a un parser
// mínimo embebido que cubre el subconjunto necesario.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parseMiniYaml } from './yaml-mini.mjs';
import { t } from '../shared/i18n.mjs';

let _parse = null;
async function getParser() {
  if (_parse) return _parse;
  try {
    const mod = await import('yaml');
    _parse = (s) => mod.parse(s);
  } catch {
    _parse = parseMiniYaml;
  }
  return _parse;
}

export async function loadDslRules(dir) {
  if (!dir || !existsSync(dir)) return [];
  const parse = await getParser();
  const files = readdirSync(dir).filter(f => /\.ya?ml$/i.test(f));
  const rules = [];
  for (const f of files) {
    const path = join(dir, f);
    try {
      const doc = parse(readFileSync(path, 'utf8'));
      if (Array.isArray(doc)) for (const r of doc) rules.push(compileDsl(r, path));
      else if (doc) rules.push(compileDsl(doc, path));
    } catch (e) {
      console.error(t('cli.dsl.parseError', { path, error: e.message }));
    }
  }
  return rules;
}

function compileDsl(spec, source) {
  if (!spec || !spec.id) throw new Error(`Regla sin id en ${source}`);
  return { id: spec.id, dsl: spec, source, run: (ctx) => evaluateDsl(spec, ctx) };
}

function evaluateDsl(spec, { graph }) {
  const out = [];
  const match = spec.match || {};
  const assertSpec = spec.assert || {};
  const message = spec.message || `${spec.id} ${spec.name || ''}`;
  for (const n of graph.nodes) {
    if (!nodeMatches(n, match, graph)) continue;
    const fails = !runAssert(n, assertSpec, graph);
    if (fails) out.push({
      id: cryptoRandom(),
      ruleId: spec.id,
      ruleName: spec.name || spec.id,
      severity: spec.severity || 'warning',
      confidence: spec.confidence || 'medium',
      nodeId: n.id, nodeName: n.name, position: n.position,
      message,
      evidence: null,
      iso25010: spec.iso25010 || [],
      atamScenarios: spec.atam || [],
      adr: spec.adr || [],
      fixSuggestion: spec.fix ? { kind: 'hint', preview: spec.fix.hint || spec.fix } : null
    });
  }
  return out;
}

function nodeMatches(n, m, graph) {
  if (m.stage && n.stage !== m.stage) return false;
  if (m.nodeType) {
    const re = new RegExp(String(m.nodeType), 'i');
    if (!re.test(n.type)) return false;
  }
  if (m.nameRegex) {
    if (!new RegExp(m.nameRegex).test(n.name || '')) return false;
  }
  if (m.paramPath) {
    if (resolvePath(n.parameters, m.paramPath) === undefined) return false;
  }
  if (m.incomingEdges !== undefined) {
    if (n.inDegree !== Number(m.incomingEdges)) return false;
  }
  if (m.outgoingEdges !== undefined) {
    if (n.outDegree !== Number(m.outgoingEdges)) return false;
  }
  if (m.inSubgraphWith) {
    const re = new RegExp(String(m.inSubgraphWith), 'i');
    if (!graph.nodes.some(x => re.test(x.type) && x.id !== n.id)) return false;
  }
  return true;
}

function runAssert(n, a, graph) {
  // Si match aplica y `assert.not: true`, la regla falla siempre (prohibición).
  if (a.not === true) return false;
  if (a.exists) {
    if (resolvePath(n.parameters, a.exists) === undefined) return false;
  }
  if (a.equals) {
    for (const [path, want] of Object.entries(a.equals)) {
      if (resolvePath(n.parameters, path) !== want) return false;
    }
  }
  if (a.regex) {
    for (const [path, pat] of Object.entries(a.regex)) {
      const v = String(resolvePath(n.parameters, path) ?? '');
      if (!new RegExp(pat).test(v)) return false;
    }
  }
  return true;
}

function resolvePath(obj, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}
