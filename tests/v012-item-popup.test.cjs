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
 assert.match(popup,/modalActions=dialog\.querySelector\('.modalActions'\)/);
 assert.match(popup,/modalActions\.insertBefore\(action,closeButton\)/);
 assert.match(css,/equipmentItemDialog \.modalActions\{display:flex;flex-wrap:wrap/);
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

test('Forge result reuses the compact equipment dialog and keeps its item artwork square',()=>{
 const forge=between('function renderForge(){','function renderMerchant(){');
 assert.match(forge,/showModal\('Item Forged'/);
 assert.match(forge,/previewItem\(o,'forge'\)/);
 assert.doesNotMatch(forge,/const trends=/);
 assert.match(forge,/phase3StyleGearDialog\(dialog,o\)/);
 assert.match(forge,/dialog\?\.classList\.add\('forgeResultDialog'\)/);
 assert.match(forge,/dialog\.close\(\);equipItem\(o\.id,target\)/);
 assert.match(between('function previewItem(', 'function statsWidget('),/\['stash','bag'\]\.includes\(source\)/);
 assert.match(css,/\.inspectHero img\{width:67px;height:67px;object-fit:contain/);
});

test('Between Realms equipment uses the same bounded native dialog as Inventory',()=>{
 const stylePopup=between('function phase3StyleGearDialog(', 'function phase3ShowGearPopup(');
 assert.match(stylePopup,/dialog\.classList\.add\('equipmentItemDialog'\)/);
 assert.match(stylePopup,/\['ring1','ring2'\]/);
 assert.match(stylePopup,/dialog\.classList\.add\('equipmentStandardDialog'\)/);
 const bag=between('function phase3BindBag(){','function phase3RenderBagInventory(){');
 assert.match(bag,/phase3StyleGearDialog\(dialog,item\)/);
 assert.match(bag,/data-phase3-equip/);
 assert.match(bag,/data-phase3-discard/);
 const equipped=between('function phase3BindPaper(){','function phase5MilestoneMarkup(');
 assert.match(equipped,/phase3StyleGearDialog\(dialog,state\.equip\[slot\]\)/);
 assert.match(equipped,/moveEquippedToBag/);
 const css=fs.readFileSync(path.join(root,'online/v012-uiux-tuning.css'),'utf8');
 assert.match(css,/dialog\.itemDialog\.equipmentItemDialog\[open\]/);
 assert.match(css,/max-height:min\(72dvh,600px\)!important/);
 assert.match(css,/dialog\.itemDialog\.equipmentItemDialog\.equipmentStandardDialog\[open\]/);
 assert.match(css,/max-height:min\(82dvh,680px\)!important/);
});
