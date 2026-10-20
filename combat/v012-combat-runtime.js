// v0.12 combat runtime. Canonical state transitions; UI effects are injected.
(function(root){'use strict';
function create(ports){
function addLog(text,kind=''){if(ports.isPhase1Run()){const r=ports.state.run;r.realmLog??=[];const line={text:String(text),kind:String(kind)};r.realmLogBytes=(r.realmLogBytes||0)+line.text.length+line.kind.length;r.realmLog.push(line);while(r.realmLogBytes>180000){const old=r.realmLog.shift();r.realmLogBytes-=old.text.length+old.kind.length;r.realmLogTruncated=true;}}ports.logEntries.unshift({text,kind});ports.logEntries=ports.logEntries.slice(0,75);if(ports.view==='combat')ports.renderLog()}

function bossForTier(tier){return ports.BOSS_ARCHETYPES[(Math.floor(tier/10)-1+ports.BOSS_ARCHETYPES.length)%ports.BOSS_ARCHETYPES.length]}

function eliteArchetype(run){return ports.ELITE_ARCHETYPES[run?.eliteType]||ports.ELITE_ARCHETYPES.tank}

function rollEliteArchetype(){return ports.sample(Object.keys(ports.ELITE_ARCHETYPES))}

function tryDodge(run,type){
 const chance=type==='physical'?ports.evasionChance(run.stats.evasionRating||0,run.tier):0;
 if(!chance||ports.gameRandom()>=chance)return false;
 ports.addLog('DODGE · '+run.enemy.name+' physical attack avoided (0 damage)','good');
 ports.floatText('DODGE','hero');return true;
}

function enemyFor(level,enc,override=null){
 const theme=override?.theme||ports.currentTheme(),boss=override?!!override.boss:enc===5&&level%10===0,miniboss=override?!boss&&!!override.elite:enc===4,v=ports.estimateEnemy(level,Math.min(5,enc)),mult=boss?2:1;
 const variant=boss?(override?.variant||ports.bossForTier(level)):null;
 const mob=boss?{name:variant.name,image:variant.image}:ports.sample(theme.mobs);
 const role=boss?'boss':miniboss?'miniboss':theme.mobs[0].name===mob.name?'bruiser':'skirmisher';
 const elite=miniboss?ports.eliteArchetype(ports.state.run):null;
 const hp=Math.max(1,Math.round(v.hp*mult*(elite?elite.hp:role==='bruiser'?1.08:role==='skirmisher'?.92:1)));
 const atk=Math.max(1,Math.round(v.atk*mult*(elite?elite.atk:role==='skirmisher'?1.08:1)));
 const defense=Math.max(0,Math.round(v.def*mult*(elite?elite.def:1)));
 const barrier=variant?.style==='guardian'?Math.max(3,Math.round(level*.9)):elite?.id==='tank'?Math.max(1,Math.round(1+level*.3)):0;
 return {name:miniboss?elite.icon+' '+elite.name:mob.name,image:elite?ports.eliteArt(elite.id,mob.image):mob.image,role,bossStyle:variant?.style||null,attackType:elite?.id==='caster'||variant?.style==='leech'?'spell':'physical',
 miniboss,eliteType:elite?.id||null,archetypeName:elite?.name||null,hp,maxhp:hp,atk,def:defense,baseDef:defense,barrier,
 attackEvery:elite?elite.interval:role==='skirmisher'?1.42:role==='bruiser'?1.72:1.62,boss,effect:theme.effect,burn:0,bleed:0,
 burnStacks:0,bleedStacks:0,dots:{bleed:[],burn:[]},slowTime:0,enraged:false};
}

function synchronizeDots(enemy){
 WandererV012Buildcraft.migrateEnemyDots(enemy);
 if(!enemy.dots)return;
 for(const key of ['bleed','burn']){
 const active=enemy.dots[key]||[];
 enemy[key]=active.reduce((sum,d)=>sum+d.damage,0);
 enemy[key+'Stacks']=active.length;
 }
}

function tickDots(enemy){
 WandererV012Buildcraft.migrateEnemyDots(enemy);
 if(!enemy.dots)return 0;
 let total=0;
 for(const key of ['bleed','burn']){
 const active=enemy.dots[key]||[];
 for(const d of active){total+=d.damage;d.remaining-=1;}
 enemy.dots[key]=active.filter(d=>d.remaining>0);
 }
 ports.synchronizeDots(enemy);
 return total;
}

function setRuntime(r){
 if(!r.setCooldowns)r.setCooldowns={};
 if(!r.setTemp)r.setTemp={focus:0,focusLast:-999,focusExpiry:0,heat:0,heatExpiry:0,soul:0,soulLast:-999,soulExpiry:0,
 haste:[],lastHaste:-999,shieldCounter:0,shieldCounterUntil:0,lastBastionReady:false,chilledFor:0,delayImmuneUntil:0,regenBarrier:0,regenBarrierSecond:-1,regenBarrierSecondTotal:0};
 return r.setTemp;
}

function advancePlayerAttackClock(r,dt,attacksPerSecond){
 // Keep cycle progress when haste changes, but keep it as a fraction of the
 // current cycle so alternating buffs cannot manufacture elapsed time.
 const rate=Math.max(0,Number(attacksPerSecond)||0),period=1/Math.max(0.000001,Math.min(4.2,rate));
 const previousPeriod=Number(r.playerAttackPeriod)||period;
 const progress=Number.isFinite(Number(r.tPlayer))?Math.max(0,Math.min(previousPeriod,Number(r.tPlayer))):0;
 r.tPlayer=progress/previousPeriod*period;
 r.playerAttackPeriod=period;
 r.tPlayer+=Math.max(0,Number(dt)||0);
 if(r.tPlayer<period)return false;
 r.tPlayer-=period;
 return true;
}

function setNow(r){return (Number(r.combatSeconds)||0)+(r.phase1?Number(r.phase1ClockBase??ports.phase1Clock)||0:0);}

function activeLegendarySignatures(){
 const equipment=ports.state.equip||{},occupied=ports.isTwoHanded(equipment.weapon),out=[],seen=new Set();
 for(const [slot,item] of Object.entries(equipment)){
  if(!item||(slot==='offhand'&&occupied))continue;
  const sig=ports.legendarySignature(item);
  if(!sig||seen.has(sig.identity.id))continue;
  seen.add(sig.identity.id);out.push(sig);
 }
 return out;
}

function legendaryRuntime(r){
 if(!r.legendaryState)r.legendaryState={};
 const t=r.legendaryState;
 if(t.enemy!==r.enemy){t.enemy=r.enemy;t.markUntil=0;t.marked=false;t.weaken=0;t.killUsed=false;}
 return t;
}

function legendaryHas(id){return ports.activeLegendarySignatures().some(sig=>sig.identity.id===id);}

function legendaryReady(r,id){
 const d=globalThis.WandererLegendary?.DEFINITIONS[id];
 if(!d||!ports.legendaryHas(id)||!ports.setReady(r,'legendary:'+id,d.cooldown))return false;
 ports.addLog('✦ '+d.name,'good');return true;
}

function legendaryExtend(e,type){
 const stack=e.dots?.[type]?.find(x=>x.remaining<6);
 if(!stack)return false;stack.remaining++;ports.synchronizeDots(e);return true;
}

function legendaryAffinity(r,effect,effectiveHeal=0){
 const t=ports.legendaryRuntime(r),now=ports.setNow(r);
 if(effect==='drain'&&ports.legendaryReady(r,'soul-reaver'))t.armorReady=true;
 if(effect==='sunder'&&ports.legendaryReady(r,'hammer-of-the-sunforge'))t.weaken=Math.max(t.weaken||0,.15);
 if(effect==='nature'&&effectiveHeal>0&&ports.legendaryReady(r,'sunpiercer-longbow'))t.natureHasteUntil=now+3;
}

function legendaryAttackBonus(r,base,critical,cast){
 const t=ports.legendaryRuntime(r),e=r.enemy,now=ports.setNow(r);let added=0;
 r.legendaryAttackCount=(r.legendaryAttackCount||0)+1;
 if(cast)r.legendaryCastCount=(r.legendaryCastCount||0)+1;
 if(t.refuge){t.refuge=false;ports.setHeal(r,r.maxhp*.03);}
 if(e.barrier>0&&ports.legendaryReady(r,'runeforged-eclipse')){const removed=Math.min(e.barrier,Math.round(base*.35));e.barrier-=removed;ports.setBarrier(r,removed*.3);}
 if(cast&&r.legendaryCastCount%3===0&&ports.legendaryReady(r,'starweaver-relic')){r.mp=Math.min(r.maxmp,r.mp+(r.stats.main?.subtype==='Staff'?13:9)*.4);added+=Math.round(base*.2);}
 if(!t.marked){t.marked=true;if(ports.legendaryReady(r,'blade-of-the-first-dawn'))t.markUntil=now+6;}
 if(critical&&t.markUntil>now){t.markUntil=0;added+=Math.round(base*.25);}
 if(r.legendaryAttackCount%4===0&&ports.legendaryReady(r,'sunstride-sabatons'))t.thunderHasteUntil=now+3;
 if(e.v012Rot?.length>=3&&ports.legendaryReady(r,'fang-of-the-sunbreaker'))WandererV012Buildcraft.applyRot(ports.phase1Build,ports.phase2Context(r),base*.15);
 // Classic gear procs remain independent from Expedition passives.
 if(e.burnStacks>=3&&ports.legendaryReady(r,'tome-of-the-eternal-flame')){e.dots.burn.shift();ports.synchronizeDots(e);t.weaken=Math.max(t.weaken||0,.15);}
 if(cast&&e.slowTime>0&&ports.legendaryReady(r,'winterheart-spire')){e.slowTime=Math.min(4,e.slowTime+1);ports.setDelayEnemy(r,e.boss?.2:.5);}
 return added;
}

function legendaryOffhand(r,damage){
 if(damage>0&&r.enemy.bleedStacks>0&&r.enemy.dots?.bleed?.some(x=>x.remaining<6)&&ports.legendaryReady(r,'crescent-of-the-emberveil'))ports.legendaryExtend(r.enemy,'bleed');
}

function legendaryDefensiveEffects(r,blocked,hit,absorbed=0,broken=false){
 if(r.hp<=0)return;
 const t=ports.legendaryRuntime(r);
 // Existing charges are consumed before this hit can prime new ones.
 if(hit>0&&t.reserve){const amount=t.reserve;t.reserve=0;ports.setHeal(r,amount,true);ports.addLog('✦ Dawnstar Bloom reserve released','good');}
 if(broken&&ports.legendaryReady(r,'helm-of-the-dawnwarden'))t.guard=.12;
 if(broken&&ports.legendaryReady(r,'aegis-of-the-dawnstar'))ports.setBarrier(r,r.maxhp*.07);
 if(absorbed>0&&ports.legendaryReady(r,'orb-of-the-solar-heart'))ports.setHeal(r,r.maxhp*.015);
 if(hit>r.maxhp*.12&&ports.legendaryReady(r,'cuirass-of-the-last-sunrise')){t.hotRemaining=hit*.3;t.hotUntil=ports.setNow(r)+3;}
 if(hit>0&&r.hp<r.maxhp*.35&&ports.legendaryReady(r,'heart-of-shadows'))t.refuge=true;
}

function legendaryTick(r,dt){
 const t=ports.legendaryRuntime(r);
 if(t.hotRemaining>0&&r.hp>0){const left=Math.max(dt,t.hotUntil-ports.setNow(r)+dt),heal=Math.min(t.hotRemaining,t.hotRemaining*dt/left);t.hotRemaining-=heal;ports.setHeal(r,heal);}
}

function legendaryKill(r){
 const t=ports.legendaryRuntime(r);
 if(!t.killUsed&&r.enemy.burnStacks>0&&ports.legendaryReady(r,'pendant-of-the-first-flame')){t.killUsed=true;ports.setHeal(r,r.maxhp*.03);}
}

function setReady(r,name,seconds){
 const timers=r.setCooldowns||(r.setCooldowns={}),now=ports.setNow(r);
 if(now<(timers[name]||0))return false;
 timers[name]=now+seconds;return true;
}

function setBarrier(r,amount){
 const before=r.barrier;
 r.barrier=Math.min(Math.max(8,Math.round(r.maxhp*.3)),r.barrier+Math.max(0,amount));
 return Math.max(0,r.barrier-before);
}

function regenPerSecond(maxhp,rate=.006){return Math.max(0,maxhp)*Math.max(0,rate)}

function setHeal(r,amount,reserveRelease=false){
 // Tank's healing wound affects all player healing: regeneration, Drain,
 // Nature, Soul Pact and heal-on-hit, but does not reduce Barrier generation.
 const healingReduced=(r.playerHealingDebuffUntil||0)>ports.setNow(r);
 const heal=Math.max(0,Number(amount)||0)*(healingReduced ? 0.60 : 1),before=r.hp;
 r.hp=Math.min(r.maxhp,r.hp+heal);
 const actual=r.hp-before,overheal=heal-actual;
 if(!reserveRelease&&heal>0&&ports.legendaryReady(r,'charm-of-the-dawnstar'))ports.legendaryRuntime(r).reserve=Math.min(r.maxhp*.04,heal);
 if(overheal>0&&r.stats.bonus.regenOverflow){
  const temp=ports.setRuntime(r),second=Math.floor(ports.setNow(r));
  if(temp.regenBarrierSecond!==second){temp.regenBarrierSecond=second;temp.regenBarrierSecondTotal=0;}
  const allowed=Math.max(0,Math.min(overheal*.25,r.maxhp*.01-temp.regenBarrierSecondTotal,r.maxhp*.1-temp.regenBarrier));
  if(allowed>0){const gained=ports.setBarrier(r,allowed);temp.regenBarrier+=gained;temp.regenBarrierSecondTotal+=gained;}
 }
 if(actual>0&&ports.isPhase1Run()&&ports.phase1Build)WandererV012Buildcraft.onHeal(ports.phase1Build,ports.phase2Context(r),actual);
 return actual;
}

function setDelayEnemy(r,seconds){
 const temp=ports.setRuntime(r),now=ports.setNow(r);
 if(now<temp.delayImmuneUntil)return false;
 r.tEnemy-=seconds;temp.delayImmuneUntil=now+4;
 ports.addLog('⏳ Enemy attack delayed by '+seconds+'s','good');return true;
}

function setDirectEnemyDamage(r,amount,label){
 const enemy=r.enemy;let damage=Math.max(0,Math.round(amount));
 if(enemy.barrier>0){const absorbed=Math.min(enemy.barrier,damage);enemy.barrier-=absorbed;damage-=absorbed;}
 ports.phase6Metric(r,'damageDealt',Math.min(Math.max(0,enemy.hp),damage));ports.phase6Proc(r,label);enemy.hp-=damage;if(damage>0){ports.addLog(label+' '+damage+' bonus damage','good');ports.floatText(damage,'enemy');}
 return damage;
}

function setOnAttack(r,base,critical,perfect){
 const s=r.stats,e=r.enemy,b=s.bonus,temp=ports.setRuntime(r),now=ports.setNow(r);
 let bonus=Math.round(base*((b.criticalFocus?temp.focus*.02:0)+(b.fireHeat?temp.heat*.015:0)+(b.soulCharge?temp.soul*.02:0)));
 if(b.criticalFocus&&critical&&!perfect&&now-temp.focusLast>=1){
  temp.focus=Math.min(3,temp.focus+1);temp.focusLast=now;temp.focusExpiry=now+6;
 }
 if(b.bleedHaste&&e.bleedStacks>0&&now-(temp.lastHaste||-999)>=1){
  temp.haste=(temp.haste||[]).filter(expiry=>expiry>now).slice(-2);
  temp.haste.push(now+3);temp.lastHaste=now;
 }
 if(b.bloodHunt&&e.bleedStacks>0&&e.hp<=e.maxhp*.3&&ports.setReady(r,'bloodHunt',12)){bonus+=Math.round(base*.4);ports.addLog('🩸 Blood Hunt!','good');}
 if(b.armorShatter&&e.baseDef>0&&e.def<=e.baseDef*.5&&now>=temp.delayImmuneUntil&&ports.setReady(r,'armorShatter',12)){
  const stripped=Math.min(e.barrier,Math.round(base));e.barrier-=stripped;
  ports.setDelayEnemy(r,e.boss?.2:.5);ports.addLog('🔨 Armor Shatter! '+stripped+' Barrier removed','good');
 }
 if(b.shieldRiposte&&temp.shieldCounter>0){
  if(now<=temp.shieldCounterUntil)bonus+=Math.round(Math.min(base*.25,temp.shieldCounter));
  temp.shieldCounter=0;
 }
 if(b.lastBastion&&temp.lastBastionReady){
  bonus+=Math.round(Math.min(base*.5,r.barrier*.5));r.barrier=Math.max(0,r.barrier*.5);temp.lastBastionReady=false;
 }
 if(b.flashover&&temp.heat>=5&&ports.setReady(r,'flashover',10)){
  temp.heat=0;bonus+=Math.round(base*.5);ports.addLog('🔥 Flashover!','good');
 }
 if(b.soulPact&&temp.soul>=3&&r.hp>r.maxhp*.4&&ports.setReady(r,'soulPact',12)){
  temp.soul=0;r.hp=Math.max(1,r.hp-r.maxhp*.03);temp.soulPactBonus=Math.round(base*.4);
  bonus+=temp.soulPactBonus;ports.addLog('🌑 Soul Pact sacrifices HP for damage','spell');
 }else temp.soulPactBonus=0;
 if(b.crystalBonus)bonus+=Math.round(base*b.crystalBonus);
 if(b.crystalCharge){
  temp.crystalHits=(temp.crystalHits||0)+1;
  if(temp.crystalHits%3===0){bonus+=Math.round(base*.15);if(b.crystalBurst&&ports.setReady(r,'crystalBurst',10)){bonus+=Math.round(base*.35);ports.addLog('💎 Crystal Burst!','spell');}}
 }
 if(b.shockRhythm){
  temp.shockHits=(temp.shockHits||0)+1;
  if(temp.shockHits%3===0)bonus+=Math.round(base*.15);
  if(b.thunderclap&&temp.shockHits%6===0&&ports.setReady(r,'thunderclap',10)){bonus+=Math.round(base*.35);ports.addLog('⚡ Thunderclap!','spell');}
 }
 return bonus;
}


function setCombatExpire(r,dt){
 const s=r.stats,t=ports.setRuntime(r),now=ports.setNow(r),e=r.enemy;
 if(now>=t.focusExpiry)t.focus=0;
 if(now>=t.heatExpiry)t.heat=0;
 if(now>=t.soulExpiry)t.soul=0;
 t.haste=(t.haste||[]).filter(expiry=>expiry>now);
 if(s.bonus.deepFreeze){
  if(e.slowTime>0){
   t.chilledFor+=dt;
   if(t.chilledFor>=3&&now>=t.delayImmuneUntil&&ports.setReady(r,'deepFreeze',12)){
    ports.setDelayEnemy(r,e.boss?.25:.75);ports.addLog('❄️ Deep Freeze!','spell');
   }
  }else t.chilledFor=0;
 }
}

function setEnemyWeaken(r){const e=r.enemy,b=r.stats.bonus||{};return Math.min(.15,(b.frostWeaken&&e.slowTime>0?.08:0)+(b.tideGuard&&r.barrier>0?.05:0))}

function setHeatTick(r,hadBurnTick=false){
 const temp=ports.setRuntime(r),now=ports.setNow(r);
 if(r.stats.bonus.fireHeat&&hadBurnTick){temp.heat=Math.min(5,temp.heat+1);temp.heatExpiry=now+5;}
}

function setSoulHeal(r,effectiveBonusDamage){
 const temp=ports.setRuntime(r);
 if(temp.soulPactBonus>0){
  const heal=Math.min(r.maxhp*.04,Math.max(0,effectiveBonusDamage)*.25);
  ports.setHeal(r,heal);temp.soulPactBonus=0;
 }
}

function applyAffinity(effect,enemy,s,mult=1,baseDamage=0){
 if(!effect)return;
 const bonus=s.bonus||{},ratios={bleed:.18,burn:.17};
 const r=ports.state.run;
 if(ratios[effect]){
  if(!enemy.dots)enemy.dots={bleed:[],burn:[]};
  const src=enemy.dots[effect]||[];
  const potency=Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*ratios[effect]*mult*(1+(bonus[effect+'Bonus']||0))));
  if(src.length>=12)src.shift();
  src.push({damage:effect==='bleed'&&ports.phase1Build?Math.max(1,Math.round(WandererV012Buildcraft.bleedDamage(ports.phase1Build,potency))):potency,remaining:3});enemy.dots[effect]=src;ports.synchronizeDots(enemy);
  return;
 }
 if(effect==='slow')enemy.slowTime=Math.max(enemy.slowTime,2.9);
 if(effect==='sunder'&&r)ports.legendaryAffinity(r,'sunder');
 if(effect==='sunder')enemy.def=Math.max(Math.round(enemy.baseDef*.25),enemy.def-Math.max(1,Math.round(enemy.baseDef*(bonus.sunderBonus||.1))));
 if(!r)return;
 if(effect==='drain'){
  ports.legendaryAffinity(r,'drain');
  const healed=ports.setHeal(r,Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*.16*mult*(1+(bonus.drainBonus||0)))));
  if(healed>0){ports.addLog('🌑 Drain heals +'+Math.round(healed)+' HP','good');
   if(bonus.soulCharge){const t=ports.setRuntime(r),now=ports.setNow(r);if(now-t.soulLast>=1){t.soul=Math.min(3,t.soul+1);t.soulLast=now;t.soulExpiry=now+6;}}
  }
 }
 if(effect==='shield'){
  const gained=ports.setBarrier(r,Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*.07+r.maxhp*(bonus.shieldBonus||0))));
  if(gained>0)ports.addLog('🛡 Shield grants +'+Math.round(gained)+' Barrier','good');
 }
 if(effect==='regen'){
  const gained=ports.setHeal(r,Math.max(1,Math.round((baseDamage||s.attack||5)*.1)));
  if(gained>0)ports.addLog('💚 Healing +'+Math.round(gained)+' HP','good');
 }
 if(effect==='nature'){
  const heal=Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*.08*mult*(1+(bonus.natureBonus||0))*(bonus.natureVitality&&r.hp<r.maxhp*.5?1.5:1)));
  const gained=ports.setHeal(r,heal);ports.legendaryAffinity(r,'nature',gained);if(gained>0)ports.addLog('🌿 Nature heals +'+Math.round(gained)+' HP','good');
 }
 if(effect==='crystal')ports.setDirectEnemyDamage(r,(baseDamage||s.spellPower||s.attack||5)*.06*mult,'💎 Crystal:');
 if(effect==='shock')ports.setDirectEnemyDamage(r,(baseDamage||s.spellPower||s.attack||5)*.08*mult*(1+(bonus.shockBonus||0)),'⚡ Storm:');
 if(effect==='tide'){
  const gained=ports.setBarrier(r,Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*.07*mult*(1+(bonus.tideBonus||0)))));
  if(gained>0)ports.addLog('🌊 Tide grants +'+Math.round(gained)+' Barrier','good');
 }
}

