'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'online/v012-core.css'),'utf8');
const between=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'missing '+start);
 return html.slice(a,b);
};
test('One native dialog handles Stash gear inspection and all equip actions',()=>{
 const popup=between('function phase3ShowGearPopup(', 'function phase6ShowPotionPopup(');
 assert.match(popup,/showModal\(source==='equipped'/);
 for(const id of ['#equipThis','#equipDaggerMain','#equipDaggerOff','#equipRing1','#equipRing2','#lockThis','#sellThis','#unequipThis'])assert(popup.includes(id),'missing action '+id);
 assert.match(popup,/dialog\.close\(\);fn\(\)/);
 assert.doesNotMatch(between('function renderStash(){','function forgeComparisonTrend('),/id="itemInspect"/);
 assert.match(css,/\.itemDialog\.equipmentItemDialog/);
});
test('Camp equipped slot opens the popup; empty Inventory slots keep the chooser',()=>{
 const camp=between('function phase3BindPaper(){','function phase5MilestoneMarkup(');
 assert.match(camp,/phase3ShowGearPopup\(item,'equipped',slot\)/);
 assert.match(camp,/Move to Expedition Bag/);
 const inv=between('function renderStash(){','function forgeComparisonTrend(');
 assert.match(inv,/if\(equipped\)/);
 assert.match(inv,/slotFilter=slotFilter===filter\?'all':filter/);
 assert.match(inv,/if\(bulk\)/);
});
test('Potion Stash and loadout icons display a detail modal before equip or remove',()=>{
 const popup=between('function phase6ShowPotionPopup(', 'function showConfirm(');
 assert.match(popup,/showModal\('Potion details'/);
 assert.match(popup,/phase6SelectPotion\(kind\)/);
 assert.match(popup,/phase6SelectPotion\(kind,true\)/);
 assert.match(html,/data-potion-inspect/);
 assert.match(css,/\.phase3PotionInspectButton/);
});
