import { analyze } from './analyze.mjs';
import { report } from './report.mjs';
import { diff } from './diff.mjs';
import { fix } from './fix.mjs';
import { watch } from './watch.mjs';
import { VERSION } from '../shared/paths.mjs';
import { setLang, t } from '../shared/i18n.mjs';

function buildHelp() {
  return t('cli.help.text', { version: VERSION });
}

export async function runCli(argv) {
  // El idioma debe activarse antes de imprimir cualquier mensaje, incluida la ayuda.
  setLang(parseArgs(argv.filter(a => a !== '--help' && a !== '-h')).lang);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(buildHelp()); return;
  }
  const sub = argv[0];
  const rest = argv.slice(1);
  const args = parseArgs(rest);
  setLang(args.lang);
  switch (sub) {
    case 'analyze': return analyze(args);
    case 'report':  return report(args);
    case 'diff':    return diff(args);
    case 'fix':     return fix(args);
    case 'watch':   return watch(args);
    default:
      console.error(t('cli.error.unknownSubcommand', { sub }));
      console.log(buildHelp()); process.exit(2);
  }
}

function parseArgs(argv) {
  const out = { paths: [], format: 'md', out: null, baseline: null, current: null,
    rule: [], rulesDir: null, caso: null, estado: null, strict: false, dryRun: false,
    lang: 'es' };
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
    else if (a === '--lang') out.lang = argv[++i];
    else if (!a.startsWith('--')) out.paths.push(a);
  }
  return out;
}