function weaponAttack(r){
 const s=r.stats,e=r.enemy,weapon=s.main,off=s.off,caster=s.caster,now=ports.setNow(r),temp=ports.setRuntime(r);
 const lt=ports.legendaryRuntime(r),focus=!!lt.focusReady,armorReady=!!lt.armorReady;lt.focusReady=false;lt.armorReady=false;
 const kind=weapon?.subtype||'Unarmed',baseCost=kind==='Staff'?13:kind==='Wand'?9:0;
 const cost=baseCost&&ports.isPhase1Run()&&ports.phase1Build?.element?WandererV012Buildcraft.nextCost(ports.phase1Build):baseCost;
 let damage=0,element=null,cast=false;
 if(caster&&r.mp>=cost){
  ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;cast=true;element=null;
  const factor=kind==='Staff'?1.32:.95;
  damage=Math.max(1,Math.round((ports.phase1Build?.element?WandererV012Buildcraft.elementalPower(ports.phase1Build,s.spellPower):s.spellPower)*factor));
  if(element&&ports.isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);
  ports.addLog((ports.ELEMENTS[element]?.icon||'✨')+' '+kind+' casts '+(ports.ELEMENTS[element]?.name||'Magic')+' ('+damage+' magic).','spell');
 }else{
  const factor=kind==='Two-Handed'?1.70:kind==='Mace'?1.4:kind==='Bow'?1.08:kind==='Daggers'?.72:caster?.55:1;
  damage=Math.max(1,Math.round(s.attack*factor)-Math.round(e.def*(armorReady?.8:1)));
 }
 const base=damage;r.lastBaseHit=base;
 const perfect=s.bonus.perfectStrike&&temp.focus>=3&&now>=(r.setCooldowns?.perfectStrike||0);
 if(perfect){ports.setReady(r,'perfectStrike',10);temp.focus=0;}
 const critical=perfect||ports.gameRandom()<s.crit/100;
 if(critical){damage=Math.max(1,Math.round(damage*(perfect?1.75:1.5)));ports.addLog((perfect?'✨ PERFECT STRIKE! ':'CRITICAL! ')+damage+' damage','critical');}
 if(Object.entries(ports.state.equip||{}).some(([slot,item])=>item?.rarity==='Legendary'&&!ports.legendarySignature(item)&&!(slot==='offhand'&&ports.isTwoHanded(weapon)))&&r.enc!==r.lastLegendaryEncounter){damage=Math.round(damage*1.32);r.lastLegendaryEncounter=r.enc;}
 const added=ports.setOnAttack(r,base,critical,perfect)+ports.legendaryAttackBonus(r,base,critical,cast);
 // Weapon identities: small sustain windows against burst without higher global damage.
 // Cooldowns run in combat seconds and persist across waves of one expedition.
 if(weapon?.subtype==='Staff'&&cast&&ports.setReady(r,'arcaneGuard',6)){
  const gained=ports.setBarrier(r,r.maxhp*.035);
  if(gained>0)ports.addLog('✨ Arcane Guard +'+Math.round(gained)+' Barrier','good');
 }
 if(weapon?.subtype==='Two-Handed'&&ports.setReady(r,'heavyGuard',6)){
  const gained=ports.setBarrier(r,r.maxhp*.025);
  if(gained>0)ports.addLog('⚔ Heavy Guard +'+Math.round(gained)+' Barrier','good');
 }
 if(s.bonus.sunderExpose&&e.baseDef>0&&e.def<=e.baseDef*.5)damage=Math.round(damage*1.08);
 damage+=added;
 if(r.playerDebuffUntil>now)damage=Math.max(1,Math.round(damage*.8));
 const hpBefore=e.hp,barrierBefore=e.barrier;
 ports.animateStrike(kind,cast);
 if(e.barrier>0){const absorbed=Math.min(e.barrier,damage);e.barrier-=absorbed;damage-=absorbed;if(absorbed)ports.addLog('🛡 '+e.name+' absorbs '+absorbed+' damage','spell');}
 const real=Math.max(0,Math.min(e.hp,damage));
 ports.phase6Metric(r,'damageDealt',Math.min(Math.max(0,e.hp),damage));e.hp-=damage;ports.floatText(damage,'enemy',critical);
 if(temp.soulPactBonus>0){const withoutBonus=Math.min(hpBefore,Math.max(0,damage+Math.max(0,barrierBefore-e.barrier)-temp.soulPactBonus-barrierBefore));ports.setSoulHeal(r,Math.max(0,real-withoutBonus));}
 if(ports.WANDERER_SHATTER_ENABLED&&cast&&element==='slow'&&damage>0&&e.hp>0&&e.slowTime>0){
  temp.shatterHits=(temp.shatterHits||0)+1;
  if(temp.shatterHits>=3&&ports.setReady(r,'frostShatter',6)){
   temp.shatterHits=0;
   ports.setDirectEnemyDamage(r,s.spellPower*.30,'❄️ Shatter!');
  }
 }
 if(cast){
  if(element&&damage>0&&ports.gameRandom()<Math.min(1,ports.affinityProcChance(kind,true)+(focus?.15:0)))ports.applyAffinity(element,e,s,kind==='Staff'?1.2:.85,damage);
  if(off?.magic&&damage>0&&ports.isMagicOffhand(off)&&off.magic!==element&&ports.gameRandom()<.25)ports.applyAffinity(off.magic,e,s,.5,damage);
 }else{
  const chance=Math.min(1,ports.affinityProcChance(kind)+(focus?.15:0));
  if(damage>0&&weapon?.effect&&ports.gameRandom()<chance)ports.applyAffinity(weapon.effect,e,s,kind==='Two-Handed'?1.7:kind==='Daggers'?.7:1,damage);
  if(damage>0&&ports.isMagicOffhand(off)&&off.magic&&ports.gameRandom()<.45){
   ports.applyAffinity(off.magic,e,s,.85,damage);
   ports.addLog((ports.ELEMENTS[off.magic]?.icon||'✨')+' Off-Hand imbues attack (0 mana)','spell');
  }
 }
 // Crescent keeps its cooldown-limited Bleed extension without independent off-hand hits.
 ports.legendaryOffhand(r,damage);
 if(ports.WANDERER_DOUBLE_STRIKE_ENABLED&&kind==='Daggers'&&damage>0&&e.hp>0&&ports.gameRandom()<.25){
  // One ordinary pre-critical main-hand hit, with no further rolls or recursive triggers.
  ports.setDirectEnemyDamage(r,Math.max(1,Math.round(base*.55)),'🗡 Double Strike!');
 }

 if(ports.isPhase1Run())ports.phase2WeaponAttack(r,base,critical,cast);
 if(s.counts.shield>=2){const gained=ports.setBarrier(r,Math.max(1,Math.round(r.maxhp*(s.bonus.shieldBonus||0))));if(gained>0)ports.addLog('🛡 Shield set: +'+Math.round(gained)+' Barrier','good');}
 return damage;
}

