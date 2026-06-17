// Engine compartido — evalúa un archivo contra todas las reglas.
import { parseFlow } from './parser/parse-flow.mjs';
import { buildGraph } from './parser/build-graph.mjs';
import { annotateStages } from './parser/classify-stage.mjs';
import { computeMetrics, emptyMetrics } from './metrics/index.mjs';
import { getAllRules } from './rules/index.mjs';
import { isOrquestadorFile, isErrorHandlerFile } from './rules/helpers.mjs';

export function evaluateFile(file, customRules = []) {
  const { flow, error } = parseFlow(file.path);
  if (error) {
    return {
      path: file.path, caso: file.caso, estado: file.estado,
      parseError: error,
      graph: { nodes: [], edges: [], subflowRefs: [] },
      metrics: emptyMetrics(),
      findings: [], summary: emptySummary(),
      rulesApplicable: [], rulesNa: [], rulesPassed: []
    };
  }
  const graph = buildGraph(flow);
  annotateStages(graph);
  const metrics = computeMetrics(graph);
  const ctx = { flow, graph, file };

  const findings = [];
  const rulesApplicable = [];
  const rulesNa = [];
  const rulesPassed = [];
  for (const r of getAllRules(customRules)) {
    const result = r.run(ctx);
    if (Array.isArray(result)) {
      rulesApplicable.push(r.id);
      if (result.length === 0) rulesPassed.push(r.id);
      else findings.push(...result);
    } else if (result && result.na) {
      rulesNa.push({ id: r.id, reason: result.na });
    }
  }
  const summary = summarize(findings, rulesApplicable, rulesPassed);
  return {
    path: file.path, caso: file.caso, estado: file.estado,
    isOrquestador: isOrquestadorFile(file, graph),
    isErrorHandler: isErrorHandlerFile(file),
    graph: serializeGraph(graph),
    metrics, findings, summary,
    rulesApplicable, rulesNa, rulesPassed
  };
}

function summarize(findings, applicable, passed) {
  const errors = findings.filter(f => f.severity === 'error').length;
  const warnings = findings.filter(f => f.severity === 'warning').length;
  const infos = findings.filter(f => f.severity === 'info').length;
  const total = applicable.length;
  const score = total === 0 ? 100 : Math.round((passed.length / total) * 100);
  return { errors, warnings, infos, score,
    rulesApplicable: total, rulesPassed: passed.length };
}

function emptySummary() {
  return { errors: 0, warnings: 0, infos: 0, score: 0,
    rulesApplicable: 0, rulesPassed: 0 };
}

function serializeGraph(g) {
  return {
    nodes: g.nodes.map(n => ({
      id: n.id, name: n.name, type: n.type, stage: n.stage,
      stageInferred: n.stageInferred, position: n.position,
      inDegree: n.inDegree, outDegree: n.outDegree,
      hasErrorBranch: n.hasErrorBranch
    })),
    edges: g.edges.map(e => ({ from: e.from, to: e.to, branch: e.branch })),
    subflowRefs: g.subflowRefs
  };
}

export function computeCoverage(reports, customRules = []) {
  const defined = getAllRules(customRules).map(r => r.id);
  const exercised = new Set();
  for (const r of reports) {
    for (const f of r.findings) exercised.add(f.ruleId);
    for (const id of r.rulesApplicable || []) exercised.add(id);
  }
  const dormant = defined.filter(d => !exercised.has(d));
  return { rulesDefined: defined, rulesExercised: [...exercised], rulesDormant: dormant };
}
