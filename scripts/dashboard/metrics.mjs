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

export function capRuns(runs, max) {
  if (!Number.isFinite(max) || max <= 0) {
    return [...runs];
  }

  return runs.slice(0, max);
}

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
