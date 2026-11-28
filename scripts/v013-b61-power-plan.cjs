'use strict';
const assert=require('node:assert/strict'),G=require('./v013-b6-affinity-plan.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const IDS=["arcane-fire-sword","arcane-fire-wand","arcane-fire-staff","arcane-lightning-sword","arcane-lightning-wand","arcane-lightning-staff","decay-focus-daggers","decay-focus-sword","decay-focus-twohand","decay-focus-bow","decay-focus-wand","decay-focus-staff","decay-cycle-wand","decay-cycle-daggers","hybrid-arcane-decay","hybrid-aegis-arcane","hybrid-radiance-arcane","blood-daggers","fury-twohand","aegis-sword","radiance-sword","arcane-arcane-wand","arcane-frost-wand","hybrid-radiance-aegis","lightning-choice-00","lightning-choice-10","lightning-choice-01","lightning-choice-11"],CONTROLS=["decay-cycle-wand","decay-cycle-daggers","hybrid-aegis-arcane","hybrid-radiance-arcane","blood-daggers","fury-twohand","aegis-sword","radiance-sword","arcane-arcane-wand","arcane-frost-wand","hybrid-radiance-aegis"];
let lightning;
function profile(id){
 if(!id.startsWith('lightning-choice-'))return G.profile(id);
 lightning??=require('./v013-b5-synergy-plan.cjs').plan().find(x=>x.key==='lightning-chain');
 assert(lightning,'Missing B5 lightning factorial');
 const suffix=id.slice(-2),arm=({'00':'before','10':'alternative','01':'extra','11':'after'})[suffix],t=lightning[arm];
 assert(T.valid(t));assert.equal(t.nodes.length,30);
 return {id,families:lightning.families,element:'lightning',weapon:lightning.weapon,offhandType:lightning.offhand,armorType:lightning.armor,role:'aoe',t};
}
assert.equal(IDS.length,28);assert.equal(new Set(IDS).size,IDS.length);
module.exports={...G,IDS,profile,HISTORICAL:IDS,CONTROLS};
