import { describe, it, expect } from 'vitest';
import { buildGraph } from '../src/parser/build-graph.mjs';
import { annotateStages, classifyStage } from '../src/parser/classify-stage.mjs';

describe('parser/build-graph', () => {
  it('construye nodos y aristas main/error', () => {
    const flow = {
      nodes: [
        { id: 'a', name: 'A', type: 'n8n-nodes-base.webhook', position: [0,0], parameters: {} },
        { id: 'b', name: 'B', type: 'n8n-nodes-base.code', position: [100,0], parameters: {} },
        { id: 'c', name: 'C', type: 'n8n-nodes-base.respondToWebhook', position: [200,0], parameters: {} }
      ],
      connections: {
        A: { main: [[{ node: 'B', type: 'main', index: 0 }]] },
        B: {
          main: [[{ node: 'C', type: 'main', index: 0 }]],
          error: [[{ node: 'C', type: 'main', index: 0 }]]
        }
      }
    };
    const g = buildGraph(flow);
    expect(g.nodes).toHaveLength(3);
    expect(g.edges.length).toBeGreaterThanOrEqual(2);
    expect(g.edges.some(e => e.branch === 'error')).toBe(true);
    expect(g.byId.get('a').outDegree).toBe(1);
    expect(g.byId.get('c').inDegree).toBeGreaterThan(0);
  });
});

describe('parser/classify-stage', () => {
  it('clasifica webhook como E1', () => {
    expect(classifyStage({ type: 'n8n-nodes-base.webhook', name: 'In', parameters: {} }).stage).toBe('E1');
  });
  it('clasifica respondToWebhook como E4', () => {
    expect(classifyStage({ type: 'n8n-nodes-base.respondToWebhook', name: 'Out', parameters: {} }).stage).toBe('E4');
  });
  it('clasifica httpRequest como E3', () => {
    expect(classifyStage({ type: 'n8n-nodes-base.httpRequest', name: 'X', parameters: {} }).stage).toBe('E3');
  });
  it('clasifica Code puro como E2', () => {
    expect(classifyStage({ type: 'n8n-nodes-base.code', name: 'Logic', parameters: { jsCode: 'return $input.all();' } }).stage).toBe('E2');
  });
  it('clasifica Code con fetch como E3 (stage leak detectable)', () => {
    expect(classifyStage({ type: 'n8n-nodes-base.code', name: 'X', parameters: { jsCode: 'await fetch("http://x")' } }).stage).toBe('E3');
  });
});
