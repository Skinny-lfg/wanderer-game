'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {T,buy}=require('./v013-current-talent-helper.cjs'),B=globalThis.WandererV012Buildcraft;
require('../combat/v012-combat-core.js');require('../combat/v012-combat-runtime.js');
function build(ids,element){const p=buy(ids,{...(element?{element}:{})}),b=B.create();B.syncPermanent(b,p);return {p,b};}
function enemy(){return {hp:1e5,maxhp:1e5,barrier:0,dots:{bleed:[],burn:[]},v012Rot:[]};}
test('Kindling only redistributes Burn potency; all five ranks retain scaling',()=>{
 for(let rank=1;rank<=5;rank++)assert(Math.abs(B.values('kindling',rank).burn-.12*(1+.15*rank))<1e-10);
 const {b}=build(['kindling'],'fire'),e=enemy(),hits=[];
 B.onCast(b,{enemy:e,player:{hp:100,mp:100,maxmp:100,enemies:[e]},now:1,funded:true,power:100,amp:1,log(){},random:()=>.99,dot:(kind,n)=>hits.push([kind,n])});
 assert.equal(hits.length,1);assert.equal(hits[0][0],'burn');assert(Math.abs(hits[0][1]-13.8)<1e-9);
});
test('Plagueheart procs at 40%, not 45%, and preserves the global tick cap, reserve and stack cost',()=>{
 function fixture(random,mp=100,hybrid=false){
  const {b}=build(['plagueheart']);if(hybrid)b.families.push('fury');
  const es=[enemy(),enemy()];for(const e of es)e.v012Rot=[{damage:10,remaining:4,primaryPaid:true}];
  const player={hp:100,maxhp:100,mp,maxmp:100,enemies:es},m={},hits=[];
  const c={enemy:es[0],player,waveKey:'w',now:1,random:()=>random,metric:(k,n)=>m[k]=(m[k]||0)+n,dotDamage:n=>hits.push(n)};
  B.tickRot(b,c);c.enemy=es[1];B.tickRot(b,c);return {m,hits,player};
 }
 const a=fixture(.40);assert.equal(a.player.mp,96);assert.equal(a.m.decayPrimaryPaidPlagueheartActivations,1);assert(a.hits[0]>a.hits[1]);
 for(const x of [fixture(.45),fixture(.40,18),fixture(.40,100,true)])assert.equal(x.m.decayPrimaryPaidPlagueheartActivations||0,0);
});
test('Lightning Infusion has 80% of the original power while Fire, Frost and Arcane remain unchanged',()=>{
 for(const mode of ['arcane','fire','frost','lightning']){
  const {b}=build(['affinity_arcane','element_choice'],mode);
  for(const [weapon,base] of [['Sword',.85],['Wand',.35],['Staff',.95]]){
   const expected=(base+(mode==='arcane'?.10:0))*(mode==='lightning'?.80:1);
   assert(Math.abs(B.infusionConfig(b,weapon).power-expected)<1e-10);
  }
 }
});
test('Forked adds one jump and marks, Overcharge owns the rank scaling of both',()=>{
 function fixture(rank,fork){
  const {p,b}=build([...(rank?['overcharge']:[]),...(fork?['forked_lightning']:[])],'lightning');
  if(rank>1){let t=p;for(let i=1;i<rank;i++){t=T.allocate(t,'overcharge');assert(t);}B.syncPermanent(b,t);p.nodes=t.nodes;}
  const es=Array.from({length:4},enemy),r={enemy:es[0],enemies:es,combatSeconds:0,stats:{bonus:{}}},m={};
  const runtime=WandererV012CombatRuntime.create({state:{automaticTalents:p},phase1Build:b,isPhase1Run:()=>true,floatText(){},phase6Metric(_r,k,n){m[k]=(m[k]||0)+n;},addLog(){}});
  runtime.v013LightningChainDamage(r,100);const first=m.secondaryTargetDamage,jumps=m.lightningChainJumps;
  r.combatSeconds=1;runtime.v013LightningChainDamage(r,100);
  return {first,jumps,marks:m.lightningMarkDamage||0};
 }
 const lone=fixture(0,true),one=fixture(1,true),five=fixture(5,true),plain=fixture(5,false);
 assert.equal(lone.jumps,6);assert.equal(one.jumps,6);assert.equal(five.jumps,6);assert.equal(plain.jumps,5);
 assert(lone.first<one.first&&one.first<five.first);assert(lone.marks<one.marks&&one.marks<five.marks);assert.equal(plain.marks,0);
 assert.equal(five.first-plain.first,15,'Forked only adds the sixth jump, not the first five coefficients');
});
