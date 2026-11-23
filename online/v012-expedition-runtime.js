// v0.12 expedition runtime. Canonical state transitions; UI effects are injected.
(function(root){'use strict';
function create(ports){
function phase1Init(){
 ports.phase1Continuity=null;ports.phase3LootIds=new Set();ports.phase3PotionCooldowns={health:0,mana:0};
 ports.prepareInterface();
 ports.fresh();
 ports.state.expeditionOverflow=[];
 ports.state.equip.weapon=ports.state.stash.shift();
 ports.state.equip.armor=ports.makeItem(1,'armor',null,'starter','Armor','Common');
 ports.state.equip.helm=ports.makeItem(1,'helm',null,'starter','Helm','Common');
 ports.state.crafting=WandererV013Crafting.create();ports.state.automaticTalents=WandererAutomaticTalents.create();
 ports.phase1Controller=WandererV012Expedition.create(ports.THEMES,ports.gameRandom);
 ports.view='phase1';
 ports.phase5Init();
}

function phase1Begin(level=1){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(!ports.PHASE1_PREVIEW)return;
 if(ports.phase3NeedsBagResolution()){ports.bannerMessage('Discard overflow loot before starting another Expedition.');return false;}
 ports.phase4ClaimOverflow();
 if(ports.state.pendingRuneReward){ports.showPendingRuneReward();return;}
 if(ports.state.expeditionOverflow.length||!ports.stashHasRoom()){ports.bannerMessage('Claim secured loot and free Stash space before starting another Expedition.');return;}
 if(!['camp','finished','failed'].includes(ports.phase1Controller.state.stage)||!Number.isInteger(level)||level<1||level>ports.phase1Controller.state.unlocked)return false;
 // Once Realm Cards have been offered at an Expedition level, Camp navigation
 // must not become a free reroll. Retain the original entry RNG seed until a
 // room is actually entered, including across save/reload and level switching.
 ports.state.realmOfferSeeds??={};
 const offerKey=String(level),previousSeed=ports.state.realmOfferSeeds[offerKey];
 const offerSeed=Number.isSafeInteger(previousSeed)&&previousSeed>=0&&previousSeed<=0xffffffff?
  previousSeed:Math.floor(Math.random()*4294967296)>>>0;
 ports.state.realmOfferSeeds[offerKey]=offerSeed;
 ports.phase4Seed=offerSeed;ports.phase4Prefix=Date.now().toString(36);ports.phase4Stamp=null;ports.phase4Home=ports.phase4Clone(ports.state.equip);ports.phase4Entry=null;ports.phase4Resume=false;ports.phase4WaveKeys=[];
 ports.phase5Results={version:1,complete:true,review:null,realm:null,summary:null,earned:[],gold:0,fragments:0,craftingStart:ports.phase4Clone(ports.state.crafting||WandererV013Crafting.create())};
 ports.phase1Controller.start(level,{dungeon:true});root.WandererV013MapFog?.reset();ports.phase6Run={version:1,event:null,events:[],effects:{},combats:0};ports.phase3LootIds=new Set();ports.phase3PotionCooldowns={health:0,mana:0};ports.phase1Vitals=null;ports.phase1Clock=0;ports.phase1Continuity=null;ports.phase3Supplies={health:0,mana:0};ports.phase1Build=WandererV012Buildcraft.create();WandererV012Buildcraft.syncPermanent(ports.phase1Build,ports.state.automaticTalents,true);ports.phase1Build.runtime.hybridRules=true;ports.state.run=null;ports.view='phase1';
 if(ports.PHASE1_PREVIEW){ports.phase5Snapshot.expedition.attempts++;ports.phase5Snapshot.expedition.awardKeys=[];ports.phase5Snapshot.expedition.lastOutcome='active';ports.phase5Persist();}
 ports.render();
}

function phase2Theme(id){if(id==='bloodscar')return ports.THEMES.find(t=>t.id==='bloodscar')||{...ports.THEMES.find(t=>t.id==='forge'),id,name:'Bloodscar Wastes'};return ports.THEMES.find(t=>t.id===id);}

function phase6AwardGear(guaranteed=null){
 const g=ports.phase1Controller.state,t=ports.phase2Theme(g.selected?.id||ports.state.run?.path),pick=guaranteed||ports.dungeonEquipmentPick(t,[]),item=ports.makeItem(g.expedition,pick.slot,null,'loot',pick.subtype,guaranteed?'Rare':undefined);
 (ports.stashHasRoom()?ports.state.stash:ports.state.expeditionOverflow).push(item);ports.phase3LootIds.add(item.id);ports.phase5Results.earned.push(ports.phase5Item(item));return item;
}

function phase6Buff(key,power,remaining=3){ports.phase6Run.effects[key]={power,remaining};}

function phase6OpenEvent(plane){
 if(!ports.phase6Run.event)ports.phase6Run.event={id:plane.event,roll:0,alternative:null};
 if(!ports.phase4Entry){ports.phase4Stamp=Date.now();ports.phase4Entry={profile:ports.phase4Clone({...ports.state,run:null}),session:ports.phase4Session(true),ledger:[...(ports.phase5Snapshot?.expedition.awardKeys||[])]};}
 if(ports.phase5Persist()){ports.view='phase1';ports.render();}
}

function phase6EventChoice(choice,itemId,passiveId,family,targetId){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||!ports.phase6Run?.event||ports.phase4Resume||ports.state.run||![0,1,2].includes(choice))return false;
 const g=ports.phase1Controller.state,p=g.selected,ev=ports.phase6Run.event;if(g.stage!=='combat'||!p?.event||ev.id!==p.event||ports.phase6Run.events.includes(g.planeIndex))return false;
 const v=ports.phase3Vitals(),E=g.expedition,beforeGold=ports.state.gold,beforeFragments=ports.state.fragments,loot=[],costGold=25+3*E;
 const item=ports.phase3BagItems().find(i=>i.id===itemId),effects=ports.phase6Run.effects;
 const pay=(field,n)=>{if(ports.state[field]<n)return false;ports.state[field]-=n;return true;};
 const heal=(hp=0,mp=0)=>{ports.phase1Vitals={maxhp:v.maxhp,hp:Math.min(v.maxhp,v.hp+Math.ceil(v.maxhp*hp)),mp:Math.min(v.maxmp,v.mp+Math.ceil(v.maxmp*mp)),maxmp:v.maxmp};};
 const sacrifice=()=>{ports.state.stash=ports.state.stash.filter(i=>i.id!==itemId);ports.state.expeditionOverflow=ports.state.expeditionOverflow.filter(i=>i.id!==itemId);ports.state.valuables=(ports.state.valuables||[]).filter(i=>i.id!==itemId);ports.phase3LootIds.delete(itemId);};
 if(choice!==2){switch(ev.id){
 case 'traveling_merchant':if(choice===0){if(v.hp>=v.maxhp||!pay('gold',costGold))return false;heal(.35);}else ports.state.fragments+=5+E;break;
 case 'relic_collector':if(!item){ports.state[choice===0?'gold':'fragments']+=choice===0?5+E:3+E;break;}sacrifice();ports.state[choice===0?'gold':'fragments']+=choice===0?12+2*item.tier:5+item.tier;break;
 case 'cursed_altar':if(v.hp<=Math.ceil(v.maxhp*.2))return false;heal();ports.phase1Vitals.hp-=Math.ceil(v.maxhp*.2);effects[choice===0?'attack':'defense']=.10;break;
 case 'whispering_idol':ports.phase6Buff('curse',.10);ports.state[choice===0?'gold':'fragments']+=choice===0?25+4*E:12+2*E;break;
 case 'forgotten_arsenal':if(choice===0){ports.state.crafting.essence+=6;}else if(g.dungeon){const c=ports.phase1Controller.realmMap();g.dungeon.steps=Math.min(c.stepLimit+(g.dungeon.foundationState?.boonIds?.includes('wayfarers_bargain')?1:0),g.dungeon.steps+2);}else ports.state.fragments+=8+2*E;break;
 case 'forgotten_reliquary':{
  if(!g.dungeon)return false;
  if(choice===0){const cost=Math.ceil(v.maxhp*.15);if(v.hp<=cost||!globalThis.WandererV013BossPreparation?.reliquaryCanDisrupt(g))return false;
   const disabled=globalThis.WandererV013BossPreparation.disrupt(g);if(!disabled)return false;
   heal();ports.phase1Vitals.hp-=cost;
  }else if(choice===1){heal(.15,.25);}break;
 }
 case 'bounty_writ':if(choice===0){if(!g.dungeon)return false;if(!g.dungeon.cleared.includes(ports.phase1Controller.realmMap().objective))effects.bounty=true;else ports.state.fragments+=5+E;}break;
 case 'restless_spring':if(choice===0){if(v.hp>=v.maxhp)return false;heal(.35);}else if(v.maxmp===0||v.mp>=v.maxmp)ports.state.fragments+=3+E;else heal(0,.4);break;
 case 'oracle_of_paths':if(choice===0){if(!g.dungeon)return false;ports.phase1Controller.scoutRooms(2);globalThis.WandererV013BossPreparation?.revealBoss(g);}else ports.state.fragments+=5+E;break;
 default:return false;
 }}
 ports.phase6Run.events.push(g.planeIndex);ports.phase6Run.event=null;ports.phase4CommitRealm({awardXp:choice!==2});ports.phase1Controller.waveWon();
 ports.phase5Results.gold+=Math.max(0,ports.state.gold-beforeGold);ports.phase5Results.fragments+=Math.max(0,ports.state.fragments-beforeFragments);
 const eventText=choice===2?'Event passed.':ev.id==='forgotten_reliquary'?(choice===0?'Forgotten Reliquary: disabled the known boss property at a cost of 15% maximum HP.':'Forgotten Reliquary: recovered Health and Mana.'):ev.id==='forgotten_arsenal'?(choice===0?'Recovered 6 Essence.':'Took provisions to restore up to 2 steps.'):WandererV012IntegratedEvents.get(ev.id)[3][choice].replace(/(\d+) \+ (\d+)×E/g,(_,a,b)=>String(+a+ +b*E)).replace(/(\d+) \+ E/g,(_,a)=>String(+a+E));
 ports.phase5RememberRealm({tier:E,phase1Plane:g.planeIndex-1,planeName:p.name,planeFamily:p.family,combatSeconds:0,gold:Math.max(0,ports.state.gold-beforeGold),fragments:Math.max(0,ports.state.fragments-beforeFragments),loot,realmLog:[{text:eventText,kind:'good'}]},'cleared');
 ports.phase5Results.review=null;ports.phase5Results.eventExitPending=true;
 ports.phase1Controller.claimReward();
 if(!ports.phase5Persist())return false;return phase5ExitResult();
}

function phase6BackToCamp(){
 const g=ports.phase1Controller.state;
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||g.planeIndex!==1||g.history.length||g.stage!=='choice'||ports.state.run||ports.phase6Run?.started)return false;
 ports.phase1Controller.abandon();if(ports.phase1Build)WandererV012Buildcraft.clear(ports.phase1Build);
 ports.phase1Build=ports.phase1Vitals=ports.phase1Continuity=null;ports.phase4Home=ports.phase4Entry=null;ports.phase4Seed=ports.phase4Prefix=null;ports.phase6Run=null;ports.phase4WaveKeys=[];
 if(ports.PHASE1_PREVIEW)ports.phase5Snapshot.expedition.lastOutcome='cancelled';ports.view='phase1';if(!ports.phase5Persist())return false;ports.render();return true;
}

function phase1Enter(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(!ports.phase1Build||ports.state.run||!ports.phase1Controller.state.dungeon)return false;
 const plane=ports.phase1Controller.enter();
 // The offer is consumed by the first actual room entry, not by viewing
 // the three cards or selecting a Realm and returning to Camp.
 if(ports.state.realmOfferSeeds)delete ports.state.realmOfferSeeds[String(ports.phase1Controller.state.expedition)];
 if(ports.phase5Persist())ports.phase2Launch(plane);
 return true;
}

function phase2Launch(plane){
 if(!ports.phase6StartPotions())return;
 if(ports.phase1Controller.state.version===2&&plane.event){ports.phase6OpenEvent(plane);return;}
 if(!ports.phase4Entry){ports.phase4Stamp=Date.now();ports.phase4Entry={profile:ports.phase4Clone({...ports.state,run:null}),session:ports.phase4Session(true),ledger:[...(ports.phase5Snapshot?.expedition.awardKeys||[])]};}
 if(!ports.phase5Persist())return;
 const stats=ports.phase2Stats();
 const hp=ports.phase1Vitals?Math.min(stats.maxhp,Math.max(1,ports.phase1Vitals.hp)):stats.maxhp;
 const mp=ports.phase1Vitals?(ports.phase1Vitals.maxmp===0&&stats.mana>0?stats.mana:Math.min(stats.mana,Math.max(0,ports.phase1Vitals.mp))):stats.mana;
 ports.state.run={phase1:true,phase1ClockBase:ports.phase1Clock,phase1Magic:!!ports.phase1Build.element,phase1Plane:ports.phase1Controller.state.planeIndex,planeWaves:plane.waves,planeName:plane.name,planeFamily:plane.family,tier:ports.phase1Controller.state.expedition,path:plane.id,enc:0,status:'ready',
 hp,maxhp:stats.maxhp,mp,maxmp:stats.mana,barrier:0,stats,enemy:null,tPlayer:0,tEnemy:0,tDot:0,
 loot:[],valuables:[],gold:0,fragments:0,eliteType:ports.rollEliteArchetype(),
 boonIds:[...(ports.phase1Controller.state.dungeon?.foundationState?.boonIds||[])],playerHealingDebuffUntil:0,combatSeconds:0,setCooldowns:{...(ports.phase1Continuity?.setCooldowns||{})},secondWindUsed:ports.phase1Continuity?.secondWindUsed||false,
 legendaryState:ports.phase1Continuity?.legendaryState||null,legendaryCastCount:ports.phase1Continuity?.legendaryCastCount||0,legendaryAttackCount:ports.phase1Continuity?.legendaryAttackCount||0};
 ports.view='combat';ports.logEntries=[];ports.addLog('Expedition '+ports.state.run.tier+' · Realm '+ports.phase1Controller.state.planeIndex+' · '+plane.name,'good');ports.phase1StartWave(true);
}

function phase1StartWave(resetScroll=false){
 const statOnly=globalThis.WandererExpeditionProgression?.CALIBRATION_STAT_ONLY===true;
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const r=ports.state.run,g=ports.phase1Controller.state;
 if(!ports.isPhase1Run()||!g.selected||r.status==='fight')return;
 r.enc=g.wave;const last=g.wave===g.selected.waves;
 // No Barrier is carried across encounters; entrance effects are new grants.
 r.barrier=0;
 if(ports.phase6Run?.effects.barrier){ports.setBarrier(r,r.maxhp*ports.phase6Run.effects.barrier);ports.phase6Run.effects.barrier=0;}
 if(ports.state.automaticTalents?.nodes?.includes('affinity_aegis'))ports.setBarrier(r,WandererV012Buildcraft.barrierAmount(r.maxhp,r.stats?.spellPower,.05,.08));
 const talentBarrier=ports.phase1Build?.runtime?.talentBonuses?.startBarrier||0;if(talentBarrier>0)ports.setBarrier(r,talentBarrier);
 ports.legendaryRealmStart(r);
 const theme=ports.phase2Theme(g.selected.id);
 const conditions=globalThis.WandererV013ExpeditionConditions,conditionCard=g.dungeon&&ports.phase1Controller.realmMap();
 const conditionMitigation=(ports.phase6Run?.effects?.purifying?.remaining||0)>0 ? .5 : 0;
 r.conditionMitigation=conditionMitigation;
 const totalCount=last&&(g.selected.boss||g.selected.elite)?1:(!statOnly&&conditions&&conditionCard?conditions.countFor(g.selected,conditionCard,g.dungeon,conditionMitigation):(g.selected.mobCount||3)),activeCount=Math.min(4,totalCount);
 const rosterSystem=globalThis.WandererV013EnemyRoster;
 const hasRoster=!!(rosterSystem&&!g.selected.boss&&!g.selected.elite&&theme?.mobs?.length);
 let roster=hasRoster?rosterSystem.plan({
  seed:g.dungeon?.foundationManifest?.seed??0,realm:theme.id,family:g.selected.family||g.bossFamily||'blood',
  node:g.selected.node??g.planeIndex,count:totalCount,catalog:theme.mobs
 }):null;
 if(roster&&theme.affinityArtPeers?.length)roster=rosterSystem.shareAffinityArt(roster,theme.affinityArtPeers,{seed:g.dungeon?.foundationManifest?.seed??0,realm:theme.id,node:g.selected.node??g.planeIndex});
 const actualBossStyle=last&&g.selected.boss&&g.version===2?WandererV012Expedition.bossForAffinity(g.selected.family)?.style:null;
 const spawn=index=>ports.enemyFor(r.tier,r.enc,{theme,mob:roster?.[index]||null,boss:last&&g.selected.boss,elite:last&&g.selected.elite&&!g.selected.boss,variant:actualBossStyle?ports.BOSS_ARCHETYPES.find(b=>b.style===actualBossStyle):null});
 const group=WandererV012CombatCore.createEnemyGroup(spawn,totalCount,{activeSlots:activeCount});
 WandererV012CombatCore.applyEncounterPressure(group,g.selected.risk||0);
 // All normal-room identity and group pressure is budgeted exactly once.
 // Risk remains a separate player-selected encounter difficulty choice.
 if(!statOnly&&!g.selected.boss&&!g.selected.elite)
  WandererV012CombatCore.applyNormalRoomBudget(group,r.tier);
 const traits=globalThis.WandererV013EncounterTraits;
 const modifiers=globalThis.WandererV013BossModifiers;
 const preparation=globalThis.WandererV013BossPreparation;
 const plannedBossIds=g.dungeon&&g.selected.boss&&modifiers?(preparation?preparation.effectiveModifiers(g):modifiers.selection(g)):[];
 // Manifest compatibility: properties planned for the legacy global boss are applied only if valid for the chosen Affinity Boss.
 const bossIds=statOnly?[]:plannedBossIds;
 if(bossIds.length&&!modifiers.check(bossIds,actualBossStyle||group[0].bossStyle,g.dungeon?.foundationState?.conditionId))throw Error('Incompatible Boss modifiers for selected Affinity');
 r.bossModifierIds=[];
 if(!statOnly&&g.selected.boss&&modifiers){if(!modifiers.activate(r,group[0],bossIds))throw Error('Boss modifiers failed to apply');
  if(preparation){const factor=preparation.bossAttackFactor(g);group[0].atk=Math.max(1,Math.round(group[0].atk*factor));r.bossPreparation={...preparation.status(g)};if(factor<1)ports.addLog('Marked Elite defeated: boss attacks weakened by 10%.','good');}
  if(bossIds.length)ports.addLog('Boss properties: '+bossIds.map(id=>modifiers.get(id).name).join(' · '),'critical');}
 const traitId=!statOnly&&g.dungeon&&!g.selected.boss&&!g.selected.elite?g.selected.traitId:null;
 if(traitId&&traits?.applyGroup(traitId,group)){r.encounterTraitId=traitId;ports.addLog('Encounter trait: '+traits.get(traitId).name,'critical');}
 else r.encounterTraitId=null;
 const hasVanguard=!statOnly&&g.selected.vanguard===true&&group.length>1;
 if(hasVanguard){const guard=group[0];guard.name+=' · Vanguard';guard.vanguard=true;guard.hp=guard.maxhp=Math.round(guard.maxhp*1.8);guard.atk=Math.ceil(guard.atk*1.2);ports.addLog(guard.name+' prepares the first strike.','critical');}
 if(last&&(g.selected.boss||g.selected.elite)){
  const baseEscorts=g.selected.escorts??(g.selected.boss?2:1);
  const escorted=g.selected.boss&&modifiers?modifiers.extraEscorts(bossIds,baseEscorts):baseEscorts;
  const escorts=g.selected.boss&&preparation?preparation.escortCount(g,escorted):escorted;
  for(let i=0;i<escorts;i++){
   const escortMob=theme.mobs?.find(m=>m.role==='skirmisher')||theme.mobs?.find(m=>m.role!=='minion');
   const guard=ports.enemyFor(r.tier,r.enc,{theme,mob:escortMob||null,boss:false,elite:false});
   guard.groupSlot=i+1;guard.groupClock=-(i+1)*.6;group.push(guard);
  }
 }
 if(!statOnly&&conditions&&conditionCard){const applied=conditions.applyEncounter(r,group,g.selected,conditionCard,g.dungeon);if(applied&&(r.conditionMarked||g.selected.boss))ports.addLog('Expedition Condition: '+applied.name,'critical');}
 // Stage 8.1 abilities support normal Elite escorts; Stage 8.2 owns the Elite leader.
 if(!statOnly&&!g.selected.boss)globalThis.WandererV013EnemyAbilities?.attach(group,g.selected.family||'blood',r.combatSeconds||0);
 if(!statOnly&&last&&g.selected.elite&&!g.selected.boss)globalThis.WandererV013EliteAbilities?.attach(group[0],r.combatSeconds||0);
 const fieldCount=Math.min(4,group.length);
 group[0].groupSlot=0;
 for(const enemy of group)enemy.groupClock=traits?traits.initialClock(enemy,enemy.groupSlot):Math.max(0,enemy.attackEvery-(.9+enemy.groupSlot*.3));
 r.initialMobCount=group.length;r.totalMobCount=group.length;r.enemies=fieldCount>1?group.slice(0,fieldCount):undefined;r.groupReserve=group.slice(fieldCount);if(fieldCount===1)delete r.enemies;r.enemy=group[0];r.encounterLeader=last&&(g.selected.boss||g.selected.elite)?group[0]:null;
 if(!statOnly&&last&&g.selected.boss)globalThis.WandererV013BossInfrastructure?.attach(r,group[0]);
 r.phase6Bounty=false;if(!statOnly&&r.enemy.miniboss&&ports.phase6Run?.effects.bounty){r.phase6Bounty=true;ports.phase6Run.effects.bounty=false;r.enemy.hp=r.enemy.maxhp=Math.ceil(r.enemy.maxhp*1.25);r.enemy.atk=Math.ceil(r.enemy.atk*1.25);}
 r.tPlayer=r.tDot=0;r.tEnemy=r.enemy.groupClock;r.setTemp=null;r.boonRotboundTriggers=0;r.playerDebuffUntil=0;
 r.playerHealingDebuffUntil=0;r.nextCasterHexAt=0;ports.setRuntime(r);r.status='fight';
 if(!statOnly&&last&&g.selected.boss)globalThis.WandererV013BossAbilities?.attach(r);
 if(ports.phase1Build)for(const enemy of r.enemies||[r.enemy])WandererV012Buildcraft.resetWave(ports.phase1Build,enemy);
 ports.addLog('Encounter: '+r.enemy.name+' · '+totalCount+' enemies');
 if(r.groupReserve?.length)ports.addLog(r.groupReserve.length+' reinforcements will fill the four arena positions.','good');
 ports.renderCombat();if(resetScroll)ports.resetDungeonEntryScroll();clearInterval(ports.clock);
 ports.clock=setInterval(()=>{if(ports.isVisible())ports.updateFight();},110/ports.clockSpeed);
}

function phase1WaveWon(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const r=ports.state.run,g=ports.phase1Controller.state;
 if(!ports.isPhase1Run()||r.status!=='fight'||!r.enemy||g.stage!=='combat'||!g.selected||r.enc!==g.wave||r.phase4AwardedWave===r.enc)return;
 const traits=globalThis.WandererV013EncounterTraits;
 if(r.encounterTraitId==='death_throes'&&traits){
  const fallen=r.enemies?.length?r.enemies.filter(mob=>mob.hp<=0&&!mob.groupDefeated):[r.enemy].filter(mob=>mob.hp<=0);
  const pulse=traits.deathPulse(r,fallen);
  if(pulse.triggers){ports.phase6Metric(r,'traitDeathPulse',pulse.triggers);ports.phase6Metric(r,'damageTaken',pulse.damage);ports.phase6Metric(r,'absorbed',pulse.absorbed);
   ports.addLog('Death Throes · '+pulse.damage+' damage'+(pulse.absorbed?' ('+pulse.absorbed+' absorbed)':'')+'!','critical');
   if(r.hp<=0){ports.phase1Death();return;}
  }
 }
 if(r.enemies?.length>1){
   const selectedTarget=r.enemy,dead=r.enemies.filter(enemy=>enemy.hp<=0&&!enemy.groupDefeated);if(!dead.length)return;
  for(const enemy of dead){r.enemy=enemy;enemy.groupDefeated=true;
  const death=globalThis.WandererV013BossInfrastructure?.onMinionDeath(r,enemy);
   const bossDeath=globalThis.WandererV013BossAbilities?.onDeath(r,enemy);
   if(bossDeath?.type==='node_broken'){ports.combatLinkEffect?.(r,'shock',enemy,[bossDeath.enemy]);ports.addLog('⚡ Convergence Anchor destroyed · Arcane Convergence '+(bossDeath.canceled?'interrupted':'next cast canceled')+' · Boss weakened for '+bossDeath.duration+'s','good');ports.phase6Metric(r,'bossNodeDestroyed',1);}
  if(death?.healed){ports.addLog('☠ Minion falls · Boss recovers '+death.healed+' HP','spell');ports.phase6Metric(r,'bossHealing',death.healed);}
  if(death?.counted&&enemy.stage83Summoner==='boss')ports.phase6Metric(r,'bossMinionDeaths',1);
   const spread=globalThis.WandererV013ExpeditionBoons?.spreadOnDeath(r,enemy,ports.synchronizeDots,(target,kind)=>ports.combatLinkEffect?.(r,kind,enemy,[target]))||0;
   if(spread)ports.addLog('Rotbound Echo spreads a lingering curse to '+spread+' '+(spread===1?'enemy':'enemies')+'.','spell');
   if(ports.state.automaticTalents?.nodes?.includes('plague_spread')){
    const bleed=enemy.dots?.bleed?.find(dot=>!dot.spread),rot=enemy.v012Rot?.find(dot=>!dot.spread);
    let transferred=0;
    for(const target of r.enemies.filter(mob=>mob.hp>0).concat(r.groupReserve||[]).slice(0,2)){
     let transferredTick=0;
     if(bleed){
      target.dots??={};target.dots.bleed??=[];
      if(target.dots.bleed.length<12){
       const tick=Math.max(1,Math.round(bleed.damage*.5));target.dots.bleed.push({damage:tick,remaining:Math.min(2,bleed.remaining),spread:true});
       transferredTick+=tick;transferred++;ports.combatLinkEffect?.(r,'bleed',enemy,[target]);
      }
      ports.synchronizeDots(target);
     }
     if(rot){
      target.v012Rot??=[];
      if(target.v012Rot.length<6){
       const tick=Math.max(1,Math.round(rot.damage*.5));target.v012Rot.push({damage:tick,remaining:Math.min(2,rot.remaining),ticks:0,spread:true});
       transferredTick+=tick;transferred++;ports.combatLinkEffect?.(r,'rot',enemy,[target]);
      }
     }
     // Contagion deals one transferred tick immediately on an active recipient.
     // Reserve units retain their transferred DOT but cannot die before spawning.
     if(transferredTick>0&&r.enemies.includes(target)&&target.hp>0){
      const absorbed=Math.min(target.barrier||0,transferredTick);
      target.barrier=Math.max(0,(target.barrier||0)-absorbed);
      const dealt=Math.min(target.hp,transferredTick-absorbed);
      if(dealt>0){target.hp-=dealt;ports.phase6Metric(r,'damageDealt',dealt);ports.phase6Metric(r,'secondaryTargetDamage',dealt);ports.phase6Metric(r,'secondaryDotDamage',dealt);ports.phase6Metric(r,'secondaryTargetHits',1);ports.phase6Metric(r,'plagueSpreadBursts',1);ports.floatText(dealt,'enemy',false,'ROT + BLEED',target);}
     }
    }
    if(transferred>0)ports.phase6Metric(r,'plagueSpreadTransfers',transferred);
   }
    if(ports.phase1Build)WandererV012Buildcraft.onKill(ports.phase1Build,{...ports.phase2Context(r),waveComplete:!r.groupReserve?.length&&WandererV012CombatCore.groupComplete(r.enemies)&&enemy===dead[dead.length-1]});}
  let reinforcements=0;
  for(const fallen of dead){const replacement=r.groupReserve?.shift();if(!replacement)continue;const slot=Math.max(0,Number(fallen.groupSlot)||0),index=r.enemies.indexOf(fallen);if(index<0)continue;replacement.groupSlot=slot;replacement.groupClock=traits?traits.initialClock(replacement,slot):Math.max(0,replacement.attackEvery-(.9+slot*.3));globalThis.WandererV013EnemyAbilities?.onEnter(replacement,r.combatSeconds||0);replacement.isReinforcement=true;replacement.reinforcementArrival=true;r.enemies[index]=replacement;reinforcements++;}
  const next=selectedTarget?.hp>0&&r.enemies.includes(selectedTarget)?selectedTarget:r.enemies.find(enemy=>enemy.hp>0&&!enemy.isReinforcement)||WandererV012CombatCore.nextGroupTarget(r.enemies);if(next){r.enemy=next;if(reinforcements){ports.addLog(reinforcements+' reinforcement'+(reinforcements===1?' arrives':'s arrive')+' in open position'+(reinforcements===1?'':'s')+'.','good');if(!ports.phase3RefreshGroupEnemies?.())ports.renderCombat();}else if(!ports.phase3RetargetGroup?.())ports.renderCombat();return true;}
 }else if(r.enemy.hp>0)return;
 clearInterval(ports.clock);
 if(ports.PHASE1_PREVIEW){const token=ports.phase5Snapshot.expedition.attempts+':'+r.phase1Plane+':'+r.enc;if(ports.phase5Snapshot.expedition.awardKeys.includes(token)||ports.phase4WaveKeys.includes(token)){ports.phase5Fail(Error('Duplicate encounter reward rejected'));return;}ports.phase4WaveKeys.push(token);}
 r.phase4AwardedWave=r.enc;
 if(!r.enemies){
 if(ports.phase1Build)WandererV012Buildcraft.onKill(ports.phase1Build,ports.phase2Context(r));}
 // Rewards belong to the encounter leader even when an escort falls last.
 const leader=r.encounterLeader||r.enemies?.find(mob=>mob.boss||mob.miniboss);
 if(leader)r.enemy=leader;
 const enemy=r.enemy,boss=!!enemy.boss,elite=!!enemy.miniboss;
  const groupReward=(boss||elite?1:r.totalMobCount>=18?1.3:r.totalMobCount>=10?1.2:r.totalMobCount>1?1.1:1)*(1+.12*(g.selected.risk||0));
 const gold=Math.round((ports.roll(3,6)+Math.floor(r.tier*.5)+(boss?8:elite?4:0))*(r.phase6Bounty?1.5:1)*groupReward);
 const fragments=Math.round((ports.roll(1,3)+Math.floor(r.tier*.24)+(boss?5:elite?3:0))*(r.phase6Bounty?1.5:1)*groupReward*(r.encounterTraitId?1.10:1));
 ports.state.gold+=gold;ports.state.fragments+=fragments;r.gold+=gold;r.fragments+=fragments;ports.phase5Results.gold+=gold;ports.phase5Results.fragments+=fragments;
 ports.addLog('Realm rewards pending: +'+gold+' Gold · +'+fragments+' Fragments.','good');
 const stage=boss?5:elite?4:Math.min(3,1+Math.floor((g.planeIndex-1)/5));
 const odds=g.dungeon?WandererV012LootRules.v013DungeonWaveOdds(stage,r.stats.cha):ports.waveLootOdds(stage,r.stats.cha);
 // All random Dungeon equipment rolls, including the first fight and Boss,
 // must allow zero drops. Preserve legacy v0.12 odds outside the Dungeon.
 const chanceCap=g.dungeon?.95:1;
 odds.drop=Math.min(chanceCap,odds.drop*groupReward);
 if(ports.phase6Run?.effects.fortune)odds.drop=Math.min(chanceCap,odds.drop*1.25);
 if(ports.gameRandom()<odds.drop){
  const theme=ports.phase2Theme(r.path),pick=g.dungeon&&g.selected.node===ports.phase1Controller.realmMap().objective&&ports.gameRandom()<.55?(ports.phase1Controller.realmMap().favoured||{slot:'offhand',subtype:'Shield'}):ports.dungeonEquipmentPick(theme,[]);
  const rarity=ports.randomFromOdds(odds.rarities);
  const item=ports.makeItem(r.tier,pick.slot,theme.effect,'loot',pick.subtype,rarity);
  // Gear in the Bag is at risk; equipped gear survives failure.
  if(ports.stashHasRoom())ports.state.stash.push({...item,isNew:true});
  else ports.state.expeditionOverflow.push({...item,isNew:true});
  ports.phase3LootIds.add(item.id);r.loot.push(item);ports.phase5Results.earned.push(ports.phase5Item(item));ports.phase3NotifyLoot?.(item);
  ports.addLog('✦ '+item.rarity+' '+item.name+' added to Expedition bag.',item.rarity);
 }
 // Treasures share Bag capacity with equipment; they can only be sold outside the Expedition.
 if(ports.gameRandom()<.23){
  const worth=Math.max(2,Math.round(3+r.tier*.55+ports.gameRandom()*(4+r.tier*.30)));
  const treasureId=ports.makeId();
  const treasure=globalThis.WandererV012Treasures.create(treasureId,r.tier);
  ports.state.valuables??=[];ports.state.valuables.push(treasure);
  ports.phase3LootIds.add(treasure.id);r.valuables.push(treasure);ports.phase3NotifyLoot?.(treasure);
  ports.addLog('◆ '+treasure.name+' · '+treasure.worth+' Gold when extracted.','good');
 }
 r.status='ready';
 const completedNode=g.selected?.node;
 const result=ports.phase1Controller.waveWon();
 // A Monster Hunt counts only enemies from genuinely completed ordinary
 // fights. Record the actual native enemy count, not map scouting or offers.
 if(!boss&&!elite&&g.dungeon&&Number.isSafeInteger(r.totalMobCount)&&r.totalMobCount>0){
  const entry=g.history.at(-1);
  if(entry?.node===completedNode&&!entry.boss&&!entry.elite&&!entry.event)
   entry.monstersDefeated=Math.min(32,r.totalMobCount);
 }
 ports.phase4CommitRealm({awardXp:true});ports.phase6CollectMetrics(r);ports.phase6TickDurations();
 r.status='cleared';
 ports.addLog(result.expeditionComplete?'Expedition boss defeated!':'Realm cleared. Select your next Realm.','good');
 ports.phase5RememberRealm(r,'cleared');
 // Preserve completed-combat metrics, then immediately discard remaining Barrier.
 r.barrier=0;
 ports.phase1Clock+=r.combatSeconds||0;
 ports.phase1Continuity=result.expeditionComplete?null:{setCooldowns:r.setCooldowns,secondWindUsed:r.secondWindUsed,legendaryState:r.legendaryState,legendaryCastCount:r.legendaryCastCount,legendaryAttackCount:r.legendaryAttackCount};
 ports.phase1Vitals=result.expeditionComplete?null:{hp:Math.max(1,r.hp),maxhp:r.maxhp,mp:Math.max(0,r.mp),maxmp:r.maxmp};
 if(result.expeditionComplete){
  ports.phase5Results.review='summary';
  ports.phase5PersonalBest=Math.max(ports.phase5PersonalBest,r.tier);
  ports.phase6ReturnPotions('victory');
  ports.settleContract('victory');ports.phase5MakeSummary('victory');
  WandererV012Buildcraft.clear(ports.phase1Build);ports.phase1Build=null;
  if(ports.PHASE1_PREVIEW){ports.phase5Snapshot.expedition.completed=Math.max(ports.phase5Snapshot.expedition.completed,r.tier);ports.phase5Snapshot.expedition.lastOutcome='victory';}
  // Keep classic Rune tiers and three-choice UI: only complete milestone bosses, never Elites.
  if(g.version===2||r.tier%10===0)ports.offerBossRunes(r.tier);
  if(ports.state.pendingRuneReward)ports.phase5Results.summary.runeTier=ports.state.pendingRuneReward.tier;
  // Existing stock is retained; new progression does not grant free vendor rerolls.
  if(ports.state.merchant)ports.state.merchant.refreshCost=16+ports.merchantTier()*4;
 }
 if(!result.expeditionComplete){
  const plane=ports.phase1Controller.state.rewardPending;
  ports.phase5Results.review=null;
  ports.phase1Controller.claimReward();
  ports.view='combat';
 }else{ports.state.run=null;ports.view='phase1';}
 if(!ports.phase5Persist())return;
 if(result.expeditionComplete)ports.render();
 else ports.renderCombat();
}

function phase1Death(){
 clearInterval(ports.clock);
 if(!ports.isPhase1Run())return;
 ports.addLog('YOU DIED · Expedition ended.','critical');
 ports.phase6CollectMetrics(ports.state.run);ports.phase6ReturnPotions('defeat');
 ports.phase5RememberRealm(ports.state.run,'defeat');ports.phase5MakeSummary('defeat');
 // Do not show the intermediary "YOU DIED" Realm page as well as the final loss summary.
 ports.phase5Results.review='summary';
 ports.phase4CommitRealm();ports.phase4LoseLoot();ports.phase1Controller.defeat();ports.phase1Vitals=null;ports.phase1Continuity=null;
 if(ports.phase1Build)WandererV012Buildcraft.clear(ports.phase1Build);
 ports.phase1Build=null;ports.state.run=null;ports.view='phase1';
 if(ports.PHASE1_PREVIEW)ports.phase5Snapshot.expedition.lastOutcome='defeat';ports.phase5Persist();ports.render();
 ports.bannerMessage('You died. Your secured resources remain in Camp.');
}

function phase1Abandon(){
 if(!ports.PHASE1_PREVIEW||(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))||!['choice','combat'].includes(ports.phase1Controller?.state.stage))return false;
 clearInterval(ports.clock);
 const contract=globalThis.WandererV013ExpeditionContracts?.inspect(ports.phase1Controller.state,'abandoned');
 if(contract&&contract.status!=='offered'){ports.phase5MakeSummary('abandoned');ports.phase5Results.review='summary';}
 ports.phase4CommitRealm();ports.phase4LoseLoot();ports.phase1Controller.abandon();
 if(ports.phase1Build)WandererV012Buildcraft.clear(ports.phase1Build);
 ports.phase1Build=null;ports.phase1Vitals=null;ports.phase1Continuity=null;ports.state.run=null;ports.view='phase1';
 if(ports.PHASE1_PREVIEW)ports.phase5Snapshot.expedition.lastOutcome='abandoned';
 ports.phase5Persist();ports.render();return true;
}

