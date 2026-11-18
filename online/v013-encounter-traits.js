// Wanderer v0.13 Stage 2 — encounter traits use the real enemy model and map.
// No second combat engine, no changes to map topology, enemy counts or global RNG.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation;
if(!F)throw Error('Stage 0 expedition foundation must load before Stage 2 traits');
const ITEMS=F.CATALOG.encounterTraits;
const ITEMS_BY_ID=new Map(ITEMS.map(item=>[item.id,item]));
const get=id=>ITEMS_BY_ID.get(id)||null;
function shuffle(values,random){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function assign(card,seed){
 if(!card||!Array.isArray(card.nodes)||!F.DIFFICULTIES[card.risk]||!F.AFFINITIES.includes(card.family))throw Error('Invalid Realm Card for encounter traits');
 const difficulty=F.DIFFICULTIES[card.risk];
 // All four entry-ring nodes are excluded so the first combat on every route is unmodified.
 const candidates=card.nodes.map((n,i)=>n.kind==='combat'&&i>=5?i:-1).filter(i=>i>=0);
 const amount=Math.min(difficulty.traits,Math.floor(card.nodes.filter(n=>n.kind==='combat').length*.30),candidates.length);
 const pool=ITEMS.filter(item=>item.families.includes(card.family));
 if(pool.length<amount)throw Error('Insufficient affinity-compatible encounter traits');
 const random=F.rng(seed,'encounter_traits_'+card.id);
 const selectedRooms=shuffle(candidates,random).slice(0,amount);
 const selectedTraits=shuffle(pool,random).slice(0,amount);
 return selectedRooms.map((room,i)=>({room,traitId:selectedTraits[i].id}));
}
function applyGroup(id,enemies){
 const trait=get(id);if(!trait)return false;
 if(!Array.isArray(enemies)||!enemies.length||enemies.some(enemy=>enemy.boss||enemy.miniboss))return false;
 for(const enemy of enemies){
  if(enemy.encounterTraitId)throw Error('Encounter trait already applied');
  enemy.encounterTraitId=id;
  const p=trait.params;
  if(p.hpMult){enemy.hp=enemy.maxhp=Math.max(1,Math.round(enemy.maxhp*p.hpMult));}
  if(p.defenseMult){enemy.def=Math.max(0,Math.round(enemy.def*p.defenseMult));enemy.baseDef=Math.max(0,Math.round((enemy.baseDef??enemy.def)*p.defenseMult));}
  if(p.attackSpeedMult){enemy.attackEvery=Math.max(.15,enemy.attackEvery/p.attackSpeedMult);}
  if(p.attackMult){enemy.atk=Math.max(1,Math.round(enemy.atk*p.attackMult));}
  if(p.barrierMaxHpPct){enemy.barrier=(enemy.barrier||0)+Math.max(1,Math.round(enemy.maxhp*p.barrierMaxHpPct));}
  if(p.firstAttackAdvanceSec)enemy.encounterFirstAttackLead=p.firstAttackAdvanceSec;
 }
 return true;
}
function initialClock(enemy,slot){
 const lead=enemy.encounterFirstAttackLead||0;
 return Math.min(enemy.attackEvery,Math.max(0,enemy.attackEvery-(.9+slot*.3)+lead));
}
function regenTick(run){
 if(run?.encounterTraitId!=='unhallowed_regrowth')return 0;
 const p=get('unhallowed_regrowth').params;
 const live=run.enemies?.length?run.enemies:[run.enemy];let total=0;
 for(const enemy of live){
  if(!enemy||enemy.hp<=0||enemy.encounterTraitId!=='unhallowed_regrowth')continue;
  if(enemy.traitRegenAt===undefined)enemy.traitRegenAt=run.combatSeconds+p.intervalSec;
  if(run.combatSeconds+1e-9<enemy.traitRegenAt)continue;
  // At most one pulse per clock advancement; advance the next deadline without catch-up bursts.
  enemy.traitRegenAt=run.combatSeconds+p.intervalSec;
  const cap=Math.round(enemy.maxhp*p.maxTotalHealMaxHpPct),spent=enemy.traitRegrown||0;
  const heal=Math.max(0,Math.min(Math.round(enemy.maxhp*p.healMaxHpPct),cap-spent,enemy.maxhp-enemy.hp));
  if(heal>0){enemy.hp+=heal;enemy.traitRegrown=spent+heal;total+=heal;}
 }
 return total;
}
function deathPulse(run,fallen){
 if(run?.encounterTraitId!=='death_throes')return {damage:0,absorbed:0,triggers:0};
 const p=get('death_throes').params;
 const cap=Math.round(run.maxhp*p.maxPerEncounterPlayerMaxHpPct),perDeath=Math.round(run.maxhp*p.deathDamagePlayerMaxHpPct);
 let damage=0,absorbed=0,triggers=0;
 for(const enemy of fallen){
  if(!enemy||enemy.hp>0||enemy.traitDeathProcessed||enemy.encounterTraitId!=='death_throes')continue;
  enemy.traitDeathProcessed=true;
  const amount=Math.max(0,Math.min(Math.round(perDeath*(root.WandererV013ExpeditionBoons?.takenFactor(run)||1)),cap-(run.traitDeathThroesTotal||0)));
  if(!amount)continue;
  run.traitDeathThroesTotal=(run.traitDeathThroesTotal||0)+amount;
  const blocked=Math.min(run.barrier||0,amount),hit=amount-blocked;
  run.barrier=Math.max(0,(run.barrier||0)-blocked);
  run.hp=Math.max(0,run.hp-hit);damage+=hit;absorbed+=blocked;triggers++;
 }
 return {damage,absorbed,triggers};
}
const API=Object.freeze({get,assign,applyGroup,initialClock,regenTick,deathPulse});
root.WandererV013EncounterTraits=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
