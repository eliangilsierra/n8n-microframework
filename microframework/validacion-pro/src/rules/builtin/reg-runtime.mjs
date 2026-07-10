// Reglas que dependen del runtime/observabilidad/errores: REG-002, REG-003, REG-006
import { makeFinding, isOrquestadorFile } from '../helpers.mjs';
import { t } from '../../shared/i18n.mjs';

export const REG_002 = {
  id: 'REG-002',
  run({ graph }) {
    const codes = graph.nodes.filter(n => /code|function/i.test(n.type));
    if (codes.length === 0) {
      if (graph.subflowRefs.length > 0) return { na: t('na.reg002.pureOrchestrator') };
      return { na: t('na.common.noCodeNodes') };
    }
    let foundRunId = false, foundLog = false;
    for (const n of codes) {
      const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
      if (src.includes('run_id')) foundRunId = true;
      if (/console\.log\s*\(\s*JSON\.stringify/.test(src)) foundLog = true;
    }
    const out = [];
    if (!foundRunId) out.push(makeFinding('REG-002', { message: t('rule.reg002.noRunId') }));
    if (!foundLog) out.push(makeFinding('REG-002', {
      message: t('rule.reg002.noStructuredLogRunId'),
      confidence: 'medium' }));
    return out;
  }
};

export const REG_003 = {
  id: 'REG-003',
  run({ flow, file, graph }) {
    if (!isOrquestadorFile(file, graph)) return { na: t('na.common.notOrchestrator') };
    const s = flow?.settings?.errorWorkflow;
    if (s && String(s).trim().length > 0) return [];
    return [makeFinding('REG-003', {
      message: t('rule.reg003.missingErrorWorkflow'),
      fixSuggestion: { kind: 'hint',
        preview: t('rule.reg003.fixErrorWorkflow') }
    })];
  }
};

export const REG_006 = {
  id: 'REG-006',
  run({ graph }) {
    const codes = graph.nodes.filter(n => /code|function/i.test(n.type));
    if (codes.length === 0) return { na: t('na.common.noCodeNodes') };
    const out = [];
    for (const n of codes) {
      const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
      if (!/console\.log\s*\(\s*JSON\.stringify/.test(src)) {
        out.push(makeFinding('REG-006', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: t('rule.reg006.noStructuredLog'),
          confidence: 'medium' }));
        continue;
      }
      const missing = ['run_id', 'etapa', 'status'].filter(k => !src.includes(k));
      if (missing.length) out.push(makeFinding('REG-006', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: t('rule.reg006.missingFields', { fields: missing.join(', ') }) }));
    }
    return out;
  }
};
