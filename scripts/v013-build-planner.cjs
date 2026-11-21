'use strict';
// Stage 6.8: game-catalog-aware, independent agent build planning.
// Pure analysis using the live TalentGraph v15 API; never creates account XP,
// items, unlocks, or changes gameplay. Execution uses real Camp actions.
const ALL_FAMILIES=Object.freeze(['blood','fury','vitality','aegis','magic','decay']);
const BUILDS=Object.freeze({
 'blood-pure':{primary:'blood',model:'pure',weapons:['Sword','Two-Handed'],armor:'Leather',milestones:['blood_harvest','crimson_feast','heart_of_carnage'],focus:'bleed'},
 'blood-fury':{primary:'blood',secondary:'fury',secondAt:12,model:'two',mix:true,weapons:['Sword','Two-Handed'],armor:'Leather',milestones:['blood_harvest','crimson_rush','reapers_cadence'],focus:'bleed'},
 'blood-fury-vitality':{primary:'blood',secondary:'fury',third:'vitality',secondAt:12,thirdAt:28,model:'adaptive',mix:true,weapons:['Sword','Two-Handed'],armor:'Leather',milestones:['blood_harvest','crimson_rush','fervent_life','reapers_cadence'],focus:'bleed'},
 'fury-blood-aegis':{primary:'fury',secondary:'blood',third:'aegis',secondAt:12,thirdAt:30,model:'adaptive',mix:true,weapons:['Daggers','Bow'],armor:'Leather',milestones:['battle_tempo','crimson_rush','relentless_assault'],focus:'speed'},
 'fury-pure':{primary:'fury',model:'pure',weapons:['Daggers','Bow'],armor:'Leather',milestones:['battle_tempo','relentless_assault','unchained_fury'],focus:'speed'},
 'magic-arcane-pure':{primary:'magic',model:'pure',element:'arcane',weapons:['Wand','Staff'],armor:'Cloth',milestones:['arcane_resonance','arcane_surge','arcane_mastery'],focus:'spell'},
 'magic-fire-aegis':{primary:'magic',secondary:'aegis',secondAt:14,model:'two',mix:true,element:'fire',weapons:['Wand','Staff'],armor:'Cloth',milestones:['kindling','runic_shield','fire_spread','arcane_bastion'],focus:'spell'},
 'magic-frost-vitality':{primary:'magic',secondary:'vitality',secondAt:14,model:'two',mix:false,element:'frost',weapons:['Staff','Wand'],armor:'Cloth',milestones:['deep_winter','frost_spread','living_recovery'],focus:'spell'},
 'magic-lightning-pure':{primary:'magic',model:'pure',element:'lightning',weapons:['Staff','Wand'],armor:'Cloth',milestones:['overcharge','storm_mastery','chain_discharge'],focus:'spell'},
 'decay-magic-aegis':{primary:'decay',secondary:'magic',third:'aegis',secondAt:13,thirdAt:29,model:'three',mix:true,element:'arcane',weapons:['Wand','Sword'],armor:'Leather',milestones:['lingering_rot','hex_bolt','elemental_blight','grave_bloom'],focus:'rot'},
 'aegis-vitality':{primary:'aegis',secondary:'vitality',secondAt:13,model:'two',mix:true,weapons:['Mace','Sword'],armor:'Plate',milestones:['steadfast_guard','sanctuary','guardians_oath','last_bastion'],focus:'defense'},
 'vitality-pure':{primary:'vitality',model:'pure',weapons:['Mace','Sword'],armor:'Plate',milestones:['living_recovery','overflowing_life','heart_of_the_wild'],focus:'defense'},
 // Controlled weapon and potion-preparation preferences. All share the
 // SAME legal talent plans; no loadout is granted, dropped or forced.
 'blood-sword':{primary:'blood',model:'pure',weapons:['Sword'],armor:'Leather',milestones:['blood_harvest','crimson_feast','heart_of_carnage'],focus:'bleed'},
 'blood-two-handed':{primary:'blood',model:'pure',weapons:['Two-Handed'],armor:'Leather',milestones:['blood_harvest','crimson_feast','heart_of_carnage'],focus:'bleed'},
 'fury-daggers':{primary:'fury',model:'pure',weapons:['Daggers'],armor:'Leather',milestones:['battle_tempo','relentless_assault','unchained_fury'],focus:'speed'},
 'fury-bow':{primary:'fury',model:'pure',weapons:['Bow'],armor:'Leather',milestones:['battle_tempo','relentless_assault','unchained_fury'],focus:'speed'},
 'magic-wand':{primary:'magic',model:'pure',element:'arcane',weapons:['Wand'],armor:'Cloth',milestones:['arcane_resonance','arcane_surge','arcane_mastery'],focus:'spell'},
 'magic-staff':{primary:'magic',model:'pure',element:'arcane',weapons:['Staff'],armor:'Cloth',milestones:['arcane_resonance','arcane_surge','arcane_mastery'],focus:'spell'},
 'magic-wand-offense':{primary:'magic',model:'pure',element:'arcane',weapons:['Wand'],armor:'Cloth',milestones:['arcane_resonance','arcane_surge','arcane_mastery'],focus:'spell',potionPolicy:'offense'},
 'magic-wand-defense':{primary:'magic',model:'pure',element:'arcane',weapons:['Wand'],armor:'Cloth',milestones:['arcane_resonance','arcane_surge','arcane_mastery'],focus:'spell',potionPolicy:'defense'}
});
const OPENING_SKILLS=Object.freeze({blood:'bleeding_edge',fury:'quick_hands',
 vitality:'strong_heart',aegis:'guarded_block',magic:'arcane_focus',decay:'toxic_touch'});
