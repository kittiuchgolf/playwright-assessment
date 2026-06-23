import { strict as assert } from 'node:assert';
import test from 'node:test';
import { buildSummaryMarkdown, summarizePlaywrightReport } from './write-test-summary.mjs';

test('summarizes Playwright JSON test outcomes', () => {
  const report = {
    stats: {
      duration: 1240
    },
    suites: [
      {
        specs: [
          {
            tests: [
              {
                status: 'expected',
                results: [{ status: 'passed', duration: 100 }]
              },
              {
                status: 'unexpected',
                results: [{ status: 'failed', duration: 200 }]
              },
              {
                status: 'skipped',
                results: [{ status: 'skipped', duration: 0 }]
              },
              {
                status: 'flaky',
                results: [
                  { status: 'failed', duration: 300 },
                  { status: 'passed', duration: 400 }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  assert.deepEqual(summarizePlaywrightReport(report), {
    total: 4,
    passed: 1,
    failed: 1,
    skipped: 1,
    flaky: 1,
    duration: '1.2s'
  });
});

test('builds a GitHub Actions Markdown summary', () => {
  const markdown = buildSummaryMarkdown({
    title: 'UI Tests',
    command: 'npm run test:ui',
    summary: {
      total: 4,
      passed: 1,
      failed: 1,
      skipped: 1,
      flaky: 1,
      duration: '1.2s'
    },
    details: {
      Browser: 'Chromium',
      'Playwright report artifact': 'playwright-report-ui'
    }
  });

  assert.match(markdown, /## UI Tests/);
  assert.match(markdown, /\| Passed \| 1 \|/);
  assert.match(markdown, /\| Failed \| 1 \|/);
  assert.match(markdown, /\| Flaky \| 1 \|/);
  assert.match(markdown, /\| Browser \| Chromium \|/);
});
