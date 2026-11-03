// Locate Playwright: PW_PATH env, common global node_modules folders, or a local install.
import { createRequire } from 'module';
import { existsSync } from 'fs';
const dirs = [process.env.PW_PATH, '/opt/node22/lib/node_modules/', '/usr/local/lib/node_modules/', '/usr/lib/node_modules/', process.cwd() + '/node_modules/']
  .filter(Boolean).map(d => (d.endsWith('/') ? d : d + '/'));
let chromium = null;
for (const d of dirs) {
  if (existsSync(d + 'playwright')) { chromium = createRequire(d)('playwright').chromium; break; }
}
if (!chromium) chromium = (await import('playwright')).chromium;
export { chromium };
