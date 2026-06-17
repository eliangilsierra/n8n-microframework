import { makeFinding } from '../helpers.mjs';

const SECRET_PATTERNS = [
  { re: /Bearer\s+[A-Za-z0-9._\-]{8,}/i, label: 'Bearer token literal' },
  { re: /sk-[A-Za-z0-9]{16,}/, label: 'API key estilo OpenAI' },
  { re: /ghp_[A-Za-z0-9]{16,}/, label: 'GitHub PAT literal' },
  { re: /\b(const|let|var)\s+\w*(token|api[_-]?key|secret|password)\w*\s*=\s*["'][^"'{}$\s][^"'{}$]{6,}["']/i,
    label: 'Asignación literal a variable de secreto en Code' },
  { re: /"rightValue"\s*:\s*"[A-Za-z0-9._\-]{12,}"/, label: 'Comparación literal de token en IF/Switch' }
];

export const id = 'REG-001';

export function run({ graph }) {
  const findings = [];
  for (const n of graph.nodes) {
    const paramsStr = JSON.stringify(n.parameters || {});
    for (const pat of SECRET_PATTERNS) {
      const m = paramsStr.match(pat.re);
      if (m) findings.push(makeFinding('REG-001', {
        nodeId: n.id, nodeName: n.name, position: n.position,
        message: `Secreto literal detectado: ${pat.label}`,
        evidence: m[0].slice(0, 120),
        fixSuggestion: { kind: 'codemod-id', codemodId: 'envify-secret',
          preview: 'Reemplazar literal por credencial n8n o {{$env.VAR_NAME}}' }
      }));
    }
    const headers = n.parameters?.headerParameters?.parameters
      || n.parameters?.headers?.parameters || [];
    if (Array.isArray(headers)) {
      for (const h of headers) {
        const name = String(h.name || '').toLowerCase();
        const value = String(h.value || '');
        if (['x-api-key', 'authorization', 'api-key', 'x-auth-token'].includes(name)
            && value.length > 6 && !/\{\{.*\}\}/.test(value) && !/^\$\{/.test(value)) {
          findings.push(makeFinding('REG-001', {
            nodeId: n.id, nodeName: n.name, position: n.position,
            message: `Header HTTP "${h.name}" con valor literal`,
            evidence: `${h.name}: ${value.slice(0, 40)}…`,
            fixSuggestion: { kind: 'codemod-id', codemodId: 'envify-secret',
              preview: `Header debe usar {{$env.${name.toUpperCase().replace(/-/g, '_')}}}` }
          }));
        }
      }
    }
  }
  return findings;
}
