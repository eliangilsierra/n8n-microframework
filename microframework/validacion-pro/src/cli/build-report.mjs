import { evaluateFile, computeCoverage } from '../engine.mjs';
import { loadDslRules } from '../rules/dsl-loader.mjs';
import { gitCommit } from '../shared/fs-util.mjs';
import { TOOL, VERSION, EDITION } from '../shared/paths.mjs';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export async function buildReport(files, args) {
  const customRules = args.rulesDir ? await loadDslRules(args.rulesDir) : [];
  const reports = files.map(f => evaluateFile(f, customRules));
  const coverage = computeCoverage(reports, customRules);
  return {
    tool: TOOL, version: VERSION, edition: EDITION,
    generatedAt: new Date().toISOString(),
    commit: gitCommit(),
    author: 'Elian Hernando Gil Sierra',
    director: 'Sebastian Roa Prada, PhD',
    project: 'Micro-framework LC/NC para n8n — MGADS UNAB 2026',
    customRulesLoaded: customRules.length,
    files: reports, coverage,
    history: loadHistory(args.out)
  };
}

function loadHistory(outDir) {
  const dir = outDir || join(process.cwd(), 'reportes');
  if (!existsSync(dir)) return [];
  const items = [];
  for (const f of readdirSync(dir)) {
    if (!/^validacion-\d{4}-\d{2}-\d{2}\.json$/.test(f)) continue;
    try {
      const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const errs = (r.files || []).reduce((a, x) => a + (x.summary?.errors || 0), 0);
      const score = (r.files || []).length === 0 ? 0
        : Math.round(r.files.reduce((a, x) => a + (x.summary?.score || 0), 0) / r.files.length);
      items.push({ date: f.slice(11, 21), score, errors: errs });
    } catch {}
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}
