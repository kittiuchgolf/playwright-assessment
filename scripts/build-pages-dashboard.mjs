import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { buildReportHub, buildRootPage } from './dashboard/template.mjs';

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

async function readRuns(runsPath) {
  if (!existsSync(runsPath)) {
    return [];
  }

  return JSON.parse(await readFile(runsPath, 'utf8'));
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return JSON.parse(await readFile(filePath, 'utf8'));
}

function summaryValue(summary, key) {
  const value = summary?.[key];

  if (typeof value === 'number') {
    return value;
  }

  return Number(value?.value ?? 0);
}

async function readReportMetrics(filePath) {
  const report = await readJsonIfExists(filePath);

  if (!report) {
    return null;
  }

  const summary = report.summary ?? {};

  return {
    tests: summaryValue(summary, 'tests'),
    passed: summaryValue(summary, 'passed'),
    failed: summaryValue(summary, 'failed'),
    skipped: summaryValue(summary, 'skipped'),
    flaky: summaryValue(summary, 'flaky'),
    duration: report.durationH ?? ''
  };
}

function totalReports(reports) {
  const reportList = Object.values(reports).filter(Boolean);

  if (reportList.length === 0) {
    return null;
  }

  return reportList.reduce((totals, report) => ({
    tests: totals.tests + report.tests,
    passed: totals.passed + report.passed,
    failed: totals.failed + report.failed,
    skipped: totals.skipped + report.skipped,
    flaky: totals.flaky + report.flaky
  }), {
    tests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0
  });
}

async function enrichRun(run) {
  const runDir = path.join(pagesDir, 'runs', run.id);
  const reports = {
    ...(run.reports ?? {})
  };
  const reportPaths = {
    ui: path.join(runDir, 'monocart', 'ui', 'index.json'),
    api: path.join(runDir, 'monocart', 'api', 'index.json')
  };

  for (const [name, reportPath] of Object.entries(reportPaths)) {
    const metrics = await readReportMetrics(reportPath);

    if (metrics) {
      reports[name] = metrics;
    }
  }

  const totals = totalReports(reports);

  return {
    ...run,
    reports,
    ...(totals ? { totals } : {})
  };
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

async function main() {
  const runPath = `runs/${runId}`;
  const runDir = path.join(pagesDir, runPath);
  const runsPath = path.join(pagesDir, 'runs.json');

  await mkdir(pagesDir, { recursive: true });
  await rm(runDir, { recursive: true, force: true });
  await mkdir(runDir, { recursive: true });
  await copyReportArtifacts(runDir);
  await cp(new URL('./dashboard/dashboard.css', import.meta.url), path.join(pagesDir, 'dashboard.css'));

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
  const runs = await Promise.all([
    run,
    ...(await readRuns(runsPath)).filter((item) => item.id !== runId)
  ].map(enrichRun));

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
