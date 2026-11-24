'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');require('../combat/v012-buildcraft.js');require('../combat/talent-catalog.js');require('../combat/talent-graph-next.js');require('../combat/talent-graph-bridge.js');
const G=WandererTalentGraph,B=WandererTalentGraphBridge,C=WandererV012Buildcraft,graph=G.createGraph(C.CATALOG,WandererTalentCatalog.NODES),node=id=>graph.find(n=>n.id===id);
function buy(p,id){const n=node(id);for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.ranks[dep])p=buy(p,dep);if(n.anyRequires&&!n.anyRequires.some(x=>p.ranks[x]))p=buy(p,n.anyRequires[0]);return G.allocate(graph,p,id);}
test('basic ranks project into the real buildcraft rank calculation',()=>{let p=buy({points:100,ranks:{}},'deep_cuts');p=G.allocate(graph,p,'deep_cuts');const projection=B.project(graph,p),build=C.create();build.runtime.permanentTalents=projection.permanentTalents;assert.equal(C.rank(build,'deep_cuts'),2);assert.equal(C.rank(build,'bleeding_edge'),2);});
test('innate rank plus invested ranks stays within engine maximum',()=>{let p=buy({points:100,ranks:{}},'bleeding_edge');for(let i=1;i<node('bleeding_edge').maxRank;i++)p=G.allocate(graph,p,'bleeding_edge');const build=C.create();build.runtime.permanentTalents=B.project(graph,p).permanentTalents;assert.equal(C.rank(build,'bleeding_edge'),5);});
test('minor stat and magic focused bonuses alter derived values',()=>{let p=buy({points:100,ranks:{}},'arcane_mastery');const stats={attack:10,defense:10,maxhp:100,evasionRating:0,spellPower:100,manaRegen:2};const out=B.apply(stats,graph,p);assert(out.spellPower>125);assert.equal(stats.spellPower,100);});
test('specializations and prepared mixed skills project to existing runtime identifiers',()=>{let p=buy({points:100,ranks:{}},'blood_harvest');p=buy(p,'red_guillotine');const x=B.project(graph,p,'fire','red_guillotine');assert(x.nodes.includes('blood_harvest'));assert.equal(x.prepared,'red_guillotine');assert.throws(()=>B.project(graph,p,'fire','blood_harvest'));});



test('percentage stat nodes preserve IDs, tiers, census and truthful tooltips',()=>{
 const counts={pctAttack:32,pctArmor:18,pctLife:36,pctSpell:15};
 for(const [key,count] of Object.entries(counts)){
  const nodes=graph.filter(n=>n.kind==='stat'&&n[key]!==undefined);
  assert(nodes.length>0,key);
  for(const n of nodes){const expected=[.02,.03,.04][(n.tier||1)-1];assert.equal(n[key],expected,n.id);assert(n.description.startsWith('+'+expected*100+'% '),n.id);}
 }
 for(const n of graph)for(const key of ['flatAttack','flatArmor','flatLife','flatSpell'])assert.equal(n[key],undefined,n.id);
});
test('percentage stat nodes are additive on the pre-graph stat; other spell modifiers remain separate',()=>{
 const fields={pctAttack:'attack',pctArmor:'defense',pctLife:'maxhp',pctSpell:'spellPower'};
 for(const [key,stat] of Object.entries(fields)){
  const nodes=graph.filter(n=>n.kind==='stat'&&n[key]&&(!n.element||n.element==='fire'));
  let p={points:100,ranks:{}};for(const n of nodes.slice(0,3))if(!p.ranks[n.id])p=buy(p,n.id);
  const selected=graph.filter(n=>p.ranks[n.id]),pct=selected.reduce((a,n)=>a+(n[key]||0)*p.ranks[n.id],0);
  const base={attack:20,defense:40,maxhp:120,spellPower:100,mana:100,manaRegen:10,attacksPerSec:1,evasionRating:10};
  for(const scale of [1,10]){
   const input={...base,[stat]:base[stat]*scale},out=B.apply(input,graph,p);
   let expected=input[stat]*(1+pct);
   if(stat==='spellPower')expected=Math.round(expected*(1+selected.reduce((a,n)=>a+(n.spell||0)*p.ranks[n.id],0)));
   if(stat==='maxhp'){const h=selected.reduce((a,n)=>a+(n.health||0)*p.ranks[n.id],0);if(h)expected=Math.round(expected*(1+h));}
   assert(Math.abs(out[stat]-expected)<1e-8,key);assert.equal(input[stat],base[stat]*scale);
  }
 }
});

