'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const A=require('../online/v013-elite-abilities.js');
const Infra=require('../online/v013-boss-infrastructure.js');
const names=['Wailing Soul','Hollow Soul','Fractured Soul','Wailing Soul'];
test('Gravecaller has exact four-spawn cycle with no RNG or extra combat roll',()=>{
 assert.deepEqual(Array.from({length:4},(_,i)=>A.boundSoulVariant(i).name),names);
 assert.equal(A.boundSoulVariant(4).name,'Hollow Soul');
 for(const bad of [-1,.5,NaN])assert.throws(()=>A.boundSoulVariant(bad));
 const runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(runtime.includes('boundSoulVariant(ledger.summoned)'));
 assert(runtime.includes('const summoned=ports.enemyFor('));
 assert(runtime.includes('summoned.name=soul.name;summoned.image=soul.image;return summoned;'));
});
test('All three local png assets exist, are mirrored into docs and have correct PNG signatures',()=>{
 for(let i=0;i<3;i++){
  const image=A.boundSoulVariant(i).image,src=fs.readFileSync(image),pub=fs.readFileSync('docs/'+image);
  assert(src.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),image+' signature');
  assert.equal(crypto.createHash('sha256').update(src).digest('hex'),crypto.createHash('sha256').update(pub).digest('hex'));
 }
});
test('The original Realm minion is still used and changing identity does not change combat values',()=>{
 const make=()=>({name:'Realm Minion',image:'realm-minion.png',role:'minion',hp:100,maxhp:100,atk:20,def:4,baseDef:4,attackEvery:2,effect:'decay'});
 const leader=()=>({name:'Gravecaller',miniboss:true,eliteType:'gravecaller',hp:100,maxhp:100});
 const run=()=>{const e=leader();return {status:'fight',enemy:e,encounterLeader:e,enemies:[e],groupReserve:[],totalMobCount:1,combatSeconds:0,stage83EliteSummons:{summoned:0,maxSummons:4,maxLivingMinions:2}};};
 const base=run(),variant=run(),history=[];
 for(let wave=0;wave<2;wave++){
  const original=Infra.summon(base,base.enemy,2,make,{family:'decay',hpFactor:.5,atkFactor:.35,defFactor:.35,intervalFactor:1.2});
  const renamed=Infra.summon(variant,variant.enemy,2,()=>{
   const mob=make(),soul=A.boundSoulVariant(variant.stage83EliteSummons.summoned);
   mob.name=soul.name;mob.image=soul.image;return mob;
  },{family:'decay',hpFactor:.5,atkFactor:.35,defFactor:.35,intervalFactor:1.2});
  assert.deepEqual({spawned:renamed.spawned,field:renamed.field,reserve:renamed.reserve},{spawned:original.spawned,field:original.field,reserve:original.reserve});
  const a=base.enemies.filter(m=>m.stage83Summoned&&m.hp>0),b=variant.enemies.filter(m=>m.stage83Summoned&&m.hp>0);
  assert.equal(a.length,b.length);
  for(let i=0;i<a.length;i++){
   const strip=v=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='name'&&k!=='image'));
   assert.deepEqual(strip(a[i]),strip(b[i]),'only the cosmetic identity may differ');
  }
  history.push(...b.map(m=>m.name));
  for(const r of [base,variant])for(const mob of r.enemies.filter(m=>m.stage83Summoned)){mob.hp=0;mob.groupDefeated=true;}
 }
 assert.equal(base.stage83EliteSummons.summoned,4);
 assert.equal(variant.stage83EliteSummons.summoned,4);
 assert.deepEqual(history,names);
});
test('All source/docs code paths and UI tooltips agree about bound souls',()=>{
 for(const path of ['combat/v012-combat-runtime.js','online/v013-elite-abilities.js']){
  assert.equal(fs.readFileSync(path,'utf8'),fs.readFileSync('docs/'+path,'utf8'),path);
 }
 for(const path of ['index.html','docs/index.html'])assert(fs.readFileSync(path,'utf8').includes('kill the bound souls to remove Decay'));
 const abi=A.DEFINITIONS.gravecaller;
 assert.match(abi.description,/bound souls/);
 assert(!/undead Minions/i.test(abi.description));
});
