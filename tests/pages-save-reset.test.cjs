'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('Pages starts with a new local slot without touching previous preview or production data',()=>{
 const out=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim(),dir=out.slice('Isolated automatic RPG preview: '.length),html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),save=fs.readFileSync(path.join(dir,'online/v012-save.js'),'utf8');
 assert(save.includes("PREFIX='wanderer_automatic_rpg_preview_v6_'"));
 const storage=new Map([['wanderer_automatic_rpg_preview_v5_local','previous preview'],['wanderer_v012_endless_v1_local','production-like data']]);
 const game=require('./v012-economy-harness.cjs')(17,html,{}, {root:dir,validationStorage:storage});
 assert.equal(game.debug().phase5Ready,true);assert.equal(game.state().automaticTalents.xp,0);assert.deepEqual(Array.from(game.state().automaticTalents.nodes),[]);assert.equal(game.state().automaticTalents.starterPoints,2);
 assert.equal(storage.get('wanderer_automatic_rpg_preview_v5_local'),'previous preview');assert.equal(storage.get('wanderer_v012_endless_v1_local'),'production-like data');assert(storage.has('wanderer_automatic_rpg_preview_v6_local'));
});
