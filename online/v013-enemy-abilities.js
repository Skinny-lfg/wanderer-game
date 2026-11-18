// Wanderer v0.13 Stage 8.1 — timed normal-enemy class abilities.
// No combat RNG is consumed. Bosses/Elites keep their own mechanics.
// Times are combat seconds (not wall time); Minions have passive swarm pressure only.
(function(root){'use strict';
const DEFINITIONS=Object.freeze({
 blood:Object.freeze({
  tank:{name:'Sanguine Guard',type:'ward',power:.09,description:'Protects a nearby ally with a Blood Ward'},
  skirmisher:{name:'Crimson Rush',type:'strike',power:.16,secondary:'siphon',description:'Empowers the next strike and briefly siphons life'},
  caster:{name:'Blood Brand',type:'healing_hex',description:'Channels a short reduction to player healing'}
 }),
 decay:Object.freeze({
  tank:{name:'Rotward',type:'ward',power:.09,description:'Shields a nearby ally against decay'},
  skirmisher:{name:'Toxic Feint',type:'strike',power:.12,secondary:'wound',description:'Next strike causes a short healing wound'},
  caster:{name:'Blight Hex',type:'weakening_hex',description:'Channels Weakened on the player'}
 }),
 vitality:Object.freeze({
  tank:{name:'Heartwood Mend',type:'mend',power:.055,description:'Restores a wounded ally'},
  skirmisher:{name:'Thorn Lunge',type:'strike',power:.13,secondary:'siphon',description:'Next strike gains strength and restores health'},
  caster:{name:'Bloom Chant',type:'mend',power:.07,description:'Heals a wounded ally after channeling'}
 }),
 aegis:Object.freeze({
  tank:{name:'Warding Sigil',type:'ward',power:.12,description:'Protects a vulnerable ally with Barrier'},
  skirmisher:{name:'Runic Breaker',type:'strike',power:.14,description:'Empowers its next strike against the hero'},
  caster:{name:'Aegis Chant',type:'ward',power:.10,description:'Channels an ally Barrier'}
 }),
 fury:Object.freeze({
  tank:{name:'War Cry',type:'rally',power:.11,description:'Empowers the next strike of an ally'},
  skirmisher:{name:'Frenzied Flurry',type:'strike',power:.12,count:2,description:'Two brief empowered strikes'},
  caster:{name:'Ember Invocation',type:'rally',power:.12,description:'Channels an empowered allied attack'}
 }),
 magic:Object.freeze({
  tank:{name:'Prismatic Ward',type:'ward',power:.10,description:'Protects an ally with a short Arcane Ward'},
  skirmisher:{name:'Sparkstep',type:'strike',power:.13,secondary:'mana',description:'Next strike can burn a little Mana'},
  caster:{name:'Arcane Convergence',type:'strike',power:.19,secondary:'mana',description:'Channels a stronger magical next strike'}
 })
});
const PASSIVES=Object.freeze({
 blood:{name:'Crimson Pack',bonus:.05,description:'Swarm pressure improves melee attacks'},
 decay:{name:'Blight Swarm',bonus:.04,description:'Swarm pressure improves attacks'},
 vitality:{name:'Living Swarm',bonus:.03,description:'Swarm pressure improves attacks'},
 aegis:{name:'Ward Pack',bonus:.03,description:'Swarm pressure improves attacks'},
 fury:{name:'Feral Swarm',bonus:.07,description:'Swarm pressure improves attacks'},
 magic:{name:'Spark Swarm',bonus:.05,description:'Swarm pressure improves attacks'}
});
const TIMINGS=Object.freeze({
 tank:{first:2.6,cooldown:7.0,cast:.65},
 skirmisher:{first:2.2,cooldown:5.5,cast:.55},
 caster:{first:3.0,cooldown:6.5,cast:.85}
});
function attach(enemies,family,baseTime=0){
 if(!Array.isArray(enemies)||!DEFINITIONS[family]||!Number.isFinite(baseTime))throw Error('Invalid Stage 8.1 wave');
 for(let i=0;i<enemies.length;i++){
  const e=enemies[i];
  if(!e||e.boss||e.miniboss||!['minion','tank','skirmisher','caster'].includes(e.role))continue;
  if(e.role==='minion'){e.stage81={family,role:'minion',passive:PASSIVES[family].name};continue;}
  const a=DEFINITIONS[family][e.role],t=TIMINGS[e.role];
  e.stage81={family,role:e.role,name:a.name,nextAt:baseTime+t.first+(i%3)*.3,
   castingUntil:0,cycle:0,statusUntil:0,status:'',chargedUntil:0,charges:0,chargePower:0,chargeEffect:null};
 }
 return enemies;
}
function active(run){return (run?.enemies?.length?run.enemies:run?.enemy?[run.enemy]:[]).filter(e=>e?.hp>0);}
function preferredTarget(actors,source,kind){
 const allies=actors.filter(e=>e!==source&&e.hp>0),pool=allies.length?allies:[source];
 if(kind==='mend')return [...actors].sort((a,b)=>(a.hp/a.maxhp)-(b.hp/b.maxhp))[0];
 const priority={caster:0,skirmisher:1,tank:2,minion:3};
 return [...pool].sort((a,b)=>(priority[a.role]??4)-(priority[b.role]??4))[0];
}
function resolve(run,enemy,now){
 const state=enemy.stage81,definition=DEFINITIONS[state.family][state.role],actors=active(run);
 let target=enemy,result=0,label='';
 switch(definition.type){
  case 'ward':{
   target=preferredTarget(actors,enemy,'ward');
   const cap=Math.max(1,Math.round(target.maxhp*definition.power));
   const previous=target.barrier||0;
   target.barrier=Math.min(cap,previous+cap);
   result=target.barrier-previous;target.stage81GuardUntil=now+1.7;label='Guarding';
   break;
  }
  case 'mend':{
   target=preferredTarget(actors,enemy,'mend');
   result=Math.min(Math.max(0,target.maxhp-target.hp),Math.max(1,Math.round(target.maxhp*definition.power)));
   target.hp+=result;label='Renewing';
   break;
  }
  case 'rally':{
   target=preferredTarget(actors,enemy,'rally');
   target.stage81??={family:state.family,role:target.role};
   target.stage81.charges=Math.min(2,(target.stage81.charges||0)+1);
   target.stage81.chargePower=Math.max(target.stage81.chargePower||0,definition.power);
   target.stage81.chargedUntil=now+3.2;label='Enraged';result=1;
   break;
  }
  case 'strike':{
   state.charges=definition.count||1;state.chargePower=definition.power;
   state.chargeEffect=definition.secondary||null;state.chargedUntil=now+3.2;
   label='Enraged';result=state.charges;break;
  }
  case 'weakening_hex':{
   run.playerDebuffUntil=Math.max(run.playerDebuffUntil||0,(run.phase1ClockBase||0)+now+2.2);
   label='Hexed';result=1;break;
  }
  case 'healing_hex':{
   run.playerHealingDebuffUntil=Math.max(run.playerHealingDebuffUntil||0,(run.phase1ClockBase||0)+now+1.6);
   label='Hexed';result=1;break;
  }
  default:return null;
 }
 state.status=label;state.statusUntil=now+1.5;state.cycle++;
 return {type:'activate',enemy,ability:definition.name,target,result,label};
}
function onEnter(enemy,now){
 const s=enemy?.stage81,t=s&&TIMINGS[s.role];
 if(!t||!Number.isFinite(now))return;
 s.nextAt=Math.max(s.nextAt,now+t.first);
 s.castingUntil=0;s.charges=0;s.chargedUntil=0;s.status='';s.statusUntil=0;
}
function tick(run,absoluteNow){
 if(!run||run.status!=='fight')return [];
 const now=run.combatSeconds||0,events=[];
 for(const enemy of active(run)){
  const state=enemy.stage81;
  if(!state||!DEFINITIONS[state.family]||state.role==='minion'||enemy.boss||enemy.miniboss)continue;
  const spec=TIMINGS[state.role];
  if(!spec)continue;
  if((enemy.stunnedUntil||0)>absoluteNow){
   if(state.castingUntil){state.castingUntil=0;state.nextAt=now+Math.min(3.2,spec.cooldown*.5);
    state.status='Interrupted';state.statusUntil=now+1.1;
    events.push({type:'interrupted',enemy,ability:state.name});}
   continue;
  }
  if(state.castingUntil){
   if(now+1e-7>=state.castingUntil){state.castingUntil=0;state.nextAt=now+spec.cooldown;
    const event=resolve(run,enemy,now);if(event)events.push(event);}
   continue;
  }
  if(now+1e-7>=state.nextAt){
   state.castingUntil=now+spec.cast;state.status='Casting';state.statusUntil=0;
   events.push({type:'prepare',enemy,ability:state.name});
  }
 }
 return events;
}
function consumeStrike(enemy,now){
 const state=enemy?.stage81;
 if(!state||!state.charges||state.chargedUntil<=now)return null;
 state.charges--;const extra={bonus:state.chargePower||0,secondary:state.chargeEffect||null};
 if(!state.charges){state.chargedUntil=0;state.chargePower=0;state.chargeEffect=null;}
 return extra;
}
function onHit(enemy,run,damage,absoluteNow,extra){
 if(!enemy||!run||damage<=0||!extra?.secondary)return 0;
 if(extra.secondary==='siphon'){
  const heal=Math.min(Math.max(0,enemy.maxhp-enemy.hp),Math.max(1,Math.round(damage*.17)),Math.round(enemy.maxhp*.025));
  enemy.hp+=heal;return heal;
 }
 if(extra.secondary==='wound'){
  run.playerHealingDebuffUntil=Math.max(run.playerHealingDebuffUntil||0,absoluteNow+1.6);return 1;
 }
 if(extra.secondary==='mana'){
  const burn=Math.min(run.mp||0,Math.max(1,Math.ceil((run.maxmp||0)*.03)));
  run.mp-=burn;return burn;
 }
 return 0;
}
function packFactor(run,enemy){
 const state=enemy?.stage81;
 if(!state||state.role!=='minion'||!PASSIVES[state.family])return 1;
 const count=active(run).filter(e=>e.stage81?.role==='minion'&&e.stage81.family===state.family).length;
 return count>=2?1+PASSIVES[state.family].bonus:1;
}
function status(enemy,now){
 const s=enemy?.stage81;if(!s)return null;
 if(enemy.stage81GuardUntil>now)return {kind:'guarding',label:'Guarding',detail:'Protected',remaining:enemy.stage81GuardUntil-now};
 if(s.role==='minion')return null;
 if(s.castingUntil>now)return {kind:'casting',label:'Casting',detail:s.name,remaining:Math.max(0,s.castingUntil-now)};
 if(s.charges>0&&s.chargedUntil>now)return {kind:'enraged',label:'Enraged',detail:s.name,remaining:Math.max(0,s.chargedUntil-now)};
 if(s.statusUntil>now)return {kind:s.status==='Enraged'?'enraged':s.status==='Interrupted'?'interrupted':'guarding',label:s.status,detail:s.name,remaining:s.statusUntil-now};
 return null;
}
function describe(enemy){
 const s=enemy?.stage81;if(!s)return '';
 return s.role==='minion'?PASSIVES[s.family]?.description||'':
  DEFINITIONS[s.family]?.[s.role]?.description||'';
}
const API=Object.freeze({DEFINITIONS,PASSIVES,TIMINGS,attach,onEnter,tick,consumeStrike,onHit,packFactor,status,describe});
root.WandererV013EnemyAbilities=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
