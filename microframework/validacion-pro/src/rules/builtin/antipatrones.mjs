// Antipatrones AP-001..AP-006 como queries sobre el grafo.
import { makeFinding } from '../helpers.mjs';
import { nodeHasIoSignal } from '../../parser/classify-stage.mjs';

export const AP_001 = {
  id: 'AP-001',
  run({ graph }) {
    const out = [];
    for (const n of graph.nodes) {
      const d = n.inDegree + n.outDegree;
      if (d > 6) out.push(makeFinding('AP-001', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `God-node: in=${n.inDegree}, out=${n.outDegree} (umbral 6)`,
        confidence: 'medium' }));
    }
    return out.length ? out : { na: 'ningún nodo supera grado 6' };
  }
};

export const AP_002 = {
  id: 'AP-002',
  run({ graph }) {
    const out = [];
    for (const n of graph.nodes) {
      if (!/httprequest/i.test(n.type)) continue;
      const preds = graph.edges.filter(e => e.to === n.id).map(e => graph.byId.get(e.from));
      for (const p of preds) {
        if (!p) continue;
        const t = (p.type || '').toLowerCase();
        if (t.includes('splitinbatches') || t.includes('itemlists') ||
            t.includes('loop') || t.includes('foreach')) {
          out.push(makeFinding('AP-002', {
            nodeId: n.id, nodeName: n.name, position: n.position,
            message: `Posible chatty IO: HTTP "${n.name}" dentro de loop "${p.name}"`,
            confidence: 'medium' }));
        }
      }
    }
    return out.length ? out : { na: 'sin patrón HTTP-en-loop' };
  }
};

export const AP_003 = {
  id: 'AP-003',
  run({ graph }) {
    const writers = graph.nodes.filter(n =>
      /postgres|mysql|mongodb/i.test(n.type) &&
      /insert|update/i.test(JSON.stringify(n.parameters || {})));
    if (writers.length < 2) return { na: 'menos de 2 escrituras' };
    const txt = JSON.stringify(graph.nodes.map(n => n.parameters || {}));
    if (/saga|compensat|rollback|begin\s+transaction|commit\s*;/i.test(txt))
      return { na: 'detectada compensación/transacción' };
    return [makeFinding('AP-003', {
      message: `Dual-write detectado: ${writers.map(w => w.name).join(' + ')} sin compensación visible`,
      confidence: 'medium' })];
  }
};

export const AP_004 = {
  id: 'AP-004',
  run({ graph, flow }) {
    const hasGlobalHandler = flow?.settings?.errorWorkflow
      && String(flow.settings.errorWorkflow).trim().length > 0;
    const out = [];
    for (const n of graph.nodes) {
      if (n.hasErrorBranch || n.continueOnFail || n.onError === 'continueRegularOutput') {
        const errEdges = graph.edges.filter(e => e.from === n.id && e.branch === 'error');
        const hasLog = errEdges.some(e => {
          const next = graph.byId.get(e.to); if (!next) return false;
          const src = String(next.parameters?.jsCode || next.parameters?.functionCode || '');
          return /console\.log|errorWorkflow|throw/.test(src);
        });
        if (errEdges.length > 0 && !hasLog) out.push(makeFinding('AP-004', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: 'Rama error no termina en log estructurado ni re-throw',
          confidence: 'medium' }));
        else if (errEdges.length === 0 && n.continueOnFail && !hasGlobalHandler)
          out.push(makeFinding('AP-004', {
            nodeId: n.id, nodeName: n.name, position: n.position,
            message: 'continueOnFail=true sin rama error y sin errorWorkflow global' }));
      }
    }
    return out.length ? out : { na: 'no se detectó swallowing' };
  }
};

export const AP_005 = {
  id: 'AP-005',
  run({ graph }) {
    const out = [];
    for (const ref of graph.subflowRefs) {
      const id = ref.workflowId;
      if (!id || /placeholder|REEMPLAZAR|TODO|\{\{.+\}\}/i.test(String(id))) {
        out.push(makeFinding('AP-005', {
          nodeId: ref.nodeId, nodeName: ref.nodeName,
          message: `Execute Workflow con workflowId no resuelto: "${id}"` }));
      }
    }
    return out.length ? out : { na: 'workflowIds resueltos' };
  }
};

export const AP_006 = {
  id: 'AP-006',
  run({ graph }) {
    const out = [];
    for (const n of graph.nodes) {
      if (n.stage === 'E2' && nodeHasIoSignal(n)) out.push(makeFinding('AP-006', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `Stage leak: nodo clasificado E2 con IO (${n.type})` }));
    }
    return out.length ? out : { na: 'no se detectó stage leak' };
  }
};
