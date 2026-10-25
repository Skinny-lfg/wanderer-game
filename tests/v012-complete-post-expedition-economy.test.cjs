'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
require('../online/v012-save.js');
require('../online/v012-treasures.js');
const Save=globalThis.WandererV012Save;
const Treasures=globalThis.WandererV012Treasures;
const KEY='wanderer_v012_local_preview';

function fixture(seed){
 const storage=new Map();
 const a=create(seed,undefined,{}, {sessionStorage:storage});
 assert.equal(a.debug().saveBlocked,false,'initial local save is valid');
 return {a,storage};
}
function persisted(storage){
 const value=storage.get(KEY);
 assert(value,'missing isolated session checkpoint');
 return Save.validate(JSON.parse(value),'local-playtest');
}
function prepareVendors(a){
 const s=a.state();s.gold=50000;s.fragments=50000;
 a.rollShop();s.apothecary=a.potions.shop();
 s.valuables.push(Treasures.create('audit-treasure-1',1));
 return s;
}
function assertBlocked(a){
 const s=a.state(),before={gold:s.gold,fragments:s.fragments,stash:s.stash.length,valuables:s.valuables.length};
 assert.equal(a.economyCanAct(),false);
 assert.equal(a.purchaseNative(0),false);
 assert.equal(a.potions.buy(s.apothecary.stock[0].id),false);
 assert.equal(a.treasures.sell(),false);
 a.craft(1);a.salvage(s.stash.length?[s.stash[0].id]:[]);
 assert.deepEqual({gold:s.gold,fragments:s.fragments,stash:s.stash.length,valuables:s.valuables.length},before,'blocked actions must not mutate economy');
}
function assertAvailable(a){
 const s=a.state();
 assert.equal(a.economyCanAct(),true,'Camp must be able to transact');
 const gold=s.gold;assert.equal(a.purchaseNative(0),true,'Merchant purchase');assert(s.gold<gold);
 const fragments=s.fragments;a.craft(1);assert(s.fragments<fragments,'Forge craft');
 const eligible=s.stash.find(item=>!item.locked&&!item.recoveryStarter);
 assert(eligible,'salvage fixture');const beforeSale=s.fragments;a.salvage([eligible.id]);
 assert(s.fragments>beforeSale,'equipment salvage');
 const beforeTreasures=s.gold;assert.equal(a.treasures.sell(),true,'valuable sale');assert(s.gold>beforeTreasures);
 const potionId=s.apothecary.stock[0].id,beforePotion=s.gold;
 assert.equal(a.potions.buy(potionId),true,'Apothecary purchase');assert(s.gold<beforePotion);
}
function begin(a){
 assert.equal(a.start(1),undefined);
 a.initial('blood');const p=a.controller().state.offers.find(p=>p.family==='blood');
 assert(p,'blood offer exists');a.select(p.id);assert.equal(a.enter(),true);
}
function resolve(a){
 if(a.draft()?.kind==='reward')assert.equal(a.passive(a.draft().options[0]?.id??null),true);
 if(a.results().review||a.results().eventExitPending||a.state().run?.status==='cleared')assert.equal(a.exitResult(),true);
}
function clearToBetween(a){
 for(let n=0;n<7&&a.controller().state.planeIndex===1;n++){
  const r=a.state().run;assert(r?.enemy,'first Realm combat');r.enemy.hp=0;a.win();a.flush();
 }
 assert.equal(a.controller().state.planeIndex,2,'first Realm completed');resolve(a);
 assert.equal(a.controller().state.stage,'choice');
}
function allRealms(a){
 for(let n=0;n<100&&a.controller().state.stage!=='finished';n++){
  resolve(a);
  if(a.controller().state.stage==='finished')break;
  if(a.controller().state.stage==='choice'){
   while(a.bag.items().length>=a.bag.capacity()||a.bag.overflow()>0){
    const last=a.bag.items().at(-1);assert(last&&a.bag.discard(last.id));
   }
   assert.equal(a.select(a.controller().state.offers[0].id),true);
   assert.equal(a.enter(),true);
   if(a.events.run()?.event){assert.equal(a.events.choose(2),true);continue;}
  }
  if(a.controller().state.stage==='combat'){
   if(a.draft()?.step==='element'){assert.equal(a.element('frost'),true);continue;}
   if(a.events.run()?.event){assert.equal(a.events.choose(2),true,'event should resolve normally');continue;}
   const run=a.state().run;
   assert(run?.enemy,'combat should have a current wave: '+JSON.stringify({debug:a.debug(),plane:a.controller().state.planeIndex,wave:a.controller().state.wave,draft:a.draft()?.kind}));
   run.enemy.hp=0;a.win();a.flush();
  }
 }
 assert.equal(a.controller().state.stage,'finished','full Expedition victory: '+JSON.stringify({debug:a.debug(),plane:a.controller().state.planeIndex,wave:a.controller().state.wave,event:a.events.run()?.event,runStatus:a.state().run?.status,review:a.results().review,draft:a.draft()?.kind}));
}
function restored(storage,seed){
 const a=create(seed,undefined,{}, {sessionStorage:storage});
 assert.equal(a.debug().saveBlocked,false,'restored save must validate');
 return a;
}