function updateFight(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)){clearInterval(ports.clock);return;}
 const r=ports.state.run;if(!r||r.status!=='fight'){clearInterval(ports.clock);return;}
 // Fastest D200 measures only combat ticks at the selected playback speed.
 // No Tavern, Forge, Inventory, wave decisions or background tab time.
 if(!ports.isPhase1Run()&&ports.state.onlineProgress?.timerMetric==='combat-v1'&&ports.state.onlineProgress.timingEligible){
  ports.state.onlineProgress.activeMs+=110/ports.clockSpeed;
 }
 const dt=.11,s=r.stats,e=r.enemy,t=ports.setRuntime(r);
 r.combatSeconds=(r.combatSeconds||0)+dt;
 if(!ports.isPhase1Run()&&ports.state.onlineProgress?.timerMetric==='combat-v1'&&r.combatSeconds-(r.lastCombatCheckpoint||0)>=3){r.lastCombatCheckpoint=r.combatSeconds;ports.save();}
 ports.setCombatExpire(r,dt);ports.legendaryTick(r,dt);
 r.tEnemy+=dt;r.tDot+=dt;
 if(s.caster||r.phase1Magic)r.mp=Math.min(r.maxmp,r.mp+dt*s.manaRegen);
 if(ports.isPhase1Run())ports.phase2MagicTick(r);
 if(e.hp<=0){ports.winEncounter(true);return;}
 const lt=ports.legendaryRuntime(r),haste=(ports.isPhase1Run()&&ports.phase1Build?WandererV012Buildcraft.speed(ports.phase1Build,ports.phase1Clock+r.combatSeconds):1)*(s.bonus.bleedHaste?1+Math.min(3,t.haste.length)*.05:1)*(1+((lt.natureHasteUntil||0)>ports.setNow(r)?.10:0)+((lt.thunderHasteUntil||0)>ports.setNow(r)?.12:0));
 if(advancePlayerAttackClock(r,dt,s.attacksPerSec*haste)){ports.weaponAttack(r);if(e.hp<=0){ports.winEncounter(true);return;}}
 if(r.tDot>=1){
  r.tDot-=1;
  const hasBurn=e.burnStacks>0,hasDots=e.bleedStacks+e.burnStacks>0;
  if(hasDots){const bleeding=e.bleedStacks>0,applied=ports.tickDots(e);if(bleeding&&applied>=e.hp)e.v012DeathBleed=true;ports.phase6Metric(r,'damageDealt',Math.min(Math.max(0,e.hp),applied));e.hp-=applied;ports.addLog('☠️ Damage over time: '+applied+' damage','spell');}
  if(hasBurn)ports.setHeatTick(r,true);
  if(s.bonus.regenBonus){const healed=ports.setHeal(r,ports.regenPerSecond(r.maxhp,s.bonus.regenBonus));if(healed>0)ports.addLog('💚 Regeneration +'+Math.round(healed)+' HP','good');}
  if(ports.isPhase1Run()&&ports.phase1Build)WandererV012Buildcraft.onSecond(ports.phase1Build,ports.phase2Context(r));
  if(e.slowTime>0)e.slowTime=Math.max(0,e.slowTime-1);
  if(e.hp<=0){ports.winEncounter();return;}
 }
 const slowed=e.slowTime>0?1+(s.bonus.slowBonus||.22):1;
 if(r.tEnemy>=e.attackEvery*slowed){
  r.tEnemy=0;
  let enemyAbilityVfx=null;
  let raw=Math.max(Math.ceil(e.atk*.24),Math.round(e.atk*(1-Math.min(.75,s.defense/(s.defense+e.atk*1.35)))));
  if(e.effect==='burn')raw+=Math.round(r.tier*.3);
  if(e.effect==='sunder')raw+=Math.round(r.tier*.2);
  if(e.bossStyle==='berserker'&&e.hp<e.maxhp*.5){
   raw=Math.round(raw*1.35);
   if(!e.enraged){e.enraged=true;ports.addLog('🔥 Ember Sovereign enrages below half HP!','critical');ports.combatEffect('BossEmber');}
  }
  if(e.eliteType==='berserker'&&e.hp<e.maxhp*.5)raw=Math.round(raw*1.08);
  const weaker=ports.setEnemyWeaken(r);
  if(weaker)raw=Math.max(1,Math.round(raw*(1-weaker)));
  // Elite Berserker cannot one-shot a full-health player with one direct hit.
  // Cap before Block/Barrier so defensive investment still matters.
  if(e.eliteType==='berserker')raw=Math.min(raw,Math.max(1,Math.floor(r.maxhp*.35)));
  if(ports.tryDodge(r,ports.enemyAttackType(e))){ports.animateEnemyStrike();}
  else{
  const mitigation=Math.max(lt.guard||0,lt.weaken||0);lt.guard=0;lt.weaken=0;
  if(mitigation)raw=Math.max(1,Math.round(raw*(1-mitigation)));
  if(ports.isPhase1Run()&&ports.phase1Build)raw=WandererV012Buildcraft.incoming(ports.phase1Build,ports.phase2Context(r),raw);if(r.phase1&&ports.phase6Run?.effects.curse?.remaining>0)raw=Math.round(raw*1.10);
  let damageBlocked=0;
  const block=s.blockChance&&ports.gameRandom()<s.blockChance/100;
  if(block){
   damageBlocked=Math.max(1,Math.round(raw*s.blockReduction));raw-=damageBlocked;
   ports.addLog('🛡 BLOCK! Shield prevents '+damageBlocked+' damage','good');ports.animateDefense();
   if(s.bonus.shieldRiposte&&ports.setNow(r)>=t.shieldCounterUntil&&ports.setReady(r,'shieldRiposte',3)){t.shieldCounter=damageBlocked*.25;t.shieldCounterUntil=ports.setNow(r)+4;}
   if(s.off?.subtype==='Shield'&&['Sword','Mace'].includes(s.main?.subtype)&&!ports.legendaryHas('oathwall')&&ports.setReady(r,'shieldBaseCounter',2.5)){
    const baseFactor=s.main.subtype==='Mace'?1.4:1;
    const base=Math.max(1,Math.round(s.attack*baseFactor-e.def));
    ports.setDirectEnemyDamage(r,base*.45,'🛡 Shield Counterattack');
    if(e.hp<=0){ports.winEncounter();return;}
   }
  }
  const barrierBeforeHit=r.barrier,blocked=Math.min(r.barrier,raw);r.barrier-=blocked;
  const barrierBroken=barrierBeforeHit>0&&r.barrier<=0,hit=Math.max(0,raw-blocked);
  if(blocked>0)ports.addLog('🛡 Barrier absorbs '+blocked+' damage','good');
  if(hit>0){
   ports.phase6Metric(r,'damageTaken',Math.min(Math.max(0,r.hp),hit));r.hp-=hit;ports.addLog('🩸 '+e.name+' hits for '+hit+' HP','bleed');ports.floatText(hit,'hero');
   if(e.eliteType==='tank'){
    const newWound=(r.playerHealingDebuffUntil||0)<=ports.setNow(r);
    r.playerHealingDebuffUntil=ports.setNow(r)+5;
    if(newWound)ports.addLog('🛡️ Tank applies Healing Reduction: −40% healing for 5s!','critical');
   }
   if(e.eliteType==='vampire'){
    const multiplier=ports.isPhase1Run()&&ports.phase1Build?WandererV012Buildcraft.enemyHealMultiplier(ports.phase1Build,e):1;
    const heal=Math.floor(Math.min(Math.max(0,e.maxhp-e.hp),Math.max(1,Math.round(hit*.38)),Math.max(1,Math.round(e.maxhp*.06)))*multiplier);
    if(heal>0){e.hp+=heal;ports.addLog('🩸 Vampire drains '+heal+' HP','spell');enemyAbilityVfx='EliteVampire';}
   }
   if(e.eliteType==='caster'&&ports.setNow(r)>=(r.nextCasterHexAt||0)){
    r.playerDebuffUntil=ports.setNow(r)+3;r.nextCasterHexAt=ports.setNow(r)+7;
    ports.addLog('🔮 Caster applies Weakened: -20% direct damage for 3s!','spell');enemyAbilityVfx='EliteCaster';
   }
  }
  if(e.bossStyle==='leech'&&hit>0){const multiplier=ports.isPhase1Run()&&ports.phase1Build?WandererV012Buildcraft.enemyHealMultiplier(ports.phase1Build,e):1;const heal=Math.floor(Math.min(e.maxhp-e.hp,Math.round(hit*.28))*multiplier);e.hp+=heal;if(heal){ports.addLog('🌑 Rift Harbinger drains '+heal+' HP','spell');enemyAbilityVfx='BossRift';}}
  if(e.bossStyle==='guardian'&&!e.barrier){e.barrier=Math.max(2,Math.round(r.tier*.45));ports.addLog('🛡 Abyssal Guardian restores '+e.barrier+' Barrier','spell');ports.combatEffect('BossAbyssal');}
  ports.legendaryDefensiveEffects(r,damageBlocked,hit,blocked,barrierBeforeHit>0&&r.barrier<=0);
  if(ports.isPhase1Run()&&ports.phase1Build)WandererV012Buildcraft.onDefend(ports.phase1Build,{...ports.phase2Context(r),barrierBroken},damageBlocked,blocked);
  if(s.bonus.lastBastion&&r.barrier>=r.maxhp*.1&&ports.setReady(r,'lastBastion',12))t.lastBastionReady=true;
  if(r.hp>0&&s.bonus.natureRenewal&&!t.natureRenewalUsed&&r.hp<=r.maxhp*.35){t.natureRenewalUsed=true;const gained=ports.setHeal(r,r.maxhp*.08);ports.addLog('🌿 Verdant Renewal: +'+Math.round(gained)+' HP','good');}
  if(r.hp>0&&s.bonus.tideSurge&&!t.tideSurgeUsed&&r.barrier<r.maxhp*.05){t.tideSurgeUsed=true;const gained=ports.setBarrier(r,r.maxhp*.08);ports.addLog('🌊 High Tide: +'+Math.round(gained)+' Barrier','good');}
  ports.animateEnemyStrike(enemyAbilityVfx);
  }
 }
 if(r.hp<=0){
  if(s.bonus.secondWind&&!r.secondWindUsed){r.secondWindUsed=true;r.hp=1;ports.setBarrier(r,r.maxhp*.08);ports.addLog('💚 Second Wind! Survived lethal damage (once per expedition)','good');}
  else if(ports.isPhase1Run()&&ports.phase1Build&&WandererV012Buildcraft.survive(ports.phase1Build,ports.phase2Context(r))){if(ports.phase4Entry?.session.build){ports.phase4Entry.session.build.runtime.lastStand=true;ports.phase5Persist();}}
  else {ports.die();return;}
 }
 if(e.hp<=0){ports.winEncounter();return;}
 ports.updateBars();
}

