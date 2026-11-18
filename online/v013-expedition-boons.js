// Wanderer v0.13 Stage 6 — deterministic, expedition-only Boons.
// All numbers and names come from the immutable Stage 0 catalogue.
// This module never writes permanent talents, gear or account state.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation;
if(!F)throw Error('Stage 6 Boons require the Stage 0 foundation');
const CATALOG=F.CATALOG.boons;
const get=id=>F.lookup('boons',id);
const GUIDE=Object.freeze({
 blood_tribute:{icon:'🩸',benefit:'Damage over time +20%',cost:'Direct damage −10%'},
 predators_focus:{icon:'🎯',benefit:'Single-target damage +15%',cost:'Area damage −10%'},
 bastion_oath:{icon:'🛡',benefit:'Damage taken −12%',cost:'Attack speed −10%'},
 aetherbound_pact:{icon:'✦',benefit:'Spell Power +18%',cost:'Mana costs +20%'},
 rotbound_echo:{icon:'☠',benefit:'First enemy death with a DoT spreads its strongest effect to up to 2 enemies at 30% strength (once per encounter)',cost:'Direct damage −10%'},
 wayfarers_bargain:{icon:'🧭',benefit:'+1 travel step',cost:'Maximum Health −10%'}
});
function shuffle(items,random){
 const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
function familiesFor(build,permanent){
 const families=new Set();
 for(const f of [...(build?.unlockedFamilies||[]),...(build?.families||[])])if(F.AFFINITIES.includes(f))families.add(f);
 for(const id of permanent?.nodes||[]){
  if(typeof id!=='string')continue;
  const match=/^(?:root|affinity)_([a-z]+)$/.exec(id);
  if(match&&F.AFFINITIES.includes(match[1]))families.add(match[1]);
 }
 return [...families].sort();
}
function offer(seed,realmId,round,families=[],chosen=[]){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||typeof realmId!=='string'||!/^[a-z0-9_-]+$/.test(realmId)||
   ![0,1].includes(round)||!Array.isArray(families)||new Set(families).size!==families.length||
   families.some(f=>!F.AFFINITIES.includes(f))||!Array.isArray(chosen)||chosen.length!==round||
   new Set(chosen).size!==chosen.length||chosen.length>1||chosen.some(id=>!get(id)))throw Error('Invalid Boon offer input');
 const available=CATALOG.filter(b=>!chosen.includes(b.id)),random=F.rng(seed,'boons_v1_'+realmId+'_'+round);
 if(available.length<3)throw Error('Insufficient unique Boons');
 const matches=shuffle(available.filter(b=>b.families.some(f=>families.includes(f))&&b.id!=='wayfarers_bargain'),random);
 const first=matches[0]||available.find(b=>b.id==='wayfarers_bargain')||available[0];
 const rest=shuffle(available.filter(b=>b.id!==first.id),random);
 return [first,...rest.slice(0,2)].map(b=>b.id);
}
// The two Shrines replace existing combat rooms; topology and all edges remain intact.
const WINDOWS=Object.freeze([[4,5,6],[9,10,11,12]]);
const FALLBACK=Object.freeze([[7,8],[13,14,15,16]]);
function placeShrines(card,seed){
 if(!card?.nodes||!F.DIFFICULTIES[card.risk]||!Number.isInteger(seed)||seed<0||seed>0xffffffff||
    card.boonShrines!==undefined)throw Error('Invalid Boon Shrine map');
 const chosen=[];
 for(let round=0;round<2;round++){
  const find=slots=>slots.filter(id=>card.nodes[id]?.kind==='combat'&&id!==card.clueRoom&&
    !chosen.includes(id));
  const candidates=find(WINDOWS[round]),pool=candidates.length?candidates:find(FALLBACK[round]);
  if(!pool.length)throw Error('No room for Boon Shrine');
  const random=F.rng(seed,'boon_shrine_v1_'+card.id+'_'+round);
  const room=pool[Math.floor(random()*pool.length)];
  card.nodes[room].kind='shrine';chosen.push(room);
 }
 card.boonShrines=chosen;
 return [...chosen];
}
function validateTopology(card,seed){
 if(!card||!Array.isArray(card.boonShrines)||card.boonShrines.length!==2||
    new Set(card.boonShrines).size!==2||
    card.boonShrines.some(id=>card.nodes[id]?.kind!=='shrine'||card.nodes[id]?.event!==null||card.nodes[id]?.traitId!==undefined)||
    card.nodes.some((n,i)=>n.kind==='shrine'&&!card.boonShrines.includes(i)))return false;
 try{
  const reference=JSON.parse(JSON.stringify(card));
  delete reference.boonShrines;
  for(const id of card.boonShrines)reference.nodes[id].kind='combat';
  return JSON.stringify(placeShrines(reference,seed))===JSON.stringify(card.boonShrines);
 }catch{return false;}
}
function resolutions(state){
 return (state?.decisions||[]).filter(a=>a.type==='choose_boon'||a.type==='skip_boon');
}
function validateOffer(d,game){
 if(!d?.realm)return d?.boonOffer===undefined;
 const card=d.cards?.find(c=>c.id===d.realm),s=d.foundationState;
 if(!card||!s||!validateTopology(card,d.foundationManifest?.seed))return false;
 const done=resolutions(s),seen=new Set(),chosen=[],manifest=d.foundationManifest;
 if(done.length>2)return false;
 for(const a of done){
  const round=card.boonShrines.indexOf(a.room);
  if(round<0||seen.has(a.room)||!d.cleared.includes(a.room)||!d.visited.includes(a.room))return false;
  seen.add(a.room);
  if(a.type==='choose_boon'){
   if(!Array.isArray(a.families)||new Set(a.families).size!==a.families.length||
      a.families.some(f=>!F.AFFINITIES.includes(f))||chosen.includes(a.id))return false;
   try{if(!offer(manifest.seed,d.realm,round,a.families,chosen).includes(a.id))return false;}catch{return false;}
   chosen.push(a.id);
  }
 }
 if(JSON.stringify(chosen)!==JSON.stringify(s.boonIds))return false;
 const o=d.boonOffer;
 if(o){
  if(!Number.isInteger(o.round)||o.round<0||o.round>1||
     o.room!==card.boonShrines[o.round]||seen.has(o.room)||!d.cleared.includes(o.room)||
     !d.visited.includes(o.room)||d.current!==o.room||game?.stage!=='choice'||
     game?.selected!==null||game?.rewardPending||!Array.isArray(o.ids)||o.ids.length!==3||
     !Array.isArray(o.families)||new Set(o.families).size!==o.families.length||
     o.families.some(f=>!F.AFFINITIES.includes(f))||
     d.contractOffer)return false;
  try{if(JSON.stringify(o.ids)!==JSON.stringify(offer(manifest.seed,d.realm,o.round,o.families,chosen)))return false;}
  catch{return false;}
 }
 return card.boonShrines.every(room=>!d.cleared.includes(room)||seen.has(room)||o?.room===room);
}
function ids(run){return Array.isArray(run?.boonIds)?run.boonIds:[];}
function has(run,id){return ids(run).includes(id);}
function factor(run,area=false){
 let f=1;
 if(has(run,'blood_tribute'))f*=get('blood_tribute').params.directDamageMult;
 if(has(run,'rotbound_echo'))f*=get('rotbound_echo').params.directDamageMult;
 if(has(run,'predators_focus'))f*=area?get('predators_focus').params.areaDamageMult:get('predators_focus').params.singleTargetDamageMult;
 return f;
}
function dotFactor(run){return has(run,'blood_tribute')?get('blood_tribute').params.dotDamageMult:1;}
function takenFactor(run){return has(run,'bastion_oath')?get('bastion_oath').params.damageTakenMult:1;}
function speedFactor(run){return has(run,'bastion_oath')?get('bastion_oath').params.attackSpeedMult:1;}
function costFactor(run){return has(run,'aetherbound_pact')?get('aetherbound_pact').params.manaCostMult:1;}
function stats(raw,boonIds=[]){
 if(!raw||!Number.isFinite(raw.maxhp))throw Error('Invalid Boon stats');
 const next={...raw};
 if(boonIds.includes('aetherbound_pact'))next.spellPower=Math.max(0,Math.round((raw.spellPower||0)*get('aetherbound_pact').params.spellPowerMult));
 if(boonIds.includes('wayfarers_bargain'))next.maxhp=Math.max(1,Math.round(raw.maxhp*get('wayfarers_bargain').params.maxHpMult));
 return next;
}
function stepsAdded(id){return id==='wayfarers_bargain'?get(id).params.extraSteps:0;}
function spreadOnDeath(run,fallen,synchronize){
 if(!has(run,'rotbound_echo')||run.boonRotboundTriggers||!fallen||fallen.hp>0)return 0;
 const living=[...(run.enemies||[]),...(run.groupReserve||[])].filter(e=>e&&e!==fallen&&e.hp>0).slice(0,2);
 if(!living.length)return 0;
 const candidates=[];
 for(const kind of ['bleed','burn'])for(const dot of fallen.dots?.[kind]||[])if(dot?.damage>0&&dot.remaining>0)candidates.push({kind,dot});
 for(const dot of fallen.v012Rot||[])if(dot?.damage>0&&dot.remaining>0)candidates.push({kind:'rot',dot});
 candidates.sort((a,b)=>b.dot.damage-a.dot.damage||a.kind.localeCompare(b.kind));
 if(!candidates.length)return 0;
 const {kind,dot}=candidates[0],scale=get('rotbound_echo').params.firstDeathDotSpreadPotency;
 const potency=Math.max(1,Math.round(dot.damage*scale)),duration=Math.min(2,Math.max(1,Math.floor(dot.remaining)));
 let count=0;
 for(const enemy of living){
  if(kind==='rot'){enemy.v012Rot??=[];if(enemy.v012Rot.length>=6)continue;enemy.v012Rot.push({damage:potency,remaining:duration,ticks:0,spread:true,boon:true});}
  else{enemy.dots??={};enemy.dots[kind]??=[];if(enemy.dots[kind].length>=12)continue;enemy.dots[kind].push({damage:potency,remaining:duration,spread:true,boon:true});synchronize?.(enemy);}
  count++;
 }
 if(count)run.boonRotboundTriggers=1;
 return count;
}
const API=Object.freeze({CATALOG,GUIDE,get,familiesFor,offer,placeShrines,validateTopology,resolutions,validateOffer,has,factor,dotFactor,takenFactor,speedFactor,costFactor,stats,stepsAdded,spreadOnDeath});
root.WandererV013ExpeditionBoons=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
