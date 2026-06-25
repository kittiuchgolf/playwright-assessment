import { expect, test } from '@playwright/test';
import { passRateChartSvg, statusTimelineHtml } from '../../scripts/dashboard/charts.mjs';

const makeRun = (number, opts = {}) => {
  const {
    tests = 10, passed = 10, failed = 0, skipped = 0, flaky = 0,
    createdAt = '2026-06-25T10:00:00Z', withTotals = true
  } = opts;
  const run = {
    id: `r${number}`, number: String(number), attempt: '1', branch: 'main',
    sha: 'abc1234', createdAt, actionUrl: '#actions',
    monocart: `runs/r${number}/monocart/`, playwright: `runs/r${number}/playwright/`
  };
  if (withTotals) {
    run.totals = { tests, passed, failed, skipped, flaky };
  }
  return run;
};

const countOf = (haystack, needle) => haystack.split(needle).length - 1;

test.describe('passRateChartSvg', () => {
  test('renders an empty state for no data', () => {
    expect(passRateChartSvg([])).toContain('No pass-rate history');
  });

  test('renders one circle per series point plus a polyline', () => {
    const series = [
      { number: '1', pct: 80, passed: 8, tests: 10 },
      { number: '2', pct: 100, passed: 10, tests: 10 },
      { number: '3', pct: 90, passed: 9, tests: 10 }
    ];
    const svg = passRateChartSvg(series);
    expect(countOf(svg, '<circle')).toBe(3);
    expect(svg).toContain('<polyline');
    expect(svg).toContain('Run #2 · 10/10 · 100% pass');
  });
});

test.describe('statusTimelineHtml', () => {
  test('renders an empty state for no runs', () => {
    expect(statusTimelineHtml([])).toContain('No runs');
  });

  test('renders one square per run with status classes and escaped titles', () => {
    const runs = [
      makeRun(2, { passed: 8, failed: 2 }),
      makeRun(1)
    ];
    const html = statusTimelineHtml(runs);
    expect(countOf(html, '<a class="sq')).toBe(2);
    expect(html).toContain('sq passed');
    expect(html).toContain('sq failed');
    expect(html).not.toContain('"><script');
  });
});
