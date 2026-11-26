'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');const context={};vm.runInNewContext(fs.readFileSync('economy/v013-crafting.js','utf8'),context);const C=context.WandererV013Crafting;
const state=()=>({fragments:10000,crafting:C.create()});
function factory(tier,slot,_affinity,source,type,rarity){return {id:'crafted-1',tier,slot,subtype:type,source,rarity,str:2,agi:1,int:0,end:0,cha:0,atk:9};}
function unlock(p,family,boss=false){return C.award(p,{family,boss});}
test('catalog covers every weapon, physical armor slot, and three known craft rarities',()=>{assert.equal(new Set(C.RECIPES.map(r=>r.id)).size,C.RECIPES.length);for(const type of ['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'])assert(C.RECIPES.some(r=>r.rarity==='Uncommon'&&r.subtype===type));for(const slot of ['helm','armor','gloves','boots','belt'])for(const type of ['Cloth','Plate','Leather'])assert(C.RECIPES.some(r=>r.slot===slot&&r.subtype===type&&r.rarity==='Uncommon'));assert.deepEqual([...new Set(C.RECIPES.map(r=>r.rarity))],['Uncommon','Rare','Epic']);assert(C.RECIPES.filter(r=>r.rarity==='Epic').every(r=>C.TRAITS[r.trait]));});
test('Realm grants materials but Blueprints require explicit discovery',()=>{
 let p=C.create();assert(C.unlocked(p,'green_sword'));assert(!C.unlocked(p,'blue_sword'));
 p=unlock(p,'blood');assert.equal(p.essence,1);assert(!C.unlocked(p,'blue_sword'));assert(!C.unlocked(p,'epic_parting_blade'));
 p=unlock(p,'blood',true);assert.equal(p.essence,6);assert.equal(p.cores.blood,1);
 const learned=C.discover(p,'blue_sword');assert(learned);assert(C.unlocked(learned,'blue_sword'));assert(!C.unlocked(p,'blue_sword'));
 assert.equal(C.discover(learned,'blue_sword'),null,'duplicates must not be rewarded');
 assert.equal(C.discover(learned,'green_sword'),null,'starter Blueprints are already known');
 assert.equal(C.discover(learned,'missing'),null);
 assert(!C.unlocked(learned,'epic_parting_blade'));
 assert(C.unlocked(C.discover(learned,'epic_parting_blade'),'epic_parting_blade'));
 assert(C.valid(learned));
});
test('resources are awarded per completed encounter and failure grants none',()=>{const original=C.create(),a=C.award(original,{family:'fury',completed:false});assert.equal(JSON.stringify(a),JSON.stringify(original));assert.equal(C.award(original,{family:'fury',elite:true}).essence,2);assert.equal(C.award(original,{family:'fury',event:true}).essence,1);assert.equal(original.essence,0);assert.throws(()=>C.award(original,{family:'unknown'}),/Invalid crafting encounter/);});
test('Blueprint progress reports locked recipes, costs and material sources',()=>{
 const s=state(),p=C.progress(s,'epic_parting_blade',3);
 assert.equal(p.recipe.id,'epic_parting_blade');assert.equal(p.cost.tier,3);
 assert.equal(p.unlocked,false);assert.equal(p.ready,false);
 assert.equal(p.requirements.find(x=>x.key==='reagent_blood').need,2);
 assert.equal(p.requirements.find(x=>x.key==='reagent_decay').need,2);
 assert.match(p.requirements.find(x=>x.key==='reagent_blood').source,/blood/);
 assert.equal(C.progress(s,undefined,3),null);
});
test('five-expedition item bands prevent automatic tier churn',()=>{assert.deepEqual([1,2,5,6,10,11,200,201].map(C.tierBand),[1,2,5,6,6,11,196,201]);assert.equal(C.cost('green_sword',6).fragments,C.cost('green_sword',10).fragments);assert.throws(()=>C.tierBand(0),/Invalid crafting tier/);});
test('crafted item preserves random attributes from the same native generator without forcing Strength',()=>{
 const s=state();s.crafting.essence=4;const before=JSON.stringify(s);
 const result=C.prepareCraft(s,'green_sword',5,factory);assert(result);
 assert.equal(result.item.rarity,'Uncommon');assert.equal(result.item.name,'Apprentice Sword');
 assert.equal(result.item.tier,5);assert.equal(result.item.str,2);assert.equal(result.item.agi,1);
 assert.equal(result.item.crafted,true);
 assert.equal(result.fragments,s.fragments-C.cost('green_sword',5).fragments);
 assert.equal(result.crafting.essence,0);assert.equal(JSON.stringify(s),before);
});
test('Forge has no Essence-paid focus and recipe output does not alter rolled armor stats',()=>{
 const itemFactory=(tier,slot,_affinity,source,type,rarity)=>({id:'armor',tier,slot,subtype:type,source,rarity,
  armorType:type,str:1,agi:2,int:5,end:3,cha:0,def:20,hp:40,spell:2,evasionRating:7});
 const s=state();s.crafting.essence=4;
 assert.equal(C.FOCUSES,undefined);
 const price=C.progress(s,'green_armor_plate',1).cost;
 assert.equal(price.essence,4);
 assert.equal(price.focusEssence,undefined);
 const preview=C.previewCraft('green_armor_plate',1,itemFactory);
 const crafted=C.prepareCraft(s,'green_armor_plate',1,itemFactory);
 assert.equal(preview.int,5);assert.equal(preview.str,1);assert.equal(preview.agi,2);
 assert.equal(crafted.item.int,5);assert.equal(crafted.item.spell,2);
 assert.equal(crafted.item.v013CraftFocus,undefined);
 assert.equal(crafted.crafting.essence,0);
});
test('insufficient resources, unknown or locked recipes never call the item factory',()=>{const s=state();let calls=0;const make=(...args)=>{calls++;return factory(...args);};assert.equal(C.prepareCraft(s,'green_sword',1,make),null);s.crafting.essence=1000;assert.equal(C.prepareCraft(s,'blue_sword',1,make),null);assert.equal(C.prepareCraft(s,'missing',1,make),null);s.fragments=0;assert.equal(C.prepareCraft(s,'green_sword',1,make),null);assert.equal(calls,0);});
test('Epic recipes require affinity reagents and apply exactly their functional trait',()=>{const s=state();s.crafting=unlock(s.crafting,'blood');s.crafting=C.discover(s.crafting,'epic_parting_blade');s.crafting.essence=55;s.crafting.cores.blood=4;assert.equal(C.prepareCraft(s,'epic_parting_blade',1,factory),null);s.crafting.cores.blood=2;s.crafting.cores.decay=2;const result=C.prepareCraft(s,'epic_parting_blade',1,factory);assert(result);assert.equal(result.item.v013Trait,'blood_transfer');assert.equal(result.item.rarity,'Epic');assert.equal(result.crafting.cores.blood,0);assert.equal(result.crafting.essence,0);assert.equal(result.crafting.cores.decay,0);assert.equal(s.crafting.cores.blood,2);assert.equal(s.crafting.cores.decay,2);});
test('refining respects family, cost and one conversion per drought',()=>{let p=C.create();p.essence=3;for(let i=0;i<3;i++)p=unlock(p,'blood');assert.equal(C.refine(p,'fury'),null);const next=C.refine(p,'blood');assert.equal(next.essence,0);assert.equal(next.cores.blood,1);assert.equal(C.refine(next,'blood'),null);assert.equal(p.cores.blood,0);assert(!C.valid({...p,dryRooms:{blood:4}}));});
test('invalid stored materials and impossible unlock provenance are rejected',()=>{const p=C.create();assert(C.valid(p));for(const mutate of [p=>p.essence=-1,p=>p.essence=.5,p=>p.cores.unknown=1,p=>p.cores.blood=Infinity,p=>p.realmFamilies=['blood','blood'],p=>p.bossFamilies=['blood'],p=>p.learnedRecipes=['missing']]){const broken=JSON.parse(JSON.stringify(p));mutate(broken);assert(!C.valid(broken));}assert.throws(()=>C.progress({fragments:1,crafting:{}}),/Invalid crafting progress/);});
test('an invalid item factory cannot deduct materials',()=>{const s=state();s.crafting.essence=4;const before=JSON.stringify(s);assert.equal(C.prepareCraft(s,'green_sword',1,()=>({id:'wrong',slot:'armor',rarity:'Epic'})),null);assert.equal(JSON.stringify(s),before);});

