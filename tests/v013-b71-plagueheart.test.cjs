'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-b71-plagueheart-candidates.cjs'),G=require('../scripts/v013-b71-plagueheart-plan.cjs'),ROOT=path.resolve(__dirname,'..');
function fixture(arm,{mp=100,rolls=[0],hybrid=false,stacks=1,infectedTarget=true}={}){
 const sources=C.sources(ROOT,arm),g=vm.createContext({});
 for(const f of ['combat/v012-combat-core.js',C.BUILD,C.RUNTIME])vm.runInContext(sources[f]??fs.readFileSync(path.join(ROOT,f),'utf8'),g);
 const B=g.WandererV012Buildcraft,b=B.create();b.families=hybrid?['decay','fury']:['decay'];b.unlockedFamilies=b.families.slice();b.runtime.specializations=['plagueheart'];
 const make=(count,damage)=>({hp:10000,maxhp:10000,barrier:50,v012Rot:Array.from({length:count},()=>({damage,remaining:4,primaryPaid:true})),dots:{bleed:[],burn:[]}});
 const es=[make(infectedTarget?stacks:0,10),make(1,20),make(0,0)],reserve=make(2,30);
 const player={hp:100,maxhp:100,mp,maxmp:100,stats:{attack:100,spellPower:100,main:{subtype:'Sword'},bonus:{}},enemies:es,groupReserve:[reserve],enemy:es[0]},metrics={},hits=[];
 const ports={state:{automaticTalents:{nodes:[]}},phase1Build:b,setNow:()=>1,gameRandom:()=>0,phase6Metric(_r,k,n){metrics[k]=(metrics[k]||0)+n;},addLog(){},floatText(){}};
 const runtime=g.WandererV012CombatRuntime.create(ports);
 let rollIndex=0;
 const c={enemy:es[0],player,now:1,waveKey:'w',random:()=>rolls[Math.min(rollIndex++,rolls.length-1)],base:100,power:100,log(){},metric(k,n){metrics[k]=(metrics[k]||0)+n;},dotDamage(n,label,fraction){hits.push(n);player.enemy=c.enemy;runtime.phase2Context(player).dotDamage(n,label,fraction);}};
 function tick(){for(const e of es){c.enemy=e;player.enemy=e;B.tickRot(b,c);}}
 return {B,b,c,es,reserve,player,metrics,hits,tick,rollsUsed:()=>rollIndex};
}
test('Every profile is legal; armor changes retain the same talent allocation',()=>{for(const id of G.IDS)G.profile(id);for(const [a,b] of G.ARMOR_PAIRS){const x=G.profile(a),y=G.profile(b);assert.deepEqual(x.t,y.t);assert.equal(x.weapon,y.weapon);assert.equal(x.offhandType,y.offhandType);assert.notEqual(x.armorType,y.armorType);}});
test('Current global cap, uncapped and steady have bounded costs and native Rot bypasses Barrier',()=>{
 for(const [arm,mp,hits,procs] of [['current',96,[30,20],1],['uncapped',92,[30,60],2],['steady',98,[18,35],2]]){
  const h=fixture(arm);h.tick();assert.equal(h.player.mp,mp);assert.deepEqual(h.hits,hits);assert.equal(h.metrics.decayPrimaryPaidPlagueheartActivations,procs);assert(h.es.every(e=>e.barrier===50));assert.equal(h.es[0].hp,10000-hits[0]);assert.equal(h.es[1].hp,10000-hits[1]);assert.equal(h.reserve.hp,10000);
 }
});
test('Outbreak pays once, seeds one or two persistent stacks, amplifies all infected active targets, not reserve or clean targets',()=>{
 for(const [roll,n] of [[.1,1],[.9,2]]){
  const h=fixture('outbreak',{rolls:[.1,roll]});assert(h.B.b71Outbreak(h.b,h.c));assert(!h.B.b71Outbreak(h.b,h.c));assert.equal(h.player.mp,84);assert.equal(h.es[0].v012Rot.length,1+n);
  const total=h.es[0].v012Rot.reduce((s,d)=>s+d.damage,0);h.tick();assert.deepEqual(h.hits,[Math.round(total*3),60]);assert.equal(h.metrics.decayPrimaryPaidPlagueheartActivations,1);assert.equal(h.metrics.b71AmplifiedTargets,2);assert.equal(h.metrics.b71ExtraRotSeeds,n);assert(h.es[0].v012Rot.filter(d=>d.abilityOrigin==='ability_plagueheart').every(d=>d.remaining===4));assert(h.es.every(e=>e.barrier===50));assert.equal(h.reserve.hp,10000);assert.equal(h.es[2].hp,10000);
 }
});
test('Outbreak can seed a clean main target from infection elsewhere; caps at six; cannot reroll failed or unfunded tick',()=>{
 const h=fixture('outbreak',{infectedTarget:false});assert(h.B.b71Outbreak(h.b,h.c));assert.equal(h.es[0].v012Rot.length,1);h.tick();assert.equal(h.metrics.b71AmplifiedTargets,2);
 const cap=fixture('outbreak',{stacks:6,rolls:[0,.9]});assert(cap.B.b71Outbreak(cap.b,cap.c));assert.equal(cap.es[0].v012Rot.length,6);
 for(const opts of [{rolls:[.25,0]},{mp:30},{hybrid:true}]){
  const f=fixture('outbreak',opts);assert(!f.B.b71Outbreak(f.b,f.c));assert(!f.B.b71Outbreak(f.b,f.c));f.tick();assert.equal(f.metrics.decayPrimaryPaidPlagueheartActivations||0,0);assert.deepEqual(f.hits,[10,20]);assert.equal(f.player.mp,opts.mp??100);
 }
});
test('All candidate arms preserve 15% reserve and hybrid exclusion; steady does not consume RNG',()=>{
 for(const arm of C.ARMS){for(const opts of [{mp:15},{hybrid:true}]){const h=fixture(arm,opts);if(arm==='outbreak')h.B.b71Outbreak(h.b,h.c);h.tick();assert.equal(h.metrics.decayPrimaryPaidPlagueheartActivations||0,0);assert.equal(h.player.mp,opts.mp??100);}}
 const f=fixture('steady',{rolls:[.99]});f.tick();assert.equal(f.rollsUsed(),0);assert.equal(f.metrics.decayPrimaryPaidPlagueheartActivations,2);
});
