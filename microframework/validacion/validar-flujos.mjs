#!/usr/bin/env node
// Validación estática de flujos n8n — REG-001 a REG-010
// Ver especificación en microframework/reglas/reglas-obligatorias.md
//
// Uso:
//   node microframework/validacion/validar-flujos.mjs
//   node microframework/validacion/validar-flujos.mjs --caso bot --estado to-be
//   node microframework/validacion/validar-flujos.mjs --format json
//
// Sin dependencias externas. Node >= 18.

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), '..', '..');

const args = parseArgs(process.argv.slice(2));

// ----------------------- CLI -----------------------

function parseArgs(argv) {
  const out = { caso: null, estado: null, format: 'md' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--caso') out.caso = argv[++i];
    else if (a === '--estado') out.estado = argv[++i];
    else if (a === '--format') out.format = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Uso: node validar-flujos.mjs [--caso bot|iot] [--estado as-is|to-be] [--format md|json]');
      process.exit(0);
    }
  }
  return out;
}

// ----------------------- Recolección de archivos -----------------------

function listJsonFlows() {
  const files = [];
  const casosDir = join(ROOT, 'casos-de-estudio');
  if (existsSync(casosDir)) {
    for (const caso of readdirSync(casosDir)) {
      if (args.caso && caso !== args.caso) continue;
      const casoDir = join(casosDir, caso);
      if (!statSync(casoDir).isDirectory()) continue;
      for (const estado of ['as-is', 'to-be']) {
        if (args.estado && estado !== args.estado) continue;
        const estadoDir = join(casoDir, estado);
        if (!existsSync(estadoDir)) continue;
        for (const f of readdirSync(estadoDir)) {
          if (f.endsWith('.json')) files.push({ path: join(estadoDir, f), caso, estado });
        }
      }
    }
  }
  const plantDir = join(ROOT, 'microframework', 'plantillas');
  if (existsSync(plantDir) && !args.caso) {
    for (const f of readdirSync(plantDir)) {
      if (f.endsWith('.json')) files.push({ path: join(plantDir, f), caso: 'plantilla', estado: 'to-be' });
    }
  }
  return files;
}

// ----------------------- Utilidades de nodos -----------------------

function parseFlow(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return { __error: e.message };
  }
}

function nodesOfType(flow, typeSuffix) {
  if (!flow?.nodes) return [];
  return flow.nodes.filter(n => (n.type || '').toLowerCase().endsWith(typeSuffix.toLowerCase()));
}

function allCodeText(flow) {
  if (!flow?.nodes) return '';
  return flow.nodes
    .filter(n => (n.type || '').includes('code') || (n.type || '').includes('function'))
    .map(n => JSON.stringify(n.parameters || {}))
    .join('\n');
}

function stringifyAllValues(obj) {
  return JSON.stringify(obj);
}

// ----------------------- Predicados REG-* -----------------------

// Patrones de detección de secretos literales en flujos n8n.
// Casos cubiertos (ejemplos reales detectados en casos-de-estudio/bot/as-is/bot-as-is.json):
//  · nodo 6 "Validar Token":    "rightValue": "mi-token-secreto-hardcodeado-123"
//  · nodo 8 "Consultar Historial": header { "name": "x-api-key", "value": "literal" }
//  · nodo 9 "Procesar Mensaje":  const api_source_token = "..." dentro de jsCode
//  · nodos 12, 14:               headers x-api-key hardcodeados
const REG_SECRETS_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._\-]{8,}/i,
  /sk-[A-Za-z0-9]{16,}/,
  /ghp_[A-Za-z0-9]{16,}/,
  /"(password|api_key|apikey|secret|token)"\s*:\s*"[^{}="]{6,}"/i,
  // Comparaciones literales en nodos IF/Switch: "rightValue": "<literal largo>"
  /"rightValue"\s*:\s*"[A-Za-z0-9._\-]{12,}"/,
  // Headers HTTP con API key literal: pares { name: "x-api-key", value: "<literal>" }
  /"name"\s*:\s*"(x-api-key|authorization|api-key|x-auth-token)"[\s\S]{1,120}?"value"\s*:\s*"[^{]{8,}"/i,
  // Asignaciones literales a variables tipo token/key/secret/password dentro de nodos Code
  /\b(const|let|var)\s+\w*(token|api[_-]?key|secret|password)\w*\s*=\s*["'][^"'{}$]{8,}["']/i
];

