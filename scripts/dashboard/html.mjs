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
