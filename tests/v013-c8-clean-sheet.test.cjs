'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const create=require('./v012-economy-harness.cjs');
require('../online/v013-map-intelligence.js');
const M=globalThis.WandererV013MapIntelligence;
function setup(seed,tier=5,weapon='Sword'){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.setup(tier,weapon,'Rare');a.setUnlocked(tier);a.start(tier,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);
 return {a,c,card};
}
function firstCombat(a,c){
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 const r=a.state().run;assert(r&&r.enemy&&r.status==='fight');return r;
}
function bossPath(card){
 const boss=card.nodes.findIndex(n=>n.kind==='boss'),q=[[0]],seen=new Set([0]);assert(boss>0);
 for(const path of q){const at=path.at(-1);if(at===boss)return path;
  for(const n of M.neighbors(card,{discoveredSecrets:[],visited:[]},at))if(!seen.has(n)){seen.add(n);q.push([...path,n]);}
 }throw Error('Native Boss inaccessible');
}
function bossVictory(seed,options={}){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 const tier=options.tier||35;a.setup(tier,'Sword','Legendary');a.setUnlocked(tier);if(options.runeCount)for(let i=0;i<options.runeCount;i++)a.state().runes.push(a.makeRune('might',1));a.start(tier,true);
 const c=a.controller(),g=c.state,card=options.family?g.dungeon.cards.find(card=>card.family===options.family):g.dungeon.cards[options.cardIndex||0];if(!card)return null;c.chooseRealm(card.id);
 for(const node of bossPath(card).slice(1)){
  assert.equal(c.visitRoom(node),true);
  if(g.dungeon.boonOffer){assert.equal(c.chooseBoon(null),null);continue;}
  if(g.dungeon.cleared.includes(node))continue;
  assert.equal(a.enter(),true);
  if(a.events.run()?.event)assert.equal(a.events.choose(2),true);
  else {
   if(options.forceBossOverflow&&card.nodes[node].kind==='boss'){
    while(a.storage.occupied()<a.storage.capacity())a.state().stash.push(a.makeItem(1,'helm',null,'loot','Cloth','Common'));
    a.rng(0); // deterministic valid loot roll; no guaranteed-drop gameplay change
   }
   const r=a.state().run;assert.equal(r?.status,'fight');
   for(let i=0;r.status==='fight'&&i<100;i++){
    for(const mob of r.enemies?.length?r.enemies:[r.enemy])if(mob)mob.hp=0;
    a.win();a.flush();
   }
   assert.equal(r.status,'cleared');
   if(g.stage!=='finished')a.exitResult();
  }
 }
 assert.equal(g.stage,'finished');assert.equal(a.results().summary?.outcome,'victory');
 return {a,c,g,card};
}
test('C8 death destroys earned Bag items and restores the entrance loadout after an equipment swap',()=>{
 const {a,c}=setup(90801),s=a.state(),home=s.equip.weapon;
 const found=a.makeItem(5,'weapon',null,'loot','Mace','Rare');
 a.bag.mark(found);assert.equal(a.equip(found.id),true);
 assert.equal(s.equip.weapon.id,found.id);
 assert(a.bag.items().some(x=>x.id===home.id));
 firstCombat(a,c);a.death();
 assert.equal(c.state.stage,'failed');assert.equal(s.equip.weapon.id,home.id);
 assert(!s.stash.some(x=>x.id===found.id));assert.equal(a.bag.items().length,0);
});
test('C8 end-of-run overflow cannot be claimed at full Stash and is settled once when space opens',()=>{
 const {a}=bossVictory(90802),s=a.state();
 const secured=a.makeItem(35,'helm',null,'loot','Cloth','Rare');
 while(a.storage.occupied()<a.storage.capacity())s.stash.push(a.makeItem(1,'helm',null,'loot','Cloth','Common'));
 s.expeditionOverflow.push(secured);
 assert.equal(a.claimOverflow(),0);
 assert(s.expeditionOverflow.some(x=>x.id===secured.id));
 s.stash.splice(0,1);assert.equal(a.claimOverflow(),1);
 assert(s.stash.some(x=>x.id===secured.id));assert.equal(a.claimOverflow(),0);
});
test('C8 actual Boss loot enters overflow when Stash is full and cannot be claimed twice',()=>{
 const {a}=bossVictory(90806,{forceBossOverflow:true}),s=a.state();
 const earned=new Set(a.results().earned.map(x=>x.id));
 const reward=s.expeditionOverflow.find(x=>earned.has(x.id));
 assert(reward,'A native Boss loot roll must be secured in overflow rather than silently lost');
 assert.equal(a.claimOverflow(),0,'Full Stash refuses claim');
 s.stash.splice(0,1);assert.equal(a.claimOverflow(),1);
 assert(s.stash.some(x=>x.id===reward.id));
 assert(!s.expeditionOverflow.some(x=>x.id===reward.id));
 assert.equal(a.claimOverflow(),0,'Claim cannot duplicate an existing item');
});
test('C8 native Boss victory awards exactly one persistent-tier Rune without auto-equip',()=>{
 const {a,g}=bossVictory(90803),s=a.state();
 assert(!Object.hasOwn(s,'pendingRuneReward'));assert.equal(s.runes.length,1);
 const rune=s.runes[0];assert.equal(rune.tier,35);assert(a.validRune(rune));
 assert(s.runeSlots.every(id=>id===null));assert.equal(g.unlocked,36);
 assert.equal(a.results().summary.runeTier,35);assert(a.results().summary.runeName.includes(rune.name));
});
test('C8 each of the six native Boss affinities yields one direct Anchor Rune',()=>{
 for(const family of ['blood','decay','radiance','aegis','fury','arcane']){
  let victory=null;
  for(let seed=90800;seed<90900&&!victory;seed++)victory=bossVictory(seed,{family});
  assert(victory,'No native Realm card for '+family);
  const {a,card}=victory,s=a.state();assert.equal(card.family,family);
  assert.equal(s.runes.length,1,family);assert.equal(s.runes[0].tier,35);
  assert(a.validRune(s.runes[0]));assert(!Object.hasOwn(s,'pendingRuneReward'));
  assert(s.runeSlots.every(id=>id===null));
 }
});
test('C8 native Boss victory fills the reserved last Rune Bag slot without losing the drop',()=>{
 const {a}=bossVictory(90803,{runeCount:299}),s=a.state();
 assert.equal(s.runes.length,300);assert.equal(s.runes.at(-1).tier,35);
 assert.equal(new Set(s.runes.map(r=>r.id)).size,300);
 assert(s.runeSlots.every(id=>id===null));
});
test('C8 dual Daggers preserve independent offhand scheduling and nonrecursive direct strikes',()=>{
 const a=create(90804,undefined,{}, {skipPersistence:true}),s=a.state();
 a.setup(5,'Sword','Rare');s.equip.weapon=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');
 const off=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');s.stash.push(off);
 assert.equal(a.equip(off.id,'offhand'),true);
 a.setUnlocked(5);a.start(5,true);const c=a.controller();c.chooseRealm(c.state.dungeon.cards[0].id);
 const r=firstCombat(a,c);assert.equal(r.stats.main.subtype,'Daggers');
 assert(['Daggers','Off-Hand Dagger'].includes(r.stats.off?.subtype));
 r.enemy.hp=r.enemy.maxhp=1000000;r.enemy.barrier=0;r.stats.crit=0;r.stats.bonus={};
 a.rng(1);const feedback=a.feedback();
 for(let i=0;i<3;i++){a.gear.weaponAttack(r);assert.equal(r.offhandStrikes||0,0,'main attacks must not schedule an offhand strike');}
 assert.equal(feedback.floats.filter(x=>x.target==='enemy'&&typeof x.value==='number').length,3);
 const before=r.enemy.hp,hit=a.gear.weaponAttack(r,true);
 assert(hit>0);assert.equal(before-r.enemy.hp,hit);
 assert.equal(feedback.floats.filter(x=>x.target==='enemy'&&typeof x.value==='number').length,4,'explicit offhand hit must not recurse');
 // Exact independent cadence through native ticks is covered in the B2.3 clock fixture.
 assert(!feedback.logs.some(x=>/Double Strike/i.test(x.text)));
});
test('C8 Wand+Orb Barrier: six-second cooldown, same formula and no cap',()=>{
 const {a,c}=setup(90805,5,'Wand'),r=firstCombat(a,c);
 assert.equal(r.stats.main.subtype,'Wand');assert.equal(r.stats.off?.subtype,'Orb');
 r.enemy.hp=r.enemy.maxhp=1000000;r.enemy.barrier=0;r.stats.crit=0;r.stats.bonus={};r.stats.spellPower=100;
 r.mp=r.maxmp=1000;r.barrier=0;r.combatSeconds=0;a.rng(1);
 a.gear.weaponAttack(r);const first=r.barrier;assert(first>0);
 a.gear.weaponAttack(r);assert.equal(r.barrier,first);
 r.combatSeconds=6;a.gear.weaponAttack(r);assert(r.barrier>first);
 const expected=r.maxhp*.02+r.stats.spellPower*.05;
 assert(Math.abs(first-expected)<.001);
 r.combatSeconds=12;r.barrier=r.maxhp*2;a.gear.weaponAttack(r);assert(r.barrier>r.maxhp*2);
 r.combatSeconds=18;r.barrier=0;r.mp=0;r.wisdomUsed=true;
 a.gear.weaponAttack(r);assert(r.barrier>0,'unfunded attacks that deal HP damage trigger Orb');
});
test('C8 current Camp rank milestone display does not use retired E225/E1025 tables',()=>{
 const src=fs.readFileSync('index.html','utf8');
 const from=src.indexOf('function phase5MilestoneMarkup('),to=src.indexOf('/* UI.5',from);
 assert(from>0&&to>from);
 const context={state:{crafting:{mythicFamilies:['blood']}},rankNames:['Scout','Delver','Vanguard','Warden','Mythic'],esc:x=>x};
 vm.runInNewContext(src.slice(from,to)+'\nglobalThis.milestones=phase5MilestoneMarkup;',context);
 const current=context.milestones(200);
 assert.match(current,/Expedition milestones/);assert.match(current,/Mythic victories by affinity: blood/);
 assert.match(current,/Scout/);assert.match(current,/Mythic/);
 assert.doesNotMatch(current,/Next milestone: E225|E1025/);
});
