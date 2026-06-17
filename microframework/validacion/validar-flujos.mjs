#!/usr/bin/env node
/* ============================================================================
 *  Validador estático de flujos n8n — Edición Lite v2.0
 * ----------------------------------------------------------------------------
 *  Pilar 2 DevSecOps · Micro-framework LC/NC para n8n
 *  Autor:    Elian Hernando Gil Sierra — MGADS UNAB 2026
 *  Director: Sebastian Roa Prada, PhD
 *
 *  Cambios mayores respecto a v1 (`legacy/validar-flujos-v1.mjs`):
 *   · Parser de grafo dirigido a partir de `nodes` + `connections` (no regex).
 *   · Inferencia de etapas E1–E4 por heurísticas tipadas (no por nombre).
 *   · 17 reglas: 11 REG-* + 6 antipatrones AP-* como queries sobre el grafo.
 *   · Severidad (error|warning|info) y confianza (high|medium|low).
 *   · Métricas: complejidad ciclomática, profundidad, cohesion score, fan-out.
 *   · Mapeo automático a ISO/IEC 25010 + escenarios ATAM + ADRs.
 *   · Renderers: md, json, sarif (v2.1.0), junit, html offline autocontenido.
 *   · Diff contra baseline JSON (--baseline) → nuevos / resueltos / regresiones.
 *   · CERO dependencias externas — Node >= 18, sin npm install.
 *
 *  Uso rápido:
 *     node microframework/validacion/validar-flujos.mjs
 *     node microframework/validacion/validar-flujos.mjs --format html
 *     node microframework/validacion/validar-flujos.mjs --input ruta/a/flow.json
 *     node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be
 *     node microframework/validacion/validar-flujos.mjs --format sarif --out reportes/
 *     node microframework/validacion/validar-flujos.mjs --baseline reportes/anterior.json
 * ========================================================================= */

