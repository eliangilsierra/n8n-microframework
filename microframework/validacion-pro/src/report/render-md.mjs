import { relFromRoot } from '../shared/fs-util.mjs';
import { t } from '../shared/i18n.mjs';

export function renderMd(report) {
  const L = [];
  L.push(t('report.md.title', { version: report.version }));
  L.push('');
  L.push(t('report.md.generated', { date: report.generatedAt }));
  if (report.commit) L.push(t('report.md.commit', { commit: report.commit.slice(0,12) }));
  L.push(t('report.md.files', { count: report.files.length }));
  L.push('');
  L.push(t('report.md.tableHeader'));
  L.push('|---|---|---|---|---|---|---|');
  for (const f of report.files) {
    L.push(`| ${relFromRoot(f.path)} | ${f.estado || '–'} | ${f.summary.score}% | ${f.summary.errors} | ${f.summary.warnings} | ${f.metrics.nodeCount} | ${f.metrics.cyclomaticComplexity} |`);
  }
  L.push('');
  L.push(t('report.md.coverage', { exercised: report.coverage.rulesExercised.length, defined: report.coverage.rulesDefined.length }));
  if (report.coverage.rulesDormant.length)
    L.push(t('report.md.dormantRules', { list: report.coverage.rulesDormant.join(', ') }));
  L.push('');
  for (const f of report.files) {
    L.push(`## ${relFromRoot(f.path)}`);
    if (f.parseError) { L.push(t('report.md.parseError', { error: f.parseError })); continue; }
    if (f.findings.length === 0) { L.push(t('report.md.noFindings')); continue; }
    for (const fd of f.findings) {
      const icon = fd.severity === 'error' ? '🛑' : fd.severity === 'warning' ? '⚠️' : 'ℹ️';
      L.push(`- ${icon} **${fd.ruleId}** ${fd.ruleName}${fd.nodeName ? ` @ ${fd.nodeName}` : ''}: ${fd.message}`);
      if (fd.evidence) L.push(t('report.md.evidence', { evidence: fd.evidence }));
      if (fd.iso25010?.length) L.push(t('report.md.iso25010', { list: fd.iso25010.join(', ') }));
      if (fd.atamScenarios?.length) L.push(t('report.md.atam', { list: fd.atamScenarios.join(', ') }));
    }
  }
  return L.join('\n');
}
