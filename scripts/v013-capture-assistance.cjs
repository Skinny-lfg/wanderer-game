'use strict';
// Simulator-only cohort policy. Never loaded by the game or native E10 replays.
const ASSISTED=Object.freeze({mode:'assisted',through:9,hp:.7,attack:.7});
const NATURAL=Object.freeze({mode:'natural',through:0,hp:1,attack:1});
function policy(mode='natural'){
 if(mode==='assisted')return ASSISTED;
 if(mode==='natural')return NATURAL;
 throw Error('Unknown capture cohort '+mode);
}
function createScaler(level,mode='natural'){
 if(!Number.isInteger(level)||level<1)throw Error('Invalid Expedition');
 const p=policy(mode),active=level<=p.through,seen=new WeakSet();
 const metrics={mode:p.mode,level,active,hpFactor:active?p.hp:1,attackFactor:active?p.attack:1,scaledActors:0};
 function apply(run){
  if(!active)return;
  const roster=new Set([...(run.enemies||[]),...(run.groupReserve||[]),run.enemy,run.encounterLeader].filter(Boolean));
  for(const e of roster){
   if(seen.has(e)||!(e.hp>0)||!(e.maxhp>0))continue;
   seen.add(e);
   const max=e.maxhp,ratio=Math.min(1,e.hp/max);
   e.maxhp=Math.max(1,Math.round(max*p.hp));e.hp=Math.max(1,Math.round(e.maxhp*ratio));
   if(Number.isFinite(e.atk))e.atk=Math.max(1,Math.round(e.atk*p.attack));
   if(Number.isFinite(e.baseAtk))e.baseAtk=Math.max(1,Math.round(e.baseAtk*p.attack));
   metrics.scaledActors++;
  }
 }
 return {apply,metrics};
}
module.exports={policy,createScaler};