test('every stat slot has one direct stat; skill gates are relevant and attributes remain post-cap only',()=>{
 assert.equal(graph.length,419);assert.equal(graph.filter(n=>n.kind==='stat').length,308);
 const fields=['pctAttack','pctArmor','pctLife','pctSpell','pctSpeed','pctMana','pctRegen','critChance','flatAvoid','guardChance','barrierPower','healingPower','manaCostReduction','bleedBonus','rotBonus','rotDefense','sunderDamage','healthRegen'];
 for(const n of graph.filter(n=>n.kind==='stat')){
  assert.equal(fields.filter(k=>n[k]!==undefined).length,1,n.id);
  for(const k of ['attribute','attributeValue','flatSpeed','flatMana','flatRegen','startBarrier'])assert.equal(n[k],undefined,n.id);
 }
 for(const [id,key] of Object.entries({precision:'critChance',brutal_crit:'critChance',adrenaline:'critChance',sanguine_fury:'critChance',crimson_rush:'critChance',fervent_life:'critChance',quick_hands:'pctSpeed',guarded_block:'guardChance',retaliation:'guardChance',barrier_pulse:'barrierPower',blood_drinker:'healingPower',efficient_cast:'manaCostReduction',blight:'pctSpell',wasting_curse:'rotDefense',ward_echo:'barrierPower'})){
  assert(graph.find(n=>n.id==='gate_'+id)?.[key]>0,id);
 }
 for(const key of ['pctAttack','pctSpell','rotBonus','pctMana','pctRegen','manaCostReduction'])assert(graph.some(n=>n.family==='decay'&&n[key]>0),key);
 assert(graph.some(n=>n.family==='aegis'&&n.pctSpell>0));
 assert(graph.some(n=>n.family==='fury'&&n.flatAvoid>0));
});
test('Guard works without shield, and new stat caps and bonuses are direct',()=>{
 const graph=[{id:'a',guardChance:2,barrierPower:.04,healingPower:.02,manaCostReduction:.40}],p={points:1,ranks:{a:1}};
 const out=B.apply({attack:20,defense:5,maxhp:100,spellPower:0,attacksPerSec:1,blockChance:0,blockReduction:0},graph,p);
 assert.equal(out.blockChance,2);assert.equal(out.blockReduction,.35);assert.equal(out.barrierPower,.04);assert.equal(out.healingPower,.02);assert.equal(out.manaCostReduction,.25);
 const shield=B.apply({blockChance:64,blockReduction:.67,spellPower:0,attacksPerSec:1},graph,p);assert.equal(shield.blockChance,65);assert.equal(shield.blockReduction,.67);
});
test('secondary nodes scale on pre-graph values, preserve zero resources, and cap crit and attack speed',()=>{
 const graph=[
  {id:'a',pctSpeed:.01,pctMana:.02,pctRegen:.01,critChance:2},
  {id:'b',pctSpeed:.02,pctMana:.04,pctRegen:.02,critChance:4},
  {id:'c',flatMana:3,flatRegen:.25}
 ],p={points:3,ranks:{a:1,b:1,c:1}},base={attack:20,defense:6,maxhp:119,spellPower:0,attacksPerSec:2,mana:100,manaRegen:5,crit:20};
 const a=B.apply(base,graph,p);
 assert(Math.abs(a.attacksPerSec-2.06)<1e-9);assert.equal(a.mana,109);assert(Math.abs(a.manaRegen-5.4)<1e-9);assert.equal(a.crit,26);
 const zero=B.apply({...base,mana:0,manaRegen:0},graph,{points:2,ranks:{a:1,b:1}});assert.equal(zero.mana,0);assert.equal(zero.manaRegen,0);
 const cap=B.apply({...base,crit:99,attacksPerSec:4.19},graph,p);assert.equal(cap.crit,100);assert.equal(cap.attacksPerSec,4.2);
 const empty=C.create();assert.equal(C.mods(empty,{...base,crit:99}).crit,99);assert.equal(C.mods(empty,{...base,crit:105}).crit,100);
});
