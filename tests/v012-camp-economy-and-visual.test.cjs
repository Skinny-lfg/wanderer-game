'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const src=fs.readFileSync(path.join(__dirname,'..','economy','v012-equipment-runtime.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const tuning=fs.readFileSync(path.join(__dirname,'..','online','v012-uiux-tuning.css'),'utf8');

function scenario(stage){
 const sandbox={};vm.runInNewContext(src,sandbox,{filename:'v012-equipment-runtime.js'});
 let saved=0,nextId=0;
 const port={
  state:{run:null,stash:[],equip:{},valuables:[],gold:200,fragments:200,stashCapacity:40,merchant:null},
  PHASE1_PREVIEW:true,PHASE5_VALIDATION:false,phase5Ready:true,
  phase1Controller:{state:{stage,unlocked:1}},
  phase1Draft:null,saveBlocked:false,
  DUNGEON_CAP:200,STASH_BASE_CAPACITY:40,STASH_MAX_CAPACITY:200,
  forgeTier:1,forgeSlot:'armor',forgeSubtype:'Armor',forgeQuality:0,
  phase3NeedsBagResolution:()=>true,
  gameRandom:()=>.2,
  merchantCost:()=>40,
  makeItem:(_tier,slot)=>({id:'generated'+(++nextId),slot,rarity:'Common',tier:1,name:'Test gear',goldPrice:40}),
  save:()=>saved++,bannerMessage:()=>{},
 };
 const api=sandbox.WandererV012EquipmentRuntime.create(port);
 port.economyCanAct=api.economyCanAct;port.economyTier=api.economyTier;
 port.stashCapacity=api.stashCapacity;port.stashHasRoom=api.stashHasRoom;port.merchantTier=api.merchantTier;
 return {api,port,get saved(){return saved}};
}

test('Finished Expedition permits crafting even if the old Bag had overflow',()=>{
 const x=scenario('finished');
 assert.equal(x.api.economyCanAct(),true);
 const before=x.port.state.fragments;
 const crafted=x.api.craftEquipment(14,null);
 assert.ok(crafted,'a real item must be crafted');
 assert.equal(x.port.state.fragments,before-14);
 assert.equal(x.port.state.stash.length,1);
 assert.equal(x.saved,1);
});

test('Failed Expedition permits merchant purchase with free Stash and enough Gold',()=>{
 const x=scenario('failed');
 const item={id:'offer1',slot:'weapon',goldPrice:35,tier:1,rarity:'Common'};
 const m={stock:[item]};x.port.state.merchant=m;
 assert.equal(x.api.economyCanAct(),true);
 assert.equal(x.api.purchaseEquipment(m,0,item),true);
 assert.equal(x.port.state.gold,165);
 assert.equal(x.port.state.stash[0],item);
 assert.equal(x.saved,1);
});

test('During a Realm and an active combat encounter the economy remains locked',()=>{
 for(const stage of ['choice','combat']){
  const x=scenario(stage);assert.equal(x.api.economyCanAct(),false);
  assert.equal(x.api.craftEquipment(14,null),undefined);
  assert.equal(x.saved,0);
 }
 const x=scenario('finished');x.port.state.run={id:'still-running'};
 assert.equal(x.api.economyCanAct(),false);
});

test('Full Stash still protects player loot and resources after a run',()=>{
 const x=scenario('finished');
 x.port.state.stash=Array.from({length:40},(_,i)=>({id:'gear'+i}));
 const before=x.port.state.fragments;
 assert.equal(x.api.stashHasRoom(),false);
 assert.equal(x.api.craftEquipment(14,null),undefined);
 assert.equal(x.port.state.fragments,before);
 assert.equal(x.saved,0);
});

test('Post-expedition UI keeps Inventory navigable and preserves separate Bag resolution',()=>{
 assert.match(html,/if\(phase3NeedsBagResolution\(\)\&\&state\.run\)/);
 assert.match(html,/phase3NeedsBagResolution\(\)\&\&phase3ExpeditionActive\(\)/);
 assert.match(src,/function phase3NeedsBagResolution\(\)/);
 assert.match(html,/href="online\/v012-uiux-tuning\.css"/);
});

test('Button uses only three intended artwork layers and no hidden base background',()=>{
 assert.match(tuning,/background-image:none!important/);
 assert.match(tuning,/04_expedition_center_tile\.png/);
 assert.match(tuning,/03_expedition_left\.png/);
 assert.match(tuning,/05_expedition_right\.png/);
 assert.match(tuning,/top:28%!important;bottom:28%!important/);
 assert.match(tuning,/top:28\.5%!important;bottom:28\.5%!important/);
 assert.match(tuning,/white-space:nowrap!important/);
});

test('Subtler shared red hit and moderately darker Arena art preserve visuals',()=>{
 assert.match(tuning,/brightness\(\.67\) saturate\(\.90\)/);
 assert.match(tuning,/@keyframes phase3RedOnlyHit/);
 assert.match(tuning,/rgba\(170,31,43,\.30\)/);
 assert.match(tuning,/#heroPortrait\.phase3DamageFlash/);
 assert.match(tuning,/#enemyPortrait\.phase3DamageFlash/);
});
