// v0.12 combat runtime. Canonical state transitions; UI effects are injected.
(function(root){'use strict';
function cappedStrikeDamage(raw,strike,heroMaxHp){
 const charged=Math.max(1,Math.round(raw*strike.multiplier));
 const cap=Math.max(1,Math.floor(heroMaxHp*strike.capFraction));
 return Math.min(charged,cap);
}
function create(ports){
const mobWindups=new WeakSet;
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

function statOnly(){return root.WandererExpeditionProgression?.CALIBRATION_STAT_ONLY===true;}
function enemyFor(level,enc,override=null){
 const theme=override?.theme||ports.currentTheme(),boss=override?!!override.boss:enc===5&&level%10===0,miniboss=override?!boss&&!!override.elite:enc===4;
 const v=ports.estimateEnemy(level,1); // never vary the stat budget by room index
 const variant=boss?(override?.variant||ports.bossForTier(level)):null;
 const mob=boss?{name:variant.name,image:variant.image}:override?.mob||ports.sample(theme.mobs);
 const role=boss?'boss':miniboss?'miniboss':(['minion','tank','skirmisher','caster'].includes(mob.role)?mob.role:'skirmisher');
 const elite=miniboss?ports.eliteArchetype(ports.state.run):null;
 const P=root.WandererExpeditionProgression;
 const identity=boss?P.BOSS_BASE[variant.style]:elite||P.NORMAL_BASE[role];
 const eligible=ports.state.run?.phase1&&(boss||miniboss)&&!statOnly();
 const base=eligible?P.leaderIdentityBudget(identity,level,variant?.style,elite?.id):identity;
 if(!base)throw Error('Missing fixed native enemy budget '+role+'/'+variant?.style);
 // One shared enemyReference(E) grows every role. The leader-only identity
 // interpolation changes the matchup without multiplying native stats twice.
 const hp=Math.max(1,Math.round(v.hp*base.hp));
 const atk=Math.max(1,Math.round(v.atk*base.atk));
 const defense=Math.max(0,Math.round(v.def*base.def));
 const barrier=statOnly()?0:
  variant?.style==='guardian'?Math.max(3,WandererV012CombatCore.enemyStat(level,Math.round(WandererV012CombatCore.referenceLevel(level)*.9))):
  elite?.id==='tank'?Math.max(1,WandererV012CombatCore.enemyStat(level,Math.round(1+WandererV012CombatCore.referenceLevel(level)*.3))):0;
 return {name:miniboss?elite.icon+' '+elite.name:mob.name,image:elite?ports.eliteArt(elite.id,mob.image):mob.image,role,bossStyle:variant?.style||null,attackType:['caster','gravecaller','oathbound_exarch'].includes(elite?.id)||['leech','conductor','devourer'].includes(variant?.style)||role==='caster'?'spell':'physical',
 miniboss,eliteType:elite?.id||null,archetypeName:elite?.name||null,hp,maxhp:hp,atk,def:defense,baseDef:defense,barrier,
 attackEvery:base.interval,boss,effect:theme.effect,burn:0,bleed:0,
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

// Only original primary Bleed stacks run on the faster clock. Propagation,
 // transfer, Burn and Rot retain their native cadence and remaining-tick budgets.
function acceleratedPrimary(dot){return !dot.spread&&!dot.transferred&&!dot.secondaryOrigin;}
function ordinaryBleed(enemy){return (enemy.dots?.bleed||[]).some(d=>d.remaining>0&&(!learned('accelerated_bleeding')||!acceleratedPrimary(d)));}
function advanceAcceleratedBleed(r,dt){
 if(!learned('accelerated_bleeding'))return;
 for(const enemy of r.enemies||[r.enemy]){
  if(!enemy||enemy.hp<=0)continue;
  const dots=enemy.dots?.bleed||[];let raw=0;
  for(const d of dots){
   if(!acceleratedPrimary(d)||d.remaining<=0)continue;
   d.acceleratedElapsed=(d.acceleratedElapsed||0)+Math.max(0,dt);
   while(d.acceleratedElapsed+1e-9>=.75&&d.remaining>0){d.acceleratedElapsed=Math.max(0,d.acceleratedElapsed-.75);d.remaining--;raw+=d.damage;ports.phase6Metric(r,'acceleratedBleedTicks',1);}
  }
  if(raw>0){
   enemy.dots.bleed=dots.filter(d=>d.remaining>0);ports.synchronizeDots(enemy);if(!enemy.bleedStacks)enemy.carrionCharge=0;
   enemy.lastBleedTick=ports.setNow(r);const damage=Math.round(raw*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));
   const actual=Math.min(enemy.hp,damage);if(damage>=enemy.hp)enemy.v012DeathBleed=true;
   enemy.hp-=damage;ports.phase6Metric(r,'damageDealt',actual);ports.phase6Metric(r,'periodicDamage',actual);ports.phase6Metric(r,'acceleratedBleedDamage',actual);if(damage>0)ports.floatText(damage,'enemy',false,'BLEED',enemy);
  }
 }
}
function tickDots(enemy){
 WandererV012Buildcraft.migrateEnemyDots(enemy);
 if(!enemy.dots)return 0;
 let total=0;
 for(const key of ['bleed','burn']){
 const active=enemy.dots[key]||[];
 for(const d of active){if(key==='bleed'&&learned('accelerated_bleeding')&&acceleratedPrimary(d))continue;total+=d.damage;d.remaining-=1;}
 enemy.dots[key]=active.filter(d=>d.remaining>0);
 }
 ports.synchronizeDots(enemy);
 if(!enemy.bleedStacks)enemy.carrionCharge=0;
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
 if((ports.legendaryHas('veil-thousand-seals')||ports.legendaryHas('heartroot-carapace'))&&t.realm!==r.phase1Plane){t.realm=r.phase1Plane;t.veilGranted=false;t.veilBarrier=0;t.veilEarlierBarrier=0;t.veilReady=0;t.heartrootHealed=0;}
 if(t.enemy!==r.enemy){t.enemy=r.enemy;t.markUntil=0;t.marked=false;t.weaken=0;t.killUsed=false;}
 return t;
}

function legendaryHas(id){return ports.activeLegendarySignatures().some(sig=>sig.identity.id===id);}
function legendaryEmpowered(r,id){return !!(ports.phase1Build?.unlockedFamilies||[]).includes(globalThis.WandererLegendary.DEFINITIONS[id].affinity);}
function legendaryProc(r,id){if(!ports.legendaryReady(r,id))return false;ports.phase6Proc(r,'Legendary: '+id);return true;}

function legendaryReady(r,id){
 const d=globalThis.WandererLegendary?.DEFINITIONS[id];
 if(!d||!ports.legendaryHas(id)||!ports.setReady(r,'legendary:'+id,d.cooldown))return false;
 ports.addLog('✦ '+d.name,'good');return true;
}

function legendaryExtend(e,type){
 const stack=e.dots?.[type]?.find(x=>x.remaining<6);
 if(!stack)return false;stack.remaining++;ports.synchronizeDots(e);return true;
}


function legendaryAttackBonus(r,base,critical,cast){
 const t=ports.legendaryRuntime(r),e=r.enemy,now=ports.setNow(r);let added=0;
 r.legendaryAttackCount=(r.legendaryAttackCount||0)+1;
 if(cast)r.legendaryCastCount=(r.legendaryCastCount||0)+1;
 if(t.verdantReady){added+=Math.round(base*t.verdantReady);t.verdantReady=0;}
 if(t.veilReady){added+=Math.round(base*t.veilReady);t.veilReady=0;}
 if(ports.legendaryHas('verdant-oath')&&ports.legendaryProc(r,'verdant-oath')){ports.setHeal(r,r.maxhp*(ports.legendaryEmpowered(r,'verdant-oath')?.012:.008));t.verdantReady=ports.legendaryEmpowered(r,'verdant-oath')?.90:.60;}
 if(e.v012Rot?.length&&ports.legendaryHas('eye-of-morrow')&&ports.legendaryProc(r,'eye-of-morrow'))added+=Math.min(Math.round(base*(ports.legendaryEmpowered(r,'eye-of-morrow')?.85:.60)),Math.round(e.maxhp*(e.boss?.015:.025)));
 if(ports.legendaryHas('kingsbreaker')&&ports.legendaryProc(r,'kingsbreaker'))added+=Math.round(base*(ports.legendaryEmpowered(r,'kingsbreaker')?1.10:.80));
 if(critical&&ports.legendaryHas('tempest-talon')&&ports.legendaryProc(r,'tempest-talon'))added+=Math.round(base*(ports.legendaryEmpowered(r,'tempest-talon')?.35:.25));
 if(cast&&ports.legendaryHas('astrafall')){t.astraCasts=Math.min(2,(t.astraCasts||0)+1);if(t.astraCasts>=2&&ports.legendaryProc(r,'astrafall')){t.astraCasts=0;added+=Math.round(r.stats.spellPower*(ports.legendaryEmpowered(r,'astrafall')?1:.75));}}
 if(cast&&ports.legendaryHas('voidglass')){t.voidCasts=Math.min(2,(t.voidCasts||0)+1);if(t.voidCasts>=2&&ports.legendaryProc(r,'voidglass')){t.voidCasts=0;added+=Math.round(r.stats.spellPower*(ports.legendaryEmpowered(r,'voidglass')?1.20:.90));r.mp=Math.min(r.maxmp,r.mp+(r.legendaryFundedCost||0)*(ports.legendaryEmpowered(r,'voidglass')?.30:.25));}}
 return added;
}
function legendaryOnHit(r,base,real){
 if(real<=0)return;
 const e=r.enemy;
 if(ports.legendaryHas('chalice-hollow-king')&&e.bleedStacks>0&&ports.legendaryProc(r,'chalice-hollow-king'))ports.setHeal(r,r.maxhp*(ports.legendaryEmpowered(r,'chalice-hollow-king')?.015:.01));
 if(e.hp<=0)return;
 if(ports.legendaryHas('crimson-fang')&&ports.legendaryProc(r,'crimson-fang')){const dots=e.dots.bleed;if(dots.length>=12)dots.shift();dots.push({damage:Math.max(1,Math.round(WandererV012Buildcraft.bleedDamage(ports.phase1Build,base*(ports.legendaryEmpowered(r,'crimson-fang')?.16:.12)))),remaining:4});ports.synchronizeDots(e);}
 if(ports.legendaryHas('gravewake')&&ports.legendaryProc(r,'gravewake'))WandererV012Buildcraft.applyRot(ports.phase1Build,ports.phase2Context(r),base*(ports.legendaryEmpowered(r,'gravewake')?.10:.07));
}


function legendaryDefensiveEffects(r,blocked,hit,absorbed=0,broken=false){
 if(r.hp<=0)return;
 const t=ports.legendaryRuntime(r);
 if(absorbed>0&&t.veilBarrier>0){const earlier=Math.min(absorbed,t.veilEarlierBarrier||0);t.veilEarlierBarrier-=earlier;const veilAbsorbed=Math.min(t.veilBarrier,absorbed-earlier);t.veilBarrier-=veilAbsorbed;if(veilAbsorbed>0&&ports.legendaryHas('veil-thousand-seals')&&ports.legendaryProc(r,'veil-thousand-seals'))t.veilReady=ports.legendaryEmpowered(r,'veil-thousand-seals')?.45:.30;}
}

function legendaryRealmStart(r){
 if(!ports.legendaryHas('veil-thousand-seals'))return;
 const t=ports.legendaryRuntime(r);
 if(ports.legendaryHas('veil-thousand-seals')&&!t.veilGranted){t.veilGranted=true;t.veilEarlierBarrier=r.barrier;t.veilBarrier=ports.setBarrier(r,r.maxhp*((r.stats?.main?.subtype==='Sword'&&r.stats?.off?.subtype==='Shield')?(ports.legendaryEmpowered(r,'veil-thousand-seals')?.04:.025):(ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04)));if(t.veilBarrier>0)ports.phase6Proc(r,'Legendary: veil-thousand-seals: barrier');}
}

function legendaryTick(r,dt){
 const t=ports.legendaryRuntime(r);
 ports.legendaryRealmStart(r);
 if(ports.legendaryHas('heartroot-carapace')&&r.hp>0&&r.hp<r.maxhp*.7){const budget=Math.max(0,r.maxhp*.10-(t.heartrootHealed||0));if(budget>0){const healed=ports.setHeal(r,Math.min(budget,r.maxhp*(ports.legendaryEmpowered(r,'heartroot-carapace')?.003:.002)*dt));if(healed>0){t.heartrootHealed=(t.heartrootHealed||0)+healed;ports.phase6Proc(r,'Legendary: heartroot-carapace');}}}
}


function setReady(r,name,seconds){
 const timers=r.setCooldowns||(r.setCooldowns={}),now=ports.setNow(r);
 if(now<(timers[name]||0))return false;
 (r.cooldownPeriods??={})[name]=seconds;timers[name]=now+seconds;return true;
}

function setBarrier(r,amount){
 // One shared uncapped Barrier pool. The next encounter clears any remainder.
 const before=Math.max(0,Number(r.barrier)||0),value=Number(amount),ward=Number(r.stats?.wardBonus)||0;
 const gained=Number.isFinite(value)&&value>0?Math.max(0,value*(1+ward)):0;
 r.barrier=before+gained;
 return gained;
}

function regenPerSecond(maxhp,rate=.006){return Math.max(0,maxhp)*Math.max(0,rate)}

function setHeal(r,amount,reserveRelease=false){
 // Tank's healing wound affects all player healing: regeneration, Drain,
 // Nature, Soul Pact and heal-on-hit, but does not reduce Barrier generation.
 const healingReduced=(r.playerHealingDebuffUntil||0)>ports.setNow(r);
 const bossHealingFactor=globalThis.WandererV013BossModifiers?.healingFactor(r)??1;
 const conditionHealingFactor=globalThis.WandererV013ExpeditionConditions?.healingFactor(r)??1;
 const heal=Math.max(0,Number(amount)||0)*(healingReduced ? 0.60 : 1)*bossHealingFactor*conditionHealingFactor,before=r.hp;
 r.hp=Math.min(r.maxhp,r.hp+heal);
 const actual=r.hp-before,overheal=heal-actual;if(!reserveRelease&&overheal>0){if(prepared('lifeweaver'))r.lifeCharge=true;if(before>=r.maxhp&&learned('deep_reserves')&&!r.reserveSaved){r.reserveSaved=true;r.deepReserve=Math.min(overheal,r.maxhp*.08);}}ports.phase6Metric(r,'healing',actual);
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
 const disarmed=root.WandererV013BossAbilities?.interruptCharge(r,'delay');
 if(disarmed)ports.addLog('✓ '+disarmed.enemy.name+' interrupted: '+disarmed.ability,'good');
 const interrupted=root.WandererV013EliteAbilities?.interrupt(r.enemy,r,'delay');
 if(interrupted)ports.addLog('✓ '+r.enemy.name+' interrupted: '+interrupted.ability,'good');
 if(r.enemy?.boss){const bossInterrupt=root.WandererV013BossInfrastructure?.interrupt(r,'delay');
  if(bossInterrupt)ports.addLog('✓ '+bossInterrupt.enemy.name+' interrupted: '+bossInterrupt.ability,'good');}
 ports.addLog('⏳ Enemy attack delayed by '+seconds+'s','good');return true;
}

// Primary hits alone call this. Reflection cannot trigger another on-hit callback.
function reflectThornbloom(r,enemy,hpLost){
 const raw=root.WandererV013EliteAbilities?.thornbloomDamage(enemy,r.combatSeconds,hpLost,r.maxhp)||0;
 if(!raw)return false;
 const s=r.stats;
 let incoming=raw;
 if(ports.phase1Build)incoming=Math.min(raw,WandererV012Buildcraft.incoming(ports.phase1Build,ports.phase2Context(r),raw));
 incoming=Math.max(0,Math.min(raw,incoming*(root.WandererV013ExpeditionBoons?.takenFactor(r)||1)));
 const steadfast=r.barrier>0&&ports.phase1Build?.runtime?.specializations?.includes('steadfast_guard');
 const chance=steadfast?Math.min(65,(s.blockChance||0)+15):s.blockChance||0;
 if(chance&&ports.gameRandom()<chance/100)incoming*=1-(s.blockReduction||(steadfast?.35:0));
 const absorbed=Math.min(r.barrier||0,incoming),hit=Math.min(r.hp,incoming-absorbed);
 r.barrier-=absorbed;r.hp-=hit;
 ports.phase6Metric(r,'absorbed',absorbed);ports.phase6Metric(r,'damageTaken',hit);
 ports.phase6Metric(r,'thornbloomHits',1);ports.phase6Metric(r,'thornbloomDamage',hit);
 ports.addLog('🌵 Thornbloom reflects '+hit.toFixed(1)+' damage'+(absorbed?' · Barrier '+absorbed.toFixed(1):''),'critical');
 return resolveBossPulseLethal(r,s);
}
function setDirectEnemyDamage(r,amount,label){
 const enemy=r.enemy;let damage=Math.max(0,Math.round(amount*(root.WandererV013ExpeditionBoons?.factor(r)||1)*(root.WandererV013BossAbilities?.directFactor(r,enemy)||1)));
 if(enemy.barrier>0){const before=enemy.barrier,absorbed=Math.min(enemy.barrier,damage);enemy.barrier-=absorbed;damage-=absorbed;if(root.WandererV013BossAbilities?.barrierChanged(r,enemy,before,enemy.barrier))ports.addLog('⛨ Ward shattered · Vulnerable for 3s!','good');}
 ports.phase6Metric(r,'damageDealt',Math.min(Math.max(0,enemy.hp),damage));ports.phase6Proc(r,label);enemy.hp-=damage;if(damage>0){ports.addLog(label+' '+damage+' bonus damage','good');ports.floatText(damage,'enemy',false,'',enemy);}
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

function applyAffinity(effect,enemy,s,mult=1,baseDamage=0,statusScale=1){
 if(!effect)return;
 const bonus=s.bonus||{},ratios={bleed:.18,burn:.17};
 const r=ports.state.run;
 if(ratios[effect]){
  if(!enemy.dots)enemy.dots={bleed:[],burn:[]};
  const src=enemy.dots[effect]||[];
  const potency=Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*ratios[effect]*mult*statusScale*(1+(bonus[effect+'Bonus']||0))));
  if(src.length>=12)src.shift();
  src.push({damage:effect==='bleed'&&ports.phase1Build?Math.max(1,Math.round(WandererV012Buildcraft.bleedDamage(ports.phase1Build,potency))):potency,remaining:3});enemy.dots[effect]=src;ports.synchronizeDots(enemy);
  return;
 }
 if(effect==='slow')enemy.slowTime=Math.max(enemy.slowTime||0,2.9*statusScale);
 if(effect==='sunder')enemy.def=Math.max(Math.round(enemy.baseDef*.25),enemy.def-Math.max(1,Math.round(enemy.baseDef*(bonus.sunderBonus||.1)*statusScale)));
 if(!r)return;
 if(effect==='drain'){
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
  const gained=ports.setHeal(r,heal);if(gained>0)ports.addLog('🌿 Nature heals +'+Math.round(gained)+' HP','good');
 }
 if(effect==='crystal')ports.setDirectEnemyDamage(r,(baseDamage||s.spellPower||s.attack||5)*.06*mult,'💎 Crystal:');
 if(effect==='shock')ports.setDirectEnemyDamage(r,(baseDamage||s.spellPower||s.attack||5)*.08*mult*(1+(bonus.shockBonus||0)),'⚡ Storm:');
 if(effect==='tide'){
  const gained=ports.setBarrier(r,Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*.07*mult*(1+(bonus.tideBonus||0)))));
  if(gained>0)ports.addLog('🌊 Tide grants +'+Math.round(gained)+' Barrier','good');
 }
}

// Secondary hits never invoke attack/cast/on-hit effects or create new chains.
function signature(family){const id=ports.state.runeSlots?.[0];return !!id&&ports.state.runes?.some(r=>r.id===id&&r.family===family);}
function v013Traits(){return [...new Set(Object.values(ports.state?.equip||{}).filter(Boolean).map(item=>item.v013Trait).filter(Boolean))];}
// Off-Hand identities: independent effects; every Orb uses one identical formula.
function offhandOrbWard(r){
 if(r.stats?.off?.subtype!=='Orb'||r.hp<=0)return 0;
 if(!ports.setReady(r,'orbWard',6))return 0;
 const gained=ports.setBarrier(r,WandererV012Buildcraft.barrierAmount(r.maxhp,r.stats?.spellPower,.02,.05));
 if(gained>0){
  ports.phase6Metric(r,'offhandOrbBarrier',gained);
  ports.phase6Proc(r,'Off-Hand: Orb Ward');
  ports.addLog('🔮 Orb Ward +'+Math.round(gained)+' Barrier','good');
 }
 return gained;
}
function offhandPaidAction(r){
 const type=r.stats?.off?.subtype;
 if(type!=='Tome')return;
 r.tomePaidActions=(r.tomePaidActions||0)+1;
 if(r.tomePaidActions%3!==0||!ports.setReady(r,'tomeRecall',6))return;
 // The Epic Tome upgrades the existing Recall, without adding a second proc.
 const manaPerRecall=r.stats.off.v013Trait==='echoing_recall'?5:3;
 const restored=Math.max(0,Math.min(manaPerRecall,r.maxmp-r.mp));
 if(restored<=0)return;
 r.mp+=restored;
 ports.phase6Metric(r,'offhandTomeMana',restored);
 ports.phase6Proc(r,'Off-Hand: Tome Recall');
 ports.addLog('📖 Tome Recall +'+restored+' Mana','spell');
}
function offhandOnMainHit(r,hpDamage){
 if(hpDamage<=0||r.hp<=0)return;
 if(r.stats?.off?.subtype==='Orb'){
  offhandOrbWard(r);
 }else if(r.stats?.off?.subtype==='Charm'&&r.hp<r.maxhp&&ports.setReady(r,'charmRenewal',8)){
  // The Epic Charm strengthens the same 8s Renewal; all healing debuffs apply.
  const healed=ports.setHeal(r,r.maxhp*(r.stats.off.v013Trait==='heartbloom'?.02:.015));
  if(healed>0){
   ports.phase6Metric(r,'offhandCharmHealing',healed);
   ports.phase6Proc(r,'Off-Hand: Charm Renewal');
   ports.addLog('💚 Charm Renewal +'+Math.round(healed)+' HP','good');
  }
 }
}
function v013FundedCost(baseCost){if(baseCost<=0)return 0;const adjusted=Math.max(1,Math.ceil(baseCost*(root.WandererV013ExpeditionBoons?.costFactor(ports.state.run)||1)));return v013Traits().includes('efficient')?Math.max(1,adjusted-Math.max(1,Math.floor(adjusted*.1))):adjusted;}
function v013SpellMultiplier(r){const nodes=ports.state.automaticTalents?.nodes||[],element=ports.phase1Build?.element,enemy=r.enemy;return (element==='fire'&&nodes.includes('fire_focus')?.9:1)*(element==='frost'&&nodes.includes('frost_focus')&&enemy.slowTime>0?1.2:1)*(element==='lightning'&&nodes.includes('lightning_focus')?1.35:1)*(element==='fire'&&nodes.includes('living_inferno')&&enemy.dots?.burn?.length?1.25:1)*(element==='frost'&&nodes.includes('absolute_winter')&&enemy.slowTime>0?1.2:1);}
function v013LightningChain(r){return ports.isPhase1Run()&&ports.phase1Build?.element==='lightning'&&(WandererV012Buildcraft.rank(ports.phase1Build,'overcharge')>0||ports.state.automaticTalents?.nodes?.includes('storm_mastery'))&&!ports.state.automaticTalents?.nodes?.includes('lightning_focus');}
function v013LightningChainFactors(){
 // Five ordinary jumps, six with Storm Mastery. With at most four live arena
 // slots, the later jumps revisit earlier targets instead of hitting reserves.
 return ports.state.automaticTalents?.nodes?.includes('storm_mastery')
  ?[.68,.53,.40,.29,.21,.15]:[.60,.45,.33,.23,.16];
}
function v013SecondaryHit(r,enemy,amount){
 if(!enemy||enemy.hp<=0)return 0;
 let remaining=Math.max(1,Math.round(amount*(root.WandererV013ExpeditionBoons?.factor(r,true)||1)));
 const absorbed=Math.min(enemy.barrier||0,remaining);
 enemy.barrier=Math.max(0,(enemy.barrier||0)-absorbed);
 remaining-=absorbed;
 const actual=Math.min(Math.max(0,enemy.hp),remaining);
 enemy.hp-=remaining;
 if(actual>0)ports.floatText(actual,'enemy',false,'',enemy);
 ports.phase6Metric(r,'damageDealt',actual);
 ports.phase6Metric(r,'secondaryTargetDamage',actual);
 if(actual>0)ports.phase6Metric(r,'secondaryTargetHits',1);
 return actual;
}
function v013CarrionDetonation(r,enemy,real){
 const b=ports.phase1Build;
 if(!ports.isPhase1Run()||!b||!WandererV012Buildcraft.rank(b,'carrion_detonation')||!(real>0))return;
 const bleed=(enemy.dots?.bleed||[]).filter(d=>d.remaining>0),rot=(enemy.v012Rot||[]).filter(d=>d.remaining>0);
 if(!bleed.length||!rot.length){enemy.carrionCharge=0;return;}
 const now=ports.setNow(r);
 if(now<(enemy.carrionReady||0))return;
 const threshold=Math.max(10,r.stats.attack*1.5);
 if(!(enemy.carrionCharge>0))ports.phase6Metric(r,"carrionMarks",1);
 enemy.carrionCharge=(enemy.carrionCharge||0)+real;
 ports.phase6Metric(r,"carrionChargeDamage",real);
 if(enemy.carrionCharge<threshold)return;
 enemy.carrionCharge=0;enemy.carrionReady=now+1.5;
 ports.phase6Metric(r,"carrionBursts",1);
 ports.phase6Proc(r,'Carrion Detonation: burst');
 const amount=threshold*0.75;
 const live=(r.enemies||[r.enemy]).filter(e=>e&&e.hp>0);
 const sourceBleed=bleed.filter(d=>!d.spread&&!d.transferred).sort((a,b)=>b.damage-a.damage)[0];
 const sourceRot=rot.filter(d=>!d.spread&&!d.transferred).sort((a,b)=>b.damage-a.damage)[0];
 for(const target of live){
  const before=target.hp,cap=target.maxhp*(target.boss?.04:target.miniboss?.08:.25);
  const burst=Math.max(1,Math.min(cap,amount*(target===enemy?.35:1)));
  if(target===enemy){const prev=r.enemy;try{r.enemy=target;ports.setDirectEnemyDamage(r,burst,"Carrion Detonation");}finally{r.enemy=prev;}}
  else v013SecondaryHit(r,target,burst);
  ports.phase6Metric(r,"carrionBurstDamage",Math.max(0,before-Math.max(0,target.hp)));
  if(target!==enemy&&target.hp>0){
   if(sourceBleed){target.dots??={};target.dots.bleed??=[];if(target.dots.bleed.length<12){target.dots.bleed.push({damage:Math.max(1,Math.round(sourceBleed.damage*.5)),remaining:Math.min(3,sourceBleed.remaining),spread:true,secondaryOrigin:"carrion"});ports.synchronizeDots(target);ports.phase6Metric(r,"carrionSpreadBleed",1);}}
   if(sourceRot){target.v012Rot??=[];const max=b.runtime?.specializations?.includes("rot_focus")?3:6;if(target.v012Rot.length<max){target.v012Rot.push({damage:Math.max(1,Math.round(sourceRot.damage*.5)),remaining:Math.min(3,sourceRot.remaining),ticks:0,spread:true,secondaryOrigin:"carrion"});ports.phase6Metric(r,"carrionSpreadRot",1);}}
  }
 }
}
function v013SecondaryWeaponStatus(r,e,base,real){
 if(!ports.isPhase1Run()||!ports.phase1Build||!(real>0))return;
 if(!e.bleedStacks||!e.v012Rot?.length)e.carrionCharge=0;
 if(e.hp>0){
  const previous=r.enemy;
  try{r.enemy=e;const ctx=phase2Context(r);ctx.base=base;ctx.metric=(key,n)=>ports.phase6Metric(r,key,n);WandererV012Buildcraft.onSecondaryWeaponStatus(ports.phase1Build,ctx,.5,.5);}
  finally{r.enemy=previous;}
  const s=r.stats,kind=s.main?.subtype;
  // Enemy-facing status affixes only; no self-heals, Barrier or recursive damage procs.
  const apply=(effect,chance,mult)=>{
   if(!['bleed','burn','slow','sunder'].includes(effect)||ports.gameRandom()>=chance*.5)return;
   ports.applyAffinity(effect,e,s,mult,real,.5);
   const d=e.dots?.[effect]?.at(-1);if(d&&['bleed','burn'].includes(effect))d.secondaryOrigin='weapon';
   ports.phase6Metric(r,'secondaryEquipmentStatusApplied',1);
  };
  apply(s.main?.effect,Math.min(1,ports.affinityProcChance(kind)),kind==='Two-Handed'?1.7:kind==='Daggers'?.7:1);
  if(ports.isMagicOffhand(s.off)&&s.off?.magic)apply(s.off.magic,.45,.85);
 }
 v013CarrionDetonation(r,e,real);
}
function groupSecondaryDamage(r,base,factors,label,physical=false){
 if(!r.enemies||r.enemies.length<2)return 0;
 const targets=r.enemies.filter(enemy=>enemy!==r.enemy&&enemy.hp>0).slice(0,factors.length);let hit=0;
 for(const [i,enemy] of targets.entries()){
  let amount=Math.max(1,Math.round((physical
   ?Math.max(1,Math.round(r.stats.attack*({'Two-Handed':1.70,Sword:1.12,Mace:1.4,Bow:1.08,Daggers:.80}[r.stats.main?.subtype]||1))-WandererV012Buildcraft.enemyDefense(ports.phase1Build,enemy))
   :base)*factors[i]));
  if(enemy.baseDef>0&&enemy.def<enemy.baseDef)amount=Math.max(1,Math.round(amount*(1+(ports.phase1Build?.runtime?.talentBonuses?.sunderDamage||0))));
  const actual=v013SecondaryHit(r,enemy,amount);
  if(physical)v013SecondaryWeaponStatus(r,enemy,amount,actual);
  hit++;
 }
 if(hit&&label.includes('Piercing Arrow'))ports.phase6Metric(r,'pierced',hit);
 if(hit){ports.combatLinkEffect?.(r,label.includes('Piercing')?'pierce':label.includes('Cleave')?'cleave':'aoe',r.enemy,targets);
   ports.addLog(label+' hits '+hit+' additional '+(hit===1?'enemy':'enemies')+'.','good');}
 return hit;
}
function v013LightningChainDamage(r,base){
 if(!r.enemies||r.enemies.length<2)return 0;
 const source=r.enemy,others=r.enemies.filter(enemy=>enemy!==source&&enemy.hp>0);
 if(!others.length)return 0;
 const factors=v013LightningChainFactors(),serial=(r.lightningChainSerial||0)+1;
 const focused=learned('static_focus')&&ports.phase1Build?.element==='lightning';
 const scale=focused?.75:1;let diverted=0;
 const concentrate=(target,raw)=>{if(focused&&target!==source){diverted+=raw*.25;return raw*scale;}return raw;};
 r.lightningChainSerial=serial;
 // One extra bounce per preceding additional active target: 1, 3 or 5-6 jumps.
 const count=others.length>=3?factors.length:Math.min(factors.length,others.length*2-1);
 let hit=0;
 for(let i=0;i<count;i++){
  const target=others[i%others.length];
  if(target.hp<=0)continue;
  let damage=Math.max(1,Math.round(base*factors[i]));
  if(target.baseDef>0&&target.def<target.baseDef)damage=Math.max(1,Math.round(damage*(1+(ports.phase1Build?.runtime?.talentBonuses?.sunderDamage||0))));
  const dealt=v013SecondaryHit(r,target,concentrate(target,damage));
  if(dealt<=0)continue;
  hit++;
  ports.phase6Metric(r,'lightningChainJumps',1);
  ports.combatLinkEffect?.(r,'shock',i===0?source:others[(i-1)%others.length],[target]);
  const now=r.combatSeconds||0,mark=target.v013LightningMark;
  // A mark can detonate only on a later CHAIN. Multiple jumps in one cast
  // cannot recursively explode their own freshly applied marks.
  if(mark&&mark.expiresAt>now&&mark.serial!==serial){
   const burst=Math.max(1,Math.round(base*.42));
   const applied=v013SecondaryHit(r,target,concentrate(target,target.boss?Math.min(burst,target.maxhp*.025):burst));
   let splash=0;
   for(const other of r.enemies.filter(e=>e!==target&&e.hp>0).slice(0,2)){
    splash+=v013SecondaryHit(r,other,concentrate(other,other.boss?Math.min(burst*.45,other.maxhp*.025):burst*.45));
    ports.combatLinkEffect?.(r,'shock',target,[other]);
   }
   ports.phase6Metric(r,'lightningMarksDetonated',1);
   ports.phase6Metric(r,'lightningMarkDamage',applied+splash);
   ports.addLog('⚡ Static Mark detonates on '+target.name+'.','spell');
  }
  target.v013LightningMark={serial,expiresAt:now+8};
  ports.phase6Metric(r,'lightningMarksApplied',1);
 }
 if(focused&&source.hp>0&&diverted>0){
  const raw=Math.min(diverted,base*.30,source.maxhp*(source.boss?.0075:source.miniboss?.015:.04));
  const actual=talentPulseDamage(r,source,raw,'static_focus');ports.phase6Metric(r,'static_focusActivations',1);ports.phase6Metric(r,'static_focusDamage',actual);
 }
 return hit;
}
function controlledSpreadBase(burn,enabled){return enabled?(burn.controlledBase??burn.damage)*.75:burn.damage;}
function groupElementalEffects(r,b){
 if(!r.enemies||!b)return;const nodes=ports.state.automaticTalents?.nodes||[],targets=r.enemies.filter(enemy=>enemy!==r.enemy&&enemy.hp>0).slice(0,2);
 if(b.element==='fire'&&nodes.includes('fire_spread')){const burn=r.enemy.dots?.burn?.at(-1);if(burn){const spreadBase=controlledSpreadBase(burn,nodes.includes('controlled_burn'));let spread=0;for(const enemy of targets){enemy.dots.burn??=[];if(enemy.dots.burn.length<12){enemy.dots.burn.push({damage:Math.max(1,Math.round(spreadBase*.65)),remaining:Math.min(3,burn.remaining),spread:true});ports.combatLinkEffect?.(r,'burn',r.enemy,[enemy]);spread++;}ports.synchronizeDots(enemy);}if(spread)groupSecondaryDamage(r,spreadBase,[.55,.40].slice(0,spread),'🔥 Wildfire');}}
 if(b.element==='fire'&&v013Traits().includes('conflagration')){const burn=r.enemy.dots?.burn?.at(-1),enemy=r.enemies.filter(enemy=>enemy!==r.enemy&&enemy.hp>0)[nodes.includes('fire_spread')?2:0];if(burn&&enemy){enemy.dots.burn??=[];if(enemy.dots.burn.length<12){enemy.dots.burn.push({damage:Math.max(1,Math.round(controlledSpreadBase(burn,nodes.includes('controlled_burn'))*.50)),remaining:Math.min(3,burn.remaining),spread:true});ports.combatLinkEffect?.(r,'burn',r.enemy,[enemy]);}ports.synchronizeDots(enemy);}}
 if(b.element==='frost'&&nodes.includes('frost_spread'))for(const enemy of targets){enemy.slowTime=Math.max(enemy.slowTime||0,2);ports.combatLinkEffect?.(r,'frost',r.enemy,[enemy]);}
}
function hasUnsettledGroupDeaths(r){return !!r.enemies?.some(enemy=>enemy.hp<=0&&!enemy.groupDefeated);}
const lastStruck=new WeakMap();
function learned(id){const nodes=ports.state.automaticTalents?.nodes||[];return nodes.reduce((n,key)=>n+Number(key===id||key.startsWith(id+'_rank')),0);}
function prepared(id){return ports.state.automaticTalents?.prepared===id&&learned(id)>0;}
function triggered(r,id){r.outerUses??={};r.outerUses[id]=(r.outerUses[id]||0)+1;ports.phase6Proc(r,id);}
function focusedWeaponDamage(r,damage,physical){return physical&&learned('single_target_mastery')&&!r.groupReserve?.length&&(!r.enemies||r.enemies.filter(enemy=>enemy.hp>0).length===1)?Math.max(1,Math.round(damage*1.15)):damage;}
function weaponAttack(r,offhandStrike=false){
 const s=r.stats,e=r.enemy,weapon=offhandStrike?s.off:s.main,off=s.off,caster=!offhandStrike&&s.caster,now=ports.setNow(r),temp=ports.setRuntime(r);
 if(!e.bleedStacks||!e.v012Rot?.length)e.carrionCharge=0;
 const lt=ports.legendaryRuntime(r),focus=!!lt.focusReady,armorReady=!!lt.armorReady;lt.focusReady=false;lt.armorReady=false;
 // An Off-Hand Dagger uses the same physical scaling as Daggers, before its 50% penalty.
 const kind=weapon?.subtype==='Off-Hand Dagger'?'Daggers':weapon?.subtype||'Unarmed',baseCost=kind==='Staff'?13:kind==='Wand'?9:0;
 const normalCost=baseCost&&ports.isPhase1Run()&&ports.phase1Build?.element?WandererV012Buildcraft.nextCost(ports.phase1Build,baseCost):baseCost;
 const cost=v013FundedCost(normalCost);
 let damage=0,element=null,cast=false;
 if(caster&&r.mp<cost&&!r.wisdomUsed&&signature('wisdom')){r.wisdomUsed=true;r.mp=cost;ports.addLog('Wisdom funded the missing Mana.','spell');}
 if(caster&&r.mp>=cost){
  if(ports.legendaryHas('voidglass'))r.legendaryFundedCost=cost;
  ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;cast=true;element=null;
  r.manaFallbackLogged=false;
  const factor=kind==='Staff'?1.32:1.05;
  damage=Math.max(1,Math.round((ports.phase1Build?.element?WandererV012Buildcraft.elementalPower(ports.phase1Build,s.spellPower):s.spellPower)*factor));
  if(element&&ports.isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);
  ports.addLog((ports.ELEMENTS[element]?.icon||'✨')+' '+kind+' casts '+(ports.ELEMENTS[element]?.name||'Magic')+' ('+damage+' magic).','spell');
 }else{
  const factor=kind==='Two-Handed'?1.70:kind==='Mace'?1.4:kind==='Bow'?1.08:kind==='Daggers'?.80:kind==='Sword'?1.12:caster?.55:1;
  damage=Math.max(1,Math.round(s.attack*factor)-Math.round(WandererV012Buildcraft.enemyDefense(ports.phase1Build,e)*(armorReady?.8:1)));
  // Wand and Staff already auto-attack when Mana is insufficient.
  // Their weak physical fallback cannot cast, use Magic status, or gain Infusion.
  if(caster){ports.phase6Metric(r,'unfundedCasterAttacks',1);
   if(!r.manaFallbackLogged){ports.addLog('No Mana: '+kind+' uses a weak physical attack.','spell');r.manaFallbackLogged=true;}
  }
 }
 if(offhandStrike)damage=Math.max(1,Math.round(damage*.50));
 damage=focusedWeaponDamage(r,damage,!caster&&!cast);
 const specialized=ports.state.automaticTalents?.nodes||[];
 if(specialized.includes('blood_focus'))damage=Math.max(1,Math.round(damage*.9));
 if(specialized.includes('aegis_bulwark'))damage=Math.max(1,Math.round(damage*.9));
 if(cast)damage=Math.max(1,Math.round(damage*v013SpellMultiplier(r)));
 if(v013Traits().includes('focused')&&!r.groupReserve?.length&&(!r.enemies||r.enemies.filter(enemy=>enemy.hp>0).length===1))damage=Math.max(1,Math.round(damage*1.1));
 if(cast&&v013Traits().includes('ward')&&ports.setReady(r,'v013Ward',6))ports.setBarrier(r,r.maxhp*.02);
 if(!offhandStrike)r.unfundedAttack=caster&&!cast;
 const base=damage;r.lastBaseHit=base;
 if(e.baseDef>0&&e.def<e.baseDef)damage=Math.max(1,Math.round(damage*(1+(ports.phase1Build?.runtime?.talentBonuses?.sunderDamage||0))));
 const perfect=s.bonus.perfectStrike&&temp.focus>=3&&now>=(r.setCooldowns?.perfectStrike||0);
 if(perfect){ports.setReady(r,'perfectStrike',10);temp.focus=0;}
 const spark=cast&&r.mp===0&&!r.lastSpark&&learned('last_spark');if(spark)r.lastSpark=true;
 const critical=spark||perfect||ports.gameRandom()<s.crit/100;
 if(critical){damage=Math.max(1,Math.round(damage*(perfect?1.75:1.5)));ports.addLog((perfect?'✨ PERFECT STRIKE! ':'CRITICAL! ')+damage+' damage','critical');}
 const added=ports.setOnAttack(r,base,critical,perfect)+ports.legendaryAttackBonus(r,base,critical,cast);
 // Weapon identities: small sustain windows against burst without higher global damage.
 // Cooldowns run in combat seconds and persist across waves of one expedition.

 if(cast)offhandPaidAction(r);
 if(kind==='Mace'&&now>=(e.stunImmuneUntil||0)&&ports.gameRandom()<.25){
  e.stunnedUntil=now+(e.boss ? .4 : 1);e.stunImmuneUntil=now+4;ports.phase6Metric(r,'maceStuns',1);
  ports.floatText('STUN','enemy',false,'',e);ports.addLog('Stunned '+e.name,'good');
 }
 if(s.bonus.sunderExpose&&e.baseDef>0&&e.def<=e.baseDef*.5)damage=Math.round(damage*1.08);
 const endlessBonus=offhandStrike?0:WandererV012CombatCore.endlessWeaponDamageBonus(r.tier,weapon,off);
 if(endlessBonus)damage=Math.max(1,Math.round(damage*(1+endlessBonus)));
 damage+=added;
 if(r.playerDebuffUntil>now)damage=Math.max(1,Math.round(damage*.8));
 if(!offhandStrike){
  const previous=lastStruck.get(r);
  if(previous!==e){
   if(!(previous?.hp<=0&&r.aim===3&&learned('follow_through')))r.aim=0;
   if(previous?.v012Rot?.length&&!e.v012Rot?.length&&learned('spore_mark')&&ports.setReady(r,'sporeMark',5)){e.v012Rot=[{...previous.v012Rot[0],primaryPaid:false,transferred:true}];ports.combatLinkEffect?.(r,'rot',previous,[e]);}
  }
  lastStruck.set(r,e);
  const bleed=e.dots?.bleed||[];
  if(learned('open_wound')&&e.hp===e.maxhp&&!e.opened){e.opened=true;bleed.push({damage:Math.max(1,Math.round(damage*.12)),remaining:3});e.dots??={};e.dots.bleed=bleed;ports.synchronizeDots(e);}
  if(learned('relentless')||prepared('red_guillotine')){r.aim=((r.aim||0)+1)%4;if(!r.aim){damage*=1+.1*learned('relentless');if(prepared('red_guillotine')&&bleed.length){const spent=bleed.splice(0,3);damage+=spent.reduce((sum,d)=>sum+d.damage*d.remaining,0);r.guillotineSpore=spent[0];ports.synchronizeDots(e);triggered(r,'red_guillotine');}}}
  if(learned('blood_price')&&bleed.length>=3&&ports.setReady(r,'bloodPrice',6)){bleed.pop();ports.synchronizeDots(e);ports.setHeal(r,r.maxhp*.05);}
  if(r.storedImpact){damage+=r.storedImpact;r.storedImpact=0;}
  if(r.riposteUntil>now){damage+=s.attack*.75;r.riposteUntil=0;triggered(r,'turn_tide');}
  if(cast&&r.lifeCharge){r.lifeCharge=false;if(r.hp<r.maxhp*.5)ports.setHeal(r,r.maxhp*.08,true);else damage*=1.3;triggered(r,'lifeweaver');}
  if(cast&&learned('spell_echo')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount){const echo=Math.max(1,Math.round(damage*.1*learned('spell_echo')));damage+=echo;if(echo)ports.floatText(echo,'enemy',false,'ECHO',e);}}
  damage=Math.round(damage);
 }
 damage=Math.max(1,Math.round(damage*(root.WandererV013ExpeditionBoons?.factor(r)||1)*(root.WandererV013BossAbilities?.directFactor(r,e)||1)));
 const hpBefore=e.hp,barrierBefore=e.barrier;
 ports.animateStrike(kind,cast);
 if(e.barrier>0){const absorbed=Math.min(e.barrier,damage);e.barrier-=absorbed;damage-=absorbed;if(absorbed)ports.addLog('🛡 '+e.name+' absorbs '+absorbed+' damage','spell');if(root.WandererV013BossAbilities?.barrierChanged(r,e,barrierBefore,e.barrier))ports.addLog('⛨ Ward shattered · Vulnerable for 3s!','good');}
 const real=Math.max(0,Math.min(e.hp,damage));
 ports.phase6Metric(r,'damageDealt',Math.min(Math.max(0,e.hp),damage));e.hp-=damage;ports.floatText(damage,'enemy',critical,'',e);
 if(reflectThornbloom(r,e,real))return;
 if(!offhandStrike)offhandOnMainHit(r,real);
 if(r.guillotineSpore){const other=r.enemies?.find(m=>m!==e&&m.hp>0);if(e.hp<=0&&other){other.dots??={};other.dots.bleed??=[];other.dots.bleed.push({...r.guillotineSpore,secondaryOrigin:'guillotine',acceleratedElapsed:0});ports.synchronizeDots(other);}delete r.guillotineSpore;}
 if(e.hp<=0&&r.enemies?.some(m=>m!==e&&m.hp>0)&&!r.swiftUsed&&signature('swiftness')){r.swiftUsed=true;r.tPlayer=Math.min(.9/r.stats.attacksPerSec,(r.tPlayer||0)+.3/r.stats.attacksPerSec);ports.addLog('Swiftness advanced your next attack.','good');}
 ports.legendaryOnHit(r,base,real);
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
 if(!offhandStrike&&ports.WANDERER_DOUBLE_STRIKE_ENABLED&&kind==='Daggers'&&!['Daggers','Off-Hand Dagger'].includes(off?.subtype)&&damage>0&&e.hp>0&&ports.gameRandom()<.25){
  // One ordinary pre-critical main-hand hit, with no further rolls or recursive triggers.
  ports.setDirectEnemyDamage(r,Math.max(1,Math.round(base*.55)),'🗡 Double Strike!');
 }

 if(ports.isPhase1Run()){
  const talents=ports.state.automaticTalents?.nodes||[];
  if(cast&&e.v012Rot?.length&&talents.includes('soul_sip')&&ports.setReady(r,'soulSip',5)){r.mp=Math.min(r.maxmp,r.mp+3);ports.addLog('🌀 Soul Sip restores Mana.','spell');}
  if(r.hp<r.maxhp*.5&&talents.includes('living_ward')&&ports.setReady(r,'livingWard',8)){ports.setBarrier(r,r.maxhp*.05);ports.addLog('🌿 Living Ward grants Barrier.','good');}
 }
 if(ports.isPhase1Run()&&!offhandStrike){
   // Keep the purchased Fury Double Strike useful on the first main swing, but
   // never proc it on an offhand hit or the main swing that triggers the offhand.
   const dual=['Daggers','Off-Hand Dagger'].includes(off?.subtype);
   ports.phase2WeaponAttack(r,base,critical,cast,dual&&(r.offhandCadence||0)===1);
  }
 if(!cast)v013CarrionDetonation(r,e,real);
 if(!offhandStrike&&kind==='Two-Handed'){const factor=ports.state.automaticTalents?.nodes?.includes('cleave_mastery')?.6:.4;groupSecondaryDamage(r,base,[factor,factor],'⚔ Cleave',true);}
 if(!offhandStrike&&kind==='Daggers'&&ports.state.automaticTalents?.nodes?.includes('fan_of_blades'))groupSecondaryDamage(r,base,[.22,.22],'🗡 Fan of Blades',true);
 if(!offhandStrike&&kind==='Bow')groupSecondaryDamage(r,base,ports.state.automaticTalents?.nodes?.includes('bow_pierce')?[1]:[.66],'🏹 Piercing Arrow',true);
 if(!offhandStrike&&kind==='Sword'&&off?.subtype==='Shield'&&ports.state.automaticTalents?.nodes?.includes('sword_sweep'))groupSecondaryDamage(r,base,[.25],'⚔ Shielded Sweep',true);
 if(!offhandStrike&&kind==='Mace'&&ports.state.automaticTalents?.nodes?.includes('mace_shockwave')){const secondary=r.enemies?.find(enemy=>enemy!==r.enemy&&enemy.hp>0);groupSecondaryDamage(r,base,[.3],'🔨 Concussive Swing',true);if(secondary&&secondary.hp>0)secondary.slowTime=Math.max(secondary.slowTime||0,1);}
 if(cast&&v013LightningChain(r))v013LightningChainDamage(r,base);
 if(s.counts.shield>=2){const gained=ports.setBarrier(r,Math.max(1,Math.round(r.maxhp*(s.bonus.shieldBonus||0))));if(gained>0)ports.addLog('🛡 Shield set: +'+Math.round(gained)+' Barrier','good');}
 if(!offhandStrike&&ports.isPhase1Run()&&ports.phase1Build){
  const ctx=ports.phase2Context(r);ctx.power=r.stats.spellPower||0;ctx.offhand=false;ctx.magical=cast;ctx.weaponSubtype=kind;
  const bonus=(!caster||cast)?WandererV012Buildcraft.onInfusionHit(ports.phase1Build,ctx):0;
  if(bonus>0){ports.phase6Metric(r,'infusionHits',1);ports.phase6Metric(r,'infusionDamage',bonus);}
 }
 if(!offhandStrike&&['Daggers','Off-Hand Dagger'].includes(off?.subtype)){
  // Any one-handed main weapon can trigger a Dagger off-hand strike after every two main attacks. Its damage remains 50%.
  r.offhandCadence=((r.offhandCadence||0)+1)%2;
  if(r.offhandCadence===0&&e.hp>0){r.offhandStrikes=(r.offhandStrikes||0)+1;weaponAttack(r,true);}
 }
 return damage;
}

