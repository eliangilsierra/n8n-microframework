import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { discover } from './discover.mjs';
import { applyFixes } from '../fixers/index.mjs';
import { relFromRoot } from '../shared/fs-util.mjs';
import { t } from '../shared/i18n.mjs';

export async function fix(args) {
  const files = discover(args);
  if (files.length === 0) { console.error(t('cli.error.nothingToFix')); process.exit(0); }
  let totalChanged = 0, totalPatches = 0;
  for (const f of files) {
    if (statSync(f.path).isDirectory()) continue;
    const flow = JSON.parse(readFileSync(f.path, 'utf8'));
    const before = JSON.stringify(flow);
    const { changed, patches } = applyFixes(flow, args.rule);
    if (!changed) continue;
    totalChanged++;
    totalPatches += patches.length;
    console.log(t('cli.fix.patchesHeader', { file: relFromRoot(f.path), count: patches.length }));
    for (const p of patches)
      console.log(`   · ${p.codemodId} @ "${p.nodeName}"${p.headerName ? ' [' + p.headerName + ']' : ''}`);
    if (!args.dryRun) {
      writeFileSync(f.path, JSON.stringify(flow, null, 2), 'utf8');
      console.log(t('cli.fix.saved'));
    } else {
      console.log(t('cli.fix.dryRun'));
    }
  }
  console.log(t('cli.fix.summary', { files: totalChanged, patches: totalPatches }));
}
