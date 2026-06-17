export const IO_TYPES = [
  'httprequest', 'postgres', 'mysql', 'mongodb', 'redis', 'kafka', 'mqtt',
  'rabbitmq', 'sendgrid', 'mailjet', 'slack', 'telegram', 'discord', 'ftp', 's3'
];

export function isIoType(type) {
  const t = (type || '').toLowerCase();
  return IO_TYPES.some(io => t.includes(io));
}

export function nodeHasIoSignal(node) {
  const t = (node.type || '').toLowerCase();
  if (isIoType(t)) return true;
  if (t.includes('code') || t.includes('function')) {
    const src = String(node.parameters?.jsCode || node.parameters?.functionCode || '');
    if (/\b(fetch|axios|request|http\.(get|post)|pg\.|new Client)\b/.test(src)) return true;
  }
  return false;
}

export function classifyStage(node) {
  const t = (node.type || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  let stage = 'UNKNOWN', inferred = true;
  if (/-e1\b/.test(name) || /\be1\b/.test(name)) { stage = 'E1'; inferred = false; }
  else if (/-e2\b/.test(name) || /\be2\b/.test(name)) { stage = 'E2'; inferred = false; }
  else if (/-e3\b/.test(name) || /\be3\b/.test(name)) { stage = 'E3'; inferred = false; }
  else if (/-e4\b/.test(name) || /\be4\b/.test(name)) { stage = 'E4'; inferred = false; }
  else if (t.includes('webhook') && !t.includes('respond')) stage = 'E1';
  else if (t.includes('trigger')) stage = 'E1';
  else if (t.includes('respondtowebhook')) stage = 'E4';
  else if (t.includes('executeworkflow')) stage = 'UNKNOWN';
  else if (isIoType(t)) stage = 'E3';
  else if (t.includes('code') || t.includes('function')) {
    stage = nodeHasIoSignal(node) ? 'E3' : 'E2';
  } else if (t.includes('set') || t.includes('if') || t.includes('switch') ||
             t.includes('merge') || t.includes('itemlists')) {
    stage = 'E2';
  }
  return { stage, inferred };
}

export function annotateStages(graph) {
  for (const n of graph.nodes) {
    const { stage, inferred } = classifyStage(n);
    n.stage = stage; n.stageInferred = inferred;
  }
}
