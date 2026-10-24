// v0.12 expedition runtime. Canonical state transitions; UI effects are injected.
(function(root){'use strict';
function create(ports){
function phase1Init(){
 ports.phase1Continuity=null;ports.phase3LootIds=new Set();ports.phase3PotionCooldowns={health:0,mana:0};
 ports.prepareInterface();
 ports.fresh();
 ports.state.expeditionOverflow=[];
 ports.state.equip.weapon=ports.state.stash.shift();
 ports.state.equip.armor=ports.makeItem(1,'armor',null,'loot','Armor','Uncommon');
 ports.state.equip.helm=ports.makeItem(1,'helm',null,'loot','Helm','Uncommon');
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
 ports.phase4Seed=Math.floor(Math.random()*4294967296)>>>0;ports.phase4Prefix=Date.now().toString(36);ports.phase4Stamp=null;ports.phase4Home=ports.phase4Clone(ports.state.equip);ports.phase4Entry=null;ports.phase4Resume=false;ports.phase4WaveKeys=[];
 ports.phase5Results={version:1,complete:true,review:null,realm:null,summary:null,earned:[],gold:0,fragments:0};
 ports.phase1Controller.start(level);ports.phase6Run={version:1,event:null,events:[],effects:{},combats:0};ports.phase3LootIds=new Set();ports.phase3PotionCooldowns={health:0,mana:0};ports.phase1Vitals=null;ports.phase1Clock=0;ports.phase1Continuity=null;ports.phase3Supplies={health:0,mana:0};ports.phase1Build=WandererV012Buildcraft.create();ports.phase1Build.runtime.hybridRules=true;ports.phase1Build.families=ports.phase1Controller.state.families;ports.phase1Draft=null;ports.state.run=null;ports.view='phase1';
 if(ports.PHASE5_VALIDATION){ports.phase5Snapshot.expedition.attempts++;ports.phase5Snapshot.expedition.awardKeys=[];ports.phase5Snapshot.expedition.lastOutcome='active';ports.phase5Persist();}
 ports.render();
}

function phase2Theme(id){if(id==='bloodscar')return ports.THEMES.find(t=>t.id==='bloodscar')||{...ports.THEMES.find(t=>t.id==='forge'),id,name:'Bloodscar Wastes'};return ports.THEMES.find(t=>t.id===id);}

function phase6AwardGear(){
 const g=ports.phase1Controller.state,t=ports.phase2Theme(g.selected.id),pick=ports.dungeonEquipmentPick(t,[]),item=ports.makeItem(g.expedition,pick.slot,null,'loot',pick.subtype);
 (ports.stashHasRoom()?ports.state.stash:ports.state.expeditionOverflow).push(item);ports.phase3LootIds.add(item.id);ports.phase5Results.earned.push(ports.phase5Item(item));return item;
}

function phase6Buff(key,power,remaining=3){ports.phase6Run.effects[key]={power,remaining};}

function phase6OpenEvent(plane){
 if(!ports.phase6Run.event){const replacement=ports.phase1Build.unlockedFamilies.flatMap(f=>WandererV012Buildcraft.eligible(ports.phase1Build,f)).filter(p=>!p.requires.length);
  ports.phase6Run.event={id:plane.event,roll:ports.gameRandom(),alternative:replacement.length?replacement[Math.floor(ports.gameRandom()*replacement.length)].id:null};}
 if(!ports.phase4Entry){ports.phase4Stamp=Date.now();ports.phase4Entry={profile:ports.phase4Clone({...ports.state,run:null}),session:ports.phase4Session(true),ledger:[...(ports.phase5Snapshot?.expedition.awardKeys||[])]};}
 if(ports.phase5Persist()){ports.view='phase1';ports.render();}
}

function phase6EventChoice(choice,itemId,passiveId,family,targetId){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||!ports.phase6Run?.event||ports.phase4Resume||ports.state.run||![0,1,2].includes(choice))return false;
 const g=ports.phase1Controller.state,p=g.selected,ev=ports.phase6Run.event;if(g.stage!=='combat'||!p?.event||ev.id!==p.event||ports.phase6Run.events.includes(g.planeIndex))return false;
 const v=ports.phase3Vitals(),E=g.expedition,beforeGold=ports.state.gold,beforeFragments=ports.state.fragments,loot=[],costGold=25+3*E,costFragments=10+E;
 const item=ports.phase3BagItems().find(i=>i.id===itemId),target=[...Object.values(ports.state.equip).filter(Boolean),...ports.phase3BagItems()].find(i=>i.id===targetId);
 const passive=ports.phase1Build.picks.includes(passiveId),effects=ports.phase6Run.effects;
 const pay=(field,n)=>{if(ports.state[field]<n)return false;ports.state[field]-=n;return true;};
 const heal=(hp=0,mp=0)=>{ports.phase1Vitals={hp:Math.min(v.maxhp,v.hp+Math.ceil(v.maxhp*hp)),mp:Math.min(v.maxmp,v.mp+Math.ceil(v.maxmp*mp)),maxmp:v.maxmp};};
 const sacrifice=()=>{ports.state.stash=ports.state.stash.filter(i=>i.id!==itemId);ports.state.expeditionOverflow=ports.state.expeditionOverflow.filter(i=>i.id!==itemId);ports.state.valuables=(ports.state.valuables||[]).filter(i=>i.id!==itemId);ports.phase3LootIds.delete(itemId);};
 if(choice!==2){switch(ev.id){
 case 'traveling_merchant':if(choice===0&&v.hp>=v.maxhp)return false;if(!pay('gold',costGold))return false;if(choice===0)heal(.35);else ports.phase6Buff('might',.10);break;
 case 'smugglers_caravan':if(!pay('fragments',costFragments))return false;if(choice===0)heal(0,.4);else ports.phase6Buff('ironhide',.10);break;
 case 'relic_collector':if(!item){ports.state[choice===0?'gold':'fragments']+=choice===0?5+E:3+E;break;}sacrifice();ports.state[choice===0?'gold':'fragments']+=choice===0?12+2*item.tier:5+item.tier;break;
 case 'cursed_artificer':if(!item||choice===0&&(!target||target.id===itemId))return false;sacrifice();if(choice===0)effects.item={id:target.id,remaining:3};else effects.barrier=Math.max(effects.barrier||0,.15);break;
 case 'cursed_altar':if(v.hp<=Math.ceil(v.maxhp*.2))return false;heal();ports.phase1Vitals.hp-=Math.ceil(v.maxhp*.2);effects[choice===0?'attack':'defense']=.10;break;
 case 'soul_mirror':if(choice===0){if(!passive||ports.phase1Build.unlockedFamilies?.some(f=>WandererV012Buildcraft.initialId(f,ports.phase1Build.element)===passiveId)||!ev.alternative)return false;const index=ports.phase1Build.picks.indexOf(passiveId),old=ports.phase1Build.picks.splice(index,1)[0];const available=WandererV012Buildcraft.eligible(ports.phase1Build,WandererV012Buildcraft.CATALOG.find(p=>p.id===ev.alternative).family);if(!available.some(p=>p.id===ev.alternative)){ports.phase1Build.picks.splice(index,0,old);return false;}ports.phase1Build.picks.push(ev.alternative);}break;
 case 'whispering_idol':ports.phase6Buff('curse',.10);ports.state[choice===0?'gold':'fragments']+=choice===0?25+4*E:12+2*E;break;
 case 'echo_shrine':if(choice===0){if(!passive||!WandererV012Buildcraft.canModify(ports.phase1Build,passiveId,.5,ports.totalStats()))return false;effects.echo={id:passiveId,power:.5,remaining:3};ports.phase1Build.runtime.echo=effects.echo;}else heal(0,.15);break;
 case 'cursed_chest':if(choice===0)ports.state.gold+=8+E;else if(ev.roll<.5)loot.push(ports.phase6AwardGear());else{heal();ports.phase1Vitals.hp=Math.max(1,v.hp-Math.ceil(v.maxhp*.15));}break;
 case 'forgotten_arsenal':if(choice===0)loot.push(ports.phase6AwardGear());else ports.state.fragments+=8+2*E;break;
 case 'runic_vault':if(choice===0){if(!ports.state.runeSlots.some(Boolean))return false;ports.phase6Buff('runeBoost',.20);}else ports.state.fragments+=10+E;break;
 case 'bounty_writ':if(choice===0){if(g.rooms.slice(g.planeIndex).includes('elite'))effects.bounty=true;else ports.state.fragments+=5+E;}break;
 case 'restless_spring':if(choice===0&&v.hp>=v.maxhp||choice===1&&(v.maxmp===0||v.mp>=v.maxmp))ports.state.fragments+=3+E;else choice===0?heal(.35):heal(0,.4);break;
 case 'fallen_wanderer':if(choice===0){if(!pay('gold',10+E))return false;heal(.2);effects.barrier=Math.max(effects.barrier||0,.1);}else heal(.15,.15);break;
 case 'oracle_of_paths':if(choice===0){if(!ports.phase1Controller.allowed().includes(family))return false;ports.phase1Controller.influence(family);}else ports.state.fragments+=5+E;break;
 case 'last_ember':if(!passive||!WandererV012Buildcraft.canModify(ports.phase1Build,passiveId,-.5,ports.totalStats()))return false;effects.echo={id:passiveId,power:-.5,remaining:3};ports.phase1Build.runtime.echo=effects.echo;choice===0?heal(.35):heal(0,.4);break;
 default:return false;
 }}
 ports.phase6Run.events.push(g.planeIndex);ports.phase6Run.event=null;ports.phase4CommitRealm();ports.phase1Controller.waveWon();
 phase6UnlockBase(p.family);
 ports.phase5Results.gold+=Math.max(0,ports.state.gold-beforeGold);ports.phase5Results.fragments+=Math.max(0,ports.state.fragments-beforeFragments);
 ports.phase5RememberRealm({tier:E,phase1Plane:g.planeIndex-1,planeName:p.name,planeFamily:p.family,combatSeconds:0,gold:Math.max(0,ports.state.gold-beforeGold),fragments:Math.max(0,ports.state.fragments-beforeFragments),loot,realmLog:[{text:choice===2?'Event declined. No reward.':WandererV012IntegratedEvents.get(ev.id)[3][choice],kind:'good'}]},'cleared');
 ports.phase5Results.review=null;ports.phase5Results.eventExitPending=true;
 ports.phase1Draft={version:3,kind:'reward',plane:g.rewardPending,step:'passive',options:ports.phase6PassiveOptions(g.rewardPending)};
 if(!ports.phase5Persist())return false;ports.render();return true;
}

function phase6UnlockBase(family){
 const p=ports.phase1Build;
 if(!p.unlockedFamilies?.includes(family)){const starter=WandererV012Buildcraft.initial(p,family);if(starter)ports.addLog('Affinity unlocked: '+starter.name,'good');}
}
function phase6PassiveOptions(plane){ports.phase1Build.realmIndex=plane.plane;ports.phase1Build.runtime.draftStats=ports.totalStats();return WandererV012Buildcraft.options(ports.phase1Build,plane.family,ports.phase1Controller.passiveRandom?.()||ports.gameRandom);}

function phase6BackToCamp(){
 const g=ports.phase1Controller.state;
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||g.planeIndex!==1||g.history.length||g.stage!=='choice'||ports.state.run||ports.phase6Run?.started)return false;
 ports.phase1Controller.abandon();if(ports.phase1Build)WandererV012Buildcraft.clear(ports.phase1Build);
 ports.phase1Build=ports.phase1Draft=ports.phase1Vitals=ports.phase1Continuity=null;ports.phase4Home=ports.phase4Entry=null;ports.phase4Seed=ports.phase4Prefix=null;ports.phase6Run=null;ports.phase4WaveKeys=[];
 if(ports.PHASE5_VALIDATION)ports.phase5Snapshot.expedition.lastOutcome='cancelled';ports.view='phase1';if(!ports.phase5Persist())return false;ports.render();return true;
}

function phase2EnterInitialRealm(){
 const g=ports.phase1Controller.state;
 if(g.stage!=='choice'||g.planeIndex!==1||g.history.length||!g.initialFamily||!ports.phase1Build||ports.phase1Draft||ports.state.run||ports.phase4Resume||ports.phase5Results.review)return false;
 const plane=g.offers.find(p=>p.family===g.initialFamily);if(!plane)return false;
 if(!ports.phase1Choose(plane.id))return false;
 return ports.phase1Enter();
}

function phase2ChooseInitial(family){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const g=ports.phase1Controller.state;
 if(g.stage!=='choice'||g.initialFamily||ports.phase1Draft||!ports.phase1Build)return false;
 ports.phase1Controller.chooseInitial(family);ports.phase1Build.families=g.families;
 if(family==='magic')ports.phase1Draft={kind:'initial',family,step:'element'};
 ports.phase5Persist();ports.render();return true;
}

function phase2ChooseElement(id){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const draft=ports.phase1Draft;if(!draft||draft.step!=='element')return false;
 WandererV012Buildcraft.element(ports.phase1Build,id);ports.phase1Draft=null;
 // Element selection only. The enabling Magic passive is earned on first Realm clear.
 if(!ports.phase5Persist())return false;
 if(draft.kind==='entry'&&!draft.plane.eventId)ports.phase2Launch(draft.plane);else ports.render();
 return true;
}

function phase2ChoosePassive(id){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const draft=ports.phase1Draft,g=ports.phase1Controller.state;
 if(!draft||draft.kind!=='reward'||draft.step!=='passive'||!g.rewardPending||ports.state.run?.status==='fight')return false;
 // A fully exhausted legal pool has no selectable card; the player explicitly acknowledges it.
 if(draft.options.length===0){if(id!==null)return false;}
 else{if(typeof id!=='string')return false;WandererV012Buildcraft.choose(ports.phase1Build,draft.plane.family,id,draft.options);}
 ports.phase1Controller.claimReward();ports.phase1Draft=null;if(ports.phase1Controller.state.version===2)ports.phase1Build.runtime.hybridWindow=false;
 ports.phase3ClampVitals();if(!ports.phase5Persist())return false;
 if(ports.state.run?.status==='cleared'){ports.view='combat';ports.renderCombat();}else{ports.view='phase1';ports.render();}
 return true;
}

function phase1Choose(id){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.phase1Draft||!ports.phase1Build)return false;
 ports.phase1Controller.select(id);ports.view='phase1';ports.phase5Persist();ports.render();return true;
}

