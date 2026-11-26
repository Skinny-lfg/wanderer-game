// Wanderer v0.12 Phase 2 — isolated temporary buildcraft atop the classic combat engine.
// Never persists to profile, alters equipment affinities or imports the prototype simulator.
(function(root){
'use strict';
const FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const elements=['fire','frost','lightning'];
const P=[
 ['blood','bleeding_edge','Bleeding Edge','Hits may inflict Bleed (0.6s internal cooldown).'],
 ['blood','deep_cuts','Deep Cuts','Your Bleed deals 20% more damage per rank.'],
 ['blood','executioner','Executioner','Strike a bleeding foe at 30% HP or less for 150% of one combined Bleed tick (4s cooldown; no consumption).'],
 ['blood','blood_drinker','Blood Drinker','Hits on a bleeding foe heal up to 1.5% maximum HP (4s cooldown).'],
 ['blood','sanguine_fury','Sanguine Fury','Critical hits inflict Bleed; damage against bleeding foes increases by 8%.'],
 ['decay','toxic_touch','Toxic Touch','Hits may apply one Rot stack (1.3s cooldown).'],
 ['decay','virulent_rot','Virulent Rot','Rot ticks deal 18% more damage per rank.'],
 ['decay','wasting_curse','Wasting Curse','Rotted enemies deal 8% less damage per rank.'],
 ['decay','wither','Withering Hex','Rot reduces healing by 35% and direct attack damage by 3% per rank (70% healing cap).'],
 ['decay','blight','Blight','Strike a rotted enemy for a capped corruption burst (7s cooldown).'],
 ['radiance','strong_heart','Strong Heart','Increase maximum Health by 10% per rank.'],
 ['radiance','renewal','Renewal','Recover 0.55% maximum Health per combat second per rank.'],
 ['radiance','last_stand','Last Stand','Survive one lethal hit per Expedition, recovering 6% HP.'],
 ['radiance','second_breath','Second Breath','Recover 2.5% maximum HP after each completed encounter per rank.'],
 ['radiance','life_bloom','Life Bloom','Every combat second restores 0.25% HP and up to 1.5 Mana per rank.'],
 ['aegis','iron_skin','Iron Skin','Increase Defense by 12% per rank.'],
 ['aegis','fortified','Fortified','Reduce incoming damage by 6% per rank.'],
 ['aegis','guarded_block','Guarded Block','Increase Guard Chance with diminishing returns, even without a Shield.'],
 ['aegis','barrier_pulse','Barrier Pulse','Gain Barrier equal to 3% Max HP + 6% Spell Power every 6 combat seconds at rank 1.'],
 ['aegis','retaliation','Retaliation','Absorbed Barrier empowers the next hit by 30% base damage (4s cooldown).'],
 ['fury','quick_hands','Quick Hands','Increase attack speed by 8% per rank.'],
 ['fury','precision','Precision','Increase Critical Chance with diminishing returns per rank (100% total cap).'],
 ['fury','brutal_crit','Brutal Critical','Critical strikes add 12% of base hit damage per rank.'],
 ['fury','double_strike','Double Strike','10% chance per rank for one non-recursive 30% bonus hit.'],
 ['fury','adrenaline','Adrenaline','Critical strikes grant 10% attack speed for 3s (3s cooldown).'],
 ['arcane','arcane_focus','Arcane Focus','Increase Spell Power, including Arcane.'],
 ['arcane','mana_spring','Mana Spring','Increase Mana regeneration by 18% per rank.'],
 ['arcane','efficient_cast','Efficient Casting','Reduce elemental cast cost by 12% per rank.'],
 ['arcane','arcane_echo','Arcane Echo','Every fourth elemental hit echoes for 25% Spell Power (no recursion).'],
 ['arcane','elemental_force','Elemental Force','Increase Magic status potency by 15% per rank.'],
 ['arcane','kindling','Kindling','Fire Burn gains 20% potency per rank.',[],'fire'],
 ['arcane','deep_winter','Deep Winter','Funded Frost casts Chill; chilled foes take a bounded 18% Spell Power burst every 4s. Boss Chill lasts at most 1.2s.',[],'frost'],
 ['arcane','overcharge','Overcharge','Funded Lightning casts bounce up to five times for 60%, 45%, 33%, 23%, then 16% of the primary hit. Each jump leaves a Static Mark that detonates when a later chain revisits. Four player charges discharge; charges persist between Realms.',[],'lightning'],
 ['blood','crimson_rush','Crimson Rush','Critical strikes against bleeding foes deal 15% bonus damage.',['blood','fury']],
 ['decay','hex_bolt','Hex Bolt','Funded spells or Arcane Infusion hits against Rot deal 25% Spell Power plus one Rot tick (3s cooldown).',['decay','arcane']],
 ['radiance','sanctuary','Sanctuary','Recovering Health grants Barrier equal to 20% of the heal.',['radiance','aegis']],
 ['radiance','fervent_life','Fervent Life','Critical strikes restore 2% Max HP + 3% Attack Power; overhealing grants Barrier (4s cooldown).',['radiance','fury']],
 ['aegis','runic_shield','Runic Shield','Funded Magic spells or Arcane Infusion activations grant 2% Max HP + 8% Spell Power as Barrier (3s cooldown).',['aegis','arcane']],
 ['blood','carrion_detonation','Carrion Detonation','Weapon hits charge an enemy affected by Bleed and Rot using actual Health damage. At 150% Attack Power, release a burst equal to 75% of the threshold (35% on the marked foe), spreading weaker Bleed and Rot to active nearby foes. 1.5s cooldown per enemy.',['blood','decay']],
 ['blood','reapers_cadence','Rupture','Attacks against enemies with Bleed and Fury Sunder deal damage equal to two ticks of the strongest Bleed, capped at 3% enemy maximum Health (5s cooldown). Bleed is not consumed.',['blood','fury']],
 ['decay','elemental_blight','Elemental Blight','Fire consumes Rot for damage, Frost extends it, Lightning consumes it for damage, and Arcane deals damage based on active Rot without consuming it (7s cooldown).',['decay','arcane']],
 ['radiance','guardians_oath',"Guardian's Oath",'When your Barrier breaks, restore 4.5% maximum Health once per encounter.',['radiance','aegis']],
 ['radiance','redline','Redline','Below half Health, attacks deal 33% bonus damage every 8s, but you take 10% more damage for 3s.',['radiance','fury']],
 ['aegis','prismatic_rebound','Prismatic Rebound','Barrier absorption charges your next Magic cast, up to 6% Max HP + 10% Spell Power.',['aegis','arcane']],
].map(([family,id,name,description,requires=[],element=null])=>Object.freeze({family,id,name,description,requires,element,max:requires.length||['executioner','blight','last_stand','retaliation'].includes(id)?1:5}));
const descriptions={
 bleeding_edge:'Hits have a 42% base chance to inflict Bleed (+4 percentage points per rank). Bleed deals 16% of the triggering hit including critical scaling per tick, lasts 4s and refreshes all stacks on application (0.6s cooldown; no stack cap).',
 deep_cuts:'Bleed you inflict deals 15% more damage per rank.',
 executioner:'At 30% HP or less, deal 150% of one combined tick of all active Bleed stacks without consuming them (4s cooldown).',
 blood_drinker:'Hits on bleeding foes heal up to 0.8% Max HP at rank 1 (+0.25 percentage points per rank; 4s cooldown). Healing reduction applies.',
 sanguine_fury:'Critical hits inflict Bleed for 14% of the critical-scaled hit per tick and deal 8% direct damage (+2 percentage points per rank; 2.5s cooldown).',
 toxic_touch:'Hits have a 42% base chance to apply Rot (+4 percentage points per rank); spend 4 Mana to apply persistent Rot dealing 4% of base weapon damage plus Spell Power combined per tick (1.3s cooldown; six stacks maximum).',
 virulent_rot:'New Rot stacks deal 15% more damage per rank.',
 wasting_curse:'Rotted enemies deal 4% less damage per rank. Combined damage reduction cannot exceed 28%.',
 wither:'Rotted foes heal 20% less at rank 1 (+10% per rank) and deal 2% less attack damage per rank. Player healing is unaffected.',
 blight:'On hit, spend 8 Mana to apply one persistent Rot stack and deal 38% base hit damage plus 35% Spell Power, capped at 2.5% enemy Max HP (7s cooldown).',
 strong_heart:'Max Health +10% at Rank 1; smaller gains at higher ranks.',
 renewal:'Heal 0.55% Max HP per second at Rank 1; smaller gains at higher ranks. Healing reduction applies.',
 last_stand:'Once per Expedition, survive a lethal hit and recover 6% Max HP.',
 second_breath:'Heal after each completed encounter: 1.5% Max HP at rank 1 (+0.4 percentage points per rank).',
 life_bloom:'Each combat second, restore 0.25% Max HP and 1.5 Mana at rank 1; gains become smaller at higher ranks, up to 0.6% Health and 3.4 Mana.',
 iron_skin:'Defense +12% at Rank 1; smaller gains at higher ranks.',
 fortified:'Reduce incoming damage by 4% per rank, within the combined 28% cap.',
 guarded_block:'Raises Guard Chance, even without a shield. Total Guard Chance cannot exceed 65%; a successful Guard reduces damage according to equipment.',
 barrier_pulse:'Gain Barrier every 6s: 3% Max HP + 6% Spell Power at rank 1 (+0.6% HP and +1.2% Spell Power per rank). Barrier stacks without a maximum and resets between encounters.',
 retaliation:'When Barrier absorbs damage, your next hit deals 30% more base hit damage (4s cooldown).',
 quick_hands:'Attack speed increases by 8% per rank.',
 precision:'Gain Critical Chance with diminishing returns: approximately +5 percentage points at rank 1, up to +19 points asymptotically. Total Critical Chance cannot exceed 100%.',
 brutal_crit:'Critical hits add 12% base damage at Rank 1; smaller gains at higher ranks. Bonus damage cannot trigger passives.',
 double_strike:'Each hit has a 10% chance at Rank 1 to deal one extra hit for 30% base damage; chance gains get smaller at higher ranks. Extra hits cannot trigger passives.',
 adrenaline:'Critical hits grant 10% attack speed at rank 1 (+2.5 percentage points per rank) for 3s (3s cooldown).',
 arcane_focus:'Spell Power +15% at rank 1, including Arcane Infusion; gains decrease at higher ranks.',
 mana_spring:'Mana regeneration +12% at Rank 1; smaller gains at higher ranks.',
 efficient_cast:'Magic casts cost 1 less Mana per rank, down to a minimum of 3.',
 arcane_echo:'Every fourth funded Magic or Arcane Infusion hit echoes for 25% Spell Power (+5 percentage points per rank; no recursive effects).',
 elemental_force:'Funded Magic casts and Arcane Infusion gain 12% power per rank.',
 kindling:'Funded Fire casts apply Burn.',
 deep_winter:'Funded Frost casts Chill. Chilled foes take a Spell Power burst every 4s (18% at rank 1, +3 percentage points per rank; capped at 5% of normal foes’ Max HP or 1.5% of bosses’). Boss Chill lasts at most 1.2s.',
 overcharge:'Funded Lightning casts bounce up to five times for 60%, 45%, 33%, 23%, then 16% of the primary hit. Each jump leaves a Static Mark that detonates when a later chain revisits. Every 4 charges discharge for 32% Spell Power at rank 1 (+6 percentage points per rank), capped at 3.5% of the foe’s Max HP. Charges persist between Realms.'
};
const CATALOG=P.map(p=>Object.freeze({...p,description:descriptions[p.id]||p.description}));
const BY_ID=Object.fromEntries(CATALOG.map(p=>[p.id,p]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function create(){return {version:3,element:null,unlockedFamilies:[],picks:[],cooldowns:Object.create(null),runtime:{frenzyUntil:0,counterBarrier:0,magicHits:0,staticCharges:0,adrenalineUntil:0,lastStand:false,lastSpellAt:-999}};}
function ownedRank(b,id){return b?.picks?.filter(x=>x===id).length||0;}
function rank(b,id){
 const p=BY_ID[id];if(!p)return 0;
 const permanent=b?.runtime?.permanentTalents?.filter(value=>value===id).length||0;
 if(p.element&&p.element!==b?.element)return 0;
 if(p.requires.length){if(permanent)return 1;const pairs=new Set();let count=0;for(const pick of new Set(b?.picks||[])){const q=BY_ID[pick];if(!q?.requires.length)continue;const pair=[...q.requires].sort().join(':');if(pairs.has(pair))continue;pairs.add(pair);if(++count>3)return 0;if(pick===id)return 1;}return 0;}
 const n=ownedRank(b,id)+permanent,echo=b?.runtime?.echo;
 return clamp(n&&echo?.id===id&&echo.remaining>0?n+echo.power:n,0,p.max);
}
// Unified Aegis scaling. Ward Strength is applied only in the combat
// runtime's setBarrier(), never inside the coefficients below.
function barrierAmount(maxHealth,spellPower,healthFraction,spellFraction=0){
 const hp=Math.max(0,Number(maxHealth)||0),sp=Math.max(0,Number(spellPower)||0);
 return Math.max(0,hp*Math.max(0,Number(healthFraction)||0)+sp*Math.max(0,Number(spellFraction)||0));
}
function barrierSpellPower(c){return Math.max(0,Number(c?.power??c?.player?.stats?.spellPower)||0);}
function values(id,r){const t=Math.max(0,r-1),sqrt=Math.sqrt(r);return ({
 bleeding_edge:{chance:.42+.04*t,bleed:.16,icd:.6},deep_cuts:{bleedBonus:.15*r},executioner:{burst:1.5,threshold:.30,icd:4},blood_drinker:{hp:.008+.0025*t,base:.10+.025*t,icd:4},sanguine_fury:{bleed:.14,burst:.08+.02*t,icd:2.5},
 toxic_touch:{chance:.42+.04*t,rot:.065,icd:1.3},virulent_rot:{rotBonus:.15*r},wasting_curse:{reduction:.04*r},wither:{healingReduction:.20+.10*t,reduction:.02*r},blight:{burst:.38,enemyCap:.025,icd:7},
 strong_heart:{maxhp:.10*sqrt},renewal:{heal:Math.min(.0125,.0055*sqrt)},last_stand:{hp:.06,uses:1},second_breath:{heal:.015+.004*t},life_bloom:{heal:Math.min(.006,.0025*sqrt),mana:Math.min(3.4,1.5*sqrt)},
 iron_skin:{defense:.12*sqrt},fortified:{reduction:.04*r},guarded_block:{block:Math.round(24*(1-Math.exp(-r/4)))},barrier_pulse:{barrier:.03+.006*t,spellBarrier:.06+.012*t,icd:6},retaliation:{burst:.30,icd:4},
 quick_hands:{speed:.08*r},precision:{crit:Math.round(19*(1-Math.exp(-r/3)))},brutal_crit:{burst:Math.min(.65,.12*sqrt)},double_strike:{chance:Math.min(.60,.10*sqrt),burst:.30},adrenaline:{speed:.10+.025*t,duration:3,icd:3},
 arcane_focus:{power:.15*sqrt},mana_spring:{regen:.12*sqrt},efficient_cast:{cost:8-r},arcane_echo:{power:.25+.05*t,hits:4},elemental_force:{power:.12*r},kindling:{burn:.15*(1+.15*r)},deep_winter:{burst:.18+.03*t,bossCap:.015,normalCap:.05,icd:4},overcharge:{burst:.32+.06*t,enemyCap:.035,charges:4}
 })[id]||{};}
function specialized(b,id){return b?.runtime?.specializations?.includes(id);}
function bleedDamage(b,amount){return amount*(1+.15*rank(b,'deep_cuts')+(b?.runtime?.talentBonuses?.bleedBonus||0))*(specialized(b,'blood_focus')?1.25:1);}
function elementalPower(b,power){return power*(1+.12*rank(b,'elemental_force'));}
function hasFamily(b,family){return Array.isArray(b?.families)&&b.families.includes(family);}
function ready(b,id,now,seconds){if((b.cooldowns[id]??-1e10)>now)return false;(b.cooldownPeriods??={})[id]=seconds;b.cooldowns[id]=now+seconds;return true;}
function mods(b,base){
 const s={...base},h=rank(b,'strong_heart'),a=rank(b,'iron_skin'),q=rank(b,'quick_hands'),p=rank(b,'precision');
 s.maxhp=Math.round(s.maxhp*(1+.10*Math.sqrt(h)));
 s.defense=Math.round(s.defense*(1+.12*Math.sqrt(a)));
 s.attacksPerSec=Math.min(4.2,s.attacksPerSec*(1+.08*q));
 s.crit=Math.min(100,Math.max(0,(s.crit||0)+Math.round(19*(1-Math.exp(-p/3)))));
 if(b.unlockedFamilies?.includes('arcane')){
  // Do not change s.caster: Staff/Wand keep their original funded-attack path.
  s.mana=Math.max(30,Math.round(s.mana||20+s.int*7+s.manaFlat));
  s.manaRegen=+(Math.max(1.5,s.manaRegen||1.5+s.int*.23)*(1+.12*Math.sqrt(rank(b,'mana_spring')))).toFixed(2);
  s.spellPower=Math.round((s.spellPower||3+s.int*1.9+s.spellFlat)*(1+.15*Math.sqrt(rank(b,'arcane_focus'))));
  s.phase2Magic=true;
 }
 const attackBuff=clamp(Number(b.runtime?.eventAttack)||0,-.15,.15),defenseBuff=clamp(Number(b.runtime?.eventDefense)||0,-.15,.15);
 s.attack=Math.max(1,Math.round(s.attack*(1+attackBuff)));
 s.defense=Math.max(1,Math.round(s.defense*(1+defenseBuff)));
 if(hasFamily(b,'arcane'))s.spellPower=Math.max(1,Math.round(s.spellPower*(1+attackBuff)));
 s.blockChance=Math.min(65,(s.blockChance||0)+Math.round(24*(1-Math.exp(-rank(b,'guarded_block')/4))));
 if(s.blockChance&&!s.blockReduction)s.blockReduction=.35;
 return s;
}
// Legacy in-memory checkpoint compatibility: consume the obsolete bucket once, without re-scaling damage.
function migrateEnemyDots(enemy){
 if(!enemy)return enemy;
 const poison=enemy.dots?.poison;
 if(Array.isArray(poison)&&poison.length){enemy.v012Rot=[...(enemy.v012Rot||[]),...poison.map(s=>({...s,ticks:s.ticks||0}))].slice(0,6);}
 if(enemy.dots)delete enemy.dots.poison;
 delete enemy.poison;delete enemy.poisonStacks;
 return enemy;
}
// Paid main Toxic Touch stacks persist. A Cycle bonus stack shares provenance, not a second paid-action credit.
function primaryPaidRot(d){return d?.primaryPaid===true&&!d.spread&&!d.transferred&&!d.secondaryOrigin&&d.remaining>0&&d.damage>0;}
function burstEligibleRot(d){return d?.remaining>0&&d.damage>0&&(primaryPaidRot(d)||d.spread===true||d.transferred===true||!!d.abilityOrigin); }
function decayState(c){
 const r=c.player,key=c.waveKey??c.enemy;
 if(!r.decayTalentState||r.decayTalentState.wave!==key)r.decayTalentState={wave:key,contagion:0,soul:0,nextNova:6};
 return r.decayTalentState;
}
function decayOwnAoE(b){return !specialized(b,'carrion_detonation')&&!rank(b,'carrion_detonation')&&!(specialized(b,'grave_bloom')&&b.runtime.prepared==='grave_bloom');}
function decayTargets(c){return (c.player.enemies||[c.enemy]).filter(e=>e&&e.hp>0&&!e.stage84Node).slice(0,4);}
function paidRotApplied(b,c,d){
 if(!primaryPaidRot(d)||c.player.hp<=0||c.enemy.hp<=0)return;
 const state=decayState(c),cap=6;
 c.metric?.('decayPrimaryPaidApplications',1);
 if(specialized(b,'contagious_touch')&&decayOwnAoE(b)){
  state.contagion=Math.min(2,state.contagion+1);
  if(state.contagion===2&&(b.cooldowns.contagiousTouch??-1e10)<=c.now){
   const targets=decayTargets(c).filter(t=>t!==c.enemy&&(t.v012Rot||[]).length<cap).slice(0,3);
   if(targets.length&&ready(b,'contagiousTouch',c.now,3)){
    state.contagion=0;activated(b,'contagious_touch');c.metric?.('contagiousTouchActivations',1);
    for(const target of targets){
     target.v012Rot??=[];target.v012Rot.push({damage:d.damage,remaining:specialized(b,'lingering_rot')?6:4,ticks:0,spread:true,secondaryOrigin:'contagious_touch'});c.metric?.('anchorSpreadContagiousTouch',1);c.metric?.('anchorSpreadContagiousTouchPotency',target.v012Rot.at(-1).damage);
     c.metric?.('contagiousTouchSpread',1);
    }
    c.link?.('rot',c.enemy,targets);
   }
  }
 }
 if(specialized(b,'soul_drain')){
  state.soul=Math.min(4,state.soul+1);
  if(state.soul===4&&c.player.mp<c.player.maxmp&&ready(b,'soulDrain',c.now,5)){
   state.soul=0;const before=c.player.mp;c.mana(4);activated(b,'soul_drain');
   c.metric?.('soulDrainActivations',1);c.metric?.('soulDrainMana',Math.max(0,c.player.mp-before));
  }
 }
}
// Reuse the existing Corruption Nova graph id; its visible name is Corruption Overflow.
function corruptionOverflow(b,c){
 if(!specialized(b,'corruption_nova')||!decayOwnAoE(b)||c.player.hp<=0||c.enemy.hp<=0)return;
 const source=c.enemy;
 if((b.cooldowns.corruptionOverflow??-1e10)>c.now)return;
 const targets=decayTargets(c).filter(e=>e!==source&&(e.v012Rot||[]).some(d=>d.remaining>0&&d.damage>0)).slice(0,3);
 const before=c.player.mp;if(!spendDarkMana(c,6))return;
 ready(b,'corruptionOverflow',c.now,4);activated(b,'corruption_nova');c.metric?.('anchorSpreadOverflowCasts',1);applyRot(b,c,rotPotency(c),'ability_overflow');const stacks=(source.v012Rot||[]).filter(burstEligibleRot);if(stacks.length<3){c.metric?.('anchorSpreadOverflowSeedOnly',1);c.metric?.('corruptionOverflowMana',Math.max(0,before-c.player.mp));return;}
 c.metric?.('anchorSpreadOverflowPrepared',stacks.filter(d=>!primaryPaidRot(d)).length);
 c.metric?.('corruptionOverflowActivations',1);c.metric?.('corruptionOverflowMana',Math.max(0,before-c.player.mp));
 const raw=stacks.reduce((n,d)=>n+d.damage,0)*2,hp=source.hp;
 c.damage(raw,'☠ Corruption Overflow');
 const actual=Math.max(0,hp-Math.max(0,source.hp)),budget=Math.floor(actual);
 c.metric?.('anchorSpreadOverflowPrimary',actual);c.metric?.('corruptionOverflowDamage',actual);
 if(targets.length){
  c.metric?.('anchorSpreadOverflowBudget',budget);
  const per=Math.floor(budget/targets.length),rest=budget%targets.length;
  for(const [i,target] of targets.entries()){
   const share=per+(i<rest?1:0),amount=Math.min(share,target.maxhp*(target.boss?.01:target.miniboss?.02:.06));
   if(!(amount>0))continue;
   const dealt=c.talentPulseDamage?c.talentPulseDamage(target,amount,'corruption_nova'):c.secondaryHit?.(target,amount);
   if(Number.isFinite(dealt)&&dealt>0){c.metric?.('anchorSpreadOverflowSecondary',dealt);c.metric?.('corruptionOverflowDamage',dealt);}
   c.metric?.('corruptionOverflowTargets',1);
  }
  c.link?.('rot',source,targets);
 }
}
function rotWeaponBase(c){
 const s=c.player?.stats||{},kind=s.main?.subtype,sp=Math.max(0,Number(s.spellPower??c.power)||0),ap=Math.max(0,Number(s.attack)||0);
 if(!kind)return Math.max(0,Number(c.base)||ap);
 return kind==='Wand'?sp*1.05:kind==='Staff'?sp*1.32:ap*({'Two-Handed':1.70,Mace:1.4,Bow:1.08,Daggers:.80,Sword:1.12}[kind]||1);
}
function rotPotency(c){return .04*(rotWeaponBase(c)+Math.max(0,Number(c.player?.stats?.spellPower??c.power)||0));}
// DoT Power snapshots once, when a new stack is created. Spread and refresh retain that potency.
function dotPotency(amount,stats){return amount*(1+Math.max(0,Number(stats?.dotPower)||0));}
function applyRot(b,c,power,origin=null){
 const e=c.enemy;if(!e||e.hp<=0)return;
 const stacks=e.v012Rot||(e.v012Rot=[]);
 if(origin==='rotguard'&&stacks.length>=6)return;
 if(stacks.length>=6)stacks.shift();
 const primary=origin==='paid_primary_toxic_touch'||origin==='paid_primary_cycle_extra',ability=typeof origin==='string'&&origin.startsWith('ability_');
 const potency=power*(1+.15*rank(b,'virulent_rot')+(b.runtime.talentBonuses?.rotBonus||0));
 const d={ticks:0,damage:dotPotency(primary||ability||origin==='weapon'||origin==='rotguard'?Math.max(0,potency):Math.max(1,Math.round(potency)),c.player?.stats),remaining:primary||ability?4:(specialized(b,'lingering_rot')?6:4),...(primary?{primaryPaid:true}:{}),...(ability?{abilityOrigin:origin}:{}),...(origin==='weapon'?{secondaryOrigin:'weapon'}:{}),...(origin==='rotguard'?{reactive:true}:{})};
 stacks.push(d);if(ability)c.metric?.('anchorSpreadSource_'+origin,1);
 c.log('☠ Rot '+stacks.length+'/6');
 if(origin==='paid_primary_toxic_touch')paidRotApplied(b,c,d);
 if(origin==='paid_primary_cycle_extra')c.metric?.('decayPrimaryPaidExtraStacks',1);
}
function rotguardRetaliate(b,c){
 const e=c.enemy;if(!specialized(b,'rotguard')||!e||e.hp<=0||e.stage84Node||c.player.hp<=0||(e.v012Rot||[]).length>=6||c.now<(e.rotguardNextAt||0)||c.random()>=.30)return false;
 e.rotguardNextAt=c.now+2;
 applyRot(b,c,rotPotency(c)*.5,'rotguard');c.metric?.('rotguardReactiveRot',1);c.trigger?.('rotguard');return true;
}
function corruptionCycle(b,c){
 if(!specialized(b,'corruption_cycle')||c.enemy.hp<=0||c.player.hp<=0||(b.cooldowns.corruptionCycle??-1e10)>c.now)return;
 const before=c.player.mp;if(!spendDarkMana(c,10))return;
 const e=c.enemy,stats=c.player.stats||{},speed=Math.max(.01,Number(stats.attacksPerSec)||.7),cd=Math.max(2.5,Math.min(10,3.5/speed));
 ready(b,'corruptionCycle',c.now,cd);activated(b,'corruption_cycle');
 c.metric?.('anchorSpreadCycleCasts',1);c.metric?.('corruptionCycleMana',Math.max(0,before-c.player.mp));
 for(let i=0;i<2;i++)applyRot(b,c,rotPotency(c),'ability_cycle');
 const stacks=(e.v012Rot||[]).filter(burstEligibleRot);
 if(stacks.length<3){c.metric?.('anchorSpreadCycleSeedOnly',1);return;}
 const consumed=stacks.slice(0,3),remove=new Set(consumed);e.v012Rot=e.v012Rot.filter(d=>!remove.has(d));
 c.metric?.('anchorSpreadCycleConsumed',consumed.filter(d=>d.spread||d.transferred).length);
 const remaining=consumed.reduce((n,d)=>n+d.damage*6,0),raw=remaining+.2*Math.max(0,Number(stats.attack??c.base)||0)+.2*Math.max(0,Number(stats.spellPower??c.power)||0),hp=e.hp;
 c.damage(raw,'🦠 Corruption Cycle');
 c.metric?.('corruptionCycleActivations',1);c.metric?.('corruptionCycleConsumedRawRot',remaining);c.metric?.('corruptionCycleRawBurst',raw);c.metric?.('corruptionCycleDamage',Math.max(0,hp-Math.max(0,e.hp)));c.metric?.('corruptionCycleStacksConsumed',consumed.length);
}

// New defensive offense is encounter-local; never stores overheal or Barrier.
function livingForceState(c){
 const r=c.player,key=c.waveKey??c.enemy;
 if(r.livingForceWave!==key){r.livingForceWave=key;r.livingForceCharge=0;}
 return r;
}
function defensivePulse(b,c,id,interval,raw,control=false){
 if(!specialized(b,id)||c.player.hp<=0)return;
 const r=c.player,elapsed=Number(r.combatSeconds??c.now)||0;
 const key=c.waveKey??c.enemy;
 r.defensivePulseClock??={};
 if(r.defensivePulseClock.wave!==key)r.defensivePulseClock={wave:key};
 const clock=r.defensivePulseClock;
 if(clock[id]===undefined)clock[id]=interval;
 if(elapsed+1e-8<clock[id])return;
 // A missed ward pulse is not banked. At most one activation per clock interval.
 clock[id]=(Math.floor(elapsed/interval)+1)*interval;
 if(id==='ward_echo'&&!(r.barrier>0))return;
 const targets=(r.enemies||[c.enemy]).filter(e=>e&&e.hp>0&&!e.stage84Node).slice(0,4);
 if(!targets.length||!(raw>0))return;
 activated(b,id);c.metric?.(id+'Activations',1);
 for(const target of targets){
  const cap=target.maxhp*(target.boss?.005:target.miniboss?.0125:.04);
  const amount=Math.min(raw,cap);if(!(amount>0))continue;
  const actual=c.talentPulseDamage?c.talentPulseDamage(target,amount,id):target===c.enemy?c.damage(amount,id):c.secondaryHit?.(target,amount);
  if(Number.isFinite(actual)&&actual>0)c.metric?.(id+'Damage',actual);
  c.metric?.(id+'Targets',1);
  if(control&&target.hp>0&&!target.boss&&!target.miniboss){
   target.graspingRootsUntil=Math.max(target.graspingRootsUntil||0,c.now+2);
   c.metric?.('grasping_rootsControlled',1);
  }
 }
}
function onHeal(b,c,healed){
 if(healed>0&&specialized(b,'living_force')){
  const r=livingForceState(c),cap=r.maxhp*.05;
  r.livingForceCharge=Math.min(cap,(r.livingForceCharge||0)+healed*.20);
  c.metric?.('livingForceEffectiveHealing',healed);
 }

 if(healed>0&&specialized(b,'overflowing_life'))c.barrier(Math.min(healed*.15,c.player.maxhp*.10));
 if(healed>0&&rank(b,'sanctuary')&&ready(b,'sanctuary',c.now,1)){activated(b,'sanctuary');c.barrier(healed*.20);}
}
function heal(b,c,amount){const healed=c.heal(Math.max(0,amount))||0;if(!c.healTriggersPassives)onHeal(b,c,healed);return healed;}
function activated(b,id){b.runtime.passiveTelemetry??={};const t=b.runtime.passiveTelemetry[id]??={activations:0,combatSeconds:0};t.activations++;return true;}
function spendDarkMana(c,amount){if(c.spendMana)return c.spendMana(amount);if(!Number.isFinite(c.player?.mp)||c.player.mp<amount)return false;c.player.mp-=amount;return true;}
function onSecondaryWeaponStatus(b,c,q=.5,p=.5){
 const e=c.enemy,base=Math.max(0,c.base||0);
 if(!e||e.hp<=0||base<=0)return;
 const br=rank(b,'bleeding_edge'),rr=rank(b,'toxic_touch');
 if(br){
  const v=values('bleeding_edge',br);
  if(c.now>=(e.secondaryBleedReady||0)&&c.random()<v.chance*q){
   c.dot('bleed',base*v.bleed*p);e.secondaryBleedReady=c.now+v.icd;
   const d=e.dots?.bleed?.at(-1);if(d)d.secondaryOrigin='weapon';
   c.metric?.('secondaryBleedApplied',1);
  }
 }
 if(rr){
  const v=values('toxic_touch',rr);
  if(c.now>=(e.secondaryRotReady||0)&&c.random()<v.chance*q&&spendDarkMana(c,4)){
   applyRot(b,c,rotPotency(c)*p,'weapon');e.secondaryRotReady=c.now+v.icd;
   const d=e.v012Rot?.at(-1);if(d)d.secondaryOrigin='weapon';
   c.metric?.('secondaryRotApplied',1);
  }
 }
 if(specialized(b,'affinity_fury')&&e.baseDef>0&&c.now>=(e.nextFurySunder||0)&&c.random()<.15*q){
  const def=e.baseDef,old=e.furySunder||0,n=Math.max(0,Math.min(def*.04*p,def*.20-old,e.def-def*.25));
  if(n>0){e.def-=n;e.furySunder=old+n;e.nextFurySunder=c.now+1;c.metric?.('secondarySunderApplied',1);}
 }
}
function onAttack(b,c){
 if(c.proc||c.extra||c.recursive)return;
 const e=c.enemy,base=Math.max(1,c.base||1),crit=!!c.critical;

 if(specialized(b,'living_force')&&!c.offhand&&e.hp>0){
  const r=livingForceState(c),threshold=r.maxhp*.05;
  if(threshold>0&&r.livingForceCharge>=threshold-1e-8&&ready(b,'livingForce',c.now,4)){
   r.livingForceCharge=0;activated(b,'living_force');
   const amount=Math.min(threshold,e.maxhp*(e.boss?.01:e.miniboss?.02:.05));
   const actual=c.talentPulseDamage?c.talentPulseDamage(e,amount,'living_force'):c.damage(amount,'💚 Living Force');
   c.metric?.('living_forceActivations',1);if(Number.isFinite(actual)&&actual>0)c.metric?.('living_forceDamage',actual);
  }
 }
 if(b.runtime.prepared==='fury_recovery'&&c.player.hp>0&&c.player.hp<c.player.maxhp*.35&&b.runtime.furyRecoveryWave!==(c.waveKey??e)){b.runtime.furyRecoveryWave=c.waveKey??e;b.runtime.furyRecoveryUntil=c.now+4;activated(b,'fury_recovery');heal(b,c,c.player.maxhp*.08);c.log('❤ Fury Recovery');}
 if(specialized(b,'affinity_fury')&&e.baseDef>0&&c.now>=(e.nextFurySunder||0)&&c.random()<.15){const baseDef=e.baseDef,applied=e.furySunder||0,reduction=Math.max(0,Math.min(baseDef*.04,baseDef*.20-applied,e.def-baseDef*.25));if(reduction>0){e.def-=reduction;e.furySunder=applied+reduction;e.nextFurySunder=c.now+1;c.log('⚔ Sunder: enemy Defense reduced.');}}
 if(['battle_tempo','relentless_assault','unchained_fury'].some(id=>specialized(b,id))){b.runtime.battleTempo=Math.min(5,(b.runtime.battleTempo||0)+1);if(specialized(b,'relentless_assault')&&e.furySunder>0&&ready(b,'relentlessAssault',c.now,3))c.damage(base*.20,'🗡 Relentless Assault');if(specialized(b,'unchained_fury')){b.runtime.furyHits=(b.runtime.furyHits||0)+1;if(b.runtime.furyHits%5===0)b.runtime.unchainedUntil=c.now+3;if(b.runtime.unchainedUntil>c.now)c.damage(base*.25,'🔥 Unchained Fury');}}
 if(e.bleedStacks>0&&specialized(b,'crimson_feast')){b.runtime.crimsonHits=(b.runtime.crimsonHits||0)+1;if(b.runtime.crimsonHits%3===0)c.damage(base*.45,'🫀 Third Cut');}
 if(e.bleedStacks>0&&c.player.hp<c.player.maxhp*.5&&specialized(b,'heart_of_carnage')&&ready(b,'heartCarnage',c.now,3))c.damage(base*(e.hp<e.maxhp*.5?.60:.40),'🩸 Heart of Carnage');
 if(b.runtime.specialReprisal&&e.hp>0){b.runtime.specialReprisal=false;c.damage(base*.25,'🛡 Reprisal');}
 if(rank(b,'bleeding_edge')&&(b.cooldowns.bleedEdge??-1e10)<=c.now&&c.random()<values('bleeding_edge',rank(b,'bleeding_edge')).chance&&ready(b,'bleedEdge',c.now,.6)&&activated(b,'bleeding_edge')) c.dot('bleed',(c.bloodCritBase??base)*.16);
 // Blood Pursuit retains the purchased node ID and stat paths.
 if(specialized(b,'sanguine_reserve')&&!c.magical&&!c.offhand&&e.hp>0&&b.runtime.pursuitWave===(c.waveKey??e)&&b.runtime.pursuitUntil>c.now&&b.runtime.pursuitCharges>0){b.runtime.pursuitCharges--;c.dot('bleed',(c.bloodCritBase??base)*.08);c.metric?.('bloodPursuitApplications',1);}
 if(rank(b,'sanguine_fury')&&crit&&ready(b,'sanguineFury',c.now,2.5)&&activated(b,'sanguine_fury')){
  c.dot('bleed',(c.bloodCritBase??base)*.14);c.damage(base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');
 }
 if(rank(b,'executioner')&&e.hp>0&&e.bleedStacks>0&&e.hp<=e.maxhp*.30&&ready(b,'execute',c.now,4)&&activated(b,'executioner'))c.damage((e.dots?.bleed||[]).filter(d=>d.remaining>0).reduce((sum,d)=>sum+d.damage,0)*1.5,'🩸 Execute');
 if(rank(b,'blood_drinker')&&e.bleedStacks>0&&ready(b,'bloodHeal',c.now,4)&&activated(b,'blood_drinker'))heal(b,c,Math.min(c.player.maxhp*values('blood_drinker',rank(b,'blood_drinker')).hp,base*values('blood_drinker',rank(b,'blood_drinker')).base));
 if(e.hp>0&&rank(b,'toxic_touch')&&(b.cooldowns.toxicTouch??-1e10)<=c.now&&c.random()<values('toxic_touch',rank(b,'toxic_touch')).chance&&spendDarkMana(c,4)&&ready(b,'toxicTouch',c.now,1.3)&&activated(b,'toxic_touch')){const potency=rotPotency(c);applyRot(b,c,potency,'paid_primary_toxic_touch'); }
 corruptionOverflow(b,c);
 corruptionCycle(b,c);
 if(e.hp>0&&rank(b,'blight')&&(b.cooldowns.blight??-1e10)<=c.now&&spendDarkMana(c,8)&&ready(b,'blight',c.now,7)&&activated(b,'blight')){applyRot(b,c,rotPotency(c),'ability_blight');c.damage(Math.min(base*.38+Math.max(0,c.power||0)*.35,e.maxhp*.025),'☠ Blight');}
 if(rank(b,'crimson_rush')&&crit&&e.bleedStacks>0&&activated(b,'crimson_rush'))c.damage(base*.15,'🩸 Crimson Rush');
 if(rank(b,'brutal_crit')&&crit&&activated(b,'brutal_crit'))c.damage(base*Math.min(.65,.12*Math.sqrt(rank(b,'brutal_crit'))),'⚔ Brutal Critical');
 if(rank(b,'double_strike')&&!c.suppressDoubleStrike&&c.random()<Math.min(.60,.10*Math.sqrt(rank(b,'double_strike')))&&activated(b,'double_strike'))c.damage(base*.30,'🗡 Extra Strike');
 if(rank(b,'fervent_life')&&crit&&ready(b,'ferventLife',c.now,4)&&activated(b,'fervent_life')){const attack=Number(c.player?.stats?.attack);const amount=c.player.maxhp*.02+(Number.isFinite(attack)?Math.max(0,attack)*.03:0),restorable=amount*(c.healingMultiplier??1),actual=heal(b,c,amount);if(actual<restorable)c.barrier((restorable-actual)*.5);}
 if(rank(b,'adrenaline')&&crit&&ready(b,'adrenaline',c.now,3)&&activated(b,'adrenaline'))b.runtime.adrenalineUntil=c.now+3;
 if(rank(b,'retaliation')&&b.runtime.counterBarrier&&activated(b,'retaliation')){b.runtime.counterBarrier=0;c.damage(base*.30,'🛡 Retaliation');}
 
 if(rank(b,'reapers_cadence')&&e.furySunder>0&&e.dots?.bleed?.length&&ready(b,'reapersCadence',c.now,5)&&activated(b,'reapers_cadence'))c.damage(Math.min(2*Math.max(...e.dots.bleed.map(dot=>dot.damage||0)),e.maxhp*.03),'🩸 Rupture');
 if(b.runtime.prepared==='septic_wound'&&e.dots?.bleed?.length&&e.v012Rot?.length&&ready(b,'reaperFinal',c.now,6)&&activated(b,'septic_wound')){c.damage(Math.min(Math.max(...e.dots.bleed.map(dot=>dot.damage||0))+Math.max(...e.v012Rot.map(dot=>dot.damage||0)),e.maxhp*.04),"☠ Reaper's Cadence");c.trigger?.('septic_wound');}
 if(rank(b,'redline')&&c.player.hp<=c.player.maxhp*.5&&ready(b,'redline',c.now,8)&&activated(b,'redline')){
  c.damage(base*.33,'🩸 Redline');b.runtime.redlineUntil=c.now+3;
 }
}
// Adaptive talents are strictly scoped to the purchased Attunement.
function adaptive(b,id,mode){return magicMode(b)===mode&&specialized(b,id);}
function adaptiveTargets(c){return (c.player.enemies||[c.enemy]).filter(e=>e&&e.hp>0&&!e.stage84Node).slice(0,4);}
function isolated(c){return adaptiveTargets(c).length===1&&!c.player.groupReserve?.length;}
function adaptiveDamage(c,target,raw,id,normal=.04,elite=.015,boss=.0075){
 if(!target||target.hp<=0||target.stage84Node||!(raw>0))return 0;
 const amount=Math.min(raw,target.maxhp*(target.boss?boss:target.miniboss?elite:normal));
 if(!(amount>0))return 0;
 const actual=c.talentPulseDamage?c.talentPulseDamage(target,amount,id):target===c.enemy?c.damage(amount,id):c.secondaryHit?.(target,amount);
 if(Number.isFinite(actual)&&actual>0)c.metric?.(id+'Damage',actual);
 return actual||0;
}
function manaConvergence(b,c){
 if(!adaptive(b,'mana_convergence','arcane')||c.funded!==true||c.proc||c.extra||c.recursive||c.offhand||!(c.player.maxmp>0)||!(c.player.mp<c.player.maxmp*.30)||!ready(b,'manaConvergence',c.now,8))return;
 const before=c.player.mp;c.mana(4);activated(b,'mana_convergence');c.metric?.('mana_convergenceActivations',1);c.metric?.('mana_convergenceMana',Math.max(0,c.player.mp-before));
}
function adaptiveCast(b,c,power,wasChilled,wasBurning){
 const e=c.enemy;if(!e||e.hp<=0)return;
 if(adaptive(b,'frost_resonance','frost')&&wasChilled){
  const targets=adaptiveTargets(c).filter(t=>t!==e&&t.slowTime>0).slice(0,2);
  if(targets.length&&ready(b,'frostResonance',c.now,4)){
   activated(b,'frost_resonance');c.metric?.('frost_resonanceActivations',1);
   for(const target of targets)adaptiveDamage(c,target,power*.25,'frost_resonance');
   c.metric?.('frost_resonanceTargets',targets.length);
  }
 }
 if(adaptive(b,'glacial_echo','frost')&&wasChilled&&ready(b,'glacialEcho',c.now,5)){
  activated(b,'glacial_echo');c.metric?.('glacial_echoActivations',1);adaptiveDamage(c,e,power*.30,'glacial_echo');
 }
 if(adaptive(b,'cinder_focus','fire')&&wasBurning&&isolated(c)&&ready(b,'cinderFocus',c.now,5)){
  const burn=(e.dots?.burn||[]).filter(d=>!d.spread&&!d.secondaryOrigin&&d.remaining>0);
  if(burn.length){activated(b,'cinder_focus');c.metric?.('cinder_focusActivations',1);adaptiveDamage(c,e,Math.max(...burn.map(d=>d.damage)),'cinder_focus',.025,.01,.005);}
 }
 if(adaptive(b,'storm_conductor','lightning')&&isolated(c)&&ready(b,'stormConductor',c.now,5)){
  activated(b,'storm_conductor');c.metric?.('storm_conductorActivations',1);adaptiveDamage(c,e,power*.30,'storm_conductor');
 }
}
function onCast(b,c){
 if(c.proc||c.extra||c.recursive||c.funded!==true||!hasFamily(b,'arcane')||!(elements.includes(b.element)||b.element==='arcane'))return;
 const wasChilled=c.enemy.slowTime>0,wasBurning=(c.enemy.dots?.burn||[]).some(d=>d.remaining>0);manaConvergence(b,c);
 // These advanced elemental choices supply their own trigger when taken alone.
 if(b.element==='fire'&&(specialized(b,'combustion')||specialized(b,'living_inferno')||specialized(b,'fire_spread')||adaptive(b,'cinder_focus','fire')||adaptive(b,'controlled_burn','fire'))&&!c.enemy.dots?.burn?.length&&!rank(b,'kindling')&&!specialized(b,'kindling_flame'))c.dot('burn',Math.max(1,c.power)*.08,{controlledBurn:adaptive(b,'controlled_burn','fire'),primaryOnly:!['combustion','living_inferno','fire_spread'].some(id=>specialized(b,id))});
 if(b.element==='frost'&&(specialized(b,'shatter')||specialized(b,'absolute_winter')||adaptive(b,'frost_resonance','frost')||adaptive(b,'glacial_echo','frost'))&&!(c.enemy.slowTime>0)&&!rank(b,'deep_winter')&&!specialized(b,'deep_chill'))c.chill(c.enemy.boss?1.2:3.5);
 const multiplier=b.element==='fire'&&specialized(b,'living_inferno')&&c.enemy.dots?.burn?.length?1.25:b.element==='frost'&&specialized(b,'absolute_winter')&&c.enemy.slowTime>0?1.2:1;
 const power=elementalPower(b,Math.max(1,c.power))*(c.amp||1)*multiplier;
 const e=c.enemy; b.runtime.magicHits++;
 if(b.element==='arcane'&&specialized(b,'arcane_mastery')&&ready(b,'arcaneMasteryMana',c.now,5))c.mana(2);
 if(b.runtime.prepared==='arcane_bastion'&&b.runtime.arcaneBastionReady&&ready(b,'arcaneBastion',c.now,6)){b.runtime.arcaneBastionReady=false;activated(b,'arcane_bastion');c.damage(power*.30,'⛨ Arcane Bastion');c.barrier(barrierAmount(c.player.maxhp,barrierSpellPower(c),.03,.06));}
 if(b.element==='fire'&&specialized(b,'kindling_flame'))c.dot('burn',power*.08,{controlledBurn:adaptive(b,'controlled_burn','fire')});
 if(adaptive(b,'controlled_burn','fire')&&!rank(b,'kindling')&&!specialized(b,'kindling_flame')&&!(e.dots?.burn||[]).some(d=>d.remaining>0&&!d.spread&&!d.secondaryOrigin))c.dot('burn',power*.08,{controlledBurn:true,primaryOnly:true});
 if(b.element==='fire'&&specialized(b,'combustion')&&e.dots?.burn?.length&&ready(b,'combustion',c.now,4))c.damage(power*.20,'💥 Combustion');
 if(b.element==='frost'&&specialized(b,'shatter')&&e.slowTime>0&&ready(b,'shatter',c.now,4))c.damage(power*.25,'💠 Shatter');
 if(b.element==='frost'&&specialized(b,'deep_chill'))c.chill(e.boss?1.2:Math.min(5,Math.max(3.5,e.slowTime||0)+.5));
 if(b.element==='lightning'&&specialized(b,'static_charge'))c.damage(power*.10,'⚡ Static Charge');
 if(b.element==='lightning'&&specialized(b,'chain_discharge')&&b.runtime.magicHits%4===0)c.damage(power*.35,'🔗 Chain Discharge');
 if(b.element==='fire'&&rank(b,'kindling')&&activated(b,'kindling'))c.dot('burn',power*values('kindling',rank(b,'kindling')).burn,{controlledBurn:adaptive(b,'controlled_burn','fire')});
 else if(b.element==='frost'&&rank(b,'deep_winter')&&activated(b,'deep_winter')){
  if(e.slowTime>0&&ready(b,'winterBurst',c.now,4))c.damage(Math.min(power*values('deep_winter',rank(b,'deep_winter')).burst,e.maxhp*(e.boss?.015:.05)),'❄ Winter Fracture');
  c.chill(e.boss?1.2:Math.min(5,3.5*(c.amp||1)));
 }else if(b.element==='lightning'&&rank(b,'overcharge')&&activated(b,'overcharge')){
  b.runtime.staticCharges=Math.min(4,(b.runtime.staticCharges||0)+1);
  if(b.runtime.staticCharges===4){b.runtime.staticCharges=0;c.damage(Math.min(power*values('overcharge',rank(b,'overcharge')).burst,e.maxhp*.035),'⚡ Static Discharge');}
 }
 if(rank(b,'arcane_echo')&&b.runtime.magicHits%4===0&&activated(b,'arcane_echo'))c.damage(power*values('arcane_echo',rank(b,'arcane_echo')).power,'✨ Arcane Echo');
 if(rank(b,'hex_bolt')&&e.v012Rot?.length&&ready(b,'hexBolt',c.now,3)&&activated(b,'hex_bolt'))c.damage(power*.25+c.enemy.v012Rot.reduce((n,r)=>n+r.damage,0),'☠ Hex Bolt');
 if(rank(b,'runic_shield')&&ready(b,'runicShield',c.now,3)&&activated(b,'runic_shield'))c.barrier(barrierAmount(c.player.maxhp,barrierSpellPower(c),.02,.08));
 if(rank(b,'elemental_blight')&&e.v012Rot?.length&&ready(b,'elementalBlight',c.now,7)&&activated(b,'elemental_blight')){
  if(b.element==='fire'){const rot=e.v012Rot.shift();c.damage(Math.min(power*.32+rot.damage*3,e.maxhp*.032),'🔥 Blight');}
  else if(b.element==='frost'&&!primaryPaidRot(e.v012Rot[0]))e.v012Rot[0].remaining=Math.min(Math.max(0,6-(e.v012Rot[0].ticks||0)),e.v012Rot[0].remaining+2);
  else if(b.element==='lightning'){e.v012Rot.shift();c.damage(Math.min(power*.68,e.maxhp*.035),'⚡ Blight');}
  else if(b.element==='arcane')c.damage(Math.min(power*.20+e.v012Rot.reduce((sum,rot)=>sum+rot.damage,0),e.maxhp*.035),'✨ Arcane Blight');
 }
 if(rank(b,'prismatic_rebound')&&b.runtime.prismaticCharge>0&&activated(b,'prismatic_rebound')){
  c.damage(Math.min(power*.65,b.runtime.prismaticCharge),'💠 Prismatic Rebound');b.runtime.prismaticCharge=0;
 }
 adaptiveCast(b,c,power,wasChilled,wasBurning);
}
function tickRot(b,c){
 const e=migrateEnemyDots(c.enemy);
 if(e.v012Rot?.length){
  const rot=e.v012Rot;
  const baseRot=rot.reduce((sum,s)=>sum+s.damage,0);
  const secondaryRot=rot.reduce((sum,s)=>sum+((s.spread||s.secondaryOrigin)?s.damage:0),0);
  const secondaryFraction=baseRot>0?secondaryRot/baseRot:0;
  const bloomRot=rot.filter(s=>s.secondaryOrigin==='grave_bloom');if(bloomRot.length){c.metric?.('graveBloomRotTicks',bloomRot.length);c.metric?.('graveBloomRotRawTickDamage',bloomRot.reduce((n,s)=>n+s.damage,0));}
  const nodes=b.runtime.specializations||[],incubationRank=nodes.filter(id=>id==='incubation'||id.startsWith('incubation_rank')).length;
  e.incubationTicks=(e.incubationTicks||0)+1;
  let bonus=0;
  if(specialized(b,'plagueheart')&&b.families?.length===1&&hasFamily(b,'decay')&&c.player.hp>0&&e.hp>0&&baseRot>0&&c.random()<.30){
   const state=decayState(c),cost=2+2*rot.length;
   if(state.plagueheartTick!==c.now&&c.player.mp-cost>=.15*c.player.maxmp){
    const before=c.player.mp;if(spendDarkMana(c,cost)){state.plagueheartTick=c.now;bonus=2*baseRot;activated(b,'plagueheart');c.metric?.('decayPrimaryPaidPlagueheartActivations',1);c.metric?.('decayPrimaryPaidPlagueheartMana',Math.max(0,before-c.player.mp));}
   }
  }
  const damage=Math.round(baseRot*(e.incubationTicks%3===0?1+.12*incubationRank:1)+bonus);
  c.metric?.('decayPrimaryPaidRotTicks',1);c.metric?.('decayPrimaryPaidRotStackSum',rot.length);
  if(rot.every(s=>!burstEligibleRot(s)&&s.remaining<=1))e.incubationTicks=0;
  c.metric?.('anchorSpreadExpired',rot.filter(s=>s.spread&&s.remaining<=1&&!burstEligibleRot(s)).length);
 e.v012Rot=rot.map(s=>({...s,remaining:burstEligibleRot(s)?s.remaining:s.remaining-1,ticks:(s.ticks||0)+1})).filter(s=>s.remaining>0);
  if(!e.v012Rot.length)e.carrionCharge=0;
  
  const before=e.hp;c.dotDamage(damage,'☠ Rot',secondaryFraction);if(before>0&&e.hp<=0)e.v012DeathRot=true;c.metric?.('decayPrimaryPaidTotalRotDamage',Math.max(0,before-Math.max(0,e.hp)));
 }
}
function onSecond(b,c){
 b.runtime.passiveTelemetry??={};for(const id of new Set([...b.picks,...(b.runtime.permanentTalents||[])])){if(!rank(b,id))continue;const t=b.runtime.passiveTelemetry[id]??={activations:0,combatSeconds:0};t.combatSeconds++;}
 const e=migrateEnemyDots(c.enemy);if(e.hp>0)tickRot(b,c);
 const recovery=specialized(b,'radiance_recovery')?1.25:specialized(b,'radiance_reserve')?.75:1;
 // Root Radiance and stat-node regeneration are fractional Max HP per second.
 // The 0.35% base cap applies before mutually exclusive Recovery/Reserve multipliers.
 const basicRegenRate=Math.min(.0035,Math.max(0,Number(b.runtime.talentBonuses?.healthRegen)||0));
 if(basicRegenRate>0)heal(b,c,c.player.maxhp*basicRegenRate*recovery);
 if(specialized(b,'living_recovery')&&c.player.hp<c.player.maxhp*.5)heal(b,c,c.player.maxhp*.005);
 if(specialized(b,'heart_of_the_wild')&&c.player.hp<c.player.maxhp*.3&&b.runtime.heartWildWave!==(c.waveKey??c.enemy)){b.runtime.heartWildWave=c.waveKey??c.enemy;heal(b,c,c.player.maxhp*.12);}
 if(rank(b,'renewal')&&activated(b,'renewal'))heal(b,c,c.player.maxhp*values('renewal',rank(b,'renewal')).heal*recovery);
 if(rank(b,'life_bloom')&&activated(b,'life_bloom')){heal(b,c,c.player.maxhp*values('life_bloom',rank(b,'life_bloom')).heal*recovery);c.mana(values('life_bloom',rank(b,'life_bloom')).mana);}
 if(rank(b,'barrier_pulse')&&ready(b,'barrierPulse',c.now,6)&&activated(b,'barrier_pulse')){const v=values('barrier_pulse',rank(b,'barrier_pulse'));c.barrier(barrierAmount(c.player.maxhp,barrierSpellPower(c),v.barrier,v.spellBarrier));}
 // One pulse per interval, at most four living arena enemies, no weapon/status procs.
 defensivePulse(b,c,'vital_pulse',4,c.player.maxhp*.02);
 defensivePulse(b,c,'grasping_roots',8,c.player.maxhp*.015,true);
 defensivePulse(b,c,'ward_echo',4,c.player.maxhp*.01+Math.max(0,Number(c.player.stats?.defense)||0)*.15);
}
function incoming(b,c,raw){
 let reduction=(specialized(b,'steadfast_guard')&&b.runtime.steadfastUntil>c.now?.03*(b.runtime.steadfastStacks||0):0)+.04*rank(b,'fortified')+(.04*rank(b,'wasting_curse')+.02*rank(b,'wither'))*(c.enemy.v012Rot?.length?1:0);
 const vulnerability=b.runtime?.redlineUntil>c.now?1.10:1;return Math.max(1,Math.round(raw*(1-clamp(reduction,0,.28))*vulnerability));
}
function onDefend(b,c,blocked,barrierAbsorbed){
 if(b.runtime.prepared==='arcane_bastion'&&barrierAbsorbed>0)b.runtime.arcaneBastionReady=true;
 if(blocked>0&&specialized(b,'steadfast_guard')){b.runtime.steadfastStacks=Math.min(3,(b.runtime.steadfastUntil>c.now?b.runtime.steadfastStacks||0:0)+1);b.runtime.steadfastUntil=c.now+5;}
 if(specialized(b,'stored_force')){
  const threshold=c.player.maxhp*.25,generated=Math.max(0,blocked+barrierAbsorbed)*.30,before=b.runtime.storedForce||0;
  b.runtime.storedForce=Math.min(threshold,before+generated);
  c.metric?.('storedForceChargeGenerated',generated);c.metric?.('storedForceChargeAccepted',Math.max(0,b.runtime.storedForce-before));
  if(threshold>0&&b.runtime.storedForce>=threshold){
   b.runtime.storedForce=0;activated(b,'stored_force');c.metric?.('storedForceActivations',1);c.metric?.('storedForceRawBurst',threshold);
   if(c.areaDamage)c.areaDamage(threshold,'🔨 Stored Force');else c.damage(threshold,'🔨 Stored Force');
  }
 }
 if(blocked>0&&specialized(b,'aegis_reprisal')&&ready(b,'specialReprisal',c.now,3))b.runtime.specialReprisal=true;
 const broken=c.barrierBroken??(barrierAbsorbed>0&&c.player.barrier<=0);
 if(barrierAbsorbed>0&&rank(b,'retaliation')&&ready(b,'retaliation',c.now,4))b.runtime.counterBarrier=1;
 if(rank(b,'prismatic_rebound')&&barrierAbsorbed>0&&activated(b,'prismatic_rebound'))
  b.runtime.prismaticCharge=Math.min(barrierAmount(c.player.maxhp,barrierSpellPower(c),.06,.10),(b.runtime.prismaticCharge||0)+barrierAbsorbed*.45);
 if(rank(b,'guardians_oath')&&barrierAbsorbed>0&&broken&&b.runtime.guardianWave!==(c.waveKey??c.enemy)&&activated(b,'guardians_oath')){
  b.runtime.guardianWave=c.waveKey??c.enemy;heal(b,c,c.player.maxhp*.045);
 }
}
function onKill(b,c){
 if(specialized(b,'blood_harvest')&&(c.enemy.bleedStacks>0||c.enemy.v012DeathBleed))heal(b,c,c.player.maxhp*.03);
 if(specialized(b,'fury_momentum'))b.runtime.momentumUntil=c.now+4;
 if(specialized(b,'sanguine_reserve')&&(c.enemy.bleedStacks>0||c.enemy.v012DeathBleed)){b.runtime.pursuitWave=c.waveKey??c.enemy;b.runtime.pursuitCharges=2;b.runtime.pursuitUntil=c.now+5;activated(b,'sanguine_reserve');c.metric?.('bloodPursuitKills',1);}
 if(specialized(b,'blood_transfer')){
  const target=c.player.enemies?.find(e=>e!==c.enemy&&e.hp>0),dots=(c.enemy.dots?.bleed||[]).filter(d=>d.remaining>0&&d.damage>0).slice().sort((a,b)=>b.damage-a.damage);
  if(target&&dots.length){
   const copies=dots.map(d=>({damage:Math.floor(d.damage*.5),remaining:4,transferred:true,secondaryOrigin:'blood_transfer'})).filter(d=>d.damage>0);
   if(copies.length){target.dots??={};target.dots.bleed??=[];target.dots.bleed.push(...copies);target.bleedStacks=target.dots.bleed.length;c.synchronizeDots?.(target);
    activated(b,'blood_transfer');c.metric?.('bloodTransferApplications',copies.length);c.metric?.('bloodTransferActivations',1);
    const amount=copies.reduce((sum,d)=>sum+d.damage,0),actual=c.secondaryHit?.(target,amount)||0;
    if(actual>0){c.metric?.('bloodTransferDamage',actual);c.trigger?.('blood_transfer_burst');}
   }
  }
 }else if(c.traits?.includes('blood_transfer')){
  const dot=c.enemy.dots?.bleed?.find(d=>!d.transferred&&!d.spread),target=c.player.enemies?.find(e=>e!==c.enemy&&e.hp>0)||c.player.groupReserve?.[0];
  if(dot&&target){
   target.dots??={};target.dots.bleed??=[];
   {
    const tick=Math.max(1,Math.round(dot.damage*.5));
    target.dots.bleed.push({...dot,damage:tick,remaining:Math.min(3,dot.remaining),transferred:true});
    target.bleedStacks=target.dots.bleed.length;
    c.synchronizeDots?.(target);
    // Bloodshed bursts on a live recipient, but waiting reinforcements only
    // receive the transferred Bleed and cannot be damaged before arrival.
    if(c.player.enemies?.includes(target)&&target.hp>0)
     if((c.secondaryHit?.(target,Math.round(tick*3))||0)>0)c.trigger?.('blood_transfer_burst');
   }
  }
 }
 const key=c.waveKey??c.enemy;if(c.waveComplete!==false&&rank(b,'second_breath')&&b.runtime.lastWaveHeal!==key){b.runtime.lastWaveHeal=key;activated(b,'second_breath');heal(b,c,c.player.maxhp*values('second_breath',rank(b,'second_breath')).heal);}
}
function survive(b,c){if(specialized(b,'unbreakable')&&!b.runtime.unbreakableUsed){b.runtime.unbreakableUsed=true;b.runtime.unbreakableUntil=c.now+5;c.player.hp=1;c.barrier(c.player.maxhp*.20);c.log('🏰 Unbreakable');return true;}if(!rank(b,'last_stand')||b.runtime.lastStand)return false;activated(b,'last_stand');b.runtime.lastStand=true;c.player.hp=Math.max(1,c.player.maxhp*.06);c.log('💚 Last Stand (once per Expedition)');return true;}
function speed(b,now){const adrenaline=b?.runtime?.adrenalineUntil>now?1+values('adrenaline',rank(b,'adrenaline')).speed:1;return adrenaline*(1+(specialized(b,'battle_tempo')?.03*(b.runtime.battleTempo||0):0))*(b?.runtime?.momentumUntil>now?1.15:1)*(b?.runtime?.furyRecoveryUntil>now?1.12:1)*(b?.runtime?.unbreakableUntil>now?.8:1);}
function enemyHealMultiplier(b,e){return 1-(e.v012Rot?.length&&rank(b,'wither')?values('wither',rank(b,'wither')).healingReduction:0);}
function enemyDefense(b,e){const defense=Math.max(0,Number(e?.def)||0),base=Math.max(0,Number(e?.baseDef)||0),reduction=e?.v012Rot?.length?Math.min(.10,b?.runtime?.talentBonuses?.rotDefense||0):0;return reduction?Math.min(defense,Math.max(base*.25,defense*(1-reduction))):defense;}
function nextCost(b,baseCost=8){return Math.max(Math.min(3,baseCost),baseCost-rank(b,'efficient_cast'));}
function resetWave(b,e){e.v012Rot=[];e.v012Shock=0;}
function canCast(b){return !!b&&!!b.element&&(b.runtime?.permanentBuild&&b.unlockedFamilies?.includes('arcane')||['kindling','deep_winter','overcharge','arcane_focus','arcane_echo','hex_bolt','elemental_blight','prismatic_rebound','runic_shield'].some(id=>rank(b,id)));}
function validate(b){
 if(!b||b.version!==3||!Array.isArray(b.families)||b.families.length>(b.runtime?.permanentBuild?FAMILIES.length:3)||new Set(b.families).size!==b.families.length||!b.families.every(f=>FAMILIES.includes(f))||b.element!==null&&(!(elements.includes(b.element)||b.element==='arcane')||!hasFamily(b,'arcane'))||!Array.isArray(b.picks)||b.picks.length>20)throw Error('Invalid saved build');
  if(!Array.isArray(b.unlockedFamilies)||new Set(b.unlockedFamilies).size!==b.unlockedFamilies.length||!b.unlockedFamilies.every(f=>hasFamily(b,f)))throw Error('Invalid unlocked affinity');
 for(const id of b.picks){const p=BY_ID[id];if(!p||!hasFamily(b,p.family)||!b.unlockedFamilies.includes(p.family)||p.requires.some(f=>!b.unlockedFamilies.includes(f))||p.element&&p.element!==b.element)throw Error('Invalid saved passive');}
 {const h=[...new Set(b.picks)].map(id=>BY_ID[id]).filter(p=>p?.requires.length);if(h.length>3||new Set(h.map(p=>[...p.requires].sort().join(':'))).size!==h.length)throw Error('Invalid hybrid combinations');}
 if(P.some(p=>ownedRank(b,p.id)>p.max))throw Error('Invalid passive rank');
 if(Object.hasOwn(b,'initialFamily')||Object.hasOwn(b,'initialPassive'))throw Error('Retired passive-draft state');
 if(!b.cooldowns||typeof b.cooldowns!=='object'||!Object.values(b.cooldowns).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)||!b.runtime||typeof b.runtime!=='object'||!['frenzyUntil','magicHits','lastSpellAt'].every(k=>typeof b.runtime[k]==='number'&&Number.isFinite(b.runtime[k]))||typeof b.runtime.lastStand!=='boolean')throw Error('Invalid saved cooldowns');
 if(b.runtime.permanentTalents!==undefined&&(!Array.isArray(b.runtime.permanentTalents)||!b.runtime.permanentTalents.every(id=>BY_ID[id]&&b.runtime.permanentTalents.filter(value=>value===id).length<=BY_ID[id].max)))throw Error('Invalid permanent talents');
 if(Object.hasOwn(b.runtime,'hybridPity'))throw Error('Retired passive-draft pity');
 if(!Number.isInteger(b.runtime.staticCharges)||b.runtime.staticCharges<0||b.runtime.staticCharges>3)throw Error('Invalid Static charges');
 return b;
}
function syncPermanent(b,progress,permanentAffinities=true){if(!b)return;if(!root.WandererAutomaticTalents)throw Error('Permanent talents unavailable');b.runtime.prepared=progress?.nodes?.includes(progress.prepared)?progress.prepared:null;b.runtime.specializations=[...(progress?.nodes||[])];if(permanentAffinities){b.runtime.permanentBuild=true;b.unlockedFamilies=FAMILIES.filter(f=>progress?.nodes?.includes('affinity_'+f));b.families=[...b.unlockedFamilies];b.element=b.unlockedFamilies.includes('arcane')?(progress?.element||'arcane'):null;}const current=progress||root.WandererAutomaticTalents.create(),ids=root.WandererAutomaticTalents.passiveIds(current);b.runtime.talentBonuses=root.WandererAutomaticTalents.bonuses?.(current)||{};if(ids.length)b.runtime.permanentTalents=ids;else delete b.runtime.permanentTalents;}
// Stage 6.4: all Magic attunements retain the funded Arcane Infusion.
// Weapon coefficients avoid double-scaling Wand/Staff's native magical casts.
// Arcane focuses on the enchantment; elemental choices add funded spellcasting.
const INFUSION_RULE=Object.freeze({duration:7,cooldown:6,charges:2,cost:12,arcaneCost:10});
const INFUSION_POWER=Object.freeze({physical:.85,Wand:.35,Staff:.95,arcaneBonus:.10});
function magicMode(b){
 if(!b||!hasFamily(b,'arcane'))return null;
 return specialized(b,'element_choice')?(b.element||'arcane'):'unattuned';
}
function infusionConfig(b,weaponSubtype=null){
 const mode=magicMode(b);
 if(!mode)return null;
 const base=INFUSION_POWER[weaponSubtype]??INFUSION_POWER.physical;
 return {duration:INFUSION_RULE.duration,cooldown:INFUSION_RULE.cooldown,
  charges:INFUSION_RULE.charges,cost:({fire:18,lightning:20,arcane:10,frost:12})[mode]??INFUSION_RULE.cost,
  power:base+(mode==='arcane'?INFUSION_POWER.arcaneBonus:0)};
}
function infusionReady(b,now){
 const r=b?.runtime,cfg=infusionConfig(b);
 if(!cfg||!r||!Number.isFinite(now))return false;
 return !(r.infusionCharges>0&&now<r.infusionExpiresAt)&&now+1e-7>=(r.infusionNextAt??-1);
}
function activateInfusion(b,now){
 const cfg=infusionConfig(b);
 if(!cfg||!infusionReady(b,now))return null;
 Object.assign(b.runtime,{infusionCharges:cfg.charges,infusionExpiresAt:now+cfg.duration,infusionNextAt:now+cfg.cooldown});
 return cfg;
}
function onInfusionActivation(b,c){
 if(!infusionConfig(b)||c.funded!==true||c.magicalAction!=='infusion'||c.proc||c.extra||c.recursive||c.offhand)return;
 manaConvergence(b,c);
 if(rank(b,'runic_shield')&&ready(b,'runicShield',c.now,3)&&activated(b,'runic_shield'))
  c.barrier(barrierAmount(c.player.maxhp,barrierSpellPower(c),.02,.08));
 c.log?.('✨ Arcane Infusion · 2 charges');
}
// Exactly once per actually consumed paid Infusion charge, independent of weapon.
function graveBloomInfusion(b,c){
 if(b?.runtime?.prepared!=='grave_bloom'||!specialized(b,'grave_bloom')||c.proc||c.extra||c.recursive||c.offhand)return 0;
 const e=c.enemy,power=Math.max(0,Number(c.power)||0);if(!e||e.hp<=0||!(power>0))return 0;
 const cap=6;
 for(let i=0;i<2;i++){applyRot(b,c,power*.16);c.metric?.("graveBloomSeeds",1);}
 const rot=(e.v012Rot||[]).filter(d=>d.remaining>0&&d.damage>0);
 if(!rot.length)return 0;
 const total=rot.reduce((n,d)=>n+d.damage,0),limit=e.maxhp*(e.boss?.035:e.miniboss?.07:.22);
 const amount=Math.max(1,Math.round(Math.min(limit,total*1)));
 activated(b,'grave_bloom');c.trigger?.('grave_bloom');c.metric?.('graveBloomActivations',1);c.metric?.('graveBloomStackCount',rot.length);
 const before=e.hp;c.damage(amount,"☠ Grave Bloom");
 c.metric?.('graveBloomBurstDamage',Math.max(0,before-Math.max(0,e.hp)));
 const sources=rot.filter(d=>!d.spread&&!d.transferred).sort((a,b)=>b.damage-a.damage).slice(0,2);
 const targets=(c.player?.enemies||[]).filter(t=>t!==e&&t.hp>0).slice(0,2);
 for(const target of targets){
  target.v012Rot??=[];
  for(const source of sources){
   if(target.v012Rot.length>=cap)break;
   target.v012Rot.push({damage:Math.max(1,Math.round(source.damage*.75)),remaining:Math.min(3,source.remaining),ticks:0,spread:true,secondaryOrigin:"grave_bloom"});
   c.metric?.('graveBloomSpread',1);
  }
  c.link?.('rot',e,[target]);
 }
 return amount;
}
function onInfusionHit(b,c){
 const cfg=infusionConfig(b,c.weaponSubtype),r=b?.runtime;
 if(!cfg||!r||c.offhand||c.proc||c.extra||c.recursive||!c.enemy||c.enemy.hp<=0||!(r.infusionCharges>0)||!Number.isFinite(c.now))return 0;
 if(c.now+1e-7>=r.infusionExpiresAt){r.infusionCharges=0;return 0;}
 r.infusionCharges--;
 const power=Math.max(0,Number(c.power)||0);
 const amount=Math.round(elementalPower(b,power)*cfg.power);
 const bloom=graveBloomInfusion(b,c);
 if(!bloom&&adaptive(b,'arcane_nova','arcane')&&amount>0){
  const targets=adaptiveTargets(c).filter(t=>t!==c.enemy).slice(0,2);
  if(targets.length){activated(b,'arcane_nova');c.metric?.('arcane_novaActivations',1);c.metric?.('arcane_novaTargets',targets.length);for(const t of targets)adaptiveDamage(c,t,amount*.35,'arcane_nova');c.link?.('arcane',c.enemy,targets);}
 }
 const directAmount=amount>0&&c.enemy.hp>0?(c.magicCriticalDamage?c.magicCriticalDamage(amount):amount):0;
 if(directAmount>0)c.damage(directAmount,'✨ Arcane Infusion');
 r.magicInfusionHits=(r.magicInfusionHits||0)+1;
 // A Wand/Staff funded attack already fires the native spell callbacks.
 // The Infusion adds damage, but never duplicates Spell Echo, Decay or Aegis procs.
 if(c.magical)return directAmount;
 const e=c.enemy;
 // Physical main hits receive their own paid-enchantment hybrid triggers.
 // Wand/Staff already handled those callbacks on their native funded cast.
 if(!c.magical&&r.magicInfusionHits%3===0){
  const spellEchoRank=(r.specializations||[]).filter(id=>id==='spell_echo'||/^spell_echo_rank\d+$/.test(id)).length;
  if(spellEchoRank)c.damage(Math.max(1,Math.round(amount*.10*spellEchoRank)),'✨ Spell Echo');

 }
 // Infusion direct damage can crit, but is NOT a second attack, paid action or proc trigger.
 if(rank(b,'arcane_echo')&&r.magicInfusionHits%4===0&&activated(b,'arcane_echo'))
  c.damage(power*values('arcane_echo',rank(b,'arcane_echo')).power,'✨ Arcane Echo');
 if(rank(b,'hex_bolt')&&e.v012Rot?.length&&ready(b,'hexBolt',c.now,3)&&activated(b,'hex_bolt'))
  c.damage(power*.25+e.v012Rot.reduce((n,rot)=>n+rot.damage,0),'☠ Hex Bolt');
 if(rank(b,'elemental_blight')&&e.v012Rot?.length&&ready(b,'elementalBlight',c.now,7)&&activated(b,'elemental_blight'))
  c.damage(Math.min(power*.20+e.v012Rot.reduce((n,rot)=>n+rot.damage,0),e.maxhp*.035),'✨ Arcane Blight');
 if(rank(b,'prismatic_rebound')&&r.prismaticCharge>0&&activated(b,'prismatic_rebound')){
  c.damage(Math.min(power*.65,r.prismaticCharge),'💠 Prismatic Rebound');r.prismaticCharge=0;
 }
 if(r.prepared==='arcane_bastion'&&r.arcaneBastionReady&&ready(b,'arcaneBastion',c.now,6)){
  r.arcaneBastionReady=false;activated(b,'arcane_bastion');
  c.damage(power*.30,'⛨ Arcane Bastion');c.barrier(barrierAmount(c.player.maxhp,barrierSpellPower(c),.03,.06));
 }
 if(magicMode(b)==='arcane'&&specialized(b,'arcane_mastery')&&ready(b,'arcaneMasteryMana',c.now,5))c.mana(2);
 return directAmount;
}
function clear(b){if(!b)return;b.picks.length=0;b.element=null;b.unlockedFamilies=[];b.families=[];b.cooldowns=Object.create(null);b.runtime={frenzyUntil:0,counterBarrier:0,magicHits:0,staticCharges:0,adrenalineUntil:0,lastStand:false,lastSpellAt:-999};}
root.WandererV012Buildcraft=Object.freeze({CATALOG,FAMILIES,ELEMENTS:elements,barrierAmount,create,ownedRank,rank,values,bleedDamage,elementalPower,dotPotency,applyRot,corruptionOverflow,rotguardRetaliate,migrateEnemyDots,mods,onHeal,onSecondaryWeaponStatus,onAttack,onCast,onSecond,tickRot,incoming,onDefend,onKill,survive,speed,enemyHealMultiplier,enemyDefense,nextCost,resetWave,canCast,magicMode,infusionConfig,infusionReady,activateInfusion,onInfusionActivation,onInfusionHit,validate,syncPermanent,clear});
})(globalThis);

