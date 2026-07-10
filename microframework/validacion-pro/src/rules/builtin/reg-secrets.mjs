import { makeFinding } from '../helpers.mjs';
import { t } from '../../shared/i18n.mjs';

const SECRET_PATTERNS = [
  { re: /Bearer\s+[A-Za-z0-9._\-]{8,}/i, labelKey: 'rule.reg001.label.bearerToken' },
  { re: /sk-[A-Za-z0-9]{16,}/, labelKey: 'rule.reg001.label.openaiKey' },
  { re: /ghp_[A-Za-z0-9]{16,}/, labelKey: 'rule.reg001.label.githubPat' },
  { re: /\b(const|let|var)\s+\w*(token|api[_-]?key|secret|password)\w*\s*=\s*["'][^"'{}$\s][^"'{}$]{6,}["']/i,
    labelKey: 'rule.reg001.label.codeSecretAssignment' },
  { re: /"rightValue"\s*:\s*"[A-Za-z0-9._\-]{12,}"/, labelKey: 'rule.reg001.label.ifSwitchTokenCompare' }
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
        message: t('rule.reg001.secretLiteral', { label: t(pat.labelKey) }),
        evidence: m[0].slice(0, 120),
        fixSuggestion: { kind: 'codemod-id', codemodId: 'envify-secret',
          preview: t('rule.reg001.fixSecret') }
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
            message: t('rule.reg001.headerLiteral', { name: h.name }),
            evidence: `${h.name}: ${value.slice(0, 40)}…`,
            fixSuggestion: { kind: 'codemod-id', codemodId: 'envify-secret',
              preview: t('rule.reg001.fixHeader', { envVar: name.toUpperCase().replace(/-/g, '_') }) }
          }));
        }
      }
    }
  }
  return findings;
}
