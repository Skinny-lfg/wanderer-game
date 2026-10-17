const assert=require('node:assert/strict');
const {harness}=require('../scripts/simulate-v091.cjs');
const c=harness(),a=c.inspect;
// Existing saved gear is read without rerolling or mutation. Both fast and slow weapons.
for(const kind of ['Sword','Mace','Daggers','Bow','Staff','Wand','Two-Handed']){
 let previous=0;
 for(const agi of [5,20,50,100,200,1000]){
  const gear={...a.makeSlots(),weapon:{id:'legacy',slot:'weapon',subtype:kind,rarity:'Legendary',tier:200,agi,atk:123,spell:234}};
  const before=JSON.stringify(gear),s=a.totalStats(gear,[],[]);
  assert.equal(JSON.stringify(gear),before);assert(s.attacksPerSec>previous);previous=s.attacksPerSec;
  const base=Math.max(.25,(.78+s.agi*.032+s.spdFlat*.046)*({Sword:1,Mace:.66,Daggers:1.48,Bow:1.15,Staff:.69,Wand:1.2,'Two-Handed':.5}[kind]));
  const catchUp=kind==='Staff'?Math.max(0,.56-.25*base):kind==='Two-Handed'?Math.max(0,.43-.25*base):0;
  const raw=base+catchUp,expected=raw<=2.5?raw:2.5+(raw-2.5)/(1+.2*(raw-2.5));
  assert(Math.abs(s.rawAttackSpeed-raw)<1e-8,'raw speed must use targeted slow-weapon catch-up');
  assert(Math.abs(s.attacksPerSec-expected)<1e-8,'attack speed must respect soft cap');
  if(catchUp>0)assert(raw>base,'low-speed catch-up is positive');
  if((base>=2.24&&kind==='Staff')||(base>=1.72&&kind==='Two-Handed'))assert.equal(catchUp,0,'late-game bonus must vanish');
  assert(s.attacksPerSec<7.5,'bounded speed with continued investment benefit');
  const crit=Math.min(65,Math.round((4+s.cha*.95)/Math.sqrt(Math.max(1,raw/1.3))));
  assert.equal(s.crit,crit,'speed soft cap must not grant compensating critical chance');
 }
}
// Check actual damage, not source text; disable random crit and affinity procs.
for(const [kind,factor]of [['Two-Handed',1.70],['Staff',1.32]]){
 const weapon={id:'old',slot:'weapon',subtype:kind,rarity:'Rare',tier:20,atk:100,spell:100};
 const s=a.totalStats({...a.makeSlots(),weapon},[],[]);s.crit=0;
 const r={stats:s,enemy:{hp:10000,maxhp:10000,def:10,baseDef:10,barrier:0},hp:s.maxhp,maxhp:s.maxhp,mp:100,maxmp:100,barrier:0,enc:1,combatSeconds:0,setCooldowns:{}};
 a.getState().run=r;
 const hit=a.weaponAttack(r);
 assert.equal(hit,kind==='Staff'?Math.round(s.spellPower*factor):Math.round(s.attack*factor)-10);
 assert.equal(r.mp,kind==='Staff'?87:100);
}
for(const level of [1,10,50,100,200])for(const weapon of ['Daggers','Mace','Staff','Two-Handed']){
 const opts={level,weapon,affinity:'shield',rarity:'Epic',seed:77,elite:'berserker'};
 const one=c.trial(opts),four=c.trial({...opts,speed:4});
 assert.equal(JSON.stringify(one),JSON.stringify(four),'simulation-time mechanics identical at 1x and 4x');
 assert(!one.timeout);
 for(const [key,value] of Object.entries(one)){
  // No death means that deathWave is intentionally null.
  if(key==='deathWave'&&value===null)continue;
  assert(typeof value==='boolean'||Number.isFinite(value),'Invalid '+key+' at D'+level+' with '+weapon);
 }
}
console.log('PASS v0.9.1 speed limits, critical preservation, legacy items, weapon damage, mana, deterministic 1x/4x');
