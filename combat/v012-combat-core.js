// Wanderer v0.12 — one authoritative implementation of combat calculations.
// Keep deterministic and side-effect-free: state, timers and logging are managed by the caller.
(function(root){'use strict';
function evasionChance(rating,tier,EVASION_SCALE,EVASION_CAP){
 if(!Number.isFinite(rating)||rating<=0)return 0;
 const level=Math.max(1,Number(tier)||1);
 const scale=EVASION_SCALE*(2+referenceLevel(level)*.91)*(!root.WandererExpeditionProgression&&level>200?1+.005*(level-200):1);
 return Math.min(EVASION_CAP,1/(1+scale/rating));
}

function enemyAttackType(enemy){
 if(enemy.attackType)return enemy.attackType;
 return enemy.eliteType==='caster'||enemy.bossStyle==='leech'?'spell':'physical';
}

function referenceLevel(level){return root.WandererExpeditionProgression?root.WandererExpeditionProgression.enemyReference(level):Math.min(200,level);}
function enemyStat(level,value){return !root.WandererExpeditionProgression&&level>200?Math.round(value*(1+.005*(level-200))):value;}
function gearStat(level,value){return level>200?Math.round(value*(1+.0048*(level-200))):value;}
function endlessWeaponDamageBonus(level,main,off){
 if(root.WandererExpeditionProgression)return 0;
 const progress=Math.max(0,Math.min(1,(level-200)/100));
 if(!progress)return 0;
 const weapon=main?.subtype,offhand=off?.subtype;
 const maximum=weapon==='Sword'&&offhand==='Shield'?.20:
  weapon==='Mace'&&offhand==='Shield'?.30:
  weapon==='Wand'&&offhand==='Orb'?.15:0;
 return maximum*progress;
}
// All native enemies use the SAME E reference independent of room number or
// how many other enemies are present. Identity budgets are assigned by enemyFor.
function estimateEnemy(level){
 const reference=referenceLevel(level);
 const base={hp:27+reference*14,atk:4+reference*3,def:1+reference*.62};
 return {hp:enemyStat(level,Math.round(Math.round(base.hp*1.4)*1.4)),
  atk:enemyStat(level,Math.round(Math.round(base.atk*1.25)*1.4)),
  def:enemyStat(level,Math.round(Math.round(base.def*1.2)*1.4))};
}

function applyEncounterPressure(group,risk){
 const hpRisk=1+.10*risk,attackRisk=1+.12*risk;
 for(const enemy of group){
  let endurance=3,pressure=.65;
  if(enemy.boss){
   endurance=1.8; // Boss base stats already include their own multiplier.
  }else if(enemy.miniboss){
   endurance=3.05;
   pressure=enemy.eliteType==='tank'?1.40:1.12;
  }
  enemy.hp=enemy.maxhp=Math.round(enemy.maxhp*endurance*hpRisk);
  enemy.attackEvery*=1.15;
  enemy.atk=Math.max(1,Math.round(enemy.atk*pressure*attackRisk));
 }
}
// Stage 6.38 — normal-room Minions are intentionally fragile trash mobs.
// Only normal room encounters call this once, AFTER Risk and BEFORE Traits,
// making small groups safer too. Boss/Elite special summons do NOT use it.
// This changes each Minion's own native role profile, not a blanket group
// debuff or a dynamic handicap that fluctuates as Minions die.
const NORMAL_ROOM_MINION_PROFILE=Object.freeze({
 hp:.38,atk:.60,def:.55,attackInterval:1.18
});
function applyNormalRoomMinionProfile(group){
 if(!Array.isArray(group)||group.some(e=>!e||
  !Number.isFinite(e.maxhp)||!Number.isFinite(e.atk)||
  !Number.isFinite(e.def)||!Number.isFinite(e.attackEvery)))
  throw Error('Invalid normal room Minion profile group');
 if(group.some(e=>e.boss||e.miniboss))return {affected:0};
 let affected=0;
 for(const e of group){
  if(e.role!=='minion')continue;
  if(e.normalRoomMinionProfileApplied)throw Error('Normal Minion profile applied twice');
  const b=NORMAL_ROOM_MINION_PROFILE;
  e.maxhp=Math.max(1,Math.round(e.maxhp*b.hp));
  e.hp=Math.min(e.hp,e.maxhp);
  e.atk=Math.max(1,Math.round(e.atk*b.atk));
  e.def=Math.max(0,Math.round(e.def*b.def));
  e.baseDef=Math.max(0,Math.round(e.baseDef*b.def));
  e.attackEvery*=b.attackInterval;
  e.normalRoomMinionProfileApplied=true;
  affected++;
 }
 return {affected};
}
// Stage 6.37: a large mixed room taxes ONLY its principal mobs for the number
// of Minions in its complete initial roster (including reserve slots).
// The minions themselves keep FULL native HP/ATK/DEF and combat timings.
// Solo/small rooms, all-principal groups, Bosses and Elites stay unchanged.
// This is a single encounter-time change, NOT a new level scaling curve.
const MINION_ESCORT_RELIEF=Object.freeze({
 minimumGroupSize:5, hpLossPerMinion:.055, atkLossPerMinion:.045,
 defLossPerMinion:.025, minHpFactor:.38, minAtkFactor:.50, minDefFactor:.65
});
function applyMinionEscortRelief(group){
 if(!Array.isArray(group)||!group.length||group.some(e=>!e||!Number.isFinite(e.maxhp)||
  !Number.isFinite(e.atk)||!Number.isFinite(e.def)||!Number.isFinite(e.baseDef)))
  throw Error('Invalid native Minion escort group');
 const minions=group.filter(e=>e.role==='minion'&&!e.boss&&!e.miniboss).length;
 const zero=Object.freeze({hp:1,atk:1,def:1});
 if(group.length<MINION_ESCORT_RELIEF.minimumGroupSize||minions===0||
  group.some(e=>e.boss||e.miniboss))return {minions,affected:0,factors:zero};
 const cfg=MINION_ESCORT_RELIEF;
 const factors={
  hp:Math.max(cfg.minHpFactor,1-minions*cfg.hpLossPerMinion),
  atk:Math.max(cfg.minAtkFactor,1-minions*cfg.atkLossPerMinion),
  def:Math.max(cfg.minDefFactor,1-minions*cfg.defLossPerMinion)
 };
 let affected=0;
 for(const e of group){
  if(e.role==='minion')continue;
  // Called once after native Risk 0–2 modifiers. No second group multiplier.
  if(e.minionEscortReliefApplied)throw Error('Minion escort relief applied twice');
  if(!['tank','skirmisher','caster'].includes(e.role))
   throw Error('Unexpected principal role in native mixed room '+e.role);
  e.maxhp=Math.max(1,Math.round(e.maxhp*factors.hp));
  e.hp=Math.min(e.hp,e.maxhp);
  e.atk=Math.max(1,Math.round(e.atk*factors.atk));
  e.def=Math.max(0,Math.round(e.def*factors.def));
  e.baseDef=Math.max(0,Math.round(e.baseDef*factors.def));
  e.minionEscortReliefApplied=true;
  affected++;
 }
 return {minions,affected,factors};
}
// Stage 6.33: a Tank in a 22-enemy swarm is exactly the same Tank as
// the one in a solo room (at the same E and risk). Never divide HP/ATK/DEF
// by group size or scale escorts separately. Only active slots and attack
// clocks differ; pending enemies keep their native full stats.
function createEnemyGroup(spawn,count,options={}){
 if(typeof spawn!=='function'||!Number.isInteger(count)||count<1||count>22||
    !options||typeof options!=='object')throw Error('Invalid enemy group');
 if(Object.hasOwn(options,'scale')||Object.hasOwn(options,'scaleFor'))
  throw Error('Group-size stat scaling was removed in Stage 6.33');
 const activeSlots=options.activeSlots??Math.min(4,count);
 if(!Number.isInteger(activeSlots)||activeSlots<1||activeSlots>4||activeSlots>count)
  throw Error('Invalid active mob slots');
 const seen=new Set();
 return Array.from({length:count},(_,index)=>{
  const enemy=spawn(index);
  if(!enemy||seen.has(enemy)||!Number.isFinite(enemy.maxhp)||!Number.isFinite(enemy.atk)||
     !Number.isFinite(enemy.attackEvery)||enemy.maxhp<=0||enemy.atk<0||enemy.attackEvery<=0)
   throw Error('Invalid enemy');
  seen.add(enemy);
  if(count>1&&(enemy.boss||enemy.miniboss))throw Error('Bosses and elites must be solo');
  if(count===1)return enemy;
  enemy.groupSlot=index%activeSlots;
  enemy.groupClock=-(enemy.groupSlot*enemy.attackEvery/activeSlots);
  return enemy;
 });
}

function livingEnemies(enemies){return enemies.filter(enemy=>enemy.hp>0);}
function nextGroupTarget(enemies){return enemies.find(enemy=>enemy.hp>0)||null;}
function groupComplete(enemies){return enemies.length>0&&enemies.every(enemy=>enemy.hp<=0);}

function affinityProcChance(kind,cast=false){return cast?.9:kind==='Daggers'?.52:kind==='Two-Handed'?.26:.32}

function applyExpeditionModifiers(stats,e){
 const s={...stats};
 for(const [key,field]of [['might','attack'],['arcane','spellPower'],['ironhide','defense'],['haste','attacksPerSec']])if(e[key]?.remaining>0)s[field]*=1+e[key].power;
 if(e.attack)s.attack*=1+e.attack;if(e.defense)s.defense*=1+e.defense;
 return s;
}
root.WandererV012CombatCore=Object.freeze({evasionChance,enemyAttackType,referenceLevel,enemyStat,gearStat,endlessWeaponDamageBonus,estimateEnemy,createEnemyGroup,applyEncounterPressure,applyNormalRoomMinionProfile,NORMAL_ROOM_MINION_PROFILE,applyMinionEscortRelief,MINION_ESCORT_RELIEF,livingEnemies,nextGroupTarget,groupComplete,affinityProcChance,applyExpeditionModifiers});
})(globalThis);
