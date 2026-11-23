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
// Stage 6.31 — one SMOOTH exponentially compounded progression for all E>=1.
// The per-Expedition percentage growth changes smoothly; it is NOT a fixed %.
// Both the reference and its growth-rate derivative are continuous through
// E2/E3/E5/E35/E36/E70/E200. No piecewise level, clamp, local nerf or step.
// Provisional smooth E1-based calibration: E2/E3 match prior native targets,
// E5 is eased without an E5 breakpoint, and E200 retains late pressure.
// This is not proof that
// the target player win rates (normal 80–90%, Elite 60–70%, Boss 35–45%)
// are met by the current agents. Player gear and XP are separate models.
// Initial growth is brisker and relaxes smoothly toward the positive late
// rate. The entire expression is an exponential for every Expedition.
const ENEMY_EXPONENTIAL_GROWTH=Object.freeze({
 initialReference:.775,
 lateLogGrowth:.009901141066605541,
 earlyLogGrowthBoost:1.9367547131703917,
 relaxationExpeditions:2.0572942012233146
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
// Stage 6.33 is an experimental stat-only BALANCE BRANCH, not deployed.
// Enemy active/special abilities, Traits, Conditions and Boss modifiers
// are isolated from encounters during base calibration; their source remains
// available for a separately measured reintroduction in a later stage.
// Risk tier and encounter counts remain gameplay choices.
const CALIBRATION_STAT_ONLY=true;
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
