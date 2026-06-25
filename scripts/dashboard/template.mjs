import { buildPage, escapeHtml, formatDate, formatPassed } from './html.mjs';
import { buildPassRateSeries, capRuns, computeKpis } from './metrics.mjs';
import { passRateChartSvg, statusTimelineHtml } from './charts.mjs';

const DEFAULT_MAX_RUNS = 30;

export function buildRootPage(runs, options = {}) {
  const maxRuns = options.maxRuns ?? DEFAULT_MAX_RUNS;
  const visibleRuns = capRuns(runs, maxRuns);
  const latest = visibleRuns[0];
  const kpis = computeKpis(visibleRuns);
  const series = buildPassRateSeries(visibleRuns, maxRuns);
  const runCount = visibleRuns.length;

  const reportButtons = latest
    ? `<div class="actions">
        <a class="button" href="${escapeHtml(latest.monocart)}">Open latest Monocart report</a>
        <a class="button secondary" href="${escapeHtml(latest.playwright)}">Open latest Playwright report</a>
      </div>`
    : '<div class="empty">No published runs yet.</div>';

  const subtitle = latest
    ? `${escapeHtml(latest.branch)} · last ${runCount} run${runCount === 1 ? '' : 's'} · updated ${escapeHtml(formatDate(latest.createdAt))} UTC`
    : 'No runs published yet.';

  const hero = `<h1>Test monitoring</h1>
    <p class="sub">${subtitle}</p>
    ${reportButtons}
    ${buildKpiCards(kpis)}`;

  const sections = `<section class="section">
      <h2>Pass rate · last ${runCount} run${runCount === 1 ? '' : 's'}</h2>
      ${passRateChartSvg(series)}
    </section>
    <section class="section">
      <h2>Status timeline</h2>
      ${statusTimelineHtml(visibleRuns)}
    </section>
    <section class="section">
      <h2>Run history</h2>
      <div class="run-list">${buildRunHistory(visibleRuns)}</div>
    </section>`;

  return buildPage({
    title: 'Playwright Monitoring Dashboard',
    stylesheetHref: 'dashboard.css',
    eyebrow: 'Playwright report history',
    body: { hero, sections }
  });
}

function buildKpiCards(kpis) {
  if (!kpis) {
    return '<div class="empty">No report metrics have been published yet.</div>';
  }

  const cards = [
    { tone: 'green', label: 'Latest pass rate', value: `${kpis.passRate}%` },
    { tone: 'blue', label: 'Tests run', value: kpis.tests },
    { tone: 'amber', label: 'Flaky (latest)', value: kpis.flaky },
    { tone: 'green', label: 'Green streak', value: kpis.greenStreak }
  ];

  return `<div class="kpis">${cards.map((card) => `
    <div class="kpi ${card.tone}">
      <span class="label">${escapeHtml(card.label)}</span>
      <span class="num">${escapeHtml(card.value)}</span>
    </div>`).join('')}</div>`;
}

function buildRunHistory(runs) {
  if (runs.length === 0) {
    return '<div class="empty">No runs have been published.</div>';
  }

  return runs.map((run) => `
    <article class="run-item">
      <div>
        <p class="run-title">Run #${escapeHtml(run.number)} · ${escapeHtml(formatDate(run.createdAt))}</p>
        <p>${escapeHtml(run.branch)} · ${escapeHtml(run.sha)} · attempt ${escapeHtml(run.attempt)}</p>
        ${buildRunMetrics(run)}
      </div>
      <div class="run-links">
        <a class="pill" href="${escapeHtml(run.monocart)}">Monocart</a>
        <a class="pill" href="${escapeHtml(run.playwright)}">Playwright</a>
        <a class="pill" href="${escapeHtml(run.actionUrl)}">Actions</a>
      </div>
    </article>
  `).join('');
}

export function buildReportHub({ title, eyebrow, run, reportType }) {
  const reports = [
    { label: 'UI report', href: 'ui/index.html', description: 'SauceDemo browser workflow evidence.' },
    { label: 'API report', href: 'api/index.html', description: 'GoREST API contract and behavior evidence.' }
  ];

  const cards = reports.map((report) => `
    <article class="report-card">
      <h2>${escapeHtml(report.label)}</h2>
      <p>${escapeHtml(report.description)}</p>
      <div class="actions">
        <a class="button secondary" href="${escapeHtml(report.href)}">Open ${escapeHtml(report.label)}</a>
      </div>
    </article>
  `).join('');

  return buildPage({
    title,
    stylesheetHref: '../../../dashboard.css',
    eyebrow,
    body: {
      hero: `<h1>${escapeHtml(reportType)} reports for run #${escapeHtml(run.number)}.</h1>
        <p>Choose the UI or API report for this historical workflow run.</p>
        <div class="actions"><a class="button secondary" href="../../../index.html">Back to dashboard</a></div>`,
      side: `<div class="meta-grid">
        <div class="metric">
          <span class="label">Run</span>
          <span class="value">#${escapeHtml(run.number)}</span>
        </div>
        <div class="metric">
          <span class="label">Published</span>
          <span class="value">${escapeHtml(formatDate(run.createdAt))}</span>
        </div>
        <div class="metric">
          <span class="label">Actions</span>
          <span class="value"><a href="${escapeHtml(run.actionUrl)}">Open run</a></span>
        </div>
      </div>`,
      sections: `<section class="section"><div class="report-grid">${cards}</div></section>`
    }
  });
}

function buildRunMetrics(run) {
  if (!run.totals) {
    return '<div class="run-metrics"><span class="status-badge unknown">Metrics unavailable</span></div>';
  }

  const status = run.totals.failed > 0 ? 'failed' : 'passed';
  const ui = run.reports?.ui;
  const api = run.reports?.api;

  return `<div class="run-metrics">
    <span class="status-badge ${status}">${escapeHtml(formatPassed(run.totals))}</span>
    ${run.totals.flaky > 0 ? `<span class="flaky-note">${escapeHtml(run.totals.flaky)} flaky</span>` : ''}
    ${ui ? `<span>UI ${escapeHtml(formatPassed(ui))}${ui.duration ? ` · ${escapeHtml(ui.duration)}` : ''}</span>` : ''}
    ${api ? `<span>API ${escapeHtml(formatPassed(api))}${api.duration ? ` · ${escapeHtml(api.duration)}` : ''}</span>` : ''}
  </div>`;
}