import {
  readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync
} from 'node:fs';
import { join, basename, dirname, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const HERE = dirname(__filename);
const ROOT = join(HERE, '..', '..');
const VERSION = '2.0.0';
const TOOL = 'n8n-microframework-validator';

/* ============================================================================
 *  SECCIÓN 1 — CLI
 * ========================================================================= */

function parseArgs(argv) {
  const out = {
    caso: null, estado: null,
    input: [], format: 'md', out: null,
    baseline: null, strict: false, help: false,
    quiet: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--caso') out.caso = argv[++i];
    else if (a === '--estado') out.estado = argv[++i];
    else if (a === '--input') out.input.push(argv[++i]);
    else if (a === '--format') out.format = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--baseline') out.baseline = argv[++i];
    else if (a === '--strict') out.strict = true;
    else if (a === '--quiet') out.quiet = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

const HELP = `validar-flujos.mjs v${VERSION} — validador estático n8n (Lite)

Uso:
  node validar-flujos.mjs [opciones]

Opciones:
  --input <path>        Archivo o directorio JSON a analizar (repetible).
                        Sin --input: recorre casos-de-estudio/ y microframework/plantillas/.
  --caso bot|iot        Filtra por caso (compatibilidad con v1).
  --estado as-is|to-be  Filtra por estado (compatibilidad con v1).
  --format md|json|html|sarif|junit
                        Formato del reporte (default: md). Md y html siempre se
                        guardan en disco; json/sarif/junit van a stdout salvo
                        que se pase --out.
  --out <dir>           Carpeta para los archivos generados.
                        Default: microframework/validacion/reportes/
  --baseline <json>     Compara contra un reporte JSON previo. Imprime sección
                        "diff" con findings nuevos / resueltos / regresiones.
  --strict              Exit 1 también ante warnings (default: solo errors).
  --quiet               No imprime el reporte en stdout (solo lo escribe).
  -h, --help            Esta ayuda.

Exit code:
  0  → ningún flujo to-be tiene findings de severidad 'error'
  1  → al menos un flujo to-be tiene un finding 'error' (o 'warning' si --strict)
`;

/* ============================================================================
 *  SECCIÓN 2 — Carga del mapeo de calidad (ISO 25010 / ATAM / ADR)
 * ========================================================================= */

const MAPEO_CALIDAD = (() => {
  const p = join(HERE, 'mapeo-calidad.json');
  if (!existsSync(p)) return { reglas: {} };
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch { return { reglas: {} }; }
})();

function meta(ruleId) {
  return MAPEO_CALIDAD.reglas[ruleId] || {
    severityDefault: 'warning', iso25010: [], atam: [], adr: []
  };
}

/* ============================================================================
 *  SECCIÓN 3 — File discovery
 * ========================================================================= */

function walkJson(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walkJson(p, acc);
    else if (st.isFile() && p.endsWith('.json')) acc.push(p);
  }
  return acc;
}

function inferCasoEstado(absPath) {
  const rel = relative(ROOT, absPath).replace(/\\/g, '/');
  let caso = null, estado = null;
  let m = rel.match(/^casos-de-estudio\/([^\/]+)\/([^\/]+)\//);
  if (m) {
    caso = m[1];
    if (m[2] === 'as-is' || m[2] === 'to-be') estado = m[2];
  } else if (rel.startsWith('microframework/plantillas/')) {
    caso = 'plantilla';
    const fname = basename(absPath);
    estado = /as-is/i.test(fname) ? 'as-is' : 'to-be';
  }
  return { caso, estado };
}

function discoverFiles(args) {
  const files = [];
  const pushFile = (p) => {
    const abs = resolve(p);
    if (!existsSync(abs)) return;
    if (statSync(abs).isDirectory()) {
      for (const j of walkJson(abs)) files.push({ path: j, ...inferCasoEstado(j) });
    } else if (abs.endsWith('.json')) {
      files.push({ path: abs, ...inferCasoEstado(abs) });
    }
  };
  if (args.input.length > 0) {
    for (const p of args.input) pushFile(p);
  } else {
    // Comportamiento heredado: barrer casos-de-estudio/ + plantillas/
    const casosDir = join(ROOT, 'casos-de-estudio');
    if (existsSync(casosDir)) {
      for (const caso of readdirSync(casosDir)) {
        if (args.caso && caso !== args.caso) continue;
        const cDir = join(casosDir, caso);
        if (!statSync(cDir).isDirectory()) continue;
        for (const estado of ['as-is', 'to-be']) {
          if (args.estado && estado !== args.estado) continue;
          const eDir = join(cDir, estado);
          if (!existsSync(eDir)) continue;
          for (const f of readdirSync(eDir)) {
            if (f.endsWith('.json')) files.push({ path: join(eDir, f), caso, estado });
          }
        }
      }
    }
    const plant = join(ROOT, 'microframework', 'plantillas');
    if (existsSync(plant) && !args.caso) {
      for (const f of readdirSync(plant)) {
        if (!f.endsWith('.json')) continue;
        const estado = /as-is/i.test(f) ? 'as-is' : 'to-be';
        if (args.estado && estado !== args.estado) continue;
        files.push({ path: join(plant, f), caso: 'plantilla', estado });
      }
    }
  }
  return files;
}

/* ============================================================================
 *  SECCIÓN 4 — Parser n8n: JSON → grafo dirigido tipado
 * ========================================================================= */

function parseFlow(path) {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    return raw;
  } catch (e) {
    return { __parseError: e.message };
  }
}

/**
 * Reconstruye el grafo dirigido del flujo n8n.
 * connections de n8n usa nombres de nodo como llaves; aquí se traducen a IDs.
 * Soporta ramas main (índice 0+) y error.
 */
function buildGraph(flow) {
  const nodes = (flow.nodes || []).map(n => ({
    id: n.id || n.name,
    name: n.name,
    type: n.type || '',
    typeVersion: n.typeVersion,
    position: Array.isArray(n.position) ? n.position : [0, 0],
    parameters: n.parameters || {},
    credentials: n.credentials || {},
    onError: n.onError || null,
    continueOnFail: n.continueOnFail === true,
    raw: n
  }));
  const byName = new Map(nodes.map(n => [n.name, n]));
  const byId = new Map(nodes.map(n => [n.id, n]));

  const edges = [];
  const conns = flow.connections || {};
  for (const [fromName, byBranch] of Object.entries(conns)) {
    const fromNode = byName.get(fromName);
    if (!fromNode) continue;
    for (const [branch, slots] of Object.entries(byBranch)) {
      if (!Array.isArray(slots)) continue;
      for (const slot of slots) {
        if (!Array.isArray(slot)) continue;
        for (const link of slot) {
          const toNode = byName.get(link.node);
          if (!toNode) continue;
          edges.push({
            from: fromNode.id, to: toNode.id,
            branch: branch === 'error' || branch === 'onError' ? 'error' : 'main'
          });
        }
      }
    }
  }

  // Grado in/out por nodo
  for (const n of nodes) { n.inDegree = 0; n.outDegree = 0; n.hasErrorBranch = false; }
  for (const e of edges) {
    const f = byId.get(e.from); const t = byId.get(e.to);
    if (f) { f.outDegree++; if (e.branch === 'error') f.hasErrorBranch = true; }
    if (t) t.inDegree++;
  }

  // Subflujos referenciados — solo nodos invocadores (executeWorkflow),
  // NO el trigger receptor del subflujo (executeWorkflowTrigger)
  const subflowRefs = nodes
    .filter(n => /executeWorkflow$/i.test(n.type))
    .map(n => ({
      nodeId: n.id, nodeName: n.name,
      workflowId: n.parameters?.workflowId?.value || n.parameters?.workflowId || null
    }));

  return { nodes, edges, subflowRefs, byId, byName };
}

/* ============================================================================
 *  SECCIÓN 5 — Clasificador de etapas E1–E4
 * ========================================================================= */

const IO_TYPES = [
  'httprequest', 'postgres', 'mysql', 'mongodb', 'redis', 'kafka', 'mqtt',
  'rabbitmq', 'sendgrid', 'mailjet', 'slack', 'telegram', 'discord', 'ftp', 's3'
];

function isIoType(type) {
  const t = (type || '').toLowerCase();
  return IO_TYPES.some(io => t.includes(io));
}

function nodeHasIoSignal(node) {
  // Algunos nodos Code pueden ejecutar HTTP fetch dinámico; lo detectamos por código.
  const t = (node.type || '').toLowerCase();
  if (isIoType(t)) return true;
  if (t.includes('code') || t.includes('function')) {
    const src = String(node.parameters?.jsCode || node.parameters?.functionCode || '');
    if (/\b(fetch|axios|request|http\.(get|post)|pg\.|new Client)\b/.test(src)) return true;
  }
  return false;
}

/**
 * Cascada de heurísticas — el primer match gana. Devuelve { stage, inferred }.
 * inferred=true significa "deducido por tipo"; false significa "respaldado por nombre".
 */
function classifyStage(node) {
  const t = (node.type || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  let stage = 'UNKNOWN';
  let inferred = true;

  if (/-e1\b/.test(name) || /\be1\b/.test(name)) { stage = 'E1'; inferred = false; }
  else if (/-e2\b/.test(name) || /\be2\b/.test(name)) { stage = 'E2'; inferred = false; }
  else if (/-e3\b/.test(name) || /\be3\b/.test(name)) { stage = 'E3'; inferred = false; }
  else if (/-e4\b/.test(name) || /\be4\b/.test(name)) { stage = 'E4'; inferred = false; }
  else if (t.includes('webhook') && !t.includes('respond')) stage = 'E1';
  else if (t.includes('trigger')) stage = 'E1';
  else if (t.includes('respondtowebhook')) stage = 'E4';
  else if (t.includes('executeworkflow')) stage = 'UNKNOWN';  // hereda del subflujo
  else if (isIoType(t)) stage = 'E3';
  else if (t.includes('code') || t.includes('function')) {
    stage = nodeHasIoSignal(node) ? 'E3' : 'E2';
  } else if (t.includes('set') || t.includes('if') || t.includes('switch') ||
             t.includes('merge') || t.includes('itemlists')) {
    stage = 'E2';
  }
  return { stage, inferred };
}

function annotateStages(graph) {
  for (const n of graph.nodes) {
    const { stage, inferred } = classifyStage(n);
    n.stage = stage;
    n.stageInferred = inferred;
  }
}

/* ============================================================================
 *  SECCIÓN 6 — Métricas de calidad del grafo
 * ========================================================================= */

function computeMetrics(graph) {
  const N = graph.nodes.length;
  const E = graph.edges.length;
  // Componentes conexos P (sobre grafo no dirigido)
  const adj = new Map();
  for (const n of graph.nodes) adj.set(n.id, new Set());
  for (const e of graph.edges) {
    adj.get(e.from)?.add(e.to);
    adj.get(e.to)?.add(e.from);
  }
  const visited = new Set();
  let components = 0;
  for (const n of graph.nodes) {
    if (visited.has(n.id)) continue;
    components++;
    const stack = [n.id];
    while (stack.length) {
      const x = stack.pop();
      if (visited.has(x)) continue;
      visited.add(x);
      for (const y of adj.get(x) || []) if (!visited.has(y)) stack.push(y);
    }
  }
  const P = Math.max(1, components);
  const cyclomatic = Math.max(0, E - N + 2 * P);

  // Profundidad máxima desde fuentes (in-degree 0)
  const sources = graph.nodes.filter(n => n.inDegree === 0).map(n => n.id);
  let maxDepth = 0;
  for (const s of sources) {
    const depth = new Map([[s, 0]]);
    const q = [s];
    while (q.length) {
      const x = q.shift();
      const d = depth.get(x);
      for (const e of graph.edges) if (e.from === x) {
        const nd = d + 1;
        if (!depth.has(e.to) || depth.get(e.to) < nd) {
          depth.set(e.to, nd); q.push(e.to);
        }
      }
    }
    for (const d of depth.values()) if (d > maxDepth) maxDepth = d;
  }

  const stageDistribution = { E1: 0, E2: 0, E3: 0, E4: 0, UNKNOWN: 0 };
  for (const n of graph.nodes) stageDistribution[n.stage]++;

  // Cohesion score: % de aristas que NO cruzan más de 1 frontera de etapa.
  // Una arista E1→E2 es "natural"; E1→E4 es leak. Etapas UNKNOWN no cuentan.
  const stageOrder = { E1: 1, E2: 2, E3: 3, E4: 4 };
  let naturalEdges = 0, countableEdges = 0;
  for (const e of graph.edges) {
    const a = graph.byId.get(e.from)?.stage;
    const b = graph.byId.get(e.to)?.stage;
    if (!a || !b || a === 'UNKNOWN' || b === 'UNKNOWN') continue;
    countableEdges++;
    if (Math.abs((stageOrder[a] || 0) - (stageOrder[b] || 0)) <= 1) naturalEdges++;
  }
  const cohesionScore = countableEdges === 0 ? 1.0 : naturalEdges / countableEdges;

  const fanOutTop = graph.nodes
    .map(n => ({ nodeId: n.id, nodeName: n.name, value: n.outDegree }))
    .sort((a, b) => b.value - a.value).slice(0, 5);

  return {
    nodeCount: N, edgeCount: E,
    cyclomaticComplexity: cyclomatic,
    maxDepth,
    stageDistribution,
    cohesionScore: Math.round(cohesionScore * 1000) / 1000,
    fanOutTop
  };
}

/* ============================================================================
 *  SECCIÓN 7 — Rule engine
 * ========================================================================= */

function makeFinding(ruleId, opts = {}) {
  const m = meta(ruleId);
  return {
    id: randomUUID().slice(0, 8),
    ruleId,
    ruleName: m.nombre || opts.ruleName || ruleId,
    severity: opts.severity || m.severityDefault || 'warning',
    confidence: opts.confidence || 'high',
    nodeId: opts.nodeId || null,
    nodeName: opts.nodeName || null,
    position: opts.position || null,
    message: opts.message || '',
    evidence: opts.evidence || null,
    iso25010: m.iso25010 || [],
    atamScenarios: m.atam || [],
    adr: m.adr || [],
    fixSuggestion: opts.fixSuggestion || null
  };
}

/* --- Patrones de detección de secretos en literales --- */
const SECRET_PATTERNS = [
  { re: /Bearer\s+[A-Za-z0-9._\-]{8,}/i, label: 'Bearer token literal' },
  { re: /sk-[A-Za-z0-9]{16,}/, label: 'API key estilo OpenAI' },
  { re: /ghp_[A-Za-z0-9]{16,}/, label: 'GitHub PAT literal' },
  { re: /\b(const|let|var)\s+\w*(token|api[_-]?key|secret|password)\w*\s*=\s*["'][^"'{}$\s][^"'{}$]{6,}["']/i,
    label: 'Asignación literal a variable de secreto en Code' },
  { re: /"rightValue"\s*:\s*"[A-Za-z0-9._\-]{12,}"/, label: 'Comparación literal de token en IF/Switch' }
];

function ruleSecretos({ graph, file }) {
  const findings = [];
  for (const n of graph.nodes) {
    const paramsStr = JSON.stringify(n.parameters || {});
    for (const pat of SECRET_PATTERNS) {
      const m = paramsStr.match(pat.re);
      if (m) {
        findings.push(makeFinding('REG-001', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: `Secreto literal detectado: ${pat.label}`,
          evidence: m[0].slice(0, 120),
          fixSuggestion: {
            kind: 'codemod-id', codemodId: 'envify-secret',
            preview: 'Reemplazar literal por credencial n8n o {{$env.VAR_NAME}}'
          }
        }));
      }
    }
    // Headers x-api-key con valor literal — chequeo estructurado, no regex
    const headers = n.parameters?.headerParameters?.parameters
      || n.parameters?.headers?.parameters || [];
    if (Array.isArray(headers)) {
      for (const h of headers) {
        const name = String(h.name || '').toLowerCase();
        const value = String(h.value || '');
        if (['x-api-key', 'authorization', 'api-key', 'x-auth-token'].includes(name)
            && value.length > 6 && !/\{\{.*\}\}/.test(value) && !/^\$\{/.test(value)) {
          findings.push(makeFinding('REG-001', {
            nodeId: n.id, nodeName: n.name, position: n.position,
            message: `Header HTTP "${h.name}" con valor literal`,
            evidence: `${h.name}: ${value.slice(0, 40)}…`,
            fixSuggestion: {
              kind: 'codemod-id', codemodId: 'envify-secret',
              preview: `Header debe usar {{$env.${name.toUpperCase().replace(/-/g, '_')}}}`
            }
          }));
        }
      }
    }
  }
  return findings;
}

function ruleRunId({ graph, file }) {
  const codes = graph.nodes.filter(n =>
    /code|function/i.test(n.type));
  if (codes.length === 0) {
    // Orquestador puro con Execute Workflow → N/A
    if (graph.subflowRefs.length > 0) return { na: 'orquestador puro (run_id delegado a subflujo E1)' };
    return { na: 'sin nodos Code' };
  }
  const findings = [];
  let foundRunId = false, foundLog = false;
  for (const n of codes) {
    const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
    if (src.includes('run_id')) foundRunId = true;
    if (/console\.log\s*\(\s*JSON\.stringify/.test(src)) foundLog = true;
  }
  if (!foundRunId) {
    findings.push(makeFinding('REG-002', {
      message: 'Ningún nodo Code referencia run_id',
      confidence: 'high',
      fixSuggestion: { kind: 'hint',
        preview: 'Generar run_id en E1 con crypto.randomUUID() y propagarlo en el payload.' }
    }));
  }
  if (!foundLog) {
    findings.push(makeFinding('REG-002', {
      message: 'No se detectó console.log(JSON.stringify(...)) con run_id',
      confidence: 'medium'
    }));
  }
  return findings;
}

function ruleErrorWorkflow({ flow, file, graph }) {
  const isOrq = isOrquestadorFile(file, graph);
  if (!isOrq) return { na: 'no es orquestador' };
  const s = flow?.settings?.errorWorkflow;
  if (s && String(s).trim().length > 0) return [];
  return [makeFinding('REG-003', {
    message: 'settings.errorWorkflow ausente o vacío en orquestador',
    fixSuggestion: { kind: 'hint',
      preview: 'Configurar Settings → Error Workflow apuntando al error handler del caso.' }
  })];
}

function ruleRetry({ graph }) {
  const https = graph.nodes.filter(n => /httprequest/i.test(n.type));
  if (https.length === 0) return { na: 'sin nodos HTTP' };
  const findings = [];
  for (const n of https) {
    const retry = n.parameters?.options?.retry;
    const enabled = retry?.enabled === true;
    const max = Number(retry?.maxRetries ?? retry?.maxTries ?? 0);
    if (!enabled) {
      findings.push(makeFinding('REG-004', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: 'Nodo HTTP sin retry habilitado',
        evidence: `options.retry.enabled = ${enabled}`,
        fixSuggestion: { kind: 'codemod-id', codemodId: 'add-http-retry',
          preview: 'options.retry = { enabled: true, maxRetries: 3, waitBetweenTries: 1000 }' }
      }));
    } else if (max < 2) {
      findings.push(makeFinding('REG-004', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        severity: 'warning',
        message: `maxRetries=${max} < 2`,
        evidence: `options.retry.maxRetries = ${max}`,
        fixSuggestion: { kind: 'codemod-id', codemodId: 'add-http-retry',
          preview: 'Subir maxRetries a 3 con backoff exponencial.' }
      }));
    }
  }
  return findings;
}

function ruleIdempotencia({ graph, file }) {
  if (isErrorHandlerFile(file)) return { na: 'error handler (cada evento es único)' };
  const pgs = graph.nodes.filter(n => /postgres/i.test(n.type));
  if (pgs.length === 0) return { na: 'sin nodos Postgres' };
  const findings = [];
  for (const n of pgs) {
    const q = JSON.stringify(n.parameters || {}).toLowerCase();
    const isInsert = q.includes('"insert"') || q.includes('insert into') ||
      q.includes('"operation":"insert"');
    if (!isInsert) continue;
    const hasOnConflict = /on\s+conflict/.test(q);
    const hasIdemKey = /idempotency_key/.test(q);
    if (!hasOnConflict && !hasIdemKey) {
      findings.push(makeFinding('REG-005', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: 'INSERT sin ON CONFLICT ni idempotency_key',
        evidence: extractQuery(n.parameters || {}),
        fixSuggestion: { kind: 'codemod-id', codemodId: 'add-on-conflict',
          preview: 'Agregar ON CONFLICT (id) DO NOTHING o columna idempotency_key UNIQUE.' }
      }));
    }
  }
  return findings;
}

function extractQuery(params) {
  return String(params.query || params.queryReplacement || params.sql || '').slice(0, 200);
}

function ruleLogEstructurado({ graph }) {
  const codes = graph.nodes.filter(n => /code|function/i.test(n.type));
  if (codes.length === 0) return { na: 'sin nodos Code' };
  const findings = [];
  for (const n of codes) {
    const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
    if (!/console\.log\s*\(\s*JSON\.stringify/.test(src)) {
      findings.push(makeFinding('REG-006', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: 'Nodo Code sin console.log(JSON.stringify(...))',
        confidence: 'medium',
        fixSuggestion: { kind: 'hint',
          preview: "console.log(JSON.stringify({ run_id, etapa: 'E?', status: 'ok' }));" }
      }));
      continue;
    }
    const missing = ['run_id', 'etapa', 'status'].filter(k => !src.includes(k));
    if (missing.length) {
      findings.push(makeFinding('REG-006', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `Log JSON sin campos: ${missing.join(', ')}`,
        confidence: 'high'
      }));
    }
  }
  return findings;
}

function ruleDominioAislado({ graph, file }) {
  // E2 sin IO. Se aplica:
  //  - si el nombre del archivo contiene -e2-dominio (señal autoritativa)
  //  - o sobre nodos individuales clasificados como E2
  const isE2File = /-e2-dominio/i.test(basename(file.path));
  if (isE2File) {
    const ios = graph.nodes.filter(n => isIoType(n.type));
    if (ios.length === 0) return [];
    return ios.map(n => makeFinding('REG-007', {
      nodeId: n.id, nodeName: n.name, position: n.position,
      message: `Nodo IO "${n.type}" presente en subflujo E2 (dominio)`,
      fixSuggestion: { kind: 'hint',
        preview: 'Extraer este IO a un subflujo E3 invocado vía Execute Workflow.' }
    }));
  }
  // Cuando no es archivo E2, sólo reportamos si un nodo individual quedó clasificado
  // como E2 y contiene IO (esto es el "Stage leak" — pero se cubre con AP-006).
  return { na: 'no es subflujo E2 por nombre' };
}

function ruleIntegracionesLugar({ graph, file }) {
  const name = basename(file.path);
  const isAllowedFile = /-e3-|-e4-|orquestador|error.handler/i.test(name);
  const ios = graph.nodes.filter(n => isIoType(n.type));
  if (ios.length === 0) return { na: 'sin nodos IO' };
  if (isAllowedFile) return [];
  return [makeFinding('REG-008', {
    message: `Nodos IO en archivo sin convención E3/E4/orquestador: ${ios.map(n => n.name).join(', ')}`,
    confidence: 'medium'
  })];
}

function ruleStatusCodes({ graph, file }) {
  if (!isOrquestadorFile(file, graph)) return { na: 'no es orquestador' };
  const responders = graph.nodes.filter(n => /respondtowebhook/i.test(n.type));
  if (responders.length === 0) {
    return [makeFinding('REG-009', {
      message: 'Orquestador sin nodo Respond to Webhook'
    })];
  }
  const codes = new Set();
  for (const n of responders) {
    const c = n.parameters?.responseCode ?? n.parameters?.options?.responseCode;
    if (c !== undefined && c !== null) codes.add(String(c));
  }
  if (codes.size < 2) {
    return [makeFinding('REG-009', {
      message: `Orquestador con un único responseCode: [${[...codes].join(', ')}]`,
      fixSuggestion: { kind: 'hint',
        preview: 'Diferenciar éxito (200/201) de error de cliente (4xx) y de servidor (5xx).' }
    })];
  }
  return [];
}

function ruleAdrPresente({ file }) {
  if (file.caso === 'plantilla' || !file.caso) return { na: 'plantilla o caso sin convención' };
  const adrDir = join(ROOT, 'casos-de-estudio', file.caso, 'adr');
  if (!existsSync(adrDir)) {
    return [makeFinding('REG-010', { message: `Carpeta casos-de-estudio/${file.caso}/adr/ no existe` })];
  }
  const adrs = readdirSync(adrDir).filter(f => /^ADR-.*\.md$/.test(f));
  if (adrs.length === 0) {
    return [makeFinding('REG-010', { message: 'Carpeta adr/ sin archivos ADR-*.md' })];
  }
  return [];
}

const VOCAB_PROHIBIDO = [
  { re: /[=:]\s*['"]warning['"]/, correcto: '"advertencia"' },
  { re: /[=:]\s*['"]WARNING['"]/, correcto: '"advertencia"' },
  { re: /[=:]\s*['"]critical['"]/, correcto: '"critico"' },
  { re: /[=:]\s*['"]CRITICAL['"]/, correcto: '"critico"' }
];

function ruleVocabulario({ graph, file }) {
  if (file.caso === 'plantilla') return { na: 'plantilla' };
  if (file.estado && file.estado !== 'to-be') return { na: 'sólo aplica a to-be' };
  const findings = [];
  for (const n of graph.nodes.filter(n => /code|function/i.test(n.type))) {
    const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
    if (!src) continue;
    for (const v of VOCAB_PROHIBIDO) {
      const m = src.match(v.re);
      if (m) findings.push(makeFinding('REG-VOC', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `Vocabulario en inglés — usar ${v.correcto}`,
        evidence: m[0]
      }));
    }
  }
  return findings;
}

/* --- Antipatrones (queries sobre el grafo) --- */

function antiGodNode({ graph }) {
  const findings = [];
  for (const n of graph.nodes) {
    const degree = n.inDegree + n.outDegree;
    if (degree > 6) {
      findings.push(makeFinding('AP-001', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `God-node: in=${n.inDegree}, out=${n.outDegree} (umbral 6)`,
        confidence: 'medium',
        fixSuggestion: { kind: 'hint',
          preview: 'Descomponer la responsabilidad de este nodo en 2–3 subflujos cohesivos.' }
      }));
    }
  }
  return findings.length ? findings : { na: 'ningún nodo supera grado 6' };
}

function antiChatty({ graph }) {
  // Heurística: nodo HTTP cuyo predecesor es un splitInBatches / itemLists / loop.
  const findings = [];
  for (const n of graph.nodes) {
    if (!/httprequest/i.test(n.type)) continue;
    const pred = graph.edges.filter(e => e.to === n.id).map(e => graph.byId.get(e.from));
    for (const p of pred) {
      if (!p) continue;
      const t = (p.type || '').toLowerCase();
      if (t.includes('splitinbatches') || t.includes('itemlists') ||
          t.includes('loop') || t.includes('foreach')) {
        findings.push(makeFinding('AP-002', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: `Posible chatty IO: HTTP "${n.name}" dentro de loop "${p.name}"`,
          confidence: 'medium',
          fixSuggestion: { kind: 'hint',
            preview: 'Considerar batch endpoint o cache para evitar N llamadas HTTP.' }
        }));
      }
    }
  }
  return findings.length ? findings : { na: 'sin patrón HTTP-en-loop' };
}

function antiDualWrite({ graph }) {
  const writers = graph.nodes.filter(n =>
    /postgres|mysql|mongodb/i.test(n.type) &&
    /insert|update/i.test(JSON.stringify(n.parameters || {})));
  if (writers.length < 2) return { na: 'menos de 2 escrituras' };
  // Detectar pares de escritores en distinto subgrafo de etapa y sin saga
  const txt = JSON.stringify(graph.nodes.map(n => n.parameters || {}));
  const hasSaga = /saga|compensat|rollback|begin\s+transaction|commit\s*;/i.test(txt);
  if (hasSaga) return { na: 'detectada compensación/transacción' };
  return [makeFinding('AP-003', {
    message: `Dual-write detectado: ${writers.map(w => w.name).join(' + ')} sin compensación visible`,
    confidence: 'medium',
    fixSuggestion: { kind: 'hint',
      preview: 'Implementar patrón saga / compensación o usar BEGIN..COMMIT explícito.' }
  })];
}

function antiExceptionSwallowing({ graph, flow }) {
  // Si el flujo tiene errorWorkflow global, los errores no quedan silenciados — los captura
  // el handler global. AP-004 sólo dispara cuando NO hay esa red de seguridad.
  const hasGlobalHandler = flow?.settings?.errorWorkflow
    && String(flow.settings.errorWorkflow).trim().length > 0;
  const findings = [];
  for (const n of graph.nodes) {
    if (n.hasErrorBranch || n.continueOnFail || n.onError === 'continueRegularOutput') {
      const errEdges = graph.edges.filter(e => e.from === n.id && e.branch === 'error');
      const hasLogDownstream = errEdges.some(e => {
        const next = graph.byId.get(e.to);
        if (!next) return false;
        const src = String(next.parameters?.jsCode || next.parameters?.functionCode || '');
        return /console\.log|errorWorkflow|throw/.test(src);
      });
      if (errEdges.length > 0 && !hasLogDownstream) {
        findings.push(makeFinding('AP-004', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: 'Rama error no termina en log estructurado ni re-throw',
          confidence: 'medium'
        }));
      } else if (errEdges.length === 0 && n.continueOnFail && !hasGlobalHandler) {
        findings.push(makeFinding('AP-004', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: 'continueOnFail=true sin rama error explícita y sin errorWorkflow global'
        }));
      }
    }
  }
  return findings.length ? findings : { na: 'no se detectó swallowing' };
}

function antiHardcodedSubflowId({ graph }) {
  const findings = [];
  for (const ref of graph.subflowRefs) {
    const id = ref.workflowId;
    // Placeholders típicos del repo
    if (!id || /placeholder|REEMPLAZAR|TODO|\{\{.+\}\}/i.test(String(id))) {
      findings.push(makeFinding('AP-005', {
        nodeId: ref.nodeId, nodeName: ref.nodeName,
        message: `Execute Workflow con workflowId no resuelto: "${id}"`,
        confidence: 'high'
      }));
    }
  }
  return findings.length ? findings : { na: 'workflowIds resueltos' };
}

function antiStageLeak({ graph }) {
  // Nodo clasificado como E2 que contiene IO real
  const findings = [];
  for (const n of graph.nodes) {
    if (n.stage === 'E2' && nodeHasIoSignal(n)) {
      findings.push(makeFinding('AP-006', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `Stage leak: nodo clasificado E2 con IO (${n.type})`,
        confidence: 'high'
      }));
    }
  }
  return findings.length ? findings : { na: 'no se detectó stage leak' };
}

/* --- Helpers para reglas --- */

function isOrquestadorFile(file, graph) {
  if (/orquestador/i.test(basename(file.path))) return true;
  // Inferencia: tiene webhook + respondToWebhook + execute-workflow
  const types = graph.nodes.map(n => (n.type || '').toLowerCase());
  return types.some(t => t.includes('webhook') && !t.includes('respond'))
    && types.some(t => t.includes('respondtowebhook'))
    && types.some(t => t.includes('executeworkflow'));
}
function isErrorHandlerFile(file) {
  return /error.handler/i.test(basename(file.path));
}

/* --- Registro de reglas --- */

const REGLAS = [
  { id: 'REG-001', fn: ruleSecretos },
  { id: 'REG-002', fn: ruleRunId },
  { id: 'REG-003', fn: ruleErrorWorkflow },
  { id: 'REG-004', fn: ruleRetry },
  { id: 'REG-005', fn: ruleIdempotencia },
  { id: 'REG-006', fn: ruleLogEstructurado },
  { id: 'REG-007', fn: ruleDominioAislado },
  { id: 'REG-008', fn: ruleIntegracionesLugar },
  { id: 'REG-009', fn: ruleStatusCodes },
  { id: 'REG-010', fn: ruleAdrPresente },
  { id: 'REG-VOC', fn: ruleVocabulario },
  { id: 'AP-001', fn: antiGodNode },
  { id: 'AP-002', fn: antiChatty },
  { id: 'AP-003', fn: antiDualWrite },
  { id: 'AP-004', fn: antiExceptionSwallowing },
  { id: 'AP-005', fn: antiHardcodedSubflowId },
  { id: 'AP-006', fn: antiStageLeak }
];

/* ============================================================================
 *  SECCIÓN 8 — Evaluación
 * ========================================================================= */

function evaluarArchivo(file) {
  const flow = parseFlow(file.path);
  if (flow.__parseError) {
    return {
      path: file.path, caso: file.caso, estado: file.estado,
      parseError: flow.__parseError,
      graph: { nodes: [], edges: [], subflowRefs: [] },
      metrics: emptyMetrics(),
      findings: [], summary: emptySummary(), rulesApplicable: []
    };
  }
  const graph = buildGraph(flow);
  annotateStages(graph);
  const metrics = computeMetrics(graph);

  const ctx = { flow, graph, file };
  const findings = [];
  const rulesApplicable = [];
  const rulesNa = [];
  const rulesPassed = [];

  for (const r of REGLAS) {
    const result = r.fn(ctx);
    if (Array.isArray(result)) {
      rulesApplicable.push(r.id);
      if (result.length === 0) rulesPassed.push(r.id);
      else findings.push(...result);
    } else if (result && result.na) {
      rulesNa.push({ id: r.id, reason: result.na });
    }
  }

  const summary = summarize(findings, rulesApplicable, rulesPassed);
  return {
    path: file.path, caso: file.caso, estado: file.estado,
    isOrquestador: isOrquestadorFile(file, graph),
    isErrorHandler: isErrorHandlerFile(file),
    graph: serializeGraph(graph),
    metrics, findings, summary,
    rulesApplicable, rulesNa, rulesPassed
  };
}

function summarize(findings, applicable, passed) {
  const errors = findings.filter(f => f.severity === 'error').length;
  const warnings = findings.filter(f => f.severity === 'warning').length;
  const infos = findings.filter(f => f.severity === 'info').length;
  const total = applicable.length;
  const score = total === 0 ? 100 : Math.round((passed.length / total) * 100);
  return {
    errors, warnings, infos, score,
    rulesApplicable: total, rulesPassed: passed.length
  };
}

function emptySummary() {
  return { errors: 0, warnings: 0, infos: 0, score: 0,
    rulesApplicable: 0, rulesPassed: 0 };
}
function emptyMetrics() {
  return { nodeCount: 0, edgeCount: 0, cyclomaticComplexity: 0, maxDepth: 0,
    stageDistribution: { E1:0,E2:0,E3:0,E4:0,UNKNOWN:0 },
    cohesionScore: 1, fanOutTop: [] };
}

function serializeGraph(g) {
  return {
    nodes: g.nodes.map(n => ({
      id: n.id, name: n.name, type: n.type,
      stage: n.stage, stageInferred: n.stageInferred,
      position: n.position,
      inDegree: n.inDegree, outDegree: n.outDegree,
      hasErrorBranch: n.hasErrorBranch
    })),
    edges: g.edges.map(e => ({ from: e.from, to: e.to, branch: e.branch })),
    subflowRefs: g.subflowRefs
  };
}

/* ============================================================================
 *  SECCIÓN 9 — Coverage del micro-framework
 * ========================================================================= */

function computeCoverage(reports) {
  const defined = REGLAS.map(r => r.id);
  const exercised = new Set();
  for (const r of reports) {
    for (const f of r.findings) exercised.add(f.ruleId);
    for (const id of r.rulesApplicable || []) exercised.add(id);
  }
  const dormant = defined.filter(d => !exercised.has(d));
  return {
    rulesDefined: defined,
    rulesExercised: [...exercised],
    rulesDormant: dormant
  };
}

/* ============================================================================
 *  SECCIÓN 10 — Build del reporte
 * ========================================================================= */

function gitCommit() {
  try { return execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); }
  catch { return null; }
}

function buildReport(files, edition = 'lite') {
  const reports = files.map(evaluarArchivo);
  const coverage = computeCoverage(reports);
  return {
    tool: TOOL, version: VERSION, edition,
    generatedAt: new Date().toISOString(),
    commit: gitCommit(),
    author: 'Elian Hernando Gil Sierra',
    director: 'Sebastian Roa Prada, PhD',
    project: 'Micro-framework LC/NC para n8n — MGADS UNAB 2026',
    files: reports,
    coverage,
    history: loadHistory()
  };
}

function loadHistory() {
  const dir = join(HERE, 'reportes');
  if (!existsSync(dir)) return [];
  const items = [];
  for (const f of readdirSync(dir)) {
    if (!/^validacion-\d{4}-\d{2}-\d{2}\.json$/.test(f)) continue;
    try {
      const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const errs = (r.files || []).reduce((a, x) => a + (x.summary?.errors || 0), 0);
      const warns = (r.files || []).reduce((a, x) => a + (x.summary?.warnings || 0), 0);
      const score = (r.files || []).length === 0 ? 0
        : Math.round(r.files.reduce((a, x) => a + (x.summary?.score || 0), 0) / r.files.length);
      items.push({ date: f.slice(11, 21), score, errors: errs, warnings: warns });
    } catch {}
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/* ============================================================================
 *  SECCIÓN 11 — Renderer Markdown
 * ========================================================================= */

function renderMd(report) {
  const lines = [];
  lines.push(`# Reporte de validación estática — Lite v${VERSION}`);
  lines.push('');
  lines.push(`- Generado: ${report.generatedAt}`);
  if (report.commit) lines.push(`- Commit: \`${report.commit.slice(0,12)}\``);
  lines.push(`- Archivos analizados: ${report.files.length}`);
  lines.push('');

  // Resumen por estado
  const groups = groupBy(report.files, f => f.estado || 'sin estado');
  for (const [estado, files] of Object.entries(groups)) {
    lines.push(`## Estado: ${estado}`);
    lines.push('');
    lines.push('| Archivo | Caso | Score | Err | Warn | Info | Nodos | Ciclomática |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const f of files) {
      const s = f.summary;
      const rel = relative(ROOT, f.path).replace(/\\/g, '/');
      lines.push(`| ${rel} | ${f.caso || '–'} | ${s.score}% | ${s.errors} | ${s.warnings} | ${s.infos} | ${f.metrics.nodeCount} | ${f.metrics.cyclomaticComplexity} |`);
    }
    lines.push('');
  }

  // Cobertura del micro-framework
  lines.push('## Cobertura del micro-framework');
  lines.push('');
  lines.push(`- Reglas definidas: ${report.coverage.rulesDefined.length}`);
  lines.push(`- Reglas ejercitadas: ${report.coverage.rulesExercised.length}`);
  if (report.coverage.rulesDormant.length) {
    lines.push(`- ⚠️ Reglas dormidas (no ejercitadas por ningún flujo): ${report.coverage.rulesDormant.join(', ')}`);
  }
  lines.push('');

  // Detalle
  lines.push('## Detalle por archivo');
  lines.push('');
  for (const f of report.files) {
    const rel = relative(ROOT, f.path).replace(/\\/g, '/');
    lines.push(`### ${rel}`);
    if (f.parseError) {
      lines.push(`- ❌ ERROR parseo: ${f.parseError}`);
      lines.push('');
      continue;
    }
    lines.push(`- Métricas: nodos=${f.metrics.nodeCount}, aristas=${f.metrics.edgeCount}, ciclomática=${f.metrics.cyclomaticComplexity}, profundidad=${f.metrics.maxDepth}, cohesion=${f.metrics.cohesionScore}`);
    const sd = f.metrics.stageDistribution;
    lines.push(`- Etapas: E1=${sd.E1} E2=${sd.E2} E3=${sd.E3} E4=${sd.E4} UNK=${sd.UNKNOWN}`);
    if (f.findings.length === 0) {
      lines.push('- ✓ Sin findings');
    } else {
      for (const fd of f.findings) {
        const icon = fd.severity === 'error' ? '🛑' : fd.severity === 'warning' ? '⚠️' : 'ℹ️';
        const at = fd.nodeName ? ` @ "${fd.nodeName}"` : '';
        lines.push(`- ${icon} **${fd.ruleId}** ${fd.ruleName}${at}: ${fd.message}`);
        if (fd.evidence) lines.push(`    - evidencia: \`${fd.evidence}\``);
        if (fd.iso25010?.length) lines.push(`    - ISO 25010: ${fd.iso25010.join(', ')}`);
        if (fd.atamScenarios?.length) lines.push(`    - ATAM: ${fd.atamScenarios.join(', ')}`);
        if (fd.fixSuggestion?.preview) lines.push(`    - fix: ${fd.fixSuggestion.preview}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function groupBy(arr, keyFn) {
  const o = {};
  for (const x of arr) {
    const k = keyFn(x);
    (o[k] = o[k] || []).push(x);
  }
  return o;
}

/* ============================================================================
 *  SECCIÓN 12 — Renderer SARIF v2.1.0
 * ========================================================================= */

function renderSarif(report) {
  const rules = REGLAS.map(r => {
    const m = meta(r.id);
    return {
      id: r.id, name: m.nombre || r.id,
      shortDescription: { text: m.nombre || r.id },
      fullDescription: { text: `${m.nombre || r.id} — micro-framework LC/NC n8n` },
      defaultConfiguration: { level: severityToSarif(m.severityDefault || 'warning') },
      properties: { iso25010: m.iso25010 || [], atam: m.atam || [], adr: m.adr || [] }
    };
  });
  const results = [];
  for (const f of report.files) {
    for (const fd of f.findings) {
      results.push({
        ruleId: fd.ruleId,
        level: severityToSarif(fd.severity),
        message: { text: fd.message },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: relative(ROOT, f.path).replace(/\\/g, '/') },
            region: fd.position ? { startLine: 1 } : undefined
          },
          logicalLocations: fd.nodeName ? [{ name: fd.nodeName, kind: 'object' }] : undefined
        }],
        properties: {
          confidence: fd.confidence,
          iso25010: fd.iso25010, atam: fd.atamScenarios, adr: fd.adr,
          evidence: fd.evidence
        }
      });
    }
  }
  return JSON.stringify({
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: { driver: {
        name: TOOL, version: VERSION,
        informationUri: 'https://github.com/elianhgs/n8n-microframework',
        rules
      }},
      results
    }]
  }, null, 2);
}

function severityToSarif(s) {
  return s === 'error' ? 'error' : s === 'info' ? 'note' : 'warning';
}

/* ============================================================================
 *  SECCIÓN 13 — Renderer JUnit
 * ========================================================================= */

function renderJunit(report) {
  const testsuites = [];
  for (const f of report.files) {
    const rel = relative(ROOT, f.path).replace(/\\/g, '/');
    const cases = REGLAS.map(r => {
      const ff = f.findings.filter(x => x.ruleId === r.id);
      if (ff.length === 0) {
        const applies = (f.rulesApplicable || []).includes(r.id);
        return applies
          ? `    <testcase classname="${escXml(rel)}" name="${r.id}"/>`
          : `    <testcase classname="${escXml(rel)}" name="${r.id}"><skipped/></testcase>`;
      }
      const msg = ff.map(x => `${x.severity}: ${x.message}`).join(' | ');
      return `    <testcase classname="${escXml(rel)}" name="${r.id}"><failure message="${escXml(msg)}">${escXml(ff.map(x=>x.evidence||'').join('\n'))}</failure></testcase>`;
    });
    testsuites.push(`  <testsuite name="${escXml(rel)}" tests="${REGLAS.length}" failures="${f.findings.length}">\n${cases.join('\n')}\n  </testsuite>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n${testsuites.join('\n')}\n</testsuites>\n`;
}

function escXml(s) {
  return String(s).replace(/[<>&"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'
  })[c]);
}

/* ============================================================================
 *  SECCIÓN 14 — Renderer HTML offline autocontenido
 *
 *  Render del grafo: SVG construido a partir de node.position. Sin Mermaid.
 *  Radar ISO 25010: SVG polígono. Sin Chart.js.
 *  Sparkline histórico: SVG polyline. Sin librerías externas.
 *  Estilo: CSS inline custom (~6 KB). Sin Tailwind.
 *  Interactividad: vanilla JS (~8 KB). Sin frameworks.
 *
 *  Resultado: un solo .html, ~80–200 KB según volumen de findings, abre offline,
 *  imprimible como anexo del documento de tesis.
 * ========================================================================= */

const INLINE_CSS = `
:root{
  --bg:#0f172a;--bg2:#1e293b;--panel:#0b1220;--text:#e2e8f0;--mut:#94a3b8;
  --acc:#38bdf8;--ok:#22c55e;--warn:#fbbf24;--err:#ef4444;--info:#a78bfa;
  --e1:#3b82f6;--e2:#10b981;--e3:#f59e0b;--e4:#a855f7;--unk:#64748b;
  --border:#1e293b;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  font-size:14px;line-height:1.5}
.container{max-width:1280px;margin:0 auto;padding:24px}
.card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;
  padding:20px;margin:16px 0;box-shadow:0 1px 2px rgba(0,0,0,.2)}
h1{font-size:28px;margin:0 0 8px;letter-spacing:-.02em}
h2{font-size:20px;margin:24px 0 12px;color:var(--acc)}
h3{font-size:16px;margin:16px 0 8px}
.muted{color:var(--mut)}
.cover{background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid var(--border);
  border-radius:16px;padding:36px;margin-bottom:20px}
.cover h1{font-size:34px}
.cover .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:24px}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.kpi{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:14px}
.kpi .label{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.05em}
.kpi .value{font-size:28px;font-weight:700;margin-top:4px}
.kpi.err .value{color:var(--err)} .kpi.warn .value{color:var(--warn)} .kpi.ok .value{color:var(--ok)}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;
  margin-right:6px;border:1px solid currentColor}
.badge.err{color:var(--err)} .badge.warn{color:var(--warn)} .badge.info{color:var(--info)}
.badge.e1{color:var(--e1)} .badge.e2{color:var(--e2)} .badge.e3{color:var(--e3)} .badge.e4{color:var(--e4)}
.badge.unk{color:var(--unk)}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid var(--border)}
th{background:var(--panel);color:var(--mut);font-weight:600;cursor:pointer;user-select:none}
tr:hover{background:rgba(56,189,248,.04)}
.controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.controls input,.controls select{background:var(--panel);color:var(--text);
  border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:13px}
.controls button{background:var(--acc);color:#0f172a;border:0;border-radius:6px;
  padding:6px 12px;font-weight:600;cursor:pointer}
.finding{background:var(--panel);border-left:3px solid var(--mut);
  padding:10px 12px;margin:8px 0;border-radius:6px}
.finding.error{border-left-color:var(--err)}
.finding.warning{border-left-color:var(--warn)}
.finding.info{border-left-color:var(--info)}
.finding h4{margin:0 0 4px;font-size:14px}
.finding pre{background:#020617;color:#bae6fd;padding:8px;border-radius:6px;
  font-size:12px;overflow-x:auto;margin:6px 0}
.flow-svg{background:var(--panel);border-radius:8px;border:1px solid var(--border);
  display:block;max-width:100%;height:auto}
.node-e1{fill:var(--e1)} .node-e2{fill:var(--e2)} .node-e3{fill:var(--e3)}
.node-e4{fill:var(--e4)} .node-unk{fill:var(--unk)}
.node-hot{stroke:var(--err);stroke-width:3px}
.node-warn{stroke:var(--warn);stroke-width:2px}
.edge{stroke:#475569;stroke-width:1.5px;fill:none;marker-end:url(#arrow)}
.edge.error{stroke:var(--err);stroke-dasharray:4 4}
.node-label{font-size:10px;fill:var(--text);pointer-events:none}
details{margin:8px 0} summary{cursor:pointer;font-weight:600;color:var(--acc)}
.tag{display:inline-block;background:var(--panel);border:1px solid var(--border);
  border-radius:4px;padding:1px 6px;font-size:11px;margin:2px 4px 2px 0;color:var(--mut)}
.legend{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0;font-size:12px;color:var(--mut)}
.legend .sw{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:middle}
@media print{
  body{background:#fff;color:#000}
  .card,.cover,.kpi{background:#fff!important;border:1px solid #ccc!important;color:#000!important;box-shadow:none}
  h1,h2{color:#000} .muted,.kpi .label{color:#444}
  .flow-svg{background:#fff;border:1px solid #ccc}
}
`;

const INLINE_JS = `
(function(){
  const D = window.__DATA__;
  if(!D) return;

  function el(t,a,c){const e=document.createElement(t);if(a)for(const k in a){
    if(k==='cls')e.className=a[k];else if(k==='html')e.innerHTML=a[k];else e.setAttribute(k,a[k]);}
    if(c)for(const x of c)e.appendChild(typeof x==='string'?document.createTextNode(x):x);return e;}

  // ---- Render flujo: SVG con posiciones n8n ----
  window.renderFlow=function(file,svgId){
    const svg=document.getElementById(svgId); if(!svg)return;
    const nodes=file.graph.nodes;
    if(nodes.length===0){svg.innerHTML='<text x="20" y="40" fill="#94a3b8">(sin nodos)</text>';return;}
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const n of nodes){const [x,y]=n.position||[0,0];
      if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;}
    const padX=80,padY=60;
    const w=Math.max(600,maxX-minX+padX*2);
    const h=Math.max(280,maxY-minY+padY*2);
    svg.setAttribute('viewBox','0 0 '+w+' '+h);
    const findingsByNode={};
    for(const f of file.findings){
      if(!f.nodeId)continue;
      (findingsByNode[f.nodeId]=findingsByNode[f.nodeId]||[]).push(f);
    }
    const nodeById={};
    for(const n of nodes)nodeById[n.id]=n;
    let html='<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#475569"/></marker></defs>';
    for(const e of file.graph.edges){
      const a=nodeById[e.from],b=nodeById[e.to];if(!a||!b)continue;
      const ax=(a.position[0]-minX)+padX+50,ay=(a.position[1]-minY)+padY+20;
      const bx=(b.position[0]-minX)+padX,by=(b.position[1]-minY)+padY+20;
      const mx=(ax+bx)/2;
      html+='<path class="edge'+(e.branch==='error'?' error':'')+'" d="M'+ax+','+ay+' C'+mx+','+ay+' '+mx+','+by+' '+bx+','+by+'"/>';
    }
    for(const n of nodes){
      const x=(n.position[0]-minX)+padX,y=(n.position[1]-minY)+padY;
      const fnds=findingsByNode[n.id]||[];
      const hot=fnds.some(f=>f.severity==='error');
      const warn=fnds.some(f=>f.severity==='warning');
      const cls='node-'+n.stage.toLowerCase()+(hot?' node-hot':warn?' node-warn':'');
      html+='<g class="node" data-id="'+n.id+'" style="cursor:pointer">';
      html+='<rect class="'+cls+'" x="'+x+'" y="'+y+'" width="100" height="40" rx="6"/>';
      html+='<text class="node-label" x="'+(x+50)+'" y="'+(y+18)+'" text-anchor="middle">'+escapeHtml(n.name.slice(0,16))+'</text>';
      html+='<text class="node-label" x="'+(x+50)+'" y="'+(y+32)+'" text-anchor="middle" opacity="0.7">'+n.stage+(fnds.length?' · '+fnds.length:'')+'</text>';
      html+='</g>';
    }
    svg.innerHTML=html;
    svg.querySelectorAll('g.node').forEach(g=>{
      g.addEventListener('click',()=>{
        const id=g.getAttribute('data-id');
        const panel=document.getElementById('panel-'+file._idx);
        if(!panel)return;
        const fnds=findingsByNode[id]||[];
        const n=nodeById[id];
        panel.innerHTML='<h3>'+escapeHtml(n.name)+' <span class="badge '+n.stage.toLowerCase()+'">'+n.stage+'</span></h3>'+
          '<p class="muted">'+escapeHtml(n.type)+'</p>'+
          (fnds.length===0?'<p class="muted">Sin findings en este nodo.</p>':
            fnds.map(renderFindingCard).join(''));
      });
    });
  };

  function renderFindingCard(f){
    const tags=(arr,cls)=>arr&&arr.length?arr.map(t=>'<span class="tag">'+escapeHtml(t)+'</span>').join(''):'';
    return '<div class="finding '+f.severity+'"><h4><span class="badge '+severityClass(f.severity)+'">'+f.severity+'</span> '+escapeHtml(f.ruleId)+' — '+escapeHtml(f.ruleName)+'</h4>'+
      '<p>'+escapeHtml(f.message)+'</p>'+
      (f.evidence?'<pre>'+escapeHtml(f.evidence)+'</pre>':'')+
      (f.iso25010&&f.iso25010.length?'<p>ISO 25010: '+tags(f.iso25010)+'</p>':'')+
      (f.atamScenarios&&f.atamScenarios.length?'<p>ATAM: '+tags(f.atamScenarios)+'</p>':'')+
      (f.adr&&f.adr.length?'<p>ADR: '+tags(f.adr)+'</p>':'')+
      (f.fixSuggestion&&f.fixSuggestion.preview?'<p><strong>Fix:</strong> '+escapeHtml(f.fixSuggestion.preview)+'</p>':'')+
      '</div>';
  }
  function severityClass(s){return s==='error'?'err':s==='warning'?'warn':'info';}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);}

  // ---- Filtro tabla de findings ----
  window.initTableFilter=function(tableId){
    const tbl=document.getElementById(tableId); if(!tbl)return;
    const q=document.getElementById(tableId+'-q');
    const sev=document.getElementById(tableId+'-sev');
    function apply(){
      const text=(q.value||'').toLowerCase();
      const s=sev.value;
      tbl.querySelectorAll('tbody tr').forEach(tr=>{
        const ok=(!text||tr.textContent.toLowerCase().includes(text))&&
                 (!s||tr.getAttribute('data-sev')===s);
        tr.style.display=ok?'':'none';
      });
    }
    q.addEventListener('input',apply); sev.addEventListener('change',apply);
    // export CSV
    const btn=document.getElementById(tableId+'-csv');
    if(btn)btn.addEventListener('click',()=>{
      const rows=[];
      tbl.querySelectorAll('tr').forEach(tr=>{
        if(tr.style.display==='none')return;
        const cells=[];tr.querySelectorAll('th,td').forEach(c=>cells.push('"'+c.textContent.replace(/"/g,'""')+'"'));
        rows.push(cells.join(','));
      });
      const blob=new Blob([rows.join('\\n')],{type:'text/csv'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);
      a.download='findings.csv';a.click();
    });
  };

  // ---- Auto-render de cada flujo cargado ----
  document.addEventListener('DOMContentLoaded',()=>{
    (D.files||[]).forEach((f,i)=>{f._idx=i;window.renderFlow(f,'svg-'+i);});
    window.initTableFilter('tbl-findings');
  });
})();
`;

function renderHtml(report) {
  const totalFindings = report.files.reduce((a, f) => a + f.findings.length, 0);
  const totalErr = report.files.reduce((a, f) => a + f.summary.errors, 0);
  const totalWarn = report.files.reduce((a, f) => a + f.summary.warnings, 0);
  const avgScore = report.files.length === 0 ? 100
    : Math.round(report.files.reduce((a, f) => a + f.summary.score, 0) / report.files.length);

  const allFindings = [];
  for (const f of report.files) {
    for (const fd of f.findings) {
      allFindings.push({ ...fd, _file: relative(ROOT, f.path).replace(/\\/g, '/') });
    }
  }

  // Radar ISO 25010 — usa promedio de score por atributo
  const radarSvg = renderRadarSvg(allFindings, report.files);
  const sparkSvg = renderSparkSvg(report.history);
  const coverageSvg = renderCoverageBar(report.coverage);

  const fileSections = report.files.map((f, i) => fileSection(f, i)).join('\n');
  const findingsRows = allFindings.map(fd => {
    const sev = fd.severity;
    return `<tr data-sev="${sev}">
      <td><span class="badge ${sev === 'error' ? 'err' : sev === 'warning' ? 'warn' : 'info'}">${sev}</span></td>
      <td>${escHtml(fd.ruleId)}</td>
      <td>${escHtml(fd.ruleName || '')}</td>
      <td><code style="font-size:11px">${escHtml(fd._file)}</code></td>
      <td>${escHtml(fd.nodeName || '–')}</td>
      <td>${escHtml(fd.message)}</td>
      <td>${(fd.iso25010 || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}</td>
      <td>${(fd.atamScenarios || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}</td>
    </tr>`;
  }).join('\n');

  const dataJson = JSON.stringify(report).replace(/<\/script>/g, '<\\/script>');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Reporte de validación — micro-framework n8n</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${INLINE_CSS}</style>
</head>
<body>
<div class="container">

  <div class="cover">
    <h1>Validación estática de flujos n8n</h1>
    <p class="muted">Micro-framework LC/NC · Pilar 2 DevSecOps · Edición Lite v${VERSION}</p>
    <div class="meta">
      <div><strong>Autor:</strong><br/>${escHtml(report.author)}</div>
      <div><strong>Director:</strong><br/>${escHtml(report.director)}</div>
      <div><strong>Proyecto:</strong><br/>${escHtml(report.project)}</div>
      <div><strong>Generado:</strong><br/>${escHtml(report.generatedAt)}</div>
      ${report.commit ? `<div><strong>Commit:</strong><br/><code>${escHtml(report.commit.slice(0,12))}</code></div>` : ''}
      <div><strong>Flujos analizados:</strong><br/>${report.files.length}</div>
    </div>
  </div>

  <div class="card">
    <h2>Resumen ejecutivo</h2>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Flujos</div><div class="value">${report.files.length}</div></div>
      <div class="kpi ${avgScore >= 90 ? 'ok' : avgScore >= 70 ? 'warn' : 'err'}"><div class="label">Score promedio</div><div class="value">${avgScore}%</div></div>
      <div class="kpi err"><div class="label">Errors</div><div class="value">${totalErr}</div></div>
      <div class="kpi warn"><div class="label">Warnings</div><div class="value">${totalWarn}</div></div>
      <div class="kpi"><div class="label">Findings totales</div><div class="value">${totalFindings}</div></div>
      <div class="kpi"><div class="label">Reglas dormidas</div><div class="value">${report.coverage.rulesDormant.length}</div></div>
    </div>
  </div>

  <div class="card">
    <h2>Radar ISO/IEC 25010</h2>
    <p class="muted">Findings agregados por atributo de calidad — más cerca del centro indica menos hallazgos (mejor).</p>
    ${radarSvg}
  </div>

  <div class="card">
    <h2>Cobertura del micro-framework</h2>
    <p class="muted">Reglas definidas: ${report.coverage.rulesDefined.length} · ejercitadas: ${report.coverage.rulesExercised.length} · dormidas: ${report.coverage.rulesDormant.length}</p>
    ${coverageSvg}
    ${report.coverage.rulesDormant.length > 0
      ? `<p>⚠️ Reglas que ningún flujo del corpus activó: ${report.coverage.rulesDormant.map(r => `<span class="tag">${r}</span>`).join(' ')}</p>`
      : '<p style="color:var(--ok)">✓ Todas las reglas fueron ejercitadas por al menos un flujo.</p>'}
  </div>

  ${report.history.length > 1 ? `<div class="card">
    <h2>Evolución histórica</h2>
    <p class="muted">Score promedio por fecha — leído desde reportes JSON previos en <code>reportes/</code>.</p>
    ${sparkSvg}
  </div>` : ''}

  <div class="card">
    <h2>Tabla de findings</h2>
    <div class="controls">
      <input id="tbl-findings-q" placeholder="Buscar texto…" style="flex:1;min-width:200px"/>
      <select id="tbl-findings-sev">
        <option value="">Todas las severidades</option>
        <option value="error">Solo errors</option>
        <option value="warning">Solo warnings</option>
        <option value="info">Solo infos</option>
      </select>
      <button id="tbl-findings-csv">Export CSV</button>
    </div>
    <table id="tbl-findings">
      <thead><tr>
        <th>Sev</th><th>Regla</th><th>Nombre</th><th>Archivo</th><th>Nodo</th><th>Mensaje</th><th>ISO 25010</th><th>ATAM</th>
      </tr></thead>
      <tbody>
        ${findingsRows || '<tr><td colspan="8" class="muted">Sin findings.</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>Detalle por flujo</h2>
    <div class="legend">
      <span><span class="sw" style="background:var(--e1)"></span>E1 Entrada</span>
      <span><span class="sw" style="background:var(--e2)"></span>E2 Dominio</span>
      <span><span class="sw" style="background:var(--e3)"></span>E3 IO</span>
      <span><span class="sw" style="background:var(--e4)"></span>E4 Salida</span>
      <span><span class="sw" style="background:var(--unk)"></span>UNKNOWN</span>
      <span style="margin-left:16px">borde rojo = nodo con finding error · borde ámbar = warning</span>
    </div>
    ${fileSections}
  </div>

  <div class="card">
    <h2>Acerca de este reporte</h2>
    <p class="muted">Generado por <code>${TOOL} v${VERSION}</code> (edición Lite) — un único archivo .mjs sin dependencias externas. Este HTML es autocontenido: no requiere red para renderizar.</p>
    <p class="muted">Comando: <code>node microframework/validacion/validar-flujos.mjs --format html</code></p>
  </div>

</div>
<script>window.__DATA__=${dataJson};</script>
<script>${INLINE_JS}</script>
</body></html>`;
}

function fileSection(f, idx) {
  const rel = relative(ROOT, f.path).replace(/\\/g, '/');
  const sd = f.metrics.stageDistribution;
  return `<details ${f.summary.errors > 0 ? 'open' : ''}>
    <summary>${escHtml(rel)} · <span class="badge ${f.summary.score >= 90 ? 'info' : f.summary.score >= 70 ? 'warn' : 'err'}">${f.summary.score}%</span>
      · err=${f.summary.errors} warn=${f.summary.warnings} info=${f.summary.infos}
      · nodos=${f.metrics.nodeCount} ciclomática=${f.metrics.cyclomaticComplexity} cohesion=${f.metrics.cohesionScore}</summary>
    <p class="muted">Etapas: <span class="badge e1">E1·${sd.E1}</span><span class="badge e2">E2·${sd.E2}</span><span class="badge e3">E3·${sd.E3}</span><span class="badge e4">E4·${sd.E4}</span><span class="badge unk">UNK·${sd.UNKNOWN}</span></p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><svg id="svg-${idx}" class="flow-svg" width="100%" height="360"></svg></div>
      <div id="panel-${idx}" class="finding info" style="border-left-color:var(--acc)">
        <p class="muted">Click en un nodo del diagrama para ver sus findings, ISO 25010 y ATAM.</p>
      </div>
    </div>
    ${f.findings.length === 0 ? '<p style="color:var(--ok)">✓ Sin findings.</p>' :
      `<h4>Todos los findings de este flujo</h4>${f.findings.map(fd => `
      <div class="finding ${fd.severity}">
        <strong>${escHtml(fd.ruleId)}</strong> — ${escHtml(fd.ruleName || '')}
        ${fd.nodeName ? `<span class="muted"> @ ${escHtml(fd.nodeName)}</span>` : ''}<br/>
        ${escHtml(fd.message)}
        ${fd.evidence ? `<pre>${escHtml(fd.evidence)}</pre>` : ''}
        ${fd.fixSuggestion?.preview ? `<p><strong>Fix:</strong> ${escHtml(fd.fixSuggestion.preview)}</p>` : ''}
      </div>`).join('')}`}
  </details>`;
}

function renderRadarSvg(allFindings, files) {
  const attrs = ['security','reliability','maintainability','performanceEfficiency','functionalSuitability','usability'];
  const counts = {};
  for (const a of attrs) counts[a] = 0;
  for (const f of allFindings) for (const a of (f.iso25010 || [])) if (counts[a] !== undefined) counts[a]++;
  const maxC = Math.max(1, ...Object.values(counts));
  const cx = 240, cy = 200, R = 150;
  const n = attrs.length;
  const points = attrs.map((a, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (counts[a] / maxC) * R;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r,
      lx: cx + Math.cos(angle) * (R + 30), ly: cy + Math.sin(angle) * (R + 30),
      label: a, count: counts[a] };
  });
  const grid = [0.25, 0.5, 0.75, 1].map(k => {
    const pts = attrs.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return `${cx + Math.cos(angle) * R * k},${cy + Math.sin(angle) * R * k}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="#334155" stroke-dasharray="2 2"/>`;
  }).join('');
  const polyPts = points.map(p => `${p.x},${p.y}`).join(' ');
  const axes = points.map(p =>
    `<line x1="${cx}" y1="${cy}" x2="${cx + (p.lx - cx) * 0.85}" y2="${cy + (p.ly - cy) * 0.85}" stroke="#334155"/>`).join('');
  const labels = points.map(p =>
    `<text x="${p.lx}" y="${p.ly}" text-anchor="middle" fill="#94a3b8" font-size="11">${p.label} (${p.count})</text>`).join('');
  return `<svg viewBox="0 0 480 420" style="max-width:480px;width:100%;height:auto;background:var(--panel);border-radius:8px;padding:10px">
    ${grid}${axes}
    <polygon points="${polyPts}" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="2"/>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#38bdf8"/>`).join('')}
    ${labels}
  </svg>`;
}

function renderSparkSvg(history) {
  if (!history || history.length === 0) return '<p class="muted">Sin reportes previos.</p>';
  const W = 800, H = 160, pad = 30;
  const minS = 0, maxS = 100;
  const step = (W - pad * 2) / Math.max(1, history.length - 1);
  const pts = history.map((h, i) => {
    const x = pad + i * step;
    const y = H - pad - ((h.score - minS) / (maxS - minS)) * (H - pad * 2);
    return { x, y, h };
  });
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const dots = pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#38bdf8"><title>${p.h.date}: ${p.h.score}%</title></circle>`).join('');
  const labels = pts.map(p => `<text x="${p.x}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#94a3b8">${p.h.date.slice(5)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;background:var(--panel);border-radius:8px">
    <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="#334155"/>
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H-pad}" stroke="#334155"/>
    <text x="6" y="${pad+4}" font-size="10" fill="#94a3b8">100%</text>
    <text x="6" y="${H-pad+4}" font-size="10" fill="#94a3b8">0%</text>
    <path d="${path}" fill="none" stroke="#38bdf8" stroke-width="2"/>
    ${dots}${labels}
  </svg>`;
}

function renderCoverageBar(coverage) {
  const total = coverage.rulesDefined.length;
  const exer = coverage.rulesExercised.length;
  const pct = total === 0 ? 0 : Math.round((exer / total) * 100);
  return `<div style="background:var(--panel);border-radius:8px;padding:8px;border:1px solid var(--border)">
    <div style="background:#020617;border-radius:4px;height:20px;overflow:hidden">
      <div style="background:linear-gradient(90deg,#22c55e,#38bdf8);height:100%;width:${pct}%"></div>
    </div>
    <div style="margin-top:6px;font-size:12px;color:var(--mut)">${exer}/${total} reglas ejercitadas (${pct}%)</div>
  </div>`;
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}

/* ============================================================================
 *  SECCIÓN 15 — Diff contra baseline
 * ========================================================================= */

function diffReports(current, baseline) {
  const cFindings = flatten(current);
  const bFindings = flatten(baseline);
  const key = f => `${f._file}::${f.ruleId}::${f.nodeName || ''}::${f.message}`;
  const cMap = new Map(cFindings.map(f => [key(f), f]));
  const bMap = new Map(bFindings.map(f => [key(f), f]));
  const nuevos = cFindings.filter(f => !bMap.has(key(f)));
  const resueltos = bFindings.filter(f => !cMap.has(key(f)));
  // Regresiones: regla que estaba en baseline como passed pero ahora tiene findings nuevos
  const regresiones = nuevos.filter(f => {
    const bFile = (baseline.files || []).find(x => relative(ROOT, x.path).replace(/\\/g,'/') === f._file);
    if (!bFile) return false;
    return (bFile.rulesPassed || []).includes(f.ruleId);
  });
  return { nuevos, resueltos, regresiones };
}

function flatten(report) {
  const out = [];
  for (const f of (report.files || [])) {
    const rel = relative(ROOT, f.path).replace(/\\/g, '/');
    for (const fd of f.findings) out.push({ ...fd, _file: rel });
  }
  return out;
}

function renderDiffMd(diff) {
  const L = [];
  L.push('## Diff contra baseline');
  L.push('');
  L.push(`- 🆕 Nuevos: ${diff.nuevos.length}`);
  L.push(`- ✅ Resueltos: ${diff.resueltos.length}`);
  L.push(`- 🔴 Regresiones: ${diff.regresiones.length}`);
  L.push('');
  for (const tag of [['🆕 Nuevos', 'nuevos'], ['✅ Resueltos', 'resueltos'], ['🔴 Regresiones', 'regresiones']]) {
    if (diff[tag[1]].length === 0) continue;
    L.push(`### ${tag[0]}`);
    for (const f of diff[tag[1]]) {
      L.push(`- ${f.ruleId} · ${f._file} · ${f.nodeName || ''} · ${f.message}`);
    }
    L.push('');
  }
  return L.join('\n');
}

/* ============================================================================
 *  SECCIÓN 16 — Main
 * ========================================================================= */

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); process.exit(0); }

  const files = discoverFiles(args);
  if (files.length === 0) {
    console.error('No se encontraron archivos JSON para analizar.');
    process.exit(0);
  }
  const report = buildReport(files, 'lite');

  // Diff opcional
  let diffText = '';
  if (args.baseline) {
    if (!existsSync(args.baseline)) {
      console.error(`Baseline no existe: ${args.baseline}`);
    } else {
      try {
        const base = JSON.parse(readFileSync(args.baseline, 'utf8'));
        const diff = diffReports(report, base);
        diffText = '\n\n' + renderDiffMd(diff);
        report.diff = diff;
      } catch (e) {
        console.error(`Error leyendo baseline: ${e.message}`);
      }
    }
  }

  const outDir = args.out ? resolve(args.out) : join(HERE, 'reportes');
  mkdirSync(outDir, { recursive: true });
  const _date = new Date().toISOString().slice(0, 10);
  const stamp = args.estado ? `${_date}-${args.estado}` : _date;

  let stdoutPayload = '';
  switch (args.format) {
    case 'json': {
      const json = JSON.stringify(report, null, 2);
      stdoutPayload = json;
      writeFileSync(join(outDir, `validacion-${stamp}.json`), json, 'utf8');
      break;
    }
    case 'sarif': {
      const sar = renderSarif(report);
      stdoutPayload = sar;
      writeFileSync(join(outDir, `validacion-${stamp}.sarif`), sar, 'utf8');
      break;
    }
    case 'junit': {
      const xml = renderJunit(report);
      stdoutPayload = xml;
      writeFileSync(join(outDir, `validacion-${stamp}.xml`), xml, 'utf8');
      break;
    }
    case 'html': {
      const html = renderHtml(report);
      const target = join(outDir, `validacion-${stamp}.html`);
      writeFileSync(target, html, 'utf8');
      // Además, escribir el JSON canónico para alimentar histórico
      writeFileSync(join(outDir, `validacion-${stamp}.json`), JSON.stringify(report, null, 2), 'utf8');
      stdoutPayload = `Reporte HTML escrito en: ${relative(ROOT, target).replace(/\\/g,'/')}`;
      break;
    }
    case 'md':
    default: {
      const md = renderMd(report) + diffText;
      stdoutPayload = md;
      writeFileSync(join(outDir, `validacion-${stamp}.md`), md, 'utf8');
      // JSON canónico siempre, para baseline y histórico
      writeFileSync(join(outDir, `validacion-${stamp}.json`), JSON.stringify(report, null, 2), 'utf8');
    }
  }

  if (!args.quiet) console.log(stdoutPayload);

  // Exit code
  const tobeFiles = report.files.filter(f => f.estado === 'to-be');
  const hasError = tobeFiles.some(f => f.summary.errors > 0);
  const hasWarn = tobeFiles.some(f => f.summary.warnings > 0);
  process.exit((hasError || (args.strict && hasWarn)) ? 1 : 0);
}

main();
