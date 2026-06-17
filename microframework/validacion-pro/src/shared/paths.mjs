import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PRO_DIR = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const ROOT = dirname(dirname(PRO_DIR));
export const TOOL = 'n8n-microframework-validator';
export const VERSION = '2.0.0';
export const EDITION = 'pro';
export const MAPEO_PATH = join(ROOT, 'microframework', 'validacion', 'mapeo-calidad.json');
export const SCHEMA_PATH = join(ROOT, 'microframework', 'validacion', 'report.schema.json');
