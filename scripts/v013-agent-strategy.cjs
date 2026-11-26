'use strict';
// Stage 6 agent-only strategy. Pure inference from the player's *owned* gear,
// earned native talents and live visible encounter metadata. No gameplay writes.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=x=>Math.round(x*100)/100;
require('../combat/v013-expedition-foundation.js');
const BOSSES=globalThis.WandererV013ExpeditionFoundation.BOSS_STYLE_BY_AFFINITY;
const FAMILIES=['blood','fury','radiance','aegis','arcane','decay'];
// Derive capabilities from the live graph, never from retired draft passives.
require('../combat/v012-buildcraft.js');
require('../combat/talent-catalog.js');
require('../combat/talent-graph-next.js');
require('../combat/talent-graph-bridge.js');
require('../combat/talent-graph-runtime.js');
const LIVE=globalThis.WandererAutomaticTalents.NODES;
const LIVE_IDS=new Set(LIVE.filter(n=>!n.pending).map(n=>n.id));
const MIXED_SKILLS=new Set(LIVE.filter(n=>!n.pending&&n.kind==='mixed').map(n=>n.id));
function classify({equipment={},talents={},stats={}}={}){
 talents=talents||{};
 const owned=new Set((talents.nodes||[]).map(id=>id.replace(/_rank\d+$/,'')).filter(id=>LIVE_IDS.has(id)));
 const has=id=>owned.has(id);
 const main=equipment.weapon?.subtype||null,offhand=equipment.offhand?.subtype||null;
 const element=talents.element||'arcane';
 const magical=['Staff','Wand'].includes(main),fundedMagic=magical||owned.has('affinity_arcane')&&Number(stats.mana)>0;
 const armor=equipment.armor?.armorType||equipment.armor?.subtype||null;
 let area=0,focus=1,defense=0;const sources=[];
 function add(type,amount,label){if(type==='area')area+=amount;else if(type==='focus')focus+=amount;else defense+=amount;sources.push({kind:type,value:amount,source:label});}
 if(main==='Two-Handed')add('area',2.9,'native two-handed cleave');
 if(main==='Bow')add('area',1.9,'native bow piercing');
 if(main==='Two-Handed'&&has('cleave_mastery'))add('area',1.2,'cleave mastery');
 if(main==='Bow'&&has('bow_pierce'))add('area',.8,'bow pierce');
 if(main==='Daggers'&&has('fan_of_blades'))add('area',2.3,'fan of blades');
 if(main==='Mace'&&has('mace_shockwave'))add('area',1.9,'mace shockwave');
 if(main==='Sword'&&offhand==='Shield'&&has('sword_sweep'))add('area',1.6,'shielded sweep');
 if(fundedMagic&&element==='lightning'&&has('overcharge'))add('area',3.3,'funded chain lightning');
 if(fundedMagic&&element==='lightning'&&has('forked_lightning'))add('area',1.2,'storm mastery chain extension');
 if(fundedMagic&&element==='fire'&&has('fire_spread'))add('area',2.8,'funded wildfire burn');
 if(fundedMagic&&element==='frost'&&has('frost_spread'))add('area',1.9,'funded winter field chill');
 if(has('plague_spread'))add('area',1.6,'on-kill contagion');
 if(has('vital_pulse'))add('area',2.2,'vital pulse');
 if(has('grasping_roots'))add('area',1.8,'grasping roots');
 if(has('ward_echo')&&(offhand==='Orb'||has('affinity_aegis')||has('barrier_pulse')))add('area',1.9,'barrier-enabled ward echo');
 if(has('affinity_decay')&&Number(stats.mana)>0&&!has('carrion_detonation')&&talents.prepared!=='grave_bloom'){
  if(has('contagious_touch')&&has('corrupting_touch'))add('area',2.1,'persistent full-potency Rot contagion');
  if(has('corruption_nova')){add('area',1.9,'shared Overflow pulse');add('focus',1.3,'independent Overflow');}
  if(has('corruption_cycle'))add('focus',2.2,'independent Cycle burst');
  if(has('blightburst'))add('focus',.8,'independent Blight Rot');
 }
 if(has('carrion_detonation')&&has('affinity_blood')&&has('affinity_decay')&&!magical)add('area',2,'charged carrion detonation');
 if(fundedMagic&&element==='arcane'&&has('arcane_nova')&&talents.prepared!=='grave_bloom')add('area',1.8,'arcane infusion nova');
 if(fundedMagic&&element==='frost'&&has('frost_resonance'))add('area',1.2,'frost resonance');
 if(has('grave_bloom')&&talents.prepared==='grave_bloom')add('area',1.6,'prepared grave bloom');
 if(has('single_target_mastery'))add('focus',2.1,'single-target mastery');
 if(fundedMagic&&has('static_focus')&&element==='lightning')add('focus',1.3,'static focus redirects part of chain damage');
 if(fundedMagic&&has('storm_conductor')&&element==='lightning')add('focus',1.4,'storm conductor isolated-target bonus');
 if(fundedMagic&&has('cinder_focus')&&element==='fire')add('focus',1.5,'cinder focus');
 if(fundedMagic&&has('glacial_echo')&&element==='frost')add('focus',1.4,'glacial echo');
 if(has('double_strike'))add('focus',1.2,'double strike');
 if(has('precision'))add('focus',.7,'precision');
 if(has('executioner'))add('focus',1,'executioner');
 if(has('arcane_focus')&&magical)add('focus',.8,'arcane focus');
 if(main==='Daggers'||main==='Sword'||main==='Mace'||main==='Wand')add('focus',.6,'single-target primary weapon');
 if(armor==='Plate')add('defense',2,'plate armor');
 if(offhand==='Shield')add('defense',2,'shield');
 if(offhand==='Orb')add('defense',.8,'orb ward');
 if(offhand==='Charm')add('defense',.7,'charm renewal');
 if(has('guarded_block'))add('defense',1.2,'guarded block');
 if(has('barrier_pulse'))add('defense',1.2,'barrier pulse');
 if(has('runic_shield'))add('defense',1.4,'runic shield');
 if(has('strong_heart'))add('defense',.9,'strong heart');
 if(has('affinity_decay')&&(has('corrupting_touch')||has('blightburst')||has('corruption_cycle')||has('corruption_nova'))){if(has('wasting_curse'))add('defense',.8,'Rot damage reduction');if(has('wither'))add('defense',.5,'Rot attack reduction');}
 if(has('renewal'))add('defense',.8,'renewal');
 if(stats.blockChance>0)add('defense',Math.min(2,stats.blockChance*(stats.blockReduction||.35)/12),'actual Guard chance and strength');
 if(stats.barrierPower>0&&(offhand==='Orb'||has('affinity_aegis')||has('overflowing_life')))add('defense',Math.min(1.2,stats.barrierPower*3),'active Barrier Power');
 if(stats.healingPower>0&&(has('affinity_blood')||has('affinity_radiance')||offhand==='Charm'))add('defense',Math.min(1,stats.healingPower*3),'active Healing Power');
 const areaReady=area>=1.8,focusReady=focus>=2.0;
 const role=areaReady&&focusReady?'hybrid':areaReady?'aoe':focusReady?'single-target':defense>=2?'defensive':'developing';
 // A mixed-Affinity build is not necessarily AoE+single-target. Track both
 // dimensions independently; unlocks alone never imply a working synergy.
 const affinities=FAMILIES.filter(id=>owned.has('affinity_'+id));
 const mixedSkills=[...owned].filter(id=>MIXED_SKILLS.has(id)).sort();
 const preparedMixed=!!(talents.prepared&&mixedSkills.includes(talents.prepared));
 const affinityComposition=affinities.length>=2?'mixed':affinities.length===1?'focused':'unformed';
 const synergyStage=mixedSkills.length?preparedMixed?'prepared-mixed-ability':'mixed-skill-unlocked':
  affinities.length>=2?'dual-affinity-only':'not-yet';
 return {role,area:round(area),focus:round(focus),defense:round(defense),
  areaReady,focusReady,weapon:main,offhand,armor,element,earnedNodes:owned.size,
  affinities,affinityComposition,mixedSkills,synergyStage,preparedMixed,sources,rotCycle:has('corruption_cycle'),rotOverflow:has('corruption_nova'),rotBlight:has('blightburst'),rotContagion:has('contagious_touch')&&has('corrupting_touch')};
}
// Only uses card fields rendered by renderRealmCards: family, risk,
// favoured gear, condition and *one* known omen. Remaining omens are hidden.
function realmPreference(cap,card,visible={}){
 if(!cap)return {score:0,reasons:[]};
 let score=0;const reasons=[];
 function add(points,label){if(!points)return;score+=points;reasons.push({points:round(points),reason:label});}
 const boss=BOSSES[card.family];
 if(boss==='matriarch')add(cap.area*2.1,'adds protect Decay Boss');
 if(boss==='leech')add(cap.area*1.7,'kill blood vessels before sacrifice');
 if(boss==='conductor')add(cap.focus*.8+cap.area*.35,'focus convergence anchor');
 if(boss==='devourer')add(cap.area*1.7+cap.focus*.35,'destroy Gullet fragments before they return');
 if(boss==='guardian')add(cap.focus*.7+cap.defense*.5,'sustain against wards');
 if(boss==='berserker')add(cap.defense*.65+cap.focus*.5,'survive heavy swings');
 // Visible conditions are a mild preference, never privileged knowledge.
 const condition=String(visible.conditionId||'');
 if(/swarm|horde|crowd|reinforc|swarms/i.test(condition))add(cap.area,'visible multi-enemy condition');
 if(/bleed|rot|drain|attrition/i.test(condition))add(cap.defense*.45,'visible attrition condition');
 const favored=card.favoured?.subtype;
 if(favored&&favored===cap.weapon)add(1.5,'favoured equipped weapon type');
 if(favored&&favored===cap.offhand)add(1,'favoured equipped off-hand type');
 // The known omen is used only when exposed on the 3-card selection screen.
 const omen=String(visible.omenId||'');
 if(/retinue|summon|minion|horde/i.test(omen))add(cap.area*.8,'visible summoned adds omen');
 return {score:round(score),reasons,boss,visibleCondition:condition||null,visibleOmen:omen||null};
}
function groupPreference(cap,count,{hpRatio=1,bagItems=0}={}){
 if(!cap||count<=1)return 0;
 // The native game offers extra loot odds for large groups. Do not assume
 // swarms are automatically safe; account for incoming damage and HP.
 const area=cap.area,focus=cap.focus,survival=cap.defense;
 const strength=clamp((area-1.3)/3.5,0,1);
 const pressure=count<=4?6:count<=12?15:26;
 const benefit=count<=4?8:count<=12?25:37;
 const advantage=strength*benefit-pressure*(1-strength)*.35;
 const focusPenalty=count>4?clamp(focus-area,0,4)*2:0;
 const woundedPenalty=hpRatio<.55?count*.9:hpRatio<.72?count*.4:0;
 const riskPenalty=bagItems&&hpRatio<.82?count*.5:0;
 const sturdiness=survival>=3&&hpRatio>.83?2:0;
 return round(advantage-focusPenalty-woundedPenalty-riskPenalty+sturdiness);
}
// Live enemy state is the same information the player sees in the arena.
// No future summon, hidden room, RNG or private health value is predicted.
function selectTarget(run,cap,baseline){
 if(!run||run.status!=='fight'||!run.enemies?.length)return baseline||run?.enemy||null;
 const alive=run.enemies.filter(e=>e?.hp>0);if(!alive.length)return baseline||run.enemy;
 const boss=alive.find(e=>e.boss),elite=alive.find(e=>e.miniboss);
 const adds=alive.filter(e=>!e.boss&&!e.miniboss),minions=adds.filter(e=>e.role==='minion');
 if(boss){
  const style=boss.bossStyle;
  if(style==='leech')return adds.find(e=>e.stage84Minion==='blood')||boss;
  if(style==='conductor')return adds.find(e=>e.stage84Node)||boss;
  if(style==='matriarch'&&adds.filter(e=>e.stage84Minion==='decay').length>=2)
   return adds.find(e=>e.stage84Minion==='decay')||boss;
  // Gullet's living light fragments return and heal the Boss; killing them prevents recovery.
  if(style==='devourer')return adds.filter(e=>e.stage84Minion==='radiance').sort((a,b)=>(a.fragmentReturnAt??Infinity)-(b.fragmentReturnAt??Infinity)||a.hp-b.hp)[0]||boss;
  return boss;
 }
 if(elite){
  // Gravecaller: only ACTUAL native summoned undead sustain Deathbound.
  // Focusing a generic escort wastes boss DPS; even valid summons should
  // become priority only after visible Deathbound pressure mounts.
  const undead=minions.filter(m=>m.stage83Summoned&&m.stage83Summoner==='elite');
  const stacks=Math.max(0,Number(run.deathboundDecay?.stacks)||0);
  if(elite.eliteType==='gravecaller'&&undead.length&&cap?.area<1.8&&stacks>=3)
   return undead[0];
  return elite;
 }
 const current=alive.includes(run.enemy)?run.enemy:null;
 // True single-target policy: keep the existing enemy until it dies.
 // A speculative "caster first" switch in each encounter was isolated as
 // the primary cause of Leather Duelist losses (1/4 vs 3/4 E1 clears).
 // Boss mechanics above remain explicit, intentional exceptions.
 // Use visible accumulated stacks and the actual skill cooldown; don't
 // sacrifice a near-dead enemy, boss/elite mechanics, or swap on every tick.
 if(cap?.rotCycle&&run.mp>=10&&current&&current.hp>current.maxhp*.45){
  const eligible=e=>(e.v012Rot||[]).filter(d=>d.remaining>0&&d.damage>0&&(d.primaryPaid||d.spread||d.transferred||d.abilityOrigin)).length;
  const ready=cap.rotCycleReady===true;
  if(ready&&eligible(current)===0){
   const prepared=alive.filter(e=>e!==current&&eligible(e)>=1).sort((a,b)=>eligible(b)-eligible(a)||a.hp-b.hp)[0];
   if(prepared)return prepared;
  }
 }
 if(!cap?.areaReady&&current)return current;
 if(cap?.areaReady){
  // Damage-over-time and secondary hits benefit from stable focus too.
  if(current&&(cap.focusReady||current.hp<=current.maxhp*.45))return current;
  return alive.find(e=>e.role==='tank')||alive.find(e=>e.role==='caster')||current||alive[0];
 }
 return alive.find(e=>e.role==='caster')||alive.find(e=>e.role==='skirmisher')||alive[0];
}
function snapshot(run){
 const out=new Map();
 const active=run?.enemies?.length?run.enemies:run?.enemy?[run.enemy]:[];
 for(const e of [...active,...(run?.groupReserve||[])]){
  if(e&&!out.has(e))out.set(e,{hp:Math.max(0,e.hp||0),barrier:Math.max(0,e.barrier||0),
   role:e.boss?'boss':e.miniboss?'elite':e.role==='minion'?'minion':'normal'});
 }
 return out;
}
function changes(before,after,focused){
 const roles={boss:0,elite:0,minion:0,normal:0},wards={boss:0,elite:0,minion:0,normal:0};
 const healthGained={boss:0,elite:0,minion:0,normal:0},wardGained={boss:0,elite:0,minion:0,normal:0};
 let nonFocusedHp=0,newEnemies=0,disappeared=0;
 for(const [enemy,prior]of before){
  // The runtime can remove a defeated enemy from the active/reserve arrays
  // within the same native tick. Its object still carries its observed final
  // HP. Account for this instead of silently losing lethal secondary hits.
  const end=after.get(enemy)||{hp:Math.max(0,enemy.hp||0),barrier:Math.max(0,enemy.barrier||0)};
  if(!after.has(enemy))disappeared++;
  const lost=Math.max(0,prior.hp-end.hp),ward=Math.max(0,prior.barrier-end.barrier);
  roles[prior.role]+=lost;wards[prior.role]+=ward;
  healthGained[prior.role]+=Math.max(0,end.hp-prior.hp);wardGained[prior.role]+=Math.max(0,end.barrier-prior.barrier);
  if(enemy!==focused)nonFocusedHp+=lost;
 }
 for(const enemy of after.keys())if(!before.has(enemy))newEnemies++;
 return {roles,wards,healthGained,wardGained,nonFocusedHp,newEnemies,disappeared};
}
// Diagnostic data only: never used in target selection or combat.
function combatTracePoint(run,tick,stage){
 const active=run?.enemies?.length?run.enemies:run?.enemy?[run.enemy]:[];
 const describe=e=>({name:e.name??null,role:e.role??null,family:e.stage81?.family??e.family??null,
  hp:e.hp??null,maxhp:e.maxhp??null,barrier:e.barrier??0,defense:e.def??e.defense??null,
  ability:e.stage81?.name??null,cycles:e.stage81?.cycle??null,nextAt:e.stage81?.nextAt??null,
  castingUntil:e.stage81?.castingUntil??null});
 return {tick,seconds:run.combatSeconds??0,stage,status:run.status,
  player:{hp:run.hp,maxhp:run.maxhp,barrier:run.barrier??0,mp:run.mp??0},
  damageDealt:run.metrics?.damageDealt??0,damageTaken:run.metrics?.damageTaken??0,
  enemyAbilityCasts:run.metrics?.enemyAbilityCasts??0,
  active:active.filter(Boolean).map(describe),reserve:(run.groupReserve||[]).filter(Boolean).map(describe)};
}
// Conservative opt-in research policy, independent of the technical tick cap.
// Only a stable, visible solo normal enemy; no prediction of hidden waves.
// At least 10 minutes elapsed, last 100+ s <10% max HP net progress,
// and >25% HP remains. No gameplay changes and no automatic human surrender.
function surrenderDecision(trace){
 const end=trace.at(-1),start=trace.slice(0,-1).reverse().find(p=>end&&end.seconds-p.seconds>=100);
 if(!end||!start||end.seconds-trace[0].seconds<600||end.stage!=='combat'||end.status!=='fight'||!(end.player.hp>0))return null;
 const window=trace.filter(p=>p.tick>=start.tick),e=end.active[0],prior=start.active[0];
 if(!e||!prior||!(e.maxhp>0)||window.some(p=>p.active.length!==1||p.reserve.length||p.active[0].name!==e.name||p.active[0].family!==e.family||p.active[0].maxhp!==e.maxhp))return null;
 const progress=(prior.hp-e.hp)/e.maxhp;
 if(e.hp/e.maxhp<=.25||progress>=.10)return null;
 return {reason:'observed_solo_stalemate',seconds:end.seconds,windowSeconds:end.seconds-start.seconds,netHpProgress:progress,remainingHpFraction:e.hp/e.maxhp};
}
module.exports={classify,realmPreference,groupPreference,selectTarget,snapshot,changes,combatTracePoint,surrenderDecision};
