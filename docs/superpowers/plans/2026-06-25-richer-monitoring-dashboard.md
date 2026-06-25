# Richer Monitoring Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the GitHub Pages report archive into a monitoring dashboard with trend widgets (KPI cards, pass-rate line, status timeline), built from data already in `runs.json`.

**Architecture:** Split `scripts/dashboard/` into pure, testable modules (`html.mjs`, `metrics.mjs`, `charts.mjs`) consumed by `template.mjs`; keep `build-pages-dashboard.mjs` as the only IO module and add history cap + prune. All widgets are build-time inline SVG/HTML — zero client JS. Pure modules get Playwright node-only unit tests.

**Tech Stack:** Node ESM (`.mjs`), Playwright 1.61 test runner (node-only project), inline SVG, vanilla CSS. Zero new runtime dependencies.

---

## Spec

Design: `docs/superpowers/specs/2026-06-25-richer-monitoring-dashboard-design.md`

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/dashboard/html.mjs` | **new** — `escapeHtml`, `formatPassed`, `formatDate`, `buildPage` (page shell) |
| `scripts/dashboard/metrics.mjs` | **new** — pure data: `runStatus`, `capRuns`, `summaryValue`, `totalReports`, `computeKpis`, `buildPassRateSeries` |
| `scripts/dashboard/charts.mjs` | **new** — `passRateChartSvg(series)`, `statusTimelineHtml(runs)` |
| `scripts/dashboard/template.mjs` | refactor — `buildRootPage` (widgets) + `buildReportHub`, composing the modules above |
| `scripts/dashboard/dashboard.css` | add KPI / chart / timeline styles; drop unused summary-card styles |
| `scripts/build-pages-dashboard.mjs` | use `metrics.mjs`; add `DASHBOARD_MAX_RUNS` cap + prune |
| `playwright.config.ts` | add node-only `dashboard` project |
| `package.json` | add `test:dashboard` script |
| `tests/dashboard/metrics.spec.mjs` | **new** — unit tests for `metrics.mjs` |
| `tests/dashboard/charts.spec.mjs` | **new** — unit tests for `charts.mjs` |
| `tests/dashboard/template.spec.mjs` | **new** — unit tests for `buildRootPage` |
| `.github/workflows/playwright.yml` | add `dashboard-tests` job; gate `deploy-dashboard` on it |
| `docs/monitoring-dashboard.md` | document widgets, KPIs, retention, `test:dashboard` |

**Naming note:** the timeline widget returns HTML (flex of `<a>` squares), so it is named `statusTimelineHtml` (the spec's `statusTimelineSvg` placeholder name is refined here).

**Shared test fixture:** several specs reuse this run factory. Copy it into each spec file that needs it (specs may be read out of order):

```js
const makeRun = (number, opts = {}) => {
  const {
    tests = 10, passed = 10, failed = 0, skipped = 0, flaky = 0,
    createdAt = '2026-06-25T10:00:00Z', withTotals = true
  } = opts;
  const run = {
    id: `r${number}`,
    number: String(number),
    attempt: '1',
    branch: 'main',
    sha: 'abc1234',
    createdAt,
    actionUrl: '#actions',
    monocart: `runs/r${number}/monocart/`,
    playwright: `runs/r${number}/playwright/`
  };
  if (withTotals) {
    run.totals = { tests, passed, failed, skipped, flaky };
  }
  return run;
};
```

---

## Task 1: Test harness + `metrics.runStatus`

**Files:**
- Modify: `playwright.config.ts` (add `dashboard` project)
- Modify: `package.json` (add `test:dashboard` script)
- Create: `tests/dashboard/metrics.spec.mjs`
- Create: `scripts/dashboard/metrics.mjs`

- [ ] **Step 1: Add the node-only `dashboard` project to `playwright.config.ts`**

Add this object to the `projects` array (after the `api` project):

```ts
    {
      name: 'dashboard',
      testDir: './tests/dashboard'
    }
```

(No `use`/`baseURL` — these tests never launch a browser.)

- [ ] **Step 2: Add the `test:dashboard` script to `package.json`**

In `"scripts"`, after `"test:api"`, add:

```json
    "test:dashboard": "playwright test --project=dashboard",
```

- [ ] **Step 3: Write the failing test**

Create `tests/dashboard/metrics.spec.mjs`:

```js
import { expect, test } from '@playwright/test';
import { runStatus } from '../../scripts/dashboard/metrics.mjs';

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

