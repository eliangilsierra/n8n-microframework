import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDslRules } from '../src/rules/dsl-loader.mjs';
import { evaluateFile } from '../src/engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('DSL YAML loader + evaluator', () => {
  it('carga regla simple y la aplica', async () => {
    const tmp = join(HERE, 'tmp-dsl');
    mkdirSync(tmp, { recursive: true });
    const ruleFile = join(tmp, 'custom-test.yaml');
    writeFileSync(ruleFile, [
      'id: TEST-001',
      'name: Prohibir HTTP en E2',
      'severity: warning',
      'match:',
      '  nodeType: httpRequest',
      '  stage: E2',
      'assert:',
      '  not: true',
      'message: HTTP en E2 prohibido.'
    ].join('\n'), 'utf8');
    const rules = await loadDslRules(tmp);
    expect(rules.length).toBe(1);
    expect(rules[0].id).toBe('TEST-001');

    // Flujo con HTTP clasificado como E3 — no debe disparar
    const flowPath = join(tmp, 'flow.json');
    writeFileSync(flowPath, JSON.stringify({
      nodes: [
        { id: 'a', name: 'In', type: 'n8n-nodes-base.webhook', position: [0,0], parameters: {} },
        { id: 'b', name: 'H', type: 'n8n-nodes-base.httpRequest', position: [100,0], parameters: { options: { retry: { enabled: true, maxRetries: 3 }}} }
      ],
      connections: { In: { main: [[{ node: 'H', type: 'main', index: 0 }]] } }
    }), 'utf8');
    const res = evaluateFile({ path: flowPath, caso: 'plantilla', estado: 'to-be' }, rules);
    expect(res.findings.find(f => f.ruleId === 'TEST-001')).toBeUndefined();

    rmSync(tmp, { recursive: true, force: true });
  });
});
