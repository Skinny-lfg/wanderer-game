'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../economy/v012-loot-rules.js');
const create=require('./v012-economy-harness.cjs');
const Rules=globalThis.WandererV012LootRules;
function close(a,b){assert(Math.abs(a-b)<1e-10,'Expected '+a+' ~= '+b);}
test('Stage 9.6 adds only Grey drop probability, never takes away Uncommon+ odds',()=>{
 const oldDrop=[0,.28,.30,.32,.60,1],bonus=[0,.10,.08,.06,0,0];
 for(const cha of [5,15,50])for(let stage=1;stage<=5;stage++){
  const old=Rules.waveLootOdds(stage,cha),next=Rules.v013DungeonWaveOdds(stage,cha);
  close(next.drop,oldDrop[stage]+bonus[stage]);
  close(Object.values(next.rarities).reduce((sum,x)=>sum+x,0),1);
  for(const r of ['Uncommon','Rare','Epic','Legendary'])
   close(next.drop*next.rarities[r],oldDrop[stage]*old.rarities[r]);
  close(next.drop*next.rarities.Common,
   oldDrop[stage]*old.rarities.Common+bonus[stage]);
  assert(Object.values(next.rarities).every(v=>v>=0&&v<=1),'invalid loot rarity');
 }
 assert.equal(Rules.waveLootOdds(1).drop,.04,'legacy v0.12 must be untouched');
 assert.equal(Rules.waveLootOdds(4).drop,.18,'legacy v0.12 Elite must be untouched');
 assert.equal(Rules.v013DungeonWaveOdds(4).drop,.60);
 assert.equal(Rules.v013DungeonWaveOdds(5).drop,1);
});
test('Grey is a basic one-stat, zero-primary item and yields real Forge Fragments on salvage',()=>{
 const a=create(9116,undefined,{}, {skipPersistence:true});
 const grey=a.makeItem(1,'weapon',null,'loot','Sword','Common');
 const primary=['str','agi','int','end','cha'];
 assert.equal(grey.rarity,'Common');assert.equal(grey.source,'loot');
 assert(primary.every(k=>!(grey[k]||0)));
 assert.equal(grey.v013StatCount,1);
 assert(a.sale(grey)>0,'earned Grey must be useful for Forge Fragments');
 assert.equal(a.sale(a.state().equip.weapon),0,'initial protected sword cannot be farmed');
});
test('Native first room remains guaranteed Uncommon+, later normal room may drop a Grey and salvage at Camp',()=>{
 let found=false;const debug=[];
 for(let seed=6041;seed<6070&&!found;seed++){
  const a=create(seed,undefined,{}, {skipPersistence:true});
  const c=a.controller();a.start(1,true);const card=c.state.dungeon.cards[0];c.chooseRealm(card.id);
  if(!c.visitRoom(1)||!a.enter())continue;
  a.rng(0); // deterministic loot proof, not the natural progression simulation
  let r=a.state().run;if(r.enemies)for(const e of r.enemies)e.hp=0;else r.enemy.hp=0;
  a.win();
  const first=a.bag.items().filter(i=>i.kind!=='valuable'&&i.source==='loot');
  assert.equal(first.length,1,'first encounter guarantees exactly one equipment item');
  assert.notEqual(first[0].rarity,'Common','first-room reward must still be upgraded');
  // Clear the previous native Realm result; the next Enter refuses an active run.
  for(let n=0;n<3&&a.state().run?.status==='cleared';n++)a.exitResult();
  const dungeon=c.state.dungeon,steps=dungeon.steps;
  const candidates=card.nodes.map((n,i)=>({n,i})).filter(({n,i})=>
   n.kind==='combat'&&!dungeon.cleared.includes(i)&&c.travelPath(i)?.length&&
   c.travelCost(c.travelPath(i))<=steps);
  if(!candidates.length){if(debug.length<4)debug.push({seed,stage:c.state.stage,steps,current:dungeon.current,cleared:dungeon.cleared,rewardPending:!!c.state.rewardPending, kinds:card.nodes.map((n,i)=>({i,kind:n.kind,path:c.travelPath(i),cost:c.travelCost(c.travelPath(i))})).slice(0,9)});continue;}
  const next=candidates[0].i;
  if(!c.visitRoom(next)||!a.enter())continue;
  r=a.state().run;
  if(r.enemies)for(const e of r.enemies)e.hp=0;else r.enemy.hp=0;
  a.rng(0);a.win();
  const gained=a.bag.items().filter(i=>i.kind!=='valuable'&&i.source==='loot'&&i.id!==first[0].id);
  assert.equal(gained.length,1,'second ordinary fight must roll at most one gear drop');
  assert.equal(gained[0].rarity,'Common','Grey may drop outside first-room guarantee');
  assert(gained[0].v013StatCount===1);
  for(let n=0;n<3&&a.state().run?.status==='cleared';n++)a.exitResult();
  if(!a.checkpoint.extract())throw Error('native extraction rejected for verified Grey loot');
  for(let n=0;n<4&&a.results().review;n++)a.exitResult();
  const before=a.state().fragments,worth=a.sale(gained[0]);
  assert(worth>0);
  assert(a.state().stash.some(i=>i.id===gained[0].id),'extracted Grey must persist in Stash');
  a.salvage([gained[0].id]);
  assert.equal(a.state().fragments-before,worth,'real Camp salvage should award Fragments');
  assert(!a.state().stash.some(i=>i.id===gained[0].id));
  found=true;
 }
 assert(found,'at least one seeded E1 Dungeon allows two ordinary encounters and extraction: '+JSON.stringify(debug));
});
