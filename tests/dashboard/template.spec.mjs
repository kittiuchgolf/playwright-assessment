import { expect, test } from '@playwright/test';
import { buildPage, escapeHtml, formatDate, formatPassed } from '../../scripts/dashboard/html.mjs';

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