function resolveBossPulseLethal(r,s){
 if(r.hp>0)return false;
 if(prepared('last_bastion')&&ports.phase6Run&&!ports.phase6Run.bastionSpent){ports.phase6Run.bastionSpent=true;r.hp=1;const before=r.barrier;ports.setBarrier(r,r.maxhp*.35);r.bastionSize=r.barrier-before;r.bastionUntil=ports.setNow(r)+4;triggered(r,'last_bastion');}
 if(r.hp>0)return false;
 if(s.bonus.secondWind&&!r.secondWindUsed){r.secondWindUsed=true;r.hp=1;ports.setBarrier(r,r.maxhp*.08);ports.addLog('💚 Second Wind! Survived lethal damage (once per expedition)','good');return false;}
 if(ports.isPhase1Run()&&ports.phase1Build&&WandererV012Buildcraft.survive(ports.phase1Build,ports.phase2Context(r))){
  if(ports.phase4Entry?.session.build){ports.phase4Entry.session.build.runtime.lastStand=true;ports.phase5Persist();}
  return false;
 }
 ports.die();return true;
}

// Root control is independent of Chill; use the stronger slow, not their product.
function enemySlowFactor(enemy,stats,now){
 const chill=enemy.slowTime>0?1+(stats.bonus.slowBonus||.22):1;
 return Math.max(chill,(enemy.graspingRootsUntil||0)>now&&!enemy.boss&&!enemy.miniboss?1.15:1);
}
function talentPulseDamage(r,enemy,amount,id){
 if(!enemy||enemy.hp<=0||enemy.stage84Node||!((r.enemies||[r.enemy]).includes(enemy))||!(amount>0))return 0;
 const old=r.enemy,before=enemy.hp,secondary=enemy!==old;
 try{r.enemy=enemy;ports.setDirectEnemyDamage(r,amount,({vital_pulse:'💚 Vital Pulse',living_force:'💚 Living Force',grasping_roots:'🌿 Grasping Roots',ward_echo:'🛡 Ward Echo',corruption_nova:'☠ Corruption Nova',arcane_nova:'✨ Arcane Nova',frost_resonance:'❄ Frost Resonance',glacial_echo:'❄ Glacial Echo',cinder_focus:'🔥 Cinder Focus',static_focus:'⚡ Static Focus',storm_conductor:'⚡ Storm Conductor'})[id]||id);}
 finally{r.enemy=old;}
 const actual=Math.max(0,before-Math.max(0,enemy.hp));
 if(secondary&&actual>0){ports.phase6Metric(r,'secondaryTargetDamage',actual);ports.phase6Metric(r,'secondaryTargetHits',1);}
 return actual;
}
function updateFight(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)){clearInterval(ports.clock);return;}
 const r=ports.state.run;if(!r||r.status!=='fight'){clearInterval(ports.clock);return;}
 // Fastest D200 measures only combat ticks at the selected playback speed.
 // No Tavern, Forge, Inventory, wave decisions or background tab time.
 if(!ports.isPhase1Run()&&ports.state.onlineProgress?.timerMetric==='combat-v1'&&ports.state.onlineProgress.timingEligible){
  ports.state.onlineProgress.activeMs+=110/ports.clockSpeed;
 }
 const dt=.11,s=r.stats,t=ports.setRuntime(r);let e=r.enemy;
 r.combatSeconds=(r.combatSeconds||0)+dt;
 // The Gravecaller's dedicated bound souls apply an encounter-local player DoT.
 const deathbound=root.WandererV013EliteAbilities?.tickDeathbound(r);
 if(deathbound?.ended)ports.addLog('☠ Deathbound Decay fades as the bound souls vanish.','good');
 else if(deathbound){
  ports.phase6Metric(r,'deathboundTicks',1);
  ports.phase6Metric(r,'deathboundDamage',deathbound.damage);
  ports.phase6Metric(r,'damageTaken',deathbound.damage);
  ports.phase6Metric(r,'absorbed',deathbound.absorbed);
  if(deathbound.damage){ports.floatText(deathbound.damage,'hero',false,'DECAY');ports.phase3FlashPlayerDamage?.();}
  ports.addLog('☠ Deathbound Decay ×'+deathbound.stacks+' · '+deathbound.damage+' HP'+(deathbound.absorbed?' · '+deathbound.absorbed+' Barrier absorbed':''),'critical');
  if(resolveBossPulseLethal(r,s))return;
 }
 if(root.WandererV013EnemyAbilities&&r.phase1){
  const events=root.WandererV013EnemyAbilities.tick(r,ports.setNow(r));
  for(const event of events){
   if(event.type==='prepare')ports.addLog('⚠ '+event.enemy.name+' prepares '+event.ability+'!','critical');
   else if(event.type==='interrupted')ports.addLog('✓ '+event.enemy.name+' interrupted: '+event.ability,'good');
   else if(event.type==='activate'){
    ports.phase6Metric(r,'enemyAbilityCasts',1);
    ports.addLog('✦ '+event.enemy.name+' uses '+event.ability+(event.target!==event.enemy?' on '+event.target.name:'')+(event.result?' · '+event.result:''),'spell');
     const visualKind=event.label==='Guarding'?'ward':event.label==='Renewing'?'heal':event.label==='Enraged'&&event.target!==event.enemy?'rally':null;
     if(visualKind&&event.result>0)ports.combatLinkEffect?.(r,visualKind,event.enemy,[event.target]);
   }
  }
 }
 if(root.WandererV013EliteAbilities&&r.phase1){
  for(const event of root.WandererV013EliteAbilities.tick(r,ports.setNow(r))){
   if(event.type==='prepare')ports.addLog('⚠ '+event.enemy.name+' prepares '+event.ability+'!','critical');
   else if(event.type==='interrupted')ports.addLog('✓ '+event.enemy.name+' interrupted: '+event.ability,'good');
   else if(event.type==='activate'){
    ports.phase6Metric(r,'enemyAbilityCasts',1);
    ports.addLog('✦ '+event.enemy.name+' uses '+event.ability+(event.target?' on '+event.target.name:'')+(event.result?' · '+event.result+' Barrier':''),'spell');
     if(event.target&&event.result>0)ports.combatLinkEffect?.(r,'ward',event.enemy,[event.target]);
   }else if(event.type==='summon'){
    const theme=ports.THEMES.find(t=>t.id===r.path)||ports.currentTheme();
    const spec=root.WandererV013EliteAbilities.DEFINITIONS.gravecaller;
    const ledger=r.stage83EliteSummons??={summoned:0};
    ledger.maxSummons=spec.maxSummons;
    ledger.maxLivingMinions=spec.maxLiving;
    const created=root.WandererV013BossInfrastructure?.summon(r,event.enemy,event.count,
     ()=>{const soul=root.WandererV013EliteAbilities.boundSoulArchetype(ledger.summoned);
      const summoned=ports.enemyFor(r.tier,r.enc,{theme,mob:soul,boss:false,elite:false});
      summoned.summonFamily=soul.summonFamily;summoned.summonKind=soul.summonKind;
      return summoned;},
     {family:r.planeFamily||'decay',hpFactor:spec.hpFactor,atkFactor:spec.atkFactor,defFactor:.35,intervalFactor:spec.intervalFactor});
    if(created?.spawned){
     ports.phase6Metric(r,'eliteSummons',created.spawned);
     ports.addLog('☠ '+event.enemy.name+' summons '+created.spawned+' bound souls · Deathbound Ritual active!','critical');
     ports.combatLinkEffect?.(r,'rot',event.enemy,['hero']);
     ports.renderCombat();
    }else ports.addLog('☠ '+event.enemy.name+' cannot summon more bound souls.','critical');
   }
  }
 }
 if(root.WandererV013BossInfrastructure&&r.phase1){
  const baseEvents=root.WandererV013BossInfrastructure.tick(r,ports.setNow(r));
  const events=root.WandererV013BossAbilities?.tick(r,ports.setNow(r),baseEvents)||baseEvents;
  for(const event of events){
   if(event.type==='prepare')ports.addLog('⚠ '+event.enemy.name+' prepares '+event.ability+'!','critical');
   else if(event.type==='interrupted'||event.type==='disarmed'){ports.addLog('✓ '+event.enemy.name+' interrupted: '+event.ability,'good');ports.phase6Metric(r,'bossCastInterruptions',1);}
   else if(event.type==='ward'){ports.addLog('⛨ '+event.enemy.name+' restores '+event.barrier+' Barrier','spell');ports.phase6Metric(r,'bossWards',1);ports.combatLinkEffect?.(r,'ward',event.enemy,[event.enemy]);}
   else if(event.type==='charge')ports.addLog('♨ Furnace Strike charged · next hit empowered!','critical');
   else if(event.type==='offering'){ports.addLog('🩸 Riftbound Vessel sacrificed · Boss recovers '+event.healed+' HP','critical');ports.phase6Metric(r,'bossHealing',event.healed);ports.combatLinkEffect?.(r,'siphon',event.minion,[event.enemy]);}
   else if(event.type==='pulse'){ports.combatLinkEffect?.(r,'shock',event.enemy,['hero']);ports.addLog('⚡ Arcane Convergence · '+event.damage+' damage'+(event.absorbed?' · '+event.absorbed+' absorbed':'')+'!','critical');ports.phase6Metric(r,'bossArcanePulses',1);ports.phase6Metric(r,'damageTaken',event.damage);ports.phase6Metric(r,'absorbed',event.absorbed);if(resolveBossPulseLethal(r,s))return;}
   else if(event.type==='canceled')ports.addLog('⚡ Arcane Convergence canceled by the destroyed Convergence Anchor.','good');
   else if(event.type==='summon'){
    const theme=ports.THEMES.find(t=>t.id===r.path)||ports.currentTheme(),mob=theme?.mobs?.find(m=>m.role==='minion');
    if(!mob)throw Error('Stage 8.4 Boss summon requires a Realm Minion');
    const result=root.WandererV013BossAbilities.spawned(r,event,()=>ports.enemyFor(r.tier,r.enc,{theme,mob,boss:false,elite:false}));
    if(result.spawned){ports.phase6Metric(r,'bossSummons',result.spawned);ports.addLog('☠ '+event.enemy.name+' summons '+result.spawned+' '+(event.kind==='blood'?'Riftbound Vessel':event.kind==='node'?'Convergence Anchor':event.kind==='vitality'?'Heartroot Mawbud':'Carrion Broodling')+(result.spawned===1?'':'s')+'!','critical');ports.renderCombat();}
    else ports.addLog('☠ '+event.enemy.name+' has no reinforcement space.','critical');
   }
  }
 }
 if(globalThis.WandererV013ExpeditionConditions?.tick(r)){ports.phase6Metric(r,'conditionRiteTriggers',1);ports.addLog('Sanguine Rite · The boss grows stronger below half Health!','critical');}
 if(r.bossModifierIds?.length&&globalThis.WandererV013BossModifiers){
  const effects=globalThis.WandererV013BossModifiers.tick(r);
  if(effects.frenzy){ports.addLog('Sanguine Frenzy · Boss attacks faster!','critical');ports.phase6Metric(r,'bossFrenzyTriggers',1);}
  if(effects.pulse){ports.phase6Metric(r,'bossPulseTriggers',1);ports.phase6Metric(r,'damageTaken',effects.damage);ports.phase6Metric(r,'absorbed',effects.absorbed);
   ports.addLog('Profane Pulse · '+effects.damage+' damage'+(effects.absorbed?' ('+effects.absorbed+' absorbed)':'')+'!','critical');
   if(resolveBossPulseLethal(r,s))return;
  }
 }
 if(s.caster&&r.mp<v013FundedCost(s.main.subtype==='Staff'?13:9))ports.phase6Metric(r,'manaStarvedSeconds',dt);
 if(r.encounterTraitId==='unhallowed_regrowth'&&globalThis.WandererV013EncounterTraits){
  const healed=globalThis.WandererV013EncounterTraits.regenTick(r);
  if(healed>0){ports.phase6Metric(r,'traitRegrowthHealing',healed);ports.addLog('Unhallowed Regrowth restores '+healed+' enemy HP.','critical');}
 }
 if(!ports.isPhase1Run()&&ports.state.onlineProgress?.timerMetric==='combat-v1'&&r.combatSeconds-(r.lastCombatCheckpoint||0)>=3){r.lastCombatCheckpoint=r.combatSeconds;ports.save();}
 ports.setCombatExpire(r,dt);ports.legendaryTick(r,dt);
 // v0.13 keeps actors in their arena slots. Only their independent attack
 // clocks advance; enemy role affects attacks, never position or sprite scale.
 if(r.enemies)for(const mob of r.enemies)if(mob.hp>0&&!mob.stage84Node)mob.groupClock+=(mob.stunnedUntil>ports.setNow(r)?0:dt);
 if(r.enemies)r.tEnemy=e.groupClock;else r.tEnemy+=(e.stunnedUntil>ports.setNow(r)?0:dt);r.tDot+=dt;
 // Align Elite contact frames with the original hit tick at normal playback speed.
 const windupSlowed=enemySlowFactor(e,s,ports.setNow(r));
 const impactLead=({berserker:.49,tank:.81,caster:.89,vampire:.67}[e.eliteType]??(e.boss?{guardian:.85,leech:.86,berserker:.71}[e.bossStyle]:null)??.66);
 if(r.enemies){for(const mob of r.enemies){if(mob.hp<=0||mobWindups.has(mob))continue;const slow=enemySlowFactor(mob,s,ports.setNow(r)),lead=({berserker:.49,tank:.81,caster:.89,vampire:.67}[mob.eliteType]??.66);if(mob.groupClock>=Math.max(0,mob.attackEvery*slow-lead)){mobWindups.add(mob);r.enemy=mob;ports.animateEnemyWindup?.();}}r.enemy=e;}else if(!mobWindups.has(e)&&r.tEnemy>=Math.max(0,e.attackEvery*windupSlowed-impactLead)){mobWindups.add(e);ports.animateEnemyWindup?.();}
 if(s.caster||r.phase1Magic||s.phase2Decay)r.mp=Math.min(r.maxmp,r.mp+dt*s.manaRegen);
 advanceAcceleratedBleed(r,dt);
 if(e.hp<=0||hasUnsettledGroupDeaths(r)){ports.winEncounter(true);return;}
 if(ports.isPhase1Run())ports.phase2MagicTick(r);
 if(r.hp<=0)return;
 if(e.hp<=0||hasUnsettledGroupDeaths(r)){ports.winEncounter(true);return;}
 const lt=ports.legendaryRuntime(r),haste=(ports.isPhase1Run()&&ports.phase1Build?WandererV012Buildcraft.speed(ports.phase1Build,ports.phase1Clock+r.combatSeconds):1)*(s.bonus.bleedHaste?1+Math.min(3,t.haste.length)*.05:1)*(1+((lt.natureHasteUntil||0)>ports.setNow(r)?.10:0)+((lt.thunderHasteUntil||0)>ports.setNow(r)?.12:0))*(root.WandererV013ExpeditionBoons?.speedFactor(r)||1);
 if(advancePlayerAttackClock(r,dt,s.attacksPerSec*haste)){r.autoUses=(r.autoUses||0)+1;ports.weaponAttack(r);if(r.hp<=0)return;if(e.hp<=0||hasUnsettledGroupDeaths(r)){ports.winEncounter(true);return;}}
 if(r.bastionUntil&&ports.setNow(r)>=r.bastionUntil){r.barrier=Math.max(0,r.barrier-Math.max(0,r.bastionSize-(r.bastionAbsorbed||0)));ports.setHeal(r,Math.min(r.bastionSize,r.bastionAbsorbed||0)*.5,true);r.bastionUntil=0;}
 if(r.tDot>=1){if(r.pulses>0){r.pulses--;ports.setHeal(r,r.maxhp*.01*learned('second_pulse'));}

  r.tDot-=1;
  const hasBleed=ordinaryBleed(e),hasBurn=e.burnStacks>0,hasDots=hasBleed||hasBurn;
  if(hasDots){if(hasBleed)e.lastBleedTick=ports.setNow(r);const applied=Math.round(ports.tickDots(e)*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));if(hasBleed&&applied>=e.hp)e.v012DeathBleed=true;ports.phase6Metric(r,'damageDealt',Math.min(Math.max(0,e.hp),applied));ports.phase6Metric(r,'periodicDamage',Math.min(Math.max(0,e.hp),applied));e.hp-=applied;ports.addLog('☠️ Damage over time: '+applied+' damage','spell');if(applied>0)ports.floatText(applied,'enemy',false,hasBleed&&hasBurn?'BLEED + BURN':hasBleed?'BLEED':'BURN',e);}
  if(hasBurn)ports.setHeatTick(r,true);
  if(r.enemies){for(const mob of r.enemies){if(mob===e||mob.hp<=0)continue;const bleeding=ordinaryBleed(mob),burning=mob.burnStacks>0;if(bleeding||burning){if(bleeding)mob.lastBleedTick=ports.setNow(r);const spreadBase=[...(mob.dots?.burn||[]),...(mob.dots?.bleed||[])].filter(dot=>dot.spread||dot.secondaryOrigin).reduce((sum,dot)=>sum+dot.damage,0);const rawDots=ports.tickDots(mob);const damage=Math.round(rawDots*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));if(bleeding&&damage>=mob.hp)mob.v012DeathBleed=true;const applied=Math.min(Math.max(0,mob.hp),damage);ports.phase6Metric(r,'damageDealt',applied);ports.phase6Metric(r,'periodicDamage',applied);if(spreadBase>0&&rawDots>0&&applied>0){const contribution=Math.min(applied,Math.round(applied*spreadBase/rawDots));ports.phase6Metric(r,'secondaryTargetDamage',contribution);ports.phase6Metric(r,'secondaryDotDamage',contribution);ports.phase6Metric(r,'secondaryTargetHits',Number(contribution>0));}mob.hp-=damage;if(damage>0)ports.floatText(damage,'enemy',false,bleeding?'BLEED':'BURN',mob);}if(mob.hp>0&&ports.phase1Build){r.enemy=mob;WandererV012Buildcraft.tickRot(ports.phase1Build,ports.phase2Context(r));}if(mob.slowTime>0)mob.slowTime=Math.max(0,mob.slowTime-1);}r.enemy=e;}
  if(s.bonus.regenBonus){const healed=ports.setHeal(r,ports.regenPerSecond(r.maxhp,s.bonus.regenBonus));if(healed>0)ports.addLog('💚 Regeneration +'+Math.round(healed)+' HP','good');}
  if(ports.isPhase1Run()&&ports.phase1Build)WandererV012Buildcraft.onSecond(ports.phase1Build,ports.phase2Context(r));
  if(e.slowTime>0)e.slowTime=Math.max(0,e.slowTime-1);
  if(e.hp<=0||hasUnsettledGroupDeaths(r)){ports.winEncounter();return;}
 }
 const target=e,attacker=r.enemies?.find(mob=>mob.hp>0&&!mob.stage84Node&&!(mob.stunnedUntil>ports.setNow(r))&&mob.groupClock>=mob.attackEvery*enemySlowFactor(mob,s,ports.setNow(r)));
 if(attacker){e=attacker;r.enemy=e;r.tEnemy=e.groupClock;}
 const slowed=enemySlowFactor(e,s,ports.setNow(r));
 if(!(e.stunnedUntil>ports.setNow(r))&&(!r.enemies||attacker)&&r.tEnemy>=e.attackEvery*slowed){
  r.tEnemy=0;if(r.enemies)e.groupClock=0;mobWindups.delete(e);
  let enemyAbilityVfx=null;
  const stage81=root.WandererV013EnemyAbilities;
  const stage81Strike=stage81?.consumeStrike(e,r.combatSeconds)||null;
  const stage82Strike=root.WandererV013EliteAbilities?.consumeStrike(e,r.combatSeconds)||null;
   const stage84Strike=root.WandererV013BossAbilities?.chargedStrike(e,r.combatSeconds)||null;
  const stage81Pack=stage81?.packFactor(r,e)||1;
  let raw=Math.max(Math.ceil(e.atk*.24),Math.round(e.atk*(1-Math.min(.75,s.defense/(s.defense+e.atk*1.35)))));
  if(stage81Strike||stage81Pack!==1)raw=Math.max(1,Math.round(raw*(1+(stage81Strike?.bonus||0))*stage81Pack));
  const armorPrevented=Math.max(0,e.atk-raw);
  if(!statOnly()&&e.effect==='burn')raw+=WandererV012CombatCore.enemyStat(r.tier,Math.round(WandererV012CombatCore.referenceLevel(r.tier)*.3));
  if(!statOnly()&&e.effect==='sunder')raw+=WandererV012CombatCore.enemyStat(r.tier,Math.round(WandererV012CombatCore.referenceLevel(r.tier)*.2));
  if(!statOnly()&&e.bossStyle==='berserker'&&e.hp<e.maxhp*.5){
   raw=Math.round(raw*1.35);
   if(!e.enraged){e.enraged=true;ports.addLog('🔥 Ember Sovereign enrages below half HP!','critical');enemyAbilityVfx='BossEmber';}
  }
  if(!statOnly()&&e.eliteType==='berserker'&&e.hp<e.maxhp*.5)raw=Math.round(raw*1.08);
  const weaker=ports.setEnemyWeaken(r);
  if(weaker)raw=Math.max(1,Math.round(raw*(1-weaker)));
  // Elite Berserker cannot one-shot a full-health player with one direct hit.
  // Cap before Block/Barrier so defensive investment still matters.
  if(!statOnly()&&e.eliteType==='berserker')raw=Math.min(raw,Math.max(1,Math.floor(r.maxhp*.35)));
  if(stage82Strike)raw=cappedStrikeDamage(raw,stage82Strike,r.maxhp);
   if(stage84Strike)raw=cappedStrikeDamage(raw,stage84Strike,r.maxhp);
   raw=Math.max(0,Math.round(raw*(root.WandererV013BossAbilities?.incomingFactor(r,e,r.combatSeconds)||1)));
  if(e.vanguard){e.vanguard=false;ports.addLog(e.name+' delivers its opening strike.','critical');}
  const special=e.miniboss||e.boss;
  if(special)raw=Math.round(raw*(1-.04*learned('brace')));
  const attackType=ports.enemyAttackType(e);
  if(attackType==='physical'&&s.main?.subtype==='Sword'&&ports.gameRandom()<.18){
   if(special&&prepared('turn_tide'))r.riposteUntil=ports.setNow(r)+3;r.lastImpact={parry:true,source:e.name,at:r.combatSeconds};ports.floatText('PARRY','hero');ports.phase6Metric(r,'parries',1);
  }else if(ports.tryDodge(r,attackType)){
  r.lastImpact={source:e.name,at:r.combatSeconds,dodge:true};
   ports.phase6Metric(r,'dodges',1);
   ports.animateEnemyStrike(enemyAbilityVfx);
  }
  else{
  const mitigation=Math.max(lt.guard||0,lt.weaken||0);lt.guard=0;lt.weaken=0;
  if(mitigation)raw=Math.max(1,Math.round(raw*(1-mitigation)));
  if(ports.isPhase1Run()&&ports.phase1Build)raw=WandererV012Buildcraft.incoming(ports.phase1Build,ports.phase2Context(r),raw);if(r.phase1&&ports.phase6Run?.effects.curse?.remaining>0)raw=Math.round(raw*1.10);
  raw=Math.max(0,Math.round(raw*(root.WandererV013ExpeditionBoons?.takenFactor(r)||1)));
  let damageBlocked=0;
  const barrierGuard=ports.isPhase1Run()&&ports.phase1Build?.runtime?.specializations?.includes('steadfast_guard')&&r.barrier>0;
  const blockChance=barrierGuard?Math.min(65,(s.blockChance||0)+15):(s.blockChance||0);
  const block=blockChance&&ports.gameRandom()<blockChance/100;
  if(block){
   damageBlocked=Math.max(1,Math.round(raw*(barrierGuard?(s.blockReduction||.35):s.blockReduction)));raw-=damageBlocked;
   ports.addLog('🛡 BLOCK! Prevented '+damageBlocked+' damage','good');ports.animateDefense();
   if(s.bonus.shieldRiposte&&ports.setNow(r)>=t.shieldCounterUntil&&ports.setReady(r,'shieldRiposte',3)){t.shieldCounter=damageBlocked*.25;t.shieldCounterUntil=ports.setNow(r)+4;}
   if(s.off?.subtype==='Shield'&&ports.legendaryHas('oathwall')&&ports.legendaryProc(r,'oathwall')){const baseFactor=s.main?.subtype==='Mace'?1.4:1;const base=Math.max(1,Math.round(s.attack*baseFactor-WandererV012Buildcraft.enemyDefense(ports.phase1Build,e)));ports.setDirectEnemyDamage(r,base*(ports.legendaryEmpowered(r,'oathwall')?1.10:.75),'🛡 Oathwall Counterattack');if(e.hp<=0){ports.winEncounter();return;}}
   if(s.off?.subtype==='Shield'&&s.main?.subtype==='Sword'&&!ports.legendaryHas('oathwall')&&ports.setReady(r,'shieldBaseCounter',2.5)){
    const baseFactor=s.main.subtype==='Mace'?1.4:1;
    const base=Math.max(1,Math.round(s.attack*baseFactor-WandererV012Buildcraft.enemyDefense(ports.phase1Build,e)));
    ports.setDirectEnemyDamage(r,base*(s.main.subtype==='Sword'?.65:.45),'🛡 Shield Counterattack');
    if(e.hp<=0){ports.winEncounter();return;}
   }
  }
  const barrierBeforeHit=r.barrier,blocked=Math.min(r.barrier,raw);r.barrier-=blocked;
  const barrierBroken=barrierBeforeHit>0&&r.barrier<=0;let hit=Math.max(0,raw-blocked);
  if(barrierBroken&&learned('stored_impact'))r.storedImpact=Math.round(blocked*.5);
  if(special&&(blocked||damageBlocked)&&prepared('turn_tide'))r.riposteUntil=ports.setNow(r)+3;
  if(r.bastionUntil>ports.setNow(r))r.bastionAbsorbed=(r.bastionAbsorbed||0)+blocked;
  if(hit>0&&!r.wardingUsed&&signature('warding')){const saved=Math.ceil(hit*.25);hit-=saved;r.wardingUsed=true;ports.addLog('Warding prevented '+saved+' damage.','good');}
  ports.phase6Metric(r,'armor',armorPrevented);ports.phase6Metric(r,'shield',damageBlocked);ports.phase6Metric(r,'absorbed',blocked);
  r.lastImpact={source:e.name,at:r.combatSeconds,armor:armorPrevented,barrier:blocked,shield:damageBlocked,hit};
  if(blocked>0)ports.addLog('🛡 Barrier absorbs '+blocked+' damage','good');
  if(hit>0){
   ports.phase6Metric(r,'damageTaken',Math.min(Math.max(0,r.hp),hit));ports.phase3FlashPlayerDamage?.();const previousHp=r.hp;r.hp-=hit;
   
   if(r.hp>0&&previousHp>=r.maxhp*.5&&r.hp<r.maxhp*.5&&learned('second_pulse')&&!r.pulseStarted){r.pulseStarted=true;r.pulses=3;}
   if(r.hp>0&&r.deepReserve){const reserve=r.deepReserve;r.deepReserve=0;ports.setHeal(r,reserve,true);}
   ports.addLog('🩸 '+e.name+' hits for '+hit+' HP','bleed');ports.floatText(hit,'hero');
   if(r.hp>0){
    const decay=root.WandererV013EliteAbilities?.applyDeathbound(r,e,hit);
    if(decay){
     ports.phase6Metric(r,'deathboundApplications',1);
     ports.addLog('☠ Deathbound Ritual · Decay ×'+decay.stacks+' ('+Math.ceil(decay.remaining)+'s)','critical');
     ports.combatLinkEffect?.(r,'rot',e,['hero']);
    }
   }
   if(stage81Strike?.secondary){
    const effect=stage81.onHit(e,r,hit,ports.setNow(r),stage81Strike);
    if(effect>0)ports.addLog('✦ '+e.name+' · '+(stage81Strike.secondary==='siphon'?'Siphon +'+effect+' HP':stage81Strike.secondary==='mana'?'Mana −'+effect:'Healing wound'),'spell');
   }
   if(!statOnly()&&e.eliteType==='tank'){
    const newWound=(r.playerHealingDebuffUntil||0)<=ports.setNow(r);
    r.playerHealingDebuffUntil=ports.setNow(r)+5;
    if(newWound)ports.addLog('🛡️ Tank applies Healing Reduction: −40% healing for 5s!','critical');
   }
   if(!statOnly()&&e.eliteType==='vampire'){
    const multiplier=ports.isPhase1Run()&&ports.phase1Build?WandererV012Buildcraft.enemyHealMultiplier(ports.phase1Build,e):1;
    const heal=Math.floor(Math.min(Math.max(0,e.maxhp-e.hp),Math.max(1,Math.round(hit*.33)),Math.max(1,Math.round(e.maxhp*.055)))*multiplier);
    if(heal>0){e.hp+=heal;ports.addLog('🩸 Vampire drains '+heal+' HP','spell');enemyAbilityVfx='EliteVampire';}
   }
   if(!statOnly()&&e.eliteType==='caster'&&ports.setNow(r)>=(r.nextCasterHexAt||0)){
    r.playerDebuffUntil=ports.setNow(r)+3;r.nextCasterHexAt=ports.setNow(r)+7;
    ports.addLog('🔮 Caster applies Weakened: -20% direct damage for 3s!','spell');enemyAbilityVfx='EliteCaster';
   }
  }
  if(!statOnly()&&e.bossStyle==='leech'&&hit>0){const multiplier=ports.isPhase1Run()&&ports.phase1Build?WandererV012Buildcraft.enemyHealMultiplier(ports.phase1Build,e):1;const heal=Math.floor(Math.min(e.maxhp-e.hp,Math.round(hit*.18))*multiplier);e.hp+=heal;if(heal){ports.addLog('🌑 Rift Harbinger drains '+heal+' HP','spell');enemyAbilityVfx='BossRift';}}
  // Guardian Barrier is restored only by the Stage 8.4 timed Ward Cycle.
  ports.legendaryDefensiveEffects(r,damageBlocked,hit,blocked,barrierBeforeHit>0&&r.barrier<=0);
  if(ports.isPhase1Run()&&ports.phase1Build)WandererV012Buildcraft.onDefend(ports.phase1Build,{...ports.phase2Context(r),barrierBroken},damageBlocked,blocked);
  if(s.bonus.lastBastion&&r.barrier>=r.maxhp*.1&&ports.setReady(r,'lastBastion',12))t.lastBastionReady=true;
  if(r.hp>0&&s.bonus.natureRenewal&&!t.natureRenewalUsed&&r.hp<=r.maxhp*.35){t.natureRenewalUsed=true;const gained=ports.setHeal(r,r.maxhp*.08);ports.addLog('🌿 Verdant Renewal: +'+Math.round(gained)+' HP','good');}
  if(r.hp>0&&s.bonus.tideSurge&&!t.tideSurgeUsed&&r.barrier<r.maxhp*.05){t.tideSurgeUsed=true;const gained=ports.setBarrier(r,r.maxhp*.08);ports.addLog('🌊 High Tide: +'+Math.round(gained)+' Barrier','good');}
  ports.animateEnemyStrike(enemyAbilityVfx);
  }
 }
 if(r.enemies){r.enemy=target;e=target;}
 if(resolveBossPulseLethal(r,s))return;
 if(e.hp<=0){ports.winEncounter();return;}
 ports.updateBars();
}

