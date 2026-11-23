'use strict';
// Stage 6.37 — normal room pressure depends on actual Minion roster, never
// blanket group size; Elite bases are fixed once at E1 across all Expeditions.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
const C=globalThis.WandererV012CombatCore;
const P=globalThis.WandererExpeditionProgression;
const S=require('../scripts/simulate-progression.cjs');
const originals={
 tank:{hp:1.52,atk:.65,def:1.19},
 berserker:{hp:.89,atk:1.37,def:.90},
 vampire:{hp:1.19,atk:1.16,def:1.04},
 caster:{hp:1.02,atk:1.03,def:.92},
 gravecaller:{hp:1.04,atk:.76,def:.86},
 oathbound_exarch:{hp:1.50,atk:.87,def:1.18},
 briarspine_horror:{hp:1.39,atk:1.01,def:1.04},
 ashen_executioner:{hp:1.16,atk:1.20,def:.93}
};
const mob=(role='tank')=>({role,name:role,atk:40,def:20,baseDef:20,hp:200,maxhp:200,attackEvery:1.72});
const group=(principal,minions)=>[
 ...Array.from({length:principal},()=>mob('tank')),
 ...Array.from({length:minions},()=>mob('minion'))];
test('Stage 6.37: no penalty to small rooms, 0-minion rooms or Elite/Boss, even when large',()=>{
 for(const n of [1,2,3,4]){
  const g=group(1,n-1),before=JSON.stringify(g),d=C.applyMinionEscortRelief(g);
  assert.equal(d.affected,0);assert.equal(JSON.stringify(g),before);
 }
 const allPrincipal=group(8,0),before=JSON.stringify(allPrincipal);
 assert.equal(C.applyMinionEscortRelief(allPrincipal).affected,0);
 assert.equal(JSON.stringify(allPrincipal),before);
 for(const type of ['boss','miniboss']){
  const g=group(2,8);g[0][type]=true;const b=JSON.stringify(g);
  assert.equal(C.applyMinionEscortRelief(g).affected,0);
  assert.equal(JSON.stringify(g),b);
 }
});
test('Stage 6.37: all reserve Minions count, remain untouched, and only principals weaken',()=>{
 const cfg=C.MINION_ESCORT_RELIEF;
 assert.equal(cfg.minimumGroupSize,5);
 const records=[];
 for(const n of [2,3,6,10,18]){
  const g=group(4,n),before=g.map(e=>({...e})),out=C.applyMinionEscortRelief(g);
  assert.equal(out.minions,n);assert.equal(out.affected,4);
  const hp=Math.max(cfg.minHpFactor,1-n*cfg.hpLossPerMinion),
   atk=Math.max(cfg.minAtkFactor,1-n*cfg.atkLossPerMinion),
   def=Math.max(cfg.minDefFactor,1-n*cfg.defLossPerMinion);
  assert(Math.abs(out.factors.hp-hp)<1e-10);
  for(let i=0;i<g.length;i++){
   const x=g[i],b=before[i];
   if(i>=4){assert.deepEqual(x,b,'Minion must retain full HP/ATK/DEF');continue;}
   assert.equal(x.maxhp,Math.round(200*hp));
   assert.equal(x.hp,x.maxhp);
   assert.equal(x.atk,Math.round(40*atk));
   assert.equal(x.def,Math.round(20*def));
   assert.equal(x.baseDef,x.def);
   assert.equal(x.minionEscortReliefApplied,true);
  }
  assert.throws(()=>C.applyMinionEscortRelief(g),/twice/);
  records.push(out.factors);
 }
 for(let i=1;i<records.length;i++){
  for(const stat of ['hp','atk','def'])
   assert(records[i][stat]<=records[i-1][stat],'Monotonic Minion-dependent '+stat);
 }
 assert(records.at(-1).hp>=.38&&records.at(-1).atk>=.50&&records.at(-1).def>=.65);
});
function firstRing(E,seed,count,{eliteId=null,boss=false}={}){
 const opts={...S.DEFAULTS,points:0,gear:'current',runes:false};
 const {a,c,card}=S.prepare(E,S.BUILDS[1],seed,opts,0);
 const room=card.edges.filter(([from])=>from===0).map(([,to])=>to)
  .find(node=>card.nodes[node]?.kind==='combat');
 assert.notEqual(room,undefined);
 assert(c.visitRoom(room));assert(a.enter());
 if(eliteId)a.state().run.eliteType=eliteId;
 const run=a.encounter({count,boss,elite:!!eliteId});
 const actors=[...(run.enemies?.length?run.enemies:[run.enemy]),...(run.groupReserve||[])];
 return actors;
}
test('Stage 6.37: native 5/12/22 normal actors get conditional relief (never Minions), across E',()=>{
 for(const E of [1,5,70,200]){
  for(const count of [1,3,5,12,22]){
   const actors=firstRing(E,637120+E*39+count*71,count);
   assert.equal(actors.length,count);
   const minions=actors.filter(e=>e.role==='minion').length;
   for(const e of actors){
    if(e.role==='minion')assert.notEqual(e.minionEscortReliefApplied,true);
    else assert.equal(!!e.minionEscortReliefApplied,count>=5&&minions>0);
   }
  }
 }
});
test('Stage 6.37: eight Elite identity E1 coefficients apply to all E through shared reference',()=>{
 const index=fs.readFileSync('index.html','utf8');
 const part=index.slice(index.indexOf('const ELITE_ARCHETYPES={'),index.indexOf('\n};',index.indexOf('const ELITE_ARCHETYPES={')));
 assert.equal(Object.keys(originals).length,8);
 assert.deepEqual([...P.ELITE_IDENTITIES].sort(),Object.keys(originals).sort());
 for(const [id,base] of Object.entries(originals)){
  const re=new RegExp('\\b'+id+':\\{[^\\n]*?hp:([\\d.]+),atk:([\\d.]+),def:([\\d.]+),interval:');
  const m=part.match(re);assert(m,'Elite missing E1 base '+id);
  assert.equal(Number(m[1]),base.hp);assert.equal(Number(m[2]),base.atk);
  assert.equal(Number(m[3]),base.def);
  for(const E of [1,5,70,200])assert.deepEqual(P.enemyScaling(E,'elite',id),{hp:1,atk:1,def:1});
  for(const E of [1,20]){
   const actors=firstRing(E,637311+E*17+Object.keys(originals).indexOf(id)*19,1,{eliteId:id});
   assert.equal(actors.length,1);
   assert.equal(actors[0].eliteType,id);
   assert.equal(actors[0].minionEscortReliefApplied,undefined);
  }
 }
});
