// Reglas que dependen del runtime/observabilidad/errores: REG-002, REG-003, REG-006
import { makeFinding, isOrquestadorFile } from '../helpers.mjs';

export const REG_002 = {
  id: 'REG-002',
  run({ graph }) {
    const codes = graph.nodes.filter(n => /code|function/i.test(n.type));
    if (codes.length === 0) {
      if (graph.subflowRefs.length > 0) return { na: 'orquestador puro (run_id delegado a subflujo E1)' };
      return { na: 'sin nodos Code' };
    }
    let foundRunId = false, foundLog = false;
    for (const n of codes) {
      const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
      if (src.includes('run_id')) foundRunId = true;
      if (/console\.log\s*\(\s*JSON\.stringify/.test(src)) foundLog = true;
    }
    const out = [];
    if (!foundRunId) out.push(makeFinding('REG-002', { message: 'Ningún nodo Code referencia run_id' }));
    if (!foundLog) out.push(makeFinding('REG-002', {
      message: 'No se detectó console.log(JSON.stringify(...)) con run_id',
      confidence: 'medium' }));
    return out;
  }
};

export const REG_003 = {
  id: 'REG-003',
  run({ flow, file, graph }) {
    if (!isOrquestadorFile(file, graph)) return { na: 'no es orquestador' };
    const s = flow?.settings?.errorWorkflow;
    if (s && String(s).trim().length > 0) return [];
    return [makeFinding('REG-003', {
      message: 'settings.errorWorkflow ausente o vacío en orquestador',
      fixSuggestion: { kind: 'hint',
        preview: 'Configurar Settings → Error Workflow apuntando al error handler del caso.' }
    })];
  }
};

export const REG_006 = {
  id: 'REG-006',
  run({ graph }) {
    const codes = graph.nodes.filter(n => /code|function/i.test(n.type));
    if (codes.length === 0) return { na: 'sin nodos Code' };
    const out = [];
    for (const n of codes) {
      const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
      if (!/console\.log\s*\(\s*JSON\.stringify/.test(src)) {
        out.push(makeFinding('REG-006', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: 'Nodo Code sin console.log(JSON.stringify(...))',
          confidence: 'medium' }));
        continue;
      }
      const missing = ['run_id', 'etapa', 'status'].filter(k => !src.includes(k));
      if (missing.length) out.push(makeFinding('REG-006', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `Log JSON sin campos: ${missing.join(', ')}` }));
    }
    return out;
  }
};
