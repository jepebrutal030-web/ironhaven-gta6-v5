// IRONHAVEN deliverable screenshots: 4 shots at 1280x720 JPEG via ?shot=
// URLs, into this repo's screenshots/. Run from the repo root with the game
// served on http://localhost:8080.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHELL = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const FULL = `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;
const exe = fs.existsSync(FULL) ? FULL : SHELL;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../screenshots');
fs.mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { file: '1-cover.jpg', url: 'http://localhost:8080/?shot=chase&seed=1', desc: 'cover: police chase, HUD + minimap + objective' },
  { file: '2-drive.jpg', url: 'http://localhost:8080/?shot=drive&seed=1', desc: 'driving through the city' },
  { file: '3-foot.jpg', url: 'http://localhost:8080/?shot=foot&seed=1', desc: 'on foot, third-person, city street' },
  { file: '4-mission.jpg', url: 'http://localhost:8080/?shot=mission&seed=1', desc: 'mission: harbor job, golden car + Dario' },
];

const ONLY = process.env.SHOTS ? process.env.SHOTS.split(',').map((n) => +n) : null;
for (const shot of SHOTS.filter((s, i) => !ONLY || ONLY.includes(i + 1))) {
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage', '--run-all-compositor-stages-before-draw', '--disable-frame-rate-limit'],
  });
  let done = false;
  for (let attempt = 1; attempt <= 5 && !done; attempt++) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    try {
      await page.goto(shot.url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(8000);
      await page.evaluate(() => window.IRONHAVEN.game.renderer.setAnimationLoop(null));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, shot.file), type: 'jpeg', quality: 88, timeout: 120000 });
      const size = fs.statSync(path.join(OUT, shot.file)).size;
      console.log(`OK  ${shot.file} (${shot.desc}) — ${size} bytes, attempt ${attempt}, errors: ${errors.length ? errors.join(' | ') : 'none'}`);
      if (size > 262144) console.log(`  !! OVER 256 KiB gate (${size} > 262144)`);
      done = true;
    } catch (e) {
      console.log(`RETRY ${shot.file} attempt ${attempt}: ${e.message.split('\n')[0]}`);
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      await page.close();
    }
  }
  if (!done) { console.log(`FAIL ${shot.file} after 5 attempts`); process.exitCode = 1; }
  await browser.close();
}
console.log('done');