function phase2Context(r){
 const e=r.enemy,now=ports.setNow(r);
 return {player:r,enemy:e,now,random:ports.gameRandom,base:r.lastBaseHit||r.stats.attack,healTriggersPassives:true,healingMultiplier:(r.playerHealingDebuffUntil||0)>now?.6:1,waveKey:r.phase1Plane+':'+r.enc,
 dot(kind,potency){
  if(!['bleed','burn'].includes(kind))return;
  ports.phase6Proc(r,kind+' application');const values=e.dots[kind]||(e.dots[kind]=[]);
  if(values.length>=12)values.shift();values.push({damage:Math.max(1,Math.round(kind==='bleed'?WandererV012Buildcraft.bleedDamage(ports.phase1Build,potency):potency)),remaining:3});ports.synchronizeDots(e);
 },
 dotDamage(amount,label){const n=Math.max(0,Math.round(amount));if(n){ports.phase6Metric(r,'damageDealt',Math.min(Math.max(0,e.hp),n));e.hp-=n;ports.addLog(label+' '+n+' damage','spell');}},
 damage(amount,label){return ports.setDirectEnemyDamage(r,amount,label);},
 heal(amount){return ports.setHeal(r,amount);},
 barrier(amount){return ports.setBarrier(r,amount);},
 mana(amount){r.mp=Math.min(r.maxmp,r.mp+Math.max(0,amount));},
 chill(duration){e.slowTime=Math.max(e.slowTime,e.boss?Math.min(1.2,duration):duration);},
 log(msg){ports.addLog(msg,'spell');}
 };
}

