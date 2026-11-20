'use strict';
// Stage 6 agent-only strategy. Pure inference from the player's *owned* gear,
// earned native talents and live visible encounter metadata. No gameplay writes.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=x=>Math.round(x*100)/100;
const BOSSES={blood:'leech',decay:'matriarch',vitality:'devourer',aegis:'guardian',fury:'berserker',magic:'conductor'};
const FAMILIES=['blood','fury','vitality','aegis','magic','decay'];
// Real earned mixed-axis nodes, not the mere intent to buy one in a profile.
const MIXED_SKILLS=new Set(['crimson_rush','reapers_cadence','red_guillotine',
 'fervent_life','redline','fury_recovery','sanctuary','guardians_oath','last_bastion',
 'runic_shield','prismatic_rebound','arcane_bastion','hex_bolt','elemental_blight',
 'grave_bloom','plague_spread','carrion_detonation','septic_wound']);
function classify({equipment={},talents={},build={},stats={}}={}){
 const owned=new Set(talents.nodes||[]),picked=new Set((build.picks||[]).map(x=>typeof x==='string'?x:x?.id));
 const has=id=>owned.has(id)||picked.has(id);
 const main=equipment.weapon?.subtype||null,offhand=equipment.offhand?.subtype||null;
 const element=talents.element||build.element||null;
 const magical=['Staff','Wand'].includes(main);
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
 if(magical&&element==='lightning'&&has('overcharge')&&!has('lightning_focus'))add('area',3.3,'funded chain lightning');
 if(magical&&element==='lightning'&&has('storm_mastery')&&!has('lightning_focus'))add('area',1.2,'storm mastery chain extension');
 if(magical&&element==='fire'&&has('fire_spread'))add('area',2.8,'funded wildfire burn');
 if(magical&&element==='frost'&&has('frost_spread'))add('area',1.9,'funded winter field chill');
 if(has('plague_spread'))add('area',1.6,'on-kill contagion');
 if(has('grave_bloom')&&talents.prepared==='grave_bloom')add('area',1.6,'prepared grave bloom');
 if(has('single_target_mastery'))add('focus',2.1,'single-target mastery');
 if(has('lightning_focus')&&element==='lightning')add('focus',2.1,'focused discharge');
 if(has('fire_focus')&&element==='fire')add('focus',1.5,'smoldering heart');
 if(has('frost_focus')&&element==='frost')add('focus',1.4,'biting cold');
 if(has('rot_focus'))add('focus',1.5,'concentrated corruption');
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
 if(has('renewal'))add('defense',.8,'renewal');
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
  affinities,affinityComposition,mixedSkills,synergyStage,preparedMixed,sources};
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
 if(boss==='devourer')add(cap.focus*1.5-cap.area*.9,'avoid accidental mawbud kills');
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
  // Killing Mawbuds heals Heartroot. Prefer boss and allow incidental AoE
  // rather than deliberately targeting the healing adds.
  return boss;
 }
 if(elite){
  if(elite.eliteType==='gravecaller'&&minions.length&&cap?.area<1.8)
   return minions[0]; // Stop Deathbound by manually focusing summoned undead.
  return elite;
 }
 const current=alive.includes(run.enemy)?run.enemy:null;
 // True single-target policy: keep the existing enemy until it dies.
 // A speculative "caster first" switch in each encounter was isolated as
 // the primary cause of Leather Duelist losses (1/4 vs 3/4 E1 clears).
 // Boss mechanics above remain explicit, intentional exceptions.
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
 for(const e of [...(run?.enemies||[]),...(run?.groupReserve||[])]){
  if(e&&!out.has(e))out.set(e,{hp:Math.max(0,e.hp||0),barrier:Math.max(0,e.barrier||0),
   role:e.boss?'boss':e.miniboss?'elite':e.role==='minion'?'minion':'normal'});
 }
 return out;
}
function changes(before,after,focused){
 const roles={boss:0,elite:0,minion:0,normal:0},wards={boss:0,elite:0,minion:0,normal:0};
 let nonFocusedHp=0,newEnemies=0,disappeared=0;
 for(const [enemy,prior]of before){
  // The runtime can remove a defeated enemy from the active/reserve arrays
  // within the same native tick. Its object still carries its observed final
  // HP. Account for this instead of silently losing lethal secondary hits.
  const end=after.get(enemy)||{hp:Math.max(0,enemy.hp||0),barrier:Math.max(0,enemy.barrier||0)};
  if(!after.has(enemy))disappeared++;
  const lost=Math.max(0,prior.hp-end.hp),ward=Math.max(0,prior.barrier-end.barrier);
  roles[prior.role]+=lost;wards[prior.role]+=ward;
  if(enemy!==focused)nonFocusedHp+=lost;
 }
 for(const enemy of after.keys())if(!before.has(enemy))newEnemies++;
 return {roles,wards,nonFocusedHp,newEnemies,disappeared};
}
module.exports={classify,realmPreference,groupPreference,selectTarget,snapshot,changes};
