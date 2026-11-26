'use strict';
// Current-only v15 catalog contract; no historical golden-master dependency.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const C=globalThis.WandererTalentCatalog,G=globalThis.WandererTalentGraph,B=globalThis.WandererTalentGraphBridge;
const graph=G.createGraph(globalThis.WandererV012Buildcraft.CATALOG,C.NODES);
test('C1 clean sheet: source catalog uniquely generates the current 420-node v15 graph',()=>{
 assert.equal(graph.length,420);assert.equal(T.NODES.length,420);
 assert.deepEqual(JSON.parse(JSON.stringify(graph)),JSON.parse(JSON.stringify(T.NODES)));
 assert.equal(new Set(graph.map(n=>n.id)).size,graph.length);
 assert(C.ATTRIBUTES&&typeof C.ATTRIBUTES==='object');
});
test('C1 clean sheet: representative physical, spell and mixed paths use the native runtime',()=>{
 const baseline={attack:35,defense:22,maxhp:220,spellPower:36,manaRegen:2,mana:70,attacksPerSec:1.1};
 for(const id of ['affinity_blood','affinity_decay','affinity_radiance','affinity_aegis','affinity_fury','affinity_arcane','bleeding_edge','arcane_resonance']){
  const p=buy([id]);
  assert(T.valid(p));
  const next=T.apply({...baseline},p);
  assert(Number.isFinite(next.attack)&&Number.isFinite(next.spellPower)&&Number.isFinite(next.maxhp),id);
  assert(B.bonuses(graph,{points:T.earned(p),ranks:T.graphProgress(p).ranks}),id);
 }
});
test('C1 clean sheet: only current catalog/runtime are loaded into root and Talent iframe',()=>{
 const page=fs.readFileSync('index.html','utf8'),iframe=fs.readFileSync('preview/talent-rebuild/index.html','utf8');
 // Compare script paths rather than cache-busting query strings. Require
 // exactly one current catalog in each page and no retired runtime.
 const scripts=html=>[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1].split(/[?#]/,1)[0]);
 for(const [html,prefix] of [[page,''],[iframe,'../../']]){
  const loaded=scripts(html);
  assert.equal(loaded.filter(src=>src===prefix+'combat/talent-catalog.js').length,1);
  assert(!loaded.includes(prefix+'combat/automatic-talents.js'));
 }
 assert.equal(T.create().treeVersion,15);
 for(const old of [8,9,10,11,12,13,14])assert.equal(T.valid({...T.create(),treeVersion:old}),false);
});


test('consolidation: every node has a legal v15 purchase route within the 100 point cap',()=>{
 require('../combat/talent-requirements.js');
 const R=globalThis.WandererTalentRequirements;
 for(const n of T.NODES){
  const mode=n.element||'arcane',available=T.NODES.filter(x=>!x.pending&&(!x.element||x.element===mode));
  const route=R.plan(available,{},n.id);
  assert(route,n.id);
  let p={...T.create(),xp:T.MAX_POINTS*T.POINT_XP,...(mode==='arcane'?{}:{element:mode})};
  for(const id of route.steps){p=T.allocate(p,id);assert(p,n.id+' cannot buy '+id);}
  assert(T.valid(p)&&p.nodes.includes(n.id),n.id);
 }
});
test('consolidation: every catalog entry is used and only current mixed pairs exist',()=>{
 const ids=new Set(T.NODES.map(n=>n.id)),passives=new Set(T.NODES.map(n=>n.passiveId));
 for(const p of globalThis.WandererV012Buildcraft.CATALOG)assert(passives.has(p.id),p.id);
 for(const p of C.NODES)assert(ids.has(p.id),p.id);
 const mixed=T.NODES.filter(n=>n.kind==='mixed');
 const pairs=[...new Set(mixed.map(n=>n.pair.join('+')))].sort();
 assert.deepEqual(pairs,['aegis+arcane','arcane+decay','blood+fury','decay+blood','fury+radiance','radiance+aegis']);
 assert.equal(mixed.length,18);
});
test('consolidation: no retired talent gates or descriptions remain in current core runtime',()=>{
 const retired=["hemovore","crimson_pact","rot_recovery","rot_symbiosis","life_conduit","lifeweave","lifeweaver","fury_momentum","living_inferno","absolute_winter","fire_focus","frost_focus","lightning_focus"];
 for(const id of retired){
  assert(!T.NODES.some(n=>n.id===id),id);
  assert.equal(T.allocate({...T.create(),xp:10000},id),null,id);
 }
 for(const path of ['combat/v012-buildcraft.js','combat/talent-catalog.js','combat/talent-graph-next.js','combat/v012-combat-runtime.js','combat/talent-graph-bridge.js','combat/talent-graph-runtime.js']){
  const source=fs.readFileSync(path,'utf8');
  assert.equal(fs.readFileSync('docs/'+path,'utf8'),source,path+' mirror');
  for(const id of retired)assert(!new RegExp('\\b'+id+'\\b','i').test(source),path+': '+id);
 }
});


test('consolidation: approved talent names resolve in the live graph without reviving retired nodes',()=>{
 const expected={"sanguine_echo":"Sanguine Echo","corrupting_touch":"Corrupting Touch","blightburst":"Blightburst","sundering_assault":"Sundering Assault","elemental_echo":"Elemental Echo","crimson_onslaught":"Crimson Onslaught","defiant_surge":"Defiant Surge","forked_lightning":"Forked Lightning","resonant_sequence":"Resonant Sequence","third_cut":"Third Cut","precision":"Precision","storm_conductor":"Storm Conductor","unchained_fury":"Unchained Fury"};
 for(const [id,name] of Object.entries(expected))assert.equal(T.NODES.find(n=>n.id===id)?.name,name,id);
 for(const id of ['lifeweave','lifeweaver','critical_training'])assert(!T.NODES.some(n=>n.id===id),id);
 assert.equal(T.NODES.find(n=>n.id==='precision').family,'fury');
 assert.equal(T.NODES.find(n=>n.id==='affinity_radiance').name,'Radiance');
 assert.equal(T.NODES.find(n=>n.id==='affinity_arcane').name,'Arcane');
 assert.equal(T.NODES.find(n=>n.id==='element_choice').name,'Arcane Attunement');
});
test('consolidation: talent combat log names follow the current graph',()=>{
 const b=fs.readFileSync('combat/v012-buildcraft.js','utf8'),c=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(b.includes('✨ Resonant Sequence'));
 assert(!b.includes('✨ Spell Echo'));
 assert(c.includes('☠ Corruption Overflow'));
 assert(!c.includes('☠ Corruption Nova'));
});
