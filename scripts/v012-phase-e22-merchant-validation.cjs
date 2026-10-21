'use strict';
const assert=require('node:assert/strict');
const create=require('../tests/v012-economy-harness.cjs');
const rows=[];
let purchases=0,spent=0,positive=0,compatible=0,betterThanLoot=0,offers=0;
for(let seed=0;seed<30;seed++){
 const a=create(910000+seed),s=a.state();a.setup(200,'Bow','Epic');
 for(const slot of ['helm','armor','gloves','belt','boots'])s.equip[slot]=a.makeItem(198,slot,null,'loot','Leather','Epic');
 s.equip.weapon=a.makeItem(198,'weapon',null,'loot','Bow','Epic');
 a.controller().state.unlocked=200;s.gold=100000;
 const baseline=a.baseStats(s.equip).power;
 a.rollShop();
 let best=null;
 for(let round=0;round<5;round++){
  for(let i=0;i<s.merchant.stock.length;i++){
   const x=s.merchant.stock[i],old=s.equip[x.slot];
   const fits=!!old&&old.subtype===x.subtype&&old.armorType===x.armorType;
   const gain=fits?(a.baseStats({...s.equip,[x.slot]:x}).power-baseline)/Math.max(1,baseline):null;
   offers++;if(fits)compatible++;if(gain>0)positive++;
   const loot=a.makeItem(200,x.slot,null,'loot',x.armorType||x.subtype,x.rarity);
   const lootGain= fits?(a.baseStats({...s.equip,[x.slot]:loot}).power-baseline)/Math.max(1,baseline):null;
   if(gain!==null&&lootGain!==null&&gain>lootGain)betterThanLoot++;
   if(!best||(gain??-999)>(best.gain??-999))best={index:i,gain,price:x.goldPrice,slot:x.slot,round};
  }
  if(round<4)a.refresh();
 }
 // Separate purchase assertion with real merchant stock; do not fabricate a sale.
 const index=0,item=s.merchant.stock[index],gold=s.gold,stash=s.stash.length,id=item.id;
 const ok=a.purchaseNative(index);
 assert.equal(ok,true,'native Merchant purchase failed');
 assert.equal(s.gold,gold-item.goldPrice,'Gold debit differs from listed price');
 assert.equal(s.stash.length,stash+1,'Purchased item not added');
 assert(s.stash.some(x=>x.id===id),'Purchased item identity not preserved');
 assert.notEqual(s.merchant.stock[index].id,id,'Stock was not replaced');
 purchases++;spent+=item.goldPrice;
 rows.push({seed,baseline,best,purchasePrice:item.goldPrice});
}
console.log('E22_METRICS '+JSON.stringify({seeds:30,offers,compatible,positive,betterThanLoot,purchases,spent,rows}));