function phase2Context(r){
 const e=r.enemy,now=ports.setNow(r);
 return {player:r,enemy:e,traits:v013Traits(),now,random:ports.gameRandom,base:r.lastBaseHit||r.stats.attack,power:r.stats.spellPower||0,healTriggersPassives:true,healingMultiplier:(r.playerHealingDebuffUntil||0)>now?.6:1,waveKey:r.phase1Plane+':'+r.enc,
 spendMana(amount){const cost=Math.max(0,Math.ceil(amount*(root.WandererV013ExpeditionBoons?.costFactor(r)||1)));if(r.mp<cost)return false;r.mp-=cost;ports.phase6Metric(r,'manaSpent',cost);if(cost>0)offhandPaidAction(r);return true;},
 dot(kind,potency,options={}){
  if(!['bleed','burn'].includes(kind))return;
  ports.phase6Proc(r,kind+' application');const values=e.dots[kind]||(e.dots[kind]=[]);
  if(values.length>=12)values.shift();const raw=Math.max(1,Math.round(kind==='bleed'?WandererV012Buildcraft.bleedDamage(ports.phase1Build,potency):potency*(ports.state.automaticTalents?.nodes?.includes('fire_focus')?1.35:1)));
  const controlled=kind==='burn'&&options.controlledBurn===true;
  values.push({damage:controlled?Math.max(1,Math.round(raw*1.25)):raw,remaining:3,...(controlled?{controlledBase:raw}:{})});
  if(controlled)ports.phase6Metric(r,'controlled_burnApplications',1);ports.synchronizeDots(e);
 },
 dotDamage(amount,label,secondaryFraction=0){const n=Math.max(0,Math.round(amount*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1)));if(n){const applied=Math.min(Math.max(0,e.hp),n);ports.phase6Metric(r,'damageDealt',applied);ports.phase6Metric(r,'periodicDamage',applied);if(secondaryFraction>0&&applied>0){const attributed=Math.min(applied,Math.round(applied*Math.min(1,secondaryFraction)));if(attributed>0){ports.phase6Metric(r,'secondaryTargetDamage',attributed);ports.phase6Metric(r,'secondaryDotDamage',attributed);ports.phase6Metric(r,'secondaryTargetHits',1);}}e.hp-=n;ports.addLog(label+' '+n+' damage','spell');ports.floatText(n,'enemy',false,'ROT',e);}},
 damage(amount,label){return ports.setDirectEnemyDamage(r,amount,label);},
 areaDamage(amount,label){ports.setDirectEnemyDamage(r,amount,label);groupSecondaryDamage(r,amount,Array(Math.max(0,(r.enemies?.length||1)-1)).fill(1),label);},
 talentPulseDamage(enemy,amount,id){return talentPulseDamage(r,enemy,amount,id);},
 metric(key,n){ports.phase6Metric(r,key,n);},
 link(kind,source,targets){ports.combatLinkEffect?.(r,kind,source,targets);},
 secondaryHit(enemy,amount){return r.enemies?.includes(enemy)?v013SecondaryHit(r,enemy,amount):0;},
 synchronizeDots(enemy){ports.synchronizeDots(enemy);},
 trigger(id){triggered(r,id);},
 heal(amount){return ports.setHeal(r,amount);},
 barrier(amount){return ports.setBarrier(r,amount);},
 mana(amount){r.mp=Math.min(r.maxmp,r.mp+Math.max(0,amount));},
 chill(duration){e.slowTime=Math.max(e.slowTime,e.boss?Math.min(1.2,duration):duration);},
 log(msg){ports.addLog(msg,'spell');}
 };
}

