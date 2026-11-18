// Wanderer v0.13 Stage 7 — Contracts & Rewards.
// Two deterministic, feasible objectives per Dungeon. No duplicate Elite settlement.
// All progress is derived from the real controller, not from player-supplied counters.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation,C=root.WandererV013Crafting;
if(!F||!C)throw Error('Stage 7.2 Contracts require Stage 0 and Blueprint Collection');
const CATALOG=F.CATALOG.contracts;
const get=id=>F.lookup('contracts',id);
const DESCRIPTIONS=Object.freeze({
 bounty_writ:{icon:'⚔',objective:'Defeat the marked Elite',detail:'Claim the optional marked Elite on the map. Its existing reagent reward is separate.'},
 pathfinder:{icon:'🧭',objective:'Clear rooms in two distinct map sectors',detail:'Complete an encounter or event in two different passages. Scouting alone does not count.'},
 purification:{icon:'✦',objective:'Disrupt a boss seal at the Forgotten Reliquary',detail:'Reach the Reliquary and sacrifice Health to disable one boss modifier.'},
 oath_of_defiance:{icon:'🛡',objective:'Defeat the final boss without disrupting its seal',detail:'Leave every boss modifier intact. Marked Elite preparation is allowed.'}
});
// Contract rewards are exclusive. A Blueprint offer must be earned and known
// before settlement; a duplicate Blueprint is not converted to free currency.
const ESSENCE=Object.freeze({
 bounty_writ:[3,5,7],pathfinder:[3,5,8],
 purification:[5,8,11],oath_of_defiance:[6,10,14]
});
const REWARDS=ESSENCE;
// One reward per Contract. Simple prizes are deterministic and risk-scaled.
function reward(id,risk,family='blood'){
 if(!get(id)||![0,1,2].includes(risk)||!C.FAMILIES.includes(family))throw Error('Invalid Contract reward');
 if(id==='bounty_writ')return {kind:'gold',gold:[18,28,40][risk]};
 if(id==='pathfinder')return {kind:'fragments',fragments:[6,10,16][risk]};
 if(id==='purification')return {kind:'reagent',family,amount:[1,1,2][risk]};
 if(id==='oath_of_defiance')return {kind:'potion',potion:['ironhide','purifying','fate'][risk],amount:1};
 return {kind:'essence',essence:ESSENCE[id][risk]};
}
function blueprintChance(seed,card,id,due){
 return F.rng(seed,'contract_blueprint_chance_v1_'+card.id+'_'+id)()<due.chance;
}
function canon(known){
 if(!Array.isArray(known)||new Set(known).size!==known.length||
    known.some(id=>!C.RECIPES.some(r=>r.id===id&&r.rarity!=='Uncommon')))
  throw Error('Invalid Contract Blueprint collection');
 return [...known].sort();
}
function blueprint(seed,card,known){
 const candidates=C.RECIPES.filter(r=>r.family===card.family&&!known.includes(r.id)&&r.rarity!=='Uncommon');
 const preferred=card.risk===2?'Epic':'Rare';
 const available=candidates.filter(r=>r.rarity===preferred);
 const fallback=card.risk===0?[]:candidates.filter(r=>r.rarity!==preferred);
 const pool=available.length?available:fallback;
 if(!pool.length)return null;
 const random=F.rng(seed,'contract_blueprint_v1_'+card.id);
 return pool[Math.floor(random()*pool.length)].id;
}
function plan(seed,card,known=[]){
 const ids=offer(seed,card),knownRecipes=canon(known);
 const newBlueprint=blueprint(seed,card,knownRecipes),rewards={};
 for(let i=0;i<ids.length;i++){
  const id=ids[i];
  rewards[id]=i===0&&newBlueprint?{kind:'blueprint_chance',recipeId:newBlueprint,chance:[.35,.45,.55][card.risk],fallbackEssence:ESSENCE[id][card.risk]}:reward(id,card.risk,card.family);
 }
 return {ids,knownRecipes,rewards};
}
function label(prize){
 if(prize?.kind==='blueprint_chance'){
  const r=C.RECIPES.find(r=>r.id===prize.recipeId);
  return Math.round(prize.chance*100)+'% chance: '+(r?r.rarity+' '+r.name:'Blueprint')+' · Otherwise +'+prize.fallbackEssence+' Essence';
 }
 if(prize?.kind==='blueprint'){
  const r=C.RECIPES.find(r=>r.id===prize.recipeId);return r?r.rarity+' Blueprint · '+r.name:'Unknown Blueprint';
 }
 if(prize?.kind==='essence')return '+'+prize.essence+' Essence';
 if(prize?.kind==='gold')return '+'+prize.gold+' Gold';
 if(prize?.kind==='fragments')return '+'+prize.fragments+' Fragments';
 if(prize?.kind==='reagent')return '+'+prize.amount+' '+prize.family+' Reagent';
 if(prize?.kind==='potion')return '+1 '+prize.potion.charAt(0).toUpperCase()+prize.potion.slice(1)+' Potion';
 return 'No optional reward';
}
function reachable(card,destination){
 if(!card||!Array.isArray(card.nodes)||!Array.isArray(card.edges)||!Number.isInteger(destination)||destination<0||destination>=card.nodes.length)return Infinity;
 const adjacency=Array.from({length:card.nodes.length},()=>[]);
 for(const [a,b] of card.edges){
  if(!Number.isInteger(a)||!Number.isInteger(b)||!adjacency[a]||!adjacency[b]||
    root.WandererV013MapIntelligence?.secretEdge?.(card,a,b))continue;
  adjacency[a].push(b);adjacency[b].push(a);
 }
 const queue=[[0,0]],seen=new Set([0]);
 for(const [id,steps] of queue){
  if(id===destination)return steps;
  for(const next of adjacency[id])if(!seen.has(next)){seen.add(next);queue.push([next,steps+1]);}
 }
 return Infinity;
}
function sector(card,id){
 if(!Number.isInteger(id)||id<=0||id>=card.nodes.length)return null;
 if(id<=16)return (id-1)%4;
 const link=card.edges.find(([a,b])=>(a===id&&b>=13&&b<=16)||(b===id&&a>=13&&a<=16));
 return link?(link[0]===id?link[1]:link[0])-13:null;
}
function eligible(card,id){
 const normal=id==='bounty_writ'?card?.objective:id==='purification'?card?.reliquaryRoom:card?.nodes?.length-1;
 if(!get(id)||!card||!Number.isInteger(card.stepLimit)||!Number.isInteger(card.risk))return false;
 if(id==='bounty_writ')return card.nodes[normal]?.kind==='elite'&&reachable(card,normal)<=card.stepLimit;
 if(id==='pathfinder')return [1,2,3,4].filter(i=>card.nodes[i]&&reachable(card,i)<=card.stepLimit).length>=2&&card.stepLimit>=3;
 if(id==='purification')return card.nodes[normal]?.event==='forgotten_reliquary'&&reachable(card,normal)<=card.stepLimit;
 return id==='oath_of_defiance'&&card.nodes[normal]?.kind==='boss'&&reachable(card,normal)<=card.stepLimit;
}
function offer(seed,card){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!card||!/^[a-z0-9_-]+$/.test(card.id||''))throw Error('Invalid Contract offer input');
 const available=CATALOG.filter(c=>eligible(card,c.id));
 if(available.length<2)throw Error('Fewer than two feasible Contracts');
 const rng=F.rng(seed,'contracts_v1_'+card.id),shuffled=[...available];
 for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 return shuffled.slice(0,2).map(c=>c.id);
}
function decision(state){return state?.decisions?.find(x=>x.type==='select_contract'||x.type==='skip_contract')||null;}
function progress(game){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d.realm),s=d?.foundationState,id=s?.contractId;
 if(!get(id)||!card)return null;
 let current=0,target=1;
 if(id==='bounty_writ')current=Number(!!s.bossPreparation.markedElite&&d.cleared.includes(card.objective));
 else if(id==='pathfinder'){
  target=2;const cleared=new Set(d.cleared||[]),visited=new Set((game.history||[]).filter(entry=>cleared.has(entry.node)).map(entry=>sector(card,entry.node)).filter(n=>n!==null));current=Math.min(target,visited.size);
 }else if(id==='purification')current=Number(!!s.bossPreparation.reliquary&&d.disabledBossModifierId===s.bossModifierIds[0]);
 else if(id==='oath_of_defiance')current=Number(game.stage==='finished'&&d.cleared.includes(card.nodes.length-1)&&!s.bossPreparation.reliquary);
 return {current,target,done:current===target};
}
function inspect(game,outcome=null){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d?.realm),s=d?.foundationState;
 if(!card||!s)return null;
 const choice=decision(s),id=s.contractId;
 if(!choice)return d.contractOffer?{status:'offered',options:[...d.contractOffer.ids]}:null;
 if(choice.type==='skip_contract')return {id:null,name:'No contract',status:'ignored',progress:0,target:0,essence:0,fragments:0,recipeId:null,kind:null};
 const p=progress(game),prize=d.stage72RewardPlan?.rewards?.[id],paid=d.stage7RewardPaid;
 const failed=['defeat','abandoned'].includes(outcome)||outcome==='extracted'&&!paid||
   outcome==='victory'&&!paid||game.stage==='failed'&&outcome!=='extracted';
 return {id,name:get(id).name,status:paid?'completed':failed?'failed':p.done?'ready':'active',
  progress:p.current,target:p.target,essence:paid?.essence||0,fragments:0,recipeId:paid?.recipeId||null,
  kind:paid?.kind||prize?.kind||null,potential:prize||null};
}
function validate(game){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d?.realm),s=d?.foundationState;
 if(!d||!card||!s)return d?.contractOffer===undefined&&d?.stage72RewardPlan===undefined&&d?.stage7RewardPaid===undefined;
 const events=s.decisions.filter(x=>['select_contract','skip_contract','complete_contract'].includes(x.type));
 if(!events.length)return validateOffer(game)&&d.stage72RewardPlan===undefined&&
    d.stage7RewardPaid===undefined&&s.contractId===null&&s.completedObjectives.length===0;
 const initial=events[0],selection=initial.type==='select_contract',skip=initial.type==='skip_contract';
 if(!selection&&!skip||d.contractOffer!==undefined||events.length>2||!['choice','combat','finished','failed'].includes(game.stage))return false;
 if(skip)return s.contractId===null&&events.length===1&&!s.completedObjectives.length&&
    d.stage72RewardPlan===undefined&&d.stage7RewardPaid===undefined;
 const p=d.stage72RewardPlan;
 if(!p||!Array.isArray(p.knownRecipes)||!Array.isArray(p.ids)||
    !p.ids.includes(initial.id)||initial.id!==s.contractId)return false;
 try{if(JSON.stringify(p)!==JSON.stringify(plan(d.foundationManifest.seed,card,p.knownRecipes)))return false;}
 catch{return false;}
 const paid=d.stage7RewardPaid,completed=events.find(x=>x.type==='complete_contract'),due=p.rewards[initial.id];
 if(events.length!==(paid?2:1)||paid&&(!completed||completed.id!==initial.id||events[1]!==completed)||
    !paid&&s.completedObjectives.length||!due)return false;
 if(!paid)return true;
 if(s.completedObjectives.length!==1||s.completedObjectives[0]!==initial.id||paid.id!==initial.id||!progress(game)?.done)return false;
 const expected=due.kind==='blueprint_chance'?(blueprintChance(d.foundationManifest.seed,card,initial.id,due)?'blueprint':'essence'):due.kind;
 if(paid.kind!==expected)return false;
 const only=(keys)=>Object.keys(paid).every(key=>['id','kind',...keys].includes(key));
 if(expected==='blueprint')return only(['recipeId'])&&paid.recipeId===due.recipeId;
 if(expected==='essence')return only(['essence'])&&Number.isSafeInteger(paid.essence)&&paid.essence>=0&&
   paid.essence<=(due.kind==='blueprint_chance'?due.fallbackEssence:due.essence);
 if(expected==='gold')return only(['gold'])&&Number.isSafeInteger(paid.gold)&&paid.gold>=0&&paid.gold<=due.gold;
 if(expected==='fragments')return only(['fragments'])&&Number.isSafeInteger(paid.fragments)&&paid.fragments>=0&&paid.fragments<=due.fragments;
 if(expected==='reagent')return only(['family','amount'])&&paid.family===card.family&&
   Number.isSafeInteger(paid.amount)&&paid.amount>=0&&paid.amount<=due.amount;
 if(expected==='potion')return only(['potion','amount'])&&paid.potion===due.potion&&
   Number.isSafeInteger(paid.amount)&&paid.amount>=0&&paid.amount<=1;
 return false;
}
function validateOffer(game){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d?.realm),o=d?.contractOffer;
 if(!o)return o===undefined;
 if(!card||game.stage!=='choice'||game.selected!==null||decision(d.foundationState))return false;
 try{return JSON.stringify(o)===JSON.stringify(plan(d.foundationManifest.seed,card,o.knownRecipes));}
 catch{return false;}
}
function settle(game,profile,results){
 const d=game?.dungeon,s=d?.foundationState,card=d?.cards?.find(c=>c.id===d.realm),id=s?.contractId;
 if(!d||!card||!get(id)||d.stage7RewardPaid||!progress(game)?.done||!validate(game))return null;
 if(!C.valid(profile?.crafting))throw Error('Invalid Contract wallet');
 const prize=d.stage72RewardPlan?.rewards?.[id];if(!prize)return null;
 const next=F.applyDecision(s,{type:'complete_contract',id},d.foundationManifest);
 const kind=prize.kind==='blueprint_chance'?
  (blueprintChance(d.foundationManifest.seed,card,id,prize)?'blueprint':'essence'):prize.kind;
 let paid={id,kind};
 if(kind==='blueprint'){
  const discovered=C.discover(profile.crafting,prize.recipeId);
  if(!discovered)return null;
  profile.crafting=discovered;paid.recipeId=prize.recipeId;
 }else if(kind==='essence'){
  const amount=prize.kind==='blueprint_chance'?prize.fallbackEssence:prize.essence;
  paid.essence=Math.min(amount,Math.max(0,1000000000-profile.crafting.essence));
  profile.crafting.essence+=paid.essence;
 }else if(kind==='gold'){
  paid.gold=Math.min(prize.gold,Math.max(0,Number.MAX_SAFE_INTEGER-profile.gold));
  profile.gold+=paid.gold;
 }else if(kind==='fragments'){
  paid.fragments=Math.min(prize.fragments,Math.max(0,Number.MAX_SAFE_INTEGER-profile.fragments));
  profile.fragments+=paid.fragments;
 }else if(kind==='reagent'){
  paid.family=card.family;paid.amount=Math.min(prize.amount,Math.max(0,1000000000-profile.crafting.cores[card.family]));
  profile.crafting.cores[card.family]+=paid.amount;
 }else if(kind==='potion'){
  profile.consumables??={};
  paid.potion=prize.potion;paid.amount=Math.min(1,Math.max(0,99999-(profile.consumables[prize.potion]||0)));
  profile.consumables[prize.potion]=(profile.consumables[prize.potion]||0)+paid.amount;
 }else return null;
 d.foundationState=next;d.stage7RewardPaid=paid;
 return {...paid,name:get(id).name};
}
const API=Object.freeze({CATALOG,DESCRIPTIONS,REWARDS,get,reward,plan,label,blueprintChance,reachable,sector,eligible,offer,decision,progress,inspect,validate,validateOffer,settle});
root.WandererV013ExpeditionContracts=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
