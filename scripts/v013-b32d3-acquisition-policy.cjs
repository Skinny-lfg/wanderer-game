'use strict';
// Research-only acquisition policy. No use of native future RNG.
const AI=require('./v013-b32c-equipment-policy.cjs'),T=require('./v013-b32d2-transition-policy.cjs'),assert=require('node:assert/strict');
const ARMOR=['helm','armor','gloves','boots','belt'],TWO=new Set(['Bow','Staff','Two-Handed']),memory=new WeakMap();
const risk=p=>['b32d3-risk','b32d3-strategic'].includes(p?.equipmentIntelligence),strategic=p=>p?.equipmentIntelligence==='b32d3-strategic';
function context(a,p){
 if(!risk(p))return null;
 const eq=a.state().equip,level=Math.max(1,a.controller().state.unlocked||1),baseline=AI.utility(a,p,eq,level);
 const preferred=strategic(p)?T.search(a,p)?.best||null:null;
 return {eq,level,baseline,preferred,items:a.state().stash.filter(x=>x?.id&&x.slot)};
}
function category(item,slot){return item.rarity+'|'+(ARMOR.includes(slot)?'armor':['ring1','ring2','amulet'].includes(slot)?'accessory':slot);}
function history(a){if(!memory.has(a))memory.set(a,new Map());return memory.get(a);}
function penalty(a,item,slot){const v=history(a).get(category(item,slot))||{n:0,sum:0};return Math.max(0,Math.min(15,(8+v.sum)/(4+v.n)));}
function learn(a,item,slot,predicted,actual){
 if(!Number.isFinite(predicted)||!Number.isFinite(actual))return;
 const k=category(item,slot),h=history(a),v=h.get(k)||{n:0,sum:0};v.n++;v.sum+=Math.max(-20,Math.min(20,predicted-actual));h.set(k,v);
}
function value(a,p,item,slot,immediate,c,phase){
 if(!c||!risk(p)||!Number.isFinite(immediate))return {gain:immediate,immediate,raw:immediate,strategicGain:null,penalty:0};
 const {eq,level,baseline,preferred,items}=c;
 let raw=immediate,strategicGain=null;
 // Accessories retain their actual immediate utility; do not artificially
 // penalize a good ring. Only weapon/armor complements receive extra credit.
 if(strategic(p)&&(slot==='weapon'||slot==='offhand'||ARMOR.includes(slot))){
  const score=e=>AI.utility(a,p,e,level),project=(e,it,k)=>AI.projectGear(e,it,k);
  const candidates=[];
  if(preferred){
   const next=project(preferred.next,item,slot);
   if(next&&p.weapons.includes(next.weapon.subtype))candidates.push(score(next));
  }
  if(slot==='weapon'&&p.weapons.includes(item.subtype)){
   const next=project(eq,item,slot);
   if(next){
    let best=next,bestScore=score(next);
    // Compare the offered main with armor already owned, not hypothetical loot.
    // Greedy pass restricted to preferred class; mixed alternatives remain legal.
    for(const k of ARMOR){
     const choices=items.filter(x=>x.slot===k&&x.armorType===p.armor).map(x=>project(best,x,k)).filter(Boolean);
     for(const q of choices){const v=score(q);if(v>bestScore){best=q;bestScore=v;}}
    }
    if(!TWO.has(best.weapon.subtype)){
     for(const off of items.filter(x=>AI.targets(x).includes('offhand'))){const q=project(best,off,'offhand');if(q){const v=score(q);if(v>bestScore){best=q;bestScore=v;}}}
    }
    candidates.push(bestScore);
   }
  }
  if(candidates.length){
   const target=Math.max(...candidates);
   // Credit the marginal gain over best owned package, discount packages still
   // weaker than current equipment, and bound the option value to 8 points.
   const own=preferred?.score??baseline;
   const marginal=target-own,shortfall=Math.max(0,baseline-target);
   strategicGain=Math.max(0,Math.min(8,marginal*.65-shortfall*.5));
   raw=Math.max(immediate,Math.min(12,Math.max(0,immediate)+strategicGain));
  }
 }
 const discount=phase==='forge'?penalty(a,item,slot):0,gain=raw-discount;
 assert(Number.isFinite(gain));
 return {gain,immediate,raw,strategicGain,penalty:discount};
}
module.exports={risk,strategic,context,value,learn,penalty};