function phase2Stats(){
 const base=ports.totalStats(),g=ports.phase1Controller?.state;
 return g?.dungeon?.realm&&['choice','combat'].includes(g.stage)?root.WandererV013ExpeditionBoons?.stats(base,g.dungeon.foundationState?.boonIds||[])||base:base;
}

function phase2WeaponAttack(r,base,critical,cast,suppressDoubleStrike=false){
 if(!ports.isPhase1Run()||!ports.phase1Build)return;
 const ctx=ports.phase2Context(r);ctx.base=base;ctx.critical=critical;ctx.magical=cast;ctx.funded=!!cast;ctx.suppressDoubleStrike=!!suppressDoubleStrike;
 WandererV012Buildcraft.onAttack(ports.phase1Build,ctx);
 if(cast&&ports.phase1Build.element&&WandererV012Buildcraft.magicMode(ports.phase1Build)!=='unattuned'){
  ctx.power=r.stats.spellPower;ctx.amp=r.stats.main?.subtype==='Staff'?1.25:r.stats.main?.subtype==='Wand'?1.12:1;
  WandererV012Buildcraft.onCast(ports.phase1Build,ctx);groupElementalEffects(r,ports.phase1Build);
 }
}

function phase2MagicTick(r){
 if(!ports.isPhase1Run()||r.status!=='fight')return;
 const b=ports.phase1Build,mode=WandererV012Buildcraft.magicMode(b);
 if(!mode)return;
 const ctx=ports.phase2Context(r);
 if(b.runtime.infusionEncounter!==ctx.waveKey){
  b.runtime.infusionEncounter=ctx.waveKey;b.runtime.infusionCharges=0;
  b.runtime.infusionExpiresAt=0;b.runtime.infusionNextAt=-1;b.runtime.magicInfusionHits=0;
 }
 // Arcane Infusion stays available to every Magic element. It competes
 // for the same Mana pool as weapon casts and elemental offhand spells.
 if(WandererV012Buildcraft.infusionReady(b,ctx.now)){
  const config=WandererV012Buildcraft.infusionConfig(b,r.stats.main?.subtype);
  const cost=v013FundedCost(WandererV012Buildcraft.nextCost(b,config.cost));
  if(r.mp>=cost){
   r.mp-=cost;ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'infusionActivations',1);
   offhandPaidAction(r);
   WandererV012Buildcraft.activateInfusion(b,ctx.now);
   ctx.funded=true;ctx.magicalAction='infusion';ctx.power=r.stats.spellPower||0;
   WandererV012Buildcraft.onInfusionActivation(b,ctx);
   return;
  }
 }
 // Insufficient Mana for Infusion must not block a cheaper elemental cast.
 // Only attuned Fire/Frost/Lightning cast extra spells with physical weapons.
 if(mode==='unattuned'||mode==='arcane'||r.stats.caster||!WandererV012Buildcraft.canCast(b))return;
 if(ctx.now-b.runtime.lastSpellAt<2.5)return;
 const cost=v013FundedCost(WandererV012Buildcraft.nextCost(b,8));if(r.mp<cost)return;
 b.runtime.lastSpellAt=ctx.now;ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;offhandPaidAction(r);ctx.power=r.stats.spellPower;ctx.amp=1;ctx.funded=true;
 ports.combatEffect('Wand',({fire:'burn',frost:'slow',lightning:'shock'})[b.element]);
 if(v013Traits().includes('ward')&&ports.setReady(r,'v013Ward',6))ports.setBarrier(r,r.maxhp*.02);
 let spellDamage=Math.max(1,Math.round(WandererV012Buildcraft.elementalPower(b,ctx.power)*.70*v013SpellMultiplier(r)));if(v013Traits().includes('focused')&&!r.groupReserve?.length&&(!r.enemies||r.enemies.filter(enemy=>enemy.hp>0).length===1))spellDamage=Math.max(1,Math.round(spellDamage*1.1));
 if(r.lifeCharge&&prepared('lifeweaver')){r.lifeCharge=false;if(r.hp<r.maxhp*.5)ports.setHeal(r,r.maxhp*.08,true);else spellDamage=Math.round(spellDamage*1.3);triggered(r,'lifeweaver');}
 if(learned('spell_echo')){r.echoCount=((r.echoCount||0)+1)%3;if(!r.echoCount)spellDamage+=Math.max(1,Math.round(spellDamage*.1*learned('spell_echo')));}
 const chainBase=spellDamage;
 if(r.enemy.baseDef>0&&r.enemy.def<r.enemy.baseDef)spellDamage=Math.max(1,Math.round(spellDamage*(1+(b.runtime.talentBonuses?.sunderDamage||0))));
 const hpBefore=r.enemy.hp;
 ports.setDirectEnemyDamage(r,spellDamage,'✨ '+b.element);
 if(r.enemy.hp<hpBefore)offhandOrbWard(r);
 if(reflectThornbloom(r,r.enemy,Math.min(hpBefore,hpBefore-r.enemy.hp)))return;
 WandererV012Buildcraft.onCast(b,ctx);groupElementalEffects(r,b);
 if(v013LightningChain(r))v013LightningChainDamage(r,chainBase);
}

