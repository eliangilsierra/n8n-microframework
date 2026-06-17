// REG-004 retry, REG-005 idempotencia, REG-007 dominio aislado, REG-008 lugar IO, REG-009 status codes
import { basename } from 'node:path';
import { makeFinding, isOrquestadorFile, isErrorHandlerFile } from '../helpers.mjs';
import { isIoType } from '../../parser/classify-stage.mjs';

export const REG_004 = {
  id: 'REG-004',
  run({ graph }) {
    const https = graph.nodes.filter(n => /httprequest/i.test(n.type));
    if (https.length === 0) return { na: 'sin nodos HTTP' };
    const out = [];
    for (const n of https) {
      const r = n.parameters?.options?.retry;
      const enabled = r?.enabled === true;
      const max = Number(r?.maxRetries ?? r?.maxTries ?? 0);
      if (!enabled) out.push(makeFinding('REG-004', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: 'Nodo HTTP sin retry habilitado',
        fixSuggestion: { kind: 'codemod-id', codemodId: 'add-http-retry',
          preview: 'options.retry = { enabled: true, maxRetries: 3 }' }
      }));
      else if (max < 2) out.push(makeFinding('REG-004', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `maxRetries=${max} < 2`,
        fixSuggestion: { kind: 'codemod-id', codemodId: 'add-http-retry' } }));
    }
    return out;
  }
};

export const REG_005 = {
  id: 'REG-005',
  run({ graph, file }) {
    if (isErrorHandlerFile(file)) return { na: 'error handler (cada evento es único)' };
    const pgs = graph.nodes.filter(n => /postgres/i.test(n.type));
    if (pgs.length === 0) return { na: 'sin nodos Postgres' };
    const out = [];
    for (const n of pgs) {
      const q = JSON.stringify(n.parameters || {}).toLowerCase();
      const isInsert = q.includes('"insert"') || q.includes('insert into') ||
        q.includes('"operation":"insert"');
      if (!isInsert) continue;
      const ok = /on\s+conflict/.test(q) || /idempotency_key/.test(q);
      if (!ok) out.push(makeFinding('REG-005', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: 'INSERT sin ON CONFLICT ni idempotency_key',
        evidence: String(n.parameters?.query || '').slice(0, 200),
        fixSuggestion: { kind: 'codemod-id', codemodId: 'add-on-conflict',
          preview: 'Agregar ON CONFLICT (id) DO NOTHING' }
      }));
    }
    return out;
  }
};

export const REG_007 = {
  id: 'REG-007',
  run({ graph, file }) {
    const isE2File = /-e2-dominio/i.test(basename(file.path));
    if (!isE2File) return { na: 'no es subflujo E2 por nombre' };
    const ios = graph.nodes.filter(n => isIoType(n.type));
    if (ios.length === 0) return [];
    return ios.map(n => makeFinding('REG-007', {
      nodeId: n.id, nodeName: n.name, position: n.position,
      message: `Nodo IO "${n.type}" presente en subflujo E2 (dominio)`
    }));
  }
};

export const REG_008 = {
  id: 'REG-008',
  run({ graph, file }) {
    const name = basename(file.path);
    const allowed = /-e3-|-e4-|orquestador|error.handler/i.test(name);
    const ios = graph.nodes.filter(n => isIoType(n.type));
    if (ios.length === 0) return { na: 'sin nodos IO' };
    if (allowed) return [];
    return [makeFinding('REG-008', {
      message: `Nodos IO en archivo sin convención: ${ios.map(n => n.name).join(', ')}`,
      confidence: 'medium' })];
  }
};

export const REG_009 = {
  id: 'REG-009',
  run({ graph, file }) {
    if (!isOrquestadorFile(file, graph)) return { na: 'no es orquestador' };
    const responders = graph.nodes.filter(n => /respondtowebhook/i.test(n.type));
    if (responders.length === 0) return [makeFinding('REG-009', { message: 'Orquestador sin Respond to Webhook' })];
    const codes = new Set();
    for (const n of responders) {
      const c = n.parameters?.responseCode ?? n.parameters?.options?.responseCode;
      if (c !== undefined && c !== null) codes.add(String(c));
    }
    if (codes.size < 2) return [makeFinding('REG-009', {
      message: `Único responseCode: [${[...codes].join(', ')}]` })];
    return [];
  }
};
