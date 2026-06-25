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
