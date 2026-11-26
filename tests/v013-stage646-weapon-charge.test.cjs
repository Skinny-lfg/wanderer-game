'use strict';
// Native committed mechanics tests; no source patching.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const runtime=fs.readFileSync(path.join(root,'combat/v012-combat-runtime.js'),'utf8');
const buildcraft=fs.readFileSync(path.join(root,'combat/v012-buildcraft.js'),'utf8');
function extract(s,name){
 const i=s.indexOf('function '+name+'(');assert(i>=0,'Missing function '+name);
 const j=s.indexOf('{',i);let depth=0;
 for(let k=j;k<s.length;k++){if(s[k]==='{')depth++;else if(s[k]==='}'&&--depth===0)return s.slice(i,k+1);}
 throw Error('Unclosed function '+name);
}
function harness(talents=[],random=()=>0){
 const global={};vm.createContext(global);vm.runInContext(buildcraft,global);
 const B=global.WandererV012Buildcraft,b=B.create();
 b.runtime.permanentTalents=talents;b.runtime.specializations=['affinity_fury'];
 const enemies=Array.from({length:4},(_,i)=>({id:i,hp:2000,maxhp:2000,barrier:0,baseDef:20,def:20,dots:{bleed:[],burn:[]},v012Rot:[],bleedStacks:0}));
 const reserve={hp:2000,maxhp:2000,dots:{bleed:[]},v012Rot:[]};
 const r={phase1:true,enemy:enemies[0],enemies,groupReserve:[reserve],combatSeconds:1,
  mp:20,stats:{attack:100,spellPower:40,main:{subtype:'Bow'}}};
 const metrics={},metric=(k,n)=>metrics[k]=(metrics[k]||0)+n;
 const sync=e=>{e.bleedStacks=e.dots.bleed.length;};
 function context(e){
  return {enemy:e,player:r,now:r.combatSeconds,power:r.stats.spellPower,base:100,random,metric,
   dot(kind,potency){const values=e.dots[kind];if(values.length>=12)values.shift();values.push({damage:Math.max(1,Math.round(kind==='bleed'?B.bleedDamage(b,potency):potency)),remaining:3});sync(e);},
   spendMana(n){if(r.mp<n)return false;r.mp-=n;return true;},log(){}};
 }
 const ports={phase1Build:b,isPhase1Run:()=>true,setNow:x=>x.combatSeconds,
  phase6Metric:(r,k,v)=>metric(k,v),synchronizeDots:sync,floatText(){},addLog(){},
  combatLinkEffect(){},state:{automaticTalents:{nodes:['bow_pierce']}},
  setDirectEnemyDamage(r,a){const real=Math.min(r.enemy.hp,Math.round(a));r.enemy.hp-=real;return real;}};
 ports.affinityProcChance=()=>.5;ports.isMagicOffhand=()=>false;ports.applyAffinity=()=>{};ports.gameRandom=random;ports.phase6Proc=()=>{};
 const ctx={ports,root:{},WandererV012Buildcraft:B,phase2Context:r=>context(r.enemy)};
 vm.createContext(ctx);
 vm.runInContext(['v013SecondaryHit','v013CarrionDetonation','v013SecondaryWeaponStatus','groupSecondaryDamage'].map(n=>extract(runtime,n)).join('\n'),ctx);
 return {B,b,r,enemies,reserve,metrics,ctx,context,sync,ports};
}
function mark(h,e){e.dots.bleed.push({damage:12,remaining:3});e.v012Rot.push({damage:10,remaining:4,ticks:0});h.sync(e);}
test('Native talent ranks gate secondary Bleed/Rot; missing talent grants no status',()=>{
 const h=harness([]);h.B.onSecondaryWeaponStatus(h.b,h.context(h.enemies[1]));
 assert.equal(h.enemies[1].bleedStacks,0);assert.equal(h.enemies[1].v012Rot.length,0);
 assert.equal(h.r.mp,20);
});
test('Native rank-one 42% chance is halved; real cooldowns and Rot mana cost apply',()=>{
 const a=harness(['bleeding_edge','corrupting_touch'],()=>.22);
 a.B.onSecondaryWeaponStatus(a.b,a.context(a.enemies[1]));
 assert.equal(a.enemies[1].bleedStacks,0);assert.equal(a.enemies[1].v012Rot.length,0);
 const b=harness(['bleeding_edge','corrupting_touch'],()=>.20),e=b.enemies[1];
 b.B.onSecondaryWeaponStatus(b.b,b.context(e));
 assert.equal(e.bleedStacks,1);assert.equal(e.v012Rot.length,1);
 assert.equal(e.dots.bleed[0].damage,8);assert.equal(e.v012Rot[0].damage,4);
 assert.equal(b.r.mp,19);
 b.B.onSecondaryWeaponStatus(b.b,b.context(e));assert.equal(e.bleedStacks,1);assert.equal(e.v012Rot.length,1);
 b.r.combatSeconds=2;b.r.mp=0;b.B.onSecondaryWeaponStatus(b.b,b.context(e));
 assert.equal(e.bleedStacks,2);assert.equal(e.v012Rot.length,1);assert.equal(b.r.mp,0);
 b.r.combatSeconds=3;b.B.onSecondaryWeaponStatus(b.b,b.context(e));assert.equal(e.v012Rot.length,1);
});
test('Carrion uses actual HP damage, ignores unmarked targets and bursts only after reaching 150',()=>{
 const h=harness(['carrion_detonation']),e=h.enemies[0];
 h.ctx.v013CarrionDetonation(h.r,e,150);assert.equal(h.metrics.carrionBursts||0,0);
 mark(h,e);h.ctx.v013CarrionDetonation(h.r,e,74);h.ctx.v013CarrionDetonation(h.r,e,75);
 assert.equal(h.metrics.carrionBursts||0,0);assert.equal(e.carrionCharge,149);
 h.ctx.v013CarrionDetonation(h.r,e,1);assert.equal(h.metrics.carrionBursts,1);
 assert.equal(e.carrionCharge,0);assert(h.enemies.slice(1).every(x=>x.hp<2000));
 assert.equal(h.reserve.hp,2000);assert.equal(h.reserve.dots.bleed.length,0);
 assert(h.enemies.slice(1).every(x=>x.dots.bleed[0].spread&&x.v012Rot[0].spread));
 h.ctx.v013CarrionDetonation(h.r,e,1000);assert.equal(h.metrics.carrionBursts,1);
});
test('Weapon extras feed their own mark with actual hit damage and preserve selected target',()=>{
 const h=harness(['carrion_detonation','bleeding_edge','corrupting_touch']),e=h.enemies[1];
 mark(h,e);const main=h.r.enemy;
 h.ctx.v013SecondaryWeaponStatus(h.r,e,500,75);
 assert.equal(e.carrionCharge,75);assert.equal(h.r.enemy,main);
 assert.equal(h.metrics.carrionBursts||0,0);
 h.ctx.v013SecondaryWeaponStatus(h.r,e,500,75);assert.equal(h.metrics.carrionBursts,1);
 assert.equal(h.r.enemy,main);assert.equal(h.reserve.hp,2000);
});
test('Piercing has a single additional target and the reserve stays untouched',()=>{
 const h=harness([]);assert(runtime.includes("includes('bow_pierce')?[1]:[.66]"));
 const n=h.ctx.groupSecondaryDamage(h.r,100,[1],'Piercing Arrow',true);
 assert.equal(n,1);assert(h.enemies[1].hp<2000);assert.equal(h.enemies[2].hp,2000);assert.equal(h.enemies[3].hp,2000);assert.equal(h.reserve.hp,2000);
});

test('Eligible weapon affixes propagate at half chance and potency; no self effects',()=>{
 const h=harness([],()=>.2),calls=[];h.ports.applyAffinity=(...args)=>calls.push(args);
 h.r.stats.main.effect='burn';h.ctx.v013SecondaryWeaponStatus(h.r,h.enemies[1],100,80);
 assert.equal(calls.length,1);assert.equal(calls[0][0],'burn');assert.equal(calls[0][1],h.enemies[1]);assert.equal(calls[0][5],.5);
 h.r.stats.main.effect='shield';h.ctx.v013SecondaryWeaponStatus(h.r,h.enemies[1],100,80);assert.equal(calls.length,1);
});
