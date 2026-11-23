// Wanderer v0.13 — single authoritative Expedition progression/balance policy.
// Gear tiers, native enemy reference and individual enemy class coefficients.
// Stat roll, encounter count/risk, abilities and acquired player Talents remain
// owned by their native modules and must NOT be applied again here.
(function(root){'use strict';
const tiers=Object.freeze([
 Object.freeze({id:'adventurer',name:'Adventurer',minimum:1,multiplier:1}),
 Object.freeze({id:'veteran',name:'Veteran',minimum:5,multiplier:1.15}),
 Object.freeze({id:'ascendant',name:'Ascendant',minimum:15,multiplier:1.30}),
 Object.freeze({id:'ancient',name:'Ancient',minimum:35,multiplier:1.45}),
 Object.freeze({id:'exalted',name:'Exalted',minimum:70,multiplier:1.60})
]);
function checked(level){if(!Number.isSafeInteger(level)||level<1)throw Error('Invalid Expedition Level');return level;}
function gearTier(level){checked(level);for(let i=tiers.length-1;i>=0;i--)if(level>=tiers[i].minimum)return tiers[i];}
// Stage 6.38 — a SINGLE C-infinity shared enemy growth function with two
// smooth transitions: rapid early growth, a medium gear-acquisition phase,
// then one steady exponential tail. These are calibration CANDIDATE rates.
// The centers E4/E9 are not abrupt gear-tier triggers; the soft transition
// width makes every real-valued Expedition derivative continuous.
// Stage 6.35's 500 real accounts show fast gear growth through E7/E8,
// settling around E9–E12. Do not equate UI Power with actual combat DPS.
// No E-by-E buffs, nerfs, identity-specific curves, hard caps or gear edits.
const ENEMY_EXPONENTIAL_GROWTH=Object.freeze({
 initialReference:.775,
 earlyLogGrowth:.34,      // log slope when a fresh character lacks gear
 middleLogGrowth:.09,     // continuing acquisition of the first gear set
 lateLogGrowth:.0125,     // steady E10+ log slope; still provisional
 earlyTransitionExpedition:4,
 lateTransitionExpedition:9,
 earlyTransitionWidth:1.0,
 lateTransitionWidth:1.4
});
function stableSoftplus(value){
 return value>30?value:value < -30?Math.exp(value):Math.log1p(Math.exp(value));
}
// Integral from 0 to x of 1/(1+exp((t-center)/width)) dt.
// Positive, smooth, naturally saturates; no special E4/E9 branches.
function softElapsed(x,center,width){
 return width*(stableSoftplus(center/width)-stableSoftplus((center-x)/width));
}
function enemyReference(level){
 checked(level);
 const c=ENEMY_EXPONENTIAL_GROWTH,x=level-1;
 const logGrowth=c.lateLogGrowth*x+
  (c.middleLogGrowth-c.lateLogGrowth)*softElapsed(x,c.lateTransitionExpedition-1,c.lateTransitionWidth)+
  (c.earlyLogGrowth-c.middleLogGrowth)*softElapsed(x,c.earlyTransitionExpedition-1,c.earlyTransitionWidth);
 const reference=c.initialReference*Math.exp(logGrowth);
 if(!Number.isFinite(reference))throw Error('Expedition enemy reference exceeds finite range at E'+level);
 return reference;
}
// Stage 6.33 — identity budgets are FIXED for every Expedition.
// No independent Elite/Boss HP, ATK or DEF progression, no early Boss relief.
// The only level-dependent enemy attribute reference is enemyReference(E).
const UNITY=Object.freeze({hp:1,atk:1,def:1});
const NORMAL_BASE=Object.freeze({
 minion:Object.freeze({hp:.68,atk:.70,def:.55,interval:1.90}),
 tank:Object.freeze({hp:1.32,atk:.90,def:1.35,interval:1.72}),
 skirmisher:Object.freeze({hp:.96,atk:1.10,def:1,interval:1.42}),
 caster:Object.freeze({hp:.90,atk:1.08,def:1,interval:1.72})
});
// The eight Elite identity bases remain in index.html's ELITE_ARCHETYPES.
// Six Boss identity bases replace the former E1 protection + 2x generic
// boss multiplier. Their raw coefficients no longer depend on Expedition E.
const BOSS_BASE=Object.freeze({
 leech:Object.freeze({hp:1.31,atk:1.62,def:2,interval:1.62}),
 matriarch:Object.freeze({hp:1.22,atk:1.54,def:2,interval:1.62}),
 guardian:Object.freeze({hp:1.58,atk:1.75,def:2,interval:1.62}),
 conductor:Object.freeze({hp:1.38,atk:1.59,def:2,interval:1.62}),
 berserker:Object.freeze({hp:1.43,atk:1.58,def:2,interval:1.62}),
 devourer:Object.freeze({hp:1.85,atk:1.91,def:2,interval:1.62})
});
// Sparse opening-Expedition adjustments retain each leader's native abilities.
// Stage 6.40 candidate: E1 Elite budgets remain individual and explicit.
// Normal progression uses index.html's bases; the opening budgets are NOT
// blanket multipliers. See the Stage 6.40 candidate diagnostics for rates.
const FIRST_EXPEDITION_ELITES=Object.freeze({
 tank:{hp:1.78,atk:.75,interval:1.85},
 berserker:{atk:1.01,interval:1.65},
 vampire:{atk:.84},
 caster:{hp:1.07,atk:1.07},
 gravecaller:{hp:1.04},
 oathbound_exarch:{hp:1.18,atk:.87},
 briarspine_horror:{hp:1.80,atk:1.18,interval:1.72},
 ashen_executioner:{hp:1.16,atk:1.00,interval:2.27}
});
const FIRST_EXPEDITION_BOSSES=Object.freeze({
 leech:{hp:1.77,interval:1.43},
 matriarch:{hp:1.66,atk:1.78},
 guardian:{hp:1.68,interval:1.56},
 conductor:{hp:1.55,atk:1.76},
 berserker:{atk:1.60,interval:1.61}
});
function firstExpeditionLeader(base,style,elite){
 const override=style?FIRST_EXPEDITION_BOSSES[style]:FIRST_EXPEDITION_ELITES[elite];
 return override?{...base,...override}:base;
}
const ELITE_IDENTITIES=Object.freeze([
 'tank','berserker','vampire','caster','gravecaller','oathbound_exarch',
 'briarspine_horror','ashen_executioner'
]);
// Stage 6.33: production keeps actual enemy mechanics and ordinary game
// integration tests. A separate disposable simulator VM changes this one
// constant to true ONLY for stat-only base calibration. No special abilities,
// encounter Traits/Conditions or Boss modifiers in that isolated VM.
// Risk tiers and encounter counts remain choices in both modes.
const CALIBRATION_STAT_ONLY=false;
function enemyScaling(level,kind,identity=null){
 checked(level);
 if(kind==='normal'&&(identity===null||Object.hasOwn(NORMAL_BASE,identity)))return UNITY;
 if(kind==='elite'&&ELITE_IDENTITIES.includes(identity))return UNITY;
 if(kind==='boss'&&Object.hasOwn(BOSS_BASE,identity))return UNITY;
 throw Error('Invalid native enemy class/identity '+kind+'/'+identity);
}
root.WandererExpeditionProgression=Object.freeze({
 tiers,gearTier,enemyReference,ENEMY_EXPONENTIAL_GROWTH,
 NORMAL_BASE,BOSS_BASE,ELITE_IDENTITIES,CALIBRATION_STAT_ONLY,enemyScaling,firstExpeditionLeader
});
})(globalThis);
