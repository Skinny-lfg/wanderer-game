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
 purification:{icon:'✦',objective:'Disrupt a boss seal at the Forgotten Reliquary',detail:'Reach the Reliquary and sacrifice Health to disable one boss modifier.'},
 oath_of_defiance:{icon:'🛡',objective:'Defeat the final boss without disrupting its seal',detail:'Leave every boss modifier intact. Marked Elite preparation is allowed.'},
 monster_hunt:{icon:'⚔',objective:'Defeat monsters in ordinary combat rooms',detail:'Only actual kills from completed fights count. Bosses, Elites and scouting do not count.'},
 skirmish_clear:{icon:'🗡',objective:'Clear 3 ordinary combat rooms',detail:'Complete three non-Elite, non-Boss combat encounters. Visiting or scouting is not enough.'},
 marked_chambers:{icon:'🎯',objective:'Clear both marked combat rooms',detail:'Two specific chambers in different passages are marked on your map. Clear BOTH, even if you would normally avoid their encounters.'},
 boon_collector:{icon:'✨',objective:'Choose 2 Boons during this Expedition',detail:'Find both Boon Shrines and choose a different Boon in each. Revealing or skipping a Shrine does not count.'}
});
// Every Contract offers exactly ONE guaranteed prize. A Blueprint is a
// rare standalone offer, not an extra chance attached to currency/potions.
const BASIC_PRIZES=Object.freeze(['gold','essence','fragments','reagent','potion']);
const BLUEPRINT_OFFER_RATE=Object.freeze([.05,.07,.10]); // Guarded / Dangerous / Brutal
const ESSENCE=Object.freeze({bounty_writ:[4,7,11],purification:[4,7,11],
 oath_of_defiance:[4,7,11],monster_hunt:[4,7,11],
 skirmish_clear:[4,7,11],marked_chambers:[4,7,11],boon_collector:[4,7,11]});