function phase1Enter(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.phase1Draft||!ports.phase1Build||ports.state.run)return false;
 if(ports.phase3BagItems().length>=ports.PHASE3_BAG_CAPACITY||ports.phase3BagOverflow()){ports.bannerMessage('Bag full. Discard an item before entering another Realm.');return false;}
 const plane=ports.phase1Controller.enter();ports.phase1Build.families=ports.phase1Controller.state.families;
 if(plane.family==='magic'&&!ports.phase1Build.element){
  ports.phase1Draft={kind:'entry',plane,family:'magic',step:'element'};ports.phase5Persist();ports.render();
 }
 else if(ports.phase5Persist())ports.phase2Launch(plane);
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
 playerHealingDebuffUntil:0,combatSeconds:0,setCooldowns:{...(ports.phase1Continuity?.setCooldowns||{})},secondWindUsed:ports.phase1Continuity?.secondWindUsed||false,
 legendaryState:ports.phase1Continuity?.legendaryState||null,legendaryCastCount:ports.phase1Continuity?.legendaryCastCount||0,legendaryAttackCount:ports.phase1Continuity?.legendaryAttackCount||0};
 if(ports.phase6Run?.effects.barrier){ports.setBarrier(ports.state.run,ports.state.run.maxhp*ports.phase6Run.effects.barrier);ports.phase6Run.effects.barrier=0;}
 ports.legendaryRealmStart(ports.state.run);
 ports.view='combat';ports.logEntries=[];ports.addLog('Expedition '+ports.state.run.tier+' · Realm '+ports.phase1Controller.state.planeIndex+' · '+plane.name,'good');ports.phase1StartWave(true);
}

