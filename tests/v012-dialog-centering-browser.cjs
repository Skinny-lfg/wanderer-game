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
  try {
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function assertCentered(page, label) {
  const geometry = await page.locator('dialog[open]').evaluate(dialog => {
    const rect = dialog.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
      cssPosition: getComputedStyle(dialog).position,
    };
  });
  const viewport = page.viewportSize();
  assert.equal(geometry.cssPosition, 'fixed', `${label}: dialog is viewport anchored`);
  assert(Math.abs(geometry.x - viewport.width / 2) <= 1, `${label}: horizontal center ${JSON.stringify(geometry)}`);
  assert(Math.abs(geometry.y - viewport.height / 2) <= 1, `${label}: vertical center ${JSON.stringify(geometry)}`);
  assert(geometry.width <= viewport.width && geometry.height <= viewport.height, `${label}: dialog fits viewport`);
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
      const page = await browser.newPage({ viewport });
      await page.goto(`http://127.0.0.1:${server.address().port}/?expeditionPhase1=1`);
      await page.waitForFunction(() => [...document.styleSheets].some(sheet => sheet.href?.includes('v012-gothic-panels.css')));
      await page.evaluate(() => {
        const dialog = document.createElement('dialog');
        dialog.className = 'itemDialog';
        dialog.innerHTML = '<h2>Popup centering check</h2><p>Viewport positioned.</p>';
        document.body.append(dialog);
        dialog.showModal();
      });
      await assertCentered(page, `generic popup ${viewport.width}x${viewport.height}`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height - 80 });
      await assertCentered(page, `resized popup ${viewport.width}x${viewport.height - 80}`);
      await page.locator('dialog[open]').evaluate(dialog => dialog.close());
      await page.close();
      console.log(`PASS popup viewport centering ${viewport.width}x${viewport.height}`);
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
