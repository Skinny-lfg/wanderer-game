'use strict';
/* CSS-only Gothic system smoke test. No player state or Firebase is loaded. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'online/v012-ui4.css');
const css = fs.readFileSync(cssPath, 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
test('shared Gothic CSS is active and free from decorative UI image packs', () => {
  assert.match(html,/href="online\/v012-ui4\.css"/);
  assert.match(css,/Shared Gothic system/);
  const urls=[...css.matchAll(/url\((['"]?)([^)'\"]+)\1\)/g)].map(m=>m[2]);
  const uiImages=urls.filter(u=>u.includes('assets/ui-kit/')&&!u.includes('/fonts/'));
  assert.ok(uiImages.length>0,'Start Expedition illustration is retained');
  assert.ok(uiImages.every(u=>/original\/hud\/0[345]_expedition_(?:left|right|center_tile)\.png$/.test(u)),'only the approved Start Expedition artwork remains');
  assert.ok(urls.some(u=>u.includes('expedition_left.png')),'Start Expedition end cap is retained');
  assert.match(html,/Start Expedition<\/button>/,'Start Expedition label has no trailing arrow');
  for(const u of urls){
    if(/^(data:|https?:)/.test(u))continue;
    assert.ok(fs.existsSync(path.resolve(path.dirname(cssPath),u)),u+' missing');
  }
});
test('existing combat and economy handlers remain in the UI entrypoint', () => {
  for(const fn of ['function phase3CampMarkup','function phase3VitalsMarkup','function previewItem','function itemComparison','function phase5RenderResult']){
    assert.ok(html.includes(fn),fn+' missing');
  }
  assert.ok(html.includes('id="phase2EnterRealm"'),'Realm action missing');
  assert.ok(html.includes('data-city-tab'),'City Center tabs missing');
});
