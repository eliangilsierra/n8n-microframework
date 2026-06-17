import { discover } from './discover.mjs';
import { buildReport } from './build-report.mjs';
import { relFromRoot } from '../shared/fs-util.mjs';

export async function analyze(args) {
  const files = discover(args);
  if (files.length === 0) { console.error('No se encontraron archivos JSON.'); process.exit(0); }
  const report = await buildReport(files, args);

  console.log(`\nn8nmf analyze — ${files.length} archivos\n`);
  console.log('Archivo'.padEnd(70) + 'Score  Err  Warn');
  console.log('-'.repeat(90));
  for (const f of report.files) {
    const rel = relFromRoot(f.path);
    console.log(
      rel.padEnd(70).slice(0, 70) +
      String(f.summary.score + '%').padStart(5) + '  ' +
      String(f.summary.errors).padStart(3) + '  ' +
      String(f.summary.warnings).padStart(4)
    );
  }
  console.log('-'.repeat(90));
  console.log(`Cobertura: ${report.coverage.rulesExercised.length}/${report.coverage.rulesDefined.length} reglas ejercitadas.`);
  if (report.customRulesLoaded > 0)
    console.log(`Reglas DSL cargadas: ${report.customRulesLoaded}`);

  const tobeErr = report.files.filter(f => f.estado === 'to-be' && f.summary.errors > 0).length;
  const tobeWarn = report.files.filter(f => f.estado === 'to-be' && f.summary.warnings > 0).length;
  process.exit((tobeErr > 0 || (args.strict && tobeWarn > 0)) ? 1 : 0);
}