function phase6TickDurations(){
 if(!ports.phase6Run)return;ports.phase6Run.combats++;for(const e of Object.values(ports.phase6Run.effects))if(e&&typeof e==='object'&&Number.isInteger(e.remaining))e.remaining=Math.max(0,e.remaining-1);
}

function phase3ExpeditionActive(){return ports.PHASE1_PREVIEW&&['choice','combat'].includes(ports.phase1Controller?.state.stage);}

function phase3CanPrepare(){
 if(ports.phase5Results.review)return false;
 if(ports.phase4Resume)return false;
 return ports.PHASE1_PREVIEW&&ports.phase1Controller?.state.stage==='choice'&&!!ports.phase1Controller.state.dungeon&&!ports.phase1Controller.state.rewardPending&&!ports.state.run;
}

function phase3IsBetweenPlanes(){return ports.phase3CanPrepare()&&ports.phase1Controller.state.planeIndex>1;}

function phase3Vitals(){
 const stats=ports.phase1Build?ports.phase2Stats():ports.totalStats();
 const hp=Math.max(1,Math.min(stats.maxhp,ports.phase1Vitals?.hp??stats.maxhp));
 const magicAvailable=stats.mana>0,mp=Math.max(0,Math.min(stats.mana,ports.phase1Vitals?.maxmp===0&&magicAvailable?stats.mana:ports.phase1Vitals?.mp??stats.mana));
 return {hp,maxhp:stats.maxhp,mp,maxmp:stats.mana};
}

