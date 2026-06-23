import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const pagesDir = process.env.PAGES_DIR ?? 'pages';
const artifactsDir = process.env.ARTIFACTS_DIR ?? 'dashboard-artifacts';
const runId = process.env.GITHUB_RUN_ID ?? 'local-preview';
const runNumber = process.env.GITHUB_RUN_NUMBER ?? 'local';
const runAttempt = process.env.GITHUB_RUN_ATTEMPT ?? '1';
const repository = process.env.GITHUB_REPOSITORY ?? 'local/playwright-assessment';
const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
const sha = process.env.GITHUB_SHA ?? 'local';
const refName = process.env.GITHUB_REF_NAME ?? 'local';
const createdAt = process.env.DASHBOARD_CREATED_AT ?? new Date().toISOString();
const actionUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;

const reportSources = [
  {
    artifact: 'monocart-report-ui',
    target: ['monocart', 'ui'],
    label: 'UI Monocart report'
  },
  {
    artifact: 'monocart-report-api',
    target: ['monocart', 'api'],
    label: 'API Monocart report'
  },
  {
    artifact: 'playwright-report-ui',
    target: ['playwright', 'ui'],
    label: 'UI Playwright report'
  },
  {
    artifact: 'playwright-report-api',
    target: ['playwright', 'api'],
    label: 'API Playwright report'
  }
];

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

async function readRuns(runsPath) {
  if (!existsSync(runsPath)) {
    return [];
  }

  return JSON.parse(await readFile(runsPath, 'utf8'));
}

async function copyReportArtifacts(runDir) {
  const copied = [];

  for (const source of reportSources) {
    const sourcePath = path.join(artifactsDir, source.artifact);
    const targetPath = path.join(runDir, ...source.target);

    if (!existsSync(sourcePath)) {
      continue;
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await cp(sourcePath, targetPath, { recursive: true });
    copied.push({
      ...source,
      href: `${source.target.join('/')}/`
    });
  }

  return copied;
}

function buildPage({ title, eyebrow, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f7f8fb;
      --panel: #ffffff;
      --ink: #15171c;
      --muted: #5f6876;
      --line: #d8dde6;
      --blue: #0b5fff;
      --green: #087f5b;
      --amber: #b45309;
      --shadow: 0 18px 45px rgba(26, 34, 51, 0.10);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }

    a {
      color: inherit;
    }

    .shell {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 40px 0 56px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 24px;
      align-items: stretch;
      margin-bottom: 28px;
    }

    .hero-main,
    .hero-side,
    .section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .hero-main {
      padding: 32px;
      position: relative;
      overflow: hidden;
    }

    .hero-main::before {
      content: "";
      position: absolute;
      inset: 0 0 auto;
      height: 6px;
      background: linear-gradient(90deg, var(--blue), var(--green), var(--amber));
    }

    .hero-side {
      padding: 24px;
    }

    .eyebrow {
      color: var(--blue);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 10px 0 12px;
      font-size: clamp(34px, 6vw, 68px);
      line-height: 0.95;
      letter-spacing: 0;
    }

    h2 {
      margin: 0 0 16px;
      font-size: 22px;
    }

    p {
      margin: 0;
      color: var(--muted);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid var(--ink);
      background: var(--ink);
      color: #fff;
      font-weight: 800;
      text-decoration: none;
    }

    .button.secondary {
      background: #fff;
      color: var(--ink);
    }

    .meta-grid {
      display: grid;
      gap: 12px;
    }

    .metric {
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }

    .metric:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }

    .label {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .value {
      display: block;
      margin-top: 2px;
      font-size: 18px;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .section {
      padding: 24px;
      margin-top: 20px;
    }

    .run-list {
      display: grid;
      gap: 12px;
    }

    .run-item {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: center;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
    }

    .run-title {
      margin: 0;
      font-weight: 850;
    }

    .run-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--ink);
      font-size: 13px;
      font-weight: 800;
      text-decoration: none;
      background: #fff;
    }

    .report-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-top: 18px;
    }

    .report-card {
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
    }

    .report-card h2 {
      margin-bottom: 8px;
    }

    .empty {
      padding: 18px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      background: #fff;
    }

    @media (max-width: 760px) {
      .hero,
      .run-item,
      .report-grid {
        grid-template-columns: 1fr;
      }

      .hero-main,
      .hero-side,
      .section {
        padding: 20px;
      }

      .run-links {
        justify-content: flex-start;
      }
    }
  </style>
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

function buildRootPage(runs) {
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

function buildReportHub({ title, eyebrow, run, reportType }) {
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

async function main() {
  const runPath = `runs/${runId}`;
  const runDir = path.join(pagesDir, runPath);
  const runsPath = path.join(pagesDir, 'runs.json');

  await mkdir(pagesDir, { recursive: true });
  await rm(runDir, { recursive: true, force: true });
  await mkdir(runDir, { recursive: true });
  await copyReportArtifacts(runDir);

  const run = {
    id: runId,
    number: runNumber,
    attempt: runAttempt,
    branch: refName,
    sha: sha.slice(0, 7),
    createdAt,
    actionUrl,
    monocart: `${runPath}/monocart/`,
    playwright: `${runPath}/playwright/`
  };
  const runs = [run, ...(await readRuns(runsPath)).filter((item) => item.id !== runId)];

  await mkdir(path.join(runDir, 'monocart'), { recursive: true });
  await mkdir(path.join(runDir, 'playwright'), { recursive: true });
  await writeFile(path.join(runDir, 'monocart', 'index.html'), buildReportHub({
    title: `Monocart Reports · Run #${run.number}`,
    eyebrow: 'Monocart report set',
    run,
    reportType: 'Monocart'
  }));
  await writeFile(path.join(runDir, 'playwright', 'index.html'), buildReportHub({
    title: `Playwright Reports · Run #${run.number}`,
    eyebrow: 'Playwright report set',
    run,
    reportType: 'Playwright'
  }));
  await writeFile(runsPath, `${JSON.stringify(runs, null, 2)}\n`);
  await writeFile(path.join(pagesDir, 'index.html'), buildRootPage(runs));
  await writeFile(path.join(pagesDir, '.nojekyll'), '');
}

await main();
