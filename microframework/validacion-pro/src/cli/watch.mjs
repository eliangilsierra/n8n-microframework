// Watcher artesanal — polling de mtime cada 1s, sin chokidar.
import { statSync } from 'node:fs';
import { discover } from './discover.mjs';
import { analyze } from './analyze.mjs';

export async function watch(args) {
  console.log('👁  Modo watch (Ctrl+C para salir)');
  const mtimes = new Map();
  const files = discover(args);
  for (const f of files) mtimes.set(f.path, statSync(f.path).mtimeMs);
  while (true) {
    await new Promise(r => setTimeout(r, 1000));
    let changed = false;
    for (const f of discover(args)) {
      const m = statSync(f.path).mtimeMs;
      if (mtimes.get(f.path) !== m) { mtimes.set(f.path, m); changed = true; }
    }
    if (changed) {
      console.log('\n🔄 Cambios detectados — re-analizando...');
      try { await analyze({ ...args, strict: false }); } catch {}
    }
  }
}
