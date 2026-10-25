'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'online/v012-core.css'),'utf8');
const gothic=fs.readFileSync(path.join(root,'online/v012-gothic-panels.js'),'utf8');
const ids=["barrier","static","soul-harvest","golden-focus","umbral-refuge","dawnward","dawnstar-bloom","last-sunrise","wildroot-volley","thunderstep","haste","focus","heat","soul","counter-ready","boss-barrier","enraged","second-wind-used","bleed","burn","rot","shock","dawn-mark","next-attack-weakened","chilled","sunder","weakened","healing-reduction","event-might","event-ironhide","event-attack","event-defense","event-curse","event-barrier","event-runeBoost","event-bounty","event-echo","event-item"];
test('all 38 Drive status icons have their own real PNGs',()=>{
 assert.equal(ids.length,38);
 const match=html.match(/const STATUS_ICON_FILES=new Set\((\[[^\n]*\])\)/);
 assert(match,'missing status whitelist');
 assert.deepEqual(JSON.parse(match[1]),ids);
 for(const id of ids){const name=path.join(root,'assets/status/icons/'+id+'.png');
  assert(fs.existsSync(name),'missing '+name);
  assert.equal(fs.readFileSync(name).toString('hex',0,8),'89504e470d0a1a0a','invalid PNG: '+id);
 }
 assert.doesNotMatch(css,/background-image:url\('\.\.\/assets\/status\/icons-atlas\.png'\)/);
});
test('dialogs disable corner PNG layers while game panels retain decoration',()=>{
 assert.match(gothic,/if \(panel\.matches\('dialog'\)\)/);
 assert.match(gothic,/panel\.querySelector\(':scope > \.gothic-corner-layer'\)\?\.remove\(\)/);
 assert.match(gothic,/const largeSelector/);
});
