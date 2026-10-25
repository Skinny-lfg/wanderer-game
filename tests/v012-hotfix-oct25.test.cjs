'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),css=read('online/v012-uiux-hotfix-oct25.css');
const oldCSS=read('online/v012-uiux-polish.css');
const equipment=read('economy/v012-equipment-runtime.js');

test('Camp Expedition portal fills its panel behind a translucent readability gradient',()=>{
 assert.match(css,/phase3ExpeditionPanel>\.phase3Portal/);
 assert.match(css,/position:absolute!important/);
 assert.match(css,/object-fit:cover!important/);
 assert.match(css,/phase3ExpeditionPanel::before/);
 assert.match(css,/rgba\(13,9,16,\.75\)/);
 assert.match(css,/04_expedition_center_tile\.png/);
});

test('Item and potion rarity use subtle per-rarity fill, and bag and stash tiles remain square',()=>{
 assert.match(css,/--ui-rarity-color/);
 assert.match(css,/color-mix\(in srgb,var\(--ui-rarity-color/);
 assert.match(css,/\.equipmentInventory \.stashGrid>\.invItem/);
 assert.match(css,/\.phase3BetweenSide \.phase3BagGrid>\.phase3BagItem/);
 assert.match(css,/aspect-ratio:1\/1!important/);
 assert.match(html,/rarityArt\(C\.find\(c=>c\.id===\(p\.id\|\|p\.kind\)\)\|\|common/);
});

test('Realm combat keeps background based on persisted run path even when selected realm is cleared',()=>{
 assert.match(html,/phase2Theme\(g\.selected\?\.id\|\|r\?\.path\)/);
 assert.match(css,/var\(--phase3-realm-image,url\("\.\.\/assets\/backgrounds\/dungeon-desktop\.webp"\)\)/);
 assert.match(css,/backdrop-filter:none!important/);
});

test('Between Realms places active buffs in quick status and uses compact attribute chips',()=>{
 assert.match(html,/const quickBuffs=Object\.values\(phase6Run\?\.effects\|\|\{\}\)/);
 assert.match(html,/\+quickBuffs\+'<\/div><nav class="phase3BetweenTabs"/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
});

test('Passive effect labels stay neutral, increased numeric values alone turn green',()=>{
 assert.match(html,/phase3PassivePreviewEntry/);
 assert.match(html,/phase3PassiveIncrease/);
 assert.match(css,/\.phase3PassivePreviewEntry>\.phase3PassiveIncrease/);
 assert.match(css,/color:#7fe2aa!important/);
 assert.match(css,/phase3PassiveDescription/);
});

test('City Center Apothecary no longer replaces the whole page with Camp if an action is unavailable',()=>{
 assert.match(html,/if\(!economyCanAct\(\)\)\{html\('<section class="panel apothecaryPanel"/);
 assert.doesNotMatch(html,/if\(!economyCanAct\(\)\)\{phase3ContentTarget=null;view='phase1';render\(\);return;\}/);
});

test('Merchant and Inventory expose idempotent confirmed valuables sales when outside Expeditions',()=>{
 assert.match(html,/merchantSecondaryGrid[\s\S]*?phase6ValuablesMarkup\(\)\);/);
 assert.match(html,/phase6BindInventoryActions\(\);/);
 assert.match(html,/if\(view==='city-center'\)phase3RenderCityCenter\(\);else renderStash\(\)/);
 assert.match(equipment,/const allowed=!!ports\.state\?\.valuables\?\.length/);
 assert.match(equipment,/ports\.state\.valuables=\[\];ports\.save\(\);return true/);
});

test('Canopy Stalker repositioning is CSS-only and unchanged portrait artwork is used',()=>{
 assert.match(css,/enemyPortrait\[data-attack-src\*="canopy_stalker_"\]/);
 assert.match(css,/top:16px!important/);
});

test('Round 4 fixes: post-Expedition valuables remain saleable, purchases still gated',()=>{
 assert.match(html,/function phase6CanSellValuables\(\)/);
 assert.match(html,/phase3NeedsBagResolution\(\)&&phase3ExpeditionActive\(\)&&!\['phase1','city-center'\]\.includes\(to\)/);
 assert.match(html,/phase3LootIds=new Set\(\)/);
 assert.match(html,/state\.gold<o\.goldPrice\|\|!stashHasRoom\(\)\|\|!economyCanAct\(\)/);
 assert.match(equipment,/ports\.state\.gold\+=securedValue;ports\.state\.valuables=\[\]/);
 const run=read('online/v012-expedition-runtime.js');
 assert.match(run,/if\(returningToCamp\)\{ports\.phase3LootIds=new Set\(\);ports\.phase5Results\.eventExitPending=false;/);
});
test('Round 4: visible arena image and smaller mobile scene',()=>{
 const round=read('online/v012-uiux-round4.css');
 assert.match(html,/class="phase3ArenaBackdrop" src="\$\{esc\(dungeonImage\(t\)\)\}"/);
 assert.match(round,/\.phase3ArenaBackdrop/);
 assert.match(round,/body\.phase3IntegratedPreview\.phase3CombatView #scene/);
 assert.match(round,/height:clamp\(215px,34dvh,290px\)!important/);
});
test('Round 4: 6 by 2 square desktop bag, art corners raised, button label unwrapped',()=>{
 const round=read('online/v012-uiux-round4.css');
 assert.match(round,/repeat\(6,minmax\(0,1fr\)\)!important/);
 assert.match(round,/aspect-ratio:1\/1!important/);
 assert.match(round,/gothic-corner-layer[\s\S]*?z-index:40!important/);
 assert.match(html,/phase3StartText/);
 assert.match(round,/phase3Start::after/);
});
test('Round 4: desktop events two columns and passive picker fits mobile without duplicate icons',()=>{
 const round=read('online/v012-uiux-round4.css');
 assert.match(round,/\.phase6Event\{/);
 assert.match(round,/\.phase6Event \.eventHeading>\.eventArt/);
 assert.match(round,/\.phase6Event>\.eventOptions/);
 assert.match(round,/dialog\[data-realm-passive\] \.phase3PassiveChoice/);
 assert.match(html,/phase2PassiveIcons\(p,false\)/);
 assert.match(html,/HYBRID · /);
});
test('Round 4: both portrait damage animations are red-only and character remains untouched',()=>{
 const round=read('online/v012-uiux-round4.css');
 assert.match(round,/@keyframes phase3RedOnlyHit/);
 assert.match(round,/#enemyPortrait\.phase3DamageFlash/);
 assert.match(html,/function phase3FlashEnemyDamage\(\)/);
 assert.match(html,/const damage=typeof n==='number'&&Number\.isFinite\(n\)/);
 assert.match(html,/if\(target==='enemy'&&damage&&n>0\)phase3FlashEnemyDamage\(\)/);
 assert.match(round,/phase3CampSidebarJourney/);
});
