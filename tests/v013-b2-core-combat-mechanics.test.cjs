'use strict';
// Exact native code, deterministic fixtures. No production overrides or balance adjustments.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs'),{T,buy}=require('./v013-current-talent-helper.cjs');
require('../combat/v012-combat-core.js');require('../combat/v012-gear-stats.js');require('../combat/v012-combat-runtime.js');
const G=globalThis.WandererV012GearStats,C=globalThis.WandererV012CombatCore,B=globalThis.WandererV012Buildcraft,R=globalThis.WandererV012CombatRuntime;
const near=(x,y,label='')=>assert(Math.abs(x-y)<1e-8,label+' expected '+y+', actual '+x);
const item=(slot,subtype,stats={})=>({id:slot,slot,subtype,tier:1,rarity:'Common',...stats});
const slots=['helm','armor','gloves','boots','belt'];
const cloth=Object.fromEntries(slots.map(slot=>[slot,item(slot,'Cloth',{armorType:'Cloth'})]));
test('B2.1: base AP, DEF, HP and physical resource gating; independent numeric expectations',()=>{
 const a=create(28001),s=a.baseStats({weapon:item('weapon','Sword')});
 assert.equal(s.attack,15);assert.equal(s.defense,5);assert.equal(s.maxhp,115);assert.equal(s.spellPower,0);assert.equal(s.mana,0);assert.equal(s.manaRegen,0);
 const t=a.baseStats({weapon:item('weapon','Sword',{atk:10,str:5,agi:5,def:3,end:5,hp:20})});
 assert.equal(t.attack,36);assert.equal(t.defense,12);assert.equal(t.maxhp,195);
});
test('B2.2: caster baseline, full Cloth resource multiplier, Orb/Aegis SP without Mana',()=>{
 const a=create(28002),wand=item('weapon','Wand'),sword=item('weapon','Sword'),orb=item('offhand','Orb',{spell:10});
 const w=a.baseStats({weapon:wand}),c=a.baseStats({weapon:wand,...cloth});
 assert.equal(w.spellPower,13);assert.equal(w.mana,55);near(w.manaRegen,1.8);
 assert.equal(c.spellPower,18);assert.equal(c.mana,77);
 const o=a.baseStats({weapon:sword,offhand:orb});assert.equal(o.spellPower,23);assert.equal(o.mana,0);
 a.state().automaticTalents=buy(['affinity_aegis']);
 const ae=a.baseStats({weapon:sword});assert(ae.spellPower>0);assert.equal(ae.mana,0);
 a.state().automaticTalents=buy(['affinity_decay']);const d=a.baseStats({weapon:sword});assert(d.spellPower>0&&d.mana>0&&d.manaRegen>0);
});
test('B2.3: two-handed suppresses offhand projection; dagger offensive stats halved, defense and HP retained',()=>{
 const a=create(28003),sword=item('weapon','Sword'),off=item('offhand','Off-Hand Dagger',{atk:20,def:10,hp:20});
 const base=a.baseStats({weapon:sword}),d=a.baseStats({weapon:sword,offhand:off});
 assert.equal(d.attack-base.attack,10);assert.equal(d.defense-base.defense,10);assert.equal(d.maxhp-base.maxhp,20);
 for(const kind of ['Two-Handed','Bow','Staff']){
  const weapon=item('weapon',kind),before=a.baseStats({weapon}),after=a.baseStats({weapon,offhand:off});
  for(const k of ['attack','defense','maxhp','spellPower','mana','attacksPerSec','blockChance'])assert.equal(after[k],before[k],kind+'/'+k);
  assert.equal(after.off,null);
 }
});
test('B2.4: attack intervals for all seven weapons, rating monotonicity and 4.2 hits/s cap',()=>{
 for(const [w,interval] of Object.entries({Sword:1.6,Mace:2.2,Bow:2,Daggers:1.15,'Two-Handed':2.8,Staff:2.3,Wand:1.65})){
  near(G.attackSpeed(w),1/interval,w);
  assert(G.attackSpeed(w,25,2,5)>G.attackSpeed(w,5,0,5));
  assert.equal(G.attackSpeed(w,1e6,1e6,1e6),4.2);
 }
 near(G.attackSpeed('Sword',5,0,155),G.attackSpeed('Sword'));
 assert(G.attackSpeed('Wand',5,0,155)>G.attackSpeed('Wand'));
});
test('B2.5: gear-only crit/ward/regen limits and shield reduction',()=>{
 const a=create(28005),sword=item('weapon','Sword',{critBonus:100,wardBonus:1,manaRegenBonus:100,blockBonus:100});
 const shield=item('offhand','Shield'),plain=a.baseStats({weapon:sword}),guard=a.baseStats({weapon:sword,offhand:shield});
 assert.equal(plain.crit,17);near(plain.wardBonus,.3);assert.equal(plain.blockChance,0);assert.equal(plain.manaRegen,0);
 assert.equal(guard.blockChance,23);near(guard.blockReduction,.62);
 const mace=a.baseStats({weapon:item('weapon','Mace'),offhand:shield});near(mace.blockReduction,.67);
 const w=a.baseStats({weapon:item('weapon','Wand',{manaRegenBonus:100})});near(w.manaRegen,7.8);
});
function fixture(){
 const run={hp:50,maxhp:100,mp:20,maxmp:50,barrier:0,combatSeconds:0,phase1:true,stats:{healingPower:.25,wardBonus:.1,barrierPower:.2,bonus:{},manaCostReduction:.5,crit:0},enemy:{name:'Fixture',hp:1000,maxhp:1000,dots:{bleed:[],burn:[]}}};
 const build=B.create(),ports={state:{run,equip:{},automaticTalents:{nodes:[]}},phase1Build:build,phase1Clock:0,isPhase1Run:()=>false,gameRandom:()=>.99,addLog(){},floatText(){},legendaryReady:()=>false,evasionChance:()=>.2,phase6Proc(){},phase6Metric(r,k,n){r.metrics??={};r.metrics[k]=(r.metrics[k]||0)+n;}};
 const rt=R.create(ports);Object.assign(ports,{setNow:rt.setNow,setReady:rt.setReady,setRuntime:rt.setRuntime,setBarrier:rt.setBarrier,synchronizeDots:rt.synchronizeDots});
 return {run,build,ports,rt};
}
test('B2.6: attack clock preserves fractional progress when speed changes and respects cap',()=>{
 const {rt}=fixture(),r={tPlayer:.5,playerAttackPeriod:1};
 assert.equal(rt.advancePlayerAttackClock(r,.1,2),false);near(r.tPlayer,.35);
 assert.equal(rt.advancePlayerAttackClock(r,.15,2),true);near(r.tPlayer,0);
 const capped={tPlayer:0};assert.equal(rt.advancePlayerAttackClock(capped,.2,100),false);near(capped.playerAttackPeriod,1/4.2);
});
test('B2.7: critical multiplier and boundary rolls, physical-only evasion',()=>{
 const {rt,run,ports}=fixture();run.stats.crit=100;run.stats.critDamage=.25;assert.equal(rt.spellCriticalDamage(run,100),175);
 run.stats.crit=0;assert.equal(rt.spellCriticalDamage(run,100),100);
 run.stats.crit=20;ports.gameRandom=()=>.199;assert.equal(rt.spellCriticalDamage(run,100),175);ports.gameRandom=()=>.2;assert.equal(rt.spellCriticalDamage(run,100),100);
 ports.gameRandom=()=>0;assert.equal(rt.tryDodge(run,'physical'),true);assert.equal(rt.tryDodge(run,'spell'),false);
 assert.equal(C.potionEvasion(.4,.2),.45);assert.equal(C.evasionChance(0,10,1,.45),0);assert.equal(C.evasionChance(1e9,10,1,.45),.45);
});
test('B2.8: Barrier HP/SP scaling, additive ward multipliers, bounded shared pool',()=>{
 const {rt,run}=fixture();near(B.barrierAmount(100,50,.02,.05),4.5);
 near(rt.setBarrier(run,20,'aegis'),26);near(run.barrier,26);near(rt.setBarrier(run,20,'aegis'),0);near(rt.setBarrier(run,100),13);near(run.barrier,39);
 assert.equal(rt.setBarrier(run,-10),0);near(run.barrier,39);
});
test('B2.9: healing multiplier, missing HP cap, 40% healing wound; Barrier unaffected',()=>{
 const {rt,run}=fixture();near(rt.setHeal(run,20),25);near(run.hp,75);
 run.playerHealingDebuffUntil=10;near(rt.setHeal(run,20),15);near(run.hp,90);
 near(rt.setHeal(run,100),10);near(run.hp,100);
 near(rt.setBarrier(run,10),13);
});
test('B2.10: Mana cost cap, insufficient funds no mutation, Mana restore capped',()=>{
 const {rt,run}=fixture(),ctx=rt.phase2Context(run);
 assert.equal(ctx.spendMana(10),true);near(run.mp,12.5);near(run.metrics.manaSpent,7.5);
 assert.equal(ctx.spendMana(20),false);near(run.mp,12.5);near(run.metrics.manaSpent,7.5);
 ctx.mana(1000);assert.equal(run.mp,50);
});
test('B2.11: native cooldown eligibility exact boundary and per-key independence',()=>{
 const {rt,run}=fixture();
 assert.equal(rt.setReady(run,'a',6),true);assert.equal(rt.setReady(run,'a',6),false);assert.equal(rt.setReady(run,'b',8),true);
 run.combatSeconds=5.999;assert.equal(rt.setReady(run,'a',6),false);
 run.combatSeconds=6;assert.equal(rt.setReady(run,'a',6),true);assert.equal(rt.setReady(run,'b',8),false);
});
test('B2.12: Bleed snapshots DoT Power, retains ticks when stats change, expires after four seconds',()=>{
 const {rt,run}=fixture();run.stats.dotPower=.5;rt.phase2Context(run).dot('bleed',10);near(run.enemy.dots.bleed[0].damage,15);
 run.stats.dotPower=3;
 for(let i=1;i<=4;i++){run.combatSeconds=i;rt.advanceBleed(run);assert.equal(run.enemy.hp,1000-15*i);}
 assert.equal(run.enemy.dots.bleed.length,0);run.combatSeconds=5;rt.advanceBleed(run);assert.equal(run.enemy.hp,940);
});
test('B2.13: paid Rot linear stack potency, cap six, persistent ticks, DoT Power snapshot',()=>{
 const b=B.create(),e={hp:1000,maxhp:1000,v012Rot:[],dots:{bleed:[],burn:[]}},player={hp:100,maxhp:100,mp:100,maxmp:100,stats:{dotPower:.5},enemies:[e]};
 const ctx={enemy:e,player,now:0,random:()=>.99,log(){},dotDamage(n){e.hp-=n;}};
 for(let i=0;i<7;i++)B.applyRot(b,ctx,10,'ability_fixture');
 assert.equal(e.v012Rot.length,6);assert(e.v012Rot.every(x=>x.damage===15));
 player.stats.dotPower=3;for(let i=1;i<=5;i++){ctx.now=i;B.tickRot(b,ctx);assert.equal(e.hp,1000-90*i);assert.equal(e.v012Rot.length,6);}
 B.resetWave(b,e);assert.equal(e.v012Rot.length,0);
});
function fight(kind,seed=64020+kind.length){
 const a=create(seed,undefined,{}, {skipPersistence:true});a.setup(5,kind,'Common');a.setUnlocked(5);a.start(5,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;assert.equal(r.stats.main?.subtype,kind);
 r.stats.attack=100;r.stats.spellPower=100;r.stats.crit=0;r.stats.critDamage=0;r.stats.bonus={};r.stats.off=null;
 r.enemy.hp=r.enemy.maxhp=1e7;r.enemy.def=r.enemy.baseDef=10;r.enemy.barrier=0;r.wisdomUsed=true;a.rng(.999);
 return {a,r};
}
for(const [kind,expected] of Object.entries({Sword:102,Mace:130,Bow:130,Daggers:70,'Two-Handed':200})){
 test('B2.14 native '+kind+' physical AP factor and Defense subtraction',()=>{
  const {a,r}=fight(kind);assert.equal(a.gear.weaponAttack(r),expected);assert.equal(r.enemy.hp,1e7-expected);
 });
}
for(const [kind,expected] of [['Wand',105],['Staff',160]]){
 test('B2.15 native '+kind+' funded SP hit and zero-Mana fallback',()=>{
  const {a,r}=fight(kind);r.mp=0;assert.equal(a.gear.weaponAttack(r),45);assert.equal(r.metrics.unfundedCasterAttacks,1);
  r.mp=100;assert.equal(a.gear.weaponAttack(r),expected);assert.equal(r.metrics.fundedCasts,1);assert.equal(r.mp,kind==='Wand'?91:87);
 });
}
test('B2.16 native physical critical uses base 1.5 plus Crit Damage',()=>{
 const {a,r}=fight('Sword');r.stats.crit=100;r.stats.critDamage=.25;assert.equal(a.gear.weaponAttack(r),179);
});
test('B2.17 main attacks do not recursively invoke offhand; direct offhand damage preserved',()=>{
 for(const kind of ['Sword','Daggers']){
  const {a,r}=fight(kind);r.stats.off=item('offhand','Off-Hand Dagger');
  const hp=r.enemy.hp,first=a.gear.weaponAttack(r);assert.equal(r.offhandStrikes||0,0);
  const second=a.gear.weaponAttack(r);assert.equal(r.offhandStrikes||0,0);
  const off=a.gear.weaponAttack(r,true);assert.equal(off,35);
  assert.equal(hp-r.enemy.hp,first+second+off);
 }
});
test('B2.18: root and Pages native formula modules byte-identical',()=>{
 for(const f of ['combat/v012-combat-core.js','combat/v012-gear-stats.js','combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/talent-graph-runtime.js','combat/talent-graph-next.js','combat/expedition-progression.js']){
  assert.equal(fs.readFileSync(f,'utf8'),fs.readFileSync('docs/'+f,'utf8'),f);
 }
});
