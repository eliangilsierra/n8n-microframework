#!/usr/bin/env node
/* ============================================================================
 *  Test runner artesanal — sin dependencias externas.
 *
 *  Para cada subcarpeta de fixtures/ con un flow.json y expected.json:
 *    - Ejecuta el validador en formato JSON contra flow.json
 *    - Valida que los ruleId en shouldFail aparezcan como findings
 *    - Valida que los ruleId en shouldPass NO aparezcan como findings
 *
 *  Uso:
 *    node microframework/validacion/tests/run-tests.mjs
 * ========================================================================= */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures');
const VALIDATOR = join(HERE, '..', 'validar-flujos.mjs');

const RESET = '\x1b[0m', GREEN = '\x1b[32m', RED = '\x1b[31m', GRAY = '\x1b[90m', BOLD = '\x1b[1m';

let pass = 0, fail = 0;
const failures = [];

function runValidator(flowPath) {
  const tmpDir = join(HERE, 'tmp');
  try {
    execSync(
      `node "${VALIDATOR}" --input "${flowPath}" --format json --quiet --out "${tmpDir}"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch (e) {
    // exit code 1 esperado cuando un fixture tiene errors — el archivo se escribió igual
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const reportPath = join(tmpDir, `validacion-${stamp}.json`);
  return JSON.parse(readFileSync(reportPath, 'utf8'));
}

function runOne(name) {
  const dir = join(FIXTURES, name);
  const flow = join(dir, 'flow.json');
  const expectedPath = join(dir, 'expected.json');
  if (!existsSync(flow) || !existsSync(expectedPath)) return;
  const expected = JSON.parse(readFileSync(expectedPath, 'utf8'));
  let report;
  try {
    report = runValidator(flow);
  } catch (e) {
    fail++; failures.push({ name, msg: `Error ejecutando validador: ${e.message}` });
    return;
  }
  const file = (report.files || [])[0];
  if (!file) { fail++; failures.push({ name, msg: 'sin file en report' }); return; }
  const ruleIds = new Set(file.findings.map(f => f.ruleId));

  const errors = [];
  for (const rid of (expected.shouldFail || [])) {
    if (!ruleIds.has(rid)) errors.push(`esperaba finding ${rid} pero no apareció`);
  }
  for (const rid of (expected.shouldPass || [])) {
    if (ruleIds.has(rid)) errors.push(`esperaba ${rid} sin findings pero apareció`);
  }
  if (errors.length === 0) {
    pass++;
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } else {
    fail++;
    failures.push({ name, msg: errors.join(' · ') });
    console.log(`  ${RED}✗${RESET} ${name} — ${errors.join(' · ')}`);
  }
}

console.log(`${BOLD}Test runner — validador estático (Lite)${RESET}`);
console.log(`${GRAY}Fixtures en ${FIXTURES}${RESET}\n`);

if (!existsSync(FIXTURES)) {
  console.error('No existe carpeta fixtures/'); process.exit(1);
}

const names = readdirSync(FIXTURES).filter(n =>
  statSync(join(FIXTURES, n)).isDirectory());
for (const n of names) runOne(n);

console.log('');
console.log(`${BOLD}Resultado:${RESET} ${GREEN}${pass} pass${RESET}  ${fail > 0 ? RED : GRAY}${fail} fail${RESET}`);
if (failures.length) {
  console.log('');
  for (const f of failures) console.log(`  ${RED}✗${RESET} ${f.name}: ${f.msg}`);
}
process.exit(fail > 0 ? 1 : 0);
