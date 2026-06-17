import { existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT } from '../shared/paths.mjs';
import { walkJson, inferCasoEstado } from '../shared/fs-util.mjs';

export function discover(args) {
  const files = [];
  const push = (p) => {
    const abs = resolve(p);
    if (!existsSync(abs)) return;
    if (statSync(abs).isDirectory())
      for (const j of walkJson(abs)) files.push({ path: j, ...inferCasoEstado(j) });
    else if (abs.endsWith('.json'))
      files.push({ path: abs, ...inferCasoEstado(abs) });
  };
  if (args.paths.length > 0) {
    for (const p of args.paths) push(p);
  } else {
    const casosDir = join(ROOT, 'casos-de-estudio');
    if (existsSync(casosDir)) {
      for (const caso of readdirSync(casosDir)) {
        if (args.caso && caso !== args.caso) continue;
        const cDir = join(casosDir, caso);
        if (!statSync(cDir).isDirectory()) continue;
        for (const estado of ['as-is', 'to-be']) {
          if (args.estado && estado !== args.estado) continue;
          const eDir = join(cDir, estado);
          if (!existsSync(eDir)) continue;
          for (const f of readdirSync(eDir))
            if (f.endsWith('.json')) files.push({ path: join(eDir, f), caso, estado });
        }
      }
    }
    const plant = join(ROOT, 'microframework', 'plantillas');
    if (existsSync(plant) && !args.caso)
      for (const f of readdirSync(plant)) {
        if (!f.endsWith('.json')) continue;
        const estado = /as-is/i.test(f) ? 'as-is' : 'to-be';
        if (args.estado && estado !== args.estado) continue;
        files.push({ path: join(plant, f), caso: 'plantilla', estado });
      }
  }
  return files;
}
