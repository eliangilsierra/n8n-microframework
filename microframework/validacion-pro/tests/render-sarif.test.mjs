import { describe, it, expect } from 'vitest';
import { renderSarif } from '../src/report/render-sarif.mjs';

describe('render-sarif', () => {
  it('produce SARIF v2.1.0 con runs + tool + results', () => {
    const report = {
      tool: 'n8n-microframework-validator', version: '2.0.0',
      files: [{
        path: '/tmp/x.json',
        findings: [{
          ruleId: 'REG-001', severity: 'error', confidence: 'high',
          message: 'Secreto literal', nodeName: 'X',
          iso25010: ['security'], atamScenarios: ['R-BOT-01'], adr: ['ADR-MF-001']
        }]
      }]
    };
    const sarif = JSON.parse(renderSarif(report));
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].results).toHaveLength(1);
    expect(sarif.runs[0].results[0].ruleId).toBe('REG-001');
    expect(sarif.runs[0].results[0].level).toBe('error');
    expect(sarif.runs[0].tool.driver.rules.length).toBeGreaterThan(0);
  });
});
