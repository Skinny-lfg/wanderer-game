'use strict';
// Native item rolls only. Do not tune items or derived stats here.
const assert=require('node:assert/strict'),fs=require('node:fs'),create=require('../tests/v012-economy-harness.cjs'),S=require('./simulate-progression.cjs'),G=require('../economy/v013-gear-rolls.js');
const N=100,TIERS=[1,10,50,100],RARITIES=['Common','Uncommon','Rare','Epic','Legendary'];
const W=['Sword','Mace','Daggers','Bow','Two-Handed','Wand','Staff'],O=['Shield','Off-Hand Dagger','Orb','Tome','Charm'];
const LOADOUTS=[['Sword+Shield','Sword','Shield'],['Sword+Dagger','Sword','Off-Hand Dagger'],['Mace+Shield','Mace','Shield'],['Mace+Dagger','Mace','Off-Hand Dagger'],['Dual Daggers','Daggers','Off-Hand Dagger'],['Bow','Bow',null],['Two-Handed','Two-Handed',null],['Wand+Orb','Wand','Orb'],['Wand+Tome','Wand','Tome'],['Staff','Staff',null]];
const n=(x,k)=>Number(x?.[k])||0;
const fields=['tier','v013Budget','v013StatCount',...G.KEYS];
const snap=x=>Object.fromEntries(fields.map(k=>[k,n(x,k)]));
const contrib=(x,f=1)=>({AP:f*(n(x,'atk')+1.8*n(x,'str')+.4*n(x,'agi')),SP:f*(n(x,'spell')+1.9*n(x,'int'))});
const summary=rows=>Object.fromEntries(Object.keys(rows[0]).map(k=>{const values=rows.map(r=>r[k]).sort((a,b)=>a-b);return [k,{mean:values.reduce((n,x)=>n+x,0)/values.length,min:values[0],max:values.at(-1),p10:values[Math.floor(.1*(values.length-1))],p90:values[Math.floor(.9*(values.length-1))]}];}));
function itemRow(x){return {...snap(x),...contrib(x),weightedBudget:G.KEYS.reduce((a,k)=>a+n(x,k)*G.COST[k],0)};}
function loadout(w,o){
 const x=contrib(w),y=contrib(o,o?.subtype==='Off-Hand Dagger'?.5:1);
 return {AP:x.AP+y.AP,SP:x.SP+y.SP,rawAtk:n(w,'atk')+n(o,'atk')*(o?.subtype==='Off-Hand Dagger'?.5:1),rawSpell:n(w,'spell')+n(o,'spell')*(o?.subtype==='Off-Hand Dagger'?.5:1),budget:n(w,'v013Budget')+n(o,'v013Budget'),HP:n(w,'hp')+n(o,'hp'),def:n(w,'def')+n(o,'def'),mana:n(w,'mana')+n(o,'mana'),manaRegen:n(w,'manaRegenBonus')+n(o,'manaRegenBonus')};
}
function main(){
 const cells=TIERS.flatMap(tier=>RARITIES.map(rarity=>({tier,rarity,items:Object.fromEntries([...W,...O].map(k=>[k,[]])),loadouts:Object.fromEntries(LOADOUTS.map(([id])=>[id,[]]))})));
 let rolls=0;
 for(let i=0;i<N;i++){
  const a=create(101600001+i*127);
  for(const c of cells){
   const items={};
   for(const [slot,types] of [['weapon',W],['offhand',O]])for(const subtype of types){
    const x=a.makeItem(c.tier,slot,null,'loot',subtype,c.rarity);assert.equal(x.subtype,subtype);assert.equal(x.rarity,c.rarity);assert.equal(x.slot,slot);assert(n(x,'v013Budget')>0);items[subtype]=x;c.items[subtype].push(itemRow(x));rolls++;
   }
   for(const subtype of [...W,...O]){assert.equal(items[subtype].tier,items.Sword.tier,'Tier mismatch');assert.equal(items[subtype].v013Budget,items.Sword.v013Budget,'Budget differs by subtype');}
   for(const [id,w,o] of LOADOUTS)c.loadouts[id].push(loadout(items[w],o?items[o]:null));
  }
 }
 assert.equal(rolls,24000);
 const results=cells.map(c=>({requestedTier:c.tier,rarity:c.rarity,n:N,items:Object.fromEntries(Object.entries(c.items).map(([k,rs])=>[k,summary(rs)])),loadouts:Object.fromEntries(Object.entries(c.loadouts).map(([k,rs])=>[k,summary(rs)]))}));
 const report={commit:process.env.GITHUB_SHA||null,source:S.sourceFingerprint().sha256,rolls,tiers:TIERS,rarities:RARITIES,n:N,results,scope:'Native loot items, same requested tier/rarity; AP/SP are marginal hand-slot contributions before base stats, rounding, active mana/SP gating, Cloth, talents and combat modifiers; no combat multiplier included. Independent native item rolls, not identical affixes. Nominal budget and realized weighted budget reported separately.'};
 fs.mkdirSync('reports/b31d',{recursive:true});fs.writeFileSync('reports/b31d/gear-budget.json',JSON.stringify(report,null,2));
 for(const r of results)if(r.requestedTier===10&&['Common','Rare','Legendary'].includes(r.rarity)){
  console.log('B31D_GEAR='+JSON.stringify({tier:r.requestedTier,rarity:r.rarity,n:r.n,items:Object.fromEntries(Object.entries(r.items).map(([k,x])=>[k,{tier:x.tier.mean,budget:x.v013Budget.mean,atk:x.atk.mean,spell:x.spell.mean,AP:x.AP.mean,SP:x.SP.mean,weightedBudget:x.weightedBudget.mean}])),loadouts:Object.fromEntries(Object.entries(r.loadouts).map(([k,x])=>[k,{budget:x.budget.mean,AP:x.AP.mean,SP:x.SP.mean,rawAtk:x.rawAtk.mean,rawSpell:x.rawSpell.mean}]))}));
 }
 console.log('B31D_GEAR_OVERVIEW='+JSON.stringify({rolls,tiers:TIERS,rarities:RARITIES,n:N,equalNominalBudget:true}));
}
main();
