'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const index=()=>fs.readFileSync('index.html','utf8');

// Noninteractive data attributes encode visual metadata for CSS, VFX, rendering or QA.
// The remaining attributes must have a corresponding selector in the live index runtime.
// This is a static wiring invariant, not proof of clicking every state/seed.
const metadata=new Set([
 'attack-src','bonus','boss-style','elite-type','exit-from','idle-src',
 'contract-target','label-side','map-affinity','map-kind','map-state','potion-index',
 'rarity','realm-map','slot','source','stash-potion','stat','stat-source'
]);
test('C8 inventory classifies every data attribute in the live UI as linked or presentation-only',()=>{
 const source=index(),attrs=[...new Set([...source.matchAll(/\bdata-([a-z][a-z0-9-]+)\s*=/g)].map(m=>m[1]))];
 assert(attrs.length>=50,'Major UI surfaces and controls must remain in the inventory');
 for(const id of attrs)if(!metadata.has(id))
  assert(source.includes('[data-'+id),'UI data attribute has no local selector: data-'+id);
 for(const id of metadata)assert(attrs.includes(id),'Presentation marker deleted; review C8 inventory: '+id);
 assert(attrs.includes('online-action'));
});
test('C8 source has the current active navigation, loot, rune, vendor, map and boss-choice entrypoints',()=>{
 const source=index();
 for(const id of [
  'between-tab','buy','city-tab','compare','dungeon-room','event-select',
  'inventory-jump','map-zoom','merchant-category','phase1-expedition',
  'phase3-equip','phase3-expedition-step','phase3-loot','phase3-nav',
  'potion-buy','potion-inspect','potion-load','potion-use','realm-card',
  'rune-choice','rune-equip','rune-remove','rune-sell','rune-slot-choice',
  'scout','stage6-boon','stage7-contract','stage74-potion'
 ]){assert(source.includes('data-'+id+'='),'Action disappeared from markup: '+id);
     assert(source.includes('[data-'+id),'No query/binding for action: '+id);}
});
test('C8 account, feedback and leaderboard actions have explicit external entrypoints',()=>{
 const source=index();
 for(const action of ['account','feedback','leaderboard'])
  assert(source.includes('data-online-action="'+action+'"'));
 for(const [path,id] of [
  ['online/v012-account.mjs','account'],
  ['online/v012-feedback.mjs','feedback'],
  ['online/v012-leaderboard-ui.mjs','leaderboard']
 ]){const module=fs.readFileSync(path,'utf8');
   assert(module.includes('data-online-action="'+id+'"'),path+' must bind the matching header action');}
});

test('C8 gear-driven character portraits replace the retired manual skin selector',()=>{
 const source=index();
 assert(source.includes('globalThis.WandererCharacterArt?.imageForEquipment(state.equip)'));
 assert(source.includes('online/v013-character-art.js?v=20261121'));
 assert(!source.includes('data-phase1-hero='));
 assert(!source.includes('phase3CharacterPickerHitbox'));
});