function phase5Item(i){return {id:i.id,name:i.name,tier:i.tier,rarity:i.rarity,slot:i.slot,subtype:i.subtype??null,armorType:i.armorType??null,legendaryId:i.legendaryId??null};}

function phase5RememberRealm(r,outcome){
 ports.phase5Results.realm={level:r.tier,plane:r.phase1Plane,name:r.planeName,family:r.planeFamily,outcome,
  metrics:r.metrics||null,enemy:r.enemy?.name||'Unknown',seconds:r.combatSeconds||0,gold:r.gold,fragments:r.fragments,
  loot:r.loot.map(ports.phase5Item),treasures:(r.valuables||[]).map(i=>({...i})),log:ports.phase4Clone(r.realmLog||ports.logEntries.slice().reverse()),truncated:!!r.realmLogTruncated};
 ports.phase5Results.review='realm';
}

function phase5MakeSummary(outcome){
 const g=ports.phase1Controller.state,owned=new Set([...ports.state.stash,...(ports.state.expeditionOverflow||[]),...Object.values(ports.state.equip).filter(Boolean)].map(i=>i.id));
 const lost=outcome==='defeat'||outcome==='abandoned',bagIds=new Set(ports.phase3BagItems().map(i=>i.id));
 if(g.dungeon){for(const i of Object.values(ports.phase4Home||{}))if(i)bagIds.delete(i.id);for(const i of ports.phase5Results.earned)if(owned.has(i.id))bagIds.add(i.id);}
 const earnedIds=new Set(ports.phase5Results.earned.map(i=>i.id));
 const lostGear=lost?[
  ...ports.phase5Results.earned.filter(i=>bagIds.has(i.id)),
  ...ports.phase3BagItems().filter(i=>i.kind!=='valuable'&&bagIds.has(i.id)&&!earnedIds.has(i.id)).map(ports.phase5Item)
 ]:[];
 const expeditionTreasures=(ports.state.valuables||[]).filter(i=>bagIds.has(i.id)).map(i=>({...i}));
 const start=ports.phase5Results.craftingStart||WandererV013Crafting.create(),craft=ports.state.crafting||WandererV013Crafting.create();
 ports.phase5Results.summary={family:g.bossFamily,realmMap:!!g.dungeon,contract:globalThis.WandererV013ExpeditionContracts?.inspect(g,outcome)||null,craftingEarned:{essence:Math.max(0,craft.essence-start.essence),cores:Object.fromEntries(WandererV013Crafting.FAMILIES.map(f=>[f,Math.max(0,craft.cores[f]-start.cores[f])]))},passiveTelemetry:ports.phase4Clone(ports.phase1Build?.runtime.passiveTelemetry||{}),metrics:ports.phase6Run?.metrics||null,level:g.expedition,outcome,realms:g.history.length,
  families:[...(ports.phase1Build?.families||g.families)],picks:[...(ports.phase1Build?.picks||[])],element:ports.phase1Build?.element||null,
  seconds:ports.phase1Clock+(outcome==='defeat'?(ports.state.run?.combatSeconds||0):0),gold:ports.phase5Results.gold,fragments:ports.phase5Results.fragments,
  kept:ports.phase5Results.earned.filter(i=>owned.has(i.id)&&(!lost||!bagIds.has(i.id))),lost:lostGear,
  discarded:ports.phase5Results.earned.filter(i=>!owned.has(i.id)),
  treasuresKept:lost?[]:expeditionTreasures,treasuresLost:lost?expeditionTreasures:[],runeTier:null};
}

