'use strict';
// Deterministic, matched native combat fixtures. Only the earned-rune slot is varied.
// No combat formula is reimplemented. Enemy radiance and clock are controlled to isolate effects.
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
require('../combat/v012-runes.js');
const R=globalThis.WandererV012Runes;
const {buy}=require('./v013-current-talent-helper.cjs'),B=globalThis.WandererV012Buildcraft;
function encounter(family,weapon='Sword',shield=false,armored=false){
 const a=create(9181,undefined,{}, {skipPersistence:true}),s=a.state();
 a.setup(1,weapon,'Common');
 for(const key of Object.keys(s.equip))if(key!=='weapon'&&!(shield&&key==='offhand'))s.equip[key]=null;
 // Controlled defense budget, identical in both arms: the percent rune must
 // exceed the integer damage rounding threshold without altering gameplay.
 if(armored){const item=a.makeItem(1,'armor',null,'loot','Plate','Common');item.def=50;s.equip.armor=item;}
 if(shield&&s.equip.offhand?.subtype!=='Shield')s.equip.offhand=a.makeItem(1,'offhand',null,'loot','Shield','Common');
 if(family){const rune=a.makeRune(family,1,'Legendary');s.runes.push(rune);assert(a.runes.equip(rune.id,0));}
 a.start(1,true);const c=a.controller();c.chooseRealm(c.state.dungeon.cards[0].id);assert(c.visitRoom(1));assert(a.enter());
 const r=s.run,e=r.enemy;assert(r&&e);e.hp=e.maxhp=1000000;e.def=e.baseDef=0;e.barrier=0;e.atk=100;e.attackEvery=1000;e.groupClock=0;e.effect=null;
 r.tPlayer=0;r.tEnemy=0;r.tDot=0;r.playerAttackPeriod=undefined;
 a.rng(.999999);return {a,r,e};
}
function pair(family,weapon='Sword',shield=false){return [encounter(null,weapon,shield,family==='bulwark'),encounter(family,weapon,shield,family==='bulwark')];}
function hit(x,roll=.999999){x.a.rng(roll);const hp=x.e.hp;x.a.gear.weaponAttack(x.r);return hp-x.e.hp;}
function incoming(x,roll=.999999){x.a.rng(roll);x.e.attackEvery=1;x.e.groupClock=1;x.r.tEnemy=1;const hp=x.r.hp;x.a.tick();return hp-x.r.hp;}
function period(x){x.a.tick();return x.r.playerAttackPeriod;}
function manaRegen(x){x.r.mp=0;x.a.tick();return x.r.mp;}
const covered=new Set();
function audit(family,fn){covered.add(family);test('Anchor Rune combat: '+family,fn);}
for(const family of ['might','fury','assault'])audit(family,()=>{const [base,boost]=pair(family);assert(hit(boost)>hit(base));});
for(const family of ['swiftness','haste'])audit(family,()=>{const [base,boost]=pair(family);assert(period(boost)<period(base),'native auto-attack period');});
audit('wisdom',()=>{const [base,boost]=pair('wisdom','Wand');assert(boost.r.maxmp>base.r.maxmp);assert(hit(boost)>hit(base));});
for(const family of ['fortitude','radiance','heart'])audit(family,()=>{const [base,boost]=pair(family);assert(boost.r.maxhp>base.r.maxhp);assert.equal(boost.r.hp,boost.r.maxhp);});
for(const family of ['warding','bulwark'])audit(family,()=>{const [base,boost]=pair(family);assert(boost.r.stats.defense>base.r.stats.defense);const before=incoming(base),after=incoming(boost);assert(after<before,'damage actually received: '+before+' -> '+after);});
for(const family of ['fortune','execution'])audit(family,()=>{const [base,boost]=pair(family);assert(boost.r.stats.crit>base.r.stats.crit);const roll=(base.r.stats.crit+boost.r.stats.crit)/200;assert(hit(boost,roll)>hit(base,roll));});
audit('devastation',()=>{const [base,boost]=pair('devastation');assert(hit(boost,0)>hit(base,0));const [caster,amplified]=pair('devastation','Wand');caster.a.rng(0);amplified.a.rng(0);assert(amplified.a.combatContext(amplified.r).magicCriticalDamage(100)>caster.a.combatContext(caster.r).magicCriticalDamage(100));});
audit('archmage',()=>{const [base,boost]=pair('archmage','Wand');assert(hit(boost)>hit(base));});
audit('abyss',()=>{const [base,boost]=pair('abyss','Wand');assert(boost.r.maxmp>base.r.maxmp);assert.equal(boost.r.mp,boost.r.maxmp);});
audit('clarity',()=>{const [base,boost]=pair('clarity','Wand');assert(manaRegen(boost)>manaRegen(base));});
audit('efficiency',()=>{const [base,boost]=pair('efficiency','Wand');const paid=x=>{const mp=x.r.mp;hit(x);return mp-x.r.mp;};assert(paid(boost)<paid(base));for(const x of [base,boost]){x.r.mp=100;assert(x.a.combatContext(x.r).spendMana(10));}assert(boost.r.mp>base.r.mp);});
audit('corruption',()=>{
 for(const kind of ['bleed','burn']){const [base,boost]=pair('corruption');const damage=x=>{x.a.combatContext(x.r).dot(kind,100);const potency=x.e.dots[kind].at(-1).damage;x.r.tDot=1;const hp=x.e.hp;x.a.tick();return {potency,damage:hp-x.e.hp};};const b=damage(base),v=damage(boost),factor=1+boost.r.stats.dotPower;assert(Math.abs(v.potency-b.potency*factor)<1e-8,kind+' snapshot');assert.equal(v.damage,Math.round(b.damage*factor),kind+' once');}
 const [base,boost]=pair('corruption');const rot=x=>{const b=B.create(),ctx=x.a.combatContext(x.r);B.applyRot(b,ctx,100,'paid_primary_corrupting_touch');const potency=x.e.v012Rot[0].damage,hp=x.e.hp;B.tickRot(b,ctx);return {potency,damage:hp-x.e.hp};};const b=rot(base),v=rot(boost),factor=1+boost.r.stats.dotPower;assert(Math.abs(v.potency-b.potency*factor)<1e-8);assert.equal(v.damage,Math.round(b.damage*factor),'native Rot tick scales once');
});
audit('bastion',()=>{const [base,boost]=pair('bastion');assert(boost.a.grantBarrier(100,boost.r)>base.a.grantBarrier(100,base.r));});
audit('renewal',()=>{const [base,boost]=pair('renewal');const heal=x=>{x.r.hp=1;return x.a.heal(x.r,20);};assert(heal(boost)>heal(base));});
audit('phantom',()=>{const [base,boost]=pair('phantom');const roll=(base.a.gear.evasionChance(base.r.stats.evasionRating,1)+boost.a.gear.evasionChance(boost.r.stats.evasionRating,1))/2;base.a.rng(roll);boost.a.rng(roll);assert.equal(base.a.gear.tryDodge(base.r,'physical'),false);assert.equal(boost.a.gear.tryDodge(boost.r,'physical'),true);assert.equal(boost.a.gear.tryDodge(boost.r,'magical'),false);});
audit('guard',()=>{const [base,boost]=pair('guard','Sword',true);const roll=(base.r.stats.blockChance+boost.r.stats.blockChance)/200;assert(boost.r.stats.blockChance>base.r.stats.blockChance);assert(incoming(boost,roll)<incoming(base,roll));});
test('Every current Anchor Rune family has a native combat audit case',()=>{assert.deepEqual([...covered].sort(),R.FAMILIES.map(x=>x.id).sort());});

