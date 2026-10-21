(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WandererLegendary=api;})(globalThis,function(){
'use strict';
const DEFINITIONS={
 "crimson-fang":{affinity:"blood",name:"Crimson Fang",cooldown:3.5,description:"Bleed: 12% base damage for 4 ticks (16% with Blood)."},
 "chalice-hollow-king":{affinity:"blood",name:"Chalice of the Hollow King",cooldown:6,description:"Hit a bleeding foe to heal 1% Max HP (1.5% with Blood)."},
 "gravewake":{affinity:"decay",name:"Gravewake",cooldown:4,description:"Rot: 7% base damage for 4 ticks (10% with Decay), up to 6 stacks."},
 "eye-of-morrow":{affinity:"decay",name:"Eye of Morrow",cooldown:7,description:"Against Rot, deal 60% extra base damage (85% with Decay), capped by enemy Max HP."},
 "verdant-oath":{affinity:"vitality",name:"Verdant Oath",cooldown:6,description:"Heal 0.8% Max HP and empower the next attack by 60% base damage (1.2% and 90% with Vitality)."},
 "heartroot-carapace":{affinity:"vitality",name:"Heartroot Carapace",cooldown:0,description:"Below 70% HP regenerate 0.30% Max HP/s (0.45% with Vitality), up to 15% per Realm."},
 "oathwall":{affinity:"aegis",name:"Oathwall",cooldown:3,description:"On real Block, counter for 75% base damage (110% with Aegis), replacing the base counter."},
 "veil-thousand-seals":{affinity:"aegis",name:"Veil of a Thousand Seals",cooldown:8,description:"Gain 4% Max HP Barrier at Realm start (6% with Aegis). Its absorption empowers the next attack by 30% base damage (45% with Aegis)."},
 "kingsbreaker":{affinity:"fury",name:"Kingsbreaker",cooldown:4,description:"An eligible attack gains 80% base damage (110% with Fury)."},
 "tempest-talon":{affinity:"fury",name:"Tempest Talon",cooldown:6,description:"Critical hit deals 25% extra base damage (35% with Fury)."},
 "astrafall":{affinity:"magic",name:"Astrafall",cooldown:4,description:"Every 2 Mana-funded casts echo 75% Spell Power (100% with Magic)."},
 "voidglass":{affinity:"magic",name:"Voidglass",cooldown:3,description:"Every 2 Mana-funded casts deal 90% Spell Power (120% with Magic) and refund 25% Mana cost (30% with Magic)."}

};
const GENERIC_IDS=[];
function resolve(item){return item?.rarity==='Legendary'?DEFINITIONS[item.legendaryId]||null:null;}
return {DEFINITIONS,GENERIC_IDS,resolve};
});
