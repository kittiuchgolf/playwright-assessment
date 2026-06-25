import { expect, test } from '@playwright/test';
import {
  capRuns,
  runStatus,
  summaryValue,
  totalReports
} from '../../scripts/dashboard/metrics.mjs';

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
