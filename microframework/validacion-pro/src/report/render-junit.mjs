import { relFromRoot } from '../shared/fs-util.mjs';
import { getAllRules } from '../rules/index.mjs';

function esc(s) {
  return String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' })[c]);
}

export function renderJunit(report, customRules = []) {
  const allRules = getAllRules(customRules);
  const suites = [];
  for (const f of report.files) {
    const rel = relFromRoot(f.path);
    const cases = allRules.map(r => {
      const ff = f.findings.filter(x => x.ruleId === r.id);
      if (ff.length === 0) {
        const applies = (f.rulesApplicable || []).includes(r.id);
        return applies
          ? `    <testcase classname="${esc(rel)}" name="${r.id}"/>`
          : `    <testcase classname="${esc(rel)}" name="${r.id}"><skipped/></testcase>`;
      }
      const msg = ff.map(x => `${x.severity}: ${x.message}`).join(' | ');
      return `    <testcase classname="${esc(rel)}" name="${r.id}"><failure message="${esc(msg)}">${esc(ff.map(x => x.evidence || '').join('\n'))}</failure></testcase>`;
    });
    suites.push(`  <testsuite name="${esc(rel)}" tests="${allRules.length}" failures="${f.findings.length}">\n${cases.join('\n')}\n  </testsuite>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n${suites.join('\n')}\n</testsuites>\n`;
}
