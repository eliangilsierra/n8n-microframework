import { describe, it, expect } from 'vitest';
import { addHttpRetry } from '../src/fixers/add-http-retry.mjs';
import { envifySecret } from '../src/fixers/envify-secret.mjs';
import { addOnConflict } from '../src/fixers/add-on-conflict.mjs';

describe('codemods', () => {
  it('add-http-retry agrega config retry a HTTP sin retry', () => {
    const flow = { nodes: [{ name: 'X', type: 'n8n-nodes-base.httpRequest', parameters: { options: {} } }] };
    const r = addHttpRetry(flow);
    expect(r.patches.length).toBe(1);
    expect(flow.nodes[0].parameters.options.retry.enabled).toBe(true);
    expect(flow.nodes[0].parameters.options.retry.maxRetries).toBeGreaterThanOrEqual(2);
  });

  it('envify-secret reemplaza header literal por {{$env.X}}', () => {
    const flow = { nodes: [{
      name: 'H', type: 'n8n-nodes-base.httpRequest',
      parameters: { headerParameters: { parameters: [
        { name: 'x-api-key', value: 'sk-abcdef123456' }
      ]}}}]};
    const r = envifySecret(flow);
    expect(r.patches.length).toBe(1);
    expect(flow.nodes[0].parameters.headerParameters.parameters[0].value).toContain('$env.X_API_KEY');
  });

  it('add-on-conflict agrega ON CONFLICT a INSERT sin idempotencia', () => {
    const flow = { nodes: [{
      name: 'I', type: 'n8n-nodes-base.postgres',
      parameters: { query: 'INSERT INTO t (id, v) VALUES ($1, $2)' }
    }]};
    const r = addOnConflict(flow);
    expect(r.patches.length).toBe(1);
    expect(flow.nodes[0].parameters.query).toMatch(/ON CONFLICT/);
  });

  it('idempotente: aplicar codemod dos veces no duplica patches', () => {
    const flow = { nodes: [{ name: 'X', type: 'n8n-nodes-base.httpRequest', parameters: { options: {} } }] };
    addHttpRetry(flow);
    const second = addHttpRetry(flow);
    expect(second.patches.length).toBe(0);
  });
});
