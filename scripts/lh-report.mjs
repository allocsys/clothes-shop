// Prints a short Lighthouse summary from the lh-*.json files in the current folder.
// Used by the CI job "lighthouse" (report only for now: it never fails the build).
// Every line starts with "[lh]".
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';

const files = readdirSync('.').filter((f) => /^lh-.*\.json$/.test(f)).sort();
const lines = [];
const out = (t) => {
  lines.push(t);
  console.log('[lh] ' + t);
};
const pct = (s) => (s == null ? '--' : String(Math.round(s * 100)));

for (const f of files) {
  let r;
  try {
    r = JSON.parse(readFileSync(f, 'utf8'));
  } catch (e) {
    out(f + ': could not read (' + e.message + ')');
    continue;
  }
  const c = r.categories || {};
  const a = r.audits || {};
  const v = (id) => (a[id] && a[id].displayValue ? a[id].displayValue : '--');
  out(
    '=== ' + r.requestedUrl.replace(/^https?:\/\/[^/]+/, '') +
      ' | perf ' + pct(c.performance && c.performance.score) +
      ' a11y ' + pct(c.accessibility && c.accessibility.score) +
      ' best ' + pct(c['best-practices'] && c['best-practices'].score) +
      ' seo ' + pct(c.seo && c.seo.score),
  );
  out('    FCP ' + v('first-contentful-paint') + ' | LCP ' + v('largest-contentful-paint') + ' | TBT ' + v('total-blocking-time') + ' | CLS ' + v('cumulative-layout-shift') + ' | page weight ' + v('total-byte-weight'));
  const bad = [];
  for (const cat of Object.values(c)) {
    for (const ref of cat.auditRefs || []) {
      const au = a[ref.id];
      if (!au || au.score == null || au.score >= 0.9) continue;
      if (ref.weight === 0 && cat.id === 'performance') continue; // opportunities/diagnostics without weight: skip
      bad.push(cat.id + ': ' + au.title + (au.displayValue ? ' (' + au.displayValue + ')' : ''));
      if (cat.id !== 'performance') {
        for (const it of ((au.details && au.details.items) || []).slice(0, 2)) {
          const sn = (it.node && (it.node.snippet || it.node.selector)) || it.description || (it.source && it.source.url) || '';
          if (sn) bad.push('      at ' + String(sn).replace(/\s+/g, ' ').slice(0, 140));
        }
      }
    }
  }
  for (const b of bad.slice(0, 24)) out('    low ' + b);
  if (bad.length > 24) out('    ... and ' + (bad.length - 24) + ' more');
}
out('');
out('TOTAL: ' + files.length + ' pages measured (report only)');
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Lighthouse (mobile)\n\n```\n' + lines.join('\n') + '\n```\n');
}