function phase2Stats(){
 let equipment=ports.state.equip;const buff=ports.phase6Run?.effects.item;
 if(buff?.remaining>0){equipment={...equipment};for(const [slot,item]of Object.entries(equipment))if(item?.id===buff.id){equipment[slot]={...item};for(const [,key]of ports.FIELDS)if(Number.isFinite(item[key]))equipment[slot][key]=item[key]*1.10;}}
 return ports.phase6Stats(ports.phase1Build?WandererV012Buildcraft.mods(ports.phase1Build,ports.totalStats(equipment)):ports.totalStats(equipment));
}

function phase2WeaponAttack(r,base,critical,cast){
 if(!ports.isPhase1Run()||!ports.phase1Build)return;
 const ctx=ports.phase2Context(r);ctx.base=base;ctx.critical=critical;ctx.magical=cast;ctx.funded=!!cast;
 WandererV012Buildcraft.onAttack(ports.phase1Build,ctx);
 if(cast&&ports.phase1Build.element){
  ctx.power=r.stats.spellPower;ctx.amp=r.stats.main?.subtype==='Staff'?1.25:r.stats.main?.subtype==='Wand'?1.12:1;
  WandererV012Buildcraft.onCast(ports.phase1Build,ctx);
 }
}

function phase2MagicTick(r){
 if(!ports.isPhase1Run()||!WandererV012Buildcraft.canCast(ports.phase1Build)||r.stats.caster||r.status!=='fight')return;
 const ctx=ports.phase2Context(r),b=ports.phase1Build;
 if(ctx.now-b.runtime.lastSpellAt<2.5)return;
 const cost=WandererV012Buildcraft.nextCost(b);if(r.mp<cost)return;
 b.runtime.lastSpellAt=ctx.now;ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;ctx.power=r.stats.spellPower;ctx.amp=1;ctx.funded=true;
 ports.setDirectEnemyDamage(r,Math.max(1,Math.round(WandererV012Buildcraft.elementalPower(b,ctx.power)*.70)),'✨ '+b.element);
 WandererV012Buildcraft.onCast(b,ctx);
 ports.combatEffect('Wand',({fire:'burn',frost:'slow',lightning:'shock'})[b.element]);
}

