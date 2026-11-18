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
  assert(minions===1||count===4&&minions===2,realm+'/'+count+': invalid Minion count');
  assert(group.every(x=>x.name&&x.image));
 }
 for(const realm of Object.keys(families))for(let seed=0;seed<12;seed++)
  assert.notEqual(plan(realm,1,seed)[0].role,'minion','solo opponent stays a real normal creature');
});
test('Stage 8.0 12 and 18–22 swarms are mostly Minions with one to three dangerous normal enemies',()=>{
 for(const realm of Object.keys(families))for(const count of [8,12,18,20,22])for(let seed=8200;seed<8240;seed++){
  const group=plan(realm,count,seed),normal=group.map((x,i)=>({role:x.role,index:i})).filter(x=>x.role!=='minion');
  assert(normal.length>0);
  assert(count>=18?normal.length>=2&&normal.length<=3:normal.length>=1&&normal.length<=2);
  assert(normal.every(x=>x.index<4),'strongest regular enemies must be visible in initial four slots');
  assert(group.filter(x=>x.role==='minion').length>=count-3,'swarm must be mostly Minions');
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
test('Stage 8.0 normal mobs retain real health, damage and defense while Minions scale down in hordes',()=>{
 const mobs=plan('ward',12,8350);
 const spawned=Core.createEnemyGroup(i=>({
  ...mobs[i],hp:100,maxhp:100,atk:40,def:30,baseDef:30,attackEvery:2,
  boss:false,miniboss:false
 }),12,{activeSlots:4,scale:{hp:.16,atk:.16},scaleFor:(mob,count,base)=>R.scaleFor(mob,count,base)});
 const normal=spawned.find(m=>m.role!=='minion'),small=spawned.find(m=>m.role==='minion');
 assert(normal&&small);
 assert(normal.maxhp>=small.maxhp*1.8,'normal mob must withstand appreciably more punishment');
 assert(normal.atk>=small.atk*1.6,'normal mob must be higher pressure than a Minion');
 assert(normal.def>=small.def*2,'Tanks/casters/skirmishers keep defense scale');
 assert.equal(spawned.length,12);
 assert.deepEqual(spawned.slice(0,4).map(m=>m.groupSlot),[0,1,2,3]);
 const legacy=Core.createEnemyGroup(()=>({hp:100,maxhp:100,atk:40,def:30,baseDef:30,attackEvery:2}),3);
 assert.equal(legacy[0].maxhp,50,'legacy unspecified role groups retain old scaling');
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
