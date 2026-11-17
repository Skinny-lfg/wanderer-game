// Event definitions. Outcomes are applied by the integrated game transaction, never by rendering.
(function(root){'use strict';
const rows=[
 ['traveling_merchant','Traveling Merchant','commerce',['Pay 25 + 3×E Gold to recover 35% HP','Take the parcel: gain 5 + E Fragments']],
 ['relic_collector','Relic Collector','commerce',['Sacrifice a Bag item for Gold, or take a smaller free reward','Sacrifice a Bag item for Fragments, or take a smaller free reward']],
 ['cursed_altar','Cursed Altar','sacrifice',['Pay 20% max HP (must survive): +10% Attack this Expedition','Pay 20% max HP (must survive): +10% Defense this Expedition']],
 ['whispering_idol','Whispering Idol','sacrifice',['Accept +10% incoming damage for 3 combats: gain 25 + 4×E Gold','Accept +10% incoming damage for 3 combats: gain 12 + 2×E Fragments']],
 ['forgotten_arsenal','Forgotten Arsenal','treasure',['Recover 6 Essence for directed crafting','Take provisions to recover up to 2 spent steps']],
 ['bounty_writ','Bounty Writ','treasure',['Accept the bounty for the next Elite, or take Fragments if none remains','Pass and keep your current supplies']],
 ['restless_spring','Restless Spring','survival',['Recover 35% HP, or take 3 + E Fragments if full','Recover 40% Mana, or take 3 + E Fragments if full or unavailable']],
 ['oracle_of_paths','Oracle of Paths','survival',['Reveal up to 2 nearby rooms, a nearby hidden passage and one unknown boss property','Take 5 + E Fragments instead']],
 ['forgotten_reliquary','Forgotten Reliquary','sacrifice',['Sacrifice 15% maximum HP to disable the known boss property','Recover 15% Health and 25% Mana instead']]
];
root.WandererV012IntegratedEvents=Object.freeze({CATALOG:rows.map(([id,name,category,choices])=>Object.freeze({id,name,category,choices})),get:id=>rows.find(r=>r[0]===id)});
})(globalThis);