function phase1StartWave(resetScroll=false){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const r=ports.state.run,g=ports.phase1Controller.state;
 if(!ports.isPhase1Run()||!g.selected||r.status==='fight')return;
 r.enc=g.wave;const last=g.wave===g.selected.waves;
 const theme=ports.phase2Theme(g.selected.id);
 r.enemy=ports.enemyFor(r.tier,r.enc,{theme,boss:last&&g.selected.boss,elite:last&&g.selected.elite&&!g.selected.boss,variant:g.version===2?ports.BOSS_ARCHETYPES.find(b=>b.style===WandererV012Expedition.BOSSES.find(v=>v.id===g.bossId).style):null});
 r.phase6Bounty=false;if(r.enemy.miniboss&&ports.phase6Run?.effects.bounty){r.phase6Bounty=true;ports.phase6Run.effects.bounty=false;r.enemy.hp=r.enemy.maxhp=Math.ceil(r.enemy.maxhp*1.25);r.enemy.atk=Math.ceil(r.enemy.atk*1.25);}
 r.tPlayer=r.tEnemy=r.tDot=0;r.setTemp=null;r.playerDebuffUntil=0;
 r.playerHealingDebuffUntil=0;r.nextCasterHexAt=0;ports.setRuntime(r);r.status='fight';
 if(ports.phase1Build)WandererV012Buildcraft.resetWave(ports.phase1Build,r.enemy);
 ports.addLog('Wave '+g.wave+'/'+g.selected.waves+': '+r.enemy.name);
 ports.renderCombat();if(resetScroll)ports.resetDungeonEntryScroll();clearInterval(ports.clock);
 ports.clock=setInterval(()=>{if(ports.isVisible())ports.updateFight();},110/ports.clockSpeed);
}

