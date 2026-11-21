// Wanderer v0.13 Stage 8.2 — three Elite abilities, based on combat seconds.
// No combat RNG is consumed; existing Elite mechanics remain unchanged.
(function(root){'use strict';
// Stage 6.19: individual endgame Elite scaling only. Existing E1–E5
// attributes and every ability remain unchanged; gains reach their cap at E35.
// Explicit individual coefficients avoid a blanket Elite buff that hurts E5.
const ELITE_SCALING=Object.freeze({
 tank:Object.freeze({hp:.55,atk:.23,def:.10}),
 berserker:Object.freeze({hp:.38,atk:.17,def:.04}),
 vampire:Object.freeze({hp:.20,atk:.10,def:.02}),
 caster:Object.freeze({hp:.52,atk:.22,def:.08}),
 gravecaller:Object.freeze({hp:.16,atk:.10,def:.03}),
 oathbound_exarch:Object.freeze({hp:.62,atk:.27,def:.12}),
 briarspine_horror:Object.freeze({hp:.60,atk:.25,def:.08}),
 ashen_executioner:Object.freeze({hp:.55,atk:.23,def:.08})
});
function scalingFor(type,level){
 if(!Object.hasOwn(ELITE_SCALING,type)||!Number.isFinite(level)||level<1)
  throw Error('Invalid Stage 6.19 Elite/Expedition scaling request');
 const ramp=Math.max(0,Math.min(1,(level-5)/30));
 const gain=ELITE_SCALING[type];
 return {hp:1+gain.hp*ramp,atk:1+gain.atk*ramp,def:1+gain.def*ramp};
}
const BOUND_SOUL_VARIANTS=Object.freeze([
 Object.freeze({name:'Wailing Soul',image:'assets/mobs/gravecaller/gravecaller_wailing_soul.png'}),
 Object.freeze({name:'Hollow Soul',image:'assets/mobs/gravecaller/gravecaller_hollow_soul.png'}),
 Object.freeze({name:'Fractured Soul',image:'assets/mobs/gravecaller/gravecaller_fractured_soul.png'})
]);
function boundSoulVariant(totalSummoned){
 if(!Number.isSafeInteger(totalSummoned)||totalSummoned<0)throw Error('Invalid Gravecaller summon ordinal');
 return BOUND_SOUL_VARIANTS[totalSummoned%BOUND_SOUL_VARIANTS.length];
}
// Separate summoned enemy archetype: no Realm mob name, portrait or ability descriptor.
// Native Minion role/scaling, AI, attack cadence and Deathbound are deliberately preserved.
function boundSoulArchetype(totalSummoned){
 const variant=boundSoulVariant(totalSummoned);
 return {name:variant.name,image:variant.image,role:'minion',summonFamily:'gravecaller',summonKind:'bound_soul'};
}
const DEFINITIONS=Object.freeze({
 gravecaller:Object.freeze({name:'Call of the Fallen',role:'Summoner',icon:'☠',description:'Channels a 1s interruptible ritual at 85% and 40% HP, summoning up to two bound souls (four total, two alive). Each successful bound soul hit adds Deathbound Decay (up to 4 stacks, 4s), dealing damage every second until the summons die.',thresholds:Object.freeze([.85,.40]),summons:2,maxSummons:4,maxLiving:2,cast:1,hpFactor:.50,atkFactor:.35,intervalFactor:1.20}),
 oathbound_exarch:Object.freeze({name:'Oathward Benediction',role:'Aegis Support',icon:'⛨',description:'An oath of Aegis grants an ally or itself Barrier worth 15% max HP, up to three times, every 10s.',first:3,cooldown:10,cast:.75,maxCasts:3,barrier:.15}),
 briarspine_horror:Object.freeze({name:'Thornbloom',role:'Thorns',icon:'🌵',description:'Vitality: every 12s, prepares for 1s and reflects 15% of direct HP damage for 4s (1.5% of hero max HP per hit, 6% per bloom).',first:12,cooldown:12,cast:1}),
 ashen_executioner:Object.freeze({name:'Ashen Sentence',role:'Heavy Striker',icon:'⚒',description:'Prepares a 1.5s heavy strike every 10s; maximum 18% of hero max HP before Block/Barrier. Stun and delay interrupt.',first:3.5,cooldown:10,cast:1.5,multiplier:2.4,capFraction:.18})
});
function attach(enemy,now=0){
 const spec=DEFINITIONS[enemy?.eliteType];
 if(!enemy?.miniboss||!spec||!Number.isFinite(now))return null;
 return enemy.stage82={type:enemy.eliteType,nextAt:now+(spec.first||0),castingUntil:0,chargedUntil:0,castCount:0,summoned:false,summonPhase:0,status:'',statusUntil:0};
}
function active(run){return (run?.enemies?.length?run.enemies:run?.enemy?[run.enemy]:[]).filter(e=>e?.hp>0);}
// Count only this encounter's living bound souls, including reserves.
function livingSummons(run){
 return [...(run?.enemies?.length?run.enemies:run?.enemy?[run.enemy]:[]),...(run?.groupReserve||[])]
  .filter(e=>e?.hp>0&&e.stage83Summoned&&e.stage83Summoner==='elite'&&e.role==='minion').length;
}
// Deathbound Ritual: only the Gravecaller's bound souls can infect.
// All timing is deterministic combat time; stacks cannot persist after the
// last living summon dies, the owner dies or the combat finishes.
const DEATHBOUND=Object.freeze({maxStacks:4,duration:4,tickSeconds:1,damagePerStack:.0075});
function deathboundOwner(run){
 const e=run?.encounterLeader||run?.enemies?.find(m=>m?.miniboss&&m?.eliteType==='gravecaller');
 return run?.status==='fight'&&e?.hp>0&&e.miniboss&&e.eliteType==='gravecaller'?e:null;
}
function isDeathboundMinion(run,mob){
 return !!deathboundOwner(run)&&mob?.hp>0&&mob.role==='minion'&&
  mob.stage83Summoned&&mob.stage83Summoner==='elite'&&
  (run?.enemies||[]).includes(mob);
}
function deathboundStatus(run){
 const state=run?.deathboundDecay,now=Number(run?.combatSeconds)||0;
 if(!state||!deathboundOwner(run)||!livingSummons(run)||now+1e-7>=state.expiresAt)return null;
 return {stacks:state.stacks,remaining:Math.max(0,state.expiresAt-now)};
}
function applyDeathbound(run,mob,hit){
 if(!(hit>0)||!isDeathboundMinion(run,mob))return null;
 const now=Number(run.combatSeconds)||0;
 const previous=deathboundStatus(run);
 const state={stacks:Math.min(DEATHBOUND.maxStacks,(previous?.stacks||0)+1),
  expiresAt:now+DEATHBOUND.duration,
  nextAt:previous&&run.deathboundDecay.nextAt>now?
   run.deathboundDecay.nextAt:now+DEATHBOUND.tickSeconds};
 run.deathboundDecay=state;
 return {stacks:state.stacks,remaining:DEATHBOUND.duration};
}
function tickDeathbound(run){
 const current=run?.deathboundDecay;
 if(!current)return null;
 const status=deathboundStatus(run);
 if(!status){delete run.deathboundDecay;return {ended:true,damage:0,absorbed:0};}
 const now=Number(run.combatSeconds)||0;
 if(now+1e-7<current.nextAt)return null;
 current.nextAt=now+DEATHBOUND.tickSeconds;
 const requested=Math.max(1,Math.round(run.maxhp*DEATHBOUND.damagePerStack*current.stacks));
 const absorbed=Math.min(Math.max(0,run.barrier||0),requested);
 run.barrier=Math.max(0,(run.barrier||0)-absorbed);
 const damage=Math.min(Math.max(0,run.hp),Math.max(0,requested-absorbed));
 run.hp-=damage;
 return {stacks:current.stacks,damage,absorbed,remaining:status.remaining};
}
function ally(run,source){
 const rank={caster:0,skirmisher:1,tank:2,minion:3};
 return active(run).filter(e=>e!==source).sort((a,b)=>(rank[a.role]??4)-(rank[b.role]??4))[0]||source;
}
function interrupt(enemy,run,reason='stun'){
 const s=enemy?.stage82;
 if(!s||!DEFINITIONS[s.type]||(!s.castingUntil&&!s.chargedUntil))return null;
 const now=Number(run?.combatSeconds)||0;
 s.castingUntil=0;s.chargedUntil=0;s.nextAt=now+3;
 s.status='Interrupted';s.statusUntil=now+1.2;
 return {type:'interrupted',enemy,ability:DEFINITIONS[s.type].name,reason};
}
function tick(run,absoluteNow){
 if(!run||run.status!=='fight')return [];
 const enemy=active(run).find(e=>e.miniboss&&e.stage82&&DEFINITIONS[e.stage82.type]);
 if(!enemy)return [];
 const s=enemy.stage82,spec=DEFINITIONS[s.type],now=Number(run.combatSeconds)||0;
 if(s.type==='gravecaller'){
  // Stuns interrupt an in-progress ritual, and a delayed retry retains
  // the phase. A rapid HP drop never skips the 85% phase.
  if((enemy.stunnedUntil||0)>absoluteNow){
   const event=interrupt(enemy,run,'stun');return event?[event]:[];
  }
  const phase=s.summonPhase??(s.summoned?1:0);
  if(s.castingUntil){
   if(now+1e-7<s.castingUntil)return [];
   s.castingUntil=0;
   const slots=Math.max(0,spec.maxLiving-livingSummons(run));
   if(!slots){s.nextAt=now+.5;s.status='';return [];}
   s.summonPhase=phase+1;s.summoned=true;s.castCount++;
   s.status='Summoning';s.statusUntil=now+1;
   return [{type:'summon',enemy,ability:spec.name,count:Math.min(spec.summons,slots),wave:s.summonPhase}];
  }
  if(phase>=spec.thresholds.length||now+1e-7<s.nextAt||
     enemy.hp>enemy.maxhp*spec.thresholds[phase]||
     livingSummons(run)>=spec.maxLiving)return [];
  s.castingUntil=now+spec.cast;s.status='Casting';s.statusUntil=0;
  return [{type:'prepare',enemy,ability:spec.name,wave:phase+1}];
 }
 if((enemy.stunnedUntil||0)>absoluteNow){
  const event=interrupt(enemy,run,'stun');return event?[event]:[];
 }
 if(spec.maxCasts&&s.castCount>=spec.maxCasts)return [];
 if(s.castingUntil){
  if(now+1e-7<s.castingUntil)return [];
  s.castingUntil=0;s.castCount++;s.nextAt=now+spec.cooldown;
  if(s.type==='briarspine_horror'){
   s.bloomUntil=now+4;s.reflected=0;s.nextAt-=spec.cast;
   return [{type:'activate',enemy,ability:spec.name}];
  }
  if(s.type==='oathbound_exarch'){
   const target=ally(run,enemy);
   if(!target){s.castCount--;s.nextAt=now+1;return [];}
   const cap=Math.max(1,Math.round(target.maxhp*spec.barrier));
   const before=target.barrier||0;target.barrier=Math.max(before,cap);
   target.stage81GuardUntil=now+1.8;s.status=target===enemy?'Self Ward':'Guarding';s.statusUntil=now+1.5;
   return [{type:'activate',enemy,ability:spec.name,target,result:target.barrier-before}];
  }
  s.chargedUntil=now+3.5;s.status='Heavy Strike';s.statusUntil=s.chargedUntil;
  return [{type:'activate',enemy,ability:spec.name,target:null,result:0}];
 }
 if(now+1e-7<s.nextAt)return [];
 if(s.type==='oathbound_exarch'&&!ally(run,enemy)){s.nextAt=now+1;return [];}
 s.castingUntil=now+spec.cast;s.status='Casting';s.statusUntil=0;
 return [{type:'prepare',enemy,ability:spec.name}];
}
function thornbloomDamage(enemy,now,directHpLoss,heroMaxHp){
 const s=enemy?.stage82;
 if(s?.type!=='briarspine_horror'||!(now<s.bloomUntil)||directHpLoss<=0)return 0;
 const amount=Math.max(0,Math.min(directHpLoss*.15,heroMaxHp*.015,heroMaxHp*.06-s.reflected));
 s.reflected+=amount;
 return amount;
}
function consumeStrike(enemy,now){
 const s=enemy?.stage82,spec=DEFINITIONS[s?.type];
 if(!spec||s.type!=='ashen_executioner'||!s.chargedUntil)return null;
 if(s.chargedUntil<=now){s.chargedUntil=0;return null;}
 s.chargedUntil=0;s.status='';s.statusUntil=0;
 return {multiplier:spec.multiplier,capFraction:spec.capFraction,ability:spec.name};
}
function status(enemy,now){
 const s=enemy?.stage82,spec=DEFINITIONS[s?.type];
 if(!spec||enemy.hp<=0)return null;
 if(s.castingUntil>now)return {kind:'casting',label:'Casting',detail:spec.name,remaining:s.castingUntil-now};
 if(s.bloomUntil>now)return {kind:'guarding',label:'🌵 Thornbloom',detail:spec.description,remaining:s.bloomUntil-now};
 if(s.chargedUntil>now)return {kind:'enraged',label:'Heavy Strike',detail:spec.name,remaining:s.chargedUntil-now};
 if(s.statusUntil>now)return {kind:s.status==='Interrupted'?'interrupted':s.status==='Guarding'?'guarding':'casting',label:s.status,detail:spec.name,remaining:s.statusUntil-now};
 return null;
}
function info(enemy){const s=DEFINITIONS[enemy?.eliteType];return s?{name:s.role,icon:s.icon,description:s.description}:null;}
const API=Object.freeze({ELITE_SCALING,scalingFor,DEFINITIONS,DEATHBOUND,boundSoulVariant,boundSoulArchetype,thornbloomDamage,attach,tick,interrupt,consumeStrike,status,info,livingSummons,applyDeathbound,tickDeathbound,deathboundStatus});
root.WandererV013EliteAbilities=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
