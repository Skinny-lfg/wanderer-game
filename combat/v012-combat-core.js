// Wanderer v0.12 — one authoritative implementation of combat calculations.
// Keep deterministic and side-effect-free: state, timers and logging are managed by the caller.
(function(root){'use strict';
function evasionChance(rating,tier,EVASION_SCALE,EVASION_CAP){
 if(!Number.isFinite(rating)||rating<=0)return 0;
 const scale=EVASION_SCALE*(2+Math.max(1,Number(tier)||1)*.91);
 return Math.min(EVASION_CAP,1/(1+scale/rating));
}

function enemyAttackType(enemy){
 if(enemy.attackType)return enemy.attackType;
 return enemy.eliteType==='caster'||enemy.bossStyle==='leech'?'spell':'physical';
}

function estimateEnemy(level,n=1){
 const boss=n===5&&level%10===0;
 const base={hp:27+level*14,atk:4+level*3,def:1+level*.62};
 if(boss)return {hp:Math.round(base.hp*1.38),atk:Math.round(base.atk*1.28),def:Math.round(base.def)};
 const stage=Math.max(1,Math.min(4,n));
 const hpFactor=[1,1.12,1.24,1.48][stage-1],atkFactor=[1,1.08,1.16,1.25][stage-1],defFactor=[1,1.06,1.12,1.22][stage-1];
 return {hp:Math.round(Math.round(base.hp*1.4)*1.4*hpFactor),atk:Math.round(Math.round(base.atk*1.25)*1.4*atkFactor),def:Math.round(Math.round(base.def*1.2)*1.4*defFactor)};
}

function affinityProcChance(kind,cast=false){return cast?.9:kind==='Daggers'?.52:kind==='Two-Handed'?.26:.32}

function applyExpeditionModifiers(stats,e){
 const s={...stats};
 for(const [key,field]of [['might','attack'],['arcane','spellPower'],['ironhide','defense'],['haste','attacksPerSec']])if(e[key]?.remaining>0)s[field]*=1+e[key].power;
 if(e.attack)s.attack*=1+e.attack;if(e.defense)s.defense*=1+e.defense;
 return s;
}
root.WandererV012CombatCore=Object.freeze({evasionChance,enemyAttackType,estimateEnemy,affinityProcChance,applyExpeditionModifiers});
})(globalThis);
