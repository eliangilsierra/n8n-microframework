import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { metaForRule } from '../shared/quality-map.mjs';

export function makeFinding(ruleId, opts = {}) {
  const m = metaForRule(ruleId);
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

export function isOrquestadorFile(file, graph) {
  if (/orquestador/i.test(basename(file.path))) return true;
  const types = graph.nodes.map(n => (n.type || '').toLowerCase());
  return types.some(t => t.includes('webhook') && !t.includes('respond'))
    && types.some(t => t.includes('respondtowebhook'))
    && types.some(t => t.includes('executeworkflow'));
}

export function isErrorHandlerFile(file) {
  return /error.handler/i.test(basename(file.path));
}
