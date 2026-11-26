'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const B=globalThis.WandererV012Buildcraft;
const create=require('./v012-economy-harness.cjs');

test('current v15 affinity, Basic and Magic purchases use actual prerequisites and earned XP',()=>{
 for(const id of ['affinity_blood','affinity_decay','affinity_aegis','affinity_radiance','affinity_fury','affinity_arcane','bleeding_edge','corrupting_touch','quick_hands','guarded_block']){
  const p=buy([id]);assert(p.nodes.includes(id),id);
  assert(T.earned(p)>=p.nodes.length,id);
 }
 assert.equal(typeof T.attributePoints,'undefined');
 assert.equal(T.valid({...T.create(),treeVersion:12}),false);
});
test('v15 Magic attunement selects one mode and cannot retain skills from another mode',()=>{
 const p=buy(['element_choice']);
 const fire=T.selectElement(p,'fire');assert(fire&&T.valid(fire));
 const frost=T.selectElement(fire,'frost');assert(frost&&T.valid(frost));
 assert.notEqual(fire.element,frost.element);
 const invalid={...frost,nodes:[...frost.nodes,'nonexistent_historical_node']};
 assert.equal(T.valid(invalid),false);
});
test('current v15 stats are applied from a permanent Magic build',()=>{
 const p=buy(['affinity_arcane']);
 const base={attack:100,spellPower:60,maxhp:500,defense:20,crit:5,attacksPerSec:1,mana:50,manaRegen:1,blockChance:0};
 const result=T.apply({...base},p);
 assert(result.spellPower>base.spellPower);
 assert(T.valid(p));
});
test('Staff and Wand retain different native funded Mana costs',()=>{
 const b=B.create();
 assert.equal(B.nextCost(b,13),13);
 assert.equal(B.nextCost(b,9),9);
 b.picks=Array(5).fill('efficient_cast');
 assert.equal(B.nextCost(b,13),8);
 assert.equal(B.nextCost(b,9),4);
});
test('purchased Blood Transfer chains all active stacks at half potency, but never targets waiting reserves',()=>{
 const b=B.create();b.runtime.specializations=['sanguine_echo'];
 const source={hp:0,bleedStacks:3,dots:{bleed:[{damage:20,remaining:4},{damage:8,remaining:2,transferred:true},{damage:1,remaining:1}]}};
 const first={hp:30,dots:{bleed:[]}},next={hp:30,dots:{bleed:[]}},queued={hp:30,dots:{bleed:[]}};
 const calls=[],synced=[];
 const c={waveKey:'1:1',now:0,enemy:source,
  player:{hp:50,maxhp:100,enemies:[source],groupReserve:[queued]},
  heal:()=>{},barrier:()=>{},mana:()=>{},log:()=>{},
  synchronizeDots:e=>synced.push(e),secondaryHit:(e,n)=>{calls.push(n);e.hp-=n;return n;}};
 B.onKill(b,c);assert.equal(queued.dots.bleed.length,0);assert.equal(calls.length,0);
 c.player.enemies.push(first,next);B.onKill(b,c);
 assert.deepEqual(first.dots.bleed.map(d=>d.damage),[10,4]);assert(first.dots.bleed.every(d=>d.transferred));assert.equal(first.bleedStacks,2);
 assert.equal(first.hp,16);assert.equal(synced[0],first);assert.equal(next.dots.bleed.length,0);
 c.enemy=first;first.hp=0;B.onKill(b,c);
 assert.deepEqual(next.dots.bleed.map(d=>d.damage),[5,2]);assert.equal(next.hp,23);assert.deepEqual(calls,[14,7]);assert.equal(synced[1],next);
 assert.equal(queued.dots.bleed.length,0);assert.equal(queued.hp,30);
});
test('trait-only Bleed transfer preserves its distinct nonrecursive reserve path',()=>{
 const b=B.create(),queued={hp:30,dots:{bleed:[]}},next={hp:30,dots:{bleed:[]}};
 const c={waveKey:'1:1',now:0,traits:['blood_transfer'],enemy:{hp:0,bleedStacks:1,dots:{bleed:[{damage:20,remaining:4}]}},
  player:{hp:50,maxhp:100,enemies:[],groupReserve:[queued]},heal:()=>{},barrier:()=>{},mana:()=>{},log:()=>{}};
 B.onKill(b,c);assert.equal(queued.dots.bleed.length,1);assert.equal(queued.dots.bleed[0].damage,10);assert.equal(queued.dots.bleed[0].transferred,true);assert.equal(queued.hp,30);
 c.enemy=queued;c.player.groupReserve=[next];queued.hp=0;B.onKill(b,c);assert.equal(next.dots.bleed.length,0);
});
test('current Dungeon start and combat use equipment and v15 talents from the native harness',()=>{
 const a=create(7301);a.setup(1,'Staff');
 a.state().automaticTalents=buy(['affinity_arcane']);
 a.start(1,true);const controller=a.controller(),card=controller.state.dungeon.cards[0];
 controller.chooseRealm(card.id);assert(controller.visitRoom(1));assert(a.enter());
 const run=a.state().run;
 assert(run?.enemy&&run.status==='fight');
 assert(run.stats.attack>=0&&run.stats.spellPower>0);
 assert.equal(a.state().automaticTalents.treeVersion,15);
});
