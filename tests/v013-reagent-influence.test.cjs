'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../economy/v013-gear-rolls.js');require('../economy/v013-crafting.js');
const G=globalThis.WandererV013GearRolls,C=globalThis.WandererV013Crafting,create=require('./v012-economy-harness.cjs');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function profile(r){return {slot:r.slot,subtype:r.subtype,rarity:r.rarity,...(['Cloth','Leather','Plate'].includes(r.subtype)?{armorType:r.subtype}:{})};}
test('R3 every recipe exposes only legal optional influences; exact additional cost and merged family payment',()=>{
 for(const r of C.RECIPES){
  const options=C.influenceOptions(r.id),base=C.cost(r.id,60);
  if(r.rarity==='Uncommon'){assert.equal(options.length,0);assert.throws(()=>C.cost(r.id,60,'blood'));continue;}
  assert(options.length>0,r.id);
  for(const x of options){assert(x.keys.length);assert.equal(x.amount,r.rarity==='Rare'?1:2);
   const p=C.cost(r.id,60,x.family);assert.equal(p.fragments,base.fragments);assert.equal(p.essence,base.essence);
   assert.equal(p.reagents[x.family],(base.reagents[x.family]||0)+x.amount);
   for(const f of C.FAMILIES.filter(f=>f!==x.family))assert.equal(p.reagents[f],base.reagents[f]);
   const spec=G.profileFor(profile(r));assert(x.keys.every(k=>k!==spec.main&&[...spec.attrs.map(a=>a[0]),...spec.extras].includes(k)||!spec.main));
  }
 }
 assert(!C.influenceOptions('blue_staff').some(x=>x.family==='blood'||x.family==='decay'),'no paid influence for mandatory spell power or illegal attack');
});
test('native craft and preview: optional costs are atomic, RNG/IDs unaffected by preview, no unsupported focus',()=>{
 const a=create(931,undefined,{}, {skipPersistence:true,now:1700000000000}),b=create(931,undefined,{}, {skipPersistence:true,now:1700000000000}),s=a.state(),id='blue_ring1_arcane',family='arcane',price=C.cost(id,1,family);
 s.crafting=C.discover(C.create(),id);s.crafting.essence=price.essence;s.fragments=price.fragments;
 for(const [f,n] of Object.entries(price.reagents))s.crafting.cores[f]=n;
 const before=JSON.stringify(s),preview=a.forge.preview(id,1,family);assert(preview);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(JSON.parse(JSON.stringify(a.makeItem(5,'weapon',null,'loot','Sword','Rare'))),JSON.parse(JSON.stringify(b.makeItem(5,'weapon',null,'loot','Sword','Rare'))));
 s.crafting.cores.arcane--;const short=JSON.stringify(s);assert.equal(a.forge.craft(id,1,family),null);assert.equal(JSON.stringify(s),short);
 assert.equal(a.forge.craft(id,1,'invalid'),null);s.crafting.cores.arcane++;
 const item=a.forge.craft(id,1,family);assert(item);assert.equal(item.rarity,'Rare');assert.equal(item.v013Budget,preview.v013Budget);assert.equal(s.fragments,0);assert.equal(s.crafting.essence,0);
 assert(C.FAMILIES.every(f=>s.crafting.cores[f]===0));
 assert.throws(()=>a.makeItem(1,'weapon',null,'loot','Sword','Rare',false,'blood'),/Forge only/);
});
test('controlled seeded affix sample demonstrates relative weighting, never guarantees preferred attributes',()=>{
 const r=C.RECIPES.find(r=>r.id==='blue_ring1_arcane'),p=profile(r),sample=family=>{const random=rng(731);return Array.from({length:1200},()=>G.apply({...p},30,random,family));};
 for(const family of C.FAMILIES){
  const keys=G.influenceKeys(p,family),plain=sample(null),biased=sample(family),hits=xs=>xs.filter(i=>i.affixes.some(k=>keys.includes(k))).length;
  assert(hits(biased)>hits(plain),family+' '+hits(biased)+' vs '+hits(plain));
  assert(hits(biased)<biased.length,family+' must remain random');
  for(let i=0;i<plain.length;i++){assert.equal(plain[i].v013Budget,biased[i].v013Budget);assert.equal(plain[i].v013StatCount,biased[i].v013StatCount);}
  console.log('INFLUENCE '+family+' '+hits(plain)+'/1200 -> '+hits(biased)+'/1200');
 }
});
test('all supported focused rolls retain mandatory affixes, caps and original legal pools',()=>{
 for(const r of C.RECIPES.filter(r=>r.rarity!=='Uncommon'))for(const x of C.influenceOptions(r.id)){
  const p=profile(r),spec=G.profileFor(p),random=rng(34217);
  for(let n=0;n<12;n++){
   const item=G.apply({...p},120,random,x.family);
   if(spec.main)assert.equal(item.affixes[0],spec.main);
   assert.equal(new Set(item.affixes).size,item.affixes.length);
   for(const k of item.affixes)assert(k===spec.main||spec.attrs.some(([a])=>a===k)||spec.extras.includes(k),r.id+' '+k);
   for(const [k,caps] of Object.entries(G.SECONDARY_CAPS))assert((item[k]||0)<=caps[r.rarity]+1e-8,r.id+' '+k);
   if(['Staff','Wand'].includes(p.subtype))assert.equal(item.atk,0);
  }
 }
 for(const p of ['economy/v013-gear-rolls.js','economy/v013-crafting.js','economy/v012-equipment-runtime.js'])assert.equal(fs.readFileSync(p,'utf8'),fs.readFileSync('docs/'+p,'utf8'));
});
