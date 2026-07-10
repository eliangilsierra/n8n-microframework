// Render HTML "Pro" — Tailwind CDN + Chart.js CDN.
// Grafo interactivo: SVG propio con posiciones reales de n8n + click-en-nodo.
// Para offline usar la Edición Lite (validar-flujos.mjs --format html).
import { relFromRoot } from '../shared/fs-util.mjs';
import { TOOL, VERSION } from '../shared/paths.mjs';
import { t, getLang } from '../shared/i18n.mjs';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}

function badge(sev) {
  const cls = sev === 'error'   ? 'badge-err'
            : sev === 'warning' ? 'badge-warn'
            : 'badge-info';
  return `<span class="badge ${cls}">${esc(sev)}</span>`;
}

function scoreColor(s) {
  return s >= 90 ? 'color:var(--ok)' : s >= 70 ? 'color:var(--warn)' : 'color:var(--err)';
}

export function renderHtml(report) {
  const totalErr     = report.files.reduce((a, f) => a + f.summary.errors,   0);
  const totalWarn    = report.files.reduce((a, f) => a + f.summary.warnings, 0);
  const totalFindings= report.files.reduce((a, f) => a + f.findings.length,  0);
  const avgScore     = report.files.length === 0 ? 100
    : Math.round(report.files.reduce((a, f) => a + f.summary.score, 0) / report.files.length);

  // ── Todas las findings aplanadas ──────────────────────────────────────────
  const allFindings = [];
  for (const f of report.files) {
    const rel = relFromRoot(f.path);
    for (const fd of f.findings) allFindings.push({ ...fd, _file: rel, _estado: f.estado });
  }

  // ── Tabla global ──────────────────────────────────────────────────────────
  const tableRows = allFindings.map(fd => `
    <tr data-sev="${esc(fd.severity)}">
      <td>${badge(fd.severity)}</td>
      <td class="mono sky">${esc(fd.ruleId)}</td>
      <td>${esc(fd.ruleName || '')}</td>
      <td><code class="mono xs muted">${esc(fd._file)}</code></td>
      <td>${esc(fd.nodeName || '–')}</td>
      <td>${esc(fd.message)}</td>
      <td class="tags">${(fd.iso25010||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</td>
      <td class="tags">${(fd.atamScenarios||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</td>
    </tr>`).join('');

  // ── Secciones por flujo ───────────────────────────────────────────────────
  const fileSections = report.files.map((f, i) => {
    const rel = relFromRoot(f.path);
    const sd  = f.metrics.stageDistribution || {};
    const chips = ['E1','E2','E3','E4','UNKNOWN'].map(s => {
      const col = {E1:'e1',E2:'e2',E3:'e3',E4:'e4',UNKNOWN:'unk'}[s];
      return `<span class="badge badge-${col}">${s}·${sd[s]??0}</span>`;
    }).join('');
    const sc = f.summary.score;
    return `
<details ${f.summary.errors > 0 ? 'open' : ''} class="flow-detail">
  <summary>
    <span style="${scoreColor(sc)};font-size:20px;font-weight:700">${sc}%</span>
    <code class="xs muted" style="margin-left:8px">${esc(rel)}</code>
    <span style="margin-left:auto;display:flex;gap:8px;font-size:12px">
      <span style="color:var(--err)">E:${f.summary.errors}</span>
      <span style="color:var(--warn)">W:${f.summary.warnings}</span>
      <span style="color:var(--mut)">I:${f.summary.infos}</span>
    </span>
  </summary>
  <div class="flow-meta">
    ${chips}
    <span class="metric">nodos: <strong>${f.metrics.nodeCount}</strong></span>
    <span class="metric">aristas: <strong>${f.metrics.edgeCount}</strong></span>
    <span class="metric">ciclomática: <strong>${f.metrics.cyclomaticComplexity}</strong></span>
    <span class="metric">profundidad: <strong>${f.metrics.maxDepth}</strong></span>
    <span class="metric">cohesión: <strong>${(f.metrics.cohesionScore*100).toFixed(0)}%</strong></span>
  </div>
  <div class="flow-grid">
    <div>
      <p class="xs muted" style="margin:0 0 6px">${t('report.html.graphHint')}</p>
      <svg id="svg-${i}" class="flow-svg" width="100%" height="360"></svg>
    </div>
    <div id="panel-${i}" class="finding finding-info">
      <p class="muted">${t('report.html.clickHint')}</p>
    </div>
  </div>
  ${f.findings.length === 0
    ? `<p style="color:var(--ok);margin-top:8px">${t('report.html.noFindingsInFlow')}</p>`
    : `<h4 style="margin:16px 0 8px">${t('report.html.allFindingsHeading', { count: f.findings.length })}</h4>
       ${f.findings.map(fd => `
       <div class="finding finding-${fd.severity}">
         <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
           ${badge(fd.severity)}
           <strong class="mono">${esc(fd.ruleId)}</strong>
           <span>${esc(fd.ruleName||'')}</span>
           ${fd.nodeName ? `<span class="muted xs">@ ${esc(fd.nodeName)}</span>` : ''}
           ${fd.confidence ? `<span class="muted xs">${t('report.html.confidenceLabel', { value: fd.confidence })}</span>` : ''}
         </div>
         <p style="margin:0 0 4px">${esc(fd.message)}</p>
         ${fd.evidence ? `<pre>${esc(fd.evidence)}</pre>` : ''}
         <div class="tags" style="margin-top:6px">
           ${fd.iso25010?.length ? `<span class="muted xs">${t('report.html.thIso')}: ${fd.iso25010.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</span>` : ''}
           ${fd.atamScenarios?.length ? `<span class="muted xs" style="margin-left:10px">${t('report.html.thAtam')}: ${fd.atamScenarios.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</span>` : ''}
           ${fd.adr?.length ? `<span class="muted xs" style="margin-left:10px">ADR: ${fd.adr.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</span>` : ''}
         </div>
         ${fd.fixSuggestion?.preview ? `<p style="color:var(--ok);font-size:12px;margin:4px 0 0">💡 ${esc(fd.fixSuggestion.preview)}</p>` : ''}
       </div>`).join('')}`}
</details>`;
  }).join('\n');

  // ── Cobertura ─────────────────────────────────────────────────────────────
  const cov    = report.coverage;
  const covPct = cov.rulesDefined.length === 0 ? 0
    : Math.round((cov.rulesExercised.length / cov.rulesDefined.length) * 100);
  const covChips = cov.rulesDefined.map(r => {
    const ok = cov.rulesExercised.includes(r);
    return `<span class="tag" style="${ok ? 'color:var(--ok);border-color:var(--ok)' : 'opacity:.5;text-decoration:line-through'}">${esc(r)}</span>`;
  }).join('');

  // ── Datos para Chart.js ───────────────────────────────────────────────────
  const attrs = ['security','reliability','maintainability','performanceEfficiency','functionalSuitability','usability'];
  const counts = {}; for (const a of attrs) counts[a] = 0;
  for (const f of report.files) for (const fd of f.findings) for (const a of (fd.iso25010||[]))
    if (counts[a] !== undefined) counts[a]++;

  const radarLabelsMap = {};
  for (const a of attrs) radarLabelsMap[a] = t(`report.html.radarLabels.${a}`);

  const dataJson = JSON.stringify({
    files: report.files.map(f => ({
      ...f,
      path: relFromRoot(f.path)
    })),
    history: report.history || [],
    radarAttrs: attrs,
    radarCounts: counts,
    radarLabelsMap,
    allFindings,
    labels: {
      radarDatasetLabel: t('report.html.radarDatasetLabel'),
      sparklineScoreLabel: t('report.html.sparklineScoreLabel'),
      sparklineErrorsLabel: t('report.html.sparklineErrorsLabel'),
      noHistory: t('report.html.noHistory'),
      resultsCountSingular: t('report.html.resultsCountSingular'),
      resultsCountPlural: t('report.html.resultsCountPlural'),
      csvHeaders: t('report.html.csvHeaders'),
      noNodes: t('report.html.js.noNodes'),
      noFindingsInNode: t('report.html.js.noFindingsInNode'),
      thIso: t('report.html.thIso'),
      thAtam: t('report.html.thAtam')
    }
  }).replace(/<\/script>/g, '<\\/script>');

  return `<!doctype html>
<html lang="${getLang()}">
<head>
<meta charset="utf-8"/>
<title>${t('report.html.title')}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
:root{
  --bg:#0f172a;--bg2:#1e293b;--panel:#0b1220;--text:#e2e8f0;--mut:#94a3b8;
  --acc:#38bdf8;--ok:#22c55e;--warn:#fbbf24;--err:#ef4444;--info:#a78bfa;
  --e1:#3b82f6;--e2:#10b981;--e3:#f59e0b;--e4:#a855f7;--unk:#64748b;
  --border:#1e293b;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  font-size:14px;line-height:1.5}
.container{max-width:1280px;margin:0 auto;padding:24px}
.card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;
  padding:20px;margin:16px 0;box-shadow:0 1px 3px rgba(0,0,0,.3)}
h1{font-size:28px;margin:0 0 8px;letter-spacing:-.02em}
h2{font-size:20px;margin:20px 0 10px;color:var(--acc)}
h3{font-size:15px;margin:12px 0 6px}
h4{font-size:14px;margin:12px 0 6px;color:var(--mut)}
p{margin:6px 0}
.muted{color:var(--mut)}
.xs{font-size:12px}
.mono{font-family:ui-monospace,monospace}
.sky{color:var(--acc)}
/* portada */
.cover{background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid var(--border);
  border-radius:16px;padding:36px;margin-bottom:20px}
.cover h1{font-size:32px}
.meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;
  margin-top:20px;padding-top:20px;border-top:1px solid var(--border)}
.meta-cell .label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut)}
.meta-cell .value{font-size:14px;font-weight:600;margin-top:2px}
/* kpis */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.kpi{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center}
.kpi .kv{font-size:32px;font-weight:700;line-height:1}
.kpi .kl{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);margin-top:6px}
/* badge */
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;
  font-weight:700;border:1px solid currentColor;margin-right:4px}
.badge-err{color:var(--err)} .badge-warn{color:var(--warn)}
.badge-info{color:var(--info)}
.badge-e1{color:var(--e1)} .badge-e2{color:var(--e2)}
.badge-e3{color:var(--e3)} .badge-e4{color:var(--e4)} .badge-unk{color:var(--unk)}
/* tag */
.tag{display:inline-block;background:var(--panel);border:1px solid var(--border);
  border-radius:4px;padding:1px 6px;font-size:11px;margin:2px 3px 2px 0;color:var(--mut)}
.tags{display:flex;flex-wrap:wrap;align-items:center;gap:2px}
/* findings */
.finding{background:var(--panel);border-left:3px solid var(--mut);
  padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0}
.finding pre{background:#020617;color:#bae6fd;padding:8px;border-radius:6px;
  font-size:12px;overflow-x:auto;margin:6px 0;white-space:pre-wrap;word-break:break-all}
.finding-error{border-left-color:var(--err);background:rgba(239,68,68,.06)}
.finding-warning{border-left-color:var(--warn);background:rgba(251,191,36,.04)}
.finding-info{border-left-color:var(--info);background:rgba(167,139,250,.04)}
/* tabla */
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid var(--border)}
th{background:var(--panel);color:var(--mut);font-weight:600;cursor:pointer;user-select:none;white-space:nowrap}
th:hover{color:var(--acc)}
th.sort-asc::after{content:" ▲"}
th.sort-desc::after{content:" ▼"}
tr:hover{background:rgba(56,189,248,.04)}
.controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center}
.controls input,.controls select{background:var(--panel);color:var(--text);
  border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:13px}
.controls input:focus,.controls select:focus{outline:2px solid var(--acc);border-color:var(--acc)}
.controls button{background:var(--acc);color:#0f172a;border:0;border-radius:6px;
  padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer}
.controls button:hover{opacity:.9}
/* flow */
.flow-detail{margin:8px 0;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.flow-detail>summary{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:12px 16px;cursor:pointer;font-weight:600;color:var(--acc);
  background:var(--bg2)}
.flow-detail>summary:hover{background:var(--panel)}
.flow-detail>summary::marker,.flow-detail>summary::-webkit-details-marker{color:var(--acc)}
.flow-meta{display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;
  border-bottom:1px solid var(--border);background:var(--panel);font-size:12px}
.metric{color:var(--mut)} .metric strong{color:var(--text)}
.flow-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px 16px}
@media(max-width:900px){.flow-grid{grid-template-columns:1fr}}
.flow-svg{background:var(--panel);border-radius:8px;border:1px solid var(--border);
  display:block;max-width:100%;height:auto}
.node-e1{fill:var(--e1)} .node-e2{fill:var(--e2)} .node-e3{fill:var(--e3)}
.node-e4{fill:var(--e4)} .node-unk{fill:var(--unk)}
.node-hot{stroke:var(--err);stroke-width:3px;stroke-dasharray:4 2}
.node-warn{stroke:var(--warn);stroke-width:2.5px;stroke-dasharray:4 2}
.edge{stroke:#475569;stroke-width:1.5px;fill:none;marker-end:url(#arrow)}
.edge.error-branch{stroke:var(--err);stroke-dasharray:4 4}
.node-label{font-size:10px;fill:#e2e8f0;pointer-events:none}
/* legend */
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mut);margin:8px 0}
.legend .sw{display:inline-block;width:12px;height:12px;border-radius:3px;
  margin-right:4px;vertical-align:middle}
/* progress */
.progress-track{background:var(--panel);border-radius:4px;height:18px;overflow:hidden;
  border:1px solid var(--border);margin:8px 0}
.progress-fill{height:100%;background:linear-gradient(90deg,#22c55e,#38bdf8);transition:width .4s}
/* charts */
.chart-pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
@media(max-width:900px){.chart-pair{grid-template-columns:1fr}}
.chart-box{background:var(--panel);border:1px solid var(--border);border-radius:10px;
  padding:16px;display:flex;flex-direction:column;align-items:center}
.chart-box h3{margin:0 0 12px;color:var(--acc);align-self:flex-start}
/* print */
@media print{
  body{background:#fff;color:#000}
  .card,.cover,.kpi,.flow-detail,.finding{background:#fff!important;border:1px solid #ccc!important;color:#000!important}
  h1,h2,h3{color:#000} .muted{color:#444} .cover h1{font-size:24px}
  .flow-svg{background:#fff;border:1px solid #ccc}
  details{display:block}
  .controls{display:none}
}
</style>
</head>
<body>
<div class="container">

  <!-- PORTADA -->
  <div class="cover">
    <h1>${t('report.html.h1')}</h1>
    <p class="muted">${t('report.html.subtitle', { version: VERSION })}</p>
    <div class="meta-grid">
      <div class="meta-cell"><div class="label">${t('report.html.author')}</div><div class="value">${esc(report.author)}</div></div>
      <div class="meta-cell"><div class="label">${t('report.html.director')}</div><div class="value">${esc(report.director)}</div></div>
      <div class="meta-cell"><div class="label">${t('report.html.project')}</div><div class="value" style="font-size:12px">${esc(report.project)}</div></div>
      <div class="meta-cell"><div class="label">${t('report.html.generated')}</div><div class="value">${esc(report.generatedAt)}</div></div>
      ${report.commit ? `<div class="meta-cell"><div class="label">${t('report.html.commit')}</div><div class="value mono" style="font-size:13px;color:var(--acc)">${esc(report.commit.slice(0,12))}</div></div>` : ''}
      <div class="meta-cell"><div class="label">${t('report.html.filesAnalyzed')}</div><div class="value">${report.files.length}</div></div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="card">
    <h2>${t('report.html.summaryHeading')}</h2>
    <div class="kpi-grid">
      <div class="kpi"><div class="kv">${report.files.length}</div><div class="kl">${t('report.html.kpiFiles')}</div></div>
      <div class="kpi"><div class="kv" style="${scoreColor(avgScore)}">${avgScore}%</div><div class="kl">${t('report.html.kpiAvgScore')}</div></div>
      <div class="kpi"><div class="kv" style="color:var(--err)">${totalErr}</div><div class="kl">${t('report.html.kpiErrors')}</div></div>
      <div class="kpi"><div class="kv" style="color:var(--warn)">${totalWarn}</div><div class="kl">${t('report.html.kpiWarnings')}</div></div>
      <div class="kpi"><div class="kv">${totalFindings}</div><div class="kl">${t('report.html.kpiTotalFindings')}</div></div>
      <div class="kpi"><div class="kv" style="${cov.rulesDormant.length > 0 ? 'color:var(--warn)' : 'color:var(--ok)'}">${cov.rulesDormant.length}</div><div class="kl">${t('report.html.kpiDormantRules')}</div></div>
    </div>
  </div>

  <!-- RADAR + SPARKLINE -->
  <div class="card">
    <div class="chart-pair">
      <div class="chart-box">
        <h3>${t('report.html.radarHeading')}</h3>
        <p class="muted xs" style="align-self:flex-start;margin:0 0 10px">${t('report.html.radarDesc')}</p>
        <canvas id="radar" width="320" height="320"></canvas>
      </div>
      <div class="chart-box">
        <h3>${t('report.html.historyHeading')}</h3>
        <p class="muted xs" style="align-self:flex-start;margin:0 0 10px">${t('report.html.historyDesc')}</p>
        <canvas id="sparkline" style="max-height:280px;width:100%"></canvas>
      </div>
    </div>
  </div>

  <!-- COBERTURA -->
  <div class="card">
    <h2>${t('report.html.coverageHeading')}</h2>
    <p class="muted">${t('report.html.coverageDesc', { defined: cov.rulesDefined.length, exercised: cov.rulesExercised.length, dormant: cov.rulesDormant.length })}</p>
    <div class="progress-track"><div class="progress-fill" style="width:${covPct}%"></div></div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:10px">${t('report.html.coverageExercised', { exercised: cov.rulesExercised.length, defined: cov.rulesDefined.length, pct: covPct })}</div>
    <div class="tags">${covChips}</div>
    ${cov.rulesDormant.length > 0
      ? `<p class="xs" style="color:var(--warn);margin-top:10px">${t('report.html.dormantWarning')} ${cov.rulesDormant.map(r=>`<span class="tag">${esc(r)}</span>`).join('')}</p>`
      : `<p class="xs" style="color:var(--ok);margin-top:10px">${t('report.html.allRulesExercised')}</p>`}
  </div>

  <!-- TABLA DE FINDINGS -->
  <div class="card">
    <h2>${t('report.html.findingsTableHeading')}</h2>
    <div class="controls">
      <input id="tbl-findings-q" placeholder="${t('report.html.searchPlaceholder')}" style="flex:1;min-width:200px"/>
      <select id="tbl-findings-sev">
        <option value="">${t('report.html.allSeverities')}</option>
        <option value="error">${t('report.html.onlyErrors')}</option>
        <option value="warning">${t('report.html.onlyWarnings')}</option>
        <option value="info">${t('report.html.onlyInfos')}</option>
      </select>
      <button id="tbl-findings-csv">${t('report.html.exportCsv')}</button>
      <span id="tbl-count" class="muted xs"></span>
    </div>
    <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--border)">
      <table id="tbl-findings">
        <thead><tr>
          <th data-col="0">${t('report.html.thSev')}</th>
          <th data-col="1">${t('report.html.thRule')}</th>
          <th data-col="2">${t('report.html.thName')}</th>
          <th data-col="3">${t('report.html.thFile')}</th>
          <th data-col="4">${t('report.html.thNode')}</th>
          <th data-col="5">${t('report.html.thMessage')}</th>
          <th data-col="6">${t('report.html.thIso')}</th>
          <th data-col="7">${t('report.html.thAtam')}</th>
        </tr></thead>
        <tbody>
          ${tableRows || `<tr><td colspan="8" class="muted" style="text-align:center;padding:20px">${t('report.html.noFindingsRow')}</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <!-- DETALLE POR FLUJO -->
  <div class="card">
    <h2>${t('report.html.detailHeading')}</h2>
    <div class="legend">
      <span><span class="sw" style="background:var(--e1)"></span>${t('report.html.legendE1')}</span>
      <span><span class="sw" style="background:var(--e2)"></span>${t('report.html.legendE2')}</span>
      <span><span class="sw" style="background:var(--e3)"></span>${t('report.html.legendE3')}</span>
      <span><span class="sw" style="background:var(--e4)"></span>${t('report.html.legendE4')}</span>
      <span><span class="sw" style="background:var(--unk)"></span>UNKNOWN</span>
      <span style="margin-left:10px">${t('report.html.legendBorderNote')}</span>
    </div>
    ${fileSections}
  </div>

  <!-- ACERCA DE -->
  <div class="card" style="font-size:13px">
    <h2>${t('report.html.aboutHeading')}</h2>
    <p class="muted">${t('report.html.aboutDesc', { tool: TOOL, version: VERSION })}</p>
    <p class="muted">${t('report.html.aboutOffline')}</p>
    <p class="muted">${t('report.html.aboutCommand')}</p>
  </div>

</div><!-- /container -->

<script>window.__DATA__=${dataJson};</script>
<script>
(function(){
  const D = window.__DATA__;
  if(!D) return;

  // ──────────────────────────────────────────────────────────────────────────
  // RADAR ISO 25010
  // ──────────────────────────────────────────────────────────────────────────
  (function(){
    const ctx = document.getElementById('radar');
    if(!ctx) return;
    const labels = D.radarAttrs.map(a=>(D.radarLabelsMap||{})[a]||a);
    new Chart(ctx.getContext('2d'), {
      type:'radar',
      data:{
        labels,
        datasets:[{
          label: D.labels.radarDatasetLabel,
          data: D.radarAttrs.map(a=>D.radarCounts[a]||0),
          backgroundColor:'rgba(56,189,248,0.25)',
          borderColor:'#38bdf8', borderWidth:2,
          pointBackgroundColor:'#38bdf8', pointRadius:4
        }]
      },
      options:{
        responsive:true,
        scales:{r:{
          angleLines:{color:'#334155'}, grid:{color:'#334155'},
          pointLabels:{color:'#cbd5e1',font:{size:11}},
          ticks:{color:'#94a3b8',backdropColor:'transparent',stepSize:1}
        }},
        plugins:{legend:{labels:{color:'#e2e8f0'}}}
      }
    });
  })();

  // ──────────────────────────────────────────────────────────────────────────
  // SPARKLINE HISTÓRICO
  // ──────────────────────────────────────────────────────────────────────────
  (function(){
    const ctx = document.getElementById('sparkline');
    if(!ctx) return;
    const h = D.history || [];
    if(h.length === 0){
      ctx.parentElement.innerHTML += '<p class="muted xs" style="margin-top:12px;text-align:center">'+D.labels.noHistory+'</p>';
      ctx.remove(); return;
    }
    new Chart(ctx.getContext('2d'), {
      type:'line',
      data:{
        labels: h.map(x=>x.date),
        datasets:[
          {
            label: D.labels.sparklineScoreLabel,
            data: h.map(x=>x.score),
            borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,0.1)',
            tension:0.3, fill:true, pointRadius:4,
            pointBackgroundColor:'#38bdf8', yAxisID:'y'
          },
          {
            label: D.labels.sparklineErrorsLabel,
            data: h.map(x=>x.errors),
            borderColor:'#f87171', backgroundColor:'transparent',
            tension:0.3, borderDash:[4,3], pointRadius:3,
            pointBackgroundColor:'#f87171', yAxisID:'y2'
          }
        ]
      },
      options:{
        responsive:true,
        interaction:{mode:'index',intersect:false},
        scales:{
          y:{min:0,max:100,grid:{color:'#334155'},ticks:{color:'#94a3b8',callback:v=>v+'%'}},
          y2:{position:'right',min:0,grid:{drawOnChartArea:false},ticks:{color:'#f87171'}},
          x:{grid:{color:'#1e293b'},ticks:{color:'#94a3b8',maxRotation:45}}
        },
        plugins:{legend:{labels:{color:'#e2e8f0'}}}
      }
    });
  })();

  // ──────────────────────────────────────────────────────────────────────────
  // TABLA FILTRABLE + ORDENACIÓN POR COLUMNA + CSV
  // ──────────────────────────────────────────────────────────────────────────
  (function(){
    const tbl    = document.getElementById('tbl-findings'); if(!tbl) return;
    const input  = document.getElementById('tbl-findings-q');
    const selSev = document.getElementById('tbl-findings-sev');
    const countEl= document.getElementById('tbl-count');
    const tbody  = tbl.querySelector('tbody');
    let sortCol = -1, sortDir = 1;

    function applyFilter(){
      const q = (input.value||'').toLowerCase();
      const s = selSev.value;
      let n = 0;
      for(const tr of tbody.querySelectorAll('tr')){
        const show = (!s || tr.dataset.sev===s) && (!q || tr.textContent.toLowerCase().includes(q));
        tr.style.display = show ? '' : 'none';
        if(show) n++;
      }
      if(countEl) countEl.textContent = (n===1 ? D.labels.resultsCountSingular : D.labels.resultsCountPlural).replace('{n}', n);
    }

    function applySort(col){
      const rows = [...tbody.querySelectorAll('tr')];
      if(sortCol === col) sortDir *= -1; else { sortCol=col; sortDir=1; }
      tbl.querySelectorAll('th').forEach(th=>{
        th.classList.remove('sort-asc','sort-desc');
        if(parseInt(th.dataset.col)===col)
          th.classList.add(sortDir===1?'sort-asc':'sort-desc');
      });
      rows.sort((a,b)=>{
        const at = a.cells[col]?.textContent.trim()||'';
        const bt = b.cells[col]?.textContent.trim()||'';
        return at.localeCompare(bt,'es',{numeric:true})*sortDir;
      });
      for(const r of rows) tbody.appendChild(r);
      applyFilter();
    }

    tbl.querySelectorAll('th[data-col]').forEach(th=>{
      th.addEventListener('click',()=>applySort(parseInt(th.dataset.col)));
    });
    input.addEventListener('input', applyFilter);
    selSev.addEventListener('change', applyFilter);
    applyFilter();

    document.getElementById('tbl-findings-csv')?.addEventListener('click',()=>{
      const rows=[D.labels.csvHeaders];
      for(const fd of (D.allFindings||[])){
        rows.push([fd.severity,fd.ruleId,fd.ruleName||'',fd._file,fd.nodeName||'',
          fd.message,(fd.iso25010||[]).join(';'),(fd.atamScenarios||[]).join(';')]);
      }
      const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\\n');
      const a=document.createElement('a');
      a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
      a.download='findings.csv'; a.click();
    });
  })();

  // ──────────────────────────────────────────────────────────────────────────
  // GRAFO SVG INTERACTIVO CON CLICK-EN-NODO
  // ──────────────────────────────────────────────────────────────────────────
  function escHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g,c=>(
      {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function renderFindingCard(f){
    const tags=(arr)=>arr&&arr.length?arr.map(t=>'<span class="tag">'+escHtml(t)+'</span>').join(''):'';
    return '<div class="finding finding-'+f.severity+'">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
        '<span class="badge badge-'+(f.severity==='error'?'err':f.severity==='warning'?'warn':'info')+'">'+f.severity+'</span>'+
        '<strong class="mono">'+escHtml(f.ruleId)+'</strong> — '+escHtml(f.ruleName||'')+
        (f.nodeName?' <span class="muted xs">@ '+escHtml(f.nodeName)+'</span>':'')+
      '</div>'+
      '<p>'+escHtml(f.message)+'</p>'+
      (f.evidence?'<pre>'+escHtml(f.evidence)+'</pre>':'')+
      (f.iso25010&&f.iso25010.length?'<p class="xs muted">'+D.labels.thIso+': '+tags(f.iso25010)+'</p>':'')+
      (f.atamScenarios&&f.atamScenarios.length?'<p class="xs muted">'+D.labels.thAtam+': '+tags(f.atamScenarios)+'</p>':'')+
      (f.adr&&f.adr.length?'<p class="xs muted">ADR: '+tags(f.adr)+'</p>':'')+
      (f.fixSuggestion&&f.fixSuggestion.preview?'<p style="color:var(--ok);font-size:12px;margin-top:4px">💡 '+escHtml(f.fixSuggestion.preview)+'</p>':'')+
      '</div>';
  }

  function renderFlow(file, svgId, panelId){
    const svg   = document.getElementById(svgId);   if(!svg)   return;
    const panel = document.getElementById(panelId); if(!panel) return;
    const nodes = file.graph.nodes;
    if(!nodes||nodes.length===0){
      svg.innerHTML='<text x="20" y="40" fill="#94a3b8">'+D.labels.noNodes+'</text>'; return;
    }
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const n of nodes){
      const [x,y]=n.position||[0,0];
      if(x<minX)minX=x; if(y<minY)minY=y;
      if(x>maxX)maxX=x; if(y>maxY)maxY=y;
    }
    const padX=80,padY=60;
    const W=Math.max(600,maxX-minX+padX*2+100);
    const H=Math.max(280,maxY-minY+padY*2+40);
    svg.setAttribute('viewBox','0 0 '+W+' '+H);

    const findingsByNode={};
    for(const f of (file.findings||[])){
      if(!f.nodeId) continue;
      (findingsByNode[f.nodeId]=findingsByNode[f.nodeId]||[]).push(f);
    }
    const nodeById={};
    for(const n of nodes) nodeById[n.id]=n;

    let html='<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" '+
      'markerWidth="6" markerHeight="6" orient="auto-start-reverse">'+
      '<path d="M0,0 L10,5 L0,10 z" fill="#475569"/></marker></defs>';

    for(const e of (file.graph.edges||[])){
      const a=nodeById[e.from], b=nodeById[e.to]; if(!a||!b) continue;
      const ax=(a.position[0]-minX)+padX+50, ay=(a.position[1]-minY)+padY+20;
      const bx=(b.position[0]-minX)+padX,   by=(b.position[1]-minY)+padY+20;
      const mx=(ax+bx)/2;
      html+='<path class="edge'+(e.branch==='error'?' error-branch':'')+
        '" d="M'+ax+','+ay+' C'+mx+','+ay+' '+mx+','+by+' '+bx+','+by+'"/>';
    }

    for(const n of nodes){
      const x=(n.position[0]-minX)+padX, y=(n.position[1]-minY)+padY;
      const fnds=findingsByNode[n.id]||[];
      const hot=fnds.some(f=>f.severity==='error');
      const warn=!hot&&fnds.some(f=>f.severity==='warning');
      const stgCls='node-'+n.stage.toLowerCase();
      const hotCls=hot?' node-hot':warn?' node-warn':'';
      html+='<g class="node" data-id="'+n.id+'" style="cursor:pointer">'+
        '<rect class="'+stgCls+hotCls+'" x="'+x+'" y="'+y+'" width="100" height="40" rx="6"/>'+
        '<text class="node-label" x="'+(x+50)+'" y="'+(y+17)+'" text-anchor="middle">'+
          escHtml((n.name||'').slice(0,16))+'</text>'+
        '<text class="node-label" x="'+(x+50)+'" y="'+(y+31)+'" text-anchor="middle" opacity="0.7">'+
          n.stage+(fnds.length?' · '+fnds.length:'')+'</text>'+
        '</g>';
    }
    svg.innerHTML=html;

    svg.querySelectorAll('g.node').forEach(g=>{
      g.addEventListener('click',()=>{
        svg.querySelectorAll('g.node rect').forEach(r=>{
          r.style.filter=''; r.style.opacity='1';
        });
        g.querySelector('rect').style.filter='brightness(1.4)';

        const id   = g.getAttribute('data-id');
        const n    = nodeById[id];
        const fnds = findingsByNode[id]||[];
        const stageCls = {E1:'e1',E2:'e2',E3:'e3',E4:'e4',UNKNOWN:'unk'}[n.stage]||'unk';
        panel.innerHTML=
          '<h3 style="margin:0 0 4px">'+escHtml(n.name)+
            ' <span class="badge badge-'+stageCls+'">'+n.stage+'</span></h3>'+
          '<p class="muted xs" style="margin:0 0 8px">'+escHtml(n.type||'')+'</p>'+
          (fnds.length===0
            ? '<p class="muted">'+D.labels.noFindingsInNode+'</p>'
            : fnds.map(renderFindingCard).join(''));
      });
    });
  }

  // Auto-render todos los flujos al cargar
  document.addEventListener('DOMContentLoaded',()=>{
    (D.files||[]).forEach((f,i)=>renderFlow(f,'svg-'+i,'panel-'+i));
  });

})();
</script>
</body></html>`;
}
