'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('index.html'),runtime=read('online/v012-expedition-runtime.js'),css=read('online/v012-uiux-polish.css');
test('v0.12 visual polish loads after unified inventory rules',()=>{
 assert.match(html,/v012-ui6-unified-inventory\.css"><link rel="stylesheet" href="online\/v012-uiux-polish\.css"/);
});
test('v0.12 UI bag proportions and original PNG aspect ratios are protected',()=>{
 assert.match(css,/phase3BagGrid>\.phase3BagItem/);
 assert.match(css,/aspect-ratio:1\/1!important/);
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/phase3BetweenBagPane \.phase3Bag\{/);
 assert.match(css,/max-width:465px!important/);
});
test('v0.12 passives show real one or two affinity icons without modifying passives',()=>{
 assert.match(html,/families=passive\.requires\?\.length\?passive\.requires:\[passive\.family\]/);
 assert.match(html,/class="phase3PassiveAffinities"/);
 assert.match(html,/families\.map\(phase2FamilyIcon\)/);
});
test('v0.12 initial affinity Close only cancels before selection',()=>{
 assert.match(html,/dialog\.addEventListener\('close',\(\)=>\{/);
 assert.match(html,/current\?\.stage==='choice'&&current\.planeIndex===1&&!current\.initialFamily/);
 assert.match(html,/phase6BackToCamp\(\)/);
});
test('v0.12 event return waits for passive reward and clears pending exit',()=>{
 assert.match(runtime,/const eventExitPending=!!ports\.phase5Results\?\.eventExitPending&&!ports\.state\.run/);
 assert.match(runtime,/if\(eventExitPending\)return phase5ExitResult\(\)/);
});
test('v0.12 creature overrides only scale the named animated portraits',()=>{
 assert.match(css,/enemyPortrait\[data-attack-src\*="bloom_wisp_"\]/);
 assert.match(css,/enemyPortrait\[data-attack-src\*="sanguine_leech_"\]/);
 assert.doesNotMatch(css,/hitbox|damage|animation-duration/);
});

// Run the Oct 25 visual QA contract whenever the standard v0.12 suite runs.
require('./v012-visual-feedback-oct25.test.cjs');

// Include post-deployment UI and secure vendor-flow regression checks.
require('./v012-hotfix-oct25.test.cjs');

// Terminal Expedition shopping and final visual regression checks.
require('./v012-camp-economy-and-visual.test.cjs');
