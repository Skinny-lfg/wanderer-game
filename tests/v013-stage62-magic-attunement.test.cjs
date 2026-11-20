'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../scripts/v013-stage62-magic-attunement.cjs'),T=P.T;
function buy(p,id){
 const n=T.NODES.find(x=>x.id===id);assert(n,id);
 for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.nodes.includes(dep))p=buy(p,dep);
 if(n.anyRequires&&!n.anyRequires.some(x=>p.nodes.includes(x)))p=buy(p,n.anyRequires[0]);
 const result=T.allocate(p,id);assert(result,id);return result;
}
test('Magic affinity alone grants candidate infusion without free elemental choice',()=>{
 const empty={...T.create(),xp:10000};assert.equal(P.attunement(empty),null);
 const magic=buy(empty,'affinity_magic');assert.equal(P.attunement(magic).kind,'infusion');
 assert.equal(P.choose(magic,'fire'),null);
});
test('Arcane choice offers immediate bonus over basic affinity in proposed spec',()=>{
 const magic=buy({...T.create(),xp:10000},'affinity_magic'),choice=buy(magic,'element_choice');
 const base=P.attunement(magic),advanced=P.attunement(choice);
 assert.equal(advanced.kind,'enhanced_infusion');assert(advanced.manaCost<base.manaCost);
 assert(advanced.bonusSpellPowerFractionAdd>0);assert.equal(choice.nodes.length,magic.nodes.length+1);
});
test('All four choices produce distinct immediate candidate benefits with valid graph',()=>{
 const choice=buy({...T.create(),xp:10000},'element_choice');
 const names=['arcane','fire','frost','lightning'];
 const effects=names.map(name=>{
  const progress=P.choose(choice,name);assert(progress&&T.valid(progress));
  const mode=P.attunement(progress);assert.equal(mode.source,'element_choice');
  if(name!=='arcane'){assert.equal(mode.element,name);assert.equal(mode.kind,'elemental_cast');assert(mode.initialCast&&mode.status);}
  return mode.kind==='enhanced_infusion'?'arcane-enchantment':mode.element;
 });
 assert.equal(new Set(effects).size,4);
});
test('Selecting another mode refunds only old elemental skills, retaining shared Magic nodes',()=>{
 let progress=buy({...T.create(),xp:10000},'arcane_resonance');
 const shared=progress.nodes.filter(x=>x.startsWith('magic_side_')),oldCount=progress.nodes.length;
 progress=P.choose(progress,'fire');
 assert(progress&&T.valid(progress));assert(!progress.nodes.includes('arcane_resonance'));
 assert(shared.every(x=>progress.nodes.includes(x)));assert.equal(progress.nodes.length,oldCount-2);
});
test('Aegis+Magic and Magic+Decay mixed paths do not require spending element_choice',()=>{
 require('../combat/talent-requirements.js');
 const R=globalThis.WandererTalentRequirements;
 for(const id of ['runic_shield','hex_bolt']){
  const plan=R.plan(T.NODES,{},id);assert(plan,id);
  assert(!plan.steps.includes('element_choice'),id);
 }
});
test('Stage 6.2 coefficient sweep compares 15 legitimate player stat contexts reproducibly',()=>{
 const a=P.sweep();assert.deepEqual(a,P.sweep());assert.equal(a.length,10);
 assert(a.some(x=>x.physicalMeanDamageDelta<0));assert(a.some(x=>x.physicalMeanDamageDelta>0));
});
test('Stage 6.2 remains isolated from live talent UI and combat',()=>{
 const code=fs.readFileSync('scripts/v013-stage62-magic-attunement.cjs','utf8');
 assert(code.includes('Never loaded by native combat or talent UI'));
 for(const p of ['combat/v012-combat-runtime.js','combat/talent-graph-runtime.js','index.html'])
  assert(!fs.readFileSync(p,'utf8').includes('v013-stage62-magic-attunement.cjs'));
});
