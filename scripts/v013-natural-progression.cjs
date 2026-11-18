'use strict';
// Stage 9.3: real-account E1–E8 natural progression.
// Absolutely no synthetic talent XP, fabricated gear, forced unlocks, forced
// encounters, instant-kill enemies or direct state mutation of rewards.
const fs=require('node:fs');
const path=require('node:path');
const create=require('../tests/v012-economy-harness.cjs');
const S=require('./simulate-progression.cjs');
require('../online/v013-map-intelligence.js');
const I=globalThis.WandererV013MapIntelligence;
const PROFILES=Object.freeze({
 cautious:{name:'Cautious',risk:0,targets:['strong_heart','guarded_block','renewal','guard','vitality','might'],families:['aegis','vitality'],healAt:.72,retreatAt:.2,target:'mechanics',shop:true},
 balanced:{name:'Balanced',risk:0,targets:['bleeding_edge','deep_cuts','strong_heart','might','vitality'],families:['blood','aegis'],healAt:.53,retreatAt:.12,target:'mechanics',shop:true},
 daring:{name:'Daring',risk:1,targets:['quick_hands','double_strike','bleeding_edge','might','haste'],families:['fury','blood'],healAt:.35,retreatAt:.07,target:'focus',shop:true}
});
const DEFAULTS=Object.freeze({seeds:[9101,9201],profiles:['cautious','balanced'],maxLevel:8,maxAttempts:3,tickLimit:4500,maxRooms:34,output:'reports/v013-stage93-natural-e1-e8.json'});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=(n,places=2)=>Number(Number(n).toFixed(places));
function parseArgs(args=[]){
 const v={...DEFAULTS,seeds:[...DEFAULTS.seeds],profiles:[...DEFAULTS.profiles]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Expected --key=value: '+arg);
  const [,k,value]=m;
  if(k==='seeds'){v.seeds=[...new Set(value.split(',').map(Number))];if(!v.seeds.length||v.seeds.some(x=>!Number.isSafeInteger(x)||x<1))throw Error('Invalid seeds');}
  else if(k==='profiles'){v.profiles=[...new Set(value.split(','))];if(!v.profiles.length||v.profiles.some(x=>!PROFILES[x]))throw Error('Invalid profiles');}
  else if(k==='max-level'){v.maxLevel=Number(value);if(!Number.isInteger(v.maxLevel)||v.maxLevel<1||v.maxLevel>8)throw Error('Levels are E1–E8 only');}
  else if(k==='max-attempts'){v.maxAttempts=Number(value);if(!Number.isInteger(v.maxAttempts)||v.maxAttempts<1||v.maxAttempts>8)throw Error('Max attempts must be 1–8');}
  else if(k==='tick-limit'){v.tickLimit=Number(value);if(!Number.isInteger(v.tickLimit)||v.tickLimit<100||v.tickLimit>100000)throw Error('Invalid tick limit');}
  else if(k==='out'&&value.endsWith('.json'))v.output=value;
  else throw Error('Unsupported option: '+arg);
 }
 if(v.seeds.length*v.profiles.length*v.maxAttempts*v.maxLevel>192)throw Error('Natural cohort >192 potential attempts. Narrow the pilot.');
 return v;
}
function gearScore(item,profile){
 if(!item)return -1;
 const r={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
 const s=Number(item.atk||0)*2.8+Number(item.def||0)*3.2+Number(item.hp||0)*.24+
  Number(item.spellPower||0)*2.2+Number(item.attack||0)*2+Number(item.armor||0)*3+
  Number(item.str||0)*2+Number(item.end||0)*2.5+Number(item.int||0)*1.5+
  Number(item.agi||0)*1.3+Number(item.block||0)*2+Number(item.blockChance||0)*2;
 const weapon=item.slot==='weapon'&&['Wand','Staff'].includes(item.subtype)&&profile.name!=='Daring'?-9:0;
 return round(s+Number(item.tier||1)*.5+(r[item.rarity]||0)*1.5+weapon);
}
function gearSnapshot(a){
 const items=Object.values(a.state().equip).filter(Boolean);
 return {total:items.length,starter:items.filter(x=>x.startingGear).length,
  rarity:Object.fromEntries([...new Set(items.map(x=>x.rarity))].sort().map(r=>[r,items.filter(x=>x.rarity===r).length])),
  items:items.map(x=>({slot:x.slot,subtype:x.subtype,name:x.name,rarity:x.rarity,tier:x.tier,startingGear:!!x.startingGear}))};
}
// Current v15 graph has no T.path helper; walk its real prerequisites and let
// T.allocate enforce every purchase, point cap, rank and exclusion.
function missingPath(T,progress,target){
 const nodes=new Map(T.NODES.map(x=>[x.id,x]));
 const owned=new Set(progress.nodes),visiting=new Set(),path=[];
 function add(id){
  if(owned.has(id)||path.includes(id))return true;
  const n=nodes.get(id);
  if(!n||visiting.has(id)||n.excludes?.some(x=>owned.has(x)||path.includes(x)))return false;
  visiting.add(id);
  for(const key of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!add(key)){visiting.delete(id);return false;}
  if(n.anyRequires?.length&&!n.anyRequires.some(x=>owned.has(x)||path.includes(x))){
   const candidate=n.anyRequires.find(x=>add(x));
   if(!candidate){visiting.delete(id);return false;}
  }
  visiting.delete(id);path.push(id);return true;
 }
 return add(target)?path:null;
}
function spendEarnedTalents(a,profile){
 const T=a.talents,s=a.state(),before=s.automaticTalents;
 if(!T.valid(before))throw Error('Invalid natural talent account before spending');
 let progress=before;const bought=[];
 const targets=[...profile.targets,...profile.families.map(x=>'affinity_'+x),...profile.families.map(x=>'root_'+x),'vitality','might','haste'];
 for(let attempts=0;attempts<40&&T.earned(progress)>progress.nodes.length;attempts++){
  let changed=false;
  for(const target of targets){
   const route=missingPath(T,progress,target);if(!route?.length)continue;
   const next=T.allocate(progress,route[0]);
   if(next){progress=next;bought.push(route[0]);changed=true;break;}
  }
  if(!changed){
   const alt=T.NODES.find(n=>!progress.nodes.includes(n.id)&&(!n.family||profile.families.includes(n.family))&&T.allocate(progress,n.id));
   if(!alt)break;
   progress=T.allocate(progress,alt.id);bought.push(alt.id);
  }
 }
 if(!T.valid(progress)||progress.xp!==before.xp)throw Error('Natural talent spending forged XP');
 s.automaticTalents=progress;
 return {bought,earned:T.earned(progress),spent:progress.nodes.length,xp:progress.xp};
}
function equipEarned(a,profile,between=false){
 const actions=[];
 const source=between?a.bag.items().filter(x=>x.kind!=='valuable'):[...a.state().stash];
 // Rank visible native items, re-checking after each actual equip.
 const items=[...source].filter(x=>x?.slot&&x.id).sort((x,y)=>gearScore(y,profile)-gearScore(x,profile));
 for(const item of items){
  const targets=['ring1','ring2'].includes(item.slot)?['ring1','ring2']:[item.slot];
  for(const target of targets){
   const prior=a.state().equip[target],gain=gearScore(item,profile)-gearScore(prior,profile);
   if(gain<2.5)continue;
   if(item.slot==='weapon'&&['Two-Handed','Bow','Staff'].includes(item.subtype)&&a.state().equip.offhand){
    // Do not delete a strong earned shield/secondary weapon to chase a tiny weapon score.
    if(gain<gearScore(a.state().equip.offhand,profile)*.6+5)continue;
   }
   if(a.equip(item.id,target)){actions.push({slot:target,item:item.name,rarity:item.rarity,previous:prior?.name||null,gain:round(gain)});break;}
  }
 }
 return actions;
}
function prepareCamp(a,profile,level){
 const actions={talents:[],equipped:[],bought:[],potions:[],runes:[],soldTreasures:false};
 const s=a.state();
 a.potions.inventory(); // Native initializer: an empty player loadout is legal.
 // All purchases and rewards go through the native economy.
 if(s.pendingRuneReward?.options?.length){
  const options=s.pendingRuneReward.options,choice=options.find(x=>/vitality|ward|aegis/i.test(x.kind||x.name||x.id))||options[0];
  if(a.claimRune(choice.id))actions.runes.push(choice.name||choice.id);
 }
 for(let i=0;i<3&&a.results().review;i++)a.exitResult();
 actions.soldTreasures=!!(s.valuables?.length&&a.treasures.sell());
 actions.equipped.push(...equipEarned(a,profile,false));
 actions.talents.push(...spendEarnedTalents(a,profile).bought);
 if(profile.shop&&a.economyCanAct()){
  if(!s.merchant)a.rollShop();
  const available=s.merchant?.stock||[];
  const candidates=available.map((item,index)=>({item,index,
   gain:gearScore(item,profile)-gearScore(s.equip[item.slot],profile)}))
   .filter(x=>x.item?.goldPrice<=s.gold&&x.gain>8)
   .sort((x,y)=>y.gain-x.gain);
  for(const {item,index} of candidates.slice(0,1)){
   if(a.purchaseNative(index)){actions.bought.push({name:item.name,cost:item.goldPrice});actions.equipped.push(...equipEarned(a,profile,false));}
  }
  if(!s.apothecary)s.apothecary=a.potions.shop(level);
  const stock=s.apothecary.stock||[],wanted=['health','barrier','mana','scout','purifying'];
  for(const kind of wanted){
   if((s.potionSelection||[]).length>=3)break;
   if((s.potionSelection||[]).includes(kind))continue;
   const offer=stock.find(p=>p.kind===kind&&p.price<=s.gold);
   if(offer&&a.potions.buy(offer.id))actions.potions.push({kind,cost:offer.price});
  }
 }
 // Any already-owned dose may be selected via native inventory rules.
 for(const kind of ['health','barrier','mana','scout']){
  if((s.potionSelection||[]).length>=3)break;
  if(!(s.potionSelection||[]).includes(kind)&&(s.consumables?.[kind]||0)>0&&a.potions.select(kind))actions.potions.push({kind,owned:true});
 }
 return actions;
}
function choiceRealm(cards,profile,gear){
 const hasUpgrades=gear.starter<=1;
 const wanted=profile.risk===1&&hasUpgrades?1:0;
 const p=cards.map(card=>({card,score:Math.abs(card.risk-wanted)*12+
  Math.max(0,card.risk-wanted)*10+
  (profile.families.includes(card.family)?-3:0)+
  (card.family==='vitality'?-1:0)})).sort((a,b)=>a.score-b.score);
 return p[0].card;
}
function pathLength(card,d,start,dest){
 if(start===dest)return 0;
 const q=[[start,0]],seen=new Set([start]);
 for(const [id,depth] of q){for(const n of I.neighbors(card,d,id)){
  if(n===dest)return depth+1;
  if(!seen.has(n)){seen.add(n);q.push([n,depth+1]);}
 }}
 return Infinity;
}
function selectRoom(c,profile,vitals){
 const g=c.state,d=g.dungeon,card=c.realmMap(),boss=card.nodes.findIndex(n=>n.kind==='boss');
 const selected=[];
 const currentDist=pathLength(card,d,d.current,boss);
 for(let i=0;i<card.nodes.length;i++){
  if(d.cleared.includes(i)||i===d.current)continue;
  const route=c.travelPath(i);if(!route?.length)continue;
  const cost=c.travelCost(route);if(cost>d.steps)continue;
  const known=d.scouted.includes(i)||d.visited.includes(i);
  const type=known?card.nodes[i].kind:'unknown';
  const dist=pathLength(card,d,i,boss);
  const improves=dist<currentDist;
  let score=dist*4+cost*2+(improves?-2:4)+(known?-1:0);
  if(type==='shrine')score-=12;
  if(type==='spring'&&vitals.hp/vitals.maxhp<.8)score-=10;
  if(type==='elite')score+=profile.name==='Daring'?2:9;
  if(type==='event')score-=2;
  if(i===boss){score+=vitals.hp/vitals.maxhp<.6?9:0;score-=d.steps<3?9:0;}
  if(d.steps<dist+2)score+=8;
  selected.push({room:i,score,dist,cost,known,type});
 }
 return selected.sort((a,b)=>a.score-b.score||a.room-b.room)[0]||null;
}
function chooseBoon(offer,profile){
 const ids=offer.ids||[];
 const affinity=profile.families;
 return [...ids].sort((a,b)=>affinity.some(f=>a.includes(f))?-1:affinity.some(f=>b.includes(f))?1:0)[0]||null;
}
function eventOptions(id,v,profile){
 const ratio=v.maxhp? v.hp/v.maxhp:1;
 if(id==='forgotten_reliquary')return ratio>.67?[0,1,2]:[1,2,0];
 if(id==='restless_spring'||id==='traveling_merchant')return ratio<.9?[0,1,2]:[1,2,0];
 if(id==='oracle_of_paths')return [0,2,1];
 if(id==='whispering_idol'||id==='cursed_altar')return [2,1,0];
 return profile.name==='Daring'?[0,2,1]:[2,0,1];
}
function usePotionsBetween(a,profile,history){
 const run=a.potions.supplies?.(); // Historical supplies are read-only; actual doses live in native phase6Run.
 const v=a.vitals(),used=[];
 if(v.maxhp>0&&v.hp/v.maxhp<profile.healAt)for(let i=0;i<3;i++)if(a.potions.use(i)){used.push({slot:i,reason:'low_hp',ratio:round(v.hp/v.maxhp)});break;}
 // Do not manufacture consumable stock or cast in combat; native APIs enforce legality.
 if(used.length)history.push(...used);
 return used;
}
function fightNatural(a,profile,tickLimit){
 const r=a.state().run;
 if(!r||r.status!=='fight')throw Error('Combat entry missing');
 const start=r.hp,first=r.encounterLeader||r.enemy,initial=r.totalMobCount||r.initialMobCount||r.enemies?.length||1;
 let ticks=0,switches=0,minimum=r.maxhp>0?r.hp/r.maxhp:0;
 while(r.status==='fight'&&a.controller().state.stage==='combat'&&r.hp>0&&ticks<tickLimit){
  // A human needs time to notice add waves; target switches are throttled.
  if(ticks%8===0){
   const next=S.selectTarget(r,profile.target);
   if(next&&next.hp>0&&next!==r.enemy){r.enemy=next;r.tEnemy=next.groupClock;switches++;}
  }
  a.tick();ticks++;
  minimum=Math.min(minimum,Math.max(0,r.hp)/(r.maxhp||1));
 }
 const stage=a.controller().state.stage;
 return {
  kind:first?.boss?'boss':first?.miniboss?'elite':'combat',initialEnemies:initial,
  status:r.status,died:r.hp<=0||stage==='failed',
  won:r.status==='cleared'&&stage!=='failed',timedOut:r.status==='fight'&&ticks>=tickLimit,
  seconds:round(ticks*.11),targetSwitches:switches,hpStart:round(start),hpEnd:round(Math.max(0,r.hp)),
  hpMax:round(r.maxhp),minHpPct:round(minimum*100,1),
  damageTaken:Math.round(r.metrics?.damageTaken||0),
  damageDealt:Math.round(r.metrics?.damageDealt||0),
  enemyAbilityCasts:r.metrics?.enemyAbilityCasts||0,
  bossSummons:r.metrics?.bossSummons||0
 };
}
function resolveEvent(a,profile){
 const event=a.events.run()?.event;
 if(!event)return null;
 const v=a.vitals(),opts=eventOptions(event.id,v,profile);
 for(const choice of opts){
  const bag=a.bag.items().filter(i=>i.kind!=='valuable'),unused=bag.at(-1),target=Object.values(a.state().equip).filter(Boolean).at(-1);
  const family=profile.families[0];
  if(a.events.choose(choice,unused?.id,null,family,target?.id))return {event:event.id,choice};
 }
 throw Error('Native event could not resolve: '+event.id);
}
function clearResults(a){
 const c=a.controller();
 for(let i=0;i<3&&(a.state().run?.status==='cleared'||a.results().eventExitPending);i++){
  if(!a.exitResult())break;
 }
 if(c.state.stage==='finished'||c.state.stage==='failed'){
  if(a.state().pendingRuneReward?.options?.length){
   const opts=a.state().pendingRuneReward.options;
   const option=opts.find(x=>/vitality|ward|aegis/i.test(x.id||x.name||''))||opts[0];
   a.claimRune(option.id);
  }
  for(let i=0;i<3&&a.results().review;i++)a.exitResult();
 }
}
function playDungeon(a,level,profile,opts){
 const c=a.controller(),g=c.state;
 if(g.unlocked<level)throw Error('Cannot bypass native unlock from E'+g.unlocked+' to E'+level);
 a.start(level,true);
 if(g.expedition!==level||g.stage!=='choice')throw Error('Native Expedition start rejected at E'+level);
 if(!g.dungeon?.cards?.length)throw Error('Natural Realm Cards were not generated');
 const card=choiceRealm(g.dungeon.cards,profile,gearSnapshot(a));
 c.chooseRealm(card.id);
 const offer=c.offerContracts(a.state().crafting?.learnedRecipes||[]);
 const contract=offer?.ids?.find(x=>['pathfinder','purification','bounty_writ'].includes(x))||null;
 if(offer)c.chooseContract(contract);
 const report={level,realm:card.id,affinity:card.family,risk:card.risk,contract,rooms:[],
  events:[],boons:[],potions:[],equipped:[],xpStart:a.state().automaticTalents.xp,
  goldStart:a.state().gold,stepsStart:g.dungeon.steps,bossReached:false,extracted:false,status:null,error:null};
 for(let iteration=0;iteration<opts.maxRooms&&g.stage==='choice';iteration++){
  clearResults(a);
  if(g.stage!=='choice')break;
  if(g.dungeon.boonOffer){
   const boon=chooseBoon(g.dungeon.boonOffer,profile);
   c.chooseBoon(boon);report.boons.push(boon);continue;
  }
  if(g.dungeon.contractOffer){c.chooseContract(null);continue;}
  report.equipped.push(...equipEarned(a,profile,true));
  if(a.bag.overflow()>0){
   const spare=[...a.bag.items()].filter(x=>x.kind!=='valuable').sort((x,y)=>gearScore(x,profile)-gearScore(y,profile))[0];
   if(spare)a.bag.discard(spare.id);
  }
  const v=a.vitals();
  usePotionsBetween(a,profile,report.potions);
  const current=a.vitals();
  const next=selectRoom(c,profile,current);
  if(!next||current.hp/current.maxhp<profile.retreatAt&&report.rooms.length>0){
   if(a.checkpoint.extract()){report.extracted=true;break;}
   report.error='Could not find a legal next room and native extraction was rejected';break;
  }
  if(!c.visitRoom(next.room,profile.families)){report.error='Native room travel rejected '+next.room;break;}
  if(g.dungeon.boonOffer)continue;
  const node=card.nodes[next.room];
  if(!a.enter()){report.error='Native room entry rejected '+next.room;break;}
  if(a.events.run()?.event){
   const ev=resolveEvent(a,profile);
   report.events.push({room:next.room,...ev});
   clearResults(a);continue;
  }
  if(!a.state().run||a.state().run.status!=='fight'){
   report.error='Entered room without native fight/event at '+next.room;break;
  }
  const fight=fightNatural(a,profile,opts.tickLimit);
  report.rooms.push({room:next.room,roomType:node.kind,...fight});
  if(node.kind==='boss')report.bossReached=true;
  if(fight.timedOut){report.error='Native combat timeout';break;}
  if(fight.died)break;
  clearResults(a);
 }
 if(g.stage==='choice'&&!report.extracted&&!report.error){
  if(a.checkpoint.extract())report.extracted=true;
  else report.error='Iteration cap reached without a legal native extraction';
 }
 clearResults(a);
 report.status=g.stage==='finished'?'victory':g.stage==='failed'?'defeat':report.extracted?'extracted':report.error?'error':g.stage;
 report.xpEnd=a.state().automaticTalents.xp;
 report.xpEarned=report.xpEnd-report.xpStart;
 report.goldEnd=a.state().gold;
 report.stepsEnd=g.dungeon?.steps??null;
 report.gearAfter=gearSnapshot(a);
 report.bossWon=report.status==='victory'&&report.bossReached;
 report.fightsWon=report.rooms.filter(r=>r.won).length;
 report.damageTaken=report.rooms.reduce((n,r)=>n+r.damageTaken,0);
 report.seconds=round(report.rooms.reduce((n,r)=>n+r.seconds,0));
 return report;
}
function simulateAccount(seed,id,opts){
 const profile=PROFILES[id];
 const a=create(seed,undefined,{}, {skipPersistence:true,now:1720000000000+seed});
 const initialGear=gearSnapshot(a);
 if(a.talents.earned(a.state().automaticTalents)!==0||
    !initialGear.items.length||initialGear.items.some(x=>!x.startingGear))
  throw Error('New account must start with native weak equipment and zero earned talents');
 const acc={seed,profile:id,initialGear,startXp:a.state().automaticTalents.xp,
  attempts:[],reached:[1],endLevel:null,stopReason:null};
 let stopped=false;
 for(let level=1;level<=opts.maxLevel&&!stopped;level++){
  if(a.controller().state.unlocked<level){
   acc.stopReason='E'+level+' remains locked (prior Boss not defeated)';
   break;
  }
  if(!acc.reached.includes(level))acc.reached.push(level);
  let cleared=false;
  for(let attempt=1;attempt<=opts.maxAttempts;attempt++){
   let entry={level,attempt,profile:id};
   try{
    const camp=prepareCamp(a,profile,level);
    const before={xp:a.state().automaticTalents.xp,earned:a.talents.earned(a.state().automaticTalents),
     spent:a.state().automaticTalents.nodes.length,gear:gearSnapshot(a),gold:a.state().gold,
     unlocked:a.controller().state.unlocked};
    const encounter=playDungeon(a,level,profile,opts);
    if(encounter.xpEnd<before.xp)throw Error('Native earned XP decreased');
    entry={...entry,camp,before,...encounter,
     after:{xp:a.state().automaticTalents.xp,earned:a.talents.earned(a.state().automaticTalents),
      spent:a.state().automaticTalents.nodes.length,unlocked:a.controller().state.unlocked,
      gold:a.state().gold}};
    if(entry.status==='error'||entry.error){acc.stopReason='Simulator limitation at E'+level+': '+entry.error;stopped=true;}
    if(entry.bossWon){
     if(a.controller().state.unlocked<level+1)throw Error('Native Boss won but next Expedition is not unlocked');
     cleared=true;
    }
   }catch(err){entry.error=err.message;entry.status='error';acc.stopReason='Native runner error at E'+level+': '+err.message;stopped=true;}
   acc.attempts.push(entry);
   if(cleared||stopped)break;
  }
  if(!cleared&&!stopped){acc.stopReason='E'+level+' unbeaten after '+opts.maxAttempts+' native attempts';stopped=true;}
 }
 acc.endLevel=a.controller().state.unlocked;
 acc.xp=a.state().automaticTalents.xp;
 acc.talents=a.state().automaticTalents.nodes;
 acc.finalGear=gearSnapshot(a);
 acc.gold=a.state().gold;acc.fragments=a.state().fragments;
 return acc;
}
function analyze(accounts,opts){
 const levels=[];
 for(let E=1;E<=opts.maxLevel;E++){
  const attempts=accounts.flatMap(a=>a.attempts.filter(x=>x.level===E));
  const reached=accounts.filter(a=>a.reached.includes(E)).length;
  const wins=attempts.filter(a=>a.bossWon).length,deaths=attempts.filter(a=>a.status==='defeat').length;
  const valid=attempts.filter(a=>!a.error&&a.status!=='error');
  levels.push({level:E,accountsReached:reached,attempts:attempts.length,validAttempts:valid.length,
   wins,deaths,extractions:attempts.filter(a=>a.status==='extracted').length,
   errors:attempts.filter(a=>a.status==='error'||a.error).length,
   bossReached:attempts.filter(a=>a.bossReached).length,
   roomsWon:attempts.reduce((n,a)=>n+(a.fightsWon||0),0),
   nativeXpEarned:attempts.reduce((n,a)=>n+(a.xpEarned||0),0),
   potionsUsed:attempts.reduce((n,a)=>n+(a.potions?.length||0),0),
   gearUpgrades:attempts.reduce((n,a)=>n+(a.equipped?.length||0)+(a.camp?.equipped?.length||0),0),
   observations:attempts.length?null:'not_reached; do not infer win rate'});
 }
 return {stage:'9.3',schemaVersion:1,engine:'v0.13 live native account, dungeon and combat runtime',
  source:S.sourceFingerprint().sha256,settings:opts,
  integrity:{
   noFabricatedXp:true,noForcedEquipment:true,noForcedEncounter:true,
   noForcedLevelUnlock:true,noDamageOverride:true,
   policy:'Finite decision heuristics, native UI-equivalent actions; no human simulation claim'
  },limitations:[
   'Profiles are transparent deterministic heuristics, not human observations or reinforcement-learned expert behavior.',
   'A completed E requires a native Boss victory. E levels not unlocked by that account are NOT simulated.',
   'No guaranteed drops, fixed rarity, synthetic starting gear, invented XP or teleporting Boss to first room.',
   'Consumables can only be used between rooms or at native Shrine windows; no mid-combat healing.',
   'The map topology and known/scouted room types guide movement; hidden room types are not read for priority scoring.',
   'No simulated manual dodging, frame-perfect casts, merchant browsing strategy or complex craft optimization.',
   'Limited seeds, attempts and behavior profiles: pilot-only, not statistical balance rates.'
  ],coverage:{accounts:accounts.length,attempts:accounts.reduce((n,a)=>n+a.attempts.length,0),
    errors:accounts.flatMap(a=>a.attempts).filter(x=>x.error||x.status==='error').length,
    completedE8:accounts.filter(a=>a.reached.includes(8)&&a.attempts.some(x=>x.level===8&&x.bossWon)).length},
  levels,accounts};
}
function run(opts=parseArgs()){
 const accounts=[];
 for(const seed of opts.seeds)for(const id of opts.profiles)accounts.push(simulateAccount(seed,id,opts));
 return analyze(accounts,opts);
}
function markdown(data){
 const out=['# Wanderer v0.13 — Stage 9.3: Native progression E1–E8','',
  '**One persistent native account from E1; XP, equipment, rewards, resources and unlocks are never fabricated.**',
  '', 'Source hash: '+data.source,'', '## E1–E8 natural-account pilot','',
  '| E | Accounts reached | Attempts | Wins | Defeats | Extractions | Boss reached | Rooms won | Native XP | Gear changes | Errors |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of data.levels)out.push('| E'+x.level+' | '+x.accountsReached+' | '+x.attempts+' | '+x.wins+
  ' | '+x.deaths+' | '+x.extractions+' | '+x.bossReached+' | '+x.roomsWon+' | '+x.nativeXpEarned+' | '+x.gearUpgrades+' | '+x.errors+' |');
 out.push('','## Account outcomes','');
 for(const a of data.accounts){
  out.push('- '+a.profile+' / seed '+a.seed+': unlocked E'+a.endLevel+'; '+a.attempts.length+' attempts; XP '+a.xp+
   '; talents '+a.talents.length+'; gear '+a.finalGear.total+' pieces ('+a.finalGear.starter+' starter); '+(a.stopReason||'target completed'));
 }
 out.push('','## How to interpret','',
  '- Attempts only happen at an **actually unlocked** Expedition. Unreached E levels are censored and have no win rate.',
  '- Native loot, gear swaps, real XP awards, talent purchases, Contracts, Boon Shrines, event effects, Gold shops and potion usage are tracked without injecting inventory.',
  '- Combat target switching has a reaction delay; map traversal uses native movement and step costs; hidden room types are not peeked for room selection.',
  '- A win requires the real Boss at its natural map location. Extracting saves resources but **does not unlock E+1**.',
  '- The policy is more human-like than synthetic cohorts, but **not** a validated model of how actual players play.',
  '- Review full JSON per account and investigate runtime errors separately from player deaths before balancing.', '');
 return out.join('\n');
}
function main(args=process.argv.slice(2)){
 const opts=parseArgs(args),report=run(opts),dest=path.resolve(process.cwd(),opts.output);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(report));
 console.log('NATURAL_E1_E8='+JSON.stringify({source:report.source,coverage:report.coverage,levels:report.levels,
  accounts:report.accounts.map(a=>({seed:a.seed,profile:a.profile,unlocked:a.endLevel,stop:a.stopReason}))}));
 if(report.coverage.errors)process.exitCode=1;
 return report;
}
module.exports={PROFILES,DEFAULTS,parseArgs,gearScore,gearSnapshot,spendEarnedTalents,equipEarned,
 prepareCamp,choiceRealm,pathLength,selectRoom,chooseBoon,eventOptions,usePotionsBetween,
 fightNatural,resolveEvent,clearResults,playDungeon,simulateAccount,analyze,run,markdown,main};
if(require.main===module)main();
