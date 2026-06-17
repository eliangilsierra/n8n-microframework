/**
 * Reconstruye el grafo dirigido tipado a partir del JSON exportado por n8n.
 * Soporta ramas main y error.
 */
export function buildGraph(flow) {
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
  for (const n of nodes) { n.inDegree = 0; n.outDegree = 0; n.hasErrorBranch = false; }
  for (const e of edges) {
    const f = byId.get(e.from); const t = byId.get(e.to);
    if (f) { f.outDegree++; if (e.branch === 'error') f.hasErrorBranch = true; }
    if (t) t.inDegree++;
  }
  // Solo nodos invocadores (executeWorkflow), NO el trigger receptor (executeWorkflowTrigger)
  const subflowRefs = nodes
    .filter(n => /executeWorkflow$/i.test(n.type))
    .map(n => ({
      nodeId: n.id, nodeName: n.name,
      workflowId: n.parameters?.workflowId?.value || n.parameters?.workflowId || null
    }));
  return { nodes, edges, subflowRefs, byId, byName };
}
