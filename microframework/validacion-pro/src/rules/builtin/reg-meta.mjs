// REG-010 ADR presente, REG-VOC vocabulario
import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { makeFinding } from '../helpers.mjs';
import { ROOT } from '../../shared/paths.mjs';
import { t } from '../../shared/i18n.mjs';

export const REG_010 = {
  id: 'REG-010',
  run({ file }) {
    if (file.caso === 'plantilla' || !file.caso) return { na: t('na.reg010.templateOrNoCase') };
    const adrDir = join(ROOT, 'casos-de-estudio', file.caso, 'adr');
    if (!existsSync(adrDir)) return [makeFinding('REG-010', {
      message: t('rule.reg010.noAdrFolder', { caso: file.caso }) })];
    const adrs = readdirSync(adrDir).filter(f => /^ADR-.*\.md$/.test(f));
    if (adrs.length === 0) return [makeFinding('REG-010', {
      message: t('rule.reg010.noAdrFiles') })];
    return [];
  }
};

const VOCAB_PROHIBIDO = [
  { re: /[=:]\s*['"]warning['"]/, correcto: '"advertencia"' },
  { re: /[=:]\s*['"]WARNING['"]/, correcto: '"advertencia"' },
  { re: /[=:]\s*['"]critical['"]/, correcto: '"critico"' },
  { re: /[=:]\s*['"]CRITICAL['"]/, correcto: '"critico"' }
];

export const REG_VOC = {
  id: 'REG-VOC',
  run({ graph, file }) {
    if (file.caso === 'plantilla') return { na: t('na.regvoc.template') };
    if (file.estado && file.estado !== 'to-be') return { na: t('na.regvoc.onlyToBe') };
    const out = [];
    for (const n of graph.nodes.filter(n => /code|function/i.test(n.type))) {
      const src = String(n.parameters?.jsCode || n.parameters?.functionCode || '');
      if (!src) continue;
      for (const v of VOCAB_PROHIBIDO) {
        const m = src.match(v.re);
        if (m) out.push(makeFinding('REG-VOC', {
          nodeId: n.id, nodeName: n.name, position: n.position,
          message: t('rule.regvoc.englishVocab', { correct: v.correcto }),
          evidence: m[0] }));
      }
    }
    return out;
  }
};