function regSecrets(flow) {
  if (!flow?.nodes) return { cumple: null, evidencia: 'sin nodos' };
  for (const n of flow.nodes) {
    const s = stringifyAllValues(n.parameters || {});
    for (const pat of REG_SECRETS_PATTERNS) {
      const m = s.match(pat);
      if (m) return { cumple: false, evidencia: `nodo "${n.name}": patrón ${pat}` };
    }
  }
  return { cumple: true, evidencia: 'sin patrones de secretos literales' };
}

function regRunId(flow, file) {
  const text = allCodeText(flow);
  if (!text.includes('run_id')) return { cumple: false, evidencia: 'no se referencia run_id en nodos Code' };
  if (!/console\.log\s*\(\s*JSON\.stringify/.test(text)) {
    return { cumple: false, evidencia: 'no hay console.log(JSON.stringify(...)) con run_id' };
  }
  return { cumple: true, evidencia: 'run_id presente en nodos Code y en log' };
}

function regErrorWorkflow(flow, file) {
  const isOrquestador = /orquestador/i.test(basename(file.path));
  if (!isOrquestador) return { cumple: null, evidencia: 'N/A (no es orquestador)' };
  const s = flow?.settings?.errorWorkflow;
  if (s && String(s).trim().length > 0) return { cumple: true, evidencia: `settings.errorWorkflow="${s}"` };
  return { cumple: false, evidencia: 'settings.errorWorkflow ausente o vacío' };
}

function regRetry(flow) {
  const http = nodesOfType(flow, 'httpRequest');
  if (http.length === 0) return { cumple: null, evidencia: 'sin nodos HTTP' };
  for (const n of http) {
    const retry = n?.parameters?.options?.retry;
    if (!retry?.enabled) return { cumple: false, evidencia: `nodo "${n.name}" sin retry.enabled` };
    const max = retry.maxRetries ?? retry.maxTries ?? 0;
    if (max < 2) return { cumple: false, evidencia: `nodo "${n.name}" maxRetries=${max} (<2)` };
  }
  return { cumple: true, evidencia: `${http.length} nodo(s) HTTP con retry >=2` };
}

function regIdempotencia(flow) {
  const pg = nodesOfType(flow, 'postgres');
  if (pg.length === 0) return { cumple: null, evidencia: 'sin nodos Postgres' };
  for (const n of pg) {
    const q = JSON.stringify(n.parameters || {}).toLowerCase();
    const isWrite = q.includes('"insert"') || q.includes('insert into') || q.includes('"operation":"insert"');
    if (!isWrite) continue;
    const hasOnConflict = /on\s+conflict/.test(q);
    const hasIdempotencyKey = /idempotency_key/.test(q);
    if (!hasOnConflict && !hasIdempotencyKey) {
      return { cumple: false, evidencia: `nodo "${n.name}" insert sin ON CONFLICT ni idempotency_key` };
    }
  }
  return { cumple: true, evidencia: 'escrituras con control de idempotencia' };
}

const LOG_FIELDS = ['run_id', 'etapa', 'status'];

function regLogEstructurado(flow) {
  const text = allCodeText(flow);
  if (!text) return { cumple: null, evidencia: 'sin nodos Code' };
  if (!/console\.log\s*\(\s*JSON\.stringify/.test(text)) {
    return { cumple: false, evidencia: 'no hay console.log(JSON.stringify(...))' };
  }
  const missing = LOG_FIELDS.filter(f => !text.includes(f));
  if (missing.length) return { cumple: false, evidencia: `faltan campos en log: ${missing.join(', ')}` };
  return { cumple: true, evidencia: 'log JSON con run_id, etapa, status' };
}

function regDominioAislado(flow, file) {
  if (!/-e2-dominio/i.test(basename(file.path))) return { cumple: null, evidencia: 'N/A (no es E2)' };
  const externos = [...nodesOfType(flow, 'httpRequest'), ...nodesOfType(flow, 'postgres')];
  if (externos.length > 0) {
    return { cumple: false, evidencia: `E2 contiene ${externos.length} nodo(s) de IO: ${externos.map(n => n.name).join(', ')}` };
  }
  return { cumple: true, evidencia: 'E2 sin IO externo' };
}

function regIntegracionesLugar(flow, file) {
  const name = basename(file.path);
  const esPermitido = /-e3-|-e4-|orquestador/i.test(name);
  const externos = [...nodesOfType(flow, 'httpRequest'), ...nodesOfType(flow, 'postgres')];
  if (externos.length === 0) return { cumple: null, evidencia: 'sin nodos IO' };
  if (!esPermitido) {
    return { cumple: false, evidencia: `IO presente en archivo no E3/E4/orquestador: ${externos.map(n => n.name).join(', ')}` };
  }
  return { cumple: true, evidencia: 'IO ubicado correctamente' };
}

function regStatusCodes(flow, file) {
  if (!/orquestador/i.test(basename(file.path))) return { cumple: null, evidencia: 'N/A (no orquestador)' };
  const responders = nodesOfType(flow, 'respondToWebhook');
  if (responders.length === 0) return { cumple: false, evidencia: 'orquestador sin Respond to Webhook' };
  const codes = new Set();
  for (const n of responders) {
    const c = n?.parameters?.responseCode ?? n?.parameters?.options?.responseCode;
    if (c !== undefined && c !== null) codes.add(String(c));
  }
  if (codes.size < 2) return { cumple: false, evidencia: `solo ${codes.size} responseCode distintos: [${[...codes].join(', ')}]` };
  return { cumple: true, evidencia: `responseCodes: ${[...codes].join(', ')}` };
}

function regAdrPresente(file) {
  if (file.caso === 'plantilla') return { cumple: null, evidencia: 'N/A (plantilla)' };
  const adrDir = join(ROOT, 'casos-de-estudio', file.caso, 'adr');
  if (!existsSync(adrDir)) return { cumple: false, evidencia: 'carpeta adr/ no existe' };
  const adrs = readdirSync(adrDir).filter(f => /^ADR-.*\.md$/.test(f));
  if (adrs.length === 0) return { cumple: false, evidencia: 'sin archivos ADR-*.md' };
  return { cumple: true, evidencia: `${adrs.length} ADR(s) presentes` };
}

// ----------------------- Evaluación -----------------------

const REGLAS = [
  { id: 'REG-001', nombre: 'Sin secretos hardcodeados', fn: (f) => regSecrets(f.flow) },
  { id: 'REG-002', nombre: 'run_id propagado', fn: (f) => regRunId(f.flow, f) },
  { id: 'REG-003', nombre: 'errorWorkflow configurado', fn: (f) => regErrorWorkflow(f.flow, f) },
  { id: 'REG-004', nombre: 'Retry en HTTP', fn: (f) => regRetry(f.flow) },
  { id: 'REG-005', nombre: 'Idempotencia en escrituras', fn: (f) => regIdempotencia(f.flow) },
  { id: 'REG-006', nombre: 'Log estructurado JSON', fn: (f) => regLogEstructurado(f.flow) },
  { id: 'REG-007', nombre: 'Dominio aislado', fn: (f) => regDominioAislado(f.flow, f) },
  { id: 'REG-008', nombre: 'Integraciones en E3/E4', fn: (f) => regIntegracionesLugar(f.flow, f) },
  { id: 'REG-009', nombre: 'HTTP status codes', fn: (f) => regStatusCodes(f.flow, f) },
  { id: 'REG-010', nombre: 'ADR presente', fn: (f) => regAdrPresente(f) }
];

function evaluarArchivo(file) {
  const flow = parseFlow(file.path);
  const ctx = { ...file, flow };
  if (flow.__error) {
    return { file, error: flow.__error, resultados: [] };
  }
  const resultados = REGLAS.map(r => ({
    id: r.id,
    nombre: r.nombre,
    ...r.fn(ctx)
  }));
  return { file, resultados };
}

function resumirArchivo(r) {
  const aplicables = r.resultados.filter(x => x.cumple !== null);
  const cumplen = aplicables.filter(x => x.cumple === true).length;
  const total = aplicables.length;
  const pct = total === 0 ? 100 : Math.round((cumplen / total) * 100);
  return { cumplen, total, pct };
}

// ----------------------- Salida -----------------------

function renderMd(evaluaciones) {
  const lines = [];
  lines.push('# Reporte de validación estática de flujos');
  lines.push('');
  lines.push(`Fecha: ${new Date().toISOString()}`);
  lines.push(`Archivos evaluados: ${evaluaciones.length}`);
  lines.push('');

  const porEstado = { 'as-is': [], 'to-be': [] };
  for (const e of evaluaciones) {
    const est = e.file.estado || 'to-be';
    (porEstado[est] = porEstado[est] || []).push(e);
  }

  for (const [estado, evs] of Object.entries(porEstado)) {
    if (evs.length === 0) continue;
    lines.push(`## Estado: ${estado}`);
    lines.push('');
    lines.push('| Archivo | Caso | % | Cumple / Aplica |');
    lines.push('|---|---|---|---|');
    for (const e of evs) {
      const s = resumirArchivo(e);
      lines.push(`| ${relative(ROOT, e.file.path).replace(/\\/g, '/')} | ${e.file.caso} | ${s.pct}% | ${s.cumplen}/${s.total} |`);
    }
    lines.push('');
  }

  lines.push('## Detalle por archivo');
  lines.push('');
  for (const e of evaluaciones) {
    lines.push(`### ${relative(ROOT, e.file.path).replace(/\\/g, '/')}`);
    if (e.error) {
      lines.push(`- ERROR al parsear: ${e.error}`);
      lines.push('');
      continue;
    }
    for (const r of e.resultados) {
      const icon = r.cumple === true ? '✓' : r.cumple === false ? '✗' : '–';
      lines.push(`- ${icon} **${r.id}** ${r.nombre}: ${r.evidencia}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function renderJson(evaluaciones) {
  return JSON.stringify(evaluaciones.map(e => ({
    archivo: relative(ROOT, e.file.path).replace(/\\/g, '/'),
    caso: e.file.caso,
    estado: e.file.estado,
    error: e.error || null,
    resumen: e.error ? null : resumirArchivo(e),
    resultados: e.resultados
  })), null, 2);
}

// ----------------------- Main -----------------------

function main() {
  const files = listJsonFlows();
  if (files.length === 0) {
    console.error('No se encontraron archivos JSON de flujos.');
    process.exit(0);
  }
  const evaluaciones = files.map(evaluarArchivo);

  let salida;
  if (args.format === 'json') {
    salida = renderJson(evaluaciones);
    console.log(salida);
  } else {
    salida = renderMd(evaluaciones);
    console.log(salida);
    const reportesDir = join(ROOT, 'microframework', 'validacion', 'reportes');
    mkdirSync(reportesDir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    writeFileSync(join(reportesDir, `validacion-${stamp}.md`), salida, 'utf8');
  }

  const tobe = evaluaciones.filter(e => e.file.estado === 'to-be' && !e.error);
  const algunFallo = tobe.some(e => e.resultados.some(r => r.cumple === false));
  process.exit(algunFallo ? 1 : 0);
}

main();
