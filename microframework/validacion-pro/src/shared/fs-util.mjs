import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { ROOT } from './paths.mjs';

export function walkJson(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walkJson(p, acc);
    else if (st.isFile() && p.endsWith('.json')) acc.push(p);
  }
  return acc;
}

export function relFromRoot(p) {
  return relative(ROOT, resolve(p)).replace(/\\/g, '/');
}

export function gitCommit() {
  try { return execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); }
  catch { return null; }
}

export function inferCasoEstado(absPath) {
  const rel = relFromRoot(absPath);
  let caso = null, estado = null;
  const m = rel.match(/^casos-de-estudio\/([^\/]+)\/([^\/]+)\//);
  if (m) {
    caso = m[1];
    if (m[2] === 'as-is' || m[2] === 'to-be') estado = m[2];
  } else if (rel.startsWith('microframework/plantillas/')) {
    caso = 'plantilla';
    estado = /as-is/i.test(rel) ? 'as-is' : 'to-be';
  }
  return { caso, estado };
}