function phase6Metric(r,key,n){if(!r?.phase1||!Number.isFinite(n)||n<0)return;r.metrics??={};r.metrics[key]=(r.metrics[key]||0)+n;}

function phase6Proc(r,label){if(!r?.phase1)return;r.metrics??={};r.metrics.procs??={};r.metrics.procs[label]=(r.metrics.procs[label]||0)+1;}

function phase6CollectMetrics(r){if(!ports.phase6Run||r.metricsCommitted)return;r.metricsCommitted=true;ports.phase6Run.metrics??={};for(const [k,v]of Object.entries(r.metrics||{})){if(k==='procs'){ports.phase6Run.metrics.procs??={};for(const [label,n]of Object.entries(v))ports.phase6Run.metrics.procs[label]=(ports.phase6Run.metrics.procs[label]||0)+n;}else ports.phase6Run.metrics[k]=(ports.phase6Run.metrics[k]||0)+v;}}

function phase6Stats(stats){return ports.phase6Run?WandererV012CombatCore.applyExpeditionModifiers(stats,ports.phase6Run.effects):stats;}

function winEncounter(){ports.phase1WaveWon();}

function die(){ports.phase1Death();}
return {addLog,bossForTier,eliteArchetype,rollEliteArchetype,tryDodge,enemyFor,synchronizeDots,tickDots,advanceAcceleratedBleed,focusedWeaponDamage,enemySlowFactor,talentPulseDamage,controlledSpreadBase,v013LightningChainDamage,groupElementalEffects,setRuntime,setNow,advancePlayerAttackClock,activeLegendarySignatures,legendaryRuntime,legendaryHas,legendaryReady,legendaryEmpowered,legendaryProc,legendaryOnHit,legendaryExtend,legendaryAttackBonus,legendaryDefensiveEffects,legendaryRealmStart,legendaryTick,setReady,setBarrier,regenPerSecond,setHeal,setDelayEnemy,setDirectEnemyDamage,setOnAttack,setCombatExpire,setEnemyWeaken,setHeatTick,setSoulHeal,applyAffinity,weaponAttack,updateFight,phase2Context,phase2Stats,phase2WeaponAttack,phase2MagicTick,phase6Metric,phase6Proc,phase6CollectMetrics,phase6Stats,winEncounter,die};
}
root.WandererV012CombatRuntime=Object.freeze({create});
})(globalThis);
