/**
 * Codemod REG-001: reemplaza headers x-api-key/authorization con valor literal
 * por la expresión n8n {{$env.<VAR>}}. Para asignaciones en jsCode, sugiere
 * en lugar de aplicar (porque renombrar variables Code es riesgoso).
 */
export function envifySecret(flow) {
  const patches = [];
  for (const n of flow.nodes || []) {
    const headers = n.parameters?.headerParameters?.parameters
      || n.parameters?.headers?.parameters;
    if (!Array.isArray(headers)) continue;
    for (const h of headers) {
      const name = String(h.name || '').toLowerCase();
      const value = String(h.value || '');
      if (!['x-api-key', 'authorization', 'api-key', 'x-auth-token'].includes(name)) continue;
      if (value.length <= 6 || /\{\{.*\}\}/.test(value)) continue;
      const envVar = name.toUpperCase().replace(/-/g, '_');
      const before = h.value;
      h.value = `={{ $env.${envVar} }}`;
      patches.push({
        nodeName: n.name,
        headerName: h.name,
        before, after: h.value
      });
    }
  }
  return { patches };
}
