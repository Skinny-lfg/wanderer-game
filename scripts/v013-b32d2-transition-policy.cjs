'use strict';
// Camp-only bounded specialization package search. Visible owned stash only.
const assert=require('node:assert/strict'),AI=require('./v013-b32c-equipment-policy.cjs');
const ARMOR=['helm','armor','gloves','boots','belt'],TWO=new Set(['Bow','Two-Handed','Staff']);
const key=eq=>Object.keys(eq).sort().map(k=>k+':'+(eq[k]?.id||'')).join('|');
const preferred=(p,e)=>!!e?.weapon&&p.weapons.includes(e.weapon.subtype);
function search(a,p){
 if(!AI.transition(p)||!a.state().equip.weapon||!a.economyCanAct())return null;
 const s=a.state(),start={...s.equip},items=s.stash.filter(x=>x?.id&&x.slot),level=Math.max(1,a.controller().state.unlocked||1),baseline=AI.utility(a,p,start,level);
 const cap=a.storage.capacity(),occupied=a.storage.occupied(),cache=new Map(),bestByWeapon=new Map();
 function score(eq){const k=key(eq);if(!cache.has(k)){const v=AI.utility(a,p,eq,level);assert(Number.isFinite(v));cache.set(k,v);}return cache.get(k);}
 function append(plan,item,slot){
  if(plan.steps.some(x=>x.item.id===item.id||x.slot===slot))return null;
  const next=AI.projectGear(plan.next,item,slot);if(!next)return null;
  const displaced=Number(!!plan.next[slot])+Number(slot==='weapon'&&TWO.has(item.subtype)&&!!plan.next.offhand);
  const occ=plan.occ+displaced-1;if(occ>cap)return null;
  return {next,steps:[...plan.steps,{item,slot}],occ,score:score(next)};
 }
 const root={next:start,steps:[],occ:occupied,score:baseline};
 const cmp=(a,b)=>b.score-a.score||a.steps.length-b.steps.length||key(a.next).localeCompare(key(b.next));
 function record(plan){const w=plan.next.weapon.subtype;if(!preferred(p,plan.next))return;const old=bestByWeapon.get(w);if(!old||cmp(plan,old)<0)bestByWeapon.set(w,plan);}
 // Select the best two owned main weapons per intended subtype under the
 // current loadout. This bounds search; not an exhaustive optimizer.
 const main=[];
 for(const w of [...new Set(p.weapons)]){
  if(start.weapon.subtype===w)main.push(root);
  const options=items.filter(x=>x.subtype===w&&AI.targets(x).includes('weapon')).map(x=>append(root,x,'weapon')).filter(Boolean).sort(cmp);
  main.push(...options.slice(0,2));
 }
 for(const m of main){
  const hands=[m];
  if(!TWO.has(m.next.weapon.subtype)){
   const off=items.filter(x=>AI.targets(x).includes('offhand')).map(x=>append(m,x,'offhand')).filter(Boolean).sort(cmp);
   hands.push(...off.slice(0,2));
  }
  for(const hand of hands){
   record(hand);
   // One free mixed greedy pass and three class-specific passes. In a class
   // pass allow an intermediate negative gain to complete the owned set.
   for(const cls of [null,'Cloth','Leather','Plate']){
    let plan=hand;
    for(const slot of ARMOR){
     if(cls&&plan.next[slot]?.armorType===cls){
      const same=items.filter(x=>x.slot===slot&&x.armorType===cls).map(x=>append(plan,x,slot)).filter(Boolean).sort(cmp)[0];
      if(same&&same.score>plan.score)plan=same;
      continue;
     }
     const best=items.filter(x=>x.slot===slot&&(!cls||x.armorType===cls)).map(x=>append(plan,x,slot)).filter(Boolean).sort(cmp)[0];
     if(best&&(cls||best.score>plan.score))plan=best;
     record(plan);
    }
    record(plan);
   }
  }
 }
 const best=[...bestByWeapon.values()].sort(cmp)[0];
 if(!best)return {best:null,baseline,examined:cache.size,reserve:[],currentPreferred:preferred(p,start)};
 const minimum=AI.threshold(start,best.next);
 return {best:{...best,gain:best.score-baseline,minimum},baseline,examined:cache.size,reserve:best.steps.map(x=>x.item.id),currentPreferred:preferred(p,start)};
}
function retain(a,p,phase){
 if(!AI.transition(p))return new Set();
 const result=search(a,p),ids=new Set(result?.reserve||[]);
 AI.trace(p,{phase:'transition',kind:'reserve',when:phase,level:a.controller().state.unlocked,ids:[...ids],examined:result?.examined||0,preferred:result?.best?.next.weapon.subtype||null,gain:result?.best?.gain??null});
 return ids;
}
function execute(a,p){
 const actions=[],r=search(a,p);if(!r)return actions;const best=r.best,level=Math.max(1,a.controller().state.unlocked||1),start={...a.state().equip};
 AI.trace(p,{phase:'transition',kind:'candidate',level,from:start.weapon.subtype,to:best?.next.weapon.subtype||null,gain:best?.gain??null,minimum:best?.minimum??null,examined:r.examined,steps:best?.steps.map(({item,slot})=>({id:item.id,subtype:item.subtype,armorType:item.armorType||null,slot}))||[]});
 if(!best||!best.steps.length||best.gain<best.minimum)return actions;
 for(const {item,slot} of best.steps){
  const prior=a.state().equip[slot],weaponAtDecision=a.state().equip.weapon?.subtype||null;
  assert(a.state().stash.some(x=>x.id===item.id),'Transition item no longer owned');
  if(!a.equip(item.id,slot))throw Error('Native transition equip rejected '+item.id+'/'+slot);
  actions.push({slot,item:item.name,rarity:item.rarity,previous:prior?.name||null,gain:Math.round(best.gain*100)/100,subtype:item.subtype,trait:item.v013Trait||null,previousSubtype:prior?.subtype||null});
  AI.trace(p,{phase:'transition',kind:'transitionEquip',id:item.id,subtype:item.subtype,slot,weaponAtDecision,gain:best.gain});
 }
 const actual=AI.utility(a,p,a.state().equip,level)-r.baseline,match=key(a.state().equip)===key(best.next)&&Math.abs(actual-best.gain)<1e-6;
 AI.trace(p,{phase:'transition',kind:'transitionPlan',level,from:start.weapon.subtype,to:a.state().equip.weapon.subtype,gain:best.gain,actualGain:actual,minimum:best.minimum,steps:best.steps.length,projectionMatch:match});
 assert(match&&actual+1e-6>=best.minimum,'Native transition projection mismatch');
 return actions;
}
module.exports={search,retain,execute,key,preferred};
