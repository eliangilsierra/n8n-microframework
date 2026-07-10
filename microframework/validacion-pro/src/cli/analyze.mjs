import { discover } from './discover.mjs';
import { buildReport } from './build-report.mjs';
import { relFromRoot } from '../shared/fs-util.mjs';
import { t } from '../shared/i18n.mjs';

export async function analyze(args) {
  const files = discover(args);
  if (files.length === 0) { console.error(t('cli.error.noFilesFound')); process.exit(0); }
  const report = await buildReport(files, args);

  console.log(t('cli.analyze.header', { count: files.length }));
  console.log(t('cli.analyze.colFile').padEnd(70) + t('cli.analyze.colScoreErrWarn'));
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
  console.log(t('cli.analyze.coverage', { exercised: report.coverage.rulesExercised.length, defined: report.coverage.rulesDefined.length }));
  if (report.customRulesLoaded > 0)
    console.log(t('cli.analyze.dslLoaded', { count: report.customRulesLoaded }));

  const tobeErr = report.files.filter(f => f.estado === 'to-be' && f.summary.errors > 0).length;
  const tobeWarn = report.files.filter(f => f.estado === 'to-be' && f.summary.warnings > 0).length;
  process.exit((tobeErr > 0 || (args.strict && tobeWarn > 0)) ? 1 : 0);
}
