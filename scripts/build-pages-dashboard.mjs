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
