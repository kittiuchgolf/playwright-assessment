export function buildRootPage(runs) {
  const latest = runs[0];
  const history = runs.map((run) => `
    <article class="run-item">
      <div>
        <p class="run-title">Run #${escapeHtml(run.number)} · ${escapeHtml(formatDate(run.createdAt))}</p>
        <p>${escapeHtml(run.branch)} · ${escapeHtml(run.sha)} · attempt ${escapeHtml(run.attempt)}</p>
      </div>
      <div class="run-links">
        <a class="pill" href="${escapeHtml(run.monocart)}">Monocart</a>
        <a class="pill" href="${escapeHtml(run.playwright)}">Playwright</a>
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

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(new Date(value));
}