test('R2 all 99 Blueprints retain their IDs and exact costs at every tier; two distinct families for Rare/Epic',()=>{
 assert.equal(C.RECIPES.length,99);
 for(const r of C.RECIPES)for(const tier of [1,6,60,201]){
  const price=C.cost(r.id,tier),entries=Object.entries(price.reagents);
  assert.equal(entries.length,r.rarity==='Uncommon'?0:2,r.id);
  if(r.rarity!=='Uncommon'){assert.notEqual(r.family,r.secondary);assert.equal(price.reagents[r.family],r.rarity==='Rare'?1:2);assert.equal(price.reagents[r.secondary],price.reagents[r.family]);}
  const s=state();s.fragments=price.fragments;s.crafting.essence=price.essence;if(r.rarity!=='Uncommon')s.crafting=C.discover(s.crafting,r.id);
  for(const [f,n] of entries)s.crafting.cores[f]=n;
  const snapshot=JSON.stringify(s);
  for(const [f,n] of entries){const short={...s,crafting:{...s.crafting,cores:{...s.crafting.cores,[f]:n-1}}};let calls=0;assert.equal(C.prepareCraft(short,r.id,tier,()=>{calls++;return factory()}),null);assert.equal(calls,0);}
  const result=C.prepareCraft(s,r.id,tier,factory);assert(result,r.id);assert.equal(result.fragments,0);assert.equal(result.crafting.essence,0);
  assert(C.FAMILIES.every(f=>result.crafting.cores[f]===0));assert.equal(JSON.stringify(s),snapshot);
 }
});
test('native Forge independently refines the missing secondary, never unrelated or sufficient reagent',()=>{
 const create=require('./v012-economy-harness.cjs'),a=create(73,undefined,{}, {skipPersistence:true}),s=a.state(),id='blue_sword';
 s.crafting=C.discover(C.create(),id);s.crafting.essence=41;s.crafting.cores.blood=1;s.crafting.dryRooms={blood:3,decay:3,arcane:3};s.fragments=1000;
 assert.equal(a.forge.craft(id,1),null);assert.equal(a.forge.refine(id,'arcane'),false);assert.equal(a.forge.refine(id,'blood'),false);
 assert.equal(a.forge.refine(id,'decay'),true);assert.equal(s.crafting.essence,35);assert.equal(s.crafting.cores.decay,1);assert.equal(a.forge.refine(id,'decay'),false);
 const crafted=a.forge.craft(id,1);assert(crafted);assert.equal(s.crafting.cores.blood,0);assert.equal(s.crafting.cores.decay,0);assert.equal(s.crafting.essence,0);
});
