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
