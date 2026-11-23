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
// One native HP/ATK/DEF reference for all encounter kinds. E1–E5 unchanged;
// the logarithmic tail is unbounded but grows ever more slowly beyond E200.
function enemyReference(level){checked(level);return level<=5?level:5*(1+.2*Math.log1p((level-5)/5));}
const UNITY=Object.freeze({hp:1,atk:1,def:1});
// Target individual added pressure at E70, expressed relative to each Elite's
// own BASE archetype (NOT the gear, rarity, risk, role or ability multipliers).
// E70 Briarspine is deliberately lower than the obsolete two-ramp profile:
// synthetic Rare-geared E70 players previously only won 5/12 encounters.
const ELITE_GROWTH=Object.freeze({
 tank:Object.freeze({hp:.58,atk:.24,def:.10}),
 berserker:Object.freeze({hp:.60,atk:.28,def:.06}),
 vampire:Object.freeze({hp:.48,atk:.24,def:.05}),
 caster:Object.freeze({hp:.70,atk:.32,def:.11}),
 gravecaller:Object.freeze({hp:.69,atk:.37,def:.09}),
 oathbound_exarch:Object.freeze({hp:.97,atk:.45,def:.18}),
 briarspine_horror:Object.freeze({hp:.95,atk:.38,def:.12}),
 ashen_executioner:Object.freeze({hp:.80,atk:.37,def:.11})
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
// E1–E5 = 0; E70 = 1; E200 ≈ 1.227; asymptotically approaches 90/65.
// The continuing tail gives post-E70 Elites some pressure without compounding
// an additional late-game modifier on top of this function.
function eliteProgress(level){
 checked(level);
 const x=Math.max(0,level-5);
 return x/(x+25)/(65/(65+25));
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
  const progress=eliteProgress(level);
  return {hp:1+gain.hp*progress,atk:1+gain.atk*progress,def:1+gain.def*progress};
 }
 if(kind==='boss'){
  const protection=BOSS_PROTECTION[identity];
  if(!protection)throw Error('Invalid Boss scaling style '+identity);
  const early=Math.max(0,Math.min(1,(30-level)/29));
  return {hp:1-protection.hp*early,atk:1-protection.atk*early,def:1};
 }
 throw Error('Invalid native enemy class '+kind);
}
root.WandererExpeditionProgression=Object.freeze({
 tiers,gearTier,enemyReference,enemyScaling,eliteProgress,
 ELITE_GROWTH,BOSS_PROTECTION
});
})(globalThis);
