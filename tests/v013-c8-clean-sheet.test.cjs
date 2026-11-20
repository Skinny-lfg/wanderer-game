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
 a.setup(35,'Sword','Legendary');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[0];c.chooseRealm(card.id);
 for(const node of bossPath(card).slice(1)){
  assert.equal(c.visitRoom(node),true);assert.equal(a.enter(),true);
  if(a.events.run()?.event)assert.equal(a.events.choose(2),true);
  else {
   if(options.forceBossOverflow&&card.nodes[node].kind==='boss'){
    while(a.state().stash.length<40)a.state().stash.push(a.makeItem(1,'helm',null,'loot','Cloth','Common'));
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
 return {a,c,g};
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
 while(s.stash.length<40)s.stash.push(a.makeItem(1,'helm',null,'loot','Cloth','Common'));
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
test('C8 native Boss victory offers and awards exactly one persistent-tier Rune choice',()=>{
 const {a,g}=bossVictory(90803),s=a.state(),reward=s.pendingRuneReward;
 assert(reward);assert.equal(reward.tier,35);assert.equal(reward.options.length,3);
 assert.equal(new Set(reward.options.map(r=>r.family)).size,3);
 assert(reward.options.every(r=>r.tier===35&&a.validRune(r)));
 const chosen=reward.options[0],before=s.runes.length;
 assert.equal(a.claimRune(chosen.id),true);assert.equal(a.claimRune(chosen.id),false);
 assert.equal(s.pendingRuneReward,null);assert.equal(s.runes.length,before+1);
 assert(s.runeSlots.includes(chosen.id));assert.equal(g.unlocked,36);
});
test('C8 dual Daggers produce one offhand strike per two primary strikes, without recursion',()=>{
 const a=create(90804,undefined,{}, {skipPersistence:true}),s=a.state();
 a.setup(5,'Sword','Rare');s.equip.weapon=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');
 const off=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');s.stash.push(off);
 assert.equal(a.equip(off.id,'offhand'),true);
 a.setUnlocked(5);a.start(5,true);const c=a.controller();c.chooseRealm(c.state.dungeon.cards[0].id);
 const r=firstCombat(a,c);assert.equal(r.stats.main.subtype,'Daggers');
 assert(['Daggers','Off-Hand Dagger'].includes(r.stats.off?.subtype));
 r.enemy.hp=r.enemy.maxhp=1000000;r.enemy.barrier=0;r.stats.crit=0;r.stats.bonus={};
 a.rng(1);const feedback=a.feedback();
 a.gear.weaponAttack(r);assert.equal(r.offhandStrikes||0,0);
 a.gear.weaponAttack(r);assert.equal(r.offhandStrikes,1);
 a.gear.weaponAttack(r);assert.equal(r.offhandStrikes,1);
 assert.equal(feedback.floats.filter(x=>x.target==='enemy'&&typeof x.value==='number').length,4);
 assert(!feedback.logs.some(x=>/Double Strike/i.test(x.text)));
});
test('C8 Wand+Orb Barrier: six-second cooldown, cap and insufficient-Mana guard',()=>{
 const {a,c}=setup(90805,5,'Wand'),r=firstCombat(a,c);
 assert.equal(r.stats.main.subtype,'Wand');assert.equal(r.stats.off?.subtype,'Orb');
 r.enemy.hp=r.enemy.maxhp=1000000;r.enemy.barrier=0;r.stats.crit=0;r.stats.bonus={};r.stats.spellPower=100;
 r.mp=r.maxmp=1000;r.barrier=0;r.combatSeconds=0;a.rng(1);
 a.gear.weaponAttack(r);const first=r.barrier;assert(first>0);
 a.gear.weaponAttack(r);assert.equal(r.barrier,first);
 r.combatSeconds=6;a.gear.weaponAttack(r);assert(r.barrier>first);
 const cap=Math.max(8,Math.round(r.maxhp*.3));
 r.combatSeconds=12;r.barrier=cap-1;a.gear.weaponAttack(r);assert(r.barrier<=cap);
 r.combatSeconds=18;r.barrier=0;r.mp=0;r.wisdomUsed=true;
 a.gear.weaponAttack(r);assert.equal(r.barrier,0);
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
