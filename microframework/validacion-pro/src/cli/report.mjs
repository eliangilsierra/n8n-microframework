import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { discover } from './discover.mjs';
import { buildReport } from './build-report.mjs';
import { renderMd } from '../report/render-md.mjs';
import { renderSarif } from '../report/render-sarif.mjs';
import { renderJunit } from '../report/render-junit.mjs';
import { renderHtml } from '../report/render-html.mjs';
import { loadDslRules } from '../rules/dsl-loader.mjs';
import { t } from '../shared/i18n.mjs';

export async function report(args) {
  const files = discover(args);
  if (files.length === 0) { console.error(t('cli.error.noFilesFound')); process.exit(0); }
  const rep = await buildReport(files, args);
  const customRules = args.rulesDir ? await loadDslRules(args.rulesDir) : [];

  const outDir = resolve(args.out || './reportes');
  mkdirSync(outDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const suffix = args.estado ? `-${args.estado}` : '';
  const stamp = `${date}${suffix}`;
  let payload, fname;
  switch (args.format) {
    case 'html':  payload = renderHtml(rep);  fname = `validacion-${stamp}.html`; break;
    case 'sarif': payload = renderSarif(rep, customRules); fname = `validacion-${stamp}.sarif`; break;
    case 'junit': payload = renderJunit(rep, customRules); fname = `validacion-${stamp}.xml`; break;
    case 'json':  payload = JSON.stringify(rep, null, 2); fname = `validacion-${stamp}.json`; break;
    case 'md':
    default:      payload = renderMd(rep);    fname = `validacion-${stamp}.md`;
  }
  const target = join(outDir, fname);
  writeFileSync(target, payload, 'utf8');
  // Siempre guardar JSON canónico
  writeFileSync(join(outDir, `validacion-${stamp}.json`), JSON.stringify(rep, null, 2), 'utf8');

  console.log(t('cli.report.written', { path: target }));
  const tobeErr = rep.files.filter(f => f.estado === 'to-be' && f.summary.errors > 0).length;
  process.exit(tobeErr > 0 ? 1 : 0);
}
