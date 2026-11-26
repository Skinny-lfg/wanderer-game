'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const E=require('../scripts/v013-stage618-mob-implementation.cjs');
const B=require('../scripts/v013-stage617-roster-ablation.cjs');
const S=require('../scripts/simulate-progression.cjs');
const create=require('./v012-economy-harness.cjs');

function rosterFor(source){
 const context={};
 vm.runInNewContext(fs.readFileSync('combat/v013-expedition-foundation.js','utf8')+'\n'+source,context);
 return context.WandererV013EnemyRoster;
}
const original=rosterFor(E.BEFORE_SOURCE),updated=rosterFor(E.LIVE_SOURCE);
const familyByRealm={temple:'decay',void:'decay',forge:'blood',bloodscar:'blood',
 grove:'radiance',shrine:'radiance',ward:'aegis',drowned:'aegis',
 crypt:'fury',bastion:'fury',ash:'arcane',storm:'arcane'};
function catalog(realm){
 const table=updated.CATALOG[realm];
 return updated.ROLES.map(role=>({role,name:table[role][0],image:'dummy.png'}));
}
function generate(api,realm,size,seed){
 return api.plan({realm,family:familyByRealm[realm],count:size,seed,node:1,catalog:catalog(realm)});
}
test('Stage 6.17 native baseline is frozen and distinct from Stage 6.18 live roster',()=>{
 assert.equal(E.BEFORE_SOURCE,B.NATIVE_SOURCE);
 assert.notEqual(E.SOURCE_SHA.before,E.SOURCE_SHA.after);
 assert.match(E.LIVE_SOURCE,/Stage 6\.18: keep principal roles/);
 assert.match(E.LIVE_SOURCE,/Stage 6\.18: explicit principal-role scales/);
 assert.doesNotMatch(E.BEFORE_SOURCE,/Stage 6\.18:/);
});
test('Stage 6.18 retains solo/dual/triple/four pre-existing native roles and stats',()=>{
 for(const realm of Object.keys(familyByRealm))for(const size of [1,2,3,4])for(const seed of [6180,6181,6182,6183]){
  assert.deepEqual(JSON.parse(JSON.stringify(generate(updated,realm,size,seed))),
   JSON.parse(JSON.stringify(generate(original,realm,size,seed))));
 }
 for(const count of [1,2,3,4]){
  for(const role of updated.ROLES){
   const enemy={role},scale={hp:.5,atk:.4};
   assert.equal(JSON.stringify(updated.scaleFor(enemy,count,scale)),JSON.stringify(original.scaleFor(enemy,count,scale)));
  }
 }
});
test('Stage 6.18 improves 6/8/12/20 group composition but preserves minion identity',()=>{
 for(const realm of Object.keys(familyByRealm))for(const size of [6,8,12,20])for(let seed=6100;seed<6120;seed++){
  const group=generate(updated,realm,size,seed),leaders=group.filter(x=>x.role!=='minion');
  assert.equal(group.length,size);
  assert(leaders.length>=2&&leaders.length<=4);
  assert(group.slice(4).every(x=>x.role==='minion'));
  assert(group.every(x=>updated.ROLES.includes(x.role)&&x.name));
  assert(size!==6||[2,3].includes(leaders.length));
  assert(size!==8||leaders.length===3);
  assert(size!==12||[3,4].includes(leaders.length));
  assert(size!==20||[3,4].includes(leaders.length));
 }
});
test('Stage 6.18 uses smooth principal stats only for six-plus mobs',()=>{
 const p={role:'tank'},m={role:'minion'},scale={hp:.2,atk:.16};
 const old6=original.scaleFor(p,6,scale),new6=updated.scaleFor(p,6,scale);
 assert(new6.hp>old6.hp&&new6.atk>old6.atk);
 assert.equal(JSON.stringify(updated.scaleFor(m,6,scale)),JSON.stringify(original.scaleFor(m,6,scale)));
 for(const count of [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]){
  const x=updated.scaleFor(p,count,scale);
  assert(x.hp>.0&&x.atk>.0&&x.def>.0);
  if(count>6){
   const prev=updated.scaleFor(p,count-1,scale);
   assert(x.hp<=prev.hp&&x.atk<=prev.atk,'smooth taper expected');
   assert(prev.hp-x.hp<.03&&prev.atk-x.atk<.02,'no abrupt scale threshold');
  }
 }
});
test('Stage 6.18 one native fully matched 10-way combat fixture resolves without drift',()=>{
 const settings={...E.DEFAULTS,seedsPerCell:1};
 const row=E.plan(settings).rows[0],trial=E.matched(row,settings);
 assert.equal(Object.keys(trial.arms).length,10);
 assert(Object.values(trial.checks).every(Boolean));
 for(const size of E.SIZES)for(const version of ['before','after']){
  const x=trial.arms[size+'_'+version];
  assert.equal(x.roster.length,size);
  assert(x.won||x.died);
  assert(Number.isFinite(x.damageTaken)&&Number.isFinite(x.rosterHp));
 }
 const before=trial.arms['4_before'],after=trial.arms['4_after'];
 assert.deepEqual(before.roster,after.roster);
});
test('Native E1 starts with one regular mob and existing Boss/Elite archetypes remain isolated',()=>{
 const a=create(618051),c=a.controller();a.start(1,true);
 const first=c.state.dungeon.cards[0];c.chooseRealm(first.id);
 c.offerContracts();c.chooseContract(null);assert(c.visitRoom(1));assert(a.enter());
 assert(['tank','caster','skirmisher'].includes(a.state().run.enemy.role));
 assert.equal(a.state().run.enemy.miniboss,false);
});
test('Pre-registered pilot/full count and parameters cannot silently change',()=>{
 const pilot=E.plan(E.DEFAULTS),full=E.plan({...E.DEFAULTS,seedsPerCell:2});
 assert.equal(pilot.sets,48);assert.equal(pilot.fights,480);
 assert.equal(full.sets,96);assert.equal(full.fights,960);
 assert.equal(new Set(full.rows.map(r=>r.seed)).size,96);
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,risk:2}),/Invalid/);
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,rarity:'Epic'}),/Invalid/);
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,seedsPerCell:5}),/Invalid/);
});
