// Wanderer v0.13 Stage 3: boss properties applied to the existing combat engine.
// All effects are scoped to one boss encounter. No independent combat physics.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation;
if(!F)throw Error('Stage 0 foundation is required for boss modifiers');
const byId=new Map(F.CATALOG.bossModifiers.map(x=>[x.id,x]));
const get=id=>byId.get(id)||null;
const bossOf=run=>run?.enemies?.find(e=>e?.boss)||run?.enemy?.boss&&run.enemy||null;
function selection(game){
 const d=game?.dungeon;if(!d?.realm||!d.foundationManifest)return [];
 return d.foundationManifest.cards.find(c=>c.realmId===d.realm)?.bossModifierIds||[];
}
function known(game,realmId){
 const d=game?.dungeon;if(!d?.foundationManifest)return null;
 const card=d.foundationManifest.cards.find(c=>c.realmId===realmId);
 const id=card?.bossModifierIds?.[0];return get(id);
}
function check(ids,style,conditionId){
 if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length)return false;
 const condition=conditionId?F.lookup('conditions',conditionId):null;
 if(conditionId&&!condition)return false;
 return ids.every(id=>{
  const item=get(id);
  return item&&!item.excludeBossStyles?.includes(style)&&!item.conflicts?.includes(conditionId)&&!condition?.conflicts?.includes(id);
 });
}
function extraEscorts(ids,base){
 if(!Number.isInteger(base)||base<0||base>3)throw Error('Invalid base escorts');
 const params=get('gravebound_retinue').params;
 return ids.includes('gravebound_retinue')?Math.min(params.maxEscorts,base+params.extraEscorts):base;
}
function activate(run,boss,ids){
 if(!run||!boss?.boss||!Array.isArray(ids)||ids.some(id=>!get(id)))return false;
 if(boss.bossModifiersApplied)throw Error('Boss modifiers already applied');
 boss.bossModifiersApplied=true;
 run.bossModifierIds=[...ids];
 const ward=get('bone_ward').params;
 if(ids.includes('bone_ward'))boss.barrier=(boss.barrier||0)+Math.max(1,Math.round(boss.maxhp*ward.barrierMaxHpPct));
 if(ids.includes('graven_hide')){
  const {defenseMult}=get('graven_hide').params;
  const base=boss.baseDef??boss.def;
  boss.def=Math.max(0,Math.round(boss.def*defenseMult));
  boss.baseDef=Math.max(0,Math.round(base*defenseMult));
 }
 if(ids.includes('profane_pulse'))run.bossNextPulseAt=get('profane_pulse').params.intervalSec;
 return true;
}
function tick(run){
 const result={frenzy:false,pulse:false,damage:0,absorbed:0};
 const boss=bossOf(run);
 if(!boss||boss.hp<=0||run?.status!=='fight')return result;
 const ids=run.bossModifierIds||[];
 if(ids.includes('sanguine_frenzy')&&!boss.sanguineFrenzyActive){
  const p=get('sanguine_frenzy').params;
  if(boss.hp<boss.maxhp*p.hpThreshold){
   boss.sanguineFrenzyActive=true;
   boss.attackEvery=Math.max(.15,boss.attackEvery/p.attackSpeedMult);
   result.frenzy=true;
  }
 }
 if(ids.includes('profane_pulse')){
  const p=get('profane_pulse').params;
  const deadline=run.bossNextPulseAt??p.intervalSec;
  if(run.combatSeconds+1e-9>=deadline){
   // One pulse per real deadline; advance exactly one interval to avoid drifting.
   run.bossNextPulseAt=deadline+p.intervalSec;
   const amount=Math.max(1,Math.round(run.maxhp*p.damagePlayerMaxHpPct*(root.WandererV013ExpeditionBoons?.takenFactor(run)||1)));
   const impact=root.WandererV012Buildcraft?.absorbBarrier(run,amount)??plainBarrierImpact(run,amount),blocked=impact.absorbed;
   const actual=Math.min(run.hp,impact.hit);
   run.hp=Math.max(0,run.hp-actual);
   result.pulse=true;result.damage=actual;result.absorbed=blocked;
  }
 }
 return result;
}
function healingFactor(run){return run?.status==='fight'&&bossOf(run)&&run.bossModifierIds?.includes('soul_drain')?get('soul_drain').params.healingReceivedMult:1;}
const API=Object.freeze({get,selection,known,check,extraEscorts,activate,tick,healingFactor,bossOf});
root.WandererV013BossModifiers=API;
if(typeof module==='object'&&module.exports)module.exports=API;
// Standalone module fixtures without buildcraft have no player Barrier talents.
function plainBarrierImpact(run,amount){const absorbed=Math.min(Math.max(0,run.barrier||0),amount);run.barrier=Math.max(0,(run.barrier||0)-absorbed);return {absorbed,hit:amount-absorbed};}
})(globalThis);
