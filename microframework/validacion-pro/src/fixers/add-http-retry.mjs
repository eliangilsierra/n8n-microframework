/**
 * Codemod REG-004: agrega retry { enabled: true, maxRetries: 3 } a nodos HTTP.
 */
export function addHttpRetry(flow) {
  const patches = [];
  for (const n of flow.nodes || []) {
    if (!/httprequest/i.test(n.type || '')) continue;
    n.parameters = n.parameters || {};
    n.parameters.options = n.parameters.options || {};
    const before = JSON.parse(JSON.stringify(n.parameters.options.retry || {}));
    const cur = n.parameters.options.retry || {};
    const needs = !cur.enabled || Number(cur.maxRetries || cur.maxTries || 0) < 2;
    if (!needs) continue;
    n.parameters.options.retry = {
      enabled: true, maxRetries: 3, waitBetweenTries: 1000
    };
    patches.push({
      nodeName: n.name,
      before, after: n.parameters.options.retry
    });
  }
  return { patches };
}
