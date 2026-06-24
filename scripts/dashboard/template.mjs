export function buildRootPage(runs) {
  const latest = runs[0];
  const summarizedRuns = runs.filter((run) => run.totals);
  const history = runs.map((run) => `
    <article class="run-item">
      <div>
        <p class="run-title">Run #${escapeHtml(run.number)} · ${escapeHtml(formatDate(run.createdAt))}</p>
        <p>${escapeHtml(run.branch)} · ${escapeHtml(run.sha)} · attempt ${escapeHtml(run.attempt)}</p>
        ${buildRunMetrics(run)}
      </div>
      <div class="run-links">
        ${buildReportLinks(run)}
        <a class="pill" href="${escapeHtml(run.actionUrl)}">Actions</a>
      </div>
    </article>
  `).join('');

  const latestActions = latest
    ? `<div class="actions">
        <a class="button" href="${escapeHtml(latest.monocart)}">Open Monocart report</a>
        <a class="button secondary" href="${escapeHtml(latest.playwright)}">Open Playwright report</a>
      </div>`
    : '<div class="empty">No published runs yet.</div>';

  const side = latest
    ? `<div class="meta-grid">
        <div class="metric">
          <span class="label">Latest run</span>
          <span class="value">#${escapeHtml(latest.number)}</span>
        </div>
        <div class="metric">
          <span class="label">Published</span>
          <span class="value">${escapeHtml(formatDate(latest.createdAt))}</span>
        </div>
        <div class="metric">
          <span class="label">Commit</span>
          <span class="value">${escapeHtml(latest.sha)}</span>
        </div>
        ${latest.totals ? `<div class="metric">
          <span class="label">Latest result</span>
          <span class="value">${escapeHtml(formatPassed(latest.totals))}</span>
        </div>` : ''}
      </div>`
    : '<p>No run metadata is available yet.</p>';

  return buildPage({
    title: 'Playwright Monitoring Dashboard',
    stylesheetHref: 'dashboard.css',
    eyebrow: 'Playwright report history',
    body: {
      hero: `<h1>Latest test evidence, archived by run.</h1>
        <p>Use the two report views below to inspect the most recent UI and API automation results, then browse historical runs as the suite evolves.</p>
        ${latestActions}`,
      side,
      sections: `<section class="section">
          <h2>Monitoring summary</h2>
          ${buildSummaryCards(summarizedRuns)}
        </section>
        <section class="section">
          <h2>Run history</h2>
          <div class="run-list">${history || '<div class="empty">No runs have been published.</div>'}</div>
        </section>`
    }
  });
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

function buildPage({ title, stylesheetHref, eyebrow, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}">
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="hero-main">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        ${body.hero}
      </div>
      <aside class="hero-side">
        ${body.side}
      </aside>
    </section>
    ${body.sections}
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildSummaryCards(runs) {
  if (runs.length === 0) {
    return '<div class="empty">No report metrics have been published yet.</div>';
  }

  const latest = runs[0];
  const successfulRuns = runs.filter((run) => run.totals.failed === 0).length;
  const totalTests = runs.reduce((sum, run) => sum + run.totals.tests, 0);
  const totalFailures = runs.reduce((sum, run) => sum + run.totals.failed, 0);

  return `<div class="summary-grid">
    <div class="summary-card">
      <span class="label">Latest result</span>
      <span class="value">${escapeHtml(formatPassed(latest.totals))}</span>
    </div>
    <div class="summary-card">
      <span class="label">Runs tracked</span>
      <span class="value">${escapeHtml(runs.length)}</span>
    </div>
    <div class="summary-card">
      <span class="label">Green runs</span>
      <span class="value">${escapeHtml(`${successfulRuns}/${runs.length}`)}</span>
    </div>
    <div class="summary-card">
      <span class="label">Historical failures</span>
      <span class="value">${escapeHtml(`${totalFailures}/${totalTests}`)}</span>
    </div>
  </div>`;
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
    ${ui ? `<span>UI ${escapeHtml(formatPassed(ui))}${ui.duration ? ` · ${escapeHtml(ui.duration)}` : ''}</span>` : ''}
    ${api ? `<span>API ${escapeHtml(formatPassed(api))}${api.duration ? ` · ${escapeHtml(api.duration)}` : ''}</span>` : ''}
  </div>`;
}

function buildReportLinks(run) {
  if (run.reportsRetained === false) {
    return '<span class="pill muted">Reports expired</span>';
  }

  return `<a class="pill" href="${escapeHtml(run.monocart)}">Monocart</a>
        <a class="pill" href="${escapeHtml(run.playwright)}">Playwright</a>`;
}

function formatPassed(summary) {
  return `${summary.passed}/${summary.tests} passed`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(new Date(value));
}
