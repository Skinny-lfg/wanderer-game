'use strict';
/* UI.4b structural smoke test. No player state or Firebase is loaded. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'online/v012-ui4.css');
const css = fs.readFileSync(cssPath, 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const assetRoot = path.join(root, 'assets/ui-kit/original');
const expected = {buttons:4,comparison:6,headers:7,hud:5,'nine-slice':8,rarity:5,tabs:24,tooltips:5};
test('original UI.4b PNG packs are present with valid PNG signatures', () => {
  for(const [folder,count] of Object.entries(expected)){
    const files=fs.readdirSync(path.join(assetRoot,folder)).filter(n=>n.endsWith('.png'));
    assert.equal(files.length,count,folder+' unexpected count');
    for(const name of files){
      const data=fs.readFileSync(path.join(assetRoot,folder,name));
      assert.ok(data.length>100,folder+'/'+name+' is empty');
      assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',folder+'/'+name+' malformed PNG');
    }
  }
});
test('UI.4b CSS is active and all local URLs resolve', () => {
  assert.match(html,/href="online\/v012-ui4\.css"/);
  assert.match(css,/UI\.4b \/ Original PNG Art Pack/);
  const urls=[...css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)].map(m=>m[2]);
  assert.ok(urls.length>=64);
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