test('Local preview validates entry, keeps active and Between Realms economy blocked, then restores it after Extract and refresh',()=>{
 const {a,storage}=fixture(73011);prepareVendors(a);assert.equal(a.economyCanAct(),true);
 begin(a);assert.equal(a.debug().saveBlocked,false,'entry checkpoint must persist');
 let save=persisted(storage);assert.equal(save.expedition.attempts,1);assert.equal(save.expedition.lastOutcome,'active');assert.equal(save.expedition.active.stage,'combat');
 assertBlocked(a);clearToBetween(a);assertBlocked(a);
 save=persisted(storage);assert(save.expedition.awardKeys.length>0,'wave awards stored once');
 assert.equal(a.checkpoint.extract(),true);assertBlocked(a);
 assert.equal(a.exitResult(),true);assert.equal(a.debug().saveBlocked,false);assertAvailable(a);
 save=persisted(storage);assert.equal(save.expedition.lastOutcome,'extracted');assert.equal(save.expedition.active,null);
 const b=restored(storage,73012);assert.equal(b.economyCanAct(),true);assert.equal(b.controller().state.stage,'camp');
});

test('Death clears Expedition guard without losing earned currencies and remains valid on reload',()=>{
 const {a,storage}=fixture(73021);prepareVendors(a);begin(a);assertBlocked(a);
 a.death();assert.equal(a.results().review,'summary');assertBlocked(a);
 assert.equal(a.exitResult(),true);assert.equal(a.debug().saveBlocked,false);assertAvailable(a);
 assert.equal(persisted(storage).expedition.lastOutcome,'defeat');
 assert.equal(restored(storage,73022).economyCanAct(),true);
});

test('Early abandon and pre-entry Back to Camp end legitimately without unlocked purchases inside an Expedition',()=>{
 const {a,storage}=fixture(73031);prepareVendors(a);a.start(1);assertBlocked(a);
 assert.equal(a.back(),true);assert.equal(a.economyCanAct(),true);
 assert.equal(persisted(storage).expedition.lastOutcome,'cancelled');
 begin(a);assertBlocked(a);assert.equal(a.abandon(),true);
 assert.equal(a.debug().saveBlocked,false);assert.equal(a.economyCanAct(),true);
 assert.equal(persisted(storage).expedition.lastOutcome,'abandoned');
 assert.equal(restored(storage,73032).economyCanAct(),true);
});

test('Full Expedition victory preserves reward ledger and unlocks merchant, salvage, forge and potions after summary',()=>{
 const {a,storage}=fixture(73041);prepareVendors(a);begin(a);allRealms(a);
 assert.equal(a.results().review,'summary');assertBlocked(a);
 assert.equal(a.exitResult(),true);assert.equal(a.debug().saveBlocked,false);
 const save=persisted(storage);assert.equal(save.expedition.lastOutcome,'victory');
 assert.equal(save.expedition.completed,1);assert.equal(save.expedition.active,null);
 assert.equal(new Set(save.expedition.awardKeys).size,save.expedition.awardKeys.length,'no duplicated awards');
 assertAvailable(a);
 assert.equal(restored(storage,73042).economyCanAct(),true);
});

test('Corrupted checkpoint does not unlock economy on restore',()=>{
 const {a,storage}=fixture(73051);prepareVendors(a);a.start(1);
 const bad=JSON.parse(storage.get(KEY));bad.expedition.lastOutcome='abandoned';
 storage.set(KEY,JSON.stringify(bad));
 const b=create(73052,undefined,{}, {sessionStorage:storage});
 assert.equal(b.debug().saveBlocked,true);
 assert.equal(b.economyCanAct(),false);
});
