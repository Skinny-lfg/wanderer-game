'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=()=>fs.readFileSync('combat/v012-buildcraft.js','utf8');
test('C9 removed Realm passive drafting helpers do not re-enter the active Buildcraft API',()=>{
 const s=source();
 for(const name of ['preview','canModify','capabilities','functional','eligible','synergy','options','choose','initial','element']){
  assert(!new RegExp('\\bfunction\\s+'+name+'\\s*\\(').test(s),'Retired draft helper: '+name);
  const exported=s.slice(s.lastIndexOf('root.WandererV012Buildcraft=Object.freeze('));
  assert(!new RegExp('(?:\\{|,)\\s*'+name+'\\s*(?:,|\\})').test(exported),'Retired draft export: '+name);
 }
});
test('C9 retired draft tag taxonomy is absent; current Catalog still exposes descriptions',()=>{
 const s=source();
 assert(!s.includes('const TAGS='));
 assert(!s.includes('tags:Object.freeze(Object.keys(TAGS)'));
 assert(s.includes('description:descriptions[p.id]||p.description'));
});
test('C9 native combat, v15 bridge and session validation entrypoints are retained',()=>{
 const s=source(),exported=s.slice(s.lastIndexOf('root.WandererV012Buildcraft=Object.freeze('));
 for(const name of ['CATALOG','FAMILIES','create','rank','values','bleedDamage','elementalPower','applyRot','migrateEnemyDots','mods','onHeal','onAttack','onCast','onSecond','tickRot','incoming','onDefend','onKill','survive','speed','enemyHealMultiplier','enemyDefense','nextCost','resetWave','canCast','validate','syncPermanent','clear']){
  assert(new RegExp('(?:\\{|,)\\s*'+name+'\\s*(?:,|\\})').test(exported),'Current integration API removed without proof: '+name);
 }
});
test('C9 generated public Pages mirror equals runtime source',()=>{
 assert.equal(fs.readFileSync('docs/combat/v012-buildcraft.js','utf8'),source());
});

test('C9 deleted draft RNG and unused potion alias have no live exports or bindings',()=>{
 const controller=fs.readFileSync('online/v012-expedition-controller.js','utf8');
 const economy=fs.readFileSync('economy/v012-equipment-runtime.js','utf8');
 const index=fs.readFileSync('index.html','utf8');
 assert(!controller.includes('draftRng'));
 assert(!controller.includes('passiveRandom'));
 assert(!economy.includes('function phase3UsePotion'));
 assert(!economy.includes('runeCheckpointLocked,phase3UsePotion'));
 assert(!index.includes('phase3UsePotion'));
});

test('C9 persistent Buildcraft rejects prior draft sessions, without changing current mechanics',()=>{
 const s=source();
 assert(!s.includes('function initialId('));
 assert(!s.includes('initialFamily:null'));
 assert(!s.includes('initialPassive:null'));
 assert(s.includes("b.version!==3"));
 assert(s.includes("Retired passive-draft state"));
 assert(s.includes("Retired passive-draft pity"));
 assert(!fs.readFileSync('index.html','utf8').includes('Initial passive'));
});
