// Wanderer v0.13 Stage 8.3 — reusable Boss summon, minion-death, heal and cast infrastructure.
// Existing Bosses have no new abilities until an explicit future Stage configures them.
// Pure deterministic combat-second state; no random rolls, reward writes or save migration.
(function(root){'use strict';
const LIMITS=Object.freeze({
 activeSlots:4,maxReserve:6,maxSummons:6,maxLivingMinions:4,maxEncounterEnemies:10,
 maxHealPerUse:.08,maxTotalHealing:.20,minCastSeconds:.25,maxCastSeconds:4,minCooldown:3,maxCooldown:60
});
function leader(run){const e=run?.encounterLeader||run?.enemies?.find(m=>m?.boss)||run?.enemy;return e?.boss?e:null;}
function attach(run,enemy=leader(run)){
 if(!run||!enemy?.boss||enemy.hp<=0||!Number.isFinite(enemy.maxhp)||enemy.maxhp<=0)return null;
 return run.bossInfrastructure={
  ownerStyle:enemy.bossStyle||'boss',summoned:0,minionDeaths:0,healed:0,
  maxSummons:LIMITS.maxSummons,maxLivingMinions:LIMITS.maxLivingMinions,
  healOnMinionDeath:.0,cast:null,readyAt:{},uses:{},interruptedUntil:0,interruptedName:''
 };
}
function configure(run,opts={}){
 const state=run?.bossInfrastructure;
 if(!state||!opts||typeof opts!=='object')return false;
 const {maxSummons,maxLivingMinions,healOnMinionDeath}=opts;
 if(maxSummons!==undefined&&(!Number.isInteger(maxSummons)||maxSummons<0||maxSummons>LIMITS.maxSummons))return false;
 if(maxLivingMinions!==undefined&&(!Number.isInteger(maxLivingMinions)||maxLivingMinions<0||maxLivingMinions>LIMITS.maxLivingMinions))return false;
 if(healOnMinionDeath!==undefined&&(!Number.isFinite(healOnMinionDeath)||healOnMinionDeath<0||healOnMinionDeath>LIMITS.maxHealPerUse))return false;
 if(maxSummons!==undefined)state.maxSummons=maxSummons;
 if(maxLivingMinions!==undefined)state.maxLivingMinions=maxLivingMinions;
 if(healOnMinionDeath!==undefined)state.healOnMinionDeath=healOnMinionDeath;
 return true;
}
function field(run){return run?.enemies?.length?run.enemies:run?.enemy?[run.enemy]:[];}
function summon(run,source,count,makeMinion,options={}){
 const empty={spawned:0,field:0,reserve:0,limited:true};
 if(!run||run.status!=='fight'||!source?.hp||(!source.boss&&!source.miniboss)||source!==run.encounterLeader||
    !Number.isInteger(count)||count<1||count>LIMITS.maxSummons||typeof makeMinion!=='function')return empty;
 const initial=field(run);
 if(!initial.includes(source))return empty;
 const ledger=source.boss?run.bossInfrastructure:(run.stage83EliteSummons??={summoned:0});
 if(!ledger)return empty;
 const queue=run.groupReserve||[];
 const current=[...initial,...queue],livingMinions=current.filter(e=>e?.hp>0&&e.role==='minion').length;
 const allowed=Math.max(0,Math.min(count,(ledger.maxSummons??LIMITS.maxSummons)-ledger.summoned,
    (ledger.maxLivingMinions??LIMITS.maxLivingMinions)-livingMinions,
    LIMITS.maxEncounterEnemies-(run.totalMobCount??current.length)));
 const hpFactor=Number.isFinite(options.hpFactor)?Math.max(.1,Math.min(1,options.hpFactor)):.42;
 const atkFactor=Number.isFinite(options.atkFactor)?Math.max(.1,Math.min(1,options.atkFactor)):.25;
 const defFactor=Number.isFinite(options.defFactor)?Math.max(.1,Math.min(1,options.defFactor)):.35;
 const intervalFactor=Number.isFinite(options.intervalFactor)?Math.max(1,Math.min(3,options.intervalFactor)):1.35;
 if(!allowed)return empty;
 if(!run.enemies)run.enemies=[...initial];
 run.groupReserve??=[];
 const result={spawned:0,field:0,reserve:0,limited:false};
 for(let i=0;i<allowed;i++){
  const open=run.enemies.findIndex(e=>e?.hp<=0&&e.groupDefeated);
  const slotAvailable=open>=0||run.enemies.length<LIMITS.activeSlots;
  if(!slotAvailable&&run.groupReserve.length>=LIMITS.maxReserve)break;
  const mob=makeMinion(i);
  if(!mob||mob.boss||mob.miniboss||mob.role!=='minion'||!Number.isFinite(mob.maxhp)||mob.maxhp<=0||
      !Number.isFinite(mob.atk)||mob.atk<0||!Number.isFinite(mob.attackEvery)||mob.attackEvery<=0)
   throw Error('Stage 8.3 requires valid summoned Minions');
  mob.maxhp=Math.max(1,Math.round(mob.maxhp*hpFactor));mob.hp=mob.maxhp;
  mob.atk=mob.atk===0?0:Math.max(1,Math.round(mob.atk*atkFactor));
  const originalDefense=mob.def||0,originalBase=mob.baseDef??originalDefense;
  mob.def=Math.max(0,Math.round(originalDefense*defFactor));
  mob.baseDef=Math.max(0,Math.round(originalBase*defFactor));
  mob.attackEvery*=intervalFactor;mob.groupClock=0;
  mob.stage83Summoned=true;mob.stage83Summoner=source.boss?'boss':'elite';
  root.WandererV013EnemyAbilities?.attach([mob],options.family||run.planeFamily||'decay',run.combatSeconds||0);
  if(slotAvailable){
   const slot=open>=0?run.enemies[open].groupSlot:run.enemies.length;
   mob.groupSlot=slot;mob.groupClock=-.3*(i+1);
   if(open>=0)run.enemies[open]=mob;else run.enemies.push(mob);
   root.WandererV013EnemyAbilities?.onEnter(mob,run.combatSeconds||0);
   result.field++;
  }else{
   mob.groupSlot=-1;
   run.groupReserve.push(mob);result.reserve++;
  }
  result.spawned++;ledger.summoned++;
 }
 if(result.spawned)run.totalMobCount=(run.totalMobCount??current.length)+result.spawned;
 result.limited=result.spawned<count;
 return result;
}
function recover(run,requested){
 const e=leader(run),s=run?.bossInfrastructure;
 if(run?.status!=='fight'||!e||e.hp<=0||!s||!Number.isFinite(requested)||requested<=0)return 0;
 const maxUse=Math.max(0,Math.round(e.maxhp*LIMITS.maxHealPerUse));
 const maxLifetime=Math.max(0,Math.round(e.maxhp*LIMITS.maxTotalHealing)-s.healed);
 const heal=Math.max(0,Math.min(Math.round(requested),maxUse,maxLifetime,Math.max(0,e.maxhp-e.hp)));
 e.hp+=heal;s.healed+=heal;
 return heal;
}
function onMinionDeath(run,mob){
 const empty={counted:false,healed:0,minionDeaths:run?.bossInfrastructure?.minionDeaths||0};
 if(!mob?.stage83Summoned||mob.role!=='minion'||mob.hp>0||mob.stage83DeathCounted)return empty;
 mob.stage83DeathCounted=true;
 const state=run?.bossInfrastructure;
 if(!state||mob.stage83Summoner!=='boss')return {counted:true,healed:0,minionDeaths:0};
 state.minionDeaths++;
 const e=leader(run);
 const healed=e?.hp>0?recover(run,Math.round(e.maxhp*state.healOnMinionDeath)):0;
 return {counted:true,healed,minionDeaths:state.minionDeaths};
}
function validAbility(ability){
 return !!ability&&typeof ability.id==='string'&&/^[a-z0-9_]{2,40}$/.test(ability.id)&&
  typeof ability.name==='string'&&ability.name.length>0&&ability.name.length<=80&&
  Number.isFinite(ability.cast)&&ability.cast>=LIMITS.minCastSeconds&&ability.cast<=LIMITS.maxCastSeconds&&
  Number.isFinite(ability.cooldown)&&ability.cooldown>=LIMITS.minCooldown&&ability.cooldown<=LIMITS.maxCooldown&&
  Number.isInteger(ability.maxUses)&&ability.maxUses>=1&&ability.maxUses<=6;
}
function prepare(run,ability){
 const s=run?.bossInfrastructure,e=leader(run),now=run?.combatSeconds||0;
 if(run?.status!=='fight'||!e||e.hp<=0||!s||!validAbility(ability)||s.cast||
   now<(s.readyAt[ability.id]||0)||(s.uses[ability.id]||0)>=ability.maxUses)return null;
 s.cast={id:ability.id,name:ability.name,until:now+ability.cast,cooldown:ability.cooldown,maxUses:ability.maxUses};
 s.interruptedUntil=0;s.interruptedName='';
 return {type:'prepare',enemy:e,ability:ability.name,readyAt:s.cast.until};
}
function interrupt(run,reason='stun'){
 const s=run?.bossInfrastructure,e=leader(run);
 if(!s?.cast||!e)return null;
 const cast=s.cast,now=Number(run.combatSeconds)||0;s.cast=null;
 s.readyAt[cast.id]=now+Math.min(cast.cooldown,3);
 s.interruptedUntil=now+1.2;s.interruptedName=cast.name;
 return {type:'interrupted',enemy:e,ability:cast.name,reason};
}
function tick(run,absoluteNow){
 const s=run?.bossInfrastructure,e=leader(run);
 if(!s?.cast||run.status!=='fight'||!e||e.hp<=0)return [];
 if((e.stunnedUntil||0)>absoluteNow){const event=interrupt(run,'stun');return event?[event]:[];}
 const now=Number(run.combatSeconds)||0;if(now+1e-7<s.cast.until)return [];
 const cast=s.cast;s.cast=null;
 s.readyAt[cast.id]=now+cast.cooldown;
 s.uses[cast.id]=(s.uses[cast.id]||0)+1;
 return [{type:'ready',enemy:e,ability:cast.name,id:cast.id,uses:s.uses[cast.id]}];
}
function status(enemy,run,now){
 const s=run?.bossInfrastructure;if(!enemy?.boss||enemy!==leader(run)||!s)return null;
 if(s.cast&&s.cast.until>now)return {kind:'casting',label:'Preparing',detail:s.cast.name,remaining:s.cast.until-now};
 if(s.interruptedUntil>now)return {kind:'interrupted',label:'Interrupted',detail:s.interruptedName,remaining:s.interruptedUntil-now};
 return null;
}
const API=Object.freeze({LIMITS,leader,attach,configure,summon,recover,onMinionDeath,prepare,interrupt,tick,status});
root.WandererV013BossInfrastructure=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
