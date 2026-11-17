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