function phase6Metric(r,key,n){if(!r?.phase1||!Number.isFinite(n)||n<0)return;r.metrics??={};r.metrics[key]=(r.metrics[key]||0)+n;}

function phase6Proc(r,label){if(!r?.phase1)return;r.metrics??={};r.metrics.procs??={};r.metrics.procs[label]=(r.metrics.procs[label]||0)+1;}

function phase6CollectMetrics(r){if(!ports.phase6Run||r.metricsCommitted)return;r.metricsCommitted=true;ports.phase6Run.metrics??={};for(const [k,v]of Object.entries(r.metrics||{})){if(k==='procs'){ports.phase6Run.metrics.procs??={};for(const [label,n]of Object.entries(v))ports.phase6Run.metrics.procs[label]=(ports.phase6Run.metrics.procs[label]||0)+n;}else ports.phase6Run.metrics[k]=(ports.phase6Run.metrics[k]||0)+v;}}

function phase6Stats(stats){return ports.phase6Run?WandererV012CombatCore.applyExpeditionModifiers(stats,ports.phase6Run.effects):stats;}

function winEncounter(){ports.phase1WaveWon();}

function die(){ports.phase1Death();}
return {addLog,bossForTier,eliteArchetype,rollEliteArchetype,tryDodge,enemyFor,synchronizeDots,tickDots,setRuntime,setNow,advancePlayerAttackClock,activeLegendarySignatures,legendaryRuntime,legendaryHas,legendaryReady,legendaryExtend,legendaryAffinity,legendaryAttackBonus,legendaryOffhand,legendaryDefensiveEffects,legendaryTick,legendaryKill,setReady,setBarrier,regenPerSecond,setHeal,setDelayEnemy,setDirectEnemyDamage,setOnAttack,setCombatExpire,setEnemyWeaken,setHeatTick,setSoulHeal,applyAffinity,weaponAttack,updateFight,phase2Context,phase2Stats,phase2WeaponAttack,phase2MagicTick,phase6Metric,phase6Proc,phase6CollectMetrics,phase6Stats,winEncounter,die};
}
root.WandererV012CombatRuntime=Object.freeze({create});
})(globalThis);
