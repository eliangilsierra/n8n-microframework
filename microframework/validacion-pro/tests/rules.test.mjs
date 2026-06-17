import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateFile } from '../src/engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', '..', 'validacion', 'tests', 'fixtures');

describe('rules engine — fixtures', () => {
  if (!existsSync(FIXTURES)) {
    it.skip('no hay fixtures', () => {});
    return;
  }
  const names = readdirSync(FIXTURES).filter(n => statSync(join(FIXTURES, n)).isDirectory());
  for (const name of names) {
    const flowPath = join(FIXTURES, name, 'flow.json');
    const expPath = join(FIXTURES, name, 'expected.json');
    if (!existsSync(flowPath) || !existsSync(expPath)) continue;
    it(`fixture: ${name}`, () => {
      const expected = JSON.parse(readFileSync(expPath, 'utf8'));
      const result = evaluateFile({ path: flowPath, caso: 'plantilla', estado: 'to-be' });
      const ruleIds = new Set(result.findings.map(f => f.ruleId));
      for (const rid of (expected.shouldFail || [])) expect(ruleIds.has(rid), `esperaba ${rid}`).toBe(true);
      for (const rid of (expected.shouldPass || [])) expect(ruleIds.has(rid), `${rid} no debía aparecer`).toBe(false);
    });
  }
});
