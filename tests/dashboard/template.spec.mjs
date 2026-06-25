import { expect, test } from '@playwright/test';
import { buildPage, escapeHtml, formatDate, formatPassed } from '../../scripts/dashboard/html.mjs';
import { buildRootPage } from '../../scripts/dashboard/template.mjs';

test.describe('html helpers', () => {
  test('escapeHtml escapes all dangerous characters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });

  test('formatPassed renders passed/tests', () => {
    expect(formatPassed({ passed: 9, tests: 10 })).toBe('9/10 passed');
  });

  test('formatDate renders a UTC medium date', () => {
    expect(formatDate('2026-06-25T14:30:00Z')).toContain('2026');
  });

  test('buildPage emits a full document with title and stylesheet', () => {
    const html = buildPage({
      title: 'T', stylesheetHref: 'dashboard.css', eyebrow: 'E',
      body: { hero: '<h1>Hi</h1>', sections: '<section></section>' }
    });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<title>T</title>');
    expect(html).toContain('href="dashboard.css"');
  });

  test('buildPage omits the aside when no side content', () => {
    const html = buildPage({
      title: 'T', stylesheetHref: 'dashboard.css', eyebrow: 'E',
      body: { hero: '<h1>Hi</h1>', sections: '' }
    });
    expect(html).not.toContain('hero-side');
    expect(html).toContain('hero--solo');
  });
});

const tplRun = (number, opts = {}) => {
  const { passed = 10, tests = 10, failed = 0, flaky = 0 } = opts;
  return {
    id: `r${number}`, number: String(number), attempt: '1', branch: 'main',
    sha: 'abc1234', createdAt: '2026-06-25T14:30:00Z', actionUrl: '#actions',
    monocart: `runs/r${number}/monocart/`, playwright: `runs/r${number}/playwright/`,
    totals: { tests, passed, failed, skipped: 0, flaky }
  };
};

test.describe('buildRootPage', () => {
  test('renders empty states when there are no runs', () => {
    const html = buildRootPage([]);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('No published runs yet');
  });

  test('renders KPI cards, chart, timeline, report buttons and history', () => {
    const html = buildRootPage([tplRun(30), tplRun(29, { passed: 9, flaky: 1 })]);
    expect(html).toContain('class="kpis"');
    expect(html).toContain('class="chart"');
    expect(html).toContain('class="tl"');
    expect(html).toContain('Open latest Monocart report');
    expect(html).toContain('Open latest Playwright report');
    expect(html).toContain('Run history');
    expect(html).toContain('Run #30');
  });

  test('caps visible runs to the provided maxRuns', () => {
    const runs = Array.from({ length: 40 }, (_, i) => tplRun(40 - i));
    const html = buildRootPage(runs, { maxRuns: 5 });
    expect(html).toContain('last 5 runs');
    expect(html).not.toContain('Run #34');
  });
});
