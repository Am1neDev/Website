import { chromium } from 'playwright';
import path from 'node:path';

const url = 'file://' + path.resolve('index.html');
const times = process.argv.slice(2).map(Number);
const stamps = times.length ? times : [0.9, 2.0, 4.2, 5.6, 8.0, 9.6, 12.2, 13.6];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction('window.__fontsReady === true', { timeout: 10000 }).catch(()=>{});

for (const t of stamps) {
  await page.evaluate(tt => window.render(tt), t);
  await page.waitForTimeout(30);
  const name = `out/prev_${String(t).replace('.', '_')}.png`;
  await page.screenshot({ path: name });
  console.log('shot', name);
}
await browser.close();
