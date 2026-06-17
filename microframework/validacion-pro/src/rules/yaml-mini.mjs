// Parser YAML mínimo — subset suficiente para el DSL del validador.
// Soporta: mapas anidados con indentación de 2 espacios, listas con `-`,
// strings simples, enteros, booleanos, `null`, comentarios `#`.
// NO soporta: anchors, multi-doc, flow style {…} con anidación, multilines.

export function parseMiniYaml(text) {
  const lines = text.split(/\r?\n/).filter(l => !/^\s*#/.test(l) && l.trim() !== '');
  let i = 0;
  function parseBlock(indent) {
    const result = peekIsList(indent) ? [] : {};
    while (i < lines.length) {
      const line = lines[i];
      const curIndent = line.match(/^ */)[0].length;
      if (curIndent < indent) break;
      if (curIndent > indent) { i++; continue; }
      const trimmed = line.slice(curIndent);
      if (trimmed.startsWith('- ')) {
        const val = trimmed.slice(2).trim();
        i++;
        if (val === '' || val === '|' || val === '>') {
          result.push(parseBlock(indent + 2));
        } else if (val.endsWith(':')) {
          // ítem con sub-claves
          const key = val.slice(0, -1).trim();
          const obj = {};
          obj[key] = parseBlock(indent + 2);
          result.push(obj);
        } else if (/^\w[\w-]*:\s*\S/.test(val)) {
          const [k, ...rest] = val.split(':');
          const obj = {}; obj[k.trim()] = parseScalar(rest.join(':').trim());
          // Continuar leyendo si siguen claves al mismo nivel
          while (i < lines.length) {
            const nl = lines[i];
            const ni = nl.match(/^ */)[0].length;
            if (ni !== indent + 2) break;
            const nt = nl.slice(ni);
            if (nt.startsWith('- ')) break;
            const [nk, ...nr] = nt.split(':');
            const nv = nr.join(':').trim();
            obj[nk.trim()] = nv === '' ? parseBlock(indent + 4) : parseScalar(nv);
            if (nv !== '') i++;
          }
          result.push(obj);
        } else {
          result.push(parseScalar(val));
        }
      } else {
        const idx = trimmed.indexOf(':');
        if (idx < 0) { i++; continue; }
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        i++;
        if (val === '') {
          result[key] = parseBlock(indent + 2);
        } else if (val.startsWith('[') && val.endsWith(']')) {
          result[key] = val.slice(1, -1).split(',').map(s => parseScalar(s.trim())).filter(s => s !== '');
        } else {
          result[key] = parseScalar(val);
        }
      }
    }
    return result;
  }
  function peekIsList(indent) {
    if (i >= lines.length) return false;
    const line = lines[i];
    const ci = line.match(/^ */)[0].length;
    return ci === indent && line.slice(ci).startsWith('- ');
  }
  function parseScalar(s) {
    if (s === '' || s === 'null' || s === '~') return null;
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^-?\d+$/.test(s)) return Number(s);
    if (/^-?\d+\.\d+$/.test(s)) return Number(s);
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
      return s.slice(1, -1);
    return s;
  }
  return parseBlock(0);
}
