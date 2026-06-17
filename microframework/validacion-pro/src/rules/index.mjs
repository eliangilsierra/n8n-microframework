import * as secrets from './builtin/reg-secrets.mjs';
import { REG_002, REG_003, REG_006 } from './builtin/reg-runtime.mjs';
import { REG_004, REG_005, REG_007, REG_008, REG_009 } from './builtin/reg-integraciones.mjs';
import { REG_010, REG_VOC } from './builtin/reg-meta.mjs';
import { AP_001, AP_002, AP_003, AP_004, AP_005, AP_006 } from './builtin/antipatrones.mjs';

export const BUILTIN_RULES = [
  { id: secrets.id, run: secrets.run },
  REG_002, REG_003, REG_004, REG_005, REG_006,
  REG_007, REG_008, REG_009, REG_010, REG_VOC,
  AP_001, AP_002, AP_003, AP_004, AP_005, AP_006
];

export function getAllRules(customRules = []) {
  return [...BUILTIN_RULES, ...customRules];
}
