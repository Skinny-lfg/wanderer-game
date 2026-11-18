'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../online/v012-expedition-events.js');
require('../online/v012-expedition-controller.js');
const catalog=globalThis.WandererV012IntegratedEvents.CATALOG;
const groups=globalThis.WandererV012Expedition.EVENT_GROUPS;

test('v0.13 event catalog intentionally adds the optional Forgotten Reliquary without duplicating IDs',()=>{
 assert.equal(catalog.length,9,'Eight scheduled events plus one v0.13 optional Reliquary');
 assert.equal(new Set(catalog.map(e=>e.id)).size,9,'Event identities must remain unique');
 const relic=catalog.find(e=>e.id==='forgotten_reliquary');
 assert(relic,'New optional boss-preparation event exists');
 assert.equal(relic.category,'sacrifice');
 assert.equal(relic.choices.length,2);
 const expected=['traveling_merchant','relic_collector','cursed_altar','whispering_idol','forgotten_arsenal','bounty_writ','restless_spring','oracle_of_paths','forgotten_reliquary'];
 assert.deepEqual(catalog.map(x=>x.id).sort(),expected.sort(),'Only the optional v0.13 Reliquary extends the old catalog');
 const removed=['smugglers_caravan','cursed_artificer','soul_mirror','echo_shrine','cursed_chest','runic_vault','fallen_wanderer','last_ember'];
 assert(removed.every(id=>!catalog.some(e=>e.id===id)),'Retired events must not reappear');
 const oracle=catalog.find(e=>e.id==='oracle_of_paths');
 assert(oracle,'Oracle must remain available through normal schedule');
});
test('v0.13 legacy event schedule still uses four non-repeated categories; Reliquary remains optional',()=>{
 assert.equal(groups.length,4);
 assert(groups.every(g=>g.length===2));
 const scheduled=groups.flat();
 assert.equal(new Set(scheduled).size,8,'Exactly eight scheduled events');
 assert.equal(scheduled.includes('forgotten_reliquary'),false,'Optional Reliquary must not displace scheduled events');
 assert.equal(new Set(scheduled.map(id=>catalog.find(e=>e.id===id)?.category)).size,4);
 for(let seed=0;seed<100;seed++){
  const selected=groups.slice(0,3+seed%2).map((g,i)=>g[(seed+i)%g.length]);
  assert.equal(new Set(selected.map(id=>catalog.find(e=>e.id===id)?.category)).size,selected.length,
   'Normal event categories must not repeat');
 }
});
