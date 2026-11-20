'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../economy/v013-gear-rolls.js');
const create=require('./v012-economy-harness.cjs');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const item=(subtype,rarity,tier=1,armorType=null)=>({slot:subtype==='Ring'?'ring1':subtype==='Amulet'?'amulet':armorType?'armor':'weapon',
 subtype,rarity,tier,...(armorType?{armorType}:{})});
function rolls(type,rarity,tier,n=400,armorType=null){
 const random=rng(31337+tier+rarity.length+type.length);
 return Array.from({length:n},()=>G.apply(item(type,rarity,tier,armorType),2+tier*.82,random));
}
test('single v013 generator gives Rare 2–4, Epic 3–4, and Legendary 4–5 rolls without fixed CHA/Health jewellery',()=>{
 const rare=rolls('Ring','Rare',10,600),epic=rolls('Amulet','Epic',10,600);
 assert(rare.every(x=>x.v013StatCount>=2&&x.v013StatCount<=4));
 assert(epic.every(x=>x.v013StatCount>=3&&x.v013StatCount<=4));
 assert(rolls('Ring','Legendary',10,200).every(x=>x.v013StatCount>=4&&x.v013StatCount<=5));
 assert(rare.some(x=>x.cha===0));assert(rare.some(x=>x.hp===0));
 for(const key of ['str','agi','int','end','cha','atk','spell'])assert(rare.some(x=>x[key]>0),'rings can roll '+key);
 assert(epic.some(x=>x.spell>0)&&epic.some(x=>x.int>0));
});
test('Plate Intellect, Leather Spell Power, Cloth Endurance and physical Sword Spell Power really roll',()=>{
 const plate=rolls('Armor','Rare',35,700,'Plate'),leather=rolls('Gloves','Epic',35,700,'Leather');
 const cloth=rolls('Helm','Rare',35,700,'Cloth'),swords=rolls('Sword','Epic',35,1000);
 assert(plate.some(x=>x.int>0),'cleric Plate is possible');
 assert(plate.every(x=>x.def>0),'Plate keeps armor defense identity');
 assert(leather.some(x=>x.spell>0),'magic Leather is possible');
 assert(cloth.some(x=>x.end>0),'defensive Cloth is possible');
 assert(swords.some(x=>x.int>0&&x.spell>0&&x.atk>0),'hybrid Spellblade Sword possible');
 assert(rolls('Staff','Epic',35,100).every(x=>x.spell>0&&x.atk===0));
});
test('secondary caps are absolute E1 to E200; Crit/Block never inflate to +20% per piece',()=>{
 for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary'])
  for(const tier of [1,5,15,35,70,200]){
   const sample=[...rolls('Ring',rarity,tier,200),...rolls('Armor',rarity,tier,200,'Plate'),
    ...rolls('Gloves',rarity,tier,200,'Leather')];
   for(const x of sample){
    for(const [key,cap]of Object.entries(G.SECONDARY_CAPS)){
     assert((x[key]||0)<=cap[rarity]+1e-8,rarity+' E'+tier+' '+key+': '+x[key]+' / '+cap[rarity]);
     assert((x[key]||0)>=0,key+' cannot be negative');
    }
    if(rarity==='Common')assert(['str','agi','int','end','cha'].every(k=>!(x[k]>0)));
   }
  }
 assert(G.SECONDARY_CAPS.critBonus.Legendary<3);
 assert(G.SECONDARY_CAPS.blockBonus.Legendary<3);
});
test('primary numeric power continues to grow with Expedition while percentage caps do not',()=>{
 const low=rolls('Sword','Epic',1,300),high=rolls('Sword','Epic',200,300);
 const avg=arr=>arr.reduce((n,x)=>n+(x.atk||0),0)/arr.length;
 assert(avg(high)>avg(low)*5,'physical damage grows');
 assert(Math.max(...high.map(x=>x.critBonus||0))<=G.SECONDARY_CAPS.critBonus.Epic);
});
test('native game Forge, loot and Merchant share capped random affixes; no paid Focus or upgrade actions',()=>{
 const a=create(77155,undefined,{}, {skipPersistence:true,now:1720000000000}),s=a.state();
 const drop=a.makeItem(35,'weapon',null,'loot','Sword','Rare');
 const merchant=a.makeItem(35,'ring1',null,'merchant','Ring','Rare');
 assert.equal(drop.rarity,'Rare');assert.equal(merchant.rarity,'Rare');
 assert(drop.affixes.length>=2&&drop.affixes.length<=4);
 assert(merchant.affixes.length>=2&&merchant.affixes.length<=4);
 assert.equal(a.forge.focuses,undefined);assert.equal(a.forge.tierUpgrade,undefined);
 assert.equal(a.forge.reinforce,undefined);
 const id='green_gloves_plate',price=a.forge.progress(id,1);
 s.fragments=price.cost.fragments;s.crafting.essence=price.cost.essence;
 const crafted=a.forge.craft(id,1);
 assert(crafted&&crafted.crafted&&crafted.armorType==='Plate');
 assert(crafted.affixes.length>=2&&crafted.affixes.length<=4);
 assert.equal(crafted.v013CraftFocus,undefined);
 assert.equal(s.fragments,0);assert.equal(s.crafting.essence,0);
});
