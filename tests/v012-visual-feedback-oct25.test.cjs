'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const css=read('online/v012-uiux-polish.css');
const qa=read('online/v012-uiux-final-qa.css');
test('v0.12 QA keeps the final stylesheet last and separates the right-hand Stats and Bag',()=>{
 assert.match(html,/v012-uiux-polish\.css"><link rel="stylesheet" href="online\/v012-uiux-final-qa\.css"/);
 const block=html.slice(html.indexOf('const equipmentPane='),html.indexOf('const panes=',html.indexOf('const equipmentPane=')));
 assert.match(block,/phase3BetweenSide/);
 assert.match(block,/phase3BetweenStatsRail/);
 assert.ok(block.indexOf('phase3BetweenStatsRail')<block.indexOf('phase3BetweenBagPane'));
 assert.match(css,/\.phase3BetweenStatsRail \.phase3PrimaryAttributeStrip/);
});
test('rarity icon black inset is halved and all source images stay contained',()=>{
 assert.match(css,/inset:6%!important/);
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/\.rarityImageFrame>img/);
 assert.match(css,/radial-gradient\(circle at 50% 32%,#403d43,#302e33 78%\)/);
});
test('Camp potions remain square and reuse the grey inventory icon background',()=>{
 assert.match(css,/phase3CampCharacter \.paper>\.phase3PotionSlots>\.phase3PotionSlot/);
 assert.match(css,/aspect-ratio:1\/1!important/);
 assert.match(qa,/background:linear-gradient\(145deg,#37343a,#29272d\)/);
});
test('Expedition illustrations are not cropped and modular button caps retain original ratio',()=>{
 assert.match(css,/phase3ExpeditionPanel \.phase3Portal/);
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/mask-image:none!important/);
 assert.match(qa,/background-size:auto 100%,auto 100%!important/);
});
test('City Center art fits its original aspect and passive dialog stays bounded',()=>{
 assert.match(css,/cityCenterNpcArt>img/);
 assert.match(css,/aspect-ratio:auto!important/);
 assert.match(css,/dialog\[data-realm-passive\]/);
 assert.match(css,/width:min\(1040px,calc\(100vw - 40px\)\)/);
});
test('combat arena uses the actual Realm artwork under a semi-transparent overlay',()=>{
 assert.match(css,/\.combatLayout \.scene/);
 assert.match(css,/var\(--phase3-realm-image\)!important/);
 assert.match(css,/\.phase5VisualSummary\[style\*="--phase3-realm-image"\]/);
});
test('Grave Lantern display is smaller without changing original gif or hitboxes',()=>{
 assert.match(css,/enemyPortrait\[data-attack-src\*="grave_lantern_"\]/);
 assert.doesNotMatch(css,/hitbox|combatDamage|r\.enemy\.hp=/);
});
