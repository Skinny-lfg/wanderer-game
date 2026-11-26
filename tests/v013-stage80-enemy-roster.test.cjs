'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-enemy-roster.js');
require('../combat/v012-combat-core.js');
const R=globalThis.WandererV013EnemyRoster,Core=globalThis.WandererV012CombatCore;
const source=fs.readFileSync('index.html','utf8');
function previousMobs(){
 const a=source.indexOf('const MOB_POOLS='),b=source.indexOf('THEMES.forEach(t=>t.mobs=',a);
 assert(a>=0&&b>a,'legacy animated mob catalog remains present');
 const sandbox={};
 vm.runInNewContext(source.slice(a,b)+'\nthis.pools=MOB_POOLS;',sandbox);
 return sandbox.pools;
}
const old=previousMobs(),families={
 temple:'decay',void:'decay',forge:'blood',bloodscar:'blood',grove:'vitality',shrine:'vitality',
 ward:'aegis',drowned:'aegis',crypt:'fury',bastion:'fury',ash:'magic',storm:'magic'
};
function catalog(realm){
 return R.catalogFor(realm,old[realm].map(([name,image,role])=>({name,image,role})));
}
function plan(realm,count,seed=8010,node=2){
 return R.plan({seed,realm,family:families[realm],node,count,catalog:catalog(realm)});
}
test('Stage 8.0 preserves all 24 animated original creatures and adds unique four-class names per Realm',()=>{
 assert.equal(Object.keys(R.CATALOG).length,12);
 const unique=new Set();
 for(const realm of Object.keys(families)){
  const c=catalog(realm),names=new Set(c.map(m=>m.name));
  assert.equal(c.filter(m=>R.ROLES.includes(m.role)).length,c.length);
  assert.equal(names.size,c.length,realm+' must not duplicate names');
  for(const role of R.ROLES)assert(c.some(m=>m.role===role),realm+' has no '+role);
  for(const [name,image] of old[realm])assert(c.some(m=>m.name===name&&m.image===image),'old art/name removed: '+name);
  for(const record of c)assert(!unique.has(record.name),'name reused across realms: '+record.name),unique.add(record.name);
  assert(c.every(m=>m.image.startsWith('assets/mobs/animated/')),'must reuse an existing animated sprite');
 }
});
test('Stage 8.0 small rooms contain one or two Minions, remaining normal classes',()=>{
 for(const realm of Object.keys(families))for(const count of [2,3,4])for(let seed=8100;seed<8130;seed++){
  const group=plan(realm,count,seed),minions=group.filter(x=>x.role==='minion').length;
  assert(group.length===count);
  assert.equal(minions,count===4?2:1,realm+'/'+count+': invalid Minion count');
  assert(group.every(x=>x.name&&x.image));
 }
 for(const realm of Object.keys(families))for(let seed=0;seed<12;seed++)
  assert.notEqual(plan(realm,1,seed)[0].role,'minion','solo opponent stays a real normal creature');
});
test('Stage 6.48B.2 principal counts remain within the agreed composition bands',()=>{
 for(const realm of Object.keys(families))for(const count of [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22])for(let seed=8200;seed<8240;seed++){
  const group=plan(realm,count,seed),normal=group.map((x,i)=>({role:x.role,index:i})).filter(x=>x.role!=='minion');
  const min=group.filter(x=>x.role==='minion').length;
  assert.equal(group.length,count);
  assert(count<=12||count>=16?normal.length===2:normal.length>=2&&normal.length<=3,
   realm+'/'+count+'/'+seed+' principal-role count drift');
  assert.equal(min,count-normal.length);
  assert(count<=6||min>=count-4,'large swarms remain mostly Minions');
 }
});
test('Stage 8.0 seeded enemy selection is stable across reloads, order and independent RNG calls',()=>{
 for(const realm of Object.keys(families)){
  const first=plan(realm,12,90310,7);
  Math.random();Math.random();
  assert.deepEqual(plan(realm,12,90310,7),first);
  plan(realm,4,90310,8);assert.deepEqual(plan(realm,12,90310,7),first);
 }
});
test('Stage 8.0 affinity weighting makes Aegis tank-heavy and Fury skirmisher-heavy',()=>{
 let aegisTank=0,furyTank=0,furySkirmish=0,aegisSkirmish=0;
 for(let seed=0;seed<120;seed++){
  const a=plan('ward',12,seed),f=plan('crypt',12,seed);
  aegisTank+=a.filter(x=>x.role==='tank').length;furyTank+=f.filter(x=>x.role==='tank').length;
  furySkirmish+=f.filter(x=>x.role==='skirmisher').length;aegisSkirmish+=a.filter(x=>x.role==='skirmisher').length;
 }
 assert(aegisTank>furyTank*2);
 assert(furySkirmish>aegisSkirmish*1.5);
});
test('Stage 6.33 role compositions remain deterministic but group size cannot mutate stats',()=>{
 const mobs=plan('ward',12,8350);
 const spawned=Core.createEnemyGroup(i=>({
  ...mobs[i],hp:100,maxhp:100,atk:40,def:30,baseDef:30,attackEvery:2,
  boss:false,miniboss:false
 }),12,{activeSlots:4});
 assert(spawned.some(m=>m.role==='minion'));
 assert(spawned.some(m=>m.role!=='minion'));
 assert(spawned.every(m=>m.maxhp===100&&m.atk===40&&m.def===30));
 assert.deepEqual(spawned.slice(0,4).map(m=>m.groupSlot),[0,1,2,3]);
 const solo=Core.createEnemyGroup(()=>({hp:100,maxhp:100,atk:40,def:30,baseDef:30,attackEvery:2}),1);
 assert.deepEqual(solo[0].maxhp,spawned[0].maxhp);
 assert.equal(R.scaleFor,undefined,'obsolete role scaling must be deleted');
});
test('Stage 6.33 normal roster composition still contains principal roles and Minions',()=>{
 for(const count of [1,3,6,8,12,20,22]){
  const p=plan('ward',count,8350);
  assert.equal(p.length,count);
  assert(p.every(x=>R.ROLES.includes(x.role)));
  if(count>4)assert(p.filter(x=>x.role==='minion').length>=count-4);
 }
});