function phase1WaveWon(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const r=ports.state.run,g=ports.phase1Controller.state;
 if(!ports.isPhase1Run()||r.status!=='fight'||!r.enemy||r.enemy.hp>0||g.stage!=='combat'||!g.selected||r.enc!==g.wave||r.phase4AwardedWave===r.enc)return;
 clearInterval(ports.clock);
 if(ports.PHASE5_VALIDATION){const token=ports.phase5Snapshot.expedition.attempts+':'+r.phase1Plane+':'+r.enc;if(ports.phase5Snapshot.expedition.awardKeys.includes(token)||ports.phase4WaveKeys.includes(token)){ports.phase5Fail(Error('Duplicate Wave reward rejected'));return;}ports.phase4WaveKeys.push(token);}
 r.phase4AwardedWave=r.enc;
 ports.legendaryKill(r);
 if(ports.phase1Build)WandererV012Buildcraft.onKill(ports.phase1Build,ports.phase2Context(r));
 const enemy=r.enemy,boss=!!enemy.boss,elite=!!enemy.miniboss;
 const gold=Math.round((ports.roll(3,6)+Math.floor(r.tier*.5)+(boss?8:elite?4:0))*(r.phase6Bounty?1.5:1));
 const fragments=Math.round((ports.roll(1,3)+Math.floor(r.tier*.24)+(boss?5:elite?3:0))*(r.phase6Bounty?1.5:1));
 ports.state.gold+=gold;ports.state.fragments+=fragments;r.gold+=gold;r.fragments+=fragments;ports.phase5Results.gold+=gold;ports.phase5Results.fragments+=fragments;
 ports.addLog('Realm rewards pending: +'+gold+' Gold · +'+fragments+' Fragments.','good');
 const odds=ports.waveLootOdds(boss?5:elite?4:r.enc,r.stats.cha);if(ports.phase6Run?.effects.fortune)odds.drop=Math.min(1,odds.drop*1.25);
 if(boss||r.phase6Bounty||ports.gameRandom()<odds.drop){
  const theme=ports.phase2Theme(r.path),pick=ports.dungeonEquipmentPick(theme,[]);
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
 const result=ports.phase1Controller.waveWon();
 if(!result.planeComplete){
  if(!ports.phase5Persist())return;
  ports.renderCombat();
  setTimeout(()=>{if(ports.state.run===r&&r.status==='ready')ports.phase1StartWave();},650);
  return;
 }
 ports.phase4CommitRealm();ports.phase6CollectMetrics(r);ports.phase6TickDurations();
 r.status='cleared';
 ports.addLog(result.expeditionComplete?'Expedition boss defeated!':'Realm cleared. Select your next Realm.','good');
 ports.phase5RememberRealm(r,'cleared');
 ports.phase1Clock+=r.combatSeconds||0;
 ports.phase1Continuity=result.expeditionComplete?null:{setCooldowns:r.setCooldowns,secondWindUsed:r.secondWindUsed,legendaryState:r.legendaryState,legendaryCastCount:r.legendaryCastCount,legendaryAttackCount:r.legendaryAttackCount};
 ports.phase1Vitals=result.expeditionComplete?null:{hp:Math.max(1,r.hp),mp:Math.max(0,r.mp),maxmp:r.maxmp};
 if(result.expeditionComplete){
  ports.phase5Results.review='summary';
  ports.phase5PersonalBest=Math.max(ports.phase5PersonalBest,r.tier);
  ports.phase6ReturnPotions('victory');
  ports.phase5MakeSummary('victory');
  WandererV012Buildcraft.clear(ports.phase1Build);ports.phase1Build=null;
  if(ports.PHASE5_VALIDATION){ports.phase5Snapshot.expedition.completed=Math.max(ports.phase5Snapshot.expedition.completed,r.tier);ports.phase5Snapshot.expedition.lastOutcome='victory';}
  // Keep classic Rune tiers and three-choice UI: only complete milestone bosses, never Elites.
  if(g.version===2||r.tier%10===0)ports.offerBossRunes(r.tier);
  if(ports.state.pendingRuneReward)ports.phase5Results.summary.runeTier=ports.state.pendingRuneReward.tier;
  // Existing stock is retained; new progression does not grant free vendor rerolls.
  if(ports.state.merchant)ports.state.merchant.refreshCost=16+ports.merchantTier()*4;
 }
 if(!result.expeditionComplete){
  const plane=ports.phase1Controller.state.rewardPending;
  phase6UnlockBase(plane.family);
  ports.phase5Results.review=null;
  ports.phase1Draft={version:3,kind:'reward',plane,step:'passive',options:ports.phase6PassiveOptions(plane)};
  ports.view='combat';
 }else{ports.state.run=null;ports.view='phase1';}
 if(!ports.phase5Persist())return;
 if(result.expeditionComplete)ports.render();
 else{ports.renderCombat();ports.phase6PassivePopup();}
}

function phase1Death(){
 clearInterval(ports.clock);
 if(!ports.isPhase1Run())return;
 ports.addLog('YOU DIED · Expedition Bag lost; equipped gear is safe.','critical');
 ports.phase6CollectMetrics(ports.state.run);ports.phase6ReturnPotions('defeat');
 ports.phase5RememberRealm(ports.state.run,'defeat');ports.phase5MakeSummary('defeat');
 ports.phase4CommitRealm();ports.phase4LoseLoot();ports.phase1Controller.defeat();ports.phase1Vitals=null;ports.phase1Continuity=null;
 if(ports.phase1Build)WandererV012Buildcraft.clear(ports.phase1Build);
 ports.phase1Build=null;ports.phase1Draft=null;ports.state.run=null;ports.view='phase1';
 if(ports.PHASE5_VALIDATION)ports.phase5Snapshot.expedition.lastOutcome='defeat';ports.phase5Persist();ports.render();
 ports.bannerMessage('You died. Only Bag contents were lost; equipped gear and earned currency are safe.');
}

function phase1Abandon(){
 if(!ports.PHASE1_PREVIEW||(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))||!['choice','combat'].includes(ports.phase1Controller?.state.stage))return false;
 clearInterval(ports.clock);ports.phase4CommitRealm();ports.phase4LoseLoot();ports.phase1Controller.abandon();
 if(ports.phase1Build)WandererV012Buildcraft.clear(ports.phase1Build);
 ports.phase1Build=null;ports.phase1Draft=null;ports.phase1Vitals=null;ports.phase1Continuity=null;ports.state.run=null;ports.view='phase1';
 if(ports.PHASE5_VALIDATION)ports.phase5Snapshot.expedition.lastOutcome='abandoned';
 ports.phase5Persist();ports.render();return true;
}

