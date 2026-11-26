'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../online/v012-expedition-events.js');
require('../online/v012-expedition-controller.js');
const catalog=globalThis.WandererV012IntegratedEvents.CATALOG;
const fs=require('node:fs');

test('v0.13 event catalog intentionally adds the optional Severance Spire without duplicating IDs',()=>{
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
test('current Dungeon owns event placement; retired 15-Realm event groups no longer exist',()=>{
 const source=fs.readFileSync('online/v012-expedition-controller.js','utf8');
 assert.equal(globalThis.WandererV012Expedition.EVENT_GROUPS,undefined);
 assert(!source.includes('EVENT_GROUPS'));
 assert(source.includes('function startDungeon('));
 assert(source.includes("oracle_of_paths"));
 assert(source.includes("forgotten_reliquary"));
 const optional=catalog.find(e=>e.id==='forgotten_reliquary');
 assert(optional&&optional.category==='sacrifice');
 const scheduled=catalog.filter(e=>e.id!=='forgotten_reliquary');
 assert.equal(scheduled.length,8);
 assert.equal(new Set(scheduled.map(e=>e.id)).size,8);
});

test('C6: Bounty Writ presentation follows the current Dungeon Elite objective, not old 15-Realm rooms',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const html=fs.readFileSync('index.html','utf8');
 const start=html.indexOf('function phase6EventOptionPresentation('),end=html.indexOf('\nfunction phase6EventReason(',start);
 assert(start>0&&end>start);
 const context={phase1Controller:{state:{expedition:3,dungeon:{cleared:[0]}},realmMap:()=>({objective:7})},
  phase3Vitals:()=>({hp:80,maxhp:100,mp:10,maxmp:50}),document:{querySelector:()=>null},state:{gold:200}};
 vm.runInNewContext(html.slice(start,end)+'\nthis.presentation=phase6EventOptionPresentation;',context);
 const pending=context.presentation({id:'bounty_writ'},0,[]);
 assert.match(pending.benefit,/Next Elite/);
 context.phase1Controller.state.dungeon.cleared.push(7);
 const finished=context.presentation({id:'bounty_writ'},0,[]);
 assert.match(finished.benefit,/Fragments/);
 assert(!html.includes('phase1Controller.allowed('),'retired legacy route methods must not be callable from active event UI');
});
