'use strict';
// Deterministic, matched native combat fixtures. Only the earned-rune slot is varied.
// No combat formula is reimplemented. Enemy vitality and clock are controlled to isolate effects.
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
require('../combat/v012-runes.js');
const R=globalThis.WandererV012Runes;
function encounter(family,weapon='Sword',shield=false){
 const a=create(9181,undefined,{}, {skipPersistence:true}),s=a.state();
 a.setup(1,weapon,'Common');
 for(const key of Object.keys(s.equip))if(key!=='weapon'&&!(shield&&key==='offhand'))s.equip[key]=null;
 if(shield&&s.equip.offhand?.subtype!=='Shield')s.equip.offhand=a.makeItem(1,'offhand',null,'loot','Shield','Common');
 if(family){const rune=a.makeRune(family,1,'Legendary');s.runes.push(rune);assert(a.runes.equip(rune.id,0));}
 a.start(1,true);const c=a.controller();c.chooseRealm(c.state.dungeon.cards[0].id);assert(c.visitRoom(1));assert(a.enter());
 const r=s.run,e=r.enemy;assert(r&&e);e.hp=e.maxhp=1000000;e.def=e.baseDef=0;e.barrier=0;e.atk=100;e.attackEvery=1000;e.groupClock=0;e.effect=null;
 r.tPlayer=0;r.tEnemy=0;r.tDot=0;r.playerAttackPeriod=undefined;
 a.rng(.999999);return {a,r,e};
}
function pair(family,weapon='Sword',shield=false){return [encounter(null,weapon,shield),encounter(family,weapon,shield)];}
function hit(x,roll=.999999){x.a.rng(roll);const hp=x.e.hp;x.a.gear.weaponAttack(x.r);return hp-x.e.hp;}
function incoming(x,roll=.999999){x.a.rng(roll);x.e.attackEvery=1;x.e.groupClock=1;x.r.tEnemy=1;const hp=x.r.hp;x.a.tick();return hp-x.r.hp;}
function period(x){x.a.tick();return x.r.playerAttackPeriod;}
function manaRegen(x){x.r.mp=0;x.a.tick();return x.r.mp;}
const covered=new Set();
function audit(family,fn){covered.add(family);test('Anchor Rune combat: '+family,fn);}
for(const family of ['might','fury','assault'])audit(family,()=>{const [base,boost]=pair(family);assert(hit(boost)>hit(base));});
for(const family of ['swiftness','haste'])audit(family,()=>{const [base,boost]=pair(family);assert(period(boost)<period(base),'native auto-attack period');});
audit('wisdom',()=>{const [base,boost]=pair('wisdom','Wand');assert(boost.r.maxmp>base.r.maxmp);assert(hit(boost)>hit(base));});
for(const family of ['fortitude','vitality','heart'])audit(family,()=>{const [base,boost]=pair(family);assert(boost.r.maxhp>base.r.maxhp);assert.equal(boost.r.hp,boost.r.maxhp);});
for(const family of ['warding','bulwark'])audit(family,()=>{const [base,boost]=pair(family);assert(incoming(boost)<incoming(base),'damage actually received');});
for(const family of ['fortune','execution'])audit(family,()=>{const [base,boost]=pair(family);assert(boost.r.stats.crit>base.r.stats.crit);const roll=(base.r.stats.crit+boost.r.stats.crit)/200;assert(hit(boost,roll)>hit(base,roll));});
audit('devastation',()=>{const [base,boost]=pair('devastation');assert(hit(boost,0)>hit(base,0));const [caster,amplified]=pair('devastation','Wand');caster.a.rng(0);amplified.a.rng(0);assert(amplified.a.combatContext(amplified.r).magicCriticalDamage(100)>caster.a.combatContext(caster.r).magicCriticalDamage(100));});
audit('archmage',()=>{const [base,boost]=pair('archmage','Wand');assert(hit(boost)>hit(base));});
audit('abyss',()=>{const [base,boost]=pair('abyss','Wand');assert(boost.r.maxmp>base.r.maxmp);assert.equal(boost.r.mp,boost.r.maxmp);});
audit('clarity',()=>{const [base,boost]=pair('clarity','Wand');assert(manaRegen(boost)>manaRegen(base));});
audit('efficiency',()=>{const [base,boost]=pair('efficiency','Wand');const paid=x=>{const mp=x.r.mp;hit(x);return mp-x.r.mp;};assert(paid(boost)<paid(base));for(const x of [base,boost]){x.r.mp=100;assert(x.a.combatContext(x.r).spendMana(10));}assert(boost.r.mp>base.r.mp);});
audit('corruption',()=>{
 for(const kind of ['bleed','burn']){const [base,boost]=pair('corruption');const damage=x=>{x.a.combatContext(x.r).dot(kind,100);x.r.tDot=1;const hp=x.e.hp;x.a.tick();return hp-x.e.hp;};assert(damage(boost)>damage(base),kind);}
 const [base,boost]=pair('corruption');const rot=x=>{const hp=x.e.hp;x.a.combatContext(x.r).dotDamage(100,'Rot');return hp-x.e.hp;};assert(rot(boost)>rot(base),'native Rot damage callback');
});
audit('bastion',()=>{const [base,boost]=pair('bastion');assert(boost.a.grantBarrier(100,boost.r)>base.a.grantBarrier(100,base.r));});
audit('renewal',()=>{const [base,boost]=pair('renewal');const heal=x=>{x.r.hp=1;return x.a.heal(x.r,20);};assert(heal(boost)>heal(base));});
audit('phantom',()=>{const [base,boost]=pair('phantom');const roll=(base.a.gear.evasionChance(base.r.stats.evasionRating,1)+boost.a.gear.evasionChance(boost.r.stats.evasionRating,1))/2;base.a.rng(roll);boost.a.rng(roll);assert.equal(base.a.gear.tryDodge(base.r,'physical'),false);assert.equal(boost.a.gear.tryDodge(boost.r,'physical'),true);assert.equal(boost.a.gear.tryDodge(boost.r,'magical'),false);});
audit('guard',()=>{const [base,boost]=pair('guard','Sword',true);const roll=(base.r.stats.blockChance+boost.r.stats.blockChance)/200;assert(boost.r.stats.blockChance>base.r.stats.blockChance);assert(incoming(boost,roll)<incoming(base,roll));});
test('Every current Anchor Rune family has a native combat audit case',()=>{assert.deepEqual([...covered].sort(),R.FAMILIES.map(x=>x.id).sort());});
