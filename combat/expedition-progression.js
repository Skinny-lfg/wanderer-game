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
// Stage 6.29 — the original logarithmic reference eventually made all
// encounters trivial while earned Talents, gear and post-100 Attributes grew.
// Keep E1–E5 EXACT. Beyond E5, add an exponential acceleration to the old
// reference, subtracting its constant/linear Taylor terms so both the value
// AND its first derivative are continuous at E5 (no sudden E6 jump).
// The same reference feeds native normal, Tank, Elite and Boss HP/ATK/DEF.
// Individual Elite/Boss identity modifiers continue to apply ONCE after it.
// Conservative first calibration, not a per-build buff or hidden difficulty step.
// E35≈7.18, E70≈8.99, E100≈11.46, E150≈19.66, E200≈38.11.
const ENEMY_EXPONENTIAL_GROWTH=Object.freeze({rate:.015,weight:2});
function enemyReference(level){
 checked(level);
 if(level<=5)return level;
 const x=level-5,{rate,weight}=ENEMY_EXPONENTIAL_GROWTH;
 const base=5+Math.log1p(x/5);
 const extra=weight*(Math.expm1(rate*x)-rate*x);
 // Endless Expeditions eventually exceed all safe finite stat budgets even
 // with logarithmic growth. Refuse silent Infinity from an invalid progression.
 const reference=base+extra;
 if(!Number.isFinite(reference))throw Error('Expedition enemy reference exceeds finite range at E'+level);
 return reference;
}
const UNITY=Object.freeze({hp:1,atk:1,def:1});
// Target individual added pressure at E200, expressed relative to each Elite's
// own BASE archetype (NOT the gear, rarity, risk, role or ability multipliers).
// Briarspine's growth is deliberately lower than the obsolete two-ramp profile:
// synthetic Rare-geared E70 players previously only won 5/12 encounters.
const ELITE_GROWTH=Object.freeze({
 tank:Object.freeze({hp:.58,atk:.24,def:.10}),
 berserker:Object.freeze({hp:.58,atk:.27,def:.06}),
 vampire:Object.freeze({hp:.48,atk:.23,def:.05}),
 caster:Object.freeze({hp:.70,atk:.31,def:.11}),
 gravecaller:Object.freeze({hp:.67,atk:.36,def:.09}),
 oathbound_exarch:Object.freeze({hp:.94,atk:.43,def:.17}),
 briarspine_horror:Object.freeze({hp:1.11,atk:.39,def:.12,shape:1.18}),
 ashen_executioner:Object.freeze({hp:.77,atk:.35,def:.11})
});
// Six independent late-Boss pressures compensate for the Exalted gear ceiling.
// E1–E30 stay exactly as Stage 6.21; after E30 the single policy increases
// difficulty smoothly by identity, not by a blanket Boss multiplier.
const BOSS_GROWTH=Object.freeze({
 leech:Object.freeze({hp:.24,atk:.13}),
 matriarch:Object.freeze({hp:.27,atk:.12}),
 guardian:Object.freeze({hp:.20,atk:.12}),
 conductor:Object.freeze({hp:.25,atk:.13}),
 berserker:Object.freeze({hp:.22,atk:.14}),
 devourer:Object.freeze({hp:.24,atk:.11})
});
// Stage 6.21's six individualized E1 Boss protections are preserved byte-for-
// byte in their computed values through E30. Moving them here removes a second
// independent Boss scaling owner; no new Boss-wide buff is introduced.
const BOSS_PROTECTION=Object.freeze({
 leech:Object.freeze({hp:.37,atk:.22}),
 matriarch:Object.freeze({hp:.39,atk:.23}),
 guardian:Object.freeze({hp:.29,atk:.18}),
 conductor:Object.freeze({hp:.28,atk:.18}),
 berserker:Object.freeze({hp:.18,atk:.11}),
 devourer:Object.freeze({hp:.16,atk:.10})
});
// One continuous, monotonic rational curve, no E6/E36/E70/E200 step:
// E1–E5 = 0; E200 = 1; E70 ≈ .84; asymptotically approaches 215/195.
// The continuing tail gives post-E70 Elites some pressure without compounding
// an additional late-game modifier on top of this function.
function eliteProgress(level){
 checked(level);
 const x=Math.max(0,level-5);
 return x/(x+20)/(195/(195+20));
}
// C1-continuous at E30: the square removes any sudden late Boss jump.
function bossProgress(level){
 checked(level);
 const x=Math.max(0,level-30);
 return Math.pow(x/(x+30),2)/Math.pow(170/200,2);
}
function enemyScaling(level,kind,identity=null){
 checked(level);
 if(kind==='normal'){
  if(identity!==null&&!['minion','tank','skirmisher','caster'].includes(identity))
   throw Error('Invalid normal enemy role '+identity);
  return UNITY;
 }
 if(kind==='elite'){
  const gain=ELITE_GROWTH[identity];
  if(!gain)throw Error('Invalid Elite scaling identity '+identity);
  // Elite-specific easing is continuous and single-sourced: Briarspine's
  // Thornbloom comes online early, but its endgame budget ramps more gradually.
  const progress=Math.pow(eliteProgress(level),gain.shape||1);
  return {hp:1+gain.hp*progress,atk:1+gain.atk*progress,def:1+gain.def*progress};
 }
 if(kind==='boss'){
  const protection=BOSS_PROTECTION[identity],late=BOSS_GROWTH[identity];
  if(!protection||!late)throw Error('Invalid Boss scaling style '+identity);
  const early=Math.max(0,Math.min(1,(30-level)/29)),progress=bossProgress(level);
  return {hp:1-protection.hp*early+late.hp*progress,
   atk:1-protection.atk*early+late.atk*progress,def:1};
 }
 throw Error('Invalid native enemy class '+kind);
}
root.WandererExpeditionProgression=Object.freeze({
 tiers,gearTier,enemyReference,ENEMY_EXPONENTIAL_GROWTH,enemyScaling,eliteProgress,bossProgress,
 ELITE_GROWTH,BOSS_PROTECTION,BOSS_GROWTH
});
})(globalThis);
