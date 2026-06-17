import { readFileSync } from 'node:fs';

export function parseFlow(path) {
  try {
    return { flow: JSON.parse(readFileSync(path, 'utf8')), error: null };
  } catch (e) {
    return { flow: null, error: e.message };
  }
}
