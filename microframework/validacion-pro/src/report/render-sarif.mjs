import { TOOL, VERSION } from '../shared/paths.mjs';
import { metaForRule } from '../shared/quality-map.mjs';
import { getAllRules } from '../rules/index.mjs';
import { relFromRoot } from '../shared/fs-util.mjs';

export function renderSarif(report, customRules = []) {
  const allRules = getAllRules(customRules);
  const rules = allRules.map(r => {
    const m = metaForRule(r.id);
    return {
      id: r.id, name: m.nombre || r.id,
      shortDescription: { text: m.nombre || r.id },
      defaultConfiguration: { level: toSarif(m.severityDefault || 'warning') },
      properties: { iso25010: m.iso25010 || [], atam: m.atam || [], adr: m.adr || [] }
    };
  });
  const results = [];
  for (const f of report.files) {
    for (const fd of f.findings) {
      results.push({
        ruleId: fd.ruleId,
        level: toSarif(fd.severity),
        message: { text: fd.message },
        locations: [{
          physicalLocation: { artifactLocation: { uri: relFromRoot(f.path) } },
          logicalLocations: fd.nodeName ? [{ name: fd.nodeName, kind: 'object' }] : undefined
        }],
        properties: {
          confidence: fd.confidence, iso25010: fd.iso25010,
          atam: fd.atamScenarios, adr: fd.adr, evidence: fd.evidence
        }
      });
    }
  }
  return JSON.stringify({
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{ tool: { driver: { name: TOOL, version: VERSION, rules } }, results }]
  }, null, 2);
}

function toSarif(s) { return s === 'error' ? 'error' : s === 'info' ? 'note' : 'warning'; }