function phase6TickDurations(){
 if(!ports.phase6Run)return;ports.phase6Run.combats++;for(const e of Object.values(ports.phase6Run.effects))if(e&&typeof e==='object'&&Number.isInteger(e.remaining))e.remaining=Math.max(0,e.remaining-1);
}

function phase3ExpeditionActive(){return ports.PHASE1_PREVIEW&&['choice','combat'].includes(ports.phase1Controller?.state.stage);}

function phase3CanPrepare(){
 if(ports.phase5Results.review)return false;
 if(ports.phase4Resume)return false;
 return ports.PHASE1_PREVIEW&&ports.phase1Controller?.state.stage==='choice'&&!!ports.phase1Controller.state.initialFamily&&!ports.phase1Controller.state.rewardPending&&!ports.phase1Draft&&!ports.state.run;
}

function phase3IsBetweenPlanes(){return ports.phase3CanPrepare()&&ports.phase1Controller.state.planeIndex>1;}

function phase3Vitals(){
 const stats=ports.phase1Build?ports.phase2Stats():ports.totalStats();
 const hp=Math.max(1,Math.min(stats.maxhp,ports.phase1Vitals?.hp??stats.maxhp));
 const magicAvailable=stats.mana>0,mp=Math.max(0,Math.min(stats.mana,ports.phase1Vitals?.maxmp===0&&magicAvailable?stats.mana:ports.phase1Vitals?.mp??stats.mana));
 return {hp,maxhp:stats.maxhp,mp,maxmp:stats.mana};
}

