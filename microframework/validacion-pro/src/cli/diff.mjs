import { readFileSync } from 'node:fs';
import { relFromRoot } from '../shared/fs-util.mjs';

export async function diff(args) {
  if (!args.current || !args.baseline) {
    console.error('Uso: n8nmf diff --current <a.json> --baseline <b.json>');
    process.exit(2);
  }
  const cur = JSON.parse(readFileSync(args.current, 'utf8'));
  const base = JSON.parse(readFileSync(args.baseline, 'utf8'));
  const cF = flatten(cur), bF = flatten(base);
  const key = f => `${f._file}::${f.ruleId}::${f.nodeName || ''}::${f.message}`;
  const cMap = new Map(cF.map(f => [key(f), f]));
  const bMap = new Map(bF.map(f => [key(f), f]));
  const nuevos = cF.filter(f => !bMap.has(key(f)));
  const resueltos = bF.filter(f => !cMap.has(key(f)));
  console.log(`\nDiff:`);
  console.log(`  🆕 Nuevos:     ${nuevos.length}`);
  console.log(`  ✅ Resueltos:  ${resueltos.length}`);
  for (const [tag, arr] of [['🆕 Nuevos', nuevos], ['✅ Resueltos', resueltos]]) {
    if (!arr.length) continue;
    console.log(`\n${tag}:`);
    for (const f of arr) console.log(`  · ${f.ruleId} · ${f._file} · ${f.nodeName || ''} · ${f.message}`);
  }
  process.exit(nuevos.length > 0 ? 1 : 0);
}

function flatten(report) {
  const out = [];
  for (const f of (report.files || [])) {
    const rel = relFromRoot(f.path);
    for (const fd of f.findings) out.push({ ...fd, _file: rel });
  }
  return out;
}
