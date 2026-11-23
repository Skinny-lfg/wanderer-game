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
// Stage 6.42 — one authoritative normal-room stat budget, applied ONCE.
// Replaces Stage 6.37 escort relief, Stage 6.38 Minion profile,
// Stage 6.39 solo reinforcement and Stage 6.40 additive opening-pressure
// adjustments. Risk is applied before this; no separate stage/group rebuffs.
// E1 protection decreases smoothly as earned equipment and skills mature.
const NORMAL_ROOM_BUDGET=Object.freeze({
 solo:Object.freeze({
  tank:Object.freeze({hp:1.28,atk:1.15}),
  skirmisher:Object.freeze({hp:1.36,atk:1.20}),
  caster:Object.freeze({hp:1.34,atk:1.18})
 }),
 minion:Object.freeze({hp:.38,atk:.60,def:.55,interval:1.18}),
 // One persistent mixed-roster offset and one E1 relief component; both
 // are resolved here in the same native budget rather than multiplied later.
 escortHpPerMinion:.040,escortHpEarly:.015,
 escortAtkPerMinion:.035,escortAtkEarly:.010,
 escortDefPerMinion:.020,escortDefEarly:.005,
 minEscortHp:.38,minEscortAtk:.50,minEscortDef:.65,
 earlyDecay:.50
});
function applyNormalRoomBudget(group,expedition){
 if(!Array.isArray(group)||!Number.isSafeInteger(expedition)||expedition<1||
  group.length<1||group.length>22||group.some(e=>!e||
   !Number.isFinite(e.maxhp)||!Number.isFinite(e.atk)||
   !Number.isFinite(e.def)||!Number.isFinite(e.baseDef)||
   !Number.isFinite(e.attackEvery)||e.maxhp<=0||e.attackEvery<=0))
  throw Error('Invalid native normal-room budget');
 if(group.some(e=>e.boss||e.miniboss))return {affected:0,minions:0};
 if(group.some(e=>e.normalRoomBudgetApplied))throw Error('Normal-room budget applied twice');
 const n=group.length,c=NORMAL_ROOM_BUDGET;
 const minions=group.filter(e=>e.role==='minion').length;
 const opening=Math.exp(-c.earlyDecay*(expedition-1));
 const perEnemy=n===2?.20:n<=4?.75:1;
 const pressure=n===1?1:1+(n-1)*perEnemy*opening;
 const escorts=n>=5?minions:0;
 // The old independent escort pass was removed. The single role budget
 // approaches a modest, fixed E10+ offset, not a 50% HP/ATK discount.
 const escort={
  hp:Math.max(c.minEscortHp,1-escorts*(c.escortHpPerMinion+c.escortHpEarly*opening)),
  atk:Math.max(c.minEscortAtk,1-escorts*(c.escortAtkPerMinion+c.escortAtkEarly*opening)),
  def:Math.max(c.minEscortDef,1-escorts*(c.escortDefPerMinion+c.escortDefEarly*opening))
 };
 for(const e of group){
  if(!['minion','tank','skirmisher','caster'].includes(e.role))
   throw Error('Unexpected normal-room role '+e.role);
  let hp=1,atk=1,def=1,interval=1;
  if(n===1){const solo=c.solo[e.role];if(solo){
   hp=solo.hp+.20*(1-opening);atk=solo.atk+.08*(1-opening);}}
  else if(e.role==='minion'){
   const divisor=pressure+minions*.5*opening;
   hp=c.minion.hp/(minions>=4?divisor:Math.sqrt(divisor));
   atk=c.minion.atk/divisor;def=c.minion.def;interval=c.minion.interval;
  }else{hp=escort.hp;atk=escort.atk/pressure;def=escort.def;}
  e.maxhp=Math.max(1,Math.round(e.maxhp*hp));
  e.hp=e.maxhp;
  e.atk=Math.max(1,Math.round(e.atk*atk));
  e.def=Math.max(0,Math.round(e.def*def));
  e.baseDef=Math.max(0,Math.round(e.baseDef*def));
  e.attackEvery*=interval;
  e.normalRoomBudgetApplied=true;
 }
 return {affected:n,minions,expedition,opening,pressure,escort};
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
root.WandererV012CombatCore=Object.freeze({evasionChance,enemyAttackType,referenceLevel,enemyStat,gearStat,endlessWeaponDamageBonus,estimateEnemy,createEnemyGroup,applyEncounterPressure,applyNormalRoomBudget,NORMAL_ROOM_BUDGET,livingEnemies,nextGroupTarget,groupComplete,affinityProcChance,applyExpeditionModifiers});
})(globalThis);
