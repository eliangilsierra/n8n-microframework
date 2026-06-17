import { relFromRoot } from '../shared/fs-util.mjs';

export function renderMd(report) {
  const L = [];
  L.push(`# Reporte de validación — Pro v${report.version}`);
  L.push('');
  L.push(`- Generado: ${report.generatedAt}`);
  if (report.commit) L.push(`- Commit: \`${report.commit.slice(0,12)}\``);
  L.push(`- Archivos: ${report.files.length}`);
  L.push('');
  L.push('| Archivo | Estado | Score | Err | Warn | Nodos | Ciclomática |');
  L.push('|---|---|---|---|---|---|---|');
  for (const f of report.files) {
    L.push(`| ${relFromRoot(f.path)} | ${f.estado || '–'} | ${f.summary.score}% | ${f.summary.errors} | ${f.summary.warnings} | ${f.metrics.nodeCount} | ${f.metrics.cyclomaticComplexity} |`);
  }
  L.push('');
  L.push(`Cobertura: ${report.coverage.rulesExercised.length}/${report.coverage.rulesDefined.length} reglas ejercitadas.`);
  if (report.coverage.rulesDormant.length)
    L.push(`Reglas dormidas: ${report.coverage.rulesDormant.join(', ')}`);
  L.push('');
  for (const f of report.files) {
    L.push(`## ${relFromRoot(f.path)}`);
    if (f.parseError) { L.push(`❌ Error: ${f.parseError}`); continue; }
    if (f.findings.length === 0) { L.push('✓ Sin findings.'); continue; }
    for (const fd of f.findings) {
      const icon = fd.severity === 'error' ? '🛑' : fd.severity === 'warning' ? '⚠️' : 'ℹ️';
      L.push(`- ${icon} **${fd.ruleId}** ${fd.ruleName}${fd.nodeName ? ` @ ${fd.nodeName}` : ''}: ${fd.message}`);
      if (fd.evidence) L.push(`    - evidencia: \`${fd.evidence}\``);
      if (fd.iso25010?.length) L.push(`    - ISO 25010: ${fd.iso25010.join(', ')}`);
      if (fd.atamScenarios?.length) L.push(`    - ATAM: ${fd.atamScenarios.join(', ')}`);
    }
  }
  return L.join('\n');
}
