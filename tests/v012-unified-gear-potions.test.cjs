'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const camp=fs.readFileSync(path.join(root,'online/v012-ui5-camp.css'),'utf8');
const inventory=fs.readFileSync(path.join(root,'online/v012-ui6-unified-inventory.css'),'utf8');
function functionSource(start,next){
 const begin=html.indexOf(start),end=html.indexOf(next,begin+start.length);
 assert(begin>=0&&end>begin,'missing source: '+start);
 return html.slice(begin,end);
}
test('Inventory has a single Stash grid for equipment and owned potions',()=>{
 assert.match(html,/\$\{potionTiles\}<\/div>/);
 assert.match(html,/class="invItem potionStackTile"/);
 assert.match(html,/<option value="potions">Potions<\/option>/);
 assert.doesNotMatch(html,/phase6PotionStashMarkup\(/);
 assert.match(inventory,/\.stashGrid>\.potionStackTile/);
});
test('Camp and Inventory keep three potion slots in the same portrait grid',()=>{
 assert.match(html,/function phase3PaperMarkup\(camp=false,stats=phase2Stats\(\),withPotions=camp\)/);
 assert.match(html,/phase3PaperMarkup\(true,stats\)/);
 assert.match(camp,/\.paper>\.phase3PotionSlots\s*\{[^}]*grid-column:1\/4;[^}]*grid-row:6;/);
 assert.match(inventory,/\.paper>\.phase3PotionSlots\s*\{\s*display:contents!important/);
 assert.match(camp,/grid-row:6/);
 assert.match(inventory,/grid-row:6!important/);
 assert.match(camp,/grid-template-rows:var\(--camp-vitals-row\) repeat\(4,var\(--camp-slot-row\)\) minmax\(72px,auto\)/);
 assert.match(inventory,/grid-template-rows:repeat\(5,var\(--gear-row\)\) 78px/);
});
test('Potion selection reserves owned stacks visually without changing stored stock',()=>{
 const definition=functionSource('function phase6PotionStacksMarkup(){','function phase6LoadoutMarkup(){');
 const state={consumables:{health:101,mana:2,might:1},potionSelection:['health','health','mana']};
 const catalog={CATALOG:[{id:'health',name:'Health Potion',rarity:'Common'},{id:'mana',name:'Mana Potion',rarity:'Common'},{id:'might',name:'Might Potion',rarity:'Common'}]};
 const render=new Function('state','WandererV012Consumables','rarityFrame','esc','rarityArt','phase6PotionImage',
  definition+'return phase6PotionStacksMarkup;')(state,catalog,()=>'data-rarity="Common"',String,()=>'<i></i>',s=>s);
 const markup=render();
 assert.equal((markup.match(/data-potion-load="health"/g)||[]).length,1);
 assert.match(markup,/Health Potion · 99 in Stash/);
 assert.match(markup,/Mana Potion · 1 in Stash/);
 assert.match(markup,/Might Potion · 1 in Stash/);
 assert.equal(state.consumables.health,101,'render never mutates save state');
});
test('Unified portrait still contains ten equipment and exactly three potion slots',()=>{
 const definition=functionSource('function phase3PaperMarkup(','function phase3VitalsMarkup(');
 const slots=['weapon','offhand','helm','armor','gloves','amulet','belt','ring1','ring2','boots'];
 const names=['SLOTS','SNAME','state','ARMOR_SLOTS','ARMOR_TYPES','isTwoHanded','slotFilter','selectedId','rarityFrame','esc','rarityArt','itemImg','placeholderIcon','affinityBadge','newBadge','legendaryRankBadge','phase6LoadoutMarkup','heroFullImage','phase2Stats','phase3CampDisplayName','phase3VitalsMarkup'];
 const values=[slots,{}, {equip:{}},[],[],()=>false,'all',null,()=>'',String,()=>'<i></i>',()=>'',()=>'',()=>'',()=>'',()=>'',()=>'<div class="phase3PotionSlots">'+Array(3).fill('<div class="phase3PotionSlot"></div>').join('')+'</div>',()=>'',()=>({}),()=> 'wanderer',()=>'<div class="phase3ResourcePanel"></div>'];
 const render=new Function(...names,definition+'return phase3PaperMarkup;')(...values);
 assert.equal((render(true).match(/data-eqslot=/g)||[]).length,10);
 assert.equal((render(true).match(/class="phase3PotionSlot"/g)||[]).length,3);
 assert.doesNotMatch(render(false),/phase3PotionSlots/,'other screens preserve existing composition');
});
