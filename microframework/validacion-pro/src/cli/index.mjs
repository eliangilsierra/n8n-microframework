import { analyze } from './analyze.mjs';
import { report } from './report.mjs';
import { diff } from './diff.mjs';
import { fix } from './fix.mjs';
import { watch } from './watch.mjs';
import { VERSION } from '../shared/paths.mjs';

const HELP = `n8nmf v${VERSION} — validador estático n8n (edición Pro)

Subcomandos:
  analyze [path...]                Analiza y muestra resumen + exit code
  report  [path...] --format X     Genera reporte (md|json|html|sarif|junit)
  diff    --current J --baseline J Compara dos reportes JSON
  fix     [path...] --rule REG-X   Aplica codemods (use --dry-run para previsualizar)
  watch   [path...]                Re-analiza al detectar cambios (mtime polling 1s)

Flags comunes:
  --caso bot|iot                  Filtra por caso
  --estado as-is|to-be            Filtra por estado
  --rules-dir <dir>               Carga reglas YAML del usuario adicionales
  --out <dir>                     Carpeta para artefactos
  --strict                        Exit 1 también en warnings
  --help, -h                      Esta ayuda
`;

export async function runCli(argv) {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP); return;
  }
  const sub = argv[0];
  const rest = argv.slice(1);
  const args = parseArgs(rest);
  switch (sub) {
    case 'analyze': return analyze(args);
    case 'report':  return report(args);
    case 'diff':    return diff(args);
    case 'fix':     return fix(args);
    case 'watch':   return watch(args);
    default:
      console.error(`Subcomando desconocido: ${sub}`);
      console.log(HELP); process.exit(2);
  }
}

function parseArgs(argv) {
  const out = { paths: [], format: 'md', out: null, baseline: null, current: null,
    rule: [], rulesDir: null, caso: null, estado: null, strict: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--format') out.format = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--baseline') out.baseline = argv[++i];
    else if (a === '--current') out.current = argv[++i];
    else if (a === '--rule') out.rule.push(...argv[++i].split(','));
    else if (a === '--rules-dir') out.rulesDir = argv[++i];
    else if (a === '--caso') out.caso = argv[++i];
    else if (a === '--estado') out.estado = argv[++i];
    else if (a === '--strict') out.strict = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (!a.startsWith('--')) out.paths.push(a);
  }
  return out;
}
