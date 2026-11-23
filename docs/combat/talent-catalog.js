// v15 talent catalogue separated from the retired automatic progression runtime.
// Preserve source node definitions exactly until parity checks allow further pruning.
(function(root){'use strict';
const CORE=Object.freeze([
 {id:'insight',name:'Insight',description:'Gain 2 Spell Power and 0.25 Mana per second.',flatSpell:2,flatRegen:.25},
 {id:'might',name:'Might',description:'Increase Attack and Spell Power by 5%.',attack:.05,spell:.05},
 {id:'precision',name:'Precision',description:'Increase critical chance by 2%.',requires:'might',crit:2},
 {id:'execution',name:'Execution',description:'Increase Attack and Spell Power by 8%.',requires:'precision',attack:.08,spell:.08},
 {id:'vitality',name:'Vitality',description:'Increase maximum Health by 8%.',health:.08},
 {id:'guard',name:'Guard',description:'Increase Defense by 8%.',requires:'vitality',defense:.08},
 {id:'fortitude',name:'Fortitude',description:'Increase maximum Health by 12%.',requires:'guard',health:.12},
 {id:'haste',name:'Haste',description:'Increase attack speed by 5%.',speed:.05},
 {id:'flow',name:'Flow',description:'Increase Mana and Mana regeneration by 8%.',requires:'haste',mana:.08},
 {id:'mastery',name:'Mastery',description:'Increase attack speed by 8%.',requires:'flow',speed:.08},
 ...Array.from({length:15},(_,i)=>{const roots=['might','vitality','haste'],types=['attack','health','speed'],names=['Force','Resilience','Swiftness'],branch=i%3,step=Math.floor(i/3);return {id:'minor_'+types[branch]+'_'+(step+1),name:names[branch],description:'Increase '+(branch===0?'Attack and Spell Power by 2%.':branch===1?'maximum Health by 3%.':'attack speed by 2%.'),requires:step?'minor_'+types[branch]+'_'+step:roots[branch],...(branch===0?{attack:.02,spell:.02}:branch===1?{health:.03}:{speed:.02})};})
].map(Object.freeze));
const FORKS=Object.freeze([
 {id:'fork_cleave_str_1',name:'Strength',family:'blood',attribute:'str',requires:'passive_bleeding_edge',forkAnchor:'passive_bleeding_edge',forkStep:1,description:'+1 Strength.'},
 {id:'fork_cleave_str_2',name:'Strength',family:'blood',attribute:'str',requires:'fork_cleave_str_1',forkAnchor:'passive_bleeding_edge',forkStep:2,description:'+1 Strength.'},
 {id:'cleave_mastery',name:'Sweeping Force',family:'blood',requires:'fork_cleave_str_2',forkAnchor:'passive_bleeding_edge',forkStep:3,description:'Two-Handed cleave deals 60% instead of 40% damage to secondary targets.'},
 {id:'fork_storm_int_1',name:'Intellect',family:'magic',attribute:'int',requires:'passive_arcane_focus',forkAnchor:'passive_arcane_focus',forkStep:1,description:'+1 Intellect.'},
 {id:'fork_storm_int_2',name:'Intellect',family:'magic',attribute:'int',requires:'fork_storm_int_1',forkAnchor:'passive_arcane_focus',forkStep:2,description:'+1 Intellect.'},
 {id:'storm_mastery',excludes:['lightning_focus'],name:'Storm Conductor',family:'magic',requires:'fork_storm_int_2',forkAnchor:'passive_arcane_focus',forkStep:3,description:'With Overcharge, Chain Lightning bounces up to six times (68%, 53%, 40%, 29%, 21%, 15%). Later chains detonate prior Static Marks.'},
 {id:'fork_fire_int_1',name:'Intellect',family:'magic',attribute:'int',requires:'passive_kindling',forkAnchor:'passive_kindling',forkStep:1,description:'+1 Intellect.'},
 {id:'fork_fire_int_2',name:'Intellect',family:'magic',attribute:'int',requires:'fork_fire_int_1',forkAnchor:'passive_kindling',forkStep:2,description:'+1 Intellect.'},
 {id:'fire_spread',excludes:['fire_focus'],name:'Wildfire',family:'magic',requires:'fork_fire_int_2',forkAnchor:'passive_kindling',forkStep:3,description:'Funded Fire casts spread Burn to up to two enemies at 65% damage for up to three seconds, with a small immediate splash.'},
 {id:'fork_frost_int_1',name:'Intellect',family:'magic',attribute:'int',requires:'passive_deep_winter',forkAnchor:'passive_deep_winter',forkStep:1,description:'+1 Intellect.'},
 {id:'fork_frost_int_2',name:'Intellect',family:'magic',attribute:'int',requires:'fork_frost_int_1',forkAnchor:'passive_deep_winter',forkStep:2,description:'+1 Intellect.'},
 {id:'frost_spread',excludes:['frost_focus'],name:'Winter Field',family:'magic',requires:'fork_frost_int_2',forkAnchor:'passive_deep_winter',forkStep:3,description:'Funded Frost casts Chill up to two additional enemies for two seconds.'},
 {id:'fork_plague_agi_1',name:'Agility',family:'decay',attribute:'agi',requires:'passive_toxic_touch',forkAnchor:'passive_toxic_touch',forkStep:1,description:'+1 Agility.'},
 {id:'fork_plague_agi_2',name:'Agility',family:'decay',attribute:'agi',requires:'fork_plague_agi_1',forkAnchor:'passive_toxic_touch',forkStep:2,description:'+1 Agility.'},
 {id:'plague_spread',excludes:['rot_focus'],name:'Contagion',family:'decay',requires:'fork_plague_agi_2',forkAnchor:'passive_toxic_touch',forkStep:3,description:'On kill, spread one active Bleed and Rot at 50% strength to up to two enemies. Active recipients take five transferred ticks instantly; effects cannot spread again.'},
 {id:'fork_bow_agi_1',name:'Agility',family:'fury',attribute:'agi',requires:'passive_precision',forkAnchor:'passive_precision',forkStep:1,description:'+1 Agility.'},
 {id:'fork_bow_agi_2',name:'Agility',family:'fury',attribute:'agi',requires:'fork_bow_agi_1',forkAnchor:'passive_precision',forkStep:2,description:'+1 Agility.'},
 {id:'bow_pierce',name:'Deep Pierce',family:'fury',requires:'fork_bow_agi_2',forkAnchor:'passive_precision',forkStep:3,description:'Bow pierces up to three additional foes for 60%, 42% and 28% damage instead of two foes for 42% and 24%.'},
 {id:'fork_dagger_agi_1',name:'Agility',family:'fury',attribute:'agi',requires:'passive_double_strike',forkAnchor:'passive_double_strike',forkStep:1,description:'+1 Agility.'},
 {id:'fork_dagger_agi_2',name:'Agility',family:'fury',attribute:'agi',requires:'fork_dagger_agi_1',forkAnchor:'passive_double_strike',forkStep:2,description:'+1 Agility.'},
 {id:'fan_of_blades',name:'Fan of Blades',family:'fury',requires:'fork_dagger_agi_2',forkAnchor:'passive_double_strike',forkStep:3,forkSide:1,description:'Daggers strike up to two additional enemies for 22% damage each.'},
 {id:'fork_sword_end_1',name:'Endurance',family:'aegis',attribute:'end',requires:'passive_iron_skin',forkAnchor:'passive_iron_skin',forkStep:1,description:'+1 Endurance.'},
 {id:'fork_sword_end_2',name:'Endurance',family:'aegis',attribute:'end',requires:'fork_sword_end_1',forkAnchor:'passive_iron_skin',forkStep:2,description:'+1 Endurance.'},
 {id:'sword_sweep',name:'Shielded Sweep',family:'aegis',requires:'fork_sword_end_2',forkAnchor:'passive_iron_skin',forkStep:3,description:'Sword and Shield attacks hit one additional enemy for 25% damage.'},
 {id:'fork_mace_end_1',name:'Endurance',family:'aegis',attribute:'end',requires:'passive_barrier_pulse',forkAnchor:'passive_barrier_pulse',forkStep:1,description:'+1 Endurance.'},
 {id:'fork_mace_end_2',name:'Endurance',family:'aegis',attribute:'end',requires:'fork_mace_end_1',forkAnchor:'passive_barrier_pulse',forkStep:2,description:'+1 Endurance.'},
 {id:'mace_shockwave',name:'Concussive Swing',family:'aegis',requires:'fork_mace_end_2',forkAnchor:'passive_barrier_pulse',forkStep:3,description:'Mace attacks deal 30% damage to one additional enemy and slow its attacks for one second.'},
 {id:'fork_focus_agi_1',name:'Agility',family:'fury',attribute:'agi',requires:'passive_quick_hands',forkAnchor:'passive_quick_hands',forkStep:1,description:'+1 Agility.'},
 {id:'fork_focus_agi_2',name:'Agility',family:'fury',attribute:'agi',requires:'fork_focus_agi_1',forkAnchor:'passive_quick_hands',forkStep:2,description:'+1 Agility.'},
 {id:'single_target_mastery',excludes:['fury_momentum'],name:'Focused Assault',family:'fury',requires:'fork_focus_agi_2',forkAnchor:'passive_quick_hands',forkStep:3,description:'Deal 15% more direct damage when one enemy remains and no reinforcements are waiting.'}
,{"id":"blood_focus","name":"Hemorrhage","family":"blood","requires":"passive_deep_cuts","forkAnchor":"passive_deep_cuts","forkStep":3,"forkSide":-1,"excludes":["blood_transfer"],"description":"Bleed deals 25% more damage; direct attacks deal 10% less."},
{"id":"blood_transfer","name":"Bloodshed","family":"blood","requires":"passive_deep_cuts","forkAnchor":"passive_deep_cuts","forkStep":3,"forkSide":1,"excludes":["blood_focus"],"description":"On death, transfer one Bleed at 50% strength to one living enemy or waiting reinforcement. Active recipients take three transferred ticks instantly. Transferred Bleeds cannot transfer again."},
{"id":"rot_focus","name":"Concentrated Corruption","family":"decay","requires":"passive_toxic_touch","forkAnchor":"passive_toxic_touch","forkStep":3,"forkSide":-1,"excludes":["plague_spread"],"description":"Rot stacks deal 60% more damage but are limited to three stacks."},
{"id":"vitality_recovery","name":"Recovery","family":"vitality","requires":"passive_strong_heart","forkAnchor":"passive_strong_heart","forkStep":4,"forkSide":-1,"excludes":["vitality_reserve"],"description":"Regeneration heals 25% more; maximum Health is reduced by 10%."},
{"id":"vitality_reserve","name":"Endurance","family":"vitality","requires":"passive_strong_heart","forkAnchor":"passive_strong_heart","forkStep":3,"forkSide":1,"excludes":["vitality_recovery"],"description":"Gain 20% maximum Health; regeneration heals 25% less."},
{"id":"aegis_bulwark","name":"Bulwark","family":"aegis","requires":"passive_fortified","forkAnchor":"passive_fortified","forkStep":4,"forkSide":-1,"excludes":["aegis_reprisal"],"description":"Gain 18% Defense; direct attacks deal 10% less damage."},
{"id":"aegis_reprisal","name":"Reprisal","family":"aegis","requires":"passive_fortified","forkAnchor":"passive_fortified","forkStep":3,"forkSide":1,"excludes":["aegis_bulwark"],"description":"Blocking empowers your next hit by 25% base damage (3s cooldown); gain 10% less Defense."},
{"id":"fury_momentum","name":"Momentum","family":"fury","requires":"passive_quick_hands","forkAnchor":"passive_quick_hands","forkStep":4,"forkSide":-1,"excludes":["single_target_mastery"],"description":"Kills grant 15% attack speed for four seconds; cannot combine with Focused Assault."},
{"id":"fire_focus","name":"Smoldering Heart","family":"magic","requires":"passive_kindling","forkAnchor":"passive_kindling","forkStep":3,"forkSide":-1,"excludes":["fire_spread"],"description":"Burn deals 35% more damage; direct spells deal 10% less. Cannot combine with Wildfire."},
{"id":"frost_focus","name":"Biting Cold","family":"magic","requires":"passive_deep_winter","forkAnchor":"passive_deep_winter","forkStep":3,"forkSide":-1,"excludes":["frost_spread"],"description":"Deal 20% more direct spell damage to your chilled target. Cannot combine with Winter Field."},
{"id":"lightning_focus","name":"Focused Discharge","family":"magic","requires":"passive_arcane_focus","forkAnchor":"passive_arcane_focus","forkStep":3,"forkSide":-1,"excludes":["storm_mastery"],"description":"Lightning direct spells deal 35% more damage but no longer chain."}
].map(Object.freeze));
// Intentional routes: the first rank opens the next ability; optional ranks stay on a side branch.
const ROUTES={blood:[['bleeding_edge','deep_cuts','executioner'],['blood_drinker'],['sanguine_fury']],decay:[['toxic_touch','virulent_rot','blight'],['wasting_curse'],['wither']],vitality:[['strong_heart','life_bloom'],['renewal'],['second_breath','last_stand']],aegis:[['iron_skin','fortified'],['guarded_block','retaliation'],['barrier_pulse']],fury:[['quick_hands','adrenaline'],['precision','brutal_crit'],['double_strike']],magic:[['arcane_focus','arcane_echo'],['mana_spring','elemental_force'],['efficient_cast']]};
const CHOICES=[['deep_cuts','str','blood_style','blood_focus','blood_transfer'],['toxic_touch','agi','plague','rot_focus','plague_spread'],['strong_heart','end','vitality_style','vitality_recovery','vitality_reserve'],['fortified','end','aegis_style','aegis_bulwark','aegis_reprisal'],['quick_hands','agi','focus','single_target_mastery','fury_momentum'],['kindling','int','fire','fire_focus','fire_spread'],['deep_winter','int','frost','frost_focus','frost_spread'],['overcharge','int','storm','lightning_focus','storm_mastery']];
const ATTRIBUTES=Object.freeze(['str','agi','int','end','cha']);
const OLD_ROOTS={blood:'might',decay:'might',vitality:'vitality',aegis:'vitality',fury:'haste',magic:'haste'};
const POINT_XP=100,MAX_POINTS=100,ROOTS={blood:'might',decay:'haste',vitality:'vitality',aegis:'vitality',fury:'haste',magic:'haste'};
const AFFINITY_BONUSES={blood:{description:'Your attacks can inflict Bleed: 42% chance, dealing 16% of hit damage per tick (0.9s cooldown).'},decay:{description:'Your attacks can inflict Rot: 42% chance, dealing 6.5% of hit damage per tick (1.3s cooldown).'},vitality:{health:.10,description:'Regenerate 0.15% maximum Health each combat second; basic regeneration is capped at 0.35% Max HP/s before Recovery/Reserve modifiers.'},aegis:{description:'Gain Barrier equal to 5% Max HP + 8% Spell Power at each encounter start. Barrier cap: 30% Max HP + 25% Spell Power.'},fury:{speed:.08,description:'Increase attack speed by 8%.'},magic:{spell:.08,description:'Increase Spell Power by 8% and unlock Arcane Infusion for 12 Mana (two charges). All elemental paths retain this enchantment.'}};
const STATS={blood:'str',decay:'agi',vitality:'end',aegis:'end',fury:'agi',magic:'int'},LABELS={str:'Strength',agi:'Agility',end:'Endurance',int:'Intellect'};
const junctionSkills={blood:'bleeding_edge',decay:'toxic_touch',vitality:'renewal',aegis:'barrier_pulse',fury:'quick_hands',magic:'arcane_focus'};
const outerSkills=[
 ['blood','open_wound','🩸','Open Wound','First direct hit against a full-health enemy applies Bleed.',1,'bleeding_edge'],
 ['blood','blood_price','🫀','Blood Price','Consume a third Bleed stack to heal 5% Health. Cooldown 6s.',1,'blood_drinker'],
 ['fury','relentless','🎯','Relentless Aim','Every fourth attack on the same target deals +10% damage per rank.',5,'quick_hands'],
 ['fury','follow_through','🏃','Follow Through','Carry a prepared fourth strike when its target dies.',1,'relentless'],
 ['aegis','brace','🔰','Brace','Reduce incoming elite and boss strikes by 4% per rank.',5,'iron_skin'],
 ['aegis','stored_impact','🔨','Stored Impact','Return half the damage absorbed by a broken barrier on your next attack.',1,'barrier_pulse'],
 ['vitality','second_pulse','💚','Second Pulse','Crossing below half Health heals 1% per rank each second for 3s, once per room.',5,'renewal'],
 ['vitality','deep_reserves','🌱','Deep Reserves','Store the first full-health heal each room, up to 8% Health.',1,'second_breath'],
 ['magic','spell_echo','✨','Spell Echo','Every third funded cast or Arcane Infusion hit echoes for 10% damage per rank.',5,'arcane_focus'],
 ['magic','last_spark','💠','Last Spark','The first cast each room that empties Mana always critically strikes.',1,'mana_spring'],
 ['decay','incubation','🦠','Incubation','Every third consecutive Rot tick deals 12% more damage per rank.',5,'toxic_touch'],
 ['decay','spore_mark','🪰','Spore Mark','Changing targets from Rot to a healthy enemy copies one Rot stack on hit. Cooldown 5s.',1,'wasting_curse']
];
const outerPairs=[
 ['red_guillotine','🪓','Red Guillotine','relentless','open_wound','Prepared: every fourth strike consumes up to three Bleeds for their remaining damage. A kill spreads one stack.'],
 ['turn_tide','⚔️','Turn the Tide','relentless','brace','Defending an elite or boss strike primes a riposte for 3s.'],
 ['last_bastion','🏰','Last Bastion','stored_impact','second_pulse','Prepared: once per expedition, survive lethal damage and gain Barrier for 4s. Recover half its absorbed damage.'],
 ['lifeweaver','🌙','Lifeweaver','deep_reserves','spell_echo','Overhealing charges a funded cast: +30% damage or restore 8% Health below half.'],
 ['grave_bloom','🕳️','Grave Bloom','spell_echo','incubation','Prepared: every third funded cast or Arcane Infusion hit seeds Rot if missing, then spreads Rot with an immediate burst to two enemies; against one foe, deals one Rot tick.'],
 ['septic_wound','🦂',"Reaper's Cadence",'incubation','open_wound','Prepared: attacks against enemies with Bleed and Rot deal damage equal to one tick of the strongest stack of each, capped at 4% enemy maximum Health (6s cooldown). Neither stack is consumed.']
];
function outerNodes(){
 const result=[];
 for(const [family,id,icon,name,description,max,base] of outerSkills){
  for(let rank=1;rank<=max;rank++)result.push({id:rank===1?id:id+'_rank'+rank,skillKey:id,family,rank,maxRank:max,icon,name,description,requires:rank>1?(rank===2?id:id+'_rank'+(rank-1)):base==='relentless'?base:'passive_'+base});
 }
 for(const [id,icon,name,left,right,description] of outerPairs){
  const prerequisites=[];
  for(const skill of [left,right]){
   const family=outerSkills.find(row=>row[1]===skill)[0];let parent=skill;
   for(let step=1;step<=2;step++){
    const key=id+'_'+skill+'_'+step;
    result.push({id:key,family,outerLink:id,side:skill,step,attribute:STATS[family],pathStep:step,requires:parent});parent=key;
   }
   prerequisites.push(parent);
  }
  result.push({id,advanced:true,icon,name,description,left,right,prerequisites});
 }
 return result;
}
const NEW_SPECIALISATIONS=[
 ['blood','blood_harvest','🩸','Blood Harvest','Bleeding kills restore 3% maximum Health.','passive_blood_drinker'],
 ['blood','crimson_feast','🫀','Crimson Feast','Every third hit against a bleeding enemy deals 45% bonus damage.','blood_harvest'],
 ['blood','heart_of_carnage','🩸','Heart of Carnage','Below half Health, hit a bleeding enemy for 40% bonus damage, or 60% if the enemy is below half Health (3s cooldown).','crimson_feast'],
 ['fury','battle_tempo','⚔️','Battle Tempo','Consecutive attacks build attack speed, up to 15%.','passive_quick_hands'],
 ['fury','relentless_assault','🗡️','Relentless Assault','Attacks against Sundered enemies deal 20% bonus damage every 3 seconds.','battle_tempo'],
 ['fury','unchained_fury','🔥','Unchained Fury','Every fifth consecutive attack opens a 3-second window in which attacks deal 25% bonus damage.','relentless_assault'],
 ['vitality','living_recovery','💚','Living Recovery','Below half Health, restore 0.5% maximum Health each second.','passive_renewal'],
 ['vitality','overflowing_life','🌿','Overflowing Life','Effective healing grants Barrier equal to 15% of Health restored, up to 10% maximum Health.','living_recovery'],
 ['vitality','heart_of_the_wild','🌳','Heart of the Wild','Below 30% Health, restore 12% maximum Health once per encounter.','overflowing_life'],
 ['decay','lingering_rot','☠️','Lingering Rot','New Rot effects last one additional second.','passive_toxic_touch'],
 ['decay','corruption_cycle','🦠','Corruption Cycle','Attacks against three Rot stacks consume one stack and deal its remaining damage, every 5 seconds.','lingering_rot'],
 ['decay','plagueheart','🕷️','Plagueheart','Every third Rot tick deals 35% additional damage.','corruption_cycle'],
 ['magic','kindling_flame','🔥','Kindling Flame','Fire casts add Burn damage equal to 8% Spell Power.','passive_kindling'],
 ['magic','combustion','💥','Combustion','Fire casts against burning enemies deal 20% Spell Power bonus damage every 4 seconds.','kindling_flame'],
 ['magic','living_inferno','☄️','Living Inferno','Fire casts deal 25% more damage against burning enemies.','combustion'],
 ['magic','deep_chill','❄️','Deep Chill','Frost casts extend Chill by 0.5 seconds, subject to boss limits.','passive_deep_winter'],
 ['magic','shatter','💠','Shatter','Frost casts against chilled foes deal 25% Spell Power bonus damage every 4 seconds.','deep_chill'],
 ['magic','absolute_winter','🌨️','Absolute Winter','Frost casts deal 20% more damage against chilled enemies.','shatter'],
 ['magic','static_charge','⚡','Static Charge','Lightning casts deal 10% Spell Power bonus damage.','passive_overcharge'],
 ['magic','chain_discharge','🔗','Chain Discharge','Every fourth Lightning cast deals 35% Spell Power bonus damage.','static_charge'],
 ['magic','storm_conductor','🌩️','Storm Conductor','Lightning casts deal 20% more damage.','chain_discharge']
].map(([family,id,icon,name,description,requires],index)=>({family,id,icon,name,description,requires,specialisationTier:1+index%3,elementSpecialisation:family==='magic'?['fire','frost','lightning'][Math.floor((index-12)/3)]:null}));
let cachedCatalog=null,cachedNodes=CORE;
function nodes(){
 const catalogue=root.WandererV012Buildcraft?.CATALOG;if(!catalogue)return CORE;
 if(catalogue!==cachedCatalog){cachedCatalog=catalogue;const branches=[];
 for(const family of Object.keys(ROOTS)){
  const affinity='affinity_'+family,lanes=[affinity,affinity,affinity],oldLanes=[ROOTS[family],ROOTS[family],ROOTS[family]];let previous=ROOTS[family],index=0,normalIndex=0;
  branches.push(Object.freeze({id:affinity,family,affinity:family,name:'Choose '+family[0].toUpperCase()+family.slice(1),...AFFINITY_BONUSES[family],requires:family==='magic'?'insight':ROOTS[family]}));
  if(family==='magic')for(const element of ['fire','frost','lightning'])branches.push(Object.freeze({id:'element_'+element,family,elementBranch:element,name:element[0].toUpperCase()+element.slice(1)+' Path',description:'Unlock '+element+' talents. Select your active element above.',requires:affinity}));
  for(const p of catalogue.filter(x=>x.family===family)){
   const base='passive_'+p.id,other=(p.requires||[]).find(f=>f!==family),hybrid=!!other,oldLane=index%3,lane=normalIndex%3,oldBranch=oldLanes[oldLane],oldPrevious=previous;
   const branchLane=p.element?['fire','frost','lightning'].indexOf(p.element):ROUTES[family].findIndex(route=>route.includes(p.id)),branchDepth=p.element?2:ROUTES[family][branchLane]?.indexOf(p.id)||0,route=ROUTES[family][branchLane],oldParent=hybrid?affinity:p.element?'element_'+p.element:lanes[lane];
   const adjacentPairs=['blood:fury','aegis:fury','aegis:vitality','magic:vitality','decay:magic','blood:decay'],alternate=hybrid&&adjacentPairs.includes([...p.requires].sort().join(':'));
   let parent=hybrid?'passive_'+junctionSkills[family]:p.element?'element_'+p.element:branchDepth?'passive_'+route[branchDepth-1]:affinity;
   for(let i=1;i<=2;i++){const id='path_'+p.id+'_'+i,stat=STATS[family];if(hybrid&&alternate&&i===1){let prior='affinity_'+family;for(let step=1;step<=3;step++){const alt='alternate_'+p.id+'_'+family+'_'+step;branches.push(Object.freeze({id:alt,family,hybridFor:p.id,alternateFor:p.id,alternateStep:step,attribute:stat,requires:prior}));prior=alt;}}branches.push(Object.freeze({id,family,pathFor:p.id,pathStep:i,pathLane:lane,branchLane,branchDepth,...(hybrid?{hybridFor:p.id}:{}),name:LABELS[stat],description:'+1 '+LABELS[stat]+'.',attribute:stat,requires:parent,...(hybrid&&alternate&&i===1?{anyRequires:[parent,'alternate_'+p.id+'_'+family+'_3']}:{}),...(i===1?{legacyRequires:oldPrevious,legacyBranchRequires:oldBranch,legacyV5Requires:oldParent,legacyV4Requires:hybrid?affinity:lanes[lane]}:{})}));parent=id;}
   let bridge=null;if(hybrid){bridge='passive_'+junctionSkills[other];for(let i=1;i<=2;i++){const id='bridge_'+p.id+'_'+i,stat=STATS[other];if(alternate&&i===1){let prior='affinity_'+other;for(let step=1;step<=3;step++){const alt='alternate_'+p.id+'_'+other+'_'+step;branches.push(Object.freeze({id:alt,family:other,hybridFor:p.id,alternateFor:p.id,alternateStep:step,attribute:stat,requires:prior}));prior=alt;}}branches.push(Object.freeze({id,family:other,hybridFor:p.id,bridgeStep:i,name:LABELS[stat],description:'+1 '+LABELS[stat]+'.',attribute:stat,requires:bridge,...(alternate&&i===1?{anyRequires:[bridge,'alternate_'+p.id+'_'+other+'_3']}:{} )}));bridge=id;}}
   const starterUpgrade=['bleeding_edge','toxic_touch'].includes(p.id),ranks=starterUpgrade?p.max-1:p.max;
   for(let i=0;i<ranks;i++){const rank=i+1,id=rank===1?base:base+'_rank'+rank,required=rank===1?[parent,...(bridge?[bridge]:[])]:[rank===2?base:base+'_rank'+(rank-1)];branches.push(Object.freeze({id,passiveId:p.id,rank,maxRank:ranks,family,branchLane,branchDepth,...(hybrid?{hybridFor:p.id,hybridOther:other}:{}),name:starterUpgrade?'Improve '+p.name:p.name,description:starterUpgrade?'Improve the application chance granted by your affinity by 4 percentage points per rank.':p.description,prerequisites:required}));}
   previous=base;oldLanes[oldLane]=base;index++;if(!hybrid){lanes[lane]=base;normalIndex++;}
  }
 }
 const forks=FORKS.map(node=>({...node}));
 for(const [anchor,stat,prefix,first,second]of CHOICES){
  const a='passive_'+anchor,family=catalogue.find(p=>p.id===anchor).family;
  for(let step=1;step<=2;step++){
   const id='fork_'+prefix+'_'+stat+'_'+step,requires=step===1?a:'fork_'+prefix+'_'+stat+'_1';let n=forks.find(n=>n.id===id);
   if(n){n.legacyRequires=n.requires;n.requires=requires;n.forkAnchor=a;}else forks.push({id,name:LABELS[stat],description:'+1 '+LABELS[stat]+'.',attribute:stat,family,requires,forkAnchor:a,forkStep:step});
  }
  for(const [id,side]of [[first,-1],[second,1]]){const n=forks.find(n=>n.id===id);n.legacyRequires=n.requires;n.requires='fork_'+prefix+'_'+stat+'_2';n.forkAnchor=a;n.forkStep=3;n.forkSide=side;}
 }
 cachedNodes=Object.freeze([...CORE,...branches,...forks,...outerNodes(),...NEW_SPECIALISATIONS,{id:'steadfast_guard',family:'aegis',name:'Steadfast Guard',icon:'🛡️',description:'While you have Barrier, gain 15 percentage points of Block chance (maximum 65%), even without a shield. A block prevents part of the hit before Barrier absorbs the remainder. Each block also grants 3% damage reduction for 5 seconds, up to 3 stacks.',requires:'passive_guarded_block',specialisationTier:1},{id:'stored_force',family:'aegis',name:'Stored Force',icon:'🔨',description:'Store 30% of damage blocked or absorbed by Barrier. At 25% maximum Health stored, release the stored damage against all enemies immediately.',requires:'steadfast_guard',specialisationTier:2},{id:'unbreakable',family:'aegis',name:'Unbreakable',icon:'🏰',description:'Once per Expedition, survive a fatal hit with 1 Health and gain a Barrier equal to 20% of maximum Health. Attack speed is reduced by 20% for 5 seconds.',requires:'stored_force',specialisationTier:3},{id:"soul_sip",family:"magic",junction:"hex_bolt",requires:"passive_hex_bolt",name:"Soul Sip",icon:"🌀",description:"A funded cast against Rot restores 3 Mana, once every 5 seconds."},{id:"living_ward",family:"aegis",junction:"sanctuary",requires:"passive_sanctuary",name:"Living Ward",icon:"🌿",description:"Below half Health, attacking grants 5% maximum Health as Barrier, once every 8 seconds."}].map(node=>{
  
  if(!node.attribute)return Object.freeze(node);
  const step=node.pathStep||node.bridgeStep||node.forkStep||1;
  const options={str:[['flatAttack',2,'Attack Power'],['flatArmor',2,'Armor']],end:[['flatArmor',2,'Armor'],['flatLife',5,'Health']],agi:[['flatAttack',2,'Attack Power'],['flatAvoid',2,'Evasion rating']],int:[['flatSpell',2,'Spell Power'],['flatRegen',.25,'Mana per second']],cha:[['flatLife',5,'Health'],['flatAttack',2,'Attack Power']]};
  const [key,value,label]=(options[node.attribute]||options.str)[(step-1)%2];
  return Object.freeze({...node,attribute:null,[key]:value,name:label,description:'+'+value+' '+label+'.'});
 }));}return cachedNodes;
}
root.WandererTalentCatalog=Object.freeze({ATTRIBUTES,get NODES(){return nodes();}});
})(globalThis);