function getPlan(id){if(!Object.hasOwn(BUILDS,id))throw Error('Unknown strategic agent build '+id);return BUILDS[id];}
function pressure(history=[]){
 const recent=history.slice(-3),fights=recent.flatMap(t=>t.rooms||[]).filter(f=>f?.hpMax>0);
 const deaths=recent.filter(t=>t.status==='defeat').length;
 const hardFights=fights.filter(f=>f.died||f.minHpPct<35||f.damageTaken>f.hpMax*.60).length;
 const hurt=fights.filter(f=>f.hpStart>f.hpEnd&&((f.hpStart-f.hpEnd)/f.hpMax)>.40).length;
 return {deaths,fights:fights.length,hardFights,hurt,
  needsSurvival:deaths>=1||hardFights>=2||fights.length>=3&&hurt/fights.length>=.45};
}
function activeFamilies(plan,earned,history=[]){
 const wanted=[plan.primary],p=pressure(history);
 if(plan.secondary&&earned>=(plan.secondAt||12))wanted.push(plan.secondary);
 if(plan.third&&earned>=(plan.thirdAt||28)&&
  (plan.model==='three'||plan.model==='adaptive'&&p.needsSurvival))wanted.push(plan.third);
 return {families:wanted,pressure:p};
}
const bases=nodes=>new Map(nodes.map(n=>[n.id,n]));
const nodeId=id=>id?.replace(/_rank\d+$/,'');
function ownedSet(progress){return new Set((progress.nodes||[]).map(nodeId));}
function excludes(node,owned,graph){
 if(!node)return true;
 if(node.excludes?.some(id=>owned.has(id)))return true;
 for(const id of owned){if(graph.get(id)?.excludes?.includes(node.id))return true;}
 return false;
}
function usable(n,active,mode){return !!n&&(!n.family||active.includes(n.family))&&
 (!n.element||n.element===mode)&&(!n.pair||n.pair.every(f=>active.includes(f)))&&
 (!n.kind||n.kind!=='mixed'||n.pair?.every(f=>active.includes(f)));}
