import { appendFile, readFile } from 'node:fs/promises';
import process from 'node:process';

const failureStatuses = new Set(['failed', 'timedOut', 'interrupted']);

function collectTests(suites = []) {
  const tests = [];

  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      tests.push(...(spec.tests ?? []));
    }

    tests.push(...collectTests(suite.suites ?? []));
  }

  return tests;
}

function getTestOutcome(test) {
  if (test.status === 'expected') {
    return 'passed';
  }

  if (test.status === 'unexpected') {
    return 'failed';
  }

  if (test.status === 'flaky' || hasFlakyAttempts(test.results ?? [])) {
    return 'flaky';
  }

  if (test.status === 'skipped') {
    return 'skipped';
  }

  const finalResult = test.results?.at(-1);

  if (!finalResult || finalResult.status === 'skipped') {
    return 'skipped';
  }

  if (finalResult.status === 'passed') {
    return 'passed';
  }

  if (failureStatuses.has(finalResult.status)) {
    return 'failed';
  }

  return 'failed';
}

function hasFlakyAttempts(results) {
  const finalResult = results.at(-1);

  return finalResult?.status === 'passed' && results.slice(0, -1).some((result) => failureStatuses.has(result.status));
}

function formatDuration(milliseconds = 0) {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }

  return `${(milliseconds / 1000).toFixed(1)}s`;
}

export function summarizePlaywrightReport(report) {
  const tests = collectTests(report.suites);
  const summary = {
    total: tests.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: formatDuration(report.stats?.duration ?? 0)
  };

  for (const test of tests) {
    summary[getTestOutcome(test)] += 1;
  }

  return summary;
}

export function buildSummaryMarkdown({ title, command, summary, details = {} }) {
  const rows = [
    ['Command', command],
    ['Total', summary.total],
    ['Passed', summary.passed],
    ['Failed', summary.failed],
    ['Flaky', summary.flaky],
    ['Skipped', summary.skipped],
    ['Duration', summary.duration],
    ...Object.entries(details)
  ];

  return [
    `## ${title}`,
    '',
    '| Metric | Value |',
    '| --- | --- |',
    ...rows.map(([metric, value]) => `| ${metric} | ${value} |`),
    ''
  ].join('\n');
}

async function main() {
  const [reportPath, title, command, detailsJson = '{}'] = process.argv.slice(2);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;

  if (!reportPath || !title || !command) {
    throw new Error('Usage: node scripts/write-test-summary.mjs <report-path> <title> <command> [details-json]');
  }

  if (!summaryPath) {
    throw new Error('GITHUB_STEP_SUMMARY is not set');
  }

  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  const details = JSON.parse(detailsJson);
  const summary = summarizePlaywrightReport(report);
  const markdown = buildSummaryMarkdown({ title, command, summary, details });

  await appendFile(summaryPath, markdown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
