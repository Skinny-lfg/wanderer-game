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
require('../economy/v012-loot-rules.js');
const LOOT=globalThis.WandererV012LootRules;
const PROFILES=Object.freeze({
 cautious:{name:'Cautious',risk:0,targets:['strong_heart','guarded_block','renewal','guard','vitality','might'],families:['aegis','vitality'],healAt:.72,retreatAt:.5,target:'mechanics',shop:true},
 balanced:{name:'Balanced',risk:0,targets:['bleeding_edge','deep_cuts','strong_heart','might','vitality'],families:['blood','aegis'],healAt:.53,retreatAt:.34,target:'mechanics',shop:true},
 daring:{name:'Daring',risk:1,targets:['quick_hands','double_strike','bleeding_edge','might','haste'],families:['fury','blood'],healAt:.35,retreatAt:.16,target:'focus',shop:true}
});
const DEFAULTS=Object.freeze({seeds:[9101,9201],profiles:['cautious','balanced'],maxLevel:8,maxAttempts:6,tickLimit:4500,maxRooms:34,output:'reports/v013-stage93-natural-e1-e8.json'});
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
  else if(k==='max-attempts'){v.maxAttempts=Number(value);if(!Number.isInteger(v.maxAttempts)||v.maxAttempts<1||v.maxAttempts>12)throw Error('Max attempts must be 1–12');}
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
 const actions={talents:[],equipped:[],bought:[],potions:[],runes:[],soldTreasures:false,restocks:0};
 const s=a.state();a.potions.inventory();
 if(s.pendingRuneReward?.options?.length){
  const options=s.pendingRuneReward.options;
  const choice=options.find(x=>/vitality|ward|aegis/i.test(x.kind||x.name||x.id))||options[0];
  if(a.claimRune(choice.id))actions.runes.push(choice.name||choice.id);
 }
 for(let i=0;i<3&&a.results().review;i++)a.exitResult();
 actions.soldTreasures=!!(s.valuables?.length&&a.treasures.sell());
 actions.equipped.push(...equipEarned(a,profile,false));
 actions.talents.push(...spendEarnedTalents(a,profile).bought);
 if(profile.shop&&a.economyCanAct()){
  // The game's first Apothecary visit constructs a native 4-item stock. No
  // custom availability odds, injected potions, discounted prices or free Gold.
  if(!s.apothecary)s.apothecary=a.potions.shop(level);
  const manaUseful=(a.baseStats()?.mana||0)>0;
  const priority=['health','ironhide','barrier','scout','trail','purifying','fate',...(manaUseful?['mana','arcane']:[])];
  const owns=kind=>(s.consumables?.[kind]||0)>0;
  function affordable(kind){
   return s.apothecary?.stock?.find(p=>p.kind===kind&&p.price<=s.gold)||null;
  }
  // Prefer an actual Health dose for early progress over marginal merchant
  // equipment. The remaining budget can still improve the permanent loadout.
  for(const kind of priority){
   if((s.potionSelection||[]).length>=3)break;
   if(owns(kind)||s.potionSelection.includes(kind))continue;
   const offer=affordable(kind);
   if(offer&&a.potions.buy(offer.id))actions.potions.push({kind,cost:offer.price,reason:'reserve'});
  }
  // One sensible restock when Gold covers both restock AND the desired dose.
  // In E1 with little money, conserve Gold rather than blindly rerolling.
  if(!owns('health')&&s.apothecary&&s.gold>=s.apothecary.refreshCost+17){
   if(a.potions.reroll()){
    actions.restocks++;
    const heal=affordable('health');
    if(heal&&a.potions.buy(heal.id))actions.potions.push({kind:'health',cost:heal.price,reason:'restock'});
   }
  }
  // Spend spare Gold on permanent upgrade only if the expected item-stat gain
  // outweighs the real opportunity cost of an emergency 14+ Gold potion.
  if(!s.merchant)a.rollShop();
  const reserve=owns('health')?0:14;
  const choices=(s.merchant?.stock||[]).map((item,index)=>({item,index,
   gain:gearScore(item,profile)-gearScore(s.equip[item.slot],profile)}))
   .filter(x=>x.item?.goldPrice<=s.gold-reserve&&x.gain>8)
   .sort((x,y)=>y.gain-x.gain);
  for(const {item,index} of choices.slice(0,1)){
   if(a.purchaseNative(index)){
    actions.bought.push({name:item.name,cost:item.goldPrice});
    actions.equipped.push(...equipEarned(a,profile,false));
   }
  }
 }
 // Fill the real 3-slot loadout from already-owned doses. Physical characters
 // do not waste a slot on Mana. We do not synthesize consumable availability.
 const manaUseful=(a.baseStats()?.mana||0)>0;
 const priorities=['health','ironhide','barrier','scout','trail','purifying','fate',...(manaUseful?['mana','arcane']:[])];
 for(const kind of priorities){
  if((s.potionSelection||[]).length>=3)break;
  if(!(s.potionSelection||[]).includes(kind)&&(s.consumables?.[kind]||0)>0&&a.potions.select(kind))
   actions.potions.push({kind,owned:true});
 }
 actions.unspentGold=s.gold;
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
// Distances use traversable graph topology; decisions only inspect details of
// rooms the native map UI currently exposes through travelPath/scouting.
// Heuristic decision utility (not currency, not guaranteed drops). Read the
// exact live loot tables: Elite stage 4 vs ordinary Dungeon stages 1-3.
// Never create items / inspect RNG / force outcomes when evaluating a route.
function eliteOpportunity(game,card,node,profile,vitals,context={}){
 const hpRatio=vitals.maxhp>0?vitals.hp/vitals.maxhp:0;
 const cha=Number.isFinite(context.cha)?context.cha:5;
 const regularStage=Math.min(3,1+Math.floor(Math.max(0,game.history?.length||0)/5));
 const normal=LOOT.v013DungeonWaveOdds(regularStage,cha);
 const elite=LOOT.v013DungeonWaveOdds(4,cha);
 const quality={Common:.35,Uncommon:.85,Rare:1.6,Epic:2.8,Legendary:4.5};
 const weighted=rarities=>Object.entries(rarities).reduce((total,[r,prob])=>
  total+(quality[r]||0)*prob,0);
 const firstRoom=game.dungeon?.cleared?.length===1;
 const eliteDrop=firstRoom?1:elite.drop,normalDrop=firstRoom?1:normal.drop;
 const eliteGear=eliteDrop*weighted(elite.rarities);
 const normalGear=normalDrop*weighted(normal.rarities);
 const equipment=context.equipment?Object.values(context.equipment).filter(Boolean):[];
 const starter=equipment.filter(x=>x.startingGear).length;
 const need=equipment.length?1+Math.min(.65,starter/10):1.25;
 const marked=card.objective===context.room&&!game.dungeon?.foundationState?.bossPreparation?.markedElite;
 const escorts=Number(node.escorts||0);
 const lootUtility=22*need*Math.max(0,eliteGear-normalGear);
 const goldFragmentUtility=6; // Native Elite adds +4 Gold and +3 Fragments before modifiers.
 const favoredUtility=marked?3:0; // 55% favoured equipment slot, conditional on an actual drop.
 const extractionUtility=marked?10:0; // Native settlement: 1 Affinity reagent and 2+2*risk Essence.
 const bossPrepUtility=marked?9:0; // Native -10% Guarded boss attack / -1 higher-risk escort.
 const recent=(context.recentFights||[]).slice(-3).filter(x=>x.hpMax>0);
 const avgDamage=recent.length?recent.reduce((n,x)=>n+
   Math.max(0,(x.hpStart-x.hpEnd)/x.hpMax),0)/recent.length:0;
 // An E1 Elite has no escorts at Guarded risk. It is one stronger enemy,
 // not a 12- or 22-mob swarm; penalize its real potential HP loss rather than
 // classifying all Elites as extremely dangerous.
 const baseThreat=8+escorts*13+(profile.name==='Cautious'?3:profile.name==='Daring'?-2:0);
 const injuryPenalty=hpRatio<.48?40:hpRatio<.64?19:hpRatio<.77?7:0;
 const historyPenalty=avgDamage>.65?11:avgDamage>.4?5:0;
 const threat=baseThreat+injuryPenalty+historyPenalty;
 const benefit=lootUtility+goldFragmentUtility+favoredUtility+extractionUtility+bossPrepUtility;
 return {
  scoreDelta:round(threat-benefit),benefit:round(benefit),threat:round(threat),
  marked,escorts,firstRoom,
  loot:{eliteDrop:round(eliteDrop,4),normalDrop:round(normalDrop,4),
   eliteRarePlus:round((elite.rarities.Rare||0)+(elite.rarities.Epic||0)+(elite.rarities.Legendary||0),4),
   normalRarePlus:round((normal.rarities.Rare||0)+(normal.rarities.Epic||0)+(normal.rarities.Legendary||0),4)},
  breakdown:{lootUtility:round(lootUtility),goldFragmentUtility,favoredUtility,
   extractionUtility,bossPrepUtility,baseThreat,injuryPenalty,historyPenalty}
 };
}
function selectRoom(c,profile,vitals,context={}){
 const g=c.state,d=g.dungeon,card=c.realmMap(),boss=card.nodes.findIndex(n=>n.kind==='boss');
 const hpRatio=vitals.maxhp>0?vitals.hp/vitals.maxhp:0,prep=d.foundationState?.bossPreparation||{};
 const currentDist=pathLength(card,d,d.current,boss),options=[];
 for(let i=0;i<card.nodes.length;i++){
  if(d.cleared.includes(i)||i===d.current)continue;
  const route=c.travelPath(i);if(!route?.length)continue;
  const cost=c.travelCost(route);if(cost>d.steps)continue;
  const visible=!!route.length||d.scouted?.includes(i);
  const n=visible?card.nodes[i]:null,type=n?.kind||'unknown';
  const dist=pathLength(card,d,i,boss);
  const remaining=d.steps-cost;
  const slack=Number.isFinite(dist)?remaining-dist:-10;
  let score=dist*1.35+cost*2+(dist<currentDist?-2:5);
  if(!Number.isFinite(score))score=100;
  if(i!==boss&&slack<0)score+=30+Math.abs(slack)*7;
  else if(i!==boss&&slack<2)score+=8;
  if(type==='combat'){
   const count=Number(n.range?.[1]??n.count??4);
   if(count<=1)score-=18;
   else if(count<=4)score+=profile.name==='Daring'?1:7;
   else if(count<=12)score+=profile.name==='Daring'?12:22;
   else score+=profile.name==='Daring'?22:36;
   if(hpRatio<.65&&count>1)score+=12;
  }
  if(type==='shrine')score-=19;
  if(type==='spring')score-=hpRatio<.8?27:5;
  if(type==='event')score-=3;
  let elite=null;
  if(type==='elite'){
   elite=eliteOpportunity(g,card,n,profile,vitals,{...context,room:i});
   score+=elite.scoreDelta;
   // Reward does not justify spending the last steps on a side corridor
   // that cannot lead to the native Boss.
   if(slack<1)score+=12;
   if(hpRatio<Math.max(.58,profile.retreatAt+.08))score+=22;
  }
  if(type==='boss')score+=hpRatio<.7?16:1;
  const objective=i===card.objective&&!prep.markedElite&&type==='elite';
  const reliquary=i===card.reliquaryRoom&&!prep.reliquary&&n?.event==='forgotten_reliquary';
  if(reliquary)score+=hpRatio>.83&&slack>=0?-15:12;
  if(type==='boss'&&((prep.markedElite||prep.reliquary)&&hpRatio>.75))score-=4;
  if(i!==boss&&d.steps<dist+2)score+=6;
  options.push({room:i,score,dist,cost,slack,known:visible,type,objective,reliquary,elite,
   ...(type==='combat'?{visibleMobRange:n.range||[n.count,n.count]}:{})});
 }
 options.sort((a,b)=>a.score-b.score||a.room-b.room);
 const best=options[0];
 if(best)best.eligibleEliteAlternatives=options.filter(x=>x.type==='elite')
  .map(({room,cost,slack,score,elite})=>({room,cost,slack,score:round(score),...elite}));
 return best||null;
}
function boonScore(id,profile,context={}){
 const hp=context.vitals?.maxhp?context.vitals.hp/context.vitals.maxhp:1;
 const mana=context.vitals?.maxmp??0,steps=context.steps??10;
 const blood=profile.families.includes('blood'),decay=profile.families.includes('decay');
 switch(id){
  case 'bastion_oath':return 28+(hp<.75?9:0)-(profile.name==='Daring'?3:0);
  case 'predators_focus':return 26+(context.bossSoon?5:0);
  case 'blood_tribute':return blood?20+(context.bleedReady?6:0):2;
  case 'rotbound_echo':return decay||context.bleedReady?18:2;
  case 'aetherbound_pact':return mana>0?22:0;
  case 'wayfarers_bargain':return steps<=4&&hp>.7?24:steps<7&&hp>.85?16:-8;
  default:return 0;
 }
}
function chooseBoon(offer,profile,context={}){
 const ids=offer.ids||[];
 return [...ids].sort((a,b)=>boonScore(b,profile,context)-boonScore(a,profile,context)||a.localeCompare(b))[0]||null;
}
function chooseContract(offer,profile,card){
 if(!offer?.ids?.length)return null;
 const rank={pathfinder:24,purification:profile.name==='Cautious'?8:17,
  bounty_writ:profile.name==='Daring'?15:4,oath_of_defiance:5};
 return [...offer.ids].sort((a,b)=>(rank[b]||0)-(rank[a]||0))[0]||null;
}
function eventOptions(id,v,profile,context={}){
 const ratio=v.maxhp?v.hp/v.maxhp:1;
 if(id==='forgotten_reliquary'){
  // Sacrifice 15% Max Health only with sufficient remaining HP and a boss
  // worth weakening; otherwise use the event's native supplies option.
  return ratio>.83&&!context.reliquaryCompleted?[0,1,2]:[1,2,0];
 }
 if(id==='restless_spring'||id==='traveling_merchant')return ratio<.92?[0,1,2]:[1,2,0];
 if(id==='oracle_of_paths')return [0,2,1];
 if(id==='whispering_idol'||id==='cursed_altar')return [2,1,0];
 return profile.name==='Daring'?[0,2,1]:[2,0,1];
}
function potionSlots(a){
 const run=a.events.run?.();
 return run?.started?(run.potions||[]):(a.state().potionSelection||[]).map(kind=>({kind,used:false}));
}
function usePotionKind(a,kind,reason,history,mode){
 const slots=potionSlots(a);
 const index=slots.findIndex(p=>p?.kind===kind&&!p.used);
 if(index<0)return false;
 if(!a.potions.use(index,mode))return false; // Only native legal actions succeed.
 history.push({kind,slot:index,reason});
 return true;
}
function usePotionsBetween(a,profile,history,next){
 const v=a.vitals(),g=a.controller().state,d=g.dungeon;
 if(!next||!d?.realm)return false;
 const ratio=v.maxhp>0?v.hp/v.maxhp:1,mpRatio=v.maxmp?v.mp/v.maxmp:1;
 const dangerous=next.type==='boss'||next.type==='elite'||
  next.type==='combat'&&(Number(next.visibleMobRange?.[1]??4)>3);
 let changed=false;
 // A map Scout is valuable *before* exploring if there is no already visible
 // Shrine. Its native targeting works without knowing hidden room contents.
 const hasVisibleShrine=a.controller().realmMap().boonShrines?.some(i=>
  d.scouted?.includes(i)||a.controller().travelPath(i).length>0);
 if(!hasVisibleShrine&&d.steps>=7&&history.filter(x=>x.kind==='scout').length===0)
  changed=usePotionKind(a,'scout','discover_real_shrine',history,'shrine')||changed;
 if(d.steps<=4&&next.type!=='boss'&&next.slack<1)
  changed=usePotionKind(a,'trail','avoid_exhausting_map_steps',history)||changed;
 // Do not spend healing before entering a zero-damage Shrine / Spring; heal
 // when the next actual threat justifies using an irreplaceable purchased dose.
 if(ratio<profile.healAt&&
   !['shrine','spring'].includes(next.type)&&
   (dangerous||next.type==='combat'||ratio<.4))
  changed=usePotionKind(a,'health','low_hp_before_threat',history)||changed;
 if(mpRatio<.35&&v.maxmp>0&&dangerous)
  changed=usePotionKind(a,'mana','low_mana_before_threat',history)||changed;
 if(dangerous&&ratio>.32){
  const kind=next.type==='boss'?'barrier':'ironhide';
  changed=usePotionKind(a,kind,'prepare_for_'+next.type,history)||changed;
  if(next.type==='boss')changed=usePotionKind(a,'ironhide','boss_defense',history)||changed;
  if(next.type==='boss'&&d.foundationState?.conditionId!=='veiled_passages')
   changed=usePotionKind(a,'purifying','boss_condition_mitigation',history)||changed;
 }
 return changed;
}
function rerollPoorBoonAtShrine(a,offer,profile,history){
 const g=a.controller().state;
 const context={vitals:a.vitals(),steps:g.dungeon.steps,
  bleedReady:a.state().automaticTalents.nodes.includes('affinity_blood')};
 const best=chooseBoon(offer,profile,context);
 if(best&&boonScore(best,profile,context)>=12)return false;
 return usePotionKind(a,'fate','reroll_weak_boon_offer',history);
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
 const g=a.controller().state,prior=g.dungeon?.foundationState?.bossPreparation||{};
 const v=a.vitals(),options=eventOptions(event.id,v,profile,{reliquaryCompleted:prior.reliquary});
 for(const choice of options){
  const bag=a.bag.items().filter(i=>i.kind!=='valuable'),unused=bag.at(-1);
  const target=Object.values(a.state().equip).filter(Boolean).at(-1);
  const family=profile.families[0],hpBefore=v.hp;
  if(a.events.choose(choice,unused?.id,null,family,target?.id))
   return {event:event.id,choice,hpBefore:round(hpBefore),hpAfter:round(a.vitals().hp),
    reliquaryCompleted:!!g.dungeon?.foundationState?.bossPreparation?.reliquary};
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
 const contract=chooseContract(offer,profile,card);
 if(offer)c.chooseContract(contract);
 const report={level,realm:card.id,affinity:card.family,risk:card.risk,contract,rooms:[],
  events:[],boons:[],potions:[],equipped:[],decisions:[],
  xpStart:a.state().automaticTalents.xp,goldStart:a.state().gold,
  stepsStart:g.dungeon.steps,bossReached:false,extracted:false,status:null,error:null,
  prepAtBoss:null,prepFinal:null};
 for(let iteration=0;iteration<opts.maxRooms&&g.stage==='choice';iteration++){
  clearResults(a);
  if(g.stage!=='choice')break;
  if(g.dungeon.boonOffer){
   let offer=g.dungeon.boonOffer;
   rerollPoorBoonAtShrine(a,offer,profile,report.potions);
   offer=g.dungeon.boonOffer;
   const context={vitals:a.vitals(),steps:g.dungeon.steps,bossSoon:g.dungeon.steps<=5,
    bleedReady:a.state().automaticTalents.nodes.includes('affinity_blood')};
   const boon=chooseBoon(offer,profile,context);
   c.chooseBoon(boon);
   report.boons.push({id:boon,room:offer.room,score:boonScore(boon,profile,context)});
   continue;
  }
  if(g.dungeon.contractOffer){c.chooseContract(null);continue;}
  report.equipped.push(...equipEarned(a,profile,true));
  // Resolve Bag overflow using native discard (not by deleting stash objects).
  for(let discard=0;discard<10&&a.bag.overflow()>0;discard++){
   const spare=[...a.bag.items()].filter(x=>x.kind!=='valuable')
    .sort((x,y)=>gearScore(x,profile)-gearScore(y,profile))[0];
   if(!spare||!a.bag.discard(spare.id))break;
  }
  let next=selectRoom(c,profile,a.vitals(),{equipment:a.state().equip,
   recentFights:report.rooms,cha:a.baseStats()?.cha??5});
  if(!next&&g.dungeon.steps<=4&&usePotionKind(a,'trail','restore_route_steps',report.potions))
   next=selectRoom(c,profile,a.vitals(),{equipment:a.state().equip,
   recentFights:report.rooms,cha:a.baseStats()?.cha??5});
  if(next){
   usePotionsBetween(a,profile,report.potions,next);
   next=selectRoom(c,profile,a.vitals(),{equipment:a.state().equip,
   recentFights:report.rooms,cha:a.baseStats()?.cha??5}); // Native scouting/step potions can change options.
  }
  const current=a.vitals(),ratio=current.maxhp>0?current.hp/current.maxhp:0;
  const canRecoverWithoutFight=next&&['shrine','spring','event'].includes(next.type);
  const tooInjured=ratio<profile.retreatAt&&report.rooms.length>0&&!canRecoverWithoutFight;
  if(!next||tooInjured){
   report.decisions.push({type:'extract',reason:next?'conserve_HP':'no_legal_path',
    hpRatio:round(ratio),steps:g.dungeon.steps});
   if(a.checkpoint.extract()){report.extracted=true;break;}
   report.error='Native extraction rejected after route or HP decision';break;
  }
  report.decisions.push({type:'move',room:next.room,node:next.type,cost:next.cost,
   visibleMobRange:next.visibleMobRange||null,stepsRemaining:g.dungeon.steps,
   hpRatio:round(ratio),slack:next.slack,objective:next.objective,reliquary:next.reliquary,
   elite:next.elite,eligibleEliteAlternatives:next.eligibleEliteAlternatives});
  if(!c.visitRoom(next.room,profile.families)){report.error='Native room travel rejected '+next.room;break;}
  if(g.dungeon.boonOffer)continue;
  const node=card.nodes[next.room];
  if(!a.enter()){report.error='Native room entry rejected '+next.room;break;}
  if(a.events.run()?.event){
   const event=resolveEvent(a,profile);
   report.events.push({room:next.room,...event});
   clearResults(a);continue;
  }
  if(!a.state().run||a.state().run.status!=='fight'){
   report.error='Entered room without native fight/event at '+next.room;break;
  }
  if(node.kind==='boss'){
   report.bossReached=true;
   report.prepAtBoss=JSON.parse(JSON.stringify(g.dungeon.foundationState?.bossPreparation||{}));
   report.bossInitialModifiers=[...(a.state().run?.bossModifierIds||[])];
   report.bossInitialHP=a.state().run?.enemies?.find(e=>e?.boss)?.maxhp||
    a.state().run?.enemy?.maxhp||null;
  }
  const fight=fightNatural(a,profile,opts.tickLimit);
  const actualDrops=node.kind==='elite'?(a.state().run?.loot||[]).map(item=>
   ({slot:item.slot,rarity:item.rarity,subtype:item.subtype})):[];
  report.rooms.push({room:next.room,roomType:node.kind,...fight,
   ...(node.kind==='elite'?{loot:actualDrops,marked:next.room===card.objective}:{})});
  if(fight.timedOut){report.error='Native combat timeout';break;}
  if(fight.died)break;
  clearResults(a);
 }
 if(g.stage==='choice'&&!report.extracted&&!report.error){
  if(a.checkpoint.extract())report.extracted=true;
  else report.error='Iteration cap reached without a legal native extraction';
 }
 report.prepFinal=JSON.parse(JSON.stringify(g.dungeon?.foundationState?.bossPreparation||{}));
 clearResults(a);
 // Native extraction uses controller.abandon(), marking the session as failed.
 // Trust explicit native extraction success over the controller's terminal flag.
 report.status=g.stage==='finished'?'victory':report.extracted?'extracted':report.error?'error':g.stage==='failed'?'defeat':g.stage;
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
   eligibleEliteDecisions:attempts.reduce((n,a)=>n+
    (a.decisions||[]).filter(x=>x.type==='move'&&x.eligibleEliteAlternatives?.length).length,0),
   eliteFights:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='elite').length,0),
   eliteWins:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='elite'&&x.won).length,0),
   eliteDrops:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='elite')
    .reduce((k,x)=>k+(x.loot?.length||0),0),0),
   nativeXpEarned:attempts.reduce((n,a)=>n+(a.xpEarned||0),0),
   potionsUsed:attempts.reduce((n,a)=>n+(a.potions?.length||0),0),
   boonsSelected:attempts.reduce((n,a)=>n+(a.boons?.length||0),0),
   markedElitePreparations:attempts.filter(a=>a.prepFinal?.markedElite).length,
   reliquaryPreparations:attempts.filter(a=>a.prepFinal?.reliquary).length,
   reachedBossWithPreparation:attempts.filter(a=>a.bossReached&&
    (a.prepAtBoss?.markedElite||a.prepAtBoss?.reliquary)).length,
   gearUpgrades:attempts.reduce((n,a)=>n+(a.equipped?.length||0)+(a.camp?.equipped?.length||0),0),
   observations:attempts.length?null:'not_reached; do not infer win rate'});
 }
 return {stage:'9.4.1',schemaVersion:3,engine:'v0.13 live native account, dungeon and combat runtime',
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
 const out=['# Wanderer v0.13 — Stage 9.4.1: Elite risk/reward decisions E1–E8','',
  '**One persistent native account from E1; XP, equipment, rewards, resources and unlocks are never fabricated.**',
  '', 'Source hash: '+data.source,'', '## E1–E8 natural-account pilot','',
  '| E | Accounts reached | Attempts | Wins | Deaths | Extractions | Boss reached | Prepared bosses | Marked Elites | Elite fights | Elite wins | Elite drops | Reliquaries | Boons | Potions | Rooms won | Native XP | Gear changes | Errors |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of data.levels)out.push('| E'+x.level+' | '+x.accountsReached+' | '+x.attempts+' | '+x.wins+
  ' | '+x.deaths+' | '+x.extractions+' | '+x.bossReached+' | '+x.reachedBossWithPreparation+' | '+x.markedElitePreparations+' | '+x.eliteFights+' | '+x.eliteWins+' | '+x.eliteDrops+' | '+x.reliquaryPreparations+' | '+x.boonsSelected+' | '+x.potionsUsed+' | '+x.roomsWon+' | '+x.nativeXpEarned+' | '+x.gearUpgrades+' | '+x.errors+' |');
 out.push('','## Account outcomes','');
 for(const a of data.accounts){
  out.push('- '+a.profile+' / seed '+a.seed+': unlocked E'+a.endLevel+'; '+a.attempts.length+' attempts; XP '+a.xp+
   '; talents '+a.talents.length+'; gear '+a.finalGear.total+' pieces ('+a.finalGear.starter+' starter); '+(a.stopReason||'target completed'));
 }
 out.push('','## How to interpret','',
  '- Attempts only happen at an **actually unlocked** Expedition. Unreached E levels are censored and have no win rate.',
  '- Native loot, gear swaps, real XP awards, talent purchases, Contracts, Boon Shrines, event effects, Gold shops and potion usage are tracked without injecting inventory.',
  '- Combat target switching has a reaction delay; map traversal uses native movement and step costs; hidden room types are not peeked for room selection.',
  '- Boon decisions are ranked by actual trade-offs, not chosen blindly by Affinity; native Fate rerolls are conditional.',
  '- Native potions are purchased with earned Gold, used by exact kind only at legal map windows, and conserved before safe rooms.',
  '- Elite route scores compare live native 60% loot odds and rarity tables to ordinary rooms, extra Gold/Fragments, Marked Elite rewards and Boss preparation against HP/escort/step risk; they never guarantee a drop.',
  '- Boss preparation is earned via the real marked Elite and Forgotten Reliquary; both are separately counted, including preparation at Boss entry.',
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
 prepareCamp,choiceRealm,pathLength,eliteOpportunity,selectRoom,boonScore,chooseBoon,chooseContract,eventOptions,potionSlots,usePotionKind,usePotionsBetween,rerollPoorBoonAtShrine,
 fightNatural,resolveEvent,clearResults,playDungeon,simulateAccount,analyze,run,markdown,main};
if(require.main===module)main();
