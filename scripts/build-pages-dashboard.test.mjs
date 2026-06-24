import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builderPath = path.join(projectRoot, 'scripts/build-pages-dashboard.mjs');

test('dashboard stores and renders historical report metrics', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'dashboard-history-'));
  const pagesDir = path.join(workspace, 'pages');

  await runDashboardBuild({
    workspace,
    pagesDir,
    runId: '1001',
    runNumber: '41',
    sha: 'abcdef123456',
    ui: { tests: 8, passed: 8, failed: 0, skipped: 0, flaky: 0, durationH: '8.2s' },
    api: { tests: 5, passed: 5, failed: 0, skipped: 0, flaky: 0, durationH: '4.6s' },
    createdAt: '2026-06-24T04:00:00.000Z'
  });
  await stripStoredMetrics(path.join(pagesDir, 'runs.json'));
  await runDashboardBuild({
    workspace,
    pagesDir,
    runId: '1002',
    runNumber: '42',
    sha: '123456abcdef',
    ui: { tests: 8, passed: 7, failed: 1, skipped: 0, flaky: 0, durationH: '9.0s' },
    api: { tests: 5, passed: 5, failed: 0, skipped: 0, flaky: 0, durationH: '4.1s' },
    createdAt: '2026-06-24T13:00:00.000Z'
  });

  const runs = JSON.parse(await readFile(path.join(pagesDir, 'runs.json'), 'utf8'));
  assert.equal(runs.length, 2);
  assert.equal(runs[0].number, '42');
  assert.deepEqual(runs[0].totals, {
    tests: 13,
    passed: 12,
    failed: 1,
    skipped: 0,
    flaky: 0
  });
  assert.equal(runs[0].reports.ui.duration, '9.0s');
  assert.equal(runs[1].totals.passed, 13);

  const html = await readFile(path.join(pagesDir, 'index.html'), 'utf8');
  assert.match(html, /Monitoring summary/);
  assert.match(html, /Run #42/);
  assert.match(html, /12\/13 passed/);
  assert.match(html, /Run #41/);
  assert.match(html, /13\/13 passed/);
});

async function runDashboardBuild({ workspace, pagesDir, runId, runNumber, sha, ui, api, createdAt }) {
  const artifactsDir = path.join(workspace, `artifacts-${runId}`);
  await writeMonocartArtifact(artifactsDir, 'monocart-report-ui', ui);
  await writeMonocartArtifact(artifactsDir, 'monocart-report-api', api);
  await writeReportArtifact(artifactsDir, 'playwright-report-ui');
  await writeReportArtifact(artifactsDir, 'playwright-report-api');

  await execFileAsync('node', [builderPath], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PAGES_DIR: pagesDir,
      ARTIFACTS_DIR: artifactsDir,
      GITHUB_RUN_ID: runId,
      GITHUB_RUN_NUMBER: runNumber,
      GITHUB_RUN_ATTEMPT: '1',
      GITHUB_REPOSITORY: 'owner/repo',
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_SHA: sha,
      GITHUB_REF_NAME: 'main',
      DASHBOARD_CREATED_AT: createdAt
    }
  });
}

async function writeMonocartArtifact(artifactsDir, name, summary) {
  const artifactDir = path.join(artifactsDir, name);
  await mkdir(artifactDir, { recursive: true });
  await writeFile(path.join(artifactDir, 'index.html'), `<h1>${name}</h1>`);
  await writeFile(path.join(artifactDir, 'index.json'), JSON.stringify({
    durationH: summary.durationH,
    summary: {
      tests: { value: summary.tests },
      passed: { value: summary.passed },
      failed: { value: summary.failed },
      skipped: { value: summary.skipped },
      flaky: { value: summary.flaky }
    }
  }));
}

async function writeReportArtifact(artifactsDir, name) {
  const artifactDir = path.join(artifactsDir, name);
  await mkdir(artifactDir, { recursive: true });
  await writeFile(path.join(artifactDir, 'index.html'), `<h1>${name}</h1>`);
}

async function stripStoredMetrics(runsPath) {
  const runs = JSON.parse(await readFile(runsPath, 'utf8'));
  await writeFile(runsPath, JSON.stringify(runs.map((run) => {
    const { reports, totals, ...metadataOnlyRun } = run;
    void reports;
    void totals;
    return metadataOnlyRun;
  }), null, 2));
}
