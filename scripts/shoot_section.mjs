// Screenshot one section of a page on desktop (1440x900) and phone (390x844).
// Usage: node shoot_section.mjs <page-url> <css-selector|top> <out-prefix> [--center]
//   --center centres the selector's closest section in the viewport (good for bands/slides)
import { chromium } from './_pw.mjs';
const [, , url, sel = 'top', out = 'shot'] = process.argv;
const center = process.argv.includes('--center');
const b = await chromium.launch();
for (const [w, h, t] of [[1440, 900, 'd'], [390, 844, 'm']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('ds-visited', '1'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  if (sel !== 'top') {
    const y = await p.evaluate(([s, c]) => { const e = document.querySelector(s); if (!e) return 0; const box = (c ? e.closest('section') || e : e).getBoundingClientRect(); return c ? box.top + scrollY - (innerHeight - box.height) / 2 : box.top + scrollY - 80; }, [sel, center]);
    for (let i = 1; i <= 8; i++) { await p.evaluate(v => scrollTo(0, v), y * i / 8); await p.waitForTimeout(120); }
    await p.waitForTimeout(1600);
  }
  await p.screenshot({ path: `${out}-${t}.png` });
  await ctx.close();
}
await b.close();
console.log(`${out}-d.png ${out}-m.png`);
