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
// Stage 6.34 — single continuous exponential shared by every normal, Elite
// and Boss identity. Early shape fitted to 500 actually-earned E1-born accounts
// (Stage 6.32, run 45174790906, 3156 checkpoints). Weighted paired log-growth
// of player raw Max HP and Attack from E1→E20, never unpaired level averages.
// This is not a win-rate fit: native fights must independently validate targets.
// Stage 6.32 observed only 102/500 accounts at E20. The positive late slope
// is a DECLARED extrapolation E20→E200; do not claim it was measured.
// No discontinuities, gear-tier breakpoints, manual changes or level clamps.
// Recompute parameters with scripts/v013-stage634-player-growth-fit.cjs.
const ENEMY_EXPONENTIAL_GROWTH=Object.freeze({
 initialReference:.775,
 lateLogGrowth:.014, // provisional extrapolation; not identified from E1-E20
 earlyLogGrowthBoost:1.07777514,
 relaxationExpeditions:2.75370775
});
function enemyReference(level){
 checked(level);
 const {initialReference,lateLogGrowth,earlyLogGrowthBoost,relaxationExpeditions}=ENEMY_EXPONENTIAL_GROWTH;
 const x=level-1;
 const logGrowth=lateLogGrowth*x+
  earlyLogGrowthBoost*(-Math.expm1(-x/relaxationExpeditions));
 const reference=initialReference*Math.exp(logGrowth);
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
 leech:Object.freeze({hp:1.26,atk:1.56,def:2,interval:1.62}),
 matriarch:Object.freeze({hp:1.22,atk:1.54,def:2,interval:1.62}),
 guardian:Object.freeze({hp:1.42,atk:1.64,def:2,interval:1.62}),
 conductor:Object.freeze({hp:1.44,atk:1.64,def:2,interval:1.62}),
 berserker:Object.freeze({hp:1.64,atk:1.78,def:2,interval:1.62}),
 devourer:Object.freeze({hp:1.68,atk:1.80,def:2,interval:1.62})
});
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
 NORMAL_BASE,BOSS_BASE,ELITE_IDENTITIES,CALIBRATION_STAT_ONLY,enemyScaling
});
})(globalThis);
