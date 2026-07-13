import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import HME from 'h264-mp4-encoder';
import fs from 'node:fs';
import path from 'node:path';

const W = 1080, H = 1920, FPS = 24, T = 14.0;
const FRAMES = Math.round(T * FPS);
const OUT = process.argv[2] || 'snapchat-plus-bns-reel.mp4';
const url = 'file://' + path.resolve('index.html');

console.log(`Rendering ${FRAMES} frames @ ${FPS}fps -> ${OUT}`);

const encoder = await HME.createH264MP4Encoder();
encoder.width = W;
encoder.height = H;
encoder.frameRate = FPS;
encoder.quantizationParameter = 18;   // lower = higher quality
encoder.speed = 4;                     // 0 best..10 fastest
encoder.groupOfPictures = 24;
encoder.initialize();

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb', '--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction('window.__fontsReady === true', { timeout: 15000 }).catch(() => console.log('font wait timeout (continuing)'));
await page.evaluate(() => document.fonts.ready);

const t0 = Date.now();
for (let i = 0; i < FRAMES; i++) {
  const t = i / FPS;
  await page.evaluate(tt => window.render(tt), t);
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  const { data } = PNG.sync.read(buf);           // RGBA, length W*H*4
  encoder.addFrameRgba(new Uint8Array(data.buffer, data.byteOffset, data.length));
  if (i % 30 === 0 || i === FRAMES - 1) {
    const el = ((Date.now() - t0) / 1000).toFixed(0);
    process.stdout.write(`  frame ${i + 1}/${FRAMES}  (${el}s)\n`);
  }
}
await browser.close();

encoder.finalize();
const mp4 = encoder.FS.readFile(encoder.outputFilename);
encoder.delete();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(mp4));
const kb = (mp4.length / 1024).toFixed(0);
console.log(`DONE: ${OUT}  (${kb} KB, ${FRAMES} frames, ${(FRAMES / FPS).toFixed(1)}s)`);