test('Corruption Rune powers Cycle stack component once, not direct AP/SP',()=>{
 const result=power=>{const b=B.create();B.syncPermanent(b,buy(['corrupting_touch','corruption_cycle']));const e={hp:100000,maxhp:100000,v012Rot:[],dots:{bleed:[],burn:[]}},r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:[e],stats:{attack:100,spellPower:50,attacksPerSec:1,dotPower:power}},metrics={};
 const c={player:r,enemy:e,now:1,base:100,power:50,random:()=>.9999,waveKey:'dot',log(){},dot(){},damage(n){e.hp-=n;},dotDamage(n){e.hp-=n;},metric(k,n){metrics[k]=(metrics[k]||0)+n;},heal(){return 0;},barrier(){},mana(n){r.mp+=n;}};
 for(let i=0;i<3;i++)B.applyRot(b,c,10,'paid_primary_cycle_extra');
 const stored=e.v012Rot.reduce((n,d)=>n+d.damage,0);B.onAttack(b,c);
 assert.equal(metrics.corruptionCycleStacksConsumed,3);assert.equal(e.v012Rot.length,2);assert(Math.abs(metrics.corruptionCycleRawBurst-(stored*6+30))<1e-8);
 return {stored,burst:metrics.corruptionCycleRawBurst};};
 const a=result(0),b=result(.24);assert(Math.abs(b.stored-a.stored*1.24)<1e-8);assert(Math.abs(b.burst-(a.burst-30)*1.24-30)<1e-8);
});
test('Corruption Rune does not rescale copied stacks or already snapshotted periodic damage',()=>{
 const x=encounter('corruption'),ctx=x.a.combatContext(x.r);ctx.dot('burn',100,{controlledBurn:true});const burn=x.e.dots.burn[0],factor=1+x.r.stats.dotPower;
 assert.equal(burn.controlledBase,100*factor);assert.equal(burn.damage,125*factor);
 const before=x.e.hp;ctx.dotDamage(100,'already stored Rot');assert.equal(before-x.e.hp,100);
 const b=B.create();B.syncPermanent(b,buy(['contagious_touch']));const target={hp:10000,maxhp:10000,v012Rot:[]};x.r.enemies=[x.e,target];
 B.applyRot(b,ctx,100,'paid_primary_corrupting_touch');B.applyRot(b,ctx,100,'paid_primary_corrupting_touch');
 assert.equal(target.v012Rot.length,1);assert(Math.abs(target.v012Rot[0].damage-x.e.v012Rot[0].damage)<1e-8);
});
