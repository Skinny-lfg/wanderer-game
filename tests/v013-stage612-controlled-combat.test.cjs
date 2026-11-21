'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../scripts/v013-stage612-controlled-combat.cjs');
const L=require('../scripts/v013-stage611-legal-adaptive.cjs');
const S=require('../scripts/simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const all=M.archetypes();

test('Stage 6.12 enumerates all live strategic profiles and current graph endpoints',()=>{
 const core=L.pathTargets().targets.filter(x=>x.kind!=='agent-milestone');
 assert.equal(core.length,27);
 assert.equal(all.length,48);
 assert.equal(all.filter(x=>x.kind==='strategic-profile').length,21);
 assert.equal(all.filter(x=>x.kind==='native-target-route').length,27);
 assert.equal(new Set(all.map(x=>x.key)).size,48);
});
test('Controlled advanced profile allocations are native-valid, not invented ability/rank shortcuts',()=>{
 const fingerprints=new Set();
 for(const a of all)for(const points of [12,24,36,60]){
  const b=M.buildTalent(a,points);
  assert(T.valid(b.talents),a.key+' '+points);
  assert.equal(T.earned(b.talents),points);
  assert.equal(b.spent,b.talents.nodes.length);
  assert(b.spent<=points);
  assert(b.unlocked.every(f=>b.talents.nodes.includes('affinity_'+f)));
  if(b.prepared)assert(b.talents.nodes.includes(b.prepared));
  fingerprints.add(b.talentSha256);
 }
 assert(fingerprints.size>=20,'distinct real native graph allocations expected');
});
test('Scenario design has 48 archetypes, four budgets and real controlled equipment constraints',()=>{
 const pool=M.candidates();
 assert.equal(pool.length,48*4*3);
 assert.equal(new Set(pool.map(x=>x.id)).size,pool.length);
 assert.equal(new Set(pool.map(x=>x.key)).size,48);
 assert.deepEqual([...new Set(pool.map(x=>x.points))].sort((a,b)=>a-b),[12,24,36,60]);
 assert.deepEqual([...new Set(pool.map(x=>x.weapon))].sort(),['Bow','Daggers','Mace','Staff','Sword','Two-Handed','Wand']);
 assert.deepEqual([...new Set(pool.map(x=>x.armor))].sort(),['Cloth','Leather','Plate']);
 assert.deepEqual([...new Set(pool.map(x=>x.encounter))].sort(),['boss','elite','normal']);
 for(const row of pool){
  assert(['Shield','Orb','Tome','Charm','Off-Hand Dagger',null].includes(row.offhand));
  if(['Bow','Staff','Two-Handed'].includes(row.weapon))assert.equal(row.offhand,null);
 }
});
test('Greedy native coverage is bounded, deterministic and includes different opponents',()=>{
 const pool=M.candidates([12,24,36,60],612001);
 const a=M.chooseScenarios(pool,96),b=M.chooseScenarios(pool,96);
 assert.deepEqual(a.selected,b.selected);
 assert.equal(a.selected.length,96);
 assert(a.selectedArchetypes>=42);
 assert.equal(a.plannedCoverage.weapon.length,7);
 assert.equal(a.plannedCoverage.armor.length,3);
 assert.equal(a.plannedCoverage.opponent.length,3);
 assert.equal(a.plannedCoverage.realm.length,6);
 assert(a.plannedPairKeys>25);
});
test('Native fixture accepts exact legal v15 progress, rolled class gear and dagger offhand',()=>{
 const a=all.find(x=>x.key==='profile:magic-arcane-pure');
 const p=M.buildTalent(a,24),build={id:'controlled-stats',weapon:'Sword',families:['magic'],skills:[]};
 const opts={mode:'encounter',gear:'current',rarity:'Rare',points:24,
  runes:false,contracts:'none',tickLimit:1200,targetPolicy:'focus',
  measure:false,lockScenarioStreams:true,controlledTalents:p.talents,
  armorType:'Cloth',offhandType:'Off-Hand Dagger'};
 const r=S.prepare(15,build,612036,opts);
 assert.equal(r.a.state().equip.armor.armorType,'Cloth');
 assert.equal(r.a.state().equip.offhand.subtype,'Off-Hand Dagger');
 assert(r.a.state().equip.helm.armorType==='Cloth');
 assert.deepEqual(r.a.state().automaticTalents.nodes,p.talents.nodes);
 assert(T.valid(r.a.state().automaticTalents));
 assert.equal(r.allocatedPoints,p.spent);
});
test('Native fixture rejects talent budget minting and invalid gear pairings',()=>{
 const build={id:'no-fakes',weapon:'Sword',families:['blood'],skills:[]};
 const p=M.buildTalent(all.find(x=>x.key==='profile:blood-pure'),24);
 const base={mode:'encounter',gear:'current',rarity:'Rare',points:24,
  controlledTalents:p.talents,runes:false};
 assert.throws(()=>S.prepare(15,build,77111,{...base,points:25}),/point budget/);
 assert.throws(()=>S.prepare(15,build,77111,{...base,armorType:'Mythril'}),/armor/);
 assert.throws(()=>S.prepare(15,{...build,weapon:'Staff'},77111,
  {...base,offhandType:'Shield'}),/Off-Hand not compatible/);
 assert.throws(()=>M.parse(['--mode=matrix','--limit=9999']),/budget/);
});
test('Actual controlled combat reports its real native roster, traits and provenance',()=>{
 const row={...M.candidates([12])[1],rarity:'Rare'};
 const x=M.execute(row,{tickLimit:4500});
 assert.equal(x.points,12);
 assert(x.rawTalentNodes.length<=12);
 assert(x.native.controlledTalentNodes);
 assert.equal(x.native.armorType,row.armor);
 assert.equal(x.native.nativeEncounter,row.encounter);
 assert(['normal','elite','boss'].includes(x.encounter));
 assert(x.native.roster.length>=1);
 assert(x.native.sourceModules===undefined);
 assert.equal(x.timedOut,false);
});
test('A matched offhand pair holds other native rolls and real encounter streams constant',()=>{
 const r=M.runMatchedOffhands({...M.DEFAULTS,paired:1,budgets:[12],tickLimit:4500});
 assert.equal(r.pairs,1);
 assert.equal(r.actualFights,2);
 assert(r.results[0].sameNonOffhandGear&&r.results[0].sameResolvedSeed);
 assert.notEqual(r.results[0].controls[0].offhand,r.results[0].controls[1].offhand);
});

test('Native two-handed controlled fixture accepts an explicitly empty offhand',()=>{
 const a=all.find(x=>x.key==='profile:blood-pure');
 const progress=M.buildTalent(a,12);
 const build={id:'two-hand-no-offhand',weapon:'Two-Handed',families:['blood'],skills:[]};
 const r=S.prepare(5,build,612101,{mode:'encounter',gear:'current',rarity:'Rare',
  points:12,controlledTalents:progress.talents,runes:false,offhandType:null,armorType:'Leather'});
 assert.equal(r.a.state().equip.weapon.subtype,'Two-Handed');
 assert.equal(r.a.state().equip.offhand,null);
 assert.equal(r.a.state().equip.armor.armorType,'Leather');
});
