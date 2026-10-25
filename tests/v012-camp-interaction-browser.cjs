'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://fixture');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  try { res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404); res.end('Not found'); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport });
      await page.goto(`http://127.0.0.1:${server.address().port}/?expeditionPhase1=1`);
      await page.locator('.phase3CampCharacter .paper>.model').waitFor({ state: 'visible' });
      await page.waitForFunction(() => [...document.styleSheets].some(sheet => sheet.href?.includes('v012-gothic-panels.css')));
      const camp = page.locator('.phase3CampCharacter .paper');
      const tile = camp.locator('.slotTile[data-slot="weapon"]');
      const tileStyle = await tile.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, frame: el.querySelector('.rarityImageFrame').getBoundingClientRect().toJSON(), label: getComputedStyle(el.querySelector('.slotName')).fontSize }));
      assert.equal(tileStyle.background, 'rgba(0, 0, 0, 0)', 'Camp gear buttons have no fill');
      assert(Math.abs(tileStyle.frame.width - tileStyle.frame.height) < 1, 'equipment image remains square');
      assert(parseFloat(tileStyle.label) >= 9, 'equipment labels remain readable');
      await camp.locator('.model').click({ position: { x: (await camp.locator('.model').boundingBox()).width / 2, y: 130 } });
      await page.locator('dialog[open] .characterPicker').waitFor({ state: 'visible' });
      await page.locator('dialog[open] [data-close]').click();
      await page.locator('[data-phase3-nav="equipment"]').click();
      await page.locator('#brandLogo').click();
      await page.locator('.phase3Camp').waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-phase3-nav="phase1"]').getAttribute('class').then(value => value.includes('primary')), true, 'logo returns to Camp');
      await page.close();
      console.log(`PASS Camp character and logo interactions ${viewport.width}x${viewport.height}`);
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
