// Expedition levels and named equipment tiers.
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
// The logarithm avoids an artificial gameplay ceiling while slowing the
// numerical escalation. E1–E5 retain the old combat reference values.
function enemyReference(level){checked(level);return level<=5?level:5*(1+.2*Math.log1p((level-5)/5));}
root.WandererExpeditionProgression=Object.freeze({tiers,gearTier,enemyReference});
})(globalThis);
