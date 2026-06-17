import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { discover } from './discover.mjs';
import { applyFixes } from '../fixers/index.mjs';
import { relFromRoot } from '../shared/fs-util.mjs';

export async function fix(args) {
  const files = discover(args);
  if (files.length === 0) { console.error('Nada que arreglar.'); process.exit(0); }
  let totalChanged = 0, totalPatches = 0;
  for (const f of files) {
    if (statSync(f.path).isDirectory()) continue;
    const flow = JSON.parse(readFileSync(f.path, 'utf8'));
    const before = JSON.stringify(flow);
    const { changed, patches } = applyFixes(flow, args.rule);
    if (!changed) continue;
    totalChanged++;
    totalPatches += patches.length;
    console.log(`\n📝 ${relFromRoot(f.path)} — ${patches.length} patches:`);
    for (const p of patches)
      console.log(`   · ${p.codemodId} @ "${p.nodeName}"${p.headerName ? ' [' + p.headerName + ']' : ''}`);
    if (!args.dryRun) {
      writeFileSync(f.path, JSON.stringify(flow, null, 2), 'utf8');
      console.log(`   ✓ guardado`);
    } else {
      console.log(`   (dry-run — no se escribió)`);
    }
  }
  console.log(`\nResumen: ${totalChanged} archivo(s), ${totalPatches} patch(es).`);
}