test('Stage 8.0 base UI uses visible class icons beside both group and solo health bars',()=>{
 assert(source.includes('enemyRoleBadge(enemy)'));
 assert(source.includes('enemyRoleBadge(e)'));
 assert(source.includes('arenaEnemyVitals'));
 assert(source.includes('online/v013-enemy-roster.js'));
 assert(!source.includes('THEMES.forEach(t=>t.mobs=(MOB_POOLS'));
});
test('Stage 8.0 native Expedition first combat spawns a named regular role, not a swarm Minion',()=>{
 const create=require('./v012-economy-harness.cjs'),a=create(8055),c=a.controller();
 a.start(1,true);
 const first=c.state.dungeon.cards[0];c.chooseRealm(first.id);
 c.offerContracts();c.chooseContract(null);
 assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;assert(r&&r.enemy,'native enemy spawned');
 assert(['tank','skirmisher','caster'].includes(r.enemy.role));
 assert(catalog(first.id).some(m=>m.name===r.enemy.name&&m.role===r.enemy.role));
});

test('paired Affinity Realms share artwork without changing the encounter roster or RNG',()=>{
 const peers={temple:'void',void:'temple',forge:'bloodscar',bloodscar:'forge',grove:'shrine',shrine:'grove',ward:'drowned',drowned:'ward',crypt:'bastion',bastion:'crypt',ash:'storm',storm:'ash'};
 for(const [realm,peer] of Object.entries(peers)){
  const partner=catalog(peer),images=new Set(),other=new Set(partner.map(m=>m.image));let shared=0;
  for(let seed=0;seed<20;seed++){
   const input=plan(realm,12,seed,5),before=JSON.stringify(input),mixed=R.shareAffinityArt(input,partner,{seed,realm,node:5});
   assert.equal(JSON.stringify(input),before,'does not mutate deterministic roster');
   assert.deepEqual(mixed.map(m=>[m.name,m.role]),input.map(m=>[m.name,m.role]),'no gameplay role or name changes');
   assert.deepEqual(R.shareAffinityArt(input,partner,{seed,realm,node:5}),mixed,'art selection is deterministic');
   for(let i=0;i<mixed.length;i++){images.add(mixed[i].image);if(mixed[i].image!==input[i].image){shared++;assert(partner.some(p=>p.image===mixed[i].image&&p.role===mixed[i].role),'paired art shares role');assert(other.has(mixed[i].image));}}
   assert.deepEqual(plan(realm,12,seed,5),input,'separate art selection does not change roster RNG');
  }
  assert(shared>0,realm+' must use artwork from its affinity partner');assert(images.size>=3,realm+' should offer more than two distinct appearances');
 }
});

test('Stage 6.48B.2 distributes existing actors across field and reserve without stat mutation',()=>{
 let reservePrincipals=0,firstPrincipals=0;
 for(const realm of Object.keys(families))for(const count of [1,2,3,4,5,8,12,17,22])for(let seed=0;seed<40;seed++){
  const group=plan(realm,count,seed).map((e,i)=>({...e,id:i,maxhp:100+i,atk:10+i,def:i}));
  const args={seed,realm,node:2},before=JSON.stringify(group),out=R.orderForArena(group,args);
  assert.equal(JSON.stringify(group),before);
  assert.deepEqual(out.slice().sort((a,b)=>a.id-b.id),group);
  assert.deepEqual(R.orderForArena(group,args),out);
  assert.equal(new Set(out).size,count);
  if(count<=4)assert.deepEqual(out,group);
  if(count>=6)assert(out.slice(0,4).some(e=>e.role!=='minion'));
  if(count>4){
   if(out.slice(4).some(e=>e.role!=='minion'))reservePrincipals++;
   if(out.slice(0,4).some(e=>e.role!=='minion'))firstPrincipals++;
   assert.equal(R.orderForArena(group,{...args,keepFirst:true})[0],group[0]);
  }
 }
 assert(reservePrincipals>0&&firstPrincipals>0);
});
