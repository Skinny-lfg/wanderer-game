'use strict';
// Research only: independent native Forge draws, never actual account RNG.
const assert=require('node:assert/strict'),AI=require('./v013-b32c-equipment-policy.cjs'),create=require('../tests/v012-economy-harness.cjs');
require('../economy/v013-gear-rolls.js');require('../economy/v013-crafting.js');
const C=globalThis.WandererV013Crafting,N=32,cache=new Map();
const enabled=p=>p?.equipmentIntelligence==='b32d5-ev';
function seed(key){let h=2166136261;for(const c of 'b32d5-forecast-v1|'+key)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function samples(recipe,level,influence){
 const price=C.cost(recipe.id,level,influence),key=[recipe.id,price.tier,influence||'none'].join('|');
 if(cache.has(key))return cache.get(key);
 const roller=create(seed(key),undefined,{}, {skipPersistence:true}),crafting=C.create();
 crafting.essence=100000;for(const f of C.FAMILIES)crafting.cores[f]=1000;
 if(recipe.rarity!=='Uncommon')crafting.learnedRecipes=[recipe.id];
 const state={fragments:100000,crafting},rows=[];
 for(let i=0;i<N;i++){
  const result=C.prepareCraft(state,recipe.id,level,(...args)=>roller.makeItem(...args),influence);
  assert(result?.item,'Diagnostic native roll rejected: '+key);
  assert.equal(result.item.tier,price.tier);assert.equal(result.item.rarity,recipe.rarity);assert.equal(result.item.slot,recipe.slot);
  assert.equal(result.item.v013Trait||null,recipe.trait||null);
  assert.equal(state.fragments-result.fragments,price.fragments);assert.equal(crafting.essence-result.crafting.essence,price.essence);
  for(const f of C.FAMILIES)assert.equal(crafting.cores[f]-result.crafting.cores[f],price.reagents[f]||0);
  rows.push(Object.freeze({...result.item,id:'b32d5-research|'+key+'|'+i}));
 }
 cache.set(key,Object.freeze(rows));return cache.get(key);
}
function evaluate(a,p,item,allowed,base=null){
 const eq=a.state().equip,level=Math.max(1,a.controller().state.unlocked||1),baseline=base??AI.utility(a,p,eq,level);
 const rows=AI.gearTargets(item).filter(slot=>allowed(item,slot)).map(slot=>{
  const next=AI.projectGear(eq,item,slot);if(!next)return null;
  const gain=AI.utility(a,p,next,level)-baseline,minimum=AI.threshold(eq,next);
  assert(Number.isFinite(gain));return {slot,gain,minimum,upgrade:gain>=minimum};
 }).filter(Boolean).sort((x,y)=>Number(y.upgrade)-Number(x.upgrade)||y.gain-x.gain||x.slot.localeCompare(y.slot));
 return rows[0]||null;
}
function statistics(rows){
 assert(rows.length>0&&rows.every(x=>Number.isFinite(x.gain)));
 const wins=rows.filter(x=>x.upgrade),p=wins.length/rows.length;
 const slots={};for(const x of (wins.length?wins:rows))slots[x.slot]=(slots[x.slot]||0)+1;
 const slot=Object.keys(slots).sort((a,b)=>slots[b]-slots[a]||a.localeCompare(b))[0];
 return {slot,samples:rows.length,pUpgrade:p,meanGain:rows.reduce((s,x)=>s+x.gain,0)/rows.length,
  gain:wins.reduce((s,x)=>s+x.gain,0)/rows.length,expectedAttempts:p?1/p:null};
}
function forecast(a,p,recipe,level,influence,allowed){
 const eq=a.state().equip,currentLevel=Math.max(1,a.controller().state.unlocked||1),baseline=AI.utility(a,p,eq,currentLevel);
 const rows=samples(recipe,level,influence).map(item=>evaluate(a,p,item,allowed,baseline)).filter(Boolean);
 if(!rows.length)return null;
 assert.equal(rows.length,N,'Roll-dependent availability is not supported');
 const s=statistics(rows);return {...s,accepted:s.pUpgrade>=.25&&s.gain>=1};
}
module.exports={enabled,samples,evaluate,statistics,forecast,N};
