'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../combat/v013-expedition-foundation.js');
const makeCards=()=>[
 {id:'forge',family:'blood',risk:0},
 {id:'temple',family:'decay',risk:1},
 {id:'ward',family:'aegis',risk:2}
];
const manifest=(seed=123,style='guardian')=>F.createManifest(makeCards(),{seed,expeditionLevel:70,bossStyle:style});
test('approved lore catalogues contain stable unique IDs, names and numeric parameters',()=>{
 assert.equal(F.validateCatalog(),true);
 assert.deepEqual(Object.fromEntries(Object.entries(F.CATALOG).map(([k,x])=>[k,x.length])),{conditions:6,encounterTraits:6,bossModifiers:6,boons:6,contracts:4,rooms:1});
 assert.equal(F.lookup('conditions','sanguine_rite').name,'Sanguine Rite');
 assert.equal(F.lookup('rooms','forgotten_reliquary').name,'Forgotten Reliquary');
 assert.equal(F.lookup('contracts','oath_of_defiance').name,'Oath of Defiance');
 assert.equal(F.lookup('bad','no'),null);
 assert(Object.isFrozen(F.CATALOG.conditions[0].params));
 assert(Object.isFrozen(F.CATALOG.conditions[0].families));
});
test('difficulty baselines match existing 18/20/22 rooms and 14/13/12 steps',()=>{
 assert.deepEqual(F.DIFFICULTIES.map(d=>[d.name,d.rooms,d.steps,d.elites,d.escorts,d.bonus]),[
 ['Guarded',18,14,1,0,0],['Dangerous',20,13,1,1,.12],['Brutal',22,12,2,2,.24]]);
});
test('named RNG streams are repeatable and independent of draw order',()=>{
 const x=F.createStreams(0),y=F.createStreams(0);
 const first=x.map(),second=x.map();for(let i=0;i<20;i++)x.combat();
 assert.equal(y.map(),first);assert.equal(y.map(),second);
 assert.notEqual(F.deriveSeed(0,'map'),F.deriveSeed(0,'combat'));
 assert.notEqual(F.deriveSeed(0,'combat'),F.deriveSeed(1,'combat'));
 assert.throws(()=>F.createStreams(-1));assert.throws(()=>F.createStreams(0x100000000));
});
test('catalogue planner generates same conditions and modifiers for the same seed',()=>{
 assert.deepEqual(manifest(),manifest());
 assert.deepEqual(JSON.parse(JSON.stringify(manifest())),manifest());
 assert.notDeepEqual(manifest(123),manifest(124));
});
test('10k seeded manifests have distinct affinity-compatible conditions and legal boss modifiers',()=>{
 const configs=['guardian','leech','berserker'];
 for(let seed=0;seed<10000;seed++){
  const m=manifest(seed,configs[seed%3]);
  assert.equal(m.cards.length,3);assert.equal(new Set(m.cards.map(x=>x.conditionId)).size,3);
  for(const c of m.cards){
   assert(F.lookup('conditions',c.conditionId).families.includes(c.family));
   assert.equal(c.bossModifierIds.length,c.risk+1);
   assert.equal(new Set(c.bossModifierIds).size,c.bossModifierIds.length);
   for(const id of c.bossModifierIds){const modifier=F.lookup('bossModifiers',id);
    assert(!modifier.excludeBossStyles?.includes(m.bossStyle));
    assert(!modifier.conflicts?.includes(c.conditionId));
    assert(!F.lookup('conditions',c.conditionId).conflicts?.includes(id));
   }
  }
 }
});
test('all combinations of three different affinity families have legal distinct conditions',()=>{
 const families=F.AFFINITIES;
 for(const a of families)for(const b of families)for(const c of families){if(new Set([a,b,c]).size!==3)continue;
  const cards=[{id:'x',family:a,risk:0},{id:'y',family:b,risk:1},{id:'z',family:c,risk:2}];
  for(const style of F.BOSS_STYLES){const m=F.createManifest(cards,{seed:30,expeditionLevel:250,bossStyle:style});assert.equal(new Set(m.cards.map(x=>x.conditionId)).size,3);}
 }
});
test('Stage 0 state has JSON-safe default shape and rejects invalid manifest cards',()=>{
 const m=manifest();const s=F.createExpeditionState(m,'forge');
 assert.equal(F.validateExpeditionState(s,m),true);
 assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
 assert.equal(s.contractId,null);assert.deepEqual(s.knownRooms,[0]);
 assert.throws(()=>F.createExpeditionState(m,'unknown'));
 assert.throws(()=>F.createManifest(makeCards().slice(0,2),{seed:1,expeditionLevel:1,bossStyle:'guardian'}));
 assert.throws(()=>F.createManifest(makeCards(),{seed:1,expeditionLevel:0,bossStyle:'guardian'}));
 assert.equal(F.validateExpeditionState({...s,conditionId:'other'},m),false);
});
test('pure decision journal can replay scouting, contract, boons and boss preparation without mutating input',()=>{
 const m=manifest(125,'leech');let s=F.createExpeditionState(m,'forge');const initial=JSON.stringify(s);
 const choices=[{type:'reveal_room',room:2},{type:'discover_secret',edgeId:'7-8'},
 {type:'select_contract',id:'bounty_writ'}, {type:'choose_boon',id:'blood_tribute'},
 {type:'choose_boon',id:'wayfarers_bargain'}, {type:'prepare_boss',source:'markedElite'}];
 for(const action of choices)s=F.applyDecision(s,action,m);
 assert.equal(s.decisions.length,choices.length);
 assert.equal(s.knownRooms[1],2);assert.equal(s.contractId,'bounty_writ');assert.equal(s.boonIds.length,2);
 assert.deepEqual(s,F.replayDecisions(m,'forge',choices));
 assert.equal(JSON.stringify(F.createExpeditionState(m,'forge')),initial);
 assert.throws(()=>F.applyDecision(s,{type:'select_contract',id:'pathfinder'},m));
 assert.throws(()=>F.applyDecision(s,{type:'prepare_boss',source:'markedElite'},m));
 assert.throws(()=>F.applyDecision(s,{type:'choose_boon',id:'wayfarers_bargain'},m));
 assert.throws(()=>F.applyDecision(s,{type:'reveal_room',room:2},m));
});
test('foundation has no dependency on player saves, runtime side effects or combat module',()=>{
 assert(!('window' in F));assert(!('save' in F));assert(!('damage' in F));
});

test('foundation reuses the actual six affinities, boss styles and Realm Card shape',()=>{
 require('../online/v012-expedition-controller.js');
 const native=globalThis.WandererV012Expedition;
 assert.deepEqual([...F.AFFINITIES],[...native.FAMILIES]);
 assert.deepEqual([...F.BOSS_STYLES],native.BOSSES.map(b=>b.style));
 assert(Object.values(native.REALMS).every(([family])=>F.AFFINITIES.includes(family)));
 const cards=[{id:'forge',family:native.REALMS.forge[0],risk:0},
  {id:'temple',family:native.REALMS.temple[0],risk:1},
  {id:'ward',family:native.REALMS.ward[0],risk:2}];
 assert.equal(F.createManifest(cards,{seed:350,expeditionLevel:250,bossStyle:native.BOSSES[0].style}).cards.length,3);
});
