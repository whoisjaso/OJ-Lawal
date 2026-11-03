// Sweep pages at 390 and 1440: page errors, broken images, horizontal overflow.
// Usage: node qa_sweep.mjs http://localhost:8765 index visit about ...
import { chromium } from './_pw.mjs';
const [, , base, ...pages] = process.argv;
const b = await chromium.launch(); const issues = [];
for (const w of [390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 860 } });
  const p = await ctx.newPage(); p.on('pageerror', e => issues.push(`${w} ${e.message}`));
  for (const pg of pages.length ? pages : ['index']) {
    await p.goto(`${base}/${pg}.html`, { waitUntil: 'networkidle' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 600) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(40); }
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, W: innerWidth, broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')) }));
    if (r.sw > r.W) issues.push(`${w} ${pg} horizontal overflow ${r.sw}px`);
    if (r.broken.length) issues.push(`${w} ${pg} broken images ${r.broken.join(', ')}`);
  }
  await ctx.close();
}
await b.close();
console.log(issues.length ? issues.join('\n') : 'clean');
process.exit(issues.length ? 1 : 0);
