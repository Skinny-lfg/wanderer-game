const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
function enter(a){if(!a.controller().state.initialFamily)a.initial('blood');if(a.draft()?.kind==='reward')a.passive(a.draft().options[0].id);if(a.results().review)a.exitResult();while(a.bag.overflow()>0)a.bag.discard(a.bag.items().at(-1).id);a.select(a.controller().state.offers[0].id);a.enter();if(a.draft()?.step==='element')a.element('lightning');if(a.events.run()?.event){a.events.choose(2);return enter(a);}}
function complete(a){for(let n=0;n<70&&a.controller().state.stage!=='finished';n++){if(!a.state().run)enter(a);const r=a.state().run;r.enemy.hp=0;a.win();a.flush();}assert.equal(a.controller().state.stage,'finished');}
test('Forge, Merchant and Sigil prices use Expedition unlocks without touching legacy progress',()=>{
 const a=create(14),s=a.state();a.controller().state.unlocked=80;s.fragments=10000;s.gold=10000;
 a.craft(80,2,'armor','Armor');const crafted=s.stash.at(-1);
 assert.equal(crafted.tier,80);assert.equal(crafted.source,'forge');assert.notEqual(crafted.rarity,'Legendary');
 assert.equal(crafted.craftPrice,2430);assert.equal(s.fragments,7570);assert(a.sale(crafted)<=Math.floor(2430*.25));
 a.buy(0);assert.equal(s.stash.at(-1).tier,80);assert.equal(s.stash.at(-1).source,'merchant');
 assert.equal(s.maxDungeon,1);assert.equal(s.onlineProgress.deepestCleared,0);
 assert.equal(a.economy.sigilPrice(80),820);
 const stock=s.merchant.stock.map(i=>i.id).join(),gold=s.gold;
 a.refresh('sigils');assert.equal(s.merchant.stock.map(i=>i.id).join(),stock);assert.equal(s.gold,gold);
 const sigils=s.merchant.sigils.join();a.refresh('gear');assert.equal(s.merchant.sigils.join(),sigils);
 assert.equal(a.gearFamily('poison'),'Decay');assert.equal(a.gearFamily('shock'),'Magic');
 assert.equal(a.build(),null,'gear Sigils do not grant temporary families');
});
test('live Masterwork odds match the mature economy helper rather than charging 3x for 2x odds',()=>{
 const a=create(91),base=a.rarityOdds(1,true),high=a.qualityOdds(base,1),master=a.qualityOdds(base,2);
 assert(master.Epic>high.Epic);assert(master.Rare>high.Rare);assert.equal(master.Legendary,0);
 assert(Math.abs(Object.values(master).reduce((n,v)=>n+v,0)-1)<1e-9);
 const vm=require('node:vm'),fs=require('node:fs'),ctx={};
 vm.runInNewContext(fs.readFileSync('economy/v0101.js','utf8'),ctx);
 assert.equal(JSON.stringify(master),JSON.stringify(ctx.WandererEconomyV0101.qualityOdds(base,2)));
});
test('stale vendor/crafting actions are blocked during routes, draft and combat; entry grants nothing',()=>{
 const a=create(19),s=a.state();s.fragments=s.gold=10000;a.rollShop();
 const before=JSON.stringify({gold:s.gold,fragments:s.fragments,stash:s.stash});a.start(1);
 assert.equal(JSON.stringify({gold:s.gold,fragments:s.fragments,stash:s.stash}),before);
 assert.equal(a.economyCanAct(),false);a.craft(1);a.buy(0);a.refresh();
 assert.equal(JSON.stringify({gold:s.gold,fragments:s.fragments,stash:s.stash}),before);
 a.initial('blood');a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();assert.equal(a.economyCanAct(),false);
 a.craft(1);a.buy(0);a.refresh('sigils');a.win();
 assert.equal(JSON.stringify({gold:s.gold,fragments:s.fragments,stash:s.stash}),before,'live enemy grants no reward');
});
test('Wave cash awards are once-only; death loses Expedition equipment',()=>{
 const a=create(29),s=a.state();a.start(1);enter(a);
 s.run.enemy.hp=0;a.win();const gold=s.gold,fragments=s.fragments,stash=JSON.stringify(s.stash);
 a.win();assert.equal(s.gold,gold);assert.equal(s.fragments,fragments);assert.equal(JSON.stringify(s.stash),stash);
 a.flush();if(!s.run)enter(a);a.death();
 assert.equal(s.gold,gold);assert.equal(s.fragments,fragments);assert.equal(a.bag.items().length,0);
 assert.equal(a.controller().state.unlocked,1);assert.equal(a.build(),null);
});
test('full Stash keeps guaranteed boss loot in overflow, claims exactly once, and blocks another entry',()=>{
 const a=create(37),s=a.state();a.start(1);complete(a);
 // Replay at a full Stash during combat: the guaranteed last boss drop must survive.
 while(a.bag.overflow()>0)a.bag.discard(a.bag.items().at(-1).id);a.claimRune(s.pendingRuneReward.options[0].id);a.start(1);
 for(let n=0;n<60&&a.controller().state.stage!=='finished';n++){
  if(a.controller().state.stage==='choice')enter(a);
  if(s.run.enemy.boss)while(s.stash.length<40)s.stash.push(a.makeItem(1,'helm',null,'loot','Helm','Common'));
  s.run.enemy.hp=0;a.win();a.flush();
 }
 assert.equal(s.stash.length,40);assert(s.expeditionOverflow.length>=1);
 const secured=s.expeditionOverflow[0].id,balance=s.gold;
 a.start(1);assert.equal(a.controller().state.stage,'finished');assert.equal(s.gold,balance);
 s.stash.splice(0,1);assert.equal(a.claimOverflow(),1);assert(s.stash.some(i=>i.id===secured));assert.equal(a.claimOverflow(),0);
});
test('every completed Expedition boss awards real-tier Runes, without legacy unlock side effects',()=>{
 const a=create(42),s=a.state();a.controller().state.unlocked=10;a.start(10);complete(a);
 assert.equal(s.pendingRuneReward.tier,10);assert.equal(s.pendingRuneReward.options.length,3);
 assert(s.pendingRuneReward.options.every(a.validRune));const chosen=s.pendingRuneReward.options[0];
 const stage=a.controller().state.stage;a.start(11);assert.equal(a.controller().state.stage,stage,'unclaimed Rune cannot be overwritten');
 assert.equal(a.claimRune(chosen.id),true);assert.equal(a.claimRune(chosen.id),false);
 assert.equal(s.runes.length,1);assert.equal(s.maxDungeon,1);assert.equal(s.onlineProgress.deepestCleared,0);
 assert.equal(a.controller().state.unlocked,11);assert(s.runeSlots.includes(chosen.id));
});
test('endgame stays within existing gear/Rune tier cap and investment remains finite',()=>{
 const a=create(61),s=a.state();a.controller().state.unlocked=200;a.start(200);complete(a);
 assert.equal(a.controller().state.unlocked,200);assert.throws(()=>a.controller().start(201),/locked/);
 assert(s.pendingRuneReward.options.every(r=>r.tier===200&&a.validRune(r)));
 for(const tier of [1,20,80,200]){
  assert.equal(a.craftCost(tier),10+10*tier);
  for(let rank=0;rank<10;rank++)assert(Number.isFinite(a.economy.upgradeCost(tier,rank)));
 }
});
