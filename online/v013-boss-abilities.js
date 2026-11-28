// Wanderer v0.13 Stage 8.4 — six affinity bosses, encounter-scoped deterministic mechanics.
// Combat art is shared by the arena and the affinity profiles.
(function(root){'use strict';
const I=root.WandererV013BossInfrastructure;
if(!I)throw Error('Stage 8.4 requires Boss infrastructure');
const FRAGMENT_RETURN_SECONDS=10;
const PROFILES=Object.freeze({
 blood:Object.freeze({id:'rift',style:'leech',name:'The Creditor',location:"Harbinger's Rift",icon:'🩸',description:'Blood Offering: summon a Riftbound Vessel at 70% and 35% HP; after 10s alive it sacrifices itself to heal the boss 5%. Basic lifesteal is 18%.',image:'assets/bosses/v013/rift-harbinger.png',attack:'assets/bosses/v013/rift-harbinger.png'}),
 decay:Object.freeze({id:'carrion',style:'matriarch',name:'Carrion Matriarch',location:"Matriarch's Brood",icon:'☠',description:'Brood of Decay: summons two Carrion Broodlings at 75% and 40% HP. With two living Minions in the arena she takes 15% less direct damage.',image:'assets/bosses/v013/carrion-matriarch.png',attack:'assets/bosses/v013/carrion-matriarch.png'}),
 radiance:Object.freeze({id:'heartroot',style:'devourer',name:'Gullet',location:"Heartroot's Hollow",icon:'☀',description:'Fragmentation: separates two light fragments at 70% and 35% HP. A fragment that survives 10 seconds in the arena returns and restores 5% maximum HP (15% per encounter). Destroy it to prevent recovery.',image:'assets/bosses/v013/heartroot-devourer.png',attack:'assets/bosses/v013/heartroot-devourer.png'}),
 aegis:Object.freeze({id:'guardian',style:'guardian',name:'Holdfast',location:"Abyssal Guardian's Citadel",icon:'⛨',description:'Ward Cycle: checks every 12s and gains Barrier equal to 8% max HP if it has no Barrier and ward recovery is available. Breaking its Barrier interrupts the cycle and prevents new wards for 3s.',image:'assets/bosses/v013/abyssal-guardian.png',attack:'assets/bosses/v013/abyssal-guardian.png'}),
 fury:Object.freeze({id:'ember',style:'berserker',name:'The Chainbreaker',location:"The Chainbreaker's Throne",icon:'♨',description:'Furnace Strike: every 12s, prepares a heavy attack for 1.5s. Can be interrupted; retains the Enrage below 50% HP.',image:'assets/bosses/v013/ember-sovereign.png',attack:'assets/bosses/v013/ember-sovereign.png'}),
 arcane:Object.freeze({id:'stormglass',style:'conductor',name:'The Measure',location:"Stormglass Spire",icon:'⚡',description:'Arcane Convergence: channels for 2s every 12s, dealing 7% of hero max HP before Boon mitigation and Barrier. At 65% HP calls a Convergence Anchor; breaking it cancels the next discharge and weakens the boss.',image:'assets/bosses/v013/stormglass-conductor.png',attack:'assets/bosses/v013/stormglass-conductor.png'})
});
const byStyle=Object.freeze(Object.fromEntries(Object.values(PROFILES).map(x=>[x.style,x])));
function profileFor(family){return PROFILES[family]||null;}
function profileForStyle(style){return byStyle[style]||null;}
function leader(r){return I.leader(r);}
function state(r){return r?.stage84Boss||null;}
function attach(r){
 const e=leader(r),p=profileForStyle(e?.bossStyle);
 if(!e||!r?.bossInfrastructure||!p||r.status!=='fight')return null;
 const now=Number(r.combatSeconds)||0;
 const s=r.stage84Boss={style:p.style,affinity:Object.keys(PROFILES).find(k=>PROFILES[k]===p),thresholds:[],triggeredThresholds:[],nextAt:now+12,wardAt:now+12,vulnerableUntil:0,
  weakUntil:0,cancelNext:false,thrallSerial:0,nodeCreated:false};
 const config=p.style==='devourer'?{maxSummons:4,maxTotalHealing:.15}:
  p.style==='leech'?{maxSummons:2,maxTotalHealing:.20}:
  p.style==='conductor'?{maxSummons:1}:{maxSummons:4};
 if(!I.configure(r,config))throw Error('Stage 8.4 invalid Boss limits');
 return s;
}
function livingMinions(r){return (r?.enemies||[]).filter(e=>e.hp>0&&e.role==='minion'&&e.stage84Minion).length;}
function directFactor(r,e){const s=state(r);return e?.boss&&s?.style==='matriarch'&&livingMinions(r)>=2?.85:1;}
function incomingFactor(r,e,now){const s=state(r);return e?.boss&&s?.style==='conductor'&&s.weakUntil>now?.8:1;}
function barrierChanged(r,e,before,after){
 const s=state(r);if(!e?.boss||s?.style!=='guardian'||before<=0||after>0||e.hp<=0)return null;
 const now=Number(r.combatSeconds)||0;s.vulnerableUntil=now+3;s.wardAt=now+12;
 return {type:'shatter',enemy:e,ability:'Ward Cycle',duration:3};
}
function chargedStrike(e,now){
 const c=e?.stage84Charge;if(!c)return null;
 delete e.stage84Charge;
 return c.until>now?{multiplier:2,capFraction:.18,ability:'Furnace Strike'}:null;
}
function interruptCharge(r,reason='delay'){
 const e=leader(r);if(!e?.stage84Charge)return null;
 delete e.stage84Charge;return {type:'disarmed',enemy:e,ability:'Furnace Strike',reason};
}
function spawned(r,event,makeMinion,options={}){
 const e=leader(r),p=profileForStyle(e?.bossStyle);if(!e||!p||typeof makeMinion!=='function')return {spawned:0,field:0,reserve:0};
 const result=I.summon(r,e,event.count,i=>{
  const mob=makeMinion(i);
  mob.name=event.kind==='blood'?'Riftbound Vessel':event.kind==='node'?'Convergence Anchor':
   event.kind==='radiance'?'light fragment': 'Carrion Broodling';
  const stem={blood:'riftbound-vessel',decay:'carrion-matriarch',radiance:'heartroot-mawbud',node:'convergence-anchor'}[event.kind];
  const base='assets/bosses/v013/'+stem;
  mob.image=base+(event.kind==='node'?'.png':'-01.png');
  if(event.kind!=='node'){mob.attackImage=base+'-02.png';mob.impactImage=base+'-03.png';}
  if(event.kind==='node')mob.atk=0;
  return mob;
 },{family:p.style==='conductor'?'arcane':p.style==='devourer'?'radiance':p.style==='matriarch'?'decay':'blood',
  priority:event.kind==='blood'||event.kind==='node',hpFactor:event.kind==='node'?.48:.42,atkFactor:.25,defFactor:.35,intervalFactor:1.35});
 for(const mob of [...(r.enemies||[]),...(r.groupReserve||[])].filter(x=>x.stage83Summoned&&!x.stage84Minion)){
  mob.stage84Minion=event.kind;
  if(event.kind==='blood'){mob.stage84ThrallLifetime=10;mob.stage84ThrallAppearedAt=null;}
  if(event.kind==='node')mob.stage84Node=true;
  if(event.kind==='radiance'&&r.enemies.includes(mob))mob.fragmentReturnAt=r.combatSeconds+FRAGMENT_RETURN_SECONDS;
 }
 return result;
}
function onDeath(r,mob){
 const s=state(r),e=leader(r);
 if(!s||!e||!mob||mob.hp>0||mob.stage84DeathHandled)return null;
 if(mob.stage84Node&&s.style==='conductor'){
  mob.stage84DeathHandled=true;s.weakUntil=(Number(r.combatSeconds)||0)+6;
  const interrupted=I.interrupt(r,'node_destroyed');
  s.cancelNext=!interrupted; // If casting, the destroyed Node cancels that discharge.
  if(interrupted)s.nextAt=(Number(r.combatSeconds)||0)+12;
  return {type:'node_broken',enemy:e,ability:'Arcane Convergence',duration:6,canceled:!!interrupted};
 }
 return null;
}
function tick(r,absoluteNow,infraEvents=[]){
 const e=leader(r),s=state(r),p=profileForStyle(e?.bossStyle);
 if(!e||!s||!p||e.hp<=0||r.status!=='fight')return [];
 const now=Number(r.combatSeconds)||0,events=[];
 if(e.stage84Charge){
  if((e.stunnedUntil||0)>absoluteNow){events.push(interruptCharge(r,'stun'));}
  else if(e.stage84Charge.until<=now)delete e.stage84Charge;
 }
 for(const event of infraEvents){
  if(event.type==='interrupted'){events.push(event);continue;}
  if(event.type!=='ready')continue;
  if(s.thresholds.includes(event.id))continue; // A completed threshold cannot emit a second summon.
  if(event.id==='furnace_strike'){
   e.stage84Charge={until:now+3.5};
   events.push({type:'charge',enemy:e,ability:'Furnace Strike'});s.nextAt=now+12;
  }else if(event.id==='arcane_convergence'){
   if(s.cancelNext){s.cancelNext=false;events.push({type:'canceled',enemy:e,ability:'Arcane Convergence'});}
   else{
    const factor=root.WandererV013ExpeditionBoons?.takenFactor(r)||1;
    const damage=Math.max(1,Math.round(r.maxhp*.07*factor));
    const impact=root.WandererV012Buildcraft?.absorbBarrier(r,damage)??plainBarrierImpact(r,damage),absorbed=impact.absorbed;
    const hit=Math.min(Math.max(0,r.hp||0),impact.hit);r.hp=Math.max(0,(r.hp||0)-hit);
    events.push({type:'pulse',enemy:e,ability:'Arcane Convergence',damage:hit,absorbed});
   }
   s.nextAt=now+12;
  }else if(event.id.startsWith('summon_')){
   if(!s.thresholds.includes(event.id))s.thresholds.push(event.id);
   const kind=s.style==='leech'?'blood':s.style==='devourer'?'radiance':'decay';
   events.push({type:'summon',enemy:e,ability:p.name,kind,count:s.style==='leech'?1:2});s.nextAt=now+1.5;
  }else if(event.id==='storm_node'){if(!s.thresholds.includes(event.id))s.thresholds.push(event.id);s.nodeCreated=true;events.push({type:'summon',enemy:e,ability:'Convergence Anchor',kind:'node',count:1});s.nextAt=now+1.5;}
 }
 if(s.style==='guardian'&&now+1e-7>=s.wardAt){
  s.wardAt=now+12;
  if(now>=s.vulnerableUntil&&e.barrier<=0){e.barrier=Math.max(1,Math.round(e.maxhp*.08));events.push({type:'ward',enemy:e,ability:'Ward Cycle',barrier:e.barrier});}
 }
 if(s.style==='devourer'){
  for(const fragment of r.enemies||[]){
   if(fragment.hp<=0||fragment.stage84Minion!=='radiance')continue;
   fragment.fragmentReturnAt??=now+FRAGMENT_RETURN_SECONDS;
   if(now<fragment.fragmentReturnAt)continue;
   fragment.reabsorbed=true;
   fragment.hp=0;
   const healed=I.recover(r,Math.round(e.maxhp*.05));
   events.push({type:'reabsorbed',enemy:e,minion:fragment,healed});
  }
 }
 if(s.style==='leech'){
  for(const mob of (r.enemies||[])){
   if(mob.hp<=0||mob.stage84Minion!=='blood')continue;
   if(mob.stage84ThrallAppearedAt===null)mob.stage84ThrallAppearedAt=now;
   if(now+1e-7<mob.stage84ThrallAppearedAt+10)continue;
   const healed=I.recover(r,Math.round(e.maxhp*.05));
   mob.hp=0;mob.stage84Sacrificed=true;
   events.push({type:'offering',enemy:e,ability:'Blood Offering',minion:mob,healed});
  }
 }
 const thresholdPlans=s.style==='leech'?[[.70,'summon_70',1],[.35,'summon_35',1]]:
  s.style==='matriarch'?[[.75,'summon_75',2],[.40,'summon_40',2]]:
  s.style==='devourer'?[[.70,'summon_70',2],[.35,'summon_35',2]]:
  s.style==='conductor'?[[.65,'storm_node',1]]:[];
 // Crossing an HP threshold latches its mechanic, even if a later heal raises HP.
 // Only a successfully completed cast consumes it; interrupted attempts keep their native retry cooldown.
 for(const [fraction,id] of thresholdPlans)if(e.hp<=e.maxhp*fraction&&!s.triggeredThresholds.includes(id))s.triggeredThresholds.push(id);
 if((e.stunnedUntil||0)>absoluteNow||r.bossInfrastructure?.cast)return events;
 for(const [,id,count] of thresholdPlans){
  if(!s.triggeredThresholds.includes(id)||s.thresholds.includes(id))continue;
  if(I.prepare(r,{id,name:id==='storm_node'?'Convergence Anchor':p.name+' · '+(s.style==='leech'?'Blood Offering':s.style==='devourer'?'Fragmentation':'Brood of Decay'),cast:.75,cooldown:3,maxUses:1})){
   events.push({type:'prepare',enemy:e,ability:id==='storm_node'?'Convergence Anchor':p.name+' · Summoning',count});return events;
  }
 }
 if(now+1e-7<s.nextAt)return events;
 if(s.style==='berserker'){
  const event=I.prepare(r,{id:'furnace_strike',name:'Furnace Strike',cast:1.5,cooldown:12,maxUses:6});
  if(event)events.push(event);
 }else if(s.style==='conductor'){
  if(s.cancelNext){s.cancelNext=false;s.nextAt=now+12;events.push({type:'canceled',enemy:e,ability:'Arcane Convergence'});}
  else{
   const event=I.prepare(r,{id:'arcane_convergence',name:'Arcane Convergence',cast:2,cooldown:12,maxUses:6});
   if(event)events.push(event);
  }
 }
 return events;
}
function status(enemy,r,now){
 if(enemy?.stage84Minion==='radiance'&&enemy.hp>0&&r?.status==='fight'&&enemy.fragmentReturnAt!=null){
  return {kind:'casting',label:'Returning',detail:'Destroy this fragment to prevent recovery.',remaining:Math.max(0,enemy.fragmentReturnAt-now)};
 }
 const s=state(r);if(!enemy?.boss||enemy!==leader(r)||!s)return null;
 if(s.style==='guardian'&&s.vulnerableUntil>now)return {kind:'interrupted',label:'Vulnerable',detail:'Ward Cycle interrupted · Barrier unavailable',remaining:s.vulnerableUntil-now};
 if(s.style==='conductor'&&s.weakUntil>now)return {kind:'interrupted',label:'Weakened',detail:'Convergence Anchor destroyed: −20% damage',remaining:s.weakUntil-now};
 if(s.style==='berserker'&&enemy.stage84Charge?.until>now)return {kind:'enraged',label:'Furnace Strike',detail:'Heavy strike charged',remaining:enemy.stage84Charge.until-now};
 if(s.style==='matriarch'&&livingMinions(r)>=2)return {kind:'guarding',label:'Brood Guard',detail:'15% less direct damage while 2+ Carrion Broodlings are alive',remaining:0};
 return null;
}
const API=Object.freeze({PROFILES,profileFor,profileForStyle,attach,tick,spawned,onDeath,barrierChanged,
 directFactor,incomingFactor,chargedStrike,interruptCharge,livingMinions,status});
root.WandererV013BossAbilities=API;
if(typeof module==='object'&&module.exports)module.exports=API;
// Standalone module fixtures without buildcraft have no player Barrier talents.
function plainBarrierImpact(run,amount){const absorbed=Math.min(Math.max(0,run.barrier||0),amount);run.barrier=Math.max(0,(run.barrier||0)-absorbed);return {absorbed,hit:amount-absorbed};}
})(globalThis);
