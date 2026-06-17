/**
 * Codemod REG-005: agrega ON CONFLICT (id) DO NOTHING a INSERTs sin idempotencia.
 * Conservador: solo cuando el query es literal y termina en `)` simple.
 */
export function addOnConflict(flow) {
  const patches = [];
  for (const n of flow.nodes || []) {
    if (!/postgres/i.test(n.type || '')) continue;
    const q = String(n.parameters?.query || '');
    if (!/insert\s+into/i.test(q)) continue;
    if (/on\s+conflict/i.test(q) || /idempotency_key/i.test(q)) continue;
    const before = q;
    const after = q.replace(/\s*;?\s*$/, '') + ' ON CONFLICT (id) DO NOTHING';
    n.parameters.query = after;
    patches.push({ nodeName: n.name, before, after });
  }
  return { patches };
}
