'use strict';
const assert=require('node:assert/strict');
const create=require('../tests/v012-economy-harness.cjs');
const kinds=['health','mana','might','arcane','ironhide','haste','fortune','barrier'];
const rows=[];
for(let seed=0;seed<24;seed++){
 const a=create(982110+seed),s=a.state();a.setup(200,'Bow','Epic');a.controller().state.unlocked=200;s.gold=30000;
 s.apothecary=a.potions.shop(200);
 const initialGold=s.gold;
 const bought={};let spent=0,rerolls=0;
 for(const kind of ['health','ironhide','barrier']){
   let offer=s.apothecary.stock.find(p=>p.kind===kind);
   for(let tries=0;!offer&&tries<70;tries++){
     const before=s.gold,ok=a.potions.reroll();
     assert.equal(ok,true,'Apothecary reroll rejected');
     spent+=before-s.gold;rerolls++;
     offer=s.apothecary.stock.find(p=>p.kind===kind);
   }
   assert(offer,'Apothecary did not stock '+kind);
   const before=s.gold,qty=s.consumables?.[kind]||0;
   assert.equal(a.potions.buy(offer.id),true,'Native potion purchase failed');
   assert.equal(s.gold,before-offer.price,'Invalid Gold debit');
   assert.equal((s.consumables?.[kind]||0),qty+1,'Potion not received');
   bought[kind]=offer.price;spent+=offer.price;
 }
 assert.equal(initialGold-s.gold,spent);
 for(const kind of Object.keys(bought))assert.equal(a.potions.select(kind),true);
 assert.equal(s.potionSelection.length,3);
 a.start(200);
 const beforeStart=JSON.stringify(s.consumables);
 assert.equal(a.potions.start(),true);const run=a.events.run();assert.equal(run.started,true);
 assert.equal(run.potions.length,3);
 assert(run.potions.every(p=>p.used===false));
 for(const kind of Object.keys(bought))assert.equal(s.consumables[kind]||0,0);
 const outcome=seed%2===0?'victory':'defeat';a.potions.finish(outcome);
 for(const kind of Object.keys(bought))assert.equal(s.consumables[kind],outcome==='victory'?1:0,'Potion settlement incorrect for '+outcome);
 const afterVictory={...s.consumables};
 rows.push({seed,spent,rerolls,bought,selected:3,returned:seed%2===0?3:0,lost:seed%2?3:0,inventoryBeforeRun:beforeStart,afterSettlement:afterVictory});
}
const summary={seeds:rows.length,bought:rows.length*3,returned:rows.reduce((n,x)=>n+x.returned,0),lost:rows.reduce((n,x)=>n+x.lost,0),rerolls:rows.reduce((n,x)=>n+x.rerolls,0),spent:rows.reduce((n,x)=>n+x.spent,0),kinds};
console.log('E24_APOTHECARY '+JSON.stringify(summary));