function phase3Reroll(index){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(!ports.phase3CanPrepare()||!ports.phase1Controller.state.initialFamily||!Number.isInteger(index)||index<0||index>2||(ports.phase1Controller.state.version===2?(ports.phase1Controller.state.rerolls<1||ports.phase1Controller.state.planeIndex===15):ports.phase1Controller.state.rerollsByRealm[ports.phase1Controller.state.planeIndex-1][index]<1))return false;
 ports.phase1Controller.reroll(index);ports.view='phase1';ports.phase5Persist();ports.render();return true;
}

function phase5Item(i){return {id:i.id,name:i.name,tier:i.tier,rarity:i.rarity,slot:i.slot};}

function phase5RememberRealm(r,outcome){
 ports.phase5Results.realm={level:r.tier,plane:r.phase1Plane,name:r.planeName,family:r.planeFamily,outcome,
  metrics:r.metrics||null,enemy:r.enemy?.name||'Unknown',seconds:r.combatSeconds||0,gold:r.gold,fragments:r.fragments,
  loot:r.loot.map(ports.phase5Item),treasures:(r.valuables||[]).map(i=>({...i})),log:ports.phase4Clone(r.realmLog||ports.logEntries.slice().reverse()),truncated:!!r.realmLogTruncated};
 ports.phase5Results.review='realm';
}

