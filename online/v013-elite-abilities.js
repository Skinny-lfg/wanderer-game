// Wanderer v0.13 Stage 8.2 — three Elite abilities, based on combat seconds.
// No combat RNG is consumed; existing Elite mechanics remain unchanged.
(function(root){'use strict';
const DEFINITIONS=Object.freeze({
 gravecaller:Object.freeze({name:'Call of the Fallen',role:'Summoner',icon:'☠',description:'Summons two undead Minions once at 65% HP.',threshold:.65,summons:2}),
 rotbound_exarch:Object.freeze({name:'Rotward Benediction',role:'Support',icon:'✚',description:'Grants an ally or itself Barrier worth 15% max HP, up to three times, every 10s.',first:3,cooldown:10,cast:.75,maxCasts:3,barrier:.15}),
 ashen_executioner:Object.freeze({name:'Ashen Sentence',role:'Heavy Striker',icon:'⚒',description:'Prepares a 1.5s heavy strike every 10s; maximum 18% of hero max HP before Block/Barrier. Stun and delay interrupt.',first:3.5,cooldown:10,cast:1.5,multiplier:2.4,capFraction:.18})
});
function attach(enemy,now=0){
 const spec=DEFINITIONS[enemy?.eliteType];
 if(!enemy?.miniboss||!spec||!Number.isFinite(now))return null;
 return enemy.stage82={type:enemy.eliteType,nextAt:now+(spec.first||0),castingUntil:0,chargedUntil:0,castCount:0,summoned:false,status:'',statusUntil:0};
}
function active(run){return (run?.enemies?.length?run.enemies:run?.enemy?[run.enemy]:[]).filter(e=>e?.hp>0);}
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
  if(!s.summoned&&enemy.hp<=enemy.maxhp*spec.threshold){
   s.summoned=true;s.status='Summoning';s.statusUntil=now+1.5;
   return [{type:'summon',enemy,ability:spec.name,count:spec.summons}];
  }
  return [];
 }
 if((enemy.stunnedUntil||0)>absoluteNow){
  const event=interrupt(enemy,run,'stun');return event?[event]:[];
 }
 if(spec.maxCasts&&s.castCount>=spec.maxCasts)return [];
 if(s.castingUntil){
  if(now+1e-7<s.castingUntil)return [];
  s.castingUntil=0;s.castCount++;s.nextAt=now+spec.cooldown;
  if(s.type==='rotbound_exarch'){
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
 if(s.type==='rotbound_exarch'&&!ally(run,enemy)){s.nextAt=now+1;return [];}
 s.castingUntil=now+spec.cast;s.status='Casting';s.statusUntil=0;
 return [{type:'prepare',enemy,ability:spec.name}];
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
 if(s.chargedUntil>now)return {kind:'enraged',label:'Heavy Strike',detail:spec.name,remaining:s.chargedUntil-now};
 if(s.statusUntil>now)return {kind:s.status==='Interrupted'?'interrupted':s.status==='Guarding'?'guarding':'casting',label:s.status,detail:spec.name,remaining:s.statusUntil-now};
 return null;
}
function info(enemy){const s=DEFINITIONS[enemy?.eliteType];return s?{name:s.role,icon:s.icon,description:s.description}:null;}
const API=Object.freeze({DEFINITIONS,attach,tick,interrupt,consumeStrike,status,info});
root.WandererV013EliteAbilities=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
