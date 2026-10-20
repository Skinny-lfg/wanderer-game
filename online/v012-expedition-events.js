// Event definitions. Outcomes are applied by the integrated game transaction, never by rendering.
(function(root){'use strict';
const rows=[
 ['traveling_merchant','Traveling Merchant','commerce',['Buy healing: 25 + 3×E Gold for 35% HP','Buy battle preparation: same Gold for +10% Attack for 3 combats']],
 ['smugglers_caravan','Smuggler’s Caravan','commerce',['Trade 10 + E Fragments for 40% Mana','Trade same Fragments for +10% Defense for 3 combats']],
 ['relic_collector','Relic Collector','commerce',['Sacrifice selected bag item for 12 + 2×item E Gold','Sacrifice selected bag item for 5 + item E Fragments']],
 ['cursed_artificer','Cursed Artificer','commerce',['Sacrifice selected bag item; empower a different owned item +10% for 3 combats','Sacrifice selected bag item; gain Barrier equal to 15% max HP']],
 ['cursed_altar','Cursed Altar','sacrifice',['Pay 20% max HP (must survive): +10% Attack this Expedition','Pay 20% max HP (must survive): +10% Defense this Expedition']],
 ['soul_mirror','Soul Mirror','sacrifice',['Replace selected non-initial passive with the displayed eligible alternative','Keep your build; no reward']],
 ['whispering_idol','Whispering Idol','sacrifice',['Accept +10% incoming damage for 3 combats: gain 25 + 4×E Gold','Accept same curse: gain 12 + 2×E Fragments']],
 ['echo_shrine','Echo Shrine','sacrifice',['Selected passive gains half a rank for 3 combats','Recover 15% Mana']],
 ['cursed_chest','Cursed Chest','treasure',['Safely take 8 + E Gold','Risk: 50% equipment, otherwise lose 15% max HP (non-lethal)']],
 ['forgotten_arsenal','Forgotten Arsenal','treasure',['Take one equipment item at this Expedition tier','Take 8 + 2×E Fragments']],
 ['runic_vault','Runic Vault','treasure',['Equipped Rune stats +20% for 3 combats (requires a Rune)','Take 10 + E Fragments']],
 ['bounty_writ','Bounty Writ','treasure',['Next Elite: +25% HP/Attack, +50% Gold/Fragments and guaranteed equipment','Decline the bounty; no reward']],
 ['restless_spring','Restless Spring','survival',['Recover 35% HP','Recover 40% Mana']],
 ['fallen_wanderer','Fallen Wanderer','survival',['Pay 10 + E Gold to help: heal 20% HP and gain 10% Barrier','Collect provisions: recover 15% HP and 15% Mana']],
 ['oracle_of_paths','Oracle of Paths','survival',['Ensure the selected eligible affinity appears in the next non-boss offer','Take 5 + E Fragments instead']],
 ['last_ember','Last Ember','survival',['Recover 35% HP; selected passive loses half a rank for 3 combats','Recover 40% Mana with the same passive penalty']]
];
root.WandererV012Events=Object.freeze({CATALOG:rows.map(([id,name,category,choices])=>Object.freeze({id,name,category,choices})),get:id=>rows.find(r=>r[0]===id)});
})(globalThis);
