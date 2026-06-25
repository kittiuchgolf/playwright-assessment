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
