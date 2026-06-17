export function computeMetrics(graph) {
  const N = graph.nodes.length;
  const E = graph.edges.length;
  const adj = new Map(graph.nodes.map(n => [n.id, new Set()]));
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
    cyclomaticComplexity: cyclomatic, maxDepth,
    stageDistribution,
    cohesionScore: Math.round(cohesionScore * 1000) / 1000,
    fanOutTop
  };
}

export function emptyMetrics() {
  return { nodeCount: 0, edgeCount: 0, cyclomaticComplexity: 0, maxDepth: 0,
    stageDistribution: { E1:0,E2:0,E3:0,E4:0,UNKNOWN:0 },
    cohesionScore: 1, fanOutTop: [] };
}