function scoreNode(n,plan,active,context={}){
 const p=plan.primary,s=plan.secondary,mode=plan.element||'arcane',focus=plan.focus;
 let score=n.family===p?4:n.family===s?2.8:1.6;
 if(n.kind==='affinity')return score+20;
 if(n.kind==='choice')return n.id==='element_choice'&&active.includes('magic')?19:-200;
 if(n.kind==='focused')score+=11+(n.tier||1)*1.1;
 else if(n.kind==='mixed')score+=plan.mix?13+(n.tier||1)*1.3:-12;
 else if(n.kind==='element')score+=9+(n.tier||1);
 else if(n.kind==='basic')score+=9.5+(n.tier||1);
 else if(n.kind==='stat')score+=2.2+(n.tier||1)*.55;
 const ability=n.description||'';
 if(focus==='spell'||focus==='rot'){
  score+=(n.flatSpell||0)*1.9+(n.flatRegen||0)*13+(n.flatMana||0)*.65+(n.spell||0)*30;
  if(/Mana|Spell|Arcane|Rot|cast|Intellect/i.test(ability))score+=2.5;
  if(/Attack Power|Strength|Endurance/i.test(ability))score-=1;
  if(n.attribute==='int')score+=3.1;
 }
 if(focus==='bleed'||focus==='speed'){
  score+=(n.flatAttack||0)*1.8+(n.flatSpeed||0)*65+(n.attack||0)*30;
  if(/Bleed|Sunder|attack speed|Attack Power|Strength|Agility|critical/i.test(ability))score+=2.6;
  if(n.attribute==='str'||n.attribute==='agi')score+=3;
 }
 if(focus==='defense'||active.includes('aegis')||active.includes('vitality')){
  score+=(n.flatLife||0)*.35+(n.flatArmor||0)*1.2+(n.startBarrier||0)*1.5+
   (n.healthRegen||0)*1200;
  if(/Barrier|Defense|Regenerat|Health|Endurance|block/i.test(ability))score+=2.4;
  if(n.attribute==='end')score+=3;
 }
 // Strategically important eventual skills, not a random walk down graph order.
 const rank=(plan.milestones||[]).indexOf(n.id);
 if(rank>=0)score+=8-Math.min(5,rank);
 if(n.gateFor&&plan.milestones?.includes(n.gateFor))score+=1.5;
 if(n.kind==='stat'&&n.id.startsWith('outer_')&&!plan.mix)score-=3;
 if(n.gateFor&&!plan.milestones?.includes(n.gateFor))score-=1.5;
 if(n.kind==='stat'&&n.id.startsWith('root_'))score+=3;
 if(n.kind==='stat'&&n.id.startsWith('minor_'))score-=6;
 if(n.kind==='stat'&&n.family&&n.family!==p&&n.family!==s&&!context.needsSurvival)
  score-=1;
 if(mode!=='arcane'&&n.element==='arcane')score=-500;
 return score;
}
// Minimum legal prerequisite route, choosing alternative prerequisites by
// actual incremental point cost, not whichever 'anyRequires' happens to be first.
function routeTo(T,progress,target,plan,active){
 const graph=bases(T.NODES),existing=ownedSet(progress);
 const mode=plan.element||'arcane';
 function build(id,owned,visiting){
  if(owned.has(id))return [];
  const node=graph.get(id);
  if(!usable(node,active,mode)||excludes(node,owned,graph)||visiting.has(id))return null;
  const local=new Set(owned),next=new Set(visiting);next.add(id);
  let route=[];
  const addRoute=r=>{if(!r)return false;for(const step of r)if(!local.has(step)){local.add(step);route.push(step);}return true;};
  const required=[...(node.requires?[node.requires]:[]),...(node.prerequisites||[])];
  for(const dep of required)if(!addRoute(build(dep,local,next)))return null;
  if(node.anyRequires?.length&&!node.anyRequires.some(key=>local.has(key))){
   const candidates=node.anyRequires.map(key=>build(key,local,next)).filter(x=>x!==null)
    .sort((a,b)=>a.length-b.length||
      b.reduce((sum,x)=>sum+scoreNode(graph.get(x),plan,active),0)-
      a.reduce((sum,x)=>sum+scoreNode(graph.get(x),plan,active),0));
   if(!candidates.length||!addRoute(candidates[0]))return null;
  }
  if(!local.has(id)){local.add(id);route.push(id);}
  return route;
 }
 return build(target,existing,new Set());
}
function allocateRoute(T,progress,target,plan,active){
 const route=routeTo(T,progress,target,plan,active);
 if(!route)return {progress,purchased:[],feasible:false};
 let p=progress;const purchased=[];
 for(const id of route){
  const before=T.allocate(p,id);
  if(!before)return {progress:p,purchased,feasible:false};
  p=before;purchased.push(id);
  if(id==='element_choice'&&plan.element&&plan.element!=='arcane'){
   const changed=T.selectElement(p,plan.element);
   if(!changed)throw Error('Native element selection failed in pure planning');
   p=changed;
  }
 }
 return {progress:p,purchased,feasible:true};
}
function canOwnMilestone(T,progress,plan,active,id){
 if(!bases(T.NODES).has(id))return false;
 const hypothetical={...progress,xp:T.POINT_XP*T.MAX_POINTS,nodes:[],prepared:null};
 const result=allocateRoute(T,hypothetical,id,plan,active);
 return result.feasible?result.progress.nodes.length:Infinity;
}
function candidateMilestone(T,progress,plan,active,earned){
 // Most advanced affordable goal, resolving its actual prerequisites.
 const goals=(plan.milestones||[]).filter(id=>{
  const n=T.NODES.find(x=>x.id===id);return usable(n,active,plan.element||'arcane');
 });
 return goals.map((id,index)=>({id,index,cost:canOwnMilestone(T,progress,plan,active,id)}))
  .filter(x=>x.cost<=earned)
  .sort((a,b)=>b.cost-a.cost||a.index-b.index)[0]||null;
}
function bestAvailable(T,progress,plan,active){
 const owned=ownedSet(progress),graph=bases(T.NODES),mode=plan.element||'arcane';
 const choices=T.NODES.filter(n=>usable(n,active,mode)&&!excludes(n,owned,graph)&&
  !owned.has(n.id)&&(!n.requires||owned.has(n.requires))&&
  (!n.prerequisites||n.prerequisites.every(x=>owned.has(x)))&&
  (!n.anyRequires||n.anyRequires.some(x=>owned.has(x))))
 .map(n=>({id:n.id,score:scoreNode(n,plan,active)}))
 .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 for(const choice of choices.slice(0,16))if(T.allocate(progress,choice.id))return choice.id;
 return null;
}
function fill(T,progress,plan,active,earned,milestone){
 let p=progress,purchases=[],goals=[];
 const add=(target,partial=false)=>{
  const r=routeTo(T,p,target,plan,active);
  if(!r)return false;
  for(const id of r){
   if(p.nodes.length>=earned)return false;
   const next=T.allocate(p,id);
   if(!next)return false;
   p=next;purchases.push(id);
   if(id==='element_choice'&&plan.element&&plan.element!=='arcane'){
    const chosen=T.selectElement(p,plan.element);
    if(!chosen)throw Error('Unavailable native elemental attunement '+plan.element);
    p=chosen;
   }
  }
  goals.push(target);
  return true;
 };
 for(const family of active){
  if(!ownedSet(p).has('affinity_'+family)){
   // Allow partial route when only one point remains; no points are minted.
   const route=routeTo(T,p,'affinity_'+family,plan,active);
   if(route)for(const id of route){
    if(p.nodes.length>=earned)break;
    const next=T.allocate(p,id);if(!next)break;
    p=next;purchases.push(id);
   }
  }
  // First build a real functioning basic ability, not a detour of harmless
  // +1 attributes toward an expensive late-game milestone. This also applies
  // when a secondary/tertiary Affinity becomes affordable.
  if(ownedSet(p).has('affinity_'+family)&&!ownedSet(p).has(OPENING_SKILLS[family])){
   const route=routeTo(T,p,OPENING_SKILLS[family],plan,active);
   if(route)for(const id of route){
    if(p.nodes.length>=earned)break;
    const next=T.allocate(p,id);if(!next)break;
    p=next;purchases.push(id);
   }
  }
 }
 if(active.includes('magic')&&!ownedSet(p).has('element_choice'))add('element_choice');
 if(active.includes('magic')&&plan.element&&plan.element!=='arcane'&&
  ownedSet(p).has('element_choice')&&p.element!==plan.element){
  const changed=T.selectElement(p,plan.element);if(changed)p=changed;
 }
 if(milestone&&!ownedSet(p).has(milestone.id))add(milestone.id);
 // An explicit next skill path is preferred to blind stat accumulation.
 const aspirational=(plan.milestones||[]).filter(id=>{
  const n=T.NODES.find(x=>x.id===id);
  return usable(n,active,plan.element||'arcane')&&!ownedSet(p).has(id);
 }).map((id,i)=>({id,i,cost:routeTo(T,p,id,plan,active)?.length??Infinity}))
 .filter(x=>Number.isFinite(x.cost))
 .sort((a,b)=>a.i-b.i||a.cost-b.cost);
 for(let loops=0;loops<100&&p.nodes.length<earned;loops++){
  const remaining=earned-p.nodes.length;
  const nextGoal=aspirational.find(x=>!ownedSet(p).has(x.id)&&
   (routeTo(T,p,x.id,plan,active)?.length||Infinity)<=remaining);
  if(nextGoal){if(add(nextGoal.id))continue;}
  // Progress toward a known skill if close; prefer a legal best available
  // node when the goal is still too remote.
  const upcoming=aspirational.find(x=>!ownedSet(p).has(x.id));
  const route=upcoming&&routeTo(T,p,upcoming.id,plan,active);
  const onRoute=route?.[0];
  const direct=bestAvailable(T,p,plan,active);
  const chosen=onRoute&&T.allocate(p,onRoute)&&
   (route.length<=Math.max(3,remaining+3))?onRoute:direct;
  if(!chosen)break;
  const next=T.allocate(p,chosen);if(!next)break;
  p=next;purchases.push(chosen);
  if(chosen==='element_choice'&&plan.element&&plan.element!=='arcane'){
   const attuned=T.selectElement(p,plan.element);if(!attuned)throw Error('Attunement rejected');
   p=attuned;
  }
 }
 return {progress:p,purchases,goals};
}
function propose(T,progress,preset,history=[],resets=0){
 if(!T.valid(progress))throw Error('Agent received invalid genuine Talent state');
 const plan=typeof preset==='string'?getPlan(preset):preset;
 const earned=T.earned(progress),stage=activeFamilies(plan,earned,history);
 const milestone=candidateMilestone(T,progress,plan,stage.families,earned);
 let original=fill(T,progress,plan,stage.families,earned,milestone);
 let resetReason=null;
 // A deep skill can justify resetting previously invested less-useful nodes,
 // but ONLY when all its native prerequisites are affordable from real XP.
 if(milestone&&!ownedSet(original.progress).has(milestone.id)&&
  !ownedSet(progress).has(milestone.id)&&resets<2){
  const fresh=T.reset(progress);
  const alternative=fill(T,fresh,plan,stage.families,earned,milestone);
  if(ownedSet(alternative.progress).has(milestone.id)&&
   !ownedSet(original.progress).has(milestone.id)){
   resetReason='affordable_milestone_'+milestone.id;
   original=alternative;
  }
 }
 if(!T.valid(original.progress)||original.progress.xp!==progress.xp)
  throw Error('Talent proposal must preserve real XP and tree validity');
 return {plan:plan.primary,model:plan.model,focus:plan.focus,allowed:stage.families,
  pressure:stage.pressure,milestone:milestone?.id||null,
  resetReason,purchases:original.purchases,
  expectedNodes:[...original.progress.nodes],expectedElement:original.progress.element||'arcane',
  earned,spent:original.progress.nodes.length};
}
function evaluateGear(item,profile,baseScore,target='weapon'){
 if(!profile?.plan)return baseScore;
 const plan=getPlan(profile.plan),weapon=item?.subtype||null,slot=target||item?.slot,
  magic=plan.primary==='magic'||plan.secondary==='magic',tank=plan.armor==='Plate';
 let value=baseScore;
 if(slot==='weapon'){
  if(plan.weapons.includes(weapon))value+=28;
  else value-=magic?22:12;
  if(weapon==='Staff'&&magic)value+=4;
  if(weapon==='Wand'&&magic)value+=4;
  if(weapon==='Bow'&&plan.focus==='speed')value+=2;
 }else if(slot==='offhand'){
  if(weapon==='Orb'&&magic)value+=15;
  if(weapon==='Tome'&&magic)value+=10;
  if(weapon==='Shield'&&tank)value+=14;
  if(weapon==='Charm'&&plan.secondary==='vitality')value+=11;
 }else if(['armor','helm','gloves','boots','belt'].includes(slot)){
  const armor=item?.armorType||item?.subtype;
  if(armor===plan.armor)value+=11;
  else if(['Plate','Leather','Cloth'].includes(armor))value-=8;
 }
 // Candidate score is never a claim of simulated DPS: legal native items and
 // actual stat affixes still determine whether equipping is possible.
 return Number(value.toFixed(2));
}
function potionPriority(kind,profile,base,context={}){
 if(!profile?.plan)return base;
 const plan=getPlan(profile.plan),magic=plan.primary==='magic'||plan.secondary==='magic',
  threat=context.threat||'boss';
 let score=base;
 if(kind==='health')score+=25;
 if(kind==='mana'&&magic)score+=15;
 if(kind==='arcane'&&magic)score+=35;
 if(kind==='might'&&!magic)score+=35;
 if(kind==='barrier'||kind==='ironhide')score+=threat==='boss'?24:17;
 if(kind==='haste'&&plan.focus==='speed')score+=27;
 if(kind==='purifying'&&context.condition)score+=24;
 if(kind==='fortune'&&threat==='boss')score-=20;
 if(kind==='trail'&&threat==='boss')score-=18;
 if(plan.potionPolicy==='offense'){
  if(['arcane','might','haste'].includes(kind))score+=28;
  if(['barrier','ironhide'].includes(kind))score-=15;
 }else if(plan.potionPolicy==='defense'){
  if(['barrier','ironhide'].includes(kind))score+=40;
  if(['arcane','might','haste'].includes(kind))score-=16;
 }
 return score;
}
module.exports={BUILDS,OPENING_SKILLS,getPlan,pressure,activeFamilies,routeTo,scoreNode,
 canOwnMilestone,candidateMilestone,propose,evaluateGear,potionPriority};
