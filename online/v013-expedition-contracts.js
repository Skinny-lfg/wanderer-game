// Wanderer v0.13 Stage 7 — Contracts & Rewards.
// Two deterministic, feasible objectives per Dungeon. No duplicate Elite settlement.
// All progress is derived from the real controller, not from player-supplied counters.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation;
if(!F)throw Error('Stage 7 Contracts require the Stage 0 foundation');
const CATALOG=F.CATALOG.contracts;
const get=id=>F.lookup('contracts',id);
const DESCRIPTIONS=Object.freeze({
 bounty_writ:{icon:'⚔',objective:'Defeat the marked Elite',detail:'Claim the optional marked Elite on the map. Its existing reagent reward is separate.'},
 pathfinder:{icon:'🧭',objective:'Visit two distinct map sectors',detail:'Enter two different passages. Scouting alone does not count.'},
 purification:{icon:'✦',objective:'Disrupt a boss seal at the Forgotten Reliquary',detail:'Reach the Reliquary and sacrifice Health to disable one boss modifier.'},
 oath_of_defiance:{icon:'🛡',objective:'Defeat the final boss without disrupting its seal',detail:'Leave every boss modifier intact. Marked Elite preparation is allowed.'}
});
const REWARDS=Object.freeze({
 bounty_writ:[[3,6],[5,10],[7,14]],
 pathfinder:[[3,7],[5,12],[8,18]],
 purification:[[5,10],[8,16],[11,23]],
 oath_of_defiance:[[6,12],[10,20],[14,30]]
});
function reward(id,risk){
 if(!get(id)||![0,1,2].includes(risk))throw Error('Invalid Contract reward');
 const [essence,fragments]=REWARDS[id][risk];
 return {essence,fragments:Math.min(30,fragments)};
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
  target=2;const visited=new Set((d.visited||[]).map(room=>sector(card,room)).filter(n=>n!==null));current=Math.min(target,visited.size);
 }else if(id==='purification')current=Number(!!s.bossPreparation.reliquary&&d.disabledBossModifierId===s.bossModifierIds[0]);
 else if(id==='oath_of_defiance')current=Number(game.stage==='finished'&&d.cleared.includes(card.nodes.length-1)&&!s.bossPreparation.reliquary);
 return {current,target,done:current===target};
}
function inspect(game,outcome=null){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d?.realm),s=d?.foundationState;
 if(!card||!s)return null;
 const choice=decision(s),id=s.contractId;
 if(!choice){return d.contractOffer?{status:'offered',options:[...d.contractOffer.ids]}:null;}
 if(choice.type==='skip_contract')return {id:null,name:'No contract',status:'ignored',progress:0,target:0,essence:0,fragments:0};
 const p=progress(game),prize=reward(id,card.risk),paid=d.stage7RewardPaid;
 const failed=['defeat','abandoned'].includes(outcome)||outcome==='extracted'&&!paid||outcome==='victory'&&!paid||game.stage==='failed'&&outcome!=='extracted';
 return {id,name:get(id).name,status:paid?'completed':failed?'failed':p.done?'ready':'active',
   progress:p.current,target:p.target,essence:paid?.essence||0,fragments:paid?.fragments||0,potential:prize};
}
function validate(game){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d?.realm),s=d?.foundationState;
 if(!d||!card||!s)return d?.contractOffer===undefined&&d?.stage7RewardPaid===undefined;
 const events=s.decisions.filter(x=>['select_contract','skip_contract','complete_contract'].includes(x.type));
 if(!events.length)return validateOffer(game)&&d.stage7RewardPaid===undefined&&s.contractId===null&&s.completedObjectives.length===0;
 const planned=offer(d.foundationManifest.seed,card);
 const initial=events[0],selection=initial.type==='select_contract',skip=initial.type==='skip_contract';
 if(!selection&&!skip||d.contractOffer!==undefined||events.length>2||!['choice','combat','finished','failed'].includes(game.stage))return false;
 if(selection&&(!planned.includes(initial.id)||initial.id!==s.contractId))return false;
 if(skip&&(s.contractId!==null||events.length!==1||s.completedObjectives.length||d.stage7RewardPaid!==undefined))return false;
 if(selection){
  const paid=d.stage7RewardPaid,completed=events.find(x=>x.type==='complete_contract');
  if(events.length===(paid?2:1)&&(!paid||completed?.id===initial.id&&events[1]===completed)&&
    (paid?s.completedObjectives.length===1&&s.completedObjectives[0]===initial.id&&
       paid.id===initial.id&&Number.isSafeInteger(paid.essence)&&paid.essence>=0&&paid.essence<=reward(initial.id,card.risk).essence&&
       Number.isSafeInteger(paid.fragments)&&paid.fragments>=0&&paid.fragments<=reward(initial.id,card.risk).fragments&&progress(game)?.done:
       s.completedObjectives.length===0))return true;
  return false;
 }
 return true;
}
function validateOffer(game){
 const d=game?.dungeon,card=d?.cards?.find(c=>c.id===d?.realm),o=d?.contractOffer;
 if(!o)return o===undefined;
 if(!card||game.stage!=='choice'||game.selected!==null||decision(d.foundationState))return false;
 try{return Array.isArray(o.ids)&&o.ids.length===2&&new Set(o.ids).size===2&&
   JSON.stringify(o.ids)===JSON.stringify(offer(d.foundationManifest.seed,card));}
 catch{return false;}
}
function settle(game,profile,results){
 const d=game?.dungeon,s=d?.foundationState,card=d?.cards?.find(c=>c.id===d?.realm),id=s?.contractId;
 if(!d||!card||!get(id)||d.stage7RewardPaid||!progress(game)?.done)return null;
 if(!profile?.crafting||!Number.isSafeInteger(profile.crafting.essence)||!Number.isSafeInteger(profile.fragments))throw Error('Invalid Contract wallet');
 const next=F.applyDecision(s,{type:'complete_contract',id},d.foundationManifest),amount=reward(id,card.risk);
 const essence=Math.min(amount.essence,Number.MAX_SAFE_INTEGER-profile.crafting.essence);
 const fragments=Math.min(amount.fragments,Number.MAX_SAFE_INTEGER-profile.fragments);
 // If ever at the currency limit, record the actual payout rather than duplicate or overflow it.
 d.foundationState=next;d.stage7RewardPaid={id,essence,fragments};
 profile.crafting.essence+=essence;profile.fragments+=fragments;
 if(results)results.fragments+=fragments;
 return {id,name:get(id).name,essence,fragments};
}
const API=Object.freeze({CATALOG,DESCRIPTIONS,REWARDS,get,reward,reachable,sector,eligible,offer,decision,progress,inspect,validate,validateOffer,settle});
root.WandererV013ExpeditionContracts=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