function phase5ExitResult(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.state.run?.status==='cleared'||ports.phase5Results.eventExitPending){
  ports.phase5Results.eventExitPending=false;ports.phase5Results.review=null;
  ports.state.run=null;ports.view='phase1';if(!ports.phase5Persist())return false;ports.render();return true;
 }
 if(!ports.phase5Results.review)return false;
 const returningToCamp=ports.phase5Results.review==='summary';
 ports.phase5Results.review=ports.phase5Results.review==='realm'&&ports.phase5Results.summary?'summary':null;
 if(returningToCamp){ports.phase3LootIds=new Set();ports.phase5Results.eventExitPending=false;} // Retire Bag markers without removing any secured loot.
 ports.state.run=null;ports.view='phase1';if(!ports.phase5Persist())return false;ports.render();return true;
}
function phase5ReviewSummary(){ports.phase5Results.review='summary';ports.view='phase1';ports.phase5Persist();ports.render();}
return {phase5ReviewSummary,phase1Init,phase1Begin,phase2Theme,phase6AwardGear,phase6Buff,phase6OpenEvent,phase6EventChoice,phase6BackToCamp,phase1Enter,phase2Launch,phase1StartWave,phase1WaveWon,phase1Death,phase1Abandon,phase6TickDurations,phase3ExpeditionActive,phase3CanPrepare,phase3IsBetweenPlanes,phase3Vitals,phase5Item,phase5RememberRealm,phase5MakeSummary,phase5ExitResult};
}
root.WandererV012ExpeditionRuntime=Object.freeze({create});
})(globalThis);