test.describe('runStatus', () => {
  test('returns passed when all green', () => {
    expect(runStatus(makeRun(1))).toBe('passed');
  });

  test('returns failed when any failure', () => {
    expect(runStatus(makeRun(2, { passed: 8, failed: 2 }))).toBe('failed');
  });

  test('returns flaky when flaky but no failures', () => {
    expect(runStatus(makeRun(3, { flaky: 1 }))).toBe('flaky');
  });

  test('returns unknown without totals or with zero tests', () => {
    expect(runStatus(makeRun(4, { withTotals: false }))).toBe('unknown');
    expect(runStatus(makeRun(5, { tests: 0, passed: 0 }))).toBe('unknown');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test:dashboard -- tests/dashboard/metrics.spec.mjs`
Expected: FAIL — cannot find module `scripts/dashboard/metrics.mjs`.

- [ ] **Step 5: Create `scripts/dashboard/metrics.mjs` with `runStatus`**

```js
export function runStatus(run) {
  const totals = run?.totals;

  if (!totals || totals.tests === 0) {
    return 'unknown';
  }

  if (totals.failed > 0) {
    return 'failed';
  }

  if (totals.flaky > 0) {
    return 'flaky';
  }

  return 'passed';
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:dashboard -- tests/dashboard/metrics.spec.mjs`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts package.json tests/dashboard/metrics.spec.mjs scripts/dashboard/metrics.mjs
git commit -m "test: add dashboard test project and metrics.runStatus"
```

---

## Task 2: `metrics` — `capRuns`, `summaryValue`, `totalReports`

**Files:**
- Modify: `tests/dashboard/metrics.spec.mjs`
- Modify: `scripts/dashboard/metrics.mjs`

- [ ] **Step 1: Append failing tests**

Add to the end of `tests/dashboard/metrics.spec.mjs`:

```js
import { capRuns, summaryValue, totalReports } from '../../scripts/dashboard/metrics.mjs';

test.describe('capRuns', () => {
  test('keeps the newest N (runs are newest-first)', () => {
    const result = capRuns([makeRun(3), makeRun(2), makeRun(1)], 2);
    expect(result.map((r) => r.number)).toEqual(['3', '2']);
  });

  test('returns a copy when under the cap', () => {
    expect(capRuns([makeRun(1)], 5)).toHaveLength(1);
  });

  test('returns all when max is non-positive', () => {
    expect(capRuns([makeRun(2), makeRun(1)], 0)).toHaveLength(2);
  });
});

test.describe('summaryValue', () => {
  test('reads numeric values', () => {
    expect(summaryValue({ tests: 5 }, 'tests')).toBe(5);
  });

  test('reads nested {value} objects', () => {
    expect(summaryValue({ tests: { value: 7 } }, 'tests')).toBe(7);
  });

  test('defaults missing keys to 0', () => {
    expect(summaryValue({}, 'tests')).toBe(0);
  });
});

test.describe('totalReports', () => {
  test('sums report metrics', () => {
    const totals = totalReports({
      ui: { tests: 5, passed: 5, failed: 0, skipped: 0, flaky: 0 },
      api: { tests: 3, passed: 2, failed: 1, skipped: 0, flaky: 0 }
    });
    expect(totals).toEqual({ tests: 8, passed: 7, failed: 1, skipped: 0, flaky: 0 });
  });

  test('returns null when there are no reports', () => {
    expect(totalReports({})).toBeNull();
    expect(totalReports({ ui: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:dashboard -- tests/dashboard/metrics.spec.mjs`
Expected: FAIL — `capRuns`/`summaryValue`/`totalReports` are not exported.

- [ ] **Step 3: Add the functions to `scripts/dashboard/metrics.mjs`**

```js
export function capRuns(runs, max) {
  if (!Number.isFinite(max) || max <= 0) {
    return [...runs];
  }

  return runs.slice(0, max);
}

export function summaryValue(summary, key) {
  const value = summary?.[key];

  if (typeof value === 'number') {
    return value;
  }

  return Number(value?.value ?? 0);
}

export function totalReports(reports) {
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
  }), { tests: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:dashboard -- tests/dashboard/metrics.spec.mjs`
Expected: PASS (all metrics tests).

- [ ] **Step 5: Commit**

```bash
git add tests/dashboard/metrics.spec.mjs scripts/dashboard/metrics.mjs
git commit -m "feat: add capRuns, summaryValue, totalReports to dashboard metrics"
```

---

## Task 3: `metrics` — `computeKpis`, `buildPassRateSeries`

**Files:**
- Modify: `tests/dashboard/metrics.spec.mjs`
- Modify: `scripts/dashboard/metrics.mjs`

- [ ] **Step 1: Append failing tests**

Add to the end of `tests/dashboard/metrics.spec.mjs`:

```js
import { buildPassRateSeries, computeKpis } from '../../scripts/dashboard/metrics.mjs';

test.describe('computeKpis', () => {
  test('derives latest pass rate, tests, flaky and green streak', () => {
    // newest-first: pass, pass, fail
    const runs = [
      makeRun(30, { tests: 10, passed: 10 }),
      makeRun(29, { tests: 10, passed: 10 }),
      makeRun(28, { tests: 10, passed: 8, failed: 2 })
    ];
    expect(computeKpis(runs)).toEqual({ passRate: 100, tests: 10, flaky: 0, greenStreak: 2 });
  });

  test('flaky runs do not break the green streak', () => {
    const runs = [
      makeRun(3, { flaky: 1 }),     // failed: 0 -> counts
      makeRun(2, { tests: 10, passed: 10 }),
      makeRun(1, { passed: 9, failed: 1 })
    ];
    expect(computeKpis(runs).greenStreak).toBe(2);
  });

  test('returns null when no run has totals', () => {
    expect(computeKpis([makeRun(1, { withTotals: false })])).toBeNull();
  });
});

test.describe('buildPassRateSeries', () => {
  test('returns oldest-to-newest points with rounded pct', () => {
    const runs = [
      makeRun(3, { tests: 10, passed: 9 }),
      makeRun(2, { tests: 10, passed: 10 }),
      makeRun(1, { tests: 10, passed: 8 })
    ];
    const series = buildPassRateSeries(runs, 30);
    expect(series.map((p) => p.number)).toEqual(['1', '2', '3']);
    expect(series.map((p) => p.pct)).toEqual([80, 100, 90]);
  });

  test('skips runs without totals or with zero tests', () => {
    const runs = [
      makeRun(2, { tests: 10, passed: 10 }),
      makeRun(1, { withTotals: false })
    ];
    expect(buildPassRateSeries(runs, 30)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:dashboard -- tests/dashboard/metrics.spec.mjs`
Expected: FAIL — `computeKpis`/`buildPassRateSeries` are not exported.

- [ ] **Step 3: Add the functions to `scripts/dashboard/metrics.mjs`**

```js
export function computeKpis(runs) {
  const summarized = runs.filter((run) => run.totals);

  if (summarized.length === 0) {
    return null;
  }

  const latest = summarized[0];
  const passRate = latest.totals.tests === 0
    ? 0
    : Math.round((latest.totals.passed / latest.totals.tests) * 100);

  let greenStreak = 0;
  for (const run of summarized) {
    if (run.totals.failed === 0) {
      greenStreak += 1;
    } else {
      break;
    }
  }

  return {
    passRate,
    tests: latest.totals.tests,
    flaky: latest.totals.flaky,
    greenStreak
  };
}

export function buildPassRateSeries(runs, max) {
  const withTotals = runs.filter((run) => run.totals && run.totals.tests > 0);

  return capRuns(withTotals, max)
    .slice()
    .reverse()
    .map((run) => ({
      number: run.number,
      pct: Math.round((run.totals.passed / run.totals.tests) * 100),
      passed: run.totals.passed,
      tests: run.totals.tests
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:dashboard -- tests/dashboard/metrics.spec.mjs`
Expected: PASS (all metrics tests).

- [ ] **Step 5: Commit**

```bash
git add tests/dashboard/metrics.spec.mjs scripts/dashboard/metrics.mjs
git commit -m "feat: add computeKpis and buildPassRateSeries to dashboard metrics"
```

---

## Task 4: Extract `html.mjs` and rewire `template.mjs`

This is a mechanical extraction: move the shared helpers out of `template.mjs` into `html.mjs`, then import them back. `buildRootPage`'s body is rewritten later (Task 6).

**Files:**
- Create: `scripts/dashboard/html.mjs`
- Modify: `scripts/dashboard/template.mjs`
- Create: `tests/dashboard/template.spec.mjs` (html helper tests; grows in Task 6)

- [ ] **Step 1: Write the failing test**

Create `tests/dashboard/template.spec.mjs`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:dashboard -- tests/dashboard/template.spec.mjs`
Expected: FAIL — cannot find module `scripts/dashboard/html.mjs`.

- [ ] **Step 3: Create `scripts/dashboard/html.mjs`**

```js
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatPassed(summary) {
  return `${summary.passed}/${summary.tests} passed`;
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function buildPage({ title, stylesheetHref, eyebrow, body }) {
  const aside = body.side
    ? `      <aside class="hero-side">
        ${body.side}
      </aside>
`
    : '';
  const heroClass = body.side ? 'hero' : 'hero hero--solo';

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
    <section class="${heroClass}">
      <div class="hero-main">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        ${body.hero}
      </div>
${aside}    </section>
    ${body.sections}
  </main>
</body>
</html>`;
}
```

- [ ] **Step 4: Rewire `scripts/dashboard/template.mjs` to import from `html.mjs`**

At the top of `template.mjs`, add:

```js
import { buildPage, escapeHtml, formatDate, formatPassed } from './html.mjs';
```

Then **delete** the now-duplicated definitions from `template.mjs`: `escapeHtml`, `formatPassed`, `formatDate`, and `buildPage`. Leave `buildRootPage`, `buildReportHub`, `buildSummaryCards`, and `buildRunMetrics` in place for now (Task 6 rewrites them). `buildReportHub` keeps passing `body.side`, so it still renders the two-column hero.

- [ ] **Step 5: Run html tests to verify they pass**

Run: `npm run test:dashboard -- tests/dashboard/template.spec.mjs`
Expected: PASS (5 tests).

- [ ] **Step 6: Verify the build still imports cleanly (smoke)**

Run: `node --check scripts/dashboard/template.mjs && node -e "import('./scripts/dashboard/template.mjs').then(m => console.log(Object.keys(m).join(',')))"`
Expected: prints `buildRootPage,buildReportHub` (no import error).

- [ ] **Step 7: Commit**

```bash
git add scripts/dashboard/html.mjs scripts/dashboard/template.mjs tests/dashboard/template.spec.mjs
git commit -m "refactor: extract dashboard html helpers into html.mjs"
```

---

## Task 5: `charts.mjs` — pass-rate chart + status timeline

**Files:**
- Create: `tests/dashboard/charts.spec.mjs`
- Create: `scripts/dashboard/charts.mjs`

- [ ] **Step 1: Write the failing test**

Create `tests/dashboard/charts.spec.mjs`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:dashboard -- tests/dashboard/charts.spec.mjs`
Expected: FAIL — cannot find module `scripts/dashboard/charts.mjs`.

- [ ] **Step 3: Create `scripts/dashboard/charts.mjs`**

```js
import { escapeHtml, formatDate } from './html.mjs';
import { runStatus } from './metrics.mjs';

const LEFT = 46;
const RIGHT = 1030;
const TOP = 20;
const BOTTOM = 150;
const Y_MIN = 50;
const Y_MAX = 100;
const MID = (TOP + BOTTOM) / 2;

export function passRateChartSvg(series) {
  if (series.length === 0) {
    return '<div class="empty">No pass-rate history yet.</div>';
  }

  const x = (i) => series.length === 1
    ? RIGHT
    : LEFT + ((RIGHT - LEFT) * i) / (series.length - 1);
  const y = (pct) => {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, pct));
    return BOTTOM - ((clamped - Y_MIN) / (Y_MAX - Y_MIN)) * (BOTTOM - TOP);
  };

  const points = series
    .map((point, i) => `${x(i).toFixed(1)},${y(point.pct).toFixed(1)}`)
    .join(' ');
  const area = `${LEFT},${BOTTOM} ${points} ${RIGHT},${BOTTOM}`;
  const dots = series.map((point, i) => {
    const title = `Run #${point.number} · ${point.passed}/${point.tests} · ${point.pct}% pass`;
    return `<circle cx="${x(i).toFixed(1)}" cy="${y(point.pct).toFixed(1)}" r="4.5" fill="var(--green)"><title>${escapeHtml(title)}</title></circle>`;
  }).join('');

  return `<svg class="chart" viewBox="0 0 1040 190" preserveAspectRatio="none" role="img">
  <line class="axis" x1="${LEFT}" y1="${TOP}" x2="${LEFT}" y2="${BOTTOM}"/>
  <line class="axis" x1="${LEFT}" y1="${BOTTOM}" x2="${RIGHT}" y2="${BOTTOM}"/>
  <line class="axis" x1="${LEFT}" y1="${TOP}" x2="${RIGHT}" y2="${TOP}" stroke-dasharray="3 4" opacity="0.5"/>
  <line class="axis" x1="${LEFT}" y1="${MID}" x2="${RIGHT}" y2="${MID}" stroke-dasharray="3 4" opacity="0.5"/>
  <text class="axlab" x="6" y="${TOP + 4}">100%</text>
  <text class="axlab" x="14" y="${MID + 4}">75%</text>
  <text class="axlab" x="14" y="${BOTTOM + 4}">50%</text>
  <polygon fill="rgba(8,127,91,0.10)" points="${area}"/>
  <polyline fill="none" stroke="var(--green)" stroke-width="2.5" points="${points}"/>
  ${dots}
</svg>`;
}

export function statusTimelineHtml(runs) {
  if (runs.length === 0) {
    return '<div class="empty">No runs published yet.</div>';
  }

  const squares = runs
    .slice()
    .reverse()
    .map((run) => {
      const status = runStatus(run);
      const result = run.totals
        ? `${run.totals.passed}/${run.totals.tests} · ${status}`
        : status;
      const title = `Run #${run.number} · ${result} · ${formatDate(run.createdAt)} — open report`;
      const href = run.monocart ?? run.actionUrl ?? '#';
      return `<a class="sq ${status}" href="${escapeHtml(href)}" title="${escapeHtml(title)}"></a>`;
    })
    .join('');

  return `<div class="tl">${squares}</div>
<div class="tl-legend">
  <span><i class="sw pass"></i>passed</span>
  <span><i class="sw flaky"></i>flaky</span>
  <span><i class="sw fail"></i>failed</span>
</div>
<p class="note">Click a square to open that run's report.</p>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:dashboard -- tests/dashboard/charts.spec.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/dashboard/charts.spec.mjs scripts/dashboard/charts.mjs
git commit -m "feat: add pass-rate chart and status timeline generators"
```

---

## Task 6: Rewrite `buildRootPage` to render the widgets

**Files:**
- Modify: `scripts/dashboard/template.mjs`
- Modify: `tests/dashboard/template.spec.mjs`

- [ ] **Step 1: Append failing tests**

Add to the end of `tests/dashboard/template.spec.mjs`:

```js
import { buildRootPage } from '../../scripts/dashboard/template.mjs';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:dashboard -- tests/dashboard/template.spec.mjs`
Expected: FAIL — current `buildRootPage` has no `kpis`/`chart`/`tl` markup and ignores `maxRuns`.

- [ ] **Step 3: Replace the imports and `buildRootPage`/`buildSummaryCards` in `template.mjs`**

Replace the import line added in Task 4 with:

```js
import { buildPage, escapeHtml, formatDate, formatPassed } from './html.mjs';
import { buildPassRateSeries, capRuns, computeKpis } from './metrics.mjs';
import { passRateChartSvg, statusTimelineHtml } from './charts.mjs';

const DEFAULT_MAX_RUNS = 30;
```

Delete the existing `buildRootPage` and `buildSummaryCards` functions and replace them with:

```js
export function buildRootPage(runs, options = {}) {
  const maxRuns = options.maxRuns ?? DEFAULT_MAX_RUNS;
  const visibleRuns = capRuns(runs, maxRuns);
  const latest = visibleRuns[0];
  const kpis = computeKpis(visibleRuns);
  const series = buildPassRateSeries(visibleRuns, maxRuns);
  const runCount = visibleRuns.length;

  const reportButtons = latest
    ? `<div class="actions">
        <a class="button" href="${escapeHtml(latest.monocart)}">Open latest Monocart report</a>
        <a class="button secondary" href="${escapeHtml(latest.playwright)}">Open latest Playwright report</a>
      </div>`
    : '<div class="empty">No published runs yet.</div>';

  const subtitle = latest
    ? `${escapeHtml(latest.branch)} · last ${runCount} run${runCount === 1 ? '' : 's'} · updated ${escapeHtml(formatDate(latest.createdAt))} UTC`
    : 'No runs published yet.';

  const hero = `<h1>Test monitoring</h1>
    <p class="sub">${subtitle}</p>
    ${reportButtons}
    ${buildKpiCards(kpis)}`;

  const sections = `<section class="section">
      <h2>Pass rate · last ${runCount} run${runCount === 1 ? '' : 's'}</h2>
      ${passRateChartSvg(series)}
    </section>
    <section class="section">
      <h2>Status timeline</h2>
      ${statusTimelineHtml(visibleRuns)}
    </section>
    <section class="section">
      <h2>Run history</h2>
      <div class="run-list">${buildRunHistory(visibleRuns)}</div>
    </section>`;

  return buildPage({
    title: 'Playwright Monitoring Dashboard',
    stylesheetHref: 'dashboard.css',
    eyebrow: 'Playwright report history',
    body: { hero, sections }
  });
}

function buildKpiCards(kpis) {
  if (!kpis) {
    return '<div class="empty">No report metrics have been published yet.</div>';
  }

  const cards = [
    { tone: 'green', label: 'Latest pass rate', value: `${kpis.passRate}%` },
    { tone: 'blue', label: 'Tests run', value: kpis.tests },
    { tone: 'amber', label: 'Flaky (latest)', value: kpis.flaky },
    { tone: 'green', label: 'Green streak', value: kpis.greenStreak }
  ];

  return `<div class="kpis">${cards.map((card) => `
    <div class="kpi ${card.tone}">
      <span class="label">${escapeHtml(card.label)}</span>
      <span class="num">${escapeHtml(card.value)}</span>
    </div>`).join('')}</div>`;
}

function buildRunHistory(runs) {
  if (runs.length === 0) {
    return '<div class="empty">No runs have been published.</div>';
  }

  return runs.map((run) => `
    <article class="run-item">
      <div>
        <p class="run-title">Run #${escapeHtml(run.number)} · ${escapeHtml(formatDate(run.createdAt))}</p>
        <p>${escapeHtml(run.branch)} · ${escapeHtml(run.sha)} · attempt ${escapeHtml(run.attempt)}</p>
        ${buildRunMetrics(run)}
      </div>
      <div class="run-links">
        <a class="pill" href="${escapeHtml(run.monocart)}">Monocart</a>
        <a class="pill" href="${escapeHtml(run.playwright)}">Playwright</a>
        <a class="pill" href="${escapeHtml(run.actionUrl)}">Actions</a>
      </div>
    </article>
  `).join('');
}
```

Keep the existing `buildRunMetrics` function but add a flaky indicator. Replace it with:

```js
function buildRunMetrics(run) {
  if (!run.totals) {
    return '<div class="run-metrics"><span class="status-badge unknown">Metrics unavailable</span></div>';
  }

  const status = run.totals.failed > 0 ? 'failed' : 'passed';
  const ui = run.reports?.ui;
  const api = run.reports?.api;

  return `<div class="run-metrics">
    <span class="status-badge ${status}">${escapeHtml(formatPassed(run.totals))}</span>
    ${run.totals.flaky > 0 ? `<span class="flaky-note">${escapeHtml(run.totals.flaky)} flaky</span>` : ''}
    ${ui ? `<span>UI ${escapeHtml(formatPassed(ui))}${ui.duration ? ` · ${escapeHtml(ui.duration)}` : ''}</span>` : ''}
    ${api ? `<span>API ${escapeHtml(formatPassed(api))}${api.duration ? ` · ${escapeHtml(api.duration)}` : ''}</span>` : ''}
  </div>`;
}
```

- [ ] **Step 4: Run all dashboard tests to verify they pass**

Run: `npm run test:dashboard`
Expected: PASS (metrics + charts + template specs).

- [ ] **Step 5: Commit**

```bash
git add scripts/dashboard/template.mjs tests/dashboard/template.spec.mjs
git commit -m "feat: render KPI cards, pass-rate chart and status timeline on dashboard home"
```

---

## Task 7: Build orchestrator — use `metrics`, add cap + prune

**Files:**
- Modify: `scripts/build-pages-dashboard.mjs`

- [ ] **Step 1: Replace the duplicated helpers with imports**

In `scripts/build-pages-dashboard.mjs`:

1. Change the `node:fs/promises` import to include `readdir`:

```js
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
```

2. Add an import for the moved metrics helpers (after the `template.mjs` import):

```js
import { capRuns, summaryValue, totalReports } from './dashboard/metrics.mjs';
```

3. **Delete** the local `summaryValue(...)` and `totalReports(...)` function definitions from this file (they now live in `metrics.mjs`; the imports replace them).

- [ ] **Step 2: Add the `DASHBOARD_MAX_RUNS` constant and a prune helper**

Near the other `const ... = process.env...` declarations at the top, add:

```js
const maxRuns = Number(process.env.DASHBOARD_MAX_RUNS ?? 30);
```

Add this function above `main`:

```js
async function pruneRuns(keepIds) {
  const runsRoot = path.join(pagesDir, 'runs');

  if (!existsSync(runsRoot)) {
    return;
  }

  const entries = await readdir(runsRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !keepIds.has(entry.name)) {
      await rm(path.join(runsRoot, entry.name), { recursive: true, force: true });
    }
  }
}
```

- [ ] **Step 3: Cap and prune inside `main`**

In `main`, after the `runs` array is built (the `await Promise.all([...].map(enrichRun))` block) and before the report-hub pages are written, insert:

```js
  const visibleRuns = capRuns(runs, maxRuns);
  await pruneRuns(new Set(visibleRuns.map((item) => item.id)));
```

Then change the two write calls to use `visibleRuns`:

```js
  await writeFile(runsPath, `${JSON.stringify(visibleRuns, null, 2)}\n`);
  await writeFile(path.join(pagesDir, 'index.html'), buildRootPage(visibleRuns));
```

(The current-run report-hub pages under `runDir` are still written from `run`, unchanged — the current run is always newest, so it is always in `visibleRuns`.)

- [ ] **Step 4: Smoke-test the build with no artifacts (empty dashboard renders)**

```bash
SCRATCH=/private/tmp/claude-501/-Users-gobu/9e66dff4-841b-46cd-97a3-91067c02bdfe/scratchpad/dash
rm -rf "$SCRATCH" && mkdir -p "$SCRATCH"
PAGES_DIR="$SCRATCH/pages" ARTIFACTS_DIR="$SCRATCH/none" npm run dashboard:build
test -f "$SCRATCH/pages/index.html" && grep -q "No published runs yet" "$SCRATCH/pages/index.html" && echo OK
```
Expected: prints `OK`.

- [ ] **Step 5: Verify cap + prune with a seeded history**

```bash
SCRATCH=/private/tmp/claude-501/-Users-gobu/9e66dff4-841b-46cd-97a3-91067c02bdfe/scratchpad/dash
rm -rf "$SCRATCH" && mkdir -p "$SCRATCH/pages/runs"
node -e '
const fs = require("fs");
const dir = process.env.SCRATCH + "/pages";
const runs = Array.from({length: 40}, (_, i) => {
  const n = 40 - i;
  fs.mkdirSync(`${dir}/runs/old-${n}`, {recursive: true});
  return { id: `old-${n}`, number: String(n), attempt: "1", branch: "main",
    sha: "abc1234", createdAt: new Date(Date.UTC(2026,5,25,n,0)).toISOString(),
    actionUrl: "#", monocart: `runs/old-${n}/monocart/`, playwright: `runs/old-${n}/playwright/`,
    totals: { tests: 10, passed: 10 - (n % 3 === 0 ? 1 : 0), failed: n % 3 === 0 ? 1 : 0, skipped: 0, flaky: 0 } };
});
fs.writeFileSync(`${dir}/runs.json`, JSON.stringify(runs, null, 2));
' SCRATCH="$SCRATCH"
PAGES_DIR="$SCRATCH/pages" ARTIFACTS_DIR="$SCRATCH/none" DASHBOARD_MAX_RUNS=30 GITHUB_RUN_ID=current npm run dashboard:build
echo "runs.json entries: $(node -e 'console.log(require(process.argv[1]).length)' "$SCRATCH/pages/runs.json")"
echo "run dirs kept: $(ls "$SCRATCH/pages/runs" | wc -l | tr -d ' ')"
```
Expected: `runs.json entries: 30` and `run dirs kept: 30` (the 40 seeded dirs are pruned down to the newest 30 plus the freshly created `current` run, which replaces the oldest — confirm the count is 30 and that `old-1` … `old-10` are gone).

- [ ] **Step 6: Commit**

```bash
git add scripts/build-pages-dashboard.mjs
git commit -m "feat: cap dashboard history and prune old run folders"
```

---

## Task 8: Dashboard styles

**Files:**
- Modify: `scripts/dashboard/dashboard.css`

- [ ] **Step 1: Add the `--red` token**

In the `:root` block, after `--amber: #b45309;`, add:

```css
  --red: #9f1239;
```

- [ ] **Step 2: Remove the now-unused summary-card styles**

Delete the `.summary-grid { ... }` and `.summary-card { ... }` rule blocks (the KPI cards replace them).

- [ ] **Step 3: Append the widget styles**

Add at the end of the file (before the `@media (max-width: 760px)` block):

```css
.hero--solo {
  grid-template-columns: 1fr;
}

.sub {
  margin: 6px 0 22px;
  color: var(--muted);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.kpi {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
}

.kpi .num {
  display: block;
  margin-top: 6px;
  font-size: 34px;
  font-weight: 850;
  line-height: 1;
}

.kpi.green .num { color: var(--green); }
.kpi.blue .num { color: var(--blue); }
.kpi.amber .num { color: var(--amber); }

.chart {
  width: 100%;
  height: 190px;
}

.axis { stroke: var(--line); }

.axlab {
  fill: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.tl {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.sq {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-decoration: none;
}

.sq.passed { background: #1faf73; }
.sq.flaky { background: var(--amber); }
.sq.failed { background: var(--red); }
.sq.unknown { background: var(--line); }

.tl-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.tl-legend .sw {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 5px;
  border-radius: 3px;
  vertical-align: -1px;
}

.sw.pass { background: #1faf73; }
.sw.flaky { background: var(--amber); }
.sw.fail { background: var(--red); }

.flaky-note { color: var(--amber); }

.note {
  margin-top: 14px;
  color: var(--muted);
  font-size: 13px;
}
```

- [ ] **Step 4: Make the KPI grid responsive**

In the `@media (max-width: 760px)` block, add `.kpis` to the list that collapses to one column:

```css
  .hero,
  .kpis,
  .run-item,
  .report-grid {
    grid-template-columns: 1fr;
  }
```

(Remove `.summary-grid` from that selector list since the rule no longer exists.)

- [ ] **Step 5: Visually verify the rendered dashboard**

```bash
SCRATCH=/private/tmp/claude-501/-Users-gobu/9e66dff4-841b-46cd-97a3-91067c02bdfe/scratchpad/dash
rm -rf "$SCRATCH" && mkdir -p "$SCRATCH/pages/runs"
node -e '
const fs = require("fs");
const dir = process.env.SCRATCH + "/pages";
const runs = Array.from({length: 12}, (_, i) => {
  const n = 12 - i;
  return { id: `old-${n}`, number: String(n), attempt: "1", branch: "main",
    sha: "abc1234", createdAt: new Date(Date.UTC(2026,5,25,n,0)).toISOString(),
    actionUrl: "#", monocart: `runs/old-${n}/monocart/`, playwright: `runs/old-${n}/playwright/`,
    totals: { tests: 27, passed: 27 - (n % 4 === 0 ? 2 : 0), failed: n % 4 === 0 ? 2 : 0, skipped: 0, flaky: n % 5 === 0 ? 1 : 0 } };
});
fs.writeFileSync(`${dir}/runs.json`, JSON.stringify(runs, null, 2));
' SCRATCH="$SCRATCH"
PAGES_DIR="$SCRATCH/pages" ARTIFACTS_DIR="$SCRATCH/none" GITHUB_RUN_ID=current npm run dashboard:build
echo "Open: $SCRATCH/pages/index.html"
```
Expected: open the printed path in a browser — KPI cards, pass-rate chart with hover tooltips, colored status timeline, and run history all render against the real stylesheet.

- [ ] **Step 6: Commit**

```bash
git add scripts/dashboard/dashboard.css
git commit -m "style: add KPI, chart and timeline styles to dashboard"
```

---

## Task 9: CI — dashboard unit-test job + deploy gate

**Files:**
- Modify: `.github/workflows/playwright.yml`

- [ ] **Step 1: Add the `dashboard-tests` job**

After the `security` job (before `ui-tests`), add:

```yaml
  dashboard-tests:
    name: Dashboard Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run dashboard unit tests
        run: npm run test:dashboard
```

(No browser install — the `dashboard` project never launches one.)

- [ ] **Step 2: Gate the deploy job on it**

In the `deploy-dashboard` job's `needs:` list, add `dashboard-tests`:

```yaml
    needs:
      - ui-tests
      - api-tests
      - dashboard-tests
```

- [ ] **Step 3: Validate the workflow YAML parses**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/playwright.yml','utf8'); if(!y.includes('dashboard-tests')) throw new Error('missing job'); console.log('OK')"`
Expected: prints `OK`. (If `js-yaml` is available, also `npx --yes js-yaml .github/workflows/playwright.yml >/dev/null && echo PARSED`.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/playwright.yml
git commit -m "ci: run dashboard unit tests and gate deploy on them"
```

---

## Task 10: Documentation

**Files:**
- Modify: `docs/monitoring-dashboard.md`

- [ ] **Step 1: Document the widgets and KPIs**

In the **GitHub Pages Dashboard** section, replace the paragraph that begins "The dashboard home page shows a monitoring summary with latest result, runs tracked, green run count, and historical failure count." and the following bullet/paragraph with:

```markdown
The dashboard home page is a monitoring view built entirely at build time (no
client JavaScript). It shows:

- **KPI cards** — latest pass rate, tests run, flaky count (latest run), and
  **green streak** (consecutive most-recent runs with zero failures; flaky runs
  do not break the streak).
- **Pass-rate trend** — an inline SVG line chart of pass % across the last
  `DASHBOARD_MAX_RUNS` runs. Each point exposes a native SVG `<title>` tooltip.
- **Status timeline** — one colored square per run (passed / flaky / failed),
  each linking to that run's report hub.
- **Run history** — per-run totals, UI/API breakdown, and links to the Monocart,
  Playwright, and Actions pages.

Three paths reach the actual Monocart/Playwright HTML reports: the hero buttons
("Open latest …"), any status-timeline square, and the per-run history links.
```

- [ ] **Step 2: Document retention/capping**

In the **Reports and Artifacts** section, replace the paragraph beginning "The dashboard builder reads Monocart `index.json` files for each published run..." with:

```markdown
The dashboard builder reads Monocart `index.json` files for each published run and
stores summarized UI/API metrics in `runs.json`. When a new run publishes, it also
backfills metrics for older runs that already have Monocart JSON on `gh-pages`.

History is capped by the `DASHBOARD_MAX_RUNS` environment variable (default `30`).
On each publish, `runs.json` is trimmed to the newest `DASHBOARD_MAX_RUNS` entries
and run folders outside that window are pruned from `gh-pages`, keeping the branch
bounded.
```

- [ ] **Step 3: Document the test command**

In the **Local Monitoring Commands** section, add `npm run test:dashboard` to the "faster focused checks" block:

```bash
npm run test:dashboard
```

And in the **Health Overview** table, add a row:

```markdown
| Dashboard logic | Pure builder functions pass unit tests | `Dashboard Unit Tests` CI job | Passing |
```

- [ ] **Step 4: Trim implemented Improvement Ideas**

In **Current Limitations / Improvement Ideas**, remove the now-implemented item
"Add a retention policy if the `gh-pages` branch grows too large over time."
(Leave the CodeQL, cross-browser, and richer-annotations ideas.)

- [ ] **Step 5: Commit**

```bash
git add docs/monitoring-dashboard.md
git commit -m "docs: document dashboard widgets, retention cap and unit tests"
```

---

## Task 11: Full local verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck, lint, and dashboard unit tests**

Run: `npm run typecheck && npm run lint && npm run test:dashboard`
Expected: all pass. (`typecheck` covers `tests/**/*.ts` + `playwright.config.ts`; the new `.mjs` files are linted by ESLint's base config.)

- [ ] **Step 2: Confirm no stray references to removed helpers**

Run: `grep -rn "buildSummaryCards\|summary-grid\|summary-card" scripts/ ; echo "exit: $?"`
Expected: no matches (grep exit `1`). If anything prints, remove the leftover reference.

- [ ] **Step 3: Final preview render sanity check**

Re-run the Task 8 Step 5 preview command and open the page; confirm KPI cards,
chart, timeline, and history render with no console errors and the report links
point at `runs/<id>/monocart/` and `runs/<id>/playwright/`.

- [ ] **Step 4: Confirm clean tree**

Run: `git status --short`
Expected: empty (all work committed; the scratch preview lives outside the repo).

---

## Self-Review

- **Spec coverage:** widgets (Tasks 5–6, 8), report access (Task 6), modular refactor (Tasks 4–7), cap + prune / `DASHBOARD_MAX_RUNS` (Task 7), unit tests + node-only project (Tasks 1–6, 9), docs (Task 10), CI gate (Task 9). All spec sections map to tasks.
- **Placeholders:** none — every code/test step contains full content.
- **Type/name consistency:** `runStatus`, `capRuns`, `summaryValue`, `totalReports`, `computeKpis`, `buildPassRateSeries`, `passRateChartSvg`, `statusTimelineHtml`, `buildPage`, `escapeHtml`, `formatDate`, `formatPassed`, `buildRootPage`, `pruneRuns`, `DASHBOARD_MAX_RUNS`/`maxRuns` are used consistently across tasks. Status class names (`passed`/`failed`/`flaky`/`unknown`) match between `charts.mjs`, `metrics.runStatus`, and `dashboard.css`.