const REWARDS=ESSENCE;
const KILL_TARGETS=Object.freeze([6,8,10]);
function targetFor(id,risk){
 return id==='monster_hunt'?KILL_TARGETS[risk]:id==='skirmish_clear'?3:id==='marked_chambers'||id==='boon_collector'?2:1;
}
function reward(id,risk,family='blood',seed=0,cardId='default',avoidKind=null){
 if(!get(id)||![0,1,2].includes(risk)||!C.FAMILIES.includes(family))throw Error('Invalid Contract reward');
 const kinds=BASIC_PRIZES.filter(kind=>kind!==avoidKind);
 const roll=F.rng(seed,'contract_prize_v3_'+cardId+'_'+id);
 const kind=kinds[Math.floor(roll()*kinds.length)];
 if(kind==='gold')return {kind,gold:[28,45,70][risk]};
 if(kind==='essence')return {kind,essence:ESSENCE[id][risk]};
 if(kind==='fragments')return {kind,fragments:[8,14,23][risk]};
 if(kind==='reagent')return {kind,family,amount:[1,1,2][risk]};
 const potions=['ironhide','purifying','fate'];
 return {kind:'potion',potion:potions[Math.floor(roll()*potions.length)],amount:1};
}
function blueprintOffer(seed,card,id){
 return F.rng(seed,'contract_guaranteed_blueprint_v3_'+card.id+'_'+id)()<BLUEPRINT_OFFER_RATE[card.risk];
}
function canon(known){
 if(!Array.isArray(known)||new Set(known).size!==known.length||
    known.some(id=>!C.RECIPES.some(r=>r.id===id&&r.rarity!=='Uncommon')))
  throw Error('Invalid Contract Blueprint collection');
 return [...known].sort();
}
function blueprint(seed,card,known,id='default'){
 const candidates=C.RECIPES.filter(r=>r.family===card.family&&!known.includes(r.id)&&r.rarity!=='Uncommon');
 const preferred=card.risk===2?'Epic':'Rare';
 const available=candidates.filter(r=>r.rarity===preferred);
 const fallback=card.risk===0?[]:candidates.filter(r=>r.rarity!==preferred);
 const pool=available.length?available:fallback;
 if(!pool.length)return null;
 const random=F.rng(seed,'contract_blueprint_v3_'+card.id+'_'+id);
 return pool[Math.floor(random()*pool.length)].id;
}
function plan(seed,card,known=[]){
 const ids=offer(seed,card),knownRecipes=canon(known),rewards={};
 const targets=ids.includes('marked_chambers')?markedRooms(seed,card):[];
 let lastKind=null,usedBlueprint=false;
 for(const id of ids){
  const basic=reward(id,card.risk,card.family,seed,card.id,lastKind);
  const recipeId=!usedBlueprint?blueprint(seed,card,knownRecipes,id):null;
  if(recipeId&&blueprintOffer(seed,card,id)){
   // Once a Blueprint is offered, completing its objective guarantees it.
   rewards[id]={kind:'blueprint',recipeId};
   usedBlueprint=true;
  }else{
   rewards[id]=basic;
   lastKind=basic.kind;
  }
 }
 return {ids,knownRecipes,rewards,markedRooms:targets};
}
function label(prize){
 if(prize?.kind==='blueprint'){
  const r=C.RECIPES.find(r=>r.id===prize.recipeId);
  return r?'Guaranteed '+r.rarity+' Blueprint · '+r.name:'Guaranteed Blueprint';
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
// Select two actual ordinary combat chambers on distinct passages. The
// conservative route budget counts both branches plus up to two return steps
// through already-cleared rooms; no secret shortcuts or free travel required.
function markedCandidates(card){
 if(!card||!Array.isArray(card.nodes)||!Number.isInteger(card.stepLimit))return [];
 const rooms=card.nodes.map((n,i)=>({n,i,path:shortestPath(card,i)})).filter(({n,i,path})=>
  n.kind==='combat'&&i>=5&&i<=16&&path.length>=3&&path.length<=6&&
  path.length-1<=card.stepLimit-2);
 const pairs=[];
 for(let a=0;a<rooms.length;a++)for(let b=a+1;b<rooms.length;b++){
  const first=rooms[a],second=rooms[b];
  if(sector(card,first.i)===sector(card,second.i))continue;
  const distanceA=first.path.length-1,distanceB=second.path.length-1;
  // Pay a small return traversal penalty before entering the other branch.
  const upperBound=distanceA+Math.min(2,distanceA)+distanceB;
  if(upperBound>card.stepLimit-1)continue;
  pairs.push({ids:[first.i,second.i],distance:distanceA+distanceB,
   diversity:Math.abs((first.n.range?.[1]||1)-(second.n.range?.[1]||1))+
    Number(!!first.n.traitId!==!!second.n.traitId)});
 }
 return pairs;
}
function shortestPath(card,target,start=0){
 if(!Number.isInteger(target)||target<0||target>=card.nodes.length||!Number.isInteger(start)||start<0||start>=card.nodes.length)return [];
 const queue=[[start]],seen=new Set([start]);
 for(const path of queue){
  const last=path.at(-1);
  if(last===target)return path;
  for(const [a,b]of card.edges){
   if(root.WandererV013MapIntelligence?.secretEdge?.(card,a,b))continue;
   const next=a===last?b:b===last?a:null;
   if(next!==null&&!seen.has(next)){seen.add(next);queue.push([...path,next]);}
  }
 }
 return [];
}
function markedRooms(seed,card){
 const options=markedCandidates(card);
 if(!options.length)return [];
 // Prefer a meaningful side detour and different enemy groups, but keep
 // seeded choice among the best candidates rather than the same path always.
 options.sort((a,b)=>b.distance-a.distance||b.diversity-a.diversity||
  a.ids[0]-b.ids[0]||a.ids[1]-b.ids[1]);
 const best=options.filter(x=>x.distance>=options[0].distance-1).slice(0,12);
 const rng=F.rng(seed,'contract_marked_rooms_v1_'+card.id);
 return [...best[Math.floor(rng()*best.length)].ids];
}
// A conservative shortest route through both natural Boon Shrines.
// Only real, non-secret edges count; travel discounts are not assumed.
function boonShrineRouteSteps(card){
 const rooms=card?.boonShrines;
 if(!Array.isArray(rooms)||rooms.length!==2||rooms[0]===rooms[1]||
    rooms.some(id=>!Number.isInteger(id)||card.nodes?.[id]?.kind!=='shrine'))return Infinity;
 const first=shortestPath(card,rooms[0]).length-1,second=shortestPath(card,rooms[1]).length-1;
 const link=shortestPath(card,rooms[1],rooms[0]).length-1;
 if(first<0||second<0||link<0)return Infinity;
 return Math.min(first,second)+link;
}
function eligible(card,id){
 const normal=id==='bounty_writ'?card?.objective:id==='purification'?card?.reliquaryRoom:card?.nodes?.length-1;
 if(!get(id)||!card||!Number.isInteger(card.stepLimit)||!Number.isInteger(card.risk))return false;
 if(id==='bounty_writ')return card.nodes[normal]?.kind==='elite'&&reachable(card,normal)<=card.stepLimit;
 if(id==='purification')return card.nodes[normal]?.event==='forgotten_reliquary'&&reachable(card,normal)<=card.stepLimit;
 if(id==='monster_hunt'||id==='skirmish_clear'){
  const rooms=card.nodes.map((node,i)=>({node,i})).filter(({node,i})=>node.kind==='combat'&&reachable(card,i)<=card.stepLimit);
  return id==='skirmish_clear'?rooms.length>=3:
   rooms.reduce((sum,{node})=>sum+(Number.isInteger(node.count)?node.count:0),0)>=KILL_TARGETS[card.risk];
 }
 if(id==='marked_chambers')return markedCandidates(card).length>0;
 if(id==='boon_collector')return boonShrineRouteSteps(card)<=card.stepLimit;
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
 else if(id==='boon_collector'){
  target=2;
  const shrineRooms=new Set(card.boonShrines||[]),cleared=new Set(d.cleared||[]),visited=new Set(d.visited||[]);
  const chosen=(s.decisions||[]).filter(a=>a.type==='choose_boon'&&shrineRooms.has(a.room)&&
   cleared.has(a.room)&&visited.has(a.room)&&s.boonIds.includes(a.id));
  current=Math.min(target,new Set(chosen.map(a=>a.room)).size);
 }
 else if(id==='marked_chambers'){
  target=2;
  const marked=d.stage72RewardPlan?.markedRooms||[],cleared=new Set(d.cleared||[]);
  current=marked.filter(node=>cleared.has(node)&&(game.history||[]).some(h=>h.node===node&&!h.boss&&!h.elite&&!h.event)).length;
 }else if(id==='purification')current=Number(!!s.bossPreparation.reliquary&&d.disabledBossModifierId===s.bossModifierIds[0]);
 else if(id==='oath_of_defiance')current=Number(game.stage==='finished'&&d.cleared.includes(card.nodes.length-1)&&!s.bossPreparation.reliquary);
 else if(id==='monster_hunt'||id==='skirmish_clear'){
  target=targetFor(id,card.risk);
  const cleared=new Set(d.cleared||[]),rooms=(game.history||[]).filter(h=>
   cleared.has(h.node)&&card.nodes[h.node]?.kind==='combat'&&!h.boss&&!h.elite&&!h.event);
  const value=id==='monster_hunt'?
   rooms.reduce((n,h)=>n+(Number.isSafeInteger(h.monstersDefeated)&&h.monstersDefeated>=0&&h.monstersDefeated<=32?h.monstersDefeated:0),0):
   new Set(rooms.map(h=>h.node)).size;
  current=Math.min(target,value);
 }
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
  progress:p.current,target:p.target,essence:paid?.essence||0,fragments:paid?.fragments||0,recipeId:paid?.recipeId||null,
  kind:paid?.kind||null,potential:prize||null,paid:paid||null};
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
 try{if(!matchesPlan(p,d.foundationManifest.seed,card))return false;}
 catch{return false;}
 const paid=d.stage7RewardPaid,completed=events.find(x=>x.type==='complete_contract'),due=p.rewards[initial.id];
 if(events.length!==(paid?2:1)||paid&&(!completed||completed.id!==initial.id||events[1]!==completed)||
    !paid&&s.completedObjectives.length||!due)return false;
 if(!paid)return true;
 if(s.completedObjectives.length!==1||s.completedObjectives[0]!==initial.id||paid.id!==initial.id||!progress(game)?.done)return false;
 const expected=due.kind;
 const actual=due;
 if(paid.kind!==expected)return false;
 const only=(keys)=>Object.keys(paid).every(key=>['id','kind',...keys].includes(key));
 if(expected==='blueprint')return only(['recipeId'])&&paid.recipeId===due.recipeId;
 if(expected==='essence')return only(['essence'])&&Number.isSafeInteger(paid.essence)&&paid.essence>=0&&
   paid.essence<=actual.essence;
 if(expected==='gold')return only(['gold'])&&Number.isSafeInteger(paid.gold)&&paid.gold>=0&&paid.gold<=actual.gold;
 if(expected==='fragments')return only(['fragments'])&&Number.isSafeInteger(paid.fragments)&&paid.fragments>=0&&paid.fragments<=actual.fragments;
 if(expected==='reagent')return only(['family','amount'])&&paid.family===card.family&&
   Number.isSafeInteger(paid.amount)&&paid.amount>=0&&paid.amount<=actual.amount;
 if(expected==='potion')return only(['potion','amount'])&&paid.potion===actual.potion&&
   Number.isSafeInteger(paid.amount)&&paid.amount>=0&&paid.amount<=1;
 return false;
}
function matchesPlan(value,seed,card){const stored=JSON.stringify(value);return stored===JSON.stringify(plan(seed,card,value.knownRecipes));}
function validateOffer(game){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d?.realm),o=d?.contractOffer;
 if(!o)return o===undefined;
 if(!card||game.stage!=='choice'||game.selected!==null||decision(d.foundationState))return false;
 try{return matchesPlan(o,d.foundationManifest.seed,card);}
 catch{return false;}
}
function settle(game,profile,results,outcome){
 const d=game?.dungeon,s=d?.foundationState,card=d?.cards?.find(c=>c.id===d.realm),id=s?.contractId;
 // Completion alone never pays: extract alive or defeat the final Boss.
 if(!((outcome==='extracted'&&game?.stage==='choice')||
      (outcome==='victory'&&game?.stage==='finished')))return null;
 if(!d||!card||!get(id)||d.stage7RewardPaid||!progress(game)?.done||!validate(game))return null;
 if(!C.valid(profile?.crafting))throw Error('Invalid Contract wallet');
 const prize=d.stage72RewardPlan?.rewards?.[id];if(!prize)return null;
 const next=F.applyDecision(s,{type:'complete_contract',id},d.foundationManifest);
 const due=prize;
 const kind=due.kind;
 let paid={id,kind};
 if(kind==='blueprint'){
  const discovered=C.discover(profile.crafting,due.recipeId);
  if(!discovered)return null;
  profile.crafting=discovered;paid.recipeId=due.recipeId;
 }else if(kind==='essence'){
  const amount=due.essence;
  paid.essence=Math.min(amount,Math.max(0,1000000000-profile.crafting.essence));
  profile.crafting.essence+=paid.essence;
 }else if(kind==='gold'){
  paid.gold=Math.min(due.gold,Math.max(0,Number.MAX_SAFE_INTEGER-profile.gold));
  profile.gold+=paid.gold;
 }else if(kind==='fragments'){
  paid.fragments=Math.min(due.fragments,Math.max(0,Number.MAX_SAFE_INTEGER-profile.fragments));
  profile.fragments+=paid.fragments;
 }else if(kind==='reagent'){
  paid.family=card.family;paid.amount=Math.min(due.amount,Math.max(0,1000000000-profile.crafting.cores[card.family]));
  profile.crafting.cores[card.family]+=paid.amount;
 }else if(kind==='potion'){
  profile.consumables??={};
  paid.potion=due.potion;paid.amount=Math.min(due.amount,Math.max(0,99999-(profile.consumables[due.potion]||0)));
  profile.consumables[due.potion]=(profile.consumables[due.potion]||0)+paid.amount;
 }else return null;
 // Include optional currency in the existing Expedition result totals once.
 if(results&&kind==='gold')results.gold=(results.gold||0)+paid.gold;
 if(results&&kind==='fragments')results.fragments=(results.fragments||0)+paid.fragments;
 d.foundationState=next;d.stage7RewardPaid=paid;
 return {...paid,name:get(id).name};
}
const API=Object.freeze({CATALOG,DESCRIPTIONS,REWARDS,BASIC_PRIZES,BLUEPRINT_OFFER_RATE,get,reward,plan,label,blueprintOffer,blueprint,reachable,sector,markedCandidates,markedRooms,boonShrineRouteSteps,eligible,offer,decision,progress,inspect,validate,validateOffer,settle});
root.WandererV013ExpeditionContracts=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
