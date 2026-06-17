import { envifySecret } from './envify-secret.mjs';
import { addHttpRetry } from './add-http-retry.mjs';
import { addOnConflict } from './add-on-conflict.mjs';

export const CODEMODS = {
  'envify-secret': envifySecret,
  'add-http-retry': addHttpRetry,
  'add-on-conflict': addOnConflict
};

/**
 * Aplica codemods sobre un objeto flow n8n.
 * Devuelve { changed: boolean, patches: Array<{ nodeName, codemodId, before, after }>, flow }.
 */
export function applyFixes(flow, ruleIds = []) {
  const patches = [];
  let changed = false;
  for (const codemodId of Object.keys(CODEMODS)) {
    const ruleMatch = mapCodemodToRule(codemodId);
    if (ruleIds.length && !ruleIds.includes(ruleMatch)) continue;
    const r = CODEMODS[codemodId](flow);
    if (r && r.patches?.length) {
      changed = true;
      patches.push(...r.patches.map(p => ({ ...p, codemodId })));
    }
  }
  return { changed, patches, flow };
}

function mapCodemodToRule(id) {
  return { 'envify-secret': 'REG-001', 'add-http-retry': 'REG-004', 'add-on-conflict': 'REG-005' }[id];
}