function phase5MakeSummary(outcome){
 const g=ports.phase1Controller.state,owned=new Set([...ports.state.stash,...(ports.state.expeditionOverflow||[]),...Object.values(ports.state.equip).filter(Boolean)].map(i=>i.id));
 const lost=outcome==='defeat'||outcome==='abandoned',bagIds=new Set(ports.phase3BagItems().map(i=>i.id));
 const expeditionTreasures=(ports.state.valuables||[]).filter(i=>bagIds.has(i.id)).map(i=>({...i}));
 ports.phase5Results.summary={passiveTelemetry:ports.phase4Clone(ports.phase1Build?.runtime.passiveTelemetry||{}),metrics:ports.phase6Run?.metrics||null,level:g.expedition,outcome,realms:g.history.length,
  families:[...(ports.phase1Build?.families||g.families)],picks:[...(ports.phase1Build?.picks||[])],element:ports.phase1Build?.element||null,
  seconds:ports.phase1Clock+(outcome==='defeat'?(ports.state.run?.combatSeconds||0):0),gold:ports.phase5Results.gold,fragments:ports.phase5Results.fragments,
  kept:ports.phase5Results.earned.filter(i=>owned.has(i.id)&&(!lost||!bagIds.has(i.id))),lost:ports.phase5Results.earned.filter(i=>lost&&bagIds.has(i.id)),
  discarded:ports.phase5Results.earned.filter(i=>!owned.has(i.id)),
  treasuresKept:lost?[]:expeditionTreasures,treasuresLost:lost?expeditionTreasures:[],runeTier:null};
}

function phase5ExitResult(){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||ports.phase1Draft?.kind==='reward')return false;
 if(ports.state.run?.status==='cleared'||ports.phase5Results.eventExitPending){
  ports.phase5Results.eventExitPending=false;ports.phase5Results.review=null;
  ports.state.run=null;ports.view='phase1';if(!ports.phase5Persist())return false;ports.render();return true;
 }
 if(!ports.phase5Results.review)return false;
 ports.phase5Results.review=ports.phase5Results.review==='realm'&&ports.phase5Results.summary?'summary':null;
 ports.state.run=null;ports.view='phase1';if(!ports.phase5Persist())return false;ports.render();return true;
}
function phase5ReviewSummary(){ports.phase5Results.review='summary';ports.view='phase1';ports.phase5Persist();ports.render();}
return {phase5ReviewSummary,phase1Init,phase1Begin,phase2Theme,phase6AwardGear,phase6Buff,phase6OpenEvent,phase6EventChoice,phase6PassiveOptions,phase6BackToCamp,phase2EnterInitialRealm,phase2ChooseInitial,phase2ChooseElement,phase2ChoosePassive,phase1Choose,phase1Enter,phase2Launch,phase1StartWave,phase1WaveWon,phase1Death,phase1Abandon,phase6TickDurations,phase3ExpeditionActive,phase3CanPrepare,phase3IsBetweenPlanes,phase3Vitals,phase3Reroll,phase5Item,phase5RememberRealm,phase5MakeSummary,phase5ExitResult};
}
root.WandererV012ExpeditionRuntime=Object.freeze({create});
})(globalThis);
